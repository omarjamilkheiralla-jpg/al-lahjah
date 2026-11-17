import * as THREE from "three";
import React from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cv } from "../emu/world";
import { seeded } from "../style3/kit";

/** STYLE 4 kit: simple cartoon people (big head, big eyes, smooth soft shading) + textured props + first-person hands. */
export type V3 = [number, number, number];
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/* ---------------------------------------------------------------- textures */
const dots = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n: number, a: number) => { const r = seeded(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; const x = r() * w, y = r() * h, s = 1 + r() * 2; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) g.fillRect(x + ox, y + oy, s, s); } };
const TEX: Record<string, () => THREE.CanvasTexture> = {
  wood: () => cv(512, 512, (g, w, h) => { const r = seeded(3); for (let i = 0; i < 8; i++) { const v = 150 + r() * 70; g.fillStyle = `rgb(${v},${v * 0.82},${v * 0.6})`; g.fillRect(0, i * 64, w, 64); for (let k = 0; k < 30; k++) { g.strokeStyle = `rgba(60,30,10,${0.05 + r() * 0.1})`; g.lineWidth = 1 + r() * 2; const y = i * 64 + r() * 64; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.7, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 4); g.stroke(); } g.fillStyle = "rgba(20,10,5,.55)"; g.fillRect(0, i * 64, w, 2); for (const x of [r() * w]) { g.fillRect(x, i * 64, 2, 64); } } }, true),
  wallpaper: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#e8d8c0"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(170,120,90,.18)"; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h); const r = seeded(9); for (let i = 0; i < 24; i++) { g.fillStyle = "rgba(150,90,70,.1)"; g.beginPath(); g.arc((i % 6) * 43 + 20, Math.floor(i / 6) * 64 + 24, 6, 0, 7); g.fill(); } dots(g, w, h, 5, 1400, 0.035); void r; }, true),
  plaster: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#ececec"; g.fillRect(0, 0, w, h); dots(g, w, h, 21, 2600, 0.06); }, true),
  knit: () => cv(128, 128, (g, w, h) => { g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.16)"; g.lineWidth = 2; for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 8); g.lineTo(x + 8, y); g.stroke(); } dots(g, w, h, 4, 600, 0.05); }, true),
  hair: () => cv(128, 128, (g, w, h) => { g.fillStyle = "#e0e0e0"; g.fillRect(0, 0, w, h); const r = seeded(7); for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(0,0,0,${0.06 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; const x = r() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 14, h * 0.3, x + (r() - 0.5) * 14, h * 0.7, x + (r() - 0.5) * 8, h); g.stroke(); } }, true),
  skin: () => cv(256, 128, (g, w, h) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); for (const cx of [w * 0.25 - 14, w * 0.25 + 14]) { const gr = g.createRadialGradient(cx, h * 0.62, 2, cx, h * 0.62, 16); gr.addColorStop(0, "rgba(255,150,150,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(cx - 20, h * 0.62 - 20, 40, 40); } dots(g, w, h, 11, 700, 0.025); }, false),
  rug: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#b86a52"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,230,200,.5)"; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68); dots(g, w, h, 8, 3000, 0.07); }, true),
  siding: () => cv(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { const v = 200 - (i % 2) * 14; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, i * 32 + 29, w, 3); } dots(g, w, h, 6, 1800, 0.05); }, true),
  door: () => cv(256, 512, (g, w, h) => { g.fillStyle = "#f0f0f0"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.28)"; g.lineWidth = 5; g.strokeRect(24, 24, w - 48, h * 0.38); g.strokeRect(24, h * 0.46, w - 48, h * 0.48); dots(g, w, h, 2, 2200, 0.05); }, false),
  cardboard: () => cv(128, 128, (g, w, h) => { g.fillStyle = "#e0c090"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,60,30,.18)"; g.lineWidth = 1; for (let y = 0; y < h; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } dots(g, w, h, 12, 700, 0.06); }, true),
};
export const tex = (n: string, rx = 1, ry = 1) => memo(`t${n}${rx}${ry}`, () => { const t = TEX[n](); t.repeat.set(rx, ry); t.needsUpdate = true; return t; });
export const MS = (color: string, o: { map?: string; rx?: number; ry?: number; rough?: number; metal?: number; emissive?: string; ei?: number; side?: THREE.Side } = {}) => memo(`ms${color}|${o.map}|${o.rx}|${o.ry}|${o.rough}|${o.metal}|${o.emissive}|${o.ei}|${o.side}`, () => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.78, metalness: o.metal ?? 0, map: o.map ? tex(o.map, o.rx ?? 1, o.ry ?? 1) : null, emissive: o.emissive ?? "#000", emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide }));
export const MB = (color: string, opacity?: number) => memo(`mb${color}${opacity}`, () => new THREE.MeshBasicMaterial({ color, transparent: opacity !== undefined, opacity: opacity ?? 1, depthWrite: opacity === undefined }));

