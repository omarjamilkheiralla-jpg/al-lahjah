import * as THREE from "three";
import React, { useMemo } from "react";
import {
  Ink, INK, box, toon, wallWithHoles, brickTexture, woodTexture, mudTexture, stoneTexture, plasterTexture,
  signTexture, poleMarksTexture, glowTexture, roomTexture, repeatTex, rng, clamp, easeInOut, easeOutBack,
} from "./kit";
import { Person, PALETTES, SleepingGuest, ContactShadow, yawToward } from "./chars";
import { Person2 } from "../full/person";
import { SceneEnv } from "../full/env";
import { SkyDome, Terrain, Horizon, Tree, Fence, Pole } from "../full/nature";

/* ------------------------------------------------------------------ */
/* constants                                                          */
/* ------------------------------------------------------------------ */
export const HOTEL_W = 10;
export const FLOOR0 = 3.4; // ground-floor height
export const FLOOR = 2.6; // upper floor height
export const N_UP = 3;
export const HOTEL_H = FLOOR0 + FLOOR * N_UP;
export const BASE_Y = 1.55; // where the hotel starts (on its stone basement)
export const LIFT = 1.83; // six feet in metres
export const DEPTH = 9.3;
const JACK_X = [-4.4, -2.2, 2.2, 4.4];
const JACK_Z = 0.62;
const PHASE = [0.4, 1.9, 3.3, 4.6];

export const liftAt = (t: number) => LIFT * easeInOut(clamp((t - 0.7) / 4.0));

export const GUEST_WIN = { col: 2, floor: 2 }; // third upper floor, x = +1.3
export const COLS = [-3.9, -1.3, 1.3, 3.9];
export const guestLocal = (): [number, number, number] => [COLS[GUEST_WIN.col], FLOOR0 + FLOOR * GUEST_WIN.floor + 1.13, -0.38];

/* ------------------------------------------------------------------ */
/* textures + materials (built once)                                  */
/* ------------------------------------------------------------------ */
const buildAssets = () => {
    const brickRed = brickTexture(["#c4472e", "#b53d28", "#d2563a", "#a8362a", "#c9553a"], "#e9cfae", 3);
    const brickWarm = brickTexture(["#d98a4a", "#cb7a3f", "#e29a58", "#c56f3a"], "#f1dcb8", 8);
    const brickBlue = brickTexture(["#6e86b8", "#5f78ab", "#7b92c2", "#54699c"], "#e9dcc6", 12);
    const wood = woodTexture(["#a8693b", "#9a5c32", "#b57544", "#8c5230"], 7, 6);
    const woodDark = woodTexture(["#7a4a2e", "#6c4028", "#85532f"], 17, 4);
    const planks = woodTexture(["#b47a46", "#a86c3c", "#bf8650", "#9c6236"], 5, 7);
    const mud = mudTexture(11);
    const stone = stoneTexture(5);
    const plaster = plasterTexture("#f0d9ad", 2);
    const plasterTeal = plasterTexture("#7fc4b6", 4);
    const marks = poleMarksTexture(BASE_Y, 4.0);
    return {
      brickRed: repeatTex(brickRed, 1 / 2, 1 / 2),
      brickWarm: repeatTex(brickWarm, 1 / 2, 1 / 2),
      brickBlue: repeatTex(brickBlue, 1 / 2, 1 / 2),
      wood: repeatTex(wood, 1, 1),
      woodDark: repeatTex(woodDark, 1, 1),
      planks: repeatTex(planks, 1, 1),
      mud: repeatTex(mud, 14, 14),
      stone: repeatTex(stone, 1 / 1.6, 1 / 1.6),
      plaster: repeatTex(plaster, 1 / 3, 1 / 3),
      plasterTeal: repeatTex(plasterTeal, 1 / 3, 1 / 3),
      marks,
      glow: glowTexture("255,224,150"),
      room: roomTexture(4),
      room2: roomTexture(9, "#ffe2a8", "#f0a65e"),
      signHotel: signTexture("TREMONT HOUSE", "#2b7a8a", "#fff3cf", 1024, 256, "HOTEL"),
      signChi: signTexture("CHICAGO", "#e0b23a", INK, 1024, 256),
      sign6: signTexture("6 FT", "#d9453f", "#fff3cf", 512, 256),
      signLift: signTexture("LIFTING CO.", "#7a3d8f", "#fff3cf", 640, 160),
      signStore: signTexture("BAKERY", "#d9453f", "#fff3cf", 512, 128),
      signBlade: signTexture("BAKERY", "#d9453f", "#fff3cf", 256, 256),
      signSaloon: signTexture("HARDWARE", "#2f8f5a", "#fff3cf", 512, 128),
    };
};
let _a: ReturnType<typeof buildAssets> | null = null;
export const useAssets = () => (_a ??= buildAssets());

