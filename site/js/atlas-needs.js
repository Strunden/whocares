// Canonical navigation metadata projects one needs tree; source records stay intact.
export function navigationRoots(records,lens=null){
 const byId=new Map(records.map(record=>[record.id,record]));
 const navigation=record=>record.scope?.navigation;
 const order=(a,b)=>(navigation(a)?.order??Infinity)-(navigation(b)?.order??Infinity)||a.id.localeCompare(b.id);
 const perspectives={adult:'Older adult',family:'Family carer',worker:'Care worker',provider:'Care manager'};
 const icpLens={'older-adult':'adult','family-carer':'family','professional-caregiver':'worker','care-management':'provider'};
 const lenses=record=>{const nav=navigation(record),planned=(record.scope?.research_planning?.affected_icps||[]).map(icp=>icpLens[icp]);return [...new Set((nav?.lenses?.length?nav.lenses:planned).filter(key=>perspectives[key]))];};
 const groupOrder=record=>{const primary=lenses(record)[0];return primary?Object.keys(perspectives).indexOf(primary):4;};
 const needs=records.filter(record=>navigation(record)?.role==='need').sort((a,b)=>groupOrder(a)-groupOrder(b)||(navigation(a)?.overview_group?.order??Infinity)-(navigation(b)?.overview_group?.order??Infinity)||order(a,b));
 if(!needs.length)throw Error('The needs hierarchy is not available yet. Existing research remains searchable.');
 const node=(entry,id,needId,viewKind,inherited=[])=>{
  const nav=navigation(entry),ownLenses=lenses(entry);
  if(!nav.title||!nav.summary||(nav.image&&!/^assets\/illustrations\/study\/[a-zA-Z0-9-]+\.png$/.test(nav.image)))throw Error('The needs hierarchy has an incomplete description or unsafe illustration path. Existing research remains searchable.');
  return {id,needId,viewKind,title:nav.title,shortTitle:nav.short_title||nav.title,description:nav.summary,image:nav.image,perspectiveLabel:(ownLenses.length?ownLenses:inherited).map(key=>perspectives[key]).join(' · '),entry,study:true,kind:'territory'};
 };
 return needs.map(need=>{
  const nav=navigation(need),id=nav.view_id||need.id;
  const situations=need.links.filter(edge=>edge.to_id===need.id&&edge.relation==='context_for'&&edge.provenance?.navigation===true)
   .map(edge=>byId.get(edge.from_id)).filter(record=>navigation(record)?.role==='situation').sort(order);
  const children=situations.map(situation=>{
   const path=id+'/'+(navigation(situation).view_id||situation.id);
   const seen=new Set();
   const responses=situation.links.filter(edge=>edge.to_id===situation.id&&['responds_to','addresses'].includes(edge.relation)&&edge.provenance?.navigation===true)
    .map(edge=>({entry:byId.get(edge.from_id),edge})).filter(({entry})=>entry&&['solution','institutional_response'].includes(entry.kind))
    .filter(({entry})=>{if(seen.has(entry.id))return false;seen.add(entry.id);return true;});
   const children=responses.map(({entry,edge})=>({id:path+'/'+entry.id,needId:id,title:entry.scope?.navigation?.title||entry.title,shortTitle:entry.scope?.navigation?.short_title||entry.scope?.navigation?.title||entry.title,description:edge.statement||entry.summary,study:true,kind:'record',entry,relationship:edge,count:1}));
   return {...node(situation,path,id,'problem',lenses(need)),children,count:children.length};
  });
  return {...node(need,id,id,'need'),overviewGroup:nav.overview_group,color:(nav.lenses||[]).includes('family')?'#e4d5c8':'#cbdcc5',themes:[],muted:!!lens&&!(nav.affected_lenses||nav.lenses||[]).includes(lens),children,count:children.length};
 });
}
