import * as THREE from "three";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFonts } from "../full/fonts";
import { Person2 } from "../full/person";
import { LOOKS } from "../full/paint";
import { ContactShadow, yawToward } from "../hotel/chars";
import { PostFX } from "../hotel/PostFX";
import { cv } from "../emu/world";
import { Town } from "../town/scenes";
import { CROWD } from "../town/looks";
import { Ink, box, toon, geo, rep, signTex, Car, Tree, Building, type V3 } from "../town/world";

/** STYLE 2 sample v2: "What if every step you took was twice as long as the last?"  (step n = 0.75 m x 2^(n-1)) */
export const FPS = 60;
const TITLE_D = 2.6, STEP_D = 2.5, END_D = 2.4;
type Step = { n: number; val: string; name: string; sub: string; cap: string };
const STEPS: Step[] = [
  { n: 1, val: "0.75 m", name: "A NORMAL STEP", sub: "ABOUT 2½ FEET", cap: "You take a normal step." },
  { n: 5, val: "12 m", name: "A SCHOOL BUS", sub: "16× A NORMAL STEP", cap: "One stride clears a school bus." },
  { n: 8, val: "96 m", name: "ABOUT A FOOTBALL FIELD", sub: "128× A NORMAL STEP", cap: "One stride crosses the whole stadium." },
  { n: 10, val: "384 m", name: "THE EMPIRE STATE BUILDING", sub: "512× A NORMAL STEP", cap: "You step over the tallest tower in town." },
  { n: 20, val: "393 km", name: "ALMOST THE SPACE STATION'S HEIGHT", sub: "524,288× A NORMAL STEP · NOT TO SCALE", cap: "One step now reaches orbit height." },
  { n: 25, val: "12,583 km", name: "ALMOST THE WIDTH OF EARTH", sub: "16.8 MILLION× A NORMAL STEP · NOT TO SCALE", cap: "One step is as wide as the planet." },
  { n: 30, val: "402,653 km", name: "FARTHER THAN THE MOON", sub: "537 MILLION× A NORMAL STEP · NOT TO SCALE", cap: "You step right past the Moon." },
];
export const STYLE2_TOTAL = TITLE_D + STEPS.length * STEP_D + END_D;

(LOOKS as any).hero = { skin: "#efd2b8", skinShade: "#c9a8b8", hair: "#6a3a24", hairHi: "#a8683f", hairStyle: "side", shirt: "#f5c518", shirtShade: "#c49a10", shirtHi: "#ffe27a", pants: "#2fbf4a", hat: "cap", hatColor: "#2f5fd0", collar: "#ffffff" };

const ease = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const seeded = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const BM = (c: string) => memo("bm" + c, () => new THREE.MeshBasicMaterial({ color: c }));

/* ------------------------------------------------------------------ people */
const P: React.FC<{ look: string; p: V3; cam: V3; t: number; s?: number; pose?: any; expr?: any; yaw?: number; seed?: number; tint?: string; emph?: number }> = ({ look, p, cam, t, s = 1.5, pose = "idle", expr = "deadpan", yaw, seed = 1, tint, emph }) => (
  <>
    <Person2 look={look as any} expr={expr} t={t} position={p} yaw={yaw ?? yawToward(p, cam)} scale={s} seed={seed} pose={pose} tint={tint} emph={emph} />
    {p[1] < 0.5 ? <ContactShadow position={[p[0], p[1] + 0.02, p[2]]} r={0.42 * s} /> : null}
  </>
);
const GREY = "#b4bcc8";
/** people on the pavements, walking both ways, everybody except the hero is slightly greyed so the hero reads at once */
const Walkers: React.FC<{ t: number; cam: V3; n?: number; seed?: number; x0?: number; x1?: number }> = ({ t, cam, n = 14, seed = 1, x0 = -40, x1 = 40 }) => {
  const w = useMemo(() => { const r = seeded(seed * 5); return Array.from({ length: n }, (_, i) => ({ z: i % 2 ? -2.7 + (r() - 0.5) * 1.2 : 7.4 + (r() - 0.5) * 1.2, sp: 1.3 + r() * 1.0, off: r() * (x1 - x0), dir: i % 3 ? 1 : -1, look: CROWD[(i * 7 + seed * 3) % CROWD.length] })); }, [n, seed, x0, x1]);
  return <>{w.map((q, i) => { const L = x1 - x0; const x = x0 + ((((q.off + t * q.sp * q.dir) % L) + L) % L); return <P key={i} look={q.look} p={[x, 0.2, q.z]} cam={cam} t={t} s={1.45} pose="walk" yaw={q.dir > 0 ? 0.9 : -0.9} seed={i + 4 + seed} tint={GREY} />; })}</>;
};
const Traffic: React.FC<{ t: number }> = ({ t }) => {
  const cars = [["#c8403a", 1, 9], ["#2f6aa8", -1, 7.5], ["#e8b030", 1, 6.2], ["#3f9a62", -1, 8.3], ["#f2eee2", 1, 5.4]] as const;
  return <>{cars.map(([c, d, sp], i) => { const L = 110; const x = -55 + ((((i * 31 + t * sp * d) % L) + L) % L); return <Car key={i} p={[x, 0.05, d > 0 ? 3.9 : 0.5]} rot={d > 0 ? 0 : Math.PI} color={c} />; })}</>;
};

