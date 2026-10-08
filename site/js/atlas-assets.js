// Generic reusable imagery. No text, claims or layout baked into assets.
export const assetLibrary={
 worker:{src:'assets/illustrations/worker.png',tags:['care','work','team','physical'],description:'Illustrative care worker'},
 adult:{src:'assets/illustrations/adult.png',tags:['home','daily','connection','future','health'],description:'Illustrative older adult'},
 relative:{src:'assets/illustrations/relative.png',tags:['services','coordination','funding','informed','handoffs','help'],description:'Illustrative relative organising care'},
 family:{src:'assets/illustrations/family.png',tags:['relationship','resident','reassurance','choices'],description:'Illustrative family members'},
 provider:{src:'assets/illustrations/provider.png',tags:['staff','delivery','quality','operations','buying','judgement'],description:'Illustrative care provider'}
};
export function assetFor(key,fallback='adult'){return assetLibrary[key]||Object.values(assetLibrary).find(a=>a.tags.includes(key))||assetLibrary[fallback]||assetLibrary.adult;}
export function portrait(key){const a=assetFor(key);return `<img class="editorial-asset" src="${a.src}" alt="" loading="lazy" decoding="async">`;}
