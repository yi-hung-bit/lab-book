// 教學檔案室 離線快取。更新程式時把 VERSION 加 1，下次開啟就會換成新版。
// 卷宗資料存在瀏覽器的 localStorage / IndexedDB，不在這個快取裡，換版不會清掉資料。
const VERSION = "v1";
const CACHE = "archive-app-" + VERSION;
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith("archive-app-")).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html")) {
      // 主頁：有網路先拿最新版，沒網路用快取
      e.respondWith(caches.open(CACHE).then(async c => {
        try {
          const r = await fetch(req, { cache: "no-cache" });
          if (r.ok) c.put(req, r.clone());
          return r;
        } catch (err) {
          return (await c.match(req, { ignoreSearch: true })) || (await c.match("./")) || Response.error();
        }
      }));
    } else {
      // 圖示等：先用快取，背景更新
      e.respondWith(caches.open(CACHE).then(async c => {
        const hit = await c.match(req, { ignoreSearch: true });
        const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      }));
    }
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open("archive-app-fonts").then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (err) { return hit || Response.error(); }
    }));
  }
});
