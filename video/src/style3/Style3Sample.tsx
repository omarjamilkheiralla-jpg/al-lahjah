import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { loadFonts } from "../full/fonts";
import { PostFX } from "../hotel/PostFX";
import { box, cyl, ico, cone, sph, plane, M, BM, Mesh, Human, BEN, GARY, GREYP, walkPose, seeded, ease, clamp, lerp, type V3, type Pose, type Expr } from "./kit";

/** STYLE 3 sample: "What if your luck doubled every minute?" 4 quick scenarios, about 2.5 s each, 10 s total. */
export const FPS = 30;
export const S3_TOTAL = 10;
const SD = 2.5;
type Sc = { luck: string; tier: string; minute: number; cap: string; shout: number };
const SCS: Sc[] = [
  { luck: "1", tier: "AN AVERAGE DAY", minute: 1, cap: "Walks outside. Finds a coin.", shout: 1.55 },
  { luck: "2", tier: "GREEN LIGHTS", minute: 2, cap: "Every light is green.", shout: 1.7 },
  { luck: "4", tier: "FREE COFFEE", minute: 3, cap: "Catches coffee without looking.", shout: 1.7 },
  { luck: "8", tier: "BIRDS HAVE AIM", minute: 4, cap: "The pigeon changed its mind.", shout: 1.7 },
];
const TONE = [
  { sky: "#a9dcf5", fog: "#cfe8f2", sun: "#fff1d6", hemi: "#fff0d8" },
  { sky: "#a2d3ee", fog: "#d6e4ea", sun: "#ffe9c4", hemi: "#ffeccc" },
  { sky: "#f2c9a0", fog: "#efd2b4", sun: "#ffd29a", hemi: "#ffe0c0" },
  { sky: "#f0a67e", fog: "#e8b898", sun: "#ffb878", hemi: "#ffd0a8" },
];

