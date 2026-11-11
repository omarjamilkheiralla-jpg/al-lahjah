import * as THREE from "three";
import React, { useMemo, useRef, useLayoutEffect } from "react";
import { Ink, box, toon as toonKit, rng, clamp } from "../hotel/kit";
const tcache = new Map<string, THREE.MeshToonMaterial>();
const toon = (c: string | THREE.Texture, extra: Partial<THREE.MeshToonMaterialParameters> = {}) => { if (typeof c !== "string") return toonKit(c, extra); const key = c + JSON.stringify(extra); let m = tcache.get(key); if (!m) { m = toonKit(c, extra); tcache.set(key, m); } return m; };
const gcache = new Map<string, THREE.BufferGeometry>();
export const geo = (k: string, ...a: (number | boolean)[]): THREE.BufferGeometry => { const key = k + a.join(","); let g = gcache.get(key); if (!g) { g = new (THREE as any)[k + "Geometry"](...a); gcache.set(key, g!); } return g!; };
import { cv } from "../emu/world";
import { INKD } from "../full/paint";

export type V3 = [number, number, number];
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const blur = (g: CanvasRenderingContext2D, px: number, fn: () => void) => { g.filter = `blur(${px}px)`; fn(); g.filter = "none"; };
const wrap = (w: number, h: number, fn: (ox: number, oy: number) => void) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); };
const grain = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n = 1500, a = 0.04) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(40,26,30,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 2, 2); } };
const repCache = new Map<string, THREE.Texture>();
const rep = (t: THREE.Texture, rx: number, ry: number) => { const key = t.uuid + ":" + rx.toFixed(2) + ":" + ry.toFixed(2); let c = repCache.get(key); if (!c) { c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); repCache.set(key, c); } return c; };

const clockFace = new THREE.MeshBasicMaterial({ color: "#f6efd8" }); const clockInk = new THREE.MeshBasicMaterial({ color: INKD });
/* ------------------------------------------------------------------ textures */
export const grassTex = () => memo("grass", () => cv(512, 512, (g, w, h) => {
  const r = rng(3); g.fillStyle = "#6aa84a"; g.fillRect(0, 0, w, h);
  blur(g, 26, () => { for (let i = 0; i < 70; i++) { g.fillStyle = ["#7cba58", "#5c9a40", "#86c25f", "#4f8c3a"][i % 4]; const x = r() * w, y = r() * h, rr = 40 + r() * 80; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr, rr * 0.7, r() * 3, 0, 7); g.fill(); }); } });
  for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < 0.5 ? "#3f7a30" : "#9ad06a"; wrap(w, h, (ox, oy) => { g.beginPath(); g.moveTo(x + ox - 3, y + oy); g.lineTo(x + ox, y + oy - 12 - r() * 8); g.lineTo(x + ox + 3, y + oy); g.fill(); }); }
  for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h; g.fillStyle = ["#fff2a8", "#ffffff", "#f6a8c0"][i % 3]; wrap(w, h, (ox, oy) => { g.beginPath(); g.arc(x + ox, y + oy, 3.2, 0, 7); g.fill(); }); }
  grain(g, w, h, 4, 1800, 0.035);
}, true));
export const roadTex = () => memo("road", () => cv(512, 512, (g, w, h) => {
  const r = rng(8); g.fillStyle = "#5a5a64"; g.fillRect(0, 0, w, h);
  blur(g, 22, () => { for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? "rgba(30,30,40,.07)" : "rgba(200,200,215,.06)"; const x = r() * w, y = r() * h, rr = 40 + r() * 70; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr, rr * 0.6, r() * 3, 0, 7); g.fill(); }); } });
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(20,20,28,.22)" : "rgba(220,220,235,.2)"; const x = r() * w, y = r() * h; wrap(w, h, (ox, oy) => g.fillRect(x + ox, y + oy, 2 + r() * 2, 2 + r() * 2)); }
}, true));
export const paverTex = () => memo("paver", () => cv(256, 256, (g, w, h) => {
  const r = rng(12); g.fillStyle = "#c9c0b0"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = ["#d3cab9", "#c2b9a8", "#cdc4b3", "#bdb4a3"][Math.floor(r() * 4)]; g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
  grain(g, w, h, 6, 900, 0.05);
}, true));
const brickTex = (c: string) => memo("brick" + c, () => cv(256, 256, (g, w, h) => {
  const r = rng(c.length * 7 + c.charCodeAt(1)); g.fillStyle = "#b8a99a"; g.fillRect(0, 0, w, h);
  const bh = 32, bw = 64; for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const ox = (y % 2) * 32; g.fillStyle = c; g.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, bh - 6); g.fillStyle = `rgba(${r() < 0.5 ? "255,235,210" : "40,20,10"},${0.04 + r() * 0.1})`; g.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, bh - 6); }
  grain(g, w, h, 5, 1200, 0.04);
}, true));
const sidingTex = (c: string) => memo("siding" + c, () => cv(128, 256, (g, w, h) => {
  g.fillStyle = c; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { const y = i * 32; const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, "rgba(255,255,255,.14)"); gr.addColorStop(0.85, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.2)"); g.fillStyle = gr; g.fillRect(0, y, w, 32); }
  grain(g, w, h, 9, 500, 0.03);
}, true));
export const signTex = (text: string, bg = "#f1e3b8", fg = "#7a1f22", w = 1024, h = 256) => memo(`sign${text}${bg}${fg}${w}`, () => cv(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.22)"); gr.addColorStop(1, "rgba(0,0,0,.16)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = INKD; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h - 52);
  let fs = h * 0.62; g.font = `400 ${fs}px 'Lilita One', Impact, sans-serif`; while (g.measureText(text).width > w - 120 && fs > 20) { fs -= 4; g.font = `400 ${fs}px 'Lilita One', Impact, sans-serif`; }
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = fs * 0.14; g.strokeStyle = "rgba(255,255,255,.5)"; g.strokeText(text, w / 2, h / 2 + fs * 0.04); g.fillStyle = fg; g.fillText(text, w / 2, h / 2 + fs * 0.04);
}));
export const billTex = () => memo("bill", () => cv(256, 128, (g, w, h) => {
  g.fillStyle = "#7fbf6a"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2f6a3a"; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = "#a6d98f"; g.beginPath(); g.ellipse(w / 2, h / 2, 34, 40, 0, 0, 7); g.fill(); g.strokeStyle = "#2f6a3a"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#2f6a3a"; g.font = "700 40px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", w / 2, h / 2 + 2); g.font = "700 26px Georgia, serif"; g.fillText("1M", 38, 32); g.fillText("1M", w - 38, h - 32);
}));
export const awningTex = (a: string, b: string) => memo("awn" + a + b, () => cv(128, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 16, 0, 16, h); } const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.18)"); gr.addColorStop(1, "rgba(0,0,0,.22)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true));
const glowTex = () => memo("glow", () => cv(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); }));

