import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import postgres from '../workers/api/node_modules/postgres/src/index.js';
import {queryDiscovery} from '../workers/api/src/discovery.js';
import {readLogo} from '../workers/api/src/logo.js';

// Private preview uses the same database query as production, without snapshots.
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required');
const sql=postgres(process.env.DATABASE_URL,{max:2,connect_timeout:15,idle_timeout:20});
const root=fileURLToPath(new URL('../site/',import.meta.url));
const port=8788,origin=`http://127.0.0.1:${port}`;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.headers.host!==`127.0.0.1:${port}`||(req.headers.origin&&req.headers.origin!==origin)){res.writeHead(403).end();return;}
 if(req.method!=='GET'){res.writeHead(405).end();return;}
 try{
  const path=decodeURIComponent(new URL(req.url,origin).pathname);
  if(path==='/api/discovery'){
   const data=await queryDiscovery({simpleQuery:query=>sql.unsafe(query)});
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));return;
  }
  if(path.startsWith('/api/logo/')){
   const logo=await readLogo({simpleQuery:query=>sql.unsafe(query)},path.slice('/api/logo/'.length));
   if(!logo){res.writeHead(404).end();return;}
   res.setHeader('Content-Type','image/png');res.end(Buffer.from(logo,'base64'));return;
  }
  if(path==='/js/config.js'){
   res.setHeader('Content-Type','text/javascript');
   res.end(`window.WHOCARES_CONFIG={base:null,API_BASE:${JSON.stringify(origin)},ANALYTICS:{enabled:false,projectKey:""}};`);return;
  }
  if(path.startsWith('/api/')){res.writeHead(404).end();return;}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root.endsWith(sep)?root:root+sep)||path.split('/').some(p=>p.startsWith('.'))){res.writeHead(403).end();return;}
  const body=await readFile(file);
  res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(body);
 }catch(error){res.writeHead(error.code==='ENOENT'?404:503).end('Preview unavailable');}
}).listen(port,'127.0.0.1',()=>console.log(`Private database-backed index: ${origin}`));