/* ------------------------------------------------------------------ markers, lines, props */
const RedLine: React.FC<{ a: V3; b: V3; w?: number; k?: number; arrow?: boolean }> = ({ a, b, w = 0.3, k = 1, arrow = true }) => {
  const va = new THREE.Vector3(...a), vb0 = new THREE.Vector3(...b); const vb = va.clone().lerp(vb0, k); const len = Math.max(1e-4, va.distanceTo(vb)); const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), vb.clone().sub(va).normalize().lengthSq() ? vb.clone().sub(va).normalize() : new THREE.Vector3(1, 0, 0));
  return <group><mesh material={BM("#ff2d55")} position={mid} quaternion={q}><boxGeometry args={[len, w, w]} /></mesh>{[va, vb].map((v, i) => <mesh key={i} material={BM("#ff2d55")} position={v}><sphereGeometry args={[w * 1.9, 14, 10]} /></mesh>)}</group>;
};
const Marker: React.FC<{ p: V3; r?: number }> = ({ p, r = 0.6 }) => <group position={[p[0], p[1] + 0.04, p[2]]} rotation={[-Math.PI / 2, 0, 0]}><mesh material={BM("#ff2d55")}><ringGeometry args={[r * 0.6, r, 28]} /></mesh><mesh material={BM("#ffffff")}><circleGeometry args={[r * 0.42, 20]} /></mesh></group>;

const Bus: React.FC<{ p: V3 }> = ({ p }) => {
  const body = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-6, 0.5); s.lineTo(-6, 3.0); s.lineTo(5.0, 3.4); s.quadraticCurveTo(6.1, 3.3, 6.1, 2.2); s.lineTo(6.1, 0.5); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 2.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 }); }, []);
  const yel = toon("#f4b712"), blk = toon("#23262e"), gl = BM("#9fd2ec"), wh = toon("#c8ccd4");
  return (
    <group position={p}>
      <Ink geometry={body} material={yel} position={[0, 0, -1.25]} px={2.2} />
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} material={gl} position={[-4.6 + i * 1.3, 2.35, 1.4]}><planeGeometry args={[1.0, 0.8]} /></mesh>)}
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} material={gl} position={[-4.6 + i * 1.3, 2.35, -1.4]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.0, 0.8]} /></mesh>)}
      <mesh material={gl} position={[6.18, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2.0, 1.0]} /></mesh>
      <Ink geometry={box(12.24, 0.3, 2.6)} material={blk} position={[0, 1.55, 0]} px={1.4} cast={false} outline={false} />
      <mesh material={BM("#1c1c22")} position={[0, 1.9, 1.31]}><planeGeometry args={[11.6, 0.42]} /></mesh>
      {[-3.8, 3.6].map((x, i) => [-1.2, 1.2].map((z, j) => <group key={`${i}${j}`} position={[x, 0.62, z]}><Ink geometry={geo("Cylinder", 0.62, 0.62, 0.5, 18)} material={blk} rotation={[Math.PI / 2, 0, 0]} px={1.6} cast={false} /><mesh material={BM("#c8ccd4")} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z > 0 ? 0.27 : -0.27]}><cylinderGeometry args={[0.26, 0.26, 0.05, 12]} /></mesh></group>))}
      <Ink geometry={box(0.4, 0.2, 2.2)} material={wh} position={[6.2, 0.62, 0]} px={1.2} cast={false} outline={false} />
      {[-0.8, 0.8].map((z, i) => <mesh key={i} material={BM("#fff2b8")} position={[6.15, 1.1, z]}><sphereGeometry args={[0.2, 10, 8]} /></mesh>)}
      <mesh material={BM("#ff3a2a")} position={[-6.05, 2.8, 0.9]}><sphereGeometry args={[0.14, 8, 6]} /></mesh><mesh material={BM("#ff3a2a")} position={[-6.05, 2.8, -0.9]}><sphereGeometry args={[0.14, 8, 6]} /></mesh>
      <mesh material={new THREE.MeshBasicMaterial({ map: signTex("SCHOOL BUS", "#f4b712", "#23262e", 512, 128) })} position={[0, 3.12, 1.38]} rotation={[-0.05, 0, 0]}><planeGeometry args={[3.2, 0.5]} /></mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ stadium */
