export const PAGE_CHARACTERS=65536,MAX_DISCOVERY_PAGES=2048;
export async function discoveryManifest(sql){
 const [row]=await sql.simpleQuery('SELECT * FROM atlas.refresh_discovery_delivery_snapshot()');
 const pages=Math.ceil(Number(row?.characters)/PAGE_CHARACTERS);
 if(!/^[a-f0-9]{32}$/.test(row?.revision)||!Number.isSafeInteger(pages)||pages<1||pages>MAX_DISCOVERY_PAGES)
  throw new Error('Invalid discovery manifest');
 return {schema_version:3,revision:row.revision,pages};
}
export function discoveryPageParameters(url){
 const revision=url.searchParams.get('revision'),text=url.searchParams.get('page');
 if(!/^[a-f0-9]{32}$/.test(revision)||!/^\d{1,4}$/.test(text))return null;
 const page=Number(text);if(page>=MAX_DISCOVERY_PAGES)return null;
 return {revision,page};
}
export async function discoveryPage(sql,{revision,page}){
 const [row]=await sql.simpleQuery(`SELECT * FROM atlas.read_discovery_delivery_page('${revision}',${page})`);
 if(!row)return null;
 if(row.revision!==revision||Number(row.page)!==page||typeof row.payload_piece!=='string'||
 row.payload_piece.length>2*PAGE_CHARACTERS||Number(row.pages)>MAX_DISCOVERY_PAGES||Number(row.pages)<1)
  throw new Error('Invalid discovery page');
 return {revision,page,pages:Number(row.pages),piece:row.payload_piece};
}
