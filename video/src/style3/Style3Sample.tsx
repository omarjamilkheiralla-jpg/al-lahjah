import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { box, cyl, ico, cone, M, BM, ease, clamp, lerp, type V3 } from "./kit";
import { Mesh } from "./kit2";
import { Person, BEN2, GARY2, MIA2, GREY2, walkP, type Pose4 } from "./kit4";
import { City, Sky, Table, Chair, Explosion, Car } from "./world2";

/** STYLE 3 sample v3: "What if your luck doubled every minute?" 10 s: title beat + coffee on his shirt (luck 1) + a car crash misses him (luck 2) + coffee lands in his hand (luck 4). */
export const FPS = 30;
export const S3_TOTAL = 10;
const SEG = [{ t0: 0, t1: 2.3 }, { t0: 2.3, t1: 4.6 }, { t0: 4.6, t1: 7.0 }, { t0: 7.0, t1: 10 }];
type H = { from: number; luck: number; tier: string; minute: number; cap: string; pill: string; pillBg: string; pillFg: string };
const HUD: (H | null)[] = [
  null,
  { from: 0, luck: 1, tier: "ABOUT AVERAGE", minute: 1, cap: "Coffee on his shirt.", pill: "UNLUCKY", pillBg: "#f2f2f2", pillFg: "#17171b" },
  { from: 1, luck: 2, tier: "A LUCKY ESCAPE", minute: 2, cap: "A car crash misses him.", pill: "LUCKY", pillBg: "#f7b82e", pillFg: "#17171b" },
  { from: 2, luck: 4, tier: "PURE LUCK", minute: 3, cap: "Coffee lands perfectly in his hand.", pill: "VERY LUCKY", pillBg: "#46d48a", pillFg: "#0b2a1a" },
];
const TONE = [
  { top: "#6aa8d8", mid: "#bcdcea", hor: "#f6e2c0", sun: "#ffe0b0", hemi: "#ffeed8", key: 3.0, fog: "#e8dcc8" },
  { top: "#6aa8d8", mid: "#bcd8e6", hor: "#f6dcb8", sun: "#ffdca8", hemi: "#ffe8d0", key: 3.1, fog: "#e8d8c0" },
  { top: "#7aa4cc", mid: "#d6d4d4", hor: "#f2c898", sun: "#ffcf98", hemi: "#ffe0c0", key: 3.0, fog: "#ecd0b0" },
  { top: "#6a5a9a", mid: "#d49a8a", hor: "#f6a868", sun: "#ffb878", hemi: "#ffd8b0", key: 2.6, fog: "#e0a880" },
];
const sm = (s: number, a: number, b: number) => ease(clamp((s - a) / (b - a)));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const blinkAt = (t: number) => ((t % 3.4) < 0.11 ? 1 : 0);

/* ------------------------------------------------------------------ small props */
const Cup: React.FC<{ lid?: boolean }> = ({ lid = true }) => <group><Mesh g={cyl(0.04, 0.031, 0.11, 10)} m={M("#f4f1ea", { map: "fabric" })} rim={false} /><Mesh g={cyl(0.043, 0.043, 0.012, 10)} m={M("#d8d2c6")} p={[0, 0.056, 0]} rim={false} />{lid ? <Mesh g={cyl(0.045, 0.045, 0.012, 10)} m={M("#c9b79c")} p={[0, 0.068, 0]} rim={false} /> : null}<Mesh g={cyl(0.042, 0.038, 0.05, 10)} m={M("#b07a48", { map: "wood" })} p={[0, -0.005, 0]} rim={false} /></group>;
const Cone: React.FC<{ ball?: boolean }> = ({ ball = true }) => <group><Mesh g={cone(0.04, 0.14, 8)} m={M("#d8a050", { map: "wood" })} r={[Math.PI, 0, 0]} rim={false} />{ball ? <Mesh g={ico(0.055, 1)} m={M("#ff8fb8")} p={[0, 0.1, 0]} rim={false} /> : null}</group>;
const Droplets: React.FC<{ s: number; t0: number; from: V3; to: V3 }> = ({ s, t0, from, to }) => {
  if (s < t0 || s > t0 + 0.7) return null;
  return <>{Array.from({ length: 26 }, (_, i) => { const dl = (i % 9) * 0.018; const u = clamp((s - t0 - dl) / 0.34); if (u <= 0 || u >= 1) return null; const jx = Math.sin(i * 12.9) * 0.09, jy = Math.cos(i * 7.7) * 0.07, jz = Math.sin(i * 3.1) * 0.03; return <mesh key={i} geometry={box(0.018 + (i % 3) * 0.008, 0.018, 0.018)} material={M("#5a3418", { rough: 0.3 })} position={[mix(from[0], to[0] + jx, u), mix(from[1], to[1] + jy, u) + Math.sin(u * Math.PI) * 0.22, mix(from[2], to[2] + jz, u)]} />; })}</>;
};

