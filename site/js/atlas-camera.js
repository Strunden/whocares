export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function project(camera, point) {
  return {x:point.x*camera.s+camera.x,y:point.y*camera.s+camera.y};
}
export function fit(width,height,bounds,padding=25) {
  const s=Math.max(.05,Math.min((width-padding*2)/bounds.width,(height-padding*2)/bounds.height));
  return {s,x:(width-bounds.width*s)/2-bounds.x*s,y:(height-bounds.height*s)/2-bounds.y*s};
}

// Screen-space anchor stays over the same world point, including at a limit.
export function zoomAt(camera, factor, anchor, min, max) {
 const s=clamp(camera.s*factor,min,max),ratio=s/camera.s;
 return {s,x:anchor.x-(anchor.x-camera.x)*ratio,y:anchor.y-(anchor.y-camera.y)*ratio};
}

// Shared rubber-band response. Zoom uses logarithmic scale; pan uses pixels.
// The optional immediate reversal keeps pan from accumulating hidden travel.
export function elasticValue(value,delta,min,max,extent,{directReverse=false}={}){
 const edge=clamp(value,min,max),over=value-edge;
 const bend=d=>d/(1+Math.abs(d)/extent);
 if(directReverse&&over*delta<0){
  const next=value+delta;
  if((over>0&&next>=min)||(over<0&&next<=max))return next;
  const opposite=clamp(next,min,max);return opposite+bend(next-opposite);
 }
 if(directReverse&&Math.abs(over)>=extent)return value;
 const raw=edge+(over?extent*over/Math.max(1e-12,extent-Math.abs(over)):0)+delta;
 const bound=clamp(raw,min,max);return bound+bend(raw-bound);
}
export function elasticZoomScale(scale,factor,min,max) {
 factor=clamp(Number.isNaN(factor)?1:factor,1e-6,1e6);
 return Math.exp(elasticValue(Math.log(scale),Math.log(factor),Math.log(min),Math.log(max),.24));
}

// Keep the selected item's screen trajectory straight while scale interpolates.
export function interpolateCamera(start,target,anchor,t){
 const s=Math.exp(Math.log(start.s)+(Math.log(target.s)-Math.log(start.s))*t);
 const a=project(start,anchor),b=project(target,anchor);
 return {s,x:a.x+(b.x-a.x)*t-anchor.x*s,y:a.y+(b.y-a.y)*t-anchor.y*s};
}

// Match zoom's progressive resistance in viewport-relative screen space.
export function elasticPanBy(camera,dx,dy,bounds,width,height){
 const options={directReverse:true};
 return {...camera,x:elasticValue(camera.x,dx,bounds.minX,bounds.maxX,width*.24,options),y:elasticValue(camera.y,dy,bounds.minY,bounds.maxY,height*.24,options)};
}

// Relax only visible overscroll. No velocity state or invisible displacement.
// Advance at both event and frame timestamps so scheduling cannot add lag.
export function relaxPan(camera,bounds,elapsed){
 const decay=Math.exp(-Math.max(0,elapsed)/85);
 const axis=(value,min,max)=>{const edge=clamp(value,min,max),over=(value-edge)*decay;return edge+(Math.abs(over)<.05?0:over);};
 return {...camera,x:axis(camera.x,bounds.minX,bounds.maxX),y:axis(camera.y,bounds.minY,bounds.maxY)};
}
