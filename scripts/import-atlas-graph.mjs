// Import an authorized read-only graph export; this script never connects to or writes a database.
import {readFile,writeFile} from 'node:fs/promises';
const input=process.argv[2];
if(!input)throw new Error('Usage: node scripts/import-atlas-graph.mjs /path/to/authorized-graph-export.json');
const graph=JSON.parse(await readFile(input,'utf8'));
for(const key of ['objects','relationships','sources','evidence_links'])if(!Array.isArray(graph[key]))throw new Error(`Missing ${key} array`);
const ids=key=>{const values=graph[key].map(v=>v.id);if(new Set(values).size!==values.length)throw new Error(`Duplicate ${key} identity`);return new Set(values);};
const objects=ids('objects'),relationships=ids('relationships'),sources=ids('sources');ids('evidence_links');
for(const r of graph.relationships)if(!objects.has(r.from_id)||!objects.has(r.to_id))throw new Error(`Dangling relationship ${r.id}`);
for(const e of graph.evidence_links)if(!sources.has(e.source_id)||(!e.object_id&&!e.relationship_id)||(e.object_id&&!objects.has(e.object_id))||(e.relationship_id&&!relationships.has(e.relationship_id)))throw new Error(`Dangling evidence ${e.id}`);
if(!graph.snapshot?.as_of||!graph.snapshot?.origin||!graph.snapshot?.principle_sha256)throw new Error('Snapshot date, origin and principle hash are required');
await writeFile(new URL('../site/data/atlas/graph.json',import.meta.url),JSON.stringify(graph));
console.log(`Imported ${objects.size} graph objects and ${relationships.size} relationships. Original status, scope and evidence retained.`);