const grassTex = () => memo("pitch", () => { const t = cv(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#3f9b45" : "#46a74c"; g.fillRect(i * 32, 0, 32, h); } const r = seeded(3); for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,.06)" : "rgba(0,40,0,.07)"; g.fillRect(r() * w, r() * h, 2, 5); } }, true); t.repeat.set(2, 4); return t; });
const crowdTex = () => memo("crowd", () => cv(512, 128, (g, w, h) => { g.fillStyle = "#4a4f5c"; g.fillRect(0, 0, w, h); const r = seeded(11); const cols = ["#d8483a", "#f2f2f2", "#2f6aa8", "#f4c518", "#3f9a62", "#e07ab8", "#222"]; for (let y = 0; y < 14; y++) for (let x = 0; x < 64; x++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.arc(x * 8 + 4 + (y % 2) * 3, y * 9 + 6, 3.2, 0, 7); g.fill(); g.fillStyle = "#e8c8a8"; g.beginPath(); g.arc(x * 8 + 4 + (y % 2) * 3, y * 9 + 1, 2.2, 0, 7); g.fill(); } }, true));
const Stadium: React.FC = () => {
  const pitch = useMemo(() => { const t = grassTex().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1); t.needsUpdate = true; return new THREE.MeshLambertMaterial({ map: t }); }, []);
  const stand = useMemo(() => { const t = crowdTex().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 1); t.needsUpdate = true; return new THREE.MeshLambertMaterial({ map: t }); }, []);
  const conc = toon("#9aa0ac"), roof = toon("#d8483a"), white = BM("#ffffff"), post = toon("#f2f2f2");
  return (
    <group>
      <Ink geometry={box(116, 0.4, 76)} material={conc} position={[0, -0.3, 0]} px={2} cast={false} />
      <mesh material={pitch} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[106, 68]} /></mesh>
      <mesh material={white} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[7.6, 8.1, 40]} /></mesh>
      {[-1, 1].map((k) => <group key={k}><mesh material={white} position={[k * 53 - k * 0.15, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.35, 68]} /></mesh><mesh material={white} position={[k * 43, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 40]} /></mesh>
        <group position={[k * 53, 0, 0]}><Ink geometry={box(0.3, 2.4, 0.3)} material={post} position={[0, 1.2, -3.6]} px={1.4} cast={false} /><Ink geometry={box(0.3, 2.4, 0.3)} material={post} position={[0, 1.2, 3.6]} px={1.4} cast={false} /><Ink geometry={box(0.3, 0.3, 7.5)} material={post} position={[0, 2.4, 0]} px={1.4} cast={false} /></group></group>)}
      <mesh material={white} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 68]} /></mesh>
      {[-1, 1].map((k) => <group key={k}>{[0, 1, 2, 3, 4].map((i) => <Ink key={i} geometry={box(112, 2.2, 3.4)} material={i % 2 ? conc : stand} position={[0, 1.2 + i * 2.2, k * (40 + i * 3.2)]} px={1.4} cast={false} outline={false} />)}<Ink geometry={box(116, 0.6, 18)} material={roof} position={[0, 14, k * 48]} px={1.8} cast={false} /></group>)}
      {[-1, 1].map((k) => <group key={k}>{[0, 1, 2, 3].map((i) => <Ink key={i} geometry={box(3.4, 2.2, 74)} material={i % 2 ? conc : stand} position={[k * (60 + i * 3.2), 1.2 + i * 2.2, 0]} px={1.4} cast={false} outline={false} />)}</group>)}
      {[[-62, -42], [62, -42], [-62, 42], [62, 42]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Ink geometry={geo("Cylinder", 0.5, 0.7, 30, 8)} material={conc} position={[0, 15, 0]} px={1.6} cast={false} /><Ink geometry={box(7, 3, 0.6)} material={toon("#2a2e38")} position={[0, 31, 0]} px={1.6} cast={false} /><mesh material={BM("#fff8d0")} position={[0, 31, 0.35]}><planeGeometry args={[6.4, 2.4]} /></mesh></group>)}
    </group>
  );
};

/* ------------------------------------------------------------------ tower */
const winTex = (c: string) => memo("w" + c, () => cv(128, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = seeded(c.length * 3); for (let y = 0; y < 16; y++) for (let x = 0; x < 6; x++) { g.fillStyle = r() < 0.22 ? "#ffe3a0" : "#5d7088"; g.fillRect(x * 21 + 4, y * 16 + 3, 13, 10); } const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(0,0,0,.1)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true));
const Tower: React.FC<{ p: V3; t: number }> = ({ p, t }) => {
  const levels: [number, number, string][] = [[46, 70, "#cfc7b6"], [38, 140, "#d6cfbf"], [30, 215, "#cfc7b6"], [22, 285, "#d6cfbf"], [14, 345, "#cfc7b6"], [8, 381, "#d6cfbf"]];
  const mats = useMemo(() => levels.map(([w, h, c]) => { const tx = winTex(c).clone(); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(Math.max(1, Math.round(w / 14)), Math.max(1, Math.round(h / 28))); tx.needsUpdate = true; return new THREE.MeshLambertMaterial({ map: tx }); }), []);
  return (
    <group position={p}>
      {levels.map(([w, h], i) => <mesh key={i} material={mats[i]} position={[0, h / 2, 0]}><boxGeometry args={[w, h, w]} /></mesh>)}
      {levels.map(([w, h], i) => <Ink key={"c" + i} geometry={box(w + 1.4, 3, w + 1.4)} material={toon("#b9b2a2")} position={[0, h, 0]} px={1.4} cast={false} outline={false} />)}
      <Ink geometry={geo("Cylinder", 1.2, 3.2, 60, 10)} material={toon("#b8bcc4")} position={[0, 381 + 30, 0]} px={1.4} cast={false} />
      <mesh material={BM(Math.sin(t * 5) > 0 ? "#ff3a3a" : "#7a1a1a")} position={[0, 443, 0]}><sphereGeometry args={[1.6, 10, 8]} /></mesh>
    </group>
  );
};
const BlockCity: React.FC<{ cx: number; cz: number }> = ({ cx, cz }) => {
  const items = useMemo(() => { const r = seeded(21); const a: any[] = []; for (let gx = -4; gx <= 4; gx++) for (let gz = -4; gz <= 4; gz++) { if (Math.abs(gx) < 1 && Math.abs(gz) < 1) continue; if (r() < 0.12) continue; const h = 22 + r() * (60 - Math.hypot(gx, gz) * 5); a.push({ x: cx + gx * 62 + (r() - 0.5) * 6, z: cz + gz * 62 + (r() - 0.5) * 6, w: 40 + r() * 8, h: Math.max(20, h), c: ["#c9b99a", "#b9c0cc", "#c0705a", "#d8cfbf", "#9aa8b8"][Math.floor(r() * 5)] }); } return a; }, [cx, cz]);
  const mats = useMemo(() => items.map((q) => { const tx = winTex(q.c).clone(); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(Math.max(1, Math.round(q.w / 16)), Math.max(1, Math.round(q.h / 30))); tx.needsUpdate = true; return new THREE.MeshLambertMaterial({ map: tx }); }), [items]);
  return <group>{items.map((q, i) => <mesh key={i} material={mats[i]} position={[q.x, q.h / 2, q.z]}><boxGeometry args={[q.w, q.h, q.w]} /></mesh>)}</group>;
};
const Birds: React.FC<{ t: number; c: V3 }> = ({ t, c }) => <>{Array.from({ length: 9 }, (_, i) => { const a = t * 0.5 + i * 0.7; return <group key={i} position={[c[0] + Math.cos(a) * (60 + i * 8), c[1] + Math.sin(a * 2 + i) * 10 + i * 5, c[2] + Math.sin(a) * (60 + i * 8)]} rotation={[0, -a, 0]}><mesh material={BM("#2a2a30")} rotation={[0, 0, Math.sin(t * 14 + i) * 0.7]} position={[0, 0, 0.5]}><planeGeometry args={[2.6, 0.5]} /></mesh><mesh material={BM("#2a2a30")} rotation={[0, 0, -Math.sin(t * 14 + i) * 0.7]} position={[0, 0, -0.5]}><planeGeometry args={[2.6, 0.5]} /></mesh></group>; })}</>;

