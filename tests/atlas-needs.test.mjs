import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationRoots} from '../site/js/atlas-needs.js';
import {buildHierarchy,levelScene,frameLevel,readingLevel} from '../site/js/atlas-layout.js';
const nav=(role,order=0)=>({role,order,title:role+' title',summary:'A specific context.',image:'assets/illustrations/study/need-company-v4.png'});
function records(){
 const need={id:'need-a',scope:{navigation:{...nav('need'),view_id:'existing-route',lenses:['adult']}},links:[]};
 const situations=['one','two','empty'].map((id,i)=>({id,scope:{navigation:nav('situation',i)},links:[]}));
 const response={id:'same-solution',kind:'solution',title:'Existing offering'};
 const edges=situations.map(s=>({from_id:s.id,to_id:need.id,relation:'context_for',provenance:{navigation:true}}));
 const responses=situations.slice(0,2).map((s,i)=>({from_id:response.id,to_id:s.id,relation:i?'addresses':'responds_to',provenance:{navigation:true},statement:'Context '+i}));
 need.links=edges;situations.forEach(s=>s.links=responses.filter(e=>e.to_id===s.id));
 return [need,...situations,response,{id:'old-theme',scope:{},links:[]}];
}
test('navigation uses only explicit canonical needs, situations and existing offerings',()=>{
 const data=records(),before=JSON.stringify(data),roots=navigationRoots(data,'family');
 assert.equal(roots.length,1);assert.equal(roots[0].id,'existing-route');assert.equal(roots[0].muted,true);
 const [a,b,empty]=roots[0].children;
 assert.equal(a.children[0].entry,b.children[0].entry);assert.equal(a.children[0].description,'Context 0');assert.equal(b.children[0].description,'Context 1');assert.equal(empty.children.length,0);
 assert.equal(JSON.stringify(data),before);
 const hidden={id:'workaround',kind:'lived_workaround'};data.push(hidden);a.entry.links.push({from_id:hidden.id,to_id:a.entry.id,relation:'addresses',provenance:{navigation:true}});
 assert.equal(navigationRoots(data)[0].children[0].children.length,1);
});
test('missing navigation fails visibly; unsafe illustration paths remain rejected',()=>{
 assert.throws(()=>navigationRoots([]),/not available/);
 for(const image of ['../private.png','https://remote.example/art.png']){const data=records();data[0].scope.navigation.image=image;assert.throws(()=>navigationRoots(data),/unsafe illustration/);}
});
test('empty research coverage remains an empty map level with a finite camera',()=>{
 const tree=buildHierarchy([],[],{extraRoots:navigationRoots(records())});
 const id='existing-route/empty';assert.equal(levelScene(tree,id).items.length,0);
 const camera=frameLevel(tree,id,1280,720);assert.ok(Object.values(camera).every(Number.isFinite));
 assert.equal(readingLevel(tree,id,camera,1280,720).length,0);
});

test('authored breadcrumb labels stay separate from full titles and shared identities',()=>{
 const data=records();
 data[0].scope.navigation.short_title='Care home';
 data[1].scope.navigation.short_title='Finding the right fit';
 data[4].scope={navigation:{title:'An existing care offering',short_title:'Care offering'}};
 const root=navigationRoots(data)[0],situation=root.children[0],solution=situation.children[0];
 assert.equal(root.shortTitle,'Care home');assert.equal(root.title,'need title');
 assert.equal(situation.shortTitle,'Finding the right fit');assert.equal(situation.title,'situation title');
 assert.equal(solution.shortTitle,'Care offering');assert.equal(solution.title,'An existing care offering');
 assert.equal(solution.entry,root.children[1].children[0].entry);
 assert.equal(root.children[1].shortTitle,'situation title');
 assert.equal(root.id,'existing-route');
});

test('absent need and situation artwork preserves navigation for the temporary fallback',()=>{
 const data=records();delete data[0].scope.navigation.image;data[1].scope.navigation.image='';
 const root=navigationRoots(data)[0];
 assert.equal(root.image,undefined);assert.equal(root.children[0].image,'');
 assert.equal(root.children[0].children[0].entry.id,'same-solution');
 assert.equal(data[0].scope.navigation.image,undefined);
});