/* ------------------------------------------------------------------ ground + street */
export const Ground: React.FC<{ w?: number; d?: number; z?: number }> = ({ w = 400, d = 300, z = -40 }) => {
  const m = useMemo(() => toon(rep(grassTex(), w / 14, d / 14)), [w, d]);
  return <mesh material={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, z]}><planeGeometry args={[w, d]} /></mesh>;
};
export const Street: React.FC<{ x0?: number; x1?: number; z0?: number; z1?: number; dashes?: boolean }> = ({ x0 = -60, x1 = 60, z0 = -1.2, z1 = 5.6, dashes = true }) => {
  const rm = useMemo(() => toon(rep(roadTex(), (x1 - x0) / 8, (z1 - z0) / 8)), [x0, x1, z0, z1]);
  const pm = useMemo(() => toon(rep(paverTex(), (x1 - x0) / 3, 1)), [x0, x1]);
  const pm2 = useMemo(() => toon(rep(paverTex(), (x1 - x0) / 3, 1)), [x0, x1]);
  const curb = useMemo(() => toon("#d8d0c0"), []); const dash = useMemo(() => toon("#f2e8c0"), []);
  const cx = (x0 + x1) / 2, W = x1 - x0;
  return (
    <group>
      <mesh material={rm} rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.005, (z0 + z1) / 2]}><planeGeometry args={[W, z1 - z0]} /></mesh>
      <Ink geometry={box(W, 0.22, 3.2)} material={pm} position={[cx, 0.08, z0 - 1.6]} px={2} cast={false} />
      <Ink geometry={box(W, 0.22, 3.2)} material={pm2} position={[cx, 0.08, z1 + 1.6]} px={2} cast={false} />
      <Ink geometry={box(W, 0.2, 0.22)} material={curb} position={[cx, 0.1, z0 - 0.02]} px={1.6} cast={false} />
      <Ink geometry={box(W, 0.2, 0.22)} material={curb} position={[cx, 0.1, z1 + 0.02]} px={1.6} cast={false} />
      {dashes ? Array.from({ length: Math.floor(W / 3.4) }, (_, i) => <mesh key={i} material={dash} rotation={[-Math.PI / 2, 0, 0]} position={[x0 + 1.7 + i * 3.4, 0.012, (z0 + z1) / 2]}><planeGeometry args={[1.8, 0.16]} /></mesh>) : null}
    </group>
  );
};

