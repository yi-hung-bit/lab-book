#!/usr/bin/env python3
"""把 claude.ai「物理研究院」的已發佈檔案同步到 physics-building/（GitHub Pages 線上版）。

用法：python3 tools/sync_from_artifact.py <下載的物理研究院資料夾>
  資料夾內要有 index.html 與 sims/*.html（用 Artifact read 的 paths + out_dir 下載）。

做的事：
1. index.html：用物理研究院的頁面，加上 PWA（manifest、圖示、service worker），three.js 改用 vendor/ 本地檔。
2. sims/：物理研究院新增的模擬直接複製（three.js、Chart.js 改用 ../vendor/）；
   已同步過、而物理研究院沒改的模擬保留 repo 裡的離線版（有些是改寫成不需網路的版本）；
   物理研究院有改過的（補強）重新複製，並列出提醒，需要時再做離線改寫。
3. sw.js：重建快取清單、VERSION 加 1。
同步紀錄存在 tools/sync-state.json（每個模擬在物理研究院的 sha256）。
"""
import hashlib, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PB = os.path.dirname(HERE)
STATE = os.path.join(HERE, "sync-state.json")

PWA_HEAD = """<title>物理研究院</title>
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1f3347">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="物理研究院">
"""
SW_SNIPPET = """<script>
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").then(r=>r.update()).catch(()=>{}));
  let reloaded=false; const hadController=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(hadController&&!reloaded){reloaded=true;location.reload();}});
}
</script>
"""
LIBS = [
    (r'https://cdnjs\.cloudflare\.com/ajax/libs/three\.js/r128/three\.min\.js', 'vendor/three.min.js'),
    (r'https://cdn\.jsdelivr\.net/npm/chart\.js@4[^"\']*/dist/chart\.umd(?:\.min)?\.js', 'vendor/chart.umd.min.js'),
    (r'https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/4[^"\']*/chart\.umd(?:\.min)?\.js', 'vendor/chart.umd.min.js'),
]

def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()

def localize(text, prefix):
    for pat, rep in LIBS:
        text = re.sub(pat, prefix + rep, text)
    return text

def build_index(src):
    s = open(src, encoding="utf-8").read()
    if not s.lstrip().lower().startswith("<!doctype"):
        s = "<!doctype html><html><head><meta charset=utf8><meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\"></head><body>\n" + s + "\n</body></html>"
    s = re.sub(r"<title>.*?</title>\n?", PWA_HEAD, s, count=1, flags=re.S)
    s = localize(s, "")
    i = s.rfind("</body>")
    s = s[:i] + SW_SNIPPET + s[i:]
    return s

def main(src):
    state = json.load(open(STATE, encoding="utf-8")) if os.path.exists(STATE) else {}
    out = os.path.join(PB, "index.html")
    open(out, "w", encoding="utf-8").write(build_index(os.path.join(src, "index.html")))
    sdir = os.path.join(src, "sims")
    added, updated, kept = [], [], []
    names = sorted(f for f in os.listdir(sdir) if f.endswith(".html"))
    for f in names:
        a = os.path.join(sdir, f); dst = os.path.join(PB, "sims", f); h = sha(a)
        if os.path.exists(dst) and state.get(f) == h:
            kept.append(f); continue
        if os.path.exists(dst) and f not in state:
            # 第一次同步：repo 已有的視為已同步（保留離線版）
            state[f] = h; kept.append(f); continue
        (updated if os.path.exists(dst) else added).append(f)
        open(dst, "w", encoding="utf-8").write(localize(open(a, encoding="utf-8").read(), "../"))
        state[f] = h
    json.dump(state, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    # sw.js
    swp = os.path.join(PB, "sw.js"); sw = open(swp, encoding="utf-8").read()
    v = int(re.search(r'VERSION="v(\d+)"', sw).group(1)) + 1
    sw = re.sub(r'VERSION="v\d+"', f'VERSION="v{v}"', sw)
    core = [l for l in re.search(r"const FILES=\[(.*?)\];", sw, re.S).group(1).split("\n") if l.strip() and "sims/" not in l]
    core = [l.rstrip().rstrip(",") for l in core]
    sims = [f' "sims/{f}"' for f in sorted(os.listdir(os.path.join(PB, "sims"))) if f.endswith(".html") and f in names]
    sw = re.sub(r"const FILES=\[.*?\];", "const FILES=[\n" + ",\n".join(core + sims) + "\n];", sw, count=1, flags=re.S)
    open(swp, "w", encoding="utf-8").write(sw)
    print(f"sw.js VERSION v{v}")
    print("新增:", added or "無"); print("更新（物理研究院有改過，可能需要重做離線改寫）:", updated or "無"); print("保留:", len(kept))

if __name__ == "__main__":
    main(sys.argv[1])
