// Canonical navigation metadata projects one needs tree; source records stay intact.
export function navigationRoots(records,lens=null){
 const byId=new Map(records.map(record=>[record.id,record]));
 const navigation=record=>record.scope?.navigation;
 const order=(a,b)=>(navigation(a)?.order??Infinity)-(navigation(b)?.order??Infinity)||a.id.localeCompare(b.id);
 const needs=records.filter(record=>navigation(record)?.role==='need').sort(order);
 if(!needs.length)throw Error('The needs hierarchy is not available yet. Existing research remains searchable.');
 const node=(entry,id,needId,viewKind)=>{
  const nav=navigation(entry);
  if(!nav.title||!nav.summary||!/^assets\/illustrations\/study\/[a-zA-Z0-9-]+\.png$/.test(nav.image||''))throw Error('The needs hierarchy has an incomplete illustration or description. Existing research remains searchable.');
  return {id,needId,viewKind,title:nav.title,description:nav.summary,image:nav.image,entry,study:true,kind:'territory'};
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
   const children=responses.map(({entry,edge})=>({id:path+'/'+entry.id,needId:id,title:entry.scope?.navigation?.title||entry.title,description:edge.statement||entry.summary,study:true,kind:'record',entry,relationship:edge,count:1}));
   return {...node(situation,path,id,'problem'),children,count:children.length};
  });
  return {...node(need,id,id,'need'),color:(nav.lenses||[]).includes('family')?'#e4d5c8':'#cbdcc5',themes:[],muted:!!lens&&!(nav.affected_lenses||nav.lenses||[]).includes(lens),children,count:children.length};
 });
}
