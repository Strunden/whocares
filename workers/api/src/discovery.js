import {attachFunding} from './funders-shape.js';
import {projectCatalog} from '../../../site/js/atlas-catalog.js';

// One statement provides one consistent database snapshot across the catalog,
// graph and reviews. No branch selection or research staging is exposed to clients.
const publicMedia="m.visibility='public' AND m.rights_status<>'unknown' AND m.rights_url ~ '^https://'";
export const DISCOVERY_SQL=`WITH bundle AS (
 SELECT jsonb_build_object(
  'catalog',COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id) FROM atlas.catalog_read_model c WHERE c.visible AND c.review_current AND c.review_id IS NOT NULL AND c.decision IN ('retain','correct')),'[]'::jsonb),
  'logos',COALESCE((SELECT jsonb_agg(e.id ORDER BY e.id) FROM public.entries e WHERE e.logo_bytes IS NOT NULL),'[]'::jsonb),
  'funding',COALESCE((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.entry_id,l.funder_id) FROM (
    SELECT l.entry_id,f.id AS funder_id,f.name AS funder_name,l.relation,l.round_label,l.amount_eur::text AS amount_eur,l.date::text AS date,l.sources
    FROM public.funding_links l JOIN public.funders f ON f.id=l.funder_id AND f.published
    JOIN atlas.catalog_read_model c ON c.id=l.entry_id AND c.visible AND c.review_current AND c.review_id IS NOT NULL AND c.decision IN ('retain','correct')
    WHERE l.verified
  ) l),'[]'::jsonb),
  'graph',jsonb_build_object(
   'objects',COALESCE((SELECT jsonb_agg(to_jsonb(o) ORDER BY o.id) FROM atlas.objects o),'[]'::jsonb),
   'relationships',COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.id) FROM atlas.relationships r),'[]'::jsonb),
   'sources',COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM atlas.sources s),'[]'::jsonb),
   'evidence_links',COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM atlas.evidence_links e),'[]'::jsonb),
   'object_presentations',COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.id) FROM atlas.object_presentations p),'[]'::jsonb),
   'content_reviews',COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.id) FROM atlas.current_content_reviews r WHERE r.record_table='objects'),'[]'::jsonb),
   'snapshot',jsonb_build_object('origin','Canonical WhoCares database','principle_sha256',(SELECT canonical_sha256 FROM atlas.current_principles WHERE key='who-cares-product'),'as_of',(SELECT max(reviewed_at)::text FROM atlas.content_reviews))
  ),
  'media',COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.id) FROM atlas.product_media m WHERE m.review_state='reviewed' AND (${publicMedia})),'[]'::jsonb)
 ) AS payload
)
SELECT payload,md5(payload::text) AS revision FROM bundle`;

// Keep large graph JSON in the database's encoded form on the HTTP path. The
// revision and integrity check share the exact statement/snapshot as the data.
export const DISCOVERY_TEXT_SQL=DISCOVERY_SQL.replace(
 'SELECT payload,md5(payload::text) AS revision FROM bundle',
 `SELECT (payload - 'graph' - 'media')::text AS metadata,
 (payload->'graph')::text AS graph_json, (payload->'media')::text AS media_json,
 md5(payload::text) AS revision,
 EXISTS (SELECT 1 FROM atlas.relationships r
  WHERE NOT EXISTS (SELECT 1 FROM atlas.objects o WHERE o.id=r.from_id)
     OR NOT EXISTS (SELECT 1 FROM atlas.objects o WHERE o.id=r.to_id)) AS dangling
 FROM bundle`);

