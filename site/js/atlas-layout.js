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
 const cols=columns||Math.ceil(Math.sqrt(children.length*box.w/box.h));const rows=Math.ceil(children.length/cols);
 const gap=Math.min(box.w/cols,box.h/rows)*.055;
 const w=box.w/cols,h=box.h/rows;
 children.forEach((n,i)=>{n.box={x:box.x+(i%cols)*w+gap,y:box.y+Math.floor(i/cols)*h+gap,w:w-gap*2,h:h-gap*2};
 if(n.children?.length)arrange(n.children,{x:n.box.x+n.box.w*.035,y:n.box.y+n.box.h*.19,w:n.box.w*.93,h:n.box.h*.77});});
}
function collection(records,id,label,kind='collection',entry=null){
 const node={id,title:label,kind,entry,count:records.length,children:[]};
 if(records.length<=6)node.children=records.map(e=>({id:id+'/'+e.id,title:title(e),kind:'record',entry:e,count:1}));
 else {
  const sorted=[...records].sort((a,b)=>title(a).localeCompare(title(b))||a.id.localeCompare(b.id));
  const size=Math.ceil(sorted.length/Math.min(6,Math.ceil(sorted.length/6)));
  for(let i=0;i<sorted.length;i+=size){const part=sorted.slice(i,i+size);node.children.push(collection(part,id+'/range-'+i,`${title(part[0])} — ${title(part.at(-1))}`,'range'));}
 }
 return node;
}
export function buildHierarchy(entries,definitions,{portrait=false}={}){
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
 const cols=portrait?2:Math.ceil(Math.sqrt(roots.length*1.7)),rows=Math.ceil(roots.length/cols),bounds={x:0,y:0,width:cols*1050,height:rows*860};
 arrange(roots,{x:0,y:0,w:bounds.width,h:bounds.height},cols);
 const all=new Map();let maxDepth=0;
 function visit(n,depth,root,parent=null){n.parent=parent;n.root=root;n.depth=depth;maxDepth=Math.max(depth,maxDepth);all.set(n.id,n);n.children?.forEach(c=>visit(c,depth+1,root,n.id));}
 roots.forEach(n=>visit(n,0,n.id));
 return {roots,all,bounds,maxDepth};
}
// Explicit reading levels: panning never changes the visible information layer.
export function readingLevel(tree,groupId,camera,width,height){
 const group=groupId?tree.all.get(groupId):null;
 const nodes=group?(group.children?.length?group.children:[group]):tree.roots;
 const viewport={x:-80,y:-80,w:width+160,h:height+160};
 return nodes.map(node=>({node,box:{x:node.box.x*camera.s+camera.x,y:node.box.y*camera.s+camera.y,w:node.box.w*camera.s,h:node.box.h*camera.s},mode:group?'summary':'compact'})).filter(v=>intersects(v.box,viewport)).slice(0,90);
}
export function ancestry(tree,id){const path=[];while(id){const n=tree.all.get(id);if(!n)break;path.unshift(n);id=n.parent;}return path;}
