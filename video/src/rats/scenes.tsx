import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon, signTexture, woodTexture, plasterTexture, repeatTex, rng, clamp, easeInOut, easeOutBack } from "../hotel/kit";
import { useAssets, Facade, Barrel, Crate, Lamp, Dust } from "../hotel/scene";
import { ContactShadow, yawToward } from "../hotel/chars";
import { Person2 } from "../full/person";
import { SceneEnv, Lights } from "../full/env";
import { SkyDome, Terrain, Horizon, Tree, Fence, Pole, Glow } from "../full/nature";
import { wallTexture, cobbleTexture } from "../full/assets";
import { emo, Shop } from "../full/scenes";
import { Rat, type RatExpr } from "./rat";
import { INKD } from "../full/paint";

type V3 = [number, number, number];
export type SceneProps = { t: number; cam: V3 };

const mkTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};

let _r: any = null;
const rx = () =>
  (_r ??= {
    ochre: repeatTex(plasterTexture("#ebc56c", 3), 1 / 3, 1 / 3),
    cream: repeatTex(plasterTexture("#f4dfae", 5), 1 / 3, 1 / 3),
    terra: repeatTex(plasterTexture("#d98a54", 7), 1 / 3, 1 / 3),
    sage: repeatTex(plasterTexture("#9ec3a0", 9), 1 / 3, 1 / 3),
    wallCream: wallTexture("#f1d9a8", "#b88a5a", 8),
    wallGreen: wallTexture("#7fae92", "#4f7f66", 3),
    planks: woodTexture(["#9a6a44", "#8a5c3a", "#a8763e"], 4, 8, true),
    floor: woodTexture(["#b47a46", "#a86c3c", "#bf8650"], 6, 7),
    banner: signTexture("ONE CENT PER TAIL", "#c8403a", "#fff3cf", 1024, 192),
    office: signTexture("MUNICIPAL OFFICE", "#2b4a8a", "#fff3cf", 576, 128),
    farm: signTexture("RAT FARM", "#5a8a4a", "#fff3cf", 576, 128),
    pigeon: signTexture("PUBLIC NOTICE", "#e8d6a8", "#2a1a1e", 512, 128),
    board: mkTex(1024, 640, (g, w, h) => {
      g.fillStyle = "#2d3d38"; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(255,255,255,.07)"); gr.addColorStop(1, "rgba(0,0,0,.18)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#7a5a3a"; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26);
      g.fillStyle = "#f4f1e8"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "400 112px 'Lilita One', Impact, sans-serif"; g.fillText("PAY FOR TAILS", w / 2, h * 0.3);
      g.font = "400 150px 'Lilita One', Impact, sans-serif"; g.fillStyle = "#ffd36a"; g.fillText("= GET TAILS", w / 2, h * 0.58);
      g.strokeStyle = "rgba(244,241,232,.7)"; g.lineWidth = 8; g.beginPath(); g.moveTo(180, h * 0.82); g.bezierCurveTo(400, h * 0.78, 620, h * 0.88, 850, h * 0.8); g.stroke();
      let s = 4; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      g.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h, 90 + r() * 120, 10);
    }),
    diagram: mkTex(1024, 768, (g, w, h) => {
      g.fillStyle = "#f2e6c8"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(120,90,50,.18)"; g.lineWidth = 2; for (let x = 0; x < w; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.strokeStyle = INKD; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
      g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w / 2, h - 40); g.setLineDash([22, 16]); g.stroke(); g.setLineDash([]);
      g.textAlign = "center"; g.fillStyle = INKD;
      g.font = "400 64px 'Lilita One', Impact, sans-serif"; g.fillText("DEAD RAT", w * 0.25, 110); g.fillText("LIVE RAT", w * 0.75, 110);
      g.font = "400 150px 'Lilita One', Impact, sans-serif"; g.fillStyle = "#c8403a"; g.fillText("1¢", w * 0.25, h * 0.74); g.fillStyle = "#2f8f5a"; g.fillText("1¢ 1¢ 1¢ 1¢", w * 0.75, h * 0.74 + 8);
      g.font = "400 56px 'Lilita One', Impact, sans-serif"; g.fillStyle = INKD; g.fillText("ONCE", w * 0.25, h * 0.9); g.fillText("AGAIN AND AGAIN", w * 0.75, h * 0.9);
    }),
  });

