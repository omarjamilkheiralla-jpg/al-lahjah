import * as THREE from "three";
import React from "react";
import { cv } from "../emu/world";

/** STYLE 3 kit: low-poly flat-shaded 3D people + textured street. Everything is cached (no allocation in render). */
export type V3 = [number, number, number];
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
export const seeded = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
export const ease = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ------------------------------------------------ geometry + material caches */
export const box = (w: number, h: number, d: number) => memo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const cyl = (rt: number, rb: number, h: number, seg = 8) => memo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1));
export const ico = (r = 1, det = 1) => memo(`i${r},${det}`, () => new THREE.IcosahedronGeometry(r, det));
export const cone = (r: number, h: number, seg = 8) => memo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const sph = (r: number, ws = 12, hs = 9) => memo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export const torus = (r: number, t: number, arc: number) => memo(`o${r},${t},${arc}`, () => new THREE.TorusGeometry(r, t, 4, 10, arc));
export const plane = (w: number, h: number) => memo(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));

/* ------------------------------------------------ textures (painted on canvas, seamless) */
const noiseDots = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n: number, a: number) => {
  const r = seeded(seed);
  for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h, s = 1 + r() * 2.5; g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) g.fillRect(x + ox, y + oy, s, s); }
};
const TEX: Record<string, () => THREE.CanvasTexture> = {
  brick: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#d9d9d9"; g.fillRect(0, 0, w, h); const r = seeded(5); for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const o = (y % 2) * 32; const v = 200 + r() * 55; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x * 64 + o + 2, y * 32 + 2, 60, 28); } g.strokeStyle = "rgba(60,60,60,.35)"; g.lineWidth = 3; for (let y = 0; y <= 8; y++) { g.beginPath(); g.moveTo(0, y * 32); g.lineTo(w, y * 32); g.stroke(); } noiseDots(g, w, h, 9, 900, 0.06); }, true),
  plaster: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 21, 2600, 0.07); const r = seeded(4); for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(0,0,0,.025)"; g.beginPath(); g.arc(r() * w, r() * h, 10 + r() * 30, 0, 7); g.fill(); } }, true),
  tiles: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#cfcfcf"; g.fillRect(0, 0, w, h); const r = seeded(8); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 205 + r() * 40; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); } g.strokeStyle = "rgba(40,40,40,.4)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } noiseDots(g, w, h, 3, 1200, 0.07); }, true),
  asphalt: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#bdbdbd"; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 12, 5000, 0.13); const r = seeded(6); g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); } }, true),
  fabric: () => cv(128, 128, (g, w, h) => { g.fillStyle = "#e4e4e4"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.09)"; g.lineWidth = 1; for (let i = 0; i < w; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } noiseDots(g, w, h, 5, 500, 0.06); }, true),
  wood: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#dcdcdc"; g.fillRect(0, 0, w, h); const r = seeded(14); for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.06})`; g.lineWidth = 1 + r() * 2; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.7, y + (r() - 0.5) * 8, w, y); g.stroke(); } for (let i = 1; i < 4; i++) { g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, true),
  grass: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#d6d6d6"; g.fillRect(0, 0, w, h); noiseDots(g, w, h, 17, 4000, 0.11); }, true),
  metal: () => cv(128, 128, (g, w, h) => { g.fillStyle = "#e8e8e8"; g.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 2) { g.fillStyle = `rgba(0,0,0,${0.02 + ((i * 7) % 5) * 0.012})`; g.fillRect(i, 0, 1, h); } }, true),
};
const tex = (name: string, rx: number, ry: number) => memo(`t${name}${rx}${ry}`, () => { const t = TEX[name](); t.repeat.set(rx, ry); t.needsUpdate = true; return t; });

export const M = (color: string, o: { map?: string; rx?: number; ry?: number; rough?: number; metal?: number; emissive?: string; ei?: number } = {}) =>
  memo(`m${color}|${o.map}|${o.rx}|${o.ry}|${o.rough}|${o.metal}|${o.emissive}|${o.ei}`, () => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: o.rough ?? 0.82, metalness: o.metal ?? 0, map: o.map ? tex(o.map, o.rx ?? 1, o.ry ?? 1) : null, emissive: o.emissive ?? "#000000", emissiveIntensity: o.ei ?? 1 }));
export const BM = (color: string, o: { opacity?: number; add?: boolean } = {}) => memo(`bm${color}|${o.opacity}|${o.add}`, () => new THREE.MeshBasicMaterial({ color, transparent: o.opacity !== undefined, opacity: o.opacity ?? 1, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.add && o.opacity === undefined }));

