// Merge an editorially reviewed export into the existing atlas snapshot.
// No database calls, publication, source verification, or changes to company records.
import {createHash, randomUUID} from 'node:crypto';
import {readFile, writeFile, rename, unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const tables=['objects','relationships','sources','evidence_links'];
const kinds=new Set(['aspiration','stakeholder','problem_space','problem','daily_situation','lived_workaround','systemic_cause','institutional_response','solution','open_question']);
const statuses=new Set(['documented','interpretation','candidate','hypothesis','illustrative','open_question','normative','reference']);
const relations=new Set(['part_of','affects','aspires_to','arises_in','works_around','contributes_to','responds_to','addresses','raises_question','context_for','tension_with']);
const sourceKinds=new Set(['primary_research','institutional','provider_claim','field_observation','historical_record','product_direction']);
const stances=new Set(['supports','contradicts','context','origin']);
const bases=new Set(['not_assessed','single_source','corroborated','contested','not_applicable']);
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const canonical=value=>JSON.stringify(sortKeys(value));
function sortKeys(value){
 if(Array.isArray(value))return value.map(sortKeys);
 if(isObject(value))return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortKeys(value[key])]));
 return value;
}
function requireText(value,label){if(typeof value!=='string'||!value.trim())throw new Error(`${label} must be nonempty text`);}
function requireId(value,label){if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value))throw new Error(`${label} is not a stable identifier`);}
function requireDate(value,label){requireText(value,label);if(!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error(`${label} must be an ISO date or timestamp`);}
function requireEnum(value,allowed,label){if(!allowed.has(value))throw new Error(`Unsupported ${label}: ${value}`);}
function requireClaim(row,label){
 requireText(row.statement,`${label}.statement`);
 requireEnum(row.epistemic_status,statuses,`${label}.epistemic_status`);
 if(!isObject(row.confidence))throw new Error(`${label}.confidence must retain qualitative research basis`);
 requireEnum(row.confidence.basis,bases,`${label}.confidence.basis`);
 requireText(row.confidence.rationale,`${label}.confidence.rationale`);
 if(!isObject(row.provenance)||!Object.keys(row.provenance).length)throw new Error(`${label}.provenance is required`);
 if(!Number.isInteger(row.revision)||row.revision<1)throw new Error(`${label}.revision must be a positive integer`);
}
function validateRows(graph,label){
 if(!isObject(graph))throw new Error(`${label} must be an object`);
 if(graph.truncated===true||graph.snapshot?.truncated===true)throw new Error(`${label} is truncated; an incomplete export cannot establish a merge baseline`);
 for(const table of tables){
  if(!Array.isArray(graph[table]))throw new Error(`${label}.${table} must be an array`);
  const seen=new Set();
  for(const row of graph[table]){
   if(!isObject(row))throw new Error(`${label}.${table} contains a non-object row`);
   requireId(row.id,`${label}.${table}.id`);
   if(seen.has(row.id))throw new Error(`Duplicate ${table} identity ${row.id}`);
   seen.add(row.id);
   const at=`${label}.${table}.${row.id}`;
   if(table==='objects'){
    requireEnum(row.kind,kinds,`${at}.kind`);requireText(row.title,`${at}.title`);requireClaim(row,at);
    if(!isObject(row.scope))throw new Error(`${at}.scope must be an object; preserve unknowns explicitly`);
   }else if(table==='relationships'){
    requireId(row.from_id,`${at}.from_id`);requireId(row.to_id,`${at}.to_id`);
    requireEnum(row.relation,relations,`${at}.relation`);requireClaim(row,at);
   }else if(table==='sources'){
    requireText(row.title,`${at}.title`);requireText(row.locator,`${at}.locator`);
    requireEnum(row.source_kind,sourceKinds,`${at}.source_kind`);
    requireText(row.publisher,`${at}.publisher`);requireText(row.scope,`${at}.scope`);
    requireText(row.limitations,`${at}.limitations`);requireDate(row.accessed_date,`${at}.accessed_date`);
    if(row.published_date!=null)requireDate(row.published_date,`${at}.published_date`);
    if(!isObject(row.provenance))throw new Error(`${at}.provenance must be an object`);
   }else{
    requireId(row.source_id,`${at}.source_id`);requireEnum(row.stance,stances,`${at}.stance`);
    if(Boolean(row.object_id)===Boolean(row.relationship_id))throw new Error(`${at} must target exactly one object or relationship`);
    if(row.object_id)requireId(row.object_id,`${at}.object_id`);
    if(row.relationship_id)requireId(row.relationship_id,`${at}.relationship_id`);
    if(row.reviewed_at!=null)requireDate(row.reviewed_at,`${at}.reviewed_at`);
    if(!isObject(row.provenance))throw new Error(`${at}.provenance must be an object`);
   }
  }
 }
 if(!isObject(graph.snapshot))throw new Error(`${label}.snapshot is required`);
 requireDate(graph.snapshot.as_of,`${label}.snapshot.as_of`);
 requireText(graph.snapshot.origin,`${label}.snapshot.origin`);
}
function validateReferences(graph){
 const ids=Object.fromEntries(tables.map(table=>[table,new Set(graph[table].map(row=>row.id))]));
 const objects=new Map(graph.objects.map(row=>[row.id,row]));
 const endpoints=new Map();
 for(const row of graph.relationships){
  if(!ids.objects.has(row.from_id)||!ids.objects.has(row.to_id))throw new Error(`Dangling relationship ${row.id}`);
  if(row.relation==='part_of'&&(!['problem','problem_space'].includes(objects.get(row.from_id).kind)||objects.get(row.to_id).kind!=='problem_space'))throw new Error(`Invalid part_of kinds in ${row.id}; use actual scoped relationship semantics`);
  const identity=canonical([row.from_id,row.to_id,row.relation]);
  if(endpoints.has(identity))throw new Error(`Duplicate relationship identity ${row.id} conflicts with ${endpoints.get(identity)}`);
  endpoints.set(identity,row.id);
 }
 for(const row of graph.evidence_links){
  if(!ids.sources.has(row.source_id)||(row.object_id&&!ids.objects.has(row.object_id))||(row.relationship_id&&!ids.relationships.has(row.relationship_id)))throw new Error(`Dangling evidence ${row.id}`);
 }
 const sources=new Map(graph.sources.map(row=>[row.id,row]));
 for(const table of ['objects','relationships'])for(const claim of graph[table]){
  if(claim.epistemic_status!=='documented')continue;
  const field=table==='objects'?'object_id':'relationship_id';
  const supported=graph.evidence_links.some(link=>link[field]===claim.id&&link.stance==='supports'&&link.reviewed_at&&sources.get(link.source_id)?.source_kind!=='product_direction');
  if(!supported)throw new Error(`Documented ${table} ${claim.id} lacks reviewed supporting research evidence`);
 }
}

export function mergeResearchAtlas(base,research,{principleSha256}={}){
 if(typeof principleSha256!=='string'||!/^[a-f0-9]{64}$/.test(principleSha256))throw new Error('Provide the independently checked current principles SHA-256');
 validateRows(base,'base');validateRows(research,'research');
 for(const [label,graph] of [['base',base],['research',research]]){
  if(graph.snapshot.principle_sha256!==principleSha256)throw new Error(`${label} principles hash differs from current authority`);
 }
 const review=research.snapshot.review;
 if(!isObject(review)||review.status!=='approved')throw new Error('Research snapshot needs explicit approved editorial review metadata');
 requireText(review.reviewed_by,'review.reviewed_by');requireDate(review.reviewed_at,'review.reviewed_at');
 if(review.principle_sha256!==principleSha256)throw new Error('Editorial review principles hash differs from current authority');
 const existingObjects=new Map(base.objects.map(row=>[row.id,row]));
 if(research.referenced_objects!==undefined&&!Array.isArray(research.referenced_objects))throw new Error('referenced_objects must be an array');
 for(const reference of research.referenced_objects||[]){
  if(!isObject(reference))throw new Error('Referenced object must contain an existing identity');
  const existing=existingObjects.get(reference.id);
  if(!existing||(reference.kind&&reference.kind!==existing.kind))throw new Error(`Unknown or mismatched referenced object ${reference.id}`);
 }
 const graph=structuredClone(base),added={},unchanged={};
 for(const table of tables){
  const existing=new Map(graph[table].map(row=>[row.id,row]));
  added[table]=0;unchanged[table]=0;
  for(const row of research[table]){
   if(existing.has(row.id)){
    if(canonical(existing.get(row.id))!==canonical(row))throw new Error(`Conflicting ${table} identity ${row.id}; this merge never overwrites existing rows`);
    unchanged[table]++;continue;
   }
   graph[table].push(structuredClone(row));existing.set(row.id,row);added[table]++;
  }
 }
 validateReferences(graph);
 const fingerprint=createHash('sha256').update(canonical(Object.fromEntries(tables.map(table=>[table,[...research[table]].sort((a,b)=>a.id.localeCompare(b.id))])))).digest('hex');
 const imports=graph.snapshot.research_imports||[];
 if(!imports.some(item=>item.payload_sha256===fingerprint)){
  graph.snapshot.research_imports=[...imports,{payload_sha256:fingerprint,as_of:research.snapshot.as_of,
   origin:research.snapshot.origin,review:structuredClone(review),added}];
  if(Date.parse(research.snapshot.as_of)>Date.parse(graph.snapshot.as_of))graph.snapshot.as_of=research.snapshot.as_of;
 }
 const report={added,unchanged,totals:Object.fromEntries(tables.map(table=>[table,graph[table].length])),
  payload_sha256:fingerprint,principle_sha256:principleSha256,existing_rows_preserved:true,database_writes:false,published:false};
 return {graph,report};
}

async function main(args){
 const values={};
 for(let i=0;i<args.length;i+=2){
  if(!['--base','--research','--out','--principles-sha256'].includes(args[i])||!args[i+1]||values[args[i]])throw new Error('Usage: node scripts/merge-research-atlas.mjs --base existing.json --research approved-export.json --out merged.json --principles-sha256 CURRENT_HASH');
  values[args[i]]=args[i+1];
 }
 if(Object.keys(values).length!==4)throw new Error('Explicit --base, --research, --out and --principles-sha256 arguments are required');
 const base=JSON.parse(await readFile(resolve(values['--base']),'utf8'));
 const research=JSON.parse(await readFile(resolve(values['--research']),'utf8'));
 const {graph,report}=mergeResearchAtlas(base,research,{principleSha256:values['--principles-sha256']});
 const output=resolve(values['--out']),temporary=`${output}.tmp-${randomUUID()}`;
 try{await writeFile(temporary,JSON.stringify(graph,null,2)+'\n',{flag:'wx'});await rename(temporary,output);}
 finally{await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
 console.log(JSON.stringify({...report,output},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
