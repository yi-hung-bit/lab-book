// 實驗培訓 離線快取。更新內容時把 VERSION 加 1，學生下次開啟就會拿到新版。
const VERSION="v1";
const CACHE="lab-book-"+VERSION;
const FILES=[
 "./",
 "index.html",
 "manifest.webmanifest",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/apple-touch-icon.png",
 "labs/int-104n2.html",
 "labs/int-106final.html",
 "labs/int-cd.html",
 "labs/int-wedge.html",
 "labs/lens-cyl.html",
 "labs/lens-mirror.html",
 "labs/lens-plastic.html",
 "labs/pol-brewster.html",
 "labs/refr-104tn.html",
 "labs/refr-105cy.html",
 "labs/refr-105tc.html",
 "labs/refr-106tc.html",
 "labs/refr-acrylic.html",
 "labs/refr-cyl.html",
 "labs/refr-glycerin.html",
 "labs/refr-liquid.html"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k.startsWith("lab-book-")).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // 自己的檔案：先用快取（離線可用），同時在背景抓新版
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(req,{ignoreSearch:true});
      const net=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r;}).catch(()=>hit);
      return hit||net;
    }));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    // 字型：抓過一次就存起來
    e.respondWith(caches.open("lab-book-fonts").then(async c=>{
      const hit=await c.match(req); if(hit)return hit;
      try{const r=await fetch(req);c.put(req,r.clone());return r;}catch(err){return hit||Response.error();}
    }));
  }
});
