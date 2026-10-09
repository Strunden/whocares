import test from 'node:test';
import assert from 'node:assert/strict';
import {auditAtlas} from '../scripts/audit-atlas-completeness.mjs';
test('coverage counts unique offerings separately from placements and exposes missing media',()=>{
 const node=(id,role)=>({id,kind:role==='solution'?'solution':'problem',title:id,scope:{geography:'Germany',navigation:{role,title:id,short_title:id,summary:'Context',image:'assets/illustrations/study/test.png'}}});
 const edge=(id,from_id,to_id,relation)=>({id,from_id,to_id,relation,statement:'Scoped fit',provenance:{navigation:true}});
 const graph={objects:[node('n','need'),node('a','situation'),node('b','situation'),node('s','solution')],relationships:[edge('p1','a','n','context_for'),edge('p2','b','n','context_for'),edge('r1','s','a','responds_to'),edge('r2','s','b','responds_to')],sources:[],evidence_links:[]};
 const result=auditAtlas({catalog:{entries:[]},graph,media:[]});
 assert.equal(result.uniqueMappedRecords,4);assert.equal(result.counts.solution,1);assert.equal(result.solutionPlacements,2);
 assert.ok(result.gaps.find(g=>g.id==='s').missing.includes('product/service visual'));
 assert.ok(result.gaps.find(g=>g.id==='s').missing.includes('provider'));
 assert.equal(result.relationshipGaps.length,2);
});
