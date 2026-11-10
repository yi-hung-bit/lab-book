// 物理大樓 離線快取。更新內容時把 VERSION 加 1，學生下次開啟就會拿到新版。
const VERSION="v20";
const CACHE="physics-building-"+VERSION;
const FILES=[
 "./",
 "index.html",
 "manifest.webmanifest",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-maskable-512.png",
 "icons/apple-touch-icon.png",
 "vendor/three.min.js",
 "vendor/react.production.min.js",
 "vendor/react-dom.production.min.js",
 "vendor/chart.umd.min.js",
 "sims/b-brownian.html",
 "sims/b-doppler-circle.html",
 "sims/b-doppler-linear.html",
 "sims/b-doppler-shm.html",
 "sims/b-electron-slit.html",
 "sims/b-blackbody.html",
 "sims/b-photoelectric.html",
 "sims/b-electroscope.html",
 "sims/b-spectra.html",
 "sims/b-bohr.html",
 "sims/b-franck-hertz.html",
 "sims/b-galileo-incline.html",
 "sims/b-friction.html",
 "sims/b-kepler.html",
 "sims/b-free-fall.html",
 "sims/b-rutherford.html",
 "sims/b-davisson.html",
 "sims/b-pendulum.html",
 "sims/b-scale-prefix.html",
 "sims/b-si-units.html",
 "sims/b-motion-graphs.html",
 "sims/b-microphone.html",
 "sims/comp-double-spring.html",
 "sims/comp-wilberforce.html",
 "sims/e1-blocks.html",
 "sims/e1-bowl.html",
 "sims/e1-three-body.html",
 "sims/e2-orbit.html",
 "sims/e2-semicircle.html",
 "sims/e3-air-column.html",
 "sims/e3-ripple.html",
 "sims/e4-induction.html",
 "sims/e4-loop-field.html",
 "sims/e5-davisson.html",
 "sims/e5-neutron.html",
 "sims/j-power-phase.html",
 "sims/j-ruler-reading.html",
 "sims/j-displacement-volume.html",
 "sims/j-balance.html",
 "sims/j-density.html",
 "sims/j-separation.html",
 "sims/j-chromatography.html"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k.startsWith("physics-building-")).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET") return;
  if(u.origin===location.origin){
    // 同網域：先用快取（離線可用），背景更新
    e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
      const net=fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}return r;}).catch(()=>hit);
      return hit||net;
    }));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    // 字型：有網路時存一份，離線時用存的
    e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{c.put(e.request,r.clone());return r;}))));
  }
});
