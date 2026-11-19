"""Sets for 'The Bear in the Saloon': western street (origin), saloon (x=100), lab (x=200), cabin (x=300)."""
import bpy, math, os, random
from mathutils import Vector
import bl_common as B
from bl_common import prim, empty, mat, soft
from chars2 import mug
FONT = r"C:\Users\jamil\al-lahjah\video\public\fonts\LilitaOne-Regular.ttf"

def bx(loc, size, m, rot=(0, 0, 0), ol=0.0, parent=None, name="box"): return prim("cube", size, loc, rot=rot, m=m, ol=ol, parent=parent, name=name)
def cy(loc, r, h, m, rot=(0, 0, 0), ol=0.0, parent=None, seg=24): return prim("cyl", (r, r, h), loc, rot=rot, m=m, ol=ol, parent=parent, seg=seg)

def text(s, loc, size, m, rot=(math.pi / 2, 0, 0), extrude=0.03):
    cu = bpy.data.curves.new("t", "FONT"); cu.body = s; cu.size = size; cu.extrude = extrude; cu.align_x = "CENTER"; cu.align_y = "CENTER"
    try: cu.font = bpy.data.fonts.load(FONT)
    except Exception: pass
    o = bpy.data.objects.new("text", cu); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot; o.data.materials.append(m); return o

W = lambda name, col, tex, sc=0.5, tint=None: mat(name, col, 0.8, tex=tex, scale=sc, tint=tint if tint else col)
def wood_dark(): return W("wooddark", (0.35, 0.2, 0.12, 1), "dark_wood", 0.7, (0.75, 0.55, 0.4, 1))
def wood_warm(): return W("woodwarm", (0.7, 0.45, 0.25, 1), "weathered_brown_planks", 0.5, (1.0, 0.75, 0.55, 1))
def wood_floor(): return W("woodfloor", (0.6, 0.38, 0.22, 1), "wood_floor", 0.45, (1.0, 0.8, 0.6, 1))
def sand(): return mat("sand", (0.92, 0.72, 0.45, 1), 0.95, tex="aerial_ground_rock", scale=0.22, tint=(1.0, 0.8, 0.52, 1))

