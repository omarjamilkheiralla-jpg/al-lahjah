/* World kit for "She Fell Two Miles Out of the Sky" (Style 1, lottery-town look: toon materials, ink outlines, painted canvas textures).
   Rule: geometry/materials/textures are created once (memo caches), never per frame. */
import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon as toonKit, rng, clamp } from "../hotel/kit";
import { cv } from "../emu/world";
import { tex as natureTex } from "../full/nature";
import { INKD } from "../full/paint";

export type V3 = [number, number, number];
export { Ink, box, rng, clamp, cv, INKD };
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
export { memo };
const tcache = new Map<string, THREE.Material>();
export const toon = (c: string, extra: Partial<THREE.MeshToonMaterialParameters> = {}) => { const key = c + JSON.stringify(extra); let m = tcache.get(key) as THREE.MeshToonMaterial; if (!m) { m = toonKit(c, extra); tcache.set(key, m); } return m; };
export const toonT = (key: string, t: () => THREE.Texture, extra: Partial<THREE.MeshToonMaterialParameters> = {}) => memo("mt" + key, () => toonKit(t(), extra));
export const basic = (c: string, extra: Partial<THREE.MeshBasicMaterialParameters> = {}) => memo("mb" + c + JSON.stringify(extra), () => new THREE.MeshBasicMaterial({ color: c, ...extra }));
export const geo = (k: string, ...a: (number | boolean)[]): THREE.BufferGeometry => memo("g" + k + a.join(","), () => new (THREE as any)[k + "Geometry"](...a));
const repT = (t: THREE.Texture, rx: number, ry: number) => memo("rep" + t.uuid + rx + "_" + ry, () => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); return c; });
export { repT };

const blur = (g: CanvasRenderingContext2D, px: number, fn: () => void) => { g.filter = `blur(${px}px)`; fn(); g.filter = "none"; };
const wrap = (w: number, h: number, fn: (ox: number, oy: number) => void) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); };
const grain = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n = 1500, a = 0.04) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(30,20,16,${a})` : `rgba(255,255,230,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };

