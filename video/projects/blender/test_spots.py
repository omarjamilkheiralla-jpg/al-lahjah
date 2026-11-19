import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bl_common as B
from mathutils import Matrix
out = sys.argv[sys.argv.index("--") + 1]
B.clean(); sc = B.setup_render(900, 500, 32)
B.sky("kloofendal_48d_partly_cloudy_puresky_2k.hdr", 1.1, rot=1.0); B.light("SUN", (5, -6, 8), 5.0, (1, 0.93, 0.8), rot=(0.9, 0.2, 0.6))
import bl_common as B2
def sph(x, m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1)
    o = bpy.context.object; o.data.transform(Matrix.Diagonal((0.34, 0.31, 0.37, 1))); o.location = (x, 0, 1); o.data.shade_smooth(); o.data.materials.append(m)
sph(-2.4, B.mat("plain", (0.95, 0.9, 0.8, 1), 0.8))
sph(-0.8, B.soft("s1", B.CREAM, 0.8, scale=9, var=0.06, bump=0.05))
sph(0.8, B.mat("tx", B.CREAM, 0.85, tex="beige_wall_001", scale=1.5, normal=0.15))
sph(2.4, B.soft("s2", B.CREAM, 0.8, scale=9, var=0.0, bump=0.0))
B.camera((0, -8.5, 1.0), (0, 0, 1.0), fov=30, fstop=8, focus=8.5)
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