# ======================================================================= STREET
def street():
    prim("plane", (200, 200, 1), (0, 0, 0), m=sand(), smooth=False, name="ground")
    # wheel ruts
    for x in (-1.6, 1.6): prim("cube", (0.5, 160, 0.01), (x, 0, 0.005), m=soft("rut", (0.6, 0.45, 0.28, 1), 0.9), name="rut")
    names = ["SALOON", "BANK", "HOTEL", "STORE", "SHERIFF", "BARBER", "LIVERY", "TELEGRAPH"]
    cols = [(0.72, 0.18, 0.14, 1), (0.25, 0.35, 0.62, 1), (0.82, 0.7, 0.5, 1), (0.3, 0.5, 0.45, 1), (0.6, 0.4, 0.25, 1), (0.85, 0.82, 0.7, 1), (0.55, 0.2, 0.18, 1), (0.35, 0.45, 0.7, 1)]
    ys = [-22, -12, -1, 10, 21]
    random.seed(4)
    for side in (-1, 1):
        for i, y in enumerate(ys):
            k = (i * 3 + (0 if side < 0 else 4)) % len(names); h = 6.0 + (i % 3) * 1.2; w = 8.5; d = 9.0
            col = cols[k]; xc = side * (6.5 + d / 2)
            wall = W(f"wall{side}{i}", col, "blue_painted_planks" if k % 2 else "weathered_brown_planks", 0.45, col)
            bx((xc, y, h / 2), (d, w, h), wall, ol=0.03)                                           # main block
            xf = side * 6.5                                                                          # street-facing plane x
            bx((xf - side * 0.25, y, h + 0.7), (0.5, w + 0.2, 1.8), wall, ol=0.03)                  # false front
            text(names[k], (xf - side * 0.55, y, h + 0.7), 0.95, mat("signt", (0.98, 0.93, 0.8, 1), 0.7), rot=(math.pi / 2, 0, math.pi / 2 * side * -1 + (math.pi if side > 0 else 0)))
            trim = W("trim", (0.95, 0.92, 0.85, 1), "white_plaster_02", 0.6, (0.95, 0.92, 0.85, 1))
            bx((xf - side * 0.3, y, 0.15), (0.7, w + 0.4, 0.3), trim)
            for yy in (-2.6, 2.6):
                for zz in (1.7, h - 1.4):
                    bx((xf - side * 0.06, y + yy, zz), (0.14, 1.5, 1.7), mat("glass", (0.12, 0.2, 0.35, 1), 0.3, emission=(0.04, 0.07, 0.14, 1), em_strength=0.8), ol=0.012)
                    bx((xf - side * 0.13, y + yy, zz), (0.1, 1.8, 2.0), trim, ol=0.01);
            bx((xf - side * 0.1, y, 1.2), (0.16, 1.7, 2.4), wood_dark(), ol=0.02)                     # door
            bx((xf - side * 1.1, y, 3.4), (2.2, w - 1.4, 0.18), W("awn", col, None, 1, None) if False else mat("awn", tuple(c * 0.8 for c in col[:3]) + (1,), 0.8), rot=(0, 0.28 * side * -1, 0), ol=0.02)   # awning
            for yy in (-w / 2 + 0.6, w / 2 - 0.6): cy((xf - side * 2.0, y + yy, 1.6), 0.12, 3.2, wood_warm(), ol=0.015)
            bx((xf - side * 1.3, y, 0.1), (3.0, w, 0.22), wood_warm())                                # boardwalk
    # props
    for (x, y) in ((-5.2, -6), (5.0, 6), (-5.2, 14), (5.2, -16)):
        cy((x, y, 0.45), 0.4, 0.9, wood_warm(), ol=0.025); cy((x, y, 0.92), 0.42, 0.06, mat("hoop", (0.2, 0.2, 0.22, 1), 0.5), ol=0.01)
    bx((4.6, -3, 0.45), (0.8, 2.4, 0.9), wood_warm(), ol=0.03); bx((4.6, -3, 0.82), (0.7, 2.2, 0.1), mat("water", (0.2, 0.45, 0.75, 1), 0.3, emission=(0.05, 0.12, 0.2, 1)))
    for sx in (-1, 1): cy((sx * 4.6, 0.5, 0.7), 0.06, 1.4, wood_warm(), ol=0.01)
    bx((4.6, 0.5, 1.3), (0.12, 3.4, 0.12), wood_warm(), ol=0.01)
    cy((-5.3, 3, 3.0), 0.12, 6.0, wood_warm(), ol=0.02); bx((-5.3, 3, 5.6), (0.14, 1.8, 0.14), wood_warm(), ol=0.012)
    # mesas / mountains
    rock = W("rock", (0.8, 0.4, 0.25, 1), "aerial_ground_rock", 0.06, (0.95, 0.62, 0.45, 1))
    for (x, y, r, h) in ((-90, 190, 22, 22), (-30, 230, 28, 30), (40, 210, 20, 16), (110, 190, 24, 24), (-150, 170, 18, 14)):
        cy((x, y, h / 2), r, h, rock, seg=20); cy((x, y, h + 0.4), r * 0.82, 0.8, rock, seg=20)
    # swinging "batwing" doors on the saloon front come with the saloon set

