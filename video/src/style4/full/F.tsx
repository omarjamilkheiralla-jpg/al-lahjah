import * as THREE from "three";
import React from "react";
import { cv } from "../../emu/world";
import { G, Mesh, V3, mix } from "../kit5";

/** STYLE 4 full-video kit: clean flat-shaded cartoon look (soft Lambert colours, almost no texture), like the reference reels. */
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
export const FL = (color: string, o: { emissive?: string; ei?: number; map?: THREE.Texture | null } = {}) => memo(`fl${color}|${o.emissive}|${o.ei}|${o.map ? o.map.uuid : ""}`, () => new THREE.MeshLambertMaterial({ color, emissive: o.emissive ?? "#000", emissiveIntensity: o.ei ?? 1, map: o.map ?? null }));
export const FB = (color: string) => memo(`fb${color}`, () => new THREE.MeshBasicMaterial({ color }));
const planks = (c1: string, c2: string, n = 8, ry = 1) => memo(`pl${c1}${c2}${n}${ry}`, () => { const t = cv(256, 256, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c1 : c2; g.fillRect(0, (i * h) / n, w, h / n); g.fillStyle = "rgba(40,20,10,.5)"; g.fillRect(0, (i * h) / n, w, 2); const x = ((i * 97) % 200) + 20; g.fillRect(x, (i * h) / n, 2, h / n); } }, true); t.repeat.set(2, ry); return t; });
const night = () => memo("nightsky", () => cv(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1a2a60"); gr.addColorStop(1, "#2c4285"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
const rainTex = () => memo("rain2", () => { const t = cv(256, 512, (g, w, h) => { g.clearRect(0, 0, w, h); let s = 13; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 110; i++) { const x = r() * w, y = r() * h, l = 40 + r() * 90; const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, "rgba(200,220,255,0)"); gr.addColorStop(1, `rgba(210,225,255,${0.3 + r() * 0.35})`); g.strokeStyle = gr; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + l); g.stroke(); } }, true); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
export const RainF: React.FC<{ p: V3; w: number; h: number; t: number; speed?: number }> = ({ p, w, h, t, speed = 1.6 }) => { const tx = rainTex(); tx.offset.y = -(t * speed) % 1; return <mesh position={p}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tx} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>; };

