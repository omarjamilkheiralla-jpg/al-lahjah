import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFonts } from "../full/fonts";
import { PostFX } from "../hotel/PostFX";
import { TThumb, TThumb2 } from "./scenes";

const Rig: React.FC = () => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = 50; camera.updateProjectionMatrix(); camera.position.set(0.6, 3.1, 4.4); camera.up.set(0, 1, 0); camera.lookAt(0.9, 3.3, -3); camera.rotateZ(-0.05); camera.updateMatrixWorld(); });
  return null;
};
export const TownThumb: React.FC = () => {
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  if (!ok) return <AbsoluteFill style={{ background: "#c33" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} flat camera={{ fov: 50, near: 0.1, far: 200, position: [0.6, 3.1, 4.4] }} gl={{ antialias: true }}>
        <Rig /><TThumb t={1.4} cam={[0, 3, 4]} />
        <PostFX focus={4.6} range={5} bokeh={2.4} frame={frame} grain={0.12} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const Rig2: React.FC = () => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = 52; camera.updateProjectionMatrix(); camera.position.set(0, 1.5, 12.5); camera.up.set(0, 1, 0); camera.lookAt(0, 3.7, 0); camera.updateMatrixWorld(); });
  return null;
};
export const TownThumb2: React.FC = () => {
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  if (!ok) return <AbsoluteFill style={{ background: "#c33" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} flat camera={{ fov: 52, near: 0.1, far: 400, position: [0, 1.5, 12.5] }} gl={{ antialias: true }}>
        <Rig2 /><TThumb2 t={1.6} cam={[0, 3, 12]} />
        <PostFX focus={7.5} range={5} bokeh={2.2} frame={frame} grain={0.1} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
