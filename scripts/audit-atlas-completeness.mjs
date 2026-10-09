import {graphRecords} from '../site/js/atlas-records.js';
import {navigationRoots} from '../site/js/atlas-needs.js';
import {reviewedMedia} from '../site/js/atlas-media.js';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Completeness inventory, not factual approval or an opportunity score.
export function auditAtlas(data){
 const records=graphRecords(data.graph,data.catalog.entries),roots=navigationRoots(records);
 const ids=new Set(),edges=new Map();let placements=0;
 const visit=n=>{ids.add(n.entry.id);if(n.relationship){edges.set(n.relationship.id,n.relationship);placements++;}(n.children||[]).forEach(visit);};roots.forEach(visit);
 const counts={need:0,situation:0,solution:0},gaps=[],unknowns=[];
 const present=v=>typeof v==='string'?!!v.trim():v&&typeof v==='object'&&Object.keys(v).length>0;
 for(const e of records.filter(e=>ids.has(e.id))){
  const nav=e.scope.navigation,missing=[];counts[nav.role]++;
  for(const field of ['title','short_title','summary'])if(!present(nav[field]))missing.push(field);
  if(!e.sources.some(s=>s.url&&s.reviewed_at))missing.push('reviewed source link');
  if(!present(e.scope.geography))missing.push('geography');
  if(nav.role==='solution'){
   for(const field of ['provider','website','eligibility','cost','limitations']){
    if(!present(e.scope[field]))missing.push(field);
    else if(/unknown|not (?:checked|verified|established)|unverified/i.test(JSON.stringify(e.scope[field])))unknowns.push({id:e.id,field});
   }
   const media=reviewedMedia(e,data.media,{internal:true});
   if(!media.some(m=>m.media_role==='logo')&&!e.logo)missing.push('logo reference');
   if(!media.some(m=>m.media_role!=='logo'))missing.push('product/service visual');
  }else if(!nav.image)missing.push('illustration');
  if(missing.length)gaps.push({id:e.id,title:nav.title,missing});
 }
 const relationshipGaps=[...edges.values()].filter(e=>!e.statement||!e.evidence?.some(s=>s.url&&s.reviewed_at)).map(e=>({id:e.id,missing:'fit statement or reviewed relationship source'}));
 return {uniqueMappedRecords:ids.size,counts,solutionPlacements:placements,gaps,relationshipGaps,explicitUnknowns:unknowns,
  limits:'Presence checks only: source meaning, recency, image loading, visual fit, duplicate semantics and unmet need require review. No items admitted by this report.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(!process.argv[2])throw Error('Supply a saved discovery response for audit, outside the website');
 console.log(JSON.stringify(auditAtlas(JSON.parse(await readFile(process.argv[2],'utf8'))),null,2));
}