/* ---------------------------------------------------------------- geometry cache */
export const G = {
  box: (w: number, h: number, d: number) => memo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  rbox: (w: number, h: number, d: number, r = 0.02) => memo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 4, r)),
  sph: (r = 1, ws = 28, hs = 20) => memo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)),
  cyl: (rt: number, rb: number, h: number, s = 24) => memo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s)),
  cap: (r: number, l: number) => memo(`k${r},${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 14)),
  plane: (w: number, h: number) => memo(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)),
  cone: (r: number, h: number, s = 24) => memo(`n${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s)),
  torus: (r: number, t: number, arc = Math.PI * 2) => memo(`o${r},${t},${arc}`, () => new THREE.TorusGeometry(r, t, 10, 28, arc)),
};
type MP = { g: THREE.BufferGeometry; m: THREE.Material; p?: V3; s?: V3; r?: V3; cast?: boolean; recv?: boolean };
export const Mesh: React.FC<MP> = ({ g, m, p, s, r, cast = true, recv = true }) => <mesh geometry={g} material={m} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow={recv} />;

/* ---------------------------------------------------------------- cartoon people */
export type Look5 = { skin: string; hair: string; top: string; pants: string; hat?: string; hatKind?: "cap" | "hood" | "none"; hairKind?: "short" | "bob" | "none"; trim?: string };
export type Pose5 = { headX?: number; headY?: number; headZ?: number; blink?: number; brow?: number; browY?: number; mouth?: number; smile?: number; look?: [number, number]; armR?: [number, number]; armL?: [number, number]; elbowR?: number; elbowL?: number; lean?: number; breathe?: number };
export const NORA: Look5 = { skin: "#efc2a0", hair: "#5a3a26", top: "#d23a30", pants: "#2e3446", hairKind: "short", hatKind: "none" };
export const COURIER: Look5 = { skin: "#d8a47e", hair: "#2a1c14", top: "#e8b820", pants: "#2a3040", hat: "#22304c", hatKind: "cap", hairKind: "short", trim: "#f4f1e6" };
const Hand5: React.FC<{ skin: string; grip?: number; side?: 1 | -1 }> = ({ skin, grip = 0.5, side = 1 }) => (
  <group>
    <Mesh g={G.sph(1, 20, 14)} m={MS(skin, { rough: 0.6 })} s={[0.04, 0.046, 0.026]} />
    {[-0.022, -0.007, 0.008, 0.023].map((x, i) => <group key={i} position={[x, -0.042, 0]} rotation={[-0.2 - grip * 0.9, 0, 0]}><Mesh g={G.cap(0.0095, 0.03 + (i === 1 || i === 2 ? 0.006 : 0))} m={MS(skin, { rough: 0.6 })} p={[0, -0.02, 0]} /></group>)}
    <group position={[-side * 0.03, -0.01, 0.012]} rotation={[-0.4 - grip * 0.4, 0, -side * (0.7 - grip * 0.2)]}><Mesh g={G.cap(0.011, 0.028)} m={MS(skin, { rough: 0.6 })} p={[0, -0.02, 0]} /></group>
  </group>
);
export const Person5: React.FC<{ look: Look5; p: V3; yaw?: number; pose?: Pose5; s?: number; handR?: React.ReactNode; handL?: React.ReactNode; waist?: boolean }> = ({ look, p, yaw = 0, pose = {}, s = 1, handR, handL, waist }) => {
  const { headX = 0, headY = 0, headZ = 0, blink = 0, brow = 0, browY = 0, mouth = 0, smile = 0, look: lk = [0, 0], armR = [0.1, 0.1], armL = [0.1, -0.1], elbowR = 0.3, elbowL = 0.3, lean = 0, breathe = 0 } = pose;
  const skinM = MS(look.skin, { map: "skin", rough: 0.62 }); const hairM = MS(look.hair, { map: "hair", rx: 2, ry: 2, rough: 0.5 }); const topM = MS(look.top, { map: "knit", rx: 3, ry: 3, rough: 0.9 });
  const eo = Math.max(0.06, 1 - blink);
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <group rotation={[lean, 0, 0]} position={[0, breathe * 0.004, 0]}>
        <Mesh g={G.cap(0.15, 0.3)} m={topM} p={[0, 0.5, 0]} s={[1.05, 1, 0.78]} />
        <Mesh g={G.torus(0.1, 0.045, Math.PI * 1.6)} m={topM} p={[0, 0.74, -0.03]} r={[Math.PI / 2 - 0.5, 0, 0]} />
        {!waist ? <><Mesh g={G.cap(0.075, 0.5)} m={MS(look.pants, { map: "knit", rx: 2, ry: 4, rough: 0.9 })} p={[-0.07, 0.0, 0]} /><Mesh g={G.cap(0.075, 0.5)} m={MS(look.pants, { map: "knit", rx: 2, ry: 4, rough: 0.9 })} p={[0.07, 0.0, 0]} /></> : null}
        {[-1, 1].map((k) => { const a = k < 0 ? armL : armR; const el = k < 0 ? elbowL : elbowR; return (
          <group key={k} position={[k * 0.17, 0.66, 0]} rotation={[a[0], 0, a[1] * k]}>
            <Mesh g={G.cap(0.052, 0.2)} m={topM} p={[0, -0.12, 0]} />
            <group position={[0, -0.25, 0]} rotation={[-el, 0, 0]}><Mesh g={G.cap(0.047, 0.17)} m={topM} p={[0, -0.1, 0]} /><group position={[0, -0.22, 0]}><Hand5 skin={look.skin} side={k as 1 | -1} grip={0.6} />{(k < 0 ? handL : handR) ? <group position={[0, -0.04, 0.02]}>{k < 0 ? handL : handR}</group> : null}</group></group>
          </group>); })}
        <Mesh g={G.cyl(0.05, 0.058, 0.07, 18)} m={skinM} p={[0, 0.76, 0]} />
        <group position={[0, 0.9, 0]} rotation={[headX, headY, headZ]}>
          <Mesh g={G.sph(1, 40, 28)} m={skinM} s={[0.135, 0.15, 0.14]} />
          {[-1, 1].map((k) => <Mesh key={k} g={G.sph(1, 14, 10)} m={skinM} p={[k * 0.14, -0.01, -0.005]} s={[0.025, 0.04, 0.03]} />)}
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 0.055, 0.015, 0.118]} scale={[1, eo, 1]}>
              <Mesh g={G.sph(1, 20, 14)} m={MS("#fbfbf8", { rough: 0.25 })} s={[0.034, 0.038, 0.02]} cast={false} />
              <group position={[lk[0] * 0.012, lk[1] * 0.012, 0.014]}><Mesh g={G.sph(1, 16, 12)} m={MS("#14100e", { rough: 0.2 })} s={[0.02, 0.024, 0.01]} cast={false} /><Mesh g={G.sph(1, 8, 6)} m={MB("#ffffff")} p={[0.007, 0.008, 0.007]} s={[0.006, 0.006, 0.004]} cast={false} /></group>
              <Mesh g={G.cap(0.006, 0.04)} m={hairM} p={[0, 0.058 / eo + browY, 0.0]} r={[0, 0, Math.PI / 2 - k * brow]} s={[1, 1 / eo, 1]} cast={false} />
            </group>))}
          <Mesh g={G.sph(1, 14, 10)} m={MS(look.skin, { rough: 0.6 })} p={[0, -0.02, 0.145]} s={[0.014, 0.012, 0.012]} />
          <group position={[0, -0.075, 0.128]}>
            {mouth > 0.05 ? <Mesh g={G.sph(1, 16, 12)} m={MS("#3a0e12", { rough: 0.5 })} s={[0.026, 0.008 + 0.022 * mouth, 0.01]} cast={false} /> : <Mesh g={G.torus(0.02, 0.0025, Math.PI)} m={MB("#5a2020")} r={[0, 0, smile >= 0 ? Math.PI : 0]} s={[1, 0.3 + Math.abs(smile) * 0.6, 1]} cast={false} />}
          </group>
          {look.hairKind === "short" ? <group><Mesh g={G.sph(1, 36, 24)} m={hairM} p={[0, 0.03, -0.012]} s={[0.147, 0.145, 0.15]} /><Mesh g={G.sph(1, 20, 14)} m={hairM} p={[0.03, 0.12, 0.1]} s={[0.1, 0.05, 0.05]} r={[0.3, 0, -0.2]} /><Mesh g={G.sph(1, 20, 14)} m={hairM} p={[-0.05, 0.115, 0.1]} s={[0.08, 0.04, 0.05]} r={[0.3, 0, 0.3]} /></group> : null}
          {look.hatKind === "cap" ? <group><Mesh g={G.sph(1, 36, 24)} m={MS(look.hat!, { map: "knit", rx: 3, ry: 3, rough: 0.8 })} p={[0, 0.045, -0.005]} s={[0.15, 0.125, 0.155]} /><Mesh g={G.cyl(0.13, 0.13, 0.012, 32)} m={MS(look.hat!, { rough: 0.7 })} p={[0, 0.088, 0.1]} s={[1, 1, 0.8]} r={[0.12, 0, 0]} /></group> : null}
        </group>
      </group>
    </group>
  );
};

