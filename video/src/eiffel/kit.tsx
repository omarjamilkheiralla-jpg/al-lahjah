import * as THREE from "three";
import React from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Person2, type Pose } from "../full/person";
import type { Expr } from "../full/paint";
import { memo, tx, rnd } from "./tex";

export type V3 = [number, number, number];

export const M = (c: string, map?: THREE.Texture | null, rough = 0.8, em?: string, ei = 1, extra?: Partial<THREE.MeshStandardMaterialParameters>) =>
  memo(`m${c}${map?.uuid}${rough}${em}${ei}${extra ? JSON.stringify(extra) : ""}`, () => new THREE.MeshStandardMaterial({ color: c, map: map ?? null, roughness: rough, emissive: em ?? "#000", emissiveIntensity: ei, ...extra }));
export const BM = (c: string, map?: THREE.Texture | null, opacity = 1, blend: THREE.Blending = THREE.NormalBlending, side: THREE.Side = THREE.FrontSide) =>
  memo(`bm${c}${map?.uuid}${opacity}${blend}${side}`, () => new THREE.MeshBasicMaterial({ color: c, map: map ?? null, transparent: opacity < 1 || blend !== THREE.NormalBlending || !!map, opacity, blending: blend, depthWrite: blend === THREE.NormalBlending, side, fog: false }));
export const BG = (w: number, h: number, d: number) => memo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const CG = (rt: number, rb: number, h: number, s = 20) => memo(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const SG = (r: number, ws = 20, hs = 14) => memo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export const PG = (w: number, h: number) => memo(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));

export const Bx: React.FC<{ g: V3; p: V3; m: THREE.Material; r?: V3; cast?: boolean; recv?: boolean }> = ({ g, p, m, r, cast = true, recv = true }) =>
  <mesh geometry={BG(...g)} material={m} position={p} rotation={r} castShadow={cast} receiveShadow={recv} />;
export const Cy: React.FC<{ r: number; rb?: number; h: number; p: V3; m: THREE.Material; rot?: V3; s?: number; cast?: boolean }> = ({ r, rb, h, p, m, rot, s = 20, cast = true }) =>
  <mesh geometry={CG(r, rb ?? r, h, s)} material={m} position={p} rotation={rot} castShadow={cast} receiveShadow />;
export const Sp: React.FC<{ r: number; p: V3; m: THREE.Material; sc?: V3 }> = ({ r, p, m, sc }) => <mesh geometry={SG(r)} material={m} position={p} scale={sc} castShadow receiveShadow />;
export const Pl: React.FC<{ w: number; h: number; p: V3; m: THREE.Material; r?: V3 }> = ({ w, h, p, m, r }) => <mesh geometry={PG(w, h)} material={m} position={p} rotation={r} />;
/** additive glow sprite (always faces the camera) */
export const Glow: React.FC<{ p: V3; s: number; c?: string; o?: number }> = ({ p, s, c = "#ffd9a0", o = 0.6 }) =>
  <sprite position={p} scale={[s, s, 1]}><spriteMaterial map={tx("glow")} color={c} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></sprite>;
export const Blob: React.FC<{ p: V3; s?: number; o?: number }> = ({ p, s = 1.6, o = 0.8 }) =>
  <mesh position={[p[0], p[1] + 0.012, p[2]]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[s, s * 0.7]} /><meshBasicMaterial map={tx("blob")} transparent opacity={o} depthWrite={false} /></mesh>;

/** Sky dome centred on a world */
export const Sky: React.FC<{ night?: boolean; p?: V3; r?: number }> = ({ night, p = [0, 0, 0], r = 300 }) =>
  <mesh position={p} scale={[1, 1, 1]}><sphereGeometry args={[r, 32, 24]} /><meshBasicMaterial map={tx(night ? "skyNight" : "skyDusk")} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;

