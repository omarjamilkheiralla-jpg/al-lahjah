import * as THREE from "three";
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { loadFonts } from "../full/fonts";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { clamp } from "../hotel/kit";
import timing from "../rats/timing.json";
import { R1Hook, R2Setup, R3Plan, R4But, R5Then, R6Conflict, R7Pivot, R8Farm, R9So, R10Payoff, R11Close, type SceneProps } from "../rats/scenes";

type V3 = [number, number, number];
type Key = { f: number; p: V3; l: V3; roll?: number };
type Shot = { id: string; Scene: React.FC<SceneProps>; keys: Key[]; fov?: number; bokeh?: number; sceneT?: (local: number) => number };

/** Camera plan: one shot per line of the script. f = fraction of the shot's duration. */
export const SHOTS: Shot[] = [
  { id: "hook", Scene: R1Hook, fov: 60, keys: [
    { f: 0, p: [1.4, 1.6, 4.4], l: [-0.3, 1.9, 0.3], roll: 0.05 }, { f: 0.35, p: [0.2, 1.9, 3.5], l: [-0.2, 2.0, 0.3] }, { f: 1, p: [-2.6, 1.8, 4.2], l: [-2.2, 1.9, 0.3], roll: -0.04 },
  ] },
  { id: "setup", Scene: R2Setup, fov: 74, keys: [
    { f: 0, p: [0, 1.4, 9.5], l: [0, 2.2, -14], roll: 0.03 }, { f: 0.5, p: [1.0, 1.7, 5.2], l: [0, 1.6, -9] }, { f: 1, p: [-0.6, 2.0, 1.6], l: [-2.4, 1.5, -3.5], roll: -0.03 },
  ] },
  { id: "plan", Scene: R3Plan, fov: 70, keys: [
    { f: 0, p: [-2.2, 1.1, 7.2], l: [-1.6, 1.8, -6] }, { f: 1, p: [1.6, 2.3, -2.4], l: [0.4, 1.8, -12], roll: 0.02 },
  ] },
  { id: "but", Scene: R4But, fov: 58, keys: [
    { f: 0, p: [0.8, 2.9, 3.7], l: [0.5, 2.7, -0.6], roll: 0.14 }, { f: 0.5, p: [0.2, 2.6, 3.3], l: [0.6, 2.2, -0.4], roll: 0.1 }, { f: 1, p: [-0.6, 2.2, 3.5], l: [0.5, 2.4, -0.5], roll: 0.12 },
  ] },
  { id: "then", Scene: R5Then, fov: 72, keys: [
    { f: 0, p: [0, 7.5, 12.5], l: [0, 3.2, -4] }, { f: 0.6, p: [0.4, 3.4, 8.5], l: [0, 3.8, -3.2] }, { f: 1, p: [0, 2.2, 5.6], l: [0, 4.4, -3.2] },
  ] },
  { id: "conflict", Scene: R6Conflict, fov: 66, keys: [
    { f: 0, p: [1.0, 5.3, 5.4], l: [0, 5.2, 0.9], roll: 0.03 }, { f: 0.55, p: [0.4, 5.0, 4.3], l: [0, 5.0, 0.9] }, { f: 1, p: [0.5, 2.6, 6.6], l: [0, 0.6, 3.4] },
  ] },
  { id: "pivot", Scene: R7Pivot, fov: 62, keys: [
    { f: 0, p: [0, 8.2, 1.8], l: [0, 1, 0.4] }, { f: 0.35, p: [0.8, 5.0, 3.6], l: [0.5, 1.2, 0.4] }, { f: 0.62, p: [3.2, 2.5, 3.6], l: [2.2, 1.6, 1.2] }, { f: 1, p: [3.6, 2.0, 2.9], l: [2.4, 1.7, 1.2] },
  ] },
  { id: "farm", Scene: R8Farm, fov: 66, keys: [
    { f: 0, p: [-9, 2.6, 7.8], l: [-5, 1.4, 0.5], roll: 0.03 }, { f: 1, p: [9, 2.8, 7.8], l: [5, 1.5, 0.5], roll: -0.03 },
  ] },
  { id: "so", Scene: R9So, fov: 72, keys: [
    { f: 0, p: [1, 3.8, 7.2], l: [0.5, 1.8, 1.2] }, { f: 1, p: [2, 9.5, 17], l: [0, 2.2, 0.5] },
  ] },
  { id: "payoff", Scene: R10Payoff, fov: 62, keys: [
    { f: 0, p: [0.6, 3.4, 10.5], l: [0.3, 2.8, 0] }, { f: 1, p: [-0.4, 3.0, 7.6], l: [-0.4, 2.6, 0.4] },
  ] },
  { id: "close", Scene: R11Close, fov: 60, keys: [
    { f: 0, p: [0.2, 2.6, 6.2], l: [0.1, 2.0, 0.3] }, { f: 1, p: [0.2, 2.2, 3.9], l: [0.1, 1.9, 0.5] },
  ] },
];

