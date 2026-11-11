import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon, rng, clamp, easeInOut, easeOutBack, signTexture, woodTexture, wallWithHoles } from "../hotel/kit";
import { ContactShadow, yawToward } from "../hotel/chars";
import { Person2 } from "../full/person";
import { SceneEnv, Lights } from "../full/env";
import { Glow, Scatter, Fence } from "../full/nature";
import { wallTexture } from "../full/assets";
import { Frame, Clock, Plant, Shelf, HangingLamp, SunWindow } from "../rats/props";
import { emo } from "../full/scenes";
import { Emu } from "./emu";
import { Sky, OutbackHorizon, RedDirt, Wheat, GumTree, Windmill, Shed, LewisGun, Truck, Puffs, Casings, SunDust, TX, cv } from "./world";
import { INKD } from "../full/paint";
import timing from "./timing.json";

type V3 = [number, number, number];
export type SceneProps = { t: number; cam: V3 };
const wordIn = (shot: number, word: string, fb: number) => {
  const s0 = shot === 0 ? 0 : timing.starts[shot] - 0.1; const s1 = shot + 1 < timing.starts.length ? timing.starts[shot + 1] - 0.1 : 1e9;
  const w = (timing.words as [string, number, number][]).find((x) => x[1] >= s0 && x[1] < s1 && x[0].toLowerCase().replace(/[^a-z]/g, "").startsWith(word));
  return w ? w[1] - s0 : fb;
};
const tc = (t: THREE.Texture, rx: number, ry: number) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); return c; };

const P: React.FC<{ look: any; p: V3; cam: V3; t: number; s?: number; expr?: any; pose?: any; seed?: number; yaw?: number; lean?: number; emph?: number; handR?: React.ReactNode; tint?: string; shadow?: boolean }> = ({ look, p, cam, t, s = 1.3, expr = "deadpan", pose = "idle", seed = 1, yaw, lean, emph, handR, tint, shadow = true }) => (
  <>
    <Person2 look={look} expr={expr} t={t} position={p} yaw={yaw ?? yawToward(p, cam)} scale={s} seed={seed} pose={pose} lean={lean} emph={emph} handR={handR} tint={tint} />
    {shadow ? <ContactShadow position={[p[0], p[1] + 0.02, p[2]]} r={0.42 * s} /> : null}
  </>
);
const E: React.FC<{ t: number; cam: V3; p: V3; s?: number; face?: 1 | -1; expr?: string; mode?: any; seed?: number; shade?: number; lean?: number; tint?: string }> = ({ t, cam, p, s = 1.15, face = 1, expr = "deadpan", mode = "stand", seed = 1, shade = 0, lean = 0, tint }) => <Emu t={t} cam={cam} position={p} scale={s} facing={face} expr={expr} mode={mode} seed={seed} shade={shade} lean={lean} tint={tint} />;

const KIND = {
  gold: { bg: "#f1c48a", fog: ["#f1c48a", 30, 150] as [string, number, number], light: "#ffc27a", inten: 3.0, pos: [-20, 9, 10] as V3, hemi: ["#ffe0b0", "#a8704a", 1.0] as [string, string, number] },
  day: { bg: "#ecd6b8", fog: ["#ecd8bc", 34, 170] as [string, number, number], light: "#fff0cc", inten: 2.7, pos: [-14, 16, 12] as V3, hemi: ["#cfe8ff", "#b98c6a", 1.2] as [string, string, number] },
  dusk: { bg: "#d98a7a", fog: ["#d9907c", 26, 140] as [string, number, number], light: "#ff9a60", inten: 2.7, pos: [16, 6, 12] as V3, hemi: ["#ffb090", "#6a4a5a", 0.95] as [string, string, number] },
};
const Outback: React.FC<{ kind: "gold" | "day" | "dusk"; t: number; ground?: boolean; children?: React.ReactNode }> = ({ kind, t, ground = true, children }) => {
  const k = KIND[kind];
  return (<>
    <SceneEnv bg={k.bg} fog={k.fog} />
    <Lights color={k.light} intensity={k.inten} pos={k.pos} hemi={k.hemi} shadowSize={26} />
    <Sky kind={kind} t={t} /><OutbackHorizon tone={kind} />{ground ? <RedDirt /> : null}
    {children}
  </>);
};

