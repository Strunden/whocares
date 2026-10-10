import test from 'node:test';
import assert from 'node:assert/strict';
import {handleImageError,recordMedia,placeholderImage} from '../site/js/atlas-view.js';
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