/** Billboard character: Y-axis billboard toward the camera, soft foot shadow, optional extras. Our painted look, lit by tint. */
export const Char: React.FC<{
  look: string; expr?: Expr; t: number; p: V3; cam: V3; scale?: number; pose?: Pose; tint?: string; seed?: number; flip?: boolean; yawK?: number;
  handR?: React.ReactNode; handL?: React.ReactNode; emph?: number; power?: number; sit?: number; lean?: number; shadow?: boolean; gait?: number; amp?: number; children?: React.ReactNode; yawOverride?: number;
}> = ({ look, expr = "deadpan", t, p, cam, scale = 1, pose = "idle", tint = "#ffeedd", seed = 3, flip, yawK = 0.9, handR, handL, emph = 0, power = 1, sit = 0, lean = 0, shadow = true, gait = 1, amp = 1, children, yawOverride }) => {
  const a = yawOverride ?? Math.atan2(cam[0] - p[0], cam[2] - p[2]) * yawK;
  return (
    <group>
      {shadow ? <Blob p={[p[0], p[1] + sit, p[2]]} s={1.7 * scale} /> : null}
      <group position={[p[0], p[1] - sit, p[2]]} rotation={[0, a, 0]}>
        <Person2 look={look as any} expr={expr} t={t} position={[0, 0, 0]} scale={scale} seed={seed} tint={tint} pose={pose} handR={handR} handL={handL} emph={emph} power={power} lean={lean} yaw={flip ? -1 : 0} gait={gait} amp={amp} />
        {children}
      </group>
    </group>
  );
};

