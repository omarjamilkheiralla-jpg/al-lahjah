"""Extra characters + poses for 'The Bear in the Saloon': gorilla-suit man, bear, brain-head, researcher, seated/active poses, props."""
import bpy, math, bmesh, random
from mathutils import Vector, Matrix
import bl_common as B
from bl_common import prim, empty, limb, mat, soft, Stick, CREAM
SCALE = 0.66

def _head_sphere(st):
    return max([o for o in bpy.data.objects if o.parent is st.head and o.type == "MESH" and o.name.startswith("sphere")], key=lambda o: len(o.data.vertices))

def make_stick(name, top, pants=(0.13, 0.1, 0.18, 1), hat="cowboy", hatc=(0.85, 0.72, 0.5, 1), stache=True, star=False, tall=1.0, body_scale=1.0, head_col=None, glasses=False):
    st = Stick(name, top=top, pants=pants, hat=hat, hatc=hatc, stache=stache, star=star, tall=tall, body_scale=body_scale)
    st.pupils = [o for o in bpy.data.objects if o.parent in st.eyes and o.name.startswith("sphere") and o.data.materials and o.data.materials[0].name.startswith("pupil")]
    if head_col is not None:
        h = _head_sphere(st); h.data.materials.clear(); h.data.materials.append(soft(name + "_headc", head_col, 0.8))
    if glasses:
        gm = mat("glasses", (0.05, 0.05, 0.06, 1), 0.4)
        for sx in (-1, 1): prim("torus", (0.12, 0.02, 0.12), (0.115 * sx, -0.3, 0.36), rot=(math.pi / 2, 0, 0), m=gm, parent=st.head, seg=32)
        prim("cyl", (0.012, 0.012, 0.08), (0, -0.3, 0.38), rot=(0, math.pi / 2, 0), m=gm, parent=st.head, seg=8)
    st.look = (0.0, 0.0)
    st.root.scale = (SCALE, SCALE, SCALE)
    return st

def gorilla_suit(name="gorilla", tall=1.0):
    fur = (0.16, 0.13, 0.12, 1)
    g = make_stick(name, top=fur, pants=fur, hat=None, stache=False, tall=tall, body_scale=1.25, head_col=(0.2, 0.17, 0.16, 1))
    fm = soft(name + "_face", (0.55, 0.42, 0.34, 1), 0.8)
    prim("sphere", (0.2, 0.08, 0.17), (0, -0.27, 0.17), m=fm, parent=g.head, seg=32, ol=0.012)            # muzzle
    prim("sphere", (0.035, 0.02, 0.02), (0, -0.345, 0.24), m=soft("nostril", (0.05, 0.04, 0.04, 1), 0.8), parent=g.head, seg=12)
    prim("sphere", (0.28, 0.12, 0.07), (0, -0.25, 0.47), rot=(0.25, 0, 0), m=soft(name + "_brow", (0.1, 0.08, 0.08, 1), 0.8), parent=g.head, seg=24, ol=0.012)   # brow ridge
    return g

def brain_head(st):
    """turn a stick figure's head into a pink brain with sunglasses"""
    h = _head_sphere(st); me = h.data; bm = bmesh.new(); bm.from_mesh(me)
    for v in bm.verts:
        n = v.co.normalized(); d = 0.035 * (math.sin(v.co.x * 38) * math.sin(v.co.z * 31) + 0.6 * math.sin(v.co.y * 27 + v.co.z * 19))
        v.co += n * d * 0.45
    bm.to_mesh(me); bm.free(); me.update(); me.shade_smooth()
    for ch in [c for c in h.children if c.name.endswith("_ink")]: bpy.data.objects.remove(ch, do_unlink=True)
    B.outline(h, 0.03)
    me.materials.clear(); me.materials.append(soft("brainpink", (0.93, 0.5, 0.58, 1), 0.7))
    gm = mat("shades", (0.02, 0.02, 0.03, 1), 0.3)
    for sx in (-1, 1): prim("sphere", (0.12, 0.03, 0.08), (0.115 * sx, -0.31, 0.36), m=gm, parent=st.head, seg=24, ol=0.008)
    prim("cyl", (0.012, 0.012, 0.1), (0, -0.31, 0.38), rot=(0, math.pi / 2, 0), m=gm, parent=st.head, seg=8)
    return st

