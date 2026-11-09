import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon, rng, clamp, easeInOut, easeOutBack, woodTexture } from "../hotel/kit";
import { ContactShadow, yawToward } from "../hotel/chars";
import { Person2 } from "../full/person";
import { SceneEnv, Lights } from "../full/env";
import { SkyDome, Horizon, Scatter, Glow, Tree } from "../full/nature";
import { wallTexture } from "../full/assets";
import { emo } from "../full/scenes";
import { Frame, Clock, Plant, Shelf, HangingLamp, SunWindow } from "../rats/props";
import { Dust } from "../hotel/scene";
import { INKD } from "../full/paint";
import { AT, Gear, Lump, Machine, Fish, Bubbles, LightRays, Seaweed, Rock, Sea, Ship, Candle, Vase } from "./props";
import timing from "./timing.json";

type V3 = [number, number, number];
export type SceneProps = { t: number; cam: V3 };

const wordIn = (shot: number, word: string, fb: number) => {
  const s0 = shot === 0 ? 0 : timing.starts[shot] - 0.1; const s1 = shot + 1 < timing.starts.length ? timing.starts[shot + 1] - 0.1 : 1e9;
  const w = (timing.words as [string, number, number][]).find((x) => x[1] >= s0 && x[1] < s1 && x[0].toLowerCase().replace(/[^a-z]/g, "").startsWith(word));
  return w ? w[1] - s0 : fb;
};

let _a: any = null;
const ax = () => (_a ??= {
  wallStone: wallTexture("#d9c9a4", "#a8946a", 6), wallTeal: wallTexture("#4a9a96", "#2f6e6c", 3), wallDark: wallTexture("#3a3050", "#2a2238", 9), wallWarm: wallTexture("#8a5a3a", "#5a3a22", 4),
  floor: woodTexture(["#b47a46", "#a86c3c", "#bf8650"], 6, 7), planks: woodTexture(["#9a6a44", "#8a5c3a", "#a8763e"], 4, 8),
  sand: (() => { const t = AT().sand.clone(); t.needsUpdate = true; t.repeat.set(10, 10); return t; })(),
});

const P: React.FC<{ look: any; p: V3; cam: V3; t: number; s?: number; expr?: any; pose?: any; seed?: number; yaw?: number; handR?: React.ReactNode; tint?: string; shadow?: boolean; emph?: number }> = ({ look, p, cam, t, s = 1.2, expr = "deadpan", pose = "idle", seed = 1, yaw, handR, tint, shadow = true, emph }) => (
  <>
    <Person2 look={look} expr={expr} t={t} position={p} yaw={yaw ?? yawToward(p, cam)} scale={s} seed={seed} pose={pose} handR={handR} tint={tint} emph={emph} />
    {shadow ? <ContactShadow position={[p[0], p[1] + 0.02, p[2]]} r={0.42 * s} /> : null}
  </>
);

const Floor: React.FC<{ tex: THREE.Texture; w?: number; d?: number; y?: number; z?: number }> = ({ tex, w = 40, d = 30, y = 0, z = 0 }) => <Ink geometry={box(w, 0.3, d)} material={toon(tex)} position={[0, y - 0.15, z]} px={2.4} />;
const Room: React.FC<{ tex: THREE.Texture; w?: number; h?: number; z?: number }> = ({ tex, w = 22, h = 9, z = -3 }) => <Ink geometry={box(w, h, 0.3)} material={toon(tex)} position={[0, h / 2, z]} px={2.4} />;

