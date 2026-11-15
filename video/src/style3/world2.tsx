import * as THREE from "three";
import React from "react";
import { cv } from "../emu/world";
import { box, cyl, ico, cone, sph, plane, M, BM, seeded, ease, clamp, type V3 } from "./kit";
import { Mesh } from "./kit2";

/** STYLE 3 world v2: warm European cafe street (arcade ground floor, striped awnings, brick upper floors), skyline, props, explosion. */
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
export const skyTex = (top: string, mid: string, hor: string) => memo(`sky${top}${mid}${hor}`, () => cv(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(0.5, mid); gr.addColorStop(1, hor); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
export const Sky: React.FC<{ top: string; mid: string; hor: string }> = ({ top, mid, hor }) => <mesh><sphereGeometry args={[320, 16, 10]} /><meshBasicMaterial map={skyTex(top, mid, hor)} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;

const PINK = ["#dc8f7c", "#e8b58a", "#d9a37c", "#cf7e66", "#e2c196"];
const STONE = "#ead8bc";
const Bldg: React.FC<{ x: number; w: number; floors: number; col: string; seed: number; flip?: boolean }> = React.memo(({ x, w, floors, col, seed, flip }) => {
  const r = seeded(seed * 13 + 1); const h = 4.0 + floors * 2.7; const cols = Math.max(2, Math.round(w / 2.2));
  const st = seed % 2 ? ["#f09a2a", "#fff6e6"] : ["#2f8f6a", "#fff6e6"];
  return (
    <group position={[x, 0, flip ? 20 : -6]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <Mesh g={box(w, h, 7)} m={M(col, { map: "brick", rx: w / 2.2, ry: h / 2.2 })} p={[0, h / 2, -3.5]} cast={false} rim={false} />
      <Mesh g={box(w + 0.1, 4.0, 0.5)} m={M(STONE, { map: "plaster", rx: w / 3, ry: 1 })} p={[0, 2.0, 0.0]} rim={false} />
      <Mesh g={box(w + 0.5, 0.3, 0.8)} m={M("#f2e6cc", { map: "plaster", rx: 3, ry: 1 })} p={[0, 4.08, 0.1]} rim={false} />
      {Array.from({ length: cols + 1 }, (_, i) => <Mesh key={i} g={box(0.34, 3.9, 0.5)} m={M("#f0dfc2", { map: "plaster" })} p={[-w / 2 + i * (w / cols), 1.95, 0.35]} rim={false} />)}
      {Array.from({ length: cols }, (_, i) => {
        const cx = -w / 2 + (i + 0.5) * (w / cols);
        return (
          <group key={i} position={[cx, 0, 0.26]}>
            <Mesh g={box(w / cols - 0.5, 2.5, 0.08)} m={BM(r() < 0.5 ? "#2c5a58" : "#d8a860")} p={[0, 1.7, 0]} cast={false} recv={false} rim={false} />
            <Mesh g={box(w / cols - 0.4, 0.1, 0.14)} m={M("#2f8f6a")} p={[0, 2.97, 0.02]} rim={false} /><Mesh g={box(w / cols - 0.4, 0.1, 0.14)} m={M("#2f8f6a")} p={[0, 0.45, 0.02]} rim={false} />
            <Mesh g={box(0.07, 2.5, 0.14)} m={M("#2f8f6a")} p={[0, 1.7, 0.02]} rim={false} />
            {Array.from({ length: 5 }, (_, k) => <Mesh key={k} g={box(w / cols - 0.3, 0.1, 1.6)} m={M(k % 2 ? st[1] : st[0], { map: "fabric", rx: 3, ry: 1 })} p={[0, 3.55 - k * 0.0 - 0.0, 0.8 + k * 0.0]} s={[1, 1, 0.2]} r={[0.55, 0, 0]} cast={false} rim={false} />)}
            {Array.from({ length: 6 }, (_, k) => <Mesh key={`s${k}`} g={box((w / cols - 0.3) / 6, 0.07, 1.65)} m={M(k % 2 ? st[1] : st[0], { map: "fabric" })} p={[-(w / cols - 0.3) / 2 + (k + 0.5) * ((w / cols - 0.3) / 6), 3.5, 0.78]} r={[0.5, 0, 0]} rim={false} />)}
          </group>
        );
      })}
      {Array.from({ length: floors }, (_, f) => Array.from({ length: cols }, (_, i) => {
        const cx = -w / 2 + (i + 0.5) * (w / cols); const y = 5.8 + f * 2.7;
        return (
          <group key={`${f}${i}`} position={[cx, y, 0.02]}>
            <Mesh g={box(1.3, 1.9, 0.14)} m={M("#f4ead6", { map: "plaster" })} cast={false} rim={false} />
            <Mesh g={box(1.02, 1.62, 0.1)} m={BM(r() < 0.3 ? "#ffd48a" : "#26384a")} p={[0, 0, 0.08]} cast={false} recv={false} rim={false} />
            <Mesh g={box(0.05, 1.62, 0.06)} m={M("#f4ead6")} p={[0, 0, 0.14]} rim={false} /><Mesh g={box(1.02, 0.05, 0.06)} m={M("#f4ead6")} p={[0, 0.1, 0.14]} rim={false} />
            <Mesh g={box(1.5, 0.12, 0.36)} m={M("#e0d2b8", { map: "plaster" })} p={[0, -1.0, 0.18]} rim={false} />
            {r() < 0.45 ? <><Mesh g={box(1.5, 0.28, 0.3)} m={M("#6a4a30", { map: "wood" })} p={[0, -0.78, 0.4]} rim={false} />{[-0.5, -0.15, 0.2, 0.55].map((px, k) => <Mesh key={k} g={ico(0.15, 0)} m={M(["#e86a8a", "#3f9a4a", "#f2c316", "#3f9a4a"][k])} p={[px, -0.58, 0.42]} rim={false} />)}</> : null}
            {i % 2 === 0 ? <Mesh g={box(0.16, 1.9, 0.12)} m={M("#2f8f6a")} p={[-0.84, 0, 0.1]} rim={false} /> : null}
          </group>
        );
      }))}
      <Mesh g={box(w + 0.4, 0.35, 0.7)} m={M("#f0e2c6", { map: "plaster", rx: 3, ry: 1 })} p={[0, h + 0.05, 0.1]} rim={false} />
    </group>
  );
});
const Tree: React.FC<{ p: V3; s?: number }> = React.memo(({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Mesh g={cyl(0.1, 0.18, 2.0, 6)} m={M("#6a4a32", { map: "wood", rx: 1, ry: 2 })} p={[0, 1.0, 0]} rim={false} />
    <Mesh g={ico(1.1, 1)} m={M("#6fb85a", { map: "grass" })} p={[0, 2.8, 0]} s={[1.2, 0.95, 1.2]} rim={false} />
    <Mesh g={ico(0.8, 1)} m={M("#86c768", { map: "grass" })} p={[0.7, 3.3, 0.2]} rim={false} />
    <Mesh g={ico(0.75, 1)} m={M("#5aa04a", { map: "grass" })} p={[-0.7, 3.1, -0.2]} rim={false} />
  </group>
));
export const Table: React.FC<{ p: V3 }> = React.memo(({ p }) => (
  <group position={p}>
    <Mesh g={cyl(0.52, 0.52, 0.04, 14)} m={M("#a8683a", { map: "wood", rx: 2, ry: 2 })} p={[0, 0.74, 0]} rim={false} />
    <Mesh g={cyl(0.04, 0.05, 0.72, 6)} m={M("#2a2d34", { map: "metal", metal: 0.5 })} p={[0, 0.37, 0]} rim={false} />
    <Mesh g={cyl(0.28, 0.3, 0.03, 10)} m={M("#2a2d34")} p={[0, 0.02, 0]} rim={false} />
    <Mesh g={box(0.14, 0.1, 0.1)} m={M("#dfe8f0", { rough: 0.3 })} p={[-0.1, 0.81, 0.05]} rim={false} />
    <Mesh g={cyl(0.04, 0.035, 0.06, 8)} m={M("#f4f4f0")} p={[0.2, 0.79, -0.1]} rim={false} />
  </group>
));
export const Chair: React.FC<{ p: V3; yaw?: number }> = React.memo(({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Mesh g={box(0.46, 0.04, 0.44)} m={M("#a8683a", { map: "wood", rx: 1, ry: 1 })} p={[0, 0.46, 0]} rim={false} />
    {[-0.19, 0.19].map((x) => [-0.18, 0.18].map((z) => <Mesh key={`${x}${z}`} g={box(0.03, 0.46, 0.03)} m={M("#2a2d34", { metal: 0.4 })} p={[x, 0.23, z]} rim={false} />))}
    {[0.62, 0.74, 0.86].map((y) => <Mesh key={y} g={box(0.44, 0.07, 0.025)} m={M("#a8683a", { map: "wood" })} p={[0, y, -0.2]} r={[-0.1, 0, 0]} rim={false} />)}
    {[-0.2, 0.2].map((x) => <Mesh key={x} g={box(0.03, 0.46, 0.03)} m={M("#2a2d34")} p={[x, 0.7, -0.21]} r={[-0.1, 0, 0]} rim={false} />)}
  </group>
));
const Planter: React.FC<{ p: V3; w?: number }> = React.memo(({ p, w = 2 }) => (
  <group position={p}>
    <Mesh g={box(w, 0.55, 0.6)} m={M("#8a5a38", { map: "wood", rx: 2, ry: 1 })} p={[0, 0.28, 0]} rim={false} />
    {Array.from({ length: Math.round(w * 1.5) }, (_, i) => <Mesh key={i} g={ico(0.38 + (i % 2) * 0.06, 1)} m={M(i % 2 ? "#4f9a46" : "#68b058", { map: "grass" })} p={[-w / 2 + 0.3 + i * 0.55, 0.78, 0]} rim={false} />)}
  </group>
));
const Lamp: React.FC<{ p: V3 }> = React.memo(({ p }) => (
  <group position={p}>
    <Mesh g={cyl(0.05, 0.08, 4.4, 6)} m={M("#26303a", { map: "metal", metal: 0.4 })} p={[0, 2.2, 0]} rim={false} />
    <Mesh g={box(0.9, 0.06, 0.06)} m={M("#26303a")} p={[0.4, 4.3, 0]} rim={false} />
    <Mesh g={cone(0.28, 0.18, 6)} m={M("#26303a")} p={[0.85, 4.2, 0]} rim={false} />
    <Mesh g={sph(0.13)} m={BM("#fff0b8")} p={[0.85, 4.05, 0]} cast={false} recv={false} rim={false} />
  </group>
));
export const Car: React.FC<{ p: V3; col: string; rot?: number; wreck?: boolean }> = React.memo(({ p, col, rot = 0, wreck }) => (
  <group position={p} rotation={[0, rot, 0]}>
    <Mesh g={box(4.3, 0.75, 1.85)} m={M(wreck ? "#26201e" : col, { rough: 0.3, metal: 0.25 })} p={[0, 0.7, 0]} rim={false} />
    <Mesh g={box(2.3, 0.65, 1.7)} m={M(wreck ? "#1c1816" : col, { rough: 0.3, metal: 0.25 })} p={[-0.25, 1.35, 0]} rim={false} />
    <Mesh g={box(2.1, 0.46, 1.74)} m={BM(wreck ? "#161412" : "#9ac8e0")} p={[-0.25, 1.37, 0]} cast={false} recv={false} rim={false} />
    {[-1.35, 1.35].map((x) => [-0.92, 0.92].map((z) => <Mesh key={`${x}${z}`} g={cyl(0.4, 0.4, 0.3, 12)} m={M("#1c1c22", { rough: 0.9 })} p={[x, 0.4, z]} r={[Math.PI / 2, 0, 0]} rim={false} />))}
    {[-0.62, 0.62].map((z) => <Mesh key={z} g={box(0.08, 0.2, 0.36)} m={BM("#fff4c0")} p={[2.17, 0.82, z]} cast={false} recv={false} rim={false} />)}
  </group>
));
const Truck: React.FC<{ p: V3 }> = React.memo(({ p }) => (
  <group position={p}>
    <Mesh g={box(5.0, 2.6, 2.2)} m={M("#f2b320", { rough: 0.4 })} p={[0, 1.8, 0]} rim={false} />
    <Mesh g={box(1.5, 1.7, 2.1)} m={M("#e8a010")} p={[3.1, 1.35, 0]} rim={false} />
    <Mesh g={box(5.05, 0.5, 2.25)} m={M("#d83a20")} p={[0, 0.9, 0]} rim={false} />
    {[-1.6, 2.8].map((x) => [-1.1, 1.1].map((z) => <Mesh key={`${x}${z}`} g={cyl(0.5, 0.5, 0.3, 12)} m={M("#1c1c22")} p={[x, 0.5, z]} r={[Math.PI / 2, 0, 0]} rim={false} />))}
    <mesh position={[0, 2.0, 1.12]}><planeGeometry args={[3.4, 0.8]} /><meshBasicMaterial map={signTex("HOT DOGS", "#f2b320", "#d83a20")} /></mesh>
  </group>
));
const signTex = (txt: string, bg: string, fg: string) => memo("sg" + txt, () => cv(512, 128, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = "900 78px Inter, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + 4); }));
const CLOUDS: [number, number, number, number][] = [[-30, 40, -70, 9], [20, 48, -80, 12], [-8, 34, -90, 7], [55, 38, -60, 8], [-60, 44, -50, 10]];
export const City: React.FC = React.memo(() => {
  const r = seeded(31); const segs: [number, number][] = []; let x = -52; while (x < 56) { const w = 6 + Math.floor(r() * 3) * 1.5; segs.push([x + w / 2, w]); x += w; }
  return (
    <group>
      <Mesh g={box(260, 0.2, 80)} m={M("#8c8a88", { map: "asphalt", rx: 60, ry: 9 })} p={[0, -0.1, 8]} cast={false} rim={false} />
      <Mesh g={box(260, 0.24, 8.4)} m={M("#d8c2a2", { map: "tiles", rx: 62, ry: 2.2 })} p={[0, 0.0, -1.8]} rim={false} />
      <Mesh g={box(260, 0.3, 0.3)} m={M("#b8a688", { map: "plaster", rx: 60, ry: 1 })} p={[0, 0.0, 2.55]} rim={false} />
      <Mesh g={box(260, 0.24, 6)} m={M("#d8c2a2", { map: "tiles", rx: 62, ry: 2 })} p={[0, 0.0, 15.5]} rim={false} />
      {Array.from({ length: 46 }, (_, k) => <Mesh key={k} g={box(1.9, 0.02, 0.2)} m={M("#f4d84a")} p={[-60 + k * 2.8, 0.01, 8.5]} cast={false} rim={false} />)}
      {[-5, 14].map((cx) => Array.from({ length: 8 }, (_, k) => <Mesh key={`${cx}${k}`} g={box(0.5, 0.02, 5.2)} m={M("#f4f0e6")} p={[cx + k * 1.0, 0.01, 8.5]} cast={false} rim={false} />))}
      {segs.map(([cx, w], k) => <Bldg key={`n${k}`} x={cx} w={w} floors={2 + (k % 3)} col={PINK[k % PINK.length]} seed={k + 2} />)}
      {segs.map(([cx, w], k) => <Bldg key={`f${k}`} x={cx} w={w} floors={3 + ((k * 2) % 3)} col={PINK[(k + 2) % PINK.length]} seed={k + 30} flip />)}
      {[-18, -8, 6, 20, 30, -30].map((x, k) => <Tree key={k} p={[x, 0.1, 3.4]} s={1.0 + (k % 3) * 0.1} />)}
      {[-14, 12, 26, -26].map((x, k) => <Lamp key={k} p={[x, 0.1, 2.9]} />)}
      {[-26, -10, 8, 24].map((x, k) => <Planter key={k} p={[x, 0.1, -4.9]} w={2.4} />)}
      <Truck p={[-22, 0.1, 5.2]} /><Car p={[14, 0.1, 5.0]} col="#2f6aa8" /><Car p={[-36, 0.1, 5.0]} col="#e8b030" rot={Math.PI} />
      {Array.from({ length: 12 }, (_, k) => <Mesh key={k} g={box(4 + (k % 3) * 2, 26 + (k * 7) % 22, 4)} m={M("#d7d2cc", { map: "plaster", rx: 2, ry: 6 })} p={[-70 + k * 14, 13 + ((k * 7) % 22) / 2, -60 - (k % 3) * 16]} cast={false} rim={false} />)}
      {CLOUDS.map(([cx, cy, cz, s], k) => <group key={k} position={[cx, cy, cz]}>{[[0, 0, 0, 1], [0.9, -0.1, 0.2, 0.75], [-0.85, -0.05, -0.1, 0.8], [0.2, 0.35, 0, 0.6]].map((c, i) => <mesh key={i} geometry={ico(s * c[3], 1)} material={M("#fbf6ee", { rough: 1 })} position={[c[0] * s, c[1] * s, c[2] * s]} />)}</group>)}
    </group>
  );
});

/* ---------------------------------------------------- effects */
export const Explosion: React.FC<{ p: V3; t: number; k?: number; fire?: boolean }> = ({ p, t, k = 1, fire = true }) => {
  if (t < 0) return null;
  const R = seeded(5);
  const grow = 1 - Math.exp(-t * 4.5); const fade = clamp((t - 1.2) / 1.2);
  const puffs = [[0, 1.2, 0, 1.15], [1.1, 1.0, 0.4, 0.9], [-1.0, 1.1, -0.3, 0.95], [0.3, 2.3, 0.2, 1.0], [-0.7, 2.1, 0.5, 0.75], [0.8, 2.0, -0.4, 0.8], [0, 3.1, 0, 0.7]];
  const hot = t < 0.35 ? "#fff4d0" : t < 0.7 ? "#ffd070" : t < 1.1 ? "#ff9a30" : "#d8581c";
  return (
    <group position={p} scale={k}>
      {fire && t < 0.22 ? <mesh geometry={ico(1, 2)} material={BM("#ffffff")} position={[0, 1.2, 0]} scale={0.5 + t * 14} /> : null}
      {fire ? puffs.map((q, i) => <mesh key={i} geometry={ico(1, 2)} material={M(i % 3 === 0 ? hot : i % 3 === 1 ? "#ff9a30" : "#e8681c", { rough: 1, emissive: t < 1.3 ? "#ff7a1a" : "#3a1408", ei: t < 1.3 ? 1.2 - t * 0.5 : 0.3 })} position={[q[0] * grow * 1.3, q[1] + t * 0.6 * (i % 2 ? 1 : 0.5), q[2] * grow]} scale={Math.max(0.001, q[3] * grow * (1 - fade * 0.5)) * 1.1} />) : null}
      {Array.from({ length: 9 }, (_, i) => { const k = clamp((t - 0.25 - i * 0.05) / 1.8); const a = (i / 9) * 6.28; return k > 0 ? <mesh key={`s${i}`} geometry={ico(1, 1)} material={M("#3a3430", { rough: 1 })} position={[Math.cos(a) * (0.8 + k * 1.2), 2 + k * 4.5 + (i % 3) * 0.5, Math.sin(a) * (0.8 + k * 1.2)]} scale={0.6 + k * 1.6} /> : null; })}
      {Array.from({ length: 16 }, (_, i) => { const a = R() * 6.28, sp = 5 + R() * 9, up = 5 + R() * 9, sz = 0.14 + R() * 0.3; const x = Math.cos(a) * sp * t, z = Math.sin(a) * sp * t * 0.7, y = 0.8 + up * t - 9.0 * t * t; if (y < 0.05) return null; return <mesh key={`d${i}`} geometry={box(sz * 1.5, sz * 0.5, sz)} material={M(i % 3 ? "#c8302a" : "#1c1a1c")} position={[x, y, z]} rotation={[t * (3 + i), t * (2 + i * 0.3), t * 4]} castShadow />; })}
      <mesh geometry={cyl(0.42, 0.42, 0.3, 10)} material={M("#1a1a20")} position={[-2 * t * 6, Math.max(0.4, 1 + 11 * t - 9.0 * t * t), 1.5 * t * 5]} rotation={[t * 8, 0, t * 5]} castShadow />
      {Array.from({ length: 46 }, (_, i) => { const a = R() * 6.28, el = R() * 1.4, sp = 10 + R() * 22; const L = clamp(t / (0.5 + R() * 0.9)); if (L >= 1) return null; const x = Math.cos(a) * Math.cos(el) * sp * t, z = Math.sin(a) * Math.cos(el) * sp * t, y = 1 + Math.sin(el) * sp * t - 6 * t * t; if (y < 0.03) return null; return <mesh key={`k${i}`} geometry={box(0.035, 0.035, 0.34)} material={BM("#ffd68a")} position={[x, y, z]} rotation={[0, -a, el]} />; })}
      <mesh geometry={memo("ring", () => new THREE.RingGeometry(1, 1.25, 28))} material={BM("#ffd8a0", { opacity: 0.5 * (1 - clamp(t / 1.0)), add: true })} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5 + t * 14} />
      <pointLight color="#ff8a2a" intensity={Math.max(0, 260 * k * k * (1 - t / 2.4))} distance={26} position={[0, 2.2, 1.5]} />
    </group>
  );
};