/* ---------------------------------------------------------------- first-person hands + phone */
export const phoneTex = (variant: "lock" | "alert") => memo("ph" + variant, () => cv(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1d2a4a"); gr.addColorStop(1, "#0a0d18"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = "600 24px Inter"; g.fillText("Tuesday, November 18", w / 2, 96); g.font = "300 118px Inter"; g.fillText("2:13", w / 2, 206);
  g.fillStyle = "rgba(255,255,255,.35)"; g.font = "500 18px Inter"; g.fillText("Home alone", w / 2, 250);
  if (variant === "alert") { g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.roundRect(18, 300, w - 36, 92, 18); g.fill(); g.fillStyle = "#e2283f"; g.beginPath(); g.arc(46, 330, 8, 0, 7); g.fill(); g.fillStyle = "#101018"; g.textAlign = "left"; g.font = "700 22px Inter"; g.fillText("Front Door", 64, 337); g.font = "600 20px Inter"; g.fillStyle = "#c8202f"; g.fillText("Motion detected", 34, 372); }
  g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.roundRect(w / 2 - 50, h - 22, 100, 6, 3); g.fill();
}));
export const PovHands: React.FC<{ variant: "lock" | "alert"; buzz: number; glow: number }> = ({ variant, buzz, glow }) => {
  const sleeve = MS("#d23a30", { map: "knit", rx: 2, ry: 3, rough: 0.9 }); const sk = MS("#f0b890", { rough: 0.5, emissive: "#3a1408", ei: 0.5 });
  const sh = Math.sin(buzz * 90) * 0.003 * (buzz > 0 ? 1 : 0);
  return (
    <group position={[sh, -0.13 + sh, -0.42]} rotation={[0.34, 0, 0]}>
      <Mesh g={G.rbox(0.078, 0.164, 0.008, 0.011)} m={MS("#15171d", { rough: 0.3, metal: 0.4 })} cast={false} />
      <mesh position={[0, 0, 0.0047]}><planeGeometry args={[0.071, 0.157]} /><meshStandardMaterial map={phoneTex(variant)} emissive="#ffffff" emissiveMap={phoneTex(variant)} emissiveIntensity={0.5 + glow * 0.3} roughness={0.2} /></mesh>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.05, -0.03, 0.002]} rotation={[0, 0, k * 0.16]}>
          <Mesh g={G.sph(1, 28, 18)} m={sk} s={[0.026, 0.038, 0.02]} p={[k * 0.006, -0.004, -0.008]} cast={false} />
          <group position={[k * -0.026, 0.026, 0.006]} rotation={[0.25, 0, k * 1.0]}><Mesh g={G.cap(0.0095, 0.03)} m={sk} p={[0, 0.018, 0]} cast={false} /><group position={[0, 0.036, 0]} rotation={[0, 0, k * 0.4]}><Mesh g={G.cap(0.0088, 0.018)} m={sk} p={[0, 0.01, 0]} cast={false} /></group></group>
          {[0, 1, 2, 3].map((i) => <group key={i} position={[k * 0.0, 0.026 - i * 0.017, -0.004]} rotation={[0, 0, k * (Math.PI / 2 - 0.15)]}><Mesh g={G.cap(0.0078, 0.026)} m={sk} p={[0, -0.016, 0]} cast={false} /></group>)}
          <Mesh g={G.cap(0.04, 0.2)} m={sleeve} p={[k * 0.014, -0.17, -0.016]} r={[0.14, 0, k * 0.08]} cast={false} />
        </group>))}
    </group>
  );
};
