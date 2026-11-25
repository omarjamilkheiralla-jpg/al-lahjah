/* "She Fell Two Miles Out of the Sky" - Style 1 true story (lottery-town look), 1920x1080, 30 fps.
   One shot per line (long lines split at a word), camera key paths with a monotone time warp, cut flash + punch, captions from the real word timings. */
import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFonts } from "../full/fonts";
import { PostFX } from "../hotel/PostFX";
import { clamp } from "../hotel/kit";
import timing from "./timing.json";
import * as S from "./scenes";

type V3 = [number, number, number];
type Key = { f: number; p: V3; l: V3; roll?: number };
type Shot = { id: string; Scene: React.FC<S.SceneProps>; line: number; word?: string; keys: Key[]; fov?: number; bokeh?: number; memory?: boolean; day?: string; shake?: number };
type Sent = { i: number; text: string; start: number; end: number; words: { w: string; t0: number; t1: number }[] };
const SEN = (timing as any).sentences as Sent[];
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
export const wordAbs = (line: number, word: string) => { const s = SEN[line]; const w = s.words.find((x) => norm(x.w).startsWith(word)); return w ? w.t0 : s.start; };

const K = (f: number, p: V3, l: V3, roll?: number): Key => ({ f, p, l, roll });
const s2 = (x: number) => Math.sin(x * 0.03) * 18;
export const SHOTS: Shot[] = [
  { id: "fall", Scene: S.SFall, line: 0, fov: 50, bokeh: 2.4, keys: [K(0, [3.4, -2.6, 7.6], [0.6, 1.3, 0], -0.08), K(0.5, [1.6, 1.0, 5.2], [0.7, 1.4, 0]), K(1, [0.9, 3.6, 4.6], [0.6, -2.0, -1], 0.04)] },
  { id: "canopy", Scene: S.SCanopy, line: 1, fov: 55, bokeh: 0.6, keys: [K(0, [30, 96, 82], [6, 40, 10]), K(1, [15, 38, 44], [6, 3, 6])] },
  { id: "alone", Scene: S.SAlone, line: 2, fov: 46, bokeh: 2.2, keys: [K(0, [1.2, 1.7, 3.8], [1.0, 1.55, 0]), K(1, [0.4, 5.2, 15.5], [0.5, 2.6, 0])] },
  { id: "airport", Scene: S.SAirport, line: 3, fov: 50, bokeh: 2.6, keys: [K(0, [-9, 2.0, 8.5], [-3, 1.9, -2]), K(1, [-2.5, 2.5, 7.4], [0.2, 2.3, -3])] },
  { id: "flight", Scene: S.SFlight, line: 3, word: "fly", fov: 48, bokeh: 1.2, keys: [K(0, [-13, 3.4, 18], [1, 0, 0]), K(0.5, [-4, 1.0, 15.5], [1, 0, 0]), K(1, [6, -1.6, 14], [0, 0.5, 0])] },
  { id: "cabin", Scene: S.SCabinStorm, line: 4, fov: 50, bokeh: 2.6, keys: [K(0, [0.2, 2.25, 4.8], [2.0, 1.55, 0]), K(1, [1.0, 1.95, 2.6], [2.6, 1.6, 0])] },
  { id: "strike", Scene: S.SStrike, line: 5, fov: 50, bokeh: 1.4, shake: 1, keys: [K(0, [-8, 3, 17], [0, 0, 1]), K(1, [1, 1.6, 13], [0, -0.3, 1])] },
  { id: "mom", Scene: S.SMom, line: 6, fov: 42, bokeh: 3.0, keys: [K(0, [2.2, 1.85, 3.8], [2.45, 1.62, 0]), K(1, [2.45, 1.75, 1.55], [2.45, 1.66, 0])] },
  { id: "wake", Scene: S.SWake, line: 7, fov: 48, bokeh: 2.6, day: "DAY 1", keys: [K(0, [1.4, 6.6, 5.6], [1.0, 1.2, 0]), K(1, [1.5, 2.1, 4.1], [1.0, 1.65, 0])] },
  { id: "hurt", Scene: S.SHurt, line: 8, fov: 44, bokeh: 3.0, keys: [K(0, [1.4, 1.95, 3.2], [1.05, 1.8, 0]), K(0.5, [1.7, 1.5, 3.1], [1.4, 0.9, 0.6]), K(1, [2.4, 0.8, 3.2], [1.95, 0.1, 1.2])] },
  { id: "gone", Scene: S.SGone, line: 9, fov: 50, bokeh: 2.2, keys: [K(0, [-7, 4.2, 11], [0, 1.2, 0]), K(1, [-3, 3.0, 9.2], [0.8, 1.3, 0])] },
  { id: "candy", Scene: S.SCandy, line: 9, word: "all", fov: 44, bokeh: 3.2, keys: [K(0, [2.6, 1.3, 5.2], [1.5, 1.35, 2.6]), K(1, [2.0, 1.55, 4.3], [1.3, 1.5, 2.6])] },
  { id: "think", Scene: S.SThink, line: 10, fov: 42, bokeh: 3.2, day: "DAY 2", keys: [K(0, [1.0, 2.1, 6.6], [0.4, 1.95, 2.6]), K(1, [0.5, 2.05, 4.8], [0.4, 2.0, 2.6])] },
  { id: "parents", Scene: S.SParents, line: 11, fov: 48, bokeh: 2.6, memory: true, keys: [K(0, [-3, 2.6, 9], [0.8, 1.6, 0.8]), K(1, [3, 2.2, 8.5], [1.2, 1.6, 0.8])] },
  { id: "rule1", Scene: S.SRule1, line: 12, fov: 46, bokeh: 2.6, memory: true, keys: [K(0, [3.8, 2.6, 7.4], [0.4, 1.2, 0.4]), K(1, [1.6, 2.4, 6.0], [0.2, 1.3, 0.6])] },
  { id: "rule2", Scene: S.SRule2, line: 12, word: "small", fov: 55, bokeh: 0.6, memory: true, keys: [K(0, [-120, 30, s2(-120) + 25], [-90, 0, s2(-90)]), K(0.5, [-20, 40, 30], [20, 0, 0]), K(1, [70, 30, s2(70) + 50], [96, 0, s2(96) + 14])] },
  { id: "stream", Scene: S.SStream, line: 13, fov: 48, bokeh: 2.4, keys: [K(0, [-1.8, 2.9, 7.8], [-1.6, 1.0, 0.8]), K(1, [1.8, 2.8, 7.2], [1.4, 1.1, 0.8])] },
  { id: "wade", Scene: S.SWade, line: 14, fov: 46, bokeh: 2.8, day: "DAY 5", keys: [K(0, [1.3, 1.38, 4.4], [0.3, 1.6, -3]), K(1, [0.7, 1.28, 3.0], [0.3, 1.6, -1.5])] },
  { id: "planeup", Scene: S.SPlaneUp, line: 15, fov: 54, bokeh: 1.4, keys: [K(0, [1.4, 1.2, 4.2], [0, 4.5, -6]), K(1, [0.9, 1.1, 3.6], [-1, 6, -8])] },
  { id: "aerial", Scene: S.SAerial, line: 15, word: "they", fov: 52, bokeh: 0.6, keys: [K(0, [-40, 60, 40], [0, 10, 0]), K(1, [-10, 55, 36], [18, 14, 0])] },
  { id: "empty", Scene: S.SEmpty, line: 16, fov: 44, bokeh: 3.0, keys: [K(0, [1.6, 2.1, 17.8], [0.5, 1.95, 12.9]), K(1, [1.0, 2.05, 16.2], [0.5, 2.0, 12.9])] },
  { id: "weak", Scene: S.SWeak, line: 17, fov: 46, bokeh: 2.6, day: "DAY 9", keys: [K(0, [-2.8, 2.0, 18.4], [-1.8, 1.8, 12.4]), K(1, [1.4, 2.0, 18.0], [0.9, 1.8, 12.4])] },
  { id: "reveal", Scene: S.SReveal, line: 18, fov: 46, bokeh: 1.8, keys: [K(0, [-7.5, 1.6, 0], [-6.5, 1.0, -12]), K(0.45, [-4, 2.0, 0.5], [-1.6, 1.6, -16]), K(1, [0, 2.8, 2], [3.6, 2.6, -19.5])] },
  { id: "pour", Scene: S.SPour, line: 19, fov: 44, bokeh: 3.0, keys: [K(0, [1.7, 1.9, 4.9], [0.3, 1.5, 0.6]), K(1, [1.0, 1.8, 3.7], [0.4, 1.55, 0.6])] },
  { id: "tally", Scene: S.STally, line: 20, fov: 44, bokeh: 2.6, keys: [K(0, [0.7, 1.8, 3.9], [0.2, 1.6, -0.5]), K(1, [0.2, 2.0, 4.5], [0.1, 1.8, -0.9])] },
  { id: "yousee", Scene: S.SYouSee, line: 21, fov: 50, bokeh: 1.0, keys: [K(0, [1.3, 2.2, 6.2], [0.6, 1.2, 0]), K(0.4, [0.6, 14, 10], [0.2, 2, 0]), K(1, [0, 62, 45], [0, 20, -10])] },
  { id: "thick", Scene: S.SThick, line: 22, fov: 50, bokeh: 0.6, keys: [K(0, [-6, 37, 16], [4, 20, -20]), K(1, [-2, 36, 14], [8, 18, -24])] },
  { id: "moving", Scene: S.SMoving, line: 23, fov: 46, bokeh: 2.6, keys: [K(0, [1.4, 1.4, 3.8], [0.4, 1.7, -4]), K(1, [0.9, 1.5, 3.0], [0.4, 1.8, -2])] },
  { id: "loggers", Scene: S.SLoggers, line: 24, fov: 48, bokeh: 2.4, day: "DAY 10", keys: [K(0, [0.5, 2.2, 8.2], [0.8, 1.5, 0]), K(1, [1.4, 2.0, 6.6], [0.9, 1.5, 0])] },
  { id: "polite", Scene: S.SPolite, line: 25, fov: 44, bokeh: 2.8, keys: [K(0, [-1.6, 1.8, 4.2], [-0.6, 1.7, 0.3]), K(1, [0.4, 1.9, 4.6], [0.4, 1.7, 0.3])] },
  { id: "boat", Scene: S.SBoat, line: 26, fov: 48, bokeh: 2.2, keys: [K(0, [-3, 1.6, 7.2], [0, 1.4, 0.6]), K(1, [2.5, 1.5, 6.8], [0.5, 1.4, 0.6])] },
  { id: "reunion", Scene: S.SReunion, line: 26, word: "and", fov: 44, bokeh: 3.0, keys: [K(0, [3.2, 1.8, 7.2], [0.7, 1.75, 1.4]), K(1, [1.7, 1.9, 5.2], [0.75, 1.85, 1.4])] },
  { id: "board", Scene: S.SBoard, line: 27, fov: 44, bokeh: 2.6, keys: [K(0, [-1.4, 2.3, 6.8], [-3.4, 2.3, 1.6]), K(1, [-2.5, 2.3, 5.2], [-3.4, 2.35, 1.6])] },
  { id: "today", Scene: S.SToday, line: 28, fov: 48, bokeh: 2.4, keys: [K(0, [0, 2.0, 7.2], [2.6, 1.8, 1.4]), K(1, [3.3, 2.0, 6.5], [3.0, 1.9, 1.4])] },
  { id: "final", Scene: S.SFinal, line: 29, fov: 50, bokeh: 1.2, keys: [K(0, [2.8, 2.0, 6.2], [2.4, 1.8, 1.6]), K(0.4, [1, 14, 15], [0, 4, 0]), K(1, [0, 46, 42], [0, 22, -20])] },
];

