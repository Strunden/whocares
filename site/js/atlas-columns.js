import {esc,recordMedia,placeholderImage} from './atlas-view.js';

export function columnSelection(roots,activeGroup,lens=null){
 const need=roots.find(n=>n.id===activeGroup||n.children.some(s=>s.id===activeGroup||s.children.some(r=>r.id===activeGroup)))||null;
 const situation=need?.children.find(s=>s.id===activeGroup||s.children.some(r=>r.id===activeGroup))||null;
 const primary={'older-adult':'adult','family-carer':'family','professional-caregiver':'worker','care-management':'provider'};
 const needs=roots.filter(n=>!lens||(primary[n.overviewGroup?.icp]||(n.entry.scope.navigation.lenses||[])[0])===lens||n===need);
 return {needs,need,situation,situations:need?.children||[],solutions:situation?.children||[]};
}
export function createColumnView(container,{selectPerson}){
 let query='',signature='',state,peoplePicked=false,previousPerson;const selectedByColumn=[null,null,null];
 const people=[['','Everyone'],['adult','Older adults'],['family','Family caregivers'],['worker','Care workers'],['provider','Care organisations'],['relative','Friends & relatives']];
 container.innerHTML=`<div class="column-toolbar"><span>People</span><div class="column-people" aria-label="Whose needs?"></div><input type="search" class="column-search" aria-label="Find a need in this perspective" placeholder="Find a need…"></div><div class="column-lists">${['Needs','Situations','Existing solutions'].map((name,i)=>`<section class="browse-column" aria-labelledby="column-heading-${i}"><header><h2 id="column-heading-${i}">${name}</h2><span class="column-count"></span></header><div class="column-items"></div></section>`).join('')}</div>`;
 const tabs=container.querySelector('.column-people'),columns=[...container.querySelectorAll('.browse-column')];
 tabs.innerHTML=people.map(([key,name])=>`<button type="button" data-column-person="${key}" aria-pressed="false">${name}</button>`).join('');
 tabs.addEventListener('click',event=>{const button=event.target.closest('[data-column-person]');if(!button)return;peoplePicked=true;query='';container.querySelector('input').value='';selectPerson(button.dataset.columnPerson||null);});
 container.querySelector('input').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase();draw();});
 container.addEventListener('keydown',event=>{
  const button=event.target.closest('.column-item');if(!button||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const buttons=[...button.parentElement.querySelectorAll('button')],index=buttons.indexOf(button);
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(event.key==='ArrowDown'?1:-1)));
  event.preventDefault();buttons.forEach(b=>b.tabIndex=-1);buttons[next].tabIndex=0;buttons[next].focus();
 });
 function item(n,current){
  const picture=n.kind==='record'?recordMedia(n.entry,false,n.relationship?.provenance?.navigation_media_id):`<img class="study-scene" src="${esc(n.image||placeholderImage)}" alt="" loading="lazy" decoding="async">`;
  return `<button type="button" class="column-item" ${n.kind==='record'?`data-entry="${esc(n.entry.id)}"`:`data-zoom="${esc(n.id)}"`} aria-pressed="${current}"><span class="column-art">${picture}</span><span class="column-copy"><span class="column-title">${esc(n.title)}</span>${current||n.kind==='record'||!state.activeGroup?`<span class="column-summary">${esc(n.description)}</span>`:''}${!state.persona&&n.perspectiveLabel?`<span class="column-icp">${esc(n.perspectiveLabel)}</span>`:''}</span></button>`;
 }
 function draw(){
  if(!state)return;
  const selection=columnSelection(state.tree.roots,state.activeGroup,state.persona);
  const awaitingPerson=!peoplePicked&&!state.persona&&!state.activeGroup;
  const panes=selection.situation?3:selection.need?2:1;
  container.querySelector('.column-lists').dataset.panes=String(panes);
  columns.forEach((column,i)=>column.hidden=i>=panes);
  const lists=[awaitingPerson?[]:selection.needs.filter(n=>!query||(n.title+' '+n.description).toLocaleLowerCase().includes(query)),selection.situations,selection.solutions];
  const ids=[selection.need?.id,selection.situation?.id,state.selectedId];
  const context=[state.persona,state.activeGroup,state.selectedId,query,state.revision];
  const nextSignature=JSON.stringify([context,lists.map(ns=>ns.map(n=>[n.id,n.title,n.description,n.entry?.revision,n.image]))]);
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!awaitingPerson&&(b.dataset.columnPerson||null)===state.persona)));
  container.querySelector('input').disabled=awaitingPerson;
  if(signature===nextSignature)return;signature=nextSignature;
  lists.forEach((nodes,i)=>{
   const list=columns[i].querySelector('.column-items'),old=previousPerson===state.persona?list.scrollTop:0,focused=list.contains(document.activeElement)?document.activeElement.dataset.zoom||document.activeElement.dataset.entry:null;
   const current=i===0?selection.need:i===1?selection.situation:null;
   columns[i].querySelector('.column-count').innerHTML=current?`<button class="column-research" data-entry="${esc(current.entry.id)}">Read research</button>`:'';
   const empty=i===0?(awaitingPerson?'Whose experience would you like to explore? Choose a person above.':'No matching needs. Try another perspective or search.'):i===1?(selection.need?'No situations mapped here yet.':'Choose a need to explore its situations.'):(selection.situation?'No existing solutions linked yet. This is a research gap, not evidence that none exist.':'Choose a situation to see existing solutions.');
   let group;
   list.innerHTML=nodes.length?nodes.map(n=>{
    const grouping=i===0?n.overviewGroup:null,key=grouping?.id;
    const heading=key&&key!==group?`<h3 class="column-group">${esc(!state.persona?grouping.icp_label+' · '+grouping.label:grouping.label)}</h3>`:'';
    group=key;return heading+item(n,i===2?n.entry.id===ids[i]:n.id===ids[i]);
   }).join(''):`<p class="column-empty">${esc(empty)}</p>`;
   const buttons=[...list.querySelectorAll('button')],tabStop=buttons.find(b=>b.getAttribute('aria-pressed')==='true')||buttons[0];buttons.forEach(b=>b.tabIndex=b===tabStop?0:-1);
   list.scrollTop=old;
   if(ids[i]!==selectedByColumn[i]){
    if(ids[i])buttons.find(b=>b.getAttribute('aria-pressed')==='true')?.scrollIntoView({block:selectedByColumn[i]?'nearest':'start'});
    else list.scrollTop=0;
    selectedByColumn[i]=ids[i];
   }
   if(focused)[...list.querySelectorAll('button')].find(b=>(b.dataset.zoom||b.dataset.entry)===focused)?.focus({preventScroll:true});
  });
  previousPerson=state.persona;
 }
 return {render(next){state=next;draw();},reset(){signature='';}};
}
