// Shared by the local server and remote worker; catalog holds apply to logos too.
export async function readLogo(sql,id){
 if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/.test(id))return null;
 const rows=await sql.simpleQuery(`
  SELECT encode(e.logo_bytes, 'base64') AS logo_b64
  FROM public.entries e
  WHERE e.id='${id}' AND e.logo_bytes IS NOT NULL
    AND EXISTS (SELECT 1 FROM atlas.catalog_read_model c WHERE c.id=e.id
      AND c.visible AND c.review_current AND c.review_id IS NOT NULL
      AND c.decision IN ('retain','correct'))
  LIMIT 1
 `);
 return rows[0]?.logo_b64||null;
}