const Coin: React.FC<{ p: V3; r?: number }> = ({ p, r = 0.14 }) => {
  const g = useMemo(() => new THREE.CylinderGeometry(r, r, 0.035, 20), [r]);
  const m = useMemo(() => toon("#e8b83a"), []);
  return <Ink geometry={g} material={m} position={p} px={1.6} />;
};
const CoinStack: React.FC<{ p: V3; n: number; r?: number }> = ({ p, n, r }) => <group position={p}>{Array.from({ length: n }, (_, i) => <Coin key={i} p={[0, 0.02 + i * 0.04, 0]} r={r} />)}</group>;

const TailProp: React.FC<{ p?: V3; rot?: V3; s?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0, 0], [0.14, 0.03, 0], [0.28, -0.02, 0], [0.42, 0.04, 0], [0.54, 0.1, 0]].map(([x, y, z]) => new THREE.Vector3(x, y, z))), 18, 0.022, 8, false), []);
  const m = useMemo(() => toon("#e0a8a2"), []);
  return <group position={p} rotation={rot} scale={s}><Ink geometry={geo} material={m} px={1.6} cast={false} /></group>;
};

const Person: React.FC<{ look: any; p: V3; cam: V3; t: number; s?: number; expr?: any; pose?: any; seed?: number; yaw?: number; handR?: React.ReactNode; handL?: React.ReactNode; lean?: number; emph?: number }> = ({ look, p, cam, t, s = 1.2, expr = "deadpan", pose = "idle", seed = 1, yaw, handR, handL, lean, emph }) => (
  <>
    <Person2 look={look} expr={expr} t={t} position={p} yaw={yaw ?? yawToward(p, cam)} scale={s} seed={seed} pose={pose} handR={handR} handL={handL} lean={lean} emph={emph} />
    <ContactShadow position={[p[0], p[1] + 0.02, p[2]]} r={0.42 * s} />
  </>
);

const Street: React.FC<{ t: number; tint?: string }> = ({ t }) => (
  <>
    <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 38, 130]} />
    <Lights color="#ffdca8" intensity={2.5} />
    <SkyDome t={t} /><Horizon t={t} />
    <Terrain kind="cobble" w={200} d={160} z={-30} tile={9} />
  </>
);

const HanoiRow: React.FC<{ z?: number; xs?: number[] }> = ({ z = -6, xs = [-14, -7.2, 0, 7.2, 14] }) => {
  const r = rx();
  const mats = [r.ochre, r.cream, r.terra, r.sage, r.ochre];
  const signs = useMemo(() => [signTexture("TEA", "#2f8f5a", "#fff3cf", 576, 128), signTexture("RICE", "#c8403a", "#fff3cf", 576, 128), signTexture("SILK", "#7a3d8f", "#fff3cf", 576, 128), signTexture("BAKERY", "#d9453f", "#fff3cf", 576, 128), signTexture("FISH", "#2b6aa8", "#fff3cf", 576, 128)], []);
  return (
    <>
      {xs.map((x, i) => <Shop key={i} x={x} z={z - (i % 2) * 0.6} w={6.2} floors={i % 2 ? 2 : 3} map={mats[i % 5]} sign={signs[i % 5]} roof={i % 2 ? "gable" : "false"} awning={["#2f8f5a", "#c8403a", "#e0b23a", "#2b6aa8", "#7a3d8f"][i % 5]} curtains={["#3f8a5a", "#4a9a68"]} />)}
    </>
  );
};

