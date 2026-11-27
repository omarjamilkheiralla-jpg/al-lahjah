import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { loadFonts } from "../full/fonts";
import { ShotAge, Char } from "../eiffel/kit";
import { SENT, TOTAL, ss, se, wt, OX, clamp, sm } from "./timeline";
import { Boston, Car, Court, WAVE_SPEED } from "./worlds";
import timing from "./timing.json";

export const FPS = 30;
export const MOLASSES_TOTAL = TOTAL;
type V3 = [number, number, number];
type Cam = { p: V3; l: V3; fov: number; roll?: number };
const lv = (a: number[], b: number[], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k] as V3;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const ez = (u: number) => { const k = clamp(u); return 0.55 * k + 0.45 * sm(k); };
const gap = (i: number) => (i <= 0 ? 0 : (se(i - 1) + ss(i)) / 2);
const TB = wt(6, 8) - 0.15; // the burst
const TF = wt(14, 5) - 2.4; // the last wave
const T_LANT = wt(8, 6);

type Shot = { id: string; at: number; tr: "iris" | "dip" | "flash"; world: keyof typeof OX; cam: (u: number, s: number, d: number, t: number) => Cam; render: (t: number, cam: V3) => React.ReactNode };
const SHOTS: Shot[] = [
  { id: "hook", at: 0, tr: "dip", world: "boston",
    cam: (u) => ({ p: lv([-2.5, 1.5, 44], [0.5, 3.4, 14], ez(u)), l: lv([0, 8, -70], [0, 11, -70], sm(u)), fov: mix(54, 46, u) }),
    render: (t, c) => <Boston t={t} cam={c} showFolk="day" /> },
  { id: "day", at: gap(1), tr: "iris", world: "boston",
    cam: (u) => ({ p: lv([-7, 1.8, 26], [3.5, 2.1, 12], ez(u)), l: lv([0, 3, 4], [0, 4, -10], ez(u)), fov: 44 }),
    render: (t, c) => <Boston t={t} cam={c} showFolk="day" /> },
  { id: "tank", at: gap(2), tr: "iris", world: "boston",
    cam: (u) => ({ p: lv([5, 1.2, -30], [-4, 2.4, -37], ez(u)), l: lv([0, 6, -70], [0, 15, -70], sm(u)), fov: mix(64, 58, u) }),
    render: (t, c) => <Boston t={t} cam={c} showFolk="none" paint={0} /> },
  { id: "leak", at: gap(3), tr: "iris", world: "boston",
    cam: (u) => ({ p: lv([2.4, 1.9, -37], [-2.2, 2.1, -40], ez(u)), l: lv([0, 3.4, -54], [0, 2.6, -54], u), fov: mix(48, 42, u) }),
    render: (t, c) => <Boston t={t} cam={c} showFolk={t > ss(4) - 0.2 ? "kids" : "none"} paint={0} /> },
  { id: "paint", at: gap(5), tr: "iris", world: "boston",
    cam: (u) => ({ p: lv([-7, 3.2, -38], [6, 3.8, -39], ez(u)), l: [0, 3.8, -54], fov: mix(48, 44, u) }),
    render: (t, c) => { const pr = clamp((t - ss(5) - 0.3) / 1.9); return <><Boston t={t} cam={c} showFolk="none" paint={pr} /><Char look="dealer2" expr="deadpan" t={t} p={[-7 + pr * 14, 0, -52.6]} cam={c} scale={1.05} pose="crank" power={0.8} tint="#ffeedd" seed={5} handR={<mesh position={[0, -0.14, 0.05]}><boxGeometry args={[0.16, 0.34, 0.06]} /><meshBasicMaterial color="#6a3e22" /></mesh>} /></>; } },
  { id: "groan", at: gap(6), tr: "flash", world: "boston",
    cam: (u, _s, _d, t) => ({ p: lv([0.5, 3.0, -34], [0, 4.6, -45], ez(u)).map((v, i) => v + (i === 1 ? Math.sin(t * 47) * 0.03 * u : Math.sin(t * 53 + i) * 0.04 * u)) as V3, l: [0, 6, -54], fov: mix(54, 46, u) }),
    render: (t, c) => <Boston t={t} cam={c} showFolk="none" paint={1} shake={clamp((t - ss(6)) / Math.max(0.5, TB - ss(6)))} burst={TB} /> },
  { id: "chase", at: TB - 0.15, tr: "flash", world: "boston",
    cam: (_u, _s, _d, t) => { const s = t - TB; const zf = -56 + s * WAVE_SPEED; return { p: [0.8, 8.8 + s * 0.2, zf + 26 - s * 1.3], l: [0, 3.2, zf - 3], fov: 52 }; },
    render: (t, c) => <Boston t={t} cam={c} tw={TB} showFolk="run" paint={1} burst={TB} /> },
  { id: "after", at: gap(8), tr: "iris", world: "boston",
    cam: (u, _s, _d, t) => ({ p: lv([2.5, 11, 34], [1, 8, 16], ez(u)), l: lv([0, 2, -12], [0, 1, -18], u), fov: 52 }),
    render: (t, c) => <Boston t={t} cam={c} tw={TB} showFolk="after" paint={1} burst={TB} flooded /> },
  { id: "lanterns", at: T_LANT - 0.5, tr: "dip", world: "boston",
    cam: (u) => ({ p: lv([0, 2.4, 40], [0, 1.9, 16], ez(u)), l: lv([0, 1.4, -10], [0, 1.2, -16], u), fov: mix(52, 42, u) }),
    render: (t, c) => <Boston t={t} cam={c} flooded dusk showFolk="none" paint={1} burst={TB} lanternsAt={T_LANT} leak={false} /> },
  { id: "warning", at: gap(9), tr: "iris", world: "boston",
    cam: (u) => ({ p: lv([6.5, 2.4, -36], [2.5, 3.2, -42], ez(u)), l: lv([0, 5, -54], [0.8, 3.4, -54], u), fov: mix(46, 38, u) }),
    render: (t, c) => <Boston t={t} cam={c} showFolk="none" paint={1} /> },
  { id: "dash", at: gap(10), tr: "iris", world: "car",
    cam: (u) => ({ p: lv([0, 0.8, 1.6], [0, 0.45, -0.2], ez(u)), l: lv([0, -0.05, -1.6], [0, 0.02, -1.5], u), fov: mix(52, 34, u) }),
    render: (t) => <Car t={t} /> },
  { id: "painted", at: gap(12), tr: "iris", world: "boston",
    cam: (u) => ({ p: lv([0.5, 2.4, -46], [0, 7, -16], ez(u)), l: lv([0, 3.2, -54], [0, 8, -62], ez(u)), fov: mix(44, 54, u) }),
    render: (t, c) => <Boston t={t} cam={c} showFolk="none" paint={1} /> },
  { id: "court", at: gap(13), tr: "iris", world: "court",
    cam: (u, s, d) => { const k = sm((s - (d * 0.4)) / 1.0); return { p: lv([0.5, 3.2, 13], [1.7, 3.5, 2.6], k), l: lv([0, 2.2, -2], [1.7, 1.3, 0.7], k), fov: mix(46, 32, k) }; },
    render: (t, c) => <Court t={t} cam={c} /> },
  { id: "final", at: gap(14), tr: "dip", world: "boston",
    cam: (u) => ({ p: lv([-3, 1.4, 22], [-1.5, 1.8, 40], ez(u)), l: lv([0, 3, -4], [0, 3.4, -4], u), fov: 46 }),
    render: (t, c) => <Boston t={t} cam={c} tw={TF} sign showFolk="none" paint={1} leak={false} burst={TF} /> },
];
const END = TOTAL;
const shotIdx = (t: number) => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i].at) k = i; return k; };
const Rig: React.FC<{ p: number[]; l: number[]; fov: number; roll: number }> = ({ p, l, fov, roll }) => {
  const c = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => { c.fov = fov; c.near = 0.1; c.far = 700; c.updateProjectionMatrix(); c.position.set(p[0], p[1], p[2]); c.up.set(0, 1, 0); c.lookAt(l[0], l[1], l[2]); c.rotateZ(roll); c.updateMatrixWorld(); });
  return null;
};

