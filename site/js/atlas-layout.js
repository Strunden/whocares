// Data hierarchy + viewport frontier. No per-record coordinates or illustrations.
export const tagThemes={
 'Health and medicines':['T03','T05','T16','P03'],'Safety and falls':['T04','T17'],
 'Memory and dementia':['T06'],'Loneliness and connection':['T07'],'Daily life and getting around':['T09','T10','T15'],
 'Home and housing':['T08','P01'],'Family caregivers':['T11'],'Care staff and services':['T01','T02','T13','T14'],
 'Money and retirement':['T18','P04','P05'],'End of life and inheritance':['T12','P02','P06','P07']
};
export const themesFor=e=>e.themes?.length?e.themes:(tagThemes[e.tag]||[]);
const title=e=>e.title||e.name||'Untitled';
export const isTopic=e=>['theme','parent_theme'].includes(e.idea_kind);
const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function arrange(children,box,columns){
 if(!children.length)return;
 const paged=children.some(n=>n.page!==undefined),count=paged?Math.min(6,children.length):children.length;
 const cols=columns||Math.min(3,count);const rows=Math.ceil(count/cols);
 const gap=Math.min(box.w/cols,box.h/rows)*.055;
 const w=Math.min(box.w/cols,box.h/rows*1.18),h=w/1.18;
 children.forEach((n,index)=>{const i=paged?index%6:index;n.box={x:box.x+(i%cols)*w+gap,y:box.y+Math.floor(i/cols)*h+gap,w:w-gap*2,h:h-gap*2};
 if(n.children?.length)arrange(n.children,{x:n.box.x+n.box.w*.035,y:n.box.y+n.box.h*.16,w:n.box.w*.93,h:n.box.h*.80});});
}
export const PAGE_SIZE=6;
function collection(records,id,label,kind='collection',entry=null){
 const sorted=[...records].sort((a,b)=>title(a).localeCompare(title(b))||a.id.localeCompare(b.id));
 return {id,title:label,kind,entry,count:records.length,paged:true,children:sorted.map((e,i)=>({id:id+'/'+e.id,title:title(e),kind:'record',entry:e,count:1,page:Math.floor(i/PAGE_SIZE)}))};
}
const matchCache=new WeakMap();
export function collectionPage(group,{page=0,query='',type='all'}={}){
 const all=group?.children||[];
 const key=JSON.stringify([query,type]);let cache=matchCache.get(group);
 if(!cache||cache.key!==key||cache.children!==all){
 const matched=all.filter(n=>(type==='all'||(type==='company'?n.entry?.type==='company':n.entry?.type!=='company'))&&(!query||[n.title,n.entry?.summary,n.entry?.country,n.entry?.buyer].join(' ').toLowerCase().includes(query.toLowerCase())));
 cache={key,children:all,matched};matchCache.set(group,cache);}
 const matched=cache.matched;
 const pages=Math.max(1,Math.ceil(matched.length/PAGE_SIZE));page=Math.max(0,Math.min(pages-1,page));
 return {nodes:matched.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),total:matched.length,page,pages};
}
export function buildHierarchy(entries,definitions,{portrait=false,extraRoots=[]}={}){
 const byTheme=new Map(),byTag=new Map();
 for(const e of entries){for(const t of e.themes||[]){if(!byTheme.has(t))byTheme.set(t,[]);byTheme.get(t).push(e);}if(!e.themes?.length){const tag=e.tag||'Uncategorised';if(!byTag.has(tag))byTag.set(tag,[]);byTag.get(tag).push(e);}}
 const mapped=new Set();let serial=0;
 const roots=definitions.map(def=>{
  const seen=new Set(),children=[];
  for(const theme of def.themes){const list=byTheme.get(theme)||[],topic=list.find(isTopic);if(!list.length)continue;
   const records=list.filter(e=>!seen.has(e.id)&&e.id!==topic?.id);records.forEach(e=>seen.add(e.id));if(topic)seen.add(topic.id);
   const node=collection(records,def.id+'/'+theme,topic?title(topic):theme,'topic',topic);children.push(node);
  }
  for(const [tag,list] of byTag){if(!(tagThemes[tag]||[]).some(t=>def.themes.includes(t)))continue;const records=list.filter(e=>!seen.has(e.id));if(!records.length)continue;records.forEach(e=>seen.add(e.id));children.push(collection(records,def.id+'/category-'+serial++,tag,'category'));}
  seen.forEach(id=>mapped.add(id));
  return {id:def.id,title:def.title,kind:'territory',description:def.description,question:def.question,color:def.color,themes:def.themes,children,count:seen.size};
 });
 const remainder=entries.filter(e=>!mapped.has(e.id));
 if(remainder.length)roots.push({...collection(remainder,'wider-research','The wider research','territory'),description:'Records beyond these editorial territories.',question:'What connection should be investigated next?',color:'#dce3eb',themes:[]});
 roots.unshift(...extraRoots);
 const cols=portrait?2:Math.ceil(Math.sqrt(roots.length*1.7)),rows=Math.ceil(roots.length/cols),bounds={x:0,y:0,width:cols*1050,height:rows*860};
 arrange(roots,{x:0,y:0,w:bounds.width,h:bounds.height},cols);
 const all=new Map();let maxDepth=0;
 function visit(n,depth,root,parent=null){n.parent=parent;n.root=root;n.depth=depth;maxDepth=Math.max(depth,maxDepth);all.set(n.id,n);n.children?.forEach(c=>visit(c,depth+1,root,n.id));}
 roots.forEach(n=>visit(n,0,n.id));
 return {roots,all,bounds,maxDepth};
}
// Explicit reading levels: panning never changes the visible information layer.
export function readingLevel(tree,groupId,camera,width,height,options={}){
 const group=groupId?tree.all.get(groupId):null;
 const page=group?.paged?collectionPage(group,options):null;
 const nodes=page?page.nodes:group?(group.children?.length?group.children:[group]):tree.roots;
 const viewport={x:-80,y:-80,w:width+160,h:height+160};
 const project=(node,mode,index)=>{
  const b=page&&mode==='summary'?group.children[index].box:node.box;
  const worldW=b.w*camera.s,worldH=b.h*camera.s;
  // Fixed reading surfaces travel by their centre, so magnification does not
  // push the text away from the point the user is exploring.
  const w=mode==='context'?worldW:Math.min(b.w*(options.surfaceScale||camera.s),420,width-32),h=mode==='context'?worldH:Math.min(b.h*(options.surfaceScale||camera.s),360);
  return {node,box:{x:b.x*camera.s+camera.x+(worldW-w)/2,y:b.y*camera.s+camera.y+(worldH-h)/2,w,h},mode};
 };
 const result=nodes.map((node,i)=>project(node,group?'summary':'compact',i)).filter(v=>intersects(v.box,viewport));
 // Neighbouring regions remain part of the same world at every reading level.
 // Their context is navigable but never silently opens while panning.
 if(group){
  const path=ancestry(tree,groupId);
  for(const ancestor of path){
   const parent=tree.all.get(ancestor.parent);
   const siblings=parent?.paged?parent.children.filter(n=>n.page===ancestor.page):parent?.children||tree.roots;
   for(const node of siblings)if(node.id!==ancestor.id){const v=project(node,'context');if(intersects(v.box,viewport))result.push(v);}
  }
 }
 return result.slice(0,90);
}
export function panWithinWorld(camera,dx,dy,bounds,width,height){
 // Keep some of the world reachable, but do not pin a small group to the viewport.
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 return {...camera,x:clamp(camera.x+dx,width*.1-(bounds.x+bounds.width)*camera.s,width*.9-bounds.x*camera.s),y:clamp(camera.y+dy,height*.1-(bounds.y+bounds.height)*camera.s,height*.9-bounds.y*camera.s)};
}
export function ancestry(tree,id){const path=[];while(id){const n=tree.all.get(id);if(!n)break;path.unshift(n);id=n.parent;}return path;}