// ------------------------------------------------------------------ the tower
const TH = 70; // tower height in world units
const wAt = (y: number) => 0.7 + 12.9 * Math.pow(1 - y / TH, 3.1);
const sAt = (y: number) => Math.max(0.55, 4.0 * Math.pow(1 - y / TH, 1.25));
const beam = (a: THREE.Vector3, b: THREE.Vector3, th: number) => {
  const len = a.distanceTo(b); const g = new THREE.BoxGeometry(th, len, th);
  const dir = b.clone().sub(a).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1))); return g;
};
export const TOWER_H = TH;
export const towerGeo = () => memo("towerGeo", () => {
  const parts: THREE.BufferGeometry[] = []; const N = 30; const ys: number[] = []; for (let j = 0; j <= N; j++) ys.push(TH * 0.96 * (1 - Math.pow(1 - j / N, 1.45)));
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let j = 0; j < N; j++) {
      const y0 = ys[j], y1 = ys[j + 1]; const s0 = sAt(y0), s1 = sAt(y1); const c0 = wAt(y0) - s0 / 2, c1 = wAt(y1) - s1 / 2;
      const P = (y: number, c: number, s: number, a: number, b: number) => V(sx * (c + a * s / 2), y, sz * (c + b * s / 2));
      for (const a of [-1, 1]) for (const b of [-1, 1]) parts.push(beam(P(y0, c0, s0, a, b), P(y1, c1, s1, a, b), 0.12 + 0.34 * (1 - y0 / TH)));
      const ring = [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]];
      for (const [a, b, a2, b2] of ring) parts.push(beam(P(y1, c1, s1, a, b), P(y1, c1, s1, a2, b2), 0.08 + 0.1 * (1 - y0 / TH)));
      for (const [a, b, a2, b2] of ring) { parts.push(beam(P(y0, c0, s0, a, b), P(y1, c1, s1, a2, b2), 0.07)); parts.push(beam(P(y0, c0, s0, a2, b2), P(y1, c1, s1, a, b), 0.07)); }
    }
  }
  // first / second / third platforms and the big girders joining the legs
  const plats = [0.176, 0.35, 0.85];
  plats.forEach((f, i) => { const y = f * TH; const w = wAt(y) + 0.8; const g = new THREE.BoxGeometry(w * 2, 0.55, w * 2); g.translate(0, y, 0); parts.push(g); const g2 = new THREE.BoxGeometry(w * 2 + 0.6, 0.22, w * 2 + 0.6); g2.translate(0, y + 0.85, 0); parts.push(g2); for (let k = -1; k <= 1; k += 2) { parts.push(beam(V(-w, y + 0.9, k * w), V(w, y + 0.9, k * w), 0.1)); parts.push(beam(V(k * w, y + 0.9, -w), V(k * w, y + 0.9, w), 0.1)); } void i; });
  for (const f of [0.176, 0.19, 0.23, 0.29]) { const y = f * TH; const w = wAt(y); for (const k of [-1, 1]) { parts.push(beam(V(-w, y, k * w), V(w, y, k * w), 0.2)); parts.push(beam(V(k * w, y, -w), V(k * w, y, w), 0.2)); } }
  for (const [f0, f1] of [[0.176, 0.23], [0.23, 0.29], [0.29, 0.35]]) { const y0 = f0 * TH, y1 = f1 * TH; const w0 = wAt(y0), w1 = wAt(y1); for (const k of [-1, 1]) { parts.push(beam(V(-w0, y0, k * w0), V(w1, y1, k * w1), 0.12)); parts.push(beam(V(w0, y0, k * w0), V(-w1, y1, k * w1), 0.12)); parts.push(beam(V(k * w0, y0, -w0), V(k * w1, y1, w1), 0.12)); parts.push(beam(V(k * w0, y0, w0), V(k * w1, y1, -w1), 0.12)); } }
  // arches between the legs
  const ya = 0.0, yb = 0.115 * TH; const wi = (y: number) => wAt(y) - sAt(y);
  for (const k of [-1, 1]) {
    for (const axis of [0, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 18; i++) { const u = i / 18; const along = -wi(0) + 2 * wi(0) * u; const hgt = yb * Math.sin(u * Math.PI) ** 0.7; pts.push(axis === 0 ? V(along, hgt + ya, k * (wAt(0) - sAt(0) / 2)) : V(k * (wAt(0) - sAt(0) / 2), hgt + ya, along)); }
      for (let i = 0; i < pts.length - 1; i++) { parts.push(beam(pts[i], pts[i + 1], 0.45)); if (i % 2 === 0) { const top = pts[i].clone(); top.y = yb * 1.25 + 0.2; parts.push(beam(pts[i], top, 0.07)); } }
      parts.push(beam(V(axis === 0 ? -wi(0) : k * (wAt(0) - sAt(0) / 2), yb * 1.25, axis === 0 ? k * (wAt(0) - sAt(0) / 2) : -wi(0)), V(axis === 0 ? wi(0) : k * (wAt(0) - sAt(0) / 2), yb * 1.25, axis === 0 ? k * (wAt(0) - sAt(0) / 2) : wi(0)), 0.3));
    }
  }
  // spire
  const sp = new THREE.CylinderGeometry(0.03, 0.34, TH * 0.1, 8); sp.translate(0, TH * 0.96 + TH * 0.05, 0); parts.push(sp);
  const dome = new THREE.CylinderGeometry(0.5, 0.9, 1.2, 10); dome.translate(0, TH * 0.86 + 1.2, 0); parts.push(dome);
  const merged = mergeGeometries(parts, false)!; merged.computeBoundingSphere(); return merged;
});
export const towerLights = () => memo("towerLights", () => {
  const r = rnd(5); const ms: THREE.Matrix4[] = []; const N = 30;
  for (let j = 1; j < N; j += 1) { const y = TH * 0.96 * (1 - Math.pow(1 - j / N, 1.45)); const s = sAt(y); const c = wAt(y) - s / 2; for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const [a, b] of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) { if (r() < 0.55) continue; ms.push(new THREE.Matrix4().makeTranslation(sx * (c + a * s / 2), y, sz * (c + b * s / 2))); } }
  return ms;
});
export const Tower: React.FC<{ p: V3; night?: boolean; t?: number }> = ({ p, night, t = 0 }) => {
  const ms = towerLights();
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => { const m = ref.current; if (!m) return; ms.forEach((mat, i) => m.setMatrixAt(i, mat)); m.instanceMatrix.needsUpdate = true; }, [ms]);
  const tw = 0.85 + 0.15 * Math.sin(t * 7);
  return (
    <group position={p}>
      <mesh geometry={towerGeo()} material={M("#8a6e52", null, 0.55, night ? "#2a1a0c" : "#1a0e06", 0.5, { metalness: 0.25 })} castShadow />
      {night ? <instancedMesh ref={ref} args={[SG(0.09, 8, 6), BM("#ffd46a"), ms.length]} frustumCulled={false} /> : null}
      {night ? <Glow p={[0, TH * 0.25, 0]} s={70} c="#ffb860" o={0.22 * tw} /> : null}
      {night ? <Glow p={[0, TH * 0.9, 0]} s={30} c="#ffd890" o={0.35} /> : null}
      {/* rotating beacon */}
      {night ? <Glow p={[0, TH + 2.2, 0]} s={10 + 3 * Math.sin(t * 2)} c="#fff2c0" o={0.9} /> : null}
    </group>
  );
};

export { memo, tx, rnd };
