import test from 'node:test';
import assert from 'node:assert/strict';
import {project,fit,zoomAt} from '../site/js/atlas-camera.js';
import {personaMaps,personaStories} from '../site/js/atlas-content.js';
import {readFile} from 'node:fs/promises';
const almost=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
test('overview fits both portrait and landscape without clipping world bounds',()=>{
 for(const [w,h] of [[393,520],[872,440],[1440,700]]){
  const bounds={x:0,y:0,width:1590,height:985};const c=fit(w,h,bounds,12);
  const a=project(c,{x:0,y:0}),b=project(c,{x:1590,y:985});
  assert.ok(a.x>=11.99&&a.y>=11.99&&b.x<=w-11.99&&b.y<=h-11.99);
 }
});
const data=JSON.parse(await readFile(new URL('../site/data/index.json',import.meta.url)));
const published=new Map(data.entries.filter(e=>e.published!==false).map(e=>[e.id,e]));
test('all five maps have distinct territories, with valid published theme references',()=>{
 const signatures=[];
 for(const [persona,map] of Object.entries(personaMaps)){
  assert.equal(map.regions.length,6);signatures.push(map.regions.map(g=>g.title).join('|'));
  for(const region of map.regions)for(const theme of region.themes)assert.ok(published.has(`idea-${theme}`),`${persona}: ${theme}`);
 }
 assert.equal(new Set(signatures).size,5);
});
test('every story links to existing records and focuses on a problem in its own map',()=>{
 for(const [persona,narrative] of Object.entries(personaStories))for(const beat of narrative.beats){
  for(const id of [...beat.ids,beat.focus])assert.ok(published.has(id),`${persona}: missing ${id}`);
  const entry=published.get(beat.focus);
  assert.ok(personaMaps[persona].regions.some(g=>entry.themes.some(t=>g.themes.includes(t))),`${persona}: unmapped story focus ${beat.focus}`);
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
