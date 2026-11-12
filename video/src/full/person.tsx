import * as THREE from "three";
import React, { useMemo } from "react";
import { INKD, LOOKS, headTexture, torsoTexture, type Expr } from "./paint";
import { rng } from "../hotel/kit";

export type Pose = "idle" | "crank" | "cross" | "cheer" | "hold" | "point" | "shake" | "walk" | "sleep" | "salute";

const ribbon = (len: number, w0: number, w1: number) => {
  const s = new THREE.Shape();
  const n = 8;
  s.moveTo(-w0, 0);
  s.lineTo(-w1, -len);
  for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; s.lineTo(Math.cos(a) * w1 * -1 * -1, -len + Math.sin(a) * w1 * 0.9); }
  s.lineTo(w0, 0);
  s.closePath();
  return new THREE.ShapeGeometry(s);
};
const disc = (r: number) => new THREE.CircleGeometry(r, 20);

const ink = new THREE.MeshBasicMaterial({ color: INKD, side: THREE.DoubleSide });
const rim = new THREE.MeshBasicMaterial({ color: "#5d4852", side: THREE.DoubleSide });

const armGeo = ribbon(0.31, 0.05, 0.04);
const armRim = ribbon(0.3, 0.014, 0.011);
const legGeo = ribbon(0.68, 0.052, 0.04);
const handGeo = disc(0.075);
const shoeGeo = (() => { const g = new THREE.CircleGeometry(0.1, 20); g.scale(1.25, 0.62, 1); return g; })();

type Angles = { as: number; ae: number; bs: number; be: number };

const angles = (pose: Pose, t: number, ph: number, power = 1): Angles => {
  const sw = Math.sin(t * 2.2 + ph);
  switch (pose) {
    case "crank": return { as: -0.3 + sw * 0.28 * power, ae: 0.95 - sw * 0.2, bs: 0.3 + sw * 0.28 * power, be: -0.95 - sw * 0.2 };
    case "hold": return { as: -0.45, ae: 1.25, bs: 0.45, be: -1.25 };
    case "cross": return { as: 0.4, ae: 1.9, bs: -0.4, be: -1.9 };
    case "cheer": { const w = Math.sin(t * 9 + ph) * 0.18; return { as: -2.65 + w, ae: -0.25, bs: 2.65 - w, be: 0.25 }; }
    case "point": return { as: -0.14, ae: 0.12, bs: 1.55, be: 0.05 };
    case "shake": return { as: -0.14, ae: 0.12, bs: 0.95 + Math.sin(t * 8) * 0.08, be: -0.55 };
    case "salute": return { as: -0.14, ae: 0.12, bs: 0.6, be: -2.35 };
    case "sleep": return { as: -0.12, ae: 0.2, bs: 0.12, be: -0.2 };
    case "walk": return { as: -0.15 + Math.sin(t * 7 + ph) * 0.35, ae: 0.1, bs: 0.15 - Math.sin(t * 7 + ph) * 0.35, be: -0.1 };
    default: return { as: -0.13 + sw * 0.03, ae: 0.16, bs: 0.13 - sw * 0.03, be: -0.16 };
  }
};

export type PersonProps = {
  look: keyof typeof LOOKS;
  expr?: Expr;
  t: number;
  position?: [number, number, number];
  yaw?: number;
  scale?: number;
  seed?: number;
  pose?: Pose;
  power?: number;
  lean?: number;
  tint?: string;
  /** object held in the right hand (screen right) */
  handR?: React.ReactNode;
  handL?: React.ReactNode;
  /** disables blinking / idle bob (for frozen frames) */
  still?: boolean;
  stripes?: boolean;
  /** head wiggle (shaking head when angry, nodding when pleased) */
  emph?: number;
  gait?: number;
  amp?: number;
};

