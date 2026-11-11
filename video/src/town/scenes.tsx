import * as THREE from "three";
import React, { useMemo } from "react";
import { ContactShadow, yawToward } from "../hotel/chars";
import { Person2 } from "../full/person";
import { SceneEnv, Lights } from "../full/env";
import { emo } from "../full/scenes";
import { Sky, Puffs, SunDust } from "../emu/world";
import { INKD } from "../full/paint";
import timing from "./timing.json";
import { Ink, box, toon, rng, clamp, cv, rep, signTex, roadTex, CityGround, Skyline, Plaza, Lawn, Van, GasStation, Street, Building, Tree, Lamp, Bench, Car, Boat, Helicopter, Bills, Sun, Board, type V3, type BProps } from "./world";

export type SceneProps = { t: number; cam: V3 };
const smooth = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
/** local time (seconds from the start of shot `shot`) when a spoken word starts */
const wordIn = (shot: number, word: string, fb: number) => {
  const s0 = shot === 0 ? 0 : timing.starts[shot] - 0.1; const s1 = shot + 1 < timing.starts.length ? timing.starts[shot + 1] - 0.1 : 1e9;
  const w = (timing.words as [string, number, number][]).find((x) => x[1] >= s0 && x[1] < s1 && x[0].toLowerCase().replace(/[^a-z]/g, "").startsWith(word));
  return w ? w[1] - s0 : fb;
};
const P: React.FC<{ look: any; p: V3; cam: V3; t: number; s?: number; expr?: any; pose?: any; seed?: number; yaw?: number; lean?: number; emph?: number; handR?: React.ReactNode; tint?: string; shadow?: boolean }> = ({ look, p, cam, t, s = 1.4, expr = "deadpan", pose = "idle", seed = 1, yaw, lean, emph, handR, tint, shadow = true }) => (
  <>
    <Person2 look={look} expr={expr} t={t} position={p} yaw={yaw ?? yawToward(p, cam)} scale={s} seed={seed} pose={pose} lean={lean} emph={emph} handR={handR} tint={tint} />
    {shadow ? <ContactShadow position={[p[0], p[1] + 0.02, p[2]]} r={0.42 * s} /> : null}
  </>
);
const LOOKS = ["guest", "woman", "owner", "boss", "clerk", "farm", "pullman", "bowler", "glasses", "cap", "engineer", "official"];
const Crowd: React.FC<{ t: number; cam: V3; n: number; c: V3; w: number; d: number; seed?: number; pose?: any; expr?: any; emph?: number; s?: number; skip?: (x: number, z: number) => boolean }> = ({ t, cam, n, c, w, d, seed = 1, pose = "idle", expr = "deadpan", emph = 0, s = 1.35, skip }) => {
  const pts = useMemo(() => { const r = rng(seed * 13); const a: { x: number; z: number; l: string; sc: number; sd: number }[] = []; const cols = Math.ceil(Math.sqrt(n * (w / d))); const rows = Math.ceil(n / cols); for (let i = 0; i < n; i++) { const cx = i % cols, rz = Math.floor(i / cols); const x = c[0] - w / 2 + ((cx + 0.5 + (r() - 0.5) * 0.6) * w) / cols; const z = c[2] - d / 2 + ((rz + 0.5 + (r() - 0.5) * 0.6) * d) / rows; if (skip && skip(x, z)) continue; a.push({ x, z, l: LOOKS[(i * 5 + seed) % LOOKS.length], sc: s * (0.9 + r() * 0.2), sd: i + seed * 50 }); } return a; }, [n, c, w, d, seed, s, skip]);
  return <>{pts.map((q, i) => <P key={i} look={q.l} p={[q.x, c[1], q.z]} cam={cam} t={t} s={q.sc} pose={pose} expr={expr} seed={q.sd} emph={emph} />)}</>;
};

/* ------------------------------------------------------------------ the town (shared) */
const BACK: BProps[] = [
  { p: [-26, 0, -9], w: 9, h: 6.2, d: 7, wall: "#b9654a", sign: "SCHOOL", signBg: "#f6efd8", signFg: "#2f5a8a", floors: 2, cols: 4, doorColor: "#2f5a8a", roofType: "gable", roof: "#6a3a38" },
  { p: [-17, 0, -8.6], w: 6, h: 6.6, d: 7, wall: "#c98a58", sign: "BAKERY", signBg: "#fbe8d0", signFg: "#b8505a", awning: ["#e8758a", "#fff6ec"], shopFront: true, floors: 2, cols: 2 },
  { p: [-9.6, 0, -8.6], w: 7, h: 6.6, d: 7, wall: "#6f9a86", sign: "GENERAL STORE", signBg: "#f1ead2", signFg: "#2f6a4a", awning: ["#3f9a62", "#fff6ec"], shopFront: true, floors: 2, cols: 3 },
  { p: [1.8, 0, -9.2], w: 11, h: 8.5, d: 9, wall: "#efe3c8", wallKind: "paint", sign: "TOWN HALL", signBg: "#2f3f6a", signFg: "#f6e6b0", columns: true, pediment: true, clock: true, floors: 2, cols: 4, doorColor: "#6a3a2a", roof: "#7a8a96" },
  { p: [13.2, 0, -8.6], w: 6, h: 6.6, d: 7, wall: "#cfe3e8", wallKind: "paint", sign: "CLINIC", signBg: "#f6fbfc", signFg: "#c8403a", floors: 2, cols: 2, doorColor: "#c8403a" },
  { p: [22.5, 0, -9], w: 9.5, h: 5.4, d: 8, wall: "#cfd4dc", wallKind: "paint", sign: "MOTORS", signBg: "#1f3f6a", signFg: "#ffe9a0", awning: ["#2f6aa8", "#fff6ec"], shopFront: true, floors: 2, cols: 4 },
  { p: [31.4, 0, -8.6], w: 6.2, h: 5.8, d: 7, wall: "#58a6a8", wallKind: "paint", sign: "DINER", signBg: "#fff4d8", signFg: "#d8483a", awning: ["#d8483a", "#fff6ec"], shopFront: true, floors: 2, cols: 2 },
];
const PAL = ["#c06a4a", "#b87a5a", "#8a9aa8", "#c9a86a", "#9a6a7a", "#7a9a8a", "#d0b090", "#a8b8c8", "#c88a6a", "#a8725a"];
const SIGNS = ["PHARMACY", "BOOKS", "CAFE", "HARDWARE", "PIZZA", "BANK", "TAILOR", "FLOWERS", "SHOES", "TOYS", "DELI", "OPTICIAN", "BAKERY", "CINEMA", "SALON"];
const AWN: [string, string][] = [["#e8758a", "#fff6ec"], ["#3f9a62", "#fff6ec"], ["#2f6aa8", "#fff6ec"], ["#d8883a", "#fff6ec"], ["#8a5ab8", "#fff6ec"]];
const gen = (ints: [number, number][], z: number, rot: number, seed: number): BProps[] => {
  const r = rng(seed); const out: BProps[] = [];
  for (const [a, b] of ints) { let x = a + 0.3; while (b - x > 5.2) { let w = Math.min(5.6 + r() * 3.4, b - x); if (b - x - w < 5.2) w = b - x; const shop = r() < 0.7; const h = 6.4 + Math.floor(r() * 3) * 3.2; const floors = shop ? Math.round((h - 3.6) / 3.2) + 1 : Math.round(h / 3.2);
    out.push({ p: [x + w / 2, 0, z], w, h, d: 7, rot, wall: PAL[Math.floor(r() * PAL.length)], wallKind: r() < 0.5 ? "brick" : "paint", sign: shop ? SIGNS[Math.floor(r() * SIGNS.length)] : undefined, signBg: "#f6efd8", signFg: ["#7a1f22", "#2f5a8a", "#2f6a4a", "#6a3a8a"][Math.floor(r() * 4)], awning: shop ? AWN[Math.floor(r() * AWN.length)] : undefined, shopFront: shop, floors, cols: Math.max(2, Math.round(w / 2.6)), simple: true, doorColor: ["#5a3418", "#2f5a8a", "#8a3a2a"][Math.floor(r() * 3)], lit: r() < 0.6 }); x += w + 0.25; } }
  return out;
};
const FILL_BACK = gen([[-92, -60], [-39, -31], [34.9, 43.6], [50.4, 92]], -9, 0, 3);
const FILL_FRONT = gen([[-92, 92]], 20.5, Math.PI, 8);
const welcomeTex = () => cv(1024, 420, (g, w, h) => { g.fillStyle = "#f6efd8"; g.fillRect(0, 0, w, h); g.strokeStyle = INKD; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16); g.strokeStyle = "#2f6a4a"; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h - 52); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#2f6a4a"; g.font = "400 90px 'Lilita One', Impact, sans-serif"; g.fillText("WELCOME TO", w / 2, 120); g.font = "400 112px 'Lilita One', Impact, sans-serif"; g.fillText("MILLBROOK", w / 2, 235); g.fillStyle = "#7a1f22"; g.font = "400 66px 'Lilita One', Impact, sans-serif"; g.fillText("POPULATION 3,000", w / 2, 340); });
export const Town: React.FC<{ t: number; gold?: boolean; children?: React.ReactNode }> = ({ t, gold = false, children }) => {
  const pos = gold ? ([-22, 8, 18] as V3) : ([-14, 18, 14] as V3);
  const rm = useMemo(() => toon(rep(roadTex(), 1, 10)), []); const wt = useMemo(() => welcomeTex(), []);
  return (
    <group>
      <SceneEnv bg={gold ? "#f4c98a" : "#bfe0f2"} fog={gold ? ["#f4cf9c", 120, 380] : ["#d4e8f2", 130, 400]} />
      <Lights color={gold ? "#ffcf8a" : "#fff0cc"} intensity={gold ? 2.9 : 2.6} pos={pos} hemi={gold ? ["#ffe6c0", "#9a7a56", 1.1] : ["#cfe8ff", "#a8946a", 1.2]} shadowSize={20} />
      <Sky kind={gold ? "gold" : "day"} t={t} /><group rotation={[0, Math.PI, 0]}><Sky kind={gold ? "gold" : "day"} t={t} /></group>
      <Skyline z={-95} seed={1} /><Skyline z={105} seed={2} />
      <CityGround /><Street x0={-95} x1={95} />
      <mesh material={rm} rotation={[-Math.PI / 2, 0, 0]} position={[47, 0.007, -48]}><planeGeometry args={[6, 86]} /></mesh>
      <Plaza x0={-95} x1={95} z0={8.8} z1={17} />
      {BACK.map((b, i) => <Building key={i} {...b} />)}
      {FILL_BACK.map((b, i) => <Building key={"b" + i} {...b} />)}
      {FILL_FRONT.map((b, i) => <Building key={"f" + i} {...b} />)}
      <GasStation p={[-49.5, 0, 0]} t={t} empty={false} />
      {[-82, -66, -36, -21, -5.5, 8, 18, 28, 44, 62, 80].map((x, i) => <Tree key={i} p={[x, 0.2, 15.6 + (i % 2) * 0.6]} s={0.95 + (i % 3) * 0.1} seed={i + 1} />)}
      {[-84, -70, -56, -42, -28, -14, 0, 14, 28, 42, 56, 70, 84].map((x, i) => <Lamp key={i} p={[x, 0, -1.6]} />)}{[-77, -63, -49, -35, -21, -7, 7, 21, 35, 49, 63, 77].map((x, i) => <Lamp key={i} p={[x, 0, 9.6]} />)}
      <Bench p={[-4, 0.1, -2.6]} /><Bench p={[8.2, 0.1, 7.2]} rot={Math.PI} /><Bench p={[-52, 0.1, 12.4]} rot={Math.PI} /><Bench p={[30, 0.1, 12.4]} rot={Math.PI} />
      <Board p={[-72, 0.2, 11.4]} w={5.0} h={2.1} tex={wt} />
      {children}
    </group>
  );
};
const Walkers: React.FC<{ t: number; cam: V3; n?: number; seed?: number }> = ({ t, cam, n = 6, seed = 1 }) => {
  const r = useMemo(() => rng(seed * 3), [seed]);
  const w = useMemo(() => Array.from({ length: n }, (_, i) => ({ z: i % 2 ? -2.6 : 7.4, sp: 0.8 + r() * 0.5, off: r() * 60, dir: i % 2 ? 1 : -1, look: LOOKS[(i * 3 + seed) % LOOKS.length] })), [n, r, seed]);
  return <>{w.map((q, i) => { const x = -30 + ((q.off + t * q.sp * q.dir + 120) % 60); return <P key={i} look={q.look} p={[x, 0.2, q.z]} cam={cam} t={t} s={1.35} pose="walk" yaw={q.dir > 0 ? 0.9 : -0.9} seed={i + 3 + seed} />; })}</>;
};

