// Authoritative catalog projection. The same rules apply to every API view.
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
 return {schema_version:2,version:2,title:'Who Cares',origin:'atlas.catalog_read_model',counts:{total:entries.length,companies:entries.length,ideas:0},entries};
}
