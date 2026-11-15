import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { box, cyl, ico, cone, sph, M, BM, ease, clamp, lerp, seeded, type V3 } from "./kit";
import { Mesh } from "./kit2";
import { Person, BEN2, GARY2, MIA2, GREY2, walkP, type Pose3 as Pose2 } from "./kit3";
import { City, Sky, Table, Chair, Explosion, Car } from "./world2";

/** STYLE 3 sample v2: "What if your luck doubled every minute?" 10 s = title beat + 3 scenarios, replicating the reference reel's look. */
export const FPS = 30;
export const S3_TOTAL = 10;
type Seg = { t0: number; t1: number };
const SEG: Seg[] = [{ t0: 0, t1: 2.3 }, { t0: 2.3, t1: 4.6 }, { t0: 4.6, t1: 7.0 }, { t0: 7.0, t1: 10 }];
const HUD = [
  null,
  { luck: "1", tier: "", minute: 1, cap: "Finds a coin on the ground.", pill: "MAIN CHARACTER" },
  { luck: "4", tier: "A FALLING TRAY", minute: 3, cap: "Minute 3: 4 luck. He didn't even look.", pill: "MAIN CHARACTER" },
  { luck: "8", tier: "A MOVIE POSTER", minute: 4, cap: "", pill: "MAIN CHARACTER" },
];
const TONE = [
  { top: "#6aa8d8", mid: "#bcdcea", hor: "#f6e2c0", sun: "#ffe0b0", hemi: "#ffeed8", key: 3.0, fog: "#e8dcc8" },
  { top: "#6aa8d8", mid: "#bcd8e6", hor: "#f6dcb8", sun: "#ffdca8", hemi: "#ffe8d0", key: 3.1, fog: "#e8d8c0" },
  { top: "#70a0cc", mid: "#d0d4d8", hor: "#f2c898", sun: "#ffcf98", hemi: "#ffe0c0", key: 3.0, fog: "#ecd0b0" },
  { top: "#50407a", mid: "#b8627a", hor: "#f29a5a", sun: "#ff9a58", hemi: "#e8a888", key: 2.0, fog: "#d89a70" },
];

/* ------------------------------------------------------------------ small props */
const Cup: React.FC<{ lid?: boolean }> = ({ lid = true }) => <group><Mesh g={cyl(0.042, 0.032, 0.11, 8)} m={M("#f4f1ea", { map: "fabric" })} rim={false} /><Mesh g={cyl(0.043, 0.043, 0.012, 8)} m={M("#d8d2c6")} p={[0, 0.058, 0]} rim={false} />{lid ? <Mesh g={cyl(0.046, 0.046, 0.012, 8)} m={M("#c9b79c")} p={[0, 0.07, 0]} rim={false} /> : null}<Mesh g={cyl(0.044, 0.04, 0.05, 8)} m={M("#b07a48", { map: "wood" })} p={[0, -0.01, 0]} rim={false} /></group>;
const Tray: React.FC<{ n: number }> = ({ n }) => <group><Mesh g={cyl(0.24, 0.24, 0.015, 14)} m={M("#c4c8cf", { metal: 0.6, rough: 0.35, map: "metal" })} rim={false} />{Array.from({ length: n }, (_, i) => <group key={i} position={[0, 0.07 + i * 0.1, 0]}><Cup lid={i === n - 1} /></group>)}</group>;
const Cone: React.FC<{ ball?: boolean }> = ({ ball = true }) => <group><Mesh g={cone(0.04, 0.14, 6)} m={M("#d8a050", { map: "wood" })} p={[0, 0.0, 0]} r={[Math.PI, 0, 0]} rim={false} />{ball ? <Mesh g={ico(0.055, 1)} m={M("#ff8fb8")} p={[0, 0.1, 0]} rim={false} /> : null}</group>;
const Coin: React.FC<{ p: V3; t: number; spin?: number }> = ({ p, t, spin = 9 }) => <group position={p} rotation={[Math.PI / 2 + Math.sin(t * 5) * 0.4, t * spin, 0]}><Mesh g={cyl(0.07, 0.07, 0.016, 14)} m={M("#ffd54a", { metal: 0.6, rough: 0.3, emissive: "#c88a10", ei: 0.25 })} rim={false} /></group>;
const Glint: React.FC<{ p: V3; k: number }> = ({ p, k }) => <group position={p} scale={Math.max(0.001, k)}><mesh geometry={box(0.34, 0.025, 0.025)} material={BM("#fff8c8")} /><mesh geometry={box(0.025, 0.34, 0.025)} material={BM("#fff8c8")} /></group>;

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
  (s, tt) => Cam([{ t: 0, p: [0.9, 0.55, 4.6], l: [0.0, 1.15, 0.0], fov: 42, roll: -0.03 }, { t: 1.2, p: [0.5, 0.8, 4.2], l: [0.0, 1.1, 0.0], fov: 38 }, { t: 2.3, p: [-0.6, 1.2, 3.9], l: [0.1, 1.1, 0.0], fov: 36, roll: 0.03 }], s, tt),
  (s, tt) => Cam([{ t: 0, p: [-0.5, 1.1, 4.2], l: [0.2, 1.62, 0.0], fov: 38, roll: 0.03 }, { t: 1.2, p: [0.3, 1.25, 3.6], l: [0.2, 1.62, 0.0], fov: 34 }, { t: 2.4, p: [0.8, 1.2, 3.3], l: [0.1, 1.6, 0.0], fov: 32, roll: -0.03 }], s, tt),
  (s, tt) => s < 1.7
    ? Cam([{ t: 0, p: [4.8, 0.42, 6.1], l: [-2.5, 1.7, 5.4], fov: 55, roll: 0.03 }, { t: 1.7, p: [3.4, 0.52, 6.0], l: [-2.2, 2.0, 5.4], fov: 50, roll: -0.02 }], s, tt)
    : Cam([{ t: 1.7, p: [0.5, 1.7, 2.5], l: [0.0, 1.72, 0.0], fov: 34, roll: 0.02 }, { t: 3.0, p: [0.2, 1.7, 1.9], l: [0.0, 1.72, 0.0], fov: 31, roll: -0.01 }], s, tt),
];

