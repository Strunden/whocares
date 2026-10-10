import test from 'node:test';
import assert from 'node:assert/strict';
import {PgConn} from './pg-wire.js';

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
