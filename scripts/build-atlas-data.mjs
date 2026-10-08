import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),out=new URL('site/data/atlas/',root);
const source=JSON.parse(await readFile(new URL('site/data/index.json',root)));
const records=source.entries.filter(e=>e.published!==false);
await mkdir(out,{recursive:true});
const keep=new Set(['index.json']),index=[];
const fields=['id','title','name','type','themes','tag','idea_kind','status','summary','who_pays','related','added_date','logo','website','country','city','media','catalog_review'];
for(let i=0;i<records.length;i+=64){
 const chunk=records.slice(i,i+64),body=JSON.stringify(chunk),hash=createHash('sha256').update(body).digest('hex').slice(0,12),file=`records-${hash}.json`;
 keep.add(file);await writeFile(new URL(file,out),body);
 for(const e of chunk){const light=Object.fromEntries(fields.filter(f=>e[f]!==undefined).map(f=>[f,e[f]]));light.summary=String(e.summary||e.research_summary||e.job||e.scene?.job||'').slice(0,400);if(!light.who_pays&&e.scene?.payer)light.who_pays=e.scene.payer;light.buyer=e.deep_dive?.buyer||'';light.user=e.deep_dive?.user||'';light.source_count=new Set([...(e.deep_dive?.sources||[]).map(s=>typeof s==='string'?s:s.url),...Object.values(e.writeup||{}).flatMap(s=>s?.sources||[])].filter(s=>/^https?:/.test(s))).size;light.detail_file=file;index.push(light);}
}
await writeFile(new URL('index.json',out),JSON.stringify({version:1,entries:index}));
for(const file of await readdir(out))if(/^records-[a-f0-9]{12}\.json$/.test(file)&&!keep.has(file))await unlink(new URL(file,out));
console.log(`Atlas: ${index.length} published records, ${keep.size-1} on-demand detail files.`);