/* ------------------------------------------------------------------ street world (static, memoised) */
const BCOL = ["#e59a86", "#efc088", "#e8dcb0", "#c06a50", "#9ccdb2", "#8fb0d8", "#e8a8b8", "#d9b070"];
const TRIM = "#f4ecd8";
const Facade: React.FC<{ x: number; w: number; h: number; col: string; side: 1 | -1; seed: number }> = React.memo(({ x, w, h, col, side, seed }) => {
  const r = seeded(seed); const cols = Math.max(1, Math.floor(w / 1.9)); const floors = Math.max(1, Math.floor((h - 3.4) / 2.5));
  const stripes = ["#d8483a", "#f4ecd8", "#e8b030", "#3f8a5a"][seed % 4];
  return (
    <group position={[x, 0, side > 0 ? -4 : 14]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
      <Mesh g={box(w, h, 6)} m={M(col, { map: seed % 2 ? "brick" : "plaster", rx: w / 2, ry: h / 2 })} p={[0, h / 2, -3]} cast={false} />
      <Mesh g={box(w + 0.3, 0.45, 0.5)} m={M(TRIM, { map: "plaster", rx: 2, ry: 1 })} p={[0, h + 0.05, 0.05]} cast={false} />
      <Mesh g={box(w + 0.2, 0.18, 0.3)} m={M(TRIM, { map: "plaster", rx: 2, ry: 1 })} p={[0, 3.2, 0.1]} cast={false} />
      {Array.from({ length: cols }, (_, c) => {
        const cx = -w / 2 + (c + 0.5) * (w / cols);
        return (
          <group key={c}>
            {Array.from({ length: floors }, (_, f) => (
              <group key={f} position={[cx, 4.6 + f * 2.5, 0.03]}>
                <Mesh g={box(1.15, 1.55, 0.12)} m={M(TRIM, { map: "plaster" })} cast={false} />
                <Mesh g={plane(0.92, 1.3)} m={BM(r() < 0.35 ? "#ffd98a" : "#7fb0d0")} p={[0, 0, 0.07]} cast={false} recv={false} />
                <Mesh g={box(0.08, 1.3, 0.04)} m={M(TRIM)} p={[0, 0, 0.1]} cast={false} />
                <Mesh g={box(0.92, 0.06, 0.04)} m={M(TRIM)} p={[0, 0.1, 0.1]} cast={false} />
                <Mesh g={box(1.3, 0.1, 0.3)} m={M("#d8d0bc", { map: "plaster" })} p={[0, -0.82, 0.12]} cast={false} />
                {r() < 0.4 ? <><Mesh g={box(1.1, 0.2, 0.26)} m={M("#6a4a30", { map: "wood" })} p={[0, -0.64, 0.24]} cast={false} /><Mesh g={ico(0.2, 0)} m={M(r() < 0.5 ? "#e86a8a" : "#f2c316")} p={[-0.3, -0.5, 0.26]} cast={false} /><Mesh g={ico(0.2, 0)} m={M("#3f9a4a")} p={[0.05, -0.48, 0.26]} cast={false} /><Mesh g={ico(0.2, 0)} m={M(r() < 0.5 ? "#e86a8a" : "#fff")} p={[0.35, -0.5, 0.26]} cast={false} /></> : null}
              </group>
            ))}
            {c % 2 === 0 ? (
              <group position={[cx, 0, 0.05]}>
                <Mesh g={box(1.6, 2.2, 0.1)} m={BM(r() < 0.5 ? "#ffe6a8" : "#9fd0e8")} p={[0, 1.55, 0.04]} cast={false} recv={false} />
                <Mesh g={box(1.75, 0.12, 0.14)} m={M("#3a2e2a", { map: "wood" })} p={[0, 2.68, 0.1]} cast={false} /><Mesh g={box(1.75, 0.12, 0.14)} m={M("#3a2e2a", { map: "wood" })} p={[0, 0.42, 0.1]} cast={false} />
                {Array.from({ length: 6 }, (_, i) => <Mesh key={i} g={box(0.28, 0.5, 1.5)} m={M(i % 2 ? stripes : "#f4ecd8", { map: "fabric" })} p={[-0.72 + i * 0.29, 2.95, 0.7]} r={[0.5, 0, 0]} cast />)}
              </group>
            ) : (
              <group position={[cx, 0, 0.05]}><Mesh g={box(1.1, 2.3, 0.12)} m={M("#7a4a30", { map: "wood", rx: 1, ry: 2 })} p={[0, 1.15, 0.05]} cast={false} /><Mesh g={ico(0.06, 0)} m={M("#e8c050", { metal: 0.6, rough: 0.4 })} p={[0.38, 1.1, 0.14]} cast={false} /></group>
            )}
          </group>
        );
      })}
    </group>
  );
});
const Tree: React.FC<{ p: V3; s?: number }> = React.memo(({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Mesh g={cyl(0.12, 0.2, 1.6, 6)} m={M("#6a4a32", { map: "wood", rx: 1, ry: 2 })} p={[0, 0.8, 0]} />
    <Mesh g={ico(0.95, 1)} m={M("#4a9a48", { map: "grass", rx: 1, ry: 1 })} p={[0, 2.2, 0]} s={[1, 0.9, 1]} />
    <Mesh g={ico(0.7, 1)} m={M("#5aab52", { map: "grass" })} p={[0.45, 2.75, 0.1]} />
    <Mesh g={ico(0.6, 1)} m={M("#3f8a40", { map: "grass" })} p={[-0.45, 2.55, -0.1]} />
  </group>
));
const Lamp: React.FC<{ p: V3 }> = React.memo(({ p }) => (
  <group position={p}>
    <Mesh g={cyl(0.07, 0.1, 4.2, 6)} m={M("#2f3a46", { map: "metal", metal: 0.4, rough: 0.5 })} p={[0, 2.1, 0]} />
    <Mesh g={box(0.9, 0.08, 0.08)} m={M("#2f3a46")} p={[0.4, 4.15, 0]} />
    <Mesh g={cyl(0.18, 0.28, 0.2, 6)} m={M("#2f3a46")} p={[0.8, 4.05, 0]} />
    <Mesh g={sph(0.12)} m={BM("#fff2c0")} p={[0.8, 3.93, 0]} cast={false} recv={false} />
  </group>
));
const ParkedCar: React.FC<{ p: V3; col: string; rot?: number }> = React.memo(({ p, col, rot = 0 }) => (
  <group position={p} rotation={[0, rot, 0]}>
    <Mesh g={box(4.2, 0.7, 1.8)} m={M(col, { rough: 0.35, metal: 0.25 })} p={[0, 0.65, 0]} />
    <Mesh g={box(2.2, 0.62, 1.64)} m={M(col, { rough: 0.35, metal: 0.25 })} p={[-0.2, 1.3, 0]} />
    <Mesh g={box(2.0, 0.46, 1.68)} m={BM("#8fc4e0")} p={[-0.2, 1.32, 0]} cast={false} recv={false} />
    {[-1.3, 1.3].map((x, i) => [-0.9, 0.9].map((z, j) => <Mesh key={`${i}${j}`} g={cyl(0.38, 0.38, 0.28, 10)} m={M("#222228", { rough: 0.9 })} p={[x, 0.38, z]} r={[Math.PI / 2, 0, 0]} />))}
    {[-0.6, 0.6].map((z, i) => <Mesh key={i} g={box(0.08, 0.2, 0.34)} m={BM("#fff4c0")} p={[2.12, 0.78, z]} cast={false} recv={false} />)}
  </group>
));
const Street: React.FC = React.memo(() => {
  const near: [number, number][] = []; let x = -30; let i = 0; const r = seeded(77);
  while (x < 34) { const w = 5 + Math.floor(r() * 3); near.push([x + w / 2, w]); x += w; i++; }
  return (
    <group>
      <Mesh g={box(200, 0.12, 60)} m={M("#8a8f98", { map: "asphalt", rx: 40, ry: 12 })} p={[0, -0.06, 4]} cast={false} />
      <Mesh g={box(200, 0.16, 6.2)} m={M("#c8c2b4", { map: "tiles", rx: 60, ry: 2 })} p={[0, 0.0, -0.9]} />
      <Mesh g={box(200, 0.2, 0.25)} m={M("#9a9486", { map: "plaster", rx: 60, ry: 1 })} p={[0, 0.0, 2.3]} />
      <Mesh g={box(200, 0.16, 4)} m={M("#c8c2b4", { map: "tiles", rx: 60, ry: 2 })} p={[0, 0.0, 11]} />
      {Array.from({ length: 28 }, (_, k) => <Mesh key={k} g={box(1.6, 0.02, 0.18)} m={M("#f0d24a")} p={[-34 + k * 2.6, 0.01, 5.6]} cast={false} />)}
      {[3, 12].map((cx) => Array.from({ length: 7 }, (_, k) => <Mesh key={`${cx}${k}`} g={box(0.45, 0.02, 3.8)} m={M("#f2f2f2")} p={[cx + k * 0.9, 0.01, 5.6]} cast={false} />))}
      {near.map(([cx, w], k) => <Facade key={`n${k}`} x={cx} w={w} h={9 + ((k * 5) % 6)} col={BCOL[k % BCOL.length]} side={1} seed={k + 3} />)}
      {near.map(([cx, w], k) => <Facade key={`f${k}`} x={cx} w={w} h={9 + ((k * 3) % 7)} col={BCOL[(k + 3) % BCOL.length]} side={-1} seed={k + 40} />)}
      {Array.from({ length: 12 }, (_, k) => ({ x: -26 + k * 5.4 + (k % 2) * 0.8, k })).filter((q) => q.x < -6 || q.x > 8.5).map((q) => <Tree key={q.k} p={[q.x, 0.08, 1.9]} s={0.9 + (q.k % 3) * 0.1} />)}
      {[-24, -13.5, -3.0, 18, 28].map((x, k) => <Lamp key={k} p={[x, 0.08, 2.1]} />)}
      <ParkedCar p={[-9, 0.06, 3.3]} col="#d8483a" /><ParkedCar p={[7.5, 0.06, 3.4]} col="#2f6aa8" /><ParkedCar p={[-17, 0.06, 3.3]} col="#e8b030" rot={Math.PI} />
      {Array.from({ length: 8 }, (_, k) => <Mesh key={k} g={box(2.4 + (k % 3), 7 + (k * 3) % 9, 3)} m={M("#c9d3de", { map: "plaster", rx: 2, ry: 3 })} p={[-26 + k * 8, 12 + (k * 3) % 9 / 2 + 6, -26]} cast={false} />)}
    </group>
  );
});

/* ------------------------------------------------------------------ props */
const Coin: React.FC<{ p: V3; t: number; r?: number }> = ({ p, t, r = 0 }) => (
  <group position={p} rotation={[Math.PI / 2 + Math.sin(t * 8) * 0.3 + r, t * 9, 0]}><Mesh g={cyl(0.11, 0.11, 0.025, 14)} m={M("#ffc83a", { metal: 0.7, rough: 0.25, emissive: "#ff9a10", ei: 0.35 })} /></group>
);
const Glint: React.FC<{ p: V3; k: number }> = ({ p, k }) => <group position={p} scale={k}><Mesh g={box(0.5, 0.04, 0.04)} m={BM("#fff8c8")} cast={false} recv={false} /><Mesh g={box(0.04, 0.5, 0.04)} m={BM("#fff8c8")} cast={false} recv={false} /></group>;
const Cone: React.FC<{ ball?: boolean }> = ({ ball = true }) => <group><Mesh g={cone(0.06, 0.2, 6)} m={M("#d8a050", { map: "wood" })} p={[0, 0.05, 0]} r={[Math.PI, 0, 0]} />{ball ? <Mesh g={ico(0.085, 1)} m={M("#ff8fb8")} p={[0, 0.2, 0]} /> : null}</group>;
const Umbrella: React.FC = () => <group position={[0, 0.02, 0]}><Mesh g={cyl(0.012, 0.012, 0.7, 5)} m={M("#2c2c32")} p={[0, 0.3, 0]} /><Mesh g={cone(0.34, 0.14, 8)} m={M("#d8483a", { map: "fabric" })} p={[0, 0.7, 0]} /></group>;
const TLight: React.FC<{ p: V3; green: number; red?: boolean }> = ({ p, green, red }) => (
  <group position={p}>
    <Mesh g={cyl(0.07, 0.09, 3.2, 6)} m={M("#2f3a46", { map: "metal", metal: 0.4 })} p={[0, 1.6, 0]} />
    <Mesh g={box(0.4, 1.1, 0.3)} m={M("#242a32", { map: "metal", metal: 0.4 })} p={[0, 3.3, 0]} />
    <Mesh g={sph(0.12)} m={BM(red ? "#ff3a2a" : green > 0.5 ? "#2c1010" : "#ff3a2a")} p={[0, 3.62, 0.16]} cast={false} recv={false} />
    <Mesh g={sph(0.12)} m={BM("#3a3418")} p={[0, 3.3, 0.16]} cast={false} recv={false} />
    <Mesh g={sph(0.12)} m={BM(!red && green > 0.5 ? "#3aff6a" : "#0f2a14")} p={[0, 2.98, 0.16]} cast={false} recv={false} />
    {!red && green > 0.5 ? <Mesh g={plane(0.8, 0.8)} m={BM("#44ff7a", { opacity: 0.5, add: true })} p={[0, 2.98, 0.4]} cast={false} recv={false} /> : null}
    {red ? <Mesh g={plane(1.2, 1.2)} m={BM("#ff3a2a", { opacity: 0.4, add: true })} p={[0, 3.62, 0.4]} cast={false} recv={false} /> : null}
  </group>
);
const Cup: React.FC = () => <group><Mesh g={cyl(0.065, 0.05, 0.16, 8)} m={M("#f4f4f0", { map: "fabric" })} /><Mesh g={cyl(0.07, 0.07, 0.025, 8)} m={M("#6a4630")} p={[0, 0.09, 0]} /><Mesh g={cyl(0.068, 0.068, 0.05, 8)} m={M("#c88a50", { map: "wood" })} p={[0, 0, 0]} /></group>;
const Pigeon: React.FC<{ p: V3; t: number; flap?: number }> = ({ p, t, flap = 0 }) => (
  <group position={p}>
    <Mesh g={ico(0.2, 1)} m={M("#98a0ac", { map: "fabric" })} s={[1.3, 0.9, 0.9]} />
    <group position={[0.22, 0.12, 0]}><Mesh g={ico(0.1, 1)} m={M("#7a8290")} /><Mesh g={cone(0.03, 0.09, 4)} m={M("#f0a030")} p={[0.1, -0.01, 0]} r={[0, 0, -Math.PI / 2]} /><Mesh g={sph(0.018, 6, 5)} m={BM("#101010")} p={[0.07, 0.03, 0.07]} /></group>
    {[-1, 1].map((k) => <group key={k} position={[0, 0.05, k * 0.13]} rotation={[k * (0.3 + flap * Math.sin(t * 40) * 0.9), 0, 0]}><Mesh g={box(0.3, 0.025, 0.2)} m={M("#848c98")} p={[-0.02, 0, k * 0.09]} /></group>)}
    <Mesh g={box(0.2, 0.03, 0.12)} m={M("#6f7784")} p={[-0.28, 0.0, 0]} />
  </group>
);
const Cloud: React.FC<{ p: V3; k: number; t: number }> = ({ p, k, t }) => {
  if (k <= 0.01) return null;
  return (
    <group position={p} scale={k}>
      {([[0, 0, 0, 0.55], [0.5, -0.05, 0.1, 0.42], [-0.5, -0.05, -0.1, 0.45], [0.2, 0.2, 0, 0.4]] as number[][]).map((c, i) => <Mesh key={i} g={ico(c[3], 1)} m={M("#6f7886", { map: "fabric", rough: 1 })} p={[c[0], c[1], c[2]]} cast={false} />)}
      {Array.from({ length: 14 }, (_, i) => { const y = -((t * 3.2 + i * 0.37) % 1.6); return <Mesh key={i} g={box(0.012, 0.22, 0.012)} m={BM("#bfe0ff", { opacity: 0.8 })} p={[((i * 37) % 11) / 11 * 1.0 - 0.5, y - 0.3, ((i * 53) % 7) / 7 * 0.5 - 0.25]} cast={false} recv={false} />; })}
    </group>
  );
};

/* ------------------------------------------------------------------ scenes */
const Cam = (keys: { t: number; p: V3; l: V3; fov?: number; roll?: number }[], s: number) => {
  let i = 0; while (i < keys.length - 2 && s > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(keys.length - 1, i + 1)]; const k = ease((s - a.t) / Math.max(1e-4, b.t - a.t));
  const m = (u: V3, v: V3): V3 => [lerp(u[0], v[0], k), lerp(u[1], v[1], k), lerp(u[2], v[2], k)];
  return { p: m(a.p, b.p), l: m(a.l, b.l), fov: lerp(a.fov ?? 50, b.fov ?? 50, k), roll: lerp(a.roll ?? 0, b.roll ?? 0, k) };
};
const FACE_X = Math.PI / 2, FACE_NX = -Math.PI / 2;
const gPose = (s: number, fall: boolean, dist: number): Pose => ({ ...walkPose(dist, 0.35), expr: "calm" });

const S1: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const bx = s < 0.8 ? -1.1 + s * 1.5 : 0.1; const walking = s < 0.8;
  const c = clamp((s - 0.8) / 0.25) * (1 - clamp((s - 1.25) / 0.3));
  const coinOnGround = s < 1.05;
  const toss = clamp((s - 1.5) / 0.7); const coinY = 1.55 + Math.sin(toss * Math.PI) * 0.9;
  const ballFall = clamp((s - 1.15) / 0.45); const ballY = lerp(1.1, 0.12, ballFall * ballFall);
  const shout = s > SCS[0].shout;
  const bp: Pose = walking ? { ...walkPose(bx, 0.5), expr: "calm" } : { crouch: c * 0.85, lean: c * 0.5, rArm: [-1.0 * c - 0.2 * (1 - c), 0.05], rElbow: 0.2, expr: s > 1.3 ? "smile" : "calm", headX: -c * 0.3, headY: s > 1.45 ? -0.3 : 0 };
  const held = s > 1.05 && s < 1.5;
  return (
    <>
      <Human look={BEN} p={[bx, 0.08, 0.9]} yaw={FACE_X} pose={bp} handR={held ? <Coin p={[0, -0.02, 0.05]} t={t} /> : undefined} />
      {coinOnGround ? <Coin p={[0.7, 0.2, 1.0]} t={t * 0.4} /> : null}
      {s >= 1.5 ? <Coin p={[0.32, coinY, 1.05]} t={t * 3} /> : null}
      {s > 1.05 && s < 1.5 ? <Glint p={[0.5, 0.9, 1.15]} k={1 - Math.abs((s - 1.2) / 0.3)} /> : null}
      <Human look={GARY} p={[2.4, 0.08, 0.7]} yaw={FACE_NX} pose={{ expr: shout ? "shout" : s > 1.2 ? "shock" : "smile", headY: 0.15, rArm: [-0.9, 0.2], rElbow: 0.9, lArm: [0.1, -0.1], bob: shout ? Math.abs(Math.sin(t * 22)) * 0.02 : 0 }} handR={<Cone ball={s < 1.15} />} />
      {s >= 1.15 ? <><Mesh g={ico(0.085, 1)} m={M("#ff8fb8")} p={[1.95 + ballFall * 0.1, ballY, 0.95]} />{ballFall >= 1 ? <Mesh g={cyl(0.2, 0.22, 0.02, 10)} m={M("#ff8fb8")} p={[2.05, 0.1, 0.95]} /> : null}</> : null}
      <Human look={GREYP(2)} p={[-3.4, 0.08, 4.4]} yaw={FACE_X} pose={walkPose(-3.4 + s * 1.2, 0.4)} s={1} />
    </>
  );
};
const S2: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const bx = -1.6 + 1.7 * s; const lx = [0.4, 1.8, 3.2]; const gt = [0.47, 1.29, 2.1];
  const shout = s > SCS[1].shout; const press = s > 0.3 && !shout && Math.sin(t * 16) > 0;
  return (
    <>
      <Human look={BEN} p={[bx, 0.08, 0.9]} yaw={FACE_X} pose={{ ...walkPose(bx, 0.45), expr: s > 1.2 ? "smug" : "calm", headY: 0.2 }} />
      {lx.map((x, i) => <TLight key={i} p={[x, 0.08, 1.9]} green={s > gt[i] ? 1 : 0} />)}
      <TLight p={[4.6, 0.08, 1.9]} green={0} red />
      <Human look={GARY} p={[4.3, 0.08, 0.75]} yaw={Math.PI * 0.7} pose={{ expr: shout ? "shout" : "annoyed", rArm: [press ? -1.3 : -1.0, 0.3], rElbow: press ? 0.6 : 0.9, lArm: shout ? [-2.6, -0.4] : [0, -0.1], headY: -0.1, bob: shout ? Math.abs(Math.sin(t * 22)) * 0.03 : 0 }} handL={undefined} />
      {s > 1.2 ? <Cloud p={[4.3, 3.0, 0.75]} k={ease((s - 1.2) / 0.4)} t={t} /> : null}
    </>
  );
};
const S3: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const bx = -0.2 + s * 0.35; const cupY = lerp(5.6, 1.15, clamp((s - 0.3) / 0.7) ** 2); const caught = s > 1.0;
  const shout = s > SCS[2].shout;
  const gFall = clamp((s - 1.0) / 0.5); const gY = lerp(2.4, 0.15, gFall * gFall);
  return (
    <>
      <Human look={BEN} p={[bx, 0.08, 0.9]} yaw={FACE_X * 0.75} pose={{ ...walkPose(bx * 3, 0.35), rArm: caught ? [-1.2, 0.15] : [-0.35, 0.1], rElbow: caught ? 1.0 : 0.3, expr: "smug", headY: 0.5, headX: -0.05 }} handR={caught ? <group position={[0, 0.05, 0]}><Cup /></group> : undefined} />
      {!caught ? <Mesh g={cyl(0.065, 0.05, 0.16, 8)} m={M("#f4f4f0")} p={[bx + 0.52, cupY, 1.15]} r={[s * 5, 0, s * 3]} /> : null}
      <Mesh g={box(1.5, 0.12, 0.5)} m={M("#3a2e2a", { map: "wood" })} p={[0.9, 4.1, 1.1]} />
      <Human look={GREYP(1)} p={[0.9, 4.18, 0.75]} yaw={0} pose={{ expr: "smile", rArm: [-1.5, 0], rElbow: 0.5 }} s={0.95} />
      <Human look={GARY} p={[2.6, 0.08, 0.9]} yaw={FACE_NX * 0.8} pose={{ expr: shout ? "shout" : "sad", rArm: [-0.8, 0.2], rElbow: 1.0, headX: gFall > 0.8 ? 0.35 : 0, bob: shout ? Math.abs(Math.sin(t * 22)) * 0.02 : 0 }} />
      {s > 1.0 ? <Mesh g={cyl(0.065, 0.05, 0.16, 8)} m={M("#f4f4f0")} p={[2.15, gY, 1.1]} r={[gFall >= 1 ? 1.4 : s * 4, 0, 0]} /> : null}
      {gFall >= 1 ? <Mesh g={cyl(0.28, 0.3, 0.012, 12)} m={M("#6a4630")} p={[2.3, 0.1, 1.15]} /> : null}
      {s > 1.4 ? <Cloud p={[2.6, 3.0, 0.9]} k={ease((s - 1.4) / 0.4)} t={t} /> : null}
    </>
  );
};
const S4: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const bx = s < 1.0 ? -1.8 + 1.8 * s : 0.0; const walking = s < 1.0;
  const drop = clamp((s - 0.45) / 0.9); const dk = ease(drop);
  const bp: V3 = [lerp(-0.9, 1.85, dk), lerp(3.35, 2.05, drop * drop) + Math.sin(dk * Math.PI) * 0.0, 0.9 + Math.sin(dk * Math.PI) * 0.55];
  const shout = s > SCS[3].shout; const hit = drop >= 1;
  const bpose: Pose = walking ? { ...walkPose(bx, 0.45), expr: "calm", headX: -0.2 * clamp((s - 0.4) / 0.4) } : { expr: "shock", headX: -0.3, headY: hit ? -0.5 : 0, rArm: [-0.4, 0.5], lArm: [-0.4, -0.5], rElbow: 0.5, lElbow: 0.5 };
  return (
    <>
      <mesh geometry={box(7, 0.03, 0.03)} material={M("#222")} position={[0.5, 3.5, 0.9]} />
      <Mesh g={cyl(0.06, 0.08, 3.6, 6)} m={M("#2f3a46", { map: "metal", metal: 0.4 })} p={[-3, 1.8, 0.9]} /><Mesh g={cyl(0.06, 0.08, 3.6, 6)} m={M("#2f3a46", { map: "metal", metal: 0.4 })} p={[4, 1.8, 0.9]} />
      <Pigeon p={[-0.9, 3.65, 0.9]} t={t} flap={s > 0.6 && s < 0.9 ? 1 : 0} />
      <Human look={BEN} p={[bx, 0.08, 0.9]} yaw={FACE_X} pose={bpose} />
      {drop > 0 && !hit ? <Mesh g={ico(0.07, 1)} m={BM("#ffffff")} p={bp} /> : null}
      <Human look={GARY} p={[1.9, 0.08, 0.8]} yaw={FACE_NX * 0.5} pose={{ expr: shout ? "shout" : hit ? "sad" : "calm", rArm: [-0.4, 0.1], lArm: [-0.8, -0.35], lElbow: 0.5, bob: shout ? Math.abs(Math.sin(t * 22)) * 0.02 : 0 }} handL={<Umbrella />} hat={hit ? <Mesh g={ico(0.1, 1)} m={BM("#ffffff")} p={[0.02, 0.2, 0.02]} s={[1.2, 0.55, 1.2]} /> : undefined} />
      {s > 1.35 ? <Cloud p={[1.9, 3.1, 0.8]} k={ease((s - 1.35) / 0.4)} t={t} /> : null}
    </>
  );
};
const SCENES = [S1, S2, S3, S4];
const CAMS: ((s: number) => ReturnType<typeof Cam>)[] = [
  (s) => Cam([{ t: 0, p: [-0.4, 1.3, 8.2], l: [0.1, 1.0, 0.9], fov: 46 }, { t: 1.3, p: [1.1, 1.2, 8.0], l: [1.2, 1.0, 0.9], fov: 48 }, { t: 2.5, p: [2.0, 1.3, 7.4], l: [2.3, 1.3, 0.8], fov: 44, roll: 0.03 }], s),
  (s) => Cam([{ t: 0, p: [-1.4, 1.3, 8.0], l: [-0.6, 1.3, 0.9], fov: 50 }, { t: 1.4, p: [1.6, 1.3, 8.0], l: [2.0, 1.4, 0.9], fov: 50 }, { t: 2.5, p: [3.6, 1.3, 7.6], l: [4.1, 1.6, 0.9], fov: 46, roll: -0.04 }], s),
  (s) => Cam([{ t: 0, p: [2.8, 2.6, 8.2], l: [1.0, 1.6, 0.9], fov: 48 }, { t: 1.1, p: [1.4, 1.3, 7.2], l: [1.0, 1.3, 0.9], fov: 46 }, { t: 2.5, p: [2.4, 1.3, 7.2], l: [2.3, 1.3, 0.9], fov: 46 }], s),
  (s) => Cam([{ t: 0, p: [-2.4, 0.5, 6.6], l: [-0.8, 2.8, 0.9], fov: 54 }, { t: 1.0, p: [-0.5, 0.8, 7.4], l: [0.4, 2.4, 0.9], fov: 50 }, { t: 1.4, p: [1.2, 1.3, 8.0], l: [1.5, 1.8, 0.8], fov: 46 }, { t: 2.5, p: [1.6, 1.4, 7.2], l: [1.9, 2.1, 0.8], fov: 44, roll: 0.03 }], s),
];

