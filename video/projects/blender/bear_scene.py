"""Builds the whole 'Bear in the Saloon' scene and renders frames.
blender -b --gpu-backend opengl -P bear_scene.py -- still <t> <out.png> [w h samples]
blender -b --gpu-backend opengl -P bear_scene.py -- frames <f0> <f1> <outdir> [w h samples]"""
import bpy, sys, os, math, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bl_common as B, sets as S
from chars2 import *
from mathutils import Vector
from director import Director

argv = sys.argv[sys.argv.index("--") + 1:]
mode = argv[0]
W_, H_, SMP = 1080, 1920, 40
if mode == "still": out = argv[2]; t0 = float(argv[1]); extra = argv[3:]
elif mode == "times": outdir = argv[1]; tlist = [float(x) for x in argv[2].split(",")]; extra = argv[3:]
else: f0, f1, outdir = int(argv[1]), int(argv[2]), argv[3]; extra = argv[4:]
if len(extra) >= 2: W_, H_ = int(extra[0]), int(extra[1])
if len(extra) >= 3: SMP = int(extra[2])

B.clean(); sc = B.setup_render(W_, H_, SMP)
sc.eevee.use_raytracing = os.environ.get("RT", "1") == "1"
S.world_for_street(); S.street(); doors = S.saloon(); S.lab(); S.cabin()
D = Director(doors)
if mode == "times":
    os.makedirs(outdir, exist_ok=True)
    for tt in tlist:
        t_ = time.time(); D.update(tt); sc.render.filepath = os.path.join(outdir, f"t{tt:06.2f}.png"); bpy.ops.render.render(write_still=True); print("DONE", tt, round(time.time() - t_, 1), "s", flush=True)
elif mode == "still":
    D.update(t0); sc.render.filepath = out; bpy.ops.render.render(write_still=True)
else:
    os.makedirs(outdir, exist_ok=True)
    for f in range(f0, f1 + 1):
        fp = os.path.join(outdir, f"f{f:05d}.png")
        if os.path.exists(fp): continue
        D.update(f / 30.0); sc.render.filepath = fp; bpy.ops.render.render(write_still=True)
        print("FRAME", f, flush=True)
