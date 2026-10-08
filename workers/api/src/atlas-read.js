// Public read surface excludes legacy snapshots and internal write logs.
export const PRINCIPLES_QUERY = `
  SELECT to_jsonb(p)::text AS payload FROM atlas.current_principles p
  WHERE key = 'who-cares-product'
`;

// One statement gives a consistent graph snapshot. This first slice has a
// conservative cap; consumers must not mistake a truncated slice for the atlas.
export const ATLAS_QUERY = `
WITH nodes AS (SELECT * FROM atlas.objects ORDER BY id LIMIT 500),
 edges AS (
  SELECT r.* FROM atlas.relationships r
  JOIN nodes a ON a.id = r.from_id JOIN nodes b ON b.id = r.to_id
  ORDER BY r.id LIMIT 2000
 ),
 links AS (
  SELECT e.* FROM atlas.evidence_links e
  WHERE e.object_id IN (SELECT id FROM nodes)
     OR e.relationship_id IN (SELECT id FROM edges)
  ORDER BY e.id LIMIT 5000
 ),
 sources AS (SELECT s.* FROM atlas.sources s WHERE s.id IN (SELECT source_id FROM links))
SELECT jsonb_build_object(
 'schema_version', 1,
 'principles_version', (SELECT version FROM atlas.current_principles WHERE key='who-cares-product'),
 'objects', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.id) FROM nodes n), '[]'::jsonb),
 'relationships', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM edges e), '[]'::jsonb),
 'evidence_links', COALESCE((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.id) FROM links l), '[]'::jsonb),
 'sources', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM sources s), '[]'::jsonb),
 'truncated', (SELECT count(*) > 500 FROM atlas.objects)
   OR (SELECT count(*) > 2000 FROM atlas.relationships r
       WHERE r.from_id IN (SELECT id FROM nodes) AND r.to_id IN (SELECT id FROM nodes))
   OR (SELECT count(*) > 5000 FROM atlas.evidence_links e
       WHERE e.object_id IN (SELECT id FROM nodes) OR e.relationship_id IN (SELECT id FROM edges))
)::text AS payload
`;

export async function readPayload(sql, query) {
  const rows = await sql.simpleQuery(query);
  if (!rows[0]) return null;
  const payload = rows[0].payload;
  return typeof payload === 'string' ? JSON.parse(payload) : payload;
}