/* ------------------------------------------------------------------ scenes (s = seconds since the scene started) */
const blinkAt = (t: number) => (t % 3.4) < 0.12 ? 1 : 0;
const SceneA: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const talk = (Math.sin(t * 13) > 0 ? 0.5 : 0.05) * (Math.sin(t * 2.2) > -0.2 ? 1 : 0);
  const bx = -2.6 + s * 1.9;
  return (
    <>
      <Table p={[0, 0.1, -0.4]} /><Chair p={[-0.95, 0.1, -0.35]} yaw={-1.45} /><Chair p={[0.95, 0.1, -0.4]} yaw={1.5} />
      <Person look={GARY2} p={[-0.95, 0.1, -0.3]} yaw={0.95} pose={{ sit: true, expr: "smug", lean: -0.22, headY: -0.25, headX: 0.04, rArm: [-0.75, 0.3], rElbow: 1.0, lArm: [0.25, -0.15], lElbow: 0.3, blink: blinkAt(t) }} itemR={<Cone />} />
      <Person look={MIA2} p={[0.95, 0.1, -0.4]} yaw={-1.05} pose={{ sit: true, expr: "smile", lean: 0.08, headY: 0.3, headZ: 0.04, mouthOpen: talk, rArm: [-0.9, 0.2], rElbow: 1.1, lArm: [-0.4, -0.1], lElbow: 0.7, blink: blinkAt(t + 1) }} />
      <Person look={BEN2} p={[bx, 0.1, -2.5]} yaw={Math.PI / 2 - 0.35} pose={{ ...walkP(bx, 0.42), expr: "calm", headY: 0.4, rGrip: 1 }} itemR={<Cup />} rim="#ffe2a8" />
      <Person look={GREY2(1)} p={[3.4, 0.1, -1.6]} yaw={-1.3} pose={walkP(3.4 - s * 1.2, 0.4)} />
    </>
  );
};
const SceneB: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const z = s < 0.7 ? lerp(-1.6, -0.2, s / 0.7) : -0.2; const walking = s < 0.7;
  const c = ease((s - 0.95) / 0.35) * (1 - ease((s - 1.45) / 0.3)); const up = s > 1.55;
  const toss = clamp((s - 1.7) / 0.55); const cy = 1.25 + Math.sin(toss * Math.PI) * 0.65; const caught = s > 2.25;
  const bPose: Pose2 = walking ? { ...walkP(-z * 1.0, 0.4), headX: 0.28, expr: "calm", rGrip: 1, rArm: [-0.6, 0.12], rElbow: 1.3, lElbow: 0.3 } : { crouch: c * 0.8, lean: c * 0.55, headX: 0.35 * (1 - c * 0.7), lArm: [-1.1 * c - 0.1, -0.1], lElbow: 0.4, lGrip: up ? 0.7 : 0.1, rArm: [-0.6, 0.12], rElbow: 1.3, rGrip: 1, expr: up ? "smug" : "calm", headY: up ? -0.15 : 0, blink: blinkAt(t) };
  const fall = clamp((s - 1.0) / 0.5);
  return (
    <>
      <Person look={BEN2} p={[0, 0.1, z]} yaw={0.22} pose={bPose} itemR={<Cup />} itemL={up && !caught ? <Coin p={[0, -0.04, 0.03]} t={t} spin={0} /> : undefined} rim="#ffe2a8" />
      {s < 1.2 ? <Coin p={[0.18, 0.2, 0.25]} t={t * 0.4} /> : null}
      {s >= 1.7 && s < 2.25 ? <Coin p={[-0.18, cy, 0.3]} t={t * 3} /> : null}
      {s > 1.25 && s < 1.65 ? <Glint p={[0.15, 0.55, 0.4]} k={1 - Math.abs((s - 1.45) / 0.2)} /> : null}
      <Table p={[-1.6, 0.1, -3.4]} /><Chair p={[-2.35, 0.1, -3.3]} yaw={-1.5} />
      <Person look={GARY2} p={[-2.35, 0.1, -3.2]} yaw={1.3} pose={{ sit: true, expr: s > 1.1 ? "shock" : "smug", lean: -0.1, rArm: [-0.8, 0.3], rElbow: 1.0 }} itemR={<Cone ball={s < 1.0} />} />
      {s >= 1.0 ? <Mesh g={ico(0.055, 1)} m={M("#ff8fb8")} p={[-2.0, lerp(0.95, 0.12, fall * fall), -3.0]} rim={false} /> : null}
    </>
  );
};
const SceneC: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const n = s < 0.7 ? 1 : s < 1.1 ? 2 : s < 1.5 ? 3 : s < 1.9 ? 4 : 5;
  const fallers = [0.35, 0.8, 1.2, 1.6, 2.0].map((t0, i) => ({ i, k: clamp((s - t0) / 0.5) }));
  const stackTop = 0.1 + n * 0.1; const stackY = 1.02;
  const catchR = clamp((s - 1.9) / 0.15);
  return (
    <>
      <Person look={BEN2} p={[0, 0.1, 0]} yaw={0.12} pose={{ expr: s > 1.0 ? "smug" : "calm", lArm: [-0.75, -0.2], lElbow: 1.5, lGrip: 0.3, rArm: [-1.0 - catchR * 0.5, 0.25], rElbow: 0.9, rGrip: 0.2 + catchR * 0.2, headX: -0.04, headY: 0.18 * Math.sin(t * 0.8), blink: blinkAt(t) }} itemL={<group position={[0, -0.04, 0.02]} rotation={[0.75 + 1.5, 0, 0]}><Tray n={n - 1 > 0 ? n - 1 : 0} /></group>} rim="#ffe2a8" />
      {fallers.map(({ i, k }) => (k > 0 && k < 1 && i + 1 > 0 ? <group key={i} position={[lerp(-0.7, -0.38, ease(k)), lerp(4.8, 1.0 + (i * 0.1), k * k), 0.38]} rotation={[k * 5, 0, k * 2]}><Cup /></group> : null))}
      <Table p={[-1.9, 0.1, -3.0]} /><Chair p={[-2.6, 0.1, -2.9]} yaw={-1.5} />
      <Person look={MIA2} p={[-2.6, 0.1, -2.85]} yaw={1.2} pose={{ sit: true, expr: "shock", mouthOpen: 0.7, rArm: [-1.3, 0.4], rElbow: 1.3, lArm: [-0.4, -0.1] }} />
      <Person look={GREY2(3)} p={[2.4, 0.1, -2.0]} yaw={-0.8} pose={walkP(2.4 - s * 1.4, 0.4)} />
    </>
  );
};
const SceneD: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const close = s >= 1.7;
  const ex = s - 0.5;
  const bx = lerp(-1.8, -0.2, clamp(s / 1.7));
  const flyT = clamp((s - 0.5) / 1.4);
  return (
    <>
      {!close ? (
        <>
          <group>
            {ex < 0 ? <Car p={[-5.8, 0.1, 5.4]} col="#d83a2a" /> : <Car p={[-5.8, 0.1, 5.4]} col="#d83a2a" wreck />}
            <Explosion p={[-5.8, 0.1, 5.4]} t={ex} />
          </group>
          <Person look={BEN2} p={[bx, 0.1, 6.0]} yaw={Math.PI / 2 + 0.25} pose={{ ...walkP(bx * 0.95, 0.4), expr: "calm", headY: -0.3, blink: blinkAt(t) }} rim="#ffd8a0" />
          {flyT > 0 && flyT < 1 ? <Person look={GREY2(2)} p={[-5.8 + flyT * 3.5, 0.1 + 2 + 8 * flyT - 11 * flyT * flyT, 5.0]} yaw={1.2} pose={{ rArm: [-2.7, 0.5], lArm: [-2.7, -0.5], expr: "shock", legSpread: 0.15, crouch: 0.2, mouthOpen: 1 }} /> : null}
        </>
      ) : (
        <>
          <Person look={{ ...BEN2 }} p={[0, 0.1, 0]} yaw={0.08} pose={{ expr: "smug", headX: 0.04, headY: 0.06, shadesOn: s > 2.0, rArm: s > 1.85 && s < 2.15 ? [-2.3, 0.15] : [0.05, 0.12], rElbow: s > 1.85 && s < 2.15 ? 1.8 : 0.2, blink: 0 }} rim="#ffcf88" />
          <Explosion p={[1.2, 0.1, -3.8]} t={s + 0.3 - 0.5 + 0.4} />
        </>
      )}
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
      <Sky top={tn.top} mid={tn.mid} hor={tn.hor} /><fog attach="fog" args={[tn.fog, 28, 130]} />
      <hemisphereLight args={[tn.hemi, "#e8c9a0", 1.5]} />
      <directionalLight color={tn.sun} intensity={tn.key} position={[focus[0] - 5, 8, focus[2] + 7]} target-position={focus} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={6} shadow-camera-bottom={-5} shadow-camera-near={1} shadow-camera-far={30} shadow-bias={-0.0004} shadow-normalBias={0.025} />
      <directionalLight color="#ffe6b8" intensity={i === 3 ? 2.6 : 1.6} position={[focus[0] + 4, 5, focus[2] - 8]} />
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
const Hud: React.FC<{ h: NonNullable<(typeof HUD)[number]>; s: number }> = ({ h, s }) => {
  const ent = ease(s / 0.2); const capIn = ease((s - 0.15) / 0.25);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", color: "#fff" }}>
      <div style={{ position: "absolute", left: 58, top: 190, textShadow: "0 1px 10px rgba(0,0,0,.28)" }}>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 22, letterSpacing: "0.26em" }}>LUCK</div>
        <div style={{ fontFamily: num, fontWeight: 400, fontSize: 124, lineHeight: 1.0, marginTop: 6, transform: `scale(${0.9 + 0.1 * ent})`, transformOrigin: "0 100%", opacity: 0.3 + 0.7 * ent, fontFeatureSettings: '"lnum" 1' }}>{h.luck}</div>
        {h.tier ? <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 25, letterSpacing: "0.17em", marginTop: 14 }}>{h.tier}</div> : <div style={{ height: 14 }} />}
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 22, letterSpacing: "0.17em", marginTop: 6 }}>MINUTE {h.minute}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{ background: "#e0183f", borderRadius: 5, padding: "8px 15px", fontFamily: sans, fontWeight: 800, fontSize: 21, letterSpacing: "0.1em", textShadow: "none" }}>×2 EVERY MINUTE</div>
          <div style={{ background: "#f7b82e", color: "#17171b", borderRadius: 5, padding: "8px 15px", fontFamily: sans, fontWeight: 800, fontSize: 21, letterSpacing: "0.1em", textShadow: "none" }}>{h.pill}</div>
        </div>
      </div>
      {h.cap ? <div style={{ position: "absolute", left: 58, width: 860, top: 560, fontFamily: lora, fontStyle: "italic", fontSize: 54, lineHeight: 1.12, textShadow: "0 1px 12px rgba(0,0,0,.45)", opacity: capIn, transform: `translateY(${(1 - capIn) * 14}px)` }}>{h.cap}</div> : null}
    </AbsoluteFill>
  );
};
const Shout: React.FC<{ words: [string, boolean][]; s: number; t0: number; t1: number }> = ({ words, s, t0, t1 }) => {
  if (s < t0 || s > t1) return null; const k = ease((s - t0) / 0.08);
  return <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1210, pointerEvents: "none" }}><div style={{ fontFamily: sans, fontWeight: 900, fontSize: 88, letterSpacing: "0.01em", color: "#fff", WebkitTextStroke: "0px", textShadow: "0 3px 0 rgba(0,0,0,.65), 0 0 14px rgba(0,0,0,.55), 3px 0 0 rgba(0,0,0,.5), -3px 0 0 rgba(0,0,0,.5)", transform: `scale(${0.8 + 0.2 * k})`, opacity: k }}>{words.map(([w, gold], i) => <span key={i} style={{ color: gold ? "#ffd21f" : "#fff" }}>{w}{i < words.length - 1 ? " " : ""}</span>)}</div></AbsoluteFill>;
};
const Title: React.FC<{ s: number }> = ({ s }) => { const k = ease(s / 0.25) * (1 - ease((s - 2.05) / 0.25)); return <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, pointerEvents: "none", opacity: k, transform: `translateY(${(1 - k) * 12}px)` }}><div style={{ fontFamily: lora, fontWeight: 400, fontSize: 80, lineHeight: 1.12, textAlign: "center", color: "#fff", textShadow: "0 2px 4px rgba(60,30,0,.55), 0 4px 22px rgba(0,0,0,.5)", width: 760 }}>What if your <span style={{ color: "#f2c14e" }}>luck</span> doubled every minute?</div></AbsoluteFill>; };

