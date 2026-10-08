const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=value=>typeof value==='string'||typeof value==='number'?String(value):'';
function scopeFacts(scope){
 let parsed=scope;
 if(typeof scope==='string'){try{parsed=JSON.parse(scope);}catch{return scope?[['Scope',scope]]:[];}}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return [];
 return [['method','Method'],['sample','Sample'],['geography','Geography'],['perspective','Perspective']]
  .map(([key,label])=>[label,text(parsed[key])||'Not recorded']);
}

export function graphSourceBlock(list=[]){
 if(!list.length)return '<p class="evidence-note">No claim-level source attached. This is not established evidence.</p>';
 const groups=new Map();
 for(const s of list){const key=s.source_id||s.url||s.id||s.title||String(groups.size);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);}
 return [...groups.values()].map(passages=>{
  const s={...passages[0],stance:[...new Set(passages.map(p=>p.stance))].join(' / '),
   note:[...new Set(passages.map(p=>p.note).filter(Boolean))].join(' '),
   locator:passages.map(p=>p.locator).filter(Boolean).join(' · ')};
  const url=text(s.url),linked=/^https?:\/\//i.test(url);
  const facts=[['Publisher',text(s.publisher)||'Not recorded'],['Published',text(s.published_date)||'Not recorded'],
   ['Accessed',text(s.accessed_date)||'Not recorded'],...scopeFacts(s.scope),['Capture reference',text(s.locator)||'Not recorded']];
  return `<div class="graph-source"><b>${esc(s.stance)} · ${esc(text(s.source_kind).replaceAll('_',' '))}</b><p>${linked?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`:esc(s.title)}</p><p>${esc(s.note)}</p><p class="evidence-note">${esc(s.limitations)}</p><details><summary>Source methods and capture details</summary><dl>${facts.map(([label,value])=>`<div class="fact"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></details></div>`;
 }).join('');
}