/* ------------------------------------------------------------------ space */
const spaceBg = () => { const sc = useThree((s) => s.scene); useLayoutEffect(() => { sc.background = new THREE.Color("#02040c"); sc.fog = null; }); };
const Stars: React.FC = () => {
  const g = useMemo(() => { const rd = seeded(7); const n = 1800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = rd() * 6.283, b = Math.acos(2 * rd() - 1); pos[i * 3] = Math.sin(b) * Math.cos(a) * 2500; pos[i * 3 + 1] = Math.sin(b) * Math.sin(a) * 2500; pos[i * 3 + 2] = Math.cos(b) * 2500; const c = 0.6 + rd() * 0.4; col[i * 3] = c; col[i * 3 + 1] = c; col[i * 3 + 2] = c + (rd() < 0.3 ? 0.2 : 0); } const geo2 = new THREE.BufferGeometry(); geo2.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo2.setAttribute("color", new THREE.BufferAttribute(col, 3)); return geo2; }, []);
  return <points geometry={g}><pointsMaterial vertexColors size={2.6} sizeAttenuation={false} /></points>;
};
const earthMaps = () => memo("earthmaps", () => {
  const land = cv(2048, 1024, (g, w, h) => {
    const r = seeded(9); const og = g.createLinearGradient(0, 0, 0, h); og.addColorStop(0, "#24609e"); og.addColorStop(0.5, "#1668b5"); og.addColorStop(1, "#24609e"); g.fillStyle = og; g.fillRect(0, 0, w, h);
    g.filter = "blur(3px)"; const blob = (cx: number, cy: number, rx: number, ry: number, n: number, col: string) => { g.fillStyle = col; for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * rx * 1.7, y = cy + (r() - 0.5) * ry * 1.7, rr = 22 + r() * 70; for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, rr, rr * 0.75, r() * 3, 0, 7); g.fill(); } } };
    blob(520, 330, 180, 170, 40, "#4f9a44"); blob(560, 280, 150, 120, 20, "#6aa84c"); blob(600, 680, 110, 220, 34, "#3f8a3a"); blob(1090, 330, 150, 110, 30, "#7aa850"); blob(1130, 650, 130, 200, 36, "#c5ae5c"); blob(1500, 330, 280, 140, 56, "#5f9a48"); blob(1760, 700, 110, 80, 20, "#c9b068"); blob(1300, 470, 120, 70, 16, "#d6c078");
    g.filter = "blur(6px)"; g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, 50); g.fillRect(0, h - 70, w, 70); g.filter = "none";
  }, true);
  const cloud = cv(1024, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.filter = "blur(14px)"; const r = seeded(15); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.4})`; const x = r() * w, y = 40 + r() * (h - 80); for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, 40 + r() * 90, 10 + r() * 22, (r() - 0.5) * 0.4, 0, 7); g.fill(); } } g.filter = "none"; }, true);
  const lights = cv(1024, 512, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); const r = seeded(31); for (let i = 0; i < 900; i++) { const x = (0.08 + r() * 0.84) * w, y = (0.2 + r() * 0.55) * h; g.fillStyle = `rgba(255,${190 + Math.floor(r() * 50)},110,${0.4 + r() * 0.6})`; g.fillRect(x, y, 2 + r() * 2, 2); } }, true);
  return { land, cloud, lights };
});
const Earth: React.FC<{ r: number; p: V3; spin?: number; sun?: V3 }> = ({ r, p, spin = 0 }) => {
  const m = useMemo(() => { const e = earthMaps(); return { land: new THREE.MeshStandardMaterial({ map: e.land, roughness: 0.85, metalness: 0, emissiveMap: e.lights, emissive: new THREE.Color("#ffb060"), emissiveIntensity: 1.1 }), cloud: new THREE.MeshStandardMaterial({ map: e.cloud, transparent: true, depthWrite: false, roughness: 1, alphaMap: e.cloud }), atmo: new THREE.MeshBasicMaterial({ color: "#6fb4ff", transparent: true, opacity: 0.26, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }), atmo2: new THREE.MeshBasicMaterial({ color: "#9cd0ff", transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }) }; }, []);
  return <group position={p} rotation={[0, 0, 0.41]}><mesh material={m.land} rotation={[0, spin, 0]}><sphereGeometry args={[r, 96, 64]} /></mesh><mesh material={m.cloud} rotation={[0, spin * 1.25 + 0.4, 0]}><sphereGeometry args={[r * 1.012, 96, 64]} /></mesh><mesh material={m.atmo}><sphereGeometry args={[r * 1.05, 64, 48]} /></mesh><mesh material={m.atmo2}><sphereGeometry args={[r * 1.12, 48, 36]} /></mesh></group>;
};
const moonMap = () => memo("moonmap", () => cv(1024, 512, (g, w, h) => { g.fillStyle = "#c9c5ba"; g.fillRect(0, 0, w, h); const r = seeded(5); g.filter = "blur(6px)"; for (let i = 0; i < 16; i++) { g.fillStyle = "rgba(90,92,104,.45)"; const x = r() * w, y = 60 + r() * (h - 120), rr = 30 + r() * 70; for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, rr, rr * 0.7, 0, 0, 7); g.fill(); } } g.filter = "blur(1px)"; for (let i = 0; i < 260; i++) { const x = r() * w, y = 30 + r() * (h - 60), rr = 4 + r() * 20; for (const ox of [-w, 0, w]) { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.arc(x + ox, y, rr, 0, 7); g.stroke(); g.fillStyle = "rgba(70,70,80,.28)"; g.beginPath(); g.arc(x + ox + 1, y + 1, rr * 0.85, 0, 7); g.fill(); } } g.filter = "none"; }, true));
const Moon: React.FC<{ r: number; p: V3 }> = ({ r, p }) => { const m = useMemo(() => new THREE.MeshStandardMaterial({ map: moonMap(), bumpMap: moonMap(), bumpScale: 2.2, roughness: 1 }), []); return <mesh material={m} position={p} rotation={[0, 2.2, 0]}><sphereGeometry args={[r, 64, 48]} /></mesh>; };
const Iss: React.FC<{ p: V3; s: number; t: number }> = ({ p, s, t }) => {
  const gold = toon("#d9a82c"), wh = toon("#e8e6e0"), dk = toon("#3a4a8a"), gr = toon("#8a8f9a");
  const panel = useMemo(() => new THREE.MeshLambertMaterial({ map: cv(64, 128, (g, w, h) => { g.fillStyle = "#26397a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8aa4e8"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); } for (let j = 0; j <= 8; j++) { g.beginPath(); g.moveTo(0, j * 16); g.lineTo(w, j * 16); g.stroke(); } }), side: THREE.DoubleSide }), []);
  return (
    <group position={p} scale={s} rotation={[0.15, t * 0.1, 0.1]}>
      <Ink geometry={box(26, 0.5, 0.5)} material={gr} px={1.4} cast={false} outline={false} />
      {[-11, -7, 7, 11].map((x, i) => [-1, 1].map((k) => <group key={`${i}${k}`} position={[x, k * 5.5, 0]} rotation={[0, Math.sin(t * 0.6) * 0.3, 0]}><mesh material={panel}><boxGeometry args={[3.2, 9.6, 0.08]} /></mesh></group>))}
      <Ink geometry={geo("Cylinder", 1.2, 1.2, 9, 14)} material={wh} rotation={[0, 0, Math.PI / 2]} position={[0, -1.2, 0]} px={1.4} cast={false} outline={false} />
      <Ink geometry={geo("Cylinder", 1.1, 1.1, 6, 14)} material={gold} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} px={1.4} cast={false} outline={false} />
      <Ink geometry={geo("Cylinder", 0.9, 0.9, 5, 12)} material={wh} position={[3.5, -3, 0]} px={1.4} cast={false} outline={false} />
      <Ink geometry={box(1.6, 5, 0.12)} material={dk} position={[-3, 3, 0]} px={1} cast={false} outline={false} />
    </group>
  );
};
const SpaceLights: React.FC = () => <><hemisphereLight args={["#9bb8ff", "#0a0e1c", 0.45]} /><directionalLight position={[300, 120, 160]} intensity={3.2} /></>;
const Sun: React.FC<{ p: V3; s: number }> = ({ p, s }) => { const m = useMemo(() => new THREE.SpriteMaterial({ map: memo("glow", () => cv(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,240,200,.45)"); r.addColorStop(1, "rgba(255,230,180,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); })), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), []); return <sprite material={m} position={p} scale={[s, s, 1]} />; };

/* ------------------------------------------------------------------ per-step choreography */
type Frame = { p: V3; l: V3; fov: number; roll?: number; focus?: number; range?: number; bokeh?: number };
/** the hero for the four earth-level steps: where he is, what he is doing */
const heroAt = (idx: number, s: number): { p: V3; pose: string; expr: string } => {
  if (idx === 0) return { p: [2 + s * 2.9, 0.2, 2.4], pose: "walk", expr: "smug" };
  if (idx === 1) { const k = clamp((s - 0.7) / 1.15); return { p: [-6.8 + 13.6 * ease(k), 0.2 + Math.sin(Math.PI * k) * 5.4, 1.6], pose: k > 0 && k < 1 ? "cheer" : "idle", expr: k > 0.05 && k < 1 ? "laugh" : "grin" }; }
  if (idx === 2) { const k = clamp((s - 0.45) / 1.35); return { p: [-48 + 96 * ease(k), 0.2 + Math.sin(Math.PI * k) * 14, 0], pose: k > 0 && k < 1 ? "cheer" : "idle", expr: k > 0.05 && k < 1 ? "laugh" : "grin" }; }
  return { p: [70, 0.2, 20], pose: "cheer", expr: "grin" };
};
const CAMF: ((s: number, hero: V3) => Frame)[] = [
  (s, h) => ({ p: [h[0] + 8.6, 2.5 + Math.sin(s * 2.2) * 0.05, 3.3], l: [h[0] - 4, 2.7, 1.6], fov: 58, focus: 9, range: 13, bokeh: 2.4 }),
  (s) => { const k = ease(s / 2.5); return { p: lerp3([-12, 5, 14.5], [6, 7.5, 15], k), l: lerp3([-1, 6.0, 1.6], [0, 6.4, 1.6], k), fov: 58, focus: 17, range: 26, bokeh: 1.6 }; },
  (s, h) => { const k = ease(s / 2.5); const base = lerp3([-72, 9, 30], [18, 34, 56], k); const f = clamp((s - 0.45) / 1.35); return { p: [base[0] + (h[0] + 48) * 0.4 * (1 - k), base[1], base[2]], l: [h[0] * 0.9, 4 + h[1] * 0.4, 0], fov: 56, focus: 40, range: 90, bokeh: 1.8 + f }; },
  (s) => { const k = ease(s / 2.5); return { p: lerp3([-110, 30, 190], [-250, 235, 430], k), l: lerp3([10, 110, 0], [15, 215, 0], k), fov: 60, focus: 260, range: 600, bokeh: 0.9 }; },
  (s) => { const k = ease(s / 2.5); return { p: lerp3([5.6, 0.7, 4.2], [3.4, 0.9, 2.2], k), l: lerp3([0, 0.55, 0], [0, 0.45, 0], k), fov: 56, focus: 4, range: 12, bokeh: 1.2 }; },
  (s) => { const k = ease(s / 2.5); return { p: lerp3([-6, 3, 30], [4, -1, 22], k), l: [0, 2.2, 0], fov: 55, focus: 30, range: 60, bokeh: 0.6 }; },
  (s) => { const k = ease(s / 2.5); return { p: lerp3([-6, -6, 26], [30, 12, 50], k), l: lerp3([0, -2, 0], [2, 6, 0], k), fov: 54, focus: 40, range: 100, bokeh: 0.6 }; },
];
const YOU: ((s: number, hero: V3) => V3)[] = [
  (s, h) => [h[0], h[1] + 3.6, h[2]], (s, h) => [h[0], h[1] + 3.8, h[2]], (s, h) => [h[0], h[1] + 4.2, h[2]], () => [70, 6, 20],
  () => [0, 0.03, 0], () => [-6.29, 0.2, 6.6], () => [0, -5.8, 4],
];

const SceneStreet: React.FC<{ t: number; s: number; cam: V3 }> = ({ t, s, cam }) => {
  const h = heroAt(0, s);
  return (
    <Town t={t}>
      <Traffic t={t} /><Walkers t={t} cam={cam} n={16} seed={1} />
      <P look="hero" p={h.p} cam={cam} t={t} s={1.7} pose={h.pose} expr={h.expr} seed={3} />
      {[[-6, 3.4], [3, 1.9], [-14, 2.8]].map(([x, z], i) => <P key={i} look={CROWD[(i * 9 + 4) % CROWD.length]} p={[x, 0.2, z]} cam={cam} t={t} s={1.5} pose="walk" yaw={0.9} seed={i + 40} tint={GREY} />)}
    </Town>
  );
};
const SceneBus: React.FC<{ t: number; s: number; cam: V3 }> = ({ t, s, cam }) => {
  const h = heroAt(1, s); const k = clamp((s - 0.7) / 1.15);
  return (
    <Town t={t}>
      <Traffic t={t} /><Walkers t={t} cam={cam} n={12} seed={2} />
      <Bus p={[0, 0, 1.6]} />
      <Marker p={[-6.8, 0, 1.6]} r={0.9} /><Marker p={[6.8, 0, 1.6]} r={0.9} /><RedLine a={[-6.8, 0.4, 5.2]} b={[6.8, 0.4, 5.2]} w={0.22} k={ease((s - 0.2) / 0.8)} />
      <P look="hero" p={h.p} cam={cam} t={t} s={1.7} pose={h.pose} expr={h.expr} seed={3} emph={k > 0 && k < 1 ? 0.5 : 0} />
    </Town>
  );
};
const SceneField: React.FC<{ t: number; s: number; cam: V3 }> = ({ t, s, cam }) => {
  const h = heroAt(2, s); const sc = useThree((x) => x.scene); useLayoutEffect(() => { sc.background = new THREE.Color("#bcd2e6"); sc.fog = new THREE.Fog("#c9d8e6", 160, 700); });
  return (
    <>
      <hemisphereLight args={["#ffffff", "#8a9a7a", 1.25]} /><directionalLight position={[-60, 90, 50]} intensity={2.6} />
      <mesh material={toon("#8f959e")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}><planeGeometry args={[900, 900]} /></mesh>
      <Stadium />
      <Marker p={[-48, 0.1, 0]} r={2.2} /><Marker p={[48, 0.1, 0]} r={2.2} /><RedLine a={[-48, 0.9, 0]} b={[48, 0.9, 0]} w={0.7} k={ease((s - 0.2) / 0.9)} />
      <P look="hero" p={h.p} cam={cam} t={t} s={3.4} pose={h.pose} expr={h.expr} seed={3} yaw={0.9} />
    </>
  );
};
const SceneTower: React.FC<{ t: number; s: number; cam: V3 }> = ({ t, s, cam }) => {
  const sc = useThree((x) => x.scene); useLayoutEffect(() => { sc.background = new THREE.Color("#bcd0e4"); sc.fog = new THREE.Fog("#c9d8e8", 220, 1500); });
  return (
    <>
      <hemisphereLight args={["#ffffff", "#9a9a92", 1.3]} /><directionalLight position={[-120, 220, 140]} intensity={2.5} />
      <mesh material={toon("#8f949c")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}><planeGeometry args={[2400, 2400]} /></mesh>
      <BlockCity cx={0} cz={0} /><Tower p={[0, 0, 0]} t={t} /><Birds t={t} c={[0, 200, 0]} />
      <Marker p={[70, 0.3, 20]} r={3.4} /><RedLine a={[70, 0.6, 20]} b={[70, 384, 20]} w={1.8} k={ease((s - 0.2) / 1.1)} />
      <P look="hero" p={[70, 0.2, 20]} cam={cam} t={t} s={5.0} pose="cheer" expr="grin" seed={3} />
    </>
  );
};
const SceneOrbit: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  spaceBg();
  return (
    <>
      <Stars /><SpaceLights /><Sun p={[420, 170, 220]} s={320} />
      <Earth r={6.371} p={[0, -6.371, 0]} spin={0.7 + t * 0.02} />
      <RedLine a={[0, 0, 0]} b={[0, 0.393, 0]} w={0.012} k={ease((s - 0.1) / 1.0)} /><Marker p={[0, 0, 0]} r={0.05} />
      <Iss p={[0, 0.393, 0]} s={0.0075} t={t} />
    </>
  );
};
const SceneEarth: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  spaceBg();
  return (
    <>
      <Stars /><SpaceLights /><Sun p={[260, 120, 160]} s={260} />
      <Earth r={6.371} p={[0, 0, 0]} spin={1.2 + t * 0.03} />
      <RedLine a={[-6.29, 0.2, 6.62]} b={[6.29, 0.2, 6.62]} w={0.1} k={ease((s - 0.1) / 1.2)} />
    </>
  );
};
const SceneMoon: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  spaceBg();
  return (
    <>
      <Stars /><SpaceLights /><Sun p={[260, 120, 160]} s={260} />
      <Earth r={3.2} p={[0, -9, 0]} spin={1.2 + t * 0.03} /><Moon r={1.3} p={[0, 7, 0]} />
      <RedLine a={[0, -5.8, 3.8]} b={[0, 8.1, 3.8]} w={0.09} k={ease((s - 0.1) / 1.4)} />
    </>
  );
};

const Rig: React.FC<{ p: V3; l: V3; fov: number; roll?: number }> = ({ p, l, fov, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = fov; camera.near = 0.02; camera.far = 6000; camera.updateProjectionMatrix(); camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...l); camera.rotateZ(roll); camera.updateMatrixWorld(); });
  return null;
};
const Hud: React.FC<{ step: Step; k: number; you: { x: number; y: number } | null }> = ({ step, k, you }) => {
  const ent = ease(k / 0.1); const sans = "Arial, Helvetica, 'Liberation Sans', sans-serif";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 66, top: 250, color: "#fff", textShadow: "0 2px 14px rgba(10,14,30,.6)" }}>
        <div style={{ fontFamily: sans, fontSize: 30, letterSpacing: 6, fontWeight: 600 }}>STEP #{step.n}</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 170, fontWeight: 400, lineHeight: 1.05, fontFeatureSettings: '"lnum" 1', opacity: ent, transform: `translateY(${(1 - ent) * 28}px) scale(${0.96 + 0.04 * ent})`, transformOrigin: "0 100%" }}>{step.val}</div>
        <div style={{ fontFamily: sans, fontSize: 31, letterSpacing: 3.5, fontWeight: 600, marginTop: 6 }}>{step.name}</div>
        <div style={{ fontFamily: sans, fontSize: 27, letterSpacing: 3, fontWeight: 500, marginTop: 8, opacity: 0.95 }}>{step.sub}</div>
        <div style={{ display: "inline-block", marginTop: 22, background: "#d8274f", padding: "9px 20px", borderRadius: 6, fontFamily: sans, fontSize: 25, letterSpacing: 2.5, fontWeight: 700 }}>TWICE AS LONG EVERY STEP</div>
      </div>
      <div style={{ position: "absolute", left: 66, right: 80, top: 720, color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 56, lineHeight: 1.22, textShadow: "0 2px 14px rgba(10,14,30,.65)", opacity: ease((k - 0.05) / 0.12), transform: `translateY(${(1 - ease((k - 0.05) / 0.12)) * 16}px)` }}>{step.cap}</div>
      {you ? <div style={{ position: "absolute", left: you.x, top: you.y, color: "#fff", fontFamily: sans, fontSize: 24, letterSpacing: 3, fontWeight: 700, textShadow: "0 2px 10px rgba(10,14,30,.8)" }}><div style={{ position: "absolute", left: -2, top: -2, width: 38, height: 2, background: "#fff", transformOrigin: "0 0", transform: "rotate(-35deg)" }} /><div style={{ position: "absolute", left: 32, top: -44 }}>YOU</div></div> : null}
    </AbsoluteFill>
  );
};

export const Style2Sample: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const t = frame / fps;
  if (!ok) return <AbsoluteFill style={{ background: "#c9ced6" }} />;
  const inTitle = t < TITLE_D; const idx = inTitle ? 0 : Math.min(STEPS.length - 1, Math.floor((t - TITLE_D) / STEP_D)); const local = inTitle ? t / TITLE_D : Math.min(1, (t - TITLE_D - idx * STEP_D) / STEP_D);
  const ending = t >= TITLE_D + STEPS.length * STEP_D;
  /** step 1 runs on from the title so the hero keeps walking; every other step starts its own clock */
  const s = idx === 0 ? t : (t - TITLE_D - idx * STEP_D); const sCam = idx === 0 ? Math.max(0, t) : s;
  const hero = idx <= 3 ? heroAt(idx, s).p : [0, 0, 0] as V3;
  const fr = CAMF[idx](sCam, hero as V3); const cam = fr.p;
  const camObj = new THREE.PerspectiveCamera(fr.fov, width / height, 0.02, 6000); camObj.position.set(...fr.p); camObj.lookAt(...fr.l); camObj.updateMatrixWorld();
  const yw = YOU[idx](s, hero as V3); const pr = new THREE.Vector3(...yw).project(camObj); const you = pr.z < 1 && Math.abs(pr.x) < 1.05 && Math.abs(pr.y) < 1.05 ? { x: (pr.x * 0.5 + 0.5) * width, y: (-pr.y * 0.5 + 0.5) * height } : null;
  const focus = fr.focus ?? new THREE.Vector3(...fr.p).distanceTo(new THREE.Vector3(...fr.l));
  const sinceCut = inTitle || idx === 0 ? 99 : (t - TITLE_D) - idx * STEP_D; const flash = Math.max(0, 1 - sinceCut / 0.14) * 0.55;
  const shake = idx >= 1 && idx <= 3 ? Math.max(0, 1 - sinceCut / 0.5) * 0.012 : 0;
  const Sc = [SceneStreet, SceneBus, SceneField, SceneTower, SceneOrbit, SceneEarth, SceneMoon][idx] as any;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(t * 90) * shake * 120}px, ${Math.cos(t * 77) * shake * 120}px) scale(${1 + shake * 3})` }}>
        <ThreeCanvas width={width} height={height} flat camera={{ fov: fr.fov, near: 0.02, far: 6000, position: fr.p }} gl={{ antialias: true }}>
          <Rig p={fr.p} l={fr.l} fov={fr.fov} roll={fr.roll} />
          <Sc key={idx} t={t} s={s} cam={cam} />
          <PostFX focus={focus} range={fr.range ?? 30} bokeh={fr.bokeh ?? 2} frame={frame} grain={0.22} />
        </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} /> : null}
      {!inTitle && !ending ? <Hud step={STEPS[idx]} k={local} you={you} /> : null}
      {inTitle ? <AbsoluteFill style={{ justifyContent: "flex-start", padding: "300px 80px 0", color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 76, lineHeight: 1.18, textShadow: "0 3px 18px rgba(10,14,30,.7)", opacity: ease(local / 0.1) * (1 - ease((local - 0.88) / 0.12)), transform: `translateY(${(1 - ease(local / 0.1)) * 24}px)` }}>What if every step you took was twice as long as the last?</AbsoluteFill> : null}
      {ending ? <AbsoluteFill style={{ background: "rgba(5,8,22,.55)", justifyContent: "center", padding: "0 90px", color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 66, lineHeight: 1.25, textAlign: "center", opacity: ease((t - (TITLE_D + STEPS.length * STEP_D)) / 0.35) }}>Which step surprised you most?<br />Comment the number.</AbsoluteFill> : null}
      {audio ? <Audio src={staticFile("style2_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