# ======================================================================= SALOON (inside)
OX = 100.0
def saloon():
    ox = OX
    fl = wood_floor(); wl = wood_warm(); dk = wood_dark(); red = mat("redwall", (0.55, 0.12, 0.1, 1), 0.9, tex="painted_plaster_wall", scale=0.5, tint=(0.8, 0.2, 0.16, 1))
    # shell: x -8..8, y -7..7, z 0..5
    prim("plane", (18, 16, 1), (ox, 0, 0), m=fl, smooth=False, name="floor")
    bx((ox, 7.1, 2.5), (16.4, 0.3, 5), red, ol=0.0)                  # back wall (red wallpaper)
    for sx in (-1, 1): bx((ox + sx * 8.1, 0, 2.5), (0.3, 14.4, 5), wl)
    bx((ox, -7.1, 2.5), (16.4, 0.3, 5), wl)                          # front wall (with doorway)
    bx((ox, 0, 5.1), (16.4, 14.4, 0.3), dk)
    for xx in (-6, -2, 2, 6): bx((ox + xx, 0, 4.75), (0.35, 14.4, 0.4), dk, ol=0.012)          # ceiling beams
    bx((ox, 7.0, 0.55), (16, 0.5, 1.1), wl)                           # wainscot
    # front doorway: frame + batwing doors (pivot empties so they can swing)
    self_doors = []
    for sx in (-1, 1):
        piv = empty((ox + sx * 1.0, -6.95, 0), None, "doorpiv"); self_doors.append(piv)
        bx((-sx * 0.5, 0, 1.55), (1.0, 0.08, 1.2), dk, parent=piv, ol=0.015)
        for k in range(4): bx((-sx * (0.12 + k * 0.25), 0.05, 1.55), (0.05, 0.03, 1.2), wl, parent=piv)
    # bar (back-left)
    bar = dk
    bx((ox - 4.2, 6.0, 0.55), (8.0, 1.2, 1.1), bar, ol=0.03); bx((ox - 4.2, 5.4, 1.12), (8.4, 1.5, 0.12), wl, ol=0.02)
    cy((ox - 4.2, 5.3, 0.3), 0.05, 7.8, mat("brass", (0.9, 0.7, 0.3, 1), 0.3, metallic=1.0), rot=(0, math.pi / 2, 0), ol=0.008)
    bx((ox - 4.2, 6.9, 2.4), (7.6, 0.25, 0.1), wl); bx((ox - 4.2, 6.9, 1.8), (7.6, 0.25, 0.1), wl)       # shelves
    cols = [(0.2, 0.5, 0.25, 1), (0.7, 0.4, 0.1, 1), (0.5, 0.15, 0.1, 1), (0.85, 0.8, 0.5, 1)]
    for i in range(14):
        for zz, hh in ((2.54, 0.38), (1.94, 0.34)): cy((ox - 7.4 + i * 0.5, 6.85, zz + hh / 2), 0.07, hh, mat("bottle", cols[i % 4], 0.3, emission=tuple(c * 0.15 for c in cols[i % 4][:3]) + (1,)), ol=0.008)
    bx((ox - 4.2, 7.0, 3.5), (3.4, 0.08, 1.5), mat("mirror", (0.8, 0.85, 0.9, 1), 0.2, emission=(0.35, 0.38, 0.42, 1), em_strength=0.7), ol=0.03)  # mirror
    for i in range(3): mug((ox - 6.5 + i * 1.9, 5.4, 1.18))
    # stage / piano left-right decoration: posters
    for (px, pz, c) in ((ox + 6.0, 3.0, (0.9, 0.85, 0.6, 1)), (ox + 3.0, 3.3, (0.85, 0.8, 0.7, 1))): bx((px, 6.92, pz), (1.1, 0.04, 1.5), mat("poster", c, 0.9, emission=tuple(x * 0.12 for x in c[:3]) + (1,)), ol=0.012)
    # round tables + chairs
    def table(x, y, r=1.0):
        cy((ox + x, y, 0.8), r, 0.1, wl, ol=0.03); cy((ox + x, y, 0.4), 0.12, 0.8, dk, ol=0.02); cy((ox + x, y, 0.04), 0.4, 0.08, dk, ol=0.02)
    def chair(x, y, yaw):
        c = empty((ox + x, y, 0), None, "chair"); c.rotation_euler = (0, 0, yaw)
        bx((0, 0, 0.5), (0.5, 0.5, 0.08), wl, parent=c, ol=0.012); bx((0, 0.23, 0.95), (0.5, 0.06, 0.8), wl, parent=c, ol=0.012)
        for ax in (-0.2, 0.2):
            for ay in (-0.2, 0.2): bx((ax, ay, 0.25), (0.06, 0.06, 0.5), dk, parent=c)
    table(-2.0, 0.0, 1.25)                                                                      # poker table
    for (cx, cy_, ya) in ((-3.7, 0.0, math.pi / 2), (-0.3, 0.0, -math.pi / 2), (-2.0, 1.7, 0.0)): chair(cx, cy_, ya)
    table(3.2, -2.0, 0.8); chair(3.2, -3.2, math.pi); chair(3.2, -0.8, 0.0)                    # sheriff table (you sit at front)
    table(5.8, 2.2, 0.9); chair(4.8, 2.2, math.pi / 2); chair(6.8, 2.2, -math.pi / 2)
    table(-6.0, -1.5, 0.9); chair(-6.0, -2.6, math.pi); chair(-6.0, -0.4, 0.0)
    # poker items on the table
    chips = [(0.9, 0.2, 0.15, 1), (0.2, 0.4, 0.8, 1), (0.95, 0.9, 0.8, 1)]
    for i in range(9): cy((ox - 2.0 + 0.5 * math.cos(i), 0.3 * math.sin(i) - 0.4, 0.86 + 0.03 * (i % 3)), 0.07, 0.03, mat("chip", chips[i % 3], 0.5), ol=0.004)
    # hanging lamps (emissive shades) + lights
    for (lx, ly) in ((-2.0, 0.0), (3.2, -2.0), (5.8, 2.2), (-6.0, -1.5), (0, -4.5)):
        cy((ox + lx, ly, 3.9), 0.02, 1.8, mat("chain", (0.15, 0.12, 0.1, 1), 0.6))
        prim("cone", (0.5, 0.5, 0.45), (ox + lx, ly, 3.1), rot=(math.pi, 0, 0), m=mat("shade", (1.0, 0.85, 0.5, 1), 0.5, emission=(1.0, 0.7, 0.3, 1), em_strength=1.4), ol=0.015)
        B.light("POINT", (ox + lx, ly, 2.8), 380, (1.0, 0.72, 0.4), size=0.4)
    # windows with night/day light on the side walls
    for sx in (-1, 1):
        for yy in (-3.5, 2.5):
            bx((ox + sx * 7.9, yy, 2.4), (0.1, 1.8, 2.0), mat("win", (0.7, 0.85, 1.0, 1), 0.3, emission=(0.6, 0.78, 1.0, 1), em_strength=2.5), ol=0.02)
            B.light("AREA", (ox + sx * 7.3, yy, 2.4), 170, (0.75, 0.85, 1.0), rot=(0, sx * math.pi / 2 * -1 + math.pi / 2 - math.pi / 2, 0), size=1.8)
    B.light("AREA", (ox, 0, 4.7), 300, (1.0, 0.85, 0.65), size=8.0)
    # balcony on the right
    bx((ox + 7.0, 0, 3.1), (2.0, 13, 0.18), wl, ol=0.02)
    for yy in range(-6, 7, 1): cy((ox + 6.1, yy, 3.7), 0.04, 1.0, dk)
    bx((ox + 6.1, 0, 4.2), (0.1, 13, 0.1), dk, ol=0.012)
    return self_doors

