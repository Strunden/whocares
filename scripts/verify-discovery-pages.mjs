import postgres from '../workers/api/node_modules/postgres/src/index.js';
import {queryDiscovery,DISCOVERY_SQL,shapeDiscovery} from '../workers/api/src/discovery.js';
import {catalogFields} from '../site/js/atlas-catalog.js';
import {loadAtlas} from '../site/js/atlas-loader.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const target=process.argv[2]||'read-only';assert(['read-only','test','live'].includes(target));
const sqlText=await readFile(new URL('./migrations/20261010-discovery-delivery-pages.sql',import.meta.url),'utf8');
const digest=createHash('sha256').update(sqlText).digest('hex');
const start=sqlText.indexOf(' SELECT jsonb_set'),end=sqlText.indexOf(" FROM jsonb_array_elements(v_payload->'catalog') c;",start)+" FROM jsonb_array_elements(v_payload->'catalog') c;".length;
const sanitize=sqlText.slice(start,end).replace(' INTO v_public',' AS payload').replaceAll('v_catalog',"($1::jsonb->'catalog')").replaceAll('v_payload','$1::jsonb');
const db=postgres(process.env.DATABASE_URL,{max:1});
try{
 await db.begin('isolation level repeatable read'+(target==='read-only'?' read only':''),async tx=>{
  const sql={simpleQuery:q=>tx.unsafe(q)},normal=await queryDiscovery(sql),[raw]=await tx.unsafe(DISCOVERY_SQL);
  const input=typeof raw.payload==='string'?JSON.parse(raw.payload):raw.payload;
  const [sanitized]=await tx.unsafe(sanitize,[input]);
  assert.deepEqual(shapeDiscovery({payload:sanitized.payload,revision:raw.revision}),normal);
  const fixture={...input,graph:{objects:[],relationships:[],sources:[],evidence_links:[]},catalog:[{id:'private-fixture',visible:true,review_current:true,review_id:'r',decision:'retain',document:{id:'private-fixture',type:'company',title:'Allowed',related:['private-fixture','unadmitted-secret-id'],writeup_draft:{secret:'never public'},kill_reason:'never public',secret_other:'never public',deep_dive:{product:'Allowed',draft:'never public',note:'Allowed'}}}]};
  const [safe]=await tx.unsafe(sanitize,[fixture]);
  assert.doesNotMatch(JSON.stringify(safe.payload.catalog),/never public|writeup_draft|kill_reason|secret_other/);
  assert.deepEqual(shapeDiscovery({payload:safe.payload,revision:'fixture'}),shapeDiscovery({payload:fixture,revision:'fixture'}));
  assert.deepEqual(safe.payload.catalog[0].document.related,['private-fixture']);
  for(const deep_dive of ['private legacy scalar',['private legacy array'],true,17,null,false,0,'']){
   const value={...fixture,catalog:[{...fixture.catalog[0],document:{...fixture.catalog[0].document,deep_dive}}]};
   const [projected]=await tx.unsafe(sanitize,[value]);
   assert.deepEqual(projected.payload.catalog[0].document.deep_dive,shapeDiscovery({payload:value,revision:'fixture'}).catalog.entries[0].deep_dive);
  }
  if(target!=='read-only'){
   const sources=[{url:' https://example.org/source ',quote:' exact   passage ',private:'never public'},{url:'javascript:bad',private:'never public'}];
   const [filtered]=await tx`SELECT atlas.discovery_public_sources(${tx.json(sources)}) AS sources`;
   assert.deepEqual(filtered.sources,[{url:'https://example.org/source',quote:'exact passage'}]);
   const [parsed]=await tx`SELECT atlas.discovery_public_sources(${tx.json(JSON.stringify(sources))}) AS sources`;
   assert.deepEqual(parsed.sources,filtered.sources);
  }
  let manifest=null,pagesElapsedMs=null,firstRefreshMs=null,unchangedRefreshMs=null,pageReadTotalMs=0,maxPageReadMs=0;
  if(target!=='read-only'){
   const started=performance.now(),responses=[],rawPieces=[];
   const result=await loadAtlas(async url=>{
    const parsed=new URL(url);
    if(parsed.pathname.endsWith('/manifest')){
     const refreshStart=performance.now();const [m]=await tx`SELECT * FROM atlas.refresh_discovery_delivery_snapshot()`;firstRefreshMs=Math.round(performance.now()-refreshStart);const repeatStart=performance.now();const [again]=await tx`SELECT * FROM atlas.refresh_discovery_delivery_snapshot()`;unchangedRefreshMs=Math.round(performance.now()-repeatStart);assert.deepEqual(again,m);manifest={schema_version:3,revision:m.revision,pages:Math.ceil(Number(m.characters)/65536)};
     return {ok:true,status:200,json:async()=>manifest};
    }
    const page=Number(parsed.searchParams.get('page'));
    const pageStart=performance.now();const [r]=await tx`SELECT * FROM atlas.read_discovery_delivery_page(${manifest.revision},${page})`;const elapsed=performance.now()-pageStart;pageReadTotalMs+=elapsed;maxPageReadMs=Math.max(maxPageReadMs,elapsed);
    assert(r);responses.push(Buffer.byteLength(r.payload_piece));rawPieces[page]=r.payload_piece;
    return {ok:true,status:200,json:async()=>({revision:r.revision,page:r.page,pages:r.pages,piece:r.payload_piece})};
   },'https://verification.invalid');
   assert.deepEqual(result,{entries:normal.catalog.entries,graph:normal.graph,media:normal.media,revision:normal.revision});
   pagesElapsedMs=Math.round(performance.now()-started);
   assert.ok(Math.max(...responses)<=262144,'UTF-8 page byte bound');
   const publicPayload=JSON.parse(rawPieces.join('')),active=new Set(publicPayload.catalog.map(c=>c.id));
   assert.ok(publicPayload.logos.every(id=>active.has(id)),'Unadmitted logo identity leaked');
   for(const c of publicPayload.catalog){
    assert.ok(Object.keys(c.document).every(key=>catalogFields.includes(key)),'Private catalog field leaked');
    assert.ok((c.document.related||[]).every(id=>active.has(id)),'Unadmitted related identity leaked');
   }
   for(const f of publicPayload.funding)for(const source of f.sources){
    assert.ok(Object.keys(source).every(key=>['url','quote'].includes(key)),'Private funding source field leaked');
    assert.match(source.url,/^https?:\/\//);if(source.quote)assert.equal(source.quote,source.quote.replace(/\s+/g,' ').trim());
   }
  }
  const receipt={verified:true,target,migrationSha256:digest,host:new URL(process.env.DATABASE_URL).hostname,serverSanitizationParity:true,privateFieldFixture:true,fullContractParity:true,entries:normal.catalog.entries.length,objects:normal.graph.objects.length,revision:normal.revision,manifest,pagesElapsedMs,firstRefreshMs,unchangedRefreshMs,pageReadTotalMs:Math.round(pageReadTotalMs),maxPageReadMs:Math.round(maxPageReadMs)};
  if(target!=='read-only'){const dir=new URL('../research-staging/discovery-delivery/',import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('verified-'+target+'.json',dir),JSON.stringify(receipt,null,2));}
  console.log(JSON.stringify(receipt));
 });
}finally{await db.end();}
