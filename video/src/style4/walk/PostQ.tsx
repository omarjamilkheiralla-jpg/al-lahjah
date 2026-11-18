import * as THREE from "three";
import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer, RenderPass, NormalPass, EffectPass, DepthOfFieldEffect, VignetteEffect, NoiseEffect, BloomEffect, SSAOEffect,
  HueSaturationEffect, BrightnessContrastEffect, ToneMappingEffect, ToneMappingMode, ChromaticAberrationEffect, BlendFunction, Effect,
} from "postprocessing";

/** Cinematic post stack: soft AO, depth of field, filmic tone mapping, bloom/halation, teal-orange split tone, lens fringing, vignette, grain. */
class SplitTone extends Effect {
  constructor() {
    super("SplitTone", `void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
      vec3 sh = vec3(0.86, 0.98, 1.12); vec3 hi = vec3(1.12, 1.0, 0.88);
      vec3 tint = mix(sh, hi, smoothstep(0.15, 0.75, l));
      vec3 c = inputColor.rgb * tint;
      c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.12);
      outputColor = vec4(c, inputColor.a);
    }`, { blendFunction: BlendFunction.NORMAL });
  }
}
export const PostQ: React.FC<{ focus: number; range: number; bokeh?: number; frame: number; grain?: number; bloom?: number }> = ({ focus, range, bokeh = 3.2, frame, grain = 0.2, bloom = 0.9 }) => {
  const gl = useThree((s) => s.gl); const scene = useThree((s) => s.scene); const camera = useThree((s) => s.camera); const size = useThree((s) => s.size);
  const { composer, dof, noise, bl } = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 4 });
    composer.addPass(new RenderPass(scene, camera));
    const normalPass = new NormalPass(scene, camera); composer.addPass(normalPass);
    const ssao = new SSAOEffect(camera, normalPass.texture, { blendFunction: BlendFunction.MULTIPLY, distanceScaling: true, depthAwareUpsampling: true, samples: 11, rings: 6, distanceThreshold: 0.6, distanceFalloff: 0.1, rangeThreshold: 0.0005, rangeFalloff: 0.001, luminanceInfluence: 0.55, radius: 0.09, intensity: 2.2, bias: 0.04 });
    const dof = new DepthOfFieldEffect(camera as THREE.PerspectiveCamera, { worldFocusDistance: focus, worldFocusRange: range, bokehScale: bokeh, resolutionScale: 0.8 });
    const bl = new BloomEffect({ intensity: bloom, luminanceThreshold: 0.72, luminanceSmoothing: 0.3, mipmapBlur: true, radius: 0.75 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const grade = new HueSaturationEffect({ hue: 0, saturation: 0.06 }); const bc = new BrightnessContrastEffect({ brightness: -0.01, contrast: 0.1 });
    const ca = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0007, 0.0007), radialModulation: true, modulationOffset: 0.3 });
    const vig = new VignetteEffect({ offset: 0.28, darkness: 0.62 });
    const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true }); noise.blendMode.opacity.value = grain;
    composer.addPass(new EffectPass(camera, ssao, dof));
    composer.addPass(new EffectPass(camera, bl, tone, new SplitTone(), grade, bc));
    composer.addPass(new EffectPass(camera, ca, vig, noise));
    return { composer, dof, noise, bl };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  useEffect(() => { composer.setSize(size.width, size.height, false); }, [composer, size.width, size.height]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame(() => { const cm = (dof as any).circleOfConfusionMaterial; cm.worldFocusDistance = focus; cm.worldFocusRange = range; dof.bokehScale = bokeh; noise.blendMode.opacity.value = grain; bl.intensity = bloom; composer.render(); }, 1);
  void frame;
  return null;
};
