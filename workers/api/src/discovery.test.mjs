import test from 'node:test';
import assert from 'node:assert/strict';
import {shapeDiscovery,queryDiscovery,DISCOVERY_SQL} from './discovery.js';
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

test('internal images require a trusted server option and remain part of one database result',async()=>{
 let query;
 await queryDiscovery({simpleQuery:async q=>{query=q;return [{payload,revision:'internal'}];}},{internalMedia:true});
 assert.match(query,/m.visibility='internal' OR/);
 assert.match(query,/m.review_state='reviewed'/);
 assert.match(query,/m.rights_status<>'unknown'/);
 assert.ok(!DISCOVERY_SQL.includes("m.visibility='internal'"));
});
