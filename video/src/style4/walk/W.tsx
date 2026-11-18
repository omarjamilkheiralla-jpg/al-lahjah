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
  wall: () => cv(256, 512, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,.20)"); gr.addColorStop(0.25, "rgba(0,0,0,0)"); gr.addColorStop(0.85, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.14)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true),
  plaster: () => cv(64, 64, (g, w, h) => { g.fillStyle = "#fafafa"; g.fillRect(0, 0, w, h); }, true),
  wood: () => cv(512, 512, (g, w, h) => { const r = seeded(3); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = 232 + r() * 23; g.fillStyle = `rgb(${v},${v * 0.97},${v * 0.94})`; g.fillRect(j * 64, i * 64, 64, 64); } g.fillStyle = "rgba(50,22,10,.55)"; for (let i = 0; i < 8; i++) { g.fillRect(0, i * 64, w, 3); g.fillRect(i * 64, 0, 3, h); } }, true),
  fabric: () => cv(64, 64, (g, w, h) => { g.fillStyle = "#f6f6f6"; g.fillRect(0, 0, w, h); }, true),
  weave: () => cv(64, 64, (g, w, h) => { g.fillStyle = "#fbfbfb"; g.fillRect(0, 0, w, h); }, true),
  rug: () => cv(256, 256, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,225,190,.85)"; g.fillRect(0, h * 0.46, w, h * 0.08); }, false),
  siding: () => cv(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#e4e4e4" : "#efefef"; g.fillRect(0, i * 32, w, 32); g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, i * 32 + 30, w, 2); } }, true),
  door: () => cv(256, 512, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(34, 34, w - 68, h * 0.36); g.fillRect(34, h * 0.52, w - 68, h * 0.42); }),
  ground: () => cv(64, 64, (g, w, h) => { g.fillStyle = "#e8e8e8"; g.fillRect(0, 0, w, h); }, true),
  night: () => cv(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#16265a"); gr.addColorStop(1, "#2a4182"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
};
export const tx = (n: string, rx = 1, ry = 1) => memo(`tx${n}${rx}${ry}`, () => { const t = TX[n](); t.repeat.set(rx, ry); t.needsUpdate = true; return t; });
export const TM = (color: string, map?: string, rx = 1, ry = 1, o: { emissive?: string; ei?: number } = {}) => memo(`tm${color}|${map}|${rx}|${ry}|${o.emissive}|${o.ei}`, () => new THREE.MeshStandardMaterial({ color, map: map ? tx(map, rx, ry) : null, roughness: 0.72, metalness: 0.0, emissive: o.emissive ?? "#000", emissiveIntensity: o.ei ?? 1 }));
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

