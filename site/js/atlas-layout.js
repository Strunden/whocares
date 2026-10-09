// Data hierarchy + viewport frontier. No per-record coordinates or illustrations.
import {collectionLabels} from './atlas-navigation.js';
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
function arrange(children,box,columns,maxColumns=3,aspect=1.18){
 if(!children.length)return;
 const count=children.length;
 const cols=columns||Math.min(maxColumns,count);const rows=Math.ceil(count/cols);
 const gap=Math.min(box.w/cols,box.h/rows)*.055;
 const w=Math.min(box.w/cols,box.h/rows*aspect),h=w/aspect;
 children.forEach((n,index)=>{const i=index;n.box={x:box.x+(i%cols)*w+gap,y:box.y+Math.floor(i/cols)*h+gap,w:w-gap*2,h:h-gap*2};
 if(n.children?.length)arrange(n.children,{x:n.box.x+n.box.w*.035,y:n.box.y+n.box.h*.16,w:n.box.w*.93,h:n.box.h*.80},undefined,maxColumns);});
}
function collection(records,id,label,kind='collection',entry=null){
 const sorted=[...records].sort((a,b)=>title(a).localeCompare(title(b))||a.id.localeCompare(b.id));
 return {id,title:label,kind,entry,count:records.length,children:sorted.map(e=>({id:id+'/'+e.id,title:title(e),kind:'record',entry:e,count:1}))};
}
export function buildHierarchy(entries,definitions,{portrait=false,extraRoots=[]}={}){
 const byTheme=new Map(),byTag=new Map();
 for(const e of entries){for(const t of e.themes||[]){if(!byTheme.has(t))byTheme.set(t,[]);byTheme.get(t).push(e);}if(!e.themes?.length){const tag=e.tag||'Uncategorised';if(!byTag.has(tag))byTag.set(tag,[]);byTag.get(tag).push(e);}}
 const mapped=new Set();let serial=0;
 const roots=definitions.map(def=>{
  const seen=new Set(),children=[];
  for(const theme of def.themes){const list=byTheme.get(theme)||[],topic=list.find(isTopic);if(!list.length)continue;
   const records=list.filter(e=>!seen.has(e.id)&&e.id!==topic?.id);records.forEach(e=>seen.add(e.id));if(topic)seen.add(topic.id);
   const node=collection(records,def.id+'/'+theme,topic?title(topic):(collectionLabels[theme]||theme),'topic',topic);children.push(node);
  }
  for(const [tag,list] of byTag){if(!(tagThemes[tag]||[]).some(t=>def.themes.includes(t)))continue;const records=list.filter(e=>!seen.has(e.id));if(!records.length)continue;records.forEach(e=>seen.add(e.id));children.push(collection(records,def.id+'/category-'+serial++,tag,'category'));}
  seen.forEach(id=>mapped.add(id));
  return {id:def.id,title:def.title,kind:'territory',description:def.description,question:def.question,color:def.color,themes:def.themes,children,count:seen.size};
 });
 const remainder=entries.filter(e=>!mapped.has(e.id));
 if(remainder.length)roots.push({...collection(remainder,'wider-research','The wider research','territory'),description:'Records beyond these editorial territories.',question:'What connection should be investigated next?',color:'#dce3eb',themes:[]});
 roots.unshift(...extraRoots);
 const cols=portrait?2:Math.ceil(Math.sqrt(roots.length*1.7)),rows=Math.ceil(roots.length/cols),bounds={x:0,y:0,width:cols*1050,height:rows*660};
 arrange(roots,{x:0,y:0,w:bounds.width,h:bounds.height},cols,portrait?2:3,350/220);
 const all=new Map();let maxDepth=0;
 function visit(n,depth,root,parent=null){n.parent=parent;n.root=root;n.depth=depth;maxDepth=Math.max(depth,maxDepth);all.set(n.id,n);n.children?.forEach(c=>visit(c,depth+1,root,n.id));}
 roots.forEach(n=>visit(n,0,n.id));
 return {roots,all,bounds,maxDepth};
}
// A scene contains exactly the chosen level's siblings. Ancestors are navigation,
// not a second set of differently scaled reading surfaces.
export function levelScene(tree,groupId,options={}){
 const group=tree.all.get(groupId);
 const nodes=group?(group.children||[group]):tree.roots;
 return {group,items:nodes.map(node=>({node,anchor:node.box}))};
}
export const UNIT={width:350,height:300};
export function unitSize(width,compact=false){return {w:Math.min(UNIT.width,width-32),h:compact?220:UNIT.height};}
export function unitScale(box,width,compact=false){const size=unitSize(width,compact);return Math.max(size.w/box.w,size.h/box.h);}
// A unit's internal layout is fixed. One uniform transform magnifies everything
// together: type, illustration, boundary and hit targets. No zoom-driven reflow.
export function projectUnit(anchor,camera,width,referenceScale=unitScale(anchor,width),compact=false,contentHeight=null){
 const size=unitSize(width,compact);if(contentHeight)size.h=contentHeight;const scale=camera.s/referenceScale,w=size.w*scale,h=size.h*scale;
 return {x:(anchor.x+anchor.w/2)*camera.s+camera.x-w/2,y:(anchor.y+anchor.h/2)*camera.s+camera.y-h/2,w,h,scale,layoutW:size.w,layoutH:size.h};
}
export const itemHeight=(node,compact=false)=>compact?220:!node.children?.length&&(node.entry?.type==='company'||node.entry?.kind==='solution')?210:!node.children?.length&&node.entry&&(node.title.length+(node.entry.summary||node.description||'').length)<220?240:UNIT.height;
export function levelScale(tree,groupId,width){return unitScale(levelScene(tree,groupId).items[0]?.anchor||tree.all.get(groupId).box,width,!groupId);}
export function sceneBounds(tree,groupId,width,options={}){
 const scene=levelScene(tree,groupId,options),reference=levelScale(tree,groupId,width);
 const items=scene.items.length?scene.items:[{node:scene.group,anchor:scene.group.box}];
 const boxes=items.map(({node,anchor})=>projectUnit(anchor,{s:1,x:0,y:0},width,reference,!groupId,itemHeight(node,!groupId)));
 const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
 const right=Math.max(...boxes.map(b=>b.x+b.w)),bottom=Math.max(...boxes.map(b=>b.y+b.h));
 return {x,y,width:right-x,height:bottom-y};
}
export function frameLevel(tree,groupId,width,height=700,options={}){
 const b=sceneBounds(tree,groupId,width,options),padding=width<701?18:28;
 const s=Math.min((width-padding*2)/b.width,(height-padding*2)/b.height,levelScale(tree,groupId,width));
 return {s,x:width/2-(b.x+b.width/2)*s,y:height/2-(b.y+b.height/2)*s};
}
// Enter at readable scale; Fit level remains the explicit all-items overview.
export function entryFrame(tree,groupId,width,height,options={}){
 const fit=frameLevel(tree,groupId,width,height,options),limits=levelZoomLimits(tree,groupId,width,height,options);
 const reference=levelScale(tree,groupId,width),s=Math.min(limits.max,Math.max(fit.s,reference*(width<701?.9:.85)));
 if(!groupId||s===fit.s)return fit;
 const first=levelScene(tree,groupId,options).items[0];if(!first)return fit;
 const size=unitSize(width),x=(width<701?18:28)-(first.anchor.x+first.anchor.w/2)*s+size.w*s/reference/2;
 return {s,x,y:28-(first.anchor.y+first.anchor.h/2)*s+itemHeight(first.node)*s/reference/2};
}
export function levelZoomLimits(tree,groupId,width,height,options={}){
 const fit=frameLevel(tree,groupId,width,height,options).s;
 const unit=unitSize(width,!groupId),max=levelScale(tree,groupId,width)*Math.min(1.5,(width-36)/unit.w,(height-36)/unit.h);
 return {min:fit,max:Math.max(fit,max)};
}
export function readingLevel(tree,groupId,camera,width,height,options={}){
 const viewport={x:-80,y:-80,w:width+160,h:height+160},reference=levelScale(tree,groupId,width);
 const items=levelScene(tree,groupId,options).items.map(({node,anchor})=>({node,box:projectUnit(anchor,camera,width,reference,!groupId,itemHeight(node,!groupId)),mode:groupId?'summary':'compact'}));
 // Keep ordinary small scenes mounted for native compositor scrolling. Large
 // unpaged scenes still window by visibility so later nodes remain reachable.
 return (options.includeOffscreen&&items.length<=90?items:items.filter(item=>intersects(item.box,viewport)));
}
export function panWithinWorld(camera,dx,dy,bounds,width,height){
 // Keep some of the world reachable, but do not pin a small group to the viewport.
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 return {...camera,x:clamp(camera.x+dx,width*.1-(bounds.x+bounds.width)*camera.s,width*.9-bounds.x*camera.s),y:clamp(camera.y+dy,height*.1-(bounds.y+bounds.height)*camera.s,height*.9-bounds.y*camera.s)};
}
// Every item can reach the viewport centre, including those at the edges.
export function scenePanBounds(tree,groupId,camera,width,height,options={}){
 const centres=levelScene(tree,groupId,options).items.map(({anchor})=>({x:(anchor.x+anchor.w/2)*camera.s,y:(anchor.y+anchor.h/2)*camera.s}));
 if(!centres.length)return {minX:camera.x,maxX:camera.x,minY:camera.y,maxY:camera.y};
 return {minX:width/2-Math.max(...centres.map(p=>p.x)),maxX:width/2-Math.min(...centres.map(p=>p.x)),minY:height/2-Math.max(...centres.map(p=>p.y)),maxY:height/2-Math.min(...centres.map(p=>p.y))};
}
// Resting position only. Do not project each gesture delta out of a sparse gap:
// that would stop the user crossing it to reach the next item.
export function panWithinScene(tree,groupId,camera,dx,dy,width,height,options={}){
 const b=scenePanBounds(tree,groupId,camera,width,height,options),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const next={...camera,x:clamp(camera.x+dx,b.minX,b.maxX),y:clamp(camera.y+dy,b.minY,b.maxY)};
 const scene=levelScene(tree,groupId,options),reference=levelScale(tree,groupId,width);
 const boxes=scene.items.map(({node,anchor})=>projectUnit(anchor,next,width,reference,!groupId,itemHeight(node,!groupId)));
 const overlap=b=>Math.max(0,Math.min(width,b.x+b.w)-Math.max(0,b.x))*Math.max(0,Math.min(height,b.y+b.h)-Math.max(0,b.y));
 if(boxes.some(b=>overlap(b)>=Math.min(b.w,width)*Math.min(b.h,height)*.5)||!boxes.length)return next;
 const nearest=boxes.sort((a,b)=>Math.hypot(a.x+a.w/2-width/2,a.y+a.h/2-height/2)-Math.hypot(b.x+b.w/2-width/2,b.y+b.h/2-height/2))[0];
 next.x+=width/2-nearest.x-nearest.w/2;
 next.y+=height/2-nearest.y-nearest.h/2;
 return next;
}
export function ancestry(tree,id){const path=[];while(id){const n=tree.all.get(id);if(!n)break;path.unshift(n);id=n.parent;}return path;}

