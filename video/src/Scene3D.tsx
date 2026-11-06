import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// IMPORTANT: drive all animation from useCurrentFrame(), never from
// useFrame()/requestAnimationFrame, so every render is deterministic.
const Shape: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({ frame, fps, config: { damping: 12 } });
  const rotY = interpolate(frame, [0, 240], [0, Math.PI * 4]);
  const rotX = interpolate(frame, [0, 240], [0.3, Math.PI * 1.5]);
  const float = Math.sin(frame / 15) * 0.25;

  return (
    <group position={[0, float, 0]} scale={appear}>
      <mesh rotation={[rotX, rotY, 0]}>
        <torusKnotGeometry args={[1, 0.34, 220, 32]} />
        <meshStandardMaterial color={accent} metalness={0.6} roughness={0.25} />
      </mesh>
    </group>
  );
};

export const Scene3D: React.FC<{ accent: string }> = ({ accent }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} />
      <pointLight position={[-5, -2, 3]} intensity={30} color="#4cc9f0" />
      <Shape accent={accent} />
    </ThreeCanvas>
  );
};
