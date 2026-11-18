import * as THREE from "three";
import React from "react";
import { cv } from "../../emu/world";
import { seeded } from "../../style3/kit";
import { G, Mesh, ease, clamp, mix, type V3 } from "../kit5";
import TL from "./timeline.json";

/** STYLE 4 continuous-take kit: soft cartoon look with light texture, depth shading, lightning and flicker. */
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const dots = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n: number, a: number) => { const r = seeded(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; const x = r() * w, y = r() * h, s = 1 + r() * 2; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) g.fillRect(x + ox, y + oy, s, s); } };
const TX: Record<string, () => THREE.CanvasTexture> = {
  wall: () => cv(256, 512, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(120,80,40,.07)"; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,.28)"); gr.addColorStop(0.2, "rgba(0,0,0,0)"); gr.addColorStop(0.8, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.22)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); dots(g, w, h, 5, 1800, 0.04); }, true),
  plaster: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#f4f4f4"; g.fillRect(0, 0, w, h); dots(g, w, h, 21, 2800, 0.05); }, true),
  wood: () => cv(512, 512, (g, w, h) => { const r = seeded(3); for (let i = 0; i < 8; i++) { const v = 205 + r() * 50; g.fillStyle = `rgb(${v},${v * 0.9},${v * 0.78})`; g.fillRect(0, i * 64, w, 64); for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(70,40,20,${0.05 + r() * 0.09})`; g.lineWidth = 1 + r() * 1.6; const y = i * 64 + r() * 64; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 7, w * 0.7, y + (r() - 0.5) * 7, w, y + (r() - 0.5) * 3); g.stroke(); } g.fillStyle = "rgba(30,15,8,.5)"; g.fillRect(0, i * 64, w, 2); g.fillRect(r() * w, i * 64, 2, 64); } dots(g, w, h, 8, 700, 0.03); }, true),
  fabric: () => cv(128, 128, (g, w, h) => { g.fillStyle = "#ececec"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.13)"; g.lineWidth = 2; for (let x = 0; x < w; x += 8) for (let y = 0; y < h; y += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 8); g.lineTo(x + 8, y); g.stroke(); } dots(g, w, h, 4, 500, 0.05); }, true),
  weave: () => cv(64, 64, (g, w, h) => { g.fillStyle = "#f0f0f0"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,.09)"; for (let i = 0; i < w; i += 4) g.fillRect(i, 0, 1, h); for (let j = 0; j < h; j += 4) g.fillRect(0, j, w, 1); dots(g, w, h, 6, 200, 0.05); }, true),
  rug: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#e8e8e8"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 3; g.strokeRect(34, 34, w - 68, h - 68); dots(g, w, h, 8, 3000, 0.07); }, true),
  siding: () => cv(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { const v = 232 - (i % 2) * 12; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(0, i * 32 + 29, w, 3); } dots(g, w, h, 6, 1800, 0.05); }, true),
  door: () => cv(256, 512, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h * 0.4); g.strokeRect(26, h * 0.5, w - 52, h * 0.44); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.strokeRect(30, 30, w - 60, h * 0.4 - 8); dots(g, w, h, 2, 2000, 0.04); }),
  ground: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#e0e0e0"; g.fillRect(0, 0, w, h); dots(g, w, h, 31, 3500, 0.09); }, true),
  night: () => cv(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#16265a"); gr.addColorStop(1, "#2a4182"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
};
export const tx = (n: string, rx = 1, ry = 1) => memo(`tx${n}${rx}${ry}`, () => { const t = TX[n](); t.repeat.set(rx, ry); t.needsUpdate = true; return t; });
export const TM = (color: string, map?: string, rx = 1, ry = 1, o: { emissive?: string; ei?: number } = {}) => memo(`tm${color}|${map}|${rx}|${ry}|${o.emissive}|${o.ei}`, () => new THREE.MeshLambertMaterial({ color, map: map ? tx(map, rx, ry) : null, emissive: o.emissive ?? "#000", emissiveIntensity: o.ei ?? 1 }));
export const BM = (color: string) => memo(`bm${color}`, () => new THREE.MeshBasicMaterial({ color }));
const rainTex = () => memo("rainW", () => { const t = cv(256, 512, (g, w, h) => { g.clearRect(0, 0, w, h); let s = 13; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 110; i++) { const x = r() * w, y = r() * h, l = 40 + r() * 90; const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, "rgba(200,220,255,0)"); gr.addColorStop(1, `rgba(215,228,255,${0.3 + r() * 0.35})`); g.strokeStyle = gr; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + l); g.stroke(); } }, true); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
const RainW: React.FC<{ p: V3; w: number; h: number; t: number; speed?: number }> = ({ p, w, h, t, speed = 1.6 }) => { const tx_ = rainTex(); tx_.offset.y = -(t * speed) % 1; return <mesh position={p}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tx_} transparent depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>; };

/* --------------------------------------------------------------- timeline helpers (shared with the audio script) */
const cam = TL.cam as unknown as { t: number; p: V3; l: V3 }[];
export const herm = (f: "p" | "l", t: number): V3 => {
  const n = cam.length; if (t <= cam[0].t) return cam[0][f]; if (t >= cam[n - 1].t) return cam[n - 1][f];
  let i = 0; while (i < n - 2 && cam[i + 1].t <= t) i++;
  const A = cam[i][f], B = cam[i + 1][f]; const t0 = cam[i].t, t1 = cam[i + 1].t, h = t1 - t0, u = (t - t0) / h;
  if (A[0] === B[0] && A[1] === B[1] && A[2] === B[2]) return A;
  const m = (j: number, k: number, c: number) => (cam[k][f][c] - cam[j][f][c]) / (cam[k].t - cam[j].t) * h;
  const out: number[] = [0, 0, 0];
  for (let c = 0; c < 3; c++) { const m0 = i > 0 ? m(i - 1, i + 1, c) : B[c] - A[c]; const m1 = i + 2 < n ? m(i, i + 2, c) : B[c] - A[c]; out[c] = (2 * u ** 3 - 3 * u ** 2 + 1) * A[c] + (u ** 3 - 2 * u ** 2 + u) * m0 + (-2 * u ** 3 + 3 * u ** 2) * B[c] + (u ** 3 - u ** 2) * m1; }
  return out as V3;
};
const FPS_ = 30; const DIST: number[] = (() => { const d = [0]; let last = herm("p", 0); for (let f = 1; f <= 68 * FPS_ * 4; f++) { const p = herm("p", f / (FPS_ * 4)); d.push(d[d.length - 1] + Math.hypot(p[0] - last[0], p[2] - last[2])); last = p; } return d; })();
export const walked = (t: number) => DIST[Math.min(DIST.length - 1, Math.round(t * FPS_ * 4))];
export const speedAt = (t: number) => (walked(t + 0.1) - walked(t - 0.1)) / 0.2;
const ramp = (arr: number[][], t: number) => { if (t <= arr[0][0]) return arr[0][1]; for (let i = 0; i < arr.length - 1; i++) if (t < arr[i + 1][0]) return mix(arr[i][1], arr[i + 1][1], (t - arr[i][0]) / (arr[i + 1][0] - arr[i][0])); return arr[arr.length - 1][1]; };
export const creepAt = (t: number) => ramp(TL.creep, t);
export const flashAt = (t: number) => { let v = 0; for (const f of TL.flashes) { const d = t - f; if (d >= 0 && d < 0.9) v = Math.max(v, Math.exp(-d * 6) * (0.75 + 0.25 * Math.sin(d * 60))); } return v; };
export const flickerAt = (t: number) => { for (const [a, b] of TL.flicker) if (t >= a && t <= b) { const h = Math.sin(t * 47.3) * Math.sin(t * 13.1 + 1.3); return h > 0.35 ? 0.15 : h > -0.2 ? 1 : 0.55; } return 1; };
const kp = TL.courier as { t: number; x: number; z: number; yaw: number }[];
export const courierAt = (t: number) => {
  for (const [a, b] of TL.courierHidden) if (t >= a && t <= b) return null;
  let i = 0; while (i < kp.length - 2 && kp[i + 1].t <= t) i++; const A = kp[i], B = kp[i + 1]; const u = clamp((t - A.t) / (B.t - A.t)), e = ease(u);
  const x = mix(A.x, B.x, e), z = mix(A.z, B.z, e), yaw = mix(A.yaw, B.yaw, ease(Math.min(1, u * 1.4)));
  const dt = 0.1; const sp = Math.hypot(mix(A.x, B.x, ease(clamp((t + dt - A.t) / (B.t - A.t)))) - mix(A.x, B.x, ease(clamp((t - dt - A.t) / (B.t - A.t)))), mix(A.z, B.z, ease(clamp((t + dt - A.t) / (B.t - A.t)))) - mix(A.z, B.z, ease(clamp((t - dt - A.t) / (B.t - A.t))))) / (2 * dt);
  return { x, z, yaw, speed: sp };
};
const CP: number[] = (() => { const c = [0]; for (let f = 1; f <= 68 * FPS_; f++) { const s = courierAt(f / FPS_); c.push(c[c.length - 1] + (s ? s.speed : 0) / FPS_); } return c; })();
const courierDist = (t: number) => CP[Math.min(CP.length - 1, Math.round(t * FPS_))];

/* --------------------------------------------------------------- the courier */
const hex = (c: THREE.Color) => "#" + c.getHexString();
const skinAt = (creep: number) => hex(new THREE.Color("#e8b48c").lerp(new THREE.Color("#cdbaa8"), Math.round(creep * 10) / 10));
export const CourierW: React.FC<{ t: number; mouth?: number }> = ({ t, mouth = 0 }) => {
  const c = courierAt(t); if (!c) return null;
  const creep = creepAt(t); const walk = clamp(c.speed / 1.2); const ph = courierDist(t) / 0.8 * Math.PI;
  const top = TM("#222f66", "weave", 4, 4), pants = TM("#171f3a", "weave", 3, 5), sk = TM(skinAt(creep));
  const swing = Math.sin(ph) * 0.55 * walk; const bob = Math.abs(Math.sin(ph)) * 0.035 * walk;
  const tilt = creep * (0.2 + 0.05 * Math.sin(t * 0.7)); const headY = Math.sin(t * 0.5) * 0.25 * creep; const lean = walk * 0.06;
  const wave = t > 6.6 && t < 9.2 ? 1 : 0;
  return (
    <group position={[c.x, bob, c.z]} rotation={[0, c.yaw, 0]}>
      <group rotation={[lean, 0, 0]}>
        {[-1, 1].map((k) => <group key={k} position={[k * 0.1, 0.9, 0]} rotation={[k * swing, 0, 0]}><Mesh g={G.cap(0.075, 0.55)} m={pants} p={[0, -0.42, 0]} cast={false} /><Mesh g={G.sph(1, 14, 10)} m={TM("#0c0c10")} p={[0, -0.84, 0.04]} s={[0.085, 0.055, 0.13]} cast={false} /></group>)}
        <Mesh g={G.cap(0.2, 0.42)} m={top} p={[0, 1.18, 0]} s={[1.08, 1, 0.78]} cast={false} />
        <Mesh g={G.box(0.07, 0.07, 0.012)} m={TM("#e0b438", undefined, 1, 1, { emissive: "#4a3a08" })} p={[-0.1, 1.28, 0.16]} cast={false} /><Mesh g={G.box(0.07, 0.12, 0.012)} m={TM("#10162e")} p={[0.12, 1.28, 0.16]} cast={false} />
        {[-1, 1].map((k) => { const raised = k < 0 && wave; const rz = raised ? -(2.5 + Math.sin(t * 5) * 0.2) : k * (0.1 + 0.04 * Math.sin(t)); const rx = raised ? 0 : -k * swing * 0.9; return (
          <group key={k} position={[k * 0.27, 1.38, 0]} rotation={[rx, 0, rz]}><Mesh g={G.cap(0.062, 0.42)} m={top} p={[0, -0.24, 0]} cast={false} /><Mesh g={G.sph(1, 14, 10)} m={sk} p={[0, -0.54, 0]} s={[0.065, 0.075, 0.045]} cast={false} /></group>); })}
        <Mesh g={G.cyl(0.07, 0.08, 0.1, 18)} m={sk} p={[0, 1.6, 0]} cast={false} />
        {t < 40.2 ? <Mesh g={G.rbox(0.42, 0.3, 0.32, 0.02)} m={TM("#c89a60", "wood", 1, 1)} p={[0, 0.98, 0.34]} cast={false} /> : null}
        <group position={[0, 1.8, 0]} rotation={[0, headY, tilt]}><FaceC creep={creep} mouth={mouth} t={t} /></group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[0.45, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} /></mesh>
    </group>
  );
};
const HEMI = new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2);
const FaceC: React.FC<{ creep: number; mouth: number; t: number }> = ({ creep, mouth, t }) => {
  const sk = TM(skinAt(creep)); const eo = creep > 0.5 ? 1 : Math.max(0.08, 1 - ((t % 3.3) < 0.12 ? Math.sin(((t % 3.3) / 0.12) * Math.PI) : 0));
  const es = 1 + 0.22 * creep, ps = 1 - 0.45 * creep; const smile = 0.35 + 0.65 * creep;
  return (
    <group>
      <Mesh g={G.sph(1, 48, 32)} m={sk} s={[0.2, 0.22, 0.2]} cast={false} />
      {[-1, 1].map((k) => <Mesh key={k} g={G.sph(1, 16, 12)} m={sk} p={[k * 0.2, -0.01, -0.01]} s={[0.035, 0.055, 0.04]} cast={false} />)}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.085, 0.03, 0.17]} scale={[es, eo * es, 1]}>
          <Mesh g={G.sph(1, 24, 16)} m={TM("#f4f4f4", undefined, 1, 1, { emissive: "#303030" })} s={[0.062, 0.066, 0.03]} cast={false} />
          <Mesh g={G.sph(1, 20, 14)} m={BM("#0a0a0e")} p={[0, creep * -0.004, 0.024]} s={[0.035 * ps, 0.038 * ps, 0.012]} cast={false} />
          <Mesh g={G.sph(1, 14, 10)} m={TM("#3a2a40")} p={[0, -0.066, 0.004]} s={[0.058, 0.016 * (0.4 + creep), 0.02]} cast={false} />
          <Mesh g={G.cap(0.004, 0.06)} m={TM("#241812")} p={[0, 0.088 + creep * 0.01, 0.012]} r={[0, 0, Math.PI / 2 + k * creep * 0.5]} cast={false} />
        </group>))}
      <Mesh g={G.sph(1, 14, 10)} m={TM("#e2a07c")} p={[0, -0.02, 0.2]} s={[0.026, 0.022, 0.02]} cast={false} />
      <Mesh g={G.cap(0.012, 0.07)} m={BM("#161012")} p={[0, -0.075, 0.195]} r={[0, 0, Math.PI / 2]} cast={false} />
      <group position={[0, -0.112, 0.186]}>
        {mouth > 0.05 ? <Mesh g={G.sph(1, 16, 12)} m={BM("#4a0e18")} s={[0.034 + 0.02 * creep, 0.008 + 0.034 * mouth, 0.012]} cast={false} /> : <>
          <Mesh g={G.sph(1, 16, 12)} m={BM("#f2eede")} p={[0, -0.004, -0.001]} s={[0.03 + 0.045 * smile, 0.006 + 0.016 * smile, 0.01]} cast={false} />
          <Mesh g={G.torus(0.04 + 0.03 * smile, 0.0035, Math.PI)} m={BM("#6a1a22")} p={[0, 0.0 + 0.03 * smile, 0.002]} r={[0, 0, Math.PI]} s={[1, 0.3 + 0.5 * smile, 1]} cast={false} /></>}
      </group>
      <Mesh g={HEMI} m={TM("#232d52", "weave", 3, 3)} p={[0, 0.13, -0.005]} s={[0.215, 0.14, 0.215]} cast={false} /><Mesh g={G.cyl(0.2, 0.2, 0.022, 36)} m={TM("#232d52")} p={[0, 0.135, 0.06]} s={[1, 1, 0.8]} r={[0.1, 0, 0]} cast={false} /><Mesh g={G.box(0.06, 0.05, 0.012)} m={TM("#d8b040", undefined, 1, 1, { emissive: "#3a3010" })} p={[0, 0.22, 0.2]} cast={false} />
    </group>
  );
};

/* --------------------------------------------------------------- the house (living room, front porch, back yard) */
const Door: React.FC<{ jiggle: number }> = ({ jiggle }) => (
  <group position={[1.9, 0, -3.43]}>
    <Mesh g={G.box(1.2, 2.3, 0.06)} m={TM("#f2ece0", "plaster")} p={[0, 1.15, -0.02]} cast={false} />
    <group rotation={[0, 0, jiggle * 0.012]} position={[0, 0, jiggle * 0.01]}>
      <Mesh g={G.box(1.0, 2.14, 0.07)} m={TM("#1f8f72", "door")} p={[0, 1.08, 0.01]} cast={false} />
      <Mesh g={G.cyl(0.035, 0.035, 0.06, 16)} m={TM("#d0a040", undefined, 1, 1, { emissive: "#3a2a08" })} p={[0.38, 1.0, 0.08]} r={[Math.PI / 2, 0, 0]} cast={false} />
      <Mesh g={G.box(0.12, 0.022, 0.03)} m={TM("#d0a040")} p={[0.31, 1.0, 0.1]} r={[0, 0, -jiggle * 0.25]} cast={false} />
      <Mesh g={G.cyl(0.02, 0.02, 0.05, 12)} m={TM("#d0a040")} p={[0.38, 1.22, 0.07]} r={[Math.PI / 2, 0, 0]} cast={false} />
      <Mesh g={G.cyl(0.018, 0.018, 0.02, 14)} m={TM("#d0a040", undefined, 1, 1, { emissive: "#3a2a08" })} p={[0, 1.6, 0.06]} r={[Math.PI / 2, 0, 0]} cast={false} />
    </group>
  </group>
);
export const HouseW: React.FC<{ t: number }> = ({ t }) => {
  const fl = flashAt(t), fk = flickerAt(t); const jg = t > TL.jiggle[0] && t < TL.jiggle[1] ? Math.sin((t - TL.jiggle[0]) * 55) : 0;
  const lamp = 8 * fk * (1 - fl * 0.2); const sky = 1 + fl * 2.2;
  return (
    <group>
      {/* floor, walls (front wall z=-3.5, back wall z=3.5 with a window), ceiling */}
      <Mesh g={G.box(8.4, 0.1, 7.4)} m={TM("#c28a52", "wood", 4, 3)} p={[0, -0.05, 0]} cast={false} />
      <Mesh g={G.box(8, 2.7, 0.1)} m={TM("#d6c0a0", "wall", 3, 1)} p={[0, 1.35, -3.5]} cast={false} />
      <Mesh g={G.box(0.1, 2.7, 7)} m={TM("#d6c0a0", "wall", 3, 1)} p={[-4, 1.35, 0]} cast={false} /><Mesh g={G.box(0.1, 2.7, 7)} m={TM("#d6c0a0", "wall", 3, 1)} p={[4, 1.35, 0]} cast={false} />
      <Mesh g={G.box(8, 0.1, 7)} m={TM("#efe6d6", "plaster", 2, 2)} p={[0, 2.72, 0]} cast={false} />
      <Mesh g={G.box(5.4, 2.7, 0.1)} m={TM("#d6c0a0", "wall", 2, 1)} p={[-1.3, 1.35, 3.5]} cast={false} /><Mesh g={G.box(1.0, 2.7, 0.1)} m={TM("#d6c0a0", "wall", 1, 1)} p={[3.5, 1.35, 3.5]} cast={false} />
      <Mesh g={G.box(1.6, 0.45, 0.1)} m={TM("#d6c0a0", "wall", 1, 1)} p={[2.2, 2.475, 3.5]} cast={false} /><Mesh g={G.box(1.6, 0.75, 0.1)} m={TM("#d6c0a0", "wall", 1, 1)} p={[2.2, 0.375, 3.5]} cast={false} />
      {/* skirting + crown trim for depth */}
      {[-3.44].map((z) => <Mesh key={z} g={G.box(8, 0.16, 0.05)} m={TM("#f0e8d8", "plaster")} p={[0, 0.08, z]} cast={false} />)}<Mesh g={G.box(8, 0.12, 0.05)} m={TM("#f0e8d8", "plaster")} p={[0, 2.64, -3.44]} cast={false} />
      <Mesh g={G.box(0.05, 0.16, 7)} m={TM("#f0e8d8", "plaster")} p={[-3.94, 0.08, 0]} cast={false} /><Mesh g={G.box(0.05, 0.16, 7)} m={TM("#f0e8d8", "plaster")} p={[3.94, 0.08, 0]} cast={false} />
      <Mesh g={G.cyl(0.4, 0.4, 0.05, 28)} m={TM("#fff2d0", undefined, 1, 1, { emissive: "#ffe8a8", ei: 1.4 * fk })} p={[0.4, 2.68, -1.2]} cast={false} />
      {/* back window (glass + night + rain) */}
      <group position={[2.2, 1.5, 3.5]}>
        <group rotation={[0, Math.PI, 0]}><RainW p={[0, 0, -1.5]} w={3.2} h={2.4} t={t} /></group>
        {[[0, 0.78, 1.8, 0.07], [0, -0.78, 1.8, 0.07]].map((q, i) => <Mesh key={i} g={G.box(q[2], q[3], 0.14)} m={TM("#f2ece0", "plaster")} p={[q[0], q[1], 0]} cast={false} />)}
        {[-0.82, 0.82, 0].map((x, i) => <Mesh key={i} g={G.box(i === 2 ? 0.05 : 0.08, 1.6, 0.14)} m={TM("#f2ece0", "plaster")} p={[x, 0, 0]} cast={false} />)}
        <Mesh g={G.box(1.9, 0.06, 0.22)} m={TM("#f2ece0", "plaster")} p={[0, -0.82, -0.08]} cast={false} />
        <mesh position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.56, 1.46]} /><meshBasicMaterial color="#8aa8ff" transparent opacity={0.07 + fl * 0.25} depthWrite={false} /></mesh>
      </group>
      <Mesh g={G.box(40, 0.1, 30)} m={TM("#25382c", "ground", 14, 10)} p={[0, -0.12, 20]} cast={false} />
      <Mesh g={G.box(60, 14, 0.5)} m={TM("#223a74", undefined, 1, 1, { emissive: "#1a2a60", ei: 0.4 + fl })} p={[0, 5, 13]} cast={false} />
      {[-6, 5].map((x, i) => <Mesh key={i} g={G.box(4 + i, 3 + i, 0.5)} m={TM("#142450")} p={[x, 1.5, 12.6]} cast={false} />)}
      {/* left window with curtain */}
      <group position={[-3.93, 1.55, -1.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><planeGeometry args={[1.6, 1.4]} /><meshBasicMaterial map={tx("night")} color={new THREE.Color(sky, sky, sky * 1.1)} /></mesh><RainW p={[0, 0, 0.01]} w={1.6} h={1.4} t={t} speed={1.1} />
        <Mesh g={G.box(1.8, 0.07, 0.1)} m={TM("#f2ece0", "plaster")} p={[0, 0.74, 0.03]} cast={false} /><Mesh g={G.box(1.8, 0.07, 0.1)} m={TM("#f2ece0", "plaster")} p={[0, -0.74, 0.03]} cast={false} /><Mesh g={G.box(0.05, 1.5, 0.1)} m={TM("#f2ece0", "plaster")} p={[0, 0, 0.03]} cast={false} />
        <Mesh g={G.box(0.5, 1.9, 0.12)} m={TM("#b0262c", "fabric", 1, 2)} p={[-0.95, -0.05, 0.12]} cast={false} /><Mesh g={G.box(0.5, 1.9, 0.12)} m={TM("#b0262c", "fabric", 1, 2)} p={[0.95, -0.05, 0.12]} cast={false} />
      </group>
      {/* TV + cabinet */}
      <group position={[-1.7, 0, -3.2]}><Mesh g={G.box(1.8, 0.55, 0.45)} m={TM("#8a5a34", "wood", 1, 1)} p={[0, 0.28, 0]} cast={false} /><Mesh g={G.box(1.25, 0.72, 0.06)} m={TM("#14161c")} p={[0, 1.0, 0]} cast={false} /><mesh position={[0, 1.0, 0.04]}><planeGeometry args={[1.18, 0.65]} /><meshBasicMaterial color={new THREE.Color(0.55 * fk * (0.9 + 0.1 * Math.sin(t * 19)) + fl * 0.3, 0.7 * fk, 1.0 * fk)} /></mesh></group>
      <Door jiggle={jg} />
      <Mesh g={G.cyl(0.07, 0.06, 0.4, 16)} m={TM("#17171c")} p={[1.15, 0.2, -3.2]} cast={false} /><Mesh g={G.cap(0.012, 0.5)} m={TM("#d8332a")} p={[1.15, 0.65, -3.2]} cast={false} />
      <Mesh g={G.box(1.0, 0.03, 0.6)} m={TM("#3a3a40", "weave", 3, 2)} p={[1.9, 0.02, -2.9]} cast={false} />
      {[[-0.2, 1.8, 0.44, 0.34, "#e2a838"], [0.2, 1.95, 0.26, 0.24, "#5aa0c8"]].map(([x, y, w, h, c], i) => <group key={i} position={[x as number, y as number, -3.43]}><Mesh g={G.box((w as number) + 0.06, (h as number) + 0.06, 0.03)} m={TM("#5a4030", "wood")} cast={false} /><Mesh g={G.box(w as number, h as number, 0.035)} m={TM(c as string, "plaster")} cast={false} /></group>)}
      {/* rug, coffee table, mug */}
      <Mesh g={G.box(4.2, 0.03, 3.2)} m={TM("#c04a38", "rug", 1, 1)} p={[0, 0.02, -0.4]} cast={false} />
      <group position={[0, 0, -0.5]}><Mesh g={G.box(1.5, 0.08, 0.85)} m={TM("#8c5e3a", "wood", 1, 1)} p={[0, 0.48, 0]} cast={false} />{[-0.65, 0.65].map((x) => [-0.32, 0.32].map((z) => <Mesh key={`${x}${z}`} g={G.box(0.08, 0.46, 0.08)} m={TM("#6a442a", "wood")} p={[x, 0.23, z]} cast={false} />))}<Mesh g={G.cyl(0.07, 0.06, 0.12, 20)} m={TM("#f6f6f2")} p={[0.5, 0.58, 0.1]} cast={false} /><Mesh g={G.box(0.3, 0.03, 0.2)} m={TM("#d02a2a", "fabric")} p={[-0.35, 0.53, 0]} cast={false} /></group>
      {/* sofa + package */}
      <Mesh g={G.box(2.4, 0.5, 1.0)} m={TM("#6a3a30", "fabric", 3, 1)} p={[-0.6, 0.26, 2.95]} cast={false} /><Mesh g={G.box(2.4, 0.8, 0.3)} m={TM("#5a302a", "fabric", 3, 1)} p={[-0.6, 0.8, 3.3]} cast={false} />
      {[-1.85, 0.65].map((x) => <Mesh key={x} g={G.box(0.2, 0.6, 1.0)} m={TM("#5a302a", "fabric")} p={[x, 0.55, 2.95]} cast={false} />)}
      {/* lamp + side table */}
      <group position={[3.0, 0, -2.6]}><Mesh g={G.box(0.5, 0.6, 0.5)} m={TM("#7a4a2c", "wood")} p={[0, 0.3, 0]} cast={false} /><Mesh g={G.cyl(0.02, 0.02, 0.5, 10)} m={TM("#2a2a2e")} p={[0, 0.85, 0]} cast={false} /><Mesh g={G.cyl(0.14, 0.2, 0.3, 24)} m={TM("#fff0c0", "weave", 2, 1, { emissive: "#ffc060", ei: fk })} p={[0, 1.2, 0]} cast={false} /><pointLight position={[0, 1.2, 0.3]} color="#ffb860" intensity={lamp} distance={9} /></group>
      <Mesh g={G.box(0.3, 2.0, 1.4)} m={TM("#5a3c28", "wood")} p={[3.8, 1.0, -0.2]} cast={false} />
      <hemisphereLight args={["#fff0dc", "#6a4a30", 1.15 * (0.55 + 0.45 * fk) + fl * 1.4]} />
      <pointLight position={[-1.7, 1.4, -2.2]} color="#aac8ff" intensity={5 * fk} distance={7} />
      {fl > 0.05 ? <pointLight position={[2.2, 1.6, 3.2]} color="#c8d8ff" intensity={20 * fl} distance={9} /> : null}
      {/* front porch outside the door (z < -3.5): wall, floor, pillars, roof light, backdrop, rain */}
      <group>
        <Mesh g={G.box(12, 0.14, 8)} m={TM("#8a6a4a", "wood", 4, 2)} p={[1.9, -0.07, -7.6]} cast={false} />
        <Mesh g={G.box(60, 0.1, 40)} m={TM("#1c3026", "ground", 14, 10)} p={[0, -0.3, -30]} cast={false} />
        <Mesh g={G.box(12, 4, 0.2)} m={TM("#8a96a8", "siding", 3, 2)} p={[1.9, 2, -3.62]} cast={false} />
        <Mesh g={G.box(0.5, 4.2, 0.5)} m={TM("#d8d4cc", "plaster")} p={[-1.4, 2.1, -5.6]} cast={false} /><Mesh g={G.box(0.5, 4.2, 0.5)} m={TM("#d8d4cc", "plaster")} p={[5.2, 2.1, -5.6]} cast={false} />
        <Mesh g={G.box(8, 0.3, 4.4)} m={TM("#cfc8b8", "plaster")} p={[1.9, 4.15, -5.6]} cast={false} />
        <mesh position={[1.9, 3.98, -5.4]}><cylinderGeometry args={[0.35, 0.35, 0.06, 24]} /><meshBasicMaterial color={new THREE.Color(1 * fk, 0.95 * fk, 0.78 * fk)} /></mesh>
        <Mesh g={G.box(2.4, 1.6, 0.1)} m={TM("#161c30")} p={[-2.0, 2.2, -3.5]} cast={false} />
        <Mesh g={G.box(60, 14, 0.5)} m={TM("#223a74", undefined, 1, 1, { emissive: "#1a2a60", ei: 0.4 + fl })} p={[0, 5, -16]} cast={false} />
        <Mesh g={G.box(5, 3, 0.5)} m={TM("#142450")} p={[-4, 1.5, -15.6]} cast={false} /><Mesh g={G.box(4, 4, 0.5)} m={TM("#142450")} p={[8, 2, -15.6]} cast={false} />
        <spotLight position={[1.9, 3.9, -5.4]} angle={1.0} penumbra={0.7} intensity={70 * fk} color="#ffe0a8" distance={12} target-position={[1.9, 0, -7]} />
        <pointLight position={[1.9, 2.2, -4.0]} color="#b8c8ff" intensity={5} distance={7} />
        <RainW p={[1.9, 2, -6.5]} w={8} h={5} t={t} speed={2.2} /><RainW p={[1.9, 2, -9]} w={12} h={6} t={t * 1.1 + 0.4} speed={2.4} />
      </group>
    </group>
  );
};
export const DOORBELL: { p: V3; l: V3 } = { p: [1.9, 1.75, -3.75], l: [1.9, 1.0, -6.2] };
export const PEEP: { p: V3; l: V3 } = { p: [1.9, 1.62, -3.7], l: [1.9, 1.72, -5.3] };

/* --------------------------------------------------------------- first-person hands (flat cartoon, camera space) */
const Hand: React.FC<{ side: 1 | -1; p: V3; curl?: number; rot?: V3; sk: THREE.Material; sleeve: THREE.Material }> = ({ side, p, curl = 0.2, rot = [0, 0, 0], sk, sleeve }) => (
  <group position={p} rotation={rot}>
    <Mesh g={G.sph(1, 20, 14)} m={sk} s={[0.036, 0.016, 0.044]} cast={false} />
    {[-0.022, -0.007, 0.008, 0.023].map((x, i) => <group key={i} position={[x, 0, -0.038]} rotation={[-curl * 1.2, 0, 0]}><Mesh g={G.cap(0.0095, 0.03 + (i === 1 || i === 2 ? 0.008 : 0))} m={sk} p={[0, 0, -0.026]} r={[Math.PI / 2, 0, 0]} cast={false} /></group>)}
    <group position={[-side * 0.03, 0, -0.012]} rotation={[0, side * (0.6 - curl * 0.3), 0]}><Mesh g={G.cap(0.011, 0.028)} m={sk} p={[0, 0, -0.02]} r={[Math.PI / 2, 0, 0]} cast={false} /></group>
    <Mesh g={G.cap(0.036, 0.34)} m={sleeve} p={[0, -0.1, 0.2]} r={[-1.25, 0, side * 0.1]} cast={false} />
  </group>
);
export const HandsW: React.FC<{ t: number; dark: number }> = ({ t, dark }) => {
  const sleeve = TM(dark ? "#a02a30" : "#d8332a", "fabric", 2, 2); const sk = TM(dark ? "#c8b0b8" : "#f3c19a", undefined, 1, 1, { emissive: dark ? "#2a2a60" : "#3a1c10", ei: 0.4 });
  const v = clamp(speedAt(t) / 0.6); const ph = walked(t) / 0.7 * Math.PI; const sw = Math.sin(ph) * 0.05 * v;
  const sit = t < 4.2 ? 1 : t < 5.0 ? 1 - (t - 4.2) / 0.8 : 0; const fid = Math.sin(t * 1.3) * 0.006;
  const reach = ease((t - 38.2) / 0.7) * (1 - ease((t - 40.4) / 0.5)); const grip = ease((t - 38.9) / 0.2) * (1 - ease((t - 39.7) / 0.3));
  const R: V3 = [mix(0.13 - sw * 0, 0.02, reach), mix(-0.2 + sit * 0.03 + fid, -0.03, reach), mix(-0.34 + sw, -0.6, reach)];
  const L: V3 = [-0.13, -0.2 + sit * 0.03 - fid, -0.34 - sw];
  return (
    <group>
      <Hand side={1} p={R} curl={0.25 + grip * 0.65} rot={[mix(-0.2, 0.05, reach), mix(0.1, 0, reach), 0]} sk={sk} sleeve={sleeve} />
      <Hand side={-1} p={L} curl={0.3} rot={[-0.2, -0.1, 0]} sk={sk} sleeve={sleeve} />
    </group>
  );
};
