// Contratto per i moduli dei giochi delle fasi successive.
export function createSession({host,store,gameId}){
 const controller=new AbortController(),cleaners=[];let stopped=false,last=0,frame;
 const pause=()=>{last=0;host.dispatchEvent(new Event('game:pause'))};
 window.addEventListener('blur',pause,{signal:controller.signal});
 document.addEventListener('visibilitychange',pause,{signal:controller.signal});
 return {host,settings:store.data.settings,signal:controller.signal,
 complete:(mission,score)=>store.complete(gameId,mission,score),
 listen(target,type,handler){target.addEventListener(type,handler,{signal:controller.signal})},
 onCleanup(fn){cleaners.push(fn)},
 frames(fn){const tick=now=>{if(stopped)return;if(!document.hidden)fn(last?Math.min((now-last)/1000,.05):0);last=document.hidden?0:now;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick)},
 dispose(){stopped=true;cancelAnimationFrame(frame);controller.abort();cleaners.reverse().forEach(fn=>fn())}
 };
}