/* =================================================================== painted textures */
/** leaf litter: warm browns, fallen leaves, twigs, moss patches (seamless) */
export const litterTex = (tone = 0) => memo("litter" + tone, () => cv(1024, 1024, (g, w, h) => {
  const r = rng(17 + tone); g.fillStyle = tone ? "#4a3620" : "#5a4026"; g.fillRect(0, 0, w, h);
  blur(g, 30, () => { for (let i = 0; i < 70; i++) { g.fillStyle = ["#6a4a2a", "#4a321c", "#5e5228", "#3e4a22", "#704c2c"][i % 5]; const x = r() * w, y = r() * h, rr = 50 + r() * 110; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr, rr * 0.7, r() * 3, 0, 7); g.fill(); }); } });
  const leaf = (x: number, y: number, s: number, a: number, c: string) => wrap(w, h, (ox, oy) => { g.save(); g.translate(x + ox, y + oy); g.rotate(a); g.fillStyle = c; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.55, s, 0); g.quadraticCurveTo(0, s * 0.55, -s, 0); g.fill(); g.strokeStyle = "rgba(40,24,12,.55)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-s * 0.9, 0); g.lineTo(s * 0.9, 0); g.stroke(); g.restore(); });
  for (let i = 0; i < 520; i++) leaf(r() * w, r() * h, 10 + r() * 22, r() * 6.3, ["#8a5a2c", "#a8682e", "#6e4422", "#b8823a", "#7a6a2c", "#5a3a1e", "#946a34"][Math.floor(r() * 7)]);
  for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, a = r() * 6.3, l = 30 + r() * 50; wrap(w, h, (ox, oy) => { g.strokeStyle = "#3a2614"; g.lineWidth = 3 + r() * 2; g.lineCap = "round"; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); }); }
  blur(g, 6, () => { for (let i = 0; i < 26; i++) { g.fillStyle = ["rgba(90,130,50,.5)", "rgba(70,110,40,.45)"][i % 2]; const x = r() * w, y = r() * h, rr = 14 + r() * 30; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr, rr * 0.6, r() * 3, 0, 7); g.fill(); }); } });
  grain(g, w, h, 5, 2600, 0.05);
}, true));
/** bark: vertical fibres, lichen and moss patches (seamless) */
export const barkTex = (c = "#6a5240") => memo("bark" + c, () => cv(512, 512, (g, w, h) => {
  const r = rng(9); g.fillStyle = c; g.fillRect(0, 0, w, h);
  blur(g, 3, () => { for (let i = 0; i < 90; i++) { const x = r() * w, ww = 4 + r() * 14; g.fillStyle = r() < 0.5 ? "rgba(30,20,14,.28)" : "rgba(255,235,200,.12)"; wrap(w, h, (ox) => g.fillRect(x + ox, 0, ww, h)); } });
  blur(g, 8, () => { for (let i = 0; i < 22; i++) { const x = r() * w, y = r() * h, rr = 14 + r() * 40; g.fillStyle = ["rgba(150,170,120,.55)", "rgba(90,130,60,.6)", "rgba(200,200,170,.45)"][i % 3]; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr * 0.6, rr, 0, 0, 7); g.fill(); }); } });
  grain(g, w, h, 3, 1600, 0.06);
}, true));
export const mossTex = () => memo("moss", () => cv(512, 512, (g, w, h) => {
  const r = rng(12); g.fillStyle = "#4e7a2e"; g.fillRect(0, 0, w, h);
  blur(g, 10, () => { for (let i = 0; i < 80; i++) { g.fillStyle = ["#6a9a3a", "#3e6a24", "#86b04a", "#5a8a30"][i % 4]; const x = r() * w, y = r() * h, rr = 14 + r() * 40; wrap(w, h, (ox, oy) => { g.beginPath(); g.arc(x + ox, y + oy, rr, 0, 7); g.fill(); }); } });
  grain(g, w, h, 6, 2400, 0.06);
}, true));
/** muddy amazon water: soft brown-green with blurred light patches (no stroke lines) */
export const waterTex = () => memo("water", () => cv(512, 512, (g, w, h) => {
  const r = rng(4); g.fillStyle = "#5e7a68"; g.fillRect(0, 0, w, h);
  blur(g, 22, () => { for (let i = 0; i < 60; i++) { g.fillStyle = ["rgba(150,180,160,.45)", "rgba(50,70,60,.35)", "rgba(200,225,215,.4)", "rgba(110,120,80,.35)"][i % 4]; const x = r() * w, y = r() * h, rr = 30 + r() * 70; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr * 1.8, rr * 0.5, 0, 0, 7); g.fill(); }); } });
  blur(g, 5, () => { for (let i = 0; i < 70; i++) { g.fillStyle = "rgba(240,250,245,.5)"; const x = r() * w, y = r() * h; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, 12 + r() * 24, 3, 0, 0, 7); g.fill(); }); } });
}, true));
export const mudTex = () => memo("mud", () => cv(512, 512, (g, w, h) => {
  const r = rng(21); g.fillStyle = "#6a4c2e"; g.fillRect(0, 0, w, h);
  blur(g, 16, () => { for (let i = 0; i < 60; i++) { g.fillStyle = ["#7a5a36", "#5a3e22", "#84663e", "#4e3a22"][i % 4]; const x = r() * w, y = r() * h, rr = 20 + r() * 60; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rr, rr * 0.6, r() * 3, 0, 7); g.fill(); }); } });
  for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h; g.fillStyle = "rgba(220,200,160,.25)"; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, 4 + r() * 5, 2 + r() * 3, r() * 3, 0, 7); g.fill(); }); }
  grain(g, w, h, 8, 2000, 0.06);
}, true));
export const plankTex = (c = "#8a6040") => memo("plank" + c, () => cv(512, 512, (g, w, h) => {
  const r = rng(5); const n = 6; for (let i = 0; i < n; i++) { g.fillStyle = ["#8a6040", "#7e5636", "#946a46", "#76502e"][i % 4]; g.fillRect(i * w / n, 0, w / n, h); g.fillStyle = "rgba(40,24,12,.6)"; g.fillRect(i * w / n, 0, 3, h); }
  blur(g, 2, () => { for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,24,12,.18)" : "rgba(255,230,190,.1)"; const x = r() * w; g.fillRect(x, 0, 1 + r() * 3, h); } });
  for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(50,30,14,.5)"; g.beginPath(); g.ellipse(r() * w, r() * h, 5, 9, 0, 0, 7); g.fill(); }
  grain(g, w, h, 2, 1200, 0.05);
}, true));
export const thatchTex = () => memo("thatch", () => cv(512, 512, (g, w, h) => {
  const r = rng(31); g.fillStyle = "#b08a4a"; g.fillRect(0, 0, w, h);
  for (let row = 0; row < 8; row++) { const y = row * h / 8; for (let i = 0; i < 140; i++) { const x = r() * w; g.strokeStyle = ["#c8a05a", "#9a7438", "#d8b46a", "#8a6430"][i % 4]; g.lineWidth = 2 + r() * 2; wrap(w, 0, (ox) => { g.beginPath(); g.moveTo(x + ox, y); g.lineTo(x + ox + (r() - 0.5) * 8, y + h / 8 + 10); g.stroke(); }); } g.fillStyle = "rgba(60,40,16,.35)"; g.fillRect(0, y + h / 8 - 6, w, 6); }
}, true));
/** blue patterned airline seat fabric */
export const seatTex = () => memo("seatfab", () => cv(256, 256, (g, w, h) => {
  g.fillStyle = "#2f5aa0"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = (x + y) % 64 ? "rgba(255,255,255,.08)" : "rgba(0,0,40,.12)"; g.fillRect(x, y, 32, 32); g.fillStyle = "rgba(255,220,120,.35)"; g.beginPath(); g.arc(x + 16, y + 16, 3, 0, 7); g.fill(); }
  grain(g, w, h, 4, 900, 0.05);
}, true));
/** painted sign / chalkboard text texture */
export const signTex = (lines: string[], bg = "#efe2c0", fg = "#3a2a1a", w = 1024, h = 512, font = "Lilita One", border = "#5a3a1e") => memo("sign" + lines.join("|") + bg + fg + w + h + font, () => cv(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); const r = rng(3);
  if (bg === "#26332c") { blur(g, 14, () => { for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(255,255,255,.04)"; g.beginPath(); g.ellipse(r() * w, r() * h, 60 + r() * 120, 30 + r() * 40, 0, 0, 7); g.fill(); } }); }
  grain(g, w, h, 7, 1400, 0.05);
  g.strokeStyle = border; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  const n = lines.length; lines.forEach((s, i) => { const big = i === 0 && n > 1; const fs = Math.min(h / (n + 0.6) * (big ? 1.05 : 0.86), (w * 1.7) / Math.max(4, s.length)); g.font = `400 ${fs}px '${font}', Impact, sans-serif`; g.fillText(s, w / 2, h * (i + 0.5 + 0.15) / (n + 0.3)); });
}));

/* =================================================================== leaf cards (alpha textures with painted ink edges) */
const leafCanvas = (kind: "frond" | "ear" | "fern" | "banana" | "monstera", base: string, dark: string, seed = 1) => memo(`leaf${kind}${base}${seed}`, () => {
  const t = cv(256, 512, (g, w, h) => {
    const r = rng(seed); g.clearRect(0, 0, w, h); g.lineJoin = "round"; g.lineCap = "round";
    const fillShade = (path: () => void) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, dark); gr.addColorStop(0.5, base); gr.addColorStop(1, dark); g.fillStyle = gr; path(); g.fill(); g.strokeStyle = INKD; g.lineWidth = 6; path(); g.stroke(); };
    if (kind === "ear" || kind === "monstera") {
      const path = () => { g.beginPath(); g.moveTo(w / 2, h - 8); g.bezierCurveTo(w * 1.02, h * 0.72, w * 0.98, h * 0.18, w / 2, 8); g.bezierCurveTo(w * 0.02, h * 0.18, -w * 0.02, h * 0.72, w / 2, h - 8); };
      fillShade(path);
      if (kind === "monstera") { g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 5; i++) { const y = h * (0.22 + i * 0.13); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * w * 0.27, y, w * 0.06, h * 0.025, s * 0.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(w / 2 + s * w * 0.48, y - 10); g.lineTo(w / 2 + s * w * 0.36, y); g.lineTo(w / 2 + s * w * 0.5, y + 12); g.fill(); } } g.globalCompositeOperation = "source-over"; }
      g.strokeStyle = "rgba(255,255,210,.55)"; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, h - 10); g.lineTo(w / 2, 20); g.stroke();
      g.lineWidth = 2.5; g.strokeStyle = "rgba(255,255,210,.35)"; for (let i = 1; i < 8; i++) { const y = h - i * h / 8.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w / 2 + s * w * 0.2, y - 18, w / 2 + s * w * 0.42, y - 40); g.stroke(); } }
    } else if (kind === "banana") {
      const path = () => { g.beginPath(); g.moveTo(w / 2, h - 6); g.bezierCurveTo(w * 0.96, h * 0.8, w * 0.96, h * 0.1, w / 2, 6); g.bezierCurveTo(w * 0.06, h * 0.1, w * 0.04, h * 0.8, w / 2, h - 6); };
      fillShade(path); g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 7; i++) { const y = 60 + r() * (h - 120); const s = r() < 0.5 ? -1 : 1; g.beginPath(); g.moveTo(w / 2 + s * w * 0.5, y); g.lineTo(w / 2 + s * w * 0.18, y + 6); g.lineTo(w / 2 + s * w * 0.5, y + 10); g.fill(); } g.globalCompositeOperation = "source-over";
      g.strokeStyle = "rgba(255,255,210,.6)"; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, h - 8); g.lineTo(w / 2, 10); g.stroke();
    } else {
      // frond / fern: central rib with leaflets on both sides
      const n = kind === "fern" ? 16 : 13;
      g.strokeStyle = INKD; g.lineWidth = 7; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 6); g.stroke();
      for (let i = 0; i < n; i++) {
        const y = h - 30 - i * (h - 50) / n; const len = (kind === "fern" ? 0.46 : 0.5) * w * Math.sin(Math.PI * (0.15 + 0.85 * (1 - i / n))) * (0.85 + r() * 0.15);
        for (const s of [-1, 1]) {
          const path = () => { g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w / 2 + s * len * 0.55, y - 22, w / 2 + s * len, y - 34 - (kind === "fern" ? 4 : 14)); g.quadraticCurveTo(w / 2 + s * len * 0.5, y + 4, w / 2, y + 10); g.closePath(); };
          g.fillStyle = s < 0 ? dark : base; path(); g.fill(); g.strokeStyle = INKD; g.lineWidth = 3; path(); g.stroke();
        }
      }
      g.strokeStyle = "#c8d890"; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 8); g.stroke();
    }
  });
  return t;
});
export const leafMat = (kind: "frond" | "ear" | "fern" | "banana" | "monstera", base: string, dark: string, seed = 1) => memo(`lm${kind}${base}${seed}`, () => toonKit(leafCanvas(kind, base, dark, seed), { transparent: false, alphaTest: 0.5, side: THREE.DoubleSide }));
/** a bent leaf card: plane from the stem (origin) out along +y, arching down by `droop` */
export const leafGeo = (w: number, len: number, droop: number, twist = 0) => memo(`lg${w}_${len}_${droop}_${twist}`, () => {
  const g = new THREE.PlaneGeometry(w, len, 4, 12); g.translate(0, len / 2, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); const u = y / len; p.setZ(i, -droop * u * u * len + Math.abs(x) * 0.25 * (w / 1)); p.setX(i, x * (1 - 0.15 * u) + twist * u * u); }
  g.computeVertexNormals(); return g;
});
const PAL_LEAF: [string, string][] = [["#5aa848", "#2f7a34"], ["#4a9a3c", "#24622c"], ["#76b84e", "#3f8a36"], ["#3f8a46", "#1f5a30"], ["#86c058", "#4a9038"]];
export const leafPal = (i: number) => PAL_LEAF[((i % PAL_LEAF.length) + PAL_LEAF.length) % PAL_LEAF.length];

