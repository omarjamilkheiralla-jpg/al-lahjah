import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon, rng } from "../hotel/kit";
import { Glow } from "../full/nature";
import { INKD } from "../full/paint";

const cv = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
let C: any = null;
const T = () => (C ??= {
  art: [0, 1, 2].map((k) => cv(256, 192, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, ["#9bd1f2", "#f6d49a", "#c9b7e0"][k]); gr.addColorStop(1, ["#f8e6c0", "#e08a5a", "#f2c7a0"][k]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = ["#6fa86a", "#b45a3a", "#7a5a9a"][k]; g.beginPath(); g.moveTo(0, h); g.lineTo(60, 80 + k * 10); g.lineTo(120, h); g.fill(); g.beginPath(); g.moveTo(80, h); g.lineTo(170, 60); g.lineTo(256, h); g.fill();
    g.fillStyle = "#fff6d0"; g.beginPath(); g.arc(200, 44, 22, 0, 7); g.fill();
  })),
  view: cv(256, 320, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#8fc8f0"); gr.addColorStop(0.7, "#f8e4bc"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.9)"; for (const [x, y, r] of [[70, 70, 30], [105, 62, 36], [150, 74, 28]] as const) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = "#8fb88a"; g.beginPath(); g.ellipse(70, h, 120, 70, 0, 0, 7); g.fill(); g.fillStyle = "#c4a78a"; g.fillRect(150, 170, 60, 150); g.fillStyle = "#a8694a"; g.beginPath(); g.moveTo(140, 170); g.lineTo(180, 130); g.lineTo(220, 170); g.fill();
  }),
  rays: cv(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,240,200,0.55)"); gr.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, w, h); }),
});

export const Frame: React.FC<{ p: [number, number, number]; w?: number; h?: number; k?: number }> = ({ p, w = 1.1, h = 0.85, k = 0 }) => {
  const g = useMemo(() => box(w + 0.16, h + 0.16, 0.08), [w, h]);
  return <group position={p}><Ink geometry={g} material={toon("#8a5a34")} px={2} cast={false} /><mesh position={[0, 0, 0.05]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={T().art[k % 3]} /></mesh></group>;
};

export const Clock: React.FC<{ p: [number, number, number]; t: number; s?: number }> = ({ p, t, s = 1 }) => (
  <group position={p} scale={s}>
    <Ink geometry={new THREE.CylinderGeometry(0.42, 0.42, 0.1, 28)} material={toon("#fff3dd")} rotation={[Math.PI / 2, 0, 0]} px={2} cast={false} />
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.33, Math.cos((i / 12) * Math.PI * 2) * 0.33, 0.06]}><circleGeometry args={[0.02, 6]} /><meshBasicMaterial color={INKD} /></mesh>)}
    <mesh position={[0, 0, 0.07]} rotation={[0, 0, -t * 0.4]}><planeGeometry args={[0.035, 0.3]} /><meshBasicMaterial color={INKD} /></mesh>
    <mesh position={[0, 0, 0.075]} rotation={[0, 0, -t * 0.03]}><planeGeometry args={[0.045, 0.22]} /><meshBasicMaterial color={INKD} /></mesh>
  </group>
);

export const Plant: React.FC<{ p: [number, number, number]; s?: number; t?: number }> = ({ p, s = 1, t = 0 }) => {
  const leaf = useMemo(() => { const g = new THREE.SphereGeometry(0.2, 10, 8); g.scale(0.5, 1.6, 0.25); return g; }, []);
  const m = useMemo(() => toon("#4a9a52"), []);
  return (
    <group position={p} scale={s}>
      <Ink geometry={new THREE.CylinderGeometry(0.28, 0.2, 0.42, 14)} material={toon("#c0603a")} position={[0, 0.21, 0]} px={2} />
      {Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2; return <Ink key={i} geometry={leaf} material={m} position={[Math.cos(a) * 0.12, 0.7, Math.sin(a) * 0.12]} rotation={[Math.sin(a) * 0.5 + Math.sin(t * 1.2 + i) * 0.04, 0, -Math.cos(a) * 0.5]} px={1.6} cast={false} />; })}
    </group>
  );
};

