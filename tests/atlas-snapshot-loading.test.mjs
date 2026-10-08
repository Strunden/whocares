import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {loadAtlas} from '../site/js/atlas-loader.js';
import {graphRecords} from '../site/js/atlas-records.js';
import {graph} from './fixtures/discovery.mjs';
const response={schema_version:2,revision:'database-revision',catalog:{entries:[{id:'new-company',published:true}]},graph,media:[]};
test('one uncached service request loads catalog, graph and media atomically',async()=>{
 const calls=[];const data=await loadAtlas(async(url,options)=>{calls.push({url,cache:options.cache});return {ok:true,json:async()=>response};},'https://example.org/');
 assert.deepEqual(calls,[{url:'https://example.org/api/discovery',cache:'no-store'}]);
 assert.equal(data.entries[0].id,'new-company');assert.equal(data.graph,graph);assert.equal(data.revision,'database-revision');
});
test('outages and malformed responses fail without reading a saved copy',async()=>{
 for(const reply of [null,{ok:false},{ok:true,json:async()=>({...response,graph:{objects:[]}})},{ok:true,json:async()=>({...response,revision:null})}]){
  let count=0;await assert.rejects(loadAtlas(async()=>{count++;if(!reply)throw new Error('offline');return reply;},'https://example.org'));assert.equal(count,1);
 }
 await assert.rejects(loadAtlas(()=>{throw new Error('must not fetch');},''),/not configured/);
});
const source=await readFile(new URL('../site/js/atlas.js',import.meta.url),'utf8'),startup=source.slice(source.lastIndexOf('\ntry{'));
test('page exposes a coherent revision or an honest unavailable state',async()=>{
 for(const fail of [false,true]){
  const elements=new Map();let media=null;
  const ctx=vm.createContext({window:{WHOCARES_CONFIG:{API_BASE:'https://example.org'}},document:{documentElement:{dataset:{}}},fetch(){},graphRecords,stressCount:0,
   loadAtlas:async()=>{if(fail)throw new Error('offline');return {entries:response.catalog.entries,graph,media:[],revision:response.revision};},setProductMedia:rows=>media=rows,
   $:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);},console:{error(){}}});
  const result=await vm.runInContext(`(async()=>{let entries=[],graphData=null,graphEntries=[],byId=new Map();let routed=false;const applyRoute=()=>routed=true;${startup}\nreturn {ids:[...byId.keys()],routed};})()`,ctx);
  assert.equal(result.routed,!fail);
  if(fail){assert.match(elements.get('loading').textContent,/unavailable/);assert.equal(media,null);assert.equal(result.ids.length,0);}
  else{assert.ok(result.ids.includes('new-company'));assert.equal(ctx.document.documentElement.dataset.researchRevision,response.revision);assert.deepEqual(media,[]);}
 }
});
