/* Scenes (one per shot) for "She Fell Two Miles Out of the Sky". t = seconds since the shot started; at(line, word) = local time of a spoken word. */
import * as THREE from "three";
import React, { useMemo } from "react";
import { Person2, type Pose } from "../full/person";
import type { Expr } from "../full/paint";
import { SceneEnv, Lights } from "../full/env";
import "./people";
import { PASSENGERS } from "./people";
import { Building } from "../town/world";
import {
  Jungle, Palm, Fern, BigLeaf, GiantTree, Log, Rock, Canopy, RiverRibbon, Mist, Rays, Butterflies, Motes, JSky, CloudPuffs, Bolt, ContactShadow,
  Ink, box, toon, toonT, basic, geo, memo, repT, rng, clamp, cv, waterTex, mudTex, litterTex, type V3, type SkyKind,
} from "./world";
import { SeatRow, SEAT_Y, Airliner, Cabin, Hut, Dugout, GasCan, CandyBag, Glasses, Shoe, Panel, Stick, Stingray, Maggots, TallyBoard, SignBoard, LabTable, Mountains, Airstair, GiftBox } from "./props";

export type SceneProps = { t: number; dur: number; at: (line: number, word: string) => number };
const sm = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ------------------------------------------------------------------ helpers */
type PProps = { look: string; p: V3; t: number; s?: number; expr?: Expr; pose?: Pose; seed?: number; yaw?: number; lean?: number; handR?: React.ReactNode; handL?: React.ReactNode; tint?: string; shadow?: boolean; gait?: number; amp?: number; emph?: number; still?: boolean; power?: number };
const P: React.FC<PProps> = ({ look, p, t, s = 1.15, expr = "deadpan", pose = "idle", seed = 1, yaw = 0, lean, handR, handL, tint, shadow = true, gait, amp, emph, still, power }) => (
  <>
    <Person2 look={look as any} expr={expr} t={t} position={p} yaw={yaw} scale={s} seed={seed} pose={pose} lean={lean} handR={handR} handL={handL} tint={tint} gait={gait} amp={amp} emph={emph} still={still} power={power} />
    {shadow ? <ContactShadow position={[p[0], p[1] + 0.02, p[2]]} r={0.42 * s} /> : null}
  </>
);
/** a person sitting in seat `i` (0..2) of a SeatRow placed at row (scale s) */
const Seated: React.FC<Omit<PProps, "p"> & { row: V3; i: number }> = ({ row, i, s = 1.15, ...rest }) => <P {...rest} s={s} shadow={false} p={[row[0] + (i - 1) * 0.9 * s, row[1] + (SEAT_Y - 0.6) * s, row[2] - 0.15 * s]} />;

type EnvKind = "jungle" | "jungleDim" | "storm" | "cabin" | "memory" | "dusk" | "morning" | "air";
const ENV: Record<EnvKind, { bg: string; fog: [string, number, number]; sun: V3; col: string; int: number; hemi: [string, string, number]; sky: SkyKind }> = {
  jungle: { bg: "#c8d8b8", fog: ["#b4c8a8", 16, 85], sun: [-10, 30, 10], col: "#fff0c8", int: 2.5, hemi: ["#e0f4d0", "#4a3a20", 1.05], sky: "humid" },
  jungleDim: { bg: "#a8b8a0", fog: ["#9aac94", 12, 70], sun: [-8, 30, 6], col: "#f4ecd0", int: 1.9, hemi: ["#d0e4c8", "#3a3220", 1.0], sky: "humid" },
  storm: { bg: "#2a3040", fog: ["#3a4252", 30, 200], sun: [-10, 30, 12], col: "#b8c8e8", int: 1.6, hemi: ["#8a9ab8", "#2a2a30", 0.9], sky: "storm" },
  cabin: { bg: "#3a4050", fog: ["#3a4050", 40, 120], sun: [-4, 12, 10], col: "#fff0d8", int: 1.6, hemi: ["#fff4e0", "#8a7060", 1.2], sky: "storm" },
  memory: { bg: "#e8d8b0", fog: ["#e0d0a8", 18, 90], sun: [-12, 24, 10], col: "#ffe0a8", int: 2.6, hemi: ["#fff0d0", "#6a5030", 1.1], sky: "morning" },
  dusk: { bg: "#e8a878", fog: ["#d89a78", 20, 110], sun: [14, 10, -20], col: "#ffb070", int: 2.2, hemi: ["#ffd0b0", "#4a3040", 0.95], sky: "dusk" },
  morning: { bg: "#d8e4ec", fog: ["#dce6ec", 40, 220], sun: [-20, 30, 14], col: "#fff2d8", int: 2.6, hemi: ["#e8f4ff", "#8a7a5a", 1.1], sky: "morning" },
  air: { bg: "#c8d8e4", fog: ["#c4d4dc", 60, 320], sun: [-30, 50, 20], col: "#fff4dc", int: 2.4, hemi: ["#e8f4ff", "#4a5a3a", 1.0], sky: "above" },
};
const Env: React.FC<{ k: EnvKind; t: number; shadow?: number; skyY?: number; clouds?: number; flash?: number }> = ({ k, t, shadow = 16, skyY = 0, clouds = 12, flash = 0 }) => {
  const e = ENV[k];
  return <>
    <SceneEnv bg={e.bg} fog={e.fog} />
    <Lights color={e.col} intensity={e.int + flash * 3} pos={e.sun} hemi={[e.hemi[0], e.hemi[1], e.hemi[2] + flash * 1.5]} shadowSize={shadow} />
    <JSky kind={e.sky} t={t} y={skyY} clouds={clouds} />
  </>;
};
const Water: React.FC<{ p: V3; w: number; d: number; t: number; flow?: number; rot?: number }> = ({ p, w, d, t, flow = 0.03, rot = 0 }) => {
  const m = memo(`waterm${w}_${d}`, () => { const tx = waterTex().clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(w / 8, d / 8); return new THREE.MeshToonMaterial({ map: tx, transparent: true, opacity: 0.94 }); });
  (m.map as THREE.Texture).offset.set(t * flow, Math.sin(t * 0.3) * 0.01);
  return <mesh material={m} position={p} rotation={[-Math.PI / 2, 0, rot]} receiveShadow><planeGeometry args={[w, d]} /></mesh>;
};
const Bank: React.FC<{ p: V3; w: number; d: number; rot?: number; tilt?: number }> = ({ p, w, d, rot = 0, tilt = 0.18 }) => {
  const m = toonT("mudbank", () => repT(mudTex(), w / 6, d / 6));
  return <mesh material={m} position={p} rotation={[-Math.PI / 2 + tilt, 0, rot]} receiveShadow><planeGeometry args={[w, d]} /></mesh>;
};
const Ripples: React.FC<{ p: V3; t: number; n?: number; s?: number }> = ({ p, t, n = 3, s = 1 }) => {
  const m = memo("ripple", () => new THREE.MeshBasicMaterial({ map: memo("riptex", () => cv(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,240,0)"); gr.addColorStop(0.7, "rgba(255,255,240,.55)"); gr.addColorStop(1, "rgba(255,255,240,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); })), transparent: true, depthWrite: false }));
  return <group position={p}>{Array.from({ length: n }, (_, i) => { const k = ((t * 0.8 + i / n) % 1); return <mesh key={i} material={m} rotation={[-Math.PI / 2, 0, 0]} scale={(0.4 + k * 2.2) * s} material-opacity={1 - k}><planeGeometry args={[1, 1]} /></mesh>; })}</group>;
};

