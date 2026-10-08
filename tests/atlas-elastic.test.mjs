import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {zoomAt,clamp,elasticZoomScale,elasticPanBy} from '../site/js/atlas-camera.js';
const source=await readFile(new URL('../site/js/atlas.js',import.meta.url),'utf8');
const pan=source.slice(source.indexOf('function panMap('),source.indexOf('function render('));
const zoom=source.slice(source.indexOf('let cameraReturnFrame='),source.indexOf('function zoomStep('));
function harness(scale,reduced=false,panBounds={minX:-100,maxX:100,minY:-100,maxY:100}){
 let now=0,id=0;const frames=new Map(),timers=new Map();
 const ctx=vm.createContext({zoomAt,clamp,elasticZoomScale,elasticPanBy,tree:{},activeGroup:null,collectionView:()=>({}),scenePanBounds:()=>({...panBounds}),panWithinScene:(tree,group,camera)=>({...camera,x:clamp(camera.x,panBounds.minX,panBounds.maxX),y:clamp(camera.y,panBounds.minY,panBounds.maxY)}),performance:{now:()=>now},map:{clientWidth:800,clientHeight:600},reducedMotion:{matches:reduced},pointers:new Map(),navigationFrame:0,camera:{s:scale,x:20,y:-40},zoomLimits:()=>({min:1,max:4}),render(){},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i),setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:i=>timers.delete(i)});
 vm.runInContext(zoom+pan,ctx);
 return {ctx,release(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());},tick(ms){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}};
}
test('actual gesture zoom elastically overshoots then returns to the bound without anchor drift',()=>{
 for(const [scale,factor] of [[1,.8],[4,1.2]]){
  const h=harness(scale),anchor={x:270,y:180},world={x:(270-20)/scale,y:(180+40)/scale};
  h.ctx.zoomMap(factor,anchor);assert.notEqual(h.ctx.camera.s,scale);
  h.release();h.tick(120);assert.notEqual(h.ctx.camera.s,scale);h.tick(120);
  assert.equal(h.ctx.camera.s,scale);assert.ok(Math.abs(h.ctx.camera.x+world.x*scale-anchor.x)<1e-8);assert.ok(Math.abs(h.ctx.camera.y+world.y*scale-anchor.y)<1e-8);
 }
});
test('new input cancels an old return and reduced motion stays within the limit',()=>{
 const h=harness(1);h.ctx.zoomMap(.8,{x:200,y:200});h.release();h.tick(80);h.ctx.zoomMap(1.3,{x:200,y:200});const s=h.ctx.camera.s;h.tick(300);assert.equal(h.ctx.camera.s,s);
 const r=harness(1,true);r.ctx.zoomMap(.7,{x:200,y:200});assert.equal(r.ctx.camera.s,1);r.release();r.tick(300);assert.equal(r.ctx.camera.s,1);
});

test('pan moves freely until the centre limit, then resists progressively and settles after idle',()=>{
 const h=harness(1);h.ctx.panMap(60,0);assert.equal(h.ctx.camera.x,80);
 h.ctx.panMap(100,0);const first=h.ctx.camera.x;assert.ok(first>100&&first<180);
 h.ctx.panMap(100,0);const second=h.ctx.camera.x;assert.ok(second>first&&second-first<first-100);
 h.release();h.tick(120);assert.ok(h.ctx.camera.x>100&&h.ctx.camera.x<second);h.tick(120);assert.equal(h.ctx.camera.x,100);
});
test('pan event subdivision, reversal, interruptions and first pinch remain stable',()=>{
 const a=harness(1),b=harness(1);a.ctx.panMap(400,200);for(let i=0;i<40;i++)b.ctx.panMap(10,5);
 assert.ok(Math.abs(a.ctx.camera.x-b.ctx.camera.x)<1e-8);assert.ok(Math.abs(a.ctx.camera.y-b.ctx.camera.y)<1e-8);
 const before={...a.ctx.camera};a.ctx.panMap(-10,-10);assert.equal(a.ctx.camera.x,before.x-10);assert.equal(a.ctx.camera.y,before.y-10);
 b.release();b.tick(80);b.ctx.panMap(-10,0);const x=b.ctx.camera.x;b.tick(300);assert.equal(b.ctx.camera.x,x);
 b.ctx.zoomMap(1.1,{x:300,y:300});assert.equal(b.ctx.camera.s,1.1);
 const cancelled=harness(1);cancelled.ctx.panMap(1000,0);cancelled.release();cancelled.tick(80);cancelled.ctx.stopCameraReturn();const at=cancelled.ctx.camera.x;cancelled.tick(300);assert.equal(cancelled.ctx.camera.x,at);
});
test('pan starts without a jump outside normal bounds, settles on release, and respects reduced motion',()=>{
 const h=harness(1,false,{minX:0,maxX:0,minY:0,maxY:0});h.ctx.panMap(1,0);assert.ok(h.ctx.camera.x>20&&h.ctx.camera.x<21);h.release();h.tick(240);assert.equal(h.ctx.camera.x,0);assert.equal(h.ctx.camera.y,0);
 const r=harness(1,true);r.ctx.panMap(1000,0);assert.equal(r.ctx.camera.x,100);
 const held=harness(1);held.ctx.pointers.set(1,{});held.ctx.panMap(1000,0);held.release();held.tick(300);assert.ok(held.ctx.camera.x>100);held.ctx.pointers.clear();held.ctx.settleCamera();held.tick(240);assert.equal(held.ctx.camera.x,100);
});

