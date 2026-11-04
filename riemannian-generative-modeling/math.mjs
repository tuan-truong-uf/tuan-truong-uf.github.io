// Public, standard SO(3) mathematics. Row-major matrices act on column vectors.
export const PI=Math.PI,TAU=2*PI,DEG=PI/180;
export const I=[1,0,0,0,1,0,0,0,1];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const norm=a=>Math.hypot(...a);
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const scale=(a,s)=>a.map(x=>x*s);
export const unit=a=>norm(a)>1e-14?scale(a,1/norm(a)):[0,0,1];
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const transpose=a=>[a[0],a[3],a[6],a[1],a[4],a[7],a[2],a[5],a[8]];
export const mv=(a,v)=>[dot(a.slice(0,3),v),dot(a.slice(3,6),v),dot(a.slice(6,9),v)];
export function mul(a,b){const bt=transpose(b);return Array.from({length:9},(_,i)=>dot(a.slice(Math.floor(i/3)*3,Math.floor(i/3)*3+3),bt.slice((i%3)*3,(i%3)*3+3)));}
export const det=a=>a[0]*(a[4]*a[8]-a[5]*a[7])-a[1]*(a[3]*a[8]-a[5]*a[6])+a[2]*(a[3]*a[7]-a[4]*a[6]);
export const orthError=a=>norm(sub(mul(transpose(a),a),I));
export const hat=w=>[0,-w[2],w[1],w[2],0,-w[0],-w[1],w[0],0];
export function exp(w){const theta=norm(w),t2=theta*theta,W=hat(w),W2=mul(W,W);const A=theta<1e-4?1-t2/6+t2*t2/120:Math.sin(theta)/theta;const B=theta<1e-4?.5-t2/24+t2*t2/720:(1-Math.cos(theta))/t2;return I.map((v,i)=>v+A*W[i]+B*W2[i]);}
export function quatMatrix(q){const [x,y,z,w]=unit(q);return [1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)];}
export function matrixQuat(m){let q;const trace=m[0]+m[4]+m[8];if(trace>0){const s=Math.sqrt(trace+1)*2;q=[(m[7]-m[5])/s,(m[2]-m[6])/s,(m[3]-m[1])/s,s/4];}else if(m[0]>=m[4]&&m[0]>=m[8]){const s=Math.sqrt(Math.max(0,1+m[0]-m[4]-m[8]))*2;q=[s/4,(m[1]+m[3])/s,(m[2]+m[6])/s,(m[7]-m[5])/s];}else if(m[4]>=m[8]){const s=Math.sqrt(Math.max(0,1+m[4]-m[0]-m[8]))*2;q=[(m[1]+m[3])/s,s/4,(m[5]+m[7])/s,(m[2]-m[6])/s];}else{const s=Math.sqrt(Math.max(0,1+m[8]-m[0]-m[4]))*2;q=[(m[2]+m[6])/s,(m[5]+m[7])/s,s/4,(m[3]-m[1])/s];}q=unit(q);if(q[3]<0)q=scale(q,-1);if(Math.abs(q[3])<1e-12){const index=q.slice(0,3).reduce((best,x,i)=>Math.abs(x)>Math.abs(q[best])?i:best,0);if(q[index]<0)q=scale(q,-1);q[3]=0;}return q;}
export function log(m){const q=matrixQuat(m),s=norm(q.slice(0,3));if(s<1e-10)return scale(q.slice(0,3),2);return scale(q.slice(0,3),2*Math.atan2(s,Math.max(0,q[3]))/s);}
export const distance=(a,b)=>norm(log(mul(transpose(a),b)));
export const geodesic=(a,b,t)=>mul(a,exp(scale(log(mul(transpose(a),b)),t)));
export const lerpMatrix=(a,b,t)=>a.map((v,i)=>(1-t)*v+t*b[i]);
export function random(seed=20261103){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function gaussian(rng){return Math.sqrt(-2*Math.log(Math.max(rng(),1e-15)))*Math.cos(TAU*rng());}
export function haar(rng){const a=rng(),b=TAU*rng(),c=TAU*rng();return quatMatrix([Math.sqrt(1-a)*Math.sin(b),Math.sqrt(1-a)*Math.cos(b),Math.sqrt(a)*Math.sin(c),Math.sqrt(a)*Math.cos(c)]);}
// The orientation-preserving signed permutation matrices form the cube group.
export const CUBE_GROUP=(()=>{const out=[];const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];for(const p of permutations)for(const a of [-1,1])for(const b of [-1,1])for(const c of [-1,1]){const r=Array(9).fill(0);[a,b,c].forEach((s,i)=>r[i*3+p[i]]=s);if(det(r)>.5)out.push(r);}return out;})();
export const CENTERS=[exp([.25,-.25,.15]),exp([0,0,2.1]),exp([0,1.9,-.25])];
export function distribution(kind='multi',count=240,sigma=.18,seed=20261103){const rng=random(seed);return Array.from({length:count},(_,i)=>{const source=haar(rng);let center=I,mode=0;if(kind==='uniform')return {source,target:haar(rng),mode:0};if(kind==='multi'){mode=Math.floor(rng()*CENTERS.length);center=CENTERS[mode];}if(kind==='single')center=CENTERS[0];if(kind==='symmetry'){mode=Math.floor(rng()*24);center=mul(CENTERS[0],CUBE_GROUP[mode]);}const noise=[gaussian(rng)*sigma,gaussian(rng)*sigma,gaussian(rng)*sigma];return {source,target:mul(center,exp(noise)),mode};});}
export const projectedAxis=r=>mv(r,[0,0,1]);
// New teaching example. No fitted parameters, no trained model.
// Q(t)=Exp(t â) Exp(g(t) b̂); body velocity = Exp(-g b̂)a + g'(t)b.
export const A=[0,0,2.1],B=[1,0,0];
export const g=(t,curved=true)=>curved?.9*Math.sin(PI*t):0;
export const gp=(t,curved=true)=>curved?.9*PI*Math.cos(PI*t):0;
export const exactFlow=(t,curved=true)=>mul(exp(scale(A,t)),exp(scale(B,g(t,curved))));
export const velocity=(t,curved=true)=>add(mv(exp(scale(B,-g(t,curved))),A),scale(B,gp(t,curved)));
export function integrate(steps=4,curved=true){let r=[...I];const states=[r];for(let k=0;k<steps;k++){r=mul(r,exp(scale(velocity(k/steps,curved),1/steps)));states.push(r);}return {steps,curved,states};}
export function numericalAt(solution,t){const {steps,states,curved}=solution;if(t>=1)return states[steps];const k=Math.floor(t*steps);return mul(states[k],exp(scale(velocity(k/steps,curved),t-k/steps)));}
export const idealEndpoint=(r,t,curved=true)=>mul(mul(r,transpose(exactFlow(t,curved))),exactFlow(1,curved));
