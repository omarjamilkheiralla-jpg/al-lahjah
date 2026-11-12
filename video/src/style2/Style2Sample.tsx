import * as THREE from "three";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFonts } from "../full/fonts";
import { cv } from "../emu/world";

/** STYLE 2 sample: "What if every step you took was twice as long as the last?"  (step n = 0.75 m x 2^(n-1)) */
type V3 = [number, number, number];
export const FPS = 30;
const TITLE_D = 2.6, STEP_D = 2.7, END_D = 2.4;
type Step = { n: number; val: string; name: string; sub: string; cap: string; space?: boolean };
const STEPS: Step[] = [
  { n: 1, val: "0.75 m", name: "A NORMAL STEP", sub: "ABOUT 2½ FEET", cap: "You take a normal step." },
  { n: 5, val: "12 m", name: "A SCHOOL BUS", sub: "16× A NORMAL STEP", cap: "One stride clears a school bus." },
  { n: 8, val: "96 m", name: "ABOUT A FOOTBALL FIELD", sub: "128× A NORMAL STEP", cap: "One stride crosses the whole stadium." },
  { n: 10, val: "384 m", name: "THE EMPIRE STATE BUILDING", sub: "512× A NORMAL STEP", cap: "You step over the tallest tower in town." },
  { n: 20, val: "393 km", name: "ALMOST THE SPACE STATION'S HEIGHT", sub: "524,288× A NORMAL STEP · NOT TO SCALE", cap: "One step now reaches orbit height.", space: true },
  { n: 25, val: "12,583 km", name: "ALMOST THE WIDTH OF EARTH", sub: "16.8 MILLION× A NORMAL STEP · NOT TO SCALE", cap: "One step is as wide as the planet.", space: true },
  { n: 30, val: "402,653 km", name: "FARTHER THAN THE MOON", sub: "537 MILLION× A NORMAL STEP · NOT TO SCALE", cap: "You step right past the Moon.", space: true },
];
export const STYLE2_TOTAL = TITLE_D + STEPS.length * STEP_D + END_D;

/* ------------------------------------------------------------------ small helpers */
const mcache = new Map<string, THREE.Material>();
const L = (c: string) => { let m = mcache.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: c, flatShading: true }); mcache.set(c, m); } return m; };
const Bx: React.FC<{ s: V3; p: V3; c: string; r?: V3 }> = ({ s, p, c, r }) => <mesh material={L(c)} position={p} rotation={r}><boxGeometry args={s} /></mesh>;
const tcache = new Map<string, THREE.Texture>();
const tex = (k: string, f: () => THREE.Texture) => { let t = tcache.get(k); if (!t) { t = f(); tcache.set(k, t); } return t; };
const ease = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const seeded = (seed: number) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

const winTex = (c: string) => tex("win" + c, () => cv(128, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = "#4a5668"; g.fillRect(x * 32 + 6, y * 32 + 6, 20, 22); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x * 32 + 6, y * 32 + 6, 20, 8); } }, true));
const tileTex = () => tex("tile", () => cv(256, 256, (g, w, h) => { g.fillStyle = "#d4d6da"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(60,66,80,.35)"; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); const r = seeded(4); for (let i = 0; i < 600; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,.12)" : "rgba(60,66,80,.07)"; g.fillRect(r() * w, r() * h, 3, 3); } }, true));
const earthTex = () => tex("earth", () => cv(1024, 512, (g, w, h) => {
  const r = seeded(9); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3a7fc0"); gr.addColorStop(0.5, "#1f66ad"); gr.addColorStop(1, "#3a7fc0"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const land = (cx: number, cy: number, rx: number, ry: number, n: number, col: string) => { g.fillStyle = col; for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * rx * 1.6, y = cy + (r() - 0.5) * ry * 1.6, rr = 14 + r() * 38; for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, rr, rr * 0.8, r() * 3, 0, 7); g.fill(); } } };
  g.filter = "blur(2px)";
  land(250, 170, 90, 90, 22, "#5a9a4a"); land(280, 330, 50, 110, 18, "#4f8a3f"); land(540, 170, 70, 55, 18, "#6aa04c"); land(560, 330, 60, 100, 20, "#b8a458"); land(760, 190, 130, 70, 28, "#5f9548"); land(850, 350, 50, 40, 10, "#c0a85a"); land(640, 240, 60, 40, 10, "#c9b668");
  g.fillStyle = "#f2f6fa"; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 36, w, 36); g.filter = "blur(10px)"; g.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 40; i++) { const x = r() * w, y = 40 + r() * (h - 80); for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, 50 + r() * 60, 12 + r() * 14, 0, 0, 7); g.fill(); } } g.filter = "none";
}, true));
const moonTex = () => tex("moon", () => cv(512, 256, (g, w, h) => { g.fillStyle = "#cfcbc0"; g.fillRect(0, 0, w, h); const r = seeded(5); g.filter = "blur(2px)"; for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.4 ? "rgba(110,110,120,.35)" : "rgba(255,255,255,.18)"; const x = r() * w, y = 20 + r() * (h - 40), rr = 6 + r() * 22; for (const ox of [-w, 0, w]) { g.beginPath(); g.arc(x + ox, y, rr, 0, 7); g.fill(); } } g.filter = "none"; }, true));
const glowTex = () => tex("glow", () => cv(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,.3)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }));

