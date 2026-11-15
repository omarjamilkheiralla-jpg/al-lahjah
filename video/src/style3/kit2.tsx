import * as THREE from "three";
import React from "react";
import { box, cyl, ico, cone, sph, M, BM, Mesh as PlainMesh, type V3, type Expr } from "./kit";

/** STYLE 3 kit v2: realistic-proportion low-poly people (sculpted faceted head, lofted torso, tapered limbs, fingers, hair wedges, rim outline). */
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
export const RimCtx = React.createContext<string | null>(null);

type MP = { g: THREE.BufferGeometry; m: THREE.Material; p?: V3; s?: V3; r?: V3; cast?: boolean; recv?: boolean; rim?: boolean };
const HullMat = (c: string) => memo("hull" + c, () => new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide }));
export const Mesh: React.FC<MP> = ({ g, m, p, s, r, cast = true, recv = true, rim = true }) => {
  const rc = React.useContext(RimCtx);
  return (
    <>
      <mesh geometry={g} material={m} position={p} scale={s} rotation={r} castShadow={cast} receiveShadow={recv} />
      {rc && rim ? <mesh geometry={g} material={HullMat(rc)} position={p} rotation={r} scale={s ? [s[0] * 1.07, s[1] * 1.07, s[2] * 1.07] : [1.07, 1.07, 1.07]} /> : null}
    </>
  );
};

/* ---------- cached sculpted geometry ---------- */
const flat = (g: THREE.BufferGeometry) => { const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };
const headGeo = () => memo("head", () => {
  const g = new THREE.SphereGeometry(1, 16, 12); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    x *= 0.84; z *= 0.96;
    if (y < 0) { const k = -y; x *= 1 - 0.40 * Math.pow(k, 1.25); z *= 1 - 0.22 * k; if (z > 0 && k > 0.55) z *= 0.92; }
    if (y > 0.35) { x *= 1 - 0.12 * (y - 0.35); }
    if (z > 0 && y > 0.05 && y < 0.35) z += 0.045;           // brow ridge
    if (Math.abs(x) > 0.55 && y < 0.1 && y > -0.35 && z > 0.1) z += 0.03; // cheek
    p.setXYZ(i, x, y, z);
  }
  return flat(g);
});
const torsoGeo = () => memo("torso", () => {
  const pts = [[0.165, -0.08], [0.16, 0.0], [0.15, 0.12], [0.165, 0.26], [0.2, 0.4], [0.222, 0.51], [0.15, 0.575], [0.06, 0.6]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 10); g.scale(1.34, 1, 0.76); return flat(g);
});
const taper = (rt: number, rb: number, h: number, seg = 7) => memo(`tp${rt},${rb},${h},${seg}`, () => flat(new THREE.CylinderGeometry(rt, rb, h, seg, 1)));
const shoeGeo = () => memo("shoe", () => { const g = new THREE.BoxGeometry(0.115, 0.085, 0.3, 2, 1, 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), y = p.getY(i); if (z > 0.1 && y > 0) p.setY(i, y - 0.03); if (z > 0.1) p.setX(i, p.getX(i) * 0.82); } return flat(g); });

/* ---------- looks ---------- */
export type Look2 = { skin: string; skinShade: string; hair: string; top: string; topDark: string; pants: string; shoe: string; sole: string; kind: "ben" | "gary" | "mia" | "grey"; sleeveless?: boolean; shades?: boolean; vest?: string };
export const BEN2: Look2 = { skin: "#d49b6e", skinShade: "#a8714a", hair: "#3a2316", top: "#8c8680", topDark: "#6e6862", pants: "#2c2a30", shoe: "#d8402e", sole: "#f2eee4", kind: "ben" };
export const GARY2: Look2 = { skin: "#efc9a4", skinShade: "#c89a78", hair: "#cf3a36", top: "#eceae6", topDark: "#c4c0b8", pants: "#2c3446", shoe: "#2a2a30", sole: "#d8d4cc", kind: "gary", sleeveless: true, shades: true, vest: "#27272e" };
export const MIA2: Look2 = { skin: "#f0cba8", skinShade: "#c9987a", hair: "#c8a068", top: "#b8bcc6", topDark: "#9298a4", pants: "#b4562c", shoe: "#8a4a2a", sole: "#e8e0d0", kind: "mia" };
export const GREY2 = (i: number): Look2 => ({ skin: ["#e0b088", "#b87c50", "#f0cfae", "#8a5a3a", "#d8a074"][i % 5], skinShade: "#a07050", hair: ["#2a1a12", "#6a4020", "#bfa25a", "#161616", "#8a8a8a"][i % 5], top: ["#c0545a", "#4f7ac2", "#e0903a", "#8a63b8", "#4aa8a0"][i % 5], topDark: "#00000040", pants: ["#3b3f52", "#5a4a3a", "#2f4a58"][i % 3], shoe: "#2c2c32", sole: "#ddd", kind: "grey" });

