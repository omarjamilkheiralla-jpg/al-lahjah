/* Props for "She Fell Two Miles Out of the Sky": seat row, airliner (outside + cabin), hut, boat, gas can, candy bag, wreckage, station. */
import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, rng, toon, toonT, basic, geo, memo, repT, cv, INKD, seatTex, plankTex, thatchTex, signTex, barkTex, type V3 } from "./world";

const metalTex = () => memo("metalpanel", () => cv(512, 512, (g, w, h) => {
  g.fillStyle = "#d8dce0"; g.fillRect(0, 0, w, h); const r = rng(3);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,.12)" : "rgba(80,90,100,.08)"; g.fillRect(r() * w, r() * h, 60 + r() * 120, 30 + r() * 60); }
  g.fillStyle = "rgba(90,100,110,.35)"; for (let y = 0; y < h; y += 128) g.fillRect(0, y, w, 3); for (let x = 0; x < w; x += 170) g.fillRect(x, 0, 3, h);
  g.fillStyle = "rgba(60,70,80,.45)"; for (let y = 6; y < h; y += 128) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
}, true));
const fabric = () => toonT("seatfab", () => repT(seatTex(), 1, 1));

/* ------------------------------------------------------------------ seat row (3 seats). Seated people: place at y = SEAT_Y - 0.6 (scale 1) */
export const SEAT_Y = 0.62;
export const SeatRow: React.FC<{ p?: V3; rot?: V3; s?: number; belts?: boolean[]; tilt?: number; dirty?: boolean; children?: React.ReactNode }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1, belts = [true, true, true], dirty = false, children }) => {
  const f = fabric(); const frame = toon("#8a9098"); const arm = toon(dirty ? "#5a5a5a" : "#3a3a44"); const head = toon(dirty ? "#c8c0a8" : "#f2f0ea"); const belt = toon("#6a6a70"); const buck = toon("#e0e4e8");
  return <group position={p} rotation={rot} scale={s}>
    {[-0.9, 0, 0.9].map((x, i) => <group key={i} position={[x, 0, 0]}>
      <Ink geometry={box(0.8, 0.2, 0.62)} material={f} position={[0, SEAT_Y - 0.1, 0.02]} px={1.6} />
      <Ink geometry={box(0.8, 1.02, 0.18)} material={f} position={[0, SEAT_Y + 0.42, -0.33]} rotation={[-0.1, 0, 0]} px={1.6} />
      <Ink geometry={box(0.62, 0.22, 0.04)} material={head} position={[0, SEAT_Y + 0.82, -0.22]} rotation={[-0.1, 0, 0]} px={1.2} />
      {belts[i] ? <><Ink geometry={box(0.6, 0.07, 0.03)} material={belt} position={[0, SEAT_Y + 0.08, 0.08]} px={1} cast={false} /><Ink geometry={box(0.14, 0.1, 0.04)} material={buck} position={[0, SEAT_Y + 0.08, 0.1]} px={1} cast={false} /></> : null}
    </group>)}
    {[-1.35, -0.45, 0.45, 1.35].map((x, i) => <Ink key={i} geometry={box(0.09, 0.12, 0.58)} material={arm} position={[x, SEAT_Y + 0.26, 0.0]} px={1.2} />)}
    {[-1.1, 1.1].map((x, i) => <group key={i}><Ink geometry={box(0.08, SEAT_Y - 0.2, 0.08)} material={frame} position={[x, (SEAT_Y - 0.2) / 2, 0.22]} px={1} /><Ink geometry={box(0.08, SEAT_Y - 0.2, 0.08)} material={frame} position={[x, (SEAT_Y - 0.2) / 2, -0.22]} px={1} /><Ink geometry={box(0.08, 0.06, 0.7)} material={frame} position={[x, 0.04, 0]} px={1} /></group>)}
    <Ink geometry={box(2.4, 0.06, 0.06)} material={frame} position={[0, SEAT_Y - 0.22, 0.2]} px={1} />
    {children}
  </group>;
};

