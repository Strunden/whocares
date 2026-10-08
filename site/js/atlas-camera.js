export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function zoomAt(camera, scale, x, y) {
  const ratio = scale / camera.s;
  return {s:scale,x:x-(x-camera.x)*ratio,y:y-(y-camera.y)*ratio};
}
export function project(camera, point) {
  return {x:point.x*camera.s+camera.x,y:point.y*camera.s+camera.y};
}
export function fit(width,height,bounds,padding=25) {
  const s=Math.max(.05,Math.min((width-padding*2)/bounds.width,(height-padding*2)/bounds.height));
  return {s,x:(width-bounds.width*s)/2-bounds.x*s,y:(height-bounds.height*s)/2-bounds.y*s};
}
export function detailLevel(ratio) { return ratio<1.55?0:ratio<2.7?1:2; }