/* ------------------------------------------------------------------ cameras */
type Key = { t: number; p: V3; l: V3; fov?: number; roll?: number };
const Cam = (keys: Key[], s: number, tt: number) => {
  let i = 0; while (i < keys.length - 2 && s > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(keys.length - 1, i + 1)]; const k = ease((s - a.t) / Math.max(1e-4, b.t - a.t));
  const m = (u: V3, v: V3): V3 => [lerp(u[0], v[0], k), lerp(u[1], v[1], k), lerp(u[2], v[2], k)];
  const p = m(a.p, b.p); const l = m(a.l, b.l);
  p[0] += Math.sin(tt * 1.7) * 0.012; p[1] += Math.sin(tt * 2.3 + 1) * 0.01; l[0] += Math.sin(tt * 1.3) * 0.01;
  return { p, l, fov: lerp(a.fov ?? 45, b.fov ?? 45, k), roll: lerp(a.roll ?? 0, b.roll ?? 0, k) + Math.sin(tt * 0.9) * 0.004 };
};
const CAMS: ((s: number, tt: number) => ReturnType<typeof Cam>)[] = [
  (s, tt) => Cam([{ t: 0, p: [-3.2, 1.0, 4.6], l: [0.0, 1.0, -0.6], fov: 40, roll: 0.03 }, { t: 2.3, p: [-1.2, 1.15, 4.0], l: [0.3, 1.1, -0.5], fov: 38, roll: -0.02 }], s, tt),
  (s, tt) => Cam([{ t: 0, p: [1.0, 0.6, 5.0], l: [0.0, 1.45, -0.9], fov: 42, roll: -0.03 }, { t: 1.2, p: [0.5, 0.9, 4.5], l: [0.0, 1.5, -0.4], fov: 38 }, { t: 2.3, p: [-0.5, 1.2, 4.1], l: [0.05, 1.5, -0.3], fov: 35, roll: 0.03 }], s, tt),
  (s, tt) => Cam([{ t: 0, p: [-3.4, 0.9, -4.4], l: [0.2, 1.2, 1.8], fov: 44, roll: 0.03 }, { t: 1.5, p: [-1.8, 0.8, -4.0], l: [0.4, 1.15, 2.0], fov: 40 }, { t: 2.4, p: [-0.4, 1.3, -3.6], l: [1.0, 1.25, 1.9], fov: 36, roll: -0.04 }], s, tt),
  (s, tt) => Cam([{ t: 0, p: [-0.6, 1.35, 4.4], l: [0.2, 1.8, 0.0], fov: 40, roll: 0.02 }, { t: 1.3, p: [0.9, 1.3, 2.8], l: [0.33, 1.4, 0.45], fov: 28 }, { t: 3.0, p: [0.5, 1.62, 3.0], l: [0.12, 1.78, 0.0], fov: 30, roll: -0.02 }], s, tt),
];

