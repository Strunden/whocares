import {navigationRoots} from './atlas-needs.js';
import {loadAtlas} from './atlas-loader.js';
import {setProductMedia} from './atlas-media.js';
import {availableStory} from './atlas-navigation.js';
import {createNativePan} from './atlas-native-pan.js?v=native-pan-35';
import {wheelGesture,centroid,separation,touchIntent} from './atlas-gestures.js?v=native-pan-35';
import {personaMaps, insights, personaStories} from './atlas-content.js?v=native-pan-35';
import {clamp, zoomAt, elasticZoomScale, elasticPanBy, interpolateCamera} from './atlas-camera.js?v=native-pan-35';
import {buildHierarchy,readingLevel,ancestry,scenePanBounds,panWithinScene,themesFor,levelScale,levelZoomLimits,frameLevel,entryFrame,perspectiveHierarchy,embedHierarchy} from './atlas-layout.js?v=spatial-records-48';
import {portrait as illustration} from './atlas-assets.js';

import {graphRecords,graphRoots,recordLabel,recordStatus,evidenceLabels,scopeDescription} from './atlas-records.js?v=native-pan-35';
import {graphSourceBlock} from './atlas-sources.js?v=source-details-13';

import {esc,short,companyLogo,recordMedia,createMapView} from './atlas-view.js?v=native-pan-35';

const $ = id => document.getElementById(id);
const safeUrl = value => /^https?:\/\//i.test(value || '') ? value : '';
const title = entry => entry.title || entry.name || 'Untitled research';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const map = $('map');
let graphData=null,graphEntries=[];
let entries=[], byId=new Map(), regions=[], persona=null;
let camera={s:1,x:0,y:0}, level=0, selectedId=null;
let panelHistory=[], panelState=null, closedCamera=null, closedGroup=null, lastFocus=null;
let previousSize={w:0,h:0}, mobile=false, ready=false;
const stressCount=["localhost","127.0.0.1"].includes(location.hostname)?Math.min(100000,Math.max(0,Number(new URLSearchParams(location.search).get("stress"))||0)):0;
let storyObserver=null;
let tree=null,activeGroup=null;const levelCameras=new Map();const mapView=createMapView($('labels'));
let wheelState=null,wheelTimer,touchState=null,touchTimer,pointerMode=null;
const activeStory=()=>availableStory(personaStories[persona]||personaStories.worker,byId);
const pointers=new Map();
let gestureStart=null, dragged=false, navigationFrame=0, finishNavigation=null;
const panSurface=$('pan-surface');
const nativePan=createNativePan(map,panSurface,next=>{
 if(!ready||navigationFrame)return;
 if(Math.abs(camera.x-next.x)<.01&&Math.abs(camera.y-next.y)<.01&&camera.s===next.s)return;
 camera=next;render(true);
});

function isProblem(entry){return ['theme','parent_theme'].includes(entry.idea_kind);}
function inRegion(entry,region){return themesFor(entry).some(theme=>region.themes.includes(theme));}
function regionFor(entry){return regions.find(region=>inRegion(entry,region));}
function status(entry){return recordStatus(entry);}
function relatedTo(entry){return entries.filter(other=>other.id!==entry.id && ((entry.related||[]).includes(other.id)||(other.related||[]).includes(entry.id)||other.themes?.some(t=>entry.themes?.includes(t))));}
function row(entry,context=''){
 return `<button class="entry" data-entry="${esc(entry.id)}"><strong>${esc(title(entry))}</strong><small>${esc(context || (entry.type==='company'?'Company · ':'Research · ')+status(entry))}</small></button>`;
}
function announce(text){$('announcement').textContent=text;}
function toOverview({restore=false}={}){navigateTo(persona,null,{restore});}
function readingScale(id=activeGroup){return levelScale(tree,id,map.clientWidth);}
function zoomLimits(){return levelZoomLimits(tree,activeGroup,map.clientWidth,map.clientHeight);}
let cameraReturnFrame=0,cameraReturnTimer,zoomAnchor=null,panGesture=null,panPending=false;
function stopCameraReturn(resetPan=true,finishPan=true){
 cancelAnimationFrame(cameraReturnFrame);cameraReturnFrame=0;clearTimeout(cameraReturnTimer);
 if(resetPan)panGesture=null;
 if(finishPan&&panPending){camera=panWithinScene(tree,activeGroup,camera,0,0,map.clientWidth,map.clientHeight);panPending=false;}
}
function settleCamera(){
 clearTimeout(cameraReturnTimer);if(navigationFrame||pointers.size)return;
 const {min,max}=zoomLimits(),anchor=zoomAnchor||{x:map.clientWidth/2,y:map.clientHeight/2};
 const start={...camera},zoomed=zoomAt(start,1,anchor,min,max);
 const target=panPending?panWithinScene(tree,activeGroup,zoomed,0,0,map.clientWidth,map.clientHeight):zoomed;
 panGesture=null;
 if(Math.abs(start.s-target.s)<.000001&&Math.abs(start.x-target.x)<.01&&Math.abs(start.y-target.y)<.01){panPending=false;return;}
 const began=performance.now();
 function frame(now){const t=reducedMotion.matches?1:Math.min(1,(now-began)/240),ease=1-(1-t)**3;
  camera={s:start.s+(target.s-start.s)*ease,x:start.x+(target.x-start.x)*ease,y:start.y+(target.y-start.y)*ease};render();
  cameraReturnFrame=t<1?requestAnimationFrame(frame):0;if(t===1)panPending=false;
 }
 cameraReturnFrame=requestAnimationFrame(frame);
}
function zoomMap(factor,anchor={x:map.clientWidth/2,y:map.clientHeight/2}){
 if(navigationFrame)return;
 stopCameraReturn(true,false);panPending=false;zoomAnchor=anchor;
 const {min,max}=zoomLimits();
 const s=reducedMotion.matches?clamp(camera.s*factor,min,max):elasticZoomScale(camera.s,factor,min,max);
 camera=zoomAt(camera,s/camera.s,anchor,0,Infinity);render();
 cameraReturnTimer=setTimeout(settleCamera,180);
}

