import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewedMedia} from '../site/js/atlas-media.js';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeReadLayer} from '../scripts/export-research-presentation.mjs';
const row={entry_id:'company-rhem-labs',review_state:'reviewed',reviewed_by:'Codex',reviewed_at:'2026-10-08',source_capture_sha256:'a'.repeat(64),alt_text:'Product depiction',credit:'Rhem',rights_note:'Unconfirmed',asset_url:'https://www.rhem.ai/product.webp',source_url:'https://www.rhem.ai/',visibility:'internal',rights_status:'unknown',caption:'Provider image; depiction unverified'};
test('unconfirmed rights only display on internal surface; explicit review and source required',()=>{
 const e={id:row.entry_id};assert.equal(reviewedMedia(e,[row],{internal:true}).length,1);assert.equal(reviewedMedia(e,[row],{internal:false}).length,0);
 for(const change of [{review_state:'candidate'},{source_capture_sha256:''},{source_url:'javascript:alert(1)'},{reviewed_by:''},{alt_text:''},{visibility:'public'}])assert.equal(reviewedMedia(e,[{...row,...change}],{internal:true}).length,0);
 assert.equal(reviewedMedia(e,[{...row,visibility:'public',rights_status:'permission',rights_url:'https://www.rhem.ai/press'}],{internal:false}).length,1);
});
test('public export omits internal media bytes entirely unless internal audience is explicit',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'wc-media-'));
 try{
  const graph=join(dir,'graph.json'),layer=join(dir,'layer.json'),media=join(dir,'media.js');
  await writeFile(graph,JSON.stringify({objects:[],relationships:[],sources:[],evidence_links:[]}));
  await writeFile(layer,JSON.stringify({object_presentations:[],product_media:[row]}));
  assert.equal((await writeReadLayer(graph,layer,media)).media,0);
  assert.doesNotMatch(await readFile(media,'utf8'),/product.webp/);
  assert.equal((await writeReadLayer(graph,layer,media,{internal:true})).media,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('offering media binds to its graph identity without leaking to sibling offerings',()=>{
 const specific={...row,entry_id:null,object_id:'service-day-care'};
 assert.equal(reviewedMedia({id:'service-day-care'},[specific],{internal:true}).length,1);
 assert.equal(reviewedMedia({id:'service-night-care',company_id:'service-day-care'},[specific],{internal:true}).length,0);
 assert.equal(reviewedMedia({id:'service-day-care'},[specific],{internal:false}).length,0);
});

test('a company logo can be shared but its product shot cannot stand in for another offering',()=>{
 const product={...row,media_role:'product_image'},logo={...row,media_role:'logo'};
 const offering={id:'residential-product',company_id:row.entry_id};
 const exact={...product,entry_id:null,object_id:offering.id};
 assert.deepEqual(reviewedMedia(offering,[product,logo,exact],{internal:true}).map(m=>m.object_id||m.media_role),['logo',offering.id]);
 assert.equal(reviewedMedia({id:row.entry_id},[product],{internal:true}).length,1);
});
