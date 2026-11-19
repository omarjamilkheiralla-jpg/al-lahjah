import bpy, sys, os, time
out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for e in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try: sc.render.engine = e; break
    except TypeError: pass
print("ENGINE", sc.render.engine)
sc.render.resolution_x, sc.render.resolution_y = 540, 960
bpy.ops.mesh.primitive_plane_add(size=40); bpy.ops.mesh.primitive_uv_sphere_add(location=(0, 0, 1)); bpy.ops.mesh.primitive_monkey_add(location=(2, 0, 1))
bpy.ops.object.light_add(type="SUN", rotation=(0.8, 0.2, 0.6)); bpy.context.object.data.energy = 4
bpy.ops.object.camera_add(location=(0, -8, 3), rotation=(1.2, 0, 0)); sc.camera = bpy.context.object
sc.render.filepath = out
t = time.time(); bpy.ops.render.render(write_still=True); print("RENDER_SECONDS", round(time.time() - t, 2))