function beginNativePan(){
 const pending=panPending,start={...camera};stopCameraReturn(true,false);panPending=false;
 const {min,max}=zoomLimits();
 if(!pending&&camera.s>=min&&camera.s<=max)return;
 camera=zoomAt(camera,1,zoomAnchor||{x:map.clientWidth/2,y:map.clientHeight/2},min,max);
 if(pending)camera=panWithinScene(tree,activeGroup,camera,0,0,map.clientWidth,map.clientHeight);
 // Resolve an interrupted custom gesture once, before native input takes over.
 // Never keep its animation writing offsets during native momentum.
 if(camera.s!==start.s||camera.x!==start.x||camera.y!==start.y)render();
}

function zoomStep(direction){
 if(navigationFrame)return;stopCameraReturn();
 const limits=zoomLimits(),s=clamp(camera.s*(direction>0?1.2:1/1.2),limits.min,limits.max);
 const fit=frameLevel(tree,activeGroup,map.clientWidth,map.clientHeight);
 if(direction<0&&s<=fit.s*1.02){
  // Once the level can fit, recover its whole extent rather than a cropped corner.
  camera={s,x:map.clientWidth/2-(map.clientWidth/2-fit.x)/fit.s*s,y:map.clientHeight/2-(map.clientHeight/2-fit.y)/fit.s*s};
 }else if(direction>0){
  const cx=map.clientWidth/2,cy=map.clientHeight/2;
  const items=readingLevel(tree,activeGroup,camera,map.clientWidth,map.clientHeight);
  const nearest=items.sort((a,b)=>Math.hypot(a.box.x+a.box.w/2-cx,a.box.y+a.box.h/2-cy)-Math.hypot(b.box.x+b.box.w/2-cx,b.box.y+b.box.h/2-cy))[0];
  const x=nearest?nearest.box.x+nearest.box.w/2:cx,y=nearest?nearest.box.y+nearest.box.h/2:cy;
  camera={s,x:cx-(x-camera.x)/camera.s*s,y:cy-(y-camera.y)/camera.s*s};
 }else camera=zoomAt(camera,s/camera.s,{x:map.clientWidth/2,y:map.clientHeight/2},limits.min,limits.max);
 render();
}

