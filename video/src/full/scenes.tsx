import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon, signTexture, woodTexture, brickTexture, repeatTex, rng, clamp, easeInOut, easeOutBack } from "../hotel/kit";
import {
  useAssets, Neighbor, Facade, Hotel, Rig, Barrel, Crate, Lamp, Skyline, Dust, COLS, FLOOR0, FLOOR, HOTEL_W, BASE_Y, LIFT, HotelScene,
} from "../hotel/scene";
import { ContactShadow, yawToward } from "../hotel/chars";
import { Person2 } from "./person";
import { SceneEnv, Lights } from "./env";
import {
  roomTextures, planTexture, windowViewTexture, posterTexture, nameplateTexture, wallTexture, cobbleTexture, lakeTexture, cloudTexture,
} from "./assets";
import { INKD } from "./paint";
import { SkyDome, Terrain, Horizon, Tree, Fence, Pole, GableRoof, Glow, tex } from "./nature";

type V3 = [number, number, number];
export const emo = <T,>(t: number, tl: [number, T][]): T => { let v = tl[0][1]; for (const [k, e] of tl) if (t >= k) v = e; return v; };
export type SceneProps = { t: number; cam: V3 };

let _x: any = null;
const ex = () =>
  (_x ??= {
    rooms: roomTextures(),
    plan: planTexture(),
    view: windowViewTexture(),
    poster: posterTexture("CHICAGO", "GRADE PLAN"),
    plate: nameplateTexture("CITY ENGINEER"),
    wallTeal: wallTexture("#3c9a96", "#2a6e6c", 5),
    wallCream: wallTexture("#f1d9a8", "#b88a5a", 8),
    cobble: cobbleTexture(),
    lake: lakeTexture(),
    cloud: cloudTexture(),
    planksWall: woodTexture(["#9a6a44", "#8a5c3a", "#a8763e"], 4, 8, true),
    signPullman: signTexture("PULLMAN & CO.", "#2b4a8a", "#fff3cf", 1024, 256, "HOUSE RAISERS"),
    signBakery: signTexture("BAKERY", "#d9453f", "#fff3cf", 576, 128),
    signBarber: signTexture("BARBER", "#2f8f5a", "#fff3cf", 576, 128),
    signGrocer: signTexture("GROCER", "#e0b23a", "#2a1a1e", 576, 128),
    signHotel: signTexture("TREMONT HOUSE", "#2b7a8a", "#fff3cf", 1024, 256, "HOTEL"),
    signSaloon: signTexture("HARDWARE", "#2f8f5a", "#fff3cf", 576, 128),
    signShoes: signTexture("SHOES", "#7a3d8f", "#fff3cf", 576, 128),
    signHats: signTexture("HATS", "#c8403a", "#fff3cf", 576, 128),
  });

const Wheel: React.FC<{ r?: number; t?: number }> = ({ r = 0.55, t = 0 }) => {
  const tor = useMemo(() => new THREE.TorusGeometry(r, 0.06, 8, 24), [r]);
  const spoke = useMemo(() => box(0.06, r * 2, 0.06), [r]);
  const hub = useMemo(() => new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12), []);
  const m = useMemo(() => toon("#8a5a34"), []);
  const iron = useMemo(() => toon("#4a4a58"), []);
  return (
    <group rotation={[0, 0, t]}>
      <Ink geometry={tor} material={iron} px={2.2} />
      {[0, 1, 2, 3].map((i) => <mesh key={i} geometry={spoke} material={m} rotation={[0, 0, (i * Math.PI) / 4]} />)}
      <Ink geometry={hub} material={iron} rotation={[Math.PI / 2, 0, 0]} px={1.6} />
    </group>
  );
};



