import * as THREE from "three";
import React from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { M, BM, seeded, type V3 } from "./kit";
import { RimCtx, type Look2, type Pose2 } from "./kit2";
export { BEN2, GARY2, MIA2, GREY2, walkP, RimCtx } from "./kit2";
export type { Look2 as Look3, Pose2 as Pose3 } from "./kit2";

/** STYLE 3 kit v3: sculpted, facet-shaded low-poly people. Every part is a lofted/deformed mesh with per-triangle colour variance and baked occlusion. */
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const col = (c: string) => new THREE.Color(c);

/** paint a geometry: flat normals, per-triangle brightness jitter, baked darkening on down-facing / inner faces */
const paint = (src: THREE.BufferGeometry, color: string, jitter = 0.14, seed = 1, ao = 0.22): THREE.BufferGeometry => {
  const smooth = src.clone(); smooth.computeVertexNormals();
  const g = src.index ? src.toNonIndexed() : src.clone(); g.computeVertexNormals();
  const n = g.attributes.position.count; const cs = new Float32Array(n * 3); const base = col(color); const r = seeded(seed * 977 + 3); const nm = g.attributes.normal;
  for (let i = 0; i < n; i += 3) {
    const j = 1 + (r() - 0.5) * 2 * jitter; const ny = (nm.getY(i) + nm.getY(i + 1) + nm.getY(i + 2)) / 3; const k = j * (1 - ao * (1 - (ny * 0.5 + 0.5)));
    for (let v = 0; v < 3; v++) { cs[(i + v) * 3] = base.r * k; cs[(i + v) * 3 + 1] = base.g * k; cs[(i + v) * 3 + 2] = base.b * k; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(cs, 3)); g.userData.smooth = smooth; return g;
};
const hullOf = (g: THREE.BufferGeometry, d = 0.011) => memo("h" + g.uuid, () => { const h = (g.userData.smooth as THREE.BufferGeometry).clone(); const p = h.attributes.position, nn = h.attributes.normal; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + nn.getX(i) * d, p.getY(i) + nn.getY(i) * d, p.getZ(i) + nn.getZ(i) * d); return h; });
const VMat = (map?: string, rx = 1, ry = 1, rough = 0.78, metal = 0) => memo(`vm${map}${rx}${ry}${rough}${metal}`, () => { const base = M("#ffffff", { map, rx, ry }) as THREE.MeshStandardMaterial; const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: rough, metalness: metal, map: base.map }); return m; });
const HullM = (c: string) => memo("hm" + c, () => new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide }));
type PP = { g: THREE.BufferGeometry; p?: V3; r?: V3; s?: V3; map?: string; rx?: number; ry?: number; rough?: number; metal?: number; cast?: boolean; hull?: boolean };
const Part: React.FC<PP> = ({ g, p, r, s, map, rx, ry, rough, metal, cast = true, hull = true }) => {
  const rc = React.useContext(RimCtx);
  return <>
    <mesh geometry={g} material={VMat(map, rx, ry, rough, metal)} position={p} rotation={r} scale={s} castShadow={cast} receiveShadow />
    {rc && hull ? <mesh geometry={hullOf(g)} material={HullM(rc)} position={p} rotation={r} scale={s} /> : null}
  </>;
};

/* ---------------------------------------------------------------- lofted tube along -y */
type Ring = [number, number, number?]; // [y (negative down), radiusX, radiusZ]
const tube = (rings: Ring[], seg = 9, capEnd = true) => {
  const pos: number[] = [], idx: number[] = [];
  rings.forEach(([y, rx, rz]) => { for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; pos.push(Math.cos(a) * rx, y, Math.sin(a) * (rz ?? rx)); } });
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < seg; i++) { const a = k * seg + i, b = k * seg + ((i + 1) % seg), c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c); }
  const top = pos.length / 3; pos.push(0, rings[0][0], 0); for (let i = 0; i < seg; i++) idx.push(top, (i + 1) % seg, i);
  if (capEnd) { const bot = pos.length / 3; const l = (rings.length - 1) * seg; pos.push(0, rings[rings.length - 1][0], 0); for (let i = 0; i < seg; i++) idx.push(bot, l + i, l + ((i + 1) % seg)); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
};
const bx = (w: number, h: number, d: number, sw = 1, sh = 1, sd = 1) => new THREE.BoxGeometry(w, h, d, sw, sh, sd);
const ell = (rx: number, ry: number, rz: number, ws = 10, hs = 8) => { const g = new THREE.SphereGeometry(1, ws, hs); g.scale(rx, ry, rz); return g; };
const wedge = (r: number, h: number, seg = 4) => { const g = new THREE.ConeGeometry(r, h, seg); g.translate(0, h / 2, 0); return g; };

