import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])]));
  return value;
}
const policy = await readJSON('db/seeds/product-principles-v1.json');
const hash = createHash('sha256').update(JSON.stringify(sorted(policy))).digest('hex');
const mirror = await readFile(resolve(root, 'WHOCARES_PRODUCT_NORTH_STAR.md'), 'utf8');
assert.ok(mirror.includes(hash), 'Principles hash does not match the readable mirror');
for (const principle of policy.principles) assert.ok(mirror.includes(principle.text), 'Missing mirrored principle: '+principle.id);
const graph = await readJSON('site/data/atlas.json');
assert.equal(graph.principles_version, policy.version);
assert.equal(graph.truncated, false, 'Export is incomplete');
const objects = new Map(graph.objects.map(o => [o.id,o]));
const relationships = new Map(graph.relationships.map(r => [r.id,r]));
const sources = new Map(graph.sources.map(s => [s.id,s]));
assert.equal(objects.size,graph.objects.length);
assert.equal(relationships.size,graph.relationships.length);
for (const r of relationships.values()) {
  assert.ok(objects.has(r.from_id) && objects.has(r.to_id), 'Dangling relationship: '+r.id);
}
for (const e of graph.evidence_links) {
  assert.ok(sources.has(e.source_id), 'Missing source: '+e.id);
  assert.ok(e.object_id ? objects.has(e.object_id) : relationships.has(e.relationship_id), 'Dangling evidence: '+e.id);
}
for (const row of [...objects.values(), ...relationships.values()]) {
  assert.ok(row.confidence.basis && row.confidence.rationale && row.provenance);
  assert.ok(!('opportunity_score' in row.confidence) && !('score' in row.confidence));
  if (row.epistemic_status==='documented') {
    assert.ok(graph.evidence_links.some(e => (e.object_id===row.id || e.relationship_id===row.id) && e.stance==='supports' && e.reviewed_at && !['product_direction','historical_record'].includes(sources.get(e.source_id).source_kind)), 'Unbacked documented assertion: '+row.id);
  }
}
for (const id of ['001_atlas_foundation','002_first_slice','003_integrity']) {
  const statements = await readJSON('db/migrations/'+id+'.statements.json');
  const sql = await readFile(resolve(root,'db/migrations/'+id+'.sql'),'utf8');
  assert.equal(sql,'BEGIN;\n\n'+statements.join(';\n\n')+';\n\nCOMMIT;\n','SQL/statement array drift: '+id);
}
if (process.argv.includes('--database')) {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL must be supplied privately');
  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString:process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT version,body,canonical_sha256 FROM atlas.current_principles WHERE key='who-cares-product'");
    assert.equal(rows[0]?.version,policy.version,'Repository policy is stale');
    assert.equal(rows[0]?.canonical_sha256,hash,'Database and mirror hashes differ');
    assert.deepEqual(rows[0]?.body,policy,'Database and mirror bodies differ');
  } finally { await client.end(); }
}
console.log('Atlas mirror, migrations, graph references and evidence checks passed. Principles v'+policy.version+', '+objects.size+' objects, '+relationships.size+' relationships.');