function shapeCatalog(payload,revision){
 if(!payload||!revision)throw new Error('Missing canonical discovery snapshot');
 const catalog=attachFunding(projectCatalog(payload.catalog),payload.funding);
 const logos=new Set(payload.logos||[]);
 for(const entry of catalog.entries)if(logos.has(entry.id))entry.logo='/api/logo/'+entry.id;
 catalog.revision=revision;
 return catalog;
}
export function shapeDiscovery(row){
 const payload=typeof row.payload==='string'?JSON.parse(row.payload):row.payload;
 const catalog=shapeCatalog(payload,row.revision);
 const graph=payload.graph;
 if(!graph||!['objects','relationships','sources','evidence_links'].every(k=>Array.isArray(graph[k])))throw new Error('Incomplete graph snapshot');
 const ids=new Set(graph.objects.map(o=>o.id));
 if(graph.relationships.some(r=>!ids.has(r.from_id)||!ids.has(r.to_id)))throw new Error('Dangling graph relationship');
 return {schema_version:2,revision:row.revision,catalog,graph,media:payload.media||[]};
}
export async function queryDiscovery(sql,{internalMedia=false}={}){
 // Only the loopback preview opts in; public callers retain the rights gate.
 const query=internalMedia?DISCOVERY_SQL.replace(publicMedia,"m.visibility='internal' OR ("+publicMedia+")"):DISCOVERY_SQL;
 const rows=await sql.simpleQuery(query);
 return shapeDiscovery(rows[0]||{});
}

export async function queryDiscoveryText(sql){
 const [row]=await sql.simpleQuery(DISCOVERY_TEXT_SQL);
 if(!row?.revision || typeof row.metadata!=='string' ||
    typeof row.graph_json!=='string' || typeof row.media_json!=='string')
  throw new Error('Missing canonical discovery snapshot');
 if(row.dangling!==false && row.dangling!=='f')
  throw new Error('Dangling graph relationship');
 const catalog=shapeCatalog(JSON.parse(row.metadata),row.revision);
 // These raw fragments are generated by jsonb_build_object/jsonb_agg in our
 // fixed SQL, never supplied by a client. Only the small projection is encoded.
 return '{"schema_version":2,"revision":'+JSON.stringify(row.revision)+
  ',"catalog":'+JSON.stringify(catalog)+',"graph":'+row.graph_json+
  ',"media":'+row.media_json+'}';
}

export const DISCOVERY_STREAM_SQL=DISCOVERY_TEXT_SQL.replace(
 "(payload->'graph')::text AS graph_json, (payload->'media')::text AS media_json,\n ", ''
).replace('AS dangling\n FROM bundle', "AS dangling,\n (payload->'graph')::text AS graph_json, (payload->'media')::text AS media_json\n FROM bundle");
// Index callers need the same snapshot identity and integrity check, but never
// transfer or decode the graph they will discard.
export const DISCOVERY_CATALOG_SQL=DISCOVERY_TEXT_SQL.replace(
 "(payload->'graph')::text AS graph_json, (payload->'media')::text AS media_json,\n ", '');
export async function queryDiscoveryCatalog(sql){
 const [row]=await sql.simpleQuery(DISCOVERY_CATALOG_SQL);
 if(!row?.revision||typeof row.metadata!=='string')throw new Error('Missing canonical discovery snapshot');
 if(row.dangling!==false&&row.dangling!=='f')throw new Error('Dangling graph relationship');
 return shapeCatalog(JSON.parse(row.metadata),row.revision);
}
const responseEncoder=new TextEncoder();
export async function queryDiscoveryStream(sql){
 const row=await sql.streamDiscovery(DISCOVERY_STREAM_SQL);
 if(!row.revision||typeof row.metadata!=='string')throw new Error('Missing canonical discovery snapshot');
 if(row.dangling!=='f')throw new Error('Dangling graph relationship');
 const catalog=shapeCatalog(JSON.parse(row.metadata),row.revision);
 const prefix=responseEncoder.encode('{"schema_version":2,"revision":'+JSON.stringify(row.revision)+
  ',"catalog":'+JSON.stringify(catalog)+',"graph":');
 return (async function*(){
  yield prefix;let field='graph_json';
  for await(const part of row.fields){
   if(part.name!==field){
    if(field!=='graph_json'||part.name!=='media_json')throw new Error('Invalid discovery JSON field order');
    yield responseEncoder.encode(',"media":');field=part.name;
   }
   yield part.bytes;
  }
  if(field!=='media_json')throw new Error('Missing discovery media field');
  yield responseEncoder.encode('}');
 })();
}