type MeshP = { g: THREE.BufferGeometry; m: THREE.Material; p?: V3; s?: V3; r?: V3; cast?: boolean; recv?: boolean };
export const Mesh: React.FC<MeshP> = ({ g, m, p, s, r, cast = true, recv = true }) => <mesh geometry={g} material={m} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow={recv} />;

/* ------------------------------------------------ people */
export type Expr = "calm" | "smile" | "shock" | "shout" | "sad" | "annoyed" | "smug";
const EXPR: Record<Expr, { brow: number; by: number; mouth: "flat" | "smile" | "open" | "frown"; open: number; eye: number; blush: number }> = {
  calm: { brow: 0, by: 0, mouth: "flat", open: 0, eye: 1, blush: 0 },
  smile: { brow: -0.12, by: 0.005, mouth: "smile", open: 0, eye: 0.95, blush: 0.5 },
  smug: { brow: 0.2, by: -0.005, mouth: "smile", open: 0, eye: 0.7, blush: 0.2 },
  shock: { brow: -0.25, by: 0.03, mouth: "open", open: 1.0, eye: 1.45, blush: 0 },
  shout: { brow: 0.45, by: -0.01, mouth: "open", open: 1.5, eye: 1.2, blush: 0.3 },
  sad: { brow: -0.5, by: 0.01, mouth: "frown", open: 0, eye: 1.0, blush: 0 },
  annoyed: { brow: 0.55, by: -0.01, mouth: "frown", open: 0, eye: 0.8, blush: 0 },
};
export type Pose = {
  walk?: number; amp?: number; crouch?: number; lean?: number; bob?: number;
  rArm?: [number, number]; lArm?: [number, number]; rElbow?: number; lElbow?: number;
  headX?: number; headY?: number; headZ?: number; expr?: Expr; legSpread?: number;
};
export type Look = { skin: string; shirt: string; shirtDark: string; pants: string; shoes: string; hair: string; kind: "ben" | "gary" | "grey"; sleeves?: string };
export const BEN: Look = { skin: "#d9a074", shirt: "#3f9a5a", shirtDark: "#2e7745", pants: "#364a6a", shoes: "#f2eee4", hair: "#3a2418", kind: "ben" };
export const GARY: Look = { skin: "#f3d2b0", shirt: "#f2c316", shirtDark: "#c99c0a", pants: "#4b4f5e", shoes: "#2c2c32", hair: "#c9572a", kind: "gary" };
export const GREYP = (i: number): Look => { const c = [["#c0545a", "#8a3a42"], ["#4f7ac2", "#385a96"], ["#e0903a", "#b06c24"], ["#8a63b8", "#654590"], ["#4aa8a0", "#34807a"]][i % 5]; const sk = ["#e8b890", "#c68a5e", "#f0cfae", "#9a6440", "#dca87a"][i % 5]; return { skin: sk, shirt: c[0], shirtDark: c[1], pants: ["#3b3f52", "#5a4a3a", "#2f4a58"][i % 3], shoes: "#2c2c32", hair: ["#2a1a12", "#6a4020", "#bfa25a", "#161616", "#8a8a8a"][i % 5], kind: "grey" }; };

const Limb: React.FC<{ pos: V3; rx: number; rz?: number; up: number; lo: number; elbow: number; w: number; cl: string; skin: string; hand?: React.ReactNode }> = ({ pos, rx, rz = 0, up, lo, elbow, w, cl, skin, hand }) => (
  <group position={pos} rotation={[rx, 0, rz]}>
    <Mesh g={box(w, up, w)} m={M(cl, { map: "fabric", rx: 1, ry: 1 })} p={[0, -up / 2, 0]} />
    <group position={[0, -up, 0]} rotation={[-elbow, 0, 0]}>
      <Mesh g={box(w * 0.88, lo, w * 0.88)} m={M(cl, { map: "fabric" })} p={[0, -lo / 2, 0]} />
      <Mesh g={ico(w * 0.62, 0)} m={M(skin)} p={[0, -lo - 0.01, 0]} />
      {hand ? <group position={[0, -lo - 0.01, 0]}>{hand}</group> : null}
    </group>
  </group>
);
const Leg: React.FC<{ pos: V3; th: number; kn: number; pants: string; shoes: string }> = ({ pos, th, kn, pants, shoes }) => (
  <group position={pos} rotation={[th, 0, 0]}>
    <Mesh g={box(0.17, 0.46, 0.17)} m={M(pants, { map: "fabric" })} p={[0, -0.23, 0]} />
    <group position={[0, -0.46, 0]} rotation={[kn, 0, 0]}>
      <Mesh g={box(0.145, 0.44, 0.145)} m={M(pants, { map: "fabric" })} p={[0, -0.22, 0]} />
      <Mesh g={box(0.17, 0.09, 0.31)} m={M(shoes)} p={[0, -0.45, 0.06]} />
    </group>
  </group>
);

