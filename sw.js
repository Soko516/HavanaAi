const CACHE="havanaai-v5";
const ASSETS=["/","/index.html","/styles.css","/app.js","/manifest.json"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("havanaai-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then(response=>{
    if(event.request.method==="GET"&&response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(c=>c||caches.match("/"))));
});