/** word-by-word captions in the lower third */
const chunks = SENT.flatMap((s, si) => { const out: { t0: number; t1: number; words: { w: string; t0: number }[] }[] = []; let cur: { w: string; t0: number; t1: number }[] = [];
  s.words.forEach((w, i) => { cur.push(w); const end = /[.,!?]$/.test(w.w) || cur.length >= 3 || i === s.words.length - 1; if (end) { out.push({ t0: cur[0].t0, t1: w.t1, words: cur.map((c) => ({ w: c.w, t0: c.t0 })) }); cur = []; } }); void si; return out; });
const Captions: React.FC<{ t: number }> = ({ t }) => {
  let ci = -1; for (let i = 0; i < chunks.length; i++) if (chunks[i].t0 <= t + 0.02) ci = i;
  if (ci < 0) return null; const c = chunks[ci]; const nxt = chunks[ci + 1]; const hold = c.t1 + 0.28; if (t > hold && !(nxt && nxt.t0 - c.t1 < 0.1)) return null;
  const cur = c.words.reduce((a, w, i) => (w.t0 <= t + 0.02 ? i : a), 0);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 330, textAlign: "center", fontFamily: "'Lilita One', sans-serif", fontSize: 92, lineHeight: 1.05, color: "#fff", textTransform: "uppercase", letterSpacing: 1, WebkitTextStroke: "11px #1a1014", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.4), 0 0 22px rgba(0,0,0,.45)" }}>
      {c.words.map((w, i) => <span key={i} style={{ display: "inline-block", marginRight: 22, color: i === cur ? "#ffd84a" : "#fff", transform: i === cur ? `scale(${1 + 0.1 * Math.max(0, 1 - (t - w.t0) / 0.18)})` : "none" }}>{w.w.replace(/[“”"]/g, "")}</span>)}
    </div>
  );
};

/** iris / dip / flash transition overlay. closes in the last 0.3 s of a shot and opens in the first 0.3 s of the next */
const Overlay: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => {
  const WIN = 0.32; const R0 = Math.hypot(w, h) * 0.55;
  for (let i = 0; i < SHOTS.length; i++) {
    const B = SHOTS[i].at; const tr = SHOTS[i].tr;
    if (i === 0) { if (t < 0.5) return <AbsoluteFill style={{ background: `rgba(12,8,6,${1 - sm(t / 0.5)})` }} />; continue; }
    if (t >= B - WIN && t <= B + WIN) {
      const k = t < B ? (B - t) / WIN : (t - B) / WIN; // 1 = open ... 0 = closed
      if (tr === "iris") { const r = R0 * sm(k); return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, rgba(0,0,0,0) ${Math.max(0, r - 3)}px, #0c0806 ${r + 3}px)` }} />; }
      if (tr === "dip") return <AbsoluteFill style={{ background: `rgba(12,8,6,${1 - sm(k)})` }} />;
      return <AbsoluteFill style={{ background: `rgba(255,238,205,${1 - sm(k)})` }} />;
    }
  }
  if (t > END - 1.6 - 0.0) { const e = clamp((t - (END - 1.6)) / 0.0001); void e; }
  return null;
};

const BED_VOL = 0.15;
const duck = (f: number) => { const t = f / FPS; for (const s of SENT) if (t > s.start - 0.25 && t < s.end + 0.35) return BED_VOL * 0.5; return BED_VOL; };
const sfx = (name: string, at: number, vol = 0.6) => (
  <Sequence key={`${name}${at}`} from={Math.max(0, Math.round(at * FPS))} layout="none"><Audio src={staticFile(`molasses/sfx_${name}.wav`)} volume={vol} /></Sequence>
);

export const Molasses: React.FC = () => {
  const f = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = f / FPS;
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  if (!ok) return <AbsoluteFill style={{ background: "#0c0806" }} />;
  const si = shotIdx(t); const S = SHOTS[si]; const d = (SHOTS[si + 1]?.at ?? END) - S.at; const s = t - S.at; const u = clamp(s / d);
  const ox = OX[S.world]; const cam = S.cam(u, s, d, t);
  const jit = (a: number) => Math.sin(t * 0.9 + a) * 0.02 + Math.sin(t * 2.3 + a * 2) * 0.008;
  const p: V3 = [cam.p[0] + ox + jit(0), cam.p[1] + jit(1), cam.p[2] + jit(2)]; const l: V3 = [cam.l[0] + ox, cam.l[1] + jit(3) * 0.5, cam.l[2]];
  const focus = new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...l));
  const local: V3 = [p[0] - ox, p[1], p[2]];
  const boundaries = SHOTS.slice(1).map((x) => x.at);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, position: p }} gl={{ antialias: true }}>
        <Rig p={p} l={l} fov={cam.fov} roll={(cam.roll ?? 0) + Math.sin(t * 0.6) * 0.005} />
        <ShotAge.Provider value={s}><group position={[ox, 0, 0]} key={S.world}>{S.render(t, local)}</group></ShotAge.Provider>
        <PostFX focus={focus} range={Math.max(1.5, focus * 0.45)} bokeh={3.2} frame={f} grain={0.24} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 46%, rgba(8,5,6,.5) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,100,0.07), rgba(80,110,200,0.10))", mixBlendMode: "soft-light" }} />
      <Captions t={t} />
      <Overlay t={t} w={width} h={height} />
      {!(timing as any).estimate ? <Audio src={staticFile("molasses/narration.wav")} volume={1} /> : null}
      <Audio src={staticFile("molasses/bed.wav")} volume={duck} />
      {[0, 12, 24, 36, 48, 60].map((a) => sfx("wind", a, 0.5))}
      {boundaries.map((b) => sfx("whoosh", b - 0.3, 0.3))}
      {[0, 1, 2, 3].map((i) => sfx("drip", ss(3) + 0.9 + i * 0.85, 0.5))}
      {sfx("brush", ss(5) + 0.3, 0.45)}{sfx("brush", ss(5) + 1.5, 0.45)}
      {sfx("groan", wt(6, 5) - 0.2, 0.7)}{sfx("burst", TB, 0.9)}{sfx("rumble", TB + 0.35, 0.85)}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => sfx("chime", T_LANT + i * 0.33, 0.28))}
      {sfx("ding", wt(10, 4), 0.55)}{sfx("click", wt(10, 13) - 0.2, 0.6)}{sfx("ding", wt(10, 13) + 1.0, 0.0)}
      {sfx("gavel", ss(13) + 0.25, 0.7)}{sfx("stamp", wt(13, 12), 0.7)}
      {sfx("rumble", TF, 0.7)}
      {sfx("tading", se(14) + 0.3, 0.8)}
    </AbsoluteFill>
  );
};
