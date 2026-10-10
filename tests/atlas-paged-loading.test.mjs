import test from 'node:test';import assert from 'node:assert/strict';import {loadAtlas} from '../site/js/atlas-loader.js';
const revision='a'.repeat(32);
const payload={catalog:[{id:'c',visible:true,review_id:'r',review_current:true,decision:'retain',document:{id:'c',type:'company',title:'Public company'}}],logos:['c'],funding:[],graph:{objects:[{id:'o',context:'All context'}],relationships:[],sources:[],evidence_links:[]},media:[]};
const text=JSON.stringify(payload),pieces=Array.from({length:5},(_,i)=>text.slice(Math.floor(text.length*i/5),Math.floor(text.length*(i+1)/5)));
const manifest={schema_version:3,revision,pages:pieces.length};
function reply(value,status=200){return {status,ok:status===200,json:async()=>value};}
test('bounded parallel pages publish only a complete coherent snapshot',async()=>{
 let active=0,peak=0;const calls=[];
 const result=await loadAtlas(async url=>{
  calls.push(url);if(url.endsWith('/manifest'))return reply(manifest);
  const page=Number(new URL(url).searchParams.get('page'));active++;peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,page===0?5:1));active--;
  return reply({revision,page,pages:pieces.length,piece:pieces[page]});
 },'https://example.org');
 assert.ok(peak<=4);assert.equal(calls.length,6);assert.equal(result.entries[0].logo,'/api/logo/c');assert.deepEqual(result.graph,payload.graph);
});
test('expired revisions retry once; no mixed revisions are installed',async()=>{
 let manifests=0;
 const result=await loadAtlas(async url=>{
  if(url.endsWith('/manifest')){manifests++;return reply(manifest);}
  const page=Number(new URL(url).searchParams.get('page'));
  if(manifests===1)return reply({},409);
  return reply({revision,page,pages:pieces.length,piece:pieces[page]});
 },'https://example.org');
 assert.equal(manifests,2);assert.equal(result.revision,revision);
 let failed=0;await assert.rejects(loadAtlas(async url=>{if(url.endsWith('/manifest')){failed++;return reply(manifest);}return reply({},409);},'https://example.org'),/snapshot changed/);assert.equal(failed,2);
});
test('malformed, truncated and mismatched pages never produce a partial map',async()=>{
 for(const mutation of [value=>({...value,page:99}),value=>({...value,pages:99}),value=>({...value,piece:'broken'}),value=>({...value,revision:'b'.repeat(32)})]){
  await assert.rejects(loadAtlas(async url=>{
   if(url.endsWith('/manifest'))return reply(manifest);
   const page=Number(new URL(url).searchParams.get('page'));
   return reply(mutation({revision,page,pages:pieces.length,piece:pieces[page]}));
  },'https://example.org'));
 }
});
test('external cancellation aborts page requests and returns no snapshot',async()=>{
 const controller=new AbortController();
 await assert.rejects(loadAtlas(async(url,{signal})=>{
  if(url.endsWith('/manifest'))return reply(manifest);
  controller.abort(new Error('cancelled'));
  signal.throwIfAborted();
 },'https://example.org',{signal:controller.signal}),/cancelled/);
});
