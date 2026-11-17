/* Offline shell. Bump VERSION with every release or asset change.
   No user state, uploads, external resources or API responses are cached. */
'use strict';
const VERSION='release-20261117-offline-1';
const ROOT=new URL('./',self.location.href);
const PREFIX='stam-shell-'+ROOT.pathname+'-';
const CACHE=PREFIX+VERSION;
const ASSETS=['./','./index.html','./1-practice-feature.js','./1-2-lesson-mail.js?v=20261117','./offline-support.js',
 './6-manifest-finalB.webmanifest','./1-logo-finalB-32.png','./2-logo-finalB-180.png',
 './3-logo-finalB-192.png','./4-logo-finalB-512.png','./5-logo-finalB-maskable-512.png','./1-7-hero-megillah.jpg'];
const DIGESTS={"./":"a8992f8d251ece5685faa9d7e0cee09ed2647ff750b757ce36938e0546350d32","./index.html":"a8992f8d251ece5685faa9d7e0cee09ed2647ff750b757ce36938e0546350d32","./1-practice-feature.js":"8748dc9bdf2b137f574dba0efc0f7fc818d262b2574e8577fe05f587c3d543ec","./1-2-lesson-mail.js?v=20261117":"ad1d3c8a2ab09db811177853238a0379b044ffce4d594abd42a9a9a48feb3ed5","./offline-support.js":"ac713d821dab3bad11a2a0c0b099d40adfc7f88a8b9a5e0deb85155f6e2d8e43","./6-manifest-finalB.webmanifest":"0074968e9d5dd014862d68dd1e5088ae66ba0c5449c50792edd85497a4901137","./1-logo-finalB-32.png":"29b10b789e4df88f45d2b2be8699a7fbb261d165bade141e79ce46cec745fbd0","./2-logo-finalB-180.png":"485b1393b6cec0ed31627eed5f0b5662715f4c4fb87fc961afb784b9981fd8c1","./3-logo-finalB-192.png":"fe9e19368299810911f5b3749f1226fcb98940d92f4077e3ad43839a18699d67","./4-logo-finalB-512.png":"c9317e2c860efd25a0ad947fa8be8c6a4219e0cad6e3e48a4e862e70c237c52c","./5-logo-finalB-maskable-512.png":"c9317e2c860efd25a0ad947fa8be8c6a4219e0cad6e3e48a4e862e70c237c52c","./1-7-hero-megillah.jpg":"4927a609cfd4c053f1d8f4d6d4a2133abff5f51f7c38a60921eb74bb967530eb"};
const URLS=ASSETS.map(p=>new URL(p,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const existed=await caches.has(CACHE);
 const cache=await caches.open(CACHE);
 if(existed){
  const complete=(await Promise.all(URLS.map(url=>cache.match(url)))).every(Boolean);
  if(complete)return; /* An existing complete release is immutable. */
  throw Error('Existing release cache incomplete; use a new release version');
 }
 try{
  if(ASSETS.some(path=>!DIGESTS[path]))throw Error('Release digests not prepared');
  for(let i=0;i<URLS.length;i++){
   const response=await fetch(new Request(URLS[i],{cache:'reload'}));
   if(!response.ok)throw Error('Shell asset unavailable');
   const bytes=await response.clone().arrayBuffer();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
   if(hash!==DIGESTS[ASSETS[i]])throw Error('Shell release mismatch');
   await cache.put(URLS[i],response);
  }
 }
 catch(error){await caches.delete(CACHE);throw error}
 /* Deliberately no skipWaiting: do not replace a working app in a lesson. */
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==ROOT.origin)return;
 const shellNavigation=request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===ROOT.pathname+'index.html');
 const exactAsset=URLS.includes(url.href);
 if(!shellNavigation&&!exactAsset)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const hit=await cache.match(shellNavigation?ROOT.href:request.url);
  if(hit)return hit;
  /* Do not mix network shell assets into an incomplete installed release. */
  return new Response('Offline shell is not ready. Reopen with internet.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='STAM_OFFLINE_STATUS')return;
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);const complete=(await Promise.all(URLS.map(url=>cache.match(url)))).every(Boolean);
  if(event.ports[0])event.ports[0].postMessage({version:VERSION,complete});
 })());
});
