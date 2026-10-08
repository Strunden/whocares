// Native scroll owns trackpad gesture phases, momentum and boundary feedback.
// Programmatic camera updates and native scroll observations are one-way paths:
// a scroll callback must never write scroll offsets back into the browser.
export function createNativePan(map,surface,onScroll){
 let view=null;
 const read=()=>view?{s:view.s,x:view.x-map.scrollLeft,y:view.y-map.scrollTop}:null;
 map.addEventListener('scroll',()=>{if(view)onScroll(read());},{passive:true});
 return {
  setView(camera,bounds,width,height){
   const x=Math.max(bounds.maxX,camera.x),y=Math.max(bounds.maxY,camera.y);
   const minX=Math.min(bounds.minX,camera.x),minY=Math.min(bounds.minY,camera.y);
   view={s:camera.s,x,y};
   surface.style.width=`${width+Math.max(0,x-minX)}px`;
   surface.style.height=`${height+Math.max(0,y-minY)}px`;
   map.scrollLeft=x-camera.x;map.scrollTop=y-camera.y;
  },
  get origin(){return view;},
  read
 };
}