/* ============================ the standoff (shots 1 and 4) ============================ */
const SLOTS: [number, number][] = [[1.5, 0.3], [2.7, -1.0], [2.9, 1.5], [4.0, 0.2], [4.4, -1.7], [5.3, 1.0], [6.0, -0.4]];
const DIRS: [number, number, number][] = [[1, -0.5, 6.2], [1, 0.35, 6.8], [0.8, 0.9, 6.0], [0.5, -1, 6.4], [1, 0, 7.0], [0.7, 0.9, 6.6], [0.3, -1, 5.8]];
const Standoff: React.FC<SceneProps & { splitAt?: number; lead?: number }> = ({ t, cam, splitAt = 1e9, lead = 0 }) => {
  const s = Math.max(0, t - splitAt); const shock = s > 0;
  const pop = useMemo(() => { const r = rng(5); return Array.from({ length: 40 }, () => ({ x: -16 + r() * 36, z: -3 - r() * 8 })); }, []);
  return (
    <group>
      <Outback kind="gold" t={t}>
        <Wheat x={0} z={11.5} w={36} d={12} n={4200} t={t} seed={1} h={1.2} />
        <Wheat x={0} z={-8.5} w={44} d={9} n={3200} t={t} seed={2} h={1.1} />
        <Fence p={[-22, 0, -3.7]} n={44} />
        <Scatter count={420} w={30} d={7} z={0} seed={3} size={0.05} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        <Windmill p={[-11, 0, -15]} t={t} s={1.15} /><Shed p={[11, 0, -15]} rot={-0.3} />
        <GumTree p={[-15, 0, -10.5]} s={1.2} seed={2} /><GumTree p={[6, 0, -12.5]} s={1.4} seed={5} /><GumTree p={[16.5, 0, -8]} s={1.1} seed={7} /><GumTree p={[-4, 0, -17]} s={1.3} seed={9} />
        <LewisGun p={[-2.3, 0, 0.1]} rot={0} s={1.1} />
        <P look="soldier" p={[-3.3, 0, 0.2]} cam={cam} t={t} s={1.3} expr={shock ? "shock" : "deadpan"} pose="hold" seed={3} yaw={0.9} />
        <P look="officer" p={[-4.8, 0, -1.2]} cam={cam} t={t} s={1.35} expr={shock ? "angry" : "proud"} pose="point" seed={4} yaw={0.9} emph={shock ? 1 : 0} />
        <P look="soldier" p={[-4.0, 0, 1.5]} cam={cam} t={t} s={1.28} expr={shock ? "worried" : "think"} pose="hold" seed={5} yaw={0.9} />
        <P look="soldier" p={[-5.6, 0, -1.6]} cam={cam} t={t} s={1.28} expr={shock ? "shock" : "deadpan"} pose="idle" seed={6} yaw={0.9} />
        <P look="soldier" p={[-5.2, 0, 0.7]} cam={cam} t={t} s={1.25} expr="deadpan" pose="idle" seed={7} yaw={0.9} />
        {SLOTS.map(([sx, sz], i) => {
          const d = DIRS[i]; const run = s > 0; const move = run ? d[2] * (s + 0.12 * (1 - Math.exp(-s * 5)) * 0) : 0;
          const ln = Math.hypot(d[0], d[1]); const x = sx - (i === 0 ? lead * 0.7 : 0) + (d[0] / ln) * move, z = sz + (d[1] / ln) * move;
          return <E key={i} t={t} cam={cam} p={[x, 0, z]} s={1.2 - (i % 3) * 0.04} face={run ? (d[0] > 0 ? -1 : 1) : 1} expr={i === 0 ? (lead > 0.3 ? "smug" : "smug") : i % 3 === 0 ? "alert" : "deadpan"} mode={run ? "run" : i === 4 ? "peck" : "stand"} seed={i + 2} shade={i % 2} />;
        })}
        <SunDust t={t} n={46} area={[26, 5, 16]} />
      </Outback>
    </group>
  );
};
export const E1Hook: React.FC<SceneProps> = ({ t, cam }) => <Standoff t={t} cam={cam} lead={easeInOut(clamp((t - 3.4) / 0.9))} />;
export const E4But: React.FC<SceneProps> = ({ t, cam }) => <Standoff t={t} cam={cam} splitAt={wordIn(3, "they", 2.3) - 0.1} />;

/* ============================ 2: drought, the emus and the farmers ============================ */
export const E2Setup: React.FC<SceneProps> = ({ t, cam }) => {
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: signTexture("CAMPION", "#c8403a", "#fff3cf", 576, 128) }), []);
  const flock = useMemo(() => { const r = rng(17); return Array.from({ length: 36 }, (_, i) => ({ z: i < 26 ? -4.5 - (i % 6) * 1.6 + (r() - 0.5) : 0.2 + ((i - 26) % 5) * 0.7, sp: 3.2 + r() * 1.4, off: r() * 40, s: 0.95 + r() * 0.2 })); }, []);
  const dust = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: -14 + (i % 11) * 3, y: 0.5, z: -5 - (i % 5) * 1.6, born: i * 0.35, life: 2.2, s0: 0.8, s1: 2.6, rise: 0.4, op: 0.45 })), []);
  return (
    <group>
      <Outback kind="day" t={t}>
        <Wheat x={2} z={-9.5} w={44} d={11} n={4200} t={t} seed={4} h={1.1} />
        <Shed p={[-13, 0, -3.2]} rot={0.3} s={1.1} /><Windmill p={[15, 0, -2.5]} t={t} s={1.2} />
        <GumTree p={[-9, 0, 0.4]} s={1.3} seed={2} /><GumTree p={[11, 0, 1.2]} s={1.2} seed={6} />
        <Fence p={[-16, 0, 6.6]} n={34} />
        <group position={[6.8, 0, 5.6]}><Ink geometry={box(0.16, 2.6, 0.16)} material={toon("#6a4a38")} position={[-1.2, 1.3, 0]} px={2} /><Ink geometry={box(0.16, 2.6, 0.16)} material={toon("#6a4a38")} position={[1.2, 1.3, 0]} px={2} /><Ink geometry={box(2.7, 0.7, 0.1)} material={[toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), sign, toon("#2b1a1d")]} position={[0, 2.1, 0.08]} px={2.2} /></group>
        <Scatter count={520} w={36} d={14} z={2} seed={5} size={0.05} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        {flock.map((f, i) => { const x = -22 + ((t * f.sp + f.off) % 46); return <E key={i} t={t} cam={cam} p={[x, 0, f.z]} s={f.s} face={-1} mode="run" expr="deadpan" seed={i + 1} shade={i % 2} />; })}
        <Puffs items={dust} t={t} tint="#d9b896" />
        
        <P look="farm" p={[-2.6, 0, 4.2]} cam={cam} t={t} s={1.45} expr={emo(t, [[0, "worried"], [4.2, "shock"], [7.5, "angry"]])} pose={t > 5 ? "cheer" : "point"} seed={11} emph={t > 5 ? 1 : 0} />
        <P look="farm" p={[1.4, 0, 5.4]} cam={cam} t={t} s={1.35} expr={emo(t, [[0, "deadpan"], [5.5, "worried"], [8, "angry"]])} pose="hold" seed={12} yaw={-0.9} lean={0.04} />
        <SunDust t={t} n={36} area={[30, 6, 18]} />
      </Outback>
    </group>
  );
};