# ======================================================================= LAB (Harvard 1999)
LX = 200.0
def lab():
    ox = LX
    wall = mat("labwall", (0.78, 0.86, 0.8, 1), 0.9, tex="painted_plaster_wall", scale=0.5, tint=(0.75, 0.88, 0.8, 1)); fl = mat("labfloor", (0.55, 0.5, 0.45, 1), 0.7, tex="brown_floor_tiles", scale=0.5, tint=(0.8, 0.75, 0.7, 1))
    prim("plane", (16, 14, 1), (ox, 0, 0), m=fl, smooth=False, name="labfloor")
    bx((ox, 7, 2.5), (16, 0.3, 5), wall); bx((ox, -7, 2.5), (16, 0.3, 5), wall); [bx((ox + s * 8, 0, 2.5), (0.3, 14, 5), wall) for s in (-1, 1)]; bx((ox, 0, 5.1), (16, 14, 0.3), mat("labceil", (0.95, 0.95, 0.92, 1), 0.9))
    bx((ox, 6.8, 2.6), (7.0, 0.1, 2.0), mat("board", (0.12, 0.28, 0.2, 1), 0.9), ol=0.02); bx((ox, 6.75, 3.7), (7.2, 0.08, 0.12), wood_warm())
    text("1999", (ox - 1.5, 6.7, 3.0), 0.7, mat("chalk", (0.95, 0.95, 0.9, 1), 0.9), rot=(math.pi / 2, 0, 0))
    for i, c in enumerate(((0.95, 0.4, 0.3, 1), (0.9, 0.9, 0.3, 1), (0.4, 0.8, 0.9, 1))): cy((ox + 1.2 + i * 0.5, 6.6, 2.3), 0.12, 0.05, mat("chalkc", c, 0.9), rot=(math.pi / 2, 0, 0))
    bx((ox - 5, 6.6, 2.9), (2.4, 0.06, 1.6), mat("diagram", (0.95, 0.93, 0.88, 1), 0.9), ol=0.01)
    prim("plane", (4.0, 2.6, 1), (ox, -6.7, 3.0), rot=(math.pi / 2, 0, 0), m=mat("screen", (0.95, 0.97, 1.0, 1), 0.9, emission=(0.7, 0.75, 0.85, 1), em_strength=1.0), smooth=False)  # projection screen
    for i in range(6):
        c = empty((ox - 3.75 + i * 1.5, 1.2, 0), None, "labchair")
        bx((0, 0, 0.45), (0.6, 0.6, 0.08), wood_warm(), parent=c, ol=0.012); bx((0, 0.28, 0.85), (0.6, 0.06, 0.7), wood_warm(), parent=c, ol=0.012)
        for ax in (-0.25, 0.25):
            for ay in (-0.25, 0.25): bx((ax, ay, 0.22), (0.05, 0.05, 0.45), wood_dark(), parent=c)
    B.light("AREA", (ox, 0, 4.7), 560, (1.0, 0.98, 0.92), size=9.0); B.light("AREA", (ox, -5.5, 3.0), 180, (0.9, 0.95, 1.0), size=4.0)