/* ------------------------------------------------------------------ people (blocky, hero in colour, everyone else grey) */
const Person: React.FC<{ p: V3; t: number; hero?: boolean; s?: number; yaw?: number; walk?: number; ph?: number }> = ({ p, t, hero = false, s = 0.75, yaw = 0, walk = 1, ph = 0 }) => {
  const sw = Math.sin(t * 6 * walk + ph) * 0.55 * (walk ? 1 : 0);
  const skin = hero ? "#d9a878" : "#b9bec6", shirt = hero ? "#f2c81e" : "#b9bec6", pants = hero ? "#2fbf4a" : "#aab0ba", shoe = hero ? "#ffffff" : "#9aa0aa", cap = hero ? "#2f5fd0" : "#9aa0aa";
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.2, 1.05, 0]} rotation={[sw * k, 0, 0]}>
          <Bx s={[0.3, 0.5, 0.32]} p={[0, -0.2, 0]} c={pants} /><Bx s={[0.24, 0.5, 0.26]} p={[0, -0.68, 0]} c={skin} /><Bx s={[0.28, 0.14, 0.42]} p={[0, -0.98, 0.06]} c={shoe} />
        </group>
      ))}
      <Bx s={[0.82, 0.9, 0.42]} p={[0, 1.55, 0]} c={shirt} />
      {[-1, 1].map((k) => <group key={k} position={[k * 0.54, 1.9, 0]} rotation={[-sw * k * 0.9, 0, 0]}><Bx s={[0.2, 0.8, 0.22]} p={[0, -0.4, 0]} c={skin} /></group>)}
      <Bx s={[0.5, 0.5, 0.5]} p={[0, 2.25, 0]} c={skin} /><Bx s={[0.54, 0.16, 0.54]} p={[0, 2.55, 0]} c={cap} /><Bx s={[0.5, 0.06, 0.3]} p={[0, 2.47, 0.36]} c={cap} />
      {hero ? <><Bx s={[0.07, 0.07, 0.04]} p={[-0.12, 2.28, 0.26]} c="#2a1a1e" /><Bx s={[0.07, 0.07, 0.04]} p={[0.12, 2.28, 0.26]} c="#2a1a1e" /><Bx s={[0.14, 0.12, 0.04]} p={[0, 2.1, 0.26]} c="#6a3a24" /></> : null}
    </group>
  );
};

const Marker: React.FC<{ p: V3; r?: number }> = ({ p, r = 0.5 }) => <mesh material={useMemo(() => new THREE.MeshBasicMaterial({ color: "#e8264a" }), [])} position={[p[0], p[1] + 0.03, p[2]]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r, 20]} /></mesh>;
const RedLine: React.FC<{ a: V3; b: V3; w?: number }> = ({ a, b, w = 0.3 }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: "#e8264a" }), []);
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b); const mid = va.clone().add(vb).multiplyScalar(0.5); const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), vb.clone().sub(va).normalize());
  return <group><mesh material={m} position={mid} quaternion={q}><boxGeometry args={[len, w, w]} /></mesh>{[va, vb].map((v, i) => <mesh key={i} material={m} position={v}><sphereGeometry args={[w * 1.8, 12, 10]} /></mesh>)}</group>;
};