/** cuts land just before each voice line starts, so the picture leads the voice */
const LEAD = 0.1;
export const FPS = 60;
export const RATS_TOTAL = timing.total + 1.5;
const TOTAL = RATS_TOTAL;
const VOICE_END = timing.total + 0.35;   // the shot cuts and captions end with the narration; the last 1.15 s is the "ta-ding" tail
const starts = timing.starts.map((s, i) => (i === 0 ? 0 : Math.max(0, s - LEAD)));
const ends = starts.map((_, i) => (i + 1 < starts.length ? starts[i + 1] : TOTAL));
export const SHOT_TIMES = starts.map((s, i) => ({ start: s, end: ends[i] }));

const warpU = (T: number[], t: number) => {
  const n = T.length;
  if (t <= T[0]) return 0;
  if (t >= T[n - 1]) return 1;
  const sec: number[] = [];
  for (let i = 0; i < n - 1; i++) sec.push(1 / (n - 1) / (T[i + 1] - T[i]));
  const m = [0];
  for (let i = 1; i < n - 1; i++) m.push((2 * sec[i - 1] * sec[i]) / (sec[i - 1] + sec[i]));
  m.push(0);
  let i = 0;
  while (t > T[i + 1]) i++;
  const h = T[i + 1] - T[i], x = (t - T[i]) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] + (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1];
};

const curves = SHOTS.map((s) => ({
  pos: new THREE.CatmullRomCurve3(s.keys.map((k) => new THREE.Vector3(...k.p)), false, "centripetal"),
  look: new THREE.CatmullRomCurve3(s.keys.map((k) => new THREE.Vector3(...k.l)), false, "centripetal"),
  T: s.keys.map((k) => k.f),
}));

export const cameraFor = (shot: number, local: number, dur: number) => {
  const c = curves[shot];
  const u = clamp(warpU(c.T, clamp(local / dur)));
  const p = c.pos.getPoint(u), l = c.look.getPoint(u);
  const keys = SHOTS[shot].keys;
  // roll interpolated along the same path
  let roll = 0;
  const f = clamp(local / dur);
  for (let i = 0; i < keys.length - 1; i++) if (f >= keys[i].f && f <= keys[i + 1].f) {
    const k = (f - keys[i].f) / Math.max(1e-6, keys[i + 1].f - keys[i].f);
    roll = (keys[i].roll ?? 0) * (1 - k) + (keys[i + 1].roll ?? 0) * k;
  }
  p.x += Math.sin(local * 1.7 + shot) * 0.01; p.y += Math.sin(local * 2.3 + shot) * 0.008;
  return { p, l, roll };
};

const shotAt = (t: number) => {
  let i = SHOT_TIMES.findIndex((s) => t >= s.start && t < s.end);
  if (i < 0) i = t < 0 ? 0 : SHOT_TIMES.length - 1;
  return i;
};