/* ---------------------------------------------------------------- sculpted pieces */
const headG = (c: string, seed: number) => {
  const g = new THREE.SphereGeometry(1, 20, 16); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const ax = Math.abs(x);
    x *= 0.80;
    if (y > 0.3) x *= 1 - 0.18 * (y - 0.3);                       // narrower crown
    if (y < 0.05) { const k = Math.min(1, (0.05 - y) / 1.05); x *= (y > -0.38 ? 1.06 : 1) * (1 - 0.46 * Math.pow(k, 1.4)); z *= 1 - 0.18 * k; }   // jaw taper
    if (y < -0.62 && z > 0) { z *= 1.0; y -= 0.025; x *= 0.9; }  // chin block
    if (z > 0.05 && y > 0.16 && y < 0.42) z += 0.05;            // brow ridge
    if (z > 0.2 && ax > 0.2 && ax < 0.65 && y > 0.0 && y < 0.3) z -= 0.055 * Math.sin(Math.min(1, (ax - 0.2) / 0.45) * Math.PI); // eye sockets
    if (z > 0.1 && ax > 0.4 && ax < 0.85 && y < 0.0 && y > -0.4) z += 0.04;   // cheekbones
    if (y < -0.1 && y > -0.5 && ax > 0.55 && z < 0.2) x *= 1.05;  // jaw angle
    p.setXYZ(i, x, y, z);
  }
  return paint(g, c, 0.07, seed, 0.14);
};
const torsoG = (c: string, seed: number, sleeveless: boolean) => {
  const pts: [number, number][] = [[0.178, 0.0], [0.16, 0.08], [0.15, 0.18], [0.158, 0.28], [0.183, 0.38], [0.206, 0.46], [0.196, 0.52], [0.14, 0.575], [0.088, 0.605]];
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 12); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * 1.2, y = p.getY(i), z = p.getZ(i) * 0.7;
    if (z > 0 && y > 0.3 && y < 0.5) z += 0.022 * Math.sin(Math.abs(x) * 16);
    if (z < 0 && y > 0.3 && y < 0.5) z -= 0.012 * Math.sin(Math.abs(x) * 12);
    if (y > 0.5) { const k = (y - 0.5) / 0.105; x *= 1 - 0.2 * k; }
    p.setXYZ(i, x, y, z);
  }
  return paint(g, c, sleeveless ? 0.07 : 0.12, seed, 0.2);
};
const hipsPants = (c: string, seed: number) => {
  const pts: [number, number][] = [[0.15, -0.12], [0.176, -0.04], [0.178, 0.04], [0.162, 0.11], [0.15, 0.17]];
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 12); g.scale(1.28, 1, 0.78); return paint(g, c, 0.1, seed, 0.2);
};
const deltG = (c: string, seed: number) => paint(ell(0.088, 0.082, 0.082, 8, 6), c, 0.08, seed, 0.15);
const upperArmG = (c: string, seed: number) => paint(tube([[0.0, 0.074, 0.07], [-0.06, 0.086, 0.08], [-0.15, 0.079, 0.074], [-0.24, 0.061, 0.058], [-0.3, 0.052, 0.05]], 8), c, 0.08, seed, 0.2);
const foreArmG = (c: string, seed: number) => paint(tube([[0.0, 0.052, 0.05], [-0.07, 0.06, 0.054], [-0.16, 0.048, 0.04], [-0.27, 0.034, 0.03]], 8), c, 0.08, seed, 0.2);
const sleeveG = (c: string, seed: number) => paint(tube([[0.03, 0.092, 0.088], [-0.07, 0.098, 0.09], [-0.15, 0.093, 0.085], [-0.185, 0.098, 0.09]], 8, false), c, 0.1, seed, 0.2);
const thighG = (c: string, seed: number) => paint(tube([[0.0, 0.112, 0.118], [-0.1, 0.115, 0.12], [-0.28, 0.092, 0.092], [-0.44, 0.076, 0.078]], 8), c, 0.1, seed, 0.22);
const shinG = (c: string, seed: number) => paint(tube([[0.0, 0.076, 0.078], [-0.1, 0.078, 0.086], [-0.26, 0.06, 0.06], [-0.36, 0.054, 0.054], [-0.4, 0.064, 0.064]], 8), c, 0.1, seed, 0.22);
const loftZ = (st: [number, number, number][], bottom: number, flatTop = false) => {
  const pos: number[] = [], idx: number[] = []; const N = 9;
  st.forEach(([z, hw, top]) => { const hg = Math.max(0.004, top - bottom); const ring: [number, number][] = []; for (let k = 0; k <= N; k++) { const a = (Math.PI * k) / N; ring.push([Math.cos(a) * hw, bottom + (flatTop ? hg : Math.sin(a) * hg)]); } ring.push([-hw, bottom], [hw, bottom]); ring.forEach(([x, y]) => pos.push(x, y, z)); });
  const M2 = N + 3; for (let k = 0; k < st.length - 1; k++) for (let i = 0; i < M2; i++) { const a = k * M2 + i, b = k * M2 + ((i + 1) % M2), c = a + M2, d = b + M2; idx.push(a, b, c, b, d, c); }
  const f0 = pos.length / 3; pos.push(0, bottom + 0.02, st[0][0]); for (let i = 0; i < M2; i++) idx.push(f0, (i + 1) % M2, i);
  const l = (st.length - 1) * M2, f1 = pos.length / 3; pos.push(0, bottom + 0.012, st[st.length - 1][0]); for (let i = 0; i < M2; i++) idx.push(f1, l + i, l + ((i + 1) % M2));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
};
const SHOE: [number, number, number][] = [[-0.128, 0.034, 0.004], [-0.108, 0.046, 0.05], [-0.07, 0.05, 0.066], [-0.02, 0.052, 0.05], [0.04, 0.056, 0.03], [0.09, 0.056, 0.014], [0.135, 0.05, -0.002], [0.165, 0.038, -0.014], [0.18, 0.02, -0.022]];
const shoeUpperG = (c: string, seed: number) => {
  const g = loftZ(SHOE, -0.058); const n = g.toNonIndexed(); n.computeVertexNormals(); const sm = g.clone(); sm.computeVertexNormals();
  const base = col(c), white = col("#f4f1ea"), r = seeded(seed); const cs = new Float32Array(n.attributes.position.count * 3); const P = n.attributes.position;
  for (let i = 0; i < P.count; i += 3) { const zc = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3; const tc = zc > 0.1; const k = 1 + (r() - 0.5) * 0.12; const cc = tc ? white : base; for (let v = 0; v < 3; v++) { cs[(i + v) * 3] = cc.r * k; cs[(i + v) * 3 + 1] = cc.g * k; cs[(i + v) * 3 + 2] = cc.b * k; } }
  n.setAttribute("color", new THREE.BufferAttribute(cs, 3)); n.userData.smooth = sm; return n;
};
const soleG = (c: string, seed: number) => paint(loftZ([[-0.138, 0.04, -0.05], [-0.115, 0.052, -0.05], [-0.04, 0.056, -0.05], [0.06, 0.06, -0.05], [0.125, 0.056, -0.05], [0.17, 0.044, -0.05], [0.19, 0.024, -0.05]], -0.082, true), c, 0.04, seed, 0.12);
const toeCapG = (c: string, seed: number) => paint(ell(0.001, 0.001, 0.001, 3, 2), c, 0.0, seed, 0);
const bodySet = (L: Look2, id: string) => memo("body" + id, () => {
  const sk = L.skin; const sd = L.kind.length * 7 + (L.skin.charCodeAt(2) % 9);
  return {
    head: headG(sk, sd), torso: torsoG(L.top, sd + 1, !!L.sleeveless), upper: upperArmG(sk, sd + 2), fore: foreArmG(sk, sd + 3), sleeve: sleeveG(L.top, sd + 4),
    thigh: thighG(L.pants, sd + 5), shin: shinG(L.pants, sd + 6), shoe: shoeUpperG(L.shoe, sd + 7), sole: soleG(L.sole, sd + 8), toe: toeCapG(L.sole, sd + 9),
    neck: paint(tube([[0.0, 0.062, 0.06], [-0.05, 0.064, 0.062], [-0.11, 0.075, 0.07]], 8), sk, 0.08, sd + 10, 0.25),
    palm: paint(bx(0.084, 0.09, 0.034, 1, 2, 1), sk, 0.08, sd + 11, 0.15), fing: paint(bx(0.019, 0.04, 0.02), sk, 0.07, sd + 12, 0.1), tip: paint(bx(0.017, 0.032, 0.018), sk, 0.07, sd + 13, 0.1),
    ear: paint(ell(0.016, 0.03, 0.012, 6, 5), sk, 0.06, sd + 14, 0.1), hipsG: hipsPants(L.pants, sd + 15), delt: deltG(L.sleeveless ? L.skin : L.top, sd + 16),
  };
});