/* ------------------------------------------------------------------ buildings */
export type BProps = { p: V3; w: number; h: number; d?: number; rot?: number; wall?: string; wallKind?: "brick" | "siding" | "paint"; roof?: string; roofType?: "flat" | "gable"; sign?: string; signBg?: string; signFg?: string; awning?: [string, string]; doorColor?: string; cols?: number; floors?: number; lit?: boolean; shopFront?: boolean; chimney?: boolean; pediment?: boolean; columns?: boolean; clock?: boolean; simple?: boolean };
const BuildingImpl: React.FC<BProps> = ({ p, w, h, d = 6, rot = 0, wall = "#c06a4a", wallKind = "brick", roof = "#5a3a34", roofType = "flat", sign, signBg, signFg, awning, doorColor = "#5a3418", cols, floors = 2, lit = true, shopFront = false, chimney = false, pediment = false, columns = false, clock = false, simple = false }) => {
  const wm = useMemo(() => toon(wallKind === "brick" ? rep(brickTex(wall), w / 3.4, h / 3.4) : wallKind === "siding" ? rep(sidingTex(wall), w / 3, h / 3) : wall), [wall, wallKind, w, h]);
  const rm = useMemo(() => toon(roof), [roof]); const trim = useMemo(() => toon("#f1e8d4"), []); const dark = useMemo(() => toon("#3a2630"), []);
  const door = useMemo(() => toon(doorColor), [doorColor]);
  const chimM = useMemo(() => toon(rep(brickTex("#a8553a"), 0.5, 1)), []); const knob = useMemo(() => toon("#d8b24a"), []);
  const glass = useMemo(() => new THREE.MeshBasicMaterial({ color: lit ? "#ffe2a0" : "#9cc4dc" }), [lit]);
  const glassSky = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a8d0e6" }), []);
  const nC = cols ?? Math.max(2, Math.round(w / 2.6)); const fh = (shopFront ? h - 3.6 : h) / Math.max(1, shopFront ? floors - 1 : floors);
  const gable = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.35, 0); s.lineTo(w / 2 + 0.35, 0); s.lineTo(0, w * 0.3); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: d + 0.7, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }); }, [w, d]);
  const signM = useMemo(() => (sign ? new THREE.MeshBasicMaterial({ map: signTex(sign, signBg, signFg) }) : null), [sign, signBg, signFg]);
  const awnM = useMemo(() => (awning ? toon(rep(awningTex(awning[0], awning[1]), 1, 1), { side: THREE.DoubleSide }) : null), [awning]);
  const feat = useMemo(() => { const r = rng(Math.floor(Math.abs(p[0]) * 13 + h * 7 + 1)); return { tank: r() < 0.35, ac: Math.floor(r() * 3), balc: !shopFront && floors >= 3 && r() < 0.65, flowers: r() < 0.5, plants: r() < 0.7, blade: shopFront && r() < 0.65, pil: r() < 0.7, fcol: ["#e8506a", "#f2c53a", "#ffffff", "#b86ad8", "#ff8a3a"][Math.floor(r() * 5)], vent: r() < 0.5 }; }, [p, h, shopFront, floors]);
  const fboxM = toon("#6a4630"), fleafM = toon("#4f9a46"), fblomM = toon(feat.fcol), metalM = toon("#c8ccd4"), tankM = toon("#8a5a34"), railM = toon("#2f3a3a");
  const wins: React.ReactNode[] = [];
  for (let f = shopFront ? 1 : 0; f < floors; f++) for (let c = 0; c < nC; c++) {
    const x = -w / 2 + ((c + 0.5) * w) / nC; const y = (shopFront ? 3.6 : 0) + (f - (shopFront ? 1 : 0)) * fh + fh * 0.58; if (f === 0 && !shopFront && Math.abs(x) < 0.9) continue;
    wins.push(simple ? <group key={`${f}_${c}`} position={[x, y, d / 2]}>
      <Ink geometry={box(1.1, 1.4, 0.12)} material={trim} px={1.2} cast={false} outline={false} />
      <mesh material={glass} position={[0, 0, 0.08]}><planeGeometry args={[0.84, 1.14]} /></mesh>{feat.flowers && f >= 1 ? <FlowerBox m1={fboxM} m2={fleafM} m3={fblomM} /> : null}
      <mesh material={trim} position={[0, 0, 0.1]}><boxGeometry args={[0.07, 1.14, 0.05]} /></mesh>
      <Ink geometry={box(1.35, 0.14, 0.3)} material={trim} position={[0, -0.76, 0.1]} px={1.2} cast={false} outline={false} />
    </group> : <group key={`${f}_${c}`} position={[x, y, d / 2]}>
      <Ink geometry={box(1.15, 1.45, 0.14)} material={trim} px={1.4} cast={false} />
      <mesh material={glass} position={[0, 0, 0.09]}><planeGeometry args={[0.86, 1.16]} /></mesh>{feat.flowers && f >= 1 ? <FlowerBox m1={fboxM} m2={fleafM} m3={fblomM} /> : null}
      <Ink geometry={box(0.06, 1.16, 0.06)} material={trim} position={[0, 0, 0.11]} px={1} cast={false} /><Ink geometry={box(0.86, 0.06, 0.06)} material={trim} position={[0, 0, 0.11]} px={1} cast={false} />
      <Ink geometry={box(1.4, 0.14, 0.34)} material={trim} position={[0, -0.78, 0.1]} px={1.4} cast={false} />
      <Ink geometry={box(0.28, 1.3, 0.1)} material={dark} position={[-0.74, 0, 0.06]} px={1} cast={false} /><Ink geometry={box(0.28, 1.3, 0.1)} material={dark} position={[0.74, 0, 0.06]} px={1} cast={false} />
    </group>);
  }
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Ink geometry={box(w, h, d)} material={wm} position={[0, h / 2, 0]} px={2.4} />
      <Ink geometry={box(w + 0.5, 0.22, d + 0.5)} material={trim} position={[0, 0.11, 0]} px={1.6} cast={false} />
      {roofType === "gable" ? <Ink geometry={gable} material={rm} position={[0, h, -d / 2 - 0.35]} px={2.2} /> : (<>
        <Ink geometry={box(w + 0.5, 0.5, d + 0.5)} material={trim} position={[0, h + 0.1, 0]} px={2} />
        <Ink geometry={box(w - 0.2, 0.2, d - 0.2)} material={rm} position={[0, h + 0.45, 0]} px={1.6} cast={false} />
      </>)}
      {chimney ? <Ink geometry={box(0.8, 2.4, 0.8)} material={chimM} position={[w * 0.28, h + w * 0.18, -d * 0.2]} px={1.8} /> : null}
      {feat.pil ? [-1, 1].map((k) => <Ink key={k} geometry={box(0.36, h, 0.16)} material={trim} position={[k * (w / 2 - 0.16), h / 2, d / 2 + 0.07]} px={1.2} cast={false} outline={false} />) : null}
      {roofType === "flat" && feat.tank ? <group position={[-w * 0.22, h + 0.55, -d * 0.12]}>{[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => <mesh key={i} material={railM} position={[x, 0.5, z]}><boxGeometry args={[0.1, 1.0, 0.1]} /></mesh>)}<Ink geometry={geo("Cylinder", 0.78, 0.78, 1.3, 14)} material={tankM} position={[0, 1.6, 0]} px={1.6} cast={false} /><Ink geometry={geo("Cone", 0.9, 0.55, 14)} material={railM} position={[0, 2.5, 0]} px={1.4} cast={false} /></group> : null}
      {roofType === "flat" ? Array.from({ length: feat.ac }, (_, i) => <Ink key={i} geometry={box(1.0, 0.6, 0.8)} material={metalM} position={[w * 0.22 + i * 1.3 - 0.6, h + 0.75, d * 0.1]} px={1.2} cast={false} outline={false} />) : null}
      {roofType === "flat" && feat.vent ? <mesh material={railM} position={[w * 0.05, h + 1.4, -d * 0.25]}><cylinderGeometry args={[0.04, 0.04, 2.0, 6]} /></mesh> : null}
      {feat.balc ? Array.from({ length: floors - 1 }, (_, fi) => { const y = (fi + 1) * fh + fh * 0.58 - 0.55; return <group key={fi} position={[0, y, d / 2 + 0.5]}><Ink geometry={box(2.1, 0.14, 0.95)} material={trim} px={1.2} cast={false} outline={false} /><Ink geometry={box(2.1, 0.07, 0.07)} material={railM} position={[0, 0.55, 0.44]} px={1} cast={false} outline={false} />{[-1, -0.5, 0, 0.5, 1].map((x, i) => <mesh key={i} material={railM} position={[x, 0.3, 0.44]}><boxGeometry args={[0.05, 0.5, 0.05]} /></mesh>)}</group>; }) : null}
      {feat.plants ? [shopFront ? -w / 2 + 0.7 : -1.45, shopFront ? w / 2 - 0.7 : 1.45].map((x, i) => <group key={i} position={[x, 0, d / 2 + 0.95]}><Ink geometry={geo("Cylinder", 0.28, 0.2, 0.5, 10)} material={toon("#b8683a")} position={[0, 0.3, 0]} px={1.2} cast={false} outline={false} /><Ink geometry={geo("Sphere", 0.38, 10, 8)} material={fleafM} position={[0, 0.85, 0]} px={1.2} cast={false} outline={false} /></group>) : null}
      {feat.blade && signM ? <group position={[-w / 2 + 0.45, 3.2, d / 2 + 0.7]}><Ink geometry={box(0.08, 0.08, 1.2)} material={railM} position={[0, 0.5, 0]} px={1} cast={false} outline={false} /><Ink geometry={box(0.12, 0.7, 0.95)} material={toon(signFg ?? "#7a1f22")} position={[0, 0, 0.1]} px={1.2} cast={false} /></group> : null}
      {wins}
      {/* door */}
      {!shopFront ? <group position={[0, 0, d / 2]}>
        <Ink geometry={box(1.6, 2.5, 0.16)} material={trim} position={[0, 1.25, 0]} px={1.6} cast={false} />
        <Ink geometry={box(1.25, 2.25, 0.2)} material={door} position={[0, 1.14, 0.06]} px={1.4} cast={false} />
        <mesh position={[0.4, 1.1, 0.19]} material={knob}><sphereGeometry args={[0.07, 8, 8]} /></mesh>
        <Ink geometry={box(2.4, 0.2, 1.2)} material={trim} position={[0, 0.1, 0.7]} px={1.4} cast={false} />
      </group> : <group position={[0, 0, d / 2]}>
        <Ink geometry={box(Math.min(w - 1.6, 5.6), 2.6, 0.18)} material={dark} position={[-0.2, 1.5, 0]} px={1.6} cast={false} />
        <mesh material={glassSky} position={[-0.2, 1.5, 0.11]}><planeGeometry args={[Math.min(w - 2.1, 5.1), 2.2]} /></mesh>
        <Ink geometry={box(1.3, 2.5, 0.18)} material={door} position={[w / 2 - 1.2, 1.25, 0.02]} px={1.4} cast={false} />
        <Ink geometry={box(w + 0.2, 0.18, 0.4)} material={trim} position={[0, 3.45, 0.1]} px={1.4} cast={false} />
      </group>}
      {signM ? <group position={[0, shopFront ? 3.95 : h - 0.7, d / 2 + 0.2]}><Ink geometry={box(Math.min(w - 0.8, 6), 0.9, 0.16)} material={dark} px={1.6} cast={false} /><mesh material={signM} position={[0, 0, 0.09]}><planeGeometry args={[Math.min(w - 1.0, 5.8), 0.78]} /></mesh></group> : null}
      {awnM ? <Ink geometry={box(Math.min(w - 0.6, 6.2), 0.12, 1.4)} material={awnM} position={[0, 3.2, d / 2 + 0.75]} rotation={[0.28, 0, 0]} px={1.6} cast={false} /> : null}
      {columns ? [-1, 1, -0.5, 0.5].map((k, i) => <Ink key={i} geometry={geo("Cylinder", 0.28, 0.32, h * 0.82, 14)} material={trim} position={[k * w * 0.36, h * 0.41, d / 2 + 1.2]} px={1.6} cast={false} />) : null}
      {pediment ? <Ink geometry={gable} material={trim} position={[0, h * 0.82, d / 2 - 0.3]} scale={[0.85, 0.7, 0.28]} px={1.6} /> : null}
      {clock ? <group position={[0, h + 3.6, 0]}>
        <Ink geometry={box(2.4, 5.2, 2.4)} material={wm} position={[0, -0.4, 0]} px={2} />
        <mesh position={[0, 0.8, 1.22]} material={clockFace}><circleGeometry args={[0.85, 28]} /></mesh>
        <mesh position={[0, 0.8, 1.24]} material={clockInk}><boxGeometry args={[0.1, 0.55, 0.02]} /></mesh>
        <mesh position={[0.18, 0.8, 1.24]} rotation={[0, 0, -1.2]} material={clockInk}><boxGeometry args={[0.1, 0.4, 0.02]} /></mesh>
        <Ink geometry={geo("Cone", 1.9, 2.2, 4)} material={rm} position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} px={2} />
      </group> : null}
    </group>
  );
};

