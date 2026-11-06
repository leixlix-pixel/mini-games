const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
let src=html.slice(html.indexOf('  const COLS = 6, ROWS = 9'));
src=src.slice(0,src.indexOf('\n})();'));
const nodes={},storage={},noop=()=>{};
const context=new Proxy({}, {get:(t,k)=>t[k]||noop});
function element(){return {style:{},appendChild:noop,addEventListener:noop,removeEventListener:noop,getContext:()=>context,setPointerCapture:noop,getBoundingClientRect:()=>({left:0,top:0})};}
const sandbox={console,Math,JSON,GAMES:{},window:{devicePixelRatio:2,addEventListener:noop,removeEventListener:noop},document:{hidden:false,addEventListener:noop,removeEventListener:noop},
  $:id=>nodes[id]||(nodes[id]=element()),el:element,stageBox:()=>({w:390,h:530}),clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),ri:n=>Math.floor(Math.random()*n),
  load:(k,d)=>storage[k]===undefined?d:JSON.parse(storage[k]),save:(k,v)=>storage[k]=JSON.stringify(v),drop:k=>delete storage[k],
  setHud:noop,setAct:noop,hudVal:noop,snd:noop,buzz:noop,toast:noop,modal:noop,closeModal:noop,veilNode:null,
  requestAnimationFrame:()=>1,cancelAnimationFrame:noop,setTimeout:noop,history:{back:noop}};
vm.createContext(sandbox);
vm.runInContext(src+`;globalThis.test={freshGrid,fire,loop,undo,nextRound,layout,onDown,onUp,cancelDrag,visibility,stepBall,
 get:()=>({grid,round,score,ballCount,phase,over,active,queue,paused,paddle,cell,boardW,canvasH,previous}),
 set:v=>{if(v.grid)grid=v.grid;if(v.round)round=v.round;if(v.ballCount)ballCount=v.ballCount;if(v.active)active=v.active;if(v.phase)phase=v.phase;if(v.paddleX!==undefined)paddle.x=v.paddleX;if(v.aim!==undefined){aimDx=Math.sin(v.aim);aimDy=-Math.cos(v.aim);}}};`,sandbox);
const t=sandbox.test;sandbox.GAMES.bb.mount();
t.onDown({pointerId:1,clientX:100,clientY:100});t.cancelDrag();t.onUp({pointerId:1});assert.equal(t.get().phase,'aim');
t.fire();let before=JSON.stringify(t.get().previous);for(let i=1;i<120;i++)t.loop(i*16);t.undo();assert.equal(JSON.stringify({grid:t.get().grid,round:t.get().round,score:t.get().score,ballCount:t.get().ballCount}),before);
t.fire();sandbox.document.hidden=true;t.visibility();let state=JSON.stringify(t.get().active);t.loop(9999);assert.equal(JSON.stringify(t.get().active),state);assert(t.get().paused);
sandbox.document.hidden=false;t.freshGrid();
let grid=Array.from({length:9},()=>Array(6).fill(null));grid[8][0]={t:'s',v:24};t.set({grid});t.nextRound();assert(!t.get().over);
grid=Array.from({length:9},()=>Array(6).fill(null));grid[8][0]={t:'b',hp:1};t.set({grid});t.nextRound();assert(t.get().over);
t.freshGrid();t.fire();t.loop(10016);let a=t.get().active[0];if(a){let x=a.x/t.get().cell;sandbox.stageBox=()=>({w:320,h:320});t.layout();assert(Math.abs(t.get().active[0].x/t.get().cell-x)<1e-8);}
// 실제 loop / 충돌 / 패들을 사용한다. 끝없는 모드라 30분 또는 게임오버까지 측정.
const results=[];
for(const mode of (process.argv.includes('--quick')?[]:['idle','follow'])){
 t.freshGrid();t.set({phase:'aim'});let now=mode==='idle'?20000:2000000,frames=0,maxBalls=0,maxActive=0;
 for(;frames<60*60*30&&!t.get().over;frames++){
  const s=t.get();
  if(s.phase==='aim'){t.set({aim:(Math.random()-.5)*1.8});t.fire();}
  if(mode==='follow'){
   const down=s.active.filter(b=>b.dy>0).sort((a,b)=>b.y-a.y)[0];
   if(down)t.set({paddleX:sandbox.clamp(down.x,s.paddle.w/2,s.boardW-s.paddle.w/2)});
  }
  now+=1000/60;t.loop(now);const n=t.get();maxBalls=Math.max(maxBalls,n.ballCount);maxActive=Math.max(maxActive,n.active.length);
  for(const b of n.active)assert(Number.isFinite(b.x)&&Number.isFinite(b.y));
 }
 results.push({mode,seconds:Math.round(frames/60),round:t.get().round,score:t.get().score,gameOver:t.get().over,maxBalls,maxActive});
}
console.log(JSON.stringify({checks:'syntax, cancel, undo, pause, bonus-vs-brick danger, resize, simulation PASS',results},null,2));
// 회수 버튼을 연속으로 쓴 경우도 실제 종료와 되돌리기까지 간다.
t.freshGrid();t.set({phase:'aim'});let turns=0;
while(!t.get().over && turns++<20){t.fire();nodes['#bbRecall'].onclick();}
assert(t.get().over);t.undo();assert(!t.get().over && t.get().phase==='aim');
console.log('Recall to game-over and undo PASS, turns='+turns);