const awningTex = (() => { const m = new Map<string, THREE.Texture>(); return (c: string) => { if (!m.has(c)) { const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const g = cv.getContext("2d")!; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fff3dd" : c; g.fillRect(i * 32, 0, 32, 64); } g.fillStyle = "rgba(42,26,30,.12)"; g.fillRect(0, 44, 256, 20); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; m.set(c, t); } return m.get(c)!; }; })();

type ShopProps = { x: number; z?: number; w?: number; floors?: number; map: THREE.Texture; sign: THREE.Texture; roof?: "gable" | "false" | "flat"; awning?: string; rooms?: THREE.Texture[]; lift?: number; curtains?: string[] };
export const Shop: React.FC<ShopProps> = ({ x, z = 0, w = 5.6, floors = 2, map, sign, roof = "gable", awning = "#c8403a", rooms, lift = 0, curtains }) => {
  const a = useAssets();
  const cols = w > 5.2 ? [-w * 0.26, w * 0.26] : [0];
  const h = 3.0 + floors * 2.4;
  const door = useMemo(() => box(1.3, 2.5, 0.14), []);
  const doorM = useMemo(() => toon("#7a4a2c"), []);
  const awnG = useMemo(() => box(w * 0.86, 0.14, 1.7), [w]);
  const post = useMemo(() => new THREE.CylinderGeometry(0.07, 0.07, 2.9, 8), []);
  const signG = useMemo(() => box(3.15, 0.7, 0.12), []);
  const signMats = useMemo(() => [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(sign), toon("#2b1a1d")], [sign]);
  const pw = useMemo(() => box(w + 0.3, 1.9, 0.34), [w]);
  const cap = useMemo(() => box(w + 0.7, 0.22, 0.5), [w]);
  const bxs = useMemo(() => box(1.3, 0.3, 0.3), []);
  const bloom = useMemo(() => new THREE.SphereGeometry(0.11, 8, 6), []);
  const flowers = useMemo(() => [toon("#ff5f6d"), toon("#ffd23f"), toon("#f78fb3")], []);
  return (
    <group position={[x, lift, z]}>
      <Facade w={w} floors={floors} floor0={3.0} floorH={2.4} cols={cols} map={map} trim="#fff3dd" glass={a.room2} depth={1.2} rooms={rooms} curtains={curtains} />
      {cols.length === 2 ? <Ink geometry={door} material={doorM} position={[0, 1.25, 0.04]} px={2.2} /> : null}
      <Ink geometry={awnG} material={toon(awningTex(awning))} position={[0, 3.0, 1.0]} rotation={[0.26, 0, 0]} px={2.2} />
      <Ink geometry={post} material={toon("#6a4a38")} position={[-w * 0.4, 1.45, 1.75]} px={1.8} /><Ink geometry={post} material={toon("#6a4a38")} position={[w * 0.4, 1.45, 1.75]} px={1.8} />
      <Ink geometry={signG} material={signMats} position={[0, 3.72, 0.28]} px={2.2} />
      {cols.map((cx, i) => (
        <group key={i} position={[cx, 3.0 + 0.4, 0.3]}>
          <Ink geometry={bxs} material={toon("#6b4128")} px={1.6} cast={false} />
          {[0, 1, 2, 3, 4].map((f) => <mesh key={f} geometry={bloom} material={flowers[(f + i) % 3]} position={[-0.5 + f * 0.25, 0.22, 0.02]} />)}
        </group>
      ))}
      {roof === "gable" ? <GableRoof w={w} y={h + 1.35} depth={5} /> : null}
      {roof === "false" ? (
        <group position={[0, h + 1.35, 0]}>
          <Ink geometry={pw} material={toon(map)} position={[0, 0.9, 0.0]} px={2.4} />
          <Ink geometry={cap} material={toon("#fff3dd")} position={[0, 1.95, 0.05]} px={2.2} />
        </group>
      ) : null}
      <Glow p={[0.9, 2.2, 1.0]} s={2.2} />
    </group>
  );
};

/* =========================================================== S2: the mud */
export const S2Mud: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  const bodyGeo = useMemo(() => box(2.8, 0.75, 1.4), []);
  const pipe = useMemo(() => new THREE.CylinderGeometry(0.34, 0.34, 2.2, 16), []);
  const lakeM = useMemo(() => new THREE.MeshBasicMaterial({ map: x.lake, fog: true }), [x]);
  const water = useMemo(() => new THREE.MeshBasicMaterial({ color: "#6f5238", transparent: true, opacity: 0.95 }), []);
  const waterG = useMemo(() => new THREE.CircleGeometry(1, 28), []);
  const stuck = Math.sin(t * 5) * 0.03;
  const shops = [
    { x: -5.2, w: 5.4, h: 4.2, c: a.plasterTeal, s: x.signGrocer },
    { x: 5.2, w: 6, h: 3.6, c: a.brickWarm, s: x.signBarber },
    { x: -12, w: 5, h: 3.6, c: a.brickBlue, s: x.signShoes },
    { x: 12.5, w: 5, h: 3.6, c: a.brickRed, s: x.signHats },
  ];
  return (
    <group>
      <SceneEnv bg="#f1e3cc" fog={["#eddcc2", 24, 120]} />
      <Lights color="#ffd7a0" intensity={2.2} hemi={["#e8e0d4", "#9a7a62", 1.1]} />
      <SkyDome t={t} /><Horizon t={t} />
      <Terrain kind="mud" />
      <mesh material={lakeM} position={[0, 0.02, -62]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[240, 50]} /></mesh>
      {shops.map((s, i) => <Shop key={i} x={s.x} z={-5 - i * 0.2} w={s.w} floors={i % 2 ? 1 : 2} map={s.c} sign={s.s} roof={i % 2 ? "false" : "gable"} awning={["#c8403a", "#2f8f5a", "#7a3d8f", "#e0b23a"][i]} rooms={x.rooms} />)}
      <Tree p={[-9.5, 0, -2]} s={1.3} seed={3} /><Tree p={[9.5, 0, -2.5]} s={1.5} seed={9} />
      <Fence p={[-8, 0, 5]} n={7} rot={0.1} /><Pole p={[6.8, 0, 1]} />
      {/* a wagon with its back wheel sunk in the mud */}
      <group position={[-1.0, 0, -1.6]} rotation={[0, 0.45, 0.06]}>
        <Ink geometry={bodyGeo} material={toon(a.wood)} position={[0, 0.85, 0]} px={2.6} />
        <Ink geometry={box(2.9, 0.12, 1.5)} material={toon(a.woodDark)} position={[0, 0.5, 0]} px={2} />
        <group position={[1.0, 0.55, 0.75]}><Wheel /></group>
        <group position={[-1.0, 0.2 + stuck, 0.75]}><Wheel t={0.2} /></group>
        <group position={[1.0, 0.55, -0.75]}><Wheel /></group>
        <group position={[-1.0, 0.2 + stuck, -0.75]}><Wheel t={0.2} /></group>
        {/* cargo sacks */}
        {[-0.7, 0, 0.7].map((sx, i) => <Ink key={i} geometry={new THREE.SphereGeometry(0.34, 10, 8)} material={toon(["#c8a45a", "#b8944a", "#d4b46a"][i])} position={[sx, 1.4, 0]} scale={[1, 0.8, 1]} px={2} />)}
        {/* mud splashed on top of the sunk wheel */}
        <mesh position={[-1.0, 0.08, 0.76]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.7, 20]} /><meshBasicMaterial color="#5a3f2c" /></mesh>
      </group>
      {/* sewer pipe spilling brown water into a growing puddle */}
      <group position={[3.8, 0, -0.2]}>
        <Ink geometry={pipe} material={toon("#6a6a78")} position={[0, 0.5, -0.4]} rotation={[Math.PI / 2, 0, 0.2]} px={2.4} />
        <mesh geometry={waterG} material={water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 1.1]} scale={[1.4 + t * 0.18, 0.9 + t * 0.12, 1]} />
        <mesh geometry={waterG} material={water} rotation={[-Math.PI / 2, 0, 0]} position={[0.9, 0.035, 1.9]} scale={[0.8 + t * 0.1, 0.5 + t * 0.06, 1]} />
      </group>
      {/* walkway planks */}
      {[0, 1, 2, 3, 4].map((i) => <Ink key={i} geometry={box(2.4, 0.08, 0.5)} material={toon(a.planks)} position={[-6 + i * 0.3, 0.06, 3.0 - i * 0.55]} rotation={[0, 0.2, 0]} px={1.8} />)}
      <Barrel p={[6.4, 0, 3.4]} s={1.1} /><Barrel p={[-4.6, 0, 2.2]} s={1} />
      <Lamp p={[-6, 0, 1.8]} a={a} />
      {/* people */}
      <Person2 look="bowler" expr={emo(t, [[0, "strain"], [3.5, "worried"]])} t={t} position={[0.6, 0, -1.9]} yaw={yawToward([0.6, 0, -1.9], cam)} scale={1.1} seed={4} pose="hold" lean={0.12} />
      <ContactShadow position={[0.6, 0.02, -1.9]} r={0.5} />
      <Person2 look="woman" expr="worried" t={t} position={[-4.2, 0, 1.4]} yaw={yawToward([-4.2, 0, 1.4], cam)} scale={1.0} seed={9} pose="idle" />
      <ContactShadow position={[-4.2, 0.02, 1.4]} r={0.45} />
      <Person2 look="cap" expr={emo(t, [[0, "deadpan"], [3.0, "laugh"]])} t={t} position={[4.8, 0, 3.0]} yaw={yawToward([4.8, 0, 3.0], cam)} scale={1.0} seed={12} pose="cross" />
      <ContactShadow position={[4.8, 0.02, 3.0]} r={0.45} />
      <Dust t={t} />
    </group>
  );
};

/* ======================================================== S3: the office */
export const S3Office: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ex();
  const lampGlow = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffe9a0", transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const stripeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.14, depthWrite: false }), []);
  const wallM = useMemo(() => toon(x.wallTeal), [x]);
  const floorM = useMemo(() => toon(woodTexture(["#b47a46", "#a86c3c", "#bf8650"], 6, 7)), []);
  const deskM = useMemo(() => toon("#9a5a34"), []);
  const emote = emo(t, [[0, "deadpan"], [1.7, "think"], [3.4, "smug"], [4.6, "proud"]]);
  return (
    <group>
      <SceneEnv bg="#3c9a96" />
      <Lights color="#ffe0b0" intensity={2.0} pos={[-6, 8, 8]} hemi={["#d8f0ee", "#a07a5a", 1.2]} shadowSize={10} extra={<pointLight position={[1.6, 1.8, 0.6]} intensity={14} color="#ffd890" distance={7} />} />
      {/* room shell */}
      <Ink geometry={box(14, 7, 0.4)} material={wallM} position={[0, 3.5, -1.6]} px={2.4} />
      <Ink geometry={box(0.4, 7, 8)} material={wallM} position={[-7, 3.5, 2]} px={2.4} />
      <Ink geometry={box(14, 0.3, 9)} material={floorM} position={[0, -0.15, 2.6]} px={2.4} />
      {/* window with the view of the city + light stripes */}
      <group position={[-3.6, 3.6, -1.35]}>
        <Ink geometry={box(2.9, 3.1, 0.18)} material={toon("#7a4a2a")} px={2.2} />
        <mesh position={[0, 0, 0.1]}><planeGeometry args={[2.5, 2.7]} /><meshBasicMaterial map={x.view} /></mesh>
        <Ink geometry={box(0.1, 2.7, 0.1)} material={toon("#fff3dd")} position={[0, 0, 0.14]} px={1.6} />
        <Ink geometry={box(2.5, 0.1, 0.1)} material={toon("#fff3dd")} position={[0, 0.2, 0.14]} px={1.6} />
      </group>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} material={stripeMat} position={[-2.2 + i * 0.75, 2.1 - i * 0.55, -1.34]} rotation={[0, 0, -0.55]}><planeGeometry args={[0.28, 6]} /></mesh>)}
      {/* poster + clock + cabinet */}
      <group position={[3.4, 4.0, -1.34]}><Ink geometry={box(1.6, 2.1, 0.1)} material={toon("#7a4a2a")} px={2} /><mesh position={[0, 0, 0.07]}><planeGeometry args={[1.4, 1.9]} /><meshBasicMaterial map={x.poster} /></mesh></group>
      <Ink geometry={new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24)} material={toon("#fff3dd")} position={[0.2, 5.6, -1.3]} rotation={[Math.PI / 2, 0, 0]} px={2.2} />
      <Ink geometry={box(1.7, 2.8, 1.0)} material={toon("#9aa6b4")} position={[6.0, 1.4, -0.8]} px={2.4} />
      {[0, 1, 2].map((i) => <Ink key={i} geometry={box(1.4, 0.7, 0.06)} material={toon("#b8c4d0")} position={[6.0, 0.55 + i * 0.85, -0.28]} px={1.6} />)}
      {/* desk */}
      <Ink geometry={box(5.4, 0.18, 2.2)} material={deskM} position={[0.6, 1.4, 0.7]} px={2.6} />
      <Ink geometry={box(5.2, 1.3, 0.2)} material={deskM} position={[0.6, 0.72, 1.7]} px={2.4} />
      <Ink geometry={box(0.2, 1.3, 2.0)} material={deskM} position={[-1.9, 0.72, 0.7]} px={2.4} /><Ink geometry={box(0.2, 1.3, 2.0)} material={deskM} position={[3.1, 0.72, 0.7]} px={2.4} />
      {/* the plan */}
      <mesh position={[1.4, 1.5, 0.9]} rotation={[-Math.PI / 2 + 0.12, 0, -0.04]}><planeGeometry args={[3.0, 1.9]} /><meshBasicMaterial map={x.plan} /></mesh>
      <Ink geometry={new THREE.CylinderGeometry(0.1, 0.1, 3.0, 10)} material={toon("#e8d6a8")} position={[1.4, 1.58, 1.9]} rotation={[0, 0, Math.PI / 2]} px={1.6} />
      {/* nameplate, lamp, ink pot */}
      <Ink geometry={box(1.8, 0.4, 0.14)} material={[toon("#5a3a1a"), toon("#5a3a1a"), toon("#5a3a1a"), toon("#5a3a1a"), toon(x.plate), toon("#5a3a1a")]} position={[-1.1, 1.62, 1.65]} rotation={[-0.18, 0, 0]} px={2} />
      <group position={[-1.4, 1.5, 0.3]}>
        <Ink geometry={new THREE.CylinderGeometry(0.28, 0.32, 0.12, 14)} material={toon("#7a5a2a")} px={1.8} />
        <Ink geometry={new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8)} material={toon("#7a5a2a")} position={[0, 0.6, 0]} px={1.6} />
        <Ink geometry={new THREE.ConeGeometry(0.42, 0.4, 14, 1, true)} material={toon("#2f8a6a", { side: THREE.DoubleSide })} position={[0.2, 1.3, 0]} rotation={[0, 0, -0.3]} px={2} />
        <mesh material={lampGlow} position={[0.25, 1.1, 0.3]}><planeGeometry args={[2.4, 2.4]} /></mesh>
      </group>
      <Ink geometry={new THREE.CylinderGeometry(0.16, 0.2, 0.22, 12)} material={toon("#2a2a34")} position={[0.1, 1.6, 0.4]} px={1.6} />
      {/* the engineer, behind the desk */}
      <Person2 look="engineer" stripes expr={emote as any} t={t} position={[0.4, 0.2, -0.75]} yaw={0.05} scale={1.5} seed={3} pose="hold" handR={null} />
    </group>
  );
};