/* ------------------------------------------------------------------ scenes */
const Sky: React.FC<{ c?: string }> = ({ c = "#c9ced6" }) => { const sc = useThree((s) => s.scene); useLayoutEffect(() => { sc.background = new THREE.Color(c); sc.fog = new THREE.Fog(c, 120, 900); }); return null; };
const Lights: React.FC = () => <><hemisphereLight args={["#ffffff", "#8a8f9a", 1.35]} /><directionalLight position={[-30, 60, 40]} intensity={2.2} /></>;
const Block: React.FC<{ p: V3; s: V3; c: string }> = ({ p, s, c }) => { const m = useMemo(() => new THREE.MeshLambertMaterial({ map: (() => { const t = winTex(c).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(s[0] / 8)), Math.max(1, Math.round(s[1] / 12))); t.needsUpdate = true; return t; })(), flatShading: true }), [c, s]); return <mesh material={[L(c), L(c), L("#8a8f99"), L(c), m, m]} position={[p[0], p[1] + s[1] / 2, p[2]]}><boxGeometry args={s} /></mesh>; };
const Ground: React.FC<{ w?: number; d?: number; c?: string; z?: number }> = ({ w = 800, d = 800, c = "#c8cbd0", z = 0 }) => <mesh material={L(c)} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, z]}><planeGeometry args={[w, d]} /></mesh>;
const Tile: React.FC<{ w: number; d: number; p: V3 }> = ({ w, d, p }) => { const m = useMemo(() => { const t = tileTex().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 3, d / 3); t.needsUpdate = true; return new THREE.MeshLambertMaterial({ map: t }); }, [w, d]); return <mesh material={m} rotation={[-Math.PI / 2, 0, 0]} position={p}><planeGeometry args={[w, d]} /></mesh>; };
const Tree: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => <group position={p} scale={s}><Bx s={[0.5, 3, 0.5]} p={[0, 1.5, 0]} c="#6a5a48" /><Bx s={[3.2, 3.2, 3.2]} p={[0, 4.6, 0]} c="#3f7a3a" /></group>;
const Car: React.FC<{ p: V3; c: string; rot?: number }> = ({ p, c, rot = 0 }) => <group position={p} rotation={[0, rot, 0]}><Bx s={[4.2, 1.0, 1.9]} p={[0, 0.8, 0]} c={c} /><Bx s={[2.2, 0.8, 1.7]} p={[-0.2, 1.7, 0]} c={c} /><Bx s={[2.0, 0.6, 1.72]} p={[-0.2, 1.72, 0]} c="#4a5668" />{[[1.3, 0.95], [-1.3, 0.95], [1.3, -0.95], [-1.3, -0.95]].map(([x, z], i) => <Bx key={i} s={[0.8, 0.8, 0.3]} p={[x, 0.4, z]} c="#2a2a30" />)}</group>;
const City: React.FC<{ seed?: number; side?: number }> = ({ seed = 1, side = 1 }) => {
  const r = useMemo(() => seeded(seed), [seed]); const items = useMemo(() => { const a: { p: V3; s: V3; c: string }[] = []; let z = -200; while (z < 120) { const w = 12 + r() * 10, h = 20 + r() * 40; a.push({ p: [side * (14 + w / 2), 0, z + w / 2], s: [w, h, w], c: ["#e8dcc4", "#d8d4cc", "#c86a4a", "#bfc6d0", "#e0c8a0"][Math.floor(r() * 5)] }); z += w + 1; } return a; }, [r, side]);
  return <>{items.map((q, i) => <Block key={i} {...q} />)}</>;
};