/* ------------------------------------------------------------------ scenes (s = seconds since the scene started) */
const SceneA: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const talk = (Math.sin(t * 13) > 0 ? 0.55 : 0.05) * (Math.sin(t * 2.2) > -0.2 ? 1 : 0); const bx = -2.6 + s * 1.9; const dist = bx;
  return (
    <>
      <Table p={[0, 0.1, -0.4]} /><Chair p={[-0.95, 0.1, -0.35]} yaw={-1.45} /><Chair p={[0.95, 0.1, -0.4]} yaw={1.5} />
      <Person look={GARY2} p={[-0.95, 0.1, -0.3]} yaw={0.95} pose={{ sit: true, expr: "smug", lean: -0.2, headY: -0.3, rArm: [-0.8, 0.3], rElbow: 1.1, lArm: [0.2, -0.15], lElbow: 0.3, blink: blinkAt(t), rGrip: 0.6 }} itemR={<Cone />} />
      <Person look={MIA2} p={[0.95, 0.1, -0.4]} yaw={-1.05} pose={{ sit: true, expr: "smile", lean: 0.1, headY: 0.35, mouthOpen: talk, rArm: [-1.0, 0.2], rElbow: 1.2, lArm: [-0.45, -0.1], lElbow: 0.7, blink: blinkAt(t + 1) }} />
      <Person look={BEN2} p={[bx, 0.1, -2.5]} yaw={Math.PI / 2 - 0.3} pose={{ ...walkP(dist, 0.38), expr: "calm", headY: 0.5, rArm: [-0.6, 0.12], rElbow: 1.3, rGrip: 1 }} itemR={<Cup />} />
      <Person look={GREY2(1)} p={[3.4, 0.1, -1.6]} yaw={-1.3} pose={walkP(3.4 - s * 1.2, 0.38)} />
    </>
  );
};
const SceneB: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const zW = mix(-2.0, -0.35, sm(s, 0, 0.8)); const walking = s < 0.8; const dist = (zW + 2.0) * 1.0;
  const tilt = sm(s, 0.78, 1.0); const look = sm(s, 0.9, 1.45); const stain = s > 1.02; const ph = (dist * Math.PI * 2) / 1.55;
  const pose: Pose4 = walking ? { ...walkP(dist, 0.4), rArm: [-0.6, 0.15], rElbow: 1.25, rGrip: 1, lArm: [Math.sin(ph) * 0.35, -0.1], expr: "calm", headX: 0.08 } : { headX: mix(0.08, 0.55, look), lean: 0.12 * look, rArm: [-0.55 - 0.1 * tilt, 0.15], rElbow: 1.2 - 0.2 * tilt, rGrip: 1, lArm: [-0.55 * look, -0.2], lElbow: 0.25 + 1.5 * look, expr: s < 1.0 ? "calm" : s < 1.5 ? "shock" : "annoyed", mouthOpen: s > 1.0 && s < 1.5 ? 0.5 : 0, blink: blinkAt(t) };
  const laugh = s > 1.1 ? (Math.sin(t * 15) > 0 ? 0.65 : 0.15) : 0;
  return (
    <>
      <Person look={BEN2} p={[0, 0.1, zW]} yaw={0.22} stain={stain} pose={pose} itemR={<Cup lid={false} />} itemRRot={[tilt * 1.3, 0, 0]} rim="#ffe2a8" />
      <Droplets s={s} t0={0.86} from={[0.28, 1.0, zW + 0.3]} to={[0.04, 1.28, zW + 0.2]} />
      <Table p={[-1.7, 0.1, -3.4]} /><Chair p={[-2.45, 0.1, -3.3]} yaw={-1.5} /><Chair p={[-0.95, 0.1, -3.4]} yaw={1.5} />
      <Person look={GARY2} p={[-2.45, 0.1, -3.2]} yaw={1.2} pose={{ sit: true, expr: s > 1.1 ? "smile" : "smug", mouthOpen: laugh, headX: s > 1.1 ? -0.1 : 0, lean: s > 1.1 ? -0.25 : -0.1, rArm: [-0.8, 0.3], rElbow: 1.0, rGrip: 0.6 }} itemR={<Cone />} />
      <Person look={MIA2} p={[-0.95, 0.1, -3.3]} yaw={-1.2} pose={{ sit: true, expr: s > 1.1 ? "smile" : "calm", mouthOpen: laugh, lean: 0.05, rArm: [-0.9, 0.2], rElbow: 1.2 }} />
    </>
  );
};
const SceneC: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const bx = -1.7 + 1.38 * s; const poleX = 0.25; const hit = 1.6;
  const carX = s < hit ? mix(-13.5, -0.35, clamp(s / hit) ** 0.9) : -0.35 + 0.5 * (1 - Math.exp(-(s - hit) * 7)); const carZ = 4.1 - 1.7 * sm(s, 0.75, hit); const carYaw = 0.5 * sm(s, 0.75, 1.3) - 0.2 * sm(s, 1.3, hit) + 0.12 * sm(s, hit, hit + 0.4);
  const fall = sm(s, hit, hit + 0.75) * 1.15; const shake = s > hit && s < hit + 0.4 ? Math.sin(t * 90) * 0.012 * (1 - (s - hit) / 0.4) : 0;
  return (
    <>
      <Person look={BEN2} p={[bx, 0.1, 0.95]} yaw={Math.PI / 2 - 0.1} pose={{ ...walkP(bx, 0.42), expr: s > 2.0 ? "smug" : "calm", headY: 0.2, rArm: [-Math.sin((bx * Math.PI * 2) / 1.55) * 0.4, 0.1], blink: blinkAt(t) }} rim="#ffe2a8" />
      <group position={[poleX, 0.1, 2.35]} rotation={[fall, 0, 0]}><Mesh g={cyl(0.06, 0.08, 4.2, 8)} m={M("#26303a", { map: "metal", metal: 0.4 })} p={[0, 2.1, 0]} rim={false} /><Mesh g={box(0.9, 0.06, 0.06)} m={M("#26303a")} p={[0.4, 4.15, 0]} rim={false} /></group>
      <group position={[carX + shake, 0.1, carZ]} rotation={[0, carYaw, 0]} scale={[s > hit ? 0.92 : 1, 1, 1]}><Car p={[0, 0, 0]} col="#d83a2a" /></group>
      <Explosion p={[0.1, 0.1, 2.4]} t={s - hit} k={0.55} fire={false} />
      {s > hit - 0.04 && s < hit + 0.12 ? <mesh position={[0.1, 1.0, 2.3]} geometry={ico(1, 1)} material={BM("#fff2c8")} scale={0.9 + (s - hit) * 5} /> : null}
    </>
  );
};
const SceneD: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const u = clamp((s - 0.35) / 1.1); const fallH = s < 1.45 ? 5.2 * (1 - u * u) : 0; const caught = s > 1.45; const closeK = sm(s, 1.45, 1.8); const reach = sm(s, 0.2, 0.7);
  const pose: Pose4 = { expr: s < 1.7 ? "calm" : "smug", headY: 0.15 * Math.sin(t * 0.7), headX: -0.03, rArm: [mix(0.05, -1.0, reach), mix(0.1, 0.22, reach)], rElbow: mix(0.2, 0.95, reach), rGrip: mix(0.2, 0.2, reach) + 0.7 * closeK, lArm: [0.05, -0.1], lElbow: 0.25, blink: blinkAt(t), mouthOpen: 0 };
  return (
    <>
      <Person look={BEN2} p={[0, 0.1, 0]} yaw={0.1} pose={pose} itemR={s > 0.34 ? <Cup /> : undefined} itemROffset={[0, fallH, 0]} rim="#ffd8a0" />
      <Table p={[-1.9, 0.1, -3.0]} /><Chair p={[-2.6, 0.1, -2.9]} yaw={-1.5} />
      <Person look={MIA2} p={[-2.6, 0.1, -2.85]} yaw={1.2} pose={{ sit: true, expr: s > 1.5 ? "shock" : "calm", mouthOpen: s > 1.5 ? 0.6 : 0, rArm: [-1.3, 0.4], rElbow: 1.3 }} />
      <Person look={GREY2(3)} p={[2.4, 0.1, -2.0]} yaw={-0.8} pose={walkP(2.4 - s * 1.4, 0.38)} />
      {caught ? null : null}
    </>
  );
};
const SCENES = [SceneA, SceneB, SceneC, SceneD];

