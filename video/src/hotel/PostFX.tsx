import * as THREE from "three";
import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect, VignetteEffect, SMAAEffect } from "postprocessing";

/** Depth of field + vignette, driven manually once per Remotion frame. */
export const PostFX: React.FC<{ focus: number; range: number; bokeh?: number; frame: number }> = ({
  focus, range, bokeh = 3.2, frame,
}) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const { composer, dof } = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.UnsignedByteType, multisampling: 0 });
    composer.addPass(new RenderPass(scene, camera));
    const dof = new DepthOfFieldEffect(camera as THREE.PerspectiveCamera, {
      worldFocusDistance: focus,
      worldFocusRange: range,
      bokehScale: bokeh,
      resolutionScale: 0.75,
    });
    const vig = new VignetteEffect({ offset: 0.3, darkness: 0.5 });
    composer.addPass(new EffectPass(camera, dof, vig));
    return { composer, dof };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height, false);
  }, [composer, size.width, size.height]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(() => {
    const cm = (dof as any).circleOfConfusionMaterial;
    cm.worldFocusDistance = focus;
    cm.worldFocusRange = range;
    dof.bokehScale = bokeh;
    composer.render();
  }, 1);

  void frame;
  return null;
};