/* ================================================== S4: angry shopowners */
export const S4Owners: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  const owners: { x: number; look: any; expr: any; seed: number }[] = [
    { x: -7.6, look: "baker", expr: "angry", seed: 5 },
    { x: -1.4, look: "glasses", expr: "deadpan", seed: 6 },
    { x: 4.6, look: "woman", expr: "angry", seed: 7 },
    { x: 9.6, look: "bowler", expr: "smug", seed: 8 },
  ];
  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 38, 130]} />
      <Lights />
      <SkyDome t={t} /><Horizon t={t} />
      <Terrain kind="mud" />
      <Terrain kind="cobble" w={200} d={9} z={3.2} y={0.02} tile={8} />
      <Shop x={-7.6} w={6.4} floors={2} map={a.plasterTeal} sign={x.signBakery} roof="gable" awning="#c8403a" rooms={x.rooms} />
      <Shop x={-1.4} w={5.4} floors={3} map={a.brickBlue} sign={x.signGrocer} roof="false" awning="#e0b23a" rooms={x.rooms} />
      <Shop x={4.6} w={6.0} floors={2} map={a.brickRed} sign={x.signBarber} roof="gable" awning="#2f8f5a" rooms={x.rooms} />
      <Shop x={9.6} w={5.4} floors={3} map={a.brickWarm} sign={x.signHats} roof="false" awning="#7a3d8f" rooms={x.rooms} />
      <Lamp p={[1.6, 0, 4.4]} a={a} />
      <Barrel p={[-4.4, 0, 3.6]} /><Barrel p={[7.2, 0, 3.8]} />
      {owners.map((o, i) => {
        const p: V3 = [o.x, 0, 3.2];
        return (
          <React.Fragment key={i}>
            <Person2 look={o.look} expr={emo(t, [[0, o.expr], [2.2, i % 2 ? "angry" : "deadpan"]])} t={t} position={p} yaw={yawToward(p, cam)} scale={1.25} seed={o.seed} pose="cross" emph={1} />
            <ContactShadow position={[p[0], 0.03, p[2]]} r={0.55} />
          </React.Fragment>
        );
      })}
      
      <Dust t={t} />
    </group>
  );
};

