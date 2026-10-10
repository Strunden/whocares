import test from 'node:test';
import assert from 'node:assert/strict';
import {shapeDiscovery,queryDiscovery,queryDiscoveryText,DISCOVERY_SQL,DISCOVERY_TEXT_SQL} from './discovery.js';
const row={id:'company-test',visible:true,review_id:'review-test',review_current:true,decision:'correct',document:{id:'company-test',type:'company',title:'Corrected title',writeup_draft:{private:'draft'},kill_reason:'Legacy verdict'}};
const payload={catalog:[row],graph:{objects:[],relationships:[],sources:[],evidence_links:[]},media:[],logos:['company-test'],funding:[]};
test('all catalog consumers get the same corrected and sanitized projection',()=>{
 const r=shapeDiscovery({payload:JSON.stringify(payload),revision:'abc'});
 assert.equal(r.catalog.revision,r.revision);assert.equal(r.catalog.entries[0].title,'Corrected title');
 assert.equal(r.catalog.entries[0].logo,'/api/logo/company-test');
 assert.equal(r.catalog.entries[0].writeup_draft,undefined);assert.equal(r.catalog.entries[0].kill_reason,undefined);
 assert.equal(r.catalog.counts.total,1);
});
test('query executes one coherent database statement with no local dataset',async()=>{
 const calls=[];const d=await queryDiscovery({simpleQuery:async sql=>{calls.push(sql);return [{payload,revision:'abc'}];}});
 assert.equal(calls.length,1);assert.equal(calls[0],DISCOVERY_SQL);assert.equal(d.catalog.entries.length,1);
 assert.match(DISCOVERY_SQL,/c.review_current AND c.review_id IS NOT NULL/);
 await assert.rejects(queryDiscovery({simpleQuery:async()=>{throw new Error('database unavailable');}}),/unavailable/);
});
test('broken graph references and malformed catalogs cannot appear as a successful response',()=>{
 assert.throws(()=>shapeDiscovery({payload:{...payload,graph:{...payload.graph,relationships:[{from_id:'missing',to_id:'missing'}]}},revision:'a'}),/Dangling/);
 assert.throws(()=>shapeDiscovery({payload:{...payload,catalog:[{...row,review_current:false}]},revision:'a'}),/stale/);
 assert.throws(()=>shapeDiscovery({payload,revision:null}),/Missing/);
});

test('internal media requires an explicit server-side opt-in; the public query stays restricted',async()=>{
 let query;
 const sql={simpleQuery:async value=>{query=value;return [{payload,revision:'abc'}];}};
 await queryDiscovery(sql,{internalMedia:true});
 assert.match(query,/m.review_state='reviewed' AND \(m.visibility='internal' OR/);
 assert.match(query,/m.rights_status<>'unknown'/);
 await queryDiscovery(sql);
 assert.equal(query,DISCOVERY_SQL);
 assert.doesNotMatch(query,/m.visibility='internal'/);
});

function textRow(p=payload){
 const {graph,media,...metadata}=p;
 return {metadata:JSON.stringify(metadata),graph_json:JSON.stringify(graph),media_json:JSON.stringify(media),revision:'abc',dangling:'f'};
}
test('HTTP text path preserves the full normal discovery contract in one snapshot',async()=>{
 const input={...payload,graph:{...payload.graph,objects:[{id:'o',context:'Quotation with \"slashes\" and ünicode'}]},media:[{id:'m',url:'https://example.org/a'}]};
 const calls=[];
 const text=await queryDiscoveryText({simpleQuery:async q=>{calls.push(q);return [textRow(input)];}});
 assert.deepEqual(JSON.parse(text),shapeDiscovery({payload:input,revision:'abc'}));
 assert.deepEqual(calls,[DISCOVERY_TEXT_SQL]);
 assert.match(DISCOVERY_TEXT_SQL,/md5\(payload::text\)/);
 assert.match(DISCOVERY_TEXT_SQL,/NOT EXISTS .*atlas.objects o WHERE o.id=r.from_id/);
 assert.match(DISCOVERY_TEXT_SQL,/NOT EXISTS .*atlas.objects o WHERE o.id=r.to_id/);
 assert.match(DISCOVERY_TEXT_SQL,/m.review_state='reviewed' AND \(m.visibility='public'/);
 assert.match(DISCOVERY_TEXT_SQL,/m.rights_status<>'unknown'/);
 assert.doesNotMatch(DISCOVERY_TEXT_SQL,/m.visibility='internal'/);
});
test('HTTP path does not parse or re-encode large graph or media fragments',async()=>{
 const r=textRow({...payload,graph:{...payload.graph,objects:[{id:'large',context:'x'.repeat(9*1024*1024)}]}});
 const parse=JSON.parse,stringify=JSON.stringify;const parsed=[],encoded=[];
 let result;
 try{
  JSON.parse=function(value,...args){parsed.push(value.length);return parse(value,...args);};
  JSON.stringify=function(value,...args){encoded.push(value);return stringify(value,...args);};
  result=await queryDiscoveryText({simpleQuery:async()=>[r]});
 }finally{JSON.parse=parse;JSON.stringify=stringify;}
 assert.deepEqual(parsed,[r.metadata.length]);
 assert.equal(encoded.length,2);
 assert.equal(parse(result).graph.objects[0].context.length,9*1024*1024);
});
test('HTTP path rejects missing rows, stale catalogs, and SQL integrity failures',async()=>{
 const run=r=>queryDiscoveryText({simpleQuery:async()=>r?[r]:[]});
 await assert.rejects(run(null),/Missing/);
 for(const dangling of ['t',true,null,undefined])await assert.rejects(run({...textRow(),dangling}),/Dangling/);
 await assert.rejects(run({...textRow(),graph_json:null}),/Missing/);
 await assert.rejects(run(textRow({...payload,catalog:[{...row,review_current:false}]})),/stale/);
});
