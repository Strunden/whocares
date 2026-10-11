import postgres from '../workers/api/node_modules/postgres/src/index.js';
import {queryDiscovery} from '../workers/api/src/discovery.js';
import {graphRecords} from '../site/js/atlas-records.js';
import {navigationRoots} from '../site/js/atlas-needs.js';
import {auditAtlas} from './audit-atlas-completeness.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

// Inventory describes captured coverage; it never estimates completeness or opportunity value.
const sql=postgres(process.env.DATABASE_URL,{max:1});
const output=new URL('../research-staging/coverage-shape-20261011/',import.meta.url);
try{
 const principles=(await sql`SELECT key,version,canonical_sha256 FROM atlas.current_principles WHERE key='who-cares-product'`)[0];
 assert.equal(principles.canonical_sha256,'1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2');
 const graph=await queryDiscovery({simpleQuery:q=>sql.unsafe(q)},{internalMedia:true});
 const records=graphRecords(graph.graph,graph.catalog.entries),roots=navigationRoots(records);
 const needs=roots.map(n=>n.entry),situations=[...new Map(roots.flatMap(n=>n.children.map(s=>[s.entry.id,s.entry]))).values()];
 const offerings=[...new Map(roots.flatMap(n=>n.children.flatMap(s=>s.children.map(o=>[o.entry.id,o.entry])))).values()];
 const mapped=new Set([...needs,...situations,...offerings].map(x=>x.id));
 assert.equal(mapped.size,auditAtlas(graph).uniqueMappedRecords);
 const humanIds=new Set([...needs,...situations].map(x=>x.id));
 const sources=new Map(graph.graph.sources.map(s=>[s.id,s]));
 const humanEdges=graph.graph.relationships.filter(e=>humanIds.has(e.from_id)&&humanIds.has(e.to_id));
 const crossEdges=humanEdges.filter(e=>e.provenance?.navigation!==true);
 const objectLinks=graph.graph.evidence_links.filter(e=>humanIds.has(e.object_id));
 const byObject=new Map();for(const e of objectLinks){if(!byObject.has(e.object_id))byObject.set(e.object_id,[]);byObject.get(e.object_id).push(e);}
 const histogram=values=>Object.fromEntries([...new Set(values)].sort().map(v=>[v,values.filter(x=>x===v).length]));
 const groups=new Map();
 for(const need of roots){
  const g=need.overviewGroup,key=(g?.icp||'unassigned')+':'+(g?.id||'unassigned');
  if(!groups.has(key))groups.set(key,{id:key,icp:g?.icp,label:g?.label||'Unassigned',editorial:g?.editorial===true,needs:[]});
  groups.get(key).needs.push({id:need.entry.id,title:need.title,status:need.entry.epistemic_status,directEvidenceLinks:byObject.get(need.entry.id)?.length||0,situations:need.children.map(s=>({id:s.entry.id,title:s.title,status:s.entry.epistemic_status,directEvidenceLinks:byObject.get(s.entry.id)?.length||0,offeringIds:s.children.map(o=>o.entry.id)}))});
 }
 const status=items=>histogram(items.map(x=>x.epistemic_status||'unknown'));
 const report={capturedAt:new Date().toISOString(),principles,canonicalWrites:0,completenessProven:false,
  counts:{mapped:mapped.size,needs:needs.length,situations:situations.length,offerings:offerings.length},
  statuses:{needs:status(needs),situations:status(situations),offerings:status(offerings)},
  directHumanEvidence:{objectsWithLinks:[...byObject.keys()].length,needsWithLinks:needs.filter(n=>byObject.has(n.id)).length,situationsWithLinks:situations.filter(s=>byObject.has(s.id)).length,links:objectLinks.length,sourceKinds:histogram(objectLinks.map(e=>sources.get(e.source_id)?.source_kind||'unspecified'))},
  structure:{childrenPerNeed:histogram(roots.map(n=>n.children.length)),situationsWithoutOfferings:roots.flatMap(n=>n.children).filter(s=>!s.children.length).length,humanCrossRelationships:crossEdges.length,crossRelationshipTypes:histogram(crossEdges.map(e=>e.relation))},
  media:{needsWithoutAuthoredIllustration:needs.filter(n=>!n.scope.navigation.image).length,situationsWithoutAuthoredIllustration:situations.filter(s=>!s.scope.navigation.image).length,generationPaused:true},
  limitations:['Direct evidence links are not proof that each claim is supported; source and excerpt review remains necessary.','Provider evidence attached to offerings is not counted as human evidence.','Group assignment and five children do not establish exhaustive coverage.','No population prevalence, significance weight or market gap is inferred.','Media inventory checks metadata only, not file existence or visual suitability.'],groups:[...groups.values()]};
 await mkdir(output,{recursive:true});await writeFile(new URL('audit.json',output),JSON.stringify(report,null,2));
 const rows=report.groups.map(g=>{const ss=g.needs.flatMap(n=>n.situations);return `| ${g.icp||'Unassigned'} | ${g.label} | ${g.needs.length} | ${ss.length} | ${g.needs.filter(n=>n.directEvidenceLinks).length} | ${ss.filter(s=>s.directEvidenceLinks).length} | ${ss.filter(s=>!s.offeringIds.length).length} |`;});
 await writeFile(new URL('audit.md',output),`# Current atlas coverage inventory\n\nCaptured ${report.capturedAt}. Read-only database audit; no completeness or importance score.\n\n${JSON.stringify({...report,groups:undefined},null,2)}\n\n| ICP | Editorial area | Needs | Situations | Needs with direct evidence | Situations with direct evidence | Situations without offerings |\n|---|---|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n`);
 console.log(JSON.stringify({...report,groups:undefined,groupCount:report.groups.length}));
}finally{await sql.end();}