const SceneStreet: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Sky /><Lights /><Ground c="#9fa3ab" /><Tile w={24} d={500} p={[-0.5, 0, -100]} />
    <City seed={3} side={-1} /><City seed={8} side={1} />
    <Bx s={[10, 0.1, 500]} p={[14, 0, -100]} c="#4a4e58" />
    {[-40, -90, -140].map((z, i) => <Tree key={i} p={[5, 0, z + 30]} />)}
    <Car p={[12, 0, -60]} c="#d8483a" rot={Math.PI / 2} /><Car p={[15, 0, -110]} c="#f0c030" rot={-Math.PI / 2} />
    <Person p={[0, 0, -4 + ((t * 1.1) % 2.2)]} t={t} hero yaw={0} s={0.8} />
    {[[-3, -10, 0.3], [3, -12, 1.4], [-2, -22, 2.2], [4, -30, 0.8], [-4, -16, 3.5]].map(([x, z, ph], i) => <Person key={i} p={[x, 0, z + ((t * 0.9 + i) % 3)]} t={t} s={0.8} ph={ph} />)}
  </>
);
const SceneBus: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Sky /><Lights /><Ground c="#a9adb4" /><Bx s={[200, 0.1, 18]} p={[0, 0, 0]} c="#4a4e58" />
    <City seed={5} side={-1} /><City seed={12} side={1} />
    <group position={[0, 0, 0]}>
      <Bx s={[12, 3.1, 2.6]} p={[0, 2.2, 0]} c="#f2b710" /><Bx s={[11.2, 1.0, 2.62]} p={[0, 2.9, 0]} c="#3a4658" /><Bx s={[12.02, 0.3, 2.62]} p={[0, 1.7, 0]} c="#2a2a30" />
      {[-4, 4].map((x, i) => <Bx key={i} s={[1.4, 1.4, 2.7]} p={[x, 0.7, 0]} c="#2a2a30" />)}
    </group>
    <Marker p={[-6, 0, 3.6]} r={0.6} /><Marker p={[6, 0, 3.6]} r={0.6} /><RedLine a={[-6, 0.5, 3.6]} b={[6, 0.5, 3.6]} w={0.25} />
    <Person p={[-6, 0, 3.6]} t={t} hero s={0.8} walk={0} yaw={0.4} />
  </>
);
const SceneField: React.FC<{ t: number }> = () => (
  <>
    <Sky c="#bfd0dd" /><Lights /><Ground c="#9aa0a8" />
    <Bx s={[60, 0.3, 112]} p={[0, 0.05, 0]} c="#3f9a46" />
    {[-1, 1].map((k) => <Bx key={k} s={[0.6, 0.06, 100]} p={[k * 26, 0.22, 0]} c="#ffffff" />)}{[-50, 0, 50].map((z, i) => <Bx key={i} s={[52, 0.06, 0.6]} p={[0, 0.22, z]} c="#ffffff" />)}
    {[-1, 1].map((k) => <group key={k}><Bx s={[10, 14, 124]} p={[k * 42, 7, 0]} c="#8a909c" /><Bx s={[8, 1, 120]} p={[k * 40, 14.5, 0]} c="#c8403a" /></group>)}
    <Marker p={[-4, 0.2, 48]} r={1.4} /><Marker p={[-4, 0.2, -48]} r={1.4} /><RedLine a={[-4, 0.8, 48]} b={[-4, 0.8, -48]} w={0.9} />
    <Person p={[-4, 0.2, 48]} t={0} hero s={0.8} walk={0} yaw={Math.PI} />
  </>
);
const SceneTower: React.FC<{ t: number }> = () => (
  <>
    <Sky c="#bcc6d4" /><Lights /><Ground c="#a0a4ac" />
    {Array.from({ length: 70 }, (_, i) => { const r = seeded(i * 7 + 3); const gx = (i % 10) - 5, gz = Math.floor(i / 10) - 3; return <Block key={i} p={[gx * 52 + 50, 0, gz * 52 - 60]} s={[34, gz >= 0 ? 12 + r() * 14 : 30 + r() * 90, 34]} c={["#e8dcc4", "#d8d4cc", "#c86a4a", "#bfc6d0", "#e0c8a0"][Math.floor(r() * 5)]} />; })}
    <group position={[0, 0, 0]}>
      {[[44, 120], [36, 200], [28, 270], [20, 330], [12, 381]].map(([w, h], i) => <Bx key={i} s={[w, h, w]} p={[0, h / 2, 0]} c={i % 2 ? "#cfc9bc" : "#d8d2c4"} />)}
      <Bx s={[4, 62, 4]} p={[0, 381 + 31, 0]} c="#b8bcc4" />
    </group>
    <Marker p={[70, 0, 6]} r={3} /><RedLine a={[70, 0, 6]} b={[70, 384, 6]} w={2.6} />
    <Person p={[70, 0, 12]} t={0} hero s={1.6} walk={0} yaw={-0.4} />
  </>
);
const Stars: React.FC<{ n?: number; r?: number }> = ({ n = 900, r = 1500 }) => {
  const g = useMemo(() => { const rd = seeded(7); const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = rd() * 6.283, b = Math.acos(2 * rd() - 1); pos[i * 3] = Math.sin(b) * Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r; pos[i * 3 + 2] = Math.cos(b) * r; } const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); return geo; }, [n, r]);
  return <points geometry={g}><pointsMaterial color="#ffffff" size={3} sizeAttenuation={false} /></points>;
};
const Planet: React.FC<{ r: number; p: V3; map: THREE.Texture; spin?: number; tilt?: number; atmo?: boolean }> = ({ r, p, map, spin = 0, tilt = 0.4, atmo = true }) => {
  const m = useMemo(() => new THREE.MeshLambertMaterial({ map }), [map]); const a = useMemo(() => new THREE.MeshBasicMaterial({ color: "#8ac4ff", transparent: true, opacity: 0.22, side: THREE.BackSide, depthWrite: false }), []);
  return <group position={p} rotation={[0, 0, tilt]}><mesh material={m} rotation={[0, spin, 0]}><sphereGeometry args={[r, 64, 48]} /></mesh>{atmo ? <mesh material={a}><sphereGeometry args={[r * 1.04, 48, 36]} /></mesh> : null}</group>;
};
const SpaceBase: React.FC = () => { const sc = useThree((s) => s.scene); useLayoutEffect(() => { sc.background = new THREE.Color("#050816"); sc.fog = null; }); return <><Stars /><hemisphereLight args={["#bcd4ff", "#222a40", 0.55]} /><directionalLight position={[40, 20, 30]} intensity={2.6} /></>; };
const Iss: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => <group position={p} scale={s}><Bx s={[2, 0.5, 0.5]} p={[0, 0, 0]} c="#cfd2d8" />{[-1, 1].flatMap((k) => [-0.6, 0.6].map((z, i) => <Bx key={`${k}${i}`} s={[1.6, 0.04, 0.8]} p={[k * 1.8, 0, z]} c="#2f4f9a" />))}<Bx s={[0.4, 0.4, 1.6]} p={[0, 0, 0]} c="#e8e2d0" /></group>;
const SceneOrbit: React.FC = () => (
  <>
    <SpaceBase />
    <Planet r={6.371} p={[0, -6.371, 0]} map={earthTex()} spin={0.5} />
    <Marker p={[0, 0, 0]} r={0.02} /><RedLine a={[0, 0, 0]} b={[0, 0.393, 0]} w={0.012} />
    <Iss p={[0, 0.393, 0]} s={0.07} />
    <mesh position={[0, 0, 0]}><sphereGeometry args={[0.022, 10, 8]} /><meshBasicMaterial color="#ffe04a" /></mesh>
  </>
);
const SceneEarth: React.FC = () => (
  <>
    <SpaceBase />
    <Planet r={6.371} p={[0, 0, 0]} map={earthTex()} spin={0.9} />
    <RedLine a={[-6.29, 0.2, 6.6]} b={[6.29, 0.2, 6.6]} w={0.1} />
  </>
);
const SceneMoon: React.FC = () => (
  <>
    <SpaceBase />
    <Planet r={3.2} p={[0, -9, 0]} map={earthTex()} spin={0.9} />
    <Planet r={1.3} p={[0, 7, 0]} map={moonTex()} atmo={false} tilt={0} />
    <RedLine a={[0, -5.8, 4]} b={[0, 8.1, 4]} w={0.1} />
  </>
);
const SCENES = [SceneStreet, SceneBus, SceneField, SceneTower, SceneOrbit, SceneEarth, SceneMoon];