/* ========================================================== jack props */
const helixGeo = (turns: number, h: number, r: number, tube: number) => {
  const pts: THREE.Vector3[] = [];
  const n = turns * 24;
  for (let i = 0; i <= n; i++) { const a = (i / 24) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, (i / n) * h, Math.sin(a) * r)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, tube, 8, false);
};

export const JackProp: React.FC<{ spin?: number; s?: number; rise?: number }> = ({ spin = 0, s = 1, rise = 0 }) => {
  const rod = useMemo(() => new THREE.CylinderGeometry(0.11, 0.11, 1.9, 14), []);
  const helix = useMemo(() => helixGeo(11, 1.8, 0.115, 0.035), []);
  const hous = useMemo(() => new THREE.CylinderGeometry(0.3, 0.36, 0.7, 18), []);
  const lever = useMemo(() => new THREE.CylinderGeometry(0.045, 0.045, 1.5, 8), []);
  const base = useMemo(() => box(0.95, 0.12, 0.95), []);
  const steel = useMemo(() => toon("#6a7488"), []); const steelL = useMemo(() => toon("#9aa6b8"), []); const wood = useMemo(() => toon("#a8693b"), []);
  return (
    <group scale={s}>
      <Ink geometry={base} material={steel} position={[0, 0.06, 0]} px={2} />
      <Ink geometry={hous} material={steel} position={[0, 0.48, 0]} px={2.4} />
      <group position={[0, 0.95 + rise, 0]} rotation={[0, spin, 0]}>
        <Ink geometry={rod} material={steelL} position={[0, 0.5, 0]} px={2} />
        <mesh geometry={helix} material={steel} position={[0, -0.4, 0]} />
        <Ink geometry={lever} material={wood} position={[0.75, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} px={2} />
      </group>
    </group>
  );
};

/* ================================================== S5: Pullman, the hero */
export const S5Pullman: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  const signG = useMemo(() => box(5.6, 1.4, 0.18), []);
  const p: V3 = [0, 0, 0];
  const pop = easeOutBack(clamp(t / 0.5));
  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 32, 120]} />
      <Lights intensity={3.0} pos={[-6, 10, 12]} />
      <SkyDome t={t} /><Horizon t={t} />
      <Terrain kind="mud" />
      <Terrain kind="cobble" w={200} d={14} z={-2} y={0.02} tile={8} />
      {/* big painted hoarding */}
      <group position={[0.6, 0, -5]}>
        <Ink geometry={box(0.3, 6.4, 0.3)} material={toon(a.woodDark)} position={[-3.2, 3.2, 0]} px={2.4} />
        <Ink geometry={box(0.3, 6.4, 0.3)} material={toon(a.woodDark)} position={[3.2, 3.2, 0]} px={2.4} />
        <Ink geometry={signG} material={[toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(x.signPullman), toon("#2b1a1d")]} position={[0, 5.4, 0.1]} px={2.6} />
        <Ink geometry={box(6.2, 3.2, 0.2)} material={toon(x.planksWall)} position={[0, 2.0, -0.1]} px={2.4} />
      </group>
      <Shop x={-9} z={-1} w={7} floors={3} map={a.brickRed} sign={x.signGrocer} roof="gable" awning="#c8403a" rooms={x.rooms} />
      <Shop x={9} z={-1} w={7} floors={3} map={a.brickBlue} sign={x.signBarber} roof="false" awning="#2f8f5a" rooms={x.rooms} />
      <Tree p={[-15, 0, -6]} s={1.6} seed={4} /><Tree p={[15, 0, -7]} s={1.5} seed={8} />
      <Barrel p={[-3.2, 0, -1.6]} /><Crate p={[3.6, 0, -1.4]} s={[1.2, 1, 1]} rot={0.3} a={a} />
      {/* Pullman, one hand resting on a jackscrew that stands beside him */}
      <Person2 look="pullman" expr={emo(t, [[0, "smug"], [1.6, "proud"], [3.6, "grin"]])} t={t} position={[-0.5, 0, 0.4]} yaw={0.08} scale={1.6 * (0.9 + 0.1 * pop)} seed={21} pose="point" emph={0} />
      <ContactShadow position={[-0.5, 0.03, 0.4]} r={0.8} />
      <group position={[1.5, 0, 0.9]}><JackProp spin={t * 2.2} s={1.5} rise={Math.min(0.5, t * 0.15)} /></group>
      <ContactShadow position={[1.5, 0.03, 0.9]} r={0.7} />
      <Dust t={t} />
    </group>
  );
};