/* =================================================================== plants */
type PP = { p: V3; s?: number; seed?: number; rot?: number; t?: number };
/** palm with arching fronds (painted island palm) */
export const Palm: React.FC<PP & { h?: number }> = React.memo(({ p, s = 1, seed = 1, rot = 0, h = 7 }) => {
  const r = rng(seed * 7 + 3); const lean = (r() - 0.5) * 0.5;
  const trunk = memo(`palmtrunk${seed}${h}`, () => { const pts = Array.from({ length: 7 }, (_, i) => new THREE.Vector3(Math.sin(i / 6 * 1.3) * lean * h * 0.3, i / 6 * h, 0)); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.22, 10, false); });
  const top = new THREE.Vector3(Math.sin(1.3) * lean * h * 0.3, h, 0);
  const bark = toonT("palmbark", () => repT(barkTex("#8a7458"), 1, 4));
  const n = 11; const pal = leafPal(seed);
  return <group position={p} scale={s} rotation={[0, rot, 0]}>
    <Ink geometry={trunk} material={bark} px={1.8} />
    {Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + r(); const up = 0.5 + r() * 0.6; return <group key={i} position={[top.x, top.y, top.z]} rotation={[0, a, 0]}><group rotation={[-(Math.PI / 2 - up), 0, 0]}><mesh geometry={leafGeo(1.5, 4.2 + r() * 0.8, 0.5 + r() * 0.25)} material={leafMat("frond", pal[0], pal[1], seed)} castShadow /></group></group>; })}
    <Ink geometry={geo("Sphere", 0.38, 12, 10)} material={toon("#6a5a32")} position={[top.x, top.y - 0.1, top.z]} px={1.6} />
  </group>;
});
/** ground fern: fan of arching fronds */
export const Fern: React.FC<PP> = React.memo(({ p, s = 1, seed = 1, rot = 0 }) => {
  const r = rng(seed * 5 + 1); const n = 9; const pal = leafPal(seed + 2);
  return <group position={p} scale={s} rotation={[0, rot, 0]}>{Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + r() * 0.5; return <group key={i} rotation={[0, a, 0]}><group rotation={[-(0.35 + r() * 0.35), 0, 0]}><mesh geometry={leafGeo(0.9, 1.9 + r() * 0.6, 0.55)} material={leafMat("fern", pal[0], pal[1], seed % 3)} castShadow /></group></group>; })}</group>;
});
/** elephant-ear / monstera / banana style big-leaf plant on stalks */
export const BigLeaf: React.FC<PP & { kind?: "ear" | "monstera" | "banana" }> = React.memo(({ p, s = 1, seed = 1, rot = 0, kind = "ear" }) => {
  const r = rng(seed * 3 + 7); const n = kind === "banana" ? 6 : 5; const pal = leafPal(seed + 1); const stalk = toon("#5a8a3a");
  const sl = kind === "banana" ? 2.4 : 1.4;
  return <group position={p} scale={s} rotation={[0, rot, 0]}>
    {kind === "banana" ? <Ink geometry={geo("Cylinder", 0.16, 0.24, 2.6, 10)} material={toon("#7a8a4a")} position={[0, 1.3, 0]} px={1.6} /> : null}
    {Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + r() * 0.6; const tilt = 0.35 + r() * 0.35; const L = (kind === "banana" ? 3.6 : 1.7) + r() * 0.5;
      return <group key={i} rotation={[0, a, 0]}>
        {kind !== "banana" ? <mesh geometry={geo("Cylinder", 0.03, 0.045, sl, 6)} material={stalk} position={[0, sl / 2, 0.16]} rotation={[0.25, 0, 0]} /> : null}
        <group position={[0, kind === "banana" ? 2.4 : sl - 0.05, kind === "banana" ? 0 : 0.34]} rotation={[-(Math.PI / 2 - tilt) * (kind === "banana" ? 0.75 : 0.6), 0, 0]}>
          <mesh geometry={leafGeo(kind === "banana" ? 1.2 : 1.3, L, kind === "banana" ? 0.35 : 0.22)} material={leafMat(kind, pal[0], pal[1], seed % 2)} castShadow />
        </group>
      </group>; })}
  </group>;
});
/** giant rainforest tree: wavy trunk, buttress roots, hanging lianas, moss; canopy high above */
export const GiantTree: React.FC<PP & { h?: number; r0?: number; canopy?: boolean; vines?: number }> = React.memo(({ p, s = 1, seed = 1, rot = 0, h = 22, r0 = 0.9, canopy = true, vines = 3 }) => {
  const r = rng(seed * 11 + 5);
  const trunk = memo(`gt${seed}${h}${r0}`, () => { const g = new THREE.CylinderGeometry(r0 * 0.55, r0, h, 14, 18); const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) { const y = ps.getY(i); ps.setX(i, ps.getX(i) + Math.sin(y * 0.25 + seed) * 0.3); ps.setZ(i, ps.getZ(i) + Math.cos(y * 0.2 + seed) * 0.2); } g.translate(0, h / 2, 0); g.computeVertexNormals(); return g; });
  const bark = toonT("gbark" + (seed % 3), () => repT(barkTex(["#6a5240", "#5e5444", "#74583e"][seed % 3]), 2, 6));
  const moss = toonT("gmoss", () => repT(mossTex(), 1, 1));
  const root = memo(`root${r0}`, () => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(r0 * 3.2, 0); sh.quadraticCurveTo(r0 * 1.2, r0 * 0.4, r0 * 0.4, r0 * 3.4); sh.lineTo(0, r0 * 3.4); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -0.11); return g; });
  const vineG = memo(`vines${seed}${h}`, () => Array.from({ length: 4 }, (_, i) => { const rr = rng(seed * 31 + i); const x0 = (rr() - 0.5) * 6, z0 = 0.5 + rr() * 2.5; const pts = [new THREE.Vector3(x0 * 0.2, h * 0.85, 0.3), new THREE.Vector3(x0 * 0.6, h * 0.55, z0 * 0.7), new THREE.Vector3(x0, h * 0.25 + rr() * 3, z0), new THREE.Vector3(x0 * 1.05, rr() * 2.5, z0 * 1.05)]; return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07 + rr() * 0.04, 6, false); }));
  const vm = toon("#4a5a2a");
  const blobs = useMemo(() => Array.from({ length: 6 }, () => ({ x: (r() - 0.5) * 12, y: h + r() * 3, z: (r() - 0.5) * 10, s: 3 + r() * 2.5, c: Math.floor(r() * 3) })), [r, h]);
  const cm = [toon("#2f6a2c"), toon("#3f7a30"), toon("#24582a")];
  return <group position={p} scale={s} rotation={[0, rot, 0]}>
    <Ink geometry={trunk} material={bark} px={2.4} />
    {Array.from({ length: 5 }, (_, i) => <Ink key={i} geometry={root} material={bark} rotation={[0, (i / 5) * Math.PI * 2 + seed, 0]} position={[0, 0, 0]} px={2} />)}
    <Ink geometry={geo("Sphere", 1, 14, 10)} material={moss} position={[r0 * 0.6, h * 0.3, r0 * 0.4]} scale={[r0 * 0.6, 1.4, r0 * 0.5]} px={1.6} />
    {vineG.slice(0, vines).map((g, i) => <Ink key={i} geometry={g} material={vm} px={1.4} />)}
    {canopy ? blobs.map((b, i) => <Ink key={i} geometry={geo("Icosahedron", 1, 2)} material={cm[b.c]} position={[b.x, b.y, b.z]} scale={[b.s, b.s * 0.55, b.s]} px={2.4} />) : null}
  </group>;
});
export const Log: React.FC<PP & { len?: number; rad?: number }> = React.memo(({ p, s = 1, rot = 0, len = 6, rad = 0.5 }) => {
  const bark = toonT("logbark", () => repT(barkTex("#5a4634"), 3, 1)); const moss = toonT("gmoss", () => repT(mossTex(), 1, 1));
  return <group position={p} scale={s} rotation={[0, rot, 0]}>
    <Ink geometry={geo("Cylinder", rad, rad * 1.1, len, 12)} material={bark} rotation={[0, 0, Math.PI / 2]} position={[0, rad * 0.8, 0]} px={2} />
    <Ink geometry={geo("Sphere", 1, 12, 8)} material={moss} position={[-len * 0.15, rad * 1.5, 0]} scale={[len * 0.25, 0.22, rad * 0.9]} px={1.4} />
    <Ink geometry={geo("Circle", rad * 0.98, 16)} material={toon("#b08a5a")} position={[len / 2 + 0.01, rad * 0.8, 0]} rotation={[0, Math.PI / 2, 0]} px={1.2} cast={false} />
  </group>;
});
export const Rock: React.FC<PP & { c?: string }> = React.memo(({ p, s = 1, seed = 1, rot = 0 }) => {
  const g = memo(`rock${seed}`, () => { const x = new THREE.IcosahedronGeometry(1, 2); const ps = x.attributes.position; const r = rng(seed); for (let i = 0; i < ps.count; i++) { const k = 0.82 + 0.18 * Math.sin(ps.getX(i) * 3 + seed) * Math.cos(ps.getZ(i) * 2.6 + r() * 0.0); ps.setXYZ(i, ps.getX(i) * k, ps.getY(i) * k * 0.6, ps.getZ(i) * k); } const m = (x as any).toNonIndexed ? x : x; m.computeVertexNormals(); return m; });
  const moss = toonT("gmoss", () => repT(mossTex(), 1, 1)); const st = toon("#7a7464");
  return <group position={p} scale={s} rotation={[0, rot, 0]}><Ink geometry={g} material={st} px={1.8} /><Ink geometry={geo("Sphere", 1, 12, 8)} material={moss} position={[0, 0.42, 0]} scale={[0.75, 0.25, 0.7]} px={1.2} /></group>;
});

