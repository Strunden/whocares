// Export only the reviewed internal database projection; never promote drafts or
// leak historical venture scores into the user-facing record.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const fields=['id','name','title','type','themes','tag','tag_secondary','summary','job','scene','who_pays','who_sells','related','added_date','logo','website','country','city','media','deep_dive','writeup','facts','product_type','target_markets'];
export function projectCatalog(rows){
 const ids=new Set(),entries=[];
 for(const row of rows){
  if(ids.has(row.id))throw new Error('Duplicate catalog identity: '+row.id);ids.add(row.id);
  if(!row.visible)continue;
  if(!row.review_id||!row.review_current||!['retain','correct'].includes(row.decision))throw new Error('Unreviewed or stale catalog export: '+row.id);
  const d=row.document;
  if(!d||d.id!==row.id||d.type!=='company'||d.published===false||row.id.startsWith('funding-rule-'))throw new Error('Invalid offering projection: '+row.id);
  const entry=Object.fromEntries(fields.filter(f=>d[f]!==undefined).map(f=>[f,structuredClone(d[f])]));
  // Deep dives retain source facts and gaps, never legacy kill/standing decisions.
  if(entry.deep_dive){entry.deep_dive=Object.fromEntries(['product','buyer','payer','sources','risks','open_questions','note'].filter(k=>entry.deep_dive[k]!==undefined).map(k=>[k,entry.deep_dive[k]]));}
  entry.published=true;
  entry.catalog_review={id:row.review_id,decision:row.decision,scope:'Structural screening and targeted corrections; not full claim verification'};
  entries.push(entry);
 }
 const active=new Set(entries.map(e=>e.id));
 for(const e of entries)e.related=(e.related||[]).filter(id=>active.has(id));
 return {version:2,origin:'atlas.catalog_read_model',entries};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw new Error('Expected database projection JSON and output JSON');
 const result=projectCatalog(JSON.parse(await readFile(input,'utf8')));
 const tmp=output+'.tmp';await writeFile(tmp,JSON.stringify(result));await rename(tmp,output);
 console.log('Exported '+result.entries.length+' active catalog records.');
}