/* ================================================ S6: the owner's condition */
export const S6Condition: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 38, 130]} />
      <Lights intensity={2.6} pos={[-10, 12, 12]} />
      <SkyDome t={t} /><Horizon t={t} />
      <Terrain kind="mud" />
      <Terrain kind="cobble" w={200} d={10} z={1.5} y={0.02} tile={8} />
      <group position={[0, 0.9, -4.5]}>
        <Hotel t={t} a={a} lift={0.9} defaultGuests rooms={x.rooms} />
      </group>
      <Lamp p={[4.2, 0, 1.0]} a={a} />
      <Barrel p={[-4.6, 0, 1.4]} />
      {/* owner (stern) and Pullman (calm), shaking on it */}
      <Person2 look="owner" expr={emo(t, [[0, "angry"], [1.8, "deadpan"], [2.8, "grin"]])} emph={t < 1.8 ? 1 : 0} t={t} position={[-1.0, 0, 0.8]} yaw={0.55} scale={1.4} seed={31} pose={t > 2.6 ? "shake" : "cross"} />
      <Person2 look="pullman" expr={emo(t, [[0, "proud"], [2.8, "grin"]])} t={t} position={[1.05, 0, 0.8]} yaw={-0.55} scale={1.4} seed={32} pose={t > 2.6 ? "shake" : "hold"} />
      <ContactShadow position={[-1.0, 0.03, 0.8]} r={0.7} /><ContactShadow position={[1.05, 0.03, 0.8]} r={0.7} />
      <Dust t={t} />
    </group>
  );
};