/* ---------------------------------------------------------------- rig parts */
const Hand: React.FC<{ B: ReturnType<typeof bodySet>; grip: number; side: 1 | -1; item?: React.ReactNode }> = ({ B, grip, side, item }) => {
  const c = 0.2 + grip * 1.15;
  return (
    <group position={[0, -0.02, 0]} scale={1.2}>
      <Part g={B.palm} p={[0, -0.045, 0]} />
      {[-0.03, -0.01, 0.01, 0.03].map((x, i) => <group key={i} position={[x, -0.09, 0]} rotation={[-c, 0, 0]}><Part g={B.fing} p={[0, -0.02, 0]} s={[1, 1 + (i === 1 || i === 2 ? 0.18 : 0), 1]} hull={false} /><group position={[0, -0.04, 0]} rotation={[-c * 0.95, 0, 0]}><Part g={B.tip} p={[0, -0.016, 0]} hull={false} /></group></group>)}
      <group position={[-side * 0.046, -0.04, 0.012]} rotation={[-0.55 - grip * 0.5, 0, -side * (0.55 - grip * 0.25)]}><Part g={B.fing} p={[0, -0.02, 0]} s={[1.2, 1.1, 1.2]} hull={false} /><group position={[0, -0.04, 0]} rotation={[-0.4, 0, 0]}><Part g={B.tip} p={[0, -0.016, 0]} hull={false} /></group></group>
      {item ? <group position={[0, -0.07, 0.03]}>{item}</group> : null}
    </group>
  );
};
const Arm3: React.FC<{ B: ReturnType<typeof bodySet>; L: Look2; pos: V3; rx: number; rz: number; elbow: number; side: 1 | -1; grip: number; item?: React.ReactNode }> = ({ B, L, pos, rx, rz, elbow, side, grip, item }) => (
  <group position={pos} rotation={[rx, 0, rz]}>
    <Part g={B.upper} />
    {!L.sleeveless ? <Part g={B.sleeve} map="fabric" rx={2} ry={1} /> : null}
    <group position={[0, -0.3, 0]} rotation={[-elbow, 0, 0]}>
      <Part g={B.fore} />
      <group position={[0, -0.27, 0]}><Hand B={B} grip={grip} side={side} item={item} /></group>
    </group>
  </group>
);
const Leg3: React.FC<{ B: ReturnType<typeof bodySet>; pos: V3; th: number; kn: number }> = ({ B, pos, th, kn }) => (
  <group position={pos} rotation={[th, 0, 0]}>
    <Part g={B.thigh} map="fabric" rx={1} ry={2} />
    <group position={[0, -0.44, 0]} rotation={[kn, 0, 0]}>
      <Part g={B.shin} map="fabric" rx={1} ry={2} />
      <group position={[0, -0.395, 0.02]}>
        <Part g={B.shoe} rough={0.5} />
        <Part g={B.sole} rough={0.9} />
        {[-0.045, -0.015, 0.015, 0.045].map((z, i) => <mesh key={i} geometry={lace()} material={M("#f4f1ea")} position={[0, 0.054 - i * 0.0085 + (z > 0.02 ? -0.006 : 0), z]} rotation={[0.28 - i * 0.12, 0, 0]} />)}
        <mesh geometry={tab()} material={M("#1c1c1e")} position={[0, 0.03, -0.128]} />
      </group>
    </group>
  </group>
);
const lace = () => memo("lace", () => new THREE.BoxGeometry(0.082, 0.006, 0.011));
const tab = () => memo("tab", () => new THREE.BoxGeometry(0.044, 0.03, 0.01));

