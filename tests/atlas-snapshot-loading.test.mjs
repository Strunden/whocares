import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {loadAtlas} from '../site/js/atlas-loader.js';

test('private loopback service is allowed; remote HTTP remains rejected',async()=>{
 let calls=0;
 const fetcher=async url=>{calls++;assert.equal(url,'http://127.0.0.1:8788/api/discovery');return {ok:false};};
 await assert.rejects(loadAtlas(fetcher,'http://127.0.0.1:8788'),/unavailable/);
 for(const url of ['http://example.org','http://127.0.0.1.evil:8788','http://127.0.0.1:8788@evil'])await assert.rejects(loadAtlas(fetcher,url),/not configured/);
 assert.equal(calls,1);
});
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
  const ctx=vm.createContext({window:{WHOCARES_CONFIG:{API_BASE:'https://example.org'}},document:{documentElement:{dataset:{}},addEventListener(){}},setInterval(){},fetch(){},refreshResearch(){},graphRecords,stressCount:0,
   loadAtlas:async()=>{if(fail)throw new Error('offline');return {entries:response.catalog.entries,graph,media:[],revision:response.revision};},setProductMedia:rows=>media=rows,
   $:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);},console:{error(){}}});
  const result=await vm.runInContext(`(async()=>{let entries=[],graphData=null,graphEntries=[],byId=new Map();let routed=false;const applyRoute=()=>routed=true;${startup}\nreturn {ids:[...byId.keys()],routed};})()`,ctx);
  assert.equal(result.routed,!fail);
  if(fail){assert.match(elements.get('loading').textContent,/unavailable/);assert.equal(media,null);assert.equal(result.ids.length,0);}
  else{assert.ok(result.ids.includes('new-company'));assert.equal(ctx.document.documentElement.dataset.researchRevision,response.revision);assert.deepEqual(media,[]);}
 }
});

import {navigationRoots} from '../site/js/atlas-needs.js';
import {buildHierarchy} from '../site/js/atlas-layout.js';
const refreshSource=source.slice(source.indexOf('let refreshInFlight=false;'),source.lastIndexOf('\ntry{'));
const refreshGraph=(extra=false)=>{
 const node=(id,role)=>({id,kind:role==='need'?'problem_space':'problem',title:id,statement:'Synthetic fixture.',scope:{navigation:{role,title:id,short_title:id,summary:'Synthetic fixture.'}},epistemic_status:'hypothesis',confidence:{basis:'not_assessed'},provenance:{fixture:true}});
 return {objects:[node('need','need'),node('situation','situation'),...(extra?[node('new-situation','situation')]:[])],relationships:['situation',...(extra?['new-situation']:[])].map(id=>({id:'edge-'+id,from_id:id,to_id:'need',relation:'context_for',provenance:{navigation:true}})),sources:[],evidence_links:[]};
};
function refreshHarness(){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{dataset:{},scrollTop:17});return elements.get(id);};
 const calls={render:0,panel:0,hash:0,install:0};let reply={entries:[],graph:refreshGraph(),media:[],revision:'one'},failure=false,release=null;
 const ctx=vm.createContext({document:{hidden:false,documentElement:{dataset:{researchRevision:'one'}}},window:{WHOCARES_CONFIG:{}},fetch(){},graphRecords,navigationRoots,buildHierarchy,setProductMedia(){},$:get,console:{error(){}},
  loadAtlas:async()=>{if(release)await release;if(failure)throw Error('offline');return reply;},calls});
 vm.runInContext(`let entries=[],graphData=null,graphEntries=graphRecords(${JSON.stringify(refreshGraph())},[]),byId=new Map(graphEntries.map(e=>[e.id,e]));let tree=buildHierarchy([],[],{extraRoots:navigationRoots(graphEntries)}),activeGroup='need',persona=null,mobile=false,ready=true,selectedId='situation',panelState={type:'entry',id:'situation'};let camera={s:1.7,x:-90,y:44};let navigationFrame=0,wheelState=null,touchState=null,cameraReturnFrame=0,panPending=false;const pointers=new Map();function installLevel(p,g,t){tree=t;activeGroup=g;calls.install++;}function render(){calls.render++;}function renderPanel(){calls.panel++;}function setHash(){calls.hash++;}function closePanel(){panelState=null;}function applyRoute(){};${refreshSource}`,ctx);
 return {ctx,get,calls,setReply:value=>reply=value,setFailure:value=>failure=value,setWait:value=>release=value,run:()=>vm.runInContext('refreshResearch()',ctx),state:()=>JSON.parse(vm.runInContext('JSON.stringify({camera,activeGroup,selectedId,panelState,ids:[...tree.all.keys()],revision:document.documentElement.dataset.researchRevision})',ctx))};
}
test('live refresh installs newly mapped records while preserving camera, level and inspector',async()=>{
 const h=refreshHarness(),before=h.state();
 await h.run();assert.deepEqual(h.state(),before);assert.equal(h.calls.install,0);
 h.setReply({entries:[],graph:refreshGraph(true),media:[],revision:'two'});await h.run();
 assert.ok(h.state().ids.includes('need/new-situation'));assert.deepEqual(h.state().camera,before.camera);assert.equal(h.state().activeGroup,'need');assert.deepEqual(h.state().panelState,before.panelState);assert.equal(h.get('panel-content').scrollTop,17);assert.equal(h.calls.panel,1);assert.equal(h.state().revision,'two');
});
test('refresh failure retains usable map, signals stale data and recovers; malformed hierarchy cannot replace snapshot',async()=>{
 const h=refreshHarness(),before=h.state();h.setFailure(true);await h.run();assert.deepEqual(h.state(),before);assert.equal(h.get('research-status').hidden,false);assert.equal(h.ctx.document.documentElement.dataset.researchState,'stale');
 h.setFailure(false);h.setReply({entries:[],graph:{objects:[],relationships:[],sources:[],evidence_links:[]},media:[],revision:'bad'});await h.run();assert.deepEqual(h.state(),before);
 h.setReply({entries:[],graph:refreshGraph(true),media:[],revision:'two'});await h.run();assert.equal(h.state().revision,'two');assert.equal(h.get('research-status').hidden,true);assert.equal(h.ctx.document.documentElement.dataset.researchState,'current');
});
test('refresh defers during interaction or hidden tabs and guards concurrent requests',async()=>{
 const h=refreshHarness();h.setReply({entries:[],graph:refreshGraph(true),media:[],revision:'two'});
 h.ctx.document.hidden=true;await h.run();assert.equal(h.state().revision,'one');h.ctx.document.hidden=false;
 vm.runInContext('pointers.set(1,{})',h.ctx);await h.run();assert.equal(h.state().revision,'one');vm.runInContext('pointers.clear()',h.ctx);
 let resolve;h.setWait(new Promise(r=>resolve=r));const pending=h.run();await h.run();assert.equal(h.calls.install,0);
 vm.runInContext('wheelState={mode:"pan"}',h.ctx);resolve();await pending;assert.equal(h.calls.install,0);
 vm.runInContext('wheelState=null',h.ctx);h.setWait(null);await h.run();assert.equal(h.calls.install,1);
});
