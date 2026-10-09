// Read-only database export; credentials must be injected privately.
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from 'pg';
import { ATLAS_QUERY } from '../workers/api/src/atlas-read.js';
assert.ok(process.env.DATABASE_URL, 'DATABASE_URL must be supplied privately');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const { rows } = await client.query(ATLAS_QUERY);
  const graph = JSON.parse(rows[0].payload);
  assert.equal(graph.truncated, false, 'Refusing to overwrite the export with an incomplete graph');
  await client.query('COMMIT');
  graph.exported_from = { date: new Date().toISOString().slice(0,10), source: 'Read-only atlas database query' };
  await writeFile(new URL('../site/data/atlas.json',import.meta.url),JSON.stringify(graph,null,2)+'\n');
  console.log('Atlas snapshot exported. Database unchanged.');
} finally { await client.end(); }