export type Pose2 = {
  walk?: number; amp?: number; crouch?: number; lean?: number; bob?: number; twist?: number; sit?: boolean;
  rArm?: [number, number]; lArm?: [number, number]; rElbow?: number; lElbow?: number; rGrip?: number; lGrip?: number;
  headX?: number; headY?: number; headZ?: number; expr?: Expr | "sleepy"; legSpread?: number; shadesOn?: boolean; blink?: number; mouthOpen?: number;
};

const Hand: React.FC<{ grip: number; skin: string; side: 1 | -1; item?: React.ReactNode }> = ({ grip, skin, side, item }) => {
  const c = 0.25 + grip * 1.1;
  return (
    <group position={[0, -0.02, 0]} scale={1.18}>
      <Mesh g={box(0.085, 0.09, 0.034)} m={M(skin)} p={[0, -0.045, 0]} />
      {[-0.03, -0.01, 0.01, 0.03].map((x, i) => <group key={i} position={[x, -0.09, 0]} rotation={[-c, 0, 0]}><Mesh g={box(0.019, 0.04 + (i === 1 || i === 2 ? 0.006 : 0), 0.02)} m={M(skin)} p={[0, -0.02, 0]} /><group position={[0, -0.04, 0]} rotation={[-c * 0.9, 0, 0]}><Mesh g={box(0.017, 0.032, 0.018)} m={M(skin)} p={[0, -0.016, 0]} /></group></group>)}
      <group position={[-side * 0.045, -0.045, 0.01]} rotation={[-0.5 - grip * 0.4, 0, -side * (0.6 - grip * 0.3)]}><Mesh g={box(0.024, 0.05, 0.024)} m={M(skin)} p={[0, -0.02, 0]} /></group>
      {item ? <group position={[0, -0.07, 0.03]}>{item}</group> : null}
    </group>
  );
};
const Arm: React.FC<{ pos: V3; rx: number; rz: number; elbow: number; side: 1 | -1; look: Look2; grip: number; item?: React.ReactNode }> = ({ pos, rx, rz, elbow, side, look, grip, item }) => {
  const sl = look.sleeveless;
  return (
    <group position={pos} rotation={[rx, 0, rz]}>
      <Mesh g={ico(0.075, 0)} m={M(sl ? look.skin : look.top, { map: "fabric" })} p={[0, 0, 0]} />
      <Mesh g={taper(0.07, 0.055, 0.3)} m={M(look.skin)} p={[0, -0.15, 0]} />
      {!sl ? <Mesh g={taper(0.08, 0.077, 0.17, 7)} m={M(look.top, { map: "fabric" })} p={[0, -0.085, 0]} /> : null}
      <group position={[0, -0.3, 0]} rotation={[-elbow, 0, 0]}>
        <Mesh g={ico(0.046, 0)} m={M(look.skin)} />
        <Mesh g={taper(0.055, 0.038, 0.27)} m={M(look.skin)} p={[0, -0.135, 0]} />
        <group position={[0, -0.27, 0]}><Hand grip={grip} skin={look.skin} side={side} item={item} /></group>
      </group>
    </group>
  );
};
const Leg: React.FC<{ pos: V3; th: number; kn: number; look: Look2 }> = ({ pos, th, kn, look }) => (
  <group position={pos} rotation={[th, 0, 0]}>
    <Mesh g={taper(0.105, 0.075, 0.44)} m={M(look.pants, { map: "fabric", rx: 1, ry: 2 })} p={[0, -0.22, 0]} />
    <group position={[0, -0.44, 0]} rotation={[kn, 0, 0]}>
      <Mesh g={ico(0.066, 0)} m={M(look.pants, { map: "fabric" })} />
      <Mesh g={taper(0.074, 0.05, 0.4)} m={M(look.pants, { map: "fabric", rx: 1, ry: 2 })} p={[0, -0.2, 0]} />
      <Mesh g={shoeGeo()} m={M(look.shoe, { rough: 0.5 })} p={[0, -0.425, 0.07]} />
      <Mesh g={box(0.125, 0.028, 0.31)} m={M(look.sole)} p={[0, -0.47, 0.075]} />
    </group>
  </group>
);