/* ---------- 1: divers pull the lump out of the sea floor ---------- */
export const A1Hook: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax();
  const rise = easeInOut(clamp((t - 0.2) / 1.6));
  const tw = t * 0.5;
  return (
    <group>
      <SceneEnv bg="#2a8fb0" fog={["#2a8fb0", 7, 40]} />
      <hemisphereLight args={["#bff0ff", "#2a6f8a", 1.5]} />
      <directionalLight position={[2, 12, 4]} intensity={1.8} color="#dff6ff" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <Ink geometry={box(80, 0.4, 60)} material={toon(x.sand)} position={[0, -0.2, -10]} px={2.4} />
      <Scatter count={500} w={26} d={26} z={-4} seed={4} size={0.05} colors={["#e6d6a8", "#b9a674", "#9a8a5a"]} />
      <LightRays t={t} p={[0, 9, -4]} n={7} w={1.8} h={16} />
      <Rock p={[-4.5, 0.4, -4]} s={1.2} color="#7a8a92" seed={2} /><Rock p={[5, 0.3, -5]} s={1.5} color="#6a7a82" seed={4} /><Rock p={[-2, 0.2, -9]} s={2} color="#6a7a82" seed={6} />
      {[[-3.5, -2.5], [4, -3], [-6, -6], [2, -8], [6, -2]].map(([sx, sz], i) => <Seaweed key={i} p={[sx, 0, sz]} t={t} h={1.6 + (i % 3) * 0.8} seed={i} color={["#3f9a62", "#6aa84f", "#2f8a72"][i % 3]} />)}
      {[0, 1, 2, 3, 4].map((i) => <Fish key={i} t={t} seed={i + 1} center={[0, 2.2 + i * 0.5, -4 - i]} radius={5 + i} speed={0.35 + i * 0.05} color={["#f2a23a", "#e0592f", "#f2d27a", "#c8403a", "#6aa8d8"][i]} s={0.8 + (i % 3) * 0.2} />)}
      {/* the lump, rising out of the sand between two divers */}
      <group position={[0, 0.3 + rise * 1.1, 0.4]}><Lump s={0.62} t={t} rot={[0.3, tw, 0.1]} /><Glow p={[0.4, 0.3, 0.7]} s={1.6 + Math.sin(t * 6) * 0.1} /></group>
      <P look="diver" p={[-1.55, 0, 0.3]} cam={cam} t={t} s={1.45} expr={emo(t, [[0, "deadpan"], [1.4, "shock"]])} pose="hold" seed={2} yaw={0.5} />
      <P look="diver" p={[1.55, 0, 0.3]} cam={cam} t={t} s={1.45} expr={emo(t, [[0, "deadpan"], [1.6, "shock"]])} pose="hold" seed={3} yaw={-0.5} />
      <Bubbles t={t} center={[-1.5, 2.6, 0.2]} spread={0.6} height={7} n={16} /><Bubbles t={t + 2} center={[1.5, 2.6, 0.2]} spread={0.6} height={7} n={16} />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 2: Greek harbour, treasure on the dock, one piece looks like junk ---------- */
const GreekHouse: React.FC<{ p: V3; w?: number; h?: number; d?: number; dome?: boolean; door?: string; rot?: number }> = ({ p, w = 3, h = 3, d = 3, dome, door = "#2b6aa8", rot = 0 }) => {
  const wall = useMemo(() => toon("#f6f1e6"), []); const dm = useMemo(() => toon(door), [door]);
  const win = useMemo(() => new THREE.MeshBasicMaterial({ color: "#2a5a8a" }), []);
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Ink geometry={box(w, h, d)} material={wall} position={[0, h / 2, 0]} px={2.4} />
      <Ink geometry={box(w + 0.2, 0.18, d + 0.2)} material={toon("#ffffff")} position={[0, h + 0.09, 0]} px={2} />
      <Ink geometry={box(0.8, 1.5, 0.08)} material={dm} position={[0, 0.75, d / 2 + 0.02]} px={1.8} />
      {[-0.9, 0.9].map((wx, i) => <group key={i} position={[wx * (w / 3), h * 0.62, d / 2 + 0.03]}><Ink geometry={box(0.6, 0.8, 0.06)} material={dm} px={1.6} cast={false} /><mesh position={[0, 0, 0.04]}><planeGeometry args={[0.4, 0.6]} /><primitive object={win} attach="material" /></mesh></group>)}
      {dome ? <Ink geometry={new THREE.SphereGeometry(w * 0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)} material={dm} position={[0, h + 0.18, 0]} px={2.2} /> : null}
    </group>
  );
};

