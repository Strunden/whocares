import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectCatalog} from '../site/js/atlas-catalog.js';
import {graph as g} from './fixtures/discovery.mjs';
import {graphRecords} from '../site/js/atlas-records.js';
const row=(id='company-one')=>({id,visible:true,review_id:'review-one',review_current:true,decision:'retain',document:{id,type:'company',published:true,summary:'Provider description',research_depth:.99,kill_reason:'Bad venture',writeup_draft:{text:'Unsupported draft'},related:['idea-old'],deep_dive:{product:'Specific offering',thesis:'Invest now',sources:[{url:'https://example.com'}]}}});
test('projection strips venture judgments, drafts and links to excluded records',()=>{
 const out=projectCatalog([row(),{...row('idea-old'),visible:false}]).entries[0];
 assert.equal(out.research_depth,undefined);assert.equal(out.kill_reason,undefined);assert.equal(out.writeup_draft,undefined);
 assert.equal(out.deep_dive.thesis,undefined);assert.equal(out.deep_dive.sources.length,1);assert.deepEqual(out.related,[]);
});
test('stale corrections, unreviewed exports, duplicate identities and wrong types fail closed',()=>{
 for(const change of [{review_current:false},{review_id:null},{decision:'hold'},{document:{id:'company-one',type:'idea'}}])assert.throws(()=>projectCatalog([{...row(),...change}]));
 assert.throws(()=>projectCatalog([row(),row()]));assert.throws(()=>projectCatalog([row('funding-rule-test')]));
});
test('cleanup excludes the misclassified response and touching edges without deleting its evidence',async()=>{
 const id='test-misclassified-response',records=graphRecords(g,[]);
 assert.ok(g.objects.some(o=>o.id===id));assert.ok(g.evidence_links.some(e=>e.object_id===id));
 assert.ok(!records.some(o=>o.id===id));assert.ok(records.every(o=>o.links.every(r=>r.from_id!==id&&r.to_id!==id)));
});
