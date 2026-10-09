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

export function shapeDiscovery(row){
 const payload=typeof row.payload==='string'?JSON.parse(row.payload):row.payload;
 if(!payload||!row.revision)throw new Error('Missing canonical discovery snapshot');
 const catalog=attachFunding(projectCatalog(payload.catalog),payload.funding);
 const logos=new Set(payload.logos||[]);
 for(const entry of catalog.entries)if(logos.has(entry.id))entry.logo='/api/logo/'+entry.id;
 catalog.revision=row.revision;
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
