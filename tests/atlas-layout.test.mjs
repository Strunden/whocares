import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {buildHierarchy,readingLevel,ancestry,panWithinWorld,unitScale,levelScale,frameLevel,perspectiveHierarchy,embedHierarchy} from '../site/js/atlas-layout.js';
import {personaMaps} from '../site/js/atlas-content.js';
const data=JSON.parse(await readFile(new URL('../site/data/index.json',import.meta.url)));
const entries=data.entries.filter(e=>e.published!==false);
function checkCoverage(tree,records){const represented=new Set([...tree.all.values()].filter(n=>n.entry).map(n=>n.entry.id));for(const e of records)assert.ok(represented.has(e.id),`Unreachable record ${e.id}`);}
test('every published record remains spatially reachable from every perspective',()=>{for(const p of Object.values(personaMaps))checkCoverage(buildHierarchy(entries,p.regions),entries);});
test('adding an unknown category requires neither layout code nor an illustration',()=>{const extra={id:'new-category-record',title:'Unseen service',tag:'New category',type:'company'};const t=buildHierarchy([...entries,extra],personaMaps.relative.regions);checkCoverage(t,[extra]);assert.ok([...t.all.values()].some(n=>n.entry===extra&&n.root==='wider-research'));});
test('children stay within their parent and sibling rectangles do not overlap',()=>{const t=buildHierarchy(entries,personaMaps.relative.regions);for(const n of t.all.values())for(const c of n.children||[]){assert.ok(c.box.x>=n.box.x&&c.box.y>=n.box.y&&c.box.x+c.box.w<=n.box.x+n.box.w+.01&&c.box.y+c.box.h<=n.box.y+n.box.h+.01);for(const d of n.children)if(c.id!==d.id&&c.page===d.page)assert.ok(c.box.x+c.box.w<=d.box.x||d.box.x+d.box.w<=c.box.x||c.box.y+c.box.h<=d.box.y||d.box.y+d.box.h<=c.box.y);}});
test('100,000 records stay reachable with a bounded viewport frontier',()=>{
 const large=Array.from({length:100000},(_,i)=>({id:'synthetic-'+i,title:'Service '+String(i).padStart(6,'0'),type:'company',themes:['T11'],summary:'Synthetic scale-test record, not evidence.'}));
 const start=performance.now(),t=buildHierarchy(large,personaMaps.relative.regions),elapsed=performance.now()-start;checkCoverage(t,large);
 let max=0;const target=[...t.all.values()].find(n=>n.entry?.id==='synthetic-50000');
 for(const group of ancestry(t,target.id)){const child=group.children?.[0]||group;const s=300/child.box.w;const cam={s,x:32-child.box.x*s,y:28-child.box.y*s};const visible=readingLevel(t,group.id,cam,1280,700);max=Math.max(max,visible.length);assert.ok(visible.length<=90);assert.ok(visible.every(v=>['summary','context'].includes(v.mode)));}
 console.log(JSON.stringify({records:large.length,hierarchyNodes:t.all.size,buildMs:Math.round(elapsed),maxRendered:max,depth:t.maxDepth}));
});

test('panning keeps the chosen hierarchy level and content representation fixed',()=>{const t=buildHierarchy(entries,personaMaps.relative.regions);const group=t.all.get('services');for(const x of [-1000,0,1000]){const visible=readingLevel(t,group.id,{s:1,x,y:0},1280,700);assert.ok(visible.filter(v=>v.mode!=='context').every(v=>v.node.parent===group.id&&v.mode==='summary'));}assert.deepEqual(ancestry(t,'services/T13').map(n=>n.title),['Finding care','Care admin']);});
test('the compact index covers published data and every on-demand detail is lossless',async()=>{
 const lean=JSON.parse(await readFile(new URL('../site/data/atlas/index.json',import.meta.url)));
 assert.equal(lean.entries.length,entries.length);
 const original=new Map(entries.map(e=>[e.id,e])),full=new Map();
 for(const file of new Set(lean.entries.map(e=>e.detail_file))){assert.match(file,/^records-[a-f0-9]{12}\.json$/);const chunk=JSON.parse(await readFile(new URL('../site/data/atlas/'+file,import.meta.url)));for(const e of chunk)full.set(e.id,e);}
 for(const e of lean.entries){assert.deepEqual(full.get(e.id),original.get(e.id));assert.equal(e.deep_dive,undefined);assert.equal(e.writeup,undefined);}
});

