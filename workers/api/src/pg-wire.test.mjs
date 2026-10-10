import test from 'node:test';
import assert from 'node:assert/strict';
import {PgConn,connectionStream} from './pg-wire.js';

function connection(chunks) {
  let reads = 0;
  const conn = new PgConn({read: async () => {
    const value = chunks[reads++];
    return value === undefined ? {done: true} : {done: false, value};
  }}, {}, () => {});
  return {conn, reads: () => reads};
}

function message(type, body) {
  const bytes = new Uint8Array(body.length + 5);
  bytes[0] = type.charCodeAt(0);
  new DataView(bytes.buffer).setUint32(1, body.length + 4);
  bytes.set(body, 5);
  return bytes;
}

test('large chunked messages copy each received byte once and preserve the following frame', async () => {
  const body = Uint8Array.from({length: 2 * 1024 * 1024}, (_, i) => i % 251);
  const first = message('D', body);
  const second = message('Z', new Uint8Array([73]));
  const wire = new Uint8Array(first.length + second.length);
  wire.set(first); wire.set(second, first.length);
  const chunks = [];
  for (let offset = 0; offset < wire.length; offset += 3071) chunks.push(wire.subarray(offset, offset + 3071));
  const {conn, reads} = connection(chunks);
  const originalSet = Uint8Array.prototype.set;
  let copiedBytes = 0;
  Uint8Array.prototype.set = function (source, offset) {
    copiedBytes += source.length;
    return originalSet.call(this, source, offset);
  };
  let result, following, retainedChunk;
  try {
    result = await conn.readMessage();
    retainedChunk = conn.buf.buffer === chunks.at(-1).buffer;
    following = await conn.readMessage();
  } finally {
    Uint8Array.prototype.set = originalSet;
  }
  assert.equal(result.type, 'D');
  assert.deepEqual(result.body, body);
  assert.equal(following.type, 'Z');
  assert.deepEqual(following.body, new Uint8Array([73]));
  assert.equal(reads(), chunks.length);
  assert.equal(copiedBytes, wire.length);
  assert.equal(retainedChunk, true, 'unread bytes retain the received chunk');
});

test('buffered and zero-length reads retain unread bytes without reading the socket', async () => {
  const {conn, reads} = connection([]);
  const buffered = new Uint8Array([1, 2, 3, 4]);
  conn.buf = buffered;
  assert.deepEqual(await conn.readExact(0), new Uint8Array());
  const first = await conn.readExact(2);
  first[0] = 99;
  assert.deepEqual(buffered, new Uint8Array([1, 2, 3, 4]));
  assert.equal(conn.buf.buffer === buffered.buffer, true, 'buffered remainder is not copied');
  assert.deepEqual(await conn.readExact(2), new Uint8Array([3, 4]));
  assert.equal(reads(), 0);
});

test('empty chunks are skipped and a truncated message still fails on end of stream', async () => {
  const {conn} = connection([new Uint8Array(), new Uint8Array([1, 2])]);
  await assert.rejects(conn.readExact(3), /database connection closed/);
});

test('invalid frame lengths are rejected before reading', async () => {
  const {conn, reads} = connection([]);
  for (const n of [-1, 1.5, NaN, Infinity]) await assert.rejects(conn.readExact(n), /invalid database message length/);
  assert.equal(reads(), 0);
});

function discoveryWire(fields){
 const names=['metadata','revision','dangling','graph_json','media_json'];
 const encoder=new TextEncoder();
 const descriptions=names.map(name=>{
  const text=encoder.encode(name+'\0'),part=new Uint8Array(text.length+18);part.set(text);return part;
 });
 const description=new Uint8Array(2+descriptions.reduce((n,b)=>n+b.length,0));
 new DataView(description.buffer).setUint16(0,5);let at=2;
 for(const part of descriptions){description.set(part,at);at+=part.length;}
 const values=fields.map(value=>encoder.encode(value));
 const row=new Uint8Array(2+values.reduce((n,b)=>n+4+b.length,0));
 const view=new DataView(row.buffer);view.setUint16(0,5);at=2;
 for(const value of values){view.setInt32(at,value.length);at+=4;row.set(value,at);at+=value.length;}
 return Buffer.concat([message('T',description),message('D',row),message('C',encoder.encode('SELECT 1\0')),message('Z',new Uint8Array([73]))]);
}
test('discovery streams large JSON as original socket views with bounded copying',async()=>{
 const graph=JSON.stringify({objects:[{text:'é'.repeat(5*1024*1024)}]}),media='[{"id":"m"}]';
 const wire=discoveryWire(['{"catalog":[]}','abc','f',graph,media]);
 const chunks=[];for(let at=0;at<wire.length;at+=65536)chunks.push(wire.subarray(at,at+65536));
 const {conn,reads}=connection(chunks);conn.writer={write:async()=>{}};
 const original=Uint8Array.prototype.set;let copied=0;
 let header,parts=[];
 try{
  Uint8Array.prototype.set=function(source,...args){copied+=source.length;return original.call(this,source,...args);};
  header=await conn.streamDiscovery('SELECT fixture');
  assert.equal(reads(),1,'large fields are not buffered before metadata returns');
  for await(const part of header.fields){assert.equal(part.bytes.buffer,wire.buffer);parts.push(part);}
 }finally{Uint8Array.prototype.set=original;}
 assert.equal(header.metadata,'{"catalog":[]}');assert.equal(header.revision,'abc');assert.equal(header.dangling,'f');
 assert.ok(copied<1000,'only protocol headers and small fields are copied');
 assert.equal(Buffer.concat(parts.filter(p=>p.name==='graph_json').map(p=>p.bytes)).toString(),graph);
 assert.equal(Buffer.concat(parts.filter(p=>p.name==='media_json').map(p=>p.bytes)).toString(),media);
 assert.equal(conn.buf.length,0);
});
test('truncated streamed payload fails rather than completing valid JSON',async()=>{
 const wire=discoveryWire(['{}','abc','f','{"large":"payload"}','[]']);
 const {conn}=connection([wire.subarray(0,wire.length-20)]);conn.writer={write:async()=>{}};
 const row=await conn.streamDiscovery('SELECT fixture');
 await assert.rejects(async()=>{for await(const part of row.fields){}},/connection closed/);
});

test('stream connection closes once on completion, cancellation and errors',async()=>{
 for(const mode of ['complete','cancel','error']){
  let closed=0;
  const chunks=(async function*(){yield new Uint8Array([1]);if(mode==='error')throw new Error('late database error');yield new Uint8Array([2]);})();
  const reader=connectionStream({},chunks,async()=>{closed++;}).getReader();
  await reader.read();
  if(mode==='cancel')await reader.cancel();
  else if(mode==='error')await assert.rejects(reader.read(),/late database error/);
  else{await reader.read();assert.equal((await reader.read()).done,true);}
  assert.equal(closed,1);
 }
});