/* ---------------------------------------------------------------- face */
const F: React.FC<{ g: THREE.BufferGeometry; m: THREE.Material; p: V3; r?: V3; s?: V3 }> = ({ g, m, p, r, s }) => <mesh geometry={g} material={m} position={p} rotation={r} scale={s} />;
const fe = (k: string, rx: number, ry: number, rz: number) => memo("fe" + k, () => ell(rx, ry, rz, 8, 6));
const fb = (k: string, w: number, h: number, d: number) => memo("fb" + k, () => new THREE.BoxGeometry(w, h, d));
const Face3: React.FC<{ B: ReturnType<typeof bodySet>; L: Look2; expr: string; shadesOn: boolean; blink: number; mouth: number }> = ({ B, L, expr, shadesOn, blink, mouth }) => {
  const brow = ({ calm: 0.05, smile: -0.1, smug: 0.2, shock: -0.3, shout: 0.38, sad: -0.4, annoyed: 0.5, sleepy: 0.0 } as any)[expr] ?? 0.05;
  const by = ({ shock: 0.011, sad: 0.003, annoyed: -0.004, smug: -0.001 } as any)[expr] ?? 0;
  const lid = ({ sleepy: 0.58, smug: 0.5, calm: 0.4, annoyed: 0.48, smile: 0.42, sad: 0.4, shock: 0.1, shout: 0.2 } as any)[expr] ?? 0.4;
  const open = Math.max(mouth, expr === "shock" ? 0.7 : expr === "shout" ? 1.1 : 0); const smile = expr === "smile" ? 1 : expr === "smug" ? 0.5 : expr === "sad" || expr === "annoyed" ? -0.6 : 0;
  const eo = Math.max(0.02, 1 - blink); const skinM = M(L.skin); const shade = M(L.skinShade); const lipM = M("#a85a56", { rough: 0.55 }); const hairM = M(L.hair, { rough: 0.5 });
  const irisC = L.kind === "ben" ? "#3a2312" : L.kind === "mia" ? "#4a6a8a" : "#4a3220";
  return (
    <group>
      <mesh geometry={B.head} material={VMat()} scale={[0.088, 0.134, 0.108]} castShadow receiveShadow />
      {[-1, 1].map((k) => <group key={k}>
        <F g={B.ear} m={VMat()} p={[k * 0.087, -0.012, -0.012]} />
        {!shadesOn ? <group position={[k * 0.034, 0.016, 0.092]} rotation={[0, k * 0.22, 0]}>
          <F g={fe("eye", 0.0135, 0.0078, 0.006)} m={BM("#e6dfd2")} p={[0, 0, 0]} s={[1, eo, 1]} />
          <F g={fe("iris", 0.0063, 0.0063, 0.004)} m={BM(irisC)} p={[k * -0.0015, 0, 0.0042]} s={[1, Math.min(1, eo + 0.1), 1]} />
          <F g={fe("pup", 0.0032, 0.0032, 0.003)} m={BM("#080606")} p={[k * -0.0015, 0, 0.0068]} s={[1, Math.min(1, eo + 0.1), 1]} />
          <F g={fe("hl", 0.0013, 0.0013, 0.001)} m={BM("#ffffff")} p={[k * -0.003, 0.0022, 0.0088]} />
          <F g={fe("ul", 0.0158, 0.0072, 0.0075)} m={shade} p={[0, 0.0106 - lid * 0.0122 - (1 - eo) * 0.006, 0.0036]} />
          <F g={fe("ll", 0.0145, 0.0034, 0.006)} m={skinM} p={[0, -0.0078, 0.002]} />
          <F g={fb("brow", 0.052, 0.0095, 0.012)} m={hairM} p={[k * 0.003, 0.0275 + by, 0.003]} r={[0, 0, -k * brow]} />
        </group> : null}
      </group>)}
      {shadesOn ? <group position={[0, 0.018, 0.099]}>{[-1, 1].map((k) => <F key={k} g={fb("lens", 0.058, 0.04, 0.012)} m={M("#14161c", { rough: 0.2, metal: 0.4 })} p={[k * 0.037, 0, 0.0]} />)}<F g={fb("br", 0.02, 0.007, 0.008)} m={M("#14161c")} p={[0, 0.008, 0.0]} /><F g={fb("arm", 0.178, 0.007, 0.007)} m={M("#14161c")} p={[0, 0.01, -0.088]} /></group> : null}
      <F g={fb("nb", 0.013, 0.05, 0.014)} m={skinM} p={[0, 0.0, 0.101]} r={[-0.12, 0, 0]} />
      <F g={fe("nt", 0.0115, 0.011, 0.014)} m={skinM} p={[0, -0.026, 0.115]} />
      {[-1, 1].map((k) => <group key={k}><F g={fe("nw", 0.0075, 0.0085, 0.009)} m={skinM} p={[k * 0.0115, -0.03, 0.108]} /><F g={fe("nn", 0.003, 0.002, 0.002)} m={BM("#3a1c14")} p={[k * 0.006, -0.036, 0.122]} /></group>)}
      <group position={[0, -0.074, 0.094]}>
        {open > 0.05 ? <F g={fe("mo", 0.018, 0.014, 0.008)} m={BM("#30080e")} p={[0, -open * 0.004, 0]} s={[1 + open * 0.12, 0.3 + open * 0.9, 1]} /> : null}
        {open > 0.6 ? <F g={fb("teeth", 0.025, 0.006, 0.006)} m={BM("#f4f0e6")} p={[0, 0.004, 0.004]} /> : null}
        <F g={fe("lu", 0.0155, 0.0042, 0.0065)} m={lipM} p={[0, 0.0045 + open * 0.008, 0.0025]} />
        <F g={fe("ll", 0.0135, 0.005, 0.0065)} m={lipM} p={[0, -0.0055 - open * 0.013, 0.0025]} />
        {Math.abs(smile) > 0.05 ? [-1, 1].map((k) => <F key={k} g={fe("lc", 0.005, 0.0035, 0.0045)} m={lipM} p={[k * 0.0175, 0.003 + smile * 0.006, 0.0]} />) : <F g={fb("ml", 0.028, 0.0028, 0.003)} m={BM("#3a1418")} p={[0, -0.0005, 0.006]} />}
        <F g={fe("ch", 0.016, 0.01, 0.009)} m={shade} p={[0, -0.034, -0.01]} />
      </group>
      <F g={fe("an", 0.006, 0.01, 0.006)} m={skinM} p={[0, -0.148, 0.04]} />
    </group>
  );
};
const scalpHair = (look: Look2) => memo("sh" + look.kind + look.hair, () => {
  const r = seeded(look.kind.length * 31 + look.hair.charCodeAt(2)); const parts: THREE.BufferGeometry[] = []; const hc = new THREE.Color(look.hair);
  const A = [0.094, 0.14, 0.113]; const kind = look.kind;
  const rows = kind === "mia" ? 12 : 10; const per = kind === "mia" ? 24 : 20;
  for (let ro = 0; ro < rows; ro++) for (let q = 0; q < per; q++) {
    const phi = ((q + r() * 0.8) / per) * Math.PI * 2; const front = Math.cos(phi); const side = Math.abs(Math.sin(phi));
    let maxT = 1.05 + 0.5 * side + (front < 0 ? 0.55 * -front : 0) + (r() - 0.5) * 0.16;           // hairline: higher at the front, down to the nape
    if (kind === "mia") maxT = 1.0 + 1.1 * side + (front < 0 ? 0.95 * -front : 0.05 * front) + (r() - 0.5) * 0.05;
    const th = 0.06 + (ro / (rows - 1)) * (maxT - 0.06); if (th > maxT) continue;
    const px = A[0] * Math.sin(th) * Math.sin(phi), py = A[1] * Math.cos(th), pz = A[2] * Math.sin(th) * Math.cos(phi);
    const n = new THREE.Vector3(px / (A[0] * A[0]), py / (A[1] * A[1]), pz / (A[2] * A[2])).normalize();
    const t = new THREE.Vector3(A[0] * Math.cos(th) * Math.sin(phi), -A[1] * Math.sin(th), A[2] * Math.cos(th) * Math.cos(phi)).normalize();
    const b = new THREE.Vector3().crossVectors(t, n).normalize(); const t2 = new THREE.Vector3().crossVectors(n, b).normalize();
    const L = (kind === "mia" ? 0.1 + 0.05 * (ro / rows) : kind === "gary" ? 0.035 : kind === "grey" ? 0.055 : 0.06 + 0.02 * (1 - ro / rows)) * (0.85 + r() * 0.4);
    const W = (kind === "mia" ? 0.05 : 0.036) * (0.85 + r() * 0.35);
    const geo = new THREE.BoxGeometry(W, L, 0.006).toNonIndexed(); geo.translate(0, -L * 0.42, 0);
    geo.rotateX(Math.min(0.75, L * 9) + ro * 0.01); const mt = new THREE.Matrix4().makeBasis(b, t2, n); mt.setPosition(px + n.x * (0.004 + r() * 0.006), py + n.y * (0.004 + r() * 0.006), pz + n.z * (0.004 + r() * 0.006)); geo.applyMatrix4(mt);
    geo.deleteAttribute("uv"); geo.computeVertexNormals();
    const k = 0.7 + r() * 0.6 + (kind === "gary" ? 0.2 : 0) + 0.12 * (1 - ro / rows); const c = hc.clone().multiplyScalar(k); const cs = new Float32Array(geo.attributes.position.count * 3); for (let v = 0; v < cs.length; v += 3) { cs[v] = c.r; cs[v + 1] = c.g; cs[v + 2] = c.b; }
    geo.setAttribute("color", new THREE.BufferAttribute(cs, 3)); parts.push(geo);
  }
  const fringeN = kind === "gary" ? 0 : kind === "mia" ? 0 : 9;
  for (let i = 0; i < fringeN; i++) { const x = -0.058 + (i / (fringeN - 1)) * 0.116; const len = 0.045 + (i % 2) * 0.02 + r() * 0.01; const geo = new THREE.ConeGeometry(0.014, len, 4).toNonIndexed(); geo.translate(0, -len / 2, 0); geo.rotateX(-0.45); geo.rotateZ((x) * 1.6); geo.translate(x, 0.105 - Math.abs(x) * 0.25, 0.088 - Math.abs(x) * 0.25); geo.deleteAttribute("uv"); geo.computeVertexNormals(); const c = hc.clone().multiplyScalar(0.9 + r() * 0.4); const cs = new Float32Array(geo.attributes.position.count * 3); for (let v = 0; v < cs.length; v += 3) { cs[v] = c.r; cs[v + 1] = c.g; cs[v + 2] = c.b; } geo.setAttribute("color", new THREE.BufferAttribute(cs, 3)); parts.push(geo); }
  if (kind === "gary") for (let i = 0; i < 9; i++) { const h = 0.17 - Math.abs(i - 4) * 0.018; const geo = new THREE.ConeGeometry(0.022, h, 4).toNonIndexed(); geo.translate(0, h / 2, 0); geo.rotateX(-0.3 + i * 0.075); geo.translate(0, 0.118, 0.085 - i * 0.021); geo.deleteAttribute("uv"); geo.computeVertexNormals(); const c = hc.clone().multiplyScalar(1.0 + (i % 2) * 0.25); const cs = new Float32Array(geo.attributes.position.count * 3); for (let v = 0; v < cs.length; v += 3) { cs[v] = c.r; cs[v + 1] = c.g; cs[v + 2] = c.b; } geo.setAttribute("color", new THREE.BufferAttribute(cs, 3)); parts.push(geo); }
  return mergeGeometries(parts, false)!;
});