/* =================================================================== jungle set (procedural, keeps a clear corridor for the camera and actors) */
type Clear = [number, number, number];   // x, z, radius kept free of plants
const inClear = (x: number, z: number, cl: Clear[]) => cl.some(([cx, cz, rr]) => (x - cx) ** 2 + (z - cz) ** 2 < rr * rr);
export const Jungle: React.FC<{ seed?: number; clear?: Clear[]; x0?: number; x1?: number; z0?: number; z1?: number; density?: number; ground?: boolean; tone?: number; trees?: number; pad?: number }> = React.memo(({ seed = 1, clear = [], x0 = -30, x1 = 30, z0 = -40, z1 = 12, density = 1, ground = true, tone = 0, trees = 1, pad = 80 }) => {
  const items = useMemo(() => {
    const r = rng(seed * 101); const out: { k: string; x: number; z: number; s: number; sd: number; rot: number }[] = [];
    const area = (x1 - x0) * (z1 - z0); const n = Math.floor(area * 0.09 * density);
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); const q = r();
      const k = q < 0.05 * trees ? "tree" : q < 0.13 ? "palm" : q < 0.42 ? "fern" : q < 0.6 ? "ear" : q < 0.7 ? "monstera" : q < 0.78 ? "banana" : q < 0.86 ? "rock" : "fern";
      const rad = k === "tree" ? 3.2 : k === "palm" || k === "banana" ? 1.6 : 1.1;
      if (inClear(x, z, clear.map(([a, b, c]) => [a, b, c + rad] as Clear))) continue;
      out.push({ k, x, z, s: k === "tree" ? 0.8 + r() * 0.6 : 0.8 + r() * 0.7, sd: Math.floor(r() * 1000), rot: r() * 6.3 });
    }
    return out;
  }, [seed, clear, x0, x1, z0, z1, density, trees]);
  const gm = toonT("litter" + tone, () => repT(litterTex(tone), (x1 - x0 + pad) / 9, (z1 - z0 + pad) / 9));
  return <group>
    {ground ? <mesh material={gm} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0, (z0 + z1) / 2]} receiveShadow><planeGeometry args={[x1 - x0 + pad, z1 - z0 + pad]} /></mesh> : null}
    {items.map((q, i) => q.k === "tree" ? <GiantTree key={i} p={[q.x, 0, q.z]} s={q.s} seed={q.sd} rot={q.rot} vines={q.sd % 4} />
      : q.k === "palm" ? <Palm key={i} p={[q.x, 0, q.z]} s={q.s} seed={q.sd} rot={q.rot} h={6 + (q.sd % 5)} />
      : q.k === "rock" ? <Rock key={i} p={[q.x, 0.1, q.z]} s={0.6 + q.s * 0.5} seed={q.sd} rot={q.rot} />
      : q.k === "fern" ? <Fern key={i} p={[q.x, 0, q.z]} s={q.s} seed={q.sd} rot={q.rot} />
      : <BigLeaf key={i} p={[q.x, 0, q.z]} s={q.s} seed={q.sd} rot={q.rot} kind={q.k as any} />)}
  </group>;
});
/** dense canopy seen from the air (instanced blobs, no per-frame allocation) */
export const Canopy: React.FC<{ w?: number; d?: number; y?: number; seed?: number; hole?: [number, number, number]; river?: (x: number) => number; riverW?: number }> = React.memo(({ w = 400, d = 400, y = 0, seed = 2, hole, river, riverW = 10 }) => {
  const mesh = useMemo(() => {
    const r = rng(seed); const pts: { x: number; z: number; s: number; h: number; c: THREE.Color }[] = [];
    const cols = ["#2f6a2c", "#3f7a30", "#24582a", "#4a8a36", "#2a5f34", "#5a9a3a", "#36703a", "#6aa040"].map((c) => new THREE.Color(c));
    for (let i = 0; i < 2600; i++) { const x = (r() - 0.5) * w, z = (r() - 0.5) * d; if (hole && (x - hole[0]) ** 2 + (z - hole[1]) ** 2 < hole[2] ** 2) continue; if (river && Math.abs(z - river(x)) < riverW * 0.5 + 2) continue; pts.push({ x, z, s: 3 + r() * 4.5, h: r() * 3, c: cols[Math.floor(r() * cols.length)] }); }
    const g = new THREE.IcosahedronGeometry(1, 2); const m = toonKit("#ffffff"); const im = new THREE.InstancedMesh(g, m, pts.length); const M = new THREE.Matrix4();
    pts.forEach((q, i) => { M.compose(new THREE.Vector3(q.x, y + q.h, q.z), new THREE.Quaternion(), new THREE.Vector3(q.s, q.s * 0.62, q.s)); im.setMatrixAt(i, M); im.setColorAt(i, q.c); });
    im.castShadow = true; im.receiveShadow = true; return im;
  }, [w, d, y, seed, hole, river, riverW]);
  const under = toon("#1f3a1c");
  return <group><primitive object={mesh} /><mesh material={under} rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 1.5, 0]}><planeGeometry args={[w + 200, d + 200]} /></mesh></group>;
});
/** winding river ribbon for aerial shots */
export const RiverRibbon: React.FC<{ f: (x: number) => number; w?: number; x0?: number; x1?: number; y?: number; t?: number }> = React.memo(({ f, w = 10, x0 = -200, x1 = 200, y = 0 }) => {
  const g = useMemo(() => { const n = 160; const pos: number[] = [], uv: number[] = [], idx: number[] = []; for (let i = 0; i <= n; i++) { const x = x0 + (i / n) * (x1 - x0); const z = f(x); const dz = (f(x + 0.5) - f(x - 0.5)); const len = Math.hypot(1, dz); const nx = -dz / len, nz = 1 / len; for (const s of [-1, 1]) { pos.push(x + nx * s * w / 2, y, z + nz * s * w / 2); uv.push(i / n * 20, s > 0 ? 1 : 0); } if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals(); return gg; }, [f, w, x0, x1, y]);
  const m = toonT("riverribbon", () => repT(waterTex(), 1, 1));
  return <mesh geometry={g} material={m} receiveShadow />;
});

/* =================================================================== atmosphere */
const glowTex = () => memo("jglow", () => cv(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
const rayTex = () => memo("jray", () => cv(128, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.0)"); gr.addColorStop(0.25, "rgba(255,255,255,.75)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const g2 = g.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, "rgba(0,0,0,1)"); g2.addColorStop(0.5, "rgba(0,0,0,0)"); g2.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = g2; g.fillRect(0, 0, w, h); }));
export const Mist: React.FC<{ t: number; n?: number; area?: V3; c?: V3; color?: string; op?: number; s?: number }> = ({ t, n = 10, area = [40, 3, 30], c = [0, 1.5, -10], color = "#e8f0e0", op = 0.35, s = 14 }) => {
  const pts = useMemo(() => { const r = rng(77); return Array.from({ length: n }, () => ({ x: (r() - 0.5) * area[0], y: r() * area[1], z: (r() - 0.5) * area[2], s: s * (0.7 + r() * 0.6), v: 0.15 + r() * 0.25 })); }, [n, area, s]);
  const m = memo("mist" + color + op, () => new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity: op, depthWrite: false }));
  return <group position={c}>{pts.map((q, i) => <mesh key={i} material={m} position={[q.x + Math.sin(t * q.v + i) * 1.5, q.y, q.z]} scale={[q.s, q.s * 0.35, 1]}><planeGeometry args={[1, 1]} /></mesh>)}</group>;
};
export const Rays: React.FC<{ t: number; items: { x: number; z: number; w?: number; h?: number; a?: number }[]; color?: string; op?: number; y?: number }> = ({ t, items, color = "#fff2c8", op = 0.22, y = 0 }) => {
  const m = memo("ray" + color + op, () => new THREE.MeshBasicMaterial({ map: rayTex(), color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  return <group>{items.map((q, i) => <mesh key={i} material={m} position={[q.x, y + (q.h ?? 16) / 2, q.z]} rotation={[0, 0, q.a ?? -0.35]} scale={[(q.w ?? 2.4) * (0.9 + 0.1 * Math.sin(t * 0.8 + i)), q.h ?? 16, 1]}><planeGeometry args={[1, 1]} /></mesh>)}</group>;
};
/** blue morpho butterflies fluttering along a loop */
export const Butterflies: React.FC<{ t: number; n?: number; c?: V3; r?: number }> = ({ t, n = 4, c = [0, 2, 0], r = 3 }) => {
  const wing = memo("bfly", () => cv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w * 0.3, h * 0.6, 4, w * 0.3, h * 0.6, w * 0.8); gr.addColorStop(0, "#9ae6ff"); gr.addColorStop(0.5, "#2a8ae8"); gr.addColorStop(1, "#14306a"); g.fillStyle = gr; g.beginPath(); g.moveTo(0, h * 0.55); g.bezierCurveTo(w * 0.4, -h * 0.1, w * 1.05, h * 0.05, w * 0.92, h * 0.5); g.bezierCurveTo(w, h * 0.95, w * 0.3, h * 1.02, 0, h * 0.55); g.fill(); g.strokeStyle = INKD; g.lineWidth = 6; g.stroke(); }));
  const m = memo("bflym", () => new THREE.MeshBasicMaterial({ map: wing, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
  return <group position={c}>{Array.from({ length: n }, (_, i) => { const a = t * (0.5 + i * 0.13) + i * 2; const x = Math.sin(a) * r * (0.6 + 0.4 * Math.sin(i)), z = Math.cos(a * 0.8) * r * 0.6, y = Math.sin(a * 1.7 + i) * 0.6 + i * 0.3; const f = Math.sin(t * 22 + i * 3) * 1.1; return <group key={i} position={[x, y, z]} rotation={[0, -a, 0.3]} scale={0.32}><mesh material={m} rotation={[0, f, 0]} position={[0, 0, 0]}><planeGeometry args={[1, 1]} /></mesh><mesh material={m} rotation={[0, Math.PI - f, 0]}><planeGeometry args={[1, 1]} /></mesh></group>; })}</group>;
};
export const Motes: React.FC<{ t: number; n?: number; area?: V3; c?: V3; color?: string }> = ({ t, n = 50, area = [14, 5, 10], c = [0, 0, 0], color = "#fff0b0" }) => {
  const pts = useMemo(() => { const r = rng(9); return Array.from({ length: n }, () => ({ x: (r() - 0.5) * area[0], y: 0.3 + r() * area[1], z: (r() - 0.5) * area[2], ph: r() * 6 })); }, [n, area]);
  const m = memo("mote" + color, () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false }));
  return <group position={c}>{pts.map((q, i) => <mesh key={i} material={m} position={[q.x + Math.sin(t * 0.4 + q.ph) * 0.5, q.y + Math.sin(t * 0.6 + q.ph * 2) * 0.3, q.z]}><circleGeometry args={[0.03, 6]} /></mesh>)}</group>;
};

/* =================================================================== sky */
const SKYG: Record<string, [number, string][]> = {
  storm: [[0, "#1a2030"], [0.3, "#2c3448"], [0.48, "#4a5268"], [0.52, "#3a3e4c"], [1, "#2a2a30"]],
  humid: [[0, "#7aa8c8"], [0.3, "#b0cad6"], [0.46, "#e6ecdc"], [0.52, "#d8e0c8"], [1, "#d8e0c8"]],
  morning: [[0, "#5a94d0"], [0.3, "#94c0e4"], [0.46, "#f2e8d0"], [0.52, "#f4dcb8"], [1, "#f4dcb8"]],
  dusk: [[0, "#2c2f6a"], [0.24, "#7a4a8a"], [0.4, "#e0707a"], [0.47, "#ff9a5a"], [0.52, "#ffb56a"], [1, "#ffb56a"]],
  above: [[0, "#3a74c0"], [0.35, "#7ab0e0"], [0.5, "#dceaf4"], [1, "#f4f6f8"]],
};
export type SkyKind = keyof typeof SKYG;
export const JSky: React.FC<{ kind: SkyKind; t?: number; clouds?: number; cloudTint?: string; y?: number }> = ({ kind, t = 0, clouds = 12, cloudTint, y = 0 }) => {
  const sky = memo("jsky" + kind, () => cv(8, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); SKYG[kind].forEach(([s, c]) => gr.addColorStop(s, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  const ct = natureTex().clouds as THREE.Texture[];
  const tint = cloudTint ?? (kind === "storm" ? "#6a7286" : kind === "dusk" ? "#ffb8a0" : kind === "morning" ? "#fff0e0" : "#ffffff");
  const mats = memo("jcm" + tint, () => ct.map((tx) => new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, fog: false, color: tint })));
  const cl = useMemo(() => { const r = rng(41); return Array.from({ length: clouds }, (_, i) => ({ ang: (i / clouds) * Math.PI * 2 + r() * 0.4, h: 14 + r() * 50, s: 60 + r() * 60, v: i % 3, d: 160 + r() * 25, dr: 0.004 + r() * 0.01 })); }, [clouds]);
  const skyM = memo("jskym" + kind, () => new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false }));
  return <group position={[0, y, 0]}><mesh material={skyM} renderOrder={-10}><sphereGeometry args={[230, 32, 20]} /></mesh>
    {cl.map((c, i) => { const a = c.ang + t * c.dr; return <mesh key={i} material={mats[c.v]} position={[Math.sin(a) * c.d, c.h, -Math.cos(a) * c.d]} rotation={[0, -a, 0]} renderOrder={-9}><planeGeometry args={[c.s, c.s / 2]} /></mesh>; })}
  </group>;
};
/** big volumetric-looking cloud puffs (sprites) for flying through */
export const CloudPuffs: React.FC<{ t: number; n?: number; area?: V3; c?: V3; tint?: string; op?: number; speed?: V3; s?: number; seed?: number }> = ({ t, n = 30, area = [60, 40, 60], c = [0, 0, 0], tint = "#ffffff", op = 0.9, speed = [0, 0, 0], s = 14, seed = 5 }) => {
  const ct = natureTex().clouds as THREE.Texture[];
  const mats = memo("puff" + tint + op, () => ct.map((tx) => new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, color: tint, opacity: op })));
  const pts = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => ({ x: (r() - 0.5) * area[0], y: (r() - 0.5) * area[1], z: (r() - 0.5) * area[2], s: s * (0.6 + r() * 0.8), v: Math.floor(r() * 3) })); }, [n, area, s, seed]);
  const md = (v: number, a: number) => ((v + a / 2) % a + a) % a - a / 2;
  return <group position={c}>{pts.map((q, i) => <sprite key={i} material={mats[q.v] as any} position={[md(q.x + speed[0] * t, area[0]), md(q.y + speed[1] * t, area[1]), md(q.z + speed[2] * t, area[2])]} scale={[q.s, q.s * 0.6, 1]} />)}</group>;
};
/** jagged lightning bolt (emissive), visible while `on` > 0 */
export const Bolt: React.FC<{ from: V3; to: V3; on: number; seed?: number }> = ({ from, to, on, seed = 3 }) => {
  const g = memo(`bolt${from}${to}${seed}`, () => { const r = rng(seed); const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to); const pts: THREE.Vector3[] = []; const n = 12; for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); if (i > 0 && i < n) p.add(new THREE.Vector3((r() - 0.5) * 2.4, (r() - 0.5) * 1.2, (r() - 0.5) * 1.6)); pts.push(p); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1), 80, 0.14, 6, false); });
  const m = basic("#f4f8ff"); const gm = memo("boltglow", () => new THREE.MeshBasicMaterial({ color: "#a8c8ff", transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  if (on <= 0) return null;
  return <group><mesh geometry={g} material={m} /><mesh geometry={g} material={gm} scale={[1, 1, 1]} /></group>;
};

export const ContactShadow: React.FC<{ position: V3; r?: number; op?: number }> = ({ position, r = 0.5, op = 0.35 }) => {
  const m = memo("cshadow" + op, () => new THREE.MeshBasicMaterial({ map: memo("cshtex", () => cv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(20,12,8,1)"); gr.addColorStop(1, "rgba(20,12,8,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); })), transparent: true, opacity: op, depthWrite: false }));
  return <mesh material={m} position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[r * 2.4, r * 1.4, 1]}><planeGeometry args={[1, 1]} /></mesh>;
};