/* ------------------------------------------------------------------ airliner (four-engine turboprop, nose toward +x). broken: 0..1 splits behind the wing */
const Prop: React.FC<{ t: number; spin?: number }> = ({ t, spin = 1 }) => {
  const m = toon("#3a3a40"); const blur = memo("propblur", () => new THREE.MeshBasicMaterial({ color: "#c8ccd4", transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
  return <group rotation={[t * 40 * spin, 0, 0]}>{[0, 1, 2, 3].map((k) => <Ink key={k} geometry={box(0.05, 1.3, 0.16)} material={m} rotation={[k * Math.PI / 2, 0, 0]} position={[0, 0, 0]} px={1} cast={false} />)}{spin > 0.3 ? <mesh material={blur} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[1.3, 24]} /></mesh> : null}</group>;
};
export const Airliner: React.FC<{ p?: V3; rot?: V3; s?: number; t: number; broken?: number; fire?: number; spin?: number; gear?: boolean }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1, t, broken = 0, fire = 0, spin = 1, gear = false }) => {
  const white = toon("#f4f4f0"); const blue = toon("#2f5aa8"); const metal = toonT("metal", () => repT(metalTex(), 2, 1)); const dark = toon("#2a3440"); const win = basic("#1a2a3a"); const red = toon("#c8303a");
  const R = 1.1; const fuseF = memo("fuseF", () => new THREE.CylinderGeometry(R, R, 6.2, 24, 1, true)); const fuseB = memo("fuseB", () => new THREE.CylinderGeometry(R, R, 4.6, 24, 1, true));
  const nose = memo("nose", () => { const g = new THREE.SphereGeometry(R, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 2.0, 1); return g; });
  const tail = memo("tailcone", () => new THREE.ConeGeometry(R, 4.2, 24, 1, true));
  const fx = memo("firefx", () => new THREE.MeshBasicMaterial({ color: "#ff9a2a", transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  const b = Math.min(1, broken);
  const wingG = memo("wingG", () => { const sh = new THREE.Shape(); sh.moveTo(-1.3, -3.9); sh.lineTo(1.3, -3.9); sh.lineTo(0.75, 3.9); sh.lineTo(-0.55, 3.9); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.04, bevelSegments: 2 }); g.rotateX(Math.PI / 2); g.translate(0, 0.06, 0); return g; });
  const wingM = toon("#c8ccd2");
  const Engine: React.FC<{ z: number }> = ({ z }) => <group position={[1.15, -0.55, z]}>
    <Ink geometry={geo("Capsule", 0.42, 1.8, 6, 14)} material={white} rotation={[0, 0, Math.PI / 2]} px={1.4} />
    <group position={[1.45, 0, 0]}><Ink geometry={geo("Cone", 0.28, 0.5, 14)} material={dark} rotation={[0, 0, -Math.PI / 2]} px={1} /><Prop t={t + z} spin={spin} /></group>
  </group>;
  const windows = (x0: number, x1: number) => { const out: React.ReactNode[] = []; for (let x = x0; x < x1; x += 0.62) out.push(<mesh key={x} geometry={box(0.28, 0.32, 2 * R + 0.03)} material={win} position={[x, 0.22, 0]} />); return out; };
  return <group position={p} rotation={rot} scale={s}>
    {/* front section: nose, cockpit, wing, engines */}
    <group position={[0.3 * b, 0.15 * b, 0]} rotation={[0, 0, 0.08 * b]}>
      <Ink geometry={fuseF} material={white} rotation={[0, 0, Math.PI / 2]} position={[0.6, 0, 0]} px={2} />
      <Ink geometry={nose} material={white} rotation={[0, 0, -Math.PI / 2]} position={[3.7, 0, 0]} px={2} />
      <mesh geometry={box(6.3, 0.3, 2 * R + 0.02)} material={blue} position={[0.8, 0.0, 0]} />
      <mesh geometry={box(6.3, 1.15, 2 * R - 0.02)} material={metal} position={[0.8, -0.55, 0]} />
      {windows(-2.1, 3.0)}
      <mesh geometry={box(0.7, 0.3, 1.2)} material={win} position={[4.65, 0.42, 0]} rotation={[0, 0, -0.5]} />
      {[1, -1].map((sd) => <group key={sd} position={[0.2, -0.78, sd * 0.9]} rotation={[sd * -0.06, 0, 0]}><Ink geometry={wingG} material={wingM} position={[0, 0, sd * 3.8]} scale={[1, 1, sd]} px={1.6} /></group>)}
      <Engine z={2.6} /><Engine z={5.6} /><Engine z={-2.6} /><Engine z={-5.6} />
      {gear ? [[1.2, -1.6, 2.6], [1.2, -1.6, -2.6], [3.2, -1.5, 0]].map((q, i) => <group key={i} position={q as V3}><Ink geometry={box(0.12, 0.9, 0.12)} material={dark} position={[0, 0.45, 0]} px={1} /><Ink geometry={geo("Cylinder", 0.3, 0.3, 0.22, 14)} material={toon("#1a1a1e")} rotation={[Math.PI / 2, 0, 0]} px={1} /></group>) : null}
      {fire > 0 ? <group position={[0.4, -0.5, 5.2]}>{[0, 1, 2, 3, 4].map((k) => <mesh key={k} material={fx} position={[-k * 0.6 - 0.2, 0.2 + Math.sin(t * 13 + k) * 0.1, Math.sin(t * 9 + k) * 0.2]} scale={(0.9 + 0.3 * Math.sin(t * 17 + k * 2)) * fire * (1.2 - k * 0.15)}><sphereGeometry args={[0.6, 10, 8]} /></mesh>)}</group> : null}
    </group>
    {/* rear section: tail */}
    <group position={[-2.6 - 2.2 * b, -1.6 * b * b, 0.4 * b]} rotation={[0.5 * b, 0.25 * b, -0.6 * b]}>
      <group position={[2.6, 0, 0]}>
        <Ink geometry={fuseB} material={white} rotation={[0, 0, Math.PI / 2]} position={[-2.6 - 2.3 + 2.6 - 0.0, 0, 0]} px={2} />
        <mesh geometry={box(4.6, 0.3, 2 * R + 0.02)} material={blue} position={[-2.3, 0, 0]} />
        <mesh geometry={box(4.6, 1.15, 2 * R - 0.02)} material={metal} position={[-2.3, -0.55, 0]} />
        {windows(-4.3, -0.4)}
        <Ink geometry={tail} material={white} rotation={[0, 0, Math.PI / 2]} position={[-6.7, 0.25, 0]} scale={[1, 1, 1]} px={2} />
        <Ink geometry={box(2.4, 2.8, 0.18)} material={white} position={[-7.6, 1.6, 0]} rotation={[0, 0, -0.45]} px={1.6} />
        <mesh geometry={box(1.6, 0.4, 0.2)} material={red} position={[-7.9, 2.3, 0]} rotation={[0, 0, -0.45]} />
        <Ink geometry={box(1.6, 0.14, 5.2)} material={metal} position={[-7.8, 0.4, 0]} px={1.4} />
      </group>
    </group>
  </group>;
};

/* ------------------------------------------------------------------ cabin interior (rows go toward -z, the camera looks back from the front) */
export const Cabin: React.FC<{ t: number; rows?: number; flash?: number; shake?: number; tilt?: number; dim?: number; children?: React.ReactNode }> = ({ t, rows = 7, flash = 0, shake = 0, dim = 0, children }) => {
  const wall = toon("#efe8d8"); const panel = toon("#d8ccb4"); const carpet = toonT("carpet", () => repT(memo("carpettex", () => cv(256, 256, (g, w, h) => { g.fillStyle = "#7a3a3a"; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,.12)" : "rgba(255,200,180,.08)"; g.fillRect(r() * w, r() * h, 3, 3); } g.fillStyle = "rgba(240,200,120,.25)"; for (let y = 16; y < h; y += 64) for (let x = 16; x < w; x += 64) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } }, true)), 4, 12));
  const winM = memo("cabwin" + Math.round(flash * 10), () => new THREE.MeshBasicMaterial({ color: new THREE.Color("#2a3448").lerp(new THREE.Color("#f0f4ff"), flash) }));
  const bin = toon("#e8e2d4"); const lamp = basic("#fff2c8");
  const sx = Math.sin(t * 31) * 0.03 * shake, sy = Math.sin(t * 23 + 1) * 0.04 * shake;
  return <group position={[sx, sy, 0]} rotation={[0, 0, Math.sin(t * 7) * 0.012 * shake]}>
    <mesh material={carpet} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -rows * 0.65]} receiveShadow><planeGeometry args={[7.4, rows * 1.4 + 6]} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <Ink geometry={box(0.3, 3.2, rows * 1.4 + 6)} material={wall} position={[side * 3.75, 1.6, -rows * 0.65]} px={1.6} cast={false} />
      <Ink geometry={box(0.9, 0.7, rows * 1.4 + 6)} material={bin} position={[side * 3.2, 2.85, -rows * 0.65]} px={1.6} cast={false} />
      {Array.from({ length: rows + 2 }, (_, i) => <group key={i} position={[side * 3.58, 1.75, 0.6 - i * 1.4]}><mesh geometry={box(0.06, 0.62, 0.48)} material={panel} /><mesh material={winM} position={[-side * 0.04, 0, 0]} rotation={[0, -side * Math.PI / 2, 0]}><planeGeometry args={[0.36, 0.5]} /></mesh></group>)}
    </group>)}
    <Ink geometry={box(7.6, 0.3, rows * 1.4 + 6)} material={wall} position={[0, 3.35, -rows * 0.65]} px={1.6} cast={false} />
    {Array.from({ length: rows }, (_, i) => <mesh key={i} material={lamp} position={[0, 3.18, -i * 1.4]}><boxGeometry args={[0.8, 0.04, 0.3]} /></mesh>)}
    {Array.from({ length: rows }, (_, i) => <group key={i}><SeatRow p={[-2.0, 0, -i * 1.4]} /><SeatRow p={[2.0, 0, -i * 1.4]} /></group>)}
    {dim > 0 ? <mesh position={[0, 1.6, 2]}><boxGeometry args={[7, 3, 0.01]} /><meshBasicMaterial color="#000" transparent opacity={0} /></mesh> : null}
    {children}
  </group>;
};

/* ------------------------------------------------------------------ hut on stilts with thatched roof (open front toward +z) */
export const Hut: React.FC<{ p?: V3; rot?: number; s?: number; low?: boolean; children?: React.ReactNode }> = ({ p = [0, 0, 0], rot = 0, s = 1, low = false, children }) => {
  const pl = toonT("plank", () => repT(plankTex(), 2, 1)); const plv = toonT("plankv", () => repT(plankTex("#7a5436"), 3, 1)); const th = toonT("thatch", () => repT(thatchTex(), 3, 2)); const post = toonT("postbark", () => repT(barkTex("#6a5038"), 1, 2));
  const H = low ? 0.25 : 1.1; const W = 5, D = 4;
  const roof = memo("hutroof", () => { const g = new THREE.CylinderGeometry(0.01, 4.4, 2.2, 4, 1, false); g.rotateY(Math.PI / 4); g.scale(1.25, 1, 1.05); return g; });
  return <group position={p} rotation={[0, rot, 0]} scale={s}>
    {[[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2], [0, -D / 2]].map(([x, z], i) => <Ink key={i} geometry={geo("Cylinder", 0.14, 0.17, H + 3.4, 8)} material={post} position={[x, (H + 3.4) / 2, z]} px={1.6} />)}
    <Ink geometry={box(W + 0.3, 0.2, D + 0.3)} material={pl} position={[0, H, 0]} px={1.8} />
    <Ink geometry={box(W, 2.2, 0.14)} material={plv} position={[0, H + 1.1, -D / 2]} px={1.6} />
    <Ink geometry={box(0.14, 2.2, D)} material={plv} position={[-W / 2, H + 1.1, 0]} px={1.6} />
    <Ink geometry={box(0.14, 1.0, D)} material={plv} position={[W / 2, H + 0.5, 0]} px={1.6} />
    <Ink geometry={roof} material={th} position={[0, H + 3.4, 0]} px={2} />
    {/* ladder */}
    {low ? null : <group position={[1.2, 0, D / 2 + 0.5]} rotation={[-0.35, 0, 0]}>{[-0.35, 0.35].map((x, i) => <Ink key={i} geometry={box(0.08, 1.6, 0.08)} material={post} position={[x, 0.75, 0]} px={1} />)}{[0.2, 0.55, 0.9, 1.25].map((y, i) => <Ink key={i} geometry={box(0.76, 0.06, 0.08)} material={pl} position={[0, y, 0]} px={1} />)}</group>}
    {children}
  </group>;
};
export const Dugout: React.FC<{ p?: V3; rot?: number; s?: number; motor?: boolean }> = ({ p = [0, 0, 0], rot = 0, s = 1, motor = true }) => {
  const hull = memo("dughull", () => { const g = new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(3.4, 0.6, 0.72); return g; });
  const wd = toonT("dugwood", () => repT(barkTex("#7a5232"), 3, 1)); const inner = toon("#4a3020"); const m = toon("#3a3a40");
  return <group position={p} rotation={[0, rot, 0]} scale={s}>
    <Ink geometry={hull} material={wd} position={[0, 0.5, 0]} px={1.8} />
    <mesh material={inner} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.49, 0]} scale={[3.25, 0.62, 1]}><circleGeometry args={[1, 28]} /></mesh>
    {[-1.2, 0.2, 1.4].map((x, i) => <Ink key={i} geometry={box(0.2, 0.06, 1.2)} material={toonT("plank", () => repT(plankTex(), 2, 1))} position={[x, 0.45, 0]} px={1} />)}
    {motor ? <group position={[-3.3, 0.6, 0]}><Ink geometry={box(0.5, 0.6, 0.4)} material={m} position={[0, 0.25, 0]} px={1.2} /><Ink geometry={box(0.12, 0.9, 0.12)} material={m} position={[-0.1, -0.35, 0]} px={1} /><Ink geometry={box(0.7, 0.06, 0.06)} material={m} position={[0.5, 0.4, 0]} px={1} /></group> : null}
  </group>;
};
export const GasCan: React.FC<{ p?: V3; rot?: V3; s?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const red = toon("#c8302a"); const dk = toon("#2a2a2e");
  return <group position={p} rotation={rot} scale={s}>
    <Ink geometry={box(0.5, 0.62, 0.26)} material={red} position={[0, 0.31, 0]} px={1.4} />
    <Ink geometry={box(0.3, 0.06, 0.08)} material={dk} position={[-0.05, 0.68, 0]} px={1} />
    <Ink geometry={geo("Cylinder", 0.05, 0.07, 0.22, 10)} material={dk} position={[0.2, 0.7, 0]} rotation={[0, 0, -0.6]} px={1} />
    <mesh geometry={box(0.36, 0.12, 0.27)} material={toon("#e8e0d0")} position={[0, 0.3, 0]} />
  </group>;
};
const bagTex = () => memo("bagtex", () => cv(256, 256, (g, w, h) => { g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 40) { g.fillStyle = "#e8403a"; g.fillRect(x, 0, 18, h); } g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.arc(w / 2, h * 0.55, 56, 0, 7); g.fill(); g.strokeStyle = INKD; g.lineWidth = 6; g.stroke(); g.fillStyle = "#f2b020"; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 16 : 38; g.lineTo(w / 2 + Math.cos(a) * rr, h * 0.55 + Math.sin(a) * rr); } g.closePath(); g.fill(); }));
export const CandyBag: React.FC<{ p?: V3; rot?: V3; s?: number; empty?: boolean; spill?: boolean }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1, empty = false, spill = true }) => {
  const paper = toonT("bagpaper", () => bagTex()); const plain = toon("#f4ecd8"); const cols = ["#e8403a", "#f2c030", "#3a9ae8", "#4ac060", "#e070c0"];
  const mats = [plain, plain, plain, plain, paper, paper];
  return <group position={p} rotation={rot} scale={s}>
    <Ink geometry={box(0.3, empty ? 0.3 : 0.36, 0.16)} material={mats} position={[0, empty ? 0.15 : 0.18, 0]} px={1.2} />
    {empty ? <Ink geometry={box(0.3, 0.07, 0.17)} material={plain} position={[0, 0.32, 0]} rotation={[0.25, 0, 0]} px={1} /> : cols.map((c, i) => <Ink key={i} geometry={geo("Sphere", 0.045, 10, 8)} material={toon(c)} position={[-0.1 + i * 0.05, 0.38 + (i % 2) * 0.03, (i % 2) * 0.03]} scale={[1.3, 1, 1]} px={1} />)}
    {!empty && spill ? cols.map((c, i) => <Ink key={"s" + i} geometry={geo("Sphere", 0.045, 10, 8)} material={toon(c)} position={[0.25 + i * 0.09, 0.05, 0.12 + (i % 2) * 0.08]} scale={[1.4, 1, 1]} px={1} />) : null}
  </group>;
};
export const Glasses: React.FC<{ p?: V3; rot?: V3; s?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const m = toon("#2a2024"); const lens = memo("lens", () => new THREE.MeshBasicMaterial({ color: "#cfe6f0", transparent: true, opacity: 0.55 })); const crack = basic("#ffffff");
  return <group position={p} rotation={rot} scale={s}>{[-0.13, 0.13].map((x, i) => <group key={i} position={[x, 0, 0]}><mesh material={m}><torusGeometry args={[0.1, 0.018, 8, 20]} /></mesh><mesh material={lens}><circleGeometry args={[0.095, 20]} /></mesh></group>)}<mesh material={m} position={[0, 0.03, 0]}><boxGeometry args={[0.07, 0.02, 0.02]} /></mesh><mesh material={crack} position={[0.14, 0.01, 0.002]} rotation={[0, 0, 0.7]}><planeGeometry args={[0.15, 0.008]} /></mesh><mesh material={crack} position={[0.11, -0.03, 0.003]} rotation={[0, 0, -0.5]}><planeGeometry args={[0.09, 0.008]} /></mesh></group>;
};
export const Shoe: React.FC<{ p?: V3; rot?: V3; s?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const sole = toon("#6a3a24"); const strap = toon("#c8a070");
  return <group position={p} rotation={rot} scale={s}><Ink geometry={geo("Cylinder", 0.12, 0.12, 0.05, 16)} material={sole} scale={[1, 1, 2.2]} position={[0, 0.025, 0]} px={1} /><mesh material={strap} position={[0, 0.07, 0.08]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.1, 0.02, 6, 14, Math.PI]} /></mesh><mesh material={strap} position={[0, 0.07, -0.1]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.1, 0.02, 6, 14, Math.PI]} /></mesh></group>;
};
/** twisted metal wreck panel */
export const Panel: React.FC<{ p?: V3; rot?: V3; s?: number; seed?: number; blue?: boolean }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1, seed = 1, blue = false }) => {
  const g = memo(`panel${seed}`, () => { const x = new THREE.PlaneGeometry(2, 1.3, 8, 6); const ps = x.attributes.position; const r = rng(seed); for (let i = 0; i < ps.count; i++) { const a = ps.getX(i), b = ps.getY(i); ps.setZ(i, Math.sin(a * 1.6 + seed) * 0.22 + b * b * 0.18 + (r() - 0.5) * 0.04); } x.computeVertexNormals(); return x; });
  const m = memo("panelm" + blue, () => { const mm = (blue ? toon("#2f5aa8") : toonT("metal", () => repT(metalTex(), 2, 1))).clone(); mm.side = THREE.DoubleSide; return mm; });
  return <group position={p} rotation={rot} scale={s}><Ink geometry={g} material={m} px={1.4} /></group>;
};
export const Stick: React.FC<{ len?: number }> = ({ len = 2.2 }) => <Ink geometry={geo("Cylinder", 0.03, 0.045, len, 8)} material={toonT("stickbark", () => repT(barkTex("#7a5a3a"), 1, 2))} position={[0, -len * 0.35, 0]} px={1} />;
export const Stingray: React.FC<{ p: V3; t: number; s?: number }> = ({ p, t, s = 1 }) => {
  const g = memo("ray", () => { const sh = new THREE.Shape(); sh.moveTo(0, 0.6); sh.quadraticCurveTo(0.9, 0.3, 0.8, -0.1); sh.quadraticCurveTo(0.3, -0.5, 0, -0.55); sh.quadraticCurveTo(-0.3, -0.5, -0.8, -0.1); sh.quadraticCurveTo(-0.9, 0.3, 0, 0.6); return new THREE.ShapeGeometry(sh, 16); });
  const m = memo("raym", () => new THREE.MeshBasicMaterial({ color: "#3a3424", transparent: true, opacity: 0.55, depthWrite: false }));
  const flap = Math.sin(t * 5) * 0.08;
  return <group position={p} scale={s} rotation={[-Math.PI / 2, 0, 0]}><mesh geometry={g} material={m} scale={[1 + flap, 1, 1]} /><mesh material={m} position={[0, -1.1, 0]}><planeGeometry args={[0.06, 1.2]} /></mesh></group>;
};
export const Maggots: React.FC<{ t: number; n: number; spread?: number; fall?: number }> = ({ t, n, spread = 0.18, fall = 0 }) => {
  const m = toon("#f4eedc"); const pts = useMemo(() => { const r = rng(5); return Array.from({ length: 40 }, () => ({ x: (r() - 0.5) * spread, y: (r() - 0.5) * spread * 1.6, ph: r() * 6, v: 0.5 + r() })); }, [spread]);
  return <group>{pts.slice(0, n).map((q, i) => <mesh key={i} material={m} position={[q.x + Math.sin(t * 3 + q.ph) * 0.01, q.y - fall * q.v * 0.6, 0.03]} rotation={[0, 0, q.ph + Math.sin(t * 6 + q.ph) * 0.5]}><capsuleGeometry args={[0.012, 0.03, 3, 6]} /></mesh>)}</group>;
};
/** plank with carved tally marks (n of them), in-world */
export const TallyBoard: React.FC<{ p: V3; n: number; rot?: number; s?: number }> = ({ p, n, rot = 0, s = 1 }) => {
  const tx = memo("tally" + n, () => cv(1024, 384, (g, w, h) => {
    const pt = plankTex("#9a7048").image as HTMLCanvasElement; g.drawImage(pt, 0, 0, w, h); g.fillStyle = "rgba(255,236,200,.55)"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#2a1a10"; g.lineWidth = 10; g.lineCap = "round";
    for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5; const gx = 50 + (grp % 6) * 160, gy = 70 + Math.floor(grp / 6) * 150; if (k < 4) { g.beginPath(); g.moveTo(gx + k * 26, gy); g.lineTo(gx + k * 26 + 4, gy + 110); g.stroke(); } else { g.beginPath(); g.moveTo(gx - 14, gy + 80); g.lineTo(gx + 100, gy + 28); g.stroke(); } }
  }));
  const m = memo("tallym" + n, () => new THREE.MeshBasicMaterial({ map: tx, color: "#f4e4c8" }));
  return <group position={p} rotation={[0, rot, 0]} scale={s}><Ink geometry={box(2.4, 0.9, 0.08)} material={m} px={1.4} /></group>;
};
export const SignBoard: React.FC<{ p: V3; lines: string[]; w?: number; h?: number; rot?: number; bg?: string; fg?: string; posts?: boolean; font?: string }> = ({ p, lines, w = 3, h = 1.4, rot = 0, bg = "#efe2c0", fg = "#3a2a1a", posts = true, font = "Lilita One" }) => {
  const m = memo("sb" + lines.join() + bg + fg + font, () => new THREE.MeshToonMaterial({ map: signTex(lines, bg, fg, 1024, Math.round(1024 * h / w), font, bg === "#26332c" ? "#7a5a3a" : "#5a3a1e") }));
  const post = toonT("postbark", () => repT(barkTex("#6a5038"), 1, 2));
  return <group position={p} rotation={[0, rot, 0]}>
    <Ink geometry={box(w, h, 0.1)} material={[toon("#6a4a2a"), toon("#6a4a2a"), toon("#6a4a2a"), toon("#6a4a2a"), m, toon("#6a4a2a")]} position={[0, posts ? 1.2 + h / 2 : 0, 0]} px={1.6} />
    {posts ? [-w / 2 + 0.2, w / 2 - 0.2].map((x, i) => <Ink key={i} geometry={geo("Cylinder", 0.08, 0.1, 1.3 + h, 8)} material={post} position={[x, (1.3 + h) / 2, -0.1]} px={1.2} />) : null}
  </group>;
};
/** research-station table: microscope, notebooks, jars, butterfly net */
export const LabTable: React.FC<{ p: V3; rot?: number }> = ({ p, rot = 0 }) => {
  const wd = toonT("plank", () => repT(plankTex(), 2, 1)); const dk = toon("#2a2a30"); const bk = [toon("#c8503a"), toon("#2f6aa8"), toon("#e8c040")]; const jar = memo("jar", () => new THREE.MeshToonMaterial({ color: "#bfe0d8", transparent: true, opacity: 0.7 }));
  return <group position={p} rotation={[0, rot, 0]}>
    <Ink geometry={box(2.6, 0.12, 1.2)} material={wd} position={[0, 1.0, 0]} px={1.6} />
    {[[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]].map(([x, z], i) => <Ink key={i} geometry={box(0.1, 1.0, 0.1)} material={wd} position={[x, 0.5, z]} px={1} />)}
    <group position={[-0.6, 1.06, 0]}><Ink geometry={box(0.4, 0.06, 0.3)} material={dk} px={1} /><Ink geometry={box(0.08, 0.5, 0.08)} material={dk} position={[0, 0.28, -0.08]} px={1} /><Ink geometry={geo("Cylinder", 0.06, 0.06, 0.34, 10)} material={dk} position={[0, 0.5, 0]} rotation={[0.5, 0, 0]} px={1} /></group>
    {bk.map((m, i) => <Ink key={i} geometry={box(0.42, 0.06, 0.3)} material={m} position={[0.4, 1.09 + i * 0.065, 0.1]} rotation={[0, i * 0.2, 0]} px={1} />)}
    {[0.95, 1.12].map((x, i) => <Ink key={i} geometry={geo("Cylinder", 0.08, 0.08, 0.22, 12)} material={jar} position={[x, 1.17, -0.25]} px={1} />)}
  </group>;
};
export const Mountains: React.FC<{ z?: number; color?: string; n?: number; seed?: number; h?: number }> = React.memo(({ z = -150, color = "#7a8aa0", n = 9, seed = 2, h = 40 }) => {
  const r = rng(seed); const pts = Array.from({ length: n }, (_, i) => ({ x: -220 + i * (440 / (n - 1)) + (r() - 0.5) * 30, h: h * (0.6 + r() * 0.7), w: 50 + r() * 40 }));
  const m = memo("mtn" + color, () => new THREE.MeshBasicMaterial({ color, fog: true })); const snow = basic("#f4f6f8");
  return <group>{pts.map((q, i) => <group key={i} position={[q.x, 0, z - (i % 2) * 20]}><mesh material={m} position={[0, q.h / 2, 0]}><coneGeometry args={[q.w, q.h, 5]} /></mesh><mesh material={snow} position={[0, q.h * 0.88, 0]}><coneGeometry args={[q.w * 0.16, q.h * 0.24, 5]} /></mesh></group>)}</group>;
});
export const Airstair: React.FC<{ p: V3; rot?: number }> = ({ p, rot = 0 }) => {
  const m = toon("#d8dce0"); const rail = toon("#5a6068");
  return <group position={p} rotation={[0, rot, 0]}>{Array.from({ length: 9 }, (_, i) => <Ink key={i} geometry={box(1.4, 0.12, 0.42)} material={m} position={[0, 0.2 + i * 0.28, -i * 0.34]} px={1} />)}{[-0.72, 0.72].map((x, i) => <group key={i}><Ink geometry={box(0.06, 0.06, 3.9)} material={rail} position={[x, 1.9, -1.4]} rotation={[0.69, 0, 0]} px={1} />{[0, 2, 4, 6, 8].map((k) => <Ink key={k} geometry={box(0.05, 0.9, 0.05)} material={rail} position={[x, 0.65 + k * 0.28, -k * 0.34]} px={1} />)}</group>)}<Ink geometry={box(1.5, 0.2, 3.4)} material={rail} position={[0, 0.3, -1.3]} rotation={[0.69, 0, 0]} px={1.2} /></group>;
};
export const GiftBox: React.FC<{ p?: V3; c?: string; rib?: string; s?: number; rot?: number }> = ({ p = [0, 0, 0], c = "#c8303a", rib = "#f2c030", s = 1, rot = 0 }) => <group position={p} scale={s} rotation={[0, rot, 0]}><Ink geometry={box(0.34, 0.26, 0.26)} material={toon(c)} position={[0, 0.13, 0]} px={1.2} /><mesh geometry={box(0.36, 0.27, 0.05)} material={toon(rib)} position={[0, 0.13, 0]} /><mesh geometry={box(0.05, 0.27, 0.27)} material={toon(rib)} position={[0, 0.13, 0]} /><Ink geometry={geo("Torus", 0.05, 0.015, 6, 12)} material={toon(rib)} position={[0, 0.28, 0]} px={1} /></group>;
void INKD;
