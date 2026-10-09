import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildHierarchy,collectionPage,readingLevel} from '../site/js/atlas-layout.js';
import {graphRecords,graphRoots,logoUrl,recordStatus,recordLabel} from '../site/js/atlas-records.js';
import {personaMaps} from '../site/js/atlas-content.js';
import {entries as legacy,graph} from './fixtures/discovery.mjs';
test('all records remain reachable without alphabetical folder depth',()=>{const records=Array.from({length:1000},(_,i)=>({id:'e'+i,title:'Company '+String(i).padStart(4,'0'),type:i%2?'company':'idea',themes:['T04']}));const tree=buildHierarchy(records,personaMaps.provider.regions),group=tree.all.get('quality/T04');const ids=new Set();for(let page=0;page<167;page++)for(const n of collectionPage(group,{page}).nodes)ids.add(n.entry.id);assert.equal(ids.size,1000);assert.ok(![...tree.all.values()].some(n=>n.kind==='range'));assert.equal(collectionPage(group,{type:'company'}).total,500);const found=collectionPage(group,{query:'0999'});assert.equal(found.nodes[0].entry.id,'e999');const view=readingLevel(tree,group.id,{s:1,x:-group.box.x,y:-group.box.y},4000,4000,{query:'0999'});assert.equal(view.filter(v=>v.mode==='summary').length,1);assert.ok(view.every(v=>Number.isFinite(v.box.x)));});
test('graph identity and epistemic status survive every lens unchanged',()=>{const records=graphRecords(graph,legacy);for(const persona of Object.values(personaMaps)){const t=buildHierarchy(legacy,persona.regions,{extraRoots:graphRoots(records)});const root=t.all.get('space-everyday-participation');assert.equal(root.entry.id,'space-everyday-participation');assert.equal(root.entry.epistemic_status,'interpretation');assert.ok([...t.all.values()].some(n=>n.entry?.id==='solution-amara-home'));}assert.equal(records.find(r=>r.id==='workaround-family-assistance').epistemic_status,'hypothesis');});
test('claim sources and relationship sources stay separately scoped',()=>{const records=graphRecords(graph,legacy);const candidate=records.find(e=>e.id==='problem-digital-family-contact');assert.equal(candidate.sources.length,0);const response=candidate.links.find(r=>r.relation==='responds_to');assert.equal(response.epistemic_status,'interpretation');assert.equal(response.evidence[0].stance,'context');assert.equal(response.evidence[0].source_kind,'provider_claim');const documented=records.find(e=>e.id==='problem-environmental-barriers');assert.equal(documented.sources[0].source_kind,'institutional');});
test('historical company decisions are not displayed as problem validity',()=>{assert.equal(recordStatus({type:'idea',status:'killed'}),'Analyst record · unvalidated');assert.equal(recordStatus({type:'company',status:'standing'}),'Offering · outcomes unverified');});
test('logo locations only accept HTTPS or a configured logo endpoint',()=>{assert.equal(logoUrl({logo:'javascript:alert(1)'},'https://example.org'),'');assert.equal(logoUrl({logo:'/api/logo/company-arjo'},'https://example.org/'),'https://example.org/api/logo/company-arjo');assert.equal(logoUrl({logo:'/api/logo/../../secret'},'https://example.org'),'');assert.equal(logoUrl({},'https://example.org'),'');});
test('real thesis_card records retain their hypothesis identity',()=>{assert.equal(recordLabel({type:'idea',idea_kind:'thesis_card'}),'Research hypothesis');});

import {mediaFor} from '../site/js/atlas-media.js';
test('product imagery requires provenance; illustrations cannot become product evidence',()=>{assert.equal(mediaFor({id:'company-amara'}),null);assert.equal(mediaFor({media:{src:'javascript:alert(1)',source:'https://example.org',alt:'x'}}),null);assert.equal(mediaFor({kind:'daily_situation'}).kind,'Illustration');assert.equal(mediaFor({type:'company',id:'unknown'}),null);});

test('logos use same-origin, HTTPS or explicit loopback HTTP only',()=>{
 const entry={logo:'/api/logo/company-arjo'};
 assert.equal(logoUrl(entry),entry.logo);
 for(const base of ['http://127.0.0.1:8788','http://localhost:8788','http://[::1]:8788','https://api.example.org'])assert.equal(logoUrl(entry,base),base+entry.logo);
 for(const base of ['http://example.org','http://127.0.0.1.evil.test','javascript:alert(1)','https://user:pass@example.org','https://example.org?redirect='])assert.equal(logoUrl(entry,base),'');
 assert.equal(logoUrl({logo:'http://example.org/logo.png'}),'');
});
