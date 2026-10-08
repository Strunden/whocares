import {assetFor} from './atlas-assets.js';
import {logoUrl} from './atlas-records.js?v=browse-items-29';
import {mediaFor} from './atlas-media.js?v=media-20261008';
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
 const e=n.entry,heading=`<h2 class="node-title">${esc(n.title)}</h2>`;
 if(n.personaKey)return `<div class="node-copy">${heading}<p class="node-description">${esc(n.description)}</p></div><img class="perspective-art" src="${assetFor(n.personaKey).src}" alt="Illustration" loading="lazy">`;
 if(mode==='compact')return `<div class="node-copy">${heading}<p class="node-description">${esc(short(n.description,145))}</p></div><img class="overview-art" src="${assetFor(n.graph?'adult':n.id,persona).src}" alt="Illustration" loading="lazy" decoding="async">`;
 if(n.children?.length)return `<div class="node-copy">${heading}<p class="node-description">${esc(short(e?.summary||n.description||'Explore the records filed under this subject.',220))}</p></div>`;
 const company=e?.type==='company'||e?.kind==='solution';
 const description=e?.summary||n.description||'Records grouped by their existing category; relevance to a specific problem needs review.';
 return `<div class="node-copy"><div class="record-heading">${company?companyLogo(e):''}<div>${heading}</div></div><div class="node-summary"><p class="node-description">${esc(short(description,320))}</p>${recordMedia(e)}</div></div>`;
}

function territorySurface(n,mode){
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
    if(!el){el=document.createElement('section');el.className='atlas-node';el.dataset.node=node.id;el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',node.title);container.append(el);elements.set(node.id,el);}
    const signature=node.id+mode+box.layoutW+(node.entry?._detailLoaded?'loaded':'');const changed=el.dataset.signature!==signature;
    if(el.dataset.signature!==signature){el.innerHTML=territorySurface(node,mode)+nodeMarkup(node,mode,persona);el.dataset.signature=signature;const descriptions=[...el.querySelectorAll('.node-description')];descriptions.forEach((d,i)=>{d.id='map-'+node.id+'-detail-'+i;});el.setAttribute('aria-describedby',descriptions.map(d=>d.id).join(' '));}
    el.dataset.shape=String(shapeVariant(node.id));el.dataset.mode=mode;el.dataset.kind=node.kind;el.dataset.visual=node.personaKey?'person':mode!=='compact'&&!node.children?.length?'record':'territory';
    el.style.cssText=`left:${box.x}px;top:${box.y}px;width:${box.layoutW}px;height:${box.layoutH}px;transform:scale(${box.scale});transform-origin:0 0;--territory:${tree.all.get(node.root).color}`;
    if(changed){
     // Measure in fixed layout pixels once per item, never as the camera zooms.
     const summary=el.querySelector('.node-summary'),description=summary?.querySelector('.node-description');
     if(description){const style=getComputedStyle(description);description.style.webkitLineClamp=String(Math.max(1,Math.floor((summary.clientHeight-parseFloat(style.marginTop))/parseFloat(style.lineHeight))));}
    }
    el.classList.toggle('selected',node.entry?.id===selectedId);
    el.inert=box.x+box.w<=0||box.x>=width||box.y+box.h<=0||box.y>=height;
   }
   for(const [id,el] of elements)if(!keep.has(id)){el.remove();elements.delete(id);}
  }
 };
}