/* ============================ 3: the minister sends the army ============================ */
export const E3Plan: React.FC<SceneProps> = ({ t, cam }) => {
  const x = TX(); const wallP = useMemo(() => toon(tc(wallTexture("#7aa08a", "#4f7a64", 3), 3, 1)), []);
  const wallGeo = useMemo(() => wallWithHoles(20, 7.6, 0.5, [{ x: 4.4, y: 1.5, w: 3.6, h: 3.0 }]), []);
  const floor = useMemo(() => toon(tc(cv(512, 512, (g, w, h) => { const r = rng(5); const rows = 8, rh = h / rows; for (let i = 0; i < rows; i++) { const y = i * rh; let x = -r() * 200; while (x < w) { const len = 180 + r() * 220; const c = ["#b47a46", "#ac7040", "#bb824c", "#a86c3c"][Math.floor(r() * 4)]; g.fillStyle = c; g.fillRect(x, y, len, rh); g.fillStyle = "rgba(60,30,12,.55)"; g.fillRect(x, y, 3, rh); for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(70,36,14,.10)"; g.fillRect(x + 6, y + 6 + k * (rh / 4.4), len - 12, 2); } x += len; } g.fillStyle = "rgba(50,24,8,.6)"; g.fillRect(0, y, w, 3); g.fillStyle = "rgba(255,225,170,.12)"; g.fillRect(0, y + 3, w, 3); } }, true), 3, 3)), []);
  const rug = useMemo(() => toon(cv(256, 256, (g, w, h) => { g.fillStyle = "#8a2f2a"; g.fillRect(0, 0, w, h); g.fillStyle = "#c9a24a"; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = "#8a2f2a"; g.fillRect(28, 28, w - 56, h - 56); g.fillStyle = "#3a5a7a"; g.beginPath(); g.moveTo(w / 2, 56); g.lineTo(w - 56, h / 2); g.lineTo(w / 2, h - 56); g.lineTo(56, h / 2); g.closePath(); g.fill(); }, true)), []);
  const mapMat = useMemo(() => new THREE.MeshBasicMaterial({ map: x.map }), [x]);
  const tx = -8 + t * 3.6;
  return (
    <group>
      <SceneEnv bg="#ecd6b8" fog={["#ecd8bc", 40, 170]} />
      <Lights color="#fff0cc" intensity={2.4} pos={[-8, 12, 10]} hemi={["#fff0d8", "#a8805a", 1.2]} shadowSize={14} extra={<pointLight position={[-2, 4.5, 2]} intensity={14} color="#ffd890" distance={12} />} />
      <Sky kind="day" t={t} /><OutbackHorizon tone="day" /><RedDirt />
      <Ink geometry={wallGeo} material={wallP} position={[0, 0, -3]} px={2.4} />
      {/* window frame + a truck of soldiers passing outside */}
      <group position={[4.4, 3.0, -2.72]}><Ink geometry={box(3.9, 0.2, 0.3)} material={toon("#6a4a2c")} position={[0, 1.6, 0]} px={2} cast={false} /><Ink geometry={box(3.9, 0.2, 0.3)} material={toon("#6a4a2c")} position={[0, -1.6, 0.05]} px={2} cast={false} /><Ink geometry={box(0.2, 3.4, 0.3)} material={toon("#6a4a2c")} position={[-1.9, 0, 0]} px={2} cast={false} /><Ink geometry={box(0.2, 3.4, 0.3)} material={toon("#6a4a2c")} position={[1.9, 0, 0]} px={2} cast={false} /><Ink geometry={box(0.12, 3.0, 0.12)} material={toon("#fff3dd")} position={[0, 0, 0.05]} px={1.4} cast={false} /><Ink geometry={box(3.6, 0.12, 0.12)} material={toon("#fff3dd")} position={[0, 0.2, 0.05]} px={1.4} cast={false} /></group>
      <Truck p={[tx, 0, -6.4]} t={t} s={1.0} speed={3.6} gun bounce={0.7} />
      <P look="soldier" p={[tx - 1.2, 1.15, -6.4]} cam={cam} t={t} s={0.8} expr="deadpan" pose="hold" seed={21} yaw={0.9} shadow={false} />
      <P look="soldier" p={[tx - 2.0, 1.15, -6.2]} cam={cam} t={t} s={0.8} expr="proud" pose="idle" seed={22} yaw={0.9} shadow={false} />
      <Ink geometry={box(18, 0.3, 11)} material={floor} position={[0, -0.15, 2.5]} px={2.4} />
      <mesh position={[-1.5, 0.02, 1.6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[7, 5]} /><primitive object={rug} attach="material" /></mesh>
      <Ink geometry={box(20, 0.9, 0.3)} material={toon("#6a4a30")} position={[0, 0.45, -2.6]} px={2.2} />
      <group position={[-5.6, 4.0, -2.7]}><Ink geometry={box(4.4, 3.3, 0.16)} material={toon("#4a3020")} px={2.2} cast={false} /><mesh position={[0, 0, 0.1]} material={mapMat}><planeGeometry args={[4.0, 3.0]} /></mesh></group>
      <Clock p={[-1.6, 6.3, -2.7]} t={t} s={1.5} /><Frame p={[0.6, 5.6, -2.75]} w={1.3} h={1.0} k={1} /><Shelf p={[-9, 3.2, -2.5]} w={3.0} /><Plant p={[-9, 0, -1.6]} s={2.0} t={t} /><Plant p={[8.8, 0, -1.6]} s={2.0} t={t} />
      <HangingLamp p={[-1.5, 7.2, 1.2]} t={t} />
      {/* desk (the people stand beside it, never inside it) */}
      <group position={[-2.6, 0, -0.6]}>
        <Ink geometry={box(4.4, 0.2, 1.7)} material={toon("#7a4624")} position={[0, 1.45, 0]} px={2.4} />
        <Ink geometry={box(0.5, 1.4, 1.6)} material={toon("#6a3e20")} position={[-1.85, 0.7, 0]} px={2} /><Ink geometry={box(0.5, 1.4, 1.6)} material={toon("#6a3e20")} position={[1.85, 0.7, 0]} px={2} /><Ink geometry={box(3.6, 1.2, 0.12)} material={toon("#6a3e20")} position={[0, 0.8, -0.74]} px={2} />
        <Ink geometry={box(0.7, 0.04, 0.5)} material={toon("#f2ecd8")} position={[-0.9, 1.57, 0.2]} rotation={[0, 0.3, 0]} px={1} cast={false} /><Ink geometry={box(0.6, 0.04, 0.45)} material={toon("#f2ecd8")} position={[-0.3, 1.58, 0.3]} rotation={[0, -0.2, 0]} px={1} cast={false} />
        <Ink geometry={new THREE.CylinderGeometry(0.1, 0.12, 0.14, 12)} material={toon("#2a2a34")} position={[1.0, 1.62, 0]} px={1.4} cast={false} />
        <group position={[1.5, 1.55, -0.3]}><Ink geometry={new THREE.CylinderGeometry(0.05, 0.08, 0.5, 8)} material={toon("#7a5a2a")} position={[0, 0.25, 0]} px={1.2} cast={false} /><Ink geometry={new THREE.ConeGeometry(0.28, 0.26, 14, 1, true)} material={toon("#2f8a6a", { side: THREE.DoubleSide })} position={[0, 0.62, 0]} px={1.6} cast={false} /><Glow p={[0, 0.5, 0.2]} s={1.8} /></group>
      </group>
      <P look="owner" p={[3.0, 0, 0.6]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "deadpan"], [1.2, "proud"]])} pose="point" seed={13} yaw={-0.9} />
      <P look="farm" p={[-5.4, 0, 2.6]} cam={cam} t={t} s={1.4} expr={emo(t, [[0, "worried"], [1.8, "grin"]])} pose="hold" seed={14} yaw={0.9} />
      <P look="farm" p={[-3.6, 0, 3.4]} cam={cam} t={t} s={1.35} expr="think" pose="idle" seed={15} yaw={0.9} />
      <SunDust t={t} n={26} area={[16, 6, 10]} />
    </group>
  );
};

/* ============================ 5: the range ring ============================ */
export const E5Then: React.FC<SceneProps> = ({ t, cam }) => {
  const stones = useMemo(() => { const r = rng(4); return Array.from({ length: 72 }, (_, i) => ({ a: (i / 72) * Math.PI * 2, s: 0.16 + r() * 0.1, k: 0.9 + r() * 0.2 })); }, []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []); const lime = useMemo(() => toon("#f1e9d6"), []);
  const R = 6.4;
  const step = Math.sin(clamp((t - 0.8) / 2.6) * Math.PI) * 1.6;
  const pace = [0.5, 1.0, 2.4, 1.7, 2.9, 3.6, 5.5];
  return (
    <group>
      <Outback kind="day" t={t}>
        <Wheat x={0} z={-15} w={50} d={8} n={3200} t={t} seed={8} h={1.1} />
        <Scatter count={380} w={24} d={24} z={0} seed={9} size={0.05} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        {stones.map((q, i) => <Ink key={i} geometry={geo} material={lime} position={[Math.cos(q.a) * R, 0.06, Math.sin(q.a) * R]} scale={[q.s * 1.5, q.s * 0.7, q.s * q.k]} px={1.2} cast={false} />)}
        <LewisGun p={[0, 0, 0]} rot={0} s={1.3} />
        <P look="soldier" p={[-1.4, 0, 0.1]} cam={cam} t={t} s={1.3} expr="worried" pose="hold" seed={5} yaw={0.9} />
        <P look="officer" p={[-2.5, 0, 1.7]} cam={cam} t={t} s={1.3} expr="angry" pose="point" seed={6} yaw={0.9} emph={1} />
        {pace.map((a, i) => { const ang = a + Math.sin(t * 0.5 + i) * 0.05; const rad = R + 1.0 + (i === 3 ? -step : 0.0) + (i % 2) * 0.3; return <E key={i} t={t} cam={cam} p={[Math.cos(ang) * rad, 0, Math.sin(ang) * rad]} s={1.2} face={Math.cos(ang) > 0 ? 1 : -1} mode={i === 3 ? "walk" : i === 5 ? "peck" : "stand"} expr={i === 3 ? "smug" : "deadpan"} seed={i + 4} shade={i % 2} />; })}
        <SunDust t={t} n={30} area={[24, 5, 24]} />
      </Outback>
    </group>
  );
};

/* ============================ 6: the truck chase ============================ */
export const E6Conflict: React.FC<SceneProps> = ({ t, cam }) => {
  const aim = wordIn(5, "aim", 7.2); const wild = clamp((t - (aim - 1.0)) / 0.8);
  const tx = -8 + t * 3.3;
  const dust = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ x: -8 + i * 0.45 * 3.3 * 0.28, y: 0.35, z: 0.1 + ((i * 7) % 3) * 0.2, born: i * 0.14, life: 1.6, s0: 0.5, s1: 2.2, rise: 0.35, op: 0.5 })), []);
  const dd = dust.map((d) => ({ ...d, x: -8 + d.born * 3.3 - 2.8 }));
  const smoke = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ born: aim - 0.5 + i * 0.18 })), [aim]);
  return (
    <group>
      <Outback kind="day" t={t}>
        <Wheat x={6} z={-9.5} w={60} d={9} n={4200} t={t} seed={10} h={1.1} /><Wheat x={6} z={9.5} w={60} d={7} n={3000} t={t} seed={11} h={1.15} />
        <GumTree p={[2, 0, -5.8]} s={1.3} seed={4} /><GumTree p={[18, 0, -6.2]} s={1.4} seed={8} />
        <Scatter count={520} w={60} d={14} x={6} z={0} seed={12} size={0.05} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        <Truck p={[tx, 0, 0]} t={t} s={1.1} speed={3.3} gun bounce={1} fire={0} />
        <P look="soldier" p={[tx - 1.4 * 1.1, 1.25, 0]} cam={cam} t={t} s={0.95} expr={emo(t, [[0, "grin"], [aim - 1.4, "worried"], [aim, "shock"]])} pose="hold" seed={31} yaw={0.9} shadow={false} emph={wild} />
        <Puffs items={dd} t={t} tint="#d9b896" />
        <Puffs items={smoke.map((s2, i) => ({ x: tx - 0.6, y: 3.2 + i * 0.1, z: 0.1, born: s2.born, life: 1.8, s0: 0.3, s1: 1.4, rise: 1.0, op: 0.7 }))} t={t} tint="#f4f0e8" />
        {[0, 1, 2, 3, 4, 5].map((i) => { const ex = tx + 7 + i * 3.4 + t * (1.8 + i * 0.25) - (i === 0 ? 7 + Math.min(t, 6) * 1.2 : 0); return <E key={i} t={t} cam={cam} p={[i === 0 ? tx + 5.5 - Math.min(Math.max(t - 2.2, 0), 9) * 1.5 * 0 + Math.max(0, t - 4.5) * 2.4 : ex, 0, i === 0 ? 2.1 : -1.6 - (i % 3) * 1.1]} s={1.15} face={-1} mode="run" expr={i === 0 ? "smug" : "alert"} seed={i + 40} shade={i % 2} />; })}
        <SunDust t={t} n={36} area={[40, 5, 18]} />
      </Outback>
    </group>
  );
};

