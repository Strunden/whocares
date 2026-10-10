import {projectCatalog} from './atlas-catalog.js?v=delivery-54';
import {attachFunding} from './funders-shape.js?v=delivery-54';

const MAX_PAGES=2048,CONCURRENCY=4,MAX_ATTEMPTS=2;
function validate(data){
 if(data.schema_version!==2||!data.revision||!Array.isArray(data.catalog?.entries)||
    !data.graph||!['objects','relationships','sources','evidence_links'].every(k=>Array.isArray(data.graph[k]))||!Array.isArray(data.media))
  throw new Error('Research service returned an incomplete response');
 return {entries:data.catalog.entries,graph:data.graph,media:data.media,revision:data.revision};
}
function stale(){const error=new Error('Research snapshot changed; retrying');error.stale=true;return error;}
// Pages are immutable by revision. Assemble privately and expose nothing until
// every page and the complete snapshot pass validation; callers retain old data.
export async function loadAtlas(fetcher=fetch,apiBase='',{signal}={}){
 if(!/^https:\/\//.test(apiBase)&&!/^http:\/\/127\.0\.0\.1:\d+$/.test(apiBase))throw new Error('Research service is not configured');
 const base=apiBase.replace(/\/$/,'');
 for(let attempt=0;attempt<MAX_ATTEMPTS;attempt++){
  const controller=new AbortController();
  const deadline=setTimeout(()=>controller.abort(new Error('Research snapshot timed out')),120000);
  const abort=()=>controller.abort(signal.reason);signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted)abort();
  const request=async path=>{
   const combined=AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]);
   const response=await fetcher(base+path,{cache:'no-store',signal:combined});
   if(response.status===409)throw stale();
   if(!response.ok)throw new Error('Research service is unavailable');
   return response;
  };
  try{
   const manifestResponse=await fetcher(base+'/api/discovery/manifest',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});
   // Existing local previews retain their full discovery route until upgraded.
   if(manifestResponse.status===404)return validate(await (await request('/api/discovery')).json());
   if(!manifestResponse.ok)throw new Error('Research service is unavailable');
   const manifest=await manifestResponse.json();
   if(manifest.schema_version!==3||!/^[a-f0-9]{32}$/.test(manifest.revision)||
      !Number.isSafeInteger(manifest.pages)||manifest.pages<1||manifest.pages>MAX_PAGES)
    throw new Error('Research service returned an invalid snapshot manifest');
   const pieces=new Array(manifest.pages);let next=0;
   const workers=Array.from({length:Math.min(CONCURRENCY,manifest.pages)},async()=>{
    while(next<manifest.pages){
     controller.signal.throwIfAborted();
     const page=next++;
     const value=await (await request('/api/discovery/page?revision='+manifest.revision+'&page='+page)).json();
     if(value.revision!==manifest.revision)throw stale();
     if(value.page!==page||value.pages!==manifest.pages||typeof value.piece!=='string'||value.piece.length>131072)
      throw new Error('Research service returned an invalid snapshot page');
     pieces[page]=value.piece;
    }
   });
   try{await Promise.all(workers);}catch(error){controller.abort();await Promise.allSettled(workers);throw error;}
   const payload=JSON.parse(pieces.join(''));
   const catalog=attachFunding(projectCatalog(payload.catalog),payload.funding);
   const logos=new Set(payload.logos||[]);
   for(const entry of catalog.entries)if(logos.has(entry.id))entry.logo='/api/logo/'+entry.id;
   catalog.revision=manifest.revision;
   return validate({schema_version:2,revision:manifest.revision,catalog,graph:payload.graph,media:payload.media||[]});
  }catch(error){
   controller.abort();
   if(!error.stale||attempt===MAX_ATTEMPTS-1||signal?.aborted)throw error;
  }finally{clearTimeout(deadline);signal?.removeEventListener('abort',abort);}
 }
}
