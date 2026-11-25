import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Person2 } from "./person";
import type { Expr } from "./paint";

/** Character sheet: the reference-style characters, big, on a plain warm backdrop. */
const CAST: { look: string; expr: Expr; x: number; y: number; s: number; pose?: any }[] = [
  { look: "kyle", expr: "deadpan", x: -1.55, y: 0, s: 1.0 },
  { look: "kyle", expr: "shock", x: 0.0, y: 0, s: 1.0 },
  { look: "kyle", expr: "smile", x: 1.55, y: 0, s: 1.0, pose: "cheer" },
  { look: "victor", expr: "smug", x: -1.55, y: -2.6, s: 1.0 },
  { look: "poisson", expr: "grin", x: 0.0, y: -2.6, s: 1.0, pose: "cheer" },
  { look: "dealer", expr: "worried", x: 1.55, y: -2.6, s: 1.0 },
];
const Rig: React.FC = () => { const c = useThree((s) => s.camera) as THREE.PerspectiveCamera; useLayoutEffect(() => { c.fov = 34; c.position.set(0, -0.9, 13.5); c.lookAt(0, -0.95, 0); c.updateProjectionMatrix(); c.updateMatrixWorld(); }); return null; };
export const CharSheet: React.FC<{ only?: string }> = ({ only }) => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = f / 30;
  return (
    <AbsoluteFill style={{ background: "#e9dfc9" }}>
      <ThreeCanvas width={width} height={height} flat camera={{ fov: 34, position: [0, -0.9, 13.5] }} gl={{ antialias: true }}>
        <Rig /><color attach="background" args={["#e9dfc9"]} />
        {CAST.filter((c) => !only || c.look === only).map((c, i) => <Person2 key={i} look={c.look as any} expr={c.expr} t={t} position={[c.x, c.y, 0]} scale={c.s} seed={i + 2} pose={c.pose ?? "idle"} />)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