export const A2Setup: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax();
  const crate = (p: V3, items: React.ReactNode, key: number) => <group key={key} position={p}><Ink geometry={box(1.6, 0.8, 1.1)} material={toon("#a8693b")} position={[0, 0.4, 0]} px={2} />{items}</group>;
  return (
    <group>
      <SceneEnv bg="#bfe3f5" fog={["#cfe8f4", 30, 110]} />
      <Lights color="#fff0cc" intensity={2.6} pos={[-8, 14, 10]} hemi={["#bfe3ff", "#9ac4d8", 1.3]} shadowSize={14} />
      <SkyDome t={t} /><Sea t={t} y={-0.9} z={-40} />
      <Horizon t={t} z={-70} />
      {/* hillside of whitewashed houses */}
      <Ink geometry={box(60, 1.6, 15)} material={toon("#d8c9a0")} position={[0, -0.4, -13.5]} px={2.4} />
      <Ink geometry={box(54, 1.2, 6.4)} material={toon("#cdbd92")} position={[0, 1.0, -14.5]} px={2.4} />
      <Ink geometry={box(50, 1.2, 6.4)} material={toon("#c2b284")} position={[0, 2.2, -19.5]} px={2.4} />
      <Tree p={[-15, 0.4, -7]} s={0.9} seed={3} /><Tree p={[15, 0.4, -7.5]} s={1.0} seed={5} /><Tree p={[-4.5, 0.4, -7]} s={0.7} seed={8} /><Tree p={[9.5, 1.6, -12]} s={0.8} seed={9} /><Tree p={[-11, 1.6, -12]} s={0.8} seed={4} />
      {[[-12, -8], [-7.5, -9], [-3, -10], [2, -9.5], [7, -8.5], [12, -9], [-9, -13], [-4, -14], [1.5, -13.5], [6.5, -13], [11, -14], [-6, -18], [0, -19], [6, -18]].map(([hx, hz], i) => <GreekHouse key={i} p={[hx, 0.4 + (i > 6 ? 1.2 : 0) + (i > 11 ? 1.2 : 0), hz]} w={3 + (i % 3) * 0.6} h={2.6 + (i % 4) * 0.6} d={3} dome={i % 5 === 2} door={["#2b6aa8", "#2b7aa8", "#3f8ac4"][i % 3]} />)}
      {/* the dock */}
      <Ink geometry={box(18, 0.4, 7)} material={toon(x.planks)} position={[0, -0.05, 2]} px={2.4} />
      {[-8, -4, 0, 4, 8].map((px, i) => <Ink key={i} geometry={box(0.3, 1.6, 0.3)} material={toon("#5a3a22")} position={[px, -0.5, 5.6]} px={1.8} cast={false} />)}
      <Ship p={[-4.5, -0.2, 8.2]} s={1.3} t={t} rot={[0, 0.5, 0]} />
      {crate([-3.6, 0.15, 1.2], <><Vase p={[-0.3, 0.8, 0]} s={0.9} /><Vase p={[0.4, 0.8, 0.1]} s={0.75} color="#e0b23a" /></>, 0)}
      {crate([3.8, 0.15, 1.0], <><Vase p={[-0.3, 0.8, 0]} s={0.85} color="#2f7a8a" /><Ink geometry={new THREE.TorusGeometry(0.3, 0.07, 8, 18)} material={toon("#e0b23a")} position={[0.4, 1.0, 0]} rotation={[0.6, 0, 0]} px={1.4} /></>, 1)}
      {/* the clerk presents the treasure, then holds up the junk */}
      <P look="clerk" p={[0, 0.2, 1.8]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "proud"], [3.6, "deadpan"], [5.6, "worried"]])} pose={t > 4.6 ? "point" : "hold"} seed={5} handR={t > 5.0 ? <group position={[0, -0.05, 0.05]}><Lump s={0.28} gear={false} rot={[0.3, t, 0]} /></group> : null} />
      <P look="cap" p={[-6.4, 0.2, 3.0]} cam={cam} t={t} s={1.2} expr="grin" pose="cheer" seed={6} />
      <P look="diver" p={[6.4, 0.2, 3.2]} cam={cam} t={t} s={1.25} expr="smug" pose="idle" seed={7} />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 3: the museum storeroom, years go by ---------- */
export const A3Museum: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax();
  const day = 0.5 + 0.5 * Math.sin(t * 1.3);
  const walkers = [0, 1, 2, 3].map((i) => ({ i, look: ["glasses", "woman", "bowler", "cap"][i], x: -9 + ((t * 1.9 + i * 5.2) % 22), dir: 1 }));
  return (
    <group>
      <SceneEnv bg="#d8c9a6" fog={["#d8c9a6", 16, 60]} />
      <Lights color="#ffe0a8" intensity={1.4 + day * 1.4} pos={[-6, 9, 8]} hemi={["#fff0d0", "#a8885a", 1.0 + day * 0.5]} shadowSize={12} extra={<pointLight position={[0, 4, 2]} intensity={6} color="#ffd890" distance={10} />} />
      <Room tex={x.wallStone} /><Floor tex={x.floor} z={4} />
      <SunWindow p={[-6.6, 4.4, -2.7]} s={1.5} /><SunWindow p={[6.2, 4.4, -2.7]} s={1.5} light />
      <Clock p={[0, 7.0, -2.7]} t={t * 7} s={1.9} /><Frame p={[-2.8, 6.0, -2.75]} w={1.5} h={1.1} k={0} /><Frame p={[2.8, 6.0, -2.75]} w={1.5} h={1.1} k={2} />
      <Shelf p={[-3.2, 2.3, -2.4]} w={3.0} /><Shelf p={[3.6, 2.8, -2.4]} w={2.6} /><Plant p={[-8.4, 0, -1.8]} s={2.0} t={t} /><Plant p={[8.4, 0, -1.8]} s={2.0} t={t} />
      {[[-4.4, 0], [4.4, 0]].map(([cx], i) => <group key={i} position={[cx, 0, -1.2]}><Ink geometry={box(1.8, 1.1, 1.4)} material={toon("#a8693b")} position={[0, 0.55, 0]} px={2} /><Ink geometry={box(1.5, 0.8, 1.2)} material={toon("#8a5a34")} position={[0.1, 1.5, 0]} px={2} /></group>)}
      {/* the pedestal with the lump, a cobweb of dust on it */}
      <Ink geometry={box(1.8, 1.6, 1.4)} material={toon("#cfc0a0")} position={[0, 0.8, 0.2]} px={2.4} />
      <Ink geometry={box(2.1, 0.2, 1.7)} material={toon("#e6dcc0")} position={[0, 1.7, 0.2]} px={2} />
      <group position={[0, 2.15, 0.2]}><Lump s={0.55} gear={false} rot={[0.1, 0.4, 0]} /></group>
      <Glow p={[0, 3.0, 0.8]} s={3.2} />
      {walkers.map((w) => <P key={w.i} look={w.look} p={[w.x, 0, 3.2 + (w.i % 2) * 0.7]} cam={cam} t={t} s={1.3} expr="deadpan" pose="walk" seed={30 + w.i} yaw={1.0} />)}
      <Dust t={t} />
    </group>
  );
};

