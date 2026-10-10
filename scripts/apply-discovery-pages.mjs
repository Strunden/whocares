import postgres from '../workers/api/node_modules/postgres/src/index.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const [mode='guard',apiRole]=process.argv.slice(2);
assert(['guard','test','live'].includes(mode));assert(apiRole&&/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(apiRole),'Supply the existing API database role');
const expected='1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2';
const sqlText=await readFile(new URL('./migrations/20261010-discovery-delivery-pages.sql',import.meta.url),'utf8');
const digest=createHash('sha256').update(sqlText).digest('hex');
const destination=new URL('../research-staging/discovery-delivery/',import.meta.url);await mkdir(destination,{recursive:true});
const db=postgres(process.env.DATABASE_URL,{max:1});const host=new URL(process.env.DATABASE_URL).hostname;
const ident='"'+apiRole.replaceAll('"','""')+'"';
try{
 const [principles]=await db`SELECT version,canonical_sha256 FROM atlas.current_principles WHERE key='who-cares-product'`;
 assert.equal(Number(principles.version),1);assert.equal(principles.canonical_sha256,expected);
 const [role]=await db`SELECT rolname,rolsuper FROM pg_roles WHERE rolname=${apiRole}`;assert(role,'Unknown API role');
 const [scope]=await db`SELECT has_table_privilege(${apiRole},'atlas.objects','SELECT') AS objects,has_table_privilege(${apiRole},'atlas.catalog_read_model','SELECT') AS catalog`;
 assert(scope.objects&&scope.catalog,'API role must already access this atlas');
 const definitions=await db`SELECT p.oid::regprocedure::text AS name,pg_get_functiondef(p.oid) AS definition,p.proacl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='atlas' AND p.proname IN ('refresh_discovery_delivery_snapshot','read_discovery_delivery_page','discovery_public_sources')`;
 const exists=(await db`SELECT to_regclass('atlas.discovery_delivery_snapshots') IS NOT NULL AS exists`)[0].exists;
 console.log(JSON.stringify({mode,guards:true,principlesVersion:1,principlesSha256:expected,apiRole,existingFunctions:definitions.length,existingSnapshotTable:exists,migrationSha256:digest}));
 if(mode==='guard')process.exitCode=0;
 else{
  if(mode==='live'){
   const receipt=JSON.parse(await readFile(new URL('verified-test.json',destination),'utf8'));
   assert.equal(receipt.migrationSha256,digest);assert.equal(receipt.verified,true);assert.notEqual(receipt.host,host,'Test must use a separate database endpoint');
  }
  const tables=exists?await db`SELECT * FROM atlas.discovery_delivery_snapshots ORDER BY revision`:[];
  const pages=exists?await db`SELECT * FROM atlas.discovery_delivery_pages ORDER BY revision,page`:[];
  await writeFile(new URL('backup-'+mode+'-'+Date.now()+'.json',destination),JSON.stringify({definitions,snapshots:tables,pages}));
  const batch='discovery-delivery-'+mode+'-'+digest.slice(0,16);
  assert.equal((await db`SELECT id FROM atlas.import_batches WHERE id=${batch}`).length,0,'Already audited; inspect receipt instead of replaying');
  await db.begin(async tx=>{
   await tx`SELECT set_config('atlas.batch_id',${batch},true)`;
   await tx.unsafe(sqlText.replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
   await tx.unsafe('GRANT EXECUTE ON FUNCTION atlas.refresh_discovery_delivery_snapshot() TO '+ident);
   await tx.unsafe('GRANT EXECUTE ON FUNCTION atlas.read_discovery_delivery_page(text,integer) TO '+ident);
   const counts={derived_snapshot_tables:2,delivery_functions:3,canonical_records_changed:0};
   await tx`INSERT INTO atlas.import_batches ${tx({id:batch,title:'Bounded canonical discovery delivery',state:'reviewed',expected_counts:tx.json(counts),actual_counts:tx.json(counts),provenance:tx.json({manifest_sha256:digest,principles_sha256:expected,api_role:apiRole,method:'Server-side sanitized immutable revision pages; canonical source records untouched'}),note:'Delivery read layer only; public permissions limited to two functions on the existing API role.'})}`;
  });
  await writeFile(new URL('applied-'+mode+'.json',destination),JSON.stringify({applied:true,host,migrationSha256:digest,apiRole,batch},null,2));
  console.log('Applied; run parity verification before writing verified-'+mode+'.json or applying live.');
 }
}finally{await db.end();}