export const Shelf: React.FC<{ p: [number, number, number]; w?: number }> = ({ p, w = 2.6 }) => {
  const g = useMemo(() => { const r = rng(7); return Array.from({ length: 9 }, (_, i) => ({ x: -w / 2 + 0.2 + i * (w - 0.4) / 8, h: 0.3 + r() * 0.3, c: ["#c8403a", "#2f7a8a", "#e0b23a", "#4a8a52", "#7a3d8f"][i % 5], jar: i % 4 === 2 })); }, [w]);
  return (
    <group position={p}>
      <Ink geometry={box(w, 0.1, 0.5)} material={toon("#8a5a34")} px={2} cast={false} />
      {g.map((b, i) => b.jar
        ? <Ink key={i} geometry={new THREE.CylinderGeometry(0.11, 0.11, 0.3, 12)} material={toon("#cfe8e4")} position={[b.x, 0.2, 0]} px={1.6} cast={false} />
        : <Ink key={i} geometry={box(0.14, b.h, 0.3)} material={toon(b.c)} position={[b.x, 0.05 + b.h / 2, 0]} px={1.6} cast={false} />)}
    </group>
  );
};

export const HangingLamp: React.FC<{ p: [number, number, number]; t: number }> = ({ p, t }) => (
  <group position={p} rotation={[0, 0, Math.sin(t * 1.3) * 0.03]}>
    <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.012, 0.012, 1.8, 6]} /><meshBasicMaterial color={INKD} /></mesh>
    <Ink geometry={new THREE.ConeGeometry(0.42, 0.34, 18, 1, true)} material={toon("#2f8a6a", { side: THREE.DoubleSide })} position={[0, 0, 0]} px={2} cast={false} />
    <mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.1, 10, 8]} /><meshBasicMaterial color="#fff2b0" /></mesh>
    <Glow p={[0, -0.25, 0.1]} s={2.4} />
  </group>
);

/** a window with a view, and slanted bars of light falling into the room */
export const SunWindow: React.FC<{ p: [number, number, number]; s?: number; light?: boolean }> = ({ p, s = 1, light = true }) => {
  const stripe = useMemo(() => new THREE.MeshBasicMaterial({ map: T().rays, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }), []);
  return (
    <group position={p} scale={s}>
      <Ink geometry={box(1.7, 2.2, 0.16)} material={toon("#7a4a2a")} px={2} cast={false} />
      <mesh position={[0, 0, 0.09]}><planeGeometry args={[1.45, 1.95]} /><meshBasicMaterial map={T().view} /></mesh>
      <Ink geometry={box(0.07, 1.95, 0.06)} material={toon("#fff3dd")} position={[0, 0, 0.12]} px={1.4} cast={false} />
      <Ink geometry={box(1.45, 0.07, 0.06)} material={toon("#fff3dd")} position={[0, 0.1, 0.12]} px={1.4} cast={false} />
      {light ? [0, 1, 2].map((i) => <mesh key={i} material={stripe} position={[0.5 + i * 0.7, -1.6, 1.4]} rotation={[0, 0, -0.5]}><planeGeometry args={[0.5, 3.8]} /></mesh>) : null}
    </group>
  );
};