function stopNavigation(){cancelAnimationFrame(navigationFrame);navigationFrame=0;finishNavigation=null;map.classList.remove('navigating');$('labels').style.opacity='';}
function makeTree(key){
 return buildHierarchy([],[],{portrait:mobile,extraRoots:navigationRoots(graphEntries,key)});
}
const locationKey=(key,group)=>`${key||'people'}/${group||'overview'}`;
function installLevel(key,group,nextTree){
 persona=key;activeGroup=group;tree=nextTree;ready=true;mapView.clear();
 regions=tree.roots.map(n=>({...n,x:n.box.x+n.box.w/2,y:n.box.y+n.box.h/2}));
 $('workspace').hidden=false;
 $('persona-change').textContent=key?personaMaps[key].name:'';
 $('brand-tagline').hidden=!!group;
 $('map-breadcrumbs').hidden=!group;
}
// All level changes pass through here. Pan and zoom only update the camera.
function navigateTo(key,group=null,{restore=true,animate=true,keepPanel=false,saveCurrent=true}={}){
 const interrupted=!!navigationFrame;stopCameraReturn();stopNavigation();if(!keepPanel)closePanel(false);
 if(ready&&saveCurrent&&!interrupted)levelCameras.set(locationKey(persona,activeGroup),{...camera});
 mobile=window.innerWidth<701;$('workspace').hidden=false;
 const nextTree=key===persona&&tree?tree:makeTree(key);
 if(group&&!nextTree.all.has(group))group=null;

 const destination=nextTree.all.get(group);
 let target=restore&&levelCameras.get(locationKey(key,group))||entryFrame(nextTree,group,map.clientWidth,map.clientHeight);
 const limits=levelZoomLimits(nextTree,group,map.clientWidth,map.clientHeight);
 target=zoomAt(target,1,{x:map.clientWidth/2,y:map.clientHeight/2},limits.min,limits.max);
 const start={...camera},began=performance.now();let swapped=false;
 const focusBox=destination?.box||tree?.all.get(key)?.box||tree?.all.get(activeGroup)?.box;
 const focus=focusBox?{x:focusBox.x+focusBox.w/2,y:focusBox.y+focusBox.h/2}:{x:(map.clientWidth/2-start.x)/start.s,y:(map.clientHeight/2-start.y)/start.s};
 const enter=()=>{installLevel(key,group,nextTree);swapped=true;};
 const finish=()=>{if(!swapped)enter();camera=target;stopNavigation();render();previousSize={w:map.clientWidth,h:map.clientHeight};setHash();if(!keepPanel)map.focus({preventScroll:true});announce(`${key?personaMaps[key].name:'Needs'} · ${group?nextTree.all.get(group).title:'Overview'}`);};
 finishNavigation=finish;
 wheelState=null;touchState=null;if(!keepPanel){selectedId=null;}
 if(!ready||!animate||reducedMotion.matches){finish();return;}
 map.classList.add('navigating');
 function frame(now){
  const t=Math.min(1,(now-began)/420),ease=t*t*(3-2*t);
  camera=interpolateCamera(start,target,focus,ease);
  if(t>=.5&&!swapped)enter();
  render();$('labels').style.opacity=String(Math.abs(t*2-1));
  if(t<1)navigationFrame=requestAnimationFrame(frame);else finish();
 }
 navigationFrame=requestAnimationFrame(frame);
}
function focusNode(id,{keepPanel=false}={}){if(tree.all.has(id))navigateTo(persona,id,{keepPanel});}
function goUp(){const node=tree.all.get(activeGroup);navigateTo(node?.parent||activeGroup?persona:null,node?.parent||null);}
function panMap(dx,dy){
 if(navigationFrame)return;
 const resumingPan=panPending;stopCameraReturn(false,false);panPending=true;
 if(!panGesture){
  const bounds=scenePanBounds(tree,activeGroup,camera,map.clientWidth,map.clientHeight);
  // An anchored zoom or entry framing can start outside the centre bounds.
  // Include that starting position for this gesture so its first delta cannot jump.
  if(!resumingPan){
   bounds.minX=Math.min(bounds.minX,camera.x);bounds.maxX=Math.max(bounds.maxX,camera.x);
   bounds.minY=Math.min(bounds.minY,camera.y);bounds.maxY=Math.max(bounds.maxY,camera.y);
  }
  panGesture={bounds};
 }
 camera=reducedMotion.matches?{...camera,x:clamp(camera.x+dx,panGesture.bounds.minX,panGesture.bounds.maxX),y:clamp(camera.y+dy,panGesture.bounds.minY,panGesture.bounds.maxY)}:elasticPanBy(camera,dx,dy,panGesture.bounds,map.clientWidth,map.clientHeight);
 render();cameraReturnTimer=setTimeout(settleCamera,180);
}
function render(fromNativeScroll=false){
 if(!ready)return;
 if(!fromNativeScroll)nativePan.setView(camera,scenePanBounds(tree,activeGroup,camera,map.clientWidth,map.clientHeight),map.clientWidth,map.clientHeight);
 const origin=nativePan.origin;
 // Dot positions share the world origin; subdivide only to keep a useful density.
 const gridWorldStep=2**Math.floor(Math.log2(32/camera.s));
 panSurface.style.backgroundSize=`${gridWorldStep*camera.s}px ${gridWorldStep*camera.s}px`;
 panSurface.style.backgroundPosition=`${origin.x}px ${origin.y}px`;
 const frontier=readingLevel(tree,activeGroup,camera,map.clientWidth,map.clientHeight,{includeOffscreen:true});
 $('persona-change').hidden=true;
 $('persona-change').setAttribute('aria-current',activeGroup?'false':'location');
 const path=ancestry(tree,activeGroup);
 const crumbKey=persona+'/'+(activeGroup||'');
 if($('map-breadcrumbs').dataset.path!==crumbKey){
  $('map-breadcrumbs').dataset.path=crumbKey;
  const trail=path.length>5?[...path.slice(0,2),null,...path.slice(-2)]:path;
  $('map-breadcrumb-trail').innerHTML=trail.map(n=>n?`<span aria-hidden="true">/</span><button title="${esc(n.title)}" ${n.id===activeGroup&&n.entry?`data-entry="${esc(n.entry.id)}" aria-label="Read scope and sources: ${esc(n.title)}"`:`data-zoom="${esc(n.id)}"`} ${n.id===activeGroup?'aria-current="location"':''}>${esc(n.kind==='range'?n.count.toLocaleString()+' records':n.shortTitle||n.title)}</button>`:`<span aria-hidden="true">/</span><select id="ancestor-jump" aria-label="Earlier research levels"><option value="">… Earlier levels</option>${path.slice(2,-2).map(a=>`<option value="${esc(a.id)}">${a.count.toLocaleString()} records · ${esc(a.shortTitle||a.title)}</option>`).join('')}</select>`).join('');
  $('ancestor-jump')?.addEventListener('change',event=>{if(event.target.value)focusNode(event.target.value);});
  $('map-breadcrumbs').scrollLeft=$('map-breadcrumbs').scrollWidth;
 }
 mapView.render(frontier,{tree,persona,selectedId,width:map.clientWidth,height:map.clientHeight,offsetX:origin.x-camera.x,offsetY:origin.y-camera.y});
 const nextLevel=Math.min(2,path.length);
 if(level!==nextLevel){level=nextLevel;announce(['Needs','Specific situations','Existing solutions'][level]);}
 $('level-range').textContent=activeGroup?`${frontier.filter(v=>Math.max(0,Math.min(v.box.x+v.box.w,map.clientWidth)-Math.max(v.box.x,0))*Math.max(0,Math.min(v.box.y+v.box.h,map.clientHeight)-Math.max(v.box.y,0))>=v.box.w*v.box.h*.5).length} of ${tree.all.get(activeGroup).children?.length??1} items in view · Drag to explore`:`${tree.roots.length} needs · Pan to explore`;
 map.dataset.perspective=persona||'people';map.dataset.level=String(level);map.dataset.group=activeGroup||'overview';map.dataset.camera=JSON.stringify(camera);map.dataset.rendered=String(frontier.length);map.dataset.totalNodes=String(tree.all.size);
 const limits=zoomLimits();$('zoom-value').value=Math.round(camera.s/readingScale()*100)+'%';$('zoom-in').disabled=camera.s>=limits.max-.00001;$('zoom-out').disabled=camera.s<=limits.min+.00001;map.dataset.zoom=Math.round(camera.s/readingScale()*100);
 document.querySelectorAll('[data-level]').forEach(el=>el.classList.toggle('current',Number(el.dataset.level)===(persona?level:-1)));
 $('map-empty').hidden=!!navigationFrame||frontier.length>0;
 $('map-empty-message').textContent=tree.all.get(activeGroup)?.children?.length===0?'Research coverage is incomplete. No solutions have been mapped here yet.':'No items in view.';
}
function exploreDeeper(id){focusNode(id);}
function setHash(){
 const key=persona||'all';
 const route=panelState?.type==='entry'?`/${key}/e/${panelState.id}${activeGroup?'?within='+encodeURIComponent(activeGroup):''}`:activeGroup?`/${key}/g/${encodeURIComponent(activeGroup)}`:persona?`/${persona}`:'/';
 history.replaceState(null,'',`#${route}`);
}