export const FPS = 30;
const LEAD = 0.1;
const VOICE_END = (timing as any).total as number;
export const JUL_TOTAL = VOICE_END + 1.6;     // ta-ding tail
const starts = SHOTS.map((s, i) => (i === 0 ? 0 : Math.max(0, (s.word ? wordAbs(s.line, s.word) : SEN[s.line].start) - LEAD)));
const ends = starts.map((_, i) => (i + 1 < starts.length ? starts[i + 1] : JUL_TOTAL));
export const SHOT_TIMES = starts.map((s, i) => ({ start: s, end: ends[i] }));

const warpU = (T: number[], t: number) => {
  const n = T.length; if (t <= T[0]) return 0; if (t >= T[n - 1]) return 1;
  const sec: number[] = []; for (let i = 0; i < n - 1; i++) sec.push(1 / (n - 1) / (T[i + 1] - T[i]));
  const m = [0]; for (let i = 1; i < n - 1; i++) m.push((2 * sec[i - 1] * sec[i]) / (sec[i - 1] + sec[i])); m.push(0);
  let i = 0; while (t > T[i + 1]) i++;
  const h = T[i + 1] - T[i], x = (t - T[i]) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] + (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1];
};
const curves = SHOTS.map((s) => ({ pos: new THREE.CatmullRomCurve3(s.keys.map((k) => new THREE.Vector3(...k.p)), false, "centripetal"), look: new THREE.CatmullRomCurve3(s.keys.map((k) => new THREE.Vector3(...k.l)), false, "centripetal"), T: s.keys.map((k) => k.f) }));
const cameraFor = (shot: number, local: number, dur: number) => {
  const c = curves[shot]; const u = clamp(warpU(c.T, clamp(local / dur))); const p = c.pos.getPoint(u), l = c.look.getPoint(u);
  const keys = SHOTS[shot].keys; let roll = 0; const f = clamp(local / dur);
  for (let i = 0; i < keys.length - 1; i++) if (f >= keys[i].f && f <= keys[i + 1].f) { const k = (f - keys[i].f) / Math.max(1e-6, keys[i + 1].f - keys[i].f); roll = (keys[i].roll ?? 0) * (1 - k) + (keys[i + 1].roll ?? 0) * k; }
  // hand-held drift (tiny), stronger on shaky shots
  const sh = SHOTS[shot].shake ?? 0;
  p.x += Math.sin(local * 1.3 + shot) * 0.012 + Math.sin(local * 23) * 0.03 * sh; p.y += Math.sin(local * 1.9 + shot) * 0.01 + Math.sin(local * 19 + 1) * 0.03 * sh;
  return { p, l, roll };
};
const shotAt = (t: number) => { let i = SHOT_TIMES.findIndex((s) => t >= s.start && t < s.end); if (i < 0) i = t < 0 ? 0 : SHOT_TIMES.length - 1; return i; };
const Rig: React.FC<{ p: THREE.Vector3; l: THREE.Vector3; roll: number; fov: number }> = ({ p, l, roll, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = fov; camera.near = 0.1; camera.far = 600; camera.updateProjectionMatrix(); camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(l); camera.rotateZ(roll); camera.updateMatrixWorld(); });
  return null;
};