/* ============================ 7: the command tent and the toy map ============================ */
const Arrow: React.FC<{ from: [number, number]; ang: number; len: number; y?: number }> = ({ from, ang, len, y = 1.22 }) => {
  const m = useMemo(() => toon("#c8403a"), []);
  if (len < 0.05) return null;
  return <group position={[from[0], y, from[1]]} rotation={[0, ang, 0]}><Ink geometry={box(len, 0.03, 0.1)} material={m} position={[len / 2, 0, 0]} px={1.2} cast={false} /><Ink geometry={new THREE.ConeGeometry(0.14, 0.26, 3)} material={m} position={[len + 0.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]} px={1.2} cast={false} /></group>;
};
export const E7Pivot: React.FC<SceneProps> = ({ t, cam }) => {
  const x = TX(); const canvas = useMemo(() => toon(tc(x.canvas, 3, 2)), [x]); const floor = useMemo(() => toon(tc(woodTexture(["#9a6a44", "#8a5c3a", "#a8763e"], 4, 8, true), 3, 3)), []);
  const mapMat = useMemo(() => new THREE.MeshBasicMaterial({ map: x.map }), [x]);
  const grow = clamp((t - wordIn(6, "emus", 4.4)) / 1.1);
  const kh = useMemo(() => toon("#b6a468"), []); const brown = useMemo(() => toon("#7a6450"), []); const skin = useMemo(() => toon("#f4e6d8"), []);
  const toySol = (px: number, pz: number, k: number) => <group key={k} position={[px, 1.2, pz]}><Ink geometry={new THREE.CylinderGeometry(0.08, 0.1, 0.24, 10)} material={kh} position={[0, 0.12, 0]} px={1.2} cast={false} /><Ink geometry={new THREE.SphereGeometry(0.075, 10, 8)} material={skin} position={[0, 0.3, 0]} px={1.2} cast={false} /><Ink geometry={new THREE.CylinderGeometry(0.13, 0.13, 0.025, 12)} material={toon("#8f7f4a")} position={[0, 0.36, 0]} px={1} cast={false} /></group>;
  const toyEmu = (px: number, pz: number, k: number, rot: number) => <group key={k} position={[px, 1.2, pz]} rotation={[0, rot, 0]}><Ink geometry={new THREE.SphereGeometry(0.14, 12, 10)} material={brown} position={[0, 0.3, 0]} scale={[1.4, 1, 1]} px={1.2} cast={false} /><Ink geometry={new THREE.CylinderGeometry(0.03, 0.04, 0.3, 8)} material={toon("#a7b6c4")} position={[-0.16, 0.5, 0]} rotation={[0, 0, 0.3]} px={1} cast={false} /><Ink geometry={new THREE.SphereGeometry(0.05, 8, 8)} material={toon("#a7b6c4")} position={[-0.22, 0.66, 0]} px={1} cast={false} />{[-0.05, 0.05].map((o, i) => <Ink key={i} geometry={new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6)} material={toon("#9a9088")} position={[0, 0.12, o]} px={0.8} cast={false} />)}</group>;
  return (
    <group>
      <SceneEnv bg="#4a3a28" fog={["#4a3a28", 22, 80]} />
      <hemisphereLight args={["#ffe0b0", "#4a3020", 0.9]} />
      <directionalLight position={[-4, 9, 8]} intensity={1.5} color="#ffd8a0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-6} />
      <pointLight position={[0, 4.6, 0.6]} intensity={30} color="#ffb85a" distance={16} />
      <Ink geometry={box(18, 8, 0.3)} material={canvas} position={[0, 4, -4.5]} px={2.4} />
      <Ink geometry={box(0.3, 8, 12)} material={canvas} position={[-9, 4, 1.5]} px={2.4} /><Ink geometry={box(0.3, 8, 12)} material={canvas} position={[9, 4, 1.5]} px={2.4} />
      <Ink geometry={box(18, 0.3, 12)} material={floor} position={[0, -0.15, 1.5]} px={2.4} />
      <Ink geometry={box(18.6, 0.3, 8.2)} material={canvas} position={[0, 8.2, -0.4]} rotation={[0.38, 0, 0]} px={2.2} />
      <mesh position={[0, 0.03, 1.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 6.5]} /><meshBasicMaterial color="#6a3a2a" /></mesh>
      {/* the table and the map */}
      <Ink geometry={box(6.2, 0.2, 4.6)} material={toon("#7a4624")} position={[0, 1.1, 0]} px={2.4} />
      {[[-2.8, -2.0], [2.8, -2.0], [-2.8, 2.0], [2.8, 2.0]].map(([lx, lz], i) => <Ink key={i} geometry={box(0.24, 1.1, 0.24)} material={toon("#5a3418")} position={[lx, 0.55, lz]} px={1.8} cast={false} />)}
      <mesh position={[0, 1.215, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mapMat}><planeGeometry args={[5.6, 4.1]} /></mesh>
      {[[-1.9, -0.4], [-1.5, 0.5], [-2.1, 0.9]].map(([px, pz], i) => toySol(px, pz, i))}
      <Ink geometry={box(0.5, 0.16, 0.14)} material={toon("#5b6678")} position={[-1.4, 1.3, -0.3]} px={1.2} cast={false} />
      {[[1.6, 0.0, 0.2], [2.1, 0.7, 0.6], [1.9, -0.8, -0.2], [2.4, 0.0, 0.0], [1.3, 0.9, 0.5]].map(([px, pz, rot], i) => toyEmu(px, pz, i, rot))}
      {[[0.1, -0.2, 0.1], [0.9, 0.6, -0.7], [0.9, 0.0, 0.2], [0.8, -0.9, 0.9], [0.5, 1.0, -1.6]].map(([dx, dy, dz], i) => <Arrow key={i} from={[1.6 + (i === 0 ? 0.3 : 0.2), -0.1 + (i - 2) * 0.12]} ang={[0.5, -0.6, 0.0, 1.6, -1.2][i]} len={grow * (1.2 + i * 0.12)} />)}
      {/* lantern, mug, crates, a rolled map */}
      <group position={[0, 7.0, 0.5]} rotation={[0, 0, Math.sin(t * 1.4) * 0.05]}><mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.012, 0.012, 1.6, 6]} /><meshBasicMaterial color={INKD} /></mesh><Ink geometry={new THREE.CylinderGeometry(0.28, 0.28, 0.5, 12, 1, true)} material={toon("#3a3a3a", { side: THREE.DoubleSide })} px={1.4} cast={false} /><mesh position={[0, 0, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshBasicMaterial color="#fff2b0" /></mesh><Glow p={[0, 0, 0.2]} s={3.2} /></group>
      <Ink geometry={new THREE.CylinderGeometry(0.1, 0.09, 0.16, 12)} material={toon("#d8d8e0")} position={[2.4, 1.28, 1.7]} px={1.2} cast={false} />
      <Ink geometry={box(1.5, 1.1, 1.1)} material={toon(tc(x.plank, 2, 1))} position={[-6.6, 0.55, -2.8]} px={2} /><Ink geometry={box(1.2, 0.9, 1.0)} material={toon(tc(x.plank, 2, 1))} position={[-6.4, 1.55, -2.7]} px={2} /><Ink geometry={box(1.4, 1.0, 1.0)} material={toon(tc(x.plank, 2, 1))} position={[6.8, 0.5, -2.6]} px={2} />
      <Ink geometry={new THREE.CylinderGeometry(0.7, 0.7, 1.4, 18)} material={toon("#6a5a3a")} position={[6.4, 0.7, -3.3]} px={2} />
      {[0, 1, 2].map((i) => <Ink key={i} geometry={new THREE.CylinderGeometry(0.1, 0.1, 1.5, 10)} material={toon("#e6d6a6")} position={[6.2 + i * 0.22, 1.9, -3.3]} rotation={[0.1, 0, 0.1 + i * 0.1]} px={1.2} cast={false} />)}
      <Frame p={[-4.5, 5.6, -4.3]} w={1.5} h={1.1} k={2} /><Clock p={[4.6, 6.0, -4.3]} t={t} s={1.4} />
      <P look="officer" p={[-4.6, 0, 1.5]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "think"], [2.4, "proud"], [5.0, "smug"]])} pose="point" seed={16} yaw={0.9} />
      <P look="soldier" p={[4.6, 0, 2.0]} cam={cam} t={t} s={1.4} expr={emo(t, [[0, "think"], [4.8, "shock"]])} pose="hold" seed={17} yaw={-0.9} />
      <SunDust t={t} n={26} area={[14, 6, 10]} />
    </group>
  );
};