function showPanel(state,{remember=true,focus=true}={}){
 stopCameraReturn();
 if(finishNavigation)finishNavigation();
 if(panelState?.type==='story'){panelState.scrollTop=$('panel-content').scrollTop;panelState.expanded=[...$('panel-content').querySelectorAll('[data-chapter]')].filter(chapter=>chapter.querySelector('details').open).map(chapter=>Number(chapter.dataset.chapter));}
 if(remember&&panelState)panelHistory.push({...panelState});
 if($('inspector').hidden){closedCamera={...camera};closedGroup=activeGroup;lastFocus=document.activeElement;$('inspector').hidden=false;}
 panelState=state;renderPanel();setHash();
 if(focus)$('panel-content').focus({preventScroll:true});
 render();
}
function closePanel(restore=true){
 stopCameraReturn();stopNavigation();
 storyObserver?.disconnect();
 const wasOpen=!$('inspector').hidden;
 $('inspector').hidden=true;panelState=null;panelHistory=[];selectedId=null;
 if(restore&&closedCamera){activeGroup=closedGroup;render();const limits=zoomLimits();camera=zoomAt(closedCamera,1,{x:map.clientWidth/2,y:map.clientHeight/2},limits.min,limits.max);render();}
 closedCamera=null;closedGroup=null;
 previousSize={w:map.clientWidth,h:map.clientHeight};
 if(wasOpen&&lastFocus?.isConnected&&!lastFocus.hidden)lastFocus.focus({preventScroll:true});
 setHash();
}
function openRegion(id){selectedId=null;focusNode(id);}
async function openEntry(id,{remember=true}={}){
 const entry=byId.get(id);if(!entry)return;
 selectedId=id;
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
 return `<h3>Evidence & provenance</h3><p class="evidence-note">Research snapshot: ${esc(entry.writeup?.status?.as_of||entry.added_date||'Date not recorded')}. ${entry.type==='company'?'Product descriptions may be company claims. They do not establish effectiveness in practice.':'This is an analyst research record, not a validated finding.'}</p>${sources.length?`<ul class="source-list">${sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label)} ↗</a><small>${esc(new URL(source.url).hostname)}${source.date?' · Accessed '+esc(source.date):''}</small></li>`).join('')}</ul>`:`<p class="evidence-note">No direct public source is attached to this record. Internal provenance: ${esc(entry.source_scan||'not recorded')}. Treat its claims as unverified until traced to primary evidence.</p>`}`;
}
function graphPanel(entry){
 const sourceBlock=graphSourceBlock;
 const linked=entry.links.map(r=>({r,e:byId.get(r.from_id===entry.id?r.to_id:r.from_id)})).filter(v=>v.e);
 return `<p class="kicker">Research graph · ${esc(recordLabel(entry))}</p><h2>${esc(entry.scope?.navigation?.title||entry.title)}</h2><span class="status unresolved">${esc(recordStatus(entry))}</span><p class="lead">${esc(entry.statement)}</p>${recordMedia(entry,true)}<h3>Scope of this claim</h3><dl>${Object.entries(entry.scope||{}).filter(([key])=>key!=='navigation').map(([k,v])=>`<div class="fact"><dt>${esc(k)}</dt><dd>${Array.isArray(v)?v.map(item=>esc(item)).join('<br>'):v&&typeof v==='object'?esc(scopeDescription(v)):k==='website'&&safeUrl(v)?`<a href="${esc(v)}" target="_blank" rel="noopener">Visit provider ↗</a>`:esc(v)}</dd></div>`).join('')}</dl><h3>Research basis</h3><p class="body-copy">${esc(entry.confidence?.rationale)}</p><h3>Sources for this claim</h3>${sourceBlock(entry.sources)}<h3>Connected research</h3>${linked.map(({r,e})=>`<div class="graph-link"><p class="kicker">${esc(evidenceLabels[r.epistemic_status]||r.epistemic_status)}</p>${row(e)}<p class="relation-direction">${esc(byId.get(r.from_id)?.title||r.from_id)} <b>${esc(r.relation.replaceAll('_',' '))}</b> ${esc(byId.get(r.to_id)?.title||r.to_id)}</p><p class="evidence-note">${esc(r.statement)}</p><details><summary>Basis for this connection</summary><p class="evidence-note">${esc(r.confidence?.rationale)}</p>${sourceBlock(r.evidence)}</details></div>`).join('')}${entry.company_id?`<button class="panel-action" data-entry="${esc(entry.company_id)}">Open full company record →</button>`:''}<p class="evidence-note">A documented offering is not proof of effectiveness.</p>`;
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
  if(entry.graph){content.innerHTML=graphPanel(entry);content.scrollTop=0;return;}
  const related=relatedTo(entry),responses=related.filter(e=>e.type==='company'),questions=related.filter(e=>e.type!=='company');
  const product=entry.writeup?.what_it_does?.text||entry.deep_dive?.product||entry.job||entry.scene?.job;
  const next=insight?.next||entry.deep_dive?.open_questions?.[0]||region?.question||'What would you need to observe or verify before this claim could guide a decision?';
  content.innerHTML=`<p class="kicker">${esc(region?.title||'Research index')} / ${entry.type==='company'?'company':'problem'}</p>${entry.type==='company'?companyLogo(entry):''}<h2>${esc(title(entry))}</h2><span class="status ${entry.type!=='company'||status(entry)==='Research incomplete'?'unresolved':''}">${esc(status(entry))}</span><p class="lead">${esc(entry.summary||entry.research_summary||'Research detail is not yet available.')}</p>${recordMedia(entry,true)}${insight?`<div class="insight"><p class="kicker">Why this deserves a closer look · interpretation</p><p>${esc(insight.tension)}</p></div>`:''}${section(entry.type==='company'?'What it does':'The job or question',product)}${insight?.people?section('Who is involved',insight.people):''}<dl>${[ ['Who pays',entry.who_pays||entry.scene?.payer||entry.deep_dive?.payer],['Buyer / customer',entry.deep_dive?.buyer],['Research decision',entry.why_dropped||entry.kill_reason] ].filter(([,value])=>value).map(([label,value])=>`<div class="fact"><dt>${label}${label==='Research decision'?' · analyst interpretation':''}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${entry.type!=='company'&&!entry.who_pays&&!entry.scene?.payer?'<p class="evidence-note">A payer has not been established in this record.</p>':''}<div class="insight"><p class="kicker">Next research question · editorial prompt</p><p>${esc(next)}</p></div>${entry.type==='company'?section('Known gaps',entry.deep_dive?.risks?.join(' ')):''}${evidence(entry)}${responses.length?`<h3>Existing responses in the same research</h3>${responses.slice(0,5).map(e=>row(e)).join('')}${responses.length>5?`<button class="panel-action" data-related="${entry.id}">Browse all ${responses.length} connected companies</button>`:''}<p class="evidence-note">Related by the index’s explicit links or shared theme tags. Inclusion does not mean a company has solved the problem.</p>`:''}${questions.length?`<h3>${entry.type==='company'?'Problems & hypotheses':'Follow the question'}</h3>${questions.slice(0,10).map(e=>row(e)).join('')}${questions.length>10?`<button class="panel-action" data-related="${entry.id}">Browse all connected research</button>`:''}`:''}${entry.type!=='company'?'<p class="evidence-note">An idea set aside can still concern a real human need. Research status is not an opportunity score.</p>':''}`;
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
  content.innerHTML=`<p class="kicker">Connected research</p><h2>Follow your question.</h2><label class="sr-only" for="research-search">Search problems and companies</label><input class="search-field" id="research-search" type="search" placeholder="A problem, company or keyword…" autocomplete="off"><p class="search-summary">Search ${entries.length+graphEntries.length} source and research records, across every perspective.</p><div id="search-results"></div>`;
  $('research-search').value=panelState.query||'';renderSearch();
 }else if(panelState.type==='related'){
  const entry=byId.get(panelState.id),responses=relatedTo(entry);
  content.innerHTML=`<p class="kicker">${esc(title(entry))} / connected companies</p><h2>Existing responses</h2><p class="evidence-note">${responses.length} research records connected through explicit links or shared theme tags. A shared theme does not establish that these products are interchangeable.</p>${responses.slice(0,panelState.limit||60).map(e=>row(e)).join('')}${responses.length>(panelState.limit||60)?'<button class="panel-action" data-panel-more>Show more records</button>':''}`;
 }else if(panelState.type==='responses'){
  const region=regions.find(g=>g.id===panelState.id),responses=entries.filter(e=>e.type==='company'&&inRegion(e,region));
  content.innerHTML=`<p class="kicker">${esc(region.title)} / responses</p><h2>Who is already here?</h2><p class="evidence-note">${responses.length} published company records. Shared theme or published category membership is a research connection, not proof of effectiveness.</p>${responses.slice(0,panelState.limit||60).map(e=>row(e)).join('')}${responses.length>(panelState.limit||60)?'<button class="panel-action" data-panel-more>Show more records</button>':''}`;
 }else{
  content.innerHTML=`<h2>Start with a person’s need.</h2><p class="body-copy">Explore specific situations, then existing products, services and organised support. Open a record to inspect its sources, fit and limitations.</p><p class="body-copy">Drag or scroll to pan. Zoom magnifies the current level without changing its content. Click to enter the next level; breadcrumbs take you back.</p><p class="body-copy">An offering is not proof of effectiveness. Empty branches mean research coverage is incomplete, not that no solutions exist. Search also includes source records that have not yet been placed on the map.</p><p class="body-copy">With the map focused, arrow keys pan, + and − zoom, and Backspace returns. Escape closes a record.</p>`;
 }
 content.scrollTop=panelState.type==='story'?(panelState.scrollTop||0):0;
}
function renderSearch(){
 const q=($('research-search')?.value||'').trim().toLowerCase();panelState.query=q;
 const matches=[...graphEntries,...entries].filter(e=>!q||[title(e),e.summary,e.job,e.tag].join(' ').toLowerCase().includes(q));
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
function activateMapNode(id){
 if(navigationFrame||pointers.size)return;
 const node=tree.all.get(id);if(!node)return;
 if(node.personaKey)choosePersona(node.personaKey);else if(node.viewKind||node.children?.length)focusNode(node.id);else if(node.entry)openEntry(node.entry.id);
}
function choosePersona(key,options={}){if(personaMaps[key]&&entries.length)navigateTo(key,null,options);}
function showPicker(){navigateTo(null);}
document.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target)return;
 if(target.hasAttribute('data-map-overview')){toOverview({restore:true});return;}
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
function fitCurrentLevel(){stopCameraReturn();camera=frameLevel(tree,activeGroup,map.clientWidth,map.clientHeight);render();}
document.addEventListener('error',event=>{if(event.target.matches?.('.record-media img')){event.target.closest('figure').hidden=true;}if(event.target.matches?.('.company-logo img')){event.target.hidden=true;event.target.parentElement.classList.add('logo-missing');}},true);
$('panel-close').onclick=()=>closePanel();$('panel-back').onclick=backPanel;
$('study-search').onclick=()=>showPanel({type:'search'});$('study-help').onclick=()=>showPanel({type:'help'});
$('home').onclick=()=>showPicker();$('persona-change').onclick=()=>toOverview({restore:true});$('icps-home').onclick=showPicker;
$('overview').onclick=fitCurrentLevel;$('recover').onclick=fitCurrentLevel;
$('zoom-in').onclick=()=>zoomStep(1);$('zoom-out').onclick=()=>zoomStep(-1);
function ensureMap(){if(!ready)showPicker();}
$('panel-content').addEventListener('scroll',()=>{if(panelState?.type==='story')panelState.scrollTop=$('panel-content').scrollTop;},{passive:true});
$('panel-content').addEventListener('input',event=>{if(event.target.id==='research-search'){panelState.limit=60;renderSearch();}});
map.addEventListener('wheel',event=>{
 if(navigationFrame||pointers.size){event.preventDefault();return;}
 const rect=map.getBoundingClientRect();
 wheelState=wheelGesture(wheelState,{now:performance.now(),zoom:event.ctrlKey||event.metaKey,anchor:{x:event.clientX-rect.left,y:event.clientY-rect.top}});
 clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheelState=null;delete map.dataset.gesture;},180);
 if(!wheelState.accept){event.preventDefault();return;}
 map.dataset.gesture=wheelState.mode;
 const unit=event.deltaMode===1?16:event.deltaMode===2?map.clientHeight:1;
 if(wheelState.mode==='zoom'){
  event.preventDefault();zoomMap(Math.exp(clamp(-event.deltaY*unit*.008,-.18,.18)),wheelState.anchor);
 }else{
  // Let the browser track fingers, momentum and rubber-band release.
  // No pan timer, synthetic spring or scroll-offset write on this path.
  beginNativePan();
 }
},{passive:false});
function updateTouch(){
 if(!touchState||touchState.blocked||pointers.size!==2||navigationFrame)return;
 const after=[...pointers.values()];
 touchState.mode=touchIntent(touchState.start,after,touchState.mode,performance.now()-touchState.began);
 if(!touchState.mode)return;
 pointerMode=touchState.mode;map.dataset.gesture=pointerMode;
 if(pointerMode==='zoom')zoomMap(separation(after)/Math.max(1,separation(touchState.previous)),touchState.anchor);
 else{const a=centroid(touchState.previous),b=centroid(after);panMap(b.x-a.x,b.y-a.y);}
 touchState.previous=after;
}
map.addEventListener('pointerdown',event=>{
 if(event.button!==0||navigationFrame)return;
 stopCameraReturn(pointers.size===0,false);wheelState=null;clearTimeout(wheelTimer);
 pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(pointers.size===1){touchState=null;pointerMode=null;dragged=false;gestureStart={x:event.clientX,y:event.clientY};}
 else if(pointers.size===2&&!touchState){
  dragged=true;const start=[...pointers.values()];
  const rect=map.getBoundingClientRect(),c=centroid(start);
  touchState={start,previous:start,mode:pointerMode,anchor:{x:c.x-rect.left,y:c.y-rect.top},blocked:false,began:performance.now()};
  touchTimer=setTimeout(updateTouch,65);
 }else{clearTimeout(touchTimer);if(touchState)touchState.blocked=true;}
 map.setPointerCapture(event.pointerId);
});
map.addEventListener('pointermove',event=>{
 const previous=pointers.get(event.pointerId);if(!previous)return;
 pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const after=[...pointers.values()];
 if(gestureStart&&Math.hypot(event.clientX-gestureStart.x,event.clientY-gestureStart.y)>5)dragged=true;
 if(!dragged||navigationFrame||touchState?.blocked)return;
 map.classList.add('dragging');
 if(after.length===2&&touchState)updateTouch();
 else if(!touchState){pointerMode='pan';map.dataset.gesture='pan';panMap(event.clientX-previous.x,event.clientY-previous.y);}
});
function releasePointer(event,cancelled=false){
 if(!pointers.has(event.pointerId))return false;
 pointers.delete(event.pointerId);
 if(map.hasPointerCapture(event.pointerId))map.releasePointerCapture(event.pointerId);
 clearTimeout(touchTimer);if(touchState)touchState.blocked=true; // No one-finger jump after a pinch.
 if(cancelled)dragged=true;
 if(!pointers.size){map.classList.remove('dragging');gestureStart=null;touchState=null;pointerMode=null;delete map.dataset.gesture;settleCamera();}
 return true;
}
map.addEventListener('pointerup',event=>{
 if(!releasePointer(event))return;
 if(!dragged){const target=document.elementFromPoint(event.clientX,event.clientY),hit=target?.closest('button');if(hit?.id==='recover'){event.preventDefault();fitCurrentLevel();}else if(hit?.dataset.persona){event.preventDefault();choosePersona(hit.dataset.persona);}else if(hit?.dataset.zoom){event.preventDefault();focusNode(hit.dataset.zoom);}else if(hit?.dataset.zoomDeeper){event.preventDefault();exploreDeeper(hit.dataset.zoomDeeper);}else if(hit?.dataset.entry){event.preventDefault();openEntry(hit.dataset.entry);}else if(hit?.dataset.region){event.preventDefault();openRegion(hit.dataset.region);}else if(hit?.dataset.listRegion){event.preventDefault();showPanel({type:'responses',id:hit.dataset.listRegion});}else if(!hit){activateMapNode(target?.closest('.atlas-node')?.dataset.node);}}
});
map.addEventListener('pointercancel',event=>releasePointer(event,true));
// Pointer selection is handled on release, so dragging never activates a record.
map.addEventListener('click',event=>{if(event.detail>0){event.stopPropagation();return;}const item=event.target.closest('.atlas-node');if(item){event.stopPropagation();activateMapNode(item.dataset.node);}});
map.addEventListener('keydown',event=>{
 const item=event.target.closest('.atlas-node');
 if(item&&['Enter',' '].includes(event.key)){event.preventDefault();if(!event.repeat)activateMapNode(item.dataset.node);return;}
 if(event.target!==map)return;
 const actions={'+':()=>$('zoom-in').click(),'=':()=>$('zoom-in').click(),'-':()=>$('zoom-out').click(),Backspace:goUp,Home:toOverview,ArrowLeft:()=>panMap(50,0),ArrowRight:()=>panMap(-50,0),ArrowUp:()=>panMap(0,50),ArrowDown:()=>panMap(0,-50)};
 if(actions[event.key]){event.preventDefault();if(!navigationFrame&&!pointers.size&&!(event.repeat&&['+','=','-','Backspace'].includes(event.key)))actions[event.key]();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('inspector').hidden){event.preventDefault();closePanel();}});
