const status=document.querySelector('#offline'),update=document.querySelector('#update');
if('serviceWorker'in navigator){
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async registration=>{
  const waiting=()=>{if(registration.waiting&&navigator.serviceWorker.controller){update.hidden=false;update.onclick=()=>{update.disabled=true;registration.waiting?.postMessage({type:'ACTIVATE'})}}};
  waiting();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')waiting();if(worker.state==='redundant')status.textContent='Preparazione offline non riuscita. Riprova con una connessione.'})});
  let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(update.disabled&&!reloading){reloading=true;location.reload()}else{update.hidden=true}});
  await navigator.serviceWorker.ready;status.textContent='Zaino pronto: disponibile offline';
 }).catch(()=>{status.textContent='Offline non disponibile: apri l’app con HTTPS o su localhost.'});
}else status.textContent='Questo browser non supporta la modalità offline.';
