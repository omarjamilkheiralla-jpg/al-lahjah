import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";

export const SceneEnv: React.FC<{ bg: string; fog?: [string, number, number] }> = ({ bg, fog }) => {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.background = new THREE.Color(bg);
    scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
  });
  return null;
};

export const Lights: React.FC<{
  color?: string; intensity?: number; pos?: [number, number, number]; hemi?: [string, string, number];
  shadowSize?: number; extra?: React.ReactNode;
}> = ({ color = "#ffdca8", intensity = 2.6, pos = [-9, 16, 11], hemi = ["#bfe3ff", "#c89a78", 1.15], shadowSize = 18, extra }) => (
  <>
    <hemisphereLight args={hemi} />
    <directionalLight
      position={pos} intensity={intensity} color={color} castShadow shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-shadowSize} shadow-camera-right={shadowSize} shadow-camera-top={shadowSize + 4} shadow-camera-bottom={-8}
      shadow-camera-near={1} shadow-camera-far={70} shadow-bias={-0.0004}
    />
    {extra}
  </>
);
