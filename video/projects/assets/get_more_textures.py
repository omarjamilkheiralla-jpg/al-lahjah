"""More Poly Haven CC0 textures by category (wood, floor, ground, wall, fabric, leather, metal, roofing) into video/assets/polyhaven/textures.
Run: python -I projects/assets/get_more_textures.py"""
import os, json, urllib.request, time
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "polyhaven", "textures"))
UA = {"User-Agent": "video-asset-fetch/1.0"}
def gj(u):
    for _ in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60))
        except Exception: time.sleep(2)
def dl(u, d):
    if os.path.exists(d) and os.path.getsize(d) > 0: return
    os.makedirs(os.path.dirname(d), exist_ok=True)
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r, open(d + ".part", "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            os.replace(d + ".part", d); return
        except Exception: time.sleep(3)
n = 0
for cat, lim in (("wood", 14), ("floor", 8), ("terrain", 10), ("wall", 8), ("fabric", 8), ("leather", 4), ("metal", 6), ("roofing", 4), ("rock", 4)):
    A = gj(f"https://api.polyhaven.com/assets?t=textures&c={cat}") or {}
    ids = sorted(A, key=lambda a: -A[a].get("download_count", 0))[:lim]
    for aid in ids:
        f = gj(f"https://api.polyhaven.com/files/{aid}")
        if not f: continue
        for m, nm in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
            try: dl(f[m]["2k"]["jpg"]["url"], os.path.join(ROOT, aid, f"{aid}_{nm}_2k.jpg"))
            except Exception: pass
        n += 1; print(cat, aid)
print("DONE", n)
