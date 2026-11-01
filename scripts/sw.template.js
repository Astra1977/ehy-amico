// Generato da npm run build. La cache è isolata per app e sottopercorso.
const ASSETS=__ASSETS__,PREFIX='ehy-amico:'+new URL(self.registration.scope).pathname+':',CACHE=PREFIX+'__VERSION__';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'}))))));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url),scope=new URL(self.registration.scope);if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;const path=url.pathname.slice(scope.pathname.length)||'index.html';if(!ASSETS.includes(path))return;event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL(path,scope).href))||fetch(event.request))) });