const FlowerBox: React.FC<{ m1: THREE.Material; m2: THREE.Material; m3: THREE.Material }> = ({ m1, m2, m3 }) => (
  <group position={[0, -0.92, 0.3]}><mesh material={m1}><boxGeometry args={[1.2, 0.22, 0.3]} /></mesh>{[-0.4, 0, 0.4].map((x, i) => <mesh key={i} material={i === 1 ? m3 : m2} position={[x, 0.16, 0]}><sphereGeometry args={[0.15, 8, 6]} /></mesh>)}{[-0.2, 0.2].map((x, i) => <mesh key={i} material={m3} position={[x, 0.22, 0.04]}><sphereGeometry args={[0.1, 8, 6]} /></mesh>)}</group>
);
export const Building = React.memo(BuildingImpl);
/* ------------------------------------------------------------------ street props */
export const Tree: React.FC<{ p: V3; s?: number; seed?: number; col?: string }> = ({ p, s = 1, seed = 1, col = "#4f9a46" }) => {
  const trunk = useMemo(() => toon("#6a4630"), []); const leaf = useMemo(() => [toon(col), toon("#5fae55"), toon("#3f8a3e")], [col]);
  const ico = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []); const r = useMemo(() => rng(seed * 11), [seed]);
  const blobs = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ x: (r() - 0.5) * 1.7, y: 3.4 + r() * 1.5, z: (r() - 0.5) * 1.5, s: 1.1 + r() * 0.7, m: i % 3 })), [r]);
  return <group position={p} scale={s}>
    <Ink geometry={geo("Cylinder", 0.28, 0.42, 3.6, 10)} material={trunk} position={[0, 1.8, 0]} px={2} />
    {blobs.map((b, i) => <Ink key={i} geometry={ico} material={leaf[b.m]} position={[b.x, b.y, b.z]} scale={b.s} px={2.2} />)}
  </group>;
};
export const Lamp: React.FC<{ p: V3; on?: boolean }> = ({ p }) => {
  const m = useMemo(() => toon("#2f3a3a"), []); const g = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffeaa8" }), []);
  return <group position={p}><Ink geometry={geo("Cylinder", 0.07, 0.12, 4.2, 8)} material={m} position={[0, 2.1, 0]} px={1.6} cast={false} /><Ink geometry={geo("Sphere", 0.28, 12, 10)} material={g} position={[0, 4.4, 0]} px={1.6} cast={false} /><Ink geometry={box(0.5, 0.1, 0.5)} material={m} position={[0, 4.18, 0]} px={1.2} cast={false} /></group>;
};
export const Bench: React.FC<{ p: V3; rot?: number }> = ({ p, rot = 0 }) => { const w = useMemo(() => toon("#8a5a34"), []); const l = useMemo(() => toon("#2f3a3a"), []); return <group position={p} rotation={[0, rot, 0]}><Ink geometry={box(1.8, 0.1, 0.5)} material={w} position={[0, 0.5, 0]} px={1.4} cast={false} /><Ink geometry={box(1.8, 0.5, 0.08)} material={w} position={[0, 0.85, -0.22]} px={1.4} cast={false} />{[-0.8, 0.8].map((x, i) => <Ink key={i} geometry={box(0.08, 0.5, 0.5)} material={l} position={[x, 0.25, 0]} px={1.2} cast={false} />)}</group>; };
export const Hills: React.FC = () => {
  const cols = ["#9bc08a", "#82ae78", "#6f9a68"];
  const hills = useMemo(() => { const r = rng(5); const a: { x: number; z: number; w: number; h: number; c: number }[] = []; [[-120, 18, 0], [-95, 12, 1], [-75, 8, 2]].forEach(([z, h, c]) => { for (let i = 0; i < 9; i++) a.push({ x: -150 + i * 36 + r() * 16, z: z + r() * 10, w: 26 + r() * 10, h: h * (0.7 + r() * 0.6), c }); }); return a; }, []);
  return <group>{hills.map((q, i) => <mesh key={i} position={[q.x, -q.h * 0.25, q.z]} scale={[q.w, q.h, q.w * 0.6]}><sphereGeometry args={[1, 24, 12]} /><meshBasicMaterial color={cols[q.c]} fog /></mesh>)}</group>;
};

