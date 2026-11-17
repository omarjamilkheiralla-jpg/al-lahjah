import * as THREE from "three";
import React from "react";
import { cv } from "../emu/world";
import { seeded } from "../style3/kit";
import { G, MS, MB, Mesh, tex, type V3 } from "./kit5";

const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const nightTex = () => memo("night", () => cv(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0b1530"); gr.addColorStop(1, "#243556"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = seeded(4); for (let i = 0; i < 26; i++) { const x = r() * w, y = h * 0.55 + r() * h * 0.4; const rg = g.createRadialGradient(x, y, 0, x, y, 14 + r() * 16); const c = r() < 0.5 ? "255,214,140" : "255,170,110"; rg.addColorStop(0, `rgba(${c},.9)`); rg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = rg; g.fillRect(x - 40, y - 40, 80, 80); } g.fillStyle = "rgba(10,14,28,.9)"; for (let i = 0; i < 9; i++) { const x = i * 60 + r() * 20; g.fillRect(x, h * 0.62 + r() * 30, 50, h); } }));
const rainTex = () => memo("rain", () => { const t = cv(256, 512, (g, w, h) => { g.clearRect(0, 0, w, h); const r = seeded(13); for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, l = 40 + r() * 90; const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, "rgba(200,220,255,0)"); gr.addColorStop(1, `rgba(200,220,255,${0.25 + r() * 0.3})`); g.strokeStyle = gr; g.lineWidth = 1.2 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + l); g.stroke(); } }, true); return t; });
export const Rain: React.FC<{ p: V3; w: number; h: number; t: number; rot?: V3; speed?: number }> = ({ p, w, h, t, rot, speed = 1.4 }) => { const tx = rainTex(); tx.offset.y = -(t * speed) % 1; return <mesh position={p} rotation={rot}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tx} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>; };
const Frame: React.FC<{ p: V3; w: number; h: number; c: string; r?: V3 }> = ({ p, w, h, c, r }) => <group position={p} rotation={r}><Mesh g={G.box(w + 0.06, h + 0.06, 0.03)} m={MS("#5a4030", { map: "wood", rough: 0.6 })} /><Mesh g={G.box(w, h, 0.034)} m={MS(c, { rough: 0.9 })} /></group>;
const Book: React.FC<{ p: V3; c: string; h: number }> = ({ p, c, h }) => <Mesh g={G.box(0.035, h, 0.18)} m={MS(c, { rough: 0.8 })} p={p} />;

