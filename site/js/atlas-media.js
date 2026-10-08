import productMedia from '../data/atlas/product-media.js';
// Media stays independent of layout. A record.media object takes precedence as data grows.
// These are provider images, not independent evidence or generated product depictions.
export const mediaLibrary={
 'company-amara':{src:'https://amara.app/_next/static/immutable/media/base.326k9f63bcax4.webp',alt:'Amara Home tablet on its base',kind:'Product image',source:'https://amara.app/',credit:'Amara',checked:'2026-10-08'},
 'solution-amara-home':{src:'https://amara.app/_next/static/immutable/media/base.326k9f63bcax4.webp',alt:'Amara Home tablet on its base',kind:'Product image',source:'https://amara.app/',credit:'Amara',checked:'2026-10-08'}
};
export function reviewedMedia(entry,rows=productMedia,{internal=['localhost','127.0.0.1','::1'].includes(globalThis.location?.hostname)}={}){
 return rows.filter(m=>m.entry_id===(entry?.company_id||entry?.id)&&m.review_state==='reviewed'&&m.reviewed_by&&m.reviewed_at&&
  /^[a-f0-9]{64}$/.test(m.source_capture_sha256||'')&&m.alt_text&&m.credit&&m.rights_note&&
  /^https:\/\//.test(m.asset_url)&&/^https:\/\//.test(m.source_url)&&
  (m.visibility==='internal'?internal:m.visibility==='public'&&m.rights_status!=='unknown'&&/^https:\/\//.test(m.rights_url||'')))
 .map(m=>({...m,src:m.asset_url,alt:m.alt_text,source:m.source_url,
  kind:m.caption+' · '+(m.rights_status==='unknown'?'Reuse rights not confirmed':'Attributed provider media')}));
}
export function productLogoFor(entry){return reviewedMedia(entry).find(m=>m.media_role==='logo');}
export function mediaFor(entry){
 const m=reviewedMedia(entry).find(m=>m.media_role!=='logo')||entry?.media||mediaLibrary[entry?.id];
 if(m&&/^https:\/\//.test(m.src)&&/^https:\/\//.test(m.source)&&m.alt)return m;
 if(['daily_situation','lived_workaround'].includes(entry?.kind))return {src:'assets/illustrations/family.png',alt:'Illustrative family members',kind:'Illustration',credit:'Generated illustration; not field evidence'};
 return null;
}
