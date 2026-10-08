import {personaMaps, insights, personaStories} from './atlas-content.js';
import {clamp, fit} from './atlas-camera.js';
import {buildHierarchy,readingLevel,ancestry,panWithinWorld,themesFor,tagThemes} from './atlas-layout.js';
import {assetFor,portrait as illustration} from './atlas-assets.js';

const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => /^https?:\/\//i.test(value || '') ? value : '';
const title = entry => entry.title || entry.name || 'Untitled research';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const map = $('map');
const detailLoads=new Map();
let entries=[], byId=new Map(), regions=[], points=[], persona=null;
let camera={s:1,x:0,y:0}, base=1, level=0, selectedId=null, selectedRegion=null;
let panelHistory=[], panelState=null, closedCamera=null, closedGroup=null, lastFocus=null;
let previousSize={w:0,h:0}, mobile=false, ready=false;
const stressCount=["localhost","127.0.0.1"].includes(location.hostname)?Math.min(100000,Math.max(0,Number(new URLSearchParams(location.search).get("stress"))||0)):0;
let storyObserver=null;
let tree=null;const mapElements=new Map();let maxScale=30;let mapParent=null;let activeGroup=null;const levelCameras=new Map();
const activeStory=()=>personaStories[persona]||personaStories.worker;
const pointers=new Map();
let gestureStart=null, dragged=false, navigationFrame=0;

