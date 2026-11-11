import * as THREE from "three";
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { loadFonts } from "../full/fonts";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { clamp } from "../hotel/kit";
import timing from "./timing.json";
import * as S from "./scenes";
type SceneProps = S.SceneProps;

type V3 = [number, number, number];
type Key = { f: number; p: V3; l: V3; roll?: number };
type Shot = { id: string; Scene: React.FC<SceneProps>; keys: Key[]; fov?: number; bokeh?: number; sceneT?: (local: number) => number };

/** Camera plan: one shot per line of the script. f = fraction of the shot's duration. */
const K = (f: number, p: V3, l: V3, roll?: number): Key => ({ f, p, l, roll });
export const SHOTS: Shot[] = [
  { id: "hook", Scene: S.T0Hook, fov: 52, keys: [K(0, [-34, 26, 30], [-5, 2, -4], 0.03), K(0.5, [-18, 12, 24], [-2, 3, -3]), K(1, [-9, 3.2, 13], [-4, 2.2, -4])] },
  { id: "small", Scene: S.T1Small, fov: 52, keys: [K(0, [-31, 1.6, 17], [-30, 1.8, 9.6]), K(0.5, [-27, 2.4, 15], [-22, 2.6, 2]), K(1, [-18, 3, 12], [-10, 3.4, -2])] },
  { id: "pool", Scene: S.T2Pool, fov: 50, keys: [K(0, [10, 4, 9], [3, 2.6, -3]), K(0.5, [5, 3.4, 6], [1, 2.4, -4]), K(1, [-1, 3.0, 4.5], [2.4, 2.4, -3.4])] },
  { id: "numbers", Scene: S.T3Numbers, fov: 50, keys: [K(0, [-8, 4.5, 9], [0, 4, -6]), K(0.5, [-3, 4.2, 4], [0, 5, -7]), K(1, [3, 3.4, 2.5], [0, 4.2, -6])] },
  { id: "monday", Scene: S.T4Monday, fov: 52, keys: [K(0, [10, 4.6, 14], [0, 2.4, 0], 0.03), K(0.5, [5, 3.6, 10.5], [0, 2.6, 0.6]), K(1, [2.6, 3.2, 8.2], [0, 2.8, 0.6])] },
  { id: "names", Scene: S.T5Names, fov: 52, keys: [K(0, [-8, 3, 8], [-5, 3.2, 1]), K(0.45, [-1, 2.6, 7.5], [0, 2.2, 1.4]), K(1, [5, 2.6, 7.5], [3.4, 2.2, 1.4])] },
  { id: "scream", Scene: S.T6Scream, fov: 54, keys: [K(0, [0, 4.4, 16], [0, 2.6, 0]), K(0.6, [0, 4.8, 15], [0, 2.8, 1]), K(1, [0, 6.2, 12.5], [0, 3.2, 2], 0.05)] },
  { id: "dealer", Scene: S.T7Dealer, fov: 52, keys: [K(0, [8, 2.2, 12], [20, 1.6, 3]), K(0.5, [14, 2.8, 10], [26, 1.8, 2]), K(1, [26, 3.4, 11], [28, 1.8, 1.5])] },
  { id: "boat", Scene: S.T8Boat, fov: 52, keys: [K(0, [-10, 3, 44], [3, 2.2, 28]), K(1, [3, 3, 38], [4, 2.5, 28.5])] },
  { id: "gas", Scene: S.T9Gas, fov: 52, keys: [K(0, [-16, 3.2, 12], [-38, 2.4, 3.5]), K(1, [-31, 3, 11], [-41, 2.4, 3.5])] },
  { id: "quit", Scene: S.T10Quit, fov: 52, keys: [K(0, [-26, 2.6, 10], [-14, 2.2, 1.5]), K(0.5, [-8, 2.8, 10.5], [-2, 2.4, 1.8]), K(1, [12, 3.0, 10.5], [16, 2.4, 1.8])] },
  { id: "baker", Scene: S.T11Baker, fov: 50, keys: [K(0, [7, 3.4, 8], [-2, 2.4, -3]), K(1, [1.8, 2.8, 5], [-1.4, 2.4, -1])] },
  { id: "shops", Scene: S.T12Shop, fov: 52, keys: [K(0, [-5, 4.5, 12], [-13, 2, 0]), K(1, [-12, 3, 9.5], [-13, 2.4, 0])] },
  { id: "price1", Scene: S.T13Prices1, fov: 50, keys: [K(0, [-5, 4, 8], [0, 4.5, -5]), K(1, [1.5, 4.4, 2.5], [0.4, 4.8, -5.8])] },
  { id: "price2", Scene: S.T14Prices2, fov: 50, keys: [K(0, [7, 3.8, 6], [0.4, 4.6, -5.8]), K(1, [3, 4.6, 0.5], [0.4, 5.0, -5.8])] },
  { id: "couch", Scene: S.T15Couch, fov: 52, keys: [K(0, [9, 2.6, 12.5], [-2, 1.8, 7.8]), K(1, [4.6, 2.4, 11.8], [-2, 2.2, 7.8])] },
  { id: "lemon", Scene: S.T16Lemonade, fov: 52, keys: [K(0, [-8, 2.2, 12], [0, 2, 7.2]), K(1, [1.8, 2.4, 11.8], [-0.4, 2, 7.4])] },
  { id: "empty", Scene: S.T17Empty, fov: 50, keys: [K(0, [8, 3.6, 9], [0, 2.6, -4]), K(1, [1, 3.4, 3.5], [-4, 3, -6])] },
  { id: "pipe", Scene: S.T18Pipe, fov: 52, keys: [K(0, [-6, 3, 12], [2, 3, 2.2]), K(1, [1, 4.8, 9.5], [2, 3.5, 2.2])] },
  { id: "runout", Scene: S.T19Runout, fov: 50, keys: [K(0, [-8, 3.4, 6.5], [0, 2.4, -7]), K(1, [8, 3.2, 4.5], [0, 2.6, -7])] },
  { id: "heli", Scene: S.T20Heli, fov: 54, keys: [K(0, [-6, 7, 18], [-1, 16, 2]), K(1, [-4, 5.5, 16], [-1, 3, 4])] },
  { id: "mayor", Scene: S.T21Mayor, fov: 50, keys: [K(0, [7, 3.0, 14.5], [0, 2.6, 3.4]), K(1, [1.5, 3.2, 9.6], [0, 3.0, 3.4])] },
  { id: "cash", Scene: S.T22Cash, fov: 50, keys: [K(0, [5, 4.4, 6], [0, 3.2, -1]), K(1, [-3, 3.8, 3.5], [0, 3.4, -1])] },
  { id: "inflate", Scene: S.T23Inflate, fov: 54, keys: [K(0, [-12, 5, 12.4], [0, 5, 4]), K(1, [-9, 5.5, 12.4], [0, 6, 4.2])] },
  { id: "back", Scene: S.T24Back, fov: 52, keys: [K(0, [-22, 3, 12], [-10, 2.4, 3]), K(1, [8, 3.4, 12], [8, 2.6, 3])] },
  { id: "sign", Scene: S.T25Sign, fov: 50, keys: [K(0, [7, 3.6, 8], [-1, 2.8, -1]), K(1, [1.5, 3.2, 6.2], [-1.6, 3, 1.4])] },
  { id: "line", Scene: S.T26Line, fov: 52, keys: [K(0, [2, 2.8, 12.6], [-14, 2.6, 2]), K(1, [6, 6.5, 12.4], [-14, 3.0, 2])] },
];