/* ============================ 8: round after round ============================ */
export const E8Esc: React.FC<SceneProps> = ({ t, cam }) => {
  const bursts = useMemo(() => { const a: { x: number; y: number; z: number; born: number; life: number; s0: number; s1: number; rise: number; op: number }[] = []; [-5, 0, 5].forEach((gx, g) => { for (let i = 0; i < 18; i++) a.push({ x: gx - 1.3 - i * 0.12, y: 1.05, z: -1.8 - i * 0.16, born: 0.2 + i * 0.2 + g * 0.07, life: 1.5, s0: 0.2, s1: 1.2, rise: 0.5, op: 0.55 }); }); return a; }, []);
  const flashOn = (Math.floor(t * 14) % 2) as number;
  return (
    <group>
      <Outback kind="day" t={t}>
        <Wheat x={0} z={-12} w={56} d={9} n={3600} t={t} seed={13} h={1.1} />
        <Scatter count={480} w={34} d={12} z={0} seed={14} size={0.05} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        {[-5, 0, 5].map((gx, i) => <React.Fragment key={i}>
          <LewisGun p={[gx, 0, 0]} rot={2.2} s={1.25} fire={flashOn} t={t + i * 0.3} />
          <P look="soldier" p={[gx + 1.0, 0, 1.3]} cam={cam} t={t} s={1.3} expr={emo(t, [[0, "angry"], [2.0, "worried"], [3.2, "deadpan"]])} pose="hold" seed={50 + i} yaw={-0.9} emph={t < 2 ? 1 : 0} />
        </React.Fragment>)}
        <Casings n={t * 15} center={[0, 0, 0.9]} spread={13} seed={3} />
        <Puffs items={bursts} t={t} tint="#efeae0" />
        {[0, 1, 2, 3, 4].map((i) => <E key={i} t={t} cam={cam} p={[16 - ((t * (5.0 + i * 0.5) + i * 4.5) % 34), 0, -4.5 - i * 1.0]} s={1.15} face={1} mode="run" expr="smug" seed={60 + i} shade={i % 2} />)}
        <P look="officer" p={[-9.2, 0, 1.2]} cam={cam} t={t} s={1.4} expr="worried" pose="cross" seed={55} yaw={0.9} />
        <SunDust t={t} n={30} area={[34, 5, 14]} />
      </Outback>
    </group>
  );
};