export const Human: React.FC<{ look: Look; p: V3; yaw?: number; pose?: Pose; s?: number; handR?: React.ReactNode; handL?: React.ReactNode; hat?: React.ReactNode }> = ({ look, p, yaw = 0, pose = {}, s = 1, handR, handL, hat }) => {
  const { walk, amp = 0.5, crouch = 0, lean = 0, bob = 0, rArm, lArm, rElbow = 0.25, lElbow = 0.25, headX = 0, headY = 0, headZ = 0, expr = "calm", legSpread = 0 } = pose;
  const E = EXPR[expr];
  const ph = walk ?? 0;
  const walking = walk !== undefined;
  const thR = walking ? Math.sin(ph) * amp : 0, thL = walking ? -Math.sin(ph) * amp : 0;
  const knR = walking ? Math.max(0, Math.cos(ph)) * amp * 1.5 : 0, knL = walking ? Math.max(0, -Math.cos(ph)) * amp * 1.5 : 0;
  const cT = -1.3 * crouch, cK = 2.4 * crouch;
  const hipsY = 0.09 + 0.46 * Math.cos(cT) + 0.44 * Math.cos(cT + cK) + (walking ? Math.abs(Math.cos(ph)) * 0.035 : 0) + bob;
  const armR: [number, number] = rArm ?? [walking ? -Math.sin(ph) * amp * 0.9 : 0, 0.08];
  const armL: [number, number] = lArm ?? [walking ? Math.sin(ph) * amp * 0.9 : 0, -0.08];
  const gary = look.kind === "gary", ben = look.kind === "ben";
  const torsoCl = look.shirt, sleeve = look.sleeves ?? look.shirt;
  const H = gary ? 1.08 : 1;
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={[s, s * H, s]}>
      <group position={[0, hipsY, 0]}>
        <Leg pos={[-0.1 - legSpread, 0, 0]} th={cT + thL} kn={cK + knL} pants={look.pants} shoes={look.shoes} />
        <Leg pos={[0.1 + legSpread, 0, 0]} th={cT + thR} kn={cK + knR} pants={look.pants} shoes={look.shoes} />
        <Mesh g={box(0.38, 0.17, 0.24)} m={M(look.pants, { map: "fabric" })} p={[0, 0.02, 0]} />
        <group rotation={[lean, 0, 0]}>
          <mesh geometry={cyl(0.21, 0.175, 0.56, 7)} material={M(torsoCl, { map: "fabric", rx: 2, ry: 1 })} position={[0, 0.34, 0]} scale={[1.12, 1, 0.74]} castShadow receiveShadow />
          <Mesh g={box(0.4, 0.05, 0.27)} m={M(look.shirtDark)} p={[0, 0.07, 0]} />
          {ben ? <><Mesh g={box(0.3, 0.17, 0.14)} m={M(look.shirtDark, { map: "fabric" })} p={[0, 0.6, -0.14]} /><Mesh g={box(0.025, 0.22, 0.02)} m={M("#f2eee4")} p={[-0.05, 0.5, 0.16]} /><Mesh g={box(0.025, 0.22, 0.02)} m={M("#f2eee4")} p={[0.05, 0.5, 0.16]} /></> : null}
          {gary ? <><mesh geometry={cyl(0.23, 0.3, 0.3, 7)} material={M("#f2c316", { map: "fabric" })} position={[0, 0.12, 0]} scale={[1.15, 1, 0.8]} castShadow /><Mesh g={box(0.06, 0.06, 0.02)} m={M("#2c2c32")} p={[0, 0.4, 0.17]} /></> : null}
          <Mesh g={cyl(0.07, 0.08, 0.09, 6)} m={M(look.skin)} p={[0, 0.66, 0]} />
          <group position={[0, 0.88, 0]} rotation={[headX, headY, headZ]}>
            <mesh geometry={ico(1, 1)} material={M(look.skin)} scale={[0.185, 0.225, 0.2]} castShadow receiveShadow />
            <Mesh g={ico(1, 0)} m={M(look.skin)} p={[-0.185, -0.01, 0]} s={[0.035, 0.06, 0.045]} />
            <Mesh g={ico(1, 0)} m={M(look.skin)} p={[0.185, -0.01, 0]} s={[0.035, 0.06, 0.045]} />
            {[-1, 1].map((k) => <group key={k} position={[k * 0.072, 0.03, 0.172]}>
              <Mesh g={sph(1, 10, 8)} m={BM("#ffffff")} s={[0.044, 0.05 * E.eye, 0.02]} cast={false} />
              <Mesh g={sph(1, 8, 6)} m={BM("#1c1418")} p={[0, 0, 0.012]} s={[0.022, 0.026 * Math.min(1.3, E.eye), 0.01]} cast={false} />
              <Mesh g={box(0.085, 0.017, 0.02)} m={M(look.hair)} p={[0, 0.075 + E.by, 0.005]} r={[0, 0, -k * E.brow]} cast={false} />
              {E.blush > 0 ? <Mesh g={sph(1, 8, 6)} m={BM("#ff8a8a", { opacity: 0.55 * E.blush })} p={[k * 0.008, -0.075, 0]} s={[0.035, 0.02, 0.01]} cast={false} /> : null}
            </group>)}
            <Mesh g={cone(0.022, 0.06, 5)} m={M(look.skin)} p={[0, -0.025, 0.2]} r={[Math.PI / 2, 0, 0]} />
            {E.mouth === "open" ? <Mesh g={sph(1, 10, 8)} m={BM("#3a0f16")} p={[0, -0.1, 0.178]} s={[0.04, 0.02 + 0.03 * E.open, 0.02]} cast={false} /> : null}
            {E.mouth === "smile" ? <Mesh g={torus(0.04, 0.007, Math.PI)} m={BM("#3a0f16")} p={[0, -0.075, 0.18]} r={[0, 0, Math.PI]} cast={false} /> : null}
            {E.mouth === "frown" ? <Mesh g={torus(0.035, 0.007, Math.PI)} m={BM("#3a0f16")} p={[0, -0.118, 0.18]} cast={false} /> : null}
            {E.mouth === "flat" ? <Mesh g={box(0.055, 0.01, 0.01)} m={BM("#3a0f16")} p={[0, -0.1, 0.18]} cast={false} /> : null}
            {ben ? <><mesh geometry={ico(1, 1)} material={M(look.hair, { map: "fabric" })} position={[0, 0.045, -0.02]} scale={[0.2, 0.2, 0.215]} castShadow /><Mesh g={box(0.2, 0.06, 0.06)} m={M(look.hair)} p={[0, 0.17, 0.12]} r={[0.3, 0, 0]} /></> : null}
            {gary ? <><mesh geometry={sph(1, 10, 7)} material={M("#2f6ad0", { map: "fabric", rx: 2, ry: 1 })} position={[0, 0.08, -0.005]} scale={[0.205, 0.17, 0.22]} castShadow /><Mesh g={box(0.215, 0.05, 0.215)} m={M("#2558b0")} p={[0, -0.01, 0]} s={[1, 1, 1]} cast={false} /><Mesh g={sph(1, 8, 6)} m={M("#f2f2f2")} p={[0, 0.27, 0]} s={[0.05, 0.05, 0.05]} /></> : null}
            {look.kind === "grey" ? <mesh geometry={ico(1, 1)} material={M(look.hair, { map: "fabric" })} position={[0, 0.05, -0.02]} scale={[0.195, 0.19, 0.21]} castShadow /> : null}
            {hat}
          </group>
          <Limb pos={[-0.255, 0.55, 0]} rx={armL[0]} rz={armL[1]} up={0.3} lo={0.28} elbow={lElbow} w={0.095} cl={sleeve} skin={look.skin} hand={handL} />
          <Limb pos={[0.255, 0.55, 0]} rx={armR[0]} rz={armR[1]} up={0.3} lo={0.28} elbow={rElbow} w={0.095} cl={sleeve} skin={look.skin} hand={handR} />
        </group>
      </group>
    </group>
  );
};
export const walkPose = (dist: number, amp = 0.5): Pose => ({ walk: (dist * Math.PI * 2) / 1.5, amp });
