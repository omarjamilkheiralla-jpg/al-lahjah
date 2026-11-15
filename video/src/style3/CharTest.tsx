import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { Person, BEN2, GARY2, MIA2 } from "./kit4";
import { box, M } from "./kit";
import { Mesh } from "./kit2";
const Rig: React.FC<{ p: [number, number, number]; l: [number, number, number]; fov: number }> = ({ p, l, fov }) => { const c = useThree((s) => s.camera) as THREE.PerspectiveCamera; useLayoutEffect(() => { c.fov = fov; c.near = 0.05; c.far = 100; c.updateProjectionMatrix(); c.position.set(...p); c.lookAt(...l); c.updateMatrixWorld(); }); return null; };
export const CharTest: React.FC<{ mode?: string }> = ({ mode = "all" }) => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = f / 30;
  const cam = mode === "face" ? { p: [-0.45, 1.68, 1.0] as [number, number, number], l: [-0.6, 1.66, 0] as [number, number, number], fov: 26 } : mode === "hand" ? { p: [0.2, 0.95, 1.1] as [number, number, number], l: [0.78, 1.0, 0.2] as [number, number, number], fov: 24 } : { p: [0.4, 1.1, 4.2] as [number, number, number], l: [0, 1.0, 0] as [number, number, number], fov: 38 };
  return (
    <AbsoluteFill style={{ background: "#d8c8a8" }}>
      <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, near: 0.05, far: 100, position: cam.p }} gl={{ antialias: true }}>
        <Rig {...cam} /><color attach="background" args={["#d9c7a4"]} /><hemisphereLight args={["#fff0d8", "#e8c9a0", 1.5]} /><directionalLight color="#ffe0b0" intensity={3} position={[-3, 5, 6]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <Mesh g={box(20, 0.1, 20)} m={M("#d8c2a2", { map: "tiles", rx: 6, ry: 6 })} p={[0, -0.05, 0]} rim={false} />
        <Person look={BEN2} p={[-0.6, 0, 0]} yaw={0.25} pose={{ expr: "calm", rGrip: 0.2, lGrip: 0.1 }} />
        <Person look={GARY2} p={[0.6, 0, 0.2]} yaw={-0.3} pose={{ expr: "smug", rArm: [-0.5, 0.15], rElbow: 1.0, rGrip: 0.6 }} />
        <Person look={MIA2} p={[1.7, 0, -0.2]} yaw={-0.6} pose={{ expr: "smile" }} />
        <PostFX focus={4} range={30} bokeh={1} frame={f} grain={0.1} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
