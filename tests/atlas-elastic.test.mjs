import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {zoomAt,clamp,elasticZoomScale} from '../site/js/atlas-camera.js';
const source=await readFile(new URL('../site/js/atlas.js',import.meta.url),'utf8');
const zoom=source.slice(source.indexOf('let zoomReturnFrame='),source.indexOf('function zoomStep('));
function harness(scale,reduced=false){
 let now=0,id=0;const frames=new Map(),timers=new Map();
 const ctx=vm.createContext({zoomAt,clamp,elasticZoomScale,performance:{now:()=>now},map:{clientWidth:800,clientHeight:600},reducedMotion:{matches:reduced},pointers:new Map(),navigationFrame:0,camera:{s:scale,x:20,y:-40},zoomLimits:()=>({min:1,max:4}),render(){},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i),setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:i=>timers.delete(i)});
 vm.runInContext(zoom,ctx);
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
