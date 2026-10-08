import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {graphRecords} from '../site/js/atlas-records.js';

const source=await readFile(new URL('../site/js/atlas.js',import.meta.url),'utf8');
const startup=source.slice(source.lastIndexOf('\ntry{'));

test('page startup revalidates both mutable snapshots and exposes newly published records',async()=>{
 const requests=[],elements=new Map(),errors=[];
 const stale={entries:[],objects:[],relationships:[],sources:[],evidence_links:[]};
 const freshIndex={entries:[{id:'new-company',published:true}]};
 const freshGraph={objects:[{id:'new-reviewed-finding',title:'New reviewed finding',kind:'problem'}],relationships:[],sources:[],evidence_links:[]};
 const ctx=vm.createContext({graphRecords,stressCount:0,
  $:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);},
  console:{warn:(...args)=>errors.push(args),error:(...args)=>errors.push(args)},
  fetch:async(url,options)=>{
   requests.push({url,cache:options?.cache});
   const current=url.endsWith('/index.json')?freshIndex:freshGraph;
   return {ok:true,json:async()=>options?.cache==='no-cache'?current:stale};
  }
 });
 await vm.runInContext(`(async()=>{let entries=[],graphData=null,graphEntries=[],byId=new Map();let routed=false;const applyRoute=()=>{routed=true;};${startup}\nreturn {ids:[...byId.keys()],routed};})()`,ctx).then(result=>{
  assert.deepEqual(Array.from(result.ids),['new-company','new-reviewed-finding']);
  assert.equal(result.routed,true);
 });
 assert.deepEqual(requests,[{url:'data/atlas/index.json',cache:'no-cache'},{url:'data/atlas/graph.json',cache:'no-cache'}]);
 assert.equal(elements.get('loading').hidden,true);
 assert.deepEqual(errors,[]);
});
