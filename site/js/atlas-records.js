import {presentationFor} from './atlas-presentations.js';
import {productLogoFor} from './atlas-media.js';
// Presentation contracts shared by every lens. No evidence or taxonomy is inferred here.
export const kindLabels={problem_space:'Problem space',problem:'Problem',daily_situation:'Situation',lived_workaround:'Workaround',systemic_cause:'Mechanism',institutional_response:'Institutional response',solution:'Existing response',open_question:'Open question',aspiration:'Aspiration',stakeholder:'Stakeholder'};
export const evidenceLabels={documented:'Documented claim',interpretation:'Interpretation',candidate:'Research candidate',hypothesis:'Hypothesis',illustrative:'Illustrative · not observed',open_question:'Open question',normative:'Product direction',reference:'Reference'};
export function scopeDescription(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return value;
 return Object.entries(value).map(([key,text])=>key==='status'?String(text).replaceAll('_',' '):text).join(' · ');
}
export function graphRecords(graph,legacy){
 const excluded=new Set((graph.content_reviews||[]).filter(r=>r.record_table==='objects'&&['hold','archive','reclassify'].includes(r.decision)).map(r=>r.record_id));
 const sources=new Map(graph.sources.map(s=>[s.id,s])),companies=new Map(legacy.map(e=>[e.id,e]));
 const objectEvidence=new Map(),relationshipEvidence=new Map(),adjacency=new Map();
 const push=(map,id,value)=>{if(!map.has(id))map.set(id,[]);map.get(id).push(value);};
 for(const e of graph.evidence_links){const source=sources.get(e.source_id);const item={...source,...e,url:source?.locator};if(e.object_id)push(objectEvidence,e.object_id,item);if(e.relationship_id)push(relationshipEvidence,e.relationship_id,item);}
 for(const r of graph.relationships){if(excluded.has(r.from_id)||excluded.has(r.to_id))continue;const edge={...r,evidence:relationshipEvidence.get(r.id)||[]};push(adjacency,r.from_id,edge);push(adjacency,r.to_id,edge);}
 return graph.objects.filter(o=>!excluded.has(o.id)).map(o=>{
  const company=companies.get(o.entry_id),presentation=presentationFor(graph,o);
  return {...o,assertion_title:o.title,title:presentation.title,presentation_state:presentation.state,type:'graph',graph:true,summary:presentation.summary,logo:company?.logo,website:company?.website,company_id:o.entry_id,buyer:company?.buyer,country:company?.country,user:company?.user,
   sources:objectEvidence.get(o.id)||[],links:adjacency.get(o.id)||[]};
 });
}

export function graphRoots(records){
 const byId=new Map(records.map(e=>[e.id,e]));
 const leaf=(e,id,relationship)=>({id,title:e.title,kind:'record',entry:e,count:1,relationship});
 return records.filter(e=>e.kind==='problem_space').map(space=>{
  const problems=space.links.filter(r=>r.to_id===space.id&&r.relation==='part_of').map(r=>byId.get(r.from_id)).filter(Boolean);
  const children=problems.map(p=>{
   const related=p.links.filter(r=>r.relation!=='part_of').map(r=>({e:byId.get(r.from_id===p.id?r.to_id:r.from_id),r})).filter(v=>v.e&&v.e.kind!=='stakeholder');
   return {id:space.id+'/'+p.id,title:p.title,kind:'topic',entry:p,count:related.length+1,children:related.map(({e,r})=>leaf(e,space.id+'/'+p.id+'/'+e.id,r))};
  });
  // Responses may explain a space through context_for without becoming problems
  // or claiming taxonomic part_of membership. Keep the real relationship intact.
  const members=new Set(children.map(child=>child.entry.id));
  children.push(...space.links.filter(r=>r.to_id===space.id&&r.relation==='context_for')
   .map(r=>({e:byId.get(r.from_id),r})).filter(({e})=>e&&!members.has(e.id))
   .map(({e,r})=>leaf(e,space.id+'/'+e.id,r)));
  children.push(...space.links.filter(r=>r.from_id===space.id&&r.relation==='raises_question').map(r=>byId.get(r.to_id)).filter(Boolean).map(e=>leaf(e,space.id+'/'+e.id)));
  return {id:space.id,title:space.title,kind:'territory',entry:space,graph:true,description:space.statement,question:'What is documented, what is proposed, and whose experience is missing?',color:'#c3d7ea',themes:[],children,count:children.reduce((n,c)=>n+c.count,1)};
 });
}
export function logoUrl(entry,apiBase=''){
 const src=String(productLogoFor(entry)?.src||entry.logo||'');
 if(/^https:\/\//.test(src))return src;
 if(!/^\/api\/logo\/[a-zA-Z0-9_-]+$/.test(src))return '';
 if(!apiBase)return src;
 try{
  const base=new URL(apiBase);
  if(base.username||base.password||base.search||base.hash)return '';
  if(base.protocol==='https:'||(base.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(base.hostname)))return base.href.replace(/\/$/,'')+src;
 }catch{}
 return '';
}
export function recordLabel(e){return e.graph?kindLabels[e.kind]||'Research':e.type==='company'?'Company':['thesis','thesis_card'].includes(e.idea_kind)?'Research hypothesis':'Legacy research theme';}
export function recordStatus(e){return e.graph?evidenceLabels[e.epistemic_status]||'Unreviewed':e.type==='company'?(e.catalog_review?.decision==='correct'?'Provider offering · outcomes unverified':e.catalog_review?'Existing research · claims need checking':'Offering · outcomes unverified'):'Analyst record · unvalidated';}