/* =================================================================== 0. HOOK: falling through the storm, still buckled into her seat */
export const SFall: React.FC<SceneProps> = ({ t }) => {
  const tumble = Math.sin(t * 0.7) * 0.12, roll = Math.sin(t * 0.55 + 1) * 0.1;
  return <group>
    <Env k="storm" t={t} clouds={14} />
    <SceneEnv bg="#3a4456" fog={["#4a5466", 40, 260]} />
    <CloudPuffs t={t} n={46} area={[70, 90, 70]} c={[0, 0, -6]} tint="#8a94a8" op={0.75} speed={[0, 26, 0]} s={16} seed={3} />
    <CloudPuffs t={t} n={14} area={[30, 60, 20]} c={[0, 0, 8]} tint="#c8d0dc" op={0.35} speed={[0, 32, 0]} s={6} seed={8} />
    <group position={[0, 0, 0]} rotation={[tumble, 0, roll]}>
      <SeatRow p={[0, 0, 0]} s={1.15} belts={[false, true, true]} />
      <Seated look="jul" row={[0, 0, 0]} i={2} t={t} expr={t < 4.5 ? "sleep" : "shock"} pose="idle" seed={4} />
    </group>
    <Canopy y={-170} seed={5} />
  </group>;
};
/* 1. She landed in the middle of the Amazon rainforest */
const riverF = (x: number) => Math.sin(x * 0.02) * 30 + Math.sin(x * 0.05 + 1) * 8;
export const SCanopy: React.FC<SceneProps> = ({ t }) => {
  const y = lerp(64, 4, sm(t / 3.1));
  return <group>
    <Env k="air" t={t} shadow={60} />
    <Canopy y={0} seed={7} river={riverF} riverW={12} />
    <RiverRibbon f={riverF} w={12} y={-0.6} />
    <Mist t={t} n={16} area={[220, 6, 160]} c={[0, 8, -40]} color="#eef2ea" op={0.4} s={60} />
    <group position={[6, y, 10]} rotation={[0.3, 0.4, Math.sin(t) * 0.2]}><SeatRow s={1.15} belts={[false, true, true]} /><Seated look="jul" row={[0, 0, 0]} i={2} t={t} expr="sleep" seed={4} /></group>
  </group>;
};
/* 2. Alone. */
export const SAlone: React.FC<SceneProps> = ({ t }) => {
  const clear = useMemo(() => [[0, 0, 4], [0, 8, 5]] as [number, number, number][], []);
  return <group>
    <Env k="jungle" t={t} />
    <Jungle seed={3} clear={clear} x0={-26} x1={26} z0={-40} z1={14} density={0.8} />
    {[-9, 8, -14, 15].map((x, i) => <GiantTree key={i} p={[x, 0, -10 - i * 4]} seed={30 + i} s={1.1} />)}
    <SeatRow p={[0, 0, 0]} s={1.15} rot={[0, 0.15, 0.04]} belts={[false, true, true]} dirty />
    <Seated look="jul" row={[0.04, 0.02, 0.02]} i={2} t={t} expr="sleep" seed={4} still />
    <Panel p={[-2.6, 0.3, 0.8]} rot={[-1.2, 0.4, 0.2]} seed={2} s={0.8} /><Panel p={[2.8, 0.25, -1.5]} rot={[-1.4, -0.8, 0]} seed={5} s={0.7} blue />
    <Rays t={t} items={[{ x: 0.5, z: -0.5, w: 3.4, h: 22, a: -0.25 }, { x: -3, z: -5, w: 1.8, h: 20, a: -0.3 }, { x: 4, z: -8, w: 2.2, h: 22, a: -0.28 }]} op={0.2} />
    <Motes t={t} n={60} area={[12, 6, 10]} />
    <Mist t={t} n={8} area={[40, 2, 20]} c={[0, 0.8, -14]} op={0.3} />
  </group>;
};
/* 3a. Lima airport: Juliane and her mom walk to the plane with Christmas presents */
export const SAirport: React.FC<SceneProps> = ({ t }) => {
  const k = clamp(t / 4.2); const x = lerp(-5.2, -1.2, k);
  return <group>
    <Env k="morning" t={t} shadow={22} />
    <mesh material={toon("#9a9a9a")} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]} receiveShadow><planeGeometry args={[400, 200]} /></mesh>
    <mesh material={toonT("tarmac", () => repT(memo("tarmactex", () => cv(512, 512, (g, w, h) => { const r = rng(4); g.fillStyle = "#8e8e92"; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,40,50,.08)" : "rgba(255,255,255,.06)"; g.fillRect(r() * w, r() * h, 3, 3); } g.fillStyle = "rgba(60,60,70,.15)"; g.fillRect(0, 254, w, 4); }, true)), 30, 15))} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -10]} receiveShadow><planeGeometry args={[200, 80]} /></mesh>
    <mesh material={basic("#f2d040")} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2.5]}><planeGeometry args={[60, 0.18]} /></mesh>
    <Mountains z={-150} color="#8a94a8" />
    <Building p={[-16, 0, -26]} w={22} h={8} d={10} wall="#e8e0cc" wallKind="paint" sign="AEROPUERTO  LIMA" signBg="#2f4a7a" signFg="#ffffff" floors={2} cols={8} />
    <Building p={[10, 0, -30]} w={8} h={14} d={8} wall="#d8d0c0" wallKind="paint" floors={4} cols={3} />
    {[-30, -22, 18, 26, 34].map((x, i) => <Palm key={i} p={[x, 0, -18 - (i % 2) * 3]} seed={i + 4} s={1.1} h={8} />)}
    <Airliner p={[2, 2.2, -8.5]} t={t} spin={0} gear />
    <Airstair p={[3.2, 0, -5.6]} />
    {[[2.6, 0, -4.4, "t05"], [3.6, 0, -3.8, "t12"], [5.6, 0, -2.6, "t21"]].map(([px, py, pz, l], i) => <P key={i} look={l as string} p={[px as number, py as number, pz as number]} t={t} s={1.2} seed={10 + i} pose="hold" yaw={0.9} />)}
    <P look="mom" p={[x - 0.9, 0, -0.6]} t={t} s={1.25} pose="walk" yaw={0.9} seed={2} expr="grin" handR={<GiftBox c="#2f8a4a" rib="#e8403a" s={0.9} />} gait={1.0} />
    <P look="jul" p={[x + 0.4, 0, 0.2]} t={t} s={1.15} pose="walk" yaw={0.9} seed={4} expr="grin" handR={<GiftBox c="#c8303a" rib="#f2c030" />} gait={1.05} />
  </group>;
};
/* 3b. flying over the jungle toward Christmas with her dad */
export const SFlight: React.FC<SceneProps> = ({ t }) => (
  <group>
    <Env k="air" t={t} shadow={30} />
    <group position={[-t * 22, 0, 0]}><Canopy y={-60} seed={9} river={(x) => riverF(x) - 40} riverW={14} /><RiverRibbon f={(x) => riverF(x) - 40} w={14} y={-60.6} /></group>
    <Mountains z={-200} color="#9aa8b8" h={60} />
    <CloudPuffs t={t} n={22} area={[160, 30, 120]} c={[0, -6, -30]} tint="#ffffff" op={0.85} speed={[-26, 0, 0]} s={22} seed={2} />
    <Airliner p={[0, Math.sin(t * 0.8) * 0.15, 0]} rot={[0.04 * Math.sin(t * 0.6), 0, 0.02]} t={t} />
  </group>
);
/* 4. the storm, seen from inside: Juliane at the window, her mom beside her */
const CabinPeople: React.FC<{ t: number; fear: number; julExpr?: Expr; momExpr?: Expr }> = ({ t, fear, julExpr = "worried", momExpr = "worried" }) => (
  <>
    <Seated look="jul" row={[2.0, 0, 0]} i={2} t={t} expr={julExpr} seed={4} s={1} />
    <Seated look="mom" row={[2.0, 0, 0]} i={1} t={t} expr={momExpr} seed={2} s={1} />
    <Seated look="t07" row={[2.0, 0, 0]} i={0} t={t} expr={fear > 0.5 ? "shock" : "deadpan"} seed={7} s={1} />
    {[0, 2, 3, 4].map((r) => [0, 1, 2].map((i) => (r * 3 + i) % 4 === 1 ? null : <Seated key={`${r}${i}`} look={PASSENGERS[(r * 7 + i * 3) % 44]} row={[r % 2 ? 2.0 : -2.0, 0, -r * 1.4]} i={i} t={t} expr={fear > 0.4 ? (i % 2 ? "shock" : "worried") : "deadpan"} seed={r * 5 + i} s={1} />))}
    {[1].map((r) => [0, 1, 2].map((i) => <Seated key={`L${r}${i}`} look={PASSENGERS[(r * 11 + i * 5) % 44]} row={[-2.0, 0, -r * 1.4]} i={i} t={t} expr={fear > 0.4 ? "worried" : "deadpan"} seed={r * 9 + i} s={1} />))}
  </>
);
const flashAt = (t: number, list: number[]) => list.reduce((m, x) => Math.max(m, t >= x ? Math.max(0, 1 - (t - x) / 0.25) : 0), 0);
export const SCabinStorm: React.FC<SceneProps> = ({ t }) => {
  const fl = flashAt(t, [1.2, 2.9]);
  return <group>
    <Env k="cabin" t={t} shadow={10} flash={fl * 0.4} />
    <pointLight position={[0, 3, 0]} intensity={14} color="#fff2d0" distance={20} />
    <Cabin t={t} flash={fl} shake={0.3 + t * 0.15}><CabinPeople t={t} fear={t / 3.6} /></Cabin>
  </group>;
};
/* 5. lightning hits the wing, the plane breaks apart */
export const SStrike: React.FC<SceneProps> = ({ t, at }) => {
  const tl = at(5, "lightning"), tb = at(5, "broke");
  const bolt = t >= tl && t < tl + 0.35 ? 1 : 0; const fl = flashAt(t, [tl, tl + 0.12]);
  const fire = clamp((t - tl) / 0.6); const br = sm((t - tb) / 1.6);
  const shake = 0.06 * fire;
  return <group>
    <Env k="storm" t={t} flash={fl} clouds={16} />
    <CloudPuffs t={t} n={34} area={[160, 40, 80]} c={[0, -4, -45]} tint="#5a6478" op={0.85} speed={[-34, 0, 0]} s={20} seed={6} />
    <SceneEnv bg="#2e3646" fog={["#3a4456", 60, 260]} />
    <CloudPuffs t={t} n={10} area={[80, 20, 16]} c={[0, -6, -14]} tint="#8a94a8" op={0.35} speed={[-44, 0, 0]} s={10} seed={11} />
    <Bolt from={[9, 34, -6]} to={[0.4, -0.6, 5.0]} on={bolt} seed={7} />
    <group position={[Math.sin(t * 40) * shake, Math.sin(t * 33) * shake, 0]}><Airliner t={t} broken={br} fire={fire} rot={[0.1 * br, 0, -0.04 * br]} /></group>
    {br > 0 ? Array.from({ length: 14 }, (_, i) => { const r = rng(i * 7 + 1); const a = r() * 6.3; const sp = 2 + r() * 4; const k = Math.max(0, t - tb); return <Panel key={i} p={[-1 + Math.cos(a) * sp * k, -0.5 + Math.sin(a) * sp * k * 0.6 - k * k * 1.5, Math.sin(a * 3) * sp * k * 0.5]} rot={[k * (2 + r() * 3), k * r() * 4, k]} seed={i + 1} s={0.25 + r() * 0.2} blue={i % 4 === 0} />; }) : null}
    {fl > 0 ? <pointLight position={[2, 8, 8]} intensity={200 * fl} color="#dfe8ff" distance={60} /> : null}
  </group>;
};
/* 6. her mother's last words */
export const SMom: React.FC<SceneProps> = ({ t, dur }) => {
  const fl = flashAt(t, [1.4, 3.6, 5.2]); const flick = (Math.sin(t * 37) > 0.3 && t > 2) ? 0.35 : 1;
  const mask = sm((t - 0.6) / 0.8);
  void dur;
  return <group>
    <Env k="cabin" t={t} shadow={10} flash={fl * 0.5} />
    <pointLight position={[2, 3, 0]} intensity={12 * flick} color="#fff2d0" distance={18} />
    <Cabin t={t} flash={fl} shake={1.0} tilt={0.1}>
      <CabinPeople t={t} fear={1} julExpr="shock" momExpr="worried" />
      {[1.1, 2.0, 2.9].map((x, i) => <group key={i} position={[x, 3.2 - mask * 0.9, 0.45]}><mesh material={basic("#f2c030")} position={[0, 0, 0]}><cylinderGeometry args={[0.08, 0.1, 0.12, 12]} /></mesh><mesh material={basic("#e8e8e8")} position={[0, 0.45, 0]}><cylinderGeometry args={[0.008, 0.008, 0.9, 4]} /></mesh></group>)}
    </Cabin>
  </group>;
};
/* ------------------------------------------------------------------ crash site (shared) */
const Wreck: React.FC<{ t: number }> = React.memo(() => (
  <group>
    <Panel p={[-2.6, 0.3, 0.8]} rot={[-1.2, 0.4, 0.2]} seed={2} s={0.8} /><Panel p={[2.8, 0.25, -1.5]} rot={[-1.4, -0.8, 0]} seed={5} s={0.7} blue />
    <Panel p={[-4.5, 0.6, -3.5]} rot={[-0.6, 0.8, 0.3]} seed={8} s={1.1} /><Panel p={[5.2, 0.5, -4.2]} rot={[-0.9, -0.3, 0.5]} seed={9} s={0.9} />
    <SeatRow p={[-5.5, 0.05, -6.5]} s={1.15} rot={[0, 0.7, 0.1]} belts={[false, false, false]} dirty />
    <SeatRow p={[6.4, 0.6, -7.5]} s={1.15} rot={[0.9, -0.5, 0.2]} belts={[false, false, false]} dirty />
    <GiftBox p={[1.6, 0, 1.6]} rot={0.5} c="#2f8a4a" rib="#e8403a" s={1.2} />
  </group>
));
const CrashSite: React.FC<{ t: number; juliane?: React.ReactNode; dim?: boolean }> = ({ t, juliane, dim }) => {
  const clear = useMemo(() => [[0, 0, 5.5], [0, 8, 6], [-4, 6, 4]] as [number, number, number][], []);
  return <group>
    <Env k={dim ? "jungleDim" : "jungle"} t={t} />
    <Jungle seed={3} clear={clear} x0={-28} x1={28} z0={-42} z1={16} density={0.85} />
    {[-10, 9, -15, 16].map((x, i) => <GiantTree key={i} p={[x, 0, -11 - i * 4]} seed={30 + i} s={1.1} />)}
    <Wreck t={t} />
    <SeatRow p={[0, 0, 0]} s={1.15} rot={[0, 0.15, 0.04]} belts={[false, true, true]} dirty />
    {juliane}
    <Rays t={t} items={[{ x: 0.5, z: -0.5, w: 3.4, h: 22, a: -0.25 }, { x: -3, z: -5, w: 1.8, h: 20, a: -0.3 }, { x: 4, z: -8, w: 2.2, h: 22, a: -0.28 }]} op={0.2} />
    <Motes t={t} n={60} area={[12, 6, 10]} />
    <Butterflies t={t} n={2} c={[2, 2.4, -2]} r={3} />
    <Mist t={t} n={8} area={[40, 2, 20]} c={[0, 0.8, -16]} op={0.3} />
  </group>;
};
/* 7. DAY ONE: she wakes on the jungle floor, still strapped to her row of seats */
export const SWake: React.FC<SceneProps> = ({ t }) => <CrashSite t={t} juliane={<Seated look="julMud" row={[0.04, 0.02, 0.02]} i={2} t={t} expr={t < 1.6 ? "sleep" : t < 1.9 ? "blink" : "worried"} seed={4} still={t < 1.6} />} />;
/* 8. collarbone broken, one eye swollen, glasses and one shoe lost */
export const SHurt: React.FC<SceneProps> = ({ t }) => (
  <CrashSite t={t} juliane={<>
    <Seated look="julMud" row={[0.04, 0.02, 0.02]} i={2} t={t} expr="strain" pose="cross" seed={4} />
    <Glasses p={[1.6, 0.04, 1.4]} rot={[-Math.PI / 2, 0, 0.4]} s={1.2} />
    <Shoe p={[2.3, 0, 1.0]} rot={[0, 0.9, 0.2]} s={1.2} />
  </>} />
);
/* 9a. her mom is gone */
export const SGone: React.FC<SceneProps> = ({ t }) => {
  const x = lerp(-1.2, 1.4, sm(t / 2.6));
  return <CrashSite t={t} juliane={<P look="julMud" p={[x, 0, 2.4]} t={t} pose="walk" yaw={0.9} expr="worried" seed={4} gait={0.7} amp={0.6} />} />;
};
/* 9b. a small bag of candy */
export const SCandy: React.FC<SceneProps> = ({ t }) => (
  <CrashSite t={t} juliane={<P look="julMud" p={[0.6, 0, 2.6]} t={t} pose="point" expr="think" seed={4} handR={<CandyBag p={[0, -0.12, 0.05]} s={0.55} spill={false} />} />} />
);
/* 10. DAY TWO: but she knows something most people don't */
export const SThink: React.FC<SceneProps> = ({ t }) => (
  <CrashSite t={t} juliane={<P look="julMud" p={[0.4, 0, 2.6]} t={t} pose="idle" expr="think" seed={4} handR={<CandyBag p={[0, -0.12, 0.05]} s={0.55} spill={false} />} />} />
);
/* ------------------------------------------------------------------ memory: the research station (warm, golden) */
const Station: React.FC<{ t: number; children?: React.ReactNode; k?: EnvKind; sign?: boolean; board?: boolean }> = ({ t, children, k = "memory", sign = false, board = false }) => {
  const clear = useMemo(() => [[0, 1, 7.5], [0, 9, 6]] as [number, number, number][], []);
  return <group>
    <Env k={k} t={t} shadow={18} />
    <Jungle seed={11} clear={clear} x0={-30} x1={30} z0={-40} z1={16} density={0.75} />
    <mesh material={toonT("mudpath", () => repT(mudTex(), 3, 3))} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]} receiveShadow><circleGeometry args={[7.2, 40]} /></mesh>
    <Hut p={[-1.2, 0, -3.2]} />
    <Hut p={[7.5, 0, -6]} rot={-0.4} s={0.8} />
    {sign ? <SignBoard p={[4.6, 0, 0.6]} rot={-0.3} lines={["PANGUANA", "RESEARCH STATION"]} w={3.4} h={1.5} fg="#2f5a3a" /> : null}
    {board ? <SignBoard p={[-3.4, 0, 1.6]} rot={0.3} lines={["FLIGHT 508", "92 ON BOARD", "1 SURVIVOR"]} w={3.0} h={2.2} bg="#26332c" fg="#f2f0e4" font="Lilita One" /> : null}
    <Butterflies t={t} n={4} c={[1, 2.2, 0]} r={4} />
    <Motes t={t} n={50} area={[14, 5, 10]} />
    <Rays t={t} items={[{ x: -2, z: -2, w: 3, h: 22, a: -0.3 }, { x: 5, z: -6, w: 2.4, h: 22, a: -0.32 }]} op={0.18} />
    {children}
  </group>;
};
/* 11. her parents were scientists who studied this exact jungle */
export const SParents: React.FC<SceneProps> = ({ t }) => (
  <Station t={t}>
    <LabTable p={[0.6, 0, 0.4]} />
    <P look="dadPlain" p={[-0.6, 0, 1.2]} t={t} s={1.3} pose="point" expr="think" seed={6} />
    <P look="mom" p={[1.9, 0, 1.3]} t={t} s={1.25} pose="hold" expr="grin" seed={2} />
    <P look="julYoung" p={[3.4, 0, 2.2]} t={t} s={0.95} pose="idle" expr="grin" seed={9} />
  </Station>
);
/* 12a. "If you're ever lost, find water." */
const Brook: React.FC<{ t: number; w?: number; z?: number }> = ({ t, w = 1.6, z = 0 }) => (
  <group><Water p={[0, 0.05, z]} w={80} d={w} t={t} flow={0.05} /><Bank p={[0, 0.02, z - w / 2 - 0.6]} w={80} d={1.4} tilt={-0.12} /><Bank p={[0, 0.02, z + w / 2 + 0.6]} w={80} d={1.4} tilt={0.12} />
    {Array.from({ length: 14 }, (_, i) => <Rock key={i} p={[-30 + i * 4.4 + (i % 3), 0.05, z + (i % 2 ? w / 2 + 0.3 : -w / 2 - 0.3)]} s={0.35 + (i % 3) * 0.12} seed={i + 40} />)}</group>
);
export const SRule1: React.FC<SceneProps> = ({ t }) => {
  const clear = useMemo(() => [[0, 1.5, 5], [0, 8, 5]] as [number, number, number][], []);
  return <group>
    <Env k="memory" t={t} />
    <Jungle seed={21} clear={clear} x0={-26} x1={26} z0={-38} z1={14} density={0.8} />
    <Brook t={t} z={-0.6} />
    <P look="dad" p={[-0.8, 0, 1.4]} t={t} s={1.3} pose="point" expr="proud" seed={6} />
    <P look="julYoung" p={[1.9, 0, 2.0]} t={t} s={0.95} pose="idle" expr="think" seed={9} />
    <Butterflies t={t} n={3} c={[2, 1.8, -1]} r={2.5} />
    <Rays t={t} items={[{ x: 1, z: -3, w: 3, h: 22, a: -0.3 }]} op={0.2} />
    <Motes t={t} n={40} />
  </group>;
};
/* 12b. "Small streams lead to bigger rivers, and rivers lead to people." (aerial, following the water) */
const stream2 = (x: number) => Math.sin(x * 0.03) * 18;
export const SRule2: React.FC<SceneProps> = ({ t }) => (
  <group>
    <Env k="air" t={t} shadow={60} />
    <SceneEnv bg="#e8dcc0" fog={["#e6dcc4", 50, 260]} />
    <Canopy y={0} seed={13} river={stream2} riverW={8} />
    <RiverRibbon f={stream2} w={3} x0={-200} x1={-40} y={-0.5} />
    <RiverRibbon f={stream2} w={9} x0={-42} x1={60} y={-0.55} />
    <RiverRibbon f={stream2} w={18} x0={58} x1={200} y={-0.6} />
    <group position={[96, -1, stream2(96) + 14]}>
      <mesh material={toonT("mudpath", () => repT(mudTex(), 3, 3))} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}><circleGeometry args={[14, 30]} /></mesh>
      {[[-6, -2, 0.3], [2, -5, -0.5], [7, 2, 0.9], [-1, 4, 0.1]].map(([x, z, r], i) => <Hut key={i} p={[x, 0, z]} rot={r} s={0.9} />)}
      <Dugout p={[-2, 0.1, -12]} rot={0.2} s={0.9} />
    </group>
    <Mist t={t} n={12} area={[220, 6, 140]} c={[0, 8, -30]} color="#f4ecd8" op={0.35} s={50} />
  </group>
);
/* 13. she finds a tiny stream and starts walking */
export const SStream: React.FC<SceneProps> = ({ t }) => {
  const clear = useMemo(() => [[0, 1, 4.5], [0, 8, 5]] as [number, number, number][], []);
  const x = lerp(-2.4, 1.6, sm(t / 3.8)); const part = sm(t / 1.2);
  return <group>
    <Env k="jungle" t={t} />
    <Jungle seed={41} clear={clear} x0={-26} x1={26} z0={-38} z1={14} density={0.85} />
    <Brook t={t} z={-0.4} w={1.0} />
    <P look="julMud" p={[x, 0, 1.6]} t={t} pose="walk" yaw={0.9} expr="proud" seed={4} gait={0.9} amp={0.8} />
    {/* foreground leaves part as she pushes through */}
    <BigLeaf p={[-4.6 - part * 1.4, 0, 4.4]} s={1.5} seed={3} kind="banana" rot={0.6} />
    <BigLeaf p={[3.8 + part * 0.8, 0, 4.8]} s={1.3} seed={8} kind="monstera" rot={-0.4} />
    <Rays t={t} items={[{ x: 0, z: -2, w: 3, h: 22, a: -0.3 }]} op={0.18} />
    <Motes t={t} n={40} />
  </group>;
};
/* ------------------------------------------------------------------ the river (days five to ten) */
type CL = [number, number, number][];
const NONE: CL = [];
const River: React.FC<{ t: number; k?: EnvKind; seed?: number; flow?: number; extra?: React.ReactNode; scroll?: number; clearNear?: CL; clearFar?: CL }> = ({ t, k = "jungle", seed = 51, flow = 0.03, extra, scroll = 0, clearNear = NONE, clearFar = NONE }) => {
  return <group>
    <Env k={k} t={t} shadow={20} />
    <Water p={[0, 0.9, -2]} w={160} d={20} t={t} flow={flow} />
    <mesh material={toonT("riverbed", () => repT(mudTex(), 30, 6))} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, -2]}><planeGeometry args={[160, 20]} /></mesh>
    <group position={[-scroll, 0, 0]}>
      <Bank p={[0, 0.6, -13.5]} w={180} d={4} tilt={-0.25} />
      <mesh material={toonT("litterbank", () => repT(litterTex(1), 24, 16))} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.1, -82.2]} receiveShadow><planeGeometry args={[220, 136]} /></mesh>
      <group position={[0, 1.1, 0]}><Jungle seed={seed} clear={clearFar} x0={-60} x1={60} z0={-46} z1={-15} density={0.8} tone={1} ground={false} /></group>
      <Bank p={[0, 0.6, 9.5]} w={180} d={4} tilt={0.25} />
      <mesh material={toonT("litterbank2", () => repT(litterTex(1), 24, 6))} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.1, 30.6]} receiveShadow><planeGeometry args={[220, 39]} /></mesh>
      <group position={[0, 1.1, 0]}><Jungle seed={seed + 1} clear={clearNear} x0={-60} x1={60} z0={11.6} z1={24} density={0.5} tone={1} ground={false} trees={0.4} /></group>
      {Array.from({ length: 10 }, (_, i) => <GiantTree key={i} p={[-45 + i * 10 + (i % 3) * 2, 1.1, -18 - (i % 2) * 3]} seed={60 + i} s={1.2} />)}
    </group>
    {extra}
    <Mist t={t} n={10} area={[80, 2, 10]} c={[0, 1.6, -8]} op={0.28} s={18} />
  </group>;
};
/* 14. DAY FIVE: wading down the river, poking for stingrays */
export const SWade: React.FC<SceneProps> = ({ t }) => {
  const z = lerp(-3.4, -1.2, t / 5.2); const poke = Math.max(0, Math.sin(t * 2.4));
  return <River t={t} extra={<>
    <P look="julMud" p={[0.2, 0.15, z]} t={t} pose="point" expr="strain" seed={4} shadow={false} power={0.6} handR={<group rotation={[0, 0, -0.9 - poke * 0.3]}><Stick len={2.4} /></group>} />
    <Ripples p={[0.2, 0.92, z + 0.1]} t={t} n={3} s={1.2} />
    <Ripples p={[1.6, 0.92, z + 0.6 + poke * 0.1]} t={t * 1.4} n={2} s={0.6} />
    <Stingray p={[lerp(2.0, 6.0, sm((t - 1.8) / 2.6)), 0.6, z + 1.4]} t={t} s={0.9} />
  </>} />;
};
/* 15a. rescue planes fly right over her head */
export const SPlaneUp: React.FC<SceneProps> = ({ t }) => {
  const px = lerp(-50, 50, t / 2.8);
  return <group>
    <River t={t} extra={<P look="julMud" p={[0, 0.15, -0.5]} t={t} pose="cheer" expr="shock" seed={4} shadow={false} />} />
    <Airliner p={[px, 38, -36]} rot={[0, 0, 0.05]} s={0.6} t={t} />
  </group>;
};
/* 15b. they can't see her through the trees (top view) */
export const SAerial: React.FC<SceneProps> = ({ t }) => (
  <group>
    <Env k="air" t={t} shadow={80} />
    <Canopy y={0} seed={17} />
    <Mist t={t} n={14} area={[220, 6, 160]} c={[0, 7, -20]} color="#eef2ea" op={0.35} s={50} />
    <Airliner p={[lerp(-10, 30, t / 2.8), 28, 0]} s={0.7} t={t} />
  </group>
);
/* 16. the candy runs out */
const CL_EMPTY: CL = [[0, 14.5, 5.5]];
export const SEmpty: React.FC<SceneProps> = ({ t }) => (
  <River t={t} k="jungleDim" clearNear={CL_EMPTY} extra={<>
    <Log p={[-0.6, 1.1, 12.2]} len={4} rad={0.32} rot={0.1} />
    <P look="julMud" p={[0.4, 1.1, 12.9]} t={t} pose="point" expr="worried" seed={4} shadow={false} handR={<CandyBag rot={[Math.PI, 0, 0]} p={[0, 0.1, 0.05]} s={0.55} empty />} />
  </>} />
);
const CL_WEAK: CL = [[0, 15, 7]];
/* 17. DAY NINE: a cut full of maggots, she can barely stand */
export const SWeak: React.FC<SceneProps> = ({ t }) => {
  const x = lerp(-2.2, 0.8, t / 4.6);
  return <River t={t} k="jungleDim" clearNear={CL_WEAK} extra={<>
    <P look="julMud" p={[x, 1.1, 12.4]} t={t} pose="walk" yaw={0.9} expr="strain" seed={4} lean={-0.12} gait={0.55} amp={0.5} handR={<Maggots t={t} n={14} />} />
  </>} />;
};
/* 18. a boat, and a path, and a little wooden hut */
const CL_REVEAL: CL = [[-6.5, -14, 3.5], [-1.6, -16, 3], [3.6, -19.5, 5.5]];
export const SReveal: React.FC<SceneProps> = ({ t }) => (
  <River t={t} k="jungle" clearFar={CL_REVEAL} extra={<>
    <Dugout p={[-6.5, 0.5, -11.6]} rot={0.15} s={1.0} />
    <mesh material={toonT("mudpath", () => repT(mudTex(), 3, 3))} rotation={[-Math.PI / 2, 0, 0.6]} position={[-1.2, 1.13, -16.2]}><planeGeometry args={[1.8, 7]} /></mesh>
    <Hut p={[3.6, 1.1, -19.5]} rot={-0.25} low />
  </>} />
);
/* hut interior (low hut on the riverbank) */
const HutInside: React.FC<{ t: number; children?: React.ReactNode; tally?: number; can?: boolean }> = ({ t, children, tally, can = true }) => {
  const clear = useMemo(() => [[0, 0, 4], [0, 8, 5]] as [number, number, number][], []);
  return <group>
    <Env k="jungleDim" t={t} shadow={10} />
    <Jungle seed={61} clear={clear} x0={-24} x1={24} z0={-34} z1={14} density={0.7} />
    <Hut p={[0, 0, 0]} low>
      {can ? <GasCan p={[1.6, 0.35, -1.2]} /> : null}
      <Ink geometry={box(1.6, 0.6, 0.7)} material={toon("#7a5436")} position={[-1.6, 0.65, -1.4]} px={1.4} />
      {tally !== undefined ? <TallyBoard p={[0.6, 1.9, -1.9]} n={tally} s={0.9} /> : null}
      {children}
    </Hut>
    <Motes t={t} n={30} area={[6, 3, 4]} c={[0, 0, 0]} />
  </group>;
};
/* 19. she finds a can of gasoline and pours it on her arm */
export const SPour: React.FC<SceneProps> = ({ t, at }) => {
  const tp = at(19, "pours"); const pour = sm((t - tp + 0.4) / 0.5);
  const liq = memo("gasliq", () => new THREE.MeshBasicMaterial({ color: "#e8c878", transparent: true, opacity: 0.7 }));
  return <HutInside t={t} can={false}>
    <P look="julMud" p={[-0.2, 0.3, 0.6]} t={t} pose="point" expr={pour > 0.5 ? "strain" : "think"} seed={4} shadow={false}
      handR={<group rotation={[0, 0, -0.5 - pour * 1.4]}><GasCan p={[-0.25, -0.3, 0.05]} s={0.8} /></group>} />
    {pour > 0.3 ? <mesh material={liq} position={[0.25, 1.0, 0.75]}><cylinderGeometry args={[0.025, 0.04, 0.9 * pour, 8]} /></mesh> : null}
  </HutInside>;
};
/* 20. thirty maggots crawl out. She counts them. (tally marks on the wall) */
export const STally: React.FC<SceneProps> = ({ t, at }) => {
  const t0 = at(20, "thirty"), t1 = at(20, "counts") + 0.9; const n = Math.round(clamp((t - t0) / Math.max(0.5, t1 - t0)) * 30);
  return <HutInside t={t} tally={n}>
    <P look="julMud" p={[-0.6, 0.3, 0.2]} t={t} pose="point" expr={t > at(20, "she") ? "deadpan" : "strain"} seed={4} shadow={false} handR={<Maggots t={t} n={Math.max(0, 30 - n)} fall={clamp((t - t0) / 3)} />} />
  </HutInside>;
};
/* 21. You see, the safest thing looked like staying at the crash (crane up through the canopy) */
export const SYouSee: React.FC<SceneProps> = ({ t }) => (
  <group>
    <CrashSite t={t} />
    <Canopy y={24} seed={23} w={260} d={260} hole={[0, -2, 9]} />
    <Airliner p={[lerp(-80, 60, t / 5), 70, -40]} s={0.7} t={t} />
  </group>
);
/* 22. under trees that thick, nobody would ever have found her (from the search plane) */
export const SThick: React.FC<SceneProps> = ({ t }) => (
  <group>
    <Env k="air" t={t} shadow={80} />
    <group position={[-t * 14, 0, 0]}><Canopy y={0} seed={29} w={600} /></group>
    <Mist t={t} n={16} area={[260, 6, 180]} c={[0, 9, -30]} color="#f2f4ee" op={0.45} s={60} />
    <Airliner p={[0, 34, 6]} s={0.8} t={t} rot={[0, 0, 0.12]} />
  </group>
);
/* 23. one sentence from her dad got her moving */
export const SMoving: React.FC<SceneProps> = ({ t }) => {
  const z = lerp(-4.5, -1.6, t / 3.4);
  return <River t={t} k="jungle" extra={<>
    <P look="julMud" p={[0.4, 0.15, z]} t={t} pose="walk" expr="proud" seed={4} shadow={false} gait={0.8} amp={0.6} handR={<group rotation={[0, 0, -0.4]}><Stick len={2.2} /></group>} />
    <Ripples p={[0.4, 0.92, z + 0.1]} t={t} n={3} s={1.2} />
    <Rays t={t} items={[{ x: 0, z: -6, w: 4, h: 24, a: -0.3 }, { x: 5, z: -9, w: 3, h: 24, a: -0.3 }]} op={0.25} />
  </>} />;
};
/* 24. DAY TEN: three loggers walk into the hut */
export const SLoggers: React.FC<SceneProps> = ({ t }) => {
  const arrive = (d: number) => clamp((t - d) / 2.2);
  const lg = [["log1", 1.9, 0], ["log2", 2.8, 0.35], ["log3", 3.7, 0.7]] as [string, number, number][];
  return <HutInside t={t}>
    <P look="julMud" p={[-1.2, 0.3, 0.4]} t={t} pose="idle" expr="deadpan" seed={4} shadow={false} />
    {lg.map(([l, x, d], i) => { const k = arrive(d); const walking = k < 1; return <P key={i} look={l} p={[lerp(x + 6, x - 1.2, sm(k)), 0.3, 0.1 + i * 0.35]} t={t} pose={walking ? "walk" : "idle"} yaw={walking ? -0.9 : 0} expr={walking ? "deadpan" : "shock"} seed={20 + i} s={1.28} emph={walking ? 0 : 0.6} />; })}
  </HutInside>;
};
/* 25. she explains, very politely, that she fell out of a plane */
export const SPolite: React.FC<SceneProps> = ({ t }) => (
  <HutInside t={t}>
    <P look="julMud" p={[-1.2, 0.3, 0.4]} t={t} pose="point" expr="grin" seed={4} shadow={false} />
    <P look="log1" p={[0.7, 0.3, 0.1]} t={t} s={1.28} expr="shock" seed={20} pose="idle" emph={0.5} />
    <P look="log2" p={[1.6, 0.3, 0.45]} t={t} s={1.28} expr="shock" seed={21} pose="cross" />
    <P look="log3" p={[2.5, 0.3, 0.8]} t={t} s={1.28} expr="shock" seed={22} pose="idle" emph={0.8} />
  </HutInside>
);
/* 26a. down the river in the loggers' boat */
export const SBoat: React.FC<SceneProps> = ({ t }) => (
  <River t={t} k="jungle" scroll={t * 3.2} flow={0.12} extra={<group position={[0, 0.45, 0.6]}>
    <Dugout p={[0, 0, 0]} s={1.1} />
    <P look="log3" p={[-2.6, 0.0, 0]} t={t} s={1.15} shadow={false} pose="crank" seed={22} expr="deadpan" />
    <P look="julMud" p={[-0.4, -0.25, 0.05]} t={t} s={1.05} shadow={false} seed={4} expr="grin" />
    <P look="log1" p={[1.4, -0.1, 0]} t={t} s={1.15} shadow={false} seed={20} expr="grin" />
    <P look="log2" p={[2.9, -0.1, 0]} t={t} s={1.15} shadow={false} seed={21} expr="deadpan" />
    <Ripples p={[-3.6, 0.48, 0]} t={t} n={3} s={1.6} />
  </group>} />
);
/* 26b. and she is flown to her dad */
export const SReunion: React.FC<SceneProps> = ({ t }) => {
  const clear = useMemo(() => [[0, 0, 9], [0, 10, 6]] as [number, number, number][], []);
  return <group>
    <Env k="dusk" t={t} shadow={20} />
    <Jungle seed={71} clear={clear} x0={-30} x1={30} z0={-40} z1={14} density={0.7} />
    <mesh material={toonT("grassstrip", () => repT(litterTex(1), 6, 2))} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]}><planeGeometry args={[60, 8]} /></mesh>
    <Airliner p={[-4, 1.3, -5]} s={0.55} t={t} spin={0.2} gear />
    <P look="dadPlain" p={[0.3, 0, 1.3]} t={t} s={1.3} pose="hold" expr="grin" seed={6} />
    <P look="julMud" p={[1.2, 0, 1.5]} t={t} s={1.15} pose="hold" expr="grin" seed={4} />
    <Motes t={t} n={40} color="#ffd0a0" />
  </group>;
};
/* 27. the only survivor out of ninety-two people on board */
export const SBoard: React.FC<SceneProps> = ({ t }) => <Station t={t} k="dusk" board />;
/* 28. today she is a biologist and runs her parents' research station */
export const SToday: React.FC<SceneProps> = ({ t }) => (
  <Station t={t} k="jungle" sign>
    <LabTable p={[1.2, 0, 0.2]} />
    <P look="julOld" p={[1.6, 0, 1.8]} t={t} s={1.15} pose="hold" expr="grin" seed={5} handR={<group><Ink geometry={box(0.3, 0.4, 0.06)} material={toon("#2f6a4a")} px={1} /></group>} />
  </Station>
);
/* 29. in the same jungle (crane up over the canopy at sunset) */
export const SFinal: React.FC<SceneProps> = ({ t }) => (
  <group>
    <Station t={t} k="dusk" sign>
      <P look="julOld" p={[2.4, 0, 1.6]} t={t} s={1.15} pose="idle" expr="proud" seed={5} />
    </Station>
    <Canopy y={24} seed={31} w={300} d={300} hole={[0, -1, 11]} />
    <Mist t={t} n={14} area={[260, 6, 200]} c={[0, 30, -40]} color="#ffd8b8" op={0.35} s={60} />
  </group>
);
void Fern; void Palm; void Log;