const INK = new THREE.MeshBasicMaterial({ color: "#1c2240", side: THREE.BackSide });
type OP = { g: THREE.BufferGeometry; m: THREE.Material; p?: V3; s?: V3; r?: V3; k?: number };
const OM: React.FC<OP> = ({ g, m, p, s, r, k = 0.05 }) => { const sc = s ?? [1, 1, 1]; return <group position={p} rotation={r}><mesh geometry={g} material={m} scale={sc} castShadow receiveShadow /><mesh geometry={g} material={INK} scale={[sc[0] * (1 + k), sc[1] * (1 + k), sc[2] * (1 + k)]} /></group>; };
/* --------------------------------------------------------------- the courier */
const hex = (c: THREE.Color) => "#" + c.getHexString();
const skinAt = (creep: number) => hex(new THREE.Color("#e8b48c").lerp(new THREE.Color("#cdbaa8"), Math.round(creep * 10) / 10));
export const CourierW: React.FC<{ t: number; mouth?: number }> = ({ t, mouth = 0 }) => {
  const c = courierAt(t); if (!c) return null;
  const creep = creepAt(t); const walk = clamp(c.speed / 1.2); const ph = courierDist(t) / 0.8 * Math.PI;
  const top = TM("#233063"), pants = TM("#171f3a"), sk = TM("#e2aa7c"), black = TM("#14161e");
  const swing = Math.sin(ph) * 0.55 * walk; const bob = Math.abs(Math.sin(ph)) * 0.035 * walk;
  const tilt = creep * (0.18 + 0.05 * Math.sin(t * 0.7)); const headY = Math.sin(t * 0.5) * 0.22 * creep; const lean = walk * 0.06;
  const wave = t > 6.6 && t < 9.2 ? 1 : 0;
  return (
    <group position={[c.x, bob, c.z]} rotation={[0, c.yaw, 0]}>
      <group rotation={[lean, 0, 0]}>
        {[-1, 1].map((k) => <group key={k} position={[k * 0.1, 0.9, 0]} rotation={[k * swing, 0, 0]}><OM g={G.cap(0.075, 0.5)} m={pants} p={[0, -0.4, 0]} k={0.07} /><OM g={G.sph(1, 14, 10)} m={black} p={[0, -0.84, 0.045]} s={[0.085, 0.055, 0.13]} k={0.1} /></group>)}
        <OM g={G.cap(0.2, 0.4)} m={top} p={[0, 1.17, 0]} s={[1.1, 1, 0.82]} k={0.04} />
        <OM g={G.box(0.5, 0.06, 0.3)} m={black} p={[0, 0.93, 0]} k={0.05} />
        {[-1, 1].map((k) => <OM key={k} g={G.box(0.15, 0.03, 0.12)} m={black} p={[k * 0.2, 1.47, 0]} r={[0, 0, -k * 0.25]} k={0.1} />)}
        <OM g={G.box(0.07, 0.07, 0.02)} m={TM("#e0b438", undefined, 1, 1, { emissive: "#4a3a08" })} p={[-0.11, 1.29, 0.165]} k={0.1} /><OM g={G.box(0.07, 0.11, 0.02)} m={black} p={[0.11, 1.26, 0.165]} k={0.1} />
        {[-1, 1].map((k) => { const raised = k < 0 && wave; const rz = raised ? -(2.5 + Math.sin(t * 5) * 0.2) : k * (0.1 + 0.04 * Math.sin(t)); const rx = raised ? 0 : -k * swing * 0.9; return (
          <group key={k} position={[k * 0.28, 1.4, 0]} rotation={[rx, 0, rz]}><OM g={G.cap(0.075, 0.38)} m={top} p={[0, -0.25, 0]} k={0.06} /><OM g={G.sph(1, 14, 10)} m={sk} p={[0, -0.56, 0]} s={[0.07, 0.085, 0.055]} k={0.1} /></group>); })}
        {t < 40.2 ? <OM g={G.rbox(0.42, 0.3, 0.32, 0.02)} m={TM("#c89a60")} p={[0, 0.98, 0.36]} k={0.03} /> : null}
        <OM g={G.cyl(0.07, 0.08, 0.1, 18)} m={sk} p={[0, 1.6, 0]} k={0.08} />
        <group position={[0, 1.8, 0]} rotation={[0, headY, tilt]}><FaceR creep={creep} mouth={mouth} /></group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[0.45, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} /></mesh>
    </group>
  );
};
const HEMI = new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2);
/** Face as in the reference reel: tan round head, small black dot eyes, black moustache, navy cap; creepy stage = glowing white eyes. */
const FaceR: React.FC<{ creep: number; mouth: number }> = ({ creep, mouth }) => {
  const sk = TM("#e2aa7c"); const glow = creep > 0.8;
  return (
    <group>
      <OM g={G.sph(1, 48, 32)} m={sk} s={[0.21, 0.2, 0.2]} k={0.03} />
      {[-1, 1].map((k) => <OM key={k} g={G.sph(1, 16, 12)} m={sk} p={[k * 0.205, -0.01, -0.01]} s={[0.035, 0.055, 0.04]} k={0.1} />)}
      {[-1, 1].map((k) => glow
        ? <Mesh key={k} g={G.sph(1, 16, 12)} m={BM("#ffffff")} p={[k * 0.08, 0.02, 0.19]} s={[0.034 + 0.01 * creep, 0.04 + 0.012 * creep, 0.012]} />
        : <OM key={k} g={G.sph(1, 14, 10)} m={BM("#0a0a0e")} p={[k * 0.08, 0.02, 0.19]} s={[0.025, 0.032, 0.012]} k={0.15} />)}
      <OM g={G.sph(1, 14, 10)} m={TM("#e8b48a")} p={[0, -0.025, 0.2]} s={[0.034, 0.03, 0.022]} k={0.12} />
      <Mesh g={G.cap(0.016, 0.07)} m={BM("#15101a")} p={[0, -0.07, 0.196]} r={[0, 0, Math.PI / 2]} s={[1, 1.2, 0.8]} />
      <group position={[0, -0.112, 0.19]}>
        <Mesh g={G.sph(1, 16, 12)} m={BM(mouth > 0.05 || creep > 0.5 ? "#4a0e18" : "#7a2a2a")} s={[0.03 + 0.012 * creep, 0.008 + 0.034 * Math.max(mouth, creep * 0.45), 0.012]} />
      </group>
      <OM g={HEMI} m={TM("#232d52")} p={[0, 0.1, -0.005]} s={[0.22, 0.13, 0.21]} k={0.03} /><OM g={G.cyl(0.2, 0.2, 0.022, 36)} m={TM("#232d52")} p={[0, 0.105, 0.07]} s={[1, 1, 0.8]} r={[0.1, 0, 0]} k={0.04} /><Mesh g={G.box(0.06, 0.05, 0.012)} m={TM("#d8b040", undefined, 1, 1, { emissive: "#3a3010" })} p={[0, 0.2, 0.2]} />
    </group>
  );
};