function svg(tag,attrs,parent){
  const element=document.createElementNS(svgNS,tag);
  Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,value));
  parent.append(element);return element;
}
function isProblem(entry){return ['theme','parent_theme'].includes(entry.idea_kind);}
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
function currentBounds(){return tree?.bounds||{x:0,y:0,width:3150,height:2580};}
function overviewCamera(){return fit(map.clientWidth,map.clientHeight,currentBounds(),mobile?8:25);}
function toOverview(){closePanel(false);selectedId=null;selectedRegion=null;const target=overviewCamera();base=target.s;travelTo(target,null);}
function pointFor(id){return points.find(point=>point.entry?.id===id);}
function stopNavigation(){cancelAnimationFrame(navigationFrame);navigationFrame=0;map.classList.remove('navigating');}
function travelTo(target,group,{focus=true}={}){
 stopNavigation();const start={...camera},began=performance.now();map.classList.add('navigating');
 const finish=()=>{camera=target;activeGroup=group;navigationFrame=0;map.classList.remove('navigating');previousSize={w:map.clientWidth,h:map.clientHeight};render();setHash();if(focus)map.focus({preventScroll:true});};
 if(reducedMotion.matches){finish();return;}
 function frame(now){const t=Math.min(1,(now-began)/560),ease=t*t*(3-2*t);
  // Interpolate the world point at the viewport centre, keeping the journey spatial.
  const cx=map.clientWidth/2,cy=map.clientHeight/2;
  const s=Math.exp(Math.log(start.s)+(Math.log(target.s)-Math.log(start.s))*ease);
  const wx=(cx-start.x)/start.s+((cx-target.x)/target.s-(cx-start.x)/start.s)*ease;
  const wy=(cy-start.y)/start.s+((cy-target.y)/target.s-(cy-start.y)/start.s)*ease;
  camera={s,x:cx-wx*s,y:cy-wy*s};render();
  if(t<1)navigationFrame=requestAnimationFrame(frame);else finish();
 }
 navigationFrame=requestAnimationFrame(frame);
}
function focusNode(id,{keepPanel=false}={}){
 const node=tree.all.get(id);if(!node)return;
 if(!keepPanel&&!$('inspector').hidden)closePanel(false);
 stopNavigation();const sameLevel=activeGroup===id;levelCameras.set(activeGroup||'overview',{...camera});
 const saved=sameLevel?null:levelCameras.get(id),kids=node.children?.length?node.children:[node],first=kids[0].box;
 const scale=Math.min((map.clientWidth<700?map.clientWidth-40:390)/first.w,Math.max(280,Math.min(340,map.clientHeight-160))/first.h);
 const b=node.box,target=saved||{s:scale,x:mobile?16-b.x*scale:map.clientWidth/2-(b.x+b.w/2)*scale,y:12-b.y*scale};
 travelTo(target,id,{focus:!keepPanel});
}
function goUp(){const n=tree.all.get(activeGroup);if(n?.parent)focusNode(n.parent);else toOverview();}
function focusRegion(region){focusNode(region.id);}
function buildMap(){
 mobile=window.innerWidth<701;
 tree=buildHierarchy(entries,personaMaps[persona].regions,{portrait:mobile});
 regions=tree.roots.map(n=>({...n,x:n.box.x+n.box.w/2,y:n.box.y+n.box.h/2}));
 points=[...tree.all.values()].filter(n=>n.entry).map(n=>({entry:n.entry,x:n.box.x+n.box.w/2,y:n.box.y+n.box.h/2}));
 maxScale=Math.max(30,Math.pow(4,tree.maxDepth+1));levelCameras.clear();activeGroup=null;
 $('territories').replaceChildren();$('labels').replaceChildren();$('connections').replaceChildren();mapElements.clear();ready=true;
}
const short=(value,max=220)=>{const t=String(value||'');return t.length>max?t.slice(0,max).replace(/\s+\S*$/,'')+'…':t;};
function nodeMarkup(n,mode){
 const root=tree.all.get(n.root),entry=n.entry;
 const image=assetFor(n.kind==='territory'?n.id:root.id,persona);
 const eyebrow=n.kind==='territory'?'':n.kind==='category'?'Broader category · product fit unverified':n.kind==='range'?'Alphabetical collection':entry?status(entry):'Research collection';
 const heading=`<button class="node-title" ${n.children?.length||n.kind==='territory'?`data-zoom="${esc(n.id)}"`:`data-entry="${esc(entry?.id||'')}"`}>${esc(n.title)}</button>`;
 if(mode==='context')return `<div class="context-label"><small>Neighbouring territory</small>${heading}<span>Enter this region ↗</span></div>`;
 if(mode==='branch')return `<div class="branch-heading">${heading}<span>${n.count} records</span></div>`;
 const info=entry?.summary||entry?.research_summary||entry?.job||entry?.scene?.job||n.description;
 const question=n.question||insights[entry?.id]?.next;
 const groupNote=n.kind==='category'?'Grouped by the published category. A match does not establish product fit.':n.kind==='range'?'An alphabetical group. Open it to reach every record.':n.kind==='topic'?'Published theme and associated research records.':'';
 return `<div class="node-copy"><p class="node-eyebrow">${esc(eyebrow||'Explore a territory')}</p>${heading}<p class="node-description">${esc(short(info||groupNote,240))}</p>${mode==='summary'&&question?`<div class="node-question"><small>A question to investigate</small><p>${esc(short(question,220))}</p></div>`:''}${mode==='summary'&&entry?`<p class="node-fact"><b>${entry.type==='company'?'Evidence':'Who pays'}</b> ${esc(short(entry.type==='company'?'Company record; effectiveness is not established.':entry.who_pays||entry.scene?.payer||'Not established in this record.',130))}</p>`:''}<div class="node-actions">${n.children?.length?`<button data-zoom-deeper="${esc(n.id)}">Explore ${n.count} records ↗</button>`:''}${entry?`<button data-entry="${esc(entry.id)}">Read evidence ↗</button>`:''}</div></div>${n.kind==='territory'?`<img class="node-art" src="${image.src}" alt="" loading="lazy" decoding="async"><span class="art-note">Illustration</span>`:''}`;
}
function clampPan(){camera=panWithinWorld(camera,0,0,tree.bounds,map.clientWidth,map.clientHeight);}
function organicPath(b){
 const x=b.x,y=b.y,w=b.w,h=b.h;
 return `M ${x+w*.06} ${y+h*.25} C ${x-w*.01} ${y+h*.02},${x+w*.26} ${y-h*.02},${x+w*.46} ${y+h*.025} C ${x+w*.71} ${y-h*.04},${x+w*1.04} ${y+h*.06},${x+w*.98} ${y+h*.39} C ${x+w*1.07} ${y+h*.75},${x+w*.86} ${y+h*1.035},${x+w*.6} ${y+h*.97} C ${x+w*.33} ${y+h*1.04},${x-w*.045} ${y+h*.94},${x+w*.025} ${y+h*.62} C ${x-w*.015} ${y+h*.46},${x+w*.015} ${y+h*.33},${x+w*.06} ${y+h*.25} Z`;
}
function drawLandscape(){
 $('territories').replaceChildren();
 $('territories').setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.s})`);
 const path=ancestry(tree,activeGroup),ground=[...tree.roots,...path.filter(n=>n.parent)];
 for(const n of ground){svg('path',{d:organicPath(n.box),fill:tree.all.get(n.root).color,'fill-opacity':n.id===activeGroup?'.24':'.12',stroke:tree.all.get(n.root).color,'stroke-opacity':'.5','stroke-width':1.2/camera.s},$('territories'));}
 const mini=$('map-minimap');mini.replaceChildren();mini.setAttribute('viewBox',`0 0 ${tree.bounds.width} ${tree.bounds.height}`);
 for(const n of tree.roots)svg('path',{d:organicPath(n.box),fill:n.color,'fill-opacity':'.6',stroke:'#fff','stroke-width':20},mini);
 svg('rect',{x:-camera.x/camera.s,y:-camera.y/camera.s,width:map.clientWidth/camera.s,height:map.clientHeight/camera.s,fill:'#fff4',stroke:'#39577e','stroke-width':20},mini);
}
function render(){
 if(!ready||!persona)return;
 clampPan();
 // Dot positions share the world origin; subdivide only to keep a useful density.
 const gridWorldStep=2**Math.floor(Math.log2(32/camera.s));
 map.style.backgroundSize=`${gridWorldStep*camera.s}px ${gridWorldStep*camera.s}px`;
 map.style.backgroundPosition=`${camera.x}px ${camera.y}px`;
 const frontier=readingLevel(tree,activeGroup,camera,map.clientWidth,map.clientHeight),keep=new Set();
 const path=ancestry(tree,activeGroup);mapParent=path.at(-1)?.parent||null;
 $('map-up').hidden=true;
 const crumbKey=persona+'/'+(activeGroup||'');
 if($('map-breadcrumbs').dataset.path!==crumbKey){
  $('map-breadcrumbs').dataset.path=crumbKey;
  const trail=path.length>5?[...path.slice(0,2),null,...path.slice(-2)]:path;
  $('map-breadcrumb-trail').innerHTML=`<button data-map-overview ${!activeGroup?'aria-current="location"':''}>Whole map</button>`+trail.map(n=>n?`<span aria-hidden="true">/</span><button title="${esc(n.title)}" data-zoom="${esc(n.id)}" ${n.id===activeGroup?'aria-current="location"':''}>${esc(n.kind==='range'?n.count.toLocaleString()+' records':short(n.title,40))}</button>`:`<span aria-hidden="true">/</span><select id="ancestor-jump" aria-label="Earlier research levels"><option value="">… Earlier levels</option>${path.slice(2,-2).map(a=>`<option value="${esc(a.id)}">${a.count.toLocaleString()} records · ${esc(a.title)}</option>`).join('')}</select>`).join('');
  $('ancestor-jump')?.addEventListener('change',event=>{if(event.target.value)focusNode(event.target.value);});
  $('map-breadcrumbs').scrollLeft=$('map-breadcrumbs').scrollWidth;
  const current=path.at(-1);$('level-context').hidden=!current;
  $('level-context').innerHTML=current?`<div><p class="kicker">${current.count.toLocaleString()} research records · ${current.children?.length||1} groups · Level ${path.length}</p><h2>${esc(current.title)}</h2><p>${esc(current.question||current.description||current.entry?.summary||'Explore the groups below. Each opens the next level of research.')}</p></div>${current.kind==='territory'?illustration(assetFor(current.id,persona)===assetFor('family')?'family':persona):''}`:'';
 }
 drawLandscape();
 const current=path.at(-1);if(current){const b=current.box;$('level-context').style.cssText=`left:${b.x*camera.s+camera.x+b.w*camera.s*(mobile?.025:.075)}px;top:${b.y*camera.s+camera.y+b.h*camera.s*.045}px;width:${Math.min(780,map.clientWidth-64,b.w*camera.s*.82)}px;--territory:${tree.all.get(current.root).color}`;}
 let deepest=0;
 for(const {node:n,box:b,mode} of frontier){
  deepest=Math.max(deepest,n.depth);keep.add(n.id);
  let el=mapElements.get(n.id);
  if(!el){el=document.createElement('section');el.className='atlas-node';el.dataset.node=n.id;$('labels').append(el);mapElements.set(n.id,el);}
  const signature=n.id+mode;
  if(el.dataset.signature!==signature){el.innerHTML=nodeMarkup(n,mode);el.dataset.signature=signature;}
  el.dataset.mode=mode;el.dataset.kind=n.kind;
  el.style.cssText=`left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;--territory:${tree.all.get(n.root).color};z-index:${n.depth+1}`;
  el.classList.toggle('selected',n.entry?.id===selectedId);
  el.inert=b.x+b.w<=0||b.x>=map.clientWidth||b.y+b.h<=0||b.y>=map.clientHeight;
 }
 for(const [id,el] of mapElements)if(!keep.has(id)){el.remove();mapElements.delete(id);}
 const nextLevel=Math.min(2,path.length);
 if(level!==nextLevel){level=nextLevel;announce(['Territories and guiding questions','Problem summaries and research collections','Research records and evidence'][level]);}
 $('level-range').textContent=activeGroup?`${frontier.filter(v=>v.mode!=='context'&&Math.max(0,Math.min(v.box.x+v.box.w,map.clientWidth)-Math.max(v.box.x,0))*Math.max(0,Math.min(v.box.y+v.box.h,map.clientHeight)-Math.max(v.box.y,0))>=v.box.w*v.box.h*.5).length} of ${tree.all.get(activeGroup).children?.length||1} groups in view · Scroll to explore`:'';
 map.dataset.level=String(level);map.dataset.group=activeGroup||'overview';map.dataset.camera=JSON.stringify(camera);map.dataset.rendered=String(frontier.length);map.dataset.totalNodes=String(tree.all.size);
 $('zoom-value').value=path.length?'Level '+path.length:'Overview';$('zoom-out').disabled=!activeGroup;
 document.querySelectorAll('[data-level]').forEach(el=>el.classList.toggle('current',Number(el.dataset.level)===level));
 $('map-empty').hidden=frontier.length>0;
 $('minimap-home').hidden=!activeGroup;
}
function exploreDeeper(id){focusNode(id);}
function setHash(){
 if(!persona)return;
 const route=panelState?.type==='entry'?`/${persona}/e/${panelState.id}`:panelState?.type==='story'?`/${persona}/story/${panelState.step}`:activeGroup?`/${persona}/g/${encodeURIComponent(activeGroup)}`:`/${persona}`;
 history.replaceState(null,'',`#${route}`);
}
function showPanel(state,{remember=true,focus=true}={}){
 if(panelState?.type==='story'){panelState.scrollTop=$('panel-content').scrollTop;panelState.expanded=[...$('panel-content').querySelectorAll('[data-chapter]')].filter(chapter=>chapter.querySelector('details').open).map(chapter=>Number(chapter.dataset.chapter));}
 if(remember&&panelState)panelHistory.push({...panelState});
 if($('inspector').hidden){closedCamera={...camera};closedGroup=activeGroup;lastFocus=document.activeElement;$('inspector').hidden=false;}
 panelState=state;renderPanel();setHash();
 if(focus)$('panel-content').focus({preventScroll:true});
 render();
}
function closePanel(restore=true){
 stopNavigation();
 storyObserver?.disconnect();
 const wasOpen=!$('inspector').hidden;
 $('inspector').hidden=true;panelState=null;panelHistory=[];selectedId=null;
 if(restore&&closedCamera){activeGroup=closedGroup;render();camera={...closedCamera};render();}
 closedCamera=null;closedGroup=null;
 previousSize={w:map.clientWidth,h:map.clientHeight};
 if(wasOpen&&lastFocus?.isConnected&&!lastFocus.hidden)lastFocus.focus({preventScroll:true});
 setHash();
}
function openRegion(id){selectedRegion=id;selectedId=null;focusNode(id);}
async function openEntry(id,{remember=true}={}){
 const entry=byId.get(id);if(!entry)return;
 selectedId=id;selectedRegion=regionFor(entry)?.id||null;
 showPanel({type:'entry',id},{remember});
 if(entry.detail_file&&!entry._detailLoaded){
  try{if(!detailLoads.has(entry.detail_file))detailLoads.set(entry.detail_file,fetch('data/atlas/'+entry.detail_file).then(r=>{if(!r.ok)throw new Error('Detail unavailable');return r.json();}).catch(error=>{detailLoads.delete(entry.detail_file);throw error;}));
   const chunk=await detailLoads.get(entry.detail_file);for(const full of chunk){const record=byId.get(full.id);if(record)Object.assign(record,full,{_detailLoaded:true,_detailError:false});}
  }catch(error){entry._detailError=true;}
  if(panelState?.type==='entry'&&panelState.id===id)renderPanel();
 }
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
 if(entry.detail_file&&!entry._detailLoaded)return entry._detailError?`<p class="evidence-note">The full record could not load. Sources have not been checked.</p><button class="panel-action" data-entry="${esc(entry.id)}">Retry loading evidence</button>`:'<p class="evidence-note" role="status">Loading the full record and sources…</p>';
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
  content.innerHTML=`<p class="kicker">${esc(region?.title||'Research index')} / ${entry.type==='company'?'company':'problem'}</p><h2>${esc(title(entry))}</h2><span class="status ${entry.type!=='company'||status(entry)==='Research incomplete'?'unresolved':''}">${esc(status(entry))}</span><p class="lead">${esc(entry.summary||entry.research_summary||'Research detail is not yet available.')}</p>${insight?`<div class="insight"><p class="kicker">Why this deserves a closer look · interpretation</p><p>${esc(insight.tension)}</p></div>`:''}${section(entry.type==='company'?'What it does':'The job or question',product)}${insight?.people?section('Who is involved',insight.people):''}<dl>${[ ['Who pays',entry.who_pays||entry.scene?.payer||entry.deep_dive?.payer],['Buyer / customer',entry.deep_dive?.buyer],['Research decision',entry.why_dropped||entry.kill_reason] ].filter(([,value])=>value).map(([label,value])=>`<div class="fact"><dt>${label}${label==='Research decision'?' · analyst interpretation':''}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${entry.type!=='company'&&!entry.who_pays&&!entry.scene?.payer?'<p class="evidence-note">A payer has not been established in this record.</p>':''}<div class="insight"><p class="kicker">Next research question · editorial prompt</p><p>${esc(next)}</p></div>${entry.type==='company'?section('Known gaps',entry.deep_dive?.risks?.join(' ')):''}${evidence(entry)}${responses.length?`<h3>Existing responses in the same research</h3>${responses.slice(0,5).map(e=>row(e)).join('')}${responses.length>5?`<button class="panel-action" data-related="${entry.id}">Browse all ${responses.length} connected companies</button>`:''}<p class="evidence-note">Related by the index’s explicit links or shared theme tags. Inclusion does not mean a company has solved the problem.</p>`:''}${questions.length?`<h3>${entry.type==='company'?'Problems & hypotheses':'Follow the question'}</h3>${questions.slice(0,10).map(e=>row(e)).join('')}${questions.length>10?`<button class="panel-action" data-related="${entry.id}">Browse all connected research</button>`:''}`:''}${entry.type!=='company'?'<p class="evidence-note">An idea set aside can still concern a real human need. Research status is not an opportunity score.</p>':''}`;
 }else if(panelState.type==='story'){
  const narrative=activeStory();
  content.innerHTML=`<p class="kicker">A day in the life / ${esc(personaMaps[persona].name)}</p><h2>${esc(narrative.title)}</h2><p class="lead">${esc(narrative.subtitle)}</p><p class="evidence-note">Illustrative, not representative. People, times and scenes are fictional. Research records are real. This is not an observed account or clinical guidance.</p><p class="scroll-cue">Scroll through the day ↓</p>${narrative.beats.map((beat,i)=>`<section class="story-chapter" data-chapter="${i}">${illustration(persona)}<div class="story-clock">${beat.time}</div><h2>${esc(beat.title)}</h2><p class="story-scene">${esc(beat.scene)}</p><div class="insight"><p class="kicker">One tension to explore · interpretation</p><p>${esc(beat.tension)}</p></div><details><summary>What supports this scene?</summary><p class="body-copy">${esc(beat.evidence)}</p>${beat.ids.map(id=>byId.get(id)).filter(Boolean).map(e=>row(e)).join('')}</details><p class="kicker field-question">Explore further</p><p class="body-copy">${esc(beat.next)}</p></section>`).join('')}<p class="lead">One route through a much wider landscape.</p><button class="panel-action" data-story-finish>Return to the map →</button>`;
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
  const entry=byId.get(panelState.id),responses=relatedTo(entry);
  content.innerHTML=`<p class="kicker">${esc(title(entry))} / connected companies</p><h2>Existing responses</h2><p class="evidence-note">${responses.length} research records connected through explicit links or shared theme tags. A shared theme does not establish that these products are interchangeable.</p>${responses.slice(0,panelState.limit||60).map(e=>row(e)).join('')}${responses.length>(panelState.limit||60)?'<button class="panel-action" data-panel-more>Show more records</button>':''}`;
 }else if(panelState.type==='responses'){
  const region=regions.find(g=>g.id===panelState.id),responses=entries.filter(e=>e.type==='company'&&inRegion(e,region));
  content.innerHTML=`<p class="kicker">${esc(region.title)} / responses</p><h2>Who is already here?</h2><p class="evidence-note">${responses.length} published company records. Shared theme or published category membership is a research connection, not proof of effectiveness.</p>${responses.slice(0,panelState.limit||60).map(e=>row(e)).join('')}${responses.length>(panelState.limit||60)?'<button class="panel-action" data-panel-more>Show more records</button>':''}`;
 }else{
  content.innerHTML=`<p class="kicker">How to read this atlas</p><h2>Start with people.<br>Stay close to evidence.</h2><p class="body-copy">Who Cares helps venture builders understand ageing and care before deciding what to build. Each person opens a different map of the same published research.</p><h3>From landscape to detail</h3><p class="body-copy">Click a territory to enter its reading level. Its guiding question and data-backed groups appear in the map. Click a group to go deeper; breadcrumbs return to any ancestor. Drag or scroll to pan without changing the level or text. Large collections divide alphabetically so every published record remains reachable. Read evidence opens a full record.</p><h3>Read the connections carefully</h3><p class="body-copy">Territories group research by perspective. Nested groups follow published themes; broader category collections are labelled separately and do not establish product fit. Positions, sizes and colors do not rank venture potential. Illustrations are fictional reusable assets, not testimony.</p><h3>Research is not certainty</h3><p class="body-copy">The atlas uses the repository’s published research snapshot. Original records include hypotheses and analyst decisions, including ideas set aside. Source links, missing evidence and incomplete research remain visible in each record.</p><h3>Explore without a mouse</h3><p class="body-copy">Tab to territories or records and press Enter. With the map focused, use arrow keys to pan, + to enter a visible group, − to go up a level, and Home for the overview. Escape closes the reading panel. Search and list browsing provide an alternative to spatial navigation.</p><p class="evidence-note">The care-workday story is explicitly illustrative. It contains no attributed interviews, invented quotes or measured outcomes.</p>`;
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
 const node=[...tree.all.values()].find(n=>n.entry?.id===beat.focus);if(node)focusNode(node.id,{keepPanel:true});else render();
}
function openStory(step=0,remember=true){
 step=clamp(step,0,activeStory().beats.length-1);
 showPanel({type:'story',step},{remember});highlightStory(step);
 if(step>0)$('panel-content').querySelector(`[data-chapter="${step}"]`)?.scrollIntoView({block:'start'});
}
function choosePersona(key){
 stopNavigation();
 if(!personaMaps[key]||!entries.length)return;
 closePanel(false);persona=key;selectedId=null;selectedRegion=null;
 $('persona-picker').hidden=true;$('workspace').hidden=false;document.querySelector('.orientation').hidden=false;document.querySelector('.atlas-footer').hidden=false;
 $('persona-change').innerHTML=`${illustration(key)}<span><small>Exploring as</small><strong>${esc(personaMaps[key].name)}</strong></span><span aria-hidden="true">⌄</span>`;
 $('story-open').innerHTML=`<span class="story-time">${activeStory().beats[0].time}</span><span>${esc(activeStory().title)}<small>One possible day · Follow the story</small></span><span aria-hidden="true">↗</span>`;
 document.querySelector('h1').textContent=personaMaps[key].heading;$('perspective-note').textContent=personaMaps[key].description;
 buildMap();render();camera=overviewCamera();base=camera.s;previousSize={w:map.clientWidth,h:map.clientHeight};render();setHash();map.focus({preventScroll:true});announce(`${personaMaps[key].name} map. ${regions.length} territories to explore.`);
}
function showPicker(){stopNavigation();$('persona-picker').hidden=false;$('workspace').hidden=true;document.querySelector('.orientation').hidden=true;document.querySelector('.atlas-footer').hidden=true;history.replaceState(null,'','#/');document.querySelector('[data-persona]')?.focus();}
$('persona-cards').innerHTML=Object.entries(personaMaps).map(([key,definition])=>`<button class="persona-card" data-persona="${key}" aria-label="Explore the ${definition.name.toLowerCase()} map">${illustration(key)}<h3>${esc(definition.name)}</h3><p>${esc(definition.intro)}</p><span class="enter">Enter this world <span aria-hidden="true">↗</span></span></button>`).join('');
document.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target)return;
 if(target.hasAttribute('data-map-overview')){toOverview();return;}
 if(target.dataset.zoom){focusNode(target.dataset.zoom);return;}
 if(target.dataset.zoomDeeper){exploreDeeper(target.dataset.zoomDeeper);return;}
 if(target.dataset.persona){choosePersona(target.dataset.persona);return;}
 if(target.dataset.entry){if(event.detail>0&&dragged&&target.closest('#map'))return;openEntry(target.dataset.entry);return;}
 if(target.dataset.region){if(event.detail>0&&dragged)return;openRegion(target.dataset.region);return;}
 if(target.hasAttribute('data-panel-more')){panelState.limit=(panelState.limit||60)+60;const top=$('panel-content').scrollTop;renderPanel();$('panel-content').scrollTop=top;return;}
 if(target.hasAttribute('data-more')){panelState.limit=(panelState.limit||60)+60;renderSearch();return;}
 if(target.dataset.related){showPanel({type:'related',id:target.dataset.related});return;}
 if(target.dataset.listRegion){showPanel({type:'responses',id:target.dataset.listRegion});return;}
 if(target.dataset.storyStep!==undefined){openStory(Number(target.dataset.storyStep),false);return;}
 if(target.hasAttribute('data-story-finish')){closePanel();return;}
});
$('panel-close').onclick=()=>closePanel();$('panel-back').onclick=backPanel;
$('home').onclick=()=>persona?toOverview():showPicker();$('persona-change').onclick=showPicker;
$('minimap-home').onclick=toOverview;
$('map-up').onclick=()=>focusNode(mapParent);
$('overview').onclick=toOverview;$('recover').onclick=toOverview;
$('zoom-in').onclick=()=>{const candidates=readingLevel(tree,activeGroup,camera,map.clientWidth,map.clientHeight).filter(v=>v.node.children?.length);const next=candidates.sort((a,b)=>Math.hypot(a.box.x+a.box.w/2-map.clientWidth/2,a.box.y+a.box.h/2-map.clientHeight/2)-Math.hypot(b.box.x+b.box.w/2-map.clientWidth/2,b.box.y+b.box.h/2-map.clientHeight/2))[0];if(next)focusNode(next.node.id);};$('zoom-out').onclick=goUp;
$('story-open').onclick=()=>openStory();
function ensureMap(){if(!persona)choosePersona('worker');}
$('search-open').onclick=()=>{ensureMap();showPanel({type:'search'});$('research-search').focus();};
$('list-open').onclick=()=>{showPanel({type:'search'});$('research-search').focus();};
$('about-open').onclick=()=>{ensureMap();showPanel({type:'about'});};
$('panel-content').addEventListener('scroll',()=>{if(panelState?.type==='story')panelState.scrollTop=$('panel-content').scrollTop;},{passive:true});
$('panel-content').addEventListener('input',event=>{if(event.target.id==='research-search'){panelState.limit=60;renderSearch();}});
map.addEventListener('wheel',event=>{
 event.preventDefault();stopNavigation();
 const unit=event.deltaMode===1?16:event.deltaMode===2?map.clientHeight:1;
 camera.x-=event.deltaX*unit;camera.y-=event.deltaY*unit;render();
},{passive:false});
map.addEventListener('pointerdown',event=>{
 if(event.target.closest('#minimap-home'))return;
 if(event.button!==0)return;stopNavigation();
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
  const center=values=>({x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2});
  const a=center(before),b=center(after);
  // Two-finger gestures pan within this reading level; no changing typography or LOD.
  camera.x+=b.x-a.x;camera.y+=b.y-a.y;
 }else{camera.x+=event.clientX-previous.x;camera.y+=event.clientY-previous.y;}
 render();
});
map.addEventListener('pointerup',event=>{
 pointers.delete(event.pointerId);map.releasePointerCapture(event.pointerId);
 if(!pointers.size){map.classList.remove('dragging');gestureStart=null;}
 if(!dragged){const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('button');if(hit?.dataset.zoom){event.preventDefault();focusNode(hit.dataset.zoom);}else if(hit?.dataset.zoomDeeper){event.preventDefault();exploreDeeper(hit.dataset.zoomDeeper);}else if(hit?.dataset.entry){event.preventDefault();openEntry(hit.dataset.entry);}else if(hit?.dataset.region){event.preventDefault();openRegion(hit.dataset.region);}else if(hit?.dataset.listRegion){event.preventDefault();showPanel({type:'responses',id:hit.dataset.listRegion});}}
});
map.addEventListener('pointercancel',event=>{pointers.delete(event.pointerId);dragged=true;map.classList.remove('dragging');});
// Pointer selection is handled on release, so dragging never activates a record.
map.addEventListener('click',event=>{if(event.detail>0&&!event.target.closest('#minimap-home'))event.stopPropagation();});
map.addEventListener('keydown',event=>{
 if(event.target!==map)return;
 const actions={'+':()=>$('zoom-in').click(),'=':()=>$('zoom-in').click(),'-':goUp,Home:toOverview,ArrowLeft:()=>{camera.x+=50;render();},ArrowRight:()=>{camera.x-=50;render();},ArrowUp:()=>{camera.y+=50;render();},ArrowDown:()=>{camera.y-=50;render();}};
 if(actions[event.key]){event.preventDefault();stopNavigation();actions[event.key]();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('inspector').hidden){event.preventDefault();closePanel();}});
new ResizeObserver(()=>{
 if(!ready||$('workspace').hidden)return;
 const w=map.clientWidth,h=map.clientHeight;
 const nextMobile=window.innerWidth<701;
 if(nextMobile!==mobile){const restoreGroup=activeGroup;buildMap();render();if(restoreGroup&&tree.all.has(restoreGroup))focusNode(restoreGroup);else{camera=overviewCamera();base=camera.s;}}
 else if(previousSize.w&&previousSize.h&&$('inspector').hidden){camera.x+=(w-previousSize.w)/2;camera.y+=(h-previousSize.h)/2;}
 previousSize={w,h};render();
}).observe(map);

try{
 const response=await fetch('data/atlas/index.json');if(!response.ok)throw new Error(`Index ${response.status}`);
 const data=await response.json();entries=data.entries.filter(entry=>entry.published!==false);
 if(stressCount){entries.push(...Array.from({length:stressCount},(_,i)=>({id:'synthetic-'+i,title:'Synthetic service '+String(i).padStart(6,'0'),type:'company',themes:[i%2?'T11':'T13'],summary:'Synthetic scale-test record. Not real research or evidence.'})));const banner=document.createElement('div');banner.className='stress-banner';banner.textContent=`SYNTHETIC SCALE TEST · ${stressCount.toLocaleString()} generated records · Not research`;document.body.prepend(banner);document.title='SCALE TEST · Who Cares';}
 byId=new Map(entries.map(entry=>[entry.id,entry]));$('loading').hidden=true;
 const bits=location.hash.replace(/^#\/?/,'').split('/');
 if(personaMaps[bits[0]]){choosePersona(bits[0]);if(bits[1]==='e'&&byId.has(bits[2]))openEntry(bits[2]);else if(bits[1]==='story')openStory(Number(bits[2])||0);else if(bits[1]==='g'&&tree.all.has(decodeURIComponent(bits.slice(2).join('/'))))focusNode(decodeURIComponent(bits.slice(2).join('/')));}
 else if(bits[0]==='e'&&byId.has(bits[1])){choosePersona('worker');openEntry(bits[1]);}
}catch(error){
 $('persona-cards').innerHTML='<p class="no-results">The research index could not load. Check your connection and reload to retry.</p>';
 $('loading').textContent='Research could not load.';console.error('Atlas could not load its research index',error);
}
