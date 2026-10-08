// Explicit input semantics: never infer mouse versus trackpad from delta direction.
export function wheelGesture(previous,{now,zoom,anchor},idle=180) {
 const fresh=!previous||now-previous.last>idle;
 const state=fresh?{mode:zoom?'zoom':'pan',anchor,last:now}:{...previous,last:now};
 return {...state,accept:state.mode===(zoom?'zoom':'pan')};
}
export const centroid=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2});
export const separation=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
export function touchIntent(start,current,locked=null,elapsed=0) {
 if(locked)return locked;
 const a=centroid(start),b=centroid(current);
 const pan=Math.hypot(b.x-a.x,b.y-a.y),zoom=Math.abs(separation(current)-separation(start))/2;
 // Wait through noise / ambiguous one-pointer updates. Once selected, keep the
 // mode for the entire contact sequence, even if the other motion later wins.
 if(zoom>=6&&zoom>pan*1.3)return 'zoom';
 if(pan>=6&&pan>zoom*1.3)return 'pan';
 // Resolve a stationary-finger pinch after a short ambiguity window.
 if(elapsed>=60&&zoom>=6)return 'zoom';
 return null;
}