const Rig: React.FC<{ p: V3; l: V3; fov: number; roll?: number }> = ({ p, l, fov, roll = 0 }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { camera.fov = fov; camera.near = 0.05; camera.far = 400; camera.updateProjectionMatrix(); camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...l); camera.rotateZ(roll); camera.updateMatrixWorld(); });
  return null;
};
const Lights: React.FC<{ i: number }> = ({ i }) => {
  const tn = TONE[i];
  return (
    <>
      <color attach="background" args={[tn.sky]} /><fog attach="fog" args={[tn.fog, 22, 70]} />
      <hemisphereLight args={[tn.hemi, "#f0d0a8", 1.9]} />
      <directionalLight color={tn.sun} intensity={3.0} position={[-6, 12, 9]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-6} shadow-camera-near={1} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.03} />
    </>
  );
};

const sans = "Arial, Helvetica, 'Liberation Sans', sans-serif"; const serif = "'Playfair Display', Georgia, serif";
const Hud: React.FC<{ sc: Sc; s: number }> = ({ sc, s }) => {
  const ent = ease(s / 0.18); const capIn = ease((s - 0.1) / 0.2); const shout = s > sc.shout; const pop = ease((s - sc.shout) / 0.1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 60, top: 150, color: "#fff", textShadow: "0 2px 12px rgba(10,14,30,.55)" }}>
        <div style={{ fontFamily: sans, fontSize: 28, letterSpacing: 6, fontWeight: 600 }}>LUCK</div>
        <div style={{ fontFamily: serif, fontSize: 150, fontWeight: 400, lineHeight: 1.05, fontFeatureSettings: '"lnum" 1', transform: `scale(${0.88 + 0.12 * ent})`, transformOrigin: "0 100%", opacity: 0.4 + 0.6 * ent }}>{sc.luck}</div>
        <div style={{ fontFamily: sans, fontSize: 29, letterSpacing: 3.5, fontWeight: 700, marginTop: 4 }}>{sc.tier}</div>
        <div style={{ fontFamily: sans, fontSize: 25, letterSpacing: 3, fontWeight: 500, marginTop: 4 }}>MINUTE {sc.minute}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <div style={{ background: "#d8274f", padding: "8px 18px", borderRadius: 6, fontFamily: sans, fontSize: 23, letterSpacing: 2.5, fontWeight: 700 }}>×2 EVERY MINUTE</div>
          <div style={{ background: shout ? "#f4f4f4" : "#f6b31c", color: "#16161a", padding: "8px 18px", borderRadius: 6, fontFamily: sans, fontSize: 23, letterSpacing: 2.5, fontWeight: 800, textShadow: "none" }}>{shout ? "SIDE CHARACTER" : "MAIN CHARACTER"}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 560, color: "#fff", fontFamily: serif, fontStyle: "italic", fontSize: 58, lineHeight: 1.2, textShadow: "0 2px 14px rgba(10,14,30,.7)", opacity: capIn, transform: `translateY(${(1 - capIn) * 18}px)` }}>{sc.cap}</div>
      {shout ? <div style={{ position: "absolute", left: 0, right: 0, top: 1290, textAlign: "center", fontFamily: "'Lilita One', Impact, sans-serif", fontSize: 108, color: "#fff", letterSpacing: 2, textShadow: "0 6px 0 rgba(0,0,0,.55), 0 0 22px rgba(0,0,0,.5)", transform: `scale(${0.6 + 0.5 * pop + (pop >= 1 ? 0 : 0)}) rotate(${(1 - pop) * -3}deg)`, opacity: pop }}>WHAT THE <span style={{ color: "#ffc21a" }}>TOAST</span>?!</div> : null}
    </AbsoluteFill>
  );
};

export const Style3Sample: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig(); const t = frame / fps;
  if (!ok) return <AbsoluteFill style={{ background: "#a9dcf5" }} />;
  const idx = Math.min(3, Math.floor(t / SD)); const s = t - idx * SD;
  const cam = CAMS[idx](s); const Sc = SCENES[idx];
  const flash = idx > 0 ? Math.max(0, 1 - s / 0.13) * 0.55 : 0;
  const punch = idx > 0 ? Math.max(0, 1 - s / 0.3) * 0.05 : 0;
  const focus = new THREE.Vector3(...cam.p).distanceTo(new THREE.Vector3(...cam.l));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + punch})` }}>
        <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, near: 0.05, far: 400, position: cam.p }} gl={{ antialias: true }}>
          <Rig p={cam.p} l={cam.l} fov={cam.fov} roll={cam.roll} />
          <Lights i={idx} />
          <Street />
          <Sc key={idx} s={s} t={t} />
          <PostFX focus={focus} range={14} bokeh={2} frame={frame} grain={0.2} />
        </ThreeCanvas>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} /> : null}
      <Hud sc={SCS[idx]} s={s} />
      {audio ? <Audio src={staticFile("style3_luck_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
