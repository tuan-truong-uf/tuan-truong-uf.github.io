// Canvas projects actual 3D geometry. No WebGL, model assets, or external services.
import {I,PI,mul,mv,exp,scale,add,sub,norm,cross,unit} from './math.mjs';
export const C={navy:'#193f5b',teal:'#247f86',amber:'#b97832',muted:'#7c93a1',line:'#d1dfe6',x:'#b57967',y:'#6c927b',z:'#6a8cba',purple:'#8970aa'};
export function fit(canvas){const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,rect.width),h=Math.max(1,rect.height);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.lineJoin='round';ctx.lineCap='round';return {ctx,w,h};}
export class Scene{
 constructor(ctx,cx,cy,size,yaw=.58,pitch=-.43){this.ctx=ctx;this.cx=cx;this.cy=cy;this.size=size;this.V=mul(exp([pitch,0,0]),exp([0,yaw,0]));}
 project(v){const q=mv(this.V,v);return [this.cx+q[0]*this.size,this.cy-q[1]*this.size,q[2]];}
 text(v,label,color=C.muted,size=11,align='left'){const p=this.project(v);label2d(this.ctx,p[0],p[1],label,color,size,align);}
 path(points,color,width=1,dash=[],alpha=1){const ctx=this.ctx;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((v,i)=>{const p=this.project(v);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();ctx.restore();}
 point(v,color,r=3,alpha=1){const p=this.project(v),ctx=this.ctx;ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(p[0],p[1],r,0,2*PI);ctx.fillStyle=color;ctx.fill();ctx.restore();}
 arrow(from,to,color,width=1.5,dash=[]){this.path([from,to],color,width,dash);const a=this.project(from),b=this.project(to),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),ctx=this.ctx;if(Math.hypot(b[0]-a[0],b[1]-a[1])<4)return;ctx.save();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(b[0],b[1]);ctx.lineTo(b[0]-7*Math.cos(ang-.4),b[1]-7*Math.sin(ang-.4));ctx.lineTo(b[0]-7*Math.cos(ang+.4),b[1]-7*Math.sin(ang+.4));ctx.closePath();ctx.fill();ctx.restore();}
 floor(){for(let i=-3;i<=3;i++){const s=i*.48;this.path([[-1.65,-.85,s],[1.65,-.85,s]],'#dde7eb',.7);this.path([[s,-.85,-1.65],[s,-.85,1.65]],'#dde7eb',.7);}}
 frame(R=I,{origin=[0,0,0],length=1.22,labels=true,alpha=1}={}){const ctx=this.ctx;ctx.save();ctx.globalAlpha=alpha;for(let i=0;i<3;i++){const e=[0,0,0];e[i]=length;const endpoint=add(origin,mv(R,e)),color=[C.x,C.y,C.z][i];this.arrow(origin,endpoint,color,1.7);if(labels)this.text(add(origin,mv(R,scale(e,1.12))),['x','y','z'][i],color,12);}ctx.restore();}
 cube(R=I,{origin=[0,0,0],size=.55,marked=true,opacity=1,wire=false,tint=null}={}){
 const points=Array.from({length:8},(_,i)=>add(origin,mv(R,[(i&1?1:-1)*size,(i&2?1:-1)*size,(i&4?1:-1)*size])));
 const faces=[{i:[0,4,6,2],color:[163,192,207]},{i:[1,3,7,5],color:[111,162,174]},{i:[0,1,5,4],color:[174,199,210]},{i:[2,6,7,3],color:[207,222,227]},{i:[0,2,3,1],color:[155,185,199]},{i:[4,5,7,6],color:[141,185,187]}];
 const ctx=this.ctx;ctx.save();ctx.globalAlpha=opacity;
 for(const f of faces.sort((a,b)=>a.i.reduce((s,i)=>s+this.project(points[i])[2],0)-b.i.reduce((s,i)=>s+this.project(points[i])[2],0))){const projected=f.i.map(i=>this.project(points[i]));ctx.beginPath();projected.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(!wire){const n=unit(cross(sub(points[f.i[1]],points[f.i[0]]),sub(points[f.i[2]],points[f.i[0]])));const lighting=.86+.14*Math.abs(mv(this.V,n)[2]);const base=tint||(marked?f.color:[174,204,210]);ctx.fillStyle=`rgb(${base.map(v=>Math.round(v*lighting)).join(',')})`;ctx.fill();}ctx.strokeStyle=wire?'#91abb9':'#6e929f';ctx.lineWidth=wire?.9:1;ctx.stroke();}
 if(marked&&!wire){const mark=add(origin,mv(R,[0,0,size+.004]));const normal=mv(this.V,mv(R,[0,0,1]));if(normal[2]>0){this.point(mark,'#edf6f5',3.5);}}
 ctx.restore();
 }
 sphere(radius=1){const ctx=this.ctx;ctx.save();ctx.beginPath();ctx.arc(this.cx,this.cy,radius*this.size,0,2*PI);ctx.fillStyle='#edf4f6';ctx.fill();ctx.strokeStyle='#c4d8df';ctx.lineWidth=1;ctx.stroke();ctx.restore();for(const axes of [[0,1],[0,2],[1,2]]){const pts=Array.from({length:101},(_,i)=>{const t=i/100*2*PI,v=[0,0,0];v[axes[0]]=radius*Math.cos(t);v[axes[1]]=radius*Math.sin(t);return v;});this.path(pts,'#d2e0e7',.8);}}
}
export function label2d(ctx,x,y,label,color=C.muted,size=11,align='left',serif=false){ctx.save();ctx.fillStyle=color;ctx.font=`${size}px ${serif?'Georgia,serif':'system-ui,sans-serif'}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(label,x,y);ctx.restore();}
