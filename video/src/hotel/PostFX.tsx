import * as THREE from "three";
import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect, VignetteEffect, NoiseEffect, BloomEffect,
  HueSaturationEffect, BrightnessContrastEffect, BlendFunction,
} from "postprocessing";

/** Depth of field + glow + film grain + colour grade + vignette, driven manually once per Remotion frame. */
export const PostFX: React.FC<{ focus: number; range: number; bokeh?: number; frame: number; grain?: number }> = ({
  focus, range, bokeh = 3.2, frame, grain = 0.28,
}) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const { composer, dof, noise } = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.UnsignedByteType, multisampling: 4 });
    composer.addPass(new RenderPass(scene, camera));
    const dof = new DepthOfFieldEffect(camera as THREE.PerspectiveCamera, {
      worldFocusDistance: focus, worldFocusRange: range, bokehScale: bokeh, resolutionScale: 0.75,
    });
    const bloom = new BloomEffect({ intensity: 0.5, luminanceThreshold: 0.86, luminanceSmoothing: 0.25, mipmapBlur: true });
    const grade = new HueSaturationEffect({ hue: 0, saturation: 0.1 });
    const bc = new BrightnessContrastEffect({ brightness: 0.0, contrast: 0.08 });
    const vig = new VignetteEffect({ offset: 0.3, darkness: 0.5 });
    const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true });
    noise.blendMode.opacity.value = grain;
    composer.addPass(new EffectPass(camera, dof));
    composer.addPass(new EffectPass(camera, bloom, grade, bc, vig, noise));
    return { composer, dof, noise };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => { composer.setSize(size.width, size.height, false); }, [composer, size.width, size.height]);
  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(() => {
    const cm = (dof as any).circleOfConfusionMaterial;
    cm.worldFocusDistance = focus;
    cm.worldFocusRange = range;
    dof.bokehScale = bokeh;
    noise.blendMode.opacity.value = grain;
    composer.render();
  }, 1);

  void frame;
  return null;
};
