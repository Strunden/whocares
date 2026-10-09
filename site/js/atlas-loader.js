// Catalog, graph and media arrive together from the authoritative database.
// Failure is visible; no saved catalog or browser-persisted copy is substituted.
export async function loadAtlas(fetcher=fetch,apiBase=''){
 if(!/^https:\/\//.test(apiBase)&&!/^http:\/\/127\.0\.0\.1:\d+$/.test(apiBase))throw new Error('Research service is not configured');
 const r=await fetcher(apiBase.replace(/\/$/,'')+'/api/discovery',{cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw new Error('Research service is unavailable');
 const data=await r.json();
 if(data.schema_version!==2||!data.revision||!Array.isArray(data.catalog?.entries)||
    !data.graph||!['objects','relationships','sources','evidence_links'].every(k=>Array.isArray(data.graph[k]))||!Array.isArray(data.media)){
  throw new Error('Research service returned an incomplete response');
 }
 return {entries:data.catalog.entries,graph:data.graph,media:data.media,revision:data.revision};
}
