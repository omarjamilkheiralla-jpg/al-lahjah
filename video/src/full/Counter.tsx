import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { cv } from "../emu/world";
import { Person2 } from "./person";
import { PostFX } from "../hotel/PostFX";
import { loadFonts } from "./fonts";
import type { Expr } from "./paint";

/** Cashier-counter test set: warm pendant lamp, green clapboard + wood wainscot, speckled counter, pegboard, lottery board, blurred background. */
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const rnd = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const T = {
  clap: () => cv(512, 512, (g, w, h) => { g.fillStyle = "#6a9560"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 64) { g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, y + 58, w, 6); g.fillStyle = "rgba(255,255,255,.1)"; g.fillRect(0, y, w, 4); } const r = rnd(2); for (let i = 0; i < 1800; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.05)"; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); } }, true),
  wood: () => cv(512, 512, (g, w, h) => { const r = rnd(5); for (let i = 0; i < 6; i++) { const v = 176 + r() * 40; g.fillStyle = `rgb(${v},${v * 0.76},${v * 0.42})`; g.fillRect(i * 86, 0, 86, h); g.fillStyle = "rgba(60,30,10,.5)"; g.fillRect(i * 86, 0, 3, h); for (let k = 0; k < 24; k++) { g.strokeStyle = `rgba(80,40,10,${0.06 + r() * 0.1})`; g.lineWidth = 1 + r() * 2; const x = i * 86 + r() * 86; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 12, h * 0.3, x + (r() - 0.5) * 12, h * 0.7, x + (r() - 0.5) * 8, h); g.stroke(); } if (r() < 0.7) { const kx = i * 86 + 20 + r() * 46, ky = r() * h; g.fillStyle = "rgba(90,45,15,.55)"; g.beginPath(); g.ellipse(kx, ky, 9, 14, 0, 0, 7); g.fill(); } } }, true),
  counter: () => cv(512, 512, (g, w, h) => { g.fillStyle = "#8c8c94"; g.fillRect(0, 0, w, h); const r = rnd(8); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(255,255,255,${0.35 + r() * 0.3})`; g.lineWidth = 2; const x = r() * w, y = r() * h; g.beginPath(); g.arc(x, y, 6 + r() * 7, r() * 6, r() * 6 + 2.2); g.stroke(); } for (let i = 0; i < 2000; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,.07)" : "rgba(255,255,255,.1)"; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, true),
  tiles: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#e9e2d0"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,80,60,.5)"; g.lineWidth = 4; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } const r = rnd(4); for (let i = 0; i < 700; i++) { g.fillStyle = "rgba(90,70,40,.06)"; g.fillRect(r() * w, r() * h, 2, 2); } }, true),
  peg: () => cv(512, 512, (g, w, h) => { g.fillStyle = "#b98a52"; g.fillRect(0, 0, w, h); for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) { g.fillStyle = "rgba(60,30,10,.55)"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } const r = rnd(3); const cols = ["#e8546a", "#3fa3d8", "#f2c53d", "#58b86a", "#c46ad8", "#fff"]; for (let ry = 0; ry < 5; ry++) for (let cx2 = 0; cx2 < 5; cx2++) { const x = 30 + cx2 * 94, y = 40 + ry * 92; g.fillStyle = "#f4f0e4"; g.fillRect(x, y, 56, 72); g.strokeStyle = "#2a1a1e"; g.lineWidth = 4; g.strokeRect(x, y, 56, 72); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.ellipse(x + 28, y + 40, 20, 9, 0.5, 0, 7); g.fill(); g.stroke(); } }, false),
  board: () => cv(512, 512, (g, w, h) => { g.fillStyle = "#2a2a36"; g.fillRect(0, 0, w, h); const cols = ["#f2c53d", "#e8546a", "#3fa3d8", "#58b86a", "#c46ad8"]; for (let ry = 0; ry < 4; ry++) for (let cx2 = 0; cx2 < 5; cx2++) { const x = 20 + cx2 * 96, y = 24 + ry * 118; g.fillStyle = cols[(ry + cx2) % cols.length]; g.fillRect(x, y, 80, 100); g.fillStyle = "#1a1a24"; g.beginPath(); g.arc(x + 40, y + 46, 24, 0, 7); g.fill(); g.fillStyle = "#fff"; g.fillRect(x + 8, y + 82, 64, 10); } }, false),
  glow: () => cv(256, 256, (g, w, h) => { const gr = g.createRadialGradient(128, 128, 4, 128, 128, 128); gr.addColorStop(0, "rgba(255,236,170,1)"); gr.addColorStop(0.25, "rgba(255,220,140,.55)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false),
  screen: () => cv(256, 128, (g, w, h) => { g.fillStyle = "#0f2a2a"; g.fillRect(0, 0, w, h); g.fillStyle = "#58f0d0"; g.font = "700 46px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("READY", w / 2, h / 2); }, false),
  sign: () => cv(512, 128, (g, w, h) => { g.fillStyle = "#f4ecd6"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a2a1e"; g.lineWidth = 10; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = "#c8402a"; g.font = "78px Rye, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LOTTERY", w / 2, h / 2 + 4); }, false),
};
const tx = (n: keyof typeof T, rx = 1, ry = 1) => memo(`tx${n}${rx}${ry}`, () => { const t = T[n](); t.repeat.set(rx, ry); t.needsUpdate = true; return t; });
const M = (c: string, map?: THREE.Texture, rough = 0.8, em?: string, ei = 1) => memo(`m${c}${map?.uuid}${rough}${em}${ei}`, () => new THREE.MeshStandardMaterial({ color: c, map: map ?? null, roughness: rough, emissive: em ?? "#000", emissiveIntensity: ei }));
const B = (w: number, h: number, d: number) => memo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const Bx: React.FC<{ g: [number, number, number]; p: [number, number, number]; m: THREE.Material; r?: [number, number, number] }> = ({ g, p, m, r }) => <mesh geometry={B(...g)} material={m} position={p} rotation={r} castShadow receiveShadow />;

const Set: React.FC<{ t: number }> = ({ t }) => {
  const flick = 0.96 + 0.04 * Math.sin(t * 9);
  return (
    <group>
      {/* walls */}
      <Bx g={[8, 1.5, 0.2]} p={[0, 0.75, -2.2]} m={M("#ffffff", tx("wood", 4, 1.2), 0.65)} />
      <Bx g={[8, 1.7, 0.2]} p={[0, 2.35, -2.2]} m={M("#ffffff", tx("clap", 3, 1.6), 0.9)} />
      <Bx g={[8, 0.1, 0.26]} p={[0, 1.55, -2.12]} m={M("#6a4a2a", undefined, 0.6)} />
      <Bx g={[8, 0.12, 0.3]} p={[0, 0.06, -2.1]} m={M("#4a3220", undefined, 0.7)} />
      <Bx g={[0.2, 3.2, 8]} p={[-3.6, 1.6, 0]} m={M("#86ad78", undefined, 0.9)} />
      <Bx g={[0.2, 3.2, 8]} p={[3.6, 1.6, 0]} m={M("#86ad78", undefined, 0.9)} />
      <Bx g={[8, 0.1, 8]} p={[0, 3.2, 0]} m={M("#ffffff", tx("tiles", 3, 3), 0.9)} />
      <Bx g={[8, 0.1, 8]} p={[0, -0.05, 0]} m={M("#3a3a42", undefined, 0.6)} />
      <Bx g={[8, 0.04, 8]} p={[0, 0.0, 0]} m={M("#c7b8a0", tx("tiles", 3, 3), 0.8)} />
      {/* lottery board, sign, pegboard, poster */}
      <Bx g={[1.25, 1.0, 0.08]} p={[-2.1, 2.0, -2.06]} m={M("#ffffff", tx("board"), 0.7)} />
      <Bx g={[1.35, 1.1, 0.06]} p={[-2.1, 2.0, -2.1]} m={M("#4a3220", undefined, 0.7)} />
      <Bx g={[1.5, 0.42, 0.1]} p={[-1.55, 2.9, -2.05]} m={M("#ffffff", tx("sign"), 0.6)} />
      <Bx g={[1.7, 1.45, 0.08]} p={[2.1, 1.9, -2.06]} m={M("#ffffff", tx("peg"), 0.8)} />
      <Bx g={[1.8, 1.55, 0.06]} p={[2.1, 1.9, -2.1]} m={M("#5a3a22", undefined, 0.7)} />
      <Bx g={[0.55, 0.7, 0.05]} p={[0.9, 2.3, -2.06]} m={M("#f4f0e4", undefined, 0.8)} />
      <Bx g={[0.4, 0.4, 0.06]} p={[0.9, 2.35, -2.03]} m={M("#d8483a", undefined, 0.8)} />
      {/* counter */}
      <Bx g={[3.6, 0.1, 1.1]} p={[0, 0.76, 0.25]} m={M("#ffffff", tx("counter", 2.4, 0.8), 0.6)} />
      <Bx g={[3.6, 0.72, 0.12]} p={[0, 0.38, 0.78]} m={M("#ffffff", tx("wood", 3, 0.7), 0.7)} />
      <Bx g={[3.7, 0.06, 0.18]} p={[0, 0.76, 0.82]} m={M("#7a5a32", undefined, 0.6)} />
      <Bx g={[0.7, 0.35, 0.5]} p={[-1.3, 0.99, 0.1]} m={M("#c8c0a0", undefined, 0.6)} />
      <Bx g={[0.62, 0.16, 0.02]} p={[-1.3, 1.1, 0.36]} m={M("#ffffff", tx("screen"), 0.3, "#58f0d0", 0.9)} />
      <Bx g={[0.5, 0.02, 0.38]} p={[1.1, 0.82, 0.4]} m={M("#2a5aa0", undefined, 0.8)} />
      <Bx g={[0.34, 0.5, 0.01]} p={[0.35, 0.83, 0.5]} m={M("#f2c53d", undefined, 0.5)} r={[-1.45, 0, 0.1]} />
      {/* pendant lamp */}
      <group position={[-0.2, 2.45, -0.2]}>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.006, 0.006, 1.0, 6]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
        <mesh><coneGeometry args={[0.38, 0.28, 28, 1, true]} /><meshStandardMaterial color="#1f5a3a" side={THREE.DoubleSide} roughness={0.5} emissive="#0a2a18" emissiveIntensity={0.6} /></mesh>
        <mesh position={[0, -0.1, 0]}><sphereGeometry args={[0.07, 14, 10]} /><meshBasicMaterial color="#fff6d8" /></mesh>
        <mesh position={[0, -0.12, 0.2]}><planeGeometry args={[1.8 * flick, 1.8 * flick]} /><meshBasicMaterial map={tx("glow")} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.4} /></mesh>
        <pointLight position={[0, -0.25, 0.2]} color="#ffdca0" intensity={13 * flick} distance={9} decay={1.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      </group>
      <hemisphereLight args={["#a8c8a0", "#4a3a28", 0.32]} />
    </group>
  );
};
const Rig: React.FC<{ p: [number, number, number]; l: [number, number, number]; fov: number }> = ({ p, l, fov }) => { const c = useThree((s) => s.camera) as THREE.PerspectiveCamera; useLayoutEffect(() => { c.fov = fov; c.near = 0.1; c.far = 60; c.updateProjectionMatrix(); c.position.set(...p); c.lookAt(...l); c.updateMatrixWorld(); }); return null; };

export const Counter: React.FC<{ look?: string; expr?: Expr; shot?: string }> = ({ look = "kyle", expr = "deadpan", shot = "close" }) => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = f / 30;
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  if (!ok) return <AbsoluteFill style={{ background: "#2a3a2a" }} />;
  const cam = shot === "med" ? { p: [0.3, 1.6, 4.4] as [number, number, number], l: [0, 1.32, -0.4] as [number, number, number], fov: 36 } : shot === "wide" ? { p: [0.35, 1.75, 4.9] as [number, number, number], l: [0, 1.45, -0.5] as [number, number, number], fov: 40 } : { p: [0.1, 1.85, 3.0] as [number, number, number], l: [0, 1.78, -0.45] as [number, number, number], fov: 34 };
  const focus = new THREE.Vector3(...cam.p).distanceTo(new THREE.Vector3(0, 1.7, -0.45));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, position: cam.p }} gl={{ antialias: true }}>
        <Rig {...cam} /><color attach="background" args={["#243428"]} /><fog attach="fog" args={["#2a3a2c", 9, 22]} />
        <Set t={t} />
        <Person2 look={look as any} expr={expr} t={t} position={[0, 0, -0.45]} scale={1.0} seed={3} tint="#fff1d8" still pose="hold" />
        <PostFX focus={focus} range={1.6} bokeh={3.4} frame={f} grain={0.25} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(8,14,10,.55) 100%)" }} />
    </AbsoluteFill>
  );
};