/* ---------- 4: X-ray scanner finds gears ---------- */
export const A4But: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax(); const at = AT();
  const enter = easeInOut(clamp((t - 0.4) / 2.0));
  const mon = useMemo(() => new THREE.MeshBasicMaterial({ map: at.xray }), [at]);
  const flick = 0.85 + 0.15 * Math.sin(t * 24);
  return (
    <group>
      <SceneEnv bg="#2f6a68" fog={["#2f6a68", 14, 50]} />
      <Lights color="#e0fff4" intensity={1.6} pos={[-4, 9, 8]} hemi={["#d8fff0", "#5a8a86", 1.2]} shadowSize={10} extra={<pointLight position={[3, 3.5, 2]} intensity={9} color="#8affe0" distance={9} />} />
      <Room tex={x.wallTeal} w={20} /><Floor tex={x.floor} z={3} w={20} d={14} />
      {/* the scanner ring and bed */}
      <group position={[-1.8, 0, -0.2]}>
        <Ink geometry={new THREE.TorusGeometry(1.9, 0.62, 18, 40)} material={toon("#eef2f4")} position={[0, 2.5, 0]} px={2.6} />
        <Ink geometry={box(1.3, 0.12, 4.6)} material={toon("#c0c8d0")} position={[0, 1.05, 0.9 + (1 - enter) * 0 - enter * 1.5]} px={2} />
        <Ink geometry={box(1.0, 1.0, 1.0)} material={toon("#aab6c0")} position={[0, 0.5, 1.8]} px={2} />
        <group position={[0, 1.55, 0.9 - enter * 1.5]}><Lump s={0.5} gear={false} rot={[0, 0.4, 0]} /></group>
        {[-1, 0, 1].map((k) => <mesh key={k} position={[k * 0.4, 2.5, 0.4]} rotation={[0, 0, 0]}><planeGeometry args={[0.1, 2 * enter]} /><meshBasicMaterial color="#8affe0" transparent opacity={0.35 * (0.6 + 0.4 * Math.sin(t * 20 + k))} /></mesh>)}
      </group>
      {/* the monitor */}
      <group position={[3.4, 2.4, -1.2]} rotation={[0, -0.25, 0]}>
        <Ink geometry={box(3.5, 2.7, 0.35)} material={toon("#2a2f38")} px={2.2} />
        <mesh position={[0, 0, 0.2]} material={mon} scale={[flick, flick, 1]}><planeGeometry args={[3.1, 2.3]} /></mesh>
        <Glow p={[0, 0, 0.6]} s={5} />
      </group>
      <Ink geometry={box(3.0, 0.2, 1.4)} material={toon("#7a5a3a")} position={[3.4, 1.0, -0.4]} px={2.2} />
      <P look="scientist" p={[1.0, 0, 1.8]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "think"], [2.4, "worried"], [3.2, "shock"]])} pose={t > 3.0 ? "point" : "hold"} seed={8} emph={t > 3.2 ? 1 : 0} />
      <Plant p={[-8, 0, -1.4]} s={1.8} t={t} /><Clock p={[0, 6.9, -2.7]} t={t} s={1.5} /><Frame p={[-5, 6.0, -2.75]} w={1.5} h={1.1} k={1} />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 5: the gears float apart and click together ---------- */
