import test from 'node:test';
import assert from 'node:assert/strict';
import {handleImageError,recordMedia,placeholderImage,companyLogo} from '../site/js/atlas-view.js';
import {setProductMedia} from '../site/js/atlas-media.js';
test('missing media renders a neutral placeholder without invented source attribution',()=>{
 const html=recordMedia({id:'missing-media'},true);
 assert(html.includes(placeholderImage));assert(html.includes('Image not yet available'));assert(!html.includes('figcaption'));
});
test('failed media keeps its layout and removes attribution; a failed fallback cannot loop',()=>{
 const caption={hidden:false};const image={dataset:{},matches:()=>true,closest:()=>({querySelector:()=>caption})};
 // Product media is distinct from the existing logo-initials fallback.
 image.matches=selector=>!selector.startsWith('.company-logo');
 handleImageError({target:image});assert.equal(image.src,placeholderImage);assert.equal(image.alt,'Image unavailable');assert(caption.hidden);assert(!image.hidden);
 handleImageError({target:image});assert(image.hidden);
});
test('logo-only offerings show their identity once; separate product imagery retains the small logo',()=>{
 const previousWindow=globalThis.window,previousLocation=globalThis.location;
 const entry={id:'laundry-offering',title:'Laundry offering'};
 const logo={object_id:entry.id,media_role:'logo',asset_url:'https://provider.example/logo.png',source_url:'https://provider.example/service',review_state:'reviewed',reviewed_by:'Codex',reviewed_at:'2026-10-10',source_capture_sha256:'a'.repeat(64),alt_text:'Provider logo',credit:'Provider',rights_note:'Unconfirmed',visibility:'internal',rights_status:'unknown'};
 try{
  globalThis.window={};globalThis.location={hostname:'127.0.0.1'};
  setProductMedia([logo]);assert.equal(companyLogo(entry),'');assert(recordMedia(entry).includes(logo.asset_url));
  setProductMedia([logo,{...logo,media_role:'product_image',asset_url:'https://provider.example/equipment.png'}]);
  assert(companyLogo(entry).includes(logo.asset_url));assert(recordMedia(entry).includes('equipment.png'));
 }finally{
  setProductMedia([]);
  if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;
  if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;
 }
});