const Face: React.FC<{ look: Look2; expr: Pose2["expr"]; shadesOn: boolean; blink: number; mouthOpen: number }> = ({ look, expr = "calm", shadesOn, blink, mouthOpen }) => {
  const e = expr as string;
  const brow = ({ calm: 0.0, smile: -0.1, smug: 0.18, shock: -0.3, shout: 0.35, sad: -0.4, annoyed: 0.45, sleepy: 0.0 } as any)[e] ?? 0;
  const by = ({ shock: 0.012, sad: 0.004, annoyed: -0.006 } as any)[e] ?? 0;
  const lid = ({ sleepy: 0.55, smug: 0.4, calm: 0.22, annoyed: 0.35, smile: 0.25, sad: 0.3, shock: 0, shout: 0.05 } as any)[e] ?? 0.2;
  const eyeOpen = Math.max(0, 1 - blink);
  const open = Math.max(mouthOpen, e === "shock" ? 0.8 : e === "shout" ? 1.2 : 0);
  const smile = e === "smile" ? 1 : e === "smug" ? 0.6 : e === "sad" || e === "annoyed" ? -0.7 : 0;
  const gary = look.kind === "gary";
  return (
    <group>
      <mesh geometry={headGeo()} material={M(look.skin, { rough: 0.7 })} scale={[0.092, 0.122, 0.108]} castShadow receiveShadow />
      {[-1, 1].map((k) => (
        <group key={k}>
          <Mesh g={ico(0.03, 0)} m={M(look.skin)} p={[k * 0.09, -0.005, -0.005]} s={[0.5, 1.3, 0.8]} rim={false} />
          {!shadesOn ? (
            <group position={[k * 0.037, 0.018, 0.105]}>
              <Mesh g={sph(1, 8, 6)} m={BM("#f4f1ea")} s={[0.02, 0.0125 * eyeOpen, 0.008]} cast={false} recv={false} rim={false} />
              <Mesh g={sph(1, 8, 6)} m={BM("#1d1512")} p={[0, 0, 0.005]} s={[0.0105, 0.0105 * Math.min(1, eyeOpen + 0.1), 0.006]} cast={false} recv={false} rim={false} />
              <Mesh g={box(0.046, 0.016, 0.012)} m={M(look.skin)} p={[0, 0.006 + 0.012 * (1 - lid), 0.01]} s={[1, lid * 1.4 + (1 - eyeOpen) * 1.5 + 0.2, 1]} cast={false} rim={false} />
              <Mesh g={box(0.058, 0.0125, 0.016)} m={M(look.hair, { rough: 0.5 })} p={[k * 0.003, 0.034 + by, 0.01]} r={[0, 0, -k * brow]} cast={false} rim={false} />
            </group>
          ) : null}
        </group>
      ))}
      {shadesOn ? <group position={[0, 0.018, 0.108]}>{[-1, 1].map((k) => <Mesh key={k} g={box(0.062, 0.042, 0.016)} m={M("#14161c", { rough: 0.25, metal: 0.3 })} p={[k * 0.037, 0, 0.002]} rim={false} />)}<Mesh g={box(0.02, 0.008, 0.01)} m={M("#14161c")} p={[0, 0.008, 0.002]} rim={false} /><Mesh g={box(0.19, 0.008, 0.008)} m={M("#14161c")} p={[0, 0.01, -0.09]} r={[0, 0, 0]} rim={false} /></group> : null}
      <Mesh g={cone(0.022, 0.07, 4)} m={M(look.skin)} p={[0, -0.02, 0.113]} r={[-1.15, Math.PI / 4, 0]} s={[1, 1, 0.85]} rim={false} />
      <Mesh g={box(0.024, 0.05, 0.02)} m={M(look.skin)} p={[0, 0.01, 0.108]} rim={false} />
      <group position={[0, -0.085, 0.1]}>
        {open > 0.05 ? <Mesh g={sph(1, 10, 8)} m={BM("#33090f")} s={[0.028 + 0.004 * open, 0.008 + 0.017 * open, 0.012]} cast={false} recv={false} rim={false} /> : null}
        <Mesh g={box(0.042, 0.0075, 0.012)} m={M("#a85a58")} p={[0, 0.006 + open * 0.012, 0.004]} r={[0, 0, 0]} cast={false} rim={false} />
        <Mesh g={box(0.046, 0.0095, 0.012)} m={M("#b86a64")} p={[0, -0.006 - open * 0.015, 0.004]} cast={false} rim={false} />
        {Math.abs(smile) > 0.05 ? [-1, 1].map((k) => <Mesh key={k} g={box(0.016, 0.006, 0.01)} m={M("#a85a58")} p={[k * 0.026, 0.004 + smile * 0.007, 0.002]} r={[0, 0, k * smile * 0.7]} cast={false} rim={false} />) : null}
      </group>
      {gary ? <Mesh g={cone(0.014, 0.03, 4)} m={M("#c83a3a")} p={[0, -0.14, 0.085]} r={[Math.PI, 0, 0]} rim={false} /> : null}
    </group>
  );
};
const Hair: React.FC<{ look: Look2 }> = ({ look }) => {
  const hm = M(look.hair, { rough: 0.45 });
  if (look.kind === "gary") return <group>{Array.from({ length: 9 }, (_, i) => <Mesh key={i} g={cone(0.032, 0.17 - Math.abs(i - 4) * 0.012, 4)} m={hm} p={[0, 0.115 - Math.abs(i - 4) * 0.004, 0.09 - i * 0.022]} r={[-0.25 + i * 0.07, 0, 0]} />)}<Mesh g={ico(1, 0)} m={M("#8a2828")} p={[0, 0.07, -0.01]} s={[0.09, 0.06, 0.1]} rim={false} /></group>;
  if (look.kind === "mia") return <group><Mesh g={ico(1, 1)} m={hm} p={[0, 0.045, -0.015]} s={[0.1, 0.1, 0.115]} />{[-1, 1].map((k) => <Mesh key={k} g={box(0.04, 0.17, 0.15)} m={hm} p={[k * 0.088, -0.055, -0.01]} r={[0, 0, k * -0.12]} />)}<Mesh g={box(0.2, 0.16, 0.05)} m={hm} p={[0, -0.02, -0.095]} /><Mesh g={box(0.16, 0.05, 0.04)} m={hm} p={[-0.02, 0.085, 0.1]} r={[0.2, 0, 0.15]} /></group>;
  if (look.kind === "grey") return <Mesh g={ico(1, 1)} m={hm} p={[0, 0.045, -0.015]} s={[0.098, 0.088, 0.112]} />;
  return (
    <group>
      <Mesh g={ico(1, 1)} m={hm} p={[0, 0.035, -0.02]} s={[0.1, 0.098, 0.118]} />
      {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <Mesh key={i} g={cone(0.022, 0.085, 4)} m={hm} p={[Math.cos(a) * 0.055, 0.1, Math.sin(a) * 0.06 - 0.01]} r={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]} />; })}
      {[-0.06, -0.03, 0, 0.03, 0.06].map((x, i) => <Mesh key={i} g={cone(0.02, 0.07 + (i % 2) * 0.02, 4)} m={hm} p={[x, 0.095, 0.1]} r={[Math.PI * 0.62, 0, 0]} />)}
      {[-1, 1].map((k) => <Mesh key={k} g={box(0.03, 0.09, 0.07)} m={hm} p={[k * 0.088, 0.03, 0.0]} r={[0, 0, k * 0.1]} />)}
    </group>
  );
};