export const A5Then: React.FC<SceneProps> = ({ t, cam }) => {
  const asm = easeInOut(clamp((t - 2.2) / 1.8));
  const stars = useMemo(() => { const r = rng(77); return Array.from({ length: 46 }, () => [(r() - 0.5) * 22, (r() - 0.5) * 14, 0.03 + r() * 0.05]); }, []);
  const G = useMemo(() => [
    { r: 0.9, n: 22, home: [0, 0, 0], away: [-3.4, 1.8, 1.0], c: "#c99a3a", ratio: 1 },
    { r: 0.62, n: 15, home: [1.45, 0.55, 0.0], away: [3.2, 2.4, 0.6], c: "#b8872e", ratio: -22 / 15 },
    { r: 0.5, n: 12, home: [-1.35, -0.95, 0.0], away: [-2.2, -2.2, 1.2], c: "#d9aa4a", ratio: -22 / 12 },
    { r: 0.78, n: 18, home: [0.65, -1.55, 0.0], away: [2.6, -1.8, -0.4], c: "#c99a3a", ratio: 22 / 18 },
    { r: 0.42, n: 10, home: [2.2, 1.55, 0.0], away: [0.4, 3.2, -0.6], c: "#e0b85a", ratio: 22 / 10 },
    { r: 0.55, n: 13, home: [-1.65, 0.9, 0.0], away: [-0.8, -3.0, 0.5], c: "#b8872e", ratio: 22 / 13 },
  ] as const, []);
  return (
    <group>
      <SceneEnv bg="#1a2540" fog={["#1a2540", 12, 40]} />
      <hemisphereLight args={["#aab8e8", "#3a2a50", 1.1]} />
      <directionalLight position={[-4, 8, 8]} intensity={2.6} color="#ffe2a8" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 0, 4]} intensity={30} color="#ffcf6a" distance={14} />
      <mesh position={[0, 0, -3]}><planeGeometry args={[40, 30]} /><meshBasicMaterial color="#1f2c4d" /></mesh>
      {stars.map((q, i) => <mesh key={i} position={[q[0], q[1], -2.8]}><circleGeometry args={[q[2], 6]} /><meshBasicMaterial color="#cfd8ff" /></mesh>)}
      {G.map((g, i) => {
        const pos: V3 = [g.away[0] + (g.home[0] - g.away[0]) * asm + Math.sin(t * 0.8 + i) * 0.15 * (1 - asm), g.away[1] + (g.home[1] - g.away[1]) * asm + Math.cos(t * 0.7 + i) * 0.15 * (1 - asm), g.away[2] + (g.home[2] - g.away[2]) * asm];
        return <Gear key={i} p={pos} r={g.r} teeth={g.n} spin={(t * 0.6 + (i % 2 ? 0.15 : 0)) * g.ratio} color={g.c} depth={0.14} rot={[0.3 * (1 - asm), 0.5 * (1 - asm), 0]} />;
      })}
      <Dust t={t} />
    </group>
  );
};

/* ---------- 6: the painted timeline with the huge empty gap ---------- */
export const A6Conflict: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax(); const at = AT();
  const tl = useMemo(() => new THREE.MeshBasicMaterial({ map: at.timeline }), [at]);
  return (
    <group>
      <SceneEnv bg="#5a3a22" fog={["#5a3a22", 16, 60]} />
      <Lights color="#ffdca0" intensity={1.8} pos={[-5, 9, 9]} hemi={["#ffe8c0", "#8a5a3a", 1.2]} shadowSize={12} extra={<pointLight position={[0, 4, 4]} intensity={10} color="#ffd890" distance={14} />} />
      <Room tex={x.wallWarm} w={26} /><Floor tex={x.floor} z={3} w={26} d={14} />
      <group position={[0, 4.2, -2.4]}>
        <Ink geometry={box(15.4, 8.0, 0.2)} material={toon("#3a2a1a")} px={2.4} />
        <mesh position={[0, 0, 0.12]} material={tl}><planeGeometry args={[14.8, 7.4]} /></mesh>
        {[[-7.2, 3.6], [7.2, 3.6], [-7.2, -3.6], [7.2, -3.6]].map(([px, py], i) => <mesh key={i} position={[px, py, 0.16]}><circleGeometry args={[0.16, 10]} /><meshBasicMaterial color="#c8403a" /></mesh>)}
      </group>
      <P look="scientist" p={[6.2, 0, 1.4]} cam={cam} t={t} s={1.7} expr={emo(t, [[0, "think"], [2.0, "worried"], [3.4, "shock"]])} pose={t > 1.4 ? "point" : "hold"} seed={9} emph={t > 3.4 ? 1 : 0} />
      <P look="clerk" p={[-6.4, 0, 1.6]} cam={cam} t={t} s={1.5} expr="shock" pose="cross" seed={10} />
      <Plant p={[-11, 0, -1.4]} s={1.9} t={t} /><Plant p={[11, 0, -1.4]} s={1.9} t={t} />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 7: "You see," hidden writing, the crank turns the pointers ---------- */
export const A7Pivot: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax(); const at = AT();
  const lt = useMemo(() => new THREE.MeshBasicMaterial({ map: at.letters, transparent: true }), [at]);
  const wrote = easeOutBack(clamp((t - 1.3) / 0.9)); const sc = easeInOut(clamp((t - 4.0) / 0.9));
  return (
    <group>
      <SceneEnv bg="#201a38" fog={["#201a38", 14, 50]} />
      <hemisphereLight args={["#b8a8ff", "#2a2040", 0.9]} />
      <directionalLight position={[-4, 8, 8]} intensity={2.0} color="#ffe2b0" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 2, 5]} intensity={26} color="#ffcf7a" distance={14} />
      <Room tex={x.wallDark} w={24} /><Floor tex={x.floor} z={3} w={24} d={14} />
      {/* the single gear in the spotlight */}
      <group position={[0, 3.2, 0.6]} scale={Math.max(0.001, 1 - sc * 0.0) * (t < 1.2 ? 1.0 : Math.max(0.0, 1 - (t - 1.2) * 1.4))}><Gear r={1.2} teeth={22} spin={t * 0.7} depth={0.2} /></group>
      <Glow p={[0, 3.2, 1.6]} s={3.2} />
      {/* hidden writing on a bronze plate, glowing */}
      <group position={[0, 3.6, 0.4]} scale={wrote}><mesh material={lt}><planeGeometry args={[6.6, 3.3]} /></mesh><Glow p={[0, 0, -0.2]} s={4.5} /></group>
      <group position={[0, 1.5, 0.6]} scale={sc}><mesh position={[0, 0, 0]} /></group>
      <group position={[2.4, 0.7 + (1 - sc) * -3, 1.6]} scale={sc}><Ink geometry={box(3.2, 0.2, 2.0)} material={toon("#7a4a2a")} position={[0, 0.7, 0]} px={2.2} /><Machine p={[0, 1.6, 0]} s={1.15} t={t} hand={t * 0.4} /></group>
      <P look="greek" p={[0.2, 0, 2.0]} cam={cam} t={t} s={1.75} expr={emo(t, [[0, "deadpan"], [4.4, "proud"], [6.2, "grin"]])} pose={t > 4.4 ? "crank" : "hold"} seed={12} />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 8: three dials, one after another ---------- */
