"""Download a useful free (CC0) starter library from Poly Haven into video/assets/polyhaven: night/indoor/overcast HDRIs, floor/wall/ground textures, and a few furniture models.
Run: python -I projects/assets/get_polyhaven.py"""
import os, json, sys, urllib.request, urllib.error, time
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "polyhaven"))
UA = {"User-Agent": "video-asset-fetch/1.0"}
def get_json(url):
    for k in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))
        except Exception as e: err = e; time.sleep(2)
    print("FAILED", url, err); return None
def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0: return True
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for k in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r, open(dest + ".part", "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            os.replace(dest + ".part", dest); return True
        except Exception as e: err = e; time.sleep(3)
    print("FAILED", url, err); return False
total = 0
# ---- HDRIs (sky lighting for Blender): night, indoor, overcast, sunset
H = get_json("https://api.polyhaven.com/assets?t=hdris") or {}
want = []
for aid, info in H.items():
    cats = set(info.get("categories", [])); tags = set(info.get("tags", []))
    if cats & {"night", "indoor", "overcast", "sunrise-sunset", "urban", "skies"} or tags & {"night", "storm", "moody"}: want.append(aid)
want = sorted(want, key=lambda a: -H[a].get("download_count", 0))[:18]
for aid in want:
    f = get_json(f"https://api.polyhaven.com/files/{aid}")
    try: u = f["hdri"]["2k"]["hdr"]["url"]
    except Exception: continue
    if download(u, os.path.join(ROOT, "hdri", aid + "_2k.hdr")): total += 1; print("hdri", aid)
# ---- textures (diffuse + normal + roughness, 2k jpg)
T = get_json("https://api.polyhaven.com/assets?t=textures") or {}
keys = ("wood_floor", "wooden_floor", "plaster", "wall", "concrete", "asphalt", "grass", "brick", "rock", "metal", "fabric", "leather", "roof", "siding", "tiles", "carpet", "wood_planks", "painted")
tw = [a for a in T if any(k in a for k in keys)][:70]
for aid in tw:
    f = get_json(f"https://api.polyhaven.com/files/{aid}")
    if not f: continue
    for m, nm in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
        try: u = f[m]["2k"]["jpg"]["url"]
        except Exception: continue
        download(u, os.path.join(ROOT, "textures", aid, f"{aid}_{nm}_2k.jpg"))
    total += 1; print("texture", aid)
# ---- models (gltf with textures)
M = get_json("https://api.polyhaven.com/assets?t=models") or {}
mk = ("sofa", "armchair", "chair", "table", "lamp", "door", "window", "bookshelf", "tv", "television", "cabinet", "rug", "curtain", "mug", "plant", "lantern", "fire", "street", "mailbox", "fence", "tree", "barrel", "crate", "bed", "wardrobe", "drawer")
mw = [a for a in M if any(k in a.lower() for k in mk)][:45]
for aid in mw:
    f = get_json(f"https://api.polyhaven.com/files/{aid}")
    try: g = f["gltf"]["1k"]["gltf"]
    except Exception: continue
    base = os.path.join(ROOT, "models", aid); ok = download(g["url"], os.path.join(base, aid + "_1k.gltf"))
    for rel, inc in g.get("include", {}).items(): ok &= download(inc["url"], os.path.join(base, rel))
    if ok: total += 1; print("model", aid)
print("DONE", total, "items ->", ROOT)
