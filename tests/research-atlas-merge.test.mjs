import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {mergeResearchAtlas} from '../scripts/merge-research-atlas.mjs';
import {graphRecords,graphRoots,recordStatus} from '../site/js/atlas-records.js';

const baseline=JSON.parse(await readFile(new URL('../site/data/atlas/graph.json',import.meta.url),'utf8'));
const principleSha256=baseline.snapshot.principle_sha256;
const options={principleSha256};
const provenance={batch:'reviewed-research-fixture',authored_by:'Test reviewer'};
const confidence={basis:'single_source',rationale:'Scoped evidence from the fixture survey; no population extrapolation.'};
function research(){
 return {
  snapshot:{as_of:'2026-10-09T12:00:00Z',origin:'Supervised research fixture',principle_sha256:principleSha256,
   review:{status:'approved',reviewed_by:'Test reviewer',reviewed_at:'2026-10-09T12:00:00Z',principle_sha256:principleSha256}},
  objects:[
   {id:'space-research-relief-access',kind:'problem_space',title:'Accessing caregiver relief',statement:'An editorial grouping of scoped relief-access findings.',scope:{geography:'Germany',limitations:'Incomplete coverage'},epistemic_status:'interpretation',confidence,provenance,revision:1},
   {id:'finding-research-transport',kind:'problem',title:'Reported transport barriers',statement:'Interview participants described transport barriers.',scope:{geography:'Germany',population:'Interview participants',limitations:'Not a prevalence estimate'},epistemic_status:'documented',confidence,provenance,revision:1}
  ],
  relationships:[{id:'rel-research-transport-space',from_id:'finding-research-transport',to_id:'space-research-relief-access',relation:'part_of',statement:'Editorial membership based on the described relief-access friction.',epistemic_status:'interpretation',confidence:{basis:'not_applicable',rationale:'Editorial grouping, not a causal finding.'},provenance,revision:1}],
  sources:[{id:'source-research-interviews',title:'Caregiver interviews',locator:'https://example.org/interviews',publisher:'Fixture study',source_kind:'primary_research',published_date:'2025-10-01',accessed_date:'2026-10-09',scope:'Participants in the study',limitations:'Sample-specific findings',provenance}],
  evidence_links:[{id:'evidence-research-transport',object_id:'finding-research-transport',relationship_id:null,source_id:'source-research-interviews',stance:'supports',locator:'Results: transport',excerpt:'Participants described transport barriers.',note:'Attributed qualitative finding.',reviewed_at:'2026-10-09T11:00:00Z',provenance}]
 };
}

test('merge preserves every existing row and surfaces findings in the existing map and detail records',()=>{
 const before=structuredClone(baseline),patch=research();
 const {graph,report}=mergeResearchAtlas(baseline,patch,options);
 assert.ok(baseline.objects.length>=17);assert.ok(baseline.relationships.length>=13);
 for(const table of ['objects','relationships','sources','evidence_links']){
  assert.deepEqual(graph[table].slice(0,baseline[table].length),baseline[table]);
 }
 assert.deepEqual(baseline,before);
 assert.equal(report.totals.objects,baseline.objects.length+2);assert.equal(report.totals.relationships,baseline.relationships.length+1);
 assert.equal(report.database_writes,false);assert.equal(report.published,false);
 const records=graphRecords(graph,[]),roots=graphRoots(records);
 const space=roots.find(row=>row.id==='space-research-relief-access');
 assert.equal(space.children[0].entry.id,'finding-research-transport');
 const finding=records.find(row=>row.id==='finding-research-transport');
 assert.equal(recordStatus(finding),'Documented claim');
 assert.equal(finding.sources[0].excerpt,'Participants described transport barriers.');
 assert.equal(finding.scope.limitations,'Not a prevalence estimate');
 assert.ok(roots.some(row=>row.id==='space-everyday-participation'));
});

test('same export is idempotent, including snapshot import metadata',()=>{
 const patch=research(),first=mergeResearchAtlas(baseline,patch,options);
 const second=mergeResearchAtlas(first.graph,patch,options);
 assert.deepEqual(second.graph,first.graph);
 assert.deepEqual(second.report.added,{objects:0,relationships:0,sources:0,evidence_links:0});
 assert.equal(second.graph.snapshot.research_imports.length,(baseline.snapshot.research_imports||[]).length+1);
});

test('database write timestamps do not break replay, while assertion revisions still do',()=>{
 const patch=research(),first=mergeResearchAtlas(baseline,patch,options);
 first.graph.objects.find(o=>o.id===patch.objects[0].id).created_at='2026-10-09T12:01:00Z';
 assert.deepEqual(mergeResearchAtlas(first.graph,patch,options).graph,first.graph);
 patch.objects[0].revision=2;
 assert.throws(()=>mergeResearchAtlas(first.graph,patch,options),/Conflicting objects/);
});