/** camera plan: two keys per step (start -> end of the step), plus the world point the "YOU" tag follows */
type Cam = { a: V3; b: V3; la: V3; lb: V3; fov: number; you: V3; roll?: number };
const CAMS: Cam[] = [
  { a: [0.6, 2.0, 5.5], b: [0.3, 1.8, 3.4], la: [0, 3.0, -2], lb: [0, 2.9, -2], fov: 58, you: [0, 2.3, -2.2] },
  { a: [-22, 17, 24], b: [-13, 13, 21], la: [0, 0.5, -1], lb: [0, 0.5, 0], fov: 55, you: [-6, 2.2, 3.6] },
  { a: [80, 100, 160], b: [56, 76, 138], la: [0, 0, 0], lb: [0, 0, 6], fov: 52, you: [-4, 2, 48] },
  { a: [-260, 40, 340], b: [-190, 110, 330], la: [20, 150, 0], lb: [20, 190, 0], fov: 55, you: [70, 3.5, 12] },
  { a: [0.9, 0.18, 1.5], b: [0.5, 0.3, 1.1], la: [0, 0.55, 0], lb: [0, 0.5, 0], fov: 55, you: [0, 0.03, 0] },
  { a: [0, 0, 24], b: [0, 0, 17.5], la: [0, 0, 0], lb: [0, 0, 0], fov: 55, you: [-6.29, 0.2, 6.6] },
  { a: [0, 6.5, 38], b: [0, 6.5, 52], la: [0, 6.5, 0], lb: [0, 6.5, 0], fov: 55, you: [0, -5.8, 4] },
];