/* ------------------------------------------------------------------ vehicles */
const carProfile = (len: number, hh: number) => { const s = new THREE.Shape(); const L = len / 2; s.moveTo(-L, 0.3); s.lineTo(-L, 0.85); s.lineTo(-L * 0.62, 0.95); s.lineTo(-L * 0.38, 1.55); s.lineTo(L * 0.28, 1.55); s.lineTo(L * 0.62, 0.95); s.lineTo(L, 0.85); s.lineTo(L, 0.3); s.closePath(); return s; };
export const Car: React.FC<{ p: V3; color?: string; rot?: number; s?: number; spin?: number; bounce?: number }> = ({ p, color = "#c8403a", rot = 0, s = 1, spin = 0, bounce = 0 }) => {
  const body = useMemo(() => new THREE.ExtrudeGeometry(carProfile(4.2, 1.5), { depth: 1.7, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 3 }), []);
  const win = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-1.35, 1.0); sh.lineTo(-0.85, 1.46); sh.lineTo(1.0, 1.46); sh.lineTo(1.5, 1.0); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 1.84, bevelEnabled: false }); }, []);
  const m = useMemo(() => toon(color), [color]); const gl = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a8d4ea" }), []); const tire = useMemo(() => toon("#2a2628"), []); const hub = useMemo(() => toon("#c8ccd4"), []);
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.46, 0.46, 0.3, 18), []); const hl = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff2b8" }), []);
  return <group position={[p[0], p[1] + bounce, p[2]]} rotation={[0, rot, 0]} scale={s}>
    <Ink geometry={body} material={m} position={[0, 0.05, -0.85]} px={2} />
    <mesh geometry={win} material={gl} position={[0, 0.05, -0.92]} />
    {[[-1.4, 0.82], [1.4, 0.82], [-1.4, -0.82], [1.4, -0.82]].map(([x, z], i) => <group key={i} position={[x, 0.46, z]}><Ink geometry={wheel} material={tire} rotation={[Math.PI / 2, 0, 0]} px={1.6} cast={false} /><mesh geometry={geo("Cylinder", 0.22, 0.22, 0.34, 12)} material={hub} rotation={[Math.PI / 2, spin, 0]} /></group>)}
    {[-0.55, 0.55].map((z, i) => <mesh key={i} material={hl} position={[2.12, 0.78, z]}><sphereGeometry args={[0.16, 10, 8]} /></mesh>)}
    <Ink geometry={box(0.2, 0.2, 1.6)} material={hub} position={[2.12, 0.42, 0]} px={1.2} cast={false} /><Ink geometry={box(0.2, 0.2, 1.6)} material={hub} position={[-2.12, 0.42, 0]} px={1.2} cast={false} />
  </group>;
};
export const Boat: React.FC<{ p: V3; rot?: number; s?: number }> = ({ p, rot = 0, s = 1 }) => {
  const hull = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-3, 0.9); sh.quadraticCurveTo(-2.6, 0, 0, 0); sh.quadraticCurveTo(2.2, 0, 3.6, 1.1); sh.lineTo(3.6, 1.5); sh.lineTo(-3, 1.4); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3 }); }, []);
  const white = useMemo(() => toon("#f2eee2"), []); const blue = useMemo(() => toon("#2f6aa8"), []); const wood = useMemo(() => toon("#8a5a34"), []); const sail = useMemo(() => toon("#f6f1e2", { side: THREE.DoubleSide }), []); const tire = useMemo(() => toon("#2a2628"), []);
  const sailG = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 4.8); sh.lineTo(2.4, 0.3); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); }, []);
  return <group position={p} rotation={[0, rot, 0]} scale={s}>
    <Ink geometry={hull} material={white} position={[0, 0.9, -0.9]} px={2.2} />
    <Ink geometry={box(6.4, 0.3, 1.9)} material={blue} position={[0.3, 1.55, 0]} px={1.6} cast={false} />
    <Ink geometry={box(1.7, 0.9, 1.2)} material={wood} position={[0.8, 2.2, 0]} px={1.6} />
    <Ink geometry={geo("Cylinder", 0.07, 0.07, 5.4, 8)} material={wood} position={[-0.8, 4.2, 0]} px={1.4} cast={false} />
    <Ink geometry={sailG} material={sail} position={[-0.7, 1.9, 0.02]} px={1.6} cast={false} />
    <Ink geometry={box(5.6, 0.2, 0.2)} material={wood} position={[0.2, 0.62, 0.55]} px={1.4} cast={false} /><Ink geometry={box(5.6, 0.2, 0.2)} material={wood} position={[0.2, 0.62, -0.55]} px={1.4} cast={false} />
    {[1.4, -1.0].map((x, i) => <Ink key={i} geometry={geo("Cylinder", 0.5, 0.5, 0.3, 16)} material={tire} position={[x, 0.5, 1.15]} rotation={[Math.PI / 2, 0, 0]} px={1.4} cast={false} />)}
    {[1.4, -1.0].map((x, i) => <Ink key={i} geometry={geo("Cylinder", 0.5, 0.5, 0.3, 16)} material={tire} position={[x, 0.5, -1.15]} rotation={[Math.PI / 2, 0, 0]} px={1.4} cast={false} />)}
  </group>;
};
export const Helicopter: React.FC<{ p: V3; t: number; rot?: number; s?: number; tilt?: number }> = ({ p, t, rot = 0, s = 1, tilt = 0 }) => {
  const red = useMemo(() => toon("#d8483a"), []); const wh = useMemo(() => toon("#f4efe2"), []); const dk = useMemo(() => toon("#2f3a3e"), []); const gl = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a8d4ea" }), []);
  const disc = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }), []);
  return <group position={p} rotation={[tilt, rot, 0]} scale={s}>
    <Ink geometry={geo("Sphere", 1.5, 22, 16)} material={red} scale={[1.35, 1, 1]} position={[0, 1.4, 0]} px={2.2} />
    <mesh material={gl} position={[1.35, 1.55, 0]} scale={[0.8, 0.8, 0.95]}><sphereGeometry args={[1.0, 18, 12, 0, Math.PI]} /></mesh>
    <Ink geometry={geo("Cylinder", 0.28, 0.55, 3.8, 12)} material={wh} position={[-3.3, 1.7, 0]} rotation={[0, 0, Math.PI / 2 + 0.06]} px={1.8} />
    <Ink geometry={box(0.22, 1.5, 0.12)} material={red} position={[-5.0, 2.4, 0]} px={1.4} cast={false} />
    <Ink geometry={geo("Cylinder", 0.12, 0.12, 0.7, 8)} material={dk} position={[0, 3.0, 0]} px={1.2} cast={false} />
    <group position={[0, 3.4, 0]} rotation={[0, t * 18, 0]}>{[0, 1, 2, 3].map((i) => <Ink key={i} geometry={box(3.4, 0.07, 0.3)} material={dk} position={[Math.cos((i * Math.PI) / 2) * 1.7, 0, Math.sin((i * Math.PI) / 2) * 1.7]} rotation={[0, -(i * Math.PI) / 2, 0]} px={1} cast={false} />)}</group>
    <mesh material={disc} position={[0, 3.4, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[3.5, 36]} /></mesh>
    {[-0.9, 0.9].map((z, i) => <group key={i}><Ink geometry={box(3.4, 0.14, 0.14)} material={dk} position={[0.2, 0.05, z]} px={1.2} cast={false} /><Ink geometry={box(0.1, 0.9, 0.1)} material={dk} position={[-0.8, 0.5, z]} px={1.2} cast={false} /><Ink geometry={box(0.1, 0.9, 0.1)} material={dk} position={[1.0, 0.5, z]} px={1.2} cast={false} /></group>)}
  </group>;
};