/* ------------------------------------------------------------------ people */
const HEMI = new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2);
export type Face = { skin: string; hair: string; top: string; pants?: string; cap?: string; stache?: boolean; curl?: boolean };
export const HERO: Face = { skin: "#f3c19a", hair: "#4a2c1c", top: "#d8332a", curl: true };
export const COUR: Face = { skin: "#e8b48c", hair: "#2a1c14", top: "#1c2a55", pants: "#151c33", cap: "#232d52", stache: true };
export const FaceHead: React.FC<{ f: Face; blink?: number; mouth?: number; look?: [number, number]; brow?: number; big?: number; ink?: boolean }> = ({ f, blink = 0, mouth = 0, look = [0, 0], brow = 0, big = 1 }) => {
  const sk = FL(f.skin); const eo = Math.max(0.08, 1 - blink);
  return (
    <group scale={big}>
      <Mesh g={G.sph(1, 48, 32)} m={sk} s={[0.2, 0.22, 0.2]} cast={false} />
      {[-1, 1].map((k) => <Mesh key={k} g={G.sph(1, 16, 12)} m={sk} p={[k * 0.2, -0.01, -0.01]} s={[0.035, 0.055, 0.04]} cast={false} />)}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.085, 0.03, 0.17]} scale={[1, eo, 1]}>
          <Mesh g={G.sph(1, 24, 16)} m={FL("#f4f4f4", { emissive: "#303030" })} s={[0.062, 0.066, 0.03]} cast={false} />
          <Mesh g={G.sph(1, 20, 14)} m={FB("#0a0a0e")} p={[look[0] * 0.02, look[1] * 0.02, 0.024]} s={[0.035, 0.038, 0.012]} cast={false} />
          <Mesh g={G.cap(0.004, 0.06)} m={FL("#2a1a14")} p={[k * 0.0, 0.088, 0.012]} r={[0, 0, Math.PI / 2 + k * brow]} cast={false} />
        </group>))}
      <Mesh g={G.sph(1, 14, 10)} m={FL("#e9aa86")} p={[0, -0.02, 0.2]} s={[0.026, 0.022, 0.02]} cast={false} />
      {f.stache ? <Mesh g={G.cap(0.012, 0.07)} m={FB("#161012")} p={[0, -0.08, 0.195]} r={[0, 0, Math.PI / 2]} cast={false} /> : null}
      <Mesh g={G.sph(1, 16, 12)} m={FB(mouth > 0.05 ? "#4a0e18" : "#7a2a2a")} p={[0, f.stache ? -0.115 : -0.1, 0.188]} s={[0.034, 0.008 + 0.034 * mouth, 0.012]} cast={false} />
      {f.cap ? <group><Mesh g={HEMI} m={FL(f.cap)} p={[0, 0.13, -0.005]} s={[0.215, 0.14, 0.215]} cast={false} /><Mesh g={G.cyl(0.2, 0.2, 0.022, 36)} m={FL(f.cap)} p={[0, 0.135, 0.06]} s={[1, 1, 0.8]} r={[0.1, 0, 0]} cast={false} /><Mesh g={G.box(0.06, 0.05, 0.012)} m={FL("#d8b040", { emissive: "#3a3010" })} p={[0, 0.22, 0.2]} cast={false} /></group> : null}
      {f.curl ? <group>{[[-0.12, 0.17], [-0.04, 0.2], [0.05, 0.2], [0.12, 0.17], [-0.17, 0.09], [0.17, 0.09], [0, 0.23], [-0.09, 0.22], [0.09, 0.22]].map(([x, y], i) => <Mesh key={i} g={G.sph(1, 14, 10)} m={FL(f.hair)} p={[x, y, 0.0 - Math.abs(x) * 0.15]} s={[0.07, 0.065, 0.075]} cast={false} />)}<Mesh g={G.sph(1, 28, 20)} m={FL(f.hair)} p={[0, 0.08, -0.04]} s={[0.208, 0.19, 0.19]} cast={false} /></group> : null}
    </group>
  );
};
/** Standing courier, full body (doorbell camera). */
export const Courier: React.FC<{ p: V3; yaw?: number; s?: number; mouth?: number; wave?: number; tilt?: number; box?: boolean; t: number }> = ({ p, yaw = 0, s = 1, mouth = 0, wave = 0, tilt = 0, box = false, t }) => {
  const top = FL(COUR.top), pants = FL(COUR.pants!), sk = FL(COUR.skin);
  const sway = Math.sin(t * 1.4) * 0.015;
  return (
    <group position={p} rotation={[0, yaw, sway]} scale={s}>
      {[-1, 1].map((k) => <group key={k}><Mesh g={G.cap(0.075, 0.55)} m={pants} p={[k * 0.1, 0.45, 0]} cast={false} /><Mesh g={G.sph(1, 14, 10)} m={FL("#0c0c10")} p={[k * 0.1, 0.06, 0.04]} s={[0.085, 0.055, 0.13]} cast={false} /></group>)}
      <Mesh g={G.cap(0.2, 0.42)} m={top} p={[0, 1.18, 0]} s={[1.08, 1, 0.78]} cast={false} />
      <Mesh g={G.box(0.07, 0.07, 0.012)} m={FL("#e0b438", { emissive: "#4a3a08" })} p={[-0.1, 1.28, 0.16]} cast={false} />
      <Mesh g={G.box(0.07, 0.12, 0.012)} m={FL("#10162e")} p={[0.12, 1.28, 0.16]} cast={false} />
      {[-1, 1].map((k) => { const raised = k < 0 ? wave : 0; return (
        <group key={k} position={[k * 0.27, 1.38, 0]} rotation={[0, 0, raised ? -(2.5 + Math.sin(t * 5) * 0.2) : k * (0.12 + 0.05 * Math.sin(t))]}>
          <Mesh g={G.cap(0.062, 0.42)} m={top} p={[0, -0.24, 0]} cast={false} /><Mesh g={G.sph(1, 14, 10)} m={sk} p={[0, -0.54, 0]} s={[0.065, 0.075, 0.045]} cast={false} />
        </group>); })}
      {box ? <Mesh g={G.rbox(0.42, 0.3, 0.32, 0.02)} m={FL("#c89a60")} p={[0, 0.98, 0.34]} cast={false} /> : null}
      <Mesh g={G.cyl(0.07, 0.08, 0.1, 18)} m={sk} p={[0, 1.6, 0]} cast={false} />
      <group position={[0, 1.8, 0]} rotation={[0, 0, tilt]}><FaceHead f={COUR} mouth={mouth} look={[0, 0]} /></group>
    </group>
  );
};