export function perspectiveHierarchy(definitions,portrait=false){
 const colors=['#b9d6bc','#b4d2d7','#e2bfb5','#d4c1da','#d7d6ae'];
 const tree=buildHierarchy([],Object.entries(definitions).map(([id,d],i)=>({id,title:d.name,description:d.intro,themes:[],color:colors[i%colors.length]})),{portrait});
 for(const node of tree.roots){node.personaKey=node.id;node.kind='perspective';}
 return tree;
}
// Each lens occupies its person's region in the same outer coordinate system.
export function embedHierarchy(tree,parent,worldBounds){
 const b=parent.box,padding=.07,target={x:b.x+b.w*padding,y:b.y+b.h*padding,w:b.w*(1-padding*2),h:b.h*(1-padding*2)};
 const scale=Math.min(target.w/tree.bounds.width,target.h/tree.bounds.height);
 const x=target.x+(target.w-tree.bounds.width*scale)/2,y=target.y+(target.h-tree.bounds.height*scale)/2;
 for(const node of tree.all.values()){const a=node.box;node.box={x:x+a.x*scale,y:y+a.y*scale,w:a.w*scale,h:a.h*scale};}
 tree.viewBounds={x,y,width:tree.bounds.width*scale,height:tree.bounds.height*scale};tree.bounds=worldBounds;
 return tree;
}