/** string of festive flags across a street (also a nice piece of foreground depth) */
export const Bunting: React.FC<{ a: [number, number, number]; b: [number, number, number]; n?: number; t?: number; sag?: number }> = ({ a, b, n = 14, t = 0, sag = 0.7 }) => {
  const tri = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.17, 0); s.lineTo(0.17, 0); s.lineTo(0, -0.42); s.closePath(); return new THREE.ShapeGeometry(s); }, []);
  const mats = useMemo(() => ["#c8403a", "#e0b23a", "#2f8f5a", "#2b6aa8", "#fff3dd"].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })), []);
  const pts = useMemo(() => Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return new THREE.Vector3(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u); }), [a, b, n, sag]);
  const line = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.012, 5, false), [pts, n]);
  return (
    <group>
      <mesh geometry={line}><meshBasicMaterial color={INKD} /></mesh>
      {pts.slice(0, -1).map((p, i) => <mesh key={i} geometry={tri} material={mats[i % 5]} position={[p.x + (pts[i + 1].x - p.x) * 0.5, p.y + (pts[i + 1].y - p.y) * 0.5, p.z]} rotation={[Math.sin(t * 1.6 + i) * 0.1, 0, Math.sin(t * 1.4 + i * 0.7) * 0.08]} />)}
    </group>
  );
};

export const MarketStall: React.FC<{ p: [number, number, number]; rot?: number; color?: string; goods?: string[]; t?: number }> = ({ p, rot = 0, color = "#c8403a", goods = ["#e0592f", "#5aa05a", "#e8b53a"], t = 0 }) => {
  const stripes = useMemo(() => { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d")!; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fff3dd" : color; g.fillRect(i * 32, 0, 32, 64); } const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [color]);
  const fruit = useMemo(() => new THREE.SphereGeometry(0.1, 10, 8), []);
  const items = useMemo(() => { const r = rng(9); return Array.from({ length: 18 }, (_, i) => ({ x: -0.8 + (i % 6) * 0.32 + (r() - 0.5) * 0.06, z: -0.2 + Math.floor(i / 6) * 0.26, c: goods[i % goods.length], y: 0.06 * (i % 3) })); }, [goods]);
  return (
    <group position={p} rotation={[0, rot, 0]}>
      {[[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]].map(([x, z], i) => <Ink key={i} geometry={box(0.09, i < 2 ? 2.3 : 1.9, 0.09)} material={toon("#6a4a38")} position={[x, i < 2 ? 1.15 : 0.95, z]} px={1.6} cast={false} />)}
      <Ink geometry={box(2.5, 0.1, 1.5)} material={toon("#a8693b")} position={[0, 0.9, 0]} px={2} />
      <Ink geometry={box(2.4, 0.9, 1.3)} material={toon("#8a5a34")} position={[0, 0.45, 0]} px={2} />
      <Ink geometry={box(2.7, 0.08, 1.9)} material={toon(stripes)} position={[0, 2.25 + Math.sin(t * 1.2) * 0.01, -0.1]} rotation={[0.18, 0, 0]} px={2} />
      {items.map((it, i) => <mesh key={i} geometry={fruit} position={[it.x, 1.0 + it.y, it.z]}><meshToonMaterial color={it.c} /></mesh>)}
    </group>
  );
};

export const Laundry: React.FC<{ a: [number, number, number]; b: [number, number, number]; t?: number }> = ({ a, b, t = 0 }) => {
  const cols = ["#f4efe4", "#7fb6d9", "#e8a0a0", "#f2d27a", "#a8d8b0"];
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const ang = Math.atan2(b[2] - a[2], b[0] - a[0]);
  const rope = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, L, 5), [L]);
  const cloth = useMemo(() => new THREE.PlaneGeometry(0.34, 0.42), []);
  return (
    <group position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[0, -ang, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} geometry={rope}><meshBasicMaterial color={INKD} /></mesh>
      {cols.concat(cols).map((c, i) => <mesh key={i} geometry={cloth} position={[-L / 2 + 0.5 + i * (L - 1) / 9, -0.24, 0]} rotation={[Math.sin(t * 1.5 + i) * 0.06, Math.sin(t * 1.1 + i * 2) * 0.35, 0]}><meshToonMaterial color={c} side={THREE.DoubleSide} /></mesh>)}
    </group>
  );
};