test('institutional context appears beside problems without inventing part_of membership',()=>{
 const patch=research();
 patch.objects.push({...patch.objects[0],id:'response-research-support',kind:'institutional_response',title:'Proposed support response',
  statement:'An institutional response to investigate.',epistemic_status:'candidate'});
 patch.relationships.push({...patch.relationships[0],id:'rel-response-context',from_id:'response-research-support',relation:'context_for',
  statement:'This proposed response provides context for the bounded space.'});
 const {graph}=mergeResearchAtlas(baseline,patch,options);
 const root=graphRoots(graphRecords(graph,[])).find(value=>value.id==='space-research-relief-access');
 const context=root.children.find(value=>value.entry.id==='response-research-support');
 assert.equal(context.kind,'record');
 assert.equal(context.entry.kind,'institutional_response');
 assert.equal(context.relationship.relation,'context_for');
 assert.equal(root.children.find(value=>value.entry.id==='finding-research-transport').kind,'topic');
 patch.relationships[1].relation='part_of';
 assert.throws(()=>mergeResearchAtlas(baseline,patch,options),/Invalid part_of kinds/);
});

test('existing identities cannot be overwritten even by an approved export',()=>{
 const patch=research();
 patch.objects.push({...baseline.objects[0],statement:'A replacement assertion'});
 assert.throws(()=>mergeResearchAtlas(baseline,patch,options),/Conflicting objects identity/);
});

test('partial export can reference existing stakeholder identities without copying or replacing them',()=>{
 const patch=research(),stakeholder=baseline.objects.find(row=>row.kind==='stakeholder');
 patch.referenced_objects=[{id:stakeholder.id,kind:stakeholder.kind}];
 patch.relationships.push({...patch.relationships[0],id:'rel-research-existing-stakeholder',to_id:stakeholder.id,relation:'affects',statement:'A scoped interpreted connection to this stakeholder.'});
 const {graph}=mergeResearchAtlas(baseline,patch,options);
 assert.equal(graph.objects.filter(row=>row.id===stakeholder.id).length,1);
 assert.deepEqual(graph.objects.find(row=>row.id===stakeholder.id),stakeholder);
 patch.referenced_objects[0].kind='solution';
 assert.throws(()=>mergeResearchAtlas(baseline,patch,options),/mismatched referenced object/);
});

test('principles and explicit editorial approval are mandatory',()=>{
 assert.throws(()=>mergeResearchAtlas(baseline,research()),/current principles SHA/);
 const mismatch=research();mismatch.snapshot.principle_sha256='0'.repeat(64);
 assert.throws(()=>mergeResearchAtlas(baseline,mismatch,options),/principles hash/);
 const unreviewed=research();delete unreviewed.snapshot.review;
 assert.throws(()=>mergeResearchAtlas(baseline,unreviewed,options),/approved editorial review/);
 const reviewMismatch=research();reviewMismatch.snapshot.review.principle_sha256='0'.repeat(64);
 assert.throws(()=>mergeResearchAtlas(baseline,reviewMismatch,options),/Editorial review principles hash/);
});

test('dangling references, duplicate relationships, and evidence with two owners are rejected',()=>{
 const dangling=research();dangling.relationships[0].to_id='absent';
 assert.throws(()=>mergeResearchAtlas(baseline,dangling,options),/Dangling relationship/);
 const duplicate=research();duplicate.relationships.push({...duplicate.relationships[0],id:'another-id'});
 assert.throws(()=>mergeResearchAtlas(baseline,duplicate,options),/Duplicate relationship identity/);
 const ambiguous=research();ambiguous.evidence_links[0].relationship_id=ambiguous.relationships[0].id;
 assert.throws(()=>mergeResearchAtlas(baseline,ambiguous,options),/exactly one/);
 const unknownSource=research();unknownSource.evidence_links[0].source_id='missing-source';
 assert.throws(()=>mergeResearchAtlas(baseline,unknownSource,options),/Dangling evidence/);
});

test('documented status needs reviewed research support, and truncated exports are refused',()=>{
 const unsupported=research();unsupported.evidence_links=[];
 assert.throws(()=>mergeResearchAtlas(baseline,unsupported,options),/lacks reviewed supporting research/);
 const policyOnly=research();policyOnly.sources[0].source_kind='product_direction';
 assert.throws(()=>mergeResearchAtlas(baseline,policyOnly,options),/lacks reviewed supporting research/);
 const truncated=research();truncated.snapshot.truncated=true;
 assert.throws(()=>mergeResearchAtlas(baseline,truncated,options),/truncated/);
});

test('CLI writes only an explicitly requested merged artifact',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'whocares-merge-'));
 try{
  const base=join(directory,'base.json'),input=join(directory,'research.json'),out=join(directory,'merged.json');
  await writeFile(base,JSON.stringify(baseline));await writeFile(input,JSON.stringify(research()));
  const stdout=execFileSync(process.execPath,[new URL('../scripts/merge-research-atlas.mjs',import.meta.url).pathname,
   '--base',base,'--research',input,'--out',out,'--principles-sha256',principleSha256],{encoding:'utf8'});
  assert.equal(JSON.parse(stdout).totals.objects,baseline.objects.length+2);
  assert.equal(JSON.parse(await readFile(out,'utf8')).relationships.length,baseline.relationships.length+1);
  assert.deepEqual(JSON.parse(await readFile(base,'utf8')),baseline);
 }finally{await rm(directory,{recursive:true,force:true});}
});
