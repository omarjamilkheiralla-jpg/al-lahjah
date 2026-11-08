import * as THREE from "three";
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { loadFonts } from "./fonts";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { clamp } from "../hotel/kit";
import timing from "./timing.json";
import { S1Hook, S2Mud, S3Office, S4Owners, S5Pullman, S6Condition, S7Jacks, S8Rooms, S9Reveal, S10Shops, S11Close, type SceneProps } from "./scenes";

type V3 = [number, number, number];
type Key = { f: number; p: V3; l: V3; roll?: number };
type Shot = { id: string; Scene: React.FC<SceneProps>; keys: Key[]; fov?: number; bokeh?: number; sceneT?: (local: number) => number };

/** Camera plan: one shot per line of the script. f = fraction of the shot's duration. */
export const SHOTS: Shot[] = [
  { id: "hook", Scene: S1Hook, fov: 78, sceneT: (l) => l, keys: [
    { f: 0.0, p: [-1.4, 1.15, 10.4], l: [0.1, 3.0, 0], roll: 0.05 }, { f: 0.28, p: [-3.1, 1.8, 6.6], l: [-2.0, 2.3, 0.3] },
    { f: 0.41, p: [-3.0, 3.5, 9.0], l: [-3.0, 3.5, 0] }, { f: 0.74, p: [0.6, 9.8, 10.8], l: [1.3, 11.0, 0] }, { f: 1.0, p: [1.35, 12.7, 4.8], l: [1.3, 12.95, 0] },
  ] },
  { id: "mud", Scene: S2Mud, fov: 72, keys: [
    { f: 0, p: [4.5, 7.5, 9.5], l: [0, 1.2, -3], roll: -0.05 }, { f: 0.5, p: [2.4, 4.2, 7.0], l: [-0.4, 1.1, -1.2] }, { f: 1, p: [0.8, 1.9, 4.2], l: [0.3, 1.5, -1.6] },
  ] },
  { id: "plan", Scene: S3Office, fov: 62, keys: [
    { f: 0, p: [0.5, 2.7, 3.3], l: [0.4, 2.65, 0] }, { f: 0.45, p: [1.6, 2.5, 4.8], l: [1.0, 1.9, 0.5] }, { f: 1, p: [3.9, 3.4, 7.4], l: [1.0, 2.0, 0] },
  ] },
  { id: "but", Scene: S4Owners, fov: 68, keys: [
    { f: 0, p: [-8.7, 1.5, 7.4], l: [-7.7, 2.4, 3.2], roll: 0.17 }, { f: 0.33, p: [-2.4, 1.5, 7.4], l: [-1.5, 2.4, 3.2], roll: 0.15 },
    { f: 0.66, p: [3.7, 1.5, 7.4], l: [4.5, 2.4, 3.2], roll: 0.17 }, { f: 1, p: [8.8, 1.5, 7.4], l: [9.5, 2.4, 3.2], roll: 0.15 },
  ] },
  { id: "pullman", Scene: S5Pullman, fov: 60, keys: [
    { f: 0, p: [-2.4, 0.3, 6.6], l: [0, 2.7, 0.4], roll: -0.06 }, { f: 1, p: [-0.4, 0.55, 4.5], l: [0.0, 3.0, 0.4], roll: 0.0 },
  ] },
  { id: "condition", Scene: S6Condition, fov: 62, keys: [
    { f: 0, p: [-2.0, 2.1, 8.0], l: [-1.0, 2.5, 0.8], roll: 0.06 }, { f: 0.5, p: [0.1, 2.4, 7.4], l: [0, 2.5, 0.8] }, { f: 1, p: [2.0, 2.1, 8.0], l: [1.0, 2.5, 0.8], roll: -0.06 },
  ] },
  { id: "jacks", Scene: S7Jacks, fov: 66, keys: [
    { f: 0, p: [-0.9, 1.5, 5.7], l: [-0.6, 1.4, 3.1] }, { f: 0.3, p: [0.8, 2.3, 6.4], l: [0.2, 1.9, 2.4] }, { f: 0.55, p: [-1.8, 2.7, 10.5], l: [0, 2.4, 0] }, { f: 1, p: [3.2, 7.4, 16.0], l: [0, 3.4, 0] },
  ] },
  { id: "rooms", Scene: S8Rooms, fov: 66, keys: [
    { f: 0, p: [-5.6, 9.3, 4.9], l: [-3.4, 9.8, 0], roll: 0.05 }, { f: 1, p: [5.6, 10.6, 4.9], l: [3.6, 10.8, 0], roll: -0.03 },
  ] },
  { id: "reveal", Scene: S9Reveal, fov: 74, keys: [
    { f: 0, p: [0.6, 4.4, 6.8], l: [0, 5.2, 0] }, { f: 1, p: [3.2, 11.5, 19.5], l: [0, 6.8, 0] },
  ] },
  { id: "shops", Scene: S10Shops, fov: 72, keys: [
    { f: 0, p: [-9.5, 6.8, 13.5], l: [-3, 2.6, 0], roll: 0.04 }, { f: 1, p: [7.5, 5.2, 13.5], l: [3.5, 2.6, 0], roll: -0.04 },
  ] },
  { id: "close", Scene: S11Close, fov: 70, keys: [
    { f: 0, p: [-3.6, 3.3, 7.8], l: [-3.4, 3.1, 4.8] }, { f: 0.45, p: [-1.0, 4.2, 14.0], l: [-2.0, 3.2, 1.5] }, { f: 1, p: [1.0, 6.0, 23.0], l: [-1.0, 3.6, 0] },
  ] },
];

/** cuts land just before each voice line starts, so the picture leads the voice */
const LEAD = 0.1;
export const FPS = 30;
export const TOTAL = timing.total + 0.35;
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

export const Full: React.FC<{ captions?: boolean; audio?: boolean }> = ({ captions = true, audio = true }) => {
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
  return (
    <AbsoluteFill style={{ backgroundColor: "#9bd1f2" }}>
      <ThreeCanvas width={width} height={height} shadows="soft" flat camera={{ fov: shot.fov ?? 70, near: 0.1, far: 260, position: [p.x, p.y, p.z] }} gl={{ antialias: true }}>
        <Rig p={p} l={l} roll={roll} fov={shot.fov ?? 70} />
        <Scene key={si} t={sceneT} cam={[p.x, p.y, p.z]} />
        <PostFX focus={dist} range={Math.max(2.5, dist * 0.55)} bokeh={shot.bokeh ?? 3.4} frame={frame} />
      </ThreeCanvas>
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff6e0", opacity: flash * 0.75 }} /> : null}
      {captions ? <Captions t={t} /> : null}
      {audio ? <Audio src={staticFile("full_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