test('a tap interrupting pan return resumes settlement, and navigation saves a resting camera',()=>{
 const h=harness(1);h.ctx.panMap(1000,0);h.release();h.tick(80);const interrupted=h.ctx.camera.x;
 h.ctx.stopCameraReturn(true,false);h.tick(300);assert.equal(h.ctx.camera.x,interrupted);
 h.ctx.settleCamera();h.tick(240);assert.equal(h.ctx.camera.x,100);
 const leaving=harness(1);leaving.ctx.panMap(1000,0);leaving.ctx.stopCameraReturn();assert.equal(leaving.ctx.camera.x,100);
});
test('pan after elastic zoom preserves scale until release and extra contact retains raw displacement',()=>{
 const h=harness(1);h.ctx.zoomMap(.8);const scale=h.ctx.camera.s;h.ctx.panMap(30,0);assert.equal(h.ctx.camera.s,scale);h.release();h.tick(240);assert.equal(h.ctx.camera.s,1);
 const a=harness(1),b=harness(1);a.ctx.panMap(200,0);a.ctx.stopCameraReturn(false,false);a.ctx.panMap(100,0);b.ctx.panMap(300,0);assert.equal(a.ctx.camera.x,b.ctx.camera.x);
});

test('heavy edge inertia cannot delay a two-pixel reversal, including diagonal and reduced-motion input',()=>{
 for(const reduced of [false,true])for(const sign of [-1,1]){
  const h=harness(1,reduced);for(let i=0;i<80;i++)h.ctx.panMap(sign*1000,sign*1000);
  const before={...h.ctx.camera};h.ctx.panMap(-sign*2,-sign*2);
  assert.equal(h.ctx.camera.x,before.x-sign*2);assert.equal(h.ctx.camera.y,before.y-sign*2);
 }
});
test('interrupting returns never ratchets the boundary outward',()=>{
 const h=harness(1);h.ctx.panMap(10000,0);
 for(let i=0;i<20;i++){h.release();h.tick(20);h.ctx.panMap(20,0);assert.ok(h.ctx.camera.x<100+800*.12);}
 h.release();h.tick(240);assert.equal(h.ctx.camera.x,100);
});
test('reversal crosses the valid range continuously and resists at the opposite edge',()=>{
 const bounds={minX:-100,maxX:100,minY:-100,maxY:100};
 const start={s:1,x:180,y:0};
 const inside=elasticPanBy(start,-200,0,bounds,800,600);assert.equal(inside.x,-20);
 const far=elasticPanBy(start,-400,0,bounds,800,600);assert.ok(far.x<-100&&far.x>-196);
 let split=start;for(let i=0;i<40;i++)split=elasticPanBy(split,-10,0,bounds,800,600);
 assert.ok(Math.abs(split.x-far.x)<1e-8);
});

test('interrupting return from distant anchored framing never jumps inward on outward input',()=>{
 const bounds={minX:-100,maxX:100,minY:-100,maxY:100};
 for(const sign of [-1,1]){
  const start={s:1,x:sign*400,y:0},out=elasticPanBy(start,sign,0,bounds,1000,600);
  assert.equal(out.x,start.x);assert.equal(elasticPanBy(out,-sign*2,0,bounds,1000,600).x,start.x-sign*2);
 }
 const h=harness(1,false,{minX:-500,maxX:-400,minY:-100,maxY:100});h.ctx.panMap(1,0);h.release();h.tick(20);
 const before=h.ctx.camera.x;h.ctx.panMap(1,0);assert.ok(h.ctx.camera.x>=before);
 h.release();h.tick(240);assert.equal(h.ctx.camera.x,-400);
});
