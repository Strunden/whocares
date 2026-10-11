import test from 'node:test';
import assert from 'node:assert/strict';
import {columnSelection,columnScene} from '../site/js/atlas-columns.js';
const offer={id:'family-need/situation/shared-offer',entry:{id:'shared-offer'}};
const situation={id:'family-need/situation',children:[offer]};
const family={id:'family-need',entry:{scope:{navigation:{lenses:['family']}}},children:[situation]};
const adult={id:'adult-need',entry:{scope:{navigation:{lenses:['adult']}}},children:[]};
test('scene presentation requires explicit illustrative status and leaves graph identities unchanged',()=>{
 const scene={status:'illustrative',title:'Taking on care',question:'How might we clarify responsibilities?',points:{situation:'No clear first contact'}};
 const need={...family,entry:{scope:{navigation:{scene}}}};
 assert.equal(columnScene(need),scene);
 assert.equal(columnScene(family),null);
 assert.equal(columnScene({...need,entry:{scope:{navigation:{scene:{...scene,status:'documented'}}}}}),null);
 assert.equal(columnSelection([need],situation.id).situation,situation);
});
test('selected path keeps parent, siblings and shared offering identity visible',()=>{
 const state=columnSelection([adult,family],situation.id,'family');
 assert.deepEqual(state.needs,[family]);assert.equal(state.need,family);assert.equal(state.situation,situation);assert.deepEqual(state.solutions,[offer]);
 assert.equal(columnSelection([adult,family],offer.id,'family').solutions[0].entry.id,'shared-offer');
});
test('unselected and empty branches remain research gaps without inventing children',()=>{
 assert.deepEqual(columnSelection([adult,family],null).situations,[]);
 assert.deepEqual(columnSelection([adult,family],adult.id,'adult').solutions,[]);
 assert.equal(columnSelection([adult,family],'removed-id').need,null);
});
test('a cross-perspective deep link retains its selected parent and refreshed children',()=>{
 assert.deepEqual(columnSelection([adult,family],situation.id,'adult').needs,[adult,family]);
 const updated={...family,children:[{...situation,children:[offer,{id:'another-offer',entry:{id:'another-offer'}}]}]};
 assert.equal(columnSelection([updated],situation.id,'family').solutions.length,2);
});
test('an affected organisation does not make a worker-voiced need an organisation need',()=>{
 const worker={id:'worker-need',overviewGroup:{icp:'professional-caregiver'},entry:{scope:{navigation:{lenses:['worker','provider']}}},children:[]};
 const manager={id:'manager-need',overviewGroup:{icp:'care-management'},entry:{scope:{navigation:{lenses:['provider']}}},children:[]};
 assert.deepEqual(columnSelection([worker,manager],null,'provider').needs,[manager]);
 assert.deepEqual(columnSelection([worker,manager],null,'worker').needs,[worker]);
 assert.deepEqual(columnSelection([worker,manager],worker.id,'provider').needs,[worker,manager]);
});