# ======================================================================= CABIN (keys)
CX = 300.0
def cabin():
    ox = CX
    wl = wood_warm(); fl = wood_floor(); dk = wood_dark()
    prim("plane", (14, 12, 1), (ox, 0, 0), m=fl, smooth=False, name="cabinfloor")
    bx((ox, 6, 2.2), (14, 0.3, 4.4), wl); bx((ox, -6, 2.2), (14, 0.3, 4.4), wl); [bx((ox + s * 7, 0, 2.2), (0.3, 12, 4.4), wl) for s in (-1, 1)]; bx((ox, 0, 4.5), (14, 12, 0.3), dk)
    for xx in (-4, 0, 4): bx((ox + xx, 0, 4.25), (0.3, 12, 0.4), dk, ol=0.012)
    rug = mat("rug", (0.7, 0.2, 0.15, 1), 0.9, tex="fabric_pattern_05", scale=0.8, tint=(1.0, 0.45, 0.35, 1)); bx((ox, 0, 0.02), (5.5, 4.2, 0.04), rug, ol=0.01)
    # window (daylight)
    bx((ox, 5.8, 2.4), (2.4, 0.1, 1.8), mat("cwin", (0.8, 0.9, 1, 1), 0.3, emission=(0.8, 0.9, 1.0, 1), em_strength=3.0), ol=0.02)
    B.light("AREA", (ox, 5.0, 2.4), 480, (0.9, 0.95, 1.0), rot=(math.pi / 2, 0, 0), size=2.4)
    # table with the keys
    cy((ox, 0, 0.78), 0.75, 0.09, wl, ol=0.03); cy((ox, 0, 0.4), 0.1, 0.78, dk, ol=0.02); cy((ox, 0, 0.03), 0.4, 0.06, dk, ol=0.02)
    # couch with cushions (can be thrown)
    bx((ox - 4.2, 3.0, 0.45), (3.2, 1.2, 0.5), mat("couch", (0.2, 0.35, 0.55, 1), 0.9, tex="fabric_pattern_07", scale=1.0, tint=(0.4, 0.55, 0.85, 1)), ol=0.03)
    bx((ox - 4.2, 3.55, 1.0), (3.2, 0.3, 0.9), mat("couch2", (0.17, 0.3, 0.5, 1), 0.9), ol=0.03)
    # shelves + drawers
    bx((ox + 5.5, 4.5, 1.0), (1.8, 0.8, 2.0), dk, ol=0.03)
    for i in range(3): bx((ox + 5.5, 4.08, 0.4 + i * 0.6), (1.6, 0.03, 0.45), wl, ol=0.01)
    B.light("POINT", (ox, 0, 3.4), 300, (1.0, 0.8, 0.55), size=0.5)
    B.light("AREA", (ox, -4, 3.0), 180, (1.0, 0.9, 0.8), size=5.0)

def world_for_street():
    B.sky("kloofendal_48d_partly_cloudy_puresky_2k.hdr", 1.1, rot=2.2)
    B.light("SUN", (30, -40, 60), 5.0, (1.0, 0.92, 0.78), rot=(0.9, 0.15, 0.7))
