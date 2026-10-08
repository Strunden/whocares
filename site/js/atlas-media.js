// Media stays independent of layout. A record.media object takes precedence as data grows.
// These are provider images, not independent evidence or generated product depictions.
export const mediaLibrary={
 'company-amara':{src:'https://amara.app/_next/static/immutable/media/base.326k9f63bcax4.webp',alt:'Amara Home tablet on its base',kind:'Product image',source:'https://amara.app/',credit:'Amara',checked:'2026-10-08'},
 'solution-amara-home':{src:'https://amara.app/_next/static/immutable/media/base.326k9f63bcax4.webp',alt:'Amara Home tablet on its base',kind:'Product image',source:'https://amara.app/',credit:'Amara',checked:'2026-10-08'}
};
export function mediaFor(entry){
 const m=entry?.media||mediaLibrary[entry?.id];
 if(m&&/^https:\/\//.test(m.src)&&/^https:\/\//.test(m.source)&&m.alt)return m;
 if(['daily_situation','lived_workaround'].includes(entry?.kind))return {src:'assets/illustrations/family.png',alt:'Illustrative family members',kind:'Illustration',credit:'Generated illustration; not field evidence'};
 return null;
}