/* ---- captions: the exact script words, 1-4 at a time ---- */
type W = [string, number, number];
const WORDS: W[] = SEN.flatMap((s) => s.words.map((w) => [w.w, w.t0, w.t1] as W));
const PAGES = (() => {
  const pages: { words: W[]; s: number; e: number }[] = []; let cur: W[] = [];
  const flush = () => { if (cur.length) { pages.push({ words: cur, s: cur[0][1], e: cur[cur.length - 1][2] }); cur = []; } };
  WORDS.forEach((w) => { const prev = cur[cur.length - 1]; if (prev && (cur.length >= 4 || /[.,?!:"]$/.test(prev[0]) || w[1] - prev[2] > 0.35 || (cur.map((x) => x[0]).join(" ").length + w[0].length > 22))) flush(); cur.push(w); });
  flush(); return pages;
})();
const HOT = /^(alone|two|miles|amazon|lightning|storm|end|over|candy|water|rivers|people|stingrays|maggots|gasoline|thirty|counts|loggers|politely|plane|ninety-two|only|biologist|jungle|juliane|christmas|seventeen-year-old|nineteen|seventy-one|rule|mom|dad|hut|boat|path)/i;
const Captions: React.FC<{ t: number }> = ({ t }) => {
  let idx = -1; for (let i = 0; i < PAGES.length; i++) if (t >= PAGES[i].s - 0.04) idx = i; else break;
  if (idx < 0) return null; const pg = PAGES[idx]; if (t > pg.e + 0.35) return null;
  const k = clamp((t - pg.s + 0.04) / 0.1);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 84, pointerEvents: "none" }}>
      <div style={{ fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 88, color: "#fff", letterSpacing: 1.5, whiteSpace: "pre", WebkitTextStroke: "14px #1a0e10", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(26,14,16,.5)", transform: `scale(${0.88 + 0.12 * k})`, opacity: 0.35 + 0.65 * k }}>
        {pg.words.map((w, i) => <span key={i} style={{ color: HOT.test(w[0].replace(/^["']/, "")) ? "#ffd84a" : "#ffffff" }}>{(i ? " " : "") + w[0]}</span>)}
      </div>
    </AbsoluteFill>
  );
};
/* ---- DAY titles: a carved wooden plaque that stamps in at the top left ---- */
const DayTitle: React.FC<{ text: string; local: number }> = ({ text, local }) => {
  const a = clamp(local / 0.22), b = 1 - clamp((local - 2.0) / 0.35); if (b <= 0) return null;
  const sc = 1.35 - 0.35 * (1 - Math.pow(1 - a, 3));
  return <div style={{ position: "absolute", left: 70, top: 60, transform: `scale(${sc}) rotate(-3deg)`, transformOrigin: "0 0", opacity: a * b }}>
    <div style={{ padding: "14px 34px 10px", background: "linear-gradient(180deg,#a8743e,#7a4e26)", border: "6px solid #2a1a10", borderRadius: 14, boxShadow: "0 10px 0 rgba(26,14,16,.45), inset 0 3px 0 rgba(255,230,180,.35)", fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 78, color: "#fff3d6", letterSpacing: 3, WebkitTextStroke: "8px #2a1a10", paintOrder: "stroke fill" }}>{text}</div>
  </div>;
};

export const Juliane: React.FC<{ captions?: boolean; audio?: boolean }> = ({ captions = true, audio = true }) => {
  const [fontsOk, setFontsOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setFontsOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const t = frame / fps;
  const si = shotAt(t); const shot = SHOTS[si]; const { start, end } = SHOT_TIMES[si]; const local = t - start; const dur = end - start;
  const { p, l, roll } = cameraFor(si, local, dur); const dist = p.distanceTo(l);
  const at = React.useCallback((line: number, word: string) => wordAbs(line, word) - start, [start]);
  if (!fontsOk) return <AbsoluteFill style={{ backgroundColor: "#000" }} />;
  const Scene = shot.Scene;
  const flash = si > 0 && !shot.day ? Math.max(0, 1 - local / 0.18) * 0.35 : 0;
  const punch = si > 0 ? 1 + 0.035 * Math.pow(Math.max(0, 1 - local / 0.3), 2) : 1;
  // fade to black after her mother's last words, fade back in on DAY 1
  const momEnd = SEN[6].end; const black = Math.max(clamp((t - momEnd - 0.05) / 0.6) * (t < SHOT_TIMES[8].start ? 1 : 0), shot.id === "wake" ? 1 - clamp(local / 0.7) : 0, t < 0.25 ? 1 - t / 0.25 : 0);
  const grade = shot.memory ? "sepia(0.42) saturate(0.85) brightness(1.06) contrast(0.96)" : shot.id === "strike" || shot.id === "fall" ? "saturate(0.9) contrast(1.06)" : "saturate(1.08) contrast(1.04)";
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})`, transformOrigin: "50% 50%", filter: grade }}>
        <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: shot.fov ?? 50, near: 0.1, far: 600, position: [p.x, p.y, p.z] }} gl={{ antialias: true }}>
          <Rig p={p} l={l} roll={roll} fov={shot.fov ?? 50} />
          <Scene key={si} t={local} dur={dur} at={at} />
          <PostFX focus={dist} range={Math.max(2.5, dist * 0.55)} bokeh={shot.bokeh ?? 2.6} frame={frame} grain={0.22} />
        </ThreeCanvas>
      </AbsoluteFill>
      {shot.memory ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(255,230,180,0) 50%, rgba(90,60,30,.55) 100%)", pointerEvents: "none" }} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "#fff6e0", opacity: flash }} /> : null}
      {black > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: black }} /> : null}
      {shot.day ? <DayTitle text={shot.day} local={local} /> : null}
      {captions ? <Captions t={t} /> : null}
      {audio ? <Audio src={staticFile("juliane_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
