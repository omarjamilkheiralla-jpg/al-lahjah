"""Blender test scene: a night living room built from the free Poly Haven library, rendered with EEVEE (uses the graphics card).
Run: blender -b --python projects/blender/room_test.py -- <out.png> [samples]"""
import bpy, os, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "out/blender_test.png"; SAMPLES = int(argv[1]) if len(argv) > 1 else 64
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "polyhaven"))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try: sc.render.engine = eng; break
    except TypeError: continue
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.render.filepath = OUT
try: sc.eevee.taa_render_samples = SAMPLES
except Exception: pass
for k, v in (("use_raytracing", True), ("use_shadows", True)):
    try: setattr(sc.eevee, k, v)
    except Exception: pass
try: sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Punchy"
except Exception: pass

def mat_pbr(name, tex, rep=(1, 1), tint=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    d = os.path.join(ROOT, "textures", tex)
    def img(suffix, nonc=False):
        p = os.path.join(d, f"{tex}_{suffix}_2k.jpg")
        if not os.path.exists(p): return None
        n = nt.nodes.new("ShaderNodeTexImage"); n.image = bpy.data.images.load(p)
        if nonc: n.image.colorspace_settings.name = "Non-Color"
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (rep[0], rep[1], 1)
        tc = nt.nodes.new("ShaderNodeTexCoord"); nt.links.new(tc.outputs["UV"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], n.inputs["Vector"]); return n
    di = img("diff"); ro = img("rough", True); no = img("nor", True)
    if di: nt.links.new(di.outputs["Color"], b.inputs["Base Color"])
    if ro: nt.links.new(ro.outputs["Color"], b.inputs["Roughness"])
    if no:
        nm = nt.nodes.new("ShaderNodeNormalMap"); nt.links.new(no.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m
def box(name, size, loc, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    # UVs scale with world size (cube_add gives 0..1 per face); smart project keeps texel density sane
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.uv.cube_project(cube_size=2.0); bpy.ops.object.mode_set(mode="OBJECT")
    o.data.materials.append(mat); return o
def load_model(mid, loc, rot=0, scale=1.0):
    p = os.path.join(ROOT, "models", mid, f"{mid}_1k.gltf")
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=p)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(mid + "_root", None); sc.collection.objects.link(root)
    for o in new:
        if o.parent is None: o.parent = root
    root.location = loc; root.rotation_euler[2] = math.radians(rot); root.scale = (scale,) * 3; return root

# ---- room (6 m x 6 m x 2.7 m); camera sits on the sofa side looking at the front wall
floor = mat_pbr("floor", "wood_floor", (3, 3)); wall = mat_pbr("wall", "beige_wall_001", (2, 1)); ceil = mat_pbr("ceil", "white_plaster_02", (2, 2))
box("floor", (6, 6, 0.1), (0, 0, -0.05), floor); box("ceiling", (6, 6, 0.1), (0, 0, 2.75), ceil)
box("wall_front", (6, 0.1, 2.7), (0, -3.05, 1.35), wall); box("wall_right", (0.1, 6, 2.7), (3.05, 0, 1.35), wall)
box("wall_left_a", (0.1, 2.0, 2.7), (-3.05, -2.0, 1.35), wall); box("wall_left_b", (0.1, 2.0, 2.7), (-3.05, 2.0, 1.35), wall)
box("wall_left_top", (0.1, 2.0, 0.7), (-3.05, 0, 2.35), wall); box("wall_left_bot", (0.1, 2.0, 0.8), (-3.05, 0, 0.4), wall)
box("wall_back", (6, 0.1, 2.7), (0, 3.05, 1.35), wall)
# ---- furniture from the library
load_model("Television_01", (0.4, -2.75, 0.0), 180, 1.0); load_model("CoffeeTable_01", (0, -0.6, 0), 90, 0.75); load_model("desk_lamp_arm_01", (-1.5, -2.6, 0.0), 30, 1.0)
load_model("Sofa_01", (0, 2.5, 0), 180, 1.0); load_model("ArmChair_01", (-1.9, 0.2, 0), -60, 1.0)
for o in bpy.data.objects:
    if o.type == "MESH" and o.name.startswith("Television"): pass
# ---- world: the night HDRI (seen through the left window), dim and blue
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True; nt = w.node_tree
env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(os.path.join(ROOT, "hdri", "dikhololo_night_2k.hdr"))
bg = nt.nodes["Background"]; bg.inputs["Strength"].default_value = 0.6; nt.links.new(env.outputs["Color"], bg.inputs["Color"])
def light(kind, loc, energy, color, size=0.3, rot=(0, 0, 0)):
    bpy.ops.object.light_add(type=kind, location=loc, rotation=rot); l = bpy.context.object; l.data.energy = energy; l.data.color = color
    if kind == "AREA": l.data.size = size
    else: l.data.shadow_soft_size = size
    return l
light("POINT", (-1.4, -1.8, 1.4), 600, (1.0, 0.65, 0.35), 0.25)       # warm lamp
light("AREA", (0.4, -2.55, 1.0), 180, (0.45, 0.65, 1.0), 1.2, (math.radians(90), 0, 0))   # TV glow
light("SUN", (0, 0, 5), 0.6, (0.5, 0.65, 1.0), 0.05, (math.radians(55), 0, math.radians(-100)))   # moon through the window
# ---- camera on the sofa side, slightly low, with a shallow depth of field
bpy.ops.object.camera_add(location=(0.1, 2.35, 1.2)); cam = bpy.context.object; sc.camera = cam
d = Vector((0.3, -2.7, 0.95)) - cam.location; cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 30; cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 4.5; cam.data.dof.aperture_fstop = 2.4
# light haze for volumetric shafts
try:
    vol = bpy.data.materials.new("haze"); vol.use_nodes = True; nt2 = vol.node_tree; nt2.nodes.clear()
    sv = nt2.nodes.new("ShaderNodeVolumeScatter"); sv.inputs["Density"].default_value = 0.02; out = nt2.nodes.new("ShaderNodeOutputMaterial"); nt2.links.new(sv.outputs[0], out.inputs["Volume"])
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.35)); h = bpy.context.object; h.scale = (6, 6, 2.7); h.display_type = "WIRE"; h.data.materials.append(vol)
except Exception as e: print("haze skipped", e)
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
bpy.ops.render.render(write_still=True)
print("RENDERED", OUT, sc.render.engine)
