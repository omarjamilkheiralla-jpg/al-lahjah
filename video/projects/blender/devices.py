import bpy
prefs = bpy.context.preferences.addons['cycles'].preferences
for t in ('HIP','OPTIX','CUDA','ONEAPI'):
    try:
        prefs.compute_device_type = t; prefs.get_devices()
        print('TYPE', t, [ (d.name, d.type, d.use) for d in prefs.devices ])
    except Exception as e: print('TYPE', t, 'ERR', e)
