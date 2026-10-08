import test from 'node:test';
import assert from 'node:assert/strict';
import {readingLevel} from '../site/js/atlas-layout.js';
import {createNativePan} from '../site/js/atlas-native-pan.js';
function harness(){
 let left=0,top=0,writes=0,observe;const seen=[],surface={style:{}};
 const map={addEventListener(name,callback,options){assert.equal(name,'scroll');assert.equal(options.passive,true);observe=callback;},get scrollLeft(){return left;},set scrollLeft(x){left=x;writes++;},get scrollTop(){return top;},set scrollTop(y){top=y;writes++;}};
 const pan=createNativePan(map,surface,c=>seen.push(c));
 return {pan,surface,seen,get writes(){return writes;},scroll(x,y){left=x;top=y;observe();}};
}
test('native scroll reads camera position without writing offsets or applying a second return',()=>{
 const h=harness();h.pan.setView({s:2,x:100,y:200},{minX:-300,maxX:500,minY:-100,maxY:300},800,600);
 assert.deepEqual(h.pan.read(),{s:2,x:100,y:200});assert.deepEqual(h.surface.style,{width:'1600px',height:'1000px'});
 const writes=h.writes;h.scroll(-40,-25);assert.deepEqual(h.seen.at(-1),{s:2,x:540,y:325});
 h.scroll(-20,-10);h.scroll(0,0);assert.deepEqual(h.seen.at(-1),{s:2,x:500,y:300});assert.equal(h.writes,writes);
});
test('zoom and resize commit the requested camera without drift; native content origin stays fixed during pan',()=>{
 const h=harness();for(const s of [.5,1,2]){
  const camera={s,x:-25,y:40};h.pan.setView(camera,{minX:-200,maxX:300,minY:-150,maxY:200},393,600);assert.deepEqual(h.pan.read(),camera);
  const origin={...h.pan.origin};h.scroll(130,90);assert.deepEqual(h.pan.origin,origin);
  assert.equal(h.pan.read().x+130,origin.x);assert.equal(h.pan.read().y+90,origin.y);
 }
});
test('single-item axes have no artificial travel and off-centre framing remains representable',()=>{
 const h=harness();h.pan.setView({s:1,x:200,y:100},{minX:200,maxX:200,minY:100,maxY:100},800,600);
 assert.deepEqual(h.surface.style,{width:'800px',height:'600px'});
 h.pan.setView({s:1,x:0,y:0},{minX:200,maxX:200,minY:100,maxY:100},800,600);assert.deepEqual(h.pan.read(),{s:1,x:0,y:0});
});

test('native scrolling can still reach later items in an unpaged scene larger than the render budget',()=>{
 const roots=Array.from({length:120},(_,i)=>({id:String(i),title:String(i),box:{x:i*400,y:0,w:350,h:220}}));
 const tree={roots,all:new Map(roots.map(n=>[n.id,n]))};
 const last=roots.at(-1),camera={s:1,x:400-last.box.x-175,y:190};
 const visible=readingLevel(tree,null,camera,800,600,{includeOffscreen:true});
 assert.ok(visible.some(n=>n.node===last));assert.ok(visible.length<=90);
});