# ------------------------------------------------------------------ poses
def lerp(a, b, t): return a + (b - a) * t
def sm(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)

def pose(st, walk=0.0, speed=0.0, sit=0.0, armL=(0.0, 0.0, 0.0, 0.2), armR=(0.0, 0.0, 0.0, 0.2), lean=0.0, twist=0.0, head=(0.0, 0.0, 0.0), eyes=(0.0, 0.0), talk=0.0, mood="calm", blink=0.0, bob=0.0, wiggle=0.0):
    """arms = (shoulder pitch x, roll y, yaw z, elbow bend). pitch negative = forward/up. head = (yaw, pitch, roll); eyes = look dir."""
    s = math.sin(walk) * 0.6 * speed
    for i, sg in enumerate((1, -1)):
        h1, h2 = st.leg[i]
        if sit > 0:
            h1.rotation_euler = (lerp(s * sg, -1.45, sit), 0, 0.06 * (1 if i else -1) * sit); h2.rotation_euler = (lerp(max(0, -math.sin(walk + (0 if i == 0 else math.pi))) * 0.9 * speed, 1.5, sit), 0, 0)
        else:
            h1.rotation_euler = (s * sg, 0, 0); h2.rotation_euler = (max(0, -math.sin(walk + (0 if i == 0 else math.pi))) * 0.9 * speed, 0, 0)
    for i, a in enumerate((armL, armR)):
        j1, j2 = st.arm[i]
        sw = -s * (1 if i == 0 else -1) * 0.7
        j1.rotation_euler = (a[0] + sw, a[1] + (0.12 if i == 0 else -0.12), a[2]); j2.rotation_euler = (-a[3] - 0.08, 0, 0)
    base = 1.18 * st.tall
    st.hip.location.z = lerp(base + abs(math.cos(walk)) * 0.04 * speed + bob, 0.74 * st.tall + 0.02, sit) + (wiggle if sit == 0 else 0)
    st.torso.rotation_euler = (lean, 0, twist + math.sin(walk) * 0.05 * speed)
    st.neck.rotation_euler = (head[1], head[2], head[0])
    for p in st.pupils: p.location = (eyes[0] * 0.03, -0.02, eyes[1] * 0.03)
    mo = {"calm": (0.0, 0.0), "angry": (-0.45, -0.02), "shock": (0.25, 0.06), "smug": (-0.2, 0.0), "worry": (0.35, 0.03)}.get(mood, (0, 0))
    for sx, br in zip((-1, 1), st.brows): br.rotation_euler = (0, 0, mo[0] * sx); br.location.z = 0.5 + mo[1]
    st.mouth.scale = (1 + talk * 0.2, 1, 1 + talk * 3.5)
    for e in st.eyes: e.scale = (1, 1, max(0.08, 1 - blink))

def place(st, x, y, z=0.0, yaw=0.0):
    st.root.location = (x, y, z); st.root.rotation_euler = (0, 0, yaw)