export const A8Dials: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax(); const at = AT();
  const start = [0.0, wordIn(7, "another", 2.0), wordIn(7, "third", 3.9)];
  const mk = (k: "moon" | "sun" | "games") => useMemo(() => new THREE.MeshBasicMaterial({ map: dialTexture(k) }), [k]);
  const mats = [mk("moon"), mk("sun"), mk("games")];
  return (
    <group>
      <SceneEnv bg="#26405a" fog={["#26405a", 14, 50]} />
      <Lights color="#ffe2b0" intensity={1.8} pos={[-4, 9, 8]} hemi={["#c0d8f0", "#3a4a6a", 1.1]} shadowSize={10} extra={<pointLight position={[0, 3, 4]} intensity={14} color="#ffcf7a" distance={14} />} />
      <Room tex={x.wallDark} w={26} /><Floor tex={x.floor} z={3} w={26} d={14} />
      <Ink geometry={box(13.6, 5.2, 0.5)} material={toon("#6a4a2c")} position={[0, 3.6, -1.8]} px={2.4} />
      <Ink geometry={box(13.0, 4.6, 0.12)} material={toon("#c99a3a")} position={[0, 3.6, -1.5]} px={1.8} />
      {[-4.2, 0, 4.2].map((dx, i) => {
        const on = clamp((t - start[i]) / 0.5); const s = 0.6 + 0.4 * easeOutBack(on);
        return (
          <group key={i} position={[dx, 3.6, -1.4]} scale={s}>
            <mesh material={mats[i]}><circleGeometry args={[1.7, 36]} /></mesh>
            <mesh position={[0, 0, 0.02]} rotation={[0, 0, -(t - start[i]) * (1.4 + i * 0.5)]}><planeGeometry args={[0.1, 1.5]} /><meshBasicMaterial color={INKD} /></mesh>
            <mesh position={[0, 0, 0.03]}><circleGeometry args={[0.12, 12]} /><meshBasicMaterial color={INKD} /></mesh>
            {on > 0.1 ? <Glow p={[0, 0, -0.1]} s={3.6 * on} /> : null}
          </group>
        );
      })}
      {/* a tiny torch-bearer runs under the third dial */}
      <P look="greek" p={[4.2 + Math.sin(t * 1.6) * 1.2, 0, 0.9]} cam={cam} t={t} s={0.9} expr="grin" pose="walk" seed={13} yaw={Math.cos(t * 1.6) > 0 ? 1.0 : -1.0} />
      <P look="scientist" p={[-5.6, 0, 1.4]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "proud"], [2.2, "grin"]])} pose="point" seed={14} />
      <Plant p={[-11, 0, -1.4]} s={1.9} t={t} /><Plant p={[11, 0, -1.4]} s={1.9} t={t} />
      <Dust t={t} />
    </group>
  );
};
const cloudTex = (() => { const m = new Map<string, THREE.Texture>(); return (c: string) => { if (!m.has(c)) { const cv2 = document.createElement("canvas"); cv2.width = 512; cv2.height = 128; const g = cv2.getContext("2d")!; g.filter = "blur(10px)"; const r = rng(5); for (let i = 0; i < 16; i++) { const x = 60 + r() * 390, rad = 18 + r() * 28; g.fillStyle = c; g.beginPath(); g.ellipse(x, 64 + (r() - 0.5) * 24, rad * 1.8, rad * 0.8, 0, 0, 7); g.fill(); } const tx = new THREE.CanvasTexture(cv2); tx.colorSpace = THREE.SRGBColorSpace; m.set(c, tx); } return m.get(c)!; }; })();
const dialTexture = (k: "moon" | "sun" | "games") => {
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!; const cx = 256, cy = 256;
  g.fillStyle = "#efe0ac"; g.beginPath(); g.arc(cx, cy, 250, 0, 7); g.fill(); g.lineWidth = 14; g.strokeStyle = INKD; g.stroke(); g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 204, 0, 7); g.stroke();
  g.fillStyle = INKD; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * 226, cy + Math.sin(a) * 226, i % 4 ? 3 : 8, 0, 7); g.fill(); }
  if (k === "moon") { g.fillStyle = "#1c2a4a"; g.beginPath(); g.arc(cx, cy, 130, 0, 7); g.fill(); g.fillStyle = "#f5efd0"; g.beginPath(); g.arc(cx, cy, 130, -Math.PI / 2, Math.PI / 2); g.bezierCurveTo(cx + 70, cy + 80, cx + 70, cy - 80, cx, cy - 130); g.fill(); g.lineWidth = 8; g.strokeStyle = INKD; g.beginPath(); g.arc(cx, cy, 130, 0, 7); g.stroke(); }
  if (k === "sun") { g.fillStyle = "#f2b83a"; g.beginPath(); g.arc(cx - 40, cy, 100, 0, 7); g.fill(); g.fillStyle = "#1c2a4a"; g.beginPath(); g.arc(cx + 30, cy, 100, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = INKD; g.beginPath(); g.arc(cx - 40, cy, 100, 0, 7); g.stroke(); g.beginPath(); g.arc(cx + 30, cy, 100, 0, 7); g.stroke(); }
  if (k === "games") { g.fillStyle = "#2f8f5a"; g.beginPath(); g.arc(cx, cy, 130, 0, 7); g.fill(); g.strokeStyle = "#fff6d0"; g.lineWidth = 12; for (let q = 0; q < 5; q++) { const a = (q / 5) * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 32, 0, 7); g.stroke(); } }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
};

