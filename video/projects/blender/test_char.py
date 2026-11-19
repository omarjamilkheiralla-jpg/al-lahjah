import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bl_common as B
out = sys.argv[sys.argv.index("--") + 1]
B.clean(); sc = B.setup_render(540, 960, 32)
B.sky("kloofendal_48d_partly_cloudy_puresky_2k.hdr", 1.1, rot=1.0)
if not os.environ.get("NOSUN"): B.light("SUN", (5, -6, 8), 5.0, (1, 0.93, 0.8), rot=(0.9, 0.2, 0.6))
# sand ground + plank wall
if not os.environ.get("NOFLOOR"): B.prim("plane", (60, 60, 1), (0, 0, 0), m=B.mat("sand", (0.8, 0.65, 0.45, 1), 0.95, tex="aerial_ground_rock", scale=0.35, tint=(1.0, 0.82, 0.5, 1)), smooth=False)
if not os.environ.get("NOWALL"): B.prim("cube", (14, 0.4, 4), (0, 3.5, 2), m=B.mat("planks", (0.5, 0.3, 0.2, 1), 0.8, tex="black_painted_planks", scale=0.6, tint=(0.75, 0.35, 0.25, 1)))
s = B.Stick("sheriff", top=(0.45, 0.22, 0.1, 1), hat="cowboy", hatc=(0.85, 0.72, 0.5, 1), star=True); s.place(0, 0, 0)
s.pose(0, 0, elbow=(0.3, 0.3)); s.expr("angry")
b = B.Stick("bandit", top=(0.75, 0.12, 0.1, 1), hat="top", hatc=(0.08, 0.08, 0.1, 1), stache=False); b.place(-1.6, 1.0, 0, 0.4); b.pose(1.0, 0.8)
B.camera((0.8, -4.2, 1.7), (0, 0, 1.9), fov=46, fstop=2.0, focus=4.4)
hp = [x for x in os.environ.get("HIDEPAR", "").split(",") if x]
for o in bpy.data.objects:
    if o.type == "MESH" and o.parent is not None and any(o.parent.name.startswith("sheriff") and h in o.parent.name for h in hp): o.hide_render = True
hide = os.environ.get("HIDE", "").split(",")
for o in bpy.data.objects:
    if o.type == "MESH" and any(o.name.startswith(h) for h in hide if h): o.hide_render = True
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