/* ------------------------------------------------------------------ money + misc */
export const Bills: React.FC<{ t: number; n?: number; area?: V3; center?: V3; born?: number; fall?: number; seed?: number }> = ({ t, n = 90, area = [18, 10, 12], center = [0, 0, 0], born = 0, fall = 1.6, seed = 3 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(0.5, 0.25), []); const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: billTex(), side: THREE.DoubleSide }), []);
  const pts = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => ({ x: (r() - 0.5) * area[0], y: r() * area[1], z: (r() - 0.5) * area[2], ph: r() * 6, sp: 0.7 + r() * 0.7, rs: 1.5 + r() * 3 })); }, [n, area, seed]);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return; const o = new THREE.Object3D(); const age = Math.max(0, t - born);
    pts.forEach((q, i) => { const yy = q.y - age * fall * q.sp; const wrapY = ((yy % area[1]) + area[1]) % area[1]; o.position.set(center[0] + q.x + Math.sin(age * 1.3 + q.ph) * 0.8, center[1] + wrapY, center[2] + q.z + Math.cos(age + q.ph) * 0.5); o.rotation.set(age * q.rs + q.ph, age * q.rs * 0.7, age * q.rs * 0.4); o.scale.setScalar(age > 0 ? 1 : 0.001); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};
export const Sun: React.FC<{ p: V3; s?: number }> = ({ p, s = 30 }) => { const m = useMemo(() => new THREE.SpriteMaterial({ map: glowTex(), color: "#fff0b0", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []); return <sprite material={m} position={p} scale={[s, s, 1]} />; };
export const Board: React.FC<{ p: V3; w: number; h: number; tex: THREE.Texture; rot?: number; legs?: boolean; px?: number }> = ({ p, w, h, tex, rot = 0, legs = true, px = 2 }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tex }), [tex]); const wood = useMemo(() => toon("#6a4630"), []); const dk = useMemo(() => toon("#3a2630"), []);
  return <group position={p} rotation={[0, rot, 0]}>
    <Ink geometry={box(w + 0.3, h + 0.3, 0.22)} material={dk} position={[0, h / 2 + 1.0, 0]} px={px} cast={false} />
    <mesh material={m} position={[0, h / 2 + 1.0, 0.12]}><planeGeometry args={[w, h]} /></mesh>
    {legs ? [-1, 1].map((k, i) => <Ink key={i} geometry={box(0.2, 1.6, 0.2)} material={wood} position={[k * (w / 2 - 0.2), 0.8, -0.05]} px={1.6} cast={false} />) : null}
  </group>;
};