const Rig: React.FC<{ p: V3; l: V3; fov: number }> = ({ p, l, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = fov; camera.near = 0.01; camera.far = 5000; camera.updateProjectionMatrix(); camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...l); camera.updateMatrixWorld(); });
  return null;
};

const Hud: React.FC<{ step: Step; k: number; you: { x: number; y: number } | null; dim: number }> = ({ step, k, you, dim }) => {
  const ent = ease(k / 0.12);
  const sans = "Arial, Helvetica, 'Liberation Sans', sans-serif";
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - dim }}>
      <div style={{ position: "absolute", left: 66, top: 250, color: "#fff", textShadow: "0 2px 14px rgba(10,14,30,.55)" }}>
        <div style={{ fontFamily: sans, fontSize: 30, letterSpacing: 6, fontWeight: 600 }}>STEP #{step.n}</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 170, fontWeight: 400, lineHeight: 1.05, fontFeatureSettings: '"lnum" 1', opacity: ent, transform: `translateY(${(1 - ent) * 24}px)` }}>{step.val}</div>
        <div style={{ fontFamily: sans, fontSize: 31, letterSpacing: 3.5, fontWeight: 600, marginTop: 6 }}>{step.name}</div>
        <div style={{ fontFamily: sans, fontSize: 27, letterSpacing: 3, fontWeight: 500, marginTop: 8, opacity: 0.95 }}>{step.sub}</div>
        <div style={{ display: "inline-block", marginTop: 22, background: "#d8274f", padding: "9px 20px", borderRadius: 6, fontFamily: sans, fontSize: 25, letterSpacing: 2.5, fontWeight: 700 }}>TWICE AS LONG EVERY STEP</div>
      </div>
      <div style={{ position: "absolute", left: 66, right: 80, top: 720, color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 56, lineHeight: 1.22, textShadow: "0 2px 14px rgba(10,14,30,.6)", opacity: ease((k - 0.05) / 0.15) }}>{step.cap}</div>
      {you ? (
        <div style={{ position: "absolute", left: you.x, top: you.y, color: "#fff", fontFamily: sans, fontSize: 24, letterSpacing: 3, fontWeight: 700, textShadow: "0 2px 10px rgba(10,14,30,.7)" }}>
          <div style={{ position: "absolute", left: -2, top: -2, width: 36, height: 2, background: "#fff", transformOrigin: "0 0", transform: "rotate(-35deg)" }} /><div style={{ position: "absolute", left: 30, top: -42 }}>YOU</div>
        </div>
      ) : null}
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
  const c = CAMS[idx]; const u = ease(local); const p = lerp3(c.a, c.b, u), l = lerp3(c.la, c.lb, u);
  const Scene = SCENES[idx];
  const camObj = new THREE.PerspectiveCamera(c.fov, width / height, 0.01, 5000); camObj.position.set(...p); camObj.lookAt(...l); camObj.updateMatrixWorld();
  const pr = new THREE.Vector3(...c.you).project(camObj); const you = pr.z < 1 && Math.abs(pr.x) < 1.1 ? { x: (pr.x * 0.5 + 0.5) * width, y: (-pr.y * 0.5 + 0.5) * height } : null;
  const sinceCut = inTitle ? 99 : (t - TITLE_D) - idx * STEP_D; const flash = Math.max(0, 1 - sinceCut / 0.18) * 0.5;
  const showHud = !inTitle && !ending;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} flat camera={{ fov: c.fov, near: 0.01, far: 5000, position: p }} gl={{ antialias: true }}>
        <Rig p={p} l={l} fov={c.fov} />
        <Scene key={idx} t={t} />
      </ThreeCanvas>
      {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} /> : null}
      {showHud ? <Hud step={STEPS[idx]} k={local} you={you} dim={0} /> : null}
      {inTitle ? <AbsoluteFill style={{ justifyContent: "flex-start", padding: "300px 80px 0", color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 76, lineHeight: 1.18, textShadow: "0 3px 18px rgba(10,14,30,.65)", opacity: ease(local / 0.12) * (1 - ease((local - 0.85) / 0.15)) }}>What if every step you took was twice as long as the last?</AbsoluteFill> : null}
      {ending ? <AbsoluteFill style={{ background: "rgba(5,8,22,.55)", justifyContent: "center", padding: "0 90px", color: "#fff", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 66, lineHeight: 1.25, textAlign: "center", opacity: ease((t - (TITLE_D + STEPS.length * STEP_D)) / 0.35) }}>Which step surprised you most?<br />Comment the number.</AbsoluteFill> : null}
      {audio ? <Audio src={staticFile("style2_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