/* ============================ 9: the truck drives away at sunset ============================ */
export const E9So: React.FC<SceneProps> = ({ t, cam }) => {
  const away = -2 - t * 4.6; const dust = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ x: (i % 3) * 0.6 - 0.6, y: 0.5, z: -2 - i * 0.5, born: i * 0.1, life: 2.0, s0: 0.5, s1: 2.4, rise: 0.4, op: 0.5 })), []);
  return (
    <group>
      <Outback kind="dusk" t={t}>
        <Wheat x={-9} z={-12} w={14} d={30} n={2000} t={t} seed={15} h={1.1} /><Wheat x={9} z={-12} w={14} d={30} n={2000} t={t} seed={16} h={1.1} />
        <Fence p={[-3.6, 0, -24]} n={0} />
        <GumTree p={[-5.4, 0, -9]} s={1.4} seed={3} /><GumTree p={[5.6, 0, -15]} s={1.5} seed={6} />
        <Truck p={[0, 0, away]} t={t} s={1.1} speed={4.6} rot={Math.PI / 2} gun bounce={0.6} />
        <P look="soldier" p={[0, 1.25, away + 1.25]} cam={cam} t={t} s={0.9} expr="deadpan" pose="idle" seed={71} yaw={0.9} shadow={false} lean={0.12} />
        <Puffs items={dust.map((d) => ({ ...d, z: away + 3 + (d.z + 2) * 0.0 - d.born * 3.0 }))} t={t} tint="#e0b8a0" />
        {[[-2.4, 3.0, 0], [2.6, 2.4, 1], [-1.0, 4.6, 0], [1.8, 5.6, 1], [-3.4, 6.4, 0]].map(([ex, ez, k], i) => <E key={i} t={t} cam={cam} p={[ex as number, 0, ez as number]} s={1.3} face={(ex as number) > 0 ? -1 : 1} mode={i === 1 ? "wave" : "stand"} expr={i === 1 ? "smug" : "deadpan"} seed={80 + i} shade={(k as number)} />)}
        <SunDust t={t} n={26} area={[20, 5, 20]} />
      </Outback>
    </group>
  );
};