/* ---------- 9: a candle-lit Greek workshop ---------- */
export const A9So: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax();
  const push = easeInOut(clamp((t - 5.2) / 1.0));
  return (
    <group>
      <SceneEnv bg="#2a1a14" fog={["#2a1a14", 12, 40]} />
      <hemisphereLight args={["#ffd8a8", "#2a1a14", 0.7]} />
      <pointLight position={[0, 3.2, 1.6]} intensity={30} color="#ffb85a" distance={14} />
      <directionalLight position={[-3, 8, 6]} intensity={0.9} color="#ffc880" castShadow shadow-mapSize={[1024, 1024]} />
      <Room tex={x.wallWarm} w={22} /><Floor tex={x.planks} z={3} w={22} d={14} />
      {/* round window with the moon */}
      <group position={[-6.4, 5.2, -2.7]}><Ink geometry={new THREE.CylinderGeometry(1.5, 1.5, 0.2, 28)} material={toon("#6a4a2c")} rotation={[Math.PI / 2, 0, 0]} px={2} cast={false} /><mesh position={[0, 0, 0.12]}><circleGeometry args={[1.3, 28]} /><meshBasicMaterial color="#1f2f5a" /></mesh><mesh position={[0.3, 0.2, 0.14]}><circleGeometry args={[0.45, 20]} /><meshBasicMaterial color="#f6efc8" /></mesh></group>
      <Shelf p={[3.2, 4.4, -2.4]} w={3.2} /><Shelf p={[6.4, 3.0, -2.4]} w={2.4} /><Frame p={[-2.4, 5.6, -2.75]} w={1.4} h={1.0} k={2} />
      {/* bench, tools, candles, the machine */}
      <Ink geometry={box(6.8, 0.3, 2.4)} material={toon("#7a4a2a")} position={[0, 1.4, 0.2]} px={2.4} />
      {[[-3.0, -0.8], [3.0, -0.8], [-3.0, 1.2], [3.0, 1.2]].map(([lx, lz], i) => <Ink key={i} geometry={box(0.3, 1.4, 0.3)} material={toon("#5a3a22")} position={[lx, 0.7, lz]} px={1.8} cast={false} />)}
      <Machine p={[1.9, 2.35, 0.3]} s={1.0} t={t} crank hand={t > 5.4 ? (t - 5.4) * 5 : 0} />
      {[[-2.8, 0.2], [3.0, 0.5], [-1.9, 0.9]].map(([cx, cz], i) => <Candle key={i} p={[cx, 1.55, cz]} t={t} seed={i + 1} h={0.5 + i * 0.1} />)}
      {[0, 1, 2].map((i) => <Gear key={i} p={[-2.2 + i * 0.7, 1.6, 1.0]} r={0.24} teeth={10} depth={0.06} rot={[-Math.PI / 2, 0, i]} color="#c99a3a" />)}
      <P look="craftsman" p={[-0.7, 0, -0.7]} cam={cam} t={t} s={1.7} expr={emo(t, [[0, "think"], [3.0, "proud"], [5.4, "grin"]])} pose={t > 5.2 ? "point" : "hold"} seed={15} tint="#ffe2b0" />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 10: the machine is wrapped up and sails away at sunset ---------- */
export const A10Payoff: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax();
  const sail = clamp((t - 1.5) / 5.5);
  return (
    <group>
      <SceneEnv bg="#e8a06a" fog={["#e8a06a", 26, 100]} />
      <Lights color="#ff9a5a" intensity={2.4} pos={[-14, 6, -16]} hemi={["#f8c890", "#8a5a6a", 1.1]} shadowSize={20} />
      <mesh position={[0, 12, -75]}><planeGeometry args={[320, 140]} /><meshBasicMaterial color="#d97a6a" fog={false} /></mesh>
      <mesh position={[0, 4.5, -72]}><circleGeometry args={[6.5, 32]} /><meshBasicMaterial color="#ffe0a0" fog={false} /></mesh>
      {[[-20, 18, 0], [14, 24, 1], [30, 14, 2], [-6, 28, 0], [-34, 10, 1]].map(([cx, cy, k], i) => <mesh key={i} position={[cx as number, cy as number, -70]}><planeGeometry args={[44, 9]} /><meshBasicMaterial map={cloudTex(["#b86a7a", "#9a5a8a", "#d98a7a"][k as number])} fog={false} transparent depthWrite={false} /></mesh>)}
      <Sea t={t} y={-0.4} z={-50} size={[300, 200]} />
      <Ink geometry={box(14, 0.5, 6)} material={toon(x.planks)} position={[-5, -0.1, 3.5]} px={2.4} />
      <P look="craftsman" p={[-6.5, 0.2, 3.2]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "proud"], [3.0, "deadpan"]])} pose={t > 2.5 ? "cheer" : "idle"} seed={16} tint="#6a3a4a" />
      <Ship p={[-1.0 + sail * 8, -0.3, -2.0 - sail * 14]} s={1.7 - sail * 0.6} t={t} rot={[0, -0.3, 0]} />
      <Dust t={t} />
    </group>
  );
};

