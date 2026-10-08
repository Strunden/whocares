import test from 'node:test';
import assert from 'node:assert/strict';
import {graphSourceBlock} from '../site/js/atlas-sources.js';

test('sources keep links and limits visible while methods and capture details start collapsed',()=>{
 const html=graphSourceBlock([{title:'Survey',url:'https://example.org/study',stance:'supports',source_kind:'primary_research',
  publisher:'Institute',published_date:null,accessed_date:'2026-10-08',scope:JSON.stringify({method:'Survey',sample:'565 returns',geography:'Germany',perspective:'Counselors'}),
  note:'Attributed finding',limitations:'Not caregiver prevalence',locator:'Passage abc; SHA256 secret-to-layout',excerpt:'Do not reproduce this quotation'}]);
 const [visible,details]=html.split('<details>');
 assert.match(visible,/href="https:\/\/example.org\/study"/);assert.match(visible,/supports · primary research/);
 assert.match(visible,/Not caregiver prevalence/);assert.doesNotMatch(visible,/SHA256|565 returns/);
 assert.match(details,/<summary>Source methods and capture details<\/summary>/);
 for(const value of ['Institute','Published</dt><dd>Not recorded','2026-10-08','565 returns','Germany','Counselors','SHA256 secret-to-layout'])assert.ok(details.includes(value));
 assert.doesNotMatch(html,/<details open|Do not reproduce this quotation/);
});

test('source details escape every field and refuse executable source URLs',()=>{
 const hostile='<img src=x onerror="alert(1)">';
 const html=graphSourceBlock([{title:hostile,url:'javascript:alert(1)',stance:hostile,source_kind:hostile,note:hostile,limitations:hostile,
  locator:hostile,publisher:hostile,published_date:hostile,accessed_date:hostile,scope:JSON.stringify({method:hostile,sample:hostile,geography:hostile,perspective:hostile})}]);
 assert.doesNotMatch(html,/<img|href=|javascript:/);assert.match(html,/&lt;img/);assert.match(html,/&quot;alert/);
 assert.match(graphSourceBlock([{scope:'Historical context <unverified>'}]),/Historical context &lt;unverified&gt;/);
 assert.match(graphSourceBlock([]),/No claim-level source attached/);
 assert.doesNotThrow(()=>graphSourceBlock([{scope:'null'}]));
});


test('repeated passages group by source version while retaining every locator',()=>{
 const base={source_id:'source-v1',url:'https://example.org/',title:'Same source',stance:'supports'};
 const html=graphSourceBlock([{...base,locator:'passage-a'}, {...base,locator:'passage-b'}, {...base,source_id:'source-v2',locator:'changed-version'}]);
 assert.equal((html.match(/class="graph-source"/g)||[]).length,2);
 assert.match(html,/passage-a · passage-b/);assert.match(html,/changed-version/);
});