/* ------------------------------------------------------------------ rig, lights, text */
const Rig: React.FC<{ p: V3; l: V3; fov: number; roll?: number }> = ({ p, l, fov, roll = 0 }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = fov; camera.near = 0.05; camera.far = 500; camera.updateProjectionMatrix(); camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...l); camera.rotateZ(roll); camera.updateMatrixWorld(); });
  return null;
};
const Lights: React.FC<{ i: number; focus: V3 }> = ({ i, focus }) => {
  const tn = TONE[i];
  return (
    <>
      <Sky top={tn.top} mid={tn.mid} hor={tn.hor} /><fog attach="fog" args={[tn.fog, 24, 120]} />
      <hemisphereLight args={[tn.hemi, "#e8c9a0", 1.4]} />
      <directionalLight color={tn.sun} intensity={tn.key} position={[focus[0] - 5, 8, focus[2] + 7]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={7} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={34} shadow-bias={-0.0004} shadow-normalBias={0.025} />
      <directionalLight color="#ffe6b8" intensity={i === 3 ? 1.6 : 1.3} position={[focus[0] + 4, 5, focus[2] - 8]} />
    </>
  );
};
const FONTS: [string, string, string, string][] = [
  ["Inter", "fonts/inter-latin-600-normal.woff2", "600", "normal"], ["Inter", "fonts/inter-latin-700-normal.woff2", "700", "normal"], ["Inter", "fonts/inter-latin-800-normal.woff2", "800", "normal"], ["Inter", "fonts/inter-latin-900-normal.woff2", "900", "normal"],
  ["Lora", "fonts/lora-latin-400-normal.woff2", "400", "normal"], ["Lora", "fonts/lora-latin-400-italic.woff2", "400", "italic"], ["Playfair Display", "fonts/PlayfairDisplay-Variable.ttf", "400 900", "normal"],
];
let fp: Promise<void> | null = null;
const loadFonts3 = () => (fp ??= Promise.all(FONTS.map(async ([fam, path, w, st]) => { const f = new FontFace(fam, `url(${staticFile(path)})`, { weight: w, style: st }); await f.load(); (document as any).fonts.add(f); })).then(() => undefined).catch(() => undefined));
const sans = "Inter, Arial, Helvetica, sans-serif"; const lora = "Lora, Georgia, serif"; const num = "'Playfair Display', Georgia, serif";
const Hud: React.FC<{ h: H; s: number }> = ({ h, s }) => {
  const prev = h.from === 0 ? 0 : h.from === 1 ? 1 : 2; const k = sm(s, 0.05, 0.75); const val = Math.round(mix(prev, h.luck, k)); const pop = 1 + 0.08 * Math.sin(Math.PI * clamp((s - 0.05) / 0.7));
  const capIn = sm(s, 0.2, 0.45); const tierIn = sm(s, 0.1, 0.35);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", color: "#fff" }}>
      <div style={{ position: "absolute", left: 58, top: 190, textShadow: "0 1px 10px rgba(0,0,0,.3)" }}>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 22, letterSpacing: "0.26em" }}>LUCK</div>
        <div style={{ fontFamily: num, fontWeight: 400, fontSize: 124, lineHeight: 1.0, marginTop: 6, transform: `scale(${pop})`, transformOrigin: "0 100%", fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>{val}</div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 25, letterSpacing: "0.17em", marginTop: 14, opacity: tierIn, transform: `translateY(${(1 - tierIn) * 8}px)` }}>{h.tier}</div>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 22, letterSpacing: "0.17em", marginTop: 6 }}>MINUTE {h.minute}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, opacity: tierIn }}>
          <div style={{ background: "#e0183f", borderRadius: 5, padding: "8px 15px", fontFamily: sans, fontWeight: 800, fontSize: 21, letterSpacing: "0.1em", textShadow: "none" }}>×2 EVERY MINUTE</div>
          <div style={{ background: h.pillBg, color: h.pillFg, borderRadius: 5, padding: "8px 15px", fontFamily: sans, fontWeight: 800, fontSize: 21, letterSpacing: "0.1em", textShadow: "none" }}>{h.pill}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 58, width: 880, top: 560, fontFamily: lora, fontStyle: "italic", fontSize: 54, lineHeight: 1.12, textShadow: "0 1px 12px rgba(0,0,0,.5)", opacity: capIn, transform: `translateY(${(1 - capIn) * 14}px)` }}>{h.cap}</div>
    </AbsoluteFill>
  );
};
const Title: React.FC<{ s: number }> = ({ s }) => { const k = ease(s / 0.25) * (1 - ease((s - 2.05) / 0.25)); return <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, pointerEvents: "none", opacity: k, transform: `translateY(${(1 - k) * 12}px)` }}><div style={{ fontFamily: lora, fontWeight: 400, fontSize: 80, lineHeight: 1.12, textAlign: "center", color: "#fff", textShadow: "0 2px 4px rgba(60,30,0,.55), 0 4px 22px rgba(0,0,0,.5)", width: 760 }}>What if your <span style={{ color: "#ffd24a" }}>luck</span> doubled every minute?</div></AbsoluteFill>; };

