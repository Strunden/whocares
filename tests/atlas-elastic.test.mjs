import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {zoomAt,clamp,elasticZoomScale,elasticPanBy,relaxPan} from '../site/js/atlas-camera.js';
const source=await readFile(new URL('../site/js/atlas.js',import.meta.url),'utf8');
const pan=source.slice(source.indexOf('function relaxWheelPan('),source.indexOf('function render('));
const zoom=source.slice(source.indexOf('let cameraReturnFrame='),source.indexOf('function zoomStep('));
function harness(scale,reduced=false,panBounds={minX:-100,maxX:100,minY:-100,maxY:100}){
 let now=0,id=0;const frames=new Map(),timers=new Map();
 const ctx=vm.createContext({zoomAt,clamp,elasticZoomScale,elasticPanBy,relaxPan,tree:{},activeGroup:null,collectionView:()=>({}),scenePanBounds:()=>({...panBounds}),panWithinScene:(tree,group,camera,dx,dy,w,h,options={})=>{const b=options.panBounds||panBounds;return {...camera,x:clamp(camera.x,b.minX,b.maxX),y:clamp(camera.y,b.minY,b.maxY)};},performance:{now:()=>now},map:{clientWidth:800,clientHeight:600},reducedMotion:{matches:reduced},pointers:new Map(),navigationFrame:0,camera:{s:scale,x:20,y:-40},zoomLimits:()=>({min:1,max:4}),render(){},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i),setTimeout:(fn,delay=0)=>{timers.set(++id,{fn,at:now+delay});return id;},clearTimeout:i=>timers.delete(i)});
 vm.runInContext(zoom+pan,ctx);
 return {ctx,advance(ms,step=16){const end=now+ms;while(now<end){now=Math.min(end,now+step);for(const [key,timer] of [...timers])if(timer.at<=now){timers.delete(key);timer.fn();}const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}},release(){const pending=[...timers.values()];timers.clear();pending.forEach(({fn})=>fn());},tick(ms){now+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));}};
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
 for(let i=0;i<20;i++){h.release();h.tick(20);h.ctx.panMap(20,0);assert.ok(h.ctx.camera.x<100+800*.24);}
 h.release();h.tick(240);assert.equal(h.ctx.camera.x,100);
});
test('reversal crosses the valid range continuously and resists at the opposite edge',()=>{
 const bounds={minX:-100,maxX:100,minY:-100,maxY:100};
 const start={s:1,x:180,y:0};
 const inside=elasticPanBy(start,-200,0,bounds,800,600);assert.equal(inside.x,-20);
 const far=elasticPanBy(start,-400,0,bounds,800,600);assert.ok(far.x<-100&&far.x>-292);
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



test('wheel stretch relaxes on the next frames without waiting for the idle timer',()=>{
 const h=harness(1);h.ctx.panMap(240,0,{wheel:true});const peak=h.ctx.camera.x;
 h.advance(32);assert.ok(h.ctx.camera.x<peak,'must start before the old 180ms wait');
 h.advance(80);assert.ok(h.ctx.camera.x<100+(peak-100)*.3);
});
test('decaying trackpad tail cannot keep the edge stretched until the last event',()=>{
 const h=harness(1);h.ctx.panMap(240,0,{wheel:true});let peak=h.ctx.camera.x;
 for(let i=0;i<50;i++){h.advance(16);h.ctx.panMap(20*.9**i,0,{wheel:true});peak=Math.max(peak,h.ctx.camera.x);if(i===24)assert.ok(h.ctx.camera.x<100+(peak-100)*.35);}
 assert.ok(h.ctx.camera.x<105,'edge recovers while momentum events still arrive');
 h.advance(450);assert.equal(h.ctx.camera.x,100);
});
test('wheel reversal responds on the first event and hands over cleanly to pinch',()=>{
 const h=harness(1);for(let i=0;i<80;i++){h.advance(16);h.ctx.panMap(1000,1000,{wheel:true});}
 const before={...h.ctx.camera};h.ctx.panMap(-2,-2,{wheel:true});
 assert.equal(h.ctx.camera.x,before.x-2);assert.equal(h.ctx.camera.y,before.y-2);
 h.ctx.zoomMap(1.1,{x:300,y:300});const next={...h.ctx.camera};h.advance(100);
 assert.deepEqual(h.ctx.camera,next,'wheel relaxation cannot continue after pinch');
});
test('wheel response is independent of RAF subdivision and never eases in-bounds movement',()=>{
 const a=harness(1),b=harness(1);
 for(let i=0;i<30;i++){a.advance(16,4);b.advance(16,16);for(const h of [a,b])h.ctx.panMap(20,0,{wheel:true});}
 assert.ok(Math.abs(a.ctx.camera.x-b.ctx.camera.x)<1e-8);
 const inside=harness(1);inside.ctx.panMap(10,20,{wheel:true});inside.advance(100);assert.equal(inside.ctx.camera.x,30);assert.equal(inside.ctx.camera.y,-20);
});


test('recorded physical trackpad tail relaxes before its final wheel event',async()=>{
 const trace=JSON.parse(await readFile(new URL('./fixtures/pan-wheel-tail.json',import.meta.url)));
 const h=harness(1);h.ctx.camera.x=100;let now=0,peak=100,earlyRecovery=false;
 for(const [time,dx,dy] of trace){h.advance(time-now);now=time;h.ctx.panMap(dx,dy,{wheel:true});peak=Math.max(peak,h.ctx.camera.x);if(time<trace.at(-1)[0]-100&&peak>150&&h.ctx.camera.x<100+(peak-100)*.2)earlyRecovery=true;}
 assert.ok(earlyRecovery,'must recover before the user-recorded momentum tail stops');
 assert.ok(h.ctx.camera.x<110);h.advance(450);assert.equal(h.ctx.camera.x,100);
});


test('wheel settlement respects the same starting-frame bounds as its live response',()=>{
 const h=harness(1,false,{minX:-500,maxX:-400,minY:-100,maxY:100});h.ctx.panMap(1,0,{wheel:true});
 h.advance(500);assert.equal(h.ctx.camera.x,20,'no delayed jump to unrelated regular bound');
 h.ctx.panMap(1,0,{wheel:true});h.ctx.stopCameraReturn();assert.equal(h.ctx.camera.x,20);
});
test('an older RAF timestamp cannot move the integration clock backwards',()=>{
 const a=harness(1),b=harness(1);for(const h of [a,b]){h.advance(20);h.ctx.panMap(240,0,{wheel:true});}
 a.ctx.relaxWheelPan(10);a.advance(16);b.advance(16);
 assert.equal(a.ctx.camera.x,b.ctx.camera.x);
});


test('tap and navigation interrupting wheel settlement keep its resting bounds',()=>{
 for(const navigation of [false,true]){
  const h=harness(1,false,{minX:-500,maxX:-400,minY:-100,maxY:100});
  h.ctx.panMap(100,0,{wheel:true});h.advance(190);h.ctx.stopCameraReturn(true,navigation);
  if(!navigation)h.ctx.settleCamera();h.advance(260);assert.equal(h.ctx.camera.x,20);
 }
});


test('wheel input resuming an interrupted final return keeps its permitted bounds',()=>{
 const h=harness(1,false,{minX:-500,maxX:-400,minY:-100,maxY:100});
 h.ctx.panMap(100,0,{wheel:true});h.advance(190);h.ctx.stopCameraReturn(true,false);
 h.ctx.panMap(-2,0,{wheel:true});h.advance(500);assert.equal(h.ctx.camera.x,20);
});