/* ---------------------------------------------------------------- the person */
export const Person: React.FC<{ look: Look2; p: V3; yaw?: number; pose?: Pose2; s?: number; itemR?: React.ReactNode; itemL?: React.ReactNode; rim?: string; stain?: boolean }> = ({ look, p, yaw = 0, pose = {}, s = 1, itemR, itemL, rim, stain }) => {
  const { walk, amp = 0.5, crouch = 0, lean = 0, bob = 0, twist = 0, sit = false, rArm, lArm, rElbow = 0.2, lElbow = 0.2, rGrip = 0, lGrip = 0, headX = 0, headY = 0, headZ = 0, expr = "calm", legSpread = 0, shadesOn = !!look.shades, blink = 0, mouthOpen = 0 } = pose;
  const id = `${look.kind}${look.skin}${look.top}${look.pants}${look.hair}`; const B = bodySet(look, id);
  const walking = walk !== undefined; const ph = walk ?? 0;
  const thR = walking ? Math.sin(ph) * amp : 0, thL = walking ? -Math.sin(ph) * amp : 0;
  const knR = walking ? Math.max(0, Math.cos(ph)) * amp * 1.4 : 0, knL = walking ? Math.max(0, -Math.cos(ph)) * amp * 1.4 : 0;
  const cT = sit ? -1.5 : -1.3 * crouch, cK = sit ? 1.5 : 2.4 * crouch;
  const hipsY = sit ? 0.5 : 0.1 + 0.44 * Math.cos(cT) + 0.4 * Math.cos(cT + cK) + 0.07 + (walking ? Math.abs(Math.cos(ph)) * 0.04 : 0) + bob;
  const aR: [number, number] = rArm ?? [walking ? -Math.sin(ph) * amp * 0.9 : 0.05, 0.1]; const aL: [number, number] = lArm ?? [walking ? Math.sin(ph) * amp * 0.9 : 0.05, -0.1];
  const hg = scalpHair(look);
  return (
    <RimCtx.Provider value={rim ?? null}>
      <group position={p} rotation={[0, yaw, 0]} scale={s}>
        <group position={[0, hipsY, 0]}>
          <Leg3 B={B} pos={[-0.12 - legSpread, 0, 0]} th={cT + thL} kn={cK + knL} /><Leg3 B={B} pos={[0.12 + legSpread, 0, 0]} th={cT + thR} kn={cK + knR} />
          <Part g={B.hipsG} p={[0, 0.0, 0]} map="fabric" />
          <mesh position={[0, 0.095, 0]} scale={[1.28, 1, 0.78]} castShadow><cylinderGeometry args={[0.158, 0.162, 0.035, 12]} /><meshStandardMaterial color="#1c1a1e" roughness={0.6} flatShading /></mesh>
          <mesh position={[0, 0.095, 0.131]}><boxGeometry args={[0.04, 0.03, 0.01]} /><meshStandardMaterial color="#c9b27a" metalness={0.7} roughness={0.3} /></mesh>
          <group rotation={[lean, twist, 0]}>
            <Part g={B.torso} p={[0, 0.0, 0]} map="fabric" rx={2} ry={2} />
            {look.vest ? <>{[-1, 1].map((k) => <Part key={k} g={vestG(look.vest!)} p={[k * 0.13, 0.33, 0.14]} r={[0, -k * 0.14, 0]} map="fabric" />)}<Part g={vestBackG(look.vest)} p={[0, 0.33, -0.14]} map="fabric" /></> : null}
            {!look.sleeveless ? <mesh geometry={collar()} material={M(look.topDark, { map: "fabric" })} position={[0, 0.6, 0.0]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[1.05, 0.95, 1.0]} /> : null}
            {stain ? <mesh position={[0.005, 0.38, 0.172]} rotation={[-0.05, 0, 0]}><planeGeometry args={[0.24, 0.24]} /><meshBasicMaterial map={stainTex3()} transparent depthWrite={false} /></mesh> : null}
            {!look.sleeveless ? [0.1, 0.22, 0.31].map((y, i) => <mesh key={i} geometry={wrinkle()} material={M(look.topDark, { rough: 0.95 })} position={[(i - 1) * 0.04, y, 0.168 - Math.abs(i - 1) * 0.02]} rotation={[0, 0, (i - 1) * 0.25]} />) : null}
            <Part g={B.neck} p={[0, 0.74, 0.012]} />
            <group position={[0, 0.8, 0.022]} rotation={[headX, headY, headZ]} scale={1.18}>
              <Face3 B={B} L={look} expr={expr as string} shadesOn={shadesOn} blink={blink} mouth={mouthOpen} />
              <Part g={hg} rough={0.4} hull={false} />
            </group>
            <Part g={B.delt} p={[-0.262, 0.49, 0]} /><Part g={B.delt} p={[0.262, 0.49, 0]} />
            <Arm3 B={B} L={look} pos={[-0.275, 0.49, 0]} rx={aL[0]} rz={aL[1]} elbow={lElbow} side={-1} grip={lGrip} item={itemL} />
            <Arm3 B={B} L={look} pos={[0.275, 0.49, 0]} rx={aR[0]} rz={aR[1]} elbow={rElbow} side={1} grip={rGrip} item={itemR} />
          </group>
        </group>
      </group>
    </RimCtx.Provider>
  );
};
const vestG = (c: string) => memo("vest" + c, () => paint(new THREE.BoxGeometry(0.11, 0.5, 0.02, 1, 3, 1), c, 0.1, 21, 0.1));
const vestBackG = (c: string) => memo("vestb" + c, () => paint(new THREE.BoxGeometry(0.3, 0.5, 0.02, 2, 3, 1), c, 0.1, 22, 0.1));
const collar = () => memo("collar", () => new THREE.TorusGeometry(0.1, 0.012, 5, 12));
const wrinkle = () => memo("wr", () => new THREE.BoxGeometry(0.11, 0.012, 0.012));
const stainTex3 = () => memo("stain3", () => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; g.fillStyle = "#5a3418"; g.beginPath(); g.arc(128, 128, 76, 0, 7); g.fill(); return new THREE.CanvasTexture(c); });
