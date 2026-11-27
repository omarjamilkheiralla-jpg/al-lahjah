import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { loadFonts } from "../full/fonts";
import timing from "./timing.json";
import { SENT, TOTAL, ss, se, wt, OX, clamp, sm } from "./timeline";
import { Street, Attic, Desk } from "./worlds1";
import { Salon, Station, Study, Modern, Roofs, stationState } from "./worlds2";

export const FPS = 30;
export const EIFFEL_TOTAL = TOTAL;
type V3 = [number, number, number];
type Cam = { p: V3; l: V3; fov: number; roll?: number };
const lv = (a: number[], b: number[], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k] as V3;
const add = (a: number[], o: number): V3 => [a[0] + o, a[1], a[2]];
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** gentle, never-stopping easing: mostly linear with soft ends */
const ez = (u: number) => { const k = clamp(u); return 0.55 * k + 0.45 * sm(k); };
const gap = (i: number) => (i <= 0 ? 0 : (se(i - 1) + ss(i)) / 2);

type Shot = { id: string; at: number; world: keyof typeof OX; tr: "iris" | "dip" | "flash"; cam: (u: number, s: number, d: number, t: number) => Cam; render: (t: number, cam: V3) => React.ReactNode };
const SHOTS: Shot[] = [
  { id: "hook", at: 0, world: "street", tr: "dip",
    cam: (u) => ({ p: lv([3.6, 0.5, 27], [2.6, 2.6, 6], ez(u)), l: lv([-0.5, 4.5, -70], [0, 36, -80], sm((u - 0.15) / 0.85)), fov: mix(54, 46, u) }),
    render: (t, c) => <Street t={t} cam={c} variant="hook" /> },
  { id: "sold", at: gap(1), world: "street", tr: "iris",
    cam: (u) => ({ p: lv([-1.5, 3.4, -41], [-4.2, 2.8, -44], ez(u)), l: lv([-4.2, 3.2, -61], [-4.1, 3.2, -61], u), fov: mix(46, 42, u) }),
    render: (t, c) => <Street t={t} cam={c} variant="sold" /> },
  { id: "attic", at: gap(2), world: "attic", tr: "iris",
    cam: (u) => ({ p: lv([2.6, 4.0, 3.6], [0.35, 2.0, 3.7], ez(u)), l: lv([0.1, 1.0, -0.4], [0.2, 1.95, -0.4], sm(u)), fov: mix(52, 32, u), roll: 0.03 * (1 - u) }),
    render: (t, c) => <Attic t={t} cam={c} /> },
  { id: "plaque", at: gap(3), world: "street", tr: "iris",
    cam: (u) => ({ p: lv([-5.5, 2.6, -44], [6.5, 3.0, -45], ez(u)), l: lv([-4, 3.4, -61], [7.2, 2.4, -58], ez(u)), fov: mix(46, 40, u) }),
    render: (t, c) => <Street t={t} cam={c} variant="plaque" /> },
  { id: "desk", at: gap(4), world: "desk", tr: "iris",
    cam: (u) => { const k = sm((u - 0.5) / 0.45); return { p: lv(lv([-0.6, 7.0, 1.6], [0.6, 6.4, 1.4], u), [0.0, 2.5, 6.4], k), l: lv(lv([0, 1.1, 0.8], [0.2, 1.1, 0.6], u), [0, 2.35, -3.2], k), fov: mix(40, 36, k) }; },
    render: (t, c) => <Desk t={t} cam={c} /> },
  { id: "salon1", at: gap(5), world: "salon", tr: "iris",
    cam: (u, s) => { const wk = wt(5, 13) - 0.3 - gap(5); const a = clamp(s / wk), k = sm((s - wk) / 0.9);
      const pA = lv([8, 1.0, 6.4], [-1.2, 1.1, 5.6], ez(a)); const lA = lv([2, 1.3, -1], [-3.4, 1.5, 0], ez(a));
      const pB = lv([-4.0, 1.95, 3.0], [-4.5, 1.92, 1.7], clamp((s - wk) / 3.5)); const lB = [-4.55, 1.9, 0.2] as V3; return { p: lv(pA, pB, k), l: lv(lA, lB, k), fov: mix(46, 19, k) }; },
    render: (t, c) => <Salon t={t} cam={c} /> },
  { id: "poisson", at: gap(6), world: "salon", tr: "iris",
    cam: (u) => { const a = mix(0.7, -0.65, ez(u)), r = mix(5.2, 4.0, u), h = mix(2.2, 1.6, u); return { p: [0 + Math.sin(a) * r, h, -2.35 + Math.cos(a) * r], l: [0, 1.2, -2.35], fov: mix(38, 32, u) }; },
    render: (t, c) => <Salon t={t} cam={c} /> },
  { id: "cash", at: gap(7), world: "salon", tr: "iris",
    cam: (u, _s, _d, t) => { const cu = sm((t - (wt(7, 0) + 0.4)) / 2.0); const cx = 2.9 - cu * 4.1; const k = sm((u - 0.62) / 0.34); return { p: lv([cx, 5.2, 1.9], [-1.0, 2.9, 3.4], k), l: lv([cx + 0.2, 1.15, 0.6], [-1.2, 1.2, 0.5], k), fov: mix(42, 34, k) }; },
    render: (t, c) => <Salon t={t} cam={c} /> },
  { id: "train", at: gap(8), world: "station", tr: "flash",
    cam: (_u, s, _d, t) => { const st = stationState(t); return st.onboard ? { p: [st.vx + 7, 2.4, 5.6], l: [st.vx - 0.5, 2.0, -4.3], fov: 50 } : { p: [st.vx + 5.2, 1.9, 6.2], l: [st.vx - 0.2, 1.7, 1.8], fov: 46 }; },
    render: (t, c) => <Station t={t} cam={c} /> },
  { id: "news", at: gap(9), world: "street", tr: "dip",
    cam: (u) => ({ p: lv([0.2, 1.9, 2.2], [7.0, 1.9, 1.4], ez(u)), l: lv([2.4, 1.5, -3.8], [8.4, 1.4, -2.4], ez(u)), fov: 40 }),
    render: (t, c) => <Street t={t} cam={c} variant="news" /> },
  { id: "study", at: gap(10), world: "study", tr: "iris",
    cam: (u) => ({ p: lv([1.4, 2.4, 6.6], [0.3, 1.6, 4.4], ez(u)), l: lv([0, 1.7, -0.6], [0, 1.5, -0.6], u), fov: mix(40, 33, u), roll: 0.02 * (1 - u) }),
    render: (t, c) => <Study t={t} cam={c} /> },
  { id: "modern", at: gap(11), world: "modern", tr: "iris",
    cam: (u, s, d) => { const tD = wt(11, 16) - gap(11); const ph = sm((s - (tD + 0.6)) / Math.max(1.2, d - tD - 0.6));
      const pA = lv([1.0, 2.4, 8.2], [0.2, 1.9, 6.0], clamp(s / Math.max(0.1, tD))); const lA = lv([0.0, 1.4, -0.2], [-0.1, 1.6, -0.3], clamp(s / Math.max(0.1, tD)));
      const pB = lv([0.2, 1.9, 6.0], [2.6, 2.7, -4.2], ph); const lB = lv([-0.9, 1.7, -0.6], [2.6, 2.9, -9], ph); return { p: s < tD + 0.6 ? pA : pB, l: s < tD + 0.6 ? lA : lB, fov: mix(40, 52, ph) }; },
    render: (t, c) => <Modern t={t} cam={c} /> },
  { id: "roofs1", at: gap(12), world: "roofs", tr: "iris",
    cam: (u) => ({ p: lv([-26, 36, 46], [14, 26, 14], ez(u)), l: lv([-4, 20, -92], [0, 24, -92], u), fov: mix(56, 52, u) }),
    render: (t, c) => <Roofs t={t} cam={c} /> },
  { id: "salon2", at: gap(13), world: "salon", tr: "iris",
    cam: (u) => ({ p: lv([7.5, 1.5, 5.4], [-2.2, 2.3, 6.4], ez(u)), l: lv([-1, 1.6, 0], [0.5, 1.7, -1], u), fov: mix(44, 40, u) }),
    render: (t, c) => <Salon t={t} cam={c} phase={1} /> },
  { id: "chase", at: gap(14), world: "roofs", tr: "flash",
    cam: (u, _s, _d, t) => { const uu = clamp((t - ss(14)) / 5.2); const vx = -22 + uu * 46; return { p: [vx - 5 + u * 3, mix(13.8, 17.5, sm(u)), mix(15, 20, u)], l: [vx + 2, 12.6, 6.2], fov: 38 }; },
    render: (t, c) => <Roofs t={t} cam={c} /> },
  { id: "finale", at: gap(15), world: "roofs", tr: "dip",
    cam: (u) => ({ p: lv([0, 25, -58], [0, 40, 52], ez(u)), l: lv([0, 25.5, -78.6], [0, 22, -90], ez(u)), fov: mix(34, 54, u) }),
    render: (t, c) => <Roofs t={t} cam={c} /> },
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

const BED_VOL = 0.17;
const duck = (f: number) => { const t = f / FPS; for (const s of SENT) if (t > s.start - 0.25 && t < s.end + 0.35) return BED_VOL * 0.5; return BED_VOL; };
const sfx = (name: string, at: number, vol = 0.6) => (
  <Sequence key={`${name}${at}`} from={Math.max(0, Math.round(at * FPS))} layout="none"><Audio src={staticFile(`eiffel/sfx_${name}.wav`)} volume={vol} /></Sequence>
);

export const Eiffel: React.FC = () => {
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
        <Rig p={p} l={l} fov={cam.fov} roll={(cam.roll ?? 0) + Math.sin(t * 0.6) * 0.006} />
        <group position={[ox, 0, 0]} key={S.world}>{S.render(t, local)}</group>
        <PostFX focus={focus} range={Math.max(1.5, focus * 0.45)} bokeh={3.4} frame={f} grain={0.26} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 46%, rgba(8,5,6,.5) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,150,80,0.08), rgba(60,90,200,0.10))", mixBlendMode: "soft-light" }} />
      <Captions t={t} />
      <Overlay t={t} w={width} h={height} />
      {/* audio: bed + sound effects always; the narration once the real voice has been generated */}
      {!(timing as any).estimate ? <Audio src={staticFile("eiffel/narration.wav")} volume={1} /> : null}
      <Audio src={staticFile("eiffel/bed.wav")} volume={duck} />
      {boundaries.map((b) => sfx("whoosh", b - 0.3, 0.35))}
      {sfx("slam", wt(1, 2), 0.7)}{sfx("slam", wt(1, 4), 0.7)}
      {[0, 1, 2, 3].map((i) => sfx("stamp", ss(4) + 0.4 + 0.5 + i * 1.2, 0.6))}
      {[0, 1, 2, 3, 4, 5].map((i) => sfx("paper", ss(4) + 1.6 + i * 0.45, 0.4))}
      {sfx("cash", wt(7, 0) + 0.4, 0.55)}
      {sfx("whistle", ss(8) + 0.1, 0.5)}{sfx("train", ss(8) + 0.3, 0.55)}
      {sfx("click", wt(11, 16), 0.6)}
      {sfx("police", ss(14) + 0.1, 0.55)}
      {sfx("tading", se(15) + 0.3, 0.8)}
    </AbsoluteFill>
  );
};