/* --------------------------------------------------------------- the house (living room, front porch, back yard) */
const Door: React.FC<{ jiggle: number }> = ({ jiggle }) => (
  <group position={[1.9, 0, -3.43]}>
    <OM g={G.box(1.2, 2.3, 0.06)} m={TM("#f2ece0", "plaster")} p={[0, 1.15, -0.02]} k={0.01} />
    <group rotation={[0, 0, jiggle * 0.012]} position={[0, 0, jiggle * 0.01]}>
      <OM g={G.box(1.0, 2.14, 0.07)} m={TM("#1f8f72", "door")} p={[0, 1.08, 0.01]} k={0.012} />
      <Mesh g={G.cyl(0.035, 0.035, 0.06, 16)} m={TM("#d0a040", undefined, 1, 1, { emissive: "#3a2a08" })} p={[0.38, 1.0, 0.08]} r={[Math.PI / 2, 0, 0]} />
      <Mesh g={G.box(0.12, 0.022, 0.03)} m={TM("#d0a040")} p={[0.31, 1.0, 0.1]} r={[0, 0, -jiggle * 0.25]} />
      <Mesh g={G.cyl(0.02, 0.02, 0.05, 12)} m={TM("#d0a040")} p={[0.38, 1.22, 0.07]} r={[Math.PI / 2, 0, 0]} />
      <Mesh g={G.cyl(0.018, 0.018, 0.02, 14)} m={TM("#d0a040", undefined, 1, 1, { emissive: "#3a2a08" })} p={[0, 1.6, 0.06]} r={[Math.PI / 2, 0, 0]} />
    </group>
  </group>
);
const haloTex = () => memo("halo", () => { const t = cv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); return t; });
const Halo: React.FC<{ p: V3; size: number; color: string; op: number }> = ({ p, size, color, op }) => op > 0.01 ? <sprite position={p} scale={[size, size, 1]}><spriteMaterial map={haloTex()} color={color} transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite> : null;
const beamTex = () => memo("beam", () => cv(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.15, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, w, h); }));
const Beam: React.FC<{ from: V3; to: V3; w: number; color: string; op: number }> = ({ from, to, w, color, op }) => {
  const { q, mid, len } = React.useMemo(() => { const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to); const d = b.clone().sub(a); return { q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), mid: a.clone().add(b).multiplyScalar(0.5), len: d.length() }; }, [from[0], from[1], from[2], to[0], to[1], to[2]]);
  if (op < 0.005) return null;
  return <group position={mid} quaternion={q}>{[0, Math.PI / 2].map((r) => <mesh key={r} rotation={[0, r, 0]}><planeGeometry args={[w, len]} /><meshBasicMaterial map={beamTex()} color={color} transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh>)}</group>;
};
const DUST = (() => { const r = seeded(77); const a = new Float32Array(140 * 3); for (let i = 0; i < 140; i++) { a[i * 3] = -1 + r() * 5; a[i * 3 + 1] = 0.2 + r() * 2.3; a[i * 3 + 2] = -1.5 + r() * 5; } return a; })();
const Dust: React.FC<{ t: number; op: number }> = ({ t, op }) => <points position={[Math.sin(t * 0.21) * 0.15, (t * 0.02) % 0.3 - 0.15, Math.cos(t * 0.17) * 0.15]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[DUST, 3]} /></bufferGeometry><pointsMaterial size={0.009} color="#d8e0ff" transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation /></points>;
export const HouseW: React.FC<{ t: number }> = ({ t }) => {
  const fl = flashAt(t), fk = flickerAt(t); const jg = t > TL.jiggle[0] && t < TL.jiggle[1] ? Math.sin((t - TL.jiggle[0]) * 55) : 0;
  const pw = t < 40.6 ? 1 : 0; const lamp = 8 * fk * pw * (1 - fl * 0.2); const sky = 1 + fl * 2.2; const fkk = fk * pw;
  return (
    <group>
      {/* floor, walls (front wall z=-3.5, back wall z=3.5 with a window), ceiling */}
      <Mesh g={G.box(8.4, 0.1, 7.4)} m={TM("#c28a52", "wood", 4, 3)} p={[0, -0.05, 0]} />
      <Mesh g={G.box(8, 2.7, 0.1)} m={TM("#cdbb98", "wall", 3, 1)} p={[0, 1.35, -3.5]} />
      <Mesh g={G.box(0.1, 2.7, 7)} m={TM("#cdbb98", "wall", 3, 1)} p={[-4, 1.35, 0]} /><Mesh g={G.box(0.1, 2.7, 7)} m={TM("#cdbb98", "wall", 3, 1)} p={[4, 1.35, 0]} />
      <Mesh g={G.box(8, 0.1, 7)} m={TM("#efe6d6", "plaster", 2, 2)} p={[0, 2.72, 0]} />
      <Mesh g={G.box(5.4, 2.7, 0.1)} m={TM("#cdbb98", "wall", 2, 1)} p={[-1.3, 1.35, 3.5]} /><Mesh g={G.box(1.0, 2.7, 0.1)} m={TM("#cdbb98", "wall", 1, 1)} p={[3.5, 1.35, 3.5]} />
      <Mesh g={G.box(1.6, 0.45, 0.1)} m={TM("#cdbb98", "wall", 1, 1)} p={[2.2, 2.475, 3.5]} /><Mesh g={G.box(1.6, 0.75, 0.1)} m={TM("#cdbb98", "wall", 1, 1)} p={[2.2, 0.375, 3.5]} />
      {/* skirting + crown trim for depth */}
      {[-3.44].map((z) => <Mesh key={z} g={G.box(8, 0.16, 0.05)} m={TM("#f0e8d8", "plaster")} p={[0, 0.08, z]} />)}<Mesh g={G.box(8, 0.12, 0.05)} m={TM("#f0e8d8", "plaster")} p={[0, 2.64, -3.44]} />
      <Mesh g={G.box(0.05, 0.16, 7)} m={TM("#f0e8d8", "plaster")} p={[-3.94, 0.08, 0]} /><Mesh g={G.box(0.05, 0.16, 7)} m={TM("#f0e8d8", "plaster")} p={[3.94, 0.08, 0]} />
      <Mesh g={G.cyl(0.4, 0.4, 0.05, 28)} m={TM("#fff2d0", undefined, 1, 1, { emissive: "#ffe8a8", ei: 1.4 * fkk })} p={[0.4, 2.68, -1.2]} />
      {/* back window (glass + night + rain) */}
      <group position={[2.2, 1.5, 3.5]}>
        <group rotation={[0, Math.PI, 0]}><RainW p={[0, 0, -1.5]} w={3.2} h={2.4} t={t} /></group>
        {[[0, 0.78, 1.8, 0.07], [0, -0.78, 1.8, 0.07]].map((q, i) => <Mesh key={i} g={G.box(q[2], q[3], 0.14)} m={TM("#f2ece0", "plaster")} p={[q[0], q[1], 0]} />)}
        {[-0.82, 0.82, 0].map((x, i) => <Mesh key={i} g={G.box(i === 2 ? 0.05 : 0.08, 1.6, 0.14)} m={TM("#f2ece0", "plaster")} p={[x, 0, 0]} />)}
        <Mesh g={G.box(1.9, 0.06, 0.22)} m={TM("#f2ece0", "plaster")} p={[0, -0.82, -0.08]} />
        <mesh position={[0, 0, -0.06]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.56, 1.46]} /><meshBasicMaterial color="#8aa8ff" transparent opacity={0.07 + fl * 0.25} depthWrite={false} /></mesh>
      </group>
      <Mesh g={G.box(40, 0.1, 30)} m={TM("#25382c", "ground", 14, 10)} p={[0, -0.12, 20]} />
      <Mesh g={G.box(60, 14, 0.5)} m={TM("#223a74", undefined, 1, 1, { emissive: "#1a2a60", ei: 0.4 + fl })} p={[0, 5, 13]} />
      {[-6, 5].map((x, i) => <Mesh key={i} g={G.box(4 + i, 3 + i, 0.5)} m={TM("#142450")} p={[x, 1.5, 12.6]} />)}
      {/* left window with curtain */}
      <group position={[-3.93, 1.55, -1.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh><planeGeometry args={[1.6, 1.4]} /><meshBasicMaterial map={tx("night")} color={new THREE.Color(sky, sky, sky * 1.1)} /></mesh><RainW p={[0, 0, 0.01]} w={1.6} h={1.4} t={t} speed={1.1} />
        <Mesh g={G.box(1.8, 0.07, 0.1)} m={TM("#f2ece0", "plaster")} p={[0, 0.74, 0.03]} /><Mesh g={G.box(1.8, 0.07, 0.1)} m={TM("#f2ece0", "plaster")} p={[0, -0.74, 0.03]} /><Mesh g={G.box(0.05, 1.5, 0.1)} m={TM("#f2ece0", "plaster")} p={[0, 0, 0.03]} />
        <Mesh g={G.box(0.5, 1.9, 0.12)} m={TM("#b0262c", "fabric", 1, 2)} p={[-0.95, -0.05, 0.12]} /><Mesh g={G.box(0.5, 1.9, 0.12)} m={TM("#b0262c", "fabric", 1, 2)} p={[0.95, -0.05, 0.12]} />
      </group>
      {/* TV + cabinet */}
      <group position={[-1.7, 0, -3.2]}><OM g={G.box(1.8, 0.55, 0.45)} m={TM("#8a5a34")} p={[0, 0.28, 0]} k={0.015} /><OM g={G.box(1.25, 0.72, 0.06)} m={TM("#14161c")} p={[0, 1.0, 0]} k={0.02} /><mesh position={[0, 1.0, 0.04]}><planeGeometry args={[1.18, 0.65]} /><meshBasicMaterial color={new THREE.Color(pw * (0.8 * fk * (0.95 + 0.05 * Math.sin(t * 19))) + fl * 0.3, pw * 0.85 * fk, pw * 1.0 * fk)} /></mesh></group>
      <Door jiggle={jg} />
      <Mesh g={G.cyl(0.07, 0.06, 0.4, 16)} m={TM("#17171c")} p={[1.15, 0.2, -3.2]} /><Mesh g={G.cap(0.012, 0.5)} m={TM("#d8332a")} p={[1.15, 0.65, -3.2]} />
      <Mesh g={G.box(1.0, 0.03, 0.6)} m={TM("#3a3a40", "weave", 3, 2)} p={[1.9, 0.02, -2.9]} />
      {[[-0.2, 1.8, 0.44, 0.34, "#e2a838"], [0.2, 1.95, 0.26, 0.24, "#5aa0c8"]].map(([x, y, w, h, c], i) => <group key={i} position={[x as number, y as number, -3.43]}><Mesh g={G.box((w as number) + 0.06, (h as number) + 0.06, 0.03)} m={TM("#5a4030", "wood")} /><Mesh g={G.box(w as number, h as number, 0.035)} m={TM(c as string, "plaster")} /></group>)}
      {/* rug, coffee table, mug */}
      <Mesh g={G.box(4.2, 0.03, 3.2)} m={TM("#c04a38", "rug", 1, 1)} p={[0, 0.02, -0.4]} />
      <group position={[0, 0, -0.5]}><OM g={G.box(1.5, 0.08, 0.85)} m={TM("#8c5e3a")} p={[0, 0.48, 0]} k={0.02} />{[-0.65, 0.65].map((x) => [-0.32, 0.32].map((z) => <Mesh key={`${x}${z}`} g={G.box(0.08, 0.46, 0.08)} m={TM("#6a442a", "wood")} p={[x, 0.23, z]} />))}<Mesh g={G.cyl(0.07, 0.06, 0.12, 20)} m={TM("#f6f6f2")} p={[0.5, 0.58, 0.1]} /><Mesh g={G.box(0.3, 0.03, 0.2)} m={TM("#d02a2a", "fabric")} p={[-0.35, 0.53, 0]} /></group>
      {/* sofa + package */}
      <OM g={G.box(2.4, 0.5, 1.0)} m={TM("#6a3a30")} p={[-0.6, 0.26, 2.95]} k={0.01} /><OM g={G.box(2.4, 0.8, 0.3)} m={TM("#5a302a")} p={[-0.6, 0.8, 3.3]} k={0.012} />
      {[-1.85, 0.65].map((x) => <Mesh key={x} g={G.box(0.2, 0.6, 1.0)} m={TM("#5a302a", "fabric")} p={[x, 0.55, 2.95]} />)}
      {/* lamp + side table */}
      <group position={[3.0, 0, -2.6]}><OM g={G.box(0.5, 0.6, 0.5)} m={TM("#7a4a2c")} p={[0, 0.3, 0]} k={0.03} /><Mesh g={G.cyl(0.02, 0.02, 0.5, 10)} m={TM("#2a2a2e")} p={[0, 0.85, 0]} /><Mesh g={G.cyl(0.14, 0.2, 0.3, 24)} m={TM("#fff0c0", "weave", 2, 1, { emissive: "#ffc060", ei: fkk })} p={[0, 1.2, 0]} /><pointLight position={[0, 1.2, 0.3]} color="#ffb860" intensity={lamp} distance={9} /></group>
      <Mesh g={G.box(0.3, 2.0, 1.4)} m={TM("#5a3c28", "wood")} p={[3.8, 1.0, -0.2]} />
      <hemisphereLight args={[pw ? "#fff0dc" : "#5a68c8", pw ? "#6a4a30" : "#2a2a60", pw ? 1.15 * (0.55 + 0.45 * fk) + fl * 1.4 : 0.8 + fl * 1.6]} />
      <pointLight position={[-1.7, 1.4, -2.2]} color="#aac8ff" intensity={5 * fkk} distance={7} />{pw ? null : <pointLight position={[0, 2.2, 0]} color="#6a78e0" intensity={9} distance={14} />}
      {fl > 0.05 ? <pointLight position={[2.2, 1.6, 3.2]} color="#c8d8ff" intensity={20 * fl} distance={9} /> : null}
      <spotLight position={[0.4, 2.6, -1.2]} angle={1.25} penumbra={0.9} intensity={22 * fkk} color="#ffd9a0" distance={12} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0006} target-position={[0.4, 0, -1.2]} />
      <directionalLight position={[2.6, 3.2, 7]} intensity={0.55 + fl * 4} color="#8aa8ff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0006} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={20} target-position={[0.6, 0, 0.2]} />
      <Beam from={[2.2, 1.7, 3.45]} to={[0.6, 0.1, 0.4]} w={1.6} color="#7f9cff" op={0.02 + fl * 0.3} />
      <Halo p={[3.0, 1.25, -2.6]} size={1.6} color="#ffb060" op={0.55 * fkk} /><Halo p={[0.4, 2.6, -1.2]} size={2.4} color="#ffe2b0" op={0.45 * fkk} />
      <Halo p={[-1.7, 1.0, -3.0]} size={2.2} color="#7fa8ff" op={0.4 * fkk} />
      <Dust t={t} op={0.28 + fl * 0.4} />
      {/* front porch outside the door (z < -3.5): wall, floor, pillars, roof light, backdrop, rain */}
      <group>
        <Mesh g={G.box(12, 0.14, 8)} m={TM("#8a6a4a", "wood", 4, 2)} p={[1.9, -0.07, -7.6]} />
        <Mesh g={G.box(60, 0.1, 40)} m={TM("#1c3026", "ground", 14, 10)} p={[0, -0.3, -30]} />
        <Mesh g={G.box(12, 4, 0.2)} m={TM("#8a96a8", "siding", 3, 2)} p={[1.9, 2, -3.62]} />
        <Mesh g={G.box(0.5, 4.2, 0.5)} m={TM("#d8d4cc", "plaster")} p={[-1.4, 2.1, -5.6]} /><Mesh g={G.box(0.5, 4.2, 0.5)} m={TM("#d8d4cc", "plaster")} p={[5.2, 2.1, -5.6]} />
        <Mesh g={G.box(8, 0.3, 4.4)} m={TM("#cfc8b8", "plaster")} p={[1.9, 4.15, -5.6]} />
        <mesh position={[1.9, 3.98, -5.4]}><cylinderGeometry args={[0.35, 0.35, 0.06, 24]} /><meshBasicMaterial color={new THREE.Color(1 * fk, 0.95 * fk, 0.78 * fk)} /></mesh>
        <Mesh g={G.box(2.4, 1.6, 0.1)} m={TM("#161c30")} p={[-2.0, 2.2, -3.5]} />
        <Mesh g={G.box(60, 14, 0.5)} m={TM("#223a74", undefined, 1, 1, { emissive: "#1a2a60", ei: 0.4 + fl })} p={[0, 5, -16]} />
        <Mesh g={G.box(5, 3, 0.5)} m={TM("#142450")} p={[-4, 1.5, -15.6]} /><Mesh g={G.box(4, 4, 0.5)} m={TM("#142450")} p={[8, 2, -15.6]} />
        <spotLight position={[1.9, 3.9, -5.4]} angle={1.0} penumbra={0.7} intensity={70 * fk} color="#ffe0a8" distance={12} castShadow shadow-bias={-0.0006} target-position={[1.9, 0, -7]} /><Halo p={[1.9, 3.95, -5.4]} size={2.6} color="#ffe6b0" op={0.5 * fk} />
        <pointLight position={[1.9, 2.2, -4.0]} color="#b8c8ff" intensity={5} distance={7} />
        <RainW p={[1.9, 2, -6.5]} w={8} h={5} t={t} speed={2.2} /><RainW p={[1.9, 2, -9]} w={12} h={6} t={t * 1.1 + 0.4} speed={2.4} />
      </group>
    </group>
  );
};
export const DOORBELL: { p: V3; l: V3 } = { p: [1.9, 1.75, -3.75], l: [1.9, 1.0, -6.2] };
export const PEEP: { p: V3; l: V3 } = { p: [1.9, 1.78, -3.7], l: [1.9, 1.78, -5.0] };

