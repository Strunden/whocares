import postgres from '../workers/api/node_modules/postgres/src/index.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const withdraw=process.argv.includes('--withdraw');
const target=process.argv[2];assert(['inspect','test','live'].includes(target));
const dir=new URL(withdraw?'../research-staging/starting-care-scene-withdrawal/':'../research-staging/starting-care-scene/',import.meta.url);await mkdir(dir,{recursive:true});
const id='wc-candidate-f85711be98f5f495e1a4bc5d',batch=withdraw?'starting-care-scene-withdrawal-20261011':'starting-care-illustrative-scene-20261011';
const scene={status:withdraw?'withdrawn':'illustrative',title:'Care starts before the family feels ready',summary:'Taking on care can mean working out whom to contact, what help is needed and how much the family can realistically provide.',question:'How might we help a family get through the first weeks of care with a clear plan and realistic responsibilities?',points:{
 'wc-candidate-a71bd49ef00861c5ea62a976':'Care has started, but the first steps are unclear',
 'wc-candidate-f2e55b37c36627611264ac44':'No clear first contact for arranging support',
 'wc-candidate-161129e4c4a42701bad591dd':'Uncertainty about what needs professional help',
 'wc-candidate-a9e309907ef0626ea11efb1e':'Advice assumes knowledge of the care system',
 'wc-candidate-8e573c979c1d50cd871b1a1d':'No clear picture of what the family can realistically take on'
}};
const sql=postgres(process.env.DATABASE_URL,{max:1});
try{
 const policy=(await sql`SELECT canonical_sha256 FROM atlas.current_principles WHERE key='who-cares-product'`)[0];
 assert.equal(policy.canonical_sha256,'1698c1ce402af9694166b15938d24fb9fb05c55e85a330b4e589b7dca5b2a8c2');
 const before=(await sql`SELECT * FROM atlas.objects WHERE id=${id}`)[0];assert(before);assert.equal(before.epistemic_status,'hypothesis');
 const edges=await sql`SELECT * FROM atlas.relationships WHERE to_id=${id} AND provenance->>'navigation'='true'`;
 assert.deepEqual(edges.map(e=>e.from_id).sort(),Object.keys(scene.points).sort());
 if(target==='inspect'){
  await writeFile(new URL('before-live.json',dir),JSON.stringify(before,null,2));
  console.log(JSON.stringify({principlesVerified:true,id,revision:before.revision,points:edges.length,writes:0}));
 }else{
  const expected=JSON.parse(await readFile(new URL('before-live.json',dir)));
  for(const k of ['scope','provenance','epistemic_status','revision'])assert.deepEqual(before[k],expected[k],'Concurrent or divergent branch:'+k);
  if(target==='live'){const proof=JSON.parse(await readFile(new URL('verified-test.json',dir)));assert(proof.verified);assert.deepEqual(proof.scene,scene);}
  assert(!(await sql`SELECT id FROM atlas.import_batches WHERE id=${batch}`).length,'Do not replay a completed trial');
  const rows=JSON.parse(JSON.stringify(await sql`SELECT * FROM atlas.objects`));
  await writeFile(new URL('backup-'+target+'.json',dir),JSON.stringify({objects:rows,target:before,edges}));
  const scope={...before.scope,navigation:{...before.scope.navigation,scene}};
  const provenance={...before.provenance,[withdraw?'scene_withdrawal_review':'scene_presentation_review']:{date:'2026-10-11',actor:'Codex',method:withdraw?'User rejected the scene as insufficiently concrete. Presentation withdrawn; original editorial content retained for audit. No data deletion or evidence promotion.':'User-authorised illustrative scene trial. Grouping and how-might-we question are editorial, not observed co-occurrence, validated demand or a prescribed solution. Existing identities, evidence and hypothesis status retained.'}};
  await sql.begin(async tx=>{
   await tx`SELECT set_config('atlas.batch_id',${batch},true)`;
   const locked=(await tx`SELECT * FROM atlas.objects WHERE id=${id} FOR UPDATE`)[0];assert.deepEqual(locked,before);
   await tx`UPDATE atlas.objects SET scope=${tx.json(scope)},provenance=${tx.json(provenance)} WHERE id=${id}`;
   await tx`INSERT INTO atlas.import_batches (id,title,state,expected_counts,actual_counts,provenance,note) VALUES (${batch},'Illustrative starting-care scene trial','reviewed',${tx.json({object_updates:1})},${tx.json({object_updates:1})},${tx.json({principles_sha256:policy.canonical_sha256,editorial:true})},'One existing hypothesis receives scene presentation metadata. No empirical promotion, graph rewiring or public deployment.')`;
  });
  const afterRows=JSON.parse(JSON.stringify(await sql`SELECT * FROM atlas.objects`));assert.equal(afterRows.length,rows.length);
  const by=new Map(afterRows.map(x=>[x.id,x]));for(const row of rows)if(row.id!==id)assert.deepEqual(by.get(row.id),row);
  const after=by.get(id);assert.deepEqual(after.scope,scope);assert.deepEqual(after.provenance,provenance);assert.equal(after.epistemic_status,before.epistemic_status);assert.equal(after.revision,before.revision+1);
  assert.deepEqual(await sql`SELECT * FROM atlas.relationships WHERE to_id=${id} AND provenance->>'navigation'='true'`,edges);
  const result={verified:true,target,id,scene,otherObjectsPreserved:rows.length-1,childRelationshipsPreserved:true,hypothesisStatusPreserved:true,publicDeployment:false};
  await writeFile(new URL('verified-'+target+'.json',dir),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }
}finally{await sql.end();}