export const Person2: React.FC<PersonProps> = ({
  look, expr = "deadpan", t, position = [0, 0, 0], yaw = 0, scale = 1, seed = 1, pose = "idle", power = 1, lean = 0, tint = "#ffffff", handR, handL, still, stripes, emph = 0, gait = 1, amp = 1,
}) => {
  const r = useMemo(() => rng(seed), [seed]);
  const ph = useMemo(() => r() * 6, [r]);
  const L = useMemo(() => ({ ...LOOKS[look], ...(stripes !== undefined ? { stripes } : {}) }), [look, stripes]);
  const lk = look + (stripes ? "S" : "");
  const per = 3.2 + (seed % 4) * 0.5;
  const bx = ((t + ph) % per) / per;
  const blinking = !still && bx > 0.955 && ["deadpan", "smug", "think", "proud", "grin"].includes(expr);
  const showExpr: Expr = blinking ? "blink" : expr;

  const headMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const torsoMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const boil = still ? 0 : Math.floor(t * 5 + seed) % 2;
  headMat.map = headTexture(L, showExpr, lk, boil);
  headMat.color.set(tint);
  torsoMat.map = torsoTexture(L, lk, boil);
  torsoMat.color.set(tint);
  const pantsMat = useMemo(() => new THREE.MeshBasicMaterial({ color: L.pants, side: THREE.DoubleSide }), [L.pants]);

  const bob = still ? 0 : Math.sin(t * 2.4 + ph) * 0.012;
  const breathe = 1 + (still ? 0 : Math.sin(t * 2.4 + ph) * 0.012);
  const nod = still ? 0 : Math.sin(t * 1.3 + ph) * 0.03 + (pose === "sleep" ? 0.12 : 0) + Math.sin(t * 6 + ph) * 0.05 * emph;
  const ang = angles(pose, t, ph, power);
  const walking = pose === "walk";
  const step = Math.sin(t * 7 * gait + ph);

  const Arm: React.FC<{ s: number; e: number; x: number; prop?: React.ReactNode; z: number }> = ({ s, e, x, prop, z }) => (
    <group position={[x, 1.2, z]} rotation={[0, 0, s]}>
      <mesh geometry={armGeo} material={ink} />
      <mesh geometry={armRim} material={rim} position={[0.012, 0, 0.001]} />
      <group position={[0, -0.31, 0.002]} rotation={[0, 0, e]}>
        <mesh geometry={armGeo} material={ink} />
        <mesh geometry={armRim} material={rim} position={[0.012, 0, 0.001]} />
        <mesh geometry={handGeo} material={ink} position={[0, -0.33, 0.002]} />
        <mesh geometry={new THREE.CircleGeometry(0.02, 8)} material={rim} position={[-0.018, -0.318, 0.004]} />
        {prop ? <group position={[0, -0.34, 0.02]}>{prop}</group> : null}
      </group>
    </group>
  );

  return (
    <group position={position} rotation={[0, Math.sign(yaw) * Math.min(Math.abs(yaw) > 0.3 ? 0.18 : Math.abs(yaw), 0.3), 0]} scale={[scale * (Math.abs(yaw) > 0.3 ? Math.sign(yaw) : 1), scale, scale]}>
      {/* legs */}
      <group position={[0, bob * 0.3, 0]}>
        {[-1, 1].map((side) => {
          const sw = walking ? side * step * 0.17 * amp : 0;
          const lift = walking ? Math.max(0, side * step) * 0.07 * Math.min(2, amp) : 0;
          return (
            <group key={side} position={[side * 0.11, 0.7 + lift, 0.001]} rotation={[0, 0, sw]}>
              <mesh geometry={legGeo} material={ink} />
              <mesh geometry={shoeGeo} material={ink} position={[side * 0.055, -0.66, 0.002]} />
              <mesh geometry={shoeGeo} material={rim} scale={[0.5, 0.25, 1]} position={[side * 0.06, -0.625, 0.004]} />
            </group>
          );
        })}
      </group>

      <group position={[0, bob, 0]} rotation={[0, 0, lean]}>
        {/* back arm (screen-left), drawn behind the torso */}
        <Arm s={ang.as} e={ang.ae} x={-0.27} z={-0.01} prop={handL} />
        <group scale={[1, breathe, 1]} position={[0, 0.98, 0]}>
          <mesh material={torsoMat}>
            <planeGeometry args={[0.66, 0.88]} />
          </mesh>
        </group>
        {/* head */}
        <group position={[0, 1.52, 0.03]} rotation={[0, 0, nod]} scale={[1 + (still ? 0 : Math.sin(t * 2.4 + ph) * 0.006), 1 - (still ? 0 : Math.sin(t * 2.4 + ph) * 0.006), 1]}>
          <mesh material={headMat} position={[0, 0.12, 0]}>
            <planeGeometry args={[1.43, 1.43]} />
          </mesh>
        </group>
        {/* front arm (screen-right) */}
        <Arm s={ang.bs} e={ang.be} x={0.27} z={0.05} prop={handR} />
      </group>
    </group>
  );
};