# ------------------------------------------------------------------ the bear
class Bear:
    def __init__(self, name="bear"):
        self.root = empty(name=name + "_root"); R = self.root
        fur = soft(name + "_fur", (0.36, 0.2, 0.1, 1), 0.85); belly = soft(name + "_belly", (0.62, 0.42, 0.24, 1), 0.85); dark = soft(name + "_dark", (0.05, 0.03, 0.03, 1), 0.7)
        self.hip = empty((0, 0, 1.15), R, name + "_hip"); self.torso = empty((0, 0, 0), self.hip, name + "_torso")
        prim("sphere", (0.62, 0.5, 0.78), (0, 0, 0.55), m=fur, parent=self.torso, seg=96, ol=0.04)
        prim("sphere", (0.4, 0.2, 0.55), (0, -0.36, 0.5), m=belly, parent=self.torso, seg=64)
        self.neck = empty((0, 0, 1.2), self.torso, name + "_neck"); self.head = empty((0, 0, 0.15), self.neck, name + "_head")
        prim("sphere", (0.46, 0.42, 0.42), (0, 0, 0.2), m=fur, parent=self.head, seg=96, ol=0.035)
        prim("sphere", (0.22, 0.2, 0.17), (0, -0.4, 0.1), m=belly, parent=self.head, seg=48, ol=0.02)           # snout
        prim("sphere", (0.07, 0.05, 0.05), (0, -0.58, 0.18), m=dark, parent=self.head, seg=24)                 # nose
        for sx in (-1, 1):
            prim("sphere", (0.14, 0.1, 0.14), (0.34 * sx, 0.0, 0.5), m=fur, parent=self.head, seg=32, ol=0.02); prim("sphere", (0.08, 0.05, 0.08), (0.34 * sx, -0.07, 0.5), m=belly, parent=self.head, seg=24)
        self.eyes = []
        for sx in (-1, 1):
            e = empty((0.17 * sx, -0.37, 0.3), self.head, name + "_eye"); self.eyes.append(e)
            prim("sphere", (0.09, 0.03, 0.095), (0, 0, 0), m=mat("eyew", (1, 1, 1, 1)), parent=e, seg=24, ol=0.01); prim("sphere", (0.045, 0.02, 0.05), (0, -0.02, 0), m=mat("pupil", (0.02, 0.02, 0.03, 1)), parent=e, seg=16)
        self.brows = []
        for sx in (-1, 1):
            b = empty((0.17 * sx, -0.4, 0.43), self.head, name + "_brow"); self.brows.append(b); prim("cyl", (0.022, 0.022, 0.13), (0, 0, 0), rot=(0, math.pi / 2, 0), m=dark, parent=b, seg=10)
        self.mouth = prim("sphere", (0.09, 0.02, 0.015), (0, -0.54, 0.03), m=dark, parent=self.head, seg=16)
        self.arm = []; self.leg = []
        for sx in (-1, 1):
            j1, j2 = limb(self.torso, (0.6 * sx, 0, 1.0), 0.55, 0.5, 0.13, fur, name=name + "_arm"); self.arm.append((j1, j2))
            prim("sphere", (0.17, 0.15, 0.17), (0, 0, -0.52), m=fur, parent=j2, seg=32, ol=0.025)
            for c in (-1, 0, 1): prim("cone", (0.025, 0.025, 0.07), (0.06 * c, -0.1, -0.6), rot=(math.pi, 0, 0), m=mat("claw", (0.9, 0.88, 0.8, 1)), parent=j2, seg=8)
            h1, h2 = limb(self.hip, (0.28 * sx, 0, -0.05), 0.55, 0.5, 0.17, fur, name=name + "_leg"); self.leg.append((h1, h2))
            prim("sphere", (0.2, 0.32, 0.12), (0, -0.1, -0.5), m=fur, parent=h2, seg=32, ol=0.025)
        self.mug = None
        self.root.scale = (0.72, 0.72, 0.72)
    def hold_mug(self):
        m = mat("mug", (0.7, 0.5, 0.2, 1), 0.5); foam = mat("foam", (1, 0.97, 0.9, 1), 0.9)
        j2 = self.arm[1][1]; g = empty((0, -0.12, -0.55), j2, "mug"); self.mug = g
        prim("cyl", (0.12, 0.12, 0.25), (0, 0, 0.1), m=m, parent=g, seg=24, ol=0.012); prim("cyl", (0.125, 0.125, 0.06), (0, 0, 0.25), m=foam, parent=g, seg=24)
        prim("torus", (0.1, 0.1, 0.1), (0.14, 0, 0.1), rot=(0, math.pi / 2, 0), m=m, parent=g, seg=16)
        g.hide_render = True; return g
    def pose(self, walk=0.0, speed=0.0, wave=0.0, lean=0.0, head=(0.0, 0.0, 0.0), mood="calm", talk=0.0, mug=0.0, bob=0.0):
        s = math.sin(walk) * 0.55 * speed
        for i, sg in enumerate((1, -1)):
            h1, h2 = self.leg[i]; h1.rotation_euler = (s * sg, 0, 0); h2.rotation_euler = (max(0, -math.sin(walk + (0 if i == 0 else math.pi))) * 0.7 * speed, 0, 0)
            a1, a2 = self.arm[i]; a1.rotation_euler = (-s * sg * 0.8, 0.18 * (1 if i == 0 else -1), 0); a2.rotation_euler = (-0.2, 0, 0)
        if wave > 0:
            a1, a2 = self.arm[1]; a1.rotation_euler = (0, -2.5 * wave - 0.3 * (1 - wave), 0); a2.rotation_euler = (-0.1, 0, math.sin(walk * 0.0 + bob * 9) * 0.5 * wave)
        if mug > 0:
            a1, a2 = self.arm[1]; a1.rotation_euler = (-1.1 * mug, -0.4 * mug, 0); a2.rotation_euler = (-1.9 * mug, 0, 0); self.mug.hide_render = False
        self.hip.location.z = 1.15 + abs(math.cos(walk)) * 0.06 * speed + (bob * 0.0)
        self.torso.rotation_euler = (lean, 0, math.sin(walk) * 0.06 * speed)
        self.neck.rotation_euler = (head[1], head[2], head[0])
        mo = {"calm": 0.0, "happy": -0.2, "shock": 0.3}.get(mood, 0.0)
        for sx, br in zip((-1, 1), self.brows): br.rotation_euler = (0, 0, mo * sx)
        self.mouth.scale = (1 + talk * 0.2, 1, 1 + talk * 8)