test('a group that fits the viewport still pans freely in both directions',()=>{const start={s:1,x:100,y:50},bounds={x:0,y:0,width:500,height:400};const next=panWithinWorld(start,80,60,bounds,1280,720);assert.deepEqual(next,{s:1,x:180,y:110});assert.deepEqual(panWithinWorld(next,-80,-60,bounds,1280,720),start);});
test('a level contains its own siblings, without differently scaled ancestor surfaces',()=>{const t=buildHierarchy(entries,personaMaps.provider.regions);const view=readingLevel(t,'delivery',{s:.25,x:0,y:0},1280,720);assert.ok(view.length);assert.ok(view.every(v=>v.node.parent==='delivery'&&v.mode==='summary'));});

test('zoomed reading surfaces remain centred, phone-sized and culled by visible bounds',()=>{
 const node={id:'record',box:{x:0,y:0,w:350,h:300}};
 const group={id:'group',box:node.box,children:[node]};
 const tree={roots:[group],all:new Map([['group',group],['record',node]])};
 const camera={s:2.4,x:196.5-175*2.4,y:280-150*2.4};
 const [view]=readingLevel(tree,'group',camera,393,578);
 assert.equal(view.box.w,350);assert.equal(view.box.h,300);
 assert.ok(Math.abs(view.box.x+view.box.w/2-196.5)<1e-8);
 assert.ok(Math.abs(view.box.y+view.box.h/2-280)<1e-8);
 // Large world slot still intersects the viewport, but the real card does not.
 assert.equal(readingLevel(tree,'group',{s:2.4,x:-740,y:0},393,578).length,0);
});

test('local magnification never resizes a reading card or changes its representation',()=>{
 const node={id:'record',box:{x:0,y:0,w:350,h:300}};
 const group={id:'group',box:node.box,children:[node]};
 const tree={roots:[group],all:new Map([['group',group],['record',node]])};
 for(const scale of [1,1.2,1.8,2.4]){
  const camera={s:scale,x:196.5-175*scale,y:280-150*scale};
  const [view]=readingLevel(tree,'group',camera,393,578,{surfaceScale:1});
  assert.equal(view.box.w,350);assert.equal(view.box.h,300);
  assert.equal(view.mode,'summary');assert.equal(view.node.id,'record');
 }
});

test('every perspective and territory uses a readable common surface in narrow viewports',()=>{
 for(const width of [393,743,1280]){
  const outer=perspectiveHierarchy(personaMaps,width<701);
  for(const key of Object.keys(personaMaps)){
   const lens=embedHierarchy(buildHierarchy(entries,personaMaps[key].regions,{portrait:width<701}),outer.all.get(key),outer.bounds);
   checkCoverage(lens,entries);
   for(const t of [outer,lens]){
    const node=t.roots[0],scale=unitScale(node.box,width);
    const cam={s:scale*1.2,x:width/2-(node.box.x+node.box.w/2)*scale*1.2,y:180-(node.box.y+node.box.h/2)*scale*1.2};
    const view=readingLevel(t,null,cam,width,500,{surfaceScale:scale}).find(v=>v.node.id===node.id);
    assert.ok(Math.abs(view.box.w-Math.min(350,width-32))<1e-8);assert.ok(Math.abs(view.box.h-300)<1e-8);
   }
   const p=outer.all.get(key).box;
   for(const root of lens.roots)assert.ok(root.box.x>=p.x&&root.box.y>=p.y&&root.box.x+root.box.w<=p.x+p.w&&root.box.y+root.box.h<=p.y+p.h);
  }
 }
});

test('empty research collections have a safe camera without inventing records',()=>{
 const group={id:'empty',box:{x:50,y:70,w:350,h:300},paged:true,children:[]};
 const tree={roots:[group],all:new Map([['empty',group]])};
 const camera=frameLevel(tree,'empty',393);
 assert.ok(Object.values(camera).every(Number.isFinite));
 assert.equal(levelScale(tree,'empty',393),1);
 assert.deepEqual(readingLevel(tree,'empty',camera,393,600),[]);
});
