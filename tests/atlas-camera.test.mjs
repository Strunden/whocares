import test from 'node:test';
import assert from 'node:assert/strict';
import {project,fit,zoomAt,elasticZoomScale,interpolateCamera} from '../site/js/atlas-camera.js';
import {personaMaps,personaStories} from '../site/js/atlas-content.js';
import {collectionLabels,availableStory} from '../site/js/atlas-navigation.js';
import {readFile} from 'node:fs/promises';
const almost=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
test('overview fits both portrait and landscape without clipping world bounds',()=>{
 for(const [w,h] of [[393,520],[872,440],[1440,700]]){
  const bounds={x:0,y:0,width:1590,height:985};const c=fit(w,h,bounds,12);
  const a=project(c,{x:0,y:0}),b=project(c,{x:1590,y:985});
  assert.ok(a.x>=11.99&&a.y>=11.99&&b.x<=w-11.99&&b.y<=h-11.99);
 }
});
import {entries as fixtureEntries} from './fixtures/discovery.mjs';
const data={entries:fixtureEntries};
const published=new Map(data.entries.filter(e=>e.published!==false).map(e=>[e.id,e]));
test('all five maps have distinct territories and named categories independent of archived claims',()=>{
 const signatures=[];
 for(const [persona,map] of Object.entries(personaMaps)){
  assert.equal(map.regions.length,6);signatures.push(map.regions.map(g=>g.title).join('|'));
  for(const region of map.regions)for(const theme of region.themes)assert.ok(collectionLabels[theme],`${persona}: ${theme}`);
 }
 assert.equal(new Set(signatures).size,5);
});
test('stories exclude archived links without relabeling a company as their missing problem',()=>{
 for(const [persona,narrative] of Object.entries(personaStories))for(const beat of availableStory(narrative,published).beats){
  for(const id of beat.ids)assert.ok(published.has(id),`${persona}: missing ${id}`);
  if(beat.focus)assert.ok(published.has(beat.focus));else assert.match(beat.evidence,/archived/);
 }
});

test('zoom preserves cursor world point at both limits and reverses exactly',()=>{
 const camera={s:2,x:-130,y:88},anchor={x:319,y:201};
 const world={x:(anchor.x-camera.x)/camera.s,y:(anchor.y-camera.y)/camera.s};
 for(const factor of [.01,.8,1.3,100]){
  const next=zoomAt(camera,factor,anchor,1,4),point=project(next,world);
  almost(point.x,anchor.x);almost(point.y,anchor.y);assert.ok(next.s>=1&&next.s<=4);
 }
 const back=zoomAt(zoomAt(camera,1.4,anchor,1,4),1/1.4,anchor,1,4);
 for(const key of ['s','x','y'])almost(back[key],camera[key]);
});

test('elastic limits resist overscroll, stay bounded and settle at the same anchor',()=>{
 const anchor={x:319,y:201};
 for(const [start,factor,bound] of [[1,.7,1],[4,1.3,4]]){
  let camera={s:start,x:20,y:-40};const world={x:(anchor.x-camera.x)/start,y:(anchor.y-camera.y)/start};
  for(let i=0;i<100;i++){const s=elasticZoomScale(camera.s,factor,1,4);camera=zoomAt(camera,s/camera.s,anchor,0,Infinity);}
  assert.ok(camera.s>Math.exp(-.24)&&camera.s<4*Math.exp(.24));assert.notEqual(camera.s,bound);
  const settled=zoomAt(camera,1,anchor,1,4);almost(settled.s,bound);almost(project(settled,world).x,anchor.x);almost(project(settled,world).y,anchor.y);
 }
 almost(elasticZoomScale(2,1.1,1,4),2.2);
});

test('rubber-band curve is reversible, event-rate independent and safe for coincident fingers',()=>{
 let whole=elasticZoomScale(1,.5,1,4),split=1;
 for(let i=0;i<10;i++)split=elasticZoomScale(split,Math.pow(.5,.1),1,4);
 almost(whole,split);almost(elasticZoomScale(whole,2,1,4),1);
 for(const factor of [0,Infinity,NaN,1e200])assert.ok(Number.isFinite(elasticZoomScale(1,factor,1,4))&&elasticZoomScale(1,factor,1,4)>0);
 let s=1,previousDelta=Infinity;
 for(let i=0;i<8;i++){const next=elasticZoomScale(s,.8,1,4),delta=s-next;assert.ok(delta>0&&delta<previousDelta);s=next;previousDelta=delta;}
});

test('level transition moves its selected focal point along a straight screen path',()=>{
 const start={s:.3,x:-20,y:140},target={s:3.6,x:-1800,y:-950},anchor={x:600,y:370};
 const a=project(start,anchor),b=project(target,anchor);
 for(const t of [0,.1,.25,.5,.75,.9,1]){const current=interpolateCamera(start,target,anchor,t),p=project(current,anchor);almost(p.x,a.x+(b.x-a.x)*t);almost(p.y,a.y+(b.y-a.y)*t);}
});
