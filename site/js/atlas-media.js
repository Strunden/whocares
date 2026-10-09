let productMedia=[];
export function setProductMedia(rows){productMedia=Array.isArray(rows)?rows:[];}
// Company branding may be shared; offering product shots require exact graph ownership.
// These are provider images, not independent evidence or generated product depictions.
export function reviewedMedia(entry,rows=productMedia,{internal=['localhost','127.0.0.1','::1'].includes(globalThis.location?.hostname)}={}){
 return rows.filter(m=>(m.object_id?m.object_id===entry?.id:m.entry_id===entry?.id||(m.media_role==='logo'&&m.entry_id===entry?.company_id))&&m.review_state==='reviewed'&&m.reviewed_by&&m.reviewed_at&&
  /^[a-f0-9]{64}$/.test(m.source_capture_sha256||'')&&m.alt_text&&m.credit&&m.rights_note&&
  /^https:\/\//.test(m.asset_url)&&/^https:\/\//.test(m.source_url)&&
  (m.visibility==='internal'?internal:m.visibility==='public'&&m.rights_status!=='unknown'&&/^https:\/\//.test(m.rights_url||'')))
 .map(m=>({...m,src:m.asset_url,alt:m.alt_text,source:m.source_url,
  kind:m.caption+' · '+(m.rights_status==='unknown'?'Reuse rights not confirmed':'Attributed provider media')}));
}
export function productLogoFor(entry){return reviewedMedia(entry).find(m=>m.media_role==='logo');}
export function mediaFor(entry){
 const m=reviewedMedia(entry).find(m=>m.media_role!=='logo')||entry?.media;
 if(m&&/^https:\/\//.test(m.src)&&/^https:\/\//.test(m.source)&&m.alt)return m;

 return null;
}
