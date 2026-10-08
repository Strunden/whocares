import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelGesture,touchIntent} from '../site/js/atlas-gestures.js';

test('pinch takes over pan immediately, then holds its anchor and rejects pan inertia',()=>{
 const first=wheelGesture(null,{now:0,zoom:false,anchor:{x:10,y:20}});
 const mixed=wheelGesture(first,{now:30,zoom:true,anchor:{x:300,y:400}});
 assert.equal(mixed.mode,'zoom');assert.equal(mixed.accept,true);assert.deepEqual(mixed.anchor,{x:300,y:400});
 const pinch=wheelGesture(mixed,{now:250,zoom:true,anchor:{x:300,y:400}});
 assert.equal(pinch.mode,'zoom');assert.equal(pinch.accept,true);
 const drift=wheelGesture(pinch,{now:280,zoom:true,anchor:{x:310,y:430}});
 assert.deepEqual(drift.anchor,{x:300,y:400});
 const tail=wheelGesture(drift,{now:300,zoom:false,anchor:{x:310,y:430}});
 assert.equal(tail.accept,false);assert.equal(tail.mode,'zoom');assert.equal(tail.last,280);
 const nextPan=wheelGesture(tail,{now:470,zoom:false,anchor:{x:0,y:0}});assert.equal(nextPan.mode,'pan');assert.equal(nextPan.accept,true);
});
test('touch waits through jitter and asynchronous pointer updates, then locks pan or zoom',()=>{
 const start=[{x:100,y:100},{x:200,y:100}];
 assert.equal(touchIntent(start,[{x:101,y:101},{x:199,y:100}]),null);
 assert.equal(touchIntent(start,[{x:120,y:100},{x:200,y:100}]),null);
 const pan=[{x:120,y:100},{x:220,y:100}];
 const pinch=[{x:80,y:100},{x:220,y:100}];
 assert.equal(touchIntent(start,pan),'pan');
 assert.equal(touchIntent(start,pinch),'zoom');
 assert.equal(touchIntent(start,pinch,'pan'),'pan');
 assert.equal(touchIntent(start,pan,'zoom'),'zoom');
});

test('stationary-finger pinch resolves after ambiguity window without changing a pan lock',()=>{
 const start=[{x:0,y:0},{x:100,y:0}],anchored=[{x:0,y:0},{x:140,y:0}];
 assert.equal(touchIntent(start,anchored,null,30),null);
 assert.equal(touchIntent(start,anchored,null,65),'zoom');
 assert.equal(touchIntent(start,anchored,'pan',100),'pan');
});
