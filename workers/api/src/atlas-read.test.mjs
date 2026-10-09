import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readPayload, ATLAS_QUERY } from './atlas-read.js';
import worker from './index.js';

test('wire JSON keeps candidate status and response limitations', async () => {
  const graph = { objects: [{ id: 'candidate', epistemic_status: 'candidate' }], relationships: [{ relation: 'responds_to', epistemic_status: 'interpretation' }], truncated: true };
  assert.deepEqual(await readPayload({ simpleQuery: async () => [{ payload: JSON.stringify(graph) }] }, ATLAS_QUERY), graph);
});

test('missing principles are absent and corrupt JSON fails visibly', async () => {
  assert.equal(await readPayload({ simpleQuery: async () => [] }, ''), null);
  await assert.rejects(readPayload({ simpleQuery: async () => [{ payload: '{invalid' }] }, ''), SyntaxError);
});

test('new read routes use existing CORS and fail safely without configuration', async () => {
  for (const path of ['/api/atlas', '/api/principles']) {
    const preflight = await worker.fetch(new Request('https://example.test'+path, { method: 'OPTIONS' }), {});
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://strunden.github.io');
    const failed = await worker.fetch(new Request('https://example.test'+path), {});
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { ok: false, error: 'database unconfigured' });
    const post = await worker.fetch(new Request('https://example.test'+path, { method: 'POST' }), {});
    assert.equal(post.status, 405);
  }
});