/* ------------------------------------------------------------------ interiors */
const floorTex = () => cv(512, 512, (g, w, h) => { const r = rng(5); const rows = 8, rh = h / rows; for (let i = 0; i < rows; i++) { const y = i * rh; let x = -r() * 200; while (x < w) { const len = 180 + r() * 220; g.fillStyle = ["#b47a46", "#ac7040", "#bb824c", "#a86c3c"][Math.floor(r() * 4)]; g.fillRect(x, y, len, rh); g.fillStyle = "rgba(60,30,12,.5)"; g.fillRect(x, y, 3, rh); x += len; } g.fillStyle = "rgba(50,24,8,.55)"; g.fillRect(0, y, w, 3); g.fillStyle = "rgba(255,225,170,.1)"; g.fillRect(0, y + 3, w, 3); } }, true);
const wallPaper = (c: string) => cv(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.05)"; g.fillRect(i * 32, 0, 32, h); } const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.1)"); gr.addColorStop(1, "rgba(0,0,0,.14)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true);
const Room: React.FC<{ w: number; d: number; h: number; wall: string; t: number; warm?: number; children?: React.ReactNode }> = ({ w, d, h, wall, t, warm = 1, children }) => {
  const fl = useMemo(() => toon(rep(floorTex(), w / 6, d / 6)), [w, d]); const wm = useMemo(() => toon(rep(wallPaper(wall), w / 4, h / 4)), [wall, w, h]); const wm2 = useMemo(() => toon(rep(wallPaper(wall), d / 4, h / 4)), [wall, d, h]);
  const trim = useMemo(() => toon("#f1e8d4"), []); const sky = useMemo(() => new THREE.MeshBasicMaterial({ color: "#bfe4f6" }), []);
  return (
    <group>
      <SceneEnv bg="#f2dcc0" /><Lights color="#ffe6b8" intensity={2.2 * warm + 0.2} pos={[-6, 12, 10]} hemi={["#fff0d8", "#a8805a", 1.1 * warm + 0.1]} shadowSize={14} extra={<pointLight position={[0, h - 1, 1]} intensity={16 * warm} color="#ffd890" distance={26} />} />
      <Ink geometry={box(w, 0.4, d)} material={fl} position={[0, -0.2, 0]} px={2} cast={false} />
      <Ink geometry={box(w, h, 0.4)} material={wm} position={[0, h / 2, -d / 2]} px={2} cast={false} />
      <Ink geometry={box(0.4, h, d)} material={wm2} position={[-w / 2, h / 2, 0]} px={2} cast={false} /><Ink geometry={box(0.4, h, d)} material={wm2} position={[w / 2, h / 2, 0]} px={2} cast={false} />
      <Ink geometry={box(w, 0.7, 0.2)} material={trim} position={[0, 0.35, -d / 2 + 0.3]} px={1.4} cast={false} />
      <group position={[w * 0.28, h * 0.58, -d / 2 + 0.25]}>
        <Ink geometry={box(3.0, 2.6, 0.16)} material={trim} px={1.6} cast={false} /><mesh material={sky} position={[0, 0, 0.1]}><planeGeometry args={[2.6, 2.2]} /></mesh>
        <Ink geometry={box(0.1, 2.2, 0.08)} material={trim} position={[0, 0, 0.14]} px={1} cast={false} /><Ink geometry={box(2.6, 0.1, 0.08)} material={trim} position={[0, 0, 0.14]} px={1} cast={false} />
      </group>
      {[-w * 0.25, w * 0.1].map((x, i) => <group key={i} position={[x, h - 0.2, -d * 0.1]}><Ink geometry={new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6)} material={toon("#3a2630")} position={[0, 0.6, 0]} px={1} cast={false} /><Ink geometry={new THREE.ConeGeometry(0.7, 0.55, 14, 1, true)} material={toon("#e8c870", { side: THREE.DoubleSide })} position={[0, -0.1, 0]} px={1.4} cast={false} /><mesh position={[0, -0.35, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshBasicMaterial color="#fff2b8" /></mesh></group>)}
      {children}
    </group>
  );
};
const ShelfUnit: React.FC<{ p: V3; w?: number; h?: number; rows?: number; kind?: "bread" | "cans" | "empty"; seed?: number; rot?: number; fill?: number }> = ({ p, w = 4.2, h = 3.6, rows = 4, kind = "cans", seed = 1, rot = 0, fill = 1 }) => {
  const wood = useMemo(() => toon("#8a5a34"), []); const dk = useMemo(() => toon("#6a4226"), []);
  const items = useMemo(() => { const r = rng(seed * 9); const a: { x: number; y: number; c: string; sx: number; sy: number }[] = []; const cols = kind === "bread" ? ["#d8a050", "#c48a3e", "#e8b868", "#b87a38"] : ["#d8483a", "#3f9a62", "#e8c030", "#2f6aa8", "#f0e0c0", "#b84a8a"]; for (let ro = 0; ro < rows; ro++) { const y = 0.45 + ro * ((h - 0.5) / rows); let x = -w / 2 + 0.3; while (x < w / 2 - 0.3) { const sx = kind === "bread" ? 0.55 + r() * 0.2 : 0.22 + r() * 0.12; const sy = kind === "bread" ? 0.28 + r() * 0.1 : 0.34 + r() * 0.14; if (r() < fill) a.push({ x: x + sx / 2, y: y + sy / 2, c: cols[Math.floor(r() * cols.length)], sx, sy }); x += sx + 0.06; } } return a; }, [seed, w, h, rows, kind, fill]);
  const mats = useMemo(() => ["#d8483a", "#3f9a62", "#e8c030", "#2f6aa8", "#f0e0c0", "#b84a8a", "#d8a050", "#c48a3e", "#e8b868", "#b87a38"].map((c) => toon(c)), []);
  const idx = (c: string) => ["#d8483a", "#3f9a62", "#e8c030", "#2f6aa8", "#f0e0c0", "#b84a8a", "#d8a050", "#c48a3e", "#e8b868", "#b87a38"].indexOf(c);
  return <group position={p} rotation={[0, rot, 0]}>
    <Ink geometry={box(0.18, h, 0.7)} material={dk} position={[-w / 2, h / 2, 0]} px={1.6} cast={false} /><Ink geometry={box(0.18, h, 0.7)} material={dk} position={[w / 2, h / 2, 0]} px={1.6} cast={false} />
    <Ink geometry={box(w, h, 0.1)} material={wood} position={[0, h / 2, -0.3]} px={1.4} cast={false} />
    {Array.from({ length: rows + 1 }, (_, i) => <Ink key={i} geometry={box(w, 0.1, 0.7)} material={wood} position={[0, 0.3 + i * ((h - 0.5) / rows), 0]} px={1.4} cast={false} />)}
    {kind !== "empty" ? items.map((q, i) => <mesh key={i} material={mats[Math.max(0, idx(q.c))]} position={[q.x, q.y, 0.05]}><boxGeometry args={[q.sx, q.sy, 0.4]} /></mesh>) : null}
  </group>;
};
const Counter: React.FC<{ p: V3; w?: number }> = ({ p, w = 5 }) => { const wd = useMemo(() => toon("#8a5a34"), []); const top = useMemo(() => toon("#c8a070"), []); const m = useMemo(() => toon("#4a3a44"), []); const sc = useMemo(() => new THREE.MeshBasicMaterial({ color: "#9ad8c0" }), []); return <group position={p}><Ink geometry={box(w, 1.7, 1.3)} material={wd} position={[0, 0.85, 0]} px={2} cast={false} /><Ink geometry={box(w + 0.3, 0.16, 1.5)} material={top} position={[0, 1.78, 0]} px={1.6} cast={false} /><Ink geometry={box(0.9, 0.5, 0.7)} material={m} position={[w / 2 - 1, 2.1, 0]} px={1.4} cast={false} /><mesh material={sc} position={[w / 2 - 1, 2.25, 0.36]} rotation={[-0.3, 0, 0]}><planeGeometry args={[0.6, 0.3]} /></mesh></group>; };

/* ------------------------------------------------------------------ props that tell the story */
const checkTex = () => cv(1024, 480, (g, w, h) => {
  g.fillStyle = "#f6f0dc"; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(120,190,130,.25)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#2f6a3a"; g.lineWidth = 14; g.strokeRect(18, 18, w - 36, h - 36); g.lineWidth = 4; g.strokeRect(38, 38, w - 76, h - 76);
  g.fillStyle = "#2a1a1e"; g.textAlign = "left"; g.textBaseline = "middle"; g.font = "400 46px 'Lilita One', Impact, sans-serif"; g.fillText("MEGA LOTTERY", 70, 92); g.font = "400 34px 'Lilita One', Impact, sans-serif"; g.fillText("PAY TO THE ORDER OF:", 70, 168);
  g.fillStyle = "#7a1f22"; g.font = "400 66px 'Lilita One', Impact, sans-serif"; g.fillText("EVERY PERSON IN TOWN", 70, 240);
  g.fillStyle = "#2f6a3a"; g.font = "400 96px 'Lilita One', Impact, sans-serif"; g.textAlign = "center"; g.fillText("$3,000,000,000", w / 2, 340);
  g.strokeStyle = "#2a1a1e"; g.lineWidth = 5; g.beginPath(); g.moveTo(640, 420); g.bezierCurveTo(700, 380, 740, 440, 800, 395); g.bezierCurveTo(850, 360, 880, 420, 930, 400); g.stroke();
});
const listTex = () => cv(512, 1400, (g, w, h) => {
  g.fillStyle = "#f4ecd2"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a7a5a"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = "#2a1a1e"; g.textAlign = "center"; g.font = "400 54px 'Lilita One', Impact, sans-serif"; g.fillText("EVERY NAME", w / 2, 70);
  const names = ["Mayor Ruiz", "Baker Hale", "Bus Driver Cole", "Paperboy Finn", "Doc Patel", "Mrs. Bell", "Mr. Okafor", "Teacher Lin", "Dave Miller", "Ana Costa", "Old Tom", "Rosa Diaz", "Joe Wang", "Mia Brooks", "Sam Reyes", "Lena Fox", "Ben Ito", "Ava Stone", "Max Cole", "Zoe Quinn", "Kai Moreno", "Nora Webb", "Leo Park", "Ivy Adams", "Gus Perry", "Ella Shaw", "Hugo Lane", "Tess Ford", "Abe Cruz", "Pia Novak", "Ned Long", "Uma Rao"];
  g.textAlign = "left"; g.font = "400 36px 'Lilita One', Impact, sans-serif"; names.forEach((n, i) => { g.fillStyle = i < 4 ? "#7a1f22" : "#3a2a30"; g.fillText(n, 60, 140 + i * 40); g.fillStyle = "rgba(47,106,58,.9)"; g.textAlign = "right"; g.fillText("$1,000,000", w - 50, 140 + i * 40); g.textAlign = "left"; });
});
const tvTex = (stage: number) => cv(512, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1f2a6a"); gr.addColorStop(1, "#0f1640"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffe08a"; g.textAlign = "center"; g.font = "400 40px 'Lilita One', Impact, sans-serif"; g.fillText("MEGA LOTTERY", w / 2, 50);
  const nums = [7, 14, 23, 31, 42, 56]; nums.forEach((n, i) => { const x = 62 + i * 78, y = 150; const hit = stage > i; const rg = g.createRadialGradient(x - 8, y - 8, 4, x, y, 34); rg.addColorStop(0, hit ? "#fff8c8" : "#ffffff"); rg.addColorStop(1, hit ? "#f0b020" : "#9aa6c8"); g.fillStyle = rg; g.beginPath(); g.arc(x, y, 33, 0, 7); g.fill(); g.strokeStyle = INKD; g.lineWidth = 4; g.stroke(); g.fillStyle = "#2a1a1e"; g.font = "400 34px 'Lilita One', Impact, sans-serif"; g.fillText(String(n), x, y + 12); });
  g.fillStyle = stage >= 6 ? "#7ff0a0" : "#9aa6c8"; g.font = "400 46px 'Lilita One', Impact, sans-serif"; g.fillText(stage >= 6 ? "$3,000,000,000" : "JACKPOT", w / 2, 262);
});
const TV: React.FC<{ p: V3; stage: number; rot?: number }> = ({ p, stage, rot = 0 }) => { const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tvTex(stage) }), [stage]); const dk = useMemo(() => toon("#2a2a34"), []); return <group position={p} rotation={[0, rot, 0]}><Ink geometry={box(3.9, 2.5, 0.4)} material={dk} px={2} cast={false} /><mesh material={m} position={[0, 0, 0.22]}><planeGeometry args={[3.6, 2.2]} /></mesh></group>; };
const PriceTag: React.FC<{ p: V3; price: string; s?: number; rot?: number }> = ({ p, price, s = 1, rot = 0 }) => { const m = useMemo(() => new THREE.MeshBasicMaterial({ map: signTex(price, "#fff4d8", "#c8283a", 512, 256) }), [price]); const dk = useMemo(() => toon("#3a2630"), []); return <group position={p} rotation={[0, rot, 0]} scale={s}><Ink geometry={box(1.7, 0.95, 0.12)} material={dk} px={1.6} cast={false} /><mesh material={m} position={[0, 0, 0.07]}><planeGeometry args={[1.56, 0.8]} /></mesh></group>; };
const Loaf: React.FC<{ p: V3; s?: number; rot?: number }> = ({ p, s = 1, rot = 0 }) => { const m = useMemo(() => toon("#d89a48"), []); const g = useMemo(() => { const x = new THREE.CapsuleGeometry(0.28, 0.7, 6, 14); x.rotateZ(Math.PI / 2); return x; }, []); return <Ink geometry={g} material={m} position={p} rotation={[0, rot, 0]} scale={[s, s * 0.8, s]} px={1.4} cast={false} />; };
const Oven: React.FC<{ p: V3; t: number; on?: number }> = ({ p, t, on = 1 }) => { const br = useMemo(() => toon("#a8553a"), []); const dk = useMemo(() => toon("#2a2a34"), []); const fire = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff9a30" }), []); return <group position={p}><Ink geometry={box(3.6, 3.2, 1.8)} material={br} position={[0, 1.6, 0]} px={2} cast={false} /><Ink geometry={box(2.2, 1.3, 0.2)} material={dk} position={[0, 1.2, 0.95]} px={1.6} cast={false} /><mesh material={fire} position={[0, 1.2, 1.07]} scale={[1, (0.5 + 0.5 * on) * (0.92 + 0.08 * Math.sin(t * 9)), 1]}><planeGeometry args={[1.8, 0.9]} /></mesh><Ink geometry={new THREE.CylinderGeometry(0.4, 0.5, 2.2, 12)} material={dk} position={[1.2, 4.2, -0.4]} px={1.6} cast={false} /></group>; };

/* ------------------------------------------------------------------ scenes */
export const T0Hook: React.FC<SceneProps> = ({ t, cam }) => (
  <Town t={t} gold><Walkers t={t} cam={cam} n={8} seed={2} /><Sun p={[-60, 14, -120]} s={90} /><SunDust t={t} n={40} area={[40, 10, 30]} />
    <Car p={[-6, 0.05, 3.4]} color="#c8403a" rot={0} /><Car p={[9, 0.05, 1.0]} color="#2f6aa8" rot={Math.PI} /></Town>
);
export const T1Small: React.FC<SceneProps> = ({ t, cam }) => (
  <Town t={t + 3} gold><Walkers t={t} cam={cam} n={8} seed={5} /><SunDust t={t} n={30} area={[30, 8, 20]} />
    <P look="woman" p={[-78, 0.2, 12.2]} cam={cam} t={t} s={1.5} expr="smug" pose="idle" seed={4} /><P look="boss" p={[-65, 0.2, 12.0]} cam={cam} t={t} s={1.5} expr="grin" pose="hold" seed={7} /></Town>
);
export const T2Pool: React.FC<SceneProps> = ({ t, cam }) => {
  const weeks = ["WEEK 1", "WEEK 12", "WEEK 52", "WEEK 130", "WEEK 260", "WEEK 390", "WEEK 520"]; const wi = Math.min(weeks.length - 1, Math.floor(t / 1.6));
  const jarH = 0.4 + 2.1 * smooth(t / 11); const glass = useMemo(() => new THREE.MeshBasicMaterial({ color: "#bfe6f2", transparent: true, opacity: 0.32, depthWrite: false }), []); const cash = useMemo(() => toon("#7fbf6a"), []);
  const q = [0, 1, 2, 3, 4];
  return (
    <Room w={22} d={16} h={8.5} wall="#d8c6a0" t={t}>
      <ShelfUnit p={[-6.5, 0, -7.2]} kind="cans" seed={2} /><ShelfUnit p={[-1.5, 0, -7.2]} kind="bread" seed={3} /><ShelfUnit p={[-10.4, 0, -3]} kind="cans" seed={4} rot={Math.PI / 2} />
      <Counter p={[3.4, 0, -3.4]} w={6} />
      <group position={[2.4, 1.86, -3.4]}><mesh material={glass}><cylinderGeometry args={[0.75, 0.75, 2.5, 22]} /></mesh><mesh material={cash} position={[0, -1.25 + jarH / 2, 0]}><cylinderGeometry args={[0.7, 0.7, jarH, 20]} /></mesh><Ink geometry={new THREE.CylinderGeometry(0.8, 0.8, 0.2, 20)} material={toon("#8a5a34")} position={[0, 1.35, 0]} px={1.4} cast={false} /></group>
      <Board p={[-3.2, 3.1, -7.4]} w={3.0} h={0.8} tex={signTex("TICKET FUND $1", "#f6efd8", "#2f6a4a", 768, 200)} legs={false} />
      <Board p={[9.2, 3.1, -7.4]} w={3.0} h={1.0} tex={signTex(weeks[wi], "#2f3f6a", "#ffe9a0", 768, 220)} legs={false} />
      <P look="clerk" p={[3.8, 0.1, -4.8]} cam={cam} t={t} s={1.5} expr="grin" pose="idle" seed={3} />
      {q.map((i) => { const x = -0.6 - i * 2.0; const drop = (t * 0.7 + i * 0.35) % 1; return <group key={i}><P look={LOOKS[(i * 4) % LOOKS.length]} p={[x + 3.6, 0.1, -1.0 + (i % 2) * 0.3]} cam={cam} t={t} s={1.45} expr={i % 2 ? "grin" : "deadpan"} pose="idle" seed={i + 9} /><mesh position={[Math.max(2.4, x + 3.6 - 0.6 * drop), 3.4 - drop * 1.2, -2.2]} rotation={[0.4, drop * 4, 0.3]}><planeGeometry args={[0.45, 0.22]} /><meshBasicMaterial color="#7fbf6a" side={THREE.DoubleSide} /></mesh></group>; })}
    </Room>
  );
};
export const T3Numbers: React.FC<SceneProps> = ({ t, cam }) => {
  const s0 = wordIn(3, "this", 0.1), s1 = wordIn(3, "jackpot", 4.0); const stage = t < s0 ? 0 : Math.min(6, 1 + Math.floor((t - s0) / 0.5)); const final = t > s1 + 0.2 ? 6 : stage;
  return (
    <Room w={24} d={16} h={9} wall="#a9d0d2" t={t}>
      <TV p={[0, 5.4, -7.5]} stage={final} />
      <Counter p={[-8, 0, -4.8]} w={6} />
      {[0, 1, 2, 3, 4, 5].map((i) => { const x = -6 + i * 2.5; return <group key={i}><Ink geometry={new THREE.CylinderGeometry(0.5, 0.45, 1.5, 14)} material={toon("#d8483a")} position={[x, 0.75, -1.2 + (i % 2) * 1.6]} px={1.6} cast={false} /><P look={LOOKS[(i * 5 + 1) % LOOKS.length]} p={[x, 1.55, -1.2 + (i % 2) * 1.6]} cam={[0, 4, -7]} t={t} s={1.25} expr={final >= 6 ? "shock" : "worried"} pose={final >= 6 ? "cheer" : "hold"} seed={i + 4} yaw={0} shadow={false} /></group>; })}
      <P look="baker" p={[-8, 0.1, -6.2]} cam={cam} t={t} s={1.5} expr={final >= 6 ? "shock" : "think"} pose="hold" seed={22} />
      {final >= 6 ? <Bills t={t - s1} born={0} n={40} area={[18, 9, 10]} center={[0, 0, 0]} /> : null}
    </Room>
  );
};
const CheckEasel: React.FC<{ p: V3 }> = ({ p }) => <Board p={p} w={5.6} h={2.6} tex={useMemo(() => checkTex(), [])} />;
export const T4Monday: React.FC<SceneProps> = ({ t, cam }) => (
  <Town t={t} gold>
    <CheckEasel p={[0.6, 0.0, 0.6]} />
    <P look="clerk" p={[-3.4, 0.1, 1.6]} cam={cam} t={t} s={1.6} expr="smug" pose="point" seed={8} />
    <Ink geometry={new THREE.CylinderGeometry(0.1, 0.1, 0.1, 6)} material={toon("#000")} position={[0, -9, 0]} px={1} cast={false} />
    <Crowd t={t} cam={cam} n={22} c={[0, 0.2, 5.6]} w={22} d={3.6} seed={3} expr="think" />
    <Walkers t={t} cam={cam} n={4} seed={9} /><Sun p={[-60, 20, -110]} s={80} /><SunDust t={t} n={30} area={[30, 8, 16]} />
  </Town>
);
export const T5Names: React.FC<SceneProps> = ({ t, cam }) => {
  const lt = useMemo(() => new THREE.MeshBasicMaterial({ map: listTex(), side: THREE.DoubleSide }), []);
  const hit = (w: string, fb: number) => wordIn(5, w, fb); const k = [hit("mayor", 3), hit("baker", 4), hit("bus", 5), hit("kid", 6.5)];
  return (
    <Town t={t} gold>
      <group position={[-6.2, 0, 1.0]}><Ink geometry={box(3.0, 0.2, 0.2)} material={toon("#6a4630")} position={[0, 7.3, 0]} px={1.6} cast={false} /><mesh material={lt} position={[0, 3.7, 0.1]}><planeGeometry args={[3.2, 7.2]} /></mesh></group>
      {[["official", -2.4, "proud"], ["baker", -0.4, "grin"], ["cap", 1.6, "smug"], ["cap", 3.4, "grin"]].map(([lk, x, ex], i) => <group key={i} position={[0, 0, 0]}><P look={lk as any} p={[x as number, 0.1 + Math.max(0, Math.sin((t - k[i]) * 7)) * (t > k[i] && t < k[i] + 0.6 ? 0.35 : 0), 1.6 - (i % 2) * 0.4]} cam={cam} t={t} s={i === 3 ? 1.1 : 1.55} expr={t > k[i] ? "laugh" : (ex as any)} pose={t > k[i] ? "cheer" : "idle"} seed={i + 1} /></group>)}
      <CheckEasel p={[7.6, 0, 0.8]} />
      <Crowd t={t} cam={cam} n={14} c={[2, 0.2, 11.8]} w={18} d={3.2} seed={4} expr="think" />
    </Town>
  );
};
export const T6Scream: React.FC<SceneProps> = ({ t, cam }) => {
  const sc = wordIn(6, "then", 5.0); const go = t > sc ? 1 : 0; const kk = clamp((t - sc) / 0.4);
  return (
    <Town t={t} gold>
      <Crowd t={t} cam={cam} n={46} c={[0, 0.2, 5.2]} w={26} d={7.5} seed={6} pose={go ? "cheer" : "idle"} expr={go ? "laugh" : "shock"} emph={go ? 1 : 0} />
      <CheckEasel p={[1.2, 0, -2.4]} />
      {go ? <Bills t={t - sc} born={0} n={170} area={[34, 14, 16]} center={[0, 0, 4]} fall={2.0} /> : null}
      {go ? <group>{Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[(i - 4.5) * 3.6, 5 + (i % 3) * 1.2 + kk * 3, 3 + (i % 2)]}><sphereGeometry args={[0.1 + 0.12 * (1 - kk), 8, 6]} /><meshBasicMaterial color={["#ffd24a", "#ff7a7a", "#7ad0ff"][i % 3]} /></mesh>)}</group> : null}
    </Town>
  );
};
const Dealer: React.FC<SceneProps & { sold?: number }> = ({ t, cam, sold = 0 }) => {
  const soldM = useMemo(() => new THREE.MeshBasicMaterial({ map: signTex("SOLD", "#d8283a", "#fff6e0", 256, 128), side: THREE.DoubleSide }), []);
  const cols = ["#c8403a", "#2f6aa8", "#3f9a62", "#e8b030", "#7a4aa8", "#f2eee2", "#d8683a", "#4a8aa8"];
  return (
    <Town t={t}>
      {Array.from({ length: 14 }, (_, i) => { const row = i % 2, col = Math.floor(i / 2); const px = 15.5 + col * 3.3, pz = 3.0 + row * 3.6; const soldAt = 0.6 + i * 0.32; const driveT = clamp((t - (soldAt + 1.0)) / 2.8); const dx = smooth(driveT) * 40 * (row ? 1 : 1); const out = t > soldAt + 1.0;
        return <group key={i}><Car p={[px + dx, 0.05, pz]} rot={Math.PI / 2 + (out ? 0 : 0)} color={cols[i % cols.length]} s={1.0} spin={t * 6} />{t > soldAt && !out ? <mesh material={soldM} position={[px, 2.6, pz]} rotation={[0, 0, Math.sin(t * 6 + i) * 0.04]}><planeGeometry args={[1.5, 0.75]} /></mesh> : null}</group>; })}
      <P look="owner" p={[24, 0.1, -1.2]} cam={cam} t={t} s={1.6} expr={t > 1 ? "laugh" : "grin"} pose="cheer" seed={12} emph={1} />
      {[0, 1, 2, 3, 4, 5].map((i) => <P key={i} look={LOOKS[(i * 3) % LOOKS.length]} p={[13 + i * 3.4, 0.2, 6.9 + (i % 2) * 0.5]} cam={cam} t={t} s={1.4} expr="grin" pose="cheer" seed={i + 30} emph={0.6} />)}
      <Bills t={t} born={0.4} n={36} area={[14, 8, 8]} center={[22, 0, 5]} fall={1.0} />
    </Town>
  );
};
export const T7Dealer: React.FC<SceneProps> = (p) => <Dealer {...p} />;
export const T8Boat: React.FC<SceneProps> = ({ t, cam }) => (
  <Town t={t + 2}>
    <Street x0={125} x1={205} z0={14} z1={21} />
    {[140, 155, 170].map((x, i) => <Building key={i} p={[x, 0, 5]} w={8} h={5.2} d={6} wall={["#e6c47a", "#a8c4d8", "#d8a8a0"][i]} wallKind="siding" roof={["#8a4a3a", "#4a5a7a", "#6a4a46"][i]} roofType="gable" chimney={i !== 1} rot={0} doorColor={["#8a3a2a", "#d8483a", "#4a6a8a"][i]} />)}
    {[135, 150, 165, 180].map((x, i) => <Building key={"a" + i} p={[x + 7, 0, 32]} w={8} h={5.4} d={6} wall={["#b8d0a0", "#e8d8a8", "#c8a8d0", "#a8d0c8"][i]} wallKind="siding" roof="#7a5a3a" roofType="gable" rot={Math.PI} doorColor="#8a3a2a" />)}
    {[140, 155, 170].map((x, i) => <Lawn key={i} p={[x + 1, 0, 9.4]} w={11} d={2.8} />)}
    <Boat p={[161.7, 0.1, 9.6]} rot={0.1} s={1.1} />
    <P look="owner" p={[157, 0.2, 12.2]} cam={cam} t={t} s={1.6} expr="laugh" pose="cheer" seed={4} emph={1} />
    <P look="woman" p={[151, 0.2, 12.0]} cam={cam} t={t} s={1.5} expr="worried" pose="cross" seed={5} />
    <Board p={[147, 0.2, 11.4]} w={2.6} h={0.9} tex={signTex("NO LAKE HERE", "#f6efd8", "#2f5a8a", 640, 220)} />
    <Car p={[146, 0.05, 17.4]} color="#2f6aa8" rot={Math.PI} /><Car p={[168, 0.05, 18.4]} color="#c8403a" rot={0} />
    {[137, 152, 166, 178].map((x, i) => <Tree key={i} p={[x, 0.2, 11.6]} s={0.9} seed={i + 3} />)}
    <Bills t={t} born={0.8} n={24} area={[10, 7, 6]} center={[158, 0, 10]} fall={1.0} />
  </Town>
);
const Pump: React.FC<{ p: V3; t: number; empty?: boolean }> = ({ p, empty = false }) => { const r = useMemo(() => toon("#d8483a"), []); const dk = useMemo(() => toon("#2a2a34"), []); const sc = useMemo(() => new THREE.MeshBasicMaterial({ color: empty ? "#d8483a" : "#9ad8c0" }), [empty]); return <group position={p}><Ink geometry={box(0.9, 2.0, 0.7)} material={r} position={[0, 1.0, 0]} px={1.8} cast={false} /><mesh material={sc} position={[0, 1.5, 0.37]}><planeGeometry args={[0.6, 0.35]} /></mesh><Ink geometry={box(1.1, 0.2, 0.9)} material={dk} position={[0, 0.1, 0]} px={1.4} cast={false} /><Ink geometry={new THREE.TorusGeometry(0.22, 0.05, 8, 14, Math.PI * 1.5)} material={dk} position={[0.52, 1.0, 0]} rotation={[0, 0, 0.5]} px={1} cast={false} /></group>; };
export const T9Gas: React.FC<SceneProps> = ({ t, cam }) => {
  const emptyAt = 2.6; const colsC = ["#2f6aa8", "#3f9a62", "#c8403a", "#e8b030", "#7a4aa8", "#f2eee2", "#d8683a"];
  return (
    <Town t={t + 4} gold>
      <GasStation p={[-49.5, 0, 0]} t={t} empty={t > emptyAt} />
      <Car p={[-52.5, 0.05, -2.9]} rot={Math.PI / 2} color="#2f6aa8" /><Car p={[-46.5, 0.05, -2.9]} rot={Math.PI / 2} color="#c8403a" />
      {colsC.map((c, i) => <Car key={i} p={[-38 + i * 5 + Math.sin(t * 14 + i) * 0.01, 0.05, 2.4]} rot={Math.PI} color={c} />)}
      {[0, 1, 2].map((i) => <P key={i} look={LOOKS[i * 4]} p={[-44 + i * 2.6, 0.2, 0.2]} cam={cam} t={t} s={1.4} expr={t > emptyAt ? "worried" : "grin"} pose={t > emptyAt + 0.4 ? "cross" : "hold"} seed={i + 40} />)}
      <Walkers t={t} cam={cam} n={3} seed={7} />
    </Town>
  );
};
const QuitSign: React.FC<{ p: V3; t: number; at: number }> = ({ p, t, at }) => { const m = useMemo(() => new THREE.MeshBasicMaterial({ map: signTex("I QUIT!", "#fff4d8", "#c8283a", 512, 220), side: THREE.DoubleSide }), []); const k = clamp((t - at) / 0.25); if (t < at) return null; return <mesh material={m} position={[p[0], p[1] + 3.5 + 0.2 * Math.sin((t - at) * 3), p[2]]} scale={[k * 1.3, k * 1.3, 1]}><planeGeometry args={[1.8, 0.8]} /></mesh>; };
export const T10Quit: React.FC<SceneProps> = ({ t, cam }) => {
  const people: [string, number, string][] = [["cap", -14, "bus"], ["guest", -9, "cashier"], ["woman", -4, "teacher"], ["craftsman", 1, "plumber"], ["engineer", 6, "mechanic"], ["scientist", 11, "doctor"]];
  const at = [wordIn(10, "bus", 2.0), wordIn(10, "cashier", 3.2), wordIn(10, "teacher", 4.6), wordIn(10, "plumber", 6.4), wordIn(10, "mechanic", 7.4), wordIn(10, "doctor", 8.6)];
  return (
    <Town t={t}>
      {people.map(([lk, x], i) => { const go = clamp((t - at[i] - 0.5) / 4); const dir = i % 2 ? 1 : -1; return <group key={i}><P look={lk as any} p={[x + dir * go * 9, 0.2, 1.1 + (i % 3) * 1.1]} cam={cam} t={t} s={1.55} expr={t > at[i] ? "laugh" : "deadpan"} pose={t > at[i] + 0.5 ? "walk" : t > at[i] ? "cheer" : "idle"} yaw={t > at[i] + 0.5 ? dir * 0.9 : undefined} seed={i + 60} /><QuitSign p={[x + dir * go * 9, 0, 1.1 + (i % 3) * 1.1]} t={t} at={at[i]} /></group>; })}
      <Bills t={t} born={at[0]} n={50} area={[60, 8, 8]} center={[0, 0, 2]} fall={1.2} />
    </Town>
  );
};
export const T11Baker: React.FC<SceneProps> = ({ t, cam }) => {
  const off = wordIn(11, "turns", 5.0); const dark = t > off ? 0.12 : 1; const sleepAt = wordIn(11, "sleeping", 3.2);
  return (
    <Room w={20} d={14} h={8.2} wall="#e8c8a0" t={t} warm={dark}>
      <Oven p={[-4, 0, -6.2]} t={t} on={dark} /><Oven p={[0.2, 0, -6.2]} t={t} on={dark} />
      <ShelfUnit p={[6.5, 0, -6.6]} kind="bread" seed={5} w={5} />
      <Counter p={[6, 0, 0.2]} w={7} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <Loaf key={i} p={[3.6 + i * 0.85, 2.2, 0.2]} rot={0.2} />)}
      <Board p={[-8.6, 3, -6.8]} w={3.0} h={0.9} tex={signTex("FRESH BREAD $3", "#fff4d8", "#b8505a", 768, 220)} legs={false} />
      <P look="baker" p={[-1.2, 0.2, 0.4]} cam={cam} t={t} s={1.7} expr={t > off ? "sleep" : t > sleepAt ? "think" : "deadpan"} pose={t > off ? "sleep" : t > sleepAt ? "cross" : "hold"} seed={2} />
      <pointLight position={[-2, 2.2, -4.6]} intensity={18 * (dark > 0.5 ? 1 : 0.4)} color="#ff9a40" distance={12} />
    </Room>
  );
};
export const T12Shop: React.FC<SceneProps> = ({ t, cam }) => {
  const open = useMemo(() => signTex("OPEN", "#2f9a52", "#fff6e0", 512, 200), []);
  return (
    <Town t={t}>
      <Board p={[-17, 0, -0.6]} w={1.8} h={0.8} tex={open} /><Board p={[-9.6, 0, -0.6]} w={1.8} h={0.8} tex={open} />
      {Array.from({ length: 26 }, (_, i) => { const tgt = i % 2 ? -17 : -9.6; const sp = 0.6 + (i % 5) * 0.12; const k = clamp((t * sp - i * 0.12) / 1.0); const sx = -4 + (i % 7) * 4; return <P key={i} look={LOOKS[(i * 5 + 2) % LOOKS.length]} p={[sx + (tgt - sx) * smooth(k), 0.15, 5.6 - 5.0 * smooth(k) + (i % 3) * 0.3]} cam={cam} t={t} s={1.4} pose="walk" yaw={tgt - sx > 0 ? 0.9 : -0.9} expr="grin" seed={i + 70} />; })}
      <Bills t={t} born={0.3} n={50} area={[16, 8, 6]} center={[-13, 0, 3]} fall={1.2} />
    </Town>
  );
};
const Window: React.FC<{ price: string; t: number }> = ({ price }) => <PriceTag p={[-5.2, 3.2, -1.6]} price={price} s={1.6} />;
const BreadRoom: React.FC<SceneProps & { prices: [string, number][]; shot: number }> = ({ t, cam, prices, shot }) => {
  const price = [...prices].reverse().find(([, at]) => t >= at)?.[0] ?? prices[0][0];
  const jump = t - ((prices.find(([p]) => p === price)?.[1]) ?? 0);
  return (
    <Room w={20} d={14} h={8.2} wall="#f0d4b8" t={t}>
      <ShelfUnit p={[5.5, 0, -6.6]} kind="bread" seed={5} w={6} fill={1} />
      <Counter p={[-5, 0, -2.6]} w={6} />
      {[0, 1, 2, 3, 4].map((i) => <Loaf key={i} p={[-6.5 + i * 0.85, 2.2, -2.6]} rot={0.2} />)}
      <group position={[0.4, 0, -1.0]} scale={1 + 0.12 * Math.max(0, 1 - jump * 4)}><PriceTag p={[0, 5.0, -4.8]} price={price} s={2.6} /></group>
      <P look="baker" p={[-0.4, 0.1, -3.6]} cam={cam} t={t} s={1.65} expr={price === "$3" ? "grin" : "shock"} pose={price === "$3" ? "idle" : "cheer"} seed={2} />
      {[0, 1, 2, 3, 4, 5].map((i) => <P key={i} look={LOOKS[(i * 5 + 3) % LOOKS.length]} p={[-1 + i * 1.7, 0.2, 2.0 + (i % 2) * 0.9]} cam={cam} t={t} s={1.4} expr="shock" pose={price === "$3" ? "hold" : "cheer"} seed={i + 80} emph={0.6} />)}
    </Room>
  );
};
export const T13Prices1: React.FC<SceneProps> = (p) => <BreadRoom {...p} prices={[["$3", 0], ["$20", wordIn(13, "now", 5)]]} shot={13} />;
export const T14Prices2: React.FC<SceneProps> = (p) => <BreadRoom {...p} prices={[["$20", 0], ["$50", wordIn(14, "fifty", 1.0)], ["$100", wordIn(14, "hundred", 3.2)]]} shot={14} />;
export const T15Couch: React.FC<SceneProps> = ({ t, cam }) => {
  const sofa = useMemo(() => toon("#b8505a"), []); const cush = useMemo(() => toon("#d86a74"), []); const wd = useMemo(() => toon("#6a4630"), []);
  const k = smooth(t / 4.4); const cx = 3 - 9 * k; const bob = Math.sin(t * 7) * 0.04 * (t > 0.5 ? 1 : 0);
  return (
    <Town t={t}>
      <Van p={[-17, 0.2, 4.2]} rot={Math.PI} />
      <group position={[cx, 1.1 + bob, 7.0]}>
        <Ink geometry={box(4.2, 1.0, 1.7)} material={sofa} position={[0, 0.7, 0]} px={2} cast={false} /><Ink geometry={box(4.2, 1.5, 0.5)} material={sofa} position={[0, 1.5, -0.6]} px={2} cast={false} />
        {[-1.4, 0, 1.4].map((x, i) => <Ink key={i} geometry={box(1.3, 0.34, 1.3)} material={cush} position={[x, 1.35, 0.15]} px={1.4} cast={false} />)}
        {[-2.2, 2.2].map((x, i) => <Ink key={i} geometry={box(0.4, 0.95, 1.7)} material={sofa} position={[x, 1.0, 0]} px={1.6} cast={false} />)}
        {[-1.8, 1.8].map((x, i) => <Ink key={i} geometry={box(0.18, 0.4, 0.18)} material={wd} position={[x, 0.2, 0.6]} px={1.2} cast={false} />)}
        <PriceTag p={[0, 3.3, 0]} price="$10,000" s={1.6} />
      </group>
      <P look="boss" p={[cx + 3.3, 0.2, 7.0]} cam={cam} t={t} s={1.55} expr="grin" pose="hold" seed={3} yaw={-0.9} /><P look="engineer" p={[cx - 3.3, 0.2, 7.0]} cam={cam} t={t} s={1.55} expr="strain" pose="hold" seed={6} yaw={0.9} />
      <P look="owner" p={[cx - 7.2, 0.2, 7.4]} cam={cam} t={t} s={1.6} expr="laugh" pose="walk" yaw={0.9} seed={9} />
      <P look="woman" p={[6.4, 0.2, 7.4]} cam={cam} t={t} s={1.5} expr="laugh" pose="cheer" seed={11} emph={1} />
      <Bills t={t} born={0.4} n={30} area={[8, 7, 4]} center={[6, 0, 7.5]} fall={1.4} />
    </Town>
  );
};
export const T16Lemonade: React.FC<SceneProps> = ({ t, cam }) => {
  const tb = useMemo(() => toon("#e8d8a0"), []); const wd = useMemo(() => toon("#8a5a34"), []); const lem = useMemo(() => toon("#f2e04a"), []); const gl = useMemo(() => new THREE.MeshBasicMaterial({ color: "#bfe6f2", transparent: true, opacity: 0.45 }), []);
  return (
    <Town t={t}>
      <group position={[-1, 0.2, 7.4]}>
        <Ink geometry={box(3.4, 0.16, 1.5)} material={wd} position={[0, 1.5, 0]} px={1.6} cast={false} />{[-1.5, 1.5].map((x, i) => <Ink key={i} geometry={box(0.14, 1.5, 0.14)} material={wd} position={[x, 0.75, 0]} px={1.4} cast={false} />)}
        <Ink geometry={box(3.6, 0.9, 0.12)} material={tb} position={[0, 1.0, 0.7]} px={1.4} cast={false} />
        <mesh material={gl} position={[-0.8, 2.2, 0]}><cylinderGeometry args={[0.38, 0.32, 1.1, 14]} /></mesh><mesh material={lem} position={[-0.8, 2.1, 0]}><cylinderGeometry args={[0.34, 0.3, 0.8, 14]} /></mesh>
        <Board p={[3.6, 0, 0.4]} w={2.4} h={0.9} tex={signTex("LEMONADE $200", "#fff4d8", "#c8283a", 768, 220)} />
      </group>
      <P look="cap" p={[0.6, 0.2, 6.2]} cam={cam} t={t} s={1.15} expr="proud" pose="cheer" seed={5} emph={0.6} />
      {[0, 1, 2, 3].map((i) => { const k = smooth((t * 0.5 - i * 0.18)); return <P key={i} look={LOOKS[(i * 3 + 1) % LOOKS.length]} p={[-12 + i * -1.5 + k * 9.0, 0.2, 3.4 + (i % 2) * 0.5]} cam={cam} t={t} s={1.45} pose="walk" yaw={0.9} expr="grin" seed={i + 90} />; })}
      <Bills t={t} born={wordIn(16, "pays", 4.0)} n={30} area={[8, 6, 4]} center={[0, 0, 7.5]} fall={1.4} />
    </Town>
  );
};
export const T17Empty: React.FC<SceneProps> = ({ t, cam }) => (
  <Room w={22} d={16} h={8.5} wall="#d8c6a0" t={t} warm={0.8}>
    <ShelfUnit p={[-6.5, 0, -7.2]} kind="empty" seed={2} /><ShelfUnit p={[-1.5, 0, -7.2]} kind="empty" seed={3} /><ShelfUnit p={[4, 0, -7.2]} kind="cans" seed={8} fill={0.08} /><ShelfUnit p={[-10.4, 0, -3]} kind="empty" seed={4} rot={Math.PI / 2} />
    <Counter p={[7.4, 0, -3.4]} w={6} />
    <Board p={[0.5, 3.8, -7.4]} w={3.2} h={0.9} tex={signTex("SOLD OUT", "#d8283a", "#fff6e0", 768, 220)} legs={false} />
    <P look="clerk" p={[7.8, 0.1, -4.8]} cam={cam} t={t} s={1.5} expr="worried" pose="cross" seed={3} />
    {[0, 1, 2].map((i) => <P key={i} look={LOOKS[i * 3]} p={[-4 + i * 3.4, 0.1, 0.2 + (i % 2) * 1.0]} cam={cam} t={t} s={1.45} expr="shock" pose="hold" seed={i + 20} />)}
  </Room>
);
export const T18Pipe: React.FC<SceneProps> = ({ t, cam }) => {
  const burst = wordIn(18, "bursts", 0.5); const k = clamp((t - burst) / 0.5); const jets = Array.from({ length: 40 }, (_, i) => { const a = (i * 2.4) % 6.28, ph = (t * 1.6 + i * 0.13) % 1; return { x: Math.cos(a) * 1.1 * ph, y: 1.0 + 6.0 * Math.sin(ph * Math.PI) * (0.6 + (i % 5) * 0.12), z: Math.sin(a) * 1.1 * ph, s: 0.22 + (i % 3) * 0.06 }; });
  const wm = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a8dcf2", transparent: true, opacity: 0.8 }), []); const pool = useMemo(() => new THREE.MeshBasicMaterial({ color: "#8ec8e4", transparent: true, opacity: 0.6, depthWrite: false }), []);
  return (
    <Town t={t}>
      <group position={[2, 0, 2.2]}>
        <Ink geometry={new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12)} material={toon("#5a5a64")} position={[0, 0.2, 0]} px={1.6} cast={false} />
        {k > 0 ? jets.map((q, i) => <mesh key={i} material={wm} position={[q.x, q.y * k, q.z]}><sphereGeometry args={[q.s, 8, 6]} /></mesh>) : null}
        <mesh material={pool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[k * Math.min(2.4, 0.8 + t * 0.35), k * Math.min(2.4, 0.8 + t * 0.35), 1]}><circleGeometry args={[1.5, 36]} /></mesh>
      </group>
      <Board p={[6.5, 0, 0.3]} w={2.8} h={1.0} tex={signTex("PLUMBER $100,000", "#fff4d8", "#c8283a", 768, 220)} />
      {[0, 1, 2, 3, 4].map((i) => <P key={i} look={LOOKS[(i * 4 + 1) % LOOKS.length]} p={[-6 + i * 2.6, 0.2, 5.6 + (i % 2) * 0.8]} cam={cam} t={t} s={1.45} expr="shock" pose={t > burst ? "cheer" : "idle"} seed={i + 15} emph={1} />)}
    </Town>
  );
};
export const T19Runout: React.FC<SceneProps> = ({ t, cam }) => {
  const names = ["BREAD", "EGGS", "MILK"]; const cols = ["#d8a050", "#f6efe2", "#e8f0f6"];
  return (
    <Room w={22} d={16} h={8.5} wall="#d8c6a0" t={t} warm={0.8}>
      {names.map((n, i) => <group key={i}><ShelfUnit p={[-7 + i * 7, 0, -7.2]} w={5.4} kind="empty" seed={i + 11} /><Board p={[-7 + i * 7, 3.3, -7.45]} w={2.4} h={0.7} tex={signTex(n, "#fff4d8", "#7a1f22", 512, 180)} legs={false} /><mesh position={[-7 + i * 7 + 1.4, 1.1, -7.0]}><boxGeometry args={[0.55, 0.3, 0.4]} /><meshBasicMaterial color={cols[i]} /></mesh></group>)}
      {[0, 1, 2, 3, 4, 5].map((i) => <P key={i} look={LOOKS[(i * 5 + 2) % LOOKS.length]} p={[-6 + i * 2.4, 0.1, -1.0 + (i % 3) * 0.9]} cam={cam} t={t} s={1.5} expr={i % 2 ? "worried" : "shock"} pose="cross" seed={i + 33} />)}
    </Room>
  );
};
export const T20Heli: React.FC<SceneProps> = ({ t, cam }) => {
  const land = smooth((t - 0.3) / 4.5); const hy = 22 - 20.0 * land;
  const box1 = useMemo(() => toon("#c8a070"), []);
  return (
    <Town t={t}>
      <Helicopter p={[-1 + Math.sin(t * 0.5) * 0.6, hy, 2.2]} t={t} rot={Math.PI * 0.12} s={1.6} tilt={0.03 * Math.sin(t)} />
      {land > 0.95 ? <>{[0, 1, 2, 3].map((i) => <Ink key={i} geometry={box(1.2, 1.0, 1.2)} material={box1} position={[-7 + i * 1.3, 0.5, 5.4]} px={1.6} cast={false} />)}<Board p={[-3.8, 0, 7.0]} w={3.0} h={1.0} tex={signTex("SANDWICH $500", "#fff4d8", "#c8283a", 768, 240)} /></> : null}
      {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 6.28; const k = clamp((t - 1.5) / 4.0); const r = 9 + (i % 4) * 1.0 - 5 * smooth(k); return <P key={i} look={LOOKS[(i * 5) % LOOKS.length]} p={[-1 + Math.cos(a) * r * 1.4, 0.2, 2.2 + Math.sin(a) * r * 0.55 + 6]} cam={cam} t={t} s={1.35} expr="grin" pose="cheer" seed={i + 40} emph={0.4} yaw={Math.cos(a) > 0 ? -0.9 : 0.9} />; })}
      <SunDust t={t} n={50} area={[30, 14, 20]} />
    </Town>
  );
};
export const T21Mayor: React.FC<SceneProps> = ({ t, cam }) => {
  const cry = wordIn(21, "cries", 4.0); const sand = useMemo(() => toon("#d8a050"), []); const bread = useMemo(() => toon("#f0d8a0"), []);
  const cm = useMemo(() => toon("#2a2a34"), []);
  return (
    <Town t={t}>
      <P look="official" p={[0, 0.2, 3.4]} cam={cam} t={t} s={1.9} expr={t > cry ? "worried" : "grin"} pose="hold" seed={1} handR={<group><Ink geometry={box(0.5, 0.15, 0.3)} material={sand} px={1.2} cast={false} /><Ink geometry={box(0.46, 0.06, 0.28)} material={bread} position={[0, 0.1, 0]} px={1} cast={false} /></group>} />
      {[-7, -4.4, 4.4, 7].map((x, i) => <group key={i}><P look="pullman" p={[x, 0.2, 5.6]} cam={cam} t={t} s={1.45} expr="think" pose="hold" seed={i + 7} /><group position={[x + (x > 0 ? -0.9 : 0.9), 2.2, 5.4]}><Ink geometry={box(0.7, 0.55, 0.6)} material={cm} px={1.4} cast={false} /><Ink geometry={new THREE.CylinderGeometry(0.2, 0.26, 0.5, 12)} material={toon("#9aa6b4")} position={[x > 0 ? -0.55 : 0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} px={1.2} cast={false} /><mesh position={[x > 0 ? -0.82 : 0.82, 0, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.17, 12]} /><meshBasicMaterial color="#5ab8e8" /></mesh></group></group>)}
      {t > cry ? Array.from({ length: 8 }, (_, i) => { const ph = ((t - cry) * 1.4 + i * 0.2) % 1; return <mesh key={i} position={[(i % 2 ? 0.5 : -0.5) * (0.4 + ph), 3.6 - ph * 1.5, 3.9]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#7ac8f2" /></mesh>; }) : null}
      <Crowd t={t} cam={cam} n={18} c={[0, 0.2, -1.2]} w={22} d={2.4} seed={9} expr="shock" />
    </Town>
  );
};
export const T22Cash: React.FC<SceneProps> = ({ t, cam }) => {
  const stack = useMemo(() => toon("#7fbf6a"), []); const band = useMemo(() => toon("#e8d8a0"), []); const wd = useMemo(() => toon("#8a5a34"), []);
  return (
    <Room w={20} d={14} h={8.2} wall="#e8d4b0" t={t} warm={0.9}>
      <Ink geometry={box(5.4, 0.3, 3.2)} material={wd} position={[0, 2.6, -1]} px={2} cast={false} />{[[-2.4, -2.4], [2.4, -2.4], [-2.4, 0.4], [2.4, 0.4]].map(([x, z], i) => <Ink key={i} geometry={box(0.3, 2.6, 0.3)} material={wd} position={[x, 1.3, z]} px={1.6} cast={false} />)}
      {Array.from({ length: 30 }, (_, i) => { const col = i % 6, row = Math.floor(i / 6); const lvl = Math.floor(i / 12); return <group key={i} position={[-2.3 + col * 0.92, 2.9 + (i % 4 === 0 ? 0.0 : 0) + Math.floor(i / 18) * 0.36, -2.2 + row * 0.72 - (i > 17 ? 3.6 : 0)]}><Ink geometry={box(0.8, 0.34, 0.5)} material={stack} px={1.2} cast={false} /><Ink geometry={box(0.2, 0.36, 0.52)} material={band} px={1} cast={false} /></group>; })}
      <Loaf p={[0, 3.45, 0.4]} s={1.5} rot={0.4} />
      <Board p={[-6.5, 3, -6.8]} w={2.8} h={0.8} tex={signTex("$$$  =  NO BREAD", "#fff4d8", "#7a1f22", 768, 200)} legs={false} />
      <Bills t={t} born={0} n={40} area={[12, 8, 8]} center={[0, 0, -1]} fall={0.6} />
    </Room>
  );
};
export const T23Inflate: React.FC<SceneProps> = ({ t, cam }) => {
  const k = smooth(t / 5.5); const r = 1.1 + 2.1 * k + Math.sin(t * 6) * 0.04 * k; const bm = useMemo(() => new THREE.MeshToonMaterial({ color: "#7fbf6a", gradientMap: undefined }), []);
  const tex = useMemo(() => new THREE.MeshBasicMaterial({ map: cv(256, 256, (g) => { g.fillStyle = "#2f6a3a"; g.font = "400 210px 'Lilita One', Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", 128, 134); }), transparent: true, depthWrite: false }), []);
  const g = useMemo(() => new THREE.SphereGeometry(1, 28, 20), []); const loaf = useMemo(() => new THREE.MeshBasicMaterial({ color: "#d8a050" }), []);
  return (
    <Town t={t}>
      <group position={[0, 0, 4.2]}>
        <Ink geometry={g} material={bm} position={[0, 2.4 + r * 0.9, 0]} scale={r} px={2.4} cast={false} />
        <mesh material={tex} position={[0, 2.4 + r * 0.9, r * 1.02]} scale={[r * 1.2, r * 1.2, 1]}><planeGeometry args={[1.4, 1.4]} /></mesh>
        <Ink geometry={new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6)} material={toon("#f6efe2")} position={[0, 1.2, 0]} px={1} cast={false} />
      </group>
      <Loaf p={[4.2, 0.4, 7.0]} s={0.9} rot={0.4} />
      {[0, 1, 2, 3, 4, 5].map((i) => <P key={i} look={LOOKS[(i * 5 + 2) % LOOKS.length]} p={[-9 + i * 3.6, 0.2, 7.4 + (i % 2) * 0.8]} cam={cam} t={t} s={1.45} expr={k > 0.7 ? "shock" : "think"} pose={k > 0.7 ? "cheer" : "point"} seed={i + 50} emph={k} />)}
    </Town>
  );
};
export const T24Back: React.FC<SceneProps> = ({ t, cam }) => {
  const go = [0, 1, 2, 3, 4, 5].map((i) => clamp((t - 0.6 - i * 0.55) / 2.4));
  const specs: [string, number, number][] = [["cap", -17, 5.0], ["guest", -10, 4.6], ["craftsman", 3, 4.2], ["engineer", 22, 4.8], ["scientist", 13, 4.4], ["woman", -26, 4.6]];
  return (
    <Town t={t + 4} gold>
      {specs.map(([lk, tx, sz], i) => { const k = smooth(go[i]); const sx = tx + (i % 2 ? 12 : -12); return <P key={i} look={lk as any} p={[sx + (tx - sx) * k, 0.2, sz + (1 - k) * 2.4]} cam={cam} t={t} s={1.5} pose={k < 0.98 ? "walk" : "cheer"} yaw={k < 0.98 ? (tx - sx > 0 ? 0.9 : -0.9) : undefined} expr={k < 0.98 ? "deadpan" : "grin"} seed={i + 100} />; })}
      <Sun p={[60, 14, -120]} s={90} /><SunDust t={t} n={30} area={[40, 10, 16]} />
    </Town>
  );
};
export const T25Sign: React.FC<SceneProps> = ({ t, cam }) => {
  const on = clamp((t - 0.3) / 1.0);
  return (
    <Room w={20} d={14} h={8.2} wall="#e8c8a0" t={t} warm={0.45 + 0.55 * on}>
      <Oven p={[-4, 0, -6.2]} t={t} on={on} /><Oven p={[0.2, 0, -6.2]} t={t} on={on} />
      <Counter p={[6, 0, -2.2]} w={7} />{[0, 1, 2, 3, 4, 5, 6].map((i) => <Loaf key={i} p={[3.6 + i * 0.85, 2.2, -2.2]} rot={0.2} />)}
      <P look="baker" p={[-1.2, 0.2, -2.2]} cam={cam} t={t} s={1.7} expr="grin" pose="idle" seed={2} />
      <Board p={[-1.6, 0.2, 1.4]} w={4.6} h={1.5} tex={useMemo(() => signTex("HELP WANTED  $1,000,000 / DAY", "#fff4d8", "#7a1f22", 1024, 320), [])} />
    </Room>
  );
};
export const T26Line: React.FC<SceneProps> = ({ t, cam }) => {
  const sign = useMemo(() => signTex("BAKERY", "#fbe8d0", "#b8505a"), []);
  return (
    <Town t={t + 4} gold>
      <Crowd t={t} cam={cam} n={40} c={[-14, 0.2, 5.0]} w={30} d={3.4} seed={2} pose="idle" expr="think" skip={(x) => x > -4} />
      <Crowd t={t} cam={cam} n={16} c={[-16, 0.2, 9.2]} w={14} d={2.2} seed={5} pose="hold" expr="worried" />
      <Sun p={[60, 14, -120]} s={90} />
    </Town>
  );
};
