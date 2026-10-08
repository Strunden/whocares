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

// Rubber-band zoom in log space: continuous at the bound and progressively
// resistant, with no second hard stop. Invert the previous displayed scale so
// event subdivision and reversal cannot compound the resistance.
// Pattern: https://use-gesture.netlify.app/docs/options/#rubberband
export function elasticZoomScale(scale,factor,min,max) {
 factor=clamp(Number.isNaN(factor)?1:factor,1e-6,1e6);
 const extent=.24,lo=Math.log(min),hi=Math.log(max),current=Math.log(scale);
 const unbend=d=>extent*d/Math.max(1e-12,extent-Math.abs(d));
 const raw=(current<lo?lo+unbend(current-lo):current>hi?hi+unbend(current-hi):current)+Math.log(factor);
 const bend=d=>d/(1+Math.abs(d)/extent);
 return Math.exp(raw<lo?lo+bend(raw-lo):raw>hi?hi+bend(raw-hi):raw);
}

// Keep the selected item's screen trajectory straight while scale interpolates.
export function interpolateCamera(start,target,anchor,t){
 const s=Math.exp(Math.log(start.s)+(Math.log(target.s)-Math.log(start.s))*t);
 const a=project(start,anchor),b=project(target,anchor);
 return {s,x:a.x+(b.x-a.x)*t-anchor.x*s,y:a.y+(b.y-a.y)*t-anchor.y*s};
}