/** cuts land just before each voice line starts, so the picture leads the voice */
const LEAD = 0.1;
export const FPS = 50;
export const TOWN_TOTAL = timing.total + 1.5;
const TOTAL = TOWN_TOTAL;
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
    if (prev && (cur.length >= 4 || /[.,?!:…]$/.test(prev[0]) || w[1] - prev[2] > 0.35 || (cur.map((x) => x[0]).join(" ").length + w[0].length > 26))) flush();
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
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 90, pointerEvents: "none" }}>
      <div style={{
        fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 92, fontWeight: 400, color: "#fff", letterSpacing: 2,
        whiteSpace: "pre", WebkitTextStroke: "14px #1a0e10", paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(26,14,16,.5)",
        transform: `scale(${0.88 + 0.12 * k})`, opacity: 0.4 + 0.6 * k,
      }}>{PAGES[idx].text}</div>
    </AbsoluteFill>
  );
};

export const TownFull: React.FC<{ captions?: boolean; audio?: boolean }> = ({ captions = true, audio = true }) => {
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
    <AbsoluteFill style={{ backgroundColor: "#bfe0f2" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})`, transformOrigin: "50% 50%" }}>
      <ThreeCanvas width={width} height={height} flat camera={{ fov: shot.fov ?? 70, near: 0.1, far: 260, position: [p.x, p.y, p.z] }} gl={{ antialias: true }}>
        <Rig p={p} l={l} roll={roll} fov={shot.fov ?? 70} />
        <Scene key={si} t={sceneT} cam={[p.x, p.y, p.z]} />
        <PostFX focus={dist} range={Math.max(2.5, dist * 0.55)} bokeh={shot.bokeh ?? 3.4} frame={frame} />
      </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff6e0", opacity: flash * 0.6 }} /> : null}
      {captions ? <Captions t={t} /> : null}
      {audio ? <Audio src={staticFile("town_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