/* ---- shot 1: they cut the tail off, then let the rat go ---- */
export const R1Hook: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx();
  const xs = [-1.4, -0.55, 0.3, 1.15];
  const T = [0.9, 1.45, 2.0, 2.55]; // snip times
  // the catcher works his way along the row, behind the table
  const catcherX = (() => { let x = xs[0] + 0.5; for (let i = 1; i < 4; i++) { const k = clamp((t - (T[i - 1] + 0.1)) / 0.35); x = xs[i - 1] + 0.5 + (xs[i] - xs[i - 1]) * easeInOut(k) * (t > T[i - 1] ? 1 : 0); if (t < T[i] ) break; x = xs[i] + 0.5; } return x; })();
  const snipping = T.some((tt) => t > tt - 0.28 && t < tt);
  const scissors = (
    <group rotation={[0, 0, 0.5]}>
      {[1, -1].map((s) => <Ink key={s} geometry={box(0.045, 0.4, 0.02)} material={toon("#aab6c8")} position={[0, -0.14, 0]} rotation={[0, 0, s * (snipping ? 0.04 : 0.26)]} px={1.4} />)}
    </group>
  );
  return (
    <group>
      <SceneEnv bg="#e9d2a8" fog={["#e9d2a8", 18, 60]} />
      <Lights color="#ffd9a0" intensity={2.4} pos={[-5, 8, 8]} shadowSize={10} extra={<pointLight position={[0, 2.5, 2]} intensity={10} color="#ffcf8a" distance={9} />} />
      <Ink geometry={box(16, 8, 0.3)} material={toon(r.wallCream)} position={[0, 4, -2.4]} px={2.4} />
      <Ink geometry={box(16, 0.3, 10)} material={toon(r.floor)} position={[0, -0.15, 2]} px={2.4} />
      {/* the table: front half only, so nobody stands inside it */}
      <Ink geometry={box(6.4, 0.18, 1.7)} material={toon("#9a5a34")} position={[-0.3, 1.1, 0.7]} px={2.6} />
      <Ink geometry={box(6.2, 1.0, 1.5)} material={toon("#7a4624")} position={[-0.3, 0.5, 0.7]} px={2.4} />
      <mesh position={[-0.3, 1.2, 1.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6.3, 0.22]} /><meshBasicMaterial color="#c8403a" /></mesh>
      {xs.map((x, i) => {
        const since = t - T[i];
        const walk = since > 0.4 ? (since - 0.4) * 1.9 : 0;
        const rx2 = x - walk;
        const off = rx2 < -3.4;
        const snipped = t >= T[i];
        const fall = Math.max(0, since - 0.02);
        return (
          <React.Fragment key={i}>
            {!off ? <Rat t={t} position={[rx2, 1.19, 0.75]} scale={1.15} expr={!snipped ? (i === 0 ? "worried" : "deadpan") : since < 0.4 ? "shock" : "smug"} tail={!snipped} pose={since > 0.4 ? "walk" : "idle"} flip={since > 0.4 ? -1 : 1} seed={i + 2} fur={i === 2 ? "brown" : "grey"} /> : null}
            {snipped && since < 1.6 ? <TailProp p={[x + 0.2, Math.max(1.24, 1.9 - 4.9 * fall * fall), 0.85]} rot={[0, 0, -0.5 + fall * 2.6 + (fall > 0.55 ? 0 : 0)]} s={1.1} /> : null}
          </React.Fragment>
        );
      })}
      {/* the catcher, standing behind the table with tiny scissors */}
      <Person look="catcher" p={[catcherX, 0, -0.9]} cam={cam} t={t} s={1.75} expr={emo(t, [[0, "smug"], [0.9, "grin"], [2.8, "proud"]])} pose="point" seed={5} handR={scissors} />
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 2: Hanoi is crawling with rats ---- */
export const R2Setup: React.FC<SceneProps> = ({ t, cam }) => {
  const rats = useMemo(() => { const g = rng(13); return Array.from({ length: 22 }, (_, i) => ({ a: g() * Math.PI * 2, spd: 0.8 + g() * 1.4, t0: 0.2 + g() * 3.4, off: g() })); }, []);
  const grate = useMemo(() => box(2.2, 0.12, 1.6), []);
  return (
    <group>
      <Street t={t} />
      <HanoiRow />
      <Tree p={[-9, 0, -2]} s={1.5} seed={2} /><Tree p={[10, 0, -3]} s={1.7} seed={6} />
      <Lamp p={[-4.8, 0, 2.6]} a={useAssets()} />
      {/* the drain */}
      <Ink geometry={grate} material={toon("#3a3a46")} position={[0, 0.03, 0.2]} px={2} />
      <mesh position={[0, 0.1, 0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.9, 1.3]} /><meshBasicMaterial color="#14101a" /></mesh>
      {rats.map((r, i) => {
        const k = t - r.t0; if (k <= 0) return null;
        const rise = clamp(k / 0.55);                       // climb up out of the hole
        const d = Math.max(0, k - 0.45) * r.spd * 1.5;       // then scurry away
        const jx = (r.off - 0.5) * 1.2, jz = (r.off - 0.5) * 0.6;
        const x = jx + Math.cos(r.a) * d, z = 0.2 + jz + Math.sin(r.a) * d * 0.8;
        const inHole = d < 0.01;
        return <Rat key={i} t={t} position={[x, -1.05 + 1.05 * easeInOut(rise), z]} scale={0.5} expr={i % 3 ? "deadpan" : "smug"} pose={inHole ? "idle" : "walk"} flip={Math.cos(r.a) > 0 ? -1 : 1} seed={i + 3} fur={i % 4 === 0 ? "brown" : "grey"} />;
      })}
      <Person look="official" p={[-3.4, 0, 2.2]} cam={cam} t={t} s={1.35} expr={emo(t, [[0, "deadpan"], [2.0, "shock"], [3.6, "worried"]])} pose="idle" seed={7} emph={t > 2.0 ? 1 : 0} />
      <Person look="catcher" p={[3.8, 0, 2.6]} cam={cam} t={t} s={1.15} expr="worried" seed={9} />
      <Person look="vendor" p={[5.6, 0, 3.4]} cam={cam} t={t} s={1.1} expr={emo(t, [[0, "deadpan"], [2.4, "shock"]])} seed={10} />
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 3: they hire rat catchers ---- */
export const R3Plan: React.FC<SceneProps> = ({ t, cam }) => {
  const sack = (
    <group position={[0.05, -0.12, 0]}><Ink geometry={new THREE.SphereGeometry(0.2, 12, 10)} material={toon("#c8a45a")} scale={[1, 1.2, 1]} px={1.8} /></group>
  );
  return (
    <group>
      <Street t={t} /><HanoiRow z={-7} />
      <Lamp p={[6.2, 0, 2.4]} a={useAssets()} />
      {[0, 1, 2, 3].map((i) => <Person key={i} look={i % 2 ? "farmer" : "catcher"} p={[-5 + i * 2.6 + Math.min(t, 2.6) * 0.15, 0, 1.6 + (i % 2) * 0.35]} cam={cam} t={t} s={1.3} expr={i === 1 ? "grin" : "smug"} pose={i === 0 ? "idle" : "hold"} seed={20 + i} handR={i % 2 ? sack : null} />)}
      <Person look="official" p={[4.4, 0, 1.7]} cam={cam} t={t} s={1.4} expr="proud" pose="point" seed={30} />
      <CoinStack p={[3.4, 0.9, 2.3]} n={Math.min(6, 1 + Math.floor(t * 3))} />
      <Barrel p={[-6.4, 0, 3.4]} /><Dust t={t} />
    </group>
  );
};

/* ---- shot 4: counting dead rats is messy, bring the tail ---- */
export const R4But: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx();
  const tweezers = (
    <group rotation={[0, 0, 0.5]}>
      {[1, -1].map((s) => <Ink key={s} geometry={box(0.025, 0.36, 0.02)} material={toon("#aab6c8")} position={[s * 0.02, -0.1, 0]} rotation={[0, 0, s * 0.05]} px={1.2} />)}
      <TailProp p={[-0.02, -0.28, 0]} rot={[0, 0, -1.4]} s={0.6} />
    </group>
  );
  return (
    <group>
      <SceneEnv bg="#e8d6ae" fog={["#e8d6ae", 20, 70]} />
      <Lights color="#ffdba8" intensity={2.3} pos={[-6, 9, 8]} shadowSize={10} extra={<pointLight position={[1, 3, 3]} intensity={9} color="#ffcf8a" distance={9} />} />
      <Ink geometry={box(18, 9, 0.3)} material={toon(r.wallGreen)} position={[0, 4.5, -2.6]} px={2.4} />
      <Ink geometry={box(18, 0.3, 12)} material={toon(r.floor)} position={[0, -0.15, 2]} px={2.4} />
      <Ink geometry={box(5.6, 0.18, 1.5)} material={toon("#9a5a34")} position={[0.4, 1.35, 1.3]} px={2.6} />
      <Ink geometry={box(5.4, 1.3, 0.2)} material={toon("#7a4624")} position={[0.4, 0.66, 2.0]} px={2.4} />
      {/* messy pile of sacks */}
      {[[-3.6, 0.35], [-3.0, 0.3], [-4.2, 0.3], [-3.5, 0.9]].map(([sx, sy], i) => <Ink key={i} geometry={new THREE.SphereGeometry(0.55, 14, 10)} material={toon(["#c8a45a", "#b8944a", "#d4b46a", "#c0a050"][i])} position={[sx, sy, 0.6]} scale={[1, 1.1, 1]} px={2} />)}
      <Person look="official" p={[0.5, 0.2, -0.6]} cam={cam} t={t} s={1.7} expr={emo(t, [[0, "angry"], [1.4, "worried"], [2.6, "grin"]])} pose="point" seed={11} handR={t > 1.2 ? tweezers : null} emph={t < 1.4 ? 1 : 0} />
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 5: one cent per rat tail, for everyone ---- */
export const R5Then: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx(); const a = useAssets();
  const crowd = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
    const start = -10 + (i % 5) * 1.3 - (i > 4 ? 3 : 0);
    const x = Math.min(start + t * (2.4 + (i % 3) * 0.3), 2.2 + (i % 4) * 0.7 - 1.5 + (i % 3));
    return { i, x, z: 2.2 + (i % 3) * 0.9, look: ["catcher", "farmer", "vendor", "woman", "glasses", "bowler", "cap", "baker", "farmer"][i] };
  });
  const bannerMats = useMemo(() => [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(r.banner), toon("#2b1a1d")], [r]);
  return (
    <group>
      <Street t={t} />
      <Shop x={5.2} z={-4} w={7} floors={3} map={r.cream} sign={r.office} roof="false" awning="#2b4a8a" curtains={["#3f8a5a", "#4a9a68"]} />
      <Shop x={-6.2} z={-4.4} w={6.2} floors={2} map={r.ochre} sign={rx().ochre ? signTexture("TEA", "#2f8f5a", "#fff3cf", 576, 128) : r.office} roof="gable" awning="#c8403a" curtains={["#3f8a5a"]} />
      <group position={[0, 0, 0.2]}>
        <Ink geometry={box(0.22, 5.6, 0.22)} material={toon(a.woodDark)} position={[-3.1, 2.8, 0]} px={2.2} /><Ink geometry={box(0.22, 5.6, 0.22)} material={toon(a.woodDark)} position={[3.1, 2.8, 0]} px={2.2} />
        <Ink geometry={box(6.0, 1.12, 0.12)} material={bannerMats} position={[0, 4.9 + Math.sin(t * 2) * 0.02, 0]} px={2.4} />
      </group>
      {crowd.map((c) => <Person key={c.i} look={c.look} p={[c.x, 0, c.z]} cam={cam} t={t} s={1.15} expr={c.i % 2 ? "grin" : "shock"} pose={c.x < 1.8 ? "walk" : "cheer"} seed={40 + c.i} />)}
      {t > 0.6 ? [0, 1, 2, 3, 4, 5].map((i) => <Coin key={i} p={[-2.6 + i * 1.0, 3.2 - ((t * 1.6 + i * 0.3) % 3) , 0.6]} r={0.14} />) : null}
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 6: officials notice tailless rats ---- */
export const R6Conflict: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx();
  const n = Math.min(24, Math.floor(1 + t * 5));
  const g = useMemo(() => rng(31), []);
  const pos = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ x: -7 + (i * 0.6) % 14 + (i % 3) * 0.2, z: 3.2 + (i % 4) * 0.55, dir: i % 2 ? 1 : -1, sp: 0.5 + (i % 5) * 0.12 })), []);
  return (
    <group>
      <Street t={t} />
      <Facade w={11} floors={2} floor0={3.2} floorH={2.6} cols={[-3.4, 0, 3.4]} map={r.cream} trim="#fff3dd" glass={useAssets().room2} depth={1.2} curtains={["#3f8a5a", "#4a9a68"]} />
      {/* balcony */}
      <Ink geometry={box(5.2, 0.22, 1.8)} material={toon("#a8693b")} position={[0, 3.3, 1.0]} px={2.4} />
      {[-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => <Ink key={i} geometry={box(0.09, 0.9, 0.09)} material={toon("#2f3a46")} position={[x, 3.85, 1.85]} px={1.4} />)}
      <Ink geometry={box(5.2, 0.1, 0.1)} material={toon("#2f3a46")} position={[0, 4.3, 1.85]} px={1.6} />
      <Person look="official" p={[0, 3.4, 0.9]} cam={cam} t={t} s={1.35} expr={emo(t, [[0, "deadpan"], [1.6, "think"], [3.2, "shock"]])} pose="hold" seed={12} />
      {pos.slice(0, n).map((p, i) => <Rat key={i} t={t} position={[p.x + p.dir * t * p.sp, 0, p.z]} scale={0.52} expr={i % 3 ? "smug" : "grin"} tail={false} pose="walk" flip={-p.dir} seed={i + 9} fur={i % 4 === 0 ? "brown" : "grey"} />)}
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 7: the reward was for the tail, not the rat ---- */
export const R7Pivot: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx();
  const grow = Math.floor(clamp((t - 2.0) / 3.0) * 14);
  return (
    <group>
      <SceneEnv bg="#e8d6ae" fog={["#e8d6ae", 20, 70]} />
      <Lights color="#ffdba8" intensity={2.3} pos={[-6, 9, 6]} shadowSize={10} />
      <Ink geometry={box(18, 0.4, 14)} material={toon(r.floor)} position={[0, -0.2, 0]} px={2.4} />
      <Ink geometry={box(7.4, 0.3, 5.6)} material={toon("#8a5a34")} position={[0, 0.9, 0]} px={2.6} />
      <mesh position={[0, 1.08, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6.4, 4.8]} /><meshBasicMaterial map={r.diagram} /></mesh>
      {/* left: a single coin for the dead rat */}
      <CoinStack p={[-1.8, 1.1, 1.7]} n={1} r={0.2} />
      {/* right: coins keep piling up for the rats that keep breeding */}
      <CoinStack p={[1.2, 1.1, 1.7]} n={Math.max(2, grow)} r={0.2} />
      <CoinStack p={[1.8, 1.1, 1.7]} n={Math.max(1, grow - 3)} r={0.2} />
      <CoinStack p={[2.4, 1.1, 1.7]} n={Math.max(1, grow - 6)} r={0.2} />
      <CoinStack p={[3.0, 1.1, 1.7]} n={Math.max(1, grow - 9)} r={0.2} />
      <Rat t={t} position={[-1.7, 1.1, 0.0]} scale={0.9} expr="deadpan" tail seed={3} />
      {[0, 1, 2, 3].map((i) => <Rat key={i} t={t} position={[0.9 + i * 0.5, 1.1, -0.1 + (i % 2) * 0.3]} scale={i === 0 ? 0.9 : 0.5} expr={i === 0 ? "smug" : "grin"} pose={i === 0 ? "wave" : "idle"} seed={i + 12} fur={i === 2 ? "brown" : "grey"} />)}
      <Person look="catcher" p={[-4.2, 0, 1.4]} cam={cam} t={t} s={1.6} expr={emo(t, [[0, "think"], [2.4, "proud"], [4.0, "grin"]])} pose="point" seed={14} />
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 8: backyard rat farms ---- */
export const R8Farm: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const r = rx();
  const pens = [-6, -2, 2, 6];
  const tailsLine = useMemo(() => Array.from({ length: 16 }, (_, i) => i), []);
  return (
    <group>
      <Street t={t} />
      <Terrain kind="mud" w={200} d={20} z={2} y={0.015} tile={9} />
      <Shop x={-12} z={-6} w={6} floors={2} map={r.terra} sign={r.farm} roof="gable" awning="#5a8a4a" curtains={["#3f8a5a"]} />
      <Tree p={[11, 0, -3]} s={1.8} seed={11} /><Tree p={[-14, 0, 0]} s={1.5} seed={13} />
      {pens.map((px, i) => (
        <group key={i} position={[px, 0, 0]}>
          {[[-1.5, -1.2], [1.5, -1.2], [-1.5, 1.2], [1.5, 1.2]].map(([x, z], k) => <Ink key={k} geometry={box(0.12, 1.1, 0.12)} material={toon("#8a5a34")} position={[x, 0.55, z]} px={1.6} cast={false} />)}
          {[0.35, 0.8].map((y, k) => <React.Fragment key={k}><Ink geometry={box(3.1, 0.06, 0.06)} material={toon("#c8b08a")} position={[0, y, 1.2]} px={1.2} cast={false} /><Ink geometry={box(3.1, 0.06, 0.06)} material={toon("#c8b08a")} position={[0, y, -1.2]} px={1.2} cast={false} /></React.Fragment>)}
          <Ink geometry={box(1.0, 0.7, 0.9)} material={toon(a.wood)} position={[1.0, 0.35, -0.6]} px={2} />
          <Ink geometry={box(1.2, 0.12, 1.1)} material={toon("#8a5a40")} position={[1.0, 0.76, -0.6]} rotation={[0, 0, 0.12]} px={2} />
          {[0, 1, 2].map((k) => <Rat key={k} t={t + k} position={[-0.9 + k * 0.7, 0, -0.1 + (k % 2) * 0.6]} scale={0.62} expr={k % 2 ? "grin" : "smug"} tail seed={i * 3 + k + 1} fur={k === 1 ? "brown" : "grey"} pose={k === 2 ? "wave" : "idle"} />)}
        </group>
      ))}
      {/* clothesline of harvested tails */}
      <group position={[0, 0, 3.8]}>
        <Ink geometry={box(0.12, 3.2, 0.12)} material={toon(a.woodDark)} position={[-8.5, 1.6, 0]} px={2} /><Ink geometry={box(0.12, 3.2, 0.12)} material={toon(a.woodDark)} position={[8.5, 1.6, 0]} px={2} />
        <Ink geometry={box(17, 0.04, 0.04)} material={toon("#6a4a38")} position={[0, 3.0, 0]} px={1.2} cast={false} />
        {tailsLine.map((i) => <TailProp key={i} p={[-7.6 + i * 1.0, 3.0, 0.02]} rot={[0, 0, -Math.PI / 2 + Math.sin(t * 1.5 + i) * 0.12]} s={1.4} />)}
      </group>
      <Person look="farmer" p={[-4, 0, 2.6]} cam={cam} t={t} s={1.45} expr={emo(t, [[0, "grin"], [2.5, "laugh"]])} pose="hold" seed={50} />
      <Person look="vendor" p={[4, 0, 2.7]} cam={cam} t={t} s={1.35} expr="proud" pose="point" seed={51} />
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 9: tails pile up, the program gets cancelled ---- */
export const R9So: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx(); const a = useAssets();
  const sacks = Math.min(12, 3 + Math.floor(t * 1.6));
  const rip = clamp((t - 3.7) / 0.8);
  const boxCoins = Math.max(0, 8 - Math.floor(t * 2.2));
  return (
    <group>
      <Street t={t} />
      <Shop x={0} z={-4} w={9} floors={3} map={r.cream} sign={r.office} roof="false" awning="#2b4a8a" curtains={["#3f8a5a", "#4a9a68"]} />
      {/* the poster being torn down */}
      <group position={[-3.4, 3.4, -3.0]} rotation={[0, 0, rip * -0.9]}>
        <mesh position={[0, -rip * 2.6 + 0.0, 0.3]} rotation={[0, 0, rip * 0.6]}><planeGeometry args={[1.6, 1.0]} /><meshBasicMaterial map={r.banner} /></mesh>
      </group>
      {/* sacks of tails pile up */}
      {Array.from({ length: sacks }, (_, i) => {
        const row = Math.floor(i / 4), col = i % 4;
        return (
          <group key={i} position={[-5.4 + col * 1.1 + (row % 2) * 0.5, 0.0 + row * 0.8, 1.2 - row * 0.1]}>
            <Ink geometry={new THREE.CylinderGeometry(0.46, 0.55, 0.9, 18)} material={toon(["#c8a45a", "#b8944a", "#d4b46a"][i % 3])} position={[0, 0.45, 0]} px={2} />
            <Ink geometry={new THREE.CylinderGeometry(0.17, 0.44, 0.3, 14)} material={toon("#b8944a")} position={[0, 1.05, 0]} px={1.6} />
            <Ink geometry={new THREE.TorusGeometry(0.17, 0.04, 6, 14)} material={toon("#6a4a38")} position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} px={1.2} />
            <TailProp p={[-0.05, 1.16, 0]} rot={[0, 0, Math.PI / 2 - 0.5]} s={0.8} /><TailProp p={[0.05, 1.16, 0]} rot={[0, 0, Math.PI / 2 + 0.25]} s={0.7} />
          </group>
        );
      })}
      {/* the coin box empties */}
      <group position={[4.4, 0, 1.6]}>
        <Ink geometry={box(1.6, 0.9, 1.0)} material={toon("#7a4a2a")} position={[0, 0.45, 0]} px={2.2} />
        <CoinStack p={[0, 0.9, 0]} n={boxCoins} r={0.26} />
      </group>
      <Person look="official" p={[2.2, 0, 2.2]} cam={cam} t={t} s={1.5} expr={emo(t, [[0, "worried"], [2.5, "shock"], [3.7, "angry"], [4.8, "deadpan"]])} pose={t > 3.6 ? "point" : "idle"} seed={60} emph={t > 3.7 ? 1 : 0} />
      {[0, 1, 2].map((i) => <Rat key={i} t={t} position={[6.6 + i * 0.6, 0, 3.4 + (i % 2) * 0.3]} scale={0.8} expr={t > 3.7 ? "grin" : "smug"} pose={t > 3.7 ? "wave" : "idle"} seed={i + 21} />)}
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 10: the lesson, taught by a rat in a bow tie ---- */
export const R10Payoff: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx();
  return (
    <group>
      <SceneEnv bg="#c9d9cc" fog={["#c9d9cc", 22, 80]} />
      <Lights color="#ffe6b8" intensity={2.1} pos={[-6, 9, 8]} shadowSize={10} extra={<pointLight position={[0, 4, 4]} intensity={9} color="#ffe2a8" distance={12} />} />
      <Ink geometry={box(18, 9, 0.3)} material={toon(r.wallGreen)} position={[0, 4.5, -2.6]} px={2.4} />
      <Ink geometry={box(18, 0.3, 12)} material={toon(r.floor)} position={[0, -0.15, 2]} px={2.4} />
      <group position={[0.5, 3.4, -2.35]}>
        <Ink geometry={box(5.9, 4.0, 0.18)} material={toon("#7a5a3a")} px={2.4} />
        <mesh position={[0, 0, 0.1]}><planeGeometry args={[5.5, 3.6]} /><meshBasicMaterial map={r.board} /></mesh>
        <Ink geometry={box(5.6, 0.14, 0.3)} material={toon("#7a5a3a")} position={[0, -2.1, 0.16]} px={1.6} />
      </group>
      <Rat t={t} position={[-2.0, 0, 0.8]} scale={1.8} expr={emo(t, [[0, "smug"], [2.0, "grin"], [3.8, "smug"]])} pose={t > 1.0 ? "point" : "wave"} bowtie seed={31} fur="grey" />
      {[0, 1, 2].map((i) => <Rat key={i} t={t} position={[1.4 + i * 1.2, 0, 2.2 + (i % 2) * 0.4]} scale={1.0} expr={i === 1 ? "worried" : "deadpan"} pose="idle" seed={i + 41} fur={i === 2 ? "brown" : "white"} />)}
      <Person look="official" p={[4.6, 0, 1.4]} cam={cam} t={t} s={1.4} expr={emo(t, [[0, "deadpan"], [3.0, "think"], [4.5, "worried"]])} seed={70} />
      <Dust t={t} />
    </group>
  );
};

/* ---- shot 11: exactly what they got ---- */
export const R11Close: React.FC<SceneProps> = ({ t, cam }) => {
  const r = rx();
  return (
    <group>
      <SceneEnv bg="#d9c39a" fog={["#d9c39a", 14, 50]} />
      <Lights color="#ffd9a0" intensity={2.0} pos={[-4, 7, 6]} shadowSize={8} extra={<pointLight position={[0, 3, 3]} intensity={12} color="#ffcf8a" distance={9} />} />
      <Ink geometry={box(16, 8, 0.3)} material={toon(r.wallCream)} position={[0, 4, -2.4]} px={2.4} />
      <Ink geometry={box(16, 0.3, 10)} material={toon(r.floor)} position={[0, -0.15, 2]} px={2.4} />
      <Ink geometry={box(5.4, 0.2, 1.5)} material={toon("#7a4624")} position={[0, 1.3, 1.2]} px={2.6} />
      <Ink geometry={box(5.2, 1.3, 0.2)} material={toon("#6a3e20")} position={[0, 0.66, 1.95]} px={2.4} />
      {/* the plate with one lonely tail */}
      <group position={[0.2, 1.42, 1.25]}>
        <Ink geometry={new THREE.CylinderGeometry(0.62, 0.55, 0.07, 28)} material={toon("#f4efe4")} px={2} />
        <TailProp p={[-0.28, 0.07, 0]} rot={[0, 0.3, 0]} s={1.0} />
      </group>
      <Person look="official" p={[0.1, 0.2, -0.5]} cam={cam} t={t} s={1.9} expr={emo(t, [[0, "deadpan"], [1.8, "worried"], [3.2, "deadpan"]])} pose="idle" seed={80} />
      <Rat t={t} position={[2.6, 1.4, 1.2]} scale={0.7} expr="smug" pose="wave" seed={77} />
      <Dust t={t} />
    </group>
  );
};
