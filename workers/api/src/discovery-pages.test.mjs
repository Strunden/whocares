import test from 'node:test';import assert from 'node:assert/strict';
import {discoveryManifest,discoveryPage,discoveryPageParameters} from './discovery-pages.js';
const revision='a'.repeat(32);
test('page parameters are bounded and cannot inject SQL',()=>{
 assert.deepEqual(discoveryPageParameters(new URL('https://test/page?revision='+revision+'&page=7')),{revision,page:7});
 for(const q of ['revision=x&page=0','revision='+revision+'&page=-1','revision='+revision+'&page=2048','revision='+revision+'&page=0%3BDROP'])assert.equal(discoveryPageParameters(new URL('https://test/page?'+q)),null);
});
test('manifest and individual immutable pages use bounded database projections',async()=>{
 const calls=[];assert.deepEqual(await discoveryManifest({simpleQuery:async q=>{calls.push(q);return [{revision,characters:'65537'}];}}),{schema_version:3,revision,pages:2});
 assert.deepEqual(await discoveryPage({simpleQuery:async q=>{calls.push(q);return [{revision,page:'1',pages:'2',payload_piece:'last'}];}},{revision,page:1}),{revision,page:1,pages:2,piece:'last'});
 assert.ok(calls.every(q=>!q.includes('payload_text')&&!q.includes('jsonb_agg')));
 assert.equal(await discoveryPage({simpleQuery:async()=>[]},{revision,page:1}),null);
 await assert.rejects(discoveryManifest({simpleQuery:async()=>[{revision,characters:'999999999999'}]}),/manifest/);
 await assert.rejects(discoveryPage({simpleQuery:async()=>[{revision,page:1,pages:2,payload_piece:'x'.repeat(131073)}]},{revision,page:1}),/page/);
});

test('Unicode codepoint pages allow surrogate pairs without rejecting valid bounded data',async()=>{
 const piece='😀'.repeat(65536);
 const result=await discoveryPage({simpleQuery:async()=>[{revision,page:0,pages:1,payload_piece:piece}]},{revision,page:0});
 assert.equal(result.piece,piece);assert.equal(Buffer.byteLength(piece),262144);
});