/* --------------------------------------------------------------- first-person hands (flat cartoon, camera space) */
const Hand: React.FC<{ side: 1 | -1; p: V3; curl?: number; rot?: V3; sk: THREE.Material; sleeve: THREE.Material }> = ({ side, p, curl = 0.2, rot = [0, 0, 0], sk, sleeve }) => (
  <group position={p} rotation={rot}>
    <OM g={G.sph(1, 20, 14)} m={sk} s={[0.04, 0.022, 0.048]} k={0.09} />
    {[-0.027, -0.009, 0.009, 0.027].map((x, i) => <group key={i} position={[x, 0, -0.04]} rotation={[-curl * 1.2, 0, 0]}><OM g={G.cap(0.0115, 0.026 + (i === 1 || i === 2 ? 0.008 : 0))} m={sk} p={[0, 0, -0.022]} r={[Math.PI / 2, 0, 0]} k={0.12} /></group>)}
    <group position={[-side * 0.036, 0, -0.012]} rotation={[0, side * (0.6 - curl * 0.3), 0]}><OM g={G.cap(0.0135, 0.03)} m={sk} p={[0, 0, -0.022]} r={[Math.PI / 2, 0, 0]} k={0.12} /></group>
    <OM g={G.cap(0.04, 0.34)} m={sleeve} p={[0, -0.1, 0.2]} r={[-1.25, 0, side * 0.1]} k={0.06} />
  </group>
);
export const HandsW: React.FC<{ t: number; dark: number }> = ({ t, dark }) => {
  const sleeve = TM(dark ? "#a02a30" : "#d8332a"); const sk = TM(dark ? "#c8b0b8" : "#f1b890", undefined, 1, 1, { emissive: dark ? "#2a2a60" : "#3a1c10", ei: 0.35 });
  const v = clamp(speedAt(t) / 0.6); const ph = walked(t) / 0.7 * Math.PI; const sw = Math.sin(ph) * 0.05 * v;
  const hold = t < 4.6 ? 1 : 0; const fid = Math.sin(t * 1.3) * 0.006;
  const reach = ease((t - 38.2) / 0.7) * (1 - ease((t - 40.4) / 0.5)); const grip = ease((t - 38.9) / 0.2) * (1 - ease((t - 39.7) / 0.3));
  const R: V3 = [mix(0.13 - hold * 0.06, 0.02, reach), mix(-0.2 + fid, -0.03, reach), mix(-0.34 + sw, -0.6, reach)];
  const L: V3 = [-0.13 + hold * 0.06, -0.2 - fid, -0.34 - sw];
  return (
    <group>
      {hold ? <OM g={G.rbox(0.07, 0.015, 0.15, 0.008)} m={TM("#0c0c10")} p={[0, -0.215, -0.36]} r={[0.08, 0, 0]} k={0.05} /> : null}
      <Hand side={1} p={R} curl={hold ? 0.9 : 0.35 + grip * 0.5} rot={[mix(-0.2, 0.05, reach), mix(hold ? -0.15 : 0.1, 0, reach), 0]} sk={sk} sleeve={sleeve} />
      <Hand side={-1} p={L} curl={hold ? 0.9 : 0.4} rot={[-0.2, hold ? 0.15 : -0.1, 0]} sk={sk} sleeve={sleeve} />
    </group>
  );
};