def bear_place(b, x, y, z=0.0, yaw=0.0): b.root.location = (x, y, z); b.root.rotation_euler = (0, 0, yaw)

# ------------------------------------------------------------------ props
def cards(n=1, loc=(0, 0, 0), parent=None):
    out = []
    for i in range(n):
        c = prim("cube", (0.07, 0.1, 0.004), loc, m=mat("card", (0.97, 0.95, 0.9, 1)), parent=parent, ol=0.004); out.append(c)
        prim("cube", (0.03, 0.04, 0.005), (0, 0, 0.0005), m=mat("pip" + str(i % 2), (0.8, 0.1, 0.1, 1) if i % 2 else (0.05, 0.05, 0.05, 1)), parent=c)
    return out

def keys(loc, parent=None):
    g = empty(loc, parent, "keys"); gold = mat("keygold", (1.0, 0.8, 0.25, 1), 0.3, emission=(0.5, 0.35, 0.05, 1), em_strength=0.8)
    prim("torus", (0.07, 0.07, 0.07), (0, 0, 0.01), m=gold, parent=g, seg=32, ol=0.006)
    for a_ in (-0.9, 0.35, 1.6):
        k = empty((0, 0, 0.01), g, "k"); k.rotation_euler = (0, 0, a_)
        prim("cyl", (0.012, 0.012, 0.17), (0.0, -0.15, 0.0), rot=(math.pi / 2, 0, 0), m=gold, parent=k, seg=12, ol=0.005); prim("cube", (0.05, 0.05, 0.012), (0.03, -0.24, 0.0), m=gold, parent=k, ol=0.005)
    return g

def mug(loc, parent=None, foam=True):
    g = empty(loc, parent, "mug"); m = mat("mugc", (0.75, 0.55, 0.25, 1), 0.5)
    prim("cyl", (0.06, 0.06, 0.14), (0, 0, 0.07), m=m, parent=g, seg=24, ol=0.008)
    if foam: prim("cyl", (0.063, 0.063, 0.03), (0, 0, 0.145), m=mat("foam2", (1, 0.97, 0.9, 1)), parent=g, seg=24)
    prim("torus", (0.05, 0.05, 0.05), (0.07, 0, 0.07), rot=(0, math.pi / 2, 0), m=m, parent=g, seg=12)
    return g