/* ============================================ S7: how a jackscrew works */
export const S7Jacks: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  const xs = [-8.8, -6.6, -4.4, -2.2, 0, 2.2, 4.4, 6.6, 8.8];
  const lift = 0.5 + 0.7 * easeInOut(clamp(t / 5.4));
  const big = clamp(1 - (t - 2.4) / 0.6);
  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 38, 130]} />
      <Lights />
      <SkyDome t={t} /><Horizon t={t} />
      <Terrain kind="mud" />
      <Hotel t={t} a={a} lift={BASE_Y * 0 + lift + BASE_Y - 1.55 + 0} defaultGuests rooms={x.rooms} />
      <Rig t={t} a={a} lift={lift} xs={xs} />
      <Neighbor x={-14.5} w={8} floors={2} map={a.plasterTeal} trim="#fff3dd" a={a} cols={[-2, 2]} />
      <Neighbor x={15} w={8} floors={3} map={a.brickBlue} trim="#fff3dd" a={a} cols={[-2, 2]} />
      {/* a worker beside every jack */}
      {xs.map((jx, i) => {
        const p: V3 = [jx + 0.85, 0, 1.7 + (i % 2) * 0.2];
        return (
          <React.Fragment key={i}>
            <Person2 look={["cap", "bowler", "glasses", "cap", "bowler"][i % 5] as any} expr="strain" t={t + i * 0.1} position={p} yaw={yawToward(p, cam)} scale={0.95} seed={40 + i} pose="crank" />
            <ContactShadow position={[p[0], 0.03, p[2]]} r={0.42} />
          </React.Fragment>
        );
      })}
      {/* the big close-up jackscrew in the foreground */}
      {big > 0.01 ? (
        <group position={[-0.6, 0, 3.1]} scale={big}>
          <JackProp spin={t * 2.4} s={2.0} rise={Math.min(0.6, t * 0.22)} />
          <Person2 look="cap" expr="strain" t={t} position={[1.9, 0, 0.6]} yaw={-0.4} scale={1.7} seed={77} pose="crank" />
        </group>
      ) : null}
      <Dust t={t} />
    </group>
  );
};