/* ---------- 11: the ship sinks, the lump settles on the sea floor ---------- */
export const A11Close: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ax();
  const sink = clamp(t / 2.4); const settle = easeInOut(clamp((t - 1.4) / 2.2));
  return (
    <group>
      <SceneEnv bg="#2a8fb0" fog={["#2a8fb0", 6, 36]} />
      <hemisphereLight args={["#bff0ff", "#2a6f8a", 1.3]} />
      <directionalLight position={[2, 12, 4]} intensity={1.5} color="#dff6ff" />
      <Ink geometry={box(80, 0.4, 60)} material={toon(x.sand)} position={[0, -0.2, -10]} px={2.4} />
      <Scatter count={500} w={26} d={26} z={-4} seed={5} size={0.05} colors={["#e6d6a8", "#b9a674", "#9a8a5a"]} />
      <LightRays t={t} p={[0, 9, -4]} n={6} w={1.6} h={16} />
      <Rock p={[-4.5, 0.4, -4]} s={1.2} color="#7a8a92" seed={2} /><Rock p={[5, 0.3, -5]} s={1.5} color="#6a7a82" seed={4} />
      {[[-3.5, -2.5], [4, -3], [-6, -6], [6, -2]].map(([sx, sz], i) => <Seaweed key={i} p={[sx, 0, sz]} t={t} h={1.6 + (i % 3) * 0.8} seed={i} />)}
      {[0, 1, 2, 3].map((i) => <Fish key={i} t={t} seed={i + 4} center={[0, 2.2 + i * 0.5, -3 - i]} radius={5 + i} speed={0.32 + i * 0.05} color={["#f2a23a", "#e0592f", "#f2d27a", "#6aa8d8"][i]} s={0.8 + (i % 3) * 0.2} />)}
      <group position={[-2.5, 10 - sink * 8, -7 - sink * 2]} rotation={[0.25 * sink, 0.5, 0.45 * sink]} scale={0.8}><Ship t={t} /></group>
      <group position={[0.4, 7 - settle * 6.7, 0.4]}><Lump s={0.7} t={t} rot={[0.2, 0.6, 0.1]} /><Glow p={[0.5, 0.3, 0.8]} s={1.8 + Math.sin(t * 5) * 0.12} /></group>
      <Bubbles t={t} center={[0, 0, 0]} spread={5} height={9} n={30} />
    </group>
  );
};