/* ------------------------------------------------------------------ */
/* facade builder                                                     */
/* ------------------------------------------------------------------ */
type FacadeProps = {
  w: number;
  floors: number;
  floor0: number;
  floorH: number;
  cols: number[];
  map: THREE.Texture;
  trim: string;
  glass: THREE.Texture;
  door?: boolean;
  depth?: number;
  arch?: boolean;
  shutters?: string;
  rooms?: THREE.Texture[];
};

export const Facade: React.FC<FacadeProps> = ({ w, floors, floor0, floorH, cols, map, trim, glass, door, depth = 0.9, arch, shutters, rooms }) => {
  const h = floor0 + floors * floorH;
  const { wall, holes, trimMat, woodMat } = useMemo(() => {
    const holes: { x: number; y: number; w: number; h: number; arch?: boolean }[] = [];
    // ground floor shop windows
    const shopX = door ? [cols[0] - 0.2, cols[cols.length - 1] + 0.2] : cols;
    for (const x of shopX) holes.push({ x, y: 0.7, w: door ? 2.1 : 1.4, h: door ? 2.2 : 1.9 });
    for (let f = 0; f < floors; f++) {
      for (const x of cols) holes.push({ x, y: floor0 + f * floorH + 0.55, w: 1.3, h: 1.75, arch: arch && f === floors - 1 });
    }
    const wall = wallWithHoles(w, h, depth, holes, door ? { x: 0, w: 1.7, h: 2.75 } : undefined);
    return { wall, holes, trimMat: toon(trim), woodMat: toon("#6b4128") };
  }, [w, floors, floor0, floorH, cols, trim, door, depth, arch]);
  const backTex = useMemo(() => {
    const t = glass.clone();
    t.needsUpdate = true;
    t.repeat.set(w / 2.6, h / 2.6);
    return new THREE.MeshBasicMaterial({ map: t });
  }, [glass, w, h]);
  const frameMat = useMemo(() => toon("#fff3dd"), []);
  const sillGeo = useMemo(() => box(1.7, 0.16, 0.42), []);
  const lintelGeo = useMemo(() => box(1.64, 0.2, 0.3), []);
  const sashV = useMemo(() => box(0.07, 1.75, 0.07), []);
  const sashH = useMemo(() => box(1.3, 0.07, 0.07), []);
  const corniceGeos = useMemo(() => [box(w + 0.7, 0.28, 1.15), box(w + 0.35, 0.22, 0.95), box(w, 0.9, 0.8)], [w]);
  const parapetMat = useMemo(() => toon(trim === "#f3e3c3" ? "#b8452f" : "#d9b88a"), [trim]);
  const curtainGeo = useMemo(() => box(0.2, 1.6, 0.05), []);
  const curtainMat = useMemo(() => [toon("#d9453f"), toon("#f2c53d"), toon("#7a3d8f")], []);

  return (
    <group>
      <Ink geometry={wall} material={toon(map)} px={3.2} />
      {/* painted warm interior behind every opening (windows + door) */}
      <mesh position={[0, h / 2, -depth + 0.2]}>
        <planeGeometry args={[w, h]} />
        <primitive object={backTex} attach="material" />
      </mesh>
      {holes.map((o, i) => {
        const upper = o.y > floor0 - 0.1;
        return (
          <group key={i} position={[o.x, o.y, -0.08]}>
            {rooms && upper ? (
              <mesh position={[0, o.h / 2, -depth + 0.34]}>
                <planeGeometry args={[o.w + 0.1, o.h + 0.1]} />
                <meshBasicMaterial map={rooms[i % rooms.length]} />
              </mesh>
            ) : null}
            {/* sash cross + frame */}
            

            {/* sill + lintel */}
            <Ink geometry={sillGeo} material={trimMat} position={[0, -0.04, 0.12]} px={2.4} />
            {upper ? <Ink geometry={lintelGeo} material={trimMat} position={[0, o.h + 0.1, 0.09]} px={2.2} /> : null}
            {upper && !(shutters === undefined) ? (
              <>
                <Ink geometry={curtainGeo} material={curtainMat[i % 3]} position={[-o.w / 2 + 0.14, o.h / 2 + 0.05, -0.15]} px={1.4} cast={false} />
                <Ink geometry={curtainGeo} material={curtainMat[i % 3]} position={[o.w / 2 - 0.14, o.h / 2 + 0.05, -0.15]} px={1.4} cast={false} />
              </>
            ) : null}
          </group>
        );
      })}
      {/* cornice */}
      <Ink geometry={corniceGeos[0]} material={trimMat} position={[0, h + 0.14, -0.4]} px={2.6} />
      <Ink geometry={corniceGeos[1]} material={trimMat} position={[0, h + 0.4, -0.3]} px={2.6} />
      <Ink geometry={corniceGeos[2]} material={parapetMat} position={[0, h + 0.95, -0.4]} px={2.6} />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* the hotel (everything that rises) + the rig                        */
/* ------------------------------------------------------------------ */
export const Hotel: React.FC<{ t: number; a: ReturnType<typeof useAssets>; lift?: number; guests?: React.ReactNode; defaultGuests?: boolean; rooms?: THREE.Texture[] }> = ({ t, a, lift: liftO, guests, defaultGuests = true, rooms }) => {
  const lift = liftO ?? liftAt(t);
  const y = BASE_Y + lift;
  const slab = useMemo(() => box(HOTEL_W, 0.4, DEPTH), []);
  const roof = useMemo(() => box(HOTEL_W + 0.4, 0.3, DEPTH), []);
  const chim = useMemo(() => box(0.9, 2.2, 0.9), []);
  const chimCap = useMemo(() => box(1.15, 0.22, 1.15), []);
  const awningGeo = useMemo(() => box(2.8, 0.14, 1.5), []);
  const awningStripe = useMemo(() => {
    const t = new THREE.CanvasTexture(
      (() => {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 64;
        const g = c.getContext("2d")!;
        for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fff3dd" : "#d9453f"; g.fillRect(i * 32, 0, 32, 64); }
        return c;
      })(),
    );
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const signGeo = useMemo(() => box(4.4, 1.1, 0.16), []);
  const signMat = useMemo(() => [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(a.signHotel), toon("#2b1a1d")], [a]);
  const g = guestLocal();
  const quoin = useMemo(() => box(0.7, 0.8, 0.22), []);
  const quoinMat = useMemo(() => toon("#f3e3c3"), []);
  const boxGeo = useMemo(() => box(1.5, 0.36, 0.34), []);
  const boxMat = useMemo(() => toon("#6b4128"), []);
  const bloom = useMemo(() => new THREE.SphereGeometry(0.13, 10, 8), []);
  const blooms = useMemo(() => [toon("#ff5f6d"), toon("#ffd23f"), toon("#f78fb3")], []);
  const bracket = useMemo(() => box(1.1, 0.07, 0.07), []);
  const ironMat = useMemo(() => toon("#2f3a46"), []);
  const blade = useMemo(() => box(1.0, 1.0, 0.1), []);
  const bladeMats = useMemo(() => [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(a.signBlade), toon("#2b1a1d")], [a]);
  const flagPole = useMemo(() => new THREE.CylinderGeometry(0.04, 0.05, 2.4, 8), []);
  const flagGeo = useMemo(() => new THREE.PlaneGeometry(1.2, 0.7), []);
  const flagMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#d9453f", side: THREE.DoubleSide }), []);

  return (
    <group position={[0, y, 0]}>
      <Facade w={HOTEL_W} floors={N_UP} floor0={FLOOR0} floorH={FLOOR} cols={COLS} map={a.brickRed} trim="#f3e3c3" glass={a.room} door shutters="x" rooms={rooms} />
      {/* floor slab + roof */}
      <Ink geometry={slab} material={toon(a.woodDark)} position={[0, 0.2, -DEPTH / 2]} px={2.2} />
      <Ink geometry={roof} material={toon("#6b3a38")} position={[0, HOTEL_H + 1.5, -DEPTH / 2]} px={2.2} />
      <Ink geometry={chim} material={toon(a.brickRed)} position={[-3.2, HOTEL_H + 2.6, -3]} px={2.2} />
      <Ink geometry={chimCap} material={toon("#f3e3c3")} position={[-3.2, HOTEL_H + 3.8, -3]} px={2.2} />
      {/* striped awning over the door */}
      <Ink geometry={awningGeo} material={toon(awningStripe)} position={[0, 2.35, 0.95]} rotation={[0.22, 0, 0]} px={2.4} />
      {/* hotel sign board */}
      <Ink geometry={signGeo} material={signMat} position={[0, FLOOR0 + 0.0, 0.38]} px={2.4} />
      {/* corner quoins */}
      {Array.from({ length: 14 }, (_, k) => (
        <React.Fragment key={k}>
          <Ink geometry={quoin} material={quoinMat} position={[-HOTEL_W / 2 + 0.2, 0.5 + k * 0.9, 0.0]} scale={[k % 2 ? 1 : 1.35, 1, 1]} px={1.8} />
          <Ink geometry={quoin} material={quoinMat} position={[HOTEL_W / 2 - 0.2, 0.5 + k * 0.9, 0.0]} scale={[k % 2 ? 1 : 1.35, 1, 1]} px={1.8} />
        </React.Fragment>
      ))}
      {/* flower boxes */}
      {[0, 1, 3].map((ci, k) => (
        <group key={k} position={[COLS[ci], FLOOR0 + FLOOR + 0.5, 0.34]}>
          <Ink geometry={boxGeo} material={boxMat} px={1.8} />
          {Array.from({ length: 6 }, (_, f) => (
            <mesh key={f} geometry={bloom} material={blooms[(f + k) % 3]} position={[-0.6 + f * 0.24, 0.22 + (f % 2) * 0.05, 0.02]} />
          ))}
        </group>
      ))}
      {/* hanging blade sign on an iron bracket */}
      <group position={[HOTEL_W / 2 + 0.05, 5.4, 0.5]}>
        <Ink geometry={bracket} material={ironMat} position={[0.55, 0, 0]} px={1.6} />
        <group position={[0.9, -0.7, 0]} rotation={[0, 0, Math.sin(t * 1.3) * 0.04]}>
          <Ink geometry={blade} material={bladeMats} px={2} />
        </group>
      </group>
      {/* roof flag */}
      <group position={[3.4, HOTEL_H + 2.0, -1.4]}>
        <Ink geometry={flagPole} material={ironMat} position={[0, 1.2, 0]} px={1.6} />
        <mesh geometry={flagGeo} material={flagMat} position={[0.62, 2.1, 0]} rotation={[0, Math.sin(t * 3) * 0.25, 0]} />
      </group>
      {defaultGuests ? (
        <>
          <Person2 look="guest" expr="sleep" pose="sleep" t={t} position={[COLS[2], FLOOR0 + FLOOR * 2 + 0.55 - 0.55, -0.4]} scale={0.6} seed={5} tint="#ffe9c8" />
          <Person2 look="guest" expr="sleep" pose="sleep" t={t + 1.4} position={[COLS[0], FLOOR0 + 0.55 - 0.55, -0.4]} scale={0.6} seed={11} tint="#ffe9c8" />
        </>
      ) : null}
      {guests}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* the jackscrew rig                                                  */
/* ------------------------------------------------------------------ */
export const Rig: React.FC<{ t: number; a: ReturnType<typeof useAssets>; lift?: number; xs?: number[] }> = ({ t, a, lift: liftO, xs }) => {
  const lift = liftO ?? liftAt(t);
  const beamBottom = BASE_Y + lift - 0.0; // bottom of the slab
  const beamGeo = useMemo(() => box(0.5, 0.42, DEPTH + 0.8), []);
  const baseGeo = useMemo(() => box(0.9, 0.12, 0.9), []);
  const housing = useMemo(() => new THREE.CylinderGeometry(0.26, 0.3, 0.8, 18), []);
  const rod = useMemo(() => new THREE.CylinderGeometry(0.1, 0.1, 1, 14), []);
  const collar = useMemo(() => new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), []);
  const leverGeo = useMemo(() => new THREE.CylinderGeometry(0.045, 0.045, 1.25, 8), []);
  const thread = useMemo(() => new THREE.TorusGeometry(0.1, 0.022, 6, 14), []);
  const timber = useMemo(() => box(1.25, 0.22, 0.26), []);
  const steel = useMemo(() => toon("#5b6678"), []);
  const steelLight = useMemo(() => toon("#8a95a8"), []);
  const timberMat = useMemo(() => toon(a.wood), [a]);
  const beamMat = useMemo(() => toon(a.woodDark), [a]);

  const layerH = 0.22;
  const topOfCrib = beamBottom - 0.42; // beam bottom
  const layers = Math.max(0, Math.floor((topOfCrib - 0.02) / layerH));

  return (
    <group>
      {(xs ?? JACK_X).map((x, i) => {
        const rodBottom = 0.86;
        const rodTop = beamBottom - 0.42 + 0.03;
        const rodLen = Math.max(0.05, rodTop - rodBottom);
        const crank = Math.sin(t * 2.2 + PHASE[i % 4]) * 0.5;
        return (
          <group key={i} position={[x, 0, JACK_Z]}>
            <Ink geometry={baseGeo} material={steel} position={[0, 0.06, 0]} px={2} />
            <Ink geometry={housing} material={steel} position={[0, 0.52, 0]} px={2.2} />
            <Ink geometry={collar} material={steelLight} position={[0, 0.7, 0]} px={2} />
            {/* ratchet lever through the collar */}
            <group position={[0, 0.7, 0]} rotation={[0, crank, 0]}>
              <Ink geometry={leverGeo} material={timberMat} position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]} px={1.8} />
            </group>
            {/* the screw */}
            <Ink geometry={rod} material={steelLight} position={[0, rodBottom + rodLen / 2, 0]} scale={[1, rodLen, 1]} px={2} />
            {Array.from({ length: Math.min(34, Math.floor(rodLen / 0.1)) }, (_, k) => (
              <mesh key={k} geometry={thread} material={steel} position={[0, rodBottom + 0.05 + k * 0.1, 0]} rotation={[Math.PI / 2, 0, 0.3 * k]} />
            ))}
            {/* timber beam carried by the screw, running under the building */}
            <Ink geometry={beamGeo} material={beamMat} position={[0, beamBottom - 0.21, -DEPTH / 2 + 0.2]} px={2.2} />
          </group>
        );
      })}

      {/* timber cribbing stacks, built up layer by layer as the hotel rises */}
      {(xs ?? JACK_X).map((x, i) => (
        <group key={i} position={[x, 0, JACK_Z]}>
          {[-0.95, 0.95].map((dx, j) => (
            <group key={j} position={[dx, 0, 0]}>
              {Array.from({ length: layers }, (_, L) => {
                const born = L * layerH + 0.46;
                const pop = clamp((beamBottom - born) / 0.18);
                const s = easeOutBack(clamp(pop));
                return (
                  <Ink key={L} geometry={timber} material={timberMat} position={[0, 0.12 + L * layerH, 0]} rotation={[0, (L % 2) * Math.PI / 2, 0]} scale={[1, Math.max(0.01, s), 1]} px={1.8} />
                );
              })}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* the world around it                                                */
/* ------------------------------------------------------------------ */
export const Barrel: React.FC<{ p: [number, number, number]; s?: number; color?: string }> = ({ p, s = 1, color = "#a8693b" }) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(0.46, 0.46, 1.0, 20), []);
  const ring = useMemo(() => new THREE.TorusGeometry(0.47, 0.035, 6, 24), []);
  const m = useMemo(() => toon(color), [color]);
  const rm = useMemo(() => toon("#4a3b46"), []);
  return (
    <group position={p} scale={s}>
      <Ink geometry={geo} material={m} position={[0, 0.5, 0]} px={3.4} />
      {[0.18, 0.5, 0.82].map((y, i) => (
        <mesh key={i} geometry={ring} material={rm} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      <ContactShadow position={[0, 0.02, 0]} r={0.62} />
    </group>
  );
};

export const Crate: React.FC<{ p: [number, number, number]; s?: [number, number, number]; rot?: number; a: ReturnType<typeof useAssets>; label?: THREE.Texture }> = ({ p, s = [1, 1, 1], rot = 0, a, label }) => {
  const geo = useMemo(() => box(1, 1, 1), []);
  const wood = useMemo(() => toon(a.wood), [a]);
  const plaque = useMemo(() => (label ? new THREE.MeshBasicMaterial({ map: label }) : null), [label]);
  return (
    <group position={[p[0], p[1] + s[1] / 2, p[2]]} rotation={[0, rot, 0]}>
      <group scale={s}><Ink geometry={geo} material={wood} px={3} /></group>
      {plaque ? <mesh material={plaque} position={[0, 0, s[2] / 2 + 0.01]}><planeGeometry args={[s[0] * 0.86, (s[0] * 0.86) / 4]} /></mesh> : null}
    </group>
  );
};

export const Lamp: React.FC<{ p: [number, number, number]; a: ReturnType<typeof useAssets> }> = ({ p, a }) => {
  const pole = useMemo(() => new THREE.CylinderGeometry(0.07, 0.11, 4.4, 10), []);
  const head = useMemo(() => box(0.5, 0.62, 0.5), []);
  const cap = useMemo(() => new THREE.ConeGeometry(0.42, 0.34, 4), []);
  const dark = useMemo(() => toon("#2f3a46"), []);
  const lit = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffe39a" }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ map: a.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [a]);
  return (
    <group position={p}>
      <Ink geometry={pole} material={dark} position={[0, 2.2, 0]} px={2.4} />
      <Ink geometry={head} material={lit} position={[0, 4.6, 0]} px={2.4} cast={false} />
      <Ink geometry={cap} material={dark} position={[0, 5.08, 0]} rotation={[0, Math.PI / 4, 0]} px={2.2} />
      <mesh material={glowMat} position={[0, 4.6, 0.35]}>
        <planeGeometry args={[3.2, 3.2]} />
      </mesh>
    </group>
  );
};

export const MeasurePole: React.FC<{ t: number; a: ReturnType<typeof useAssets> }> = ({ t, a }) => {
  const poleGeo = useMemo(() => box(0.5, 4.0, 0.14), []);
  const pm = useMemo(() => [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(a.marks), toon("#2b1a1d")], [a]);
  const boardGeo = useMemo(() => box(1.7, 0.85, 0.12), []);
  const bm = useMemo(() => [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(a.sign6), toon("#2b1a1d")], [a]);
  const pop = easeOutBack(clamp((t - 1.72) / 0.35));
  const y6 = BASE_Y + LIFT; // the six-foot mark on the pole
  return (
    <group position={[-5.9, 0, 1.0]}>
      {/* pole: marks span y = BASE_Y .. BASE_Y+LIFT mapped across the texture height */}
      <Ink geometry={poleGeo} material={pm} position={[0, 2.0, 0]} px={2.6} />
      <group position={[1.2, y6, 0.06]} scale={Math.max(0.001, pop)}>
        <Ink geometry={boardGeo} material={bm} px={2.6} />
      </group>
      <ContactShadow position={[0, 0.02, 0]} r={0.6} />
    </group>
  );
};

export const Neighbor: React.FC<{ x: number; w: number; floors: number; map: THREE.Texture; trim: string; a: ReturnType<typeof useAssets>; cols: number[]; sign?: THREE.Texture; arch?: boolean }> = ({
  x, w, floors, map, trim, a, cols, sign, arch,
}) => {
  const signGeo = useMemo(() => box(3.2, 0.8, 0.14), []);
  const sm = useMemo(() => (sign ? [toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon("#2b1a1d"), toon(sign), toon("#2b1a1d")] : []), [sign]);
  const wallL = useMemo(() => box(0.3, 14 + floors * 2, DEPTH + 2), [floors]);
  return (
    <group position={[x, 0, 0]}>
      <Facade w={w} floors={floors} floor0={3.0} floorH={2.5} cols={cols} map={map} trim={trim} glass={a.room2} arch={arch} depth={1.2} />
      {sign ? <Ink geometry={signGeo} material={sm} position={[0, 2.75, 0.3]} px={2.4} /> : null}
    </group>
  );
};

/* distant skyline */
export const Skyline: React.FC<{ a: ReturnType<typeof useAssets> }> = ({ a }) => {
  const items = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: 16 }, (_, i) => ({
      x: -42 + i * 5.6 + r() * 1.8,
      w: 3.4 + r() * 3,
      h: 6 + r() * 12,
      z: -28 - r() * 14,
      c: ["#b9a0c4", "#c9a6b8", "#a99bc2", "#d0b0b6"][i % 4],
    }));
  }, []);
  return (
    <group>
      {items.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]} material={new THREE.MeshBasicMaterial({ color: b.c, fog: true })}>
            <boxGeometry args={[b.w, b.h, 4]} />
          </mesh>
          {Array.from({ length: Math.floor(b.h / 2.2) }, (_, k) => (
            <mesh key={k} position={[0, 1.4 + k * 2.2, 2.02]} material={new THREE.MeshBasicMaterial({ color: "#f3d9a6", fog: true })}>
              <planeGeometry args={[b.w * 0.6, 0.7]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

/* floating dust in the light */
export const Dust: React.FC<{ t: number }> = ({ t }) => {
  const pts = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 34 }, () => [r() * 20 - 10, r() * 14 + 0.5, r() * 12 - 2, r() * 6] as [number, number, number, number]);
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff1cf", transparent: true, opacity: 0.8, depthWrite: false }), []);
  const geo = useMemo(() => new THREE.CircleGeometry(0.035, 8), []);
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} geometry={geo} material={mat} position={[p[0] + Math.sin(t * 0.5 + p[3]) * 0.4, p[1] + Math.sin(t * 0.7 + p[3] * 2) * 0.25, p[2]]} />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* the whole set                                                      */
/* ------------------------------------------------------------------ */
export type HotelSceneProps = {
  t: number; cam: [number, number, number]; liftTime?: number; crewPose?: any; crewExpr?: any; boardT?: number;
  rooms?: THREE.Texture[]; guests?: React.ReactNode; defaultGuests?: boolean; crew?: boolean; showProps?: boolean;
};
export const HotelScene: React.FC<HotelSceneProps> = ({ t, cam, liftTime, crewPose = "crank", crewExpr = "strain", boardT, rooms, guests, defaultGuests = true, crew = true, showProps = true }) => {
  const a = useAssets();
  const lift = liftAt(liftTime ?? t);
  const mudMat = useMemo(() => toon(a.mud), [a]);
  const stoneMat = useMemo(() => toon(a.stone), [a]);
  const groundGeo = useMemo(() => new THREE.PlaneGeometry(120, 80), []);
  const basement = useMemo(() => box(HOTEL_W, BASE_Y, 1.2), []);
  const foundationBack = useMemo(() => box(HOTEL_W + 2, 3.2, 0.5), []);
  const rampGeo = useMemo(() => box(1.1, 0.1, 1), []);
  const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#9bd1f2", fog: false }), []);
  const sidewalk = useMemo(() => box(34, 0.1, 1.5), []);

  const worker = (p: [number, number, number], look: any, sc: number, pose: any, seed: number, _c = 2.2, phase?: number, expr: any = "strain") => !crew ? null : (
    <>
      <Person2 look={look} expr={pose === "crank" ? crewExpr : expr} t={t + (phase ?? 0) * 0.1} position={p} yaw={yawToward(p, cam)} scale={sc} seed={seed} pose={pose === "crank" ? crewPose : pose} />
      <ContactShadow position={[p[0], 0.02, p[2]]} r={0.45 * sc} />
    </>
  );

  // ramp from the sidewalk up to the (rising) door sill
  const rampLen = Math.hypot(2.8, BASE_Y + lift - 0.16);
  const rampAng = Math.atan2(BASE_Y + lift - 0.16, 2.8);

  return (
    <group>
      <SceneEnv bg="#f4e6cf" fog={["#f1e3cc", 38, 130]} />

      {/* lights: warm key from upper-left, cool fill */}
      <hemisphereLight args={["#bfe3ff", "#c89a78", 1.15]} />
      <directionalLight
        position={[-9, 16, 11]}
        intensity={2.6}
        color="#ffdca8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={22}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
      />
      <pointLight position={[0, 1.4, -2]} intensity={6} color="#ffb870" distance={9} />

      <SkyDome t={t} />
      <Horizon t={t} />

      {/* ground */}
      <Terrain kind="mud" />
      <Tree p={[-13, 0, -16]} s={1.5} seed={2} /><Tree p={[15, 0, -15]} s={1.7} seed={5} /><Tree p={[-24, 0, -6]} s={1.4} seed={7} />
      <Fence p={[-18, 0, 4.5]} n={9} />
      <Ink geometry={sidewalk} material={toon(a.planks)} position={[-4, 0.05, 5.4]} px={2.4} />

      {/* neighbours (they do NOT move) */}
      <Neighbor x={-10.2} w={9.4} floors={2} map={a.plasterTeal} trim="#fff3dd" a={a} cols={[-2.8, 0, 2.8]} sign={a.signStore} />
      <Neighbor x={10.4} w={9.8} floors={3} map={a.brickBlue} trim="#fff3dd" a={a} cols={[-3.2, -1.05, 1.05, 3.2]} sign={a.signSaloon} arch />
      <Neighbor x={-19.2} w={8.6} floors={3} map={a.brickWarm} trim="#fff3dd" a={a} cols={[-2.6, 0, 2.6]} />

      {/* stone basement the hotel started on (it stays on the ground) */}
      <Ink geometry={basement} material={stoneMat} position={[0, BASE_Y / 2, -0.55]} px={2.8} />
      <Ink geometry={foundationBack} material={stoneMat} position={[0, 1.6, -DEPTH - 0.2]} px={2.8} />

      {/* rising hotel + rig */}
      <Hotel t={t} a={a} lift={lift} rooms={rooms} guests={guests} defaultGuests={defaultGuests} />
      <Rig t={t} a={a} lift={lift} />

      {/* ramp to the door */}
      <group position={[0, 0.16, 2.9]} rotation={[rampAng, 0, 0]}>
        <Ink geometry={rampGeo} material={toon(a.planks)} scale={[1, 1, rampLen]} position={[0, 0, -rampLen / 2 + 0.2]} px={2.2} />
      </group>

      {/* measuring pole with the six-foot board */}
      <MeasurePole t={boardT ?? t} a={a} />

      {/* props */}
      <Lamp p={[6.2, 0, 3.6]} a={a} />
      <Barrel p={[-4.2, 0, 7.4]} s={1.1} />
      <Barrel p={[-5.2, 0, 7.0]} s={0.92} color="#8e5530" />
      <Crate p={[-3.0, 0, 8.4]} s={[1.3, 1.0, 1.1]} rot={0.3} a={a} />
      <Barrel p={[5.2, 0, 2.6]} s={1} />
      <Crate p={[-6.9, 0, 2.5]} s={[1.4, 1.1, 1.2]} rot={0.2} a={a} label={a.signLift} />
      <Crate p={[3.4, 0, 3.1]} s={[1.1, 0.9, 1.0]} rot={-0.3} a={a} />
      <Crate p={[3.5, 0.9, 3.1]} s={[0.8, 0.7, 0.8]} rot={0.2} a={a} />

      {/* the crew */}
      {worker([-3.6, 0, 1.75], "cap", 1.0, "crank", 3, 2.2, PHASE[0])}
      {worker([-1.4, 0, 1.8], "bowler", 1.05, "crank", 8, 2.2, PHASE[1])}
      {worker([3.0, 0, 1.75], "glasses", 0.98, "crank", 15, 2.2, PHASE[2])}
      {worker([5.2, 0, 1.8], "cap", 0.95, "crank", 31, 2.2, PHASE[3])}
      {worker([-4.5, 0, 3.6], "boss", 1.1, "point", 21, 2.2, 0, "smug")}

      <Dust t={t} />
    </group>
  );
};

export { toon };