/* ============================================ S8: life goes on upstairs */
export const S8Rooms: React.FC<SceneProps> = ({ t, cam }) => {
  const x = ex();
  const steam = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55, depthWrite: false }), []);
  const bubble = useMemo(() => new THREE.MeshBasicMaterial({ color: "#d8ecff", transparent: true, opacity: 0.7, depthWrite: false }), []);
  const sill = (floor: number) => FLOOR0 + FLOOR * floor + 0.55;
  const win = (col: number, floor: number): V3 => [COLS[col], sill(floor) - 0.55, -0.4];
  const bubbleS = 0.7 + 0.5 * Math.abs(Math.sin(t * 1.6));
  const guests = (
    <>
      {/* diner with soup */}
      <Person2 look="owner" expr="grin" t={t} position={win(0, 1)} scale={0.6} seed={51} pose="idle" tint="#ffe9c8"
        handR={<group position={[0.02, 0.05, 0.05]}><mesh><cylinderGeometry args={[0.16, 0.12, 0.1, 14]} /><meshBasicMaterial color="#f4efe4" /></mesh>{[0, 1, 2].map((i) => <mesh key={i} material={steam} position={[Math.sin(t * 3 + i) * 0.04, 0.18 + ((t * 0.5 + i * 0.33) % 1) * 0.35, 0]}><circleGeometry args={[0.05 + i * 0.01, 10]} /></mesh>)}</group>} />
      {/* reader with a newspaper */}
      <Person2 look="glasses" expr="think" t={t} position={win(1, 1)} scale={0.6} seed={52} pose="hold" tint="#ffe9c8"
        handR={<mesh position={[-0.12, 0.1, 0.05]}><planeGeometry args={[0.5, 0.6]} /><meshBasicMaterial color="#f4efe0" side={THREE.DoubleSide} /></mesh>} />
      {/* sleeper with a snore bubble */}
      <Person2 look="guest" expr="sleep" t={t} position={win(2, 1)} scale={0.6} seed={53} pose="sleep" tint="#ffe9c8" />
      <mesh material={bubble} position={[COLS[2] + 0.45, sill(1) + 0.4, -0.05]} scale={bubbleS}><circleGeometry args={[0.18, 18]} /></mesh>
      {/* second floor */}
      <Person2 look="woman" expr="laugh" t={t} position={win(1, 2)} scale={0.6} seed={54} pose="idle" tint="#ffe9c8" />
      <Person2 look="boss" expr="smug" t={t} position={win(3, 1)} scale={0.6} seed={55} pose="idle" tint="#ffe9c8" />
      <Person2 look="guest" expr="sleep" t={t + 1.1} position={win(0, 2)} scale={0.6} seed={56} pose="sleep" tint="#ffe9c8" />
      <mesh material={bubble} position={[COLS[0] + 0.45, sill(2) + 0.4, -0.05]} scale={0.6 + 0.5 * Math.abs(Math.sin(t * 1.4 + 1))}><circleGeometry args={[0.18, 18]} /></mesh>
      <Person2 look="cap" expr="grin" t={t} position={win(3, 2)} scale={0.6} seed={57} pose="idle" tint="#ffe9c8" />
      <Person2 look="guest" expr="sleep" t={t + 0.6} position={win(2, 0) as any} scale={0.6} seed={58} pose="sleep" tint="#ffe9c8" />
    </>
  );
  return <HotelScene t={t} cam={cam} liftTime={3.4} boardT={9} rooms={x.rooms} guests={guests} defaultGuests={false} crew={false} />;
};

/* ================================================== S9: it worked */
export const S9Reveal: React.FC<SceneProps> = ({ t, cam }) => (
  <HotelScene t={t} cam={cam} liftTime={5} boardT={9} crewPose="cheer" crewExpr="laugh" />
);

