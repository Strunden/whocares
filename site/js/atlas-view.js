import {personaMaps,insights} from './atlas-content.js';
import {assetFor} from './atlas-assets.js';
import {logoUrl,recordLabel,recordStatus} from './atlas-records.js';
import {mediaFor} from './atlas-media.js';
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=entry=>entry.title||entry.name||'Untitled research';
export const short=(value,max=220)=>{const t=String(value||'');return t.length>max?t.slice(0,max).replace(/\s+\S*$/,'')+'…':t;};
export function companyLogo(entry){
 const url=logoUrl(entry,window.WHOCARES_CONFIG?.API_BASE),initials=title(entry).split(/\s+/).map(v=>v[0]).join('').slice(0,2).toUpperCase();
 return `<span class="company-logo" aria-hidden="true"><span>${esc(initials)}</span>${url?`<img src="${esc(url)}" alt="" loading="lazy" decoding="async">`:''}</span>`;
}
export function recordMedia(entry,large=false){
 const media=mediaFor(entry);if(!media)return '';
 return `<figure class="record-media ${large?'media-large':''}"><img src="${esc(media.src)}" alt="${esc(media.alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>${large&&media.source?`<a href="${esc(media.source)}" target="_blank" rel="noopener">${esc(media.kind)} · ${esc(media.credit)} ↗</a>`:esc(media.kind)}</figcaption></figure>`;
}
function nodeMarkup(n,mode,persona){
 const e=n.entry;
 if(n.personaKey)return `<div class="node-copy"><p class="node-eyebrow">Perspective</p><button class="node-title" data-persona="${esc(n.personaKey)}">${esc(n.title)}</button><p class="node-description">${esc(n.description)}</p><p class="node-preview">${esc(personaMaps[n.personaKey].description)}</p><div class="node-actions"><button data-persona="${esc(n.personaKey)}">Explore this perspective →</button></div></div><img class="perspective-art" src="${assetFor(n.personaKey).src}" alt="Illustration" loading="lazy">`;
 const action=n.children?.length?`data-zoom="${esc(n.id)}"`:`data-entry="${esc(e?.id||'')}"`;
 const heading=`<button class="node-title" ${action}>${esc(n.title)}</button>`;
 if(mode==='compact')return `<div class="node-copy"><p class="node-eyebrow">Area</p>${heading}<p class="node-description">${esc(short(n.description,145))}</p><p class="node-preview">${esc(n.children.slice(0,3).map(c=>c.title).join(' · '))}</p><div class="node-actions"><button data-zoom="${esc(n.id)}">Explore →</button><span>${n.children.length} ${n.paged?'records':'topics'}</span></div></div><img class="overview-art" src="${assetFor(n.graph?'adult':n.id,persona).src}" alt="Illustration" loading="lazy" decoding="async">`;
 if(n.children?.length){
  const companies=n.children.filter(c=>c.entry?.type==='company'||c.entry?.kind==='solution').length;
  const contents=n.paged?`${companies} ${companies===1?'company':'companies'} · ${n.children.length-companies} research records`:`${n.children.length} related records`;
  return `<div class="node-copy"><p class="node-eyebrow">Topic</p>${heading}<p class="node-description">${esc(short(e?.summary||n.description||'Explore the records filed under this subject.',160))}</p><p class="node-preview">${esc(contents)}</p>${e?`<p class="record-evidence">${esc(recordStatus(e))}</p>`:'<p class="record-evidence">Category grouping · relevance needs review</p>'}<div class="node-actions"><button data-zoom="${esc(n.id)}">Explore records →</button>${e?`<button data-entry="${esc(e.id)}" aria-label="Read topic context and sources for ${esc(n.title)}">Topic context ↗</button>`:''}</div></div>`;
 }
 const company=e?.type==='company'||e?.kind==='solution';
 const label=e?recordLabel(e):n.kind==='category'?'Legacy category':'Research collection';
 const description=e?.summary||n.description||'Records grouped by their existing category; relevance to a specific problem needs review.';
 const note=e?.kind==='solution'?'Offering · outcomes unverified':e?.graph?recordStatus(e):n.kind==='category'?'Category match ≠ validated relevance':e?recordStatus(e):'Published research snapshot';
 const meta=company?[['Location',e.country||e.scope?.geography],['Buyer',e.buyer]]:e?.graph?[['Scope',e.scope?.setting],['Research basis',e.confidence?.basis?.replaceAll('_',' ')]]:[];
 const insightsText=insights[e?.id]?.tension;
 return `<div class="node-copy"><div class="record-heading">${company?companyLogo(e):`<span class="record-symbol" aria-hidden="true">${e?.kind==='open_question'?'?':e?.kind==='systemic_cause'?'↔':'○'}</span>`}<div><p class="node-eyebrow">${esc(label)}</p>${heading}</div></div><p class="record-evidence" title="${esc(e?.confidence?.rationale||note)}">${esc(note)}</p><div class="node-summary"><p class="node-description">${esc(short(description,280))}</p>${recordMedia(e)}</div>${meta.length?`<dl class="node-meta">${meta.filter(([,v])=>v&&!['not established','not assessed','not applicable'].includes(v)).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(short(v,100))}</dd></div>`).join('')}</dl>`:insightsText?`<p class="node-insight">${esc(short(insightsText,130))}</p>`:''}<div class="node-actions">${n.children?.length?`<button data-zoom="${esc(n.id)}">Explore ${n.children.length} ${n.paged?'records':'connections'} →</button>`:''}${e?`<button data-entry="${esc(e.id)}">${company?'Company & sources':e.graph?'Claim & sources':'Research & sources'} ↗</button>`:''}</div></div>`;
}

function territorySurface(n,mode){
 if(n.kind==='record')return '';
 return `<svg class="territory-surface" viewBox="0 0 350 300" preserveAspectRatio="none" aria-hidden="true"><path d="M 18 67 C 11 23 57 8 123 14 C 198 0 283 8 321 38 C 350 63 335 112 341 153 C 358 211 331 262 294 275 C 245 293 204 284 162 291 C 89 300 25 280 17 242 C 3 194 16 164 10 126 C 4 96 10 79 18 67 Z"/></svg>`;
}

export function shapeVariant(id){return [...id].reduce((hash,c)=>(hash*31+c.charCodeAt(0))>>>0,0)%3;}
export function createMapView(container){
 const elements=new Map();
 return {
  clear(){container.replaceChildren();elements.clear();},
  render(items,{tree,persona,selectedId,width,height}){
   const keep=new Set();
   for(const {node,box,mode} of items){
    keep.add(node.id);let el=elements.get(node.id);
    if(!el){el=document.createElement('section');el.className='atlas-node';el.dataset.node=node.id;container.append(el);elements.set(node.id,el);}
    const signature=node.id+mode+(node.entry?._detailLoaded?'loaded':'');
    if(el.dataset.signature!==signature){el.innerHTML=territorySurface(node,mode)+nodeMarkup(node,mode,persona);el.dataset.signature=signature;}
    el.dataset.shape=String(shapeVariant(node.id));el.dataset.mode=mode;el.dataset.kind=node.kind;el.dataset.visual=node.personaKey?'person':node.kind==='record'?'record':'territory';
    el.style.cssText=`left:${box.x}px;top:${box.y}px;width:${box.layoutW}px;height:${box.layoutH}px;transform:scale(${box.scale});transform-origin:0 0;--territory:${tree.all.get(node.root).color}`;
    el.classList.toggle('selected',node.entry?.id===selectedId);
    el.inert=box.x+box.w<=0||box.x>=width||box.y+box.h<=0||box.y>=height;
   }
   for(const [id,el] of elements)if(!keep.has(id)){el.remove();elements.delete(id);}
  }
 };
}
