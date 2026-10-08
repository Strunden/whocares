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