export const Door: React.FC<{ p: V3; lock?: number }> = React.memo(({ p, lock = 0 }) => (
  <group position={p}>
    <Mesh g={G.box(1.02, 2.1, 0.06)} m={MS("#2a8a6a", { map: "door", rough: 0.55 })} p={[0, 1.05, 0]} />
    <Mesh g={G.box(1.12, 2.18, 0.04)} m={MS("#e8dcc8", { map: "plaster", rough: 0.8 })} p={[0, 1.09, -0.03]} />
    <Mesh g={G.box(0.26, 0.5, 0.012)} m={MB("#f6e7b0")} p={[0, 1.55, 0.034]} cast={false} />
    <Mesh g={G.cyl(0.04, 0.04, 0.05, 20)} m={MS("#c9a24a", { metal: 0.8, rough: 0.3 })} p={[0.36, 1.0, 0.05]} r={[Math.PI / 2, 0, 0]} />
    <Mesh g={G.cyl(0.026, 0.026, 0.04, 16)} m={MS("#d0b060", { metal: 0.8, rough: 0.3 })} p={[0.36, 1.2, 0.05]} r={[Math.PI / 2, 0, 0]} />
    <Mesh g={G.box(0.016, 0.07, 0.03)} m={MS("#bcae80", { metal: 0.8, rough: 0.3 })} p={[0.36, 1.2, 0.075]} r={[0, 0, lock]} />
    <Mesh g={G.box(0.14, 0.012, 0.012)} m={MS("#c8c8c8", { metal: 0.8, rough: 0.3 })} p={[0.18, 1.4, 0.04]} />
  </group>
));
export const LivingRoom: React.FC<{ t: number; dim?: number }> = ({ t, dim = 1 }) => {
  const flick = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 5.3);
  return (
    <group>
      <Mesh g={G.box(8, 0.1, 7)} m={MS("#ffffff", { map: "wood", rx: 4, ry: 3.5, rough: 0.55 })} p={[0, -0.05, -0.2]} />
      <Mesh g={G.box(8, 2.7, 0.1)} m={MS("#d8c8b0", { map: "wallpaper", rx: 3, ry: 1.3 })} p={[0, 1.35, -3.5]} />
      <Mesh g={G.box(0.1, 2.7, 7)} m={MS("#d8c8b0", { map: "wallpaper", rx: 3, ry: 1.3 })} p={[4, 1.35, -0.2]} />
      <Mesh g={G.box(0.1, 2.7, 7)} m={MS("#d8c8b0", { map: "wallpaper", rx: 3, ry: 1.3 })} p={[-4, 1.35, -0.2]} />
      <Mesh g={G.box(8, 0.1, 7)} m={MS("#e8e0d0", { map: "plaster" })} p={[0, 2.72, -0.2]} />
      <Mesh g={G.box(8, 0.12, 0.05)} m={MS("#f0e8d8", { map: "plaster" })} p={[0, 0.07, -3.44]} /><Mesh g={G.box(8, 0.12, 0.05)} m={MS("#f0e8d8", { map: "plaster" })} p={[0, 2.62, -3.44]} />
      {/* window with night + rain (left wall) */}
      <group position={[-3.93, 1.5, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><planeGeometry args={[1.8, 1.5]} /><meshBasicMaterial map={nightTex()} /></mesh>
        <Rain p={[0, 0, 0.01]} w={1.8} h={1.5} t={t} speed={1.1} />
        {[[0, 0.78, 1.9, 0.06], [0, -0.78, 1.9, 0.06]].map((q, i) => <Mesh key={i} g={G.box(q[2], q[3], 0.1)} m={MS("#f2eadc", { map: "plaster" })} p={[q[0], q[1], 0.02]} />)}
        {[-0.93, 0.93, 0].map((x, i) => <Mesh key={i} g={G.box(i === 2 ? 0.05 : 0.07, 1.6, 0.1)} m={MS("#f2eadc", { map: "plaster" })} p={[x, 0, 0.02]} />)}
        <Mesh g={G.box(2.1, 0.06, 0.2)} m={MS("#f2eadc", { map: "plaster" })} p={[0, -0.82, 0.08]} />
      </group>
      <Mesh g={G.box(1.9, 2.6, 0.05)} m={MS("#6a2a2a", { map: "knit", rx: 3, ry: 3, rough: 0.95 })} p={[-3.88, 1.35, -0.6]} />
      {/* TV */}
      <group position={[-1.0, 0, -3.2]}>
        <Mesh g={G.box(1.7, 0.5, 0.45)} m={MS("#5a3c28", { map: "wood", rough: 0.55 })} p={[0, 0.25, 0]} />
        <Mesh g={G.box(1.3, 0.76, 0.06)} m={MS("#0c0d10", { rough: 0.3 })} p={[0, 1.0, 0]} />
        <mesh position={[0, 1.0, 0.036]}><planeGeometry args={[1.22, 0.68]} /><meshBasicMaterial color={new THREE.Color(0.2 * flick, 0.45 * flick, 0.95 * flick)} /></mesh>
        <pointLight position={[0, 1.0, 0.8]} color="#5a8cff" intensity={9 * dim * flick} distance={9} />
        <Mesh g={G.box(0.5, 0.24, 0.3)} m={MS("#1c1c22")} p={[0.5, 0.62, 0.0]} cast={false} />
      </group>
      <Door p={[2.2, 0, -3.43]} />
      <Mesh g={G.box(1.3, 0.04, 0.7)} m={MS("#6a4a3a", { map: "wood", rough: 0.6 })} p={[2.2, 0.02, -2.9]} />
      {/* rug, table, mug, sofa */}
      <Mesh g={G.box(3.6, 0.025, 2.6)} m={MS("#ffffff", { map: "rug", rough: 0.95 })} p={[0.2, 0.013, -0.9]} />
      <group position={[0.2, 0, -1.1]}><Mesh g={G.box(1.3, 0.05, 0.7)} m={MS("#8a5a38", { map: "wood", rx: 1, ry: 1, rough: 0.5 })} p={[0, 0.42, 0]} />{[-0.6, 0.6].map((x) => [-0.3, 0.3].map((z) => <Mesh key={`${x}${z}`} g={G.box(0.05, 0.4, 0.05)} m={MS("#4a3020", { map: "wood" })} p={[x, 0.2, z]} />))}<Mesh g={G.cyl(0.04, 0.034, 0.09, 20)} m={MS("#f2f2ee", { rough: 0.3 })} p={[-0.3, 0.495, 0.05]} /><Mesh g={G.box(0.25, 0.012, 0.18)} m={MS("#c8b28a", { map: "cardboard" })} p={[0.2, 0.452, 0.0]} r={[0, 0.3, 0]} /></group>
      <Mesh g={G.box(2.4, 0.5, 1.0)} m={MS("#3a4a68", { map: "knit", rx: 4, ry: 2, rough: 0.95 })} p={[0.3, 0.25, 2.4]} />
      <Mesh g={G.box(2.4, 0.7, 0.28)} m={MS("#34425e", { map: "knit", rx: 4, ry: 2, rough: 0.95 })} p={[0.3, 0.75, 2.86]} />
      {[-0.7, 0.3, 1.3].map((x) => <Mesh key={x} g={G.rbox(0.74, 0.16, 0.8, 0.06)} m={MS("#44557a", { map: "knit", rx: 2, ry: 2, rough: 0.95 })} p={[x, 0.55, 2.4]} />)}
      {/* lamp */}
      <group position={[-2.7, 0, -2.6]}><Mesh g={G.cyl(0.02, 0.02, 1.4, 12)} m={MS("#2a2a2e", { metal: 0.6 })} p={[0, 0.7, 0]} /><Mesh g={G.cyl(0.15, 0.2, 0.3, 28)} m={MS("#f3d6a0", { emissive: "#ffb85a", ei: 0.8, rough: 0.9 })} p={[0, 1.5, 0]} /><pointLight position={[0, 1.5, 0.2]} color="#ffb060" intensity={16 * dim} distance={11} /><Mesh g={G.cyl(0.14, 0.16, 0.03, 20)} m={MS("#2a2a2e", { metal: 0.6 })} p={[0, 0.015, 0]} /></group>
      {/* shelves + pictures + plant */}
      <group position={[3.9, 0, -1.4]} rotation={[0, -Math.PI / 2, 0]}><Mesh g={G.box(1.5, 2.0, 0.3)} m={MS("#5a3c28", { map: "wood", rough: 0.55 })} p={[0, 1.0, 0]} />{[0.4, 0.95, 1.5].map((y, i) => <group key={i}>{Array.from({ length: 12 }, (_, k) => <Book key={k} p={[-0.6 + k * 0.1, y + 0.1, 0.05]} c={["#a83a3a", "#3a6aa8", "#c8a43a", "#4a8a5a", "#7a4a8a"][(k + i) % 5]} h={0.2 + ((k * 7) % 5) * 0.015} />)}</group>)}</group>
      <Frame p={[-0.2, 1.85, -3.42]} w={0.5} h={0.38} c="#c8a878" /><Frame p={[0.5, 1.7, -3.42]} w={0.3} h={0.4} c="#7aa0b8" />
      <group position={[3.2, 0, -3.0]}><Mesh g={G.cyl(0.14, 0.1, 0.3, 20)} m={MS("#b8643a", { rough: 0.8 })} p={[0, 0.15, 0]} />{Array.from({ length: 9 }, (_, i) => <Mesh key={i} g={G.sph(1, 14, 10)} m={MS("#3f8a4a", { rough: 0.7 })} p={[Math.cos(i) * 0.14, 0.5 + (i % 3) * 0.12, Math.sin(i) * 0.14]} s={[0.1, 0.2, 0.05]} r={[0.3 * Math.cos(i), i, 0.3 * Math.sin(i)]} />)}</group>
      <hemisphereLight args={["#5a6a98", "#3a2c20", 0.95 * dim]} />
    </group>
  );
};
export const Porch: React.FC<{ t: number }> = ({ t }) => {
  const r = seeded(21);
  return (
    <group>
      <Mesh g={G.box(12, 0.12, 5)} m={MS("#ffffff", { map: "wood", rx: 5, ry: 2, rough: 0.7 })} p={[0, -0.06, 1.2]} />
      <Mesh g={G.box(30, 0.1, 40)} m={MS("#1a2a24", { rough: 1 })} p={[0, -0.2, 22]} />
      <Mesh g={G.box(30, 0.05, 6)} m={MS("#22262e", { rough: 0.5 })} p={[0, -0.12, 11]} />
      <Mesh g={G.box(8, 3.2, 0.2)} m={MS("#9aa8b6", { map: "siding", rx: 2, ry: 1.5 })} p={[-3, 1.6, -1.3]} />
      <Door p={[-0.6, 0, -1.18]} />
      <Mesh g={G.box(2.2, 0.16, 1.3)} m={MS("#e0d8c8", { map: "plaster" })} p={[-0.6, 2.6, -0.5]} />
      <group position={[-0.6, 2.4, -0.3]}><Mesh g={G.cyl(0.1, 0.12, 0.2, 20)} m={MS("#fff1c8", { emissive: "#ffcf80", ei: 1.4 })} /><spotLight position={[0, 0, 0.1]} angle={1.05} penumbra={0.8} intensity={60} color="#ffcf90" distance={9} castShadow target-position={[0, 0, 2.2]} /></group>
      {Array.from({ length: 14 }, (_, i) => <group key={i} position={[-16 + i * 2.6 + r() * 0.5, 0, 16 + r() * 6]}><Mesh g={G.box(2.4, 2.6 + r() * 1.4, 2.4)} m={MS("#1a2236", { rough: 1 })} p={[0, 1.5, 0]} cast={false} /><Mesh g={G.box(0.5, 0.5, 0.05)} m={MB(r() < 0.5 ? "#ffd48a" : "#27344e")} p={[0.4, 1.7, -1.22]} cast={false} /></group>)}
      {Array.from({ length: 6 }, (_, i) => <group key={i} position={[-8 + i * 3.4, 0, 11.5]}><Mesh g={G.cyl(0.04, 0.05, 3.5, 8)} m={MS("#20242c")} p={[0, 1.75, 0]} /><mesh position={[0, 3.55, 0]}><sphereGeometry args={[0.18, 12, 8]} /><meshBasicMaterial color="#ffe0a0" /></mesh></group>)}
      <Rain p={[0, 1.4, 1.0]} w={5} h={3} t={t} rot={[0, 0, 0]} speed={2.2} /><Rain p={[0.3, 1.2, 2.5]} w={7} h={4} t={t * 1.1 + 0.4} rot={[0, 0, 0]} speed={2.4} />
      <hemisphereLight args={["#31456e", "#141a24", 0.9]} />
    </group>
  );
};
export const Hallway: React.FC<{ t: number; lock: number }> = ({ t, lock }) => (
  <group>
    <Mesh g={G.box(1.8, 0.1, 8)} m={MS("#ffffff", { map: "wood", rx: 1, ry: 4, rough: 0.55 })} p={[0, -0.05, 1.2]} />
    <Mesh g={G.box(0.8, 0.02, 4.4)} m={MS("#ffffff", { map: "rug", rough: 0.95 })} p={[0, 0.013, 1.4]} />
    {[-0.9, 0.9].map((x) => <Mesh key={x} g={G.box(0.1, 2.7, 8)} m={MS("#d2c0a8", { map: "wallpaper", rx: 3, ry: 1.3 })} p={[x, 1.35, 1.2]} />)}
    <Mesh g={G.box(1.8, 0.1, 8)} m={MS("#e8e0d0", { map: "plaster" })} p={[0, 2.72, 1.2]} />
    <Mesh g={G.box(2.0, 2.7, 0.1)} m={MS("#d2c0a8", { map: "wallpaper", rx: 1, ry: 1.3 })} p={[0, 1.35, -2.4]} />
    <Door p={[0, 0, -2.3]} lock={lock} />
    <Mesh g={G.box(0.7, 0.02, 0.5)} m={MS("#7a4a2a", { map: "knit", rx: 2, ry: 2 })} p={[0, 0.02, -1.8]} />
    <group position={[0.78, 0, -0.6]}><Mesh g={G.box(0.3, 0.05, 0.8)} m={MS("#6a4a30", { map: "wood" })} p={[0, 0.8, 0]} /><Mesh g={G.box(0.04, 0.8, 0.04)} m={MS("#4a3220", { map: "wood" })} p={[0.1, 0.4, 0.3]} /><Mesh g={G.box(0.04, 0.8, 0.04)} m={MS("#4a3220", { map: "wood" })} p={[0.1, 0.4, -0.3]} /><Mesh g={G.cyl(0.08, 0.1, 0.25, 22)} m={MS("#f3d6a0", { emissive: "#ffb85a", ei: 0.9 })} p={[0, 0.95, 0]} /><pointLight position={[-0.05, 1.05, 0]} color="#ffb060" intensity={5.5} distance={5} /></group>
    {[0.5, 1.2, 1.9].map((z, i) => <group key={i} position={[-0.83, 1.35 + (i % 2) * 0.05, z]} rotation={[0, Math.PI / 2, 0]}><Frame p={[0, 0, 0]} w={0.36} h={0.46} c={["#c8a878", "#7aa0b8", "#a89080"][i]} /></group>)}
    {[0.4, 0.8].map((z, i) => <group key={i} position={[-0.84, 1.55, -0.3 - z * 0.4]}><Mesh g={G.cyl(0.015, 0.015, 0.12, 8)} m={MS("#222")} r={[0, 0, Math.PI / 2]} /></group>)}
    <Mesh g={G.box(0.5, 1.0, 0.1)} m={MS("#32466a", { map: "knit", rx: 2, ry: 3, rough: 0.95 })} p={[-0.8, 1.15, -0.8]} r={[0, 0.2, 0]} />
    <hemisphereLight args={["#3a4a76", "#201810", 0.45]} />
  </group>
);