/* ------------------------------------------------------------------ rooms */
const Door: React.FC<{ p: V3; col?: string }> = ({ p, col = "#1f8f72" }) => (
  <group position={p}>
    <Mesh g={G.box(1.2, 2.3, 0.05)} m={FL("#f2ece0")} p={[0, 1.15, -0.02]} cast={false} />
    <Mesh g={G.box(1.0, 2.14, 0.07)} m={FL(col)} p={[0, 1.08, 0.01]} cast={false} />
    {[[0, 1.58, 0.74, 0.74], [0, 0.55, 0.74, 0.74]].map(([x, y, w, h], i) => <Mesh key={i} g={G.box(w, h, 0.02)} m={FL("#16705a")} p={[x, y, 0.05]} cast={false} />)}
    <Mesh g={G.cyl(0.035, 0.035, 0.06, 16)} m={FL("#d0a040", { emissive: "#3a2a08" })} p={[0.38, 1.0, 0.08]} r={[Math.PI / 2, 0, 0]} cast={false} />
    <Mesh g={G.cyl(0.02, 0.02, 0.05, 12)} m={FL("#d0a040")} p={[0.38, 1.22, 0.07]} r={[Math.PI / 2, 0, 0]} cast={false} />
  </group>
);
export const LivingF: React.FC<{ t: number; dark?: number }> = React.memo(({ t, dark = 0 }) => {
  const tvC = dark ? "#3a4a90" : "#e8f0ff"; const wall = dark ? "#6a74c0" : "#d2bc98";
  return (
    <group>
      <Mesh g={G.box(8, 0.1, 8)} m={FL("#ffffff", { map: planks("#c08850", "#b07a46", 10, 2) })} p={[0, -0.05, 0]} cast={false} />
      <Mesh g={G.box(8, 2.7, 0.1)} m={FL(wall)} p={[0, 1.35, -3.5]} cast={false} />
      <Mesh g={G.box(0.1, 2.7, 8)} m={FL(wall)} p={[-4, 1.35, 0]} cast={false} /><Mesh g={G.box(0.1, 2.7, 8)} m={FL(wall)} p={[4, 1.35, 0]} cast={false} />
      <Mesh g={G.box(8, 0.1, 8)} m={FL("#efe6d6")} p={[0, 2.72, 0]} cast={false} />
      <Mesh g={G.box(8, 0.5, 0.06)} m={FL("#ece4d2")} p={[0, 0.25, -3.44]} cast={false} />
      <Mesh g={G.cyl(0.4, 0.4, 0.05, 28)} m={FL("#fff2d0", { emissive: "#ffe8a8", ei: 1.4 })} p={[0.4, 2.68, -1.2]} cast={false} />
      {/* window + red curtain, left wall */}
      <group position={[-3.93, 1.55, -1.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><planeGeometry args={[1.6, 1.4]} /><meshBasicMaterial map={night()} /></mesh><RainF p={[0, 0, 0.01]} w={1.6} h={1.4} t={t} speed={1.1} />
        <Mesh g={G.box(1.8, 0.07, 0.1)} m={FL("#f2ece0")} p={[0, 0.74, 0.03]} cast={false} /><Mesh g={G.box(1.8, 0.07, 0.1)} m={FL("#f2ece0")} p={[0, -0.74, 0.03]} cast={false} /><Mesh g={G.box(0.05, 1.5, 0.1)} m={FL("#f2ece0")} p={[0, 0, 0.03]} cast={false} />
        <Mesh g={G.box(0.5, 1.9, 0.12)} m={FL("#b0262c")} p={[-0.95, -0.05, 0.12]} cast={false} />
      </group>
      {/* TV */}
      <group position={[-1.7, 0, -3.2]}><Mesh g={G.box(1.8, 0.55, 0.45)} m={FL("#8a5a34")} p={[0, 0.28, 0]} cast={false} /><Mesh g={G.box(1.25, 0.72, 0.06)} m={FL("#14161c")} p={[0, 1.0, 0]} cast={false} /><mesh position={[0, 1.0, 0.04]}><planeGeometry args={[1.18, 0.65]} /><meshBasicMaterial color={tvC} /></mesh></group>
      <Door p={[1.9, 0, -3.43]} />
      <Mesh g={G.cyl(0.07, 0.06, 0.4, 16)} m={FL("#17171c")} p={[1.15, 0.2, -3.2]} cast={false} /><Mesh g={G.cap(0.012, 0.5)} m={FL("#d8332a")} p={[1.15, 0.65, -3.2]} cast={false} />
      <Mesh g={G.box(1.0, 0.03, 0.6)} m={FL("#3a3a40")} p={[1.9, 0.02, -2.9]} cast={false} />
      <Mesh g={G.box(0.44, 0.34, 0.03)} m={FL("#e2a838")} p={[-0.2, 1.8, -3.43]} cast={false} /><Mesh g={G.box(0.26, 0.24, 0.03)} m={FL("#5aa0c8")} p={[0.2, 1.95, -3.43]} cast={false} />
      {/* rug + coffee table + mug */}
      <Mesh g={G.box(4.2, 0.03, 3.2)} m={FL("#c04a38")} p={[0, 0.02, -0.4]} cast={false} />
      <group position={[0, 0, -0.5]}><Mesh g={G.box(1.5, 0.08, 0.85)} m={FL("#8c5e3a")} p={[0, 0.48, 0]} cast={false} />{[-0.65, 0.65].map((x) => [-0.32, 0.32].map((z) => <Mesh key={`${x}${z}`} g={G.box(0.08, 0.46, 0.08)} m={FL("#6a442a")} p={[x, 0.23, z]} cast={false} />))}<Mesh g={G.cyl(0.07, 0.06, 0.12, 20)} m={FL("#f6f6f2")} p={[0.5, 0.58, 0.1]} cast={false} /><Mesh g={G.box(0.3, 0.03, 0.2)} m={FL("#d02a2a")} p={[-0.35, 0.53, 0.0]} cast={false} /></group>
      {/* lamp + side table */}
      <group position={[3.0, 0, -2.6]}><Mesh g={G.box(0.5, 0.6, 0.5)} m={FL("#7a4a2c")} p={[0, 0.3, 0]} cast={false} /><Mesh g={G.cyl(0.02, 0.02, 0.5, 10)} m={FL("#2a2a2e")} p={[0, 0.85, 0]} cast={false} /><Mesh g={G.cyl(0.14, 0.2, 0.3, 24)} m={FL(dark ? "#8a7a60" : "#fff0c0", { emissive: dark ? "#000" : "#ffc060", ei: 1 })} p={[0, 1.2, 0]} cast={false} />{dark ? null : <pointLight position={[0, 1.2, 0.3]} color="#ffb860" intensity={8} distance={9} />}</group>
      <Mesh g={G.box(2.6, 0.55, 1.0)} m={FL("#6a3a30")} p={[0, 0.28, 2.7]} cast={false} /><Mesh g={G.box(2.6, 0.8, 0.3)} m={FL("#5a302a")} p={[0, 0.8, 3.15]} cast={false} />
      <hemisphereLight args={[dark ? "#7a84d8" : "#fff0dc", dark ? "#34306a" : "#6a4a30", dark ? 1.9 : 1.2]} />
      {dark ? null : <pointLight position={[-1.7, 1.4, -2.2]} color="#aac8ff" intensity={6} distance={7} />}
    </group>
  );
});
/** Dark back room with bookshelf, blue sofa, orange package, and a glass back door. */
export const BackRoomF: React.FC<{ t: number; light?: number }> = React.memo(({ t, light = 0 }) => (
  <group>
    <Mesh g={G.box(7, 0.1, 9)} m={FL("#ffffff", { map: planks("#6a4a3a", "#5e4034", 10, 2) })} p={[0, -0.05, -1]} cast={false} />
    <Mesh g={G.box(7, 2.7, 0.1)} m={FL("#7c7aa0")} p={[0, 1.35, -5.5]} cast={false} /><Mesh g={G.box(0.1, 2.7, 9)} m={FL("#7c7aa0")} p={[-3.5, 1.35, -1]} cast={false} /><Mesh g={G.box(0.1, 2.7, 9)} m={FL("#7c7aa0")} p={[3.5, 1.35, -1]} cast={false} /><Mesh g={G.box(7, 0.1, 9)} m={FL("#58587c")} p={[0, 2.72, -1]} cast={false} />
    <group position={[0, 1.3, -5.44]}><mesh><planeGeometry args={[1.5, 1.6]} /><meshBasicMaterial map={night()} /></mesh><RainF p={[0, 0, 0.01]} w={1.5} h={1.6} t={t} /><Mesh g={G.box(1.64, 0.08, 0.1)} m={FL("#2a2a3c")} p={[0, 0.84, 0.02]} cast={false} /><Mesh g={G.box(1.64, 0.08, 0.1)} m={FL("#2a2a3c")} p={[0, -0.84, 0.02]} cast={false} /><Mesh g={G.box(0.08, 1.7, 0.1)} m={FL("#2a2a3c")} p={[-0.8, 0, 0.02]} cast={false} /><Mesh g={G.box(0.08, 1.7, 0.1)} m={FL("#2a2a3c")} p={[0.8, 0, 0.02]} cast={false} /><Mesh g={G.box(0.05, 1.7, 0.1)} m={FL("#2a2a3c")} p={[0.05, 0, 0.02]} cast={false} /></group>
    <group position={[-3.38, 0, -2.4]}><Mesh g={G.box(0.4, 2.3, 2.4)} m={FL("#4a3030")} p={[0, 1.15, 0]} cast={false} />{[0.5, 1.1, 1.7].map((y, i) => <group key={i}>{Array.from({ length: 9 }, (_, k) => <Mesh key={k} g={G.box(0.3, 0.38, 0.1)} m={FL(["#a83a3a", "#3a6aa8", "#c8a43a", "#4a8a5a", "#7a4a8a"][(k + i) % 5])} p={[0.12, y, -1.0 + k * 0.24]} cast={false} />)}</group>)}</group>
    <Mesh g={G.box(2.0, 0.5, 1.0)} m={FL("#3a4c98")} p={[2.3, 0.25, -2.6]} cast={false} /><Mesh g={G.box(2.0, 0.7, 0.28)} m={FL("#34448a")} p={[2.3, 0.75, -3.1]} cast={false} />
    <Mesh g={G.rbox(0.5, 0.34, 0.4, 0.02)} m={FL("#c8742c")} p={[2.0, 0.7, -2.5]} cast={false} />
    <hemisphereLight args={["#5a66b0", "#20182c", 0.95 + light * 0.4]} />
    <pointLight position={[0, 1.4, -4.8]} color="#8aa8ff" intensity={4} distance={6} />
  </group>
));
export const PorchF: React.FC<{ t: number }> = React.memo(({ t }) => (
  <group>
    <Mesh g={G.box(12, 0.14, 7)} m={FL("#ffffff", { map: planks("#8a6a4a", "#7c5e42", 7, 1.6) })} p={[0, -0.07, 3]} cast={false} />
    <Mesh g={G.box(40, 0.1, 50)} m={FL("#162a22")} p={[0, -0.3, 30]} cast={false} />
    <Mesh g={G.box(12, 4, 0.2)} m={FL("#8a96a8")} p={[0, 2, -0.6]} cast={false} />
    <Mesh g={G.box(0.5, 4.2, 0.5)} m={FL("#d8d4cc")} p={[-3.2, 2.1, 1.8]} cast={false} /><Mesh g={G.box(0.5, 4.2, 0.5)} m={FL("#d8d4cc")} p={[3.4, 2.1, 1.8]} cast={false} />
    <Mesh g={G.box(8, 0.3, 4.4)} m={FL("#cfc8b8")} p={[0, 4.15, 1.6]} cast={false} />
    <mesh position={[0, 3.98, 1.5]}><cylinderGeometry args={[0.35, 0.35, 0.06, 24]} /><meshBasicMaterial color="#fff2c8" /></mesh>
    <Mesh g={G.box(2.4, 1.6, 0.1)} m={FL("#161c30")} p={[-3.8, 2.2, -0.45]} cast={false} />
    <Mesh g={G.box(60, 14, 0.5)} m={FL("#24407a")} p={[0, 5, 12]} cast={false} /><Mesh g={G.box(5, 3, 0.5)} m={FL("#162a55")} p={[-5, 1.5, 11.6]} cast={false} /><Mesh g={G.box(4, 4, 0.5)} m={FL("#162a55")} p={[6, 2, 11.6]} cast={false} />
    <spotLight position={[0, 3.9, 1.5]} angle={1.0} penumbra={0.7} intensity={70} color="#ffe0a8" distance={12} target-position={[0, 0, 4]} />
    <hemisphereLight args={["#6a82c8", "#2a3040", 1.7]} /><pointLight position={[0.3, 1.9, 0.4]} color="#b8c8ff" intensity={9} distance={9} />
    <RainF p={[0, 2, 3]} w={7} h={5} t={t} speed={2.2} /><RainF p={[0, 2, 5.5]} w={10} h={6} t={t * 1.1 + 0.4} speed={2.4} />
  </group>
));
/** First-person hands holding the phone (flat cartoon). */
export const PovF: React.FC<{ dark?: number; drop?: number; sway?: number }> = ({ dark = 0, drop = 0, sway = 0 }) => {
  const sleeve = FL(dark ? "#a02a30" : "#d8332a"); const sk = FL(dark ? "#c8b0b8" : "#f3c19a", { emissive: dark ? "#2a2a60" : "#3a1c10", ei: 0.4 });
  return (
    <group position={[sway * 0.01, -0.125 - drop * 0.05, -0.4]} rotation={[0.5 + drop * 0.2, 0, 0]}>
      <Mesh g={G.rbox(0.07, 0.15, 0.012, 0.01)} m={FL("#111114")} cast={false} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <Mesh g={G.cap(0.011, 0.04)} m={sk} p={[k * 0.026, -0.046, 0.011]} r={[0.2, 0, k * 0.45]} cast={false} />
          <Mesh g={G.sph(1, 12, 10)} m={FL(dark ? "#d8c8f0" : "#ffe0cc")} p={[k * 0.0185, -0.0185, 0.017]} s={[0.006, 0.008, 0.003]} r={[0, 0, k * 0.45]} cast={false} />
          <Mesh g={G.sph(1, 20, 14)} m={sk} p={[k * 0.052, -0.075, 0.0]} s={[0.022, 0.034, 0.02]} cast={false} />
          <Mesh g={G.cap(0.032, 0.3)} m={sleeve} p={[k * 0.1, -0.22, -0.01]} r={[0.3, 0, -k * 0.5]} cast={false} />
        </group>))}
    </group>
  );
};
