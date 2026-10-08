import {personaMaps, illustration, insights, personaStories} from './atlas-content.js';
import {clamp, zoomAt, project, fit, detailLevel} from './atlas-camera.js';

const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => /^https?:\/\//i.test(value || '') ? value : '';
const title = entry => entry.title || entry.name || 'Untitled research';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const map = $('map');
let entries=[], byId=new Map(), regions=[], points=[], persona=null;
let camera={s:1,x:0,y:0}, base=1, level=0, selectedId=null, selectedRegion=null;
let panelHistory=[], panelState=null, closedCamera=null, lastFocus=null;
let animation=0, wheelFrame=0, wheelPending=0, wheelAnchor={x:0,y:0};
let previousSize={w:0,h:0}, mobile=false, ready=false;
let storyObserver=null;
const activeStory=()=>personaStories[persona]||personaStories.worker;
const pointers=new Map();
let gestureStart=null, dragged=false;

function svg(tag,attrs,parent){
  const element=document.createElementNS(svgNS,tag);
  Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,value));
  parent.append(element);return element;
}
function isProblem(entry){return ['theme','parent_theme'].includes(entry.idea_kind);}
const tagThemes={
 'Health and medicines':['T03','T05','T16','P03'],'Safety and falls':['T04','T17'],
 'Memory and dementia':['T06'],'Loneliness and connection':['T07'],'Daily life and getting around':['T09','T10','T15'],
 'Home and housing':['T08','P01'],'Family caregivers':['T11'],'Care staff and services':['T01','T02','T13','T14'],
 'Money and retirement':['T18','P04','P05'],'End of life and inheritance':['T12','P02','P06','P07']
};
function themesFor(entry){return entry.themes?.length?entry.themes:(tagThemes[entry.tag]||[]);}
function inRegion(entry,region){return themesFor(entry).some(theme=>region.themes.includes(theme));}
function regionFor(entry){return regions.find(region=>inRegion(entry,region));}
function status(entry){
 if(entry.type==='company')return entry.writeup_qa?.needs_reresearch || entry.status==='deep_dive_pending'?'Research incomplete':'Company record';
 return {killed:'Idea set aside',standing:'Question under investigation',open:'Open question',parked:'Research paused'}[entry.status]||'Research question';
}
function relatedTo(entry){return entries.filter(other=>other.id!==entry.id && ((entry.related||[]).includes(other.id)||(other.related||[]).includes(entry.id)||other.themes?.some(t=>entry.themes?.includes(t))));}
function row(entry,context=''){
 return `<button class="entry" data-entry="${esc(entry.id)}"><strong>${esc(title(entry))}</strong><small>${esc(context || (entry.type==='company'?'Company · ':'Research · ')+status(entry))}</small></button>`;
}
function announce(text){$('announcement').textContent=text;}
function cancelMotion(){cancelAnimationFrame(animation);animation=0;cancelAnimationFrame(wheelFrame);wheelFrame=0;wheelPending=0;}
function currentBounds(){return mobile?{x:0,y:0,width:1030,height:1490}:{x:0,y:0,width:1590,height:985};}
function overviewCamera(){return fit(map.clientWidth,map.clientHeight,currentBounds(),mobile?8:25);}
function moveTo(target,animate=true){
 cancelMotion();
 if(!animate||reducedMotion.matches){camera=target;render();return;}
 const from={...camera},start=performance.now();
 function frame(now){const t=clamp((now-start)/420,0,1),ease=1-Math.pow(1-t,3);camera={s:from.s+(target.s-from.s)*ease,x:from.x+(target.x-from.x)*ease,y:from.y+(target.y-from.y)*ease};render();if(t<1)animation=requestAnimationFrame(frame);else animation=0;}
 animation=requestAnimationFrame(frame);
}
function zoom(factor,x=map.clientWidth/2,y=map.clientHeight/2){camera=zoomAt(camera,clamp(camera.s*factor,base*.8,base*8),x,y);render();}
function toOverview(){closePanel(false);selectedId=null;selectedRegion=null;const target=overviewCamera();base=target.s;moveTo(target);setHash();}
function pointFor(id){return points.find(point=>point.entry?.id===id);}
function focusRegion(region){
 const targetScale=Math.min(base*4,Math.max(base*2,Math.min(map.clientWidth/480,map.clientHeight/430)));
 moveTo({s:targetScale,x:map.clientWidth/2-region.x*targetScale,y:map.clientHeight/2-region.y*targetScale});
}
function buildMap(){
 mobile=map.clientWidth<600 && window.innerWidth<701;
 regions=personaMaps[persona].regions.map((region,i)=>({...region,...(mobile?{x:270+(i%2)*500,y:250+Math.floor(i/2)*490}:{})}));
 $('territories').replaceChildren();$('labels').replaceChildren();$('connections').replaceChildren();points=[];
 const shapes=[
  'M-224,-80 C-247,-170 -140,-205 -59,-189 C46,-221 192,-171 218,-81 C271,-11 236,99 136,137 C35,181 -114,184 -190,119 C-246,82 -266,-7 -224,-80Z',
  'M-219,-96 C-218,-176 -117,-191 -37,-169 C57,-199 171,-175 211,-96 C257,-12 219,92 138,140 C58,188 -31,158 -109,160 C-204,156 -259,29 -219,-96Z',
  'M-205,-109 C-149,-191 -83,-169 -3,-187 C86,-209 190,-156 214,-70 C266,25 184,136 94,145 C13,167 -102,197 -177,125 C-260,48 -258,-51 -205,-109Z'
 ];
 regions.forEach((region,i)=>{
  const group=svg('g',{'data-region-shape':region.id,transform:`translate(${region.x} ${region.y})`},$('territories'));
  svg('path',{d:shapes[i%3],class:'land',fill:region.color,stroke:region.color},group);
  svg('path',{d:shapes[i%3],class:'land outer',stroke:region.color,transform:'scale(1.06)'},group);
  const topics=entries.filter(entry=>isProblem(entry)&&inRegion(entry,region));
  const label=document.createElement('button');label.className='map-label territory-label';label.dataset.region=region.id;label.setAttribute('aria-label',`Explore ${region.title}`);
  label.innerHTML=`<span class="name">${esc(region.title)}</span><span class="descriptor">${esc(region.description)}</span><span class="count">${topics.length} problem ${topics.length===1?'area':'areas'} · Explore ↗</span>`;
  $('labels').append(label);points.push({kind:'territory',region,x:region.x,y:region.y,element:label});
  topics.forEach((entry,j)=>{
   const column=topics.length>4?j%2:0;
   const x=region.x+(topics.length>4?(column?113:-113):0);
   const y=region.y-60+Math.floor(topics.length>4?j/2:j)*60;
   addPoint(entry,region,x,y,'problem');
  });
  const chosen=region.responses.map(id=>byId.get(id)).filter(entry=>entry&&inRegion(entry,region));
  const responses=chosen.length?chosen:entries.filter(entry=>entry.type==='company'&&inRegion(entry,region)).slice(0,3);
  const lastRow=topics.length>4?Math.ceil(topics.length/2)-1:topics.length-1;
  const companyY=region.y-60+Math.max(0,lastRow)*60+85;
  responses.forEach((entry,j)=>addPoint(entry,region,region.x+(j-1)*155,companyY+(j%2)*42,'company'));
  const count=entries.filter(entry=>entry.type==='company'&&inRegion(entry,region)).length;
  const collection=document.createElement('button');collection.className='map-label collection-label';collection.dataset.listRegion=region.id;collection.textContent=`All ${count} company records →`;collection.setAttribute('aria-label',`Browse all ${count} company records in ${region.title}`);$('labels').append(collection);
  points.push({kind:'collection',region,x:region.x,y:companyY+95,element:collection});
 });
 ready=true;
}
function addPoint(entry,region,x,y,kind){
 const element=document.createElement('button');element.className=`map-label ${kind}-label`;element.dataset.entry=entry.id;element.setAttribute('aria-label',`${kind==='company'?'Company':'Problem'}: ${title(entry)}`);element.title=title(entry);element.textContent=title(entry);$('labels').append(element);points.push({entry,region,x,y,kind,element});
}
function render(){
 if(!ready||!persona)return;
 const nextLevel=detailLevel(camera.s/base);
 if(level!==nextLevel){level=nextLevel;announce(['Territory overview','Problem areas visible','Problem areas and selected company responses visible'][level]);}
 map.dataset.level=String(level);map.dataset.camera=JSON.stringify(camera);
 $('territories').setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.s})`);
 $('zoom-value').value=Math.round(camera.s/base*100)+'%';
 document.querySelectorAll('[data-level]').forEach(el=>el.classList.toggle('current',Number(el.dataset.level)===level));
 const selected=byId.get(selectedId),related=selected?new Set(relatedTo(selected).map(entry=>entry.id)):new Set();
 const boxes=[];let visibleCount=0;
 const ordered=[...points].sort((a,b)=>{
  const priority=p=>p.entry?.id===selectedId?0:p.kind==='territory'?1:related.has(p.entry?.id)?2:p.kind==='problem'?3:4;
  return priority(a)-priority(b);
 });
 for(const point of ordered){
  const {element,kind}=point;
  const wanted=kind==='territory'||kind==='problem'&&level>=1||(kind==='company'||kind==='collection')&&level>=2;
  const position=project(camera,{x:point.x,y:point.y+(kind==='territory'&&level>0?-155:0)});
  const inView=position.x>-30&&position.x<map.clientWidth+30&&position.y>10&&position.y<map.clientHeight-10;
  element.classList.toggle('compact',kind==='territory'&&level>0);
  if(kind==='territory')element.style.width=level===0?Math.min(240,Math.max(130,500*camera.s-22))+'px':'';
  element.classList.toggle('active',point.entry?.id===selectedId);
  element.classList.toggle('related',kind!=='territory'&&related.has(point.entry?.id));
  element.hidden=!wanted||!inView;
  if(element.hidden)continue;
  element.style.left=`${position.x}px`;element.style.top=`${position.y}px`;
  const w=element.offsetWidth,h=element.offsetHeight;
  const box={x:position.x-w/2,y:position.y-h/2,w,h};
  // Fixed-size labels need collision handling: reveal more only when space permits.
  const collision=kind==='territory'&&level===0?false:boxes.some(b=>box.x<b.x+b.w+5&&box.x+box.w+5>b.x&&box.y<b.y+b.h+5&&box.y+box.h+5>b.y);
  const clipped=box.x<4||box.x+box.w>map.clientWidth-4||box.y<4||box.y+box.h>map.clientHeight-4;
  element.hidden=collision||clipped;
  if(!element.hidden){boxes.push(box);visibleCount++;}
 }
 $('map-empty').hidden=visibleCount>0;
 renderConnections(selected,related);
}
function renderConnections(selected,related){
 $('connections').replaceChildren();
 if(!selected)return;
 const start=points.find(p=>p.entry?.id===selected.id&&!p.element.hidden);
 if(!start)return;
 const a=project(camera,start);
 points.filter(p=>p.entry&&related.has(p.entry.id)&&!p.element.hidden).forEach(point=>{
  const b=project(camera,point);svg('path',{d:`M${a.x},${a.y} Q${(a.x+b.x)/2},${Math.min(a.y,b.y)-35} ${b.x},${b.y}`,class:'graph-edge'},$('connections'));
 });
}
function setHash(){
 if(!persona)return;
 const route=panelState?.type==='entry'?`/${persona}/e/${panelState.id}`:panelState?.type==='story'?`/${persona}/story/${panelState.step}`:`/${persona}`;
 history.replaceState(null,'',`#${route}`);
}
function showPanel(state,{remember=true,focus=true}={}){
 if(panelState?.type==='story'){panelState.scrollTop=$('panel-content').scrollTop;panelState.expanded=[...$('panel-content').querySelectorAll('[data-chapter]')].filter(chapter=>chapter.querySelector('details').open).map(chapter=>Number(chapter.dataset.chapter));}
 if(remember&&panelState)panelHistory.push({...panelState});
 if($('inspector').hidden){closedCamera={...camera};lastFocus=document.activeElement;$('inspector').hidden=false;}
 panelState=state;renderPanel();setHash();
 if(focus)$('panel-content').focus({preventScroll:true});
 render();
}
function closePanel(restore=true){
 cancelMotion();storyObserver?.disconnect();
 const wasOpen=!$('inspector').hidden;
 $('inspector').hidden=true;panelState=null;panelHistory=[];selectedId=null;
 if(restore&&closedCamera){camera={...closedCamera};render();}
 closedCamera=null;
 previousSize={w:map.clientWidth,h:map.clientHeight};
 if(wasOpen&&lastFocus?.isConnected&&!lastFocus.hidden)lastFocus.focus({preventScroll:true});
 setHash();
}
function openRegion(id){const region=regions.find(g=>g.id===id);if(!region)return;selectedRegion=id;selectedId=null;showPanel({type:'region',id});focusRegion(region);}
function openEntry(id,{remember=true}={}){
 const entry=byId.get(id);if(!entry)return;
 selectedId=id;selectedRegion=regionFor(entry)?.id||null;
 showPanel({type:'entry',id},{remember});
}
function backPanel(){
 const state=panelHistory.pop();if(!state){closePanel();return;}
 panelState=state;selectedId=state.type==='entry'?state.id:state.type==='story'?activeStory().beats[state.step].focus:null;
 renderPanel();setHash();render();$('panel-content').focus({preventScroll:true});
}
function section(titleText,body){return body?`<h3>${titleText}</h3><p class="body-copy">${esc(body)}</p>`:'';}
function sourceRecords(entry){
 const sources=new Map();
 const add=(url,label,date)=>{url=safeUrl(url);if(url&&!sources.has(url))sources.set(url,{url,label:label||new URL(url).hostname.replace(/^www\./,''),date});};
 for(const source of entry.deep_dive?.sources||[])add(typeof source==='string'?source:source.url,source.note,source.accessed);
 Object.values(entry.writeup||{}).forEach(field=>(field?.sources||[]).forEach(url=>add(url)));
 (entry.sources||[]).forEach(source=>add(typeof source==='string'?source:source.url,source.label||source.note,source.accessed));
 if(!sources.size&&entry.website)add(entry.website,'Company website');
 return [...sources.values()];
}
function evidence(entry){
 const sources=sourceRecords(entry);
 return `<h3>Evidence & provenance</h3><p class="evidence-note">Research snapshot: ${esc(entry.added_date||'2026-10-05')}. ${entry.type==='company'?'Product descriptions may be company claims. They do not establish effectiveness in practice.':'This is an analyst research record, not a validated finding.'}</p>${sources.length?`<ul class="source-list">${sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label)} ↗</a><small>${esc(new URL(source.url).hostname)}${source.date?' · Accessed '+esc(source.date):''}</small></li>`).join('')}</ul>`:`<p class="evidence-note">No direct public source is attached to this record. Internal provenance: ${esc(entry.source_scan||'not recorded')}. Treat its claims as unverified until traced to primary evidence.</p>`}`;
}
function renderPanel(){
 $('panel-back').disabled=panelHistory.length===0;
 const content=$('panel-content');
 storyObserver?.disconnect();storyObserver=null;
 if(panelState.type==='region'){
  const region=regions.find(g=>g.id===panelState.id);
  const topics=entries.filter(e=>isProblem(e)&&inRegion(e,region));
  const responses=entries.filter(e=>e.type==='company'&&inRegion(e,region));
  content.innerHTML=`<p class="kicker">${esc(personaMaps[persona].name)} / territory</p><h2>${esc(region.title)}</h2><p class="lead">${esc(region.description)}</p><div class="insight"><p class="kicker">A question to take into the field</p><p>${esc(region.question)}</p></div><h3>Start with a problem</h3>${topics.map(e=>row(e)).join('')}<div class="section-meta"><h3>Existing responses</h3><span>${responses.length} records</span></div>${responses.slice(0,4).map(e=>row(e)).join('')}${responses.length>4?`<button class="panel-action" data-list-region="${region.id}">Browse all ${responses.length} responses</button>`:''}<p class="evidence-note">This territory is an editorial framing for ${esc(personaMaps[persona].name.toLowerCase())} research. Positions and area do not encode market size or priority.</p>`;
 }else if(panelState.type==='entry'){
  const entry=byId.get(panelState.id),region=regionFor(entry),insight=insights[entry.id];
  const related=relatedTo(entry),responses=related.filter(e=>e.type==='company'),questions=related.filter(e=>e.type!=='company');
  const product=entry.writeup?.what_it_does?.text||entry.deep_dive?.product||entry.job||entry.scene?.job;
  const next=insight?.next||entry.deep_dive?.open_questions?.[0]||region?.question||'What would you need to observe or verify before this claim could guide a decision?';
  content.innerHTML=`<p class="kicker">${esc(region?.title||'Research index')} / ${entry.type==='company'?'company':'problem'}</p><h2>${esc(title(entry))}</h2><span class="status ${entry.type!=='company'||status(entry)==='Research incomplete'?'unresolved':''}">${esc(status(entry))}</span><p class="lead">${esc(entry.summary||entry.research_summary||'Research detail is not yet available.')}</p>${insight?`<div class="insight"><p class="kicker">Why this deserves a closer look · interpretation</p><p>${esc(insight.tension)}</p></div>`:''}${section(entry.type==='company'?'What it does':'The job or question',product)}${insight?.people?section('Who is involved',insight.people):''}<dl>${[ ['Who pays',entry.who_pays||entry.scene?.payer||entry.deep_dive?.payer],['Buyer / customer',entry.deep_dive?.buyer],['Research decision',entry.why_dropped||entry.kill_reason] ].filter(([,value])=>value).map(([label,value])=>`<div class="fact"><dt>${label}${label==='Research decision'?' · analyst interpretation':''}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${entry.type!=='company'&&!entry.who_pays&&!entry.scene?.payer?'<p class="evidence-note">A payer has not been established in this record.</p>':''}<div class="insight"><p class="kicker">Next research question · editorial prompt</p><p>${esc(next)}</p></div>${entry.type==='company'?section('Known gaps',entry.deep_dive?.risks?.join(' ')):''}${evidence(entry)}${responses.length?`<h3>Existing responses in the same research</h3>${responses.slice(0,5).map(e=>row(e)).join('')}${responses.length>5?`<button class="panel-action" data-related="${entry.id}">Browse all ${responses.length} connected companies</button>`:''}<p class="evidence-note">Related by the index’s explicit links or shared theme tags. Inclusion does not mean a company has solved the problem.</p>`:''}${questions.length?`<h3>${entry.type==='company'?'Problems & hypotheses':'Follow the question'}</h3>${questions.map(e=>row(e)).join('')}`:''}${entry.type!=='company'?'<p class="evidence-note">An idea set aside can still concern a real human need. Research status is not an opportunity score.</p>':''}`;
 }else if(panelState.type==='story'){
  const narrative=activeStory();
  content.innerHTML=`<p class="kicker">A day in the life / ${esc(personaMaps[persona].name)}</p><h2>${esc(narrative.title)}</h2><p class="lead">${esc(narrative.subtitle)}</p><p class="evidence-note">Illustrative, not representative. People, times and scenes are fictional. Research records are real. This is not an observed account or clinical guidance.</p><p class="scroll-cue">Scroll through the day ↓</p>${narrative.beats.map((beat,i)=>`<section class="story-chapter" data-chapter="${i}"><div class="story-clock">${beat.time}</div><h2>${esc(beat.title)}</h2><p class="story-scene">${esc(beat.scene)}</p><div class="insight"><p class="kicker">One tension to explore · interpretation</p><p>${esc(beat.tension)}</p></div><details><summary>What supports this scene?</summary><p class="body-copy">${esc(beat.evidence)}</p>${beat.ids.map(id=>byId.get(id)).filter(Boolean).map(e=>row(e)).join('')}</details><p class="kicker field-question">Explore further</p><p class="body-copy">${esc(beat.next)}</p></section>`).join('')}<p class="lead">One route through a much wider landscape.</p><button class="panel-action" data-story-finish>Return to the map →</button>`;
  storyObserver=new IntersectionObserver(items=>{
   if(panelState?.type!=='story')return;
   const item=items.filter(item=>item.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   if(item){const step=Number(item.target.dataset.chapter);if(panelState.step!==step){panelState.step=step;highlightStory(step);setHash();}}
  },{root:content,rootMargin:'-15% 0px -45% 0px',threshold:0});
  content.querySelectorAll('[data-chapter]').forEach(chapter=>{chapter.querySelector('details').open=panelState.expanded?.includes(Number(chapter.dataset.chapter))||false;storyObserver.observe(chapter);});
 }else if(panelState.type==='search'){
  content.innerHTML=`<p class="kicker">Connected research</p><h2>Follow your question.</h2><label class="sr-only" for="research-search">Search problems and companies</label><input class="search-field" id="research-search" type="search" placeholder="A problem, company or keyword…" autocomplete="off"><p class="search-summary">Search all ${entries.length} published records, across every perspective.</p><div id="search-results"></div>`;
  $('research-search').value=panelState.query||'';renderSearch();
 }else if(panelState.type==='related'){
  const entry=byId.get(panelState.id),responses=relatedTo(entry).filter(e=>e.type==='company');
  content.innerHTML=`<p class="kicker">${esc(title(entry))} / connected companies</p><h2>Existing responses</h2><p class="evidence-note">${responses.length} company records connected through explicit links or shared theme tags. A shared theme does not establish that these products are interchangeable.</p>${responses.map(e=>row(e)).join('')}`;
 }else if(panelState.type==='responses'){
  const region=regions.find(g=>g.id===panelState.id),responses=entries.filter(e=>e.type==='company'&&inRegion(e,region));
  content.innerHTML=`<p class="kicker">${esc(region.title)} / responses</p><h2>Who is already here?</h2><p class="evidence-note">${responses.length} published company records. Shared theme or published category membership is a research connection, not proof of effectiveness.</p>${responses.map(e=>row(e)).join('')}`;
 }else{
  content.innerHTML=`<p class="kicker">How to read this atlas</p><h2>Start with people.<br>Stay close to evidence.</h2><p class="body-copy">Who Cares helps venture builders understand ageing and care before deciding what to build. Each person opens a different map of the same published research.</p><h3>From landscape to detail</h3><p class="body-copy">At overview, explore six territories. Move closer to see problem areas. Closer still, selected company responses appear. Text stays the same size. Click any item to read here without leaving the map.</p><h3>Read the connections carefully</h3><p class="body-copy">Dots mark problems; outlined squares mark companies. Lines connect selected records through shared themes or explicit links. They do not imply causation. Territory layout is editorial; size, position and color do not rank venture potential.</p><h3>Research is not certainty</h3><p class="body-copy">The atlas uses the repository’s published research snapshot. Original records include hypotheses and analyst decisions, including ideas set aside. Source links, missing evidence and incomplete research remain visible in each record.</p><h3>Explore without a mouse</h3><p class="body-copy">Tab to territories or records and press Enter. With the map focused, use arrow keys to pan, + and − to zoom, and Home to reset. Escape closes the reading panel. Search and list browsing provide an alternative to spatial navigation.</p><p class="evidence-note">The care-workday story is explicitly illustrative. It contains no attributed interviews, invented quotes or measured outcomes.</p>`;
 }
 content.scrollTop=panelState.type==='story'?(panelState.scrollTop||0):0;
}
function renderSearch(){
 const q=($('research-search')?.value||'').trim().toLowerCase();panelState.query=q;
 const matches=entries.filter(e=>!q||[title(e),e.summary,e.job,e.tag].join(' ').toLowerCase().includes(q));
 const limit=panelState.limit||60;const shown=matches.slice(0,limit);
 $('search-results').innerHTML=`<p class="search-summary">${matches.length} matches${matches.length>limit?' · Showing '+limit:''}</p>${shown.length?shown.map(e=>row(e)).join(''):'<p class="no-results">No records match. Try a broader term, such as “night”, “home” or “family”.</p>'}${matches.length>limit?'<button class="panel-action" data-more>Show more records</button>':''}`;
}
function highlightStory(step){
 const beat=activeStory().beats[step];if(!beat)return;
 selectedId=beat.focus;
 const point=pointFor(beat.focus);if(point){const scale=Math.max(base*2.8,Math.min(1.1,base*4));moveTo({s:scale,x:map.clientWidth/2-point.x*scale,y:map.clientHeight*.5-point.y*scale});}else render();
}
function openStory(step=0,remember=true){
 step=clamp(step,0,activeStory().beats.length-1);
 showPanel({type:'story',step},{remember});highlightStory(step);
 if(step>0)$('panel-content').querySelector(`[data-chapter="${step}"]`)?.scrollIntoView({block:'start'});
}
function choosePersona(key){
 if(!personaMaps[key]||!entries.length)return;
 cancelMotion();closePanel(false);persona=key;selectedId=null;selectedRegion=null;
 $('persona-picker').hidden=true;$('workspace').hidden=false;document.querySelector('.orientation').hidden=false;document.querySelector('.atlas-footer').hidden=false;
 $('persona-change').innerHTML=`${illustration(key)}<span><small>Exploring as</small><strong>${esc(personaMaps[key].name)}</strong></span><span aria-hidden="true">⌄</span>`;
 $('story-open').innerHTML=`<span class="story-time">${activeStory().beats[0].time}</span><span>${esc(activeStory().title)}<small>One possible day · Follow the story</small></span><span aria-hidden="true">↗</span>`;
 document.querySelector('h1').textContent=personaMaps[key].heading;$('perspective-note').textContent=personaMaps[key].description;
 buildMap();camera=overviewCamera();base=camera.s;previousSize={w:map.clientWidth,h:map.clientHeight};render();setHash();map.focus({preventScroll:true});announce(`${personaMaps[key].name} map. Six territories to explore.`);
}
function showPicker(){cancelMotion();$('persona-picker').hidden=false;$('workspace').hidden=true;document.querySelector('.orientation').hidden=true;document.querySelector('.atlas-footer').hidden=true;history.replaceState(null,'','#/');document.querySelector('[data-persona]')?.focus();}
$('persona-cards').innerHTML=Object.entries(personaMaps).map(([key,definition])=>`<button class="persona-card" data-persona="${key}" aria-label="Explore the ${definition.name.toLowerCase()} map">${illustration(key)}<h3>${esc(definition.name)}</h3><p>${esc(definition.intro)}</p><span class="enter">Enter this world <span aria-hidden="true">↗</span></span></button>`).join('');
document.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target)return;
 if(target.dataset.persona){choosePersona(target.dataset.persona);return;}
 if(target.dataset.entry){if(event.detail>0&&dragged&&target.closest('#map'))return;openEntry(target.dataset.entry);return;}
 if(target.dataset.region){if(event.detail>0&&dragged)return;openRegion(target.dataset.region);return;}
 if(target.hasAttribute('data-more')){panelState.limit=(panelState.limit||60)+60;renderSearch();return;}
 if(target.dataset.related){showPanel({type:'related',id:target.dataset.related});return;}
 if(target.dataset.listRegion){showPanel({type:'responses',id:target.dataset.listRegion});return;}
 if(target.dataset.storyStep!==undefined){openStory(Number(target.dataset.storyStep),false);return;}
 if(target.hasAttribute('data-story-finish')){closePanel();return;}
});
$('panel-close').onclick=()=>closePanel();$('panel-back').onclick=backPanel;
$('home').onclick=()=>persona?toOverview():showPicker();$('persona-change').onclick=showPicker;
$('overview').onclick=toOverview;$('recover').onclick=toOverview;
$('zoom-in').onclick=()=>{cancelMotion();zoom(1.25);};$('zoom-out').onclick=()=>{cancelMotion();zoom(1/1.25);};
$('story-open').onclick=()=>openStory();
function ensureMap(){if(!persona)choosePersona('worker');}
$('search-open').onclick=()=>{ensureMap();showPanel({type:'search'});$('research-search').focus();};
$('list-open').onclick=()=>{showPanel({type:'search'});$('research-search').focus();};
$('about-open').onclick=()=>{ensureMap();showPanel({type:'about'});};
$('panel-content').addEventListener('scroll',()=>{if(panelState?.type==='story')panelState.scrollTop=$('panel-content').scrollTop;},{passive:true});
$('panel-content').addEventListener('input',event=>{if(event.target.id==='research-search'){panelState.limit=60;renderSearch();}});
map.addEventListener('wheel',event=>{
 event.preventDefault();cancelAnimationFrame(animation);animation=0;
 const r=map.getBoundingClientRect();wheelAnchor={x:event.clientX-r.left,y:event.clientY-r.top};
 const unit=event.deltaMode===1?16:event.deltaMode===2?map.clientHeight:1;
 wheelPending=clamp(wheelPending+clamp(event.deltaY*unit,-65,65),-180,180);
 if(!wheelFrame)wheelFrame=requestAnimationFrame(function tick(){const step=wheelPending*.32;wheelPending-=step;zoom(Math.exp(-step*.002),wheelAnchor.x,wheelAnchor.y);if(Math.abs(wheelPending)>.15)wheelFrame=requestAnimationFrame(tick);else{wheelPending=0;wheelFrame=0;}});
},{passive:false});
map.addEventListener('pointerdown',event=>{
 if(event.button!==0)return;cancelMotion();
 pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(pointers.size===1){dragged=false;gestureStart={x:event.clientX,y:event.clientY};}
 else dragged=true;
 map.setPointerCapture(event.pointerId);
});
map.addEventListener('pointermove',event=>{
 const previous=pointers.get(event.pointerId);if(!previous)return;
 const before=[...pointers.values()];pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const after=[...pointers.values()];
 if(gestureStart&&Math.hypot(event.clientX-gestureStart.x,event.clientY-gestureStart.y)>5)dragged=true;
 if(!dragged)return;
 map.classList.add('dragging');
 if(after.length===2){
  const distance=values=>Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);
  const center=values=>({x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2});
  const a=center(before),b=center(after),r=map.getBoundingClientRect();
  if(distance(before)>0)camera=zoomAt(camera,clamp(camera.s*distance(after)/distance(before),base*.8,base*8),a.x-r.left,a.y-r.top);
  camera.x+=b.x-a.x;camera.y+=b.y-a.y;
 }else{camera.x+=event.clientX-previous.x;camera.y+=event.clientY-previous.y;}
 render();
});
map.addEventListener('pointerup',event=>{
 pointers.delete(event.pointerId);map.releasePointerCapture(event.pointerId);
 if(!pointers.size){map.classList.remove('dragging');gestureStart=null;}
 if(!dragged){const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('button');if(hit?.dataset.entry){event.preventDefault();openEntry(hit.dataset.entry);}else if(hit?.dataset.region){event.preventDefault();openRegion(hit.dataset.region);}else if(hit?.dataset.listRegion){event.preventDefault();showPanel({type:'responses',id:hit.dataset.listRegion});}}
});
map.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);dragged=true;map.classList.remove('dragging');});
// Pointer selection is handled on release, so dragging never activates a record.
map.addEventListener('click',event=>{if(event.detail>0)event.stopPropagation();});
map.addEventListener('keydown',event=>{
 if(event.target!==map)return;
 const actions={'+':()=>zoom(1.2),'=':()=>zoom(1.2),'-':()=>zoom(1/1.2),Home:toOverview,ArrowLeft:()=>{camera.x+=50;render();},ArrowRight:()=>{camera.x-=50;render();},ArrowUp:()=>{camera.y+=50;render();},ArrowDown:()=>{camera.y-=50;render();}};
 if(actions[event.key]){event.preventDefault();cancelMotion();actions[event.key]();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('inspector').hidden){event.preventDefault();closePanel();}});