/* ============================ 10: a lone emu on the hill ============================ */
export const E10Payoff: React.FC<SceneProps> = ({ t, cam }) => {
  const hill = useMemo(() => { const g = new THREE.SphereGeometry(1, 40, 20); const r = rng(5); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); const k = 1 + 0.05 * Math.sin(v.x * 4 + v.z * 3) + 0.03 * Math.sin(v.z * 7); pos.setXYZ(i, v.x * k, v.y * k, v.z * k); } g.computeVertexNormals(); return g; }, []);
  const m = useMemo(() => toon(tc(TX().dirt, 5, 5)), []);
  return (
    <group>
      <Outback kind="dusk" t={t}>
        <mesh geometry={hill} material={m} position={[0, -2.6, -4]} scale={[9, 4.6, 7]} castShadow receiveShadow />
        <Wheat x={0} z={6} w={40} d={9} n={3600} t={t} seed={17} h={1.2} />
        <GumTree p={[-9, 0, -8]} s={1.3} seed={2} /><GumTree p={[10, 0, -10]} s={1.5} seed={4} />
        <Scatter count={160} w={12} d={8} z={-3.5} y={2.0} seed={17} size={0.06} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        <E t={t} cam={cam} p={[0, 2.0, -3.6]} s={1.6} face={1} mode="stand" expr="smug" seed={90} tint="#ffd2a8" />
        <SunDust t={t} n={34} area={[24, 6, 16]} />
      </Outback>
    </group>
  );
};