export const Style3Sample: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts3().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#e8dcc8" }} />;
  const idx = t >= SEG[3].t0 ? 3 : t >= SEG[2].t0 ? 2 : t >= SEG[1].t0 ? 1 : 0; const s = t - SEG[idx].t0;
  const cam = CAMS[idx](s, t); const Sc = SCENES[idx];
  const subject: V3 = idx === 2 ? [0.4, 1.1, 1.2] : idx === 3 ? [0.3, 1.35, 0.4] : idx === 1 ? [0, 1.3, -0.35] : [0, 1.2, -0.3];
  const focus = new THREE.Vector3(...cam.p).distanceTo(new THREE.Vector3(...subject));
  const flash = idx > 0 ? Math.max(0, 1 - s / 0.12) * 0.45 : 0; const punch = idx > 0 ? Math.max(0, 1 - s / 0.25) * 0.035 : 0;
  const hud = HUD[idx];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + punch})` }}>
        <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, near: 0.05, far: 500, position: cam.p }} gl={{ antialias: true }}>
          <Rig p={cam.p} l={cam.l} fov={cam.fov} roll={cam.roll} />
          <Lights i={idx} focus={idx === 2 ? [0.3, 0, 1.5] : [0, 0, -0.3]} />
          <City />
          <Sc key={idx} s={s} t={t} />
          <PostFX focus={focus} range={idx === 3 && s > 0.9 && s < 2.0 ? 1.6 : 2.8} bokeh={3.2} frame={frame} grain={0.18} />
        </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
      {idx === 0 ? <Title s={s} /> : null}
      {hud ? <Hud h={hud} s={s} /> : null}
      {audio ? <Audio src={staticFile("style3_luck_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
