import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {buildHierarchy,readingLevel,ancestry} from '../site/js/atlas-layout.js';
import {personaMaps} from '../site/js/atlas-content.js';
const data=JSON.parse(await readFile(new URL('../site/data/index.json',import.meta.url)));
const entries=data.entries.filter(e=>e.published!==false);
function checkCoverage(tree,records){const represented=new Set([...tree.all.values()].filter(n=>n.entry).map(n=>n.entry.id));for(const e of records)assert.ok(represented.has(e.id),`Unreachable record ${e.id}`);}
test('every published record remains spatially reachable from every perspective',()=>{for(const p of Object.values(personaMaps))checkCoverage(buildHierarchy(entries,p.regions),entries);});
test('adding an unknown category requires neither layout code nor an illustration',()=>{const extra={id:'new-category-record',title:'Unseen service',tag:'New category',type:'company'};const t=buildHierarchy([...entries,extra],personaMaps.relative.regions);checkCoverage(t,[extra]);assert.ok([...t.all.values()].some(n=>n.entry===extra&&n.root==='wider-research'));});
test('children stay within their parent and sibling rectangles do not overlap',()=>{const t=buildHierarchy(entries,personaMaps.relative.regions);for(const n of t.all.values())for(const c of n.children||[]){assert.ok(c.box.x>=n.box.x&&c.box.y>=n.box.y&&c.box.x+c.box.w<=n.box.x+n.box.w+.01&&c.box.y+c.box.h<=n.box.y+n.box.h+.01);for(const d of n.children)if(c.id!==d.id)assert.ok(c.box.x+c.box.w<=d.box.x||d.box.x+d.box.w<=c.box.x||c.box.y+c.box.h<=d.box.y||d.box.y+d.box.h<=c.box.y);}});
test('100,000 records stay reachable with a bounded viewport frontier',()=>{
 const large=Array.from({length:100000},(_,i)=>({id:'synthetic-'+i,title:'Service '+String(i).padStart(6,'0'),type:'company',themes:['T11'],summary:'Synthetic scale-test record, not evidence.'}));
 const start=performance.now(),t=buildHierarchy(large,personaMaps.relative.regions),elapsed=performance.now()-start;checkCoverage(t,large);
 let max=0;const target=[...t.all.values()].find(n=>n.entry?.id==='synthetic-50000');
 for(const group of ancestry(t,target.id)){const child=group.children?.[0]||group;const s=300/child.box.w;const cam={s,x:32-child.box.x*s,y:28-child.box.y*s};const visible=readingLevel(t,group.id,cam,1280,700);max=Math.max(max,visible.length);assert.ok(visible.length<=90);assert.ok(visible.every(v=>v.mode==='summary'));}
 console.log(JSON.stringify({records:large.length,hierarchyNodes:t.all.size,buildMs:Math.round(elapsed),maxRendered:max,depth:t.maxDepth}));
});

test('panning keeps the chosen hierarchy level and content representation fixed',()=>{const t=buildHierarchy(entries,personaMaps.relative.regions);const group=t.all.get('services');for(const x of [-1000,0,1000]){const visible=readingLevel(t,group.id,{s:1,x,y:0},1280,700);assert.ok(visible.every(v=>v.node.parent===group.id&&v.mode==='summary'));}assert.deepEqual(ancestry(t,'services/T13').map(n=>n.title),['Finding care','Care admin']);});
test('the compact index covers published data and every on-demand detail is lossless',async()=>{
 const lean=JSON.parse(await readFile(new URL('../site/data/atlas/index.json',import.meta.url)));
 assert.equal(lean.entries.length,entries.length);
 const original=new Map(entries.map(e=>[e.id,e])),full=new Map();
 for(const file of new Set(lean.entries.map(e=>e.detail_file))){assert.match(file,/^records-[a-f0-9]{12}\.json$/);const chunk=JSON.parse(await readFile(new URL('../site/data/atlas/'+file,import.meta.url)));for(const e of chunk)full.set(e.id,e);}
 for(const e of lean.entries){assert.deepEqual(full.get(e.id),original.get(e.id));assert.equal(e.deep_dive,undefined);assert.equal(e.writeup,undefined);}
});