export const Style3Sample: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts3().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#e8dcc8" }} />;
  const idx = t >= SEG[3].t0 ? 3 : t >= SEG[2].t0 ? 2 : t >= SEG[1].t0 ? 1 : 0; const s = t - SEG[idx].t0;
  const cam = CAMS[idx](s, t); const Sc = SCENES[idx];
  const subject: V3 = idx === 3 ? (s < 1.7 ? [-1, 1.2, 6] : [0, 1.7, 0]) : [0, 1.2, 0];
  const focus = new THREE.Vector3(...cam.p).distanceTo(new THREE.Vector3(...subject));
  const flash = idx > 0 ? Math.max(0, 1 - s / 0.12) * 0.5 : 0; const punch = idx > 0 ? Math.max(0, 1 - s / 0.25) * 0.04 : 0;
  const hud = HUD[idx];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + punch})` }}>
        <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, near: 0.05, far: 500, position: cam.p }} gl={{ antialias: true }}>
          <Rig p={cam.p} l={cam.l} fov={cam.fov} roll={cam.roll} />
          <Lights i={idx} focus={idx === 3 && s < 1.7 ? [-2, 0, 5.5] : [0, 0, -0.3]} />
          <City />
          <Sc key={idx} s={s} t={t} />
          <PostFX focus={focus} range={idx === 3 && s < 1.7 ? 7 : 2.6} bokeh={idx === 3 ? 3.4 : 3.0} frame={frame} grain={0.18} />
        </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
      {idx === 0 ? <Title s={s} /> : null}
      {hud ? <Hud h={hud} s={s} /> : null}
      {idx === 3 ? <><Shout words={[["BOOM.", true]]} s={s} t0={0.62} t1={1.25} /><Shout words={[["DON'T", false], ["LOOK", true], ["BACK.", false]]} s={s} t0={1.95} t1={3.0} /></> : null}
      {audio ? <Audio src={staticFile("style3_luck_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
