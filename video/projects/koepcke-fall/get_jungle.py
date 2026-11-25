"""Download the free (CC0) Poly Haven jungle kit for 'She Fell Two Miles Out of the Sky': plants, roots, rocks, ground textures, storm/overcast skies.
Run (from video/): python -I projects/koepcke-fall/get_jungle.py"""
import os, json, urllib.request, time
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
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r, open(dest + ".part", "wb") as f:
                while True:
                    b = r.read(1 << 20)
                    if not b: break
                    f.write(b)
            os.replace(dest + ".part", dest); return True
        except Exception as e: err = e; time.sleep(3)
    print("FAILED", url, err); return False
MODELS = ["island_tree_01", "island_tree_02", "island_tree_03", "fern_02", "anthurium_botany_01", "calathea_orbifolia_01", "pachira_aquatica_01",
          "root_cluster_01", "root_cluster_02", "single_root", "moss_01", "rock_moss_set_01", "rock_moss_set_02", "boulder_01", "bark_debris_01",
          "shrub_01", "shrub_02", "shrub_03", "shrub_04", "nettle_plant", "tree_stump_01", "tree_stump_02", "dead_tree_trunk", "grass_medium_01",
          "grass_medium_02", "jacaranda_tree", "tree_small_02", "weed_plant_02", "periwinkle_plant", "bananas"]
for aid in MODELS:
    f = get_json(f"https://api.polyhaven.com/files/{aid}")
    try: g = f["gltf"]["1k"]["gltf"]
    except Exception: print("no gltf", aid); continue
    base = os.path.join(ROOT, "models", aid); ok = download(g["url"], os.path.join(base, aid + "_1k.gltf"))
    for rel, inc in g.get("include", {}).items(): ok &= download(inc["url"], os.path.join(base, rel))
    print("model", aid, ok, flush=True)
T = get_json("https://api.polyhaven.com/assets?t=textures") or {}
keys = ("leaves", "mud", "moss", "forest", "forrest", "bark", "jungle", "river", "aerial_grass", "rainforest", "dirt", "ground", "thatch", "straw", "rope", "wood_planks", "metal_plate", "aircraft", "painted_metal")
tw = sorted([a for a in T if any(k in a for k in keys)], key=lambda a: -T[a].get("download_count", 0))[:40]
for aid in tw:
    f = get_json(f"https://api.polyhaven.com/files/{aid}")
    if not f: continue
    for m, nm in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
        try: u = f[m]["2k"]["jpg"]["url"]
        except Exception: continue
        download(u, os.path.join(ROOT, "textures", aid, f"{aid}_{nm}_2k.jpg"))
    print("texture", aid, flush=True)
H = get_json("https://api.polyhaven.com/assets?t=hdris") or {}
hw = sorted([a for a, i in H.items() if set(i.get("tags", [])) & {"storm", "stormy", "overcast", "dramatic", "rain", "clouds", "cloudy"} or "forest" in a], key=lambda a: -H[a].get("download_count", 0))[:8]
for aid in hw:
    f = get_json(f"https://api.polyhaven.com/files/{aid}")
    try: u = f["hdri"]["2k"]["hdr"]["url"]
    except Exception: continue
    download(u, os.path.join(ROOT, "hdri", aid + "_2k.hdr")); print("hdri", aid, flush=True)
print("DONE")
