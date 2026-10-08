// Export the internally verified database read layer without rewriting assertions or legacy entries.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonical,presentationDependencies} from '../site/js/atlas-presentations.js';
export function validatePresentations(graph,presentations){
 const ids=new Set();
 for(const p of presentations){
  if(ids.has(p.object_id+':'+p.locale))throw new Error('Duplicate display copy');ids.add(p.object_id+':'+p.locale);
  if(p.review_state!=='reviewed')continue;
  const deps=presentationDependencies(graph,p.object_id);
  if(!p.reviewed_by||!p.reviewed_at||canonical(deps)!==canonical(p.provenance?.dependencies)||createHash('sha256').update(canonical(deps)).digest('hex')!==p.review_basis_sha256)throw new Error('Stale or invalid reviewed presentation: '+p.object_id);
 }
}
export async function writeReadLayer(graphPath,databaseLayerPath,mediaPath,{internal=false}={}){
 const graph=JSON.parse(await readFile(graphPath,'utf8')),layer=JSON.parse(await readFile(databaseLayerPath,'utf8'));
 validatePresentations(graph,layer.object_presentations);
 graph.object_presentations=layer.object_presentations;
 await writeFile(graphPath,JSON.stringify(graph,null,2)+'\n');
 const media=layer.product_media.filter(m=>internal||(m.visibility==='public'&&m.rights_status!=='unknown'&&/^https:\/\//.test(m.rights_url||'')));
 await writeFile(mediaPath,'// Generated database media references. Export audience: '+(internal?'internal':'public')+'.\nexport default '+JSON.stringify(media,null,2)+';\n');
 return {presentations:layer.object_presentations.length,media:media.length};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const [graph,layer,media,audience]=process.argv.slice(2);if(!graph||!layer||!media||!['--internal',undefined].includes(audience))throw new Error('Expected graph JSON, database layer JSON and output media module, optionally --internal');
 console.log(await writeReadLayer(graph,layer,media,{internal:audience==='--internal'}));
}
