"""Director: all actors + shot-by-shot camera/animation for 'The Bear in the Saloon'. update(t) poses everything for time t (seconds)."""
import bpy, math, json, os
from mathutils import Vector
import bl_common as B, sets as S
from chars2 import *

TIM = json.load(open(r"C:\Users\jamil\al-lahjah\video\projects\bear-saloon\timing.json"))
SEN = TIM["sentences"]
def st(i): return SEN[i]["start"]
def en(i): return SEN[i]["end"]
def word_t(i, key):
    for w in SEN[i]["words"]:
        if w["w"].lower().strip(".,?!").startswith(key): yield w["t0"]
SHUF = list(word_t(2, "shuffle")) + [13.0, 13.2, 13.4]
OX, LX, CX, EX = S.OX, S.LX, S.CX, 400.0

def sm(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def lerp(a, b, t): return a + (b - a) * t
def mixv(a, b, t): return tuple(lerp(x, y, t) for x, y in zip(a, b))
def ramp(t, a, b): return sm((t - a) / max(1e-6, b - a))

class Director:
    def __init__(self, doors):
        self.doors = doors
        bpy.context.view_layer.update()
        self.areas = {"street": [], "saloon": [], "lab": [], "cabin": [], "eye": []}
        def area_of(x): return "street" if x < 60 else "saloon" if x < 150 else "lab" if x < 250 else "cabin"
        for o in [o for o in bpy.data.objects if o.parent is None and o.type != "CAMERA"]:
            a = area_of(o.matrix_world.translation.x)
            self.areas[a] += [o] + list(o.children_recursive)
        for o in self.areas["saloon"] + self.areas["lab"] + self.areas["cabin"]:
            if o.type == "LIGHT" and o.data.type != "AREA": o.data.use_shadow = False
            if o.type == "LIGHT" and o.data.type == "AREA" and o.data.size < 4.0: o.data.use_shadow = False
        # ---------------- street
        self.gor1 = gorilla_suit("gor1"); self.crowd = []
        cols = [(0.7, 0.15, 0.12, 1), (0.2, 0.4, 0.6, 1), (0.85, 0.65, 0.2, 1), (0.3, 0.5, 0.3, 1), (0.55, 0.3, 0.5, 1), (0.8, 0.4, 0.2, 1)]
        for i in range(6):
            c = make_stick(f"cow{i}", top=cols[i], hat="cowboy", hatc=[(0.85, 0.7, 0.5, 1), (0.3, 0.2, 0.15, 1), (0.9, 0.85, 0.7, 1)][i % 3], stache=i % 2 == 0, tall=0.95 + 0.05 * (i % 3)); self.crowd.append(c)
        # ---------------- saloon
        self.sheriff = make_stick("sheriff", top=(0.45, 0.28, 0.12, 1), hat="cowboy", hatc=(0.88, 0.76, 0.52, 1), star=True)
        self.dealer = make_stick("dealer", top=(0.15, 0.1, 0.12, 1), pants=(0.1, 0.08, 0.1, 1), hat="top", hatc=(0.08, 0.08, 0.1, 1))
        self.g1 = make_stick("g1", top=(0.5, 0.15, 0.1, 1), hat="cowboy", hatc=(0.4, 0.28, 0.18, 1)); self.g2 = make_stick("g2", top=(0.2, 0.4, 0.3, 1), hat="cowboy", hatc=(0.75, 0.6, 0.4, 1), stache=False)
        self.bart = make_stick("bart", top=(0.9, 0.88, 0.82, 1), hat=None, stache=True); self.pat = [make_stick(f"pat{i}", top=cols[i], hat="cowboy", hatc=(0.5, 0.35, 0.2, 1), stache=i % 2 == 1) for i in range(4)]
        self.bear = Bear(); self.bear.hold_mug()
        self.brain_s = brain_head(make_stick("brainS", top=(0.2, 0.35, 0.65, 1), hat=None, stache=False))
        # kinetoscope on the sheriff's table
        wd = S.wood_dark(); self.kin = empty((OX + 3.78, -1.8, 0.85), None, "kin")
        S.bx((0, 0, 0.3), (0.55, 0.45, 0.6), wd, parent=self.kin, ol=0.02); S.bx((0, -0.1, 0.62), (0.5, 0.3, 0.06), S.wood_warm(), parent=self.kin, ol=0.015)
        prim("torus", (0.13, 0.13, 0.13), (0, -0.25, 0.4), rot=(math.pi / 2, 0, 0), m=mat("brasskin", (0.9, 0.7, 0.3, 1), 0.3, metallic=1.0), parent=self.kin, seg=32, ol=0.01)
        prim("cyl", (0.11, 0.11, 0.05), (0, -0.23, 0.4), rot=(math.pi / 2, 0, 0), m=mat("lens", (0.05, 0.05, 0.08, 1), 0.3), parent=self.kin, seg=32)
        self.crank = empty((0.3, 0.0, 0.35), self.kin, "crank"); S.bx((0.05, 0, 0), (0.1, 0.03, 0.03), wd, parent=self.crank); prim("sphere", (0.04, 0.04, 0.04), (0.12, 0, 0), m=wd, parent=self.crank, seg=12)
        # cards (flying deck) + paper hat etc.
        self.cards = [prim("cube", (0.07, 0.1, 0.004), (0, 0, -50), m=mat("card", (0.97, 0.95, 0.9, 1)), ol=0.004, name="card") for _ in range(16)]
        # ---------------- lab
        self.res = make_stick("res", top=(0.96, 0.96, 0.94, 1), hat=None, stache=False, glasses=True)
        self.clip = S.bx((0, 0, 0), (0.28, 0.02, 0.38), mat("clipb", (0.55, 0.38, 0.2, 1), 0.8), ol=0.008, parent=self.res.arm[1][1])
        vc = [(0.85, 0.3, 0.3, 1), (0.3, 0.55, 0.85, 1), (0.95, 0.8, 0.25, 1), (0.4, 0.7, 0.4, 1), (0.7, 0.4, 0.8, 1), (0.9, 0.55, 0.3, 1)]
        self.vols = [make_stick(f"vol{i}", top=vc[i], hat=None, stache=i % 3 == 0, tall=0.95) for i in range(6)]
        self.gor2 = gorilla_suit("gor2")
        # ---------------- eye / cabin
        self.you = make_stick("you", top=(0.3, 0.6, 0.35, 1), hat="cowboy", hatc=(0.8, 0.65, 0.4, 1), stache=False)
        self.srch = make_stick("srch", top=(0.7, 0.35, 0.15, 1), hat=None, stache=True)
        self.brain_c = brain_head(make_stick("brainC", top=(0.2, 0.35, 0.65, 1), hat=None, stache=False))
        self.keys = S.__dict__.get("keys") or None
        self.keyobj = keys((CX + 0.1, -0.05, 0.835)); self.keyobj.scale = (1.5, 1.5, 1.5)
        self.news = S.bx((CX, 1.0, 1.2), (0.55, 0.02, 0.4), mat("news", (0.93, 0.9, 0.8, 1), 0.9), ol=0.008)
        text_m = mat("newst", (0.1, 0.1, 0.1, 1), 0.9); S.text("NEWS", (CX, 0.98, 1.28), 0.12, text_m, rot=(math.pi / 2, 0, 0))
        self.cushions = [S.bx((CX - 4.6 + i * 1.0, 3.0, 0.8), (0.9, 0.7, 0.22), mat("cush", (0.8, 0.3, 0.2, 1), 0.9), ol=0.015) for i in range(3)]
        self.clip2 = S.bx((0, 0, 0), (0.3, 0.02, 0.4), mat("clipb2", (0.55, 0.38, 0.2, 1), 0.8), ol=0.008, parent=self.brain_s.arm[1][1])
        S.text("JOB", (0, -0.015, 0.02), 0.12, mat("jobt", (0.1, 0.1, 0.1, 1), 0.9), rot=(math.pi / 2, 0, 0)).parent = self.clip2
        # ---------------- camera
        self.camo = B.camera((0, -5, 1.6), (0, 0, 1.5), fov=50, fstop=4.0); self.camo.data.clip_start = 0.05
        for a in (self.crowd + self.vols + [self.gor1, self.gor2, self.sheriff, self.dealer, self.g1, self.g2, self.bart, self.res, self.you, self.srch, self.brain_s, self.brain_c] + self.pat): self.park(a)
        self.bear.root.location = (OX, -30, 0)
        def grp(*acts):
            out = []
            for a in acts:
                r = a.root if hasattr(a, "root") else a; out += [r] + list(r.children_recursive)
            return out
        self.areas["street"] += grp(self.gor1, *self.crowd)
        self.areas["saloon"] += grp(self.sheriff, self.dealer, self.g1, self.g2, self.bart, self.bear, self.brain_s, self.kin, *self.pat) + list(self.cards) + [self.clip2] + list(self.clip2.children_recursive)
        self.areas["lab"] += grp(self.res, self.gor2, *self.vols) + [self.clip]
        self.areas["cabin"] += grp(self.srch, self.brain_c, self.keyobj) + [self.news] + list(self.cushions)
        self.areas["eye"] += grp(self.you)
        self.cur = None

    def park(self, a): a.root.location = (0, -300, 0)

    # ------------------------------------------------------------ camera
    def cam(self, pos, tgt, fov=50, focus=None, shake=0.0, t=0.0, roll=0.0):
        p = Vector(pos); tg = Vector(tgt)
        if shake: p += Vector((math.sin(t * 2.3) * shake, math.sin(t * 1.7 + 1) * shake, math.sin(t * 2.9 + 2) * shake * 0.6)); tg += Vector((math.sin(t * 1.9) * shake * 0.8, 0, math.sin(t * 2.1 + 0.5) * shake * 0.5))
        B.look(self.camo, p, tg, roll); self.camo.data.angle = math.radians(fov)
        self.camo.data.dof.focus_distance = max(0.1, focus if focus else (p - tg).length)

    # ------------------------------------------------------------ main
    def show(self, area):
        if area == self.cur: return
        for a, objs in self.areas.items():
            for o in objs: o.hide_render = (a != area)
        self.cur = area
    def update(self, t):
        self.show("street" if t < 4.74 else "eye" if 28.42 <= t < 30.3 else "lab" if 30.3 <= t < 36.59 else "cabin" if 36.59 <= t < 45.5 else "saloon")
        for k in (0, 1): self.doors[k].rotation_euler = (0, 0, 0)
        self.cards_hide()
        self.bearpos(t)
        if t < 4.74: self.hook(t)
        elif t < 10.62: self.intro(t)
        elif t < 13.74: self.shuffle(t)
        elif t < 19.64: self.beartime(t)
        elif t < 22.14: self.ask(t)
        elif t < 24.27: self.nope(t)
        elif t < 28.42: self.replay(t)
        elif t < 36.59: self.study(t)
        elif t < 42.26: self.keysrch(t)
        elif t < 45.5: self.brainz(t)
        elif t < 50.25: self.job(t)
        else: self.drink(t)

    def cards_hide(self):
        for c in self.cards: c.location = (0, 0, -50)

    # ------------------------------------------------------------ bear (one timeline reused for replay)
    def bear_state(self, tau):
        """tau seconds since the bear arrives: returns pos(x,y), yaw, walk phase, speed, wave amount"""
        if tau < 1.8: u = tau / 1.8; return (OX + 0.2 * u, -7.4 + 4.4 * sm(u) * 1.0, math.pi, tau * 6.0, 0.8 if u < 0.98 else 0.0, 0.0)
        if tau < 3.9: return (OX + 0.2, -3.0, math.pi, 0, 0.0, sm((tau - 1.8) / 0.4))
        u = (tau - 3.9) / 1.7; return (OX + 0.2 - 0.2 * u, -3.0 - 5.0 * sm(u), 0.0 if u < 1 else 0.0, tau * 6.0, 0.8, 0.0)
    def bearpos(self, t):
        b = self.bear
        if 13.74 <= t < 19.64: tau = t - 13.9
        elif 25.9 <= t < 28.42: tau = 2.2 + (t - 25.9)
        else: return
        x, y, yaw, wk, sp, wave = self.bear_state(max(0.0, tau))
        if tau < 0: bear_place(b, OX, -30, 0, 0); return
        bear_place(b, x, y, 0, yaw); b.pose(walk=wk, speed=sp, wave=wave, bob=t, head=(0, 0, 0.0), mood="happy", talk=0.0)
        if tau < 3.2 and tau > 0.4 and False: pass
        # batwing doors swing aside as the bear passes
        sw = 0.0
        if tau < 2.2: sw = math.sin(max(0, min(1, (tau - 0.3) / 1.2)) * math.pi) * 1.3
        elif tau > 3.9 and tau < 5.8: sw = math.sin(max(0, min(1, (tau - 4.9) / 1.2)) * math.pi) * 1.3
        self.doors[0].rotation_euler = (0, 0, sw); self.doors[1].rotation_euler = (0, 0, -sw)

    # ------------------------------------------------------------ seats
    def saloon_people(self, t, focus="all", sheriff_talk=0.0, shuffle=1.0, eyes_deal=True, countmode=False):
        ph = t * 7.5
        dl = self.dealer; place(dl, OX - 2.0, 1.58, 0, 0)
        sh = math.sin(ph) * shuffle
        pose(dl, sit=1.0, armL=(-1.15 + 0.15 * sh, 0.1, 0, 1.1 + 0.2 * sh), armR=(-1.15 - 0.15 * sh, -0.1, 0, 1.1 - 0.2 * sh), head=(0, 0.1, 0), eyes=(0, -0.7), mood="smug", talk=0.0, bob=0)
        self.shuffle_cards(t, shuffle)
        place(self.g1, OX - 3.55, 0.0, 0, math.pi / 2); pose(self.g1, sit=1.0, armL=(-0.9, 0, 0, 1.0), armR=(-0.9, 0, 0, 1.0), eyes=(0.5, -0.5), head=(-0.15, 0.1, 0), mood="calm")
        place(self.g2, OX - 0.45, 0.0, 0, -math.pi / 2); pose(self.g2, sit=1.0, armL=(-0.9, 0, 0, 1.0), armR=(-0.9, 0, 0, 1.0), eyes=(-0.5, -0.5), head=(0.15, 0.1, 0), mood="calm")
        place(self.sheriff, OX + 3.2, -0.95, 0, 0); pose(self.sheriff, sit=1.0, armL=(-0.8, 0.2, 0, 0.9), armR=(-0.8, -0.2, 0, 0.9), talk=sheriff_talk * (0.5 + 0.5 * math.sin(t * 14)), mood="angry" if False else "calm", eyes=(0, 0))
        place(self.bart, OX - 4.2, 6.5, 0, 0); pose(self.bart, armL=(-0.6 + 0.3 * math.sin(t * 2.0), 0.1, 0, 1.0), armR=(-0.4, -0.1, 0, 0.8), head=(0.2 * math.sin(t * 0.8), 0, 0), mood="calm")
        for i, (px, py, ya, hp) in enumerate(((OX + 4.8, 2.2, math.pi / 2, 0.3), (OX + 6.8, 2.2, -math.pi / 2, -0.3), (OX - 6.0, -0.5, 0, 0.2), (OX - 6.0, -2.5, math.pi, -0.2))):
            place(self.pat[i], px, py, 0, ya); pose(self.pat[i], sit=1.0, armL=(-0.9, 0, 0, 1.0), armR=(-0.7 + 0.2 * math.sin(t * 1.3 + i), 0, 0, 1.2), head=(hp * math.sin(t * 0.5 + i), 0.05, 0), eyes=(math.sin(t * 0.7 + i) * 0.5, -0.3))

    def shuffle_cards(self, t, amt):
        if amt <= 0: return
        for i, c in enumerate(self.cards):
            ph = (t * 3.2 + i / len(self.cards)) % 1.0
            x = OX - 2.0 + (-0.28 + 0.56 * ph) ; z = 0.98 + 0.3 * math.sin(ph * math.pi) * (0.6 + 0.4 * math.sin(i)) ; y = 0.95 + 0.05 * math.sin(i * 2)
            c.location = (x, y, z); c.rotation_euler = (math.sin(ph * 6 + i) * 0.8, math.sin(i) * 0.4, ph * 6.28 + i)

    # ================================================================= HOOK (street)
    def street_people(self, t):
        g = self.gor1; place(g, 0.0, 6.0, 0, 0.0)
        thump = ramp(t, 3.4, 3.7) * (1 - ramp(t, 4.3, 4.6))
        pose(g, armL=(-2.7 + 0.3 * math.sin(t * 8), -0.15, 0, 0.1), armR=(-2.7 - 0.3 * math.sin(t * 8), 0.15, 0, 0.1), lean=0.05 * math.sin(t * 5), head=(0.15 * math.sin(t * 3), 0, 0), mood="calm", wiggle=0.05 * abs(math.sin(t * 6)), talk=0.2)
        if thump > 0: pose(g, armL=(-1.1 + 0.5 * math.sin(t * 22), 0.5, 0, 1.0), armR=(-1.1 - 0.5 * math.sin(t * 22), -0.5, 0, 1.0), head=(0, 0.1, 0), mood="shock")
        slots = [(-2.6, 0), (2.4, 1.4), (-4.2, 2.8), (4.1, 4.2), (-1.4, 6.0), (1.2, 7.4)]
        for i, c in enumerate(self.crowd):
            sx, off = slots[i]; v = 2.2; y = 24 - v * (t + off) + 0.0
            y = 18 - v * ((t + off * 0.6) % 9.0)
            place(c, sx, y, 0, 0); pose(c, walk=(t + off) * 7.0, speed=1.0, armL=(0, 0, 0, 0.2), armR=(0, 0, 0, 0.2), eyes=(-0.9 if sx < 0 else 0.9, 0.7), head=(0, 0.0, 0), mood="calm", talk=0.0)

    def hook(self, t):
        self.street_people(t)
        if t < 1.55:
            u = t / 1.55; self.cam((lerp(0.2, -0.2, u), lerp(-9.0, -2.4, sm(u)), lerp(0.55, 0.9, u)), (0, 6.0, 1.45), 55, focus=lerp(15, 8.5, u), shake=0.015, t=t)
        elif t < 3.05:
            u = (t - 1.55) / 1.5; c = self.crowd[1].root.location; self.cam((c.x - 1.4 + 0.5 * u, c.y - 3.4, 1.55), (c.x + 0.0, c.y, 1.62), 38, focus=3.5, shake=0.01, t=t)
        else:
            u = (t - 3.05) / 1.69; self.cam((lerp(-4.5, -7.5, sm(u)), lerp(-6.0, -13.0, sm(u)), lerp(2.0, 3.4, u)), (0, 6.0, 1.45), 46, focus=lerp(12, 20, u), shake=0.012, t=t)

    # ================================================================= INTRO (saloon)
    def intro(self, t):
        self.saloon_people(t, shuffle=1.0, sheriff_talk=1.0 if 6.3 <= t < 10.0 else 0.0)
        if t < 6.3:      # push through the batwing doors into the saloon
            u = (t - 4.74) / 1.56; self.cam((OX + lerp(0.2, 0.6, u), lerp(-9.5, -3.2, ramp(u, 0, 1)), lerp(1.6, 1.7, u)), (OX - 0.5, 3.0, 1.6), 62, focus=lerp(7.0, 6.0, u), shake=0.01, t=t)
            sw = math.sin(max(0, min(1, (u - 0.25) / 0.45)) * math.pi) * 1.3; self.doors[0].rotation_euler = (0, 0, sw); self.doors[1].rotation_euler = (0, 0, -sw)
        elif t < 8.1:    # sheriff points at you
            u = (t - 6.3) / 1.8; pose(self.sheriff, sit=1.0, armL=(-0.8, 0.2, 0, 0.9), armR=(-1.55, -0.1, 0.0, 0.15), talk=0.6 + 0.4 * math.sin(t * 14), mood="angry", eyes=(0, 0), head=(0, 0.05, 0))
            self.cam((OX + lerp(2.0, 2.8, u), lerp(-4.4, -3.6, u), lerp(1.55, 1.5, u)), (OX + 3.2, -0.95, 1.5), 42, focus=lerp(3.8, 3.0, u), shake=0.008, t=t)
        else:            # dealer's hands, orbiting
            u = (t - 8.1) / 2.52; a = lerp(-0.9, 0.6, u)
            self.cam((OX - 2.0 + 3.4 * math.sin(a), 1.3 - 3.4 * math.cos(a), 1.6), (OX - 2.0, 1.3, 1.18), 40, focus=3.4, shake=0.006, t=t)

    # ================================================================= SHUFFLE x3
    def shuffle(self, t):
        self.saloon_people(t, shuffle=1.6)
        d = OX - 2.0; edges = [10.62, SHUF[0] - 0.05, SHUF[1] - 0.05, SHUF[2] - 0.05, 13.74]
        k = max(i for i in range(4) if t >= edges[i]); u = (t - edges[k]) / (edges[k + 1] - edges[k])
        if k == 0: self.cam((d + lerp(-1.4, -0.9, u), lerp(-2.4, -2.0, u), 1.5), (d, 1.3, 1.15), 40, focus=3.9, shake=0.01, t=t)
        elif k == 1: self.cam((d + lerp(1.0, 0.6, u), lerp(-0.5, -0.1, u), 1.35), (d, 1.0, 0.98), 34, focus=1.5, shake=0.01, t=t)
        elif k == 2: self.cam((d + lerp(-3.4, -3.0, u), lerp(1.2, 0.9, u), 1.55), (d, 1.1, 1.1), 38, focus=3.2, shake=0.01, t=t)
        else: self.cam((d, lerp(-2.8, -2.2, u), lerp(2.7, 2.3, u)), (d, 1.0, 1.0), 40, focus=lerp(3.8, 3.2, u), shake=0.01, t=t)

    # ================================================================= THE BEAR
    def beartime(self, t):
        self.saloon_people(t, shuffle=1.0)
        if t < 15.6: u = (t - 13.74) / 1.86; self.cam((OX - 2.9, lerp(3.2, 2.6, u), 1.75), (OX + 0.2, lerp(-5.5, -3.0, u), 1.5), 52, focus=lerp(9.0, 6.5, u), shake=0.01, t=t)
        elif t < 17.6:
            u = (t - 15.6) / 2.0; a = lerp(0.2, -0.6, u); self.cam((OX + 0.2 + 3.2 * math.sin(a), -3.0 + 3.2 * math.cos(a) * 0 + (1.2 if True else 0) + 3.0 * math.cos(a), 1.65), (OX + 0.2, -3.0, 1.7), 42, focus=3.6, shake=0.008, t=t)
        else: u = (t - 17.6) / 2.04; self.cam((OX - 1.5 + 1.0 * u, lerp(1.0, 0.0, u), 1.7), (OX + 0.2 - 0.2 * u, lerp(-3.5, -7.5, u), 1.5), 50, focus=lerp(5.0, 8.5, u), shake=0.01, t=t)

    # ================================================================= SHERIFF ASKS / YOU SAY NO
    def ask(self, t):
        self.saloon_people(t, shuffle=1.0, sheriff_talk=1.0 if t < 21.7 else 0.0)
        u = (t - 19.64) / 2.5; pose(self.sheriff, sit=1.0, armL=(-0.8, 0.2, 0, 0.9), armR=(-1.0, -0.1, 0.0, 0.5), talk=0.6 * (math.sin(t * 14) > 0) if t < 21.7 else 0.0, mood="angry", eyes=(0, 0), head=(0, 0.05, 0.12 * sm(u)))
        self.cam((OX + 3.2 + lerp(0.5, 0.15, u), lerp(-3.6, -2.9, u), lerp(1.5, 1.45, u)), (OX + 3.2, -0.95, 1.42), lerp(42, 30, u), focus=lerp(2.9, 2.1, u), shake=0.006, t=t)
    def nope(self, t):
        self.saloon_people(t, shuffle=1.0)
        u = (t - 22.14) / 2.13; pose(self.sheriff, sit=1.0, armL=(-0.8, 0.2, 0, 0.9), armR=(-0.8, -0.2, 0, 0.9), talk=0, mood="angry", eyes=(0, 0), head=(0, 0.0, 0.1))
        nod = 0.05 * math.sin(t * 9) * (1 - u * 0.4)
        self.cam((OX + lerp(2.2, 2.9, u), -3.3 + nod, 1.5 + 0.06 * math.sin(t * 9)), (OX + 3.2, -0.95, 1.5), 46, focus=2.6, shake=0.004, t=t)

    # ================================================================= PLAYBACK (kinetoscope + replay)
    def replay(self, t):
        self.saloon_people(t, shuffle=1.0)
        if t < 25.9:
            u = (t - 24.27) / 1.63; self.crank.rotation_euler = (t * 14, 0, 0)
            pose(self.sheriff, sit=1.0, armL=(-0.8, 0.2, 0, 0.9), armR=(-1.25 + 0.15 * math.sin(t * 14), -0.15, 0.2, 0.5), talk=0.4 * (math.sin(t * 14) > 0), mood="smug", eyes=(0, 0), head=(0, 0, 0))
            self.cam((OX + lerp(3.0, 3.78, sm(u)), lerp(-3.9, -2.5, sm(u)), lerp(1.55, 1.27, sm(u))), (OX + 3.78, -2.05, 1.25), lerp(46, 26, sm(u)), focus=lerp(2.5, 0.5, sm(u)), shake=0.004, t=t)
        else:            # inside the eyepiece: the replay (sepia + round mask are added in post)
            u = (t - 25.9) / 2.52; self.crank.rotation_euler = (t * 14, 0, 0)
            self.cam((OX - 5.2 + 1.0 * u, 3.8 - 0.8 * u, 1.9), (OX + 0.2, -2.5, 1.5), 46, focus=lerp(9.5, 8.5, u), shake=0.006, t=t)

    # ================================================================= EYE + LAB (Harvard 1999)
    def study(self, t):
        if t < 30.3:     # your big eye, pulling back to your stunned face
            u = (t - 28.42) / 1.88; y = self.you; place(y, EX, 0, 0, 0)
            blink = 1.0 if 0.35 < u < 0.45 else 0.0
            pose(y, head=(0, 0, 0), eyes=(0.0 + 0.7 * (u > 0.7), 0.0), mood="shock", blink=blink, talk=0.0)
            ex = EX + lerp(0.076, 0.0, sm(u)); cy_ = lerp(-1.0, -3.4, sm(u)); self.cam((ex, cy_, lerp(1.69, 1.55, u)), (ex, -0.18, lerp(1.69, 1.55, u)), lerp(18, 38, sm(u)), focus=abs(cy_ + 0.18), shake=0.003, t=t)
            return
        self.lab_people(t)
        if t < 32.5:     # gorilla walks through the volunteers
            u = (t - 30.3) / 2.2; self.cam((LX + lerp(-2.0, 2.0, u), -6.4, 1.5), (LX + lerp(-1.0, 1.0, u), 0.4, 1.3), 68, focus=7.0, shake=0.008, t=t)
        elif t < 34.5:   # faces of the volunteers react (or don't)
            u = (t - 32.5) / 2.0; self.cam((LX + lerp(2.4, -2.4, sm(u)), -5.6, 1.4), (LX + lerp(0.8, -0.8, sm(u)), 1.2, 1.3), 58, focus=6.8, shake=0.006, t=t)
        else:            # wide: half saw it
            u = (t - 34.5) / 2.09; self.cam((LX + lerp(0.0, 0.5, u), -6.5, lerp(2.4, 1.8, u)), (LX, 0.5, 1.2), 70, focus=7.2, shake=0.006, t=t)

    def lab_people(self, t):
        r = self.res; place(r, LX - 6.2, -2.8, 0, math.pi / 2 * -1 + math.pi / 2 * 0 + math.pi / 2)
        pose(r, armL=(-0.5, 0.2, 0, 0.5), armR=(-0.9, -0.2, 0, 1.1), head=(0.3, 0, 0), mood="calm", eyes=(0.5, 0))
        self.clip.location = (0, -0.05, -0.38)
        gx = LX + lerp(-6.0, 0.6, sm(min(1.0, (t - 30.3) / 2.9)))
        # volunteers: 3 of 6 saw the gorilla (turn eyes + shock), others stare ahead
        saw = [True, False, True, False, False, True]
        react = ramp(t, 31.4, 32.0)
        for i, v in enumerate(self.vols):
            place(v, LX - 3.75 + i * 1.5, 1.2 + 0.0, 0, 0)
            sx = (gx - (LX - 3.75 + i * 1.5)); near = max(0.0, 1 - abs(sx) / 4.0)
            pose(v, sit=1.0, armL=(-0.9, 0, 0, 1.0), armR=(-0.9, 0, 0, 1.0), head=(0, 0.0, 0), eyes=((-0.8 if not saw[i] else max(-1, min(1, -sx * 0.3))), 0.6 if not saw[i] else 0.2), mood="shock" if (saw[i] and react > 0.3 and near > 0.1) else "calm", talk=0.0)
        g = self.gor2; place(g, gx, -0.9, 0, math.pi / 2 if t < 33.3 else 0.0)
        wk = t * 6.5; thump = t > 33.3
        pose(g, walk=wk, speed=0.0 if thump else 1.0 * (1 if t < 33.2 else 0), armL=(-1.1 + 0.5 * math.sin(t * 22), 0.5, 0, 1.0) if thump else (0, 0, 0, 0.3), armR=(-1.1 - 0.5 * math.sin(t * 22), -0.5, 0, 1.0) if thump else (0, 0, 0, 0.3), head=(0, 0, 0), mood="calm")
        g.root.rotation_euler = (0, 0, math.pi / 2 if t < 33.3 else 0.0)

    # ================================================================= KEYS
    def keysrch(self, t):
        s = self.srch; ph = (t - 36.59)
        if t < 38.3:     # hero macro of the keys during "You see,"
            u = (t - 36.59) / 1.71; a = lerp(-0.7, 0.7, u)
            self.cam((CX + 0.9 * math.sin(a), -0.9 * math.cos(a), 1.05 + 0.1 * u), (CX, 0.0, 0.88), 34, focus=lerp(1.0, 0.95, u), shake=0.003, t=t)
            place(s, CX - 3.5, 3.5, 0, 0.5); pose(s, armL=(-0.3, 0, 0, 0.3), armR=(-0.3, 0, 0, 0.3)); return
        # searching: the person tears the cabin apart, never glancing at the keys
        u = (t - 38.3) / 3.96
        pts = [(CX - 3.4, 2.4), (CX - 1.8, 3.0), (CX - 1.6, 1.6), (CX + 1.8, 2.6), (CX + 3.6, 2.8), (CX + 2.0, 1.2), (CX - 1.0, 1.2)]
        n = len(pts) - 1; uu = u * n; k = min(n - 1, int(uu)); f = sm(uu - k)
        x = lerp(pts[k][0], pts[k + 1][0], f); y = lerp(pts[k][1], pts[k + 1][1], f); dx = pts[k + 1][0] - pts[k][0]; dy = pts[k + 1][1] - pts[k][1]
        yaw = math.atan2(dx, -dy) if (abs(dx) + abs(dy)) > 1e-3 else 0.0
        moving = 0.6 + 0.4 * math.sin(uu * 6)
        place(s, x, y, 0, yaw); pose(s, walk=t * 8, speed=min(1.0, abs(f * (1 - f)) * 5 + 0.1), armL=(-1.6 + 1.0 * math.sin(t * 9), 0.2, 0, 0.7), armR=(-1.6 - 1.0 * math.sin(t * 9), -0.2, 0, 0.7), lean=0.35 * (0.5 + 0.5 * math.sin(t * 5)), head=(0.5 * math.sin(t * 6), 0.1, 0), eyes=(math.sin(t * 7) * 0.9, 0.2), mood="worry", talk=0.5 * (math.sin(t * 10) > 0))
        for i, c in enumerate(self.cushions): c.location = (CX - 4.6 + i * 1.0 + (0.8 * i * ramp(t, 38.6, 39.0)), 3.0 - (2.6 * ramp(t, 38.5 + i * 0.25, 39.2 + i * 0.25)) * (1 if i == 1 else 0.4), 0.8 + 0.6 * math.sin(math.pi * ramp(t, 38.5 + i * 0.25, 39.4 + i * 0.25)))
        if t < 40.4: self.cam((CX + lerp(-4.0, 3.0, sm(u / 0.55)), lerp(-3.8, -3.5, u), 2.0), (CX + lerp(-3.5, 1.0, sm(u / 0.55)), 2.4, 1.0), 50, focus=6.0, shake=0.02, t=t)
        else:
            v = (t - 40.4) / 1.86; self.cam((CX + lerp(0.6, 0.15, sm(v)), lerp(-3.2, -1.1, sm(v)), lerp(1.7, 1.02, sm(v))), (CX, 0.0, 0.88), lerp(42, 30, sm(v)), focus=lerp(3.3, 1.2, sm(v)), shake=0.004, t=t)
            place(s, CX - 1.0 + 1.6 * v, 1.2 - 0.4 * v, 0, -math.pi / 2 * 0 + math.pi / 2 * 0.0 + 0.0)

    # ================================================================= BRAIN
    def brainz(self, t):
        if t < 43.8:     # you finally looking right at the keys (eye in focus)
            u = (t - 42.26) / 1.54; s = self.srch; place(s, CX + 0.0, -0.75, 0, math.pi)
            pose(s, lean=0.5, head=(0, 0.0, 0), eyes=(0, -0.3), mood="shock", armL=(-0.5, 0, 0, 0.4), armR=(-0.5, 0, 0, 0.4))
            self.cam((CX + lerp(0.5, 0.2, u), 0.35, lerp(1.2, 1.08, u)), (CX, -0.75, 1.17), 34, focus=lerp(0.9, 0.7, u), shake=0.004, t=t)
            return
        u = (t - 43.8) / 1.7; b = self.brain_c; place(b, CX + 0.4, 1.3, 0, 0.0)
        pose(b, armL=(-1.4, 0.3, 0, 1.6), armR=(-1.4, -0.3, 0, 1.6), head=(0.5 * math.sin(t * 0.6) * 0 + 0.7, 0.05, 0), eyes=(0, 0), mood="calm")
        self.news.location = (CX + 0.4, 0.55, 1.45); self.news.rotation_euler = (0.0, 0, 0)
        a = lerp(-0.5, 0.5, u); self.cam((CX + 0.4 + 3.4 * math.sin(a), 1.3 - 3.4 * math.cos(a), 1.5), (CX + 0.4, 1.2, 1.35), 42, focus=3.4, shake=0.006, t=t)

    # ================================================================= JOB
    def job(self, t):
        self.saloon_people(t, shuffle=1.0)
        b = self.brain_s
        if t < 47.3:
            u = (t - 45.5) / 1.8; place(b, OX + 0.4, -2.4, 0, 0)
            pose(b, armL=(-0.5, 0.2, 0, 0.5), armR=(-1.5, -0.1, 0.1, 1.2), head=(0, 0, 0), eyes=(0, 0), mood="angry", talk=0.0)
            self.clip2.location = (0, -0.05, -0.4)
            self.cam((OX + 0.4 + lerp(0.5, 0.1, u), lerp(-4.7, -3.8, sm(u)), 1.75), (OX + 0.4, -2.4, 1.7), lerp(40, 30, sm(u)), focus=lerp(2.4, 1.5, sm(u)), shake=0.004, t=t)
            return
        # the bear strolls past behind the brain, who never notices
        u = (t - 47.3) / 2.95; bx_ = OX + lerp(5.0, -4.5, u); self.bear.root.location = (bx_, 1.2, 0); self.bear.root.rotation_euler = (0, 0, -math.pi / 2)
        self.bear.pose(walk=t * 5.5, speed=0.9, wave=0.0, bob=t, head=(0.0, 0, 0.0 if t < 49.0 else 0.8), mood="happy")
        if t >= 49.0: self.bear.root.rotation_euler = (0, 0, lerp(-math.pi / 2, 0.0, sm((t - 49.0) / 0.6))); self.bear.pose(walk=0, speed=0.0, wave=1.0, bob=t, mood="happy", talk=0.4 * (math.sin(t * 12) > 0))
        place(b, OX + 0.4, -2.4, 0, 0); pose(b, armL=(-0.5, 0.2, 0, 0.5), armR=(-1.5, -0.1, 0.1, 1.2), head=(0, 0, 0), eyes=(0, 0), mood="angry")
        self.clip2.location = (0, -0.05, -0.4)
        if t < 49.0: self.cam((OX + lerp(-1.2, 0.2, (t - 47.3) / 1.7), -5.5, 1.7), (OX + 0.4 - 0.4 * (t - 47.3) / 1.7, -0.5, 1.5), 44, focus=lerp(3.5, 3.6, 0.5), shake=0.006, t=t)
        else:
            self.bear.root.location = (OX + lerp(-4.5, -1.0, 0.0) + 0.0, 1.2, 0); u2 = (t - 49.0) / 1.25
            self.bear.root.location = (OX - 1.6, 0.4, 0); self.cam((OX - 1.6 + lerp(0.2, 0.0, u2), lerp(-2.4, -1.6, sm(u2)), 1.9), (OX - 1.6, 0.4, 2.0), lerp(40, 30, sm(u2)), focus=lerp(2.8, 2.0, sm(u2)), shake=0.005, t=t)

    # ================================================================= DRINK (final)
    def drink(self, t):
        self.saloon_people(t, shuffle=1.0)
        u = (t - 50.25) / 4.05; b = self.bear; bear_place(b, OX - 4.6, 4.2, 0, 0.1)
        lift = sm((t - 50.8) / 0.8) * (1 - 0.65 * sm((t - 52.2) / 0.5))
        b.pose(walk=0, speed=0.0, mug=lift, bob=t, mood="happy", head=(0.0, -0.1 * lift, 0.0), talk=0.0)
        place(self.bart, OX - 3.4, 6.5, 0, 0)
        pose(self.bart, armL=(-1.4 + 0.2 * math.sin(t * 3), 0.1, 0, 0.8), armR=(-0.4, -0.1, 0, 0.8), head=(0.1, 0, 0), mood="calm", talk=0.0)
        self.cam((OX - 4.6 + lerp(2.2, 1.2, sm(u)), lerp(-0.8, 1.2, sm(u)), lerp(1.7, 1.9, u)), (OX - 4.6, 4.2, lerp(1.7, 2.0, u)), lerp(46, 38, u), focus=lerp(5.4, 3.8, sm(u)), shake=0.004, t=t)