/* ------------------------------------------------------------------ city pieces */
const windowTex = (c: string) => memo("wtex" + c, () => cv(128, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(c.length); for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) { g.fillStyle = r() < 0.28 ? "#f6dc90" : "#8fb6d0"; g.fillRect(x * 32 + 6, y * 32 + 6, 20, 22); } const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.1)"); gr.addColorStop(1, "rgba(0,0,0,.1)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true));
export const Skyline: React.FC<{ z: number; seed?: number }> = ({ z, seed = 1 }) => {
  const items = useMemo(() => { const r = rng(seed * 7); const a: { x: number; z: number; w: number; h: number; c: string }[] = []; for (const [zz, hh, c] of [[0, 1, "#9fb0c4"], [-26, 1.4, "#a9b8ca"], [-52, 1.8, "#b6c3d2"]] as const) { let x = -230; while (x < 230) { const w2 = 12 + r() * 14; a.push({ x: x + w2 / 2, z: z + zz * Math.sign(z) * -1, w: w2, h: (16 + r() * 34) * hh, c }); x += w2 + 1 + r() * 4; } } return a; }, [z, seed]);
  return <group>{items.map((q, i) => { const m = useMemo(() => new THREE.MeshBasicMaterial({ map: rep(windowTex(q.c), q.w / 12, q.h / 24), fog: true }), [q.c, q.w, q.h]); return <mesh key={i} material={m} position={[q.x, q.h / 2, q.z]}><boxGeometry args={[q.w, q.h, 12]} /></mesh>; })}</group>;
};
export const CityGround: React.FC = () => { const m = useMemo(() => toon(rep(paverTex(), 90, 80)), []); return <mesh material={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -20]}><planeGeometry args={[520, 360]} /></mesh>; };
export const Plaza: React.FC<{ x0: number; x1: number; z0: number; z1: number }> = ({ x0, x1, z0, z1 }) => { const m = useMemo(() => toon(rep(paverTex(), (x1 - x0) / 3, (z1 - z0) / 3)), [x0, x1, z0, z1]); const c = useMemo(() => toon("#d8d0c0"), []); return <group><Ink geometry={box(x1 - x0, 0.2, z1 - z0)} material={m} position={[(x0 + x1) / 2, 0.08, (z0 + z1) / 2]} px={2} cast={false} /><Ink geometry={box(x1 - x0, 0.22, 0.22)} material={c} position={[(x0 + x1) / 2, 0.1, z0]} px={1.4} cast={false} /></group>; };
export const Lawn: React.FC<{ p: V3; w: number; d: number }> = ({ p, w, d }) => { const m = useMemo(() => toon(rep(grassTex(), w / 6, d / 6)), [w, d]); return <Ink geometry={box(w, 0.16, d)} material={m} position={[p[0], 0.06, p[2]]} px={1.6} cast={false} />; };
export const Van: React.FC<{ p: V3; rot?: number; open?: boolean }> = ({ p, rot = 0, open = true }) => {
  const wh = useMemo(() => toon("#f2eee2"), []); const bl = useMemo(() => toon("#2f6aa8"), []); const tire = useMemo(() => toon("#2a2628"), []); const hub = useMemo(() => toon("#c8ccd4"), []); const gl = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a8d4ea" }), []); const dk = useMemo(() => toon("#3a2630"), []);
  const sg = useMemo(() => new THREE.MeshBasicMaterial({ map: signTex("MOVERS", "#2f6aa8", "#fff6e0", 512, 160) }), []);
  return <group position={p} rotation={[0, rot, 0]}>
    <Ink geometry={box(4.4, 2.6, 2.2)} material={wh} position={[-0.8, 2.1, 0]} px={2} /><Ink geometry={box(1.7, 1.9, 2.2)} material={bl} position={[2.4, 1.75, 0]} px={2} />
    <mesh material={gl} position={[3.25, 2.1, 1.12]}><planeGeometry args={[1.0, 0.8]} /></mesh><mesh material={gl} position={[3.25, 2.1, -1.12]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.0, 0.8]} /></mesh>
    <mesh material={sg} position={[-0.8, 2.4, 1.12]}><planeGeometry args={[2.8, 0.8]} /></mesh>
    <Ink geometry={box(0.12, 2.4, 2.0)} material={dk} position={[-3.04, 2.1, 0]} px={1.2} cast={false} />
    {[[2.4, 1.0], [-2.2, 1.0], [2.4, -1.0], [-2.2, -1.0]].map(([x, z], i) => <group key={i} position={[x, 0.55, z]}><Ink geometry={geo("Cylinder", 0.55, 0.55, 0.36, 16)} material={tire} rotation={[Math.PI / 2, 0, 0]} px={1.6} cast={false} /><mesh material={hub} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.26, 0.26, 0.4, 12]} /></mesh></group>)}
  </group>;
};
export const GasStation: React.FC<{ p: V3; t: number; empty?: boolean }> = ({ p, t, empty = false }) => {
  const roof = useMemo(() => toon("#d8483a"), []); const wh = useMemo(() => toon("#f6efe2"), []); const dk = useMemo(() => toon("#2a2a34"), []); const red = useMemo(() => toon("#d8483a"), []);
  const scr = useMemo(() => new THREE.MeshBasicMaterial({ color: empty ? "#d8483a" : "#9ad8c0" }), [empty]); const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: signTex(empty ? "EMPTY" : "GAS", empty ? "#d8283a" : "#fff4d8", empty ? "#fff6e0" : "#c8283a", 512, 256) }), [empty]);
  return <group position={p}>
    <Plaza x0={-9} x1={9} z0={-9.5} z1={-1.2} />
    <Ink geometry={box(12, 0.5, 7)} material={roof} position={[0, 5.4, -5.4]} px={2} /><Ink geometry={box(0.5, 5.4, 0.5)} material={wh} position={[-5, 2.7, -8.2]} px={1.6} cast={false} /><Ink geometry={box(0.5, 5.4, 0.5)} material={wh} position={[5, 2.7, -8.2]} px={1.6} cast={false} /><Ink geometry={box(0.5, 5.4, 0.5)} material={wh} position={[-5, 2.7, -2.6]} px={1.6} cast={false} /><Ink geometry={box(0.5, 5.4, 0.5)} material={wh} position={[5, 2.7, -2.6]} px={1.6} cast={false} />
    {[-3, 0, 3].map((x, i) => <group key={i} position={[x, 0.2, -5.4]}><Ink geometry={box(0.9, 2.0, 0.7)} material={red} position={[0, 1.0, 0]} px={1.8} cast={false} /><mesh material={scr} position={[0, 1.5, 0.37]}><planeGeometry args={[0.6, 0.35]} /></mesh><Ink geometry={box(1.1, 0.2, 0.9)} material={dk} position={[0, 0.1, 0]} px={1.4} cast={false} /></group>)}
    <group position={[7.6, 8.6, -2.0]}><Ink geometry={box(0.3, 6, 0.3)} material={dk} position={[0, -3, 0]} px={1.4} cast={false} /><Ink geometry={box(3.4, 1.7, 0.3)} material={dk} px={1.6} cast={false} /><mesh material={sign} position={[0, 0, 0.17]}><planeGeometry args={[3.1, 1.45]} /></mesh></group>
  </group>;
};
export { toon, box, rng, clamp, Ink, cv, rep, memo };
