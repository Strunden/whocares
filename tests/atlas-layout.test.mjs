import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {buildHierarchy,readingLevel,ancestry,panWithinWorld,panWithinScene,scenePanBounds,levelScene,unitScale,levelScale,frameLevel,entryFrame,levelZoomLimits,perspectiveHierarchy,embedHierarchy} from '../site/js/atlas-layout.js';
import {personaMaps} from '../site/js/atlas-content.js';
import {entries as fixtureEntries} from './fixtures/discovery.mjs';
const data={entries:fixtureEntries};
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
test('a group that fits the viewport still pans freely in both directions',()=>{const start={s:1,x:100,y:50},bounds={x:0,y:0,width:500,height:400};const next=panWithinWorld(start,80,60,bounds,1280,720);assert.deepEqual(next,{s:1,x:180,y:110});assert.deepEqual(panWithinWorld(next,-80,-60,bounds,1280,720),start);});
test('a level contains its own siblings, without differently scaled ancestor surfaces',()=>{const t=buildHierarchy(entries,personaMaps.provider.regions);const view=readingLevel(t,'delivery',{s:.25,x:0,y:0},1280,720);assert.ok(view.length);assert.ok(view.every(v=>v.node.parent==='delivery'&&v.mode==='summary'));});

test('zoom magnifies one coherent unit without changing its internal layout or identity',()=>{
 const node={id:'record',box:{x:0,y:0,w:350,h:300}},group={id:'group',box:node.box,children:[node]};
 const tree={roots:[group],all:new Map([['group',group],['record',node]])};
 for(const scale of [.4,1,1.8,2.4]){
  const camera={s:scale,x:196.5-175*scale,y:280-150*scale};
  const [view]=readingLevel(tree,'group',camera,393,578);
  assert.equal(view.box.w,350*scale);assert.equal(view.box.h,300*scale);
  assert.equal(view.box.layoutW,350);assert.equal(view.box.layoutH,300);
  assert.ok(Math.abs(view.box.x+view.box.w/2-196.5)<1e-8);
  assert.equal(view.mode,'summary');assert.equal(view.node.id,'record');
 }
 assert.equal(readingLevel(tree,'group',{s:2.4,x:-1000,y:0},393,578).length,0);
});

test('overview fits every sibling at phone, narrow and desktop sizes at the minimum zoom',()=>{
 for(const width of [393,743,1280]){
  const outer=perspectiveHierarchy(personaMaps,width<701);
  for(const key of Object.keys(personaMaps)){
   const lens=embedHierarchy(buildHierarchy(entries,personaMaps[key].regions,{portrait:width<701}),outer.all.get(key),outer.bounds);
   checkCoverage(lens,entries);
   for(const tree of [outer,lens]){
    for(const group of [null,...tree.roots.filter(n=>n.children?.length).map(n=>n.id)]){
     const height=420,cam=frameLevel(tree,group,width,height),views=readingLevel(tree,group,cam,width,height);
     const expected=group?(tree.all.get(group).paged?Math.min(6,tree.all.get(group).children.length):tree.all.get(group).children.length):tree.roots.length;
     assert.equal(views.length,expected);
     for(const {box:b} of views)assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=width+.01&&b.y+b.h<=height+.01,`${key}/${group}: clipped sibling`);
     assert.ok(levelZoomLimits(tree,group,width,height).min===cam.s);
    }
   }
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

test('phone detail entry is readable and hints at the neighboring column',()=>{
 const tree=buildHierarchy(entries,personaMaps.relative.regions,{portrait:true});
 for(const group of tree.roots.filter(n=>n.children?.length>1)){
  const camera=entryFrame(tree,group.id,393,620),views=readingLevel(tree,group.id,camera,393,620);
  const first=views[0];assert.ok(first.box.w>=310);assert.ok(first.box.x>=17&&first.box.x<=19);
  assert.ok(views.some(v=>v.node.id!==first.node.id&&v.box.x>first.box.x&&v.box.x<393),'neighbor edge should be visible');
 }
});

test('extreme panning never loses every item in the active level, including sparse grid corners',()=>{
 for(const width of [393,743,1280]){
  const tree=buildHierarchy(entries,personaMaps.relative.regions,{portrait:width<701});
  for(const groupId of [null,...tree.roots.filter(n=>n.children?.length).map(n=>n.id)]){
   for(const ratio of [1,1.5]){let camera=entryFrame(tree,groupId,width,620);camera.s*=ratio;
    for(const [dx,dy] of [[1e6,1e6],[-1e6,-1e6],[1e6,-1e6],[-1e6,1e6],[0,1e6],[1e6,0]]){
     camera=panWithinScene(tree,groupId,camera,dx,dy,width,620);
     const views=readingLevel(tree,groupId,camera,width,620);
     assert.ok(views.some(({box:b})=>Math.max(0,Math.min(width,b.x+b.w)-Math.max(0,b.x))*Math.max(0,Math.min(620,b.y+b.h)-Math.max(0,b.y))>=Math.min(width,b.w)*Math.min(620,b.h)*.5),'lost the active scene');
    }
   }
  }
 }
});

test('every visible-page item can reach the exact viewport centre at every zoom and viewport size',()=>{
 for(const width of [393,743,1280]){
  const tree=buildHierarchy(entries,personaMaps.relative.regions,{portrait:width<701});
  const groups=[null,...[...tree.all.values()].filter(n=>n.children?.length).map(n=>n.id)];
  for(const group of groups){
   const limits=levelZoomLimits(tree,group,width,720);
   for(const s of [limits.min,(limits.min+limits.max)/2,limits.max]){
    for(const page of [0,1])for(const {anchor,node} of levelScene(tree,group,{page}).items){
     const desired={s,x:width/2-(anchor.x+anchor.w/2)*s,y:360-(anchor.y+anchor.h/2)*s};
     const actual=panWithinScene(tree,group,desired,0,0,width,720,{page});
     assert.ok(Math.abs(actual.x-desired.x)<1e-7&&Math.abs(actual.y-desired.y)<1e-7,`${width}: ${node.id} cannot centre`);
     const b=scenePanBounds(tree,group,desired,width,720,{page});assert.ok(desired.x>=b.minX-1e-7&&desired.x<=b.maxX+1e-7&&desired.y>=b.minY-1e-7&&desired.y<=b.maxY+1e-7);
    }
   }
  }
 }
});