export const Person: React.FC<{ look: Look2; p: V3; yaw?: number; pose?: Pose2; s?: number; itemR?: React.ReactNode; itemL?: React.ReactNode; rim?: string; stain?: boolean }> = ({ look, p, yaw = 0, pose = {}, s = 1, itemR, itemL, rim, stain }) => {
  const { walk, amp = 0.5, crouch = 0, lean = 0, bob = 0, twist = 0, sit = false, rArm, lArm, rElbow = 0.2, lElbow = 0.2, rGrip = 0, lGrip = 0, headX = 0, headY = 0, headZ = 0, expr = "calm", legSpread = 0, shadesOn = !!look.shades, blink = 0, mouthOpen = 0 } = pose;
  const walking = walk !== undefined; const ph = walk ?? 0;
  const thR = walking ? Math.sin(ph) * amp : 0, thL = walking ? -Math.sin(ph) * amp : 0;
  const knR = walking ? Math.max(0, Math.cos(ph)) * amp * 1.4 : 0, knL = walking ? Math.max(0, -Math.cos(ph)) * amp * 1.4 : 0;
  const cT = sit ? -1.5 : -1.3 * crouch, cK = sit ? 1.5 : 2.4 * crouch;
  const hipsY = sit ? 0.47 : 0.07 + 0.44 * Math.cos(cT) + 0.4 * Math.cos(cT + cK) + (walking ? Math.abs(Math.cos(ph)) * 0.04 : 0) + bob;
  const aR: [number, number] = rArm ?? [walking ? -Math.sin(ph) * amp * 0.9 : 0.05, 0.1];
  const aL: [number, number] = lArm ?? [walking ? Math.sin(ph) * amp * 0.9 : 0.05, -0.1];
  const topM = M(look.top, { map: "fabric", rx: 2, ry: 2 });
  return (
    <RimCtx.Provider value={rim ?? null}>
      <group position={p} rotation={[0, yaw, 0]} scale={s}>
        <group position={[0, hipsY, 0]}>
          <Leg pos={[-0.115 - legSpread, 0, 0]} th={cT + thL} kn={cK + knL} look={look} />
          <Leg pos={[0.115 + legSpread, 0, 0]} th={cT + thR} kn={cK + knR} look={look} />
          <Mesh g={box(0.4, 0.17, 0.25)} m={M(look.pants, { map: "fabric" })} p={[0, 0.0, 0]} />
          <group rotation={[lean, twist, 0]}>
            <mesh geometry={torsoGeo()} material={topM} position={[0, 0.02, 0]} castShadow receiveShadow />
            {look.vest ? <><Mesh g={box(0.1, 0.5, 0.012)} m={M(look.vest, { map: "fabric" })} p={[-0.12, 0.32, 0.135]} r={[0, 0.12, 0]} /><Mesh g={box(0.1, 0.5, 0.012)} m={M(look.vest, { map: "fabric" })} p={[0.12, 0.32, 0.135]} r={[0, -0.12, 0]} /><Mesh g={box(0.16, 0.5, 0.012)} m={M(look.vest, { map: "fabric" })} p={[0, 0.32, -0.15]} /></> : null}
            {stain ? <mesh position={[0.005, 0.38, 0.152]} rotation={[-0.05, 0, 0]}><planeGeometry args={[0.24, 0.24]} /><meshBasicMaterial map={stainTex()} transparent depthWrite={false} /></mesh> : null}
            <Mesh g={cyl(0.058, 0.07, 0.1, 7)} m={M(look.skin)} p={[0, 0.63, 0]} />
            <group position={[0, 0.79, 0.012]} rotation={[headX, headY, headZ]} scale={1.16}>
              <Face look={look} expr={expr} shadesOn={shadesOn} blink={blink} mouthOpen={mouthOpen} />
              <Hair look={look} />
            </group>
            <Arm pos={[-0.29, 0.5, 0]} rx={aL[0]} rz={aL[1]} elbow={lElbow} side={-1} look={look} grip={lGrip} item={itemL} />
            <Arm pos={[0.29, 0.5, 0]} rx={aR[0]} rz={aR[1]} elbow={rElbow} side={1} look={look} grip={rGrip} item={itemR} />
          </group>
        </group>
      </group>
    </RimCtx.Provider>
  );
};
const stainTex = () => memo("stain", () => {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
  const r = (() => { let s = 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  g.fillStyle = "#5a3418"; g.beginPath(); g.arc(128, 128, 78, 0, 7); g.fill();
  for (let i = 0; i < 150; i++) { const a = r() * 7, d = 70 + r() * 50; g.beginPath(); g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 2 + r() * 10, 0, 7); g.fill(); }
  g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(110, 108, 30, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
});
export const walkP = (dist: number, amp = 0.5): Pose2 => ({ walk: (dist * Math.PI * 2) / 1.55, amp });
