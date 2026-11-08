import * as THREE from "three";
import React, { useEffect, useLayoutEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "./PostFX";
import { HotelScene, guestLocal, BASE_Y, LIFT } from "./scene";
import { clamp } from "./kit";

/* ---- words, timed to the narration (estimated at ~3.35 words/second until the real voice-over exists) ---- */
export const WORDS: { w: string; s: number }[] = [
  { w: "A", s: 0.0 }, { w: "Chicago", s: 0.14 }, { w: "hotel", s: 0.58 },
  { w: "was", s: 0.98 }, { w: "lifted", s: 1.12 },
  { w: "six", s: 1.72 }, { w: "feet", s: 2.02 },
  { w: "into", s: 2.42 }, { w: "the", s: 2.62 }, { w: "air", s: 2.78 },
  { w: "with", s: 3.22 }, { w: "every", s: 3.46 }, { w: "guest", s: 3.86 },
  { w: "still", s: 4.2 }, { w: "inside.", s: 4.5 },
];
const PAGES = [[0, 3], [3, 5], [5, 7], [7, 10], [10, 13], [13, 15]];

/* ---- camera path (positions + look-at points at beat times) ---- */
const g = guestLocal();
const KEYS = [
  { t: 0.0, p: [-1.4, 1.15, 10.4], l: [0.1, 3.0, 0.0] },
  { t: 1.15, p: [-2.9, 1.8, 6.5], l: [-1.4, 2.3, 0.3] },
  { t: 2.0, p: [-3.0, 3.5, 9.0], l: [-3.0, 3.5, 0.0] },
  { t: 3.86, p: [0.6, 9.8, 10.8], l: [1.3, 11.0, 0.0] },
  { t: 5.0, p: [1.35, 12.7, 4.8], l: [1.3, 12.95, 0.0] },
] as const;

/** monotone cubic time warp: reaches each key exactly at its beat time, zero speed at both ends */
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
  return (
    (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] +
    (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1]
  );
};

const posCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.p)), false, "centripetal");
const lookCurve = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.l)), false, "centripetal");
const TIMES = KEYS.map((k) => k.t);

export const cameraAt = (t: number) => {
  const u = clamp(warpU(TIMES, t));
  const p = posCurve.getPoint(u);
  const l = lookCurve.getPoint(u);
  // a very small natural sway
  p.x += Math.sin(t * 1.7) * 0.012;
  p.y += Math.sin(t * 2.3) * 0.01;
  return { p, l };
};

const Rig: React.FC<{ t: number }> = ({ t }) => {
  const camera = useThree((s) => s.camera);
  const { p, l } = cameraAt(t);
  useLayoutEffect(() => {
    camera.position.copy(p);
    camera.lookAt(l);
    camera.updateMatrixWorld();
  });
  return null;
};

/** Runs after the post-processing composer has subscribed, so the composer actually draws this frame. */
const AdvanceLast: React.FC<{ frame: number }> = ({ frame }) => {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    advance(performance.now());
  }, [frame, advance]);
  return null;
};

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const page = PAGES.find(([a, b], i) => t >= WORDS[a].s && (i === PAGES.length - 1 || t < WORDS[PAGES[i + 1][0]].s));
  if (!page) return null;
  const [a, b] = page;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300, pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: '"Arial Black", Impact, "Helvetica Neue", sans-serif',
          fontSize: 92,
          fontWeight: 900,
          color: "#fff",
          letterSpacing: 1,
          whiteSpace: "pre",
          WebkitTextStroke: "14px #1a0e10",
          paintOrder: "stroke fill",
          textShadow: "0 8px 0 rgba(26,14,16,.55)",
        }}
      >
        {WORDS.slice(a, b).map((x) => x.w).join(" ")}
      </div>
    </AbsoluteFill>
  );
};

export const HotelHook: React.FC<{ captions?: boolean }> = ({ captions = true }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const { p, l } = cameraAt(t);
  const dist = p.distanceTo(l);

  return (
    <AbsoluteFill style={{ backgroundColor: "#9bd1f2" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        flat
        camera={{ fov: 78, near: 0.1, far: 200, position: [p.x, p.y, p.z] }}
        gl={{ antialias: true }}
      >
        <Rig t={t} />
        <HotelScene t={t} cam={[p.x, p.y, p.z]} />
        <PostFX focus={dist} range={Math.max(2.5, dist * 0.55)} bokeh={3.2} frame={frame} />
      </ThreeCanvas>
      {captions ? <Captions t={t} /> : null}
    </AbsoluteFill>
  );
};