/* ============================ 11: the emu's legs, and the abandoned gun ============================ */
export const E11Close: React.FC<SceneProps> = ({ t, cam }) => {
  const x = TX(); const prints = useMemo(() => cv(64, 64, (g) => { g.fillStyle = "rgba(60,26,14,.55)"; for (const a of [-0.55, 0, 0.55]) { g.save(); g.translate(32, 44); g.rotate(a); g.beginPath(); g.ellipse(0, -16, 5, 17, 0, 0, 7); g.fill(); g.restore(); } }), []);
  const pm = useMemo(() => new THREE.MeshBasicMaterial({ map: prints, transparent: true, depthWrite: false }), [prints]);
  const ex = -5.4 + t * 1.5;
  return (
    <group>
      <Outback kind="gold" t={t}>
        <Wheat x={2} z={-7.5} w={34} d={7} n={3000} t={t} seed={18} h={1.15} /><Wheat x={2} z={7.5} w={34} d={6} n={2400} t={t} seed={19} h={1.2} />
        <Scatter count={520} w={20} d={9} x={0} z={0} seed={20} size={0.07} colors={["#d9a074", "#8a4a2e", "#e6c8a0", "#6a3320"]} />
        {Array.from({ length: 9 }, (_, i) => <mesh key={i} material={pm} position={[-5.6 + i * 0.85, 0.012, 0.25 + (i % 2) * 0.28]} rotation={[-Math.PI / 2, 0, Math.PI / 2 + (i % 2 ? 0.2 : -0.2)]} visible={-5.6 + i * 0.85 < ex - 0.3}><planeGeometry args={[0.5, 0.5]} /></mesh>)}
        <E t={t} cam={cam} p={[ex, 0, 0]} s={1.55} face={-1} mode="walk" expr="smug" seed={95} />
        {/* the abandoned gun, lying on its side, and a hat */}
        <group position={[4.4, 0.0, 0.5]}>
          <LewisGun p={[0, 0.34, 0]} rot={0.5} s={1.2} tripod={false} elev={0} />
          <group position={[-1.8, 0.0, 1.0]} rotation={[0, 0.5, 0]}><Ink geometry={new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28)} material={toon("#8f7f4a")} position={[0, 0.03, 0]} px={2} /><Ink geometry={new THREE.CylinderGeometry(0.3, 0.34, 0.26, 20)} material={toon("#8f7f4a")} position={[0, 0.18, 0]} px={2} /><Ink geometry={new THREE.CylinderGeometry(0.345, 0.345, 0.09, 20)} material={toon("#4a3a22")} position={[0, 0.08, 0]} px={1.4} cast={false} /></group>
        </group>
        <Casings n={36} center={[3.6, 0, 1.4]} spread={3.2} seed={5} />
        <SunDust t={t} n={24} area={[18, 4, 10]} />
      </Outback>
    </group>
  );
};
