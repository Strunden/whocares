// Display copy is invalidated by changes to any assertion, edge, evidence or source it used.
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export function presentationDependencies(graph,id){
 const object=graph.objects.find(o=>o.id===id);if(!object)throw new Error('Unknown presentation object');
 const relations=graph.relationships.filter(r=>r.from_id===id||r.to_id===id);
 const edgeIds=new Set(relations.map(r=>r.id));
 const evidence=graph.evidence_links.filter(e=>e.object_id===id||edgeIds.has(e.relationship_id));
 const sources=new Set(evidence.map(e=>e.source_id));
 return [['objects',[object]],['relationships',relations],['evidence_links',evidence],['sources',graph.sources.filter(s=>sources.has(s.id))]]
 .flatMap(([table,rows])=>rows.map(row=>({table,id:row.id,record:structuredClone(row)}))).sort((a,b)=>(a.table+':'+a.id).localeCompare(b.table+':'+b.id));
}
export function presentationFor(graph,object){
 const p=(graph.object_presentations||[]).find(p=>p.object_id===object.id&&p.locale==='en');
 if(!p||p.review_state!=='reviewed')return {state:'missing',title:object.title,summary:object.statement};
 const valid=p.reviewed_by&&p.reviewed_at&&/^[a-f0-9]{64}$/.test(p.review_basis_sha256||'')&&
 canonical(p.provenance?.dependencies)===canonical(presentationDependencies(graph,object.id));
 return valid?{state:'current',title:p.display_title,summary:p.orientation_summary}:{state:'stale',title:object.title,summary:object.statement};
}