new ResizeObserver(()=>{
 if(!ready||$('workspace').hidden)return;
 const w=map.clientWidth,h=map.clientHeight;
 const nextMobile=window.innerWidth<701;
 if(nextMobile!==mobile){const key=persona,group=activeGroup;levelCameras.clear();tree=null;navigateTo(key,group,{restore:false,animate:false,keepPanel:true,saveCurrent:false});if(closedCamera){closedCamera=frameLevel(tree,closedGroup,map.clientWidth,map.clientHeight);}}
 else if(!navigationFrame&&previousSize.w&&previousSize.h&&$('inspector').hidden){stopCameraReturn();camera.x+=(w-previousSize.w)/2;camera.y+=(h-previousSize.h)/2;const limits=zoomLimits();camera=zoomAt(camera,1,{x:w/2,y:h/2},limits.min,limits.max);}
 previousSize={w,h};render();
}).observe(map);

function applyRoute(){
 const [path,query='']=location.hash.replace(/^#\/?/,'').split('?');
 const bits=path.split('/'),key=personaMaps[bits[0]]?bits[0]:null;
 const group=bits[1]==='g'?decodeURIComponent(bits.slice(2).join('/')):new URLSearchParams(query).get('within');
 navigateTo(key,group,{animate:false});
 if(bits[1]==='e'&&byId.has(bits[2]))openEntry(bits[2]);
 else if(bits[0]==='e'&&byId.has(bits[1]))openEntry(bits[1]);
}
window.addEventListener('hashchange',()=>{if(entries.length)applyRoute();});

try{
 const data=await loadAtlas(fetch,window.WHOCARES_CONFIG?.API_BASE);
 entries=data.entries.filter(entry=>entry.published!==false);
 setProductMedia(data.media);
 graphData=data.graph;graphEntries=graphRecords(graphData,entries);
 document.documentElement.dataset.researchRevision=data.revision;
 if(stressCount){entries.push(...Array.from({length:stressCount},(_,i)=>({id:'synthetic-'+i,title:'Synthetic service '+String(i).padStart(6,'0'),type:'company',themes:[i%2?'T11':'T13'],summary:'Synthetic scale-test record. Not real research or evidence.'})));const banner=document.createElement('div');banner.className='stress-banner';banner.textContent=`SYNTHETIC SCALE TEST · ${stressCount.toLocaleString()} generated records · Not research`;document.body.prepend(banner);document.title='SCALE TEST · Who Cares';}
 byId=new Map([...entries,...graphEntries].map(entry=>[entry.id,entry]));$('loading').hidden=true;
 applyRoute();
}catch(error){
 $('workspace').hidden=false;
 $('loading').hidden=false;
 $('loading').textContent=error.message.startsWith('The needs hierarchy')?error.message:'The research service is unavailable. Reload to try again; no saved copy is being shown.';console.error('Atlas could not load its research index',error);
}