new ResizeObserver(()=>{
 if(!ready||$('workspace').hidden)return;
 const w=map.clientWidth,h=map.clientHeight;
 const nextMobile=w<600&&window.innerWidth<701;
 if(nextMobile!==mobile){buildMap();camera=overviewCamera();base=camera.s;}
 else if(previousSize.w&&previousSize.h&&$('inspector').hidden){camera.x+=(w-previousSize.w)/2;camera.y+=(h-previousSize.h)/2;}
 previousSize={w,h};render();
}).observe(map);

try{
 const response=await fetch('data/index.json');if(!response.ok)throw new Error(`Index ${response.status}`);
 const data=await response.json();entries=data.entries.filter(entry=>entry.published!==false);byId=new Map(entries.map(entry=>[entry.id,entry]));$('loading').hidden=true;
 const bits=location.hash.replace(/^#\/?/,'').split('/');
 if(personaMaps[bits[0]]){choosePersona(bits[0]);if(bits[1]==='e'&&byId.has(bits[2]))openEntry(bits[2]);else if(bits[1]==='story')openStory(Number(bits[2])||0);}
 else if(bits[0]==='e'&&byId.has(bits[1])){choosePersona('worker');openEntry(bits[1]);}
}catch(error){
 $('persona-cards').innerHTML='<p class="no-results">The research index could not load. Check your connection and reload to retry.</p>';
 $('loading').textContent='Research could not load.';console.error('Atlas could not load its research index',error);
}
