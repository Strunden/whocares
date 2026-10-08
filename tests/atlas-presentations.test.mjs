import test from 'node:test';
import assert from 'node:assert/strict';
import {canonical,presentationDependencies,presentationFor} from '../site/js/atlas-presentations.js';
import {createHash} from 'node:crypto';
const fixture=()=>({objects:[{id:'p',title:'Original assertion',statement:'Original scope'}],relationships:[{id:'r',from_id:'p',to_id:'s',statement:'Interpretation'}],evidence_links:[{id:'e',object_id:'p',source_id:'src',excerpt:'Quote'}],sources:[{id:'src',title:'Study',limitations:'Small sample'}]});
function reviewed(g){const dependencies=presentationDependencies(g,'p');g.object_presentations=[{object_id:'p',locale:'en',display_title:'Short title',orientation_summary:'Scoped summary',review_state:'reviewed',reviewed_by:'Codex',reviewed_at:'2026-10-08',review_basis_sha256:createHash('sha256').update(canonical(dependencies)).digest('hex'),provenance:{dependencies}}];return g;}
test('current copy applies; changed evidence, source methods, edges or assertion invalidate it',()=>{
 for(const [table,key,value] of [['objects','statement','New fact'],['relationships','statement','Stronger causal claim'],['evidence_links','excerpt','Different quote'],['sources','limitations','Unknown sample']]){
  const g=reviewed(fixture());assert.equal(presentationFor(g,g.objects[0]).title,'Short title');g[table][0][key]=value;
  assert.equal(presentationFor(g,g.objects[0]).state,'stale');assert.equal(presentationFor(g,g.objects[0]).title,'Original assertion');
 }
 const g=reviewed(fixture());g.relationships.push({id:'new',from_id:'p',to_id:'x'});assert.equal(presentationFor(g,g.objects[0]).state,'stale');
});
test('missing or unreviewed copy falls back without changing epistemic status',()=>{
 const g=fixture();assert.equal(presentationFor(g,g.objects[0]).state,'missing');reviewed(g);g.object_presentations[0].review_state='draft';assert.equal(presentationFor(g,g.objects[0]).state,'missing');
});
