// Build guard: prevent accidental reintroduction of a separately shipped catalog.
import {readdir,readFile} from 'node:fs/promises';
const base=new URL('../site/',import.meta.url);
let files=[];
try{files=await readdir(new URL('data/',base),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
if(files.some(f=>/\.(json|js|sqlite|db)$/i.test(f)))throw new Error('Website must not contain saved catalog data');
for(const name of ['js/atlas.js','js/app.js','js/atlas-loader.js','js/atlas-media.js']){
 const s=await readFile(new URL(name,base),'utf8');
 if(/data\/(?:atlas|index|companies)|localStorage|indexedDB/.test(s))throw new Error('Saved data path found in '+name);
}
const config=await readFile(new URL('js/config.js',base),'utf8');
if(!/API_BASE:\s*"https:\/\//.test(config))throw new Error('Canonical research service must be configured');
console.log('Database-only website validated; no bundled catalog or outage fallback.');
