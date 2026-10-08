import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {wheelGesture,centroid,separation,touchIntent} from '../site/js/atlas-gestures.js';
import {clamp} from '../site/js/atlas-camera.js';

// Exercise the actual event wiring without a browser or synthetic UI events.
// Pure recognizer tests cannot detect state being blocked by a handler branch.
const source=await readFile(new URL('../site/js/atlas.js',import.meta.url),'utf8');
const handlers=source.slice(source.indexOf("map.addEventListener('wheel'"),source.indexOf('// Pointer selection'));
function harness(){
 const listeners=new Map(),captures=new Set();let time=0;
 const calls={pan:[],zoom:[],settle:0};
 const map={dataset:{},clientHeight:600,classList:{add(){},remove(){}},addEventListener:(name,fn)=>listeners.set(name,fn),getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
 const ctx=vm.createContext({map,wheelGesture,centroid,separation,touchIntent,clamp,performance:{now:()=>time},setTimeout:()=>1,clearTimeout(){},panMap:(...args)=>calls.pan.push(args),zoomMap:(...args)=>calls.zoom.push(args),stopCameraReturn(){},settleCamera:()=>calls.settle++,activateMapNode(){},document:{elementFromPoint:()=>null}});
 vm.runInContext(`let wheelState=null,wheelTimer,touchTimer,touchState=null,pointerMode=null,dragged=false,gestureStart=null,navigationFrame=0;const pointers=new Map();${handlers}\nvar snapshot=()=>({mode:pointerMode,blocked:touchState?.blocked,size:pointers.size});`,ctx);
 const send=(type,id,x,y,extra={})=>listeners.get(type)({pointerId:id,clientX:x,clientY:y,button:0,target:{closest:()=>null},preventDefault(){},...extra});
 return {calls,snapshot:ctx.snapshot,time:value=>time=value,send};
}
test('actual pointer handlers allow pinch and retain its lock through finger replacement',()=>{
 const h=harness();h.send('pointerdown',1,100,100);h.send('pointerdown',2,200,100);
 assert.equal(h.snapshot().blocked,false);
 h.send('pointermove',1,80,100);h.send('pointermove',2,220,100);
 assert.equal(h.snapshot().mode,'zoom');assert.ok(h.calls.zoom.length>0);assert.equal(h.calls.pan.length,0);
 const count=h.calls.zoom.length;
 h.send('pointerup',2,220,100);h.send('pointerdown',3,240,100);h.send('pointermove',3,300,100);
 assert.equal(h.snapshot().blocked,true);assert.equal(h.calls.zoom.length,count);
 h.send('pointerup',1,80,100);h.send('pointerup',3,300,100);
 assert.equal(h.snapshot().size,0);assert.equal(h.calls.settle,1);
});
test('actual pointer handlers never turn an established drag into pinch',()=>{
 const h=harness();h.send('pointerdown',1,100,100);h.send('pointermove',1,120,100);
 h.send('pointerdown',2,220,100);h.send('pointermove',2,260,100);
 assert.equal(h.snapshot().mode,'pan');assert.equal(h.calls.zoom.length,0);assert.ok(h.calls.pan.length>0);
});
test('actual wheel handler accepts the first pinch after pan without a pause',()=>{
 const h=harness(),wheel=(extra={})=>h.send('wheel',0,300,200,{deltaMode:0,deltaX:8,deltaY:20,ctrlKey:false,metaKey:false,shiftKey:false,...extra});
 wheel();assert.equal(h.calls.pan.length,1);assert.equal(h.calls.zoom.length,0);
 h.time(30);wheel({ctrlKey:true});assert.equal(h.calls.zoom.length,1);assert.equal(h.calls.pan.length,1);
 h.time(250);wheel({ctrlKey:true});assert.equal(h.calls.zoom.length,2);
 h.time(270);wheel();assert.equal(h.calls.pan.length,1);
});