const Rig: React.FC<{ p: THREE.Vector3; l: THREE.Vector3; roll: number; fov: number }> = ({ p, l, roll, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(l); camera.rotateZ(roll); camera.updateMatrixWorld();
  });
  return null;
};

/* ---- captions: 1-3 words at a time, from the real word timings ---- */
type W = [string, number, number];
const WORDS = timing.words as W[];
const PAGES = (() => {
  const pages: { text: string; s: number }[] = [];
  let cur: W[] = [];
  const flush = () => { if (cur.length) { pages.push({ text: cur.map((w) => w[0]).join(" "), s: cur[0][1] }); cur = []; } };
  WORDS.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    if (prev && (cur.length >= 3 || /[.,?!:…]$/.test(prev[0]) || w[1] - prev[2] > 0.35 || (cur.map((x) => x[0]).join(" ").length + w[0].length > 18))) flush();
    cur.push(w);
  });
  flush();
  return pages;
})();

const Captions: React.FC<{ t: number }> = ({ t }) => {
  let idx = -1;
  for (let i = 0; i < PAGES.length; i++) if (t >= PAGES[i].s) idx = i; else break;
  if (idx < 0) return null;
  const endGuess = idx + 1 < PAGES.length ? PAGES[idx + 1].s : TOTAL;
  const lastWordEnd = WORDS.filter((w) => w[1] >= PAGES[idx].s && w[1] < endGuess).slice(-1)[0]?.[2] ?? endGuess;
  if (t > lastWordEnd + 0.3) return null;
  const k = clamp((t - PAGES[idx].s) / 0.1);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 330, pointerEvents: "none" }}>
      <div style={{
        fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 112, fontWeight: 400, color: "#fff", letterSpacing: 2,
        whiteSpace: "pre", WebkitTextStroke: "18px #1a0e10", paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(26,14,16,.5)",
        transform: `scale(${0.88 + 0.12 * k})`, opacity: 0.4 + 0.6 * k,
      }}>{PAGES[idx].text}</div>
    </AbsoluteFill>
  );
};

export const RatsFull: React.FC<{ captions?: boolean; audio?: boolean }> = ({ captions = true, audio = true }) => {
  const [fontsOk, setFontsOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => {
    const h = delayRender("fonts");
    loadFonts().then(() => { setFontsOk(true); continueRender(h); });
  }, [delayRender, continueRender]);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const si = shotAt(t);
  const shot = SHOTS[si];
  const { start, end } = SHOT_TIMES[si];
  const local = t - start;
  const dur = end - start;
  const { p, l, roll } = cameraFor(si, local, dur);
  const dist = p.distanceTo(l);
  const sinceCut = local;
  const flash = si > 0 ? Math.max(0, 1 - sinceCut / 0.2) : 0;
  const Scene = shot.Scene;
  const sceneT = shot.sceneT ? shot.sceneT(local) : local;

  if (!fontsOk) return <AbsoluteFill style={{ backgroundColor: "#f4e6cf" }} />;
  const punch = si > 0 ? 1 + 0.05 * Math.pow(Math.max(0, 1 - local / 0.3), 2) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#9bd1f2" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})`, transformOrigin: "50% 50%" }}>
      <ThreeCanvas width={width} height={height} shadows="soft" flat camera={{ fov: shot.fov ?? 70, near: 0.1, far: 260, position: [p.x, p.y, p.z] }} gl={{ antialias: true }}>
        <Rig p={p} l={l} roll={roll} fov={shot.fov ?? 70} />
        <Scene key={si} t={sceneT} cam={[p.x, p.y, p.z]} />
        <PostFX focus={dist} range={Math.max(2.5, dist * 0.55)} bokeh={shot.bokeh ?? 3.4} frame={frame} />
      </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff6e0", opacity: flash * 0.6 }} /> : null}
      {captions ? <Captions t={t} /> : null}
      {audio ? <Audio src={staticFile("rats_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
