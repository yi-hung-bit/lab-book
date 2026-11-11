# 物理研究院（原物理大樓）

模擬大樓（一層樓一冊，每間教室一個物理模擬）與競賽大樓。內容和 claude.ai 的物理研究院同步：每次物理研究院更新後，用 `tools/sync_from_artifact.py` 同步到這裡再推送。可安裝、可離線使用（PWA）。

網址：https://yi-hung-bit.github.io/lab-book/physics-building/

## 安裝
- Android／電腦 Chrome、Edge：開網址後從選單「安裝 App」
- iPhone／iPad：Safari 開啟 → 分享 →「加入主畫面」

## 更新內容
修改檔案後，把 `sw.js` 裡的 `VERSION` 加 1（例如 `v1` → `v2`），使用者下次開啟就會拿到新版。

## 內容
- `index.html`：大樓主頁；`sims/`：21 個模擬
- `vendor/`：three.js、React、Chart.js 本地副本（離線可用）