/* ============================================== S10: whole blocks rise */
export const S10Shops: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  const lift = 1.1 * easeInOut(clamp(t / 3.7));
  const shops = [
    { x: -9.5, c: a.brickRed, s: x.signBakery, floors: 2 },
    { x: -3.2, c: a.plasterTeal, s: x.signBarber, floors: 2 },
    { x: 3.2, c: a.brickWarm, s: x.signShoes, floors: 2 },
    { x: 9.5, c: a.brickBlue, s: x.signHats, floors: 3 },
  ];
  const walkers = [0, 1, 2, 3, 4, 5].map((i) => ({ i, look: ["woman", "bowler", "glasses", "cap", "boss", "baker"][i], x0: -11 + i * 4.1, dir: i % 2 ? -1 : 1 }));
  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 45, 140]} />
      <Lights shadowSize={26} />
      <SkyDome t={t} /><Horizon t={t} />
      <Terrain kind="mud" />
      <Terrain kind="cobble" w={200} d={8} z={4.5} y={0.02} tile={8} />
      {shops.map((s, i) => <Shop key={i} x={s.x} lift={lift} w={5.6} floors={s.floors} map={s.c} sign={s.s} roof={i % 2 ? "false" : "gable"} awning={["#c8403a", "#2f8f5a", "#7a3d8f", "#e0b23a"][i]} rooms={x.rooms} />)}
      <Rig t={t} a={a} lift={1.55 + lift - 1.55 + 1.55 - 1.55 + 0} xs={[-11.5, -7.5, -5.2, -1.2, 1.2, 5.2, 7.5, 11.5]} />
      {walkers.map((w) => {
        const px = ((w.x0 + t * 1.5 * w.dir + 14) % 28) - 14;
        const p: V3 = [px, 0, 4.4 + (w.i % 3) * 0.5];
        return (
          <React.Fragment key={w.i}>
            <Person2 look={w.look as any} expr={w.i % 2 ? "grin" : "deadpan"} t={t} position={p} yaw={w.dir > 0 ? 0.9 : -0.9} scale={1.0} seed={60 + w.i} pose="walk" />
            <ContactShadow position={[p[0], 0.03, p[2]]} r={0.4} />
          </React.Fragment>
        );
      })}
      <Lamp p={[-6.5, 0, 6.2]} a={a} /><Lamp p={[6.5, 0, 6.2]} a={a} />
      
      <Dust t={t} />
    </group>
  );
};

/* ==================================================== S11: the new street */
export const S11Close: React.FC<SceneProps> = ({ t, cam }) => {
  const a = useAssets(); const x = ex();
  const wagonX = -10 + t * 4.2;
  const turn = t * 2.0;
  const secMats = useMemo(() => {
    const top = tex().cobble.clone(); top.needsUpdate = true; top.wrapS = top.wrapT = THREE.RepeatWrapping; top.repeat.set(10, 2);
    const soil = toon("#5a4636");
    return [soil, soil, toon(top), toon("#4a3a2c"), toon(tex().strata), soil];
  }, []);
  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 45, 150]} />
      <Lights shadowSize={26} />
      <SkyDome t={t} /><Horizon t={t} />
      {/* cross-section: the buried old mud street under the new cobbled street */}
      <Ink geometry={box(80, 3.7, 14)} material={secMats} position={[0, 0.05, 0]} px={2.4} />
      <Terrain kind="mud" y={-1.8} />
      {[-10.2, -3.6, 3.0, 9.6].map((bx, i) => (
        <group key={i} position={[bx, 1.9 + 0.45 - 0.45 + 0.0, -3]}>
          <Facade w={5.6} floors={2} floor0={3.0} floorH={2.4} cols={[-1.4, 1.4]} map={[a.brickRed, a.plasterTeal, a.brickWarm, a.brickBlue][i]} trim="#fff3dd" glass={a.room2} depth={1.2} rooms={x.rooms} />
        </group>
      ))}
      <Lamp p={[-6.5, 1.9, 2.4]} a={a} /><Lamp p={[6.5, 1.9, 2.4]} a={a} />
      {/* a wagon rolling along the new street */}
      <group position={[wagonX, 1.9, 1.5]}>
        <Ink geometry={box(2.8, 0.7, 1.3)} material={toon(a.wood)} position={[0, 0.95, 0]} px={2.4} />
        <group position={[0.9, 0.5, 0.75]}><Wheel t={-t * 4.2 / 0.55} /></group><group position={[-0.9, 0.5, 0.75]}><Wheel t={-t * 4.2 / 0.55} /></group>
        <Person2 look="bowler" expr="grin" t={t} position={[-0.2, 1.3, 0]} scale={0.8} seed={71} pose="hold" />
      </group>
      {/* the jackscrew, still turning, in the foreground */}
      <group position={[-3.4, 1.9, 4.8]}><JackProp spin={turn} s={1.15} rise={0.3} /></group>
      
      <Dust t={t} />
    </group>
  );
};

export const S1Hook: React.FC<SceneProps> = ({ t, cam }) => <HotelScene t={t} cam={cam} />;
export { ex };
