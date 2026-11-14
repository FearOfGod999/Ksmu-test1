/* NOVA PWA: only static assets cached. Never cache auth/session/API responses. */
const CACHE='ksmu-nova-20261114-v1';
const PREFIXES=['ksmu-nova-','kgmu-'];
const ASSETS=['./','./index.html','./schedule.json','./cloud-sync.js','./community-extras.js','./nova.css','./nova.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>PREFIXES.some(p=>k.startsWith(p))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const request=e.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const allowed=/\.(?:html|css|js|json|png|webmanifest)$/.test(url.pathname)||url.pathname==='/'||request.mode==='navigate';
 if(!allowed)return;
 e.respondWith(fetch(request).then(res=>{if(res.ok&&res.type==='basic'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(request,cp));}return res;}).catch(()=>caches.match(request).then(r=>r||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
