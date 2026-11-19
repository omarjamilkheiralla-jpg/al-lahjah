"""Shared Blender helpers for the Style 1 shorts: textured materials, inverted-hull ink outlines, stick-leg cartoon characters with poses."""
import bpy, math, os, random
from mathutils import Vector, Matrix, Euler
AS = r"C:\Users\jamil\al-lahjah\video\assets\polyhaven"
INK = (0.04, 0.03, 0.06, 1)
_mats = {}

def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()

def setup_render(w=1080, h=1920, samples=48):
    sc = bpy.context.scene
    for e in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try: sc.render.engine = e; break
        except TypeError: pass
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100
    for k, v in (("taa_render_samples", samples), ("use_raytracing", os.environ.get("NORT") is None), ("use_shadows", os.environ.get("NOSH") is None), ("use_fast_gi", os.environ.get("NOGI") is None), ("use_volumetric_shadows", True), ("shadow_ray_count", 2), ("shadow_step_count", 8)):
        try: setattr(sc.eevee, k, v)
        except Exception: pass
    for k, v in (("view_transform", "Standard"), ("look", "None"), ("exposure", -0.55)):
        try: setattr(sc.view_settings, k, v)
        except Exception: pass
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"
    sc.render.fps = 30
    return sc

def _tex_nodes(nt, bsdf, tid, scale, coord="Object", normal_strength=0.6):
    d = os.path.join(AS, "textures", tid)
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs[coord], mp.inputs["Vector"])
    def img(suffix, nonc):
        p = os.path.join(d, f"{tid}_{suffix}_2k.jpg")
        if not os.path.exists(p): return None
        n = nt.nodes.new("ShaderNodeTexImage"); n.image = bpy.data.images.load(p); n.projection = "BOX"; n.projection_blend = 0.25
        if nonc: n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs["Vector"], n.inputs["Vector"]); return n
    dn = img("diff", False)
    if dn: nt.links.new(dn.outputs["Color"], bsdf.inputs["Color"])
    nn = img("nor", True)
    if nn:
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = normal_strength
        nt.links.new(nn.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return dn

def _diffuse(name, color, emission=None, em_strength=1.0):
    """Diffuse (+ optional emission) material; EEVEE's Principled BSDF produces black speckles on this GPU, Diffuse does not."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); d = nt.nodes.new("ShaderNodeBsdfDiffuse"); d.inputs["Color"].default_value = color
    if emission is not None:
        em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = emission; em.inputs["Strength"].default_value = em_strength
        ad = nt.nodes.new("ShaderNodeAddShader"); nt.links.new(d.outputs["BSDF"], ad.inputs[0]); nt.links.new(em.outputs["Emission"], ad.inputs[1]); nt.links.new(ad.outputs["Shader"], out.inputs["Surface"])
    else: nt.links.new(d.outputs["BSDF"], out.inputs["Surface"])
    return m, nt, d

def mat(name, color=(0.8, 0.8, 0.8, 1), rough=0.7, tex=None, scale=1.0, tint=None, emission=None, em_strength=1.0, metallic=0.0, coord="Object", normal=0.6):
    key = (name, tuple(color), rough, tex, scale)
    if key in _mats: return _mats[key]
    if metallic > 0.5 and emission is None: emission, em_strength = tuple(c * 0.35 for c in color[:3]) + (1,), 1.0
    m, nt, b = _diffuse(name, color, emission, em_strength)
    if tex:
        dn = _tex_nodes(nt, b, tex, scale, coord, normal)
        if tint is not None and dn:
            bw = nt.nodes.new("ShaderNodeRGBToBW"); nt.links.new(dn.outputs["Color"], bw.inputs["Color"])
            cr = nt.nodes.new("ShaderNodeValToRGB"); cr.color_ramp.elements[0].color = (0.1, 0.1, 0.1, 1); cr.color_ramp.elements[1].color = (1.35, 1.35, 1.35, 1); nt.links.new(bw.outputs["Val"], cr.inputs["Fac"])
            mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs["Factor"].default_value = 1.0; mx.inputs["B"].default_value = tint
            nt.links.new(cr.outputs["Color"], mx.inputs["A"]); nt.links.new(mx.outputs["Result"], b.inputs["Color"])
    _mats[key] = m; return m

def soft(name, color, rough=0.8, scale=14.0, var=0.10, bump=0.12, emission=None, em_strength=1.0):
    """plain painted colour (procedural Noise nodes make black speckles on this GPU, so no noise here)"""
    key = ("soft", name, tuple(color))
    if key in _mats: return _mats[key]
    m, nt, b = _diffuse(name, color, emission, em_strength); _mats[key] = m; return m

def ink_mat():
    if "ink" in _mats: return _mats["ink"]
    m = bpy.data.materials.new("ink"); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = INK; out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    try: m.use_backface_culling = True
    except Exception: pass
    try: m.use_backface_culling_shadow = True
    except Exception: pass
    _mats["ink"] = m; return m

def outline(obj, t=0.02):
    """inverted-hull ink outline as a separate child shell that casts no shadow (needs scale applied)"""
    sh = bpy.data.objects.new(obj.name + "_ink", obj.data.copy()); bpy.context.collection.objects.link(sh)
    sh.data.materials.clear(); sh.data.materials.append(ink_mat())
    md = sh.modifiers.new("ink", "SOLIDIFY"); md.thickness = t * 1.6; md.offset = 1.0; md.use_flip_normals = True; md.use_rim = False
    sh.parent = obj
    try: sh.visible_shadow = False
    except Exception: pass
    return obj

def prim(kind, sc=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), m=None, smooth=True, ol=0.0, parent=None, seg=32, name=None):
    if kind == "sphere": bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=1)
    elif kind == "cube": bpy.ops.mesh.primitive_cube_add(size=1)
    elif kind == "cyl": bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=1, depth=1)
    elif kind == "cone": bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=1, radius2=0, depth=1)
    elif kind == "plane": bpy.ops.mesh.primitive_plane_add(size=1)
    elif kind == "torus": bpy.ops.mesh.primitive_torus_add(major_segments=seg, minor_segments=12, major_radius=1, minor_radius=0.08)
    o = bpy.context.object; o.name = name or kind
    o.data.transform(Matrix.Diagonal((sc[0], sc[1], sc[2], 1.0)))
    if smooth and kind != "cube":
        try: o.data.shade_smooth()
        except Exception: pass
    o.location = loc; o.rotation_euler = rot
    if m is not None: o.data.materials.append(m)
    if ol and os.environ.get("NOINK") is None: outline(o, ol)
    if parent is not None: o.parent = parent
    return o

def empty(loc=(0, 0, 0), parent=None, name="e"):
    e = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(e); e.location = loc
    if parent is not None: e.parent = parent
    return e

def limb(parent, top, l1, l2, r, m, mj=None, name="limb"):
    """two-segment limb hanging down (-Z) from `top` with round joints; returns (joint1, joint2)"""
    j1 = empty(top, parent, name + "_j1"); prim("cyl", (r, r, l1), (0, 0, -l1 / 2), m=m, parent=j1, seg=28, ol=0.012); prim("sphere", (r * 1.4, r * 1.4, r * 1.4), (0, 0, 0), m=m, parent=j1, seg=24, ol=0.012)
    j2 = empty((0, 0, -l1), j1, name + "_j2"); prim("cyl", (r * 0.92, r * 0.92, l2), (0, 0, -l2 / 2), m=m, parent=j2, seg=28, ol=0.012); prim("sphere", (r * 1.28, r * 1.28, r * 1.28), (0, 0, 0), m=m, parent=j2, seg=24, ol=0.012)
    return j1, j2

# ------------------------------------------------------------------ characters
CREAM = (0.96, 0.93, 0.84, 1)
def head_mat(col=None):
    return soft("head" + str(col), col if col else CREAM, 0.8)

def _tx(name, col, tex, sc=5.0, rough=0.8):
    return mat(name, col, rough, tex=tex, scale=sc, tint=col, normal=0.35)

class Stick:
    """Big egg head, pill body, rounded limbs with joints, thick ink outline, textured clothes."""
    def __init__(self, name="c", top=(0.7, 0.1, 0.1, 1), pants=(0.13, 0.1, 0.18, 1), hat="cowboy", hatc=(0.85, 0.75, 0.55, 1), stache=True, tall=1.0, fabric="fabric_pattern_07", mood="calm", star=False, body_scale=1.0, skin_color=None):
        self.root = empty(name=name + "_root"); R = self.root; self.tall = tall; bs = body_scale
        self.hip = empty((0, 0, 1.18 * tall), R, name + "_hip")
        self.torso = empty((0, 0, 0), self.hip, name + "_torso")
        jm = _tx(name + "_top", top, fabric, 5.0); skin = head_mat(skin_color)
        lea = _tx("leather", (0.32, 0.18, 0.09, 1), "brown_leather", 4.0, 0.6)
        def surf(x, z): return -0.2 * bs * math.sqrt(max(0.05, 1 - (x / (0.27 * bs)) ** 2 - ((z - 0.42) / 0.4) ** 2))
        prim("sphere", (0.27 * bs, 0.2 * bs, 0.4), (0, 0, 0.42), m=jm, parent=self.torso, seg=96, ol=0.03)
        prim("torus", (0.218 * bs, 0.163 * bs, 0.55), (0, 0, 0.15), m=lea, parent=self.torso, seg=48, ol=0.01)                     # belt hugging the body
        prim("cyl", (0.055, 0.012, 0.045), (0, surf(0, 0.15) - 0.012, 0.15), rot=(math.pi / 2, 0, 0), m=mat("gold", (1.0, 0.78, 0.25, 1), 0.3, emission=(0.4, 0.28, 0.05, 1), em_strength=0.8), parent=self.torso, seg=24, ol=0.008)
        for z in (0.3, 0.46, 0.62): prim("sphere", (0.02, 0.02, 0.02), (0.0, surf(0, z) - 0.006, z), m=mat("button", (1.0, 0.8, 0.3, 1), 0.3, emission=(0.35, 0.25, 0.05, 1), em_strength=0.7), parent=self.torso, seg=12, ol=0.004)
        if star: prim("cone", (0.065, 0.065, 0.012), (0.11 * bs, surf(0.11 * bs, 0.62) - 0.008, 0.62), rot=(math.pi / 2, 0, 0), m=mat("star", (1.0, 0.82, 0.25, 1), 0.3, emission=(0.45, 0.32, 0.05, 1), em_strength=0.9), parent=self.torso, seg=5, ol=0.006)
        prim("cube", (0.09, 0.06, 0.24), (0.19 * bs, surf(0.19 * bs, 0.05) - 0.01, 0.04), m=lea, parent=self.torso, ol=0.012)                  # holster on the belt
        prim("cube", (0.04, 0.03, 0.1), (0.19 * bs, surf(0.19 * bs, 0.05) - 0.03, 0.2), m=mat("grip", (0.95, 0.95, 0.9, 1), 0.4), parent=self.torso, ol=0.008)
        self.neck = empty((0, 0, 0.8), self.torso, name + "_neck"); prim("cyl", (0.085, 0.085, 0.3), (0, 0, 0.1), m=skin, parent=self.neck, seg=28, ol=0.01)
        prim("torus", (0.1, 0.1, 0.5), (0, 0, 0.02), m=mat("kerchief", (0.75, 0.15, 0.12, 1), 0.8), parent=self.neck, seg=32, ol=0.008)       # neckerchief
        self.head = empty((0, 0, 0.2), self.neck, name + "_head")
        prim("sphere", (0.34, 0.31, 0.37), (0, 0, 0.3), m=skin, parent=self.head, seg=int(os.environ.get("HEADSEG", "128")), ol=0.028, smooth=os.environ.get("FLAT") is None)
        self.eyes = []
        for sx in (-1, 1):
            e = empty((0.115 * sx, -0.27, 0.36), self.head, name + "_eye"); self.eyes.append(e)
            prim("sphere", (0.095, 0.03, 0.105), (0, 0, 0), m=mat("eyew", (1, 1, 1, 1), 0.4), parent=e, seg=24, ol=0.012)
            prim("sphere", (0.045, 0.02, 0.05), (0, -0.02, 0), m=mat("pupil", (0.02, 0.02, 0.03, 1), 0.3), parent=e, seg=16)
            prim("sphere", (0.014, 0.008, 0.014), (0.016 * sx * -1, -0.034, 0.02), m=mat("glint", (1, 1, 1, 1), 0.2, emission=(1, 1, 1, 1), em_strength=2.0), parent=e, seg=10)
            prim("sphere", (0.05, 0.012, 0.03), (0.17 * sx, -0.255, 0.21), m=mat("blush", (1.0, 0.62, 0.62, 1), 0.9), parent=self.head, seg=16)
        prim("sphere", (0.035, 0.03, 0.035), (0, -0.305, 0.27), m=head_mat(tuple(c * 0.93 for c in (skin_color if skin_color else CREAM)[:3]) + (1,)), parent=self.head, seg=20, ol=0.006)    # nose
        self.brows = []
        for sx in (-1, 1):
            b = empty((0.115 * sx, -0.29, 0.5), self.head, name + "_brow"); self.brows.append(b)
            prim("cyl", (0.014, 0.014, 0.075), (0, 0, 0), rot=(0, math.pi / 2, 0), m=mat("brow", (0.05, 0.04, 0.05, 1), 0.5), parent=b, seg=10)
        if stache:
            for sx in (-1, 1): prim("sphere", (0.09, 0.025, 0.04), (0.075 * sx, -0.3, 0.2), rot=(0, 0.4 * sx, 0.0), m=mat("stache", (0.06, 0.04, 0.04, 1), 0.6), parent=self.head, seg=16, ol=0.006)
        self.mouth = prim("sphere", (0.05, 0.02, 0.012), (0, -0.295, 0.12), m=mat("mouth", (0.18, 0.02, 0.04, 1), 0.5), parent=self.head, seg=16)
        self.hatobj = None
        if hat:
            hm = _tx(name + "_hat", hatc, "brown_leather", 3.0, 0.7)
            if hat == "cowboy":
                prim("cyl", (0.5, 0.5, 0.018), (0, -0.02, 0.58), m=hm, parent=self.head, seg=48, ol=0.015); prim("cyl", (0.28, 0.27, 0.13), (0, 0, 0.66), m=hm, parent=self.head, seg=40, ol=0.015)
                prim("cyl", (0.285, 0.275, 0.025), (0, 0, 0.58), m=mat("band", (0.2, 0.1, 0.05, 1), 0.6), parent=self.head, seg=40)
            elif hat == "top":
                prim("cyl", (0.4, 0.4, 0.015), (0, 0, 0.6), m=hm, parent=self.head, seg=48, ol=0.012); prim("cyl", (0.27, 0.27, 0.2), (0, 0, 0.74), m=hm, parent=self.head, seg=40, ol=0.012)
                prim("cyl", (0.275, 0.275, 0.03), (0, 0, 0.62), m=mat("band", (0.7, 0.1, 0.1, 1), 0.6), parent=self.head, seg=40)
        self.arm = []; self.leg = []
        sm_ = _tx(name + "_sleeve", top, fabric, 5.0); lm = _tx(name + "_leg", pants, "denmin_fabric_02", 5.0)
        for sx in (-1, 1):
            j1, j2 = limb(self.torso, (0.2 * sx * bs, 0, 0.66), 0.34, 0.34, 0.047, sm_, name=name + "_arm"); self.arm.append((j1, j2))
            prim("sphere", (0.085, 0.075, 0.085), (0, 0, -0.37), m=skin, parent=j2, seg=28, ol=0.014)
            h1, h2 = limb(self.hip, (0.1 * sx, 0, 0.02), 0.55 * tall, 0.55 * tall, 0.058, lm, name=name + "_leg"); self.leg.append((h1, h2))
            prim("sphere", (0.105, 0.17, 0.085), (0, -0.06, -0.56 * tall), m=_tx("boot", (0.16, 0.09, 0.05, 1), "brown_leather", 4.0, 0.6), parent=h2, seg=28, ol=0.014)
        self.expr("calm")
    def expr(self, mood, talk=0.0):
        b = {"calm": (0.0, 0.0), "angry": (-0.45, -0.02), "shock": (0.25, 0.04), "smug": (-0.15, 0.0)}.get(mood, (0, 0))
        for sx, br in zip((-1, 1), self.brows): br.rotation_euler = (0, b[0] * sx * -1 * 0.0 + b[0] * sx * 0.0, b[0] * sx); br.location.z = 0.5 + b[1]
        self.mouth.scale = (1 + talk * 0.2, 1, 1 + talk * 6)
    def place(self, x, y, z=0.0, yaw=0.0):
        self.root.location = (x, y, z); self.root.rotation_euler = (0, 0, yaw)
    def pose(self, walk=0.0, speed=0.0, arms=(0.0, 0.0), elbow=(0.2, 0.2), wave=0.0, lean=0.0, headtilt=0.0, look=(0.0, 0.0)):
        """walk = phase radians; speed 0..1 scales the stride"""
        s = math.sin(walk) * 0.6 * speed; c = math.cos(walk)
        for i, sg in enumerate((1, -1)):
            h1, h2 = self.leg[i]; h1.rotation_euler = (s * sg, 0, 0); h2.rotation_euler = (max(0, -math.sin(walk + (0 if i == 0 else math.pi))) * 0.9 * speed, 0, 0)
            a1, a2 = self.arm[i]; a1.rotation_euler = (-s * sg * 0.7 + arms[i], 0, (0.12 if i == 0 else -0.12)); a2.rotation_euler = (-elbow[i] - 0.1, 0, 0)
        if wave:
            a1, a2 = self.arm[1]; a1.rotation_euler = (-2.6, 0, -0.2 + math.sin(wave * 9) * 0.0); a2.rotation_euler = (0, math.sin(wave * 9) * 0.6, 0.6 * math.sin(wave * 9) + 0.2)
        self.hip.location.z = 1.18 * self.tall + abs(math.cos(walk)) * 0.04 * speed
        self.torso.rotation_euler = (lean, 0, math.sin(walk) * 0.05 * speed)
        self.neck.rotation_euler = (look[1] * 0.4, 0, look[0] * 0.5 + headtilt)
        for e in self.eyes: e.location.x += 0;

# ------------------------------------------------------------------ world / light helpers
def sky(hdri="kloofendal_48d_partly_cloudy_puresky_2k.hdr", strength=1.0, rot=0.0, color=None):
    w = bpy.data.worlds.new("w"); bpy.context.scene.world = w; w.use_nodes = True; nt = w.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld"); bg = nt.nodes.new("ShaderNodeBackground"); bg.inputs["Strength"].default_value = strength
    if color is None:
        et = nt.nodes.new("ShaderNodeTexEnvironment"); et.image = bpy.data.images.load(os.path.join(AS, "hdri", hdri)); mp = nt.nodes.new("ShaderNodeMapping"); tc = nt.nodes.new("ShaderNodeTexCoord")
        mp.inputs["Rotation"].default_value = (0, 0, rot); nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], et.inputs["Vector"]); nt.links.new(et.outputs["Color"], bg.inputs["Color"])
    else: bg.inputs["Color"].default_value = color
    for k, v in (("sun_threshold", 1000.0), ("use_sun_shadow", False)):
        try: setattr(w, k, v)
        except Exception: pass
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"]); return w

def light(kind, loc, energy, color=(1, 1, 1), rot=(0, 0, 0), size=1.0):
    d = bpy.data.lights.new(kind, kind); d.energy = energy; d.color = color[:3]
    if os.environ.get("NOSHADOW"): d.use_shadow = False
    if kind == "AREA": d.size = size
    if kind in ("POINT", "SPOT"): d.shadow_soft_size = size
    o = bpy.data.objects.new(kind, d); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot; return o

def camera(loc=(0, -6, 1.5), target=(0, 0, 1.2), fov=50, fstop=2.8, focus=None):
    cd = bpy.data.cameras.new("cam"); cd.lens_unit = "FOV"; cd.angle = math.radians(fov); cd.dof.use_dof = os.environ.get("NODOF") is None; cd.dof.aperture_fstop = fstop
    o = bpy.data.objects.new("cam", cd); bpy.context.collection.objects.link(o); bpy.context.scene.camera = o
    look(o, loc, target); cd.dof.focus_distance = focus or (Vector(loc) - Vector(target)).length; return o

def look(o, loc, target, roll=0.0):
    o.location = loc; d = Vector(target) - Vector(loc); q = d.to_track_quat("-Z", "Y"); o.rotation_euler = q.to_euler()
    if roll: o.rotation_euler.rotate_axis("Z", roll)
