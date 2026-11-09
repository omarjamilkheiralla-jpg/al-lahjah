import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, box, toon, rng, clamp, woodTexture } from "../hotel/kit";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** smooth, welded blob geometry (no flat facets, no outline spikes) */
const smoothBlob = (detail: number, deform: (v: THREE.Vector3, i: number) => THREE.Vector3) => {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute("uv"); g.deleteAttribute("normal"); g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const v = deform(new THREE.Vector3().fromBufferAttribute(pos, i), i); pos.setXYZ(i, v.x, v.y, v.z); }
  const uv = new Float32Array(pos.count * 2); for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); uv[i * 2] = v.x * 0.5 + 0.5; uv[i * 2 + 1] = v.y * 0.5 + 0.5; }   // planar projection: no wrap seam
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
};
import { INKD } from "../full/paint";
import { Glow } from "../full/nature";

const cv = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const grain = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n = 900, a = 0.05) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(42,26,30,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };
const blur = (g: CanvasRenderingContext2D, px: number, fn: () => void) => { g.filter = `blur(${px}px)`; fn(); g.filter = "none"; };

let C: any = null;
export const AT = () =>
  (C ??= {
    crust: cv(512, 512, (g, w, h) => {
      const r = rng(5); g.fillStyle = "#5f7d5a"; g.fillRect(0, 0, w, h);
      blur(g, 12, () => { for (let i = 0; i < 70; i++) { g.fillStyle = ["#4a6a4a", "#7a9a6a", "#8a7a52", "#3f5a46", "#9aa87a", "#6a5a3a"][Math.floor(r() * 6)]; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 80, 20 + r() * 50, r() * 3, 0, 7); g.fill(); } });
      for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "#e6dcc0" : "#2a3a30"; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 7, 0, 7); g.fill(); }
      grain(g, w, h, 5, 1500, 0.06);
    }, true),
    sand: cv(512, 512, (g, w, h) => {
      const r = rng(9); g.fillStyle = "#d8c79a"; g.fillRect(0, 0, w, h);
      blur(g, 22, () => { for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h, rx = 50 + r() * 90, ry = 20 + r() * 50, c = ["#c8b585", "#e6d6a8", "#b9a674", "#d2bf90"][i % 4]; g.fillStyle = c; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, 0.3, 0, 7); g.fill(); } } });
      for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "rgba(240,230,196,.7)" : "rgba(130,110,70,.35)"; const x = r() * w, y = r() * h, rr = 1.2 + r() * 2.4; for (const ox of [-w, 0, w]) { g.beginPath(); g.arc(x + ox, y, rr, 0, 7); g.fill(); } }
      grain(g, w, h, 9, 700, 0.03);
    }, true),
    sea: cv(512, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#4fa8d8"); gr.addColorStop(1, "#2a7fb8"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 4; g.lineCap = "round"; const r = rng(4);
      for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, l = 24 + r() * 50; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 6, x + l, y); g.stroke(); }
      grain(g, w, h, 4, 600, 0.04);
    }, true),
    rays: cv(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(220,245,255,0.7)"); gr.addColorStop(1, "rgba(220,245,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, w, h); }),
    timeline: cv(1024, 512, (g, w, h) => {
      g.fillStyle = "#efdfb6"; g.fillRect(0, 0, w, h);
      blur(g, 14, () => { const r = rng(2); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(120,80,30,${0.05 + r() * 0.07})`; g.beginPath(); g.ellipse(r() * w, r() * h, 50 + r() * 90, 20 + r() * 40, 0, 0, 7); g.fill(); } });
      g.strokeStyle = INKD; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
      g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(80, 250); g.lineTo(w - 80, 250); g.stroke();
      g.fillStyle = "#c99a3a"; g.beginPath(); g.arc(150, 250, 36, 0, 7); g.fill(); g.lineWidth = 8; g.stroke();
      g.fillStyle = "#6a7488"; g.beginPath(); g.arc(w - 150, 250, 36, 0, 7); g.fill(); g.stroke();
      g.textAlign = "center"; g.fillStyle = INKD; g.font = "400 78px 'Lilita One', Impact, sans-serif"; g.fillText("THIS MACHINE", 210, 150); g.font = "400 66px 'Lilita One', Impact, sans-serif"; g.fillText("CLOCKS", w - 150, 150);
      g.strokeStyle = "#c8403a"; g.lineWidth = 12; g.beginPath(); g.moveTo(240, 330); g.lineTo(w - 230, 330); g.moveTo(240, 305); g.lineTo(240, 355); g.moveTo(w - 230, 305); g.lineTo(w - 230, 355); g.stroke();
      g.fillStyle = "#c8403a"; g.font = "400 80px 'Lilita One', Impact, sans-serif"; g.fillText("OVER 1,000 YEARS", w / 2, 425);
      grain(g, w, h, 12, 1200, 0.04);
    }),
    xray: cv(512, 384, (g, w, h) => {
      g.fillStyle = "#04141c"; g.fillRect(0, 0, w, h);
      const bgG = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 260); bgG.addColorStop(0, "rgba(90,230,200,.32)"); bgG.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = bgG; g.fillRect(0, 0, w, h);
      const gear = (cx: number, cy: number, R: number, n: number, rot: number) => {
        g.save(); g.translate(cx, cy); g.rotate(rot);
        g.beginPath(); for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, st = (Math.PI * 2) / n; const pts = [[a0, R * 0.82], [a0 + st * 0.14, R], [a0 + st * 0.5, R], [a0 + st * 0.62, R * 0.82]]; pts.forEach(([aa, rr], k) => { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; (i === 0 && k === 0) ? g.moveTo(x, y) : g.lineTo(x, y); }); }
        g.closePath(); const fg = g.createRadialGradient(0, 0, R * 0.1, 0, 0, R); fg.addColorStop(0, "rgba(120,255,225,.5)"); fg.addColorStop(1, "rgba(40,170,160,.55)"); g.fillStyle = fg; g.fill();
        g.lineJoin = "round"; g.lineWidth = 7; g.strokeStyle = "#a8fff0"; g.stroke();
        g.globalCompositeOperation = "destination-out"; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(0, 0, R * 0.62, (k / 5) * Math.PI * 2 + 0.25, ((k + 1) / 5) * Math.PI * 2 - 0.25); g.arc(0, 0, R * 0.3, ((k + 1) / 5) * Math.PI * 2 - 0.25, (k / 5) * Math.PI * 2 + 0.25, true); g.closePath(); g.fill(); }
        g.beginPath(); g.arc(0, 0, R * 0.14, 0, 7); g.fill(); g.globalCompositeOperation = "source-over";
        g.beginPath(); g.arc(0, 0, R * 0.2, 0, 7); g.lineWidth = 6; g.strokeStyle = "#a8fff0"; g.stroke();
        g.restore();
      };
      gear(190, 185, 118, 22, 0.1); gear(372, 150, 76, 14, 0.3); gear(338, 288, 60, 11, 0.5); gear(100, 300, 54, 10, 0.2);
      g.fillStyle = "rgba(255,255,255,.05)"; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
    }),
    letters: cv(512, 256, (g, w, h) => {
      g.fillStyle = "#c99a3a"; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(255,240,180,.5)"); gr.addColorStop(1, "rgba(80,50,10,.3)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "#3a2a12"; g.textAlign = "left"; g.font = "700 30px 'Playfair Display', Georgia, serif"; const t = "ΣΕΛΗΝΗ ΗΛΙΟΣ ΕΚΛΕΙΨΙΣ ΟΛΥΜΠΙΑ ΜΗΝ ΕΤΟΣ ΩΡΑ"; for (let r = 0; r < 6; r++) g.fillText(t.slice(r * 4, r * 4 + 22), 24, 50 + r * 38);
      g.strokeStyle = "#3a2a12"; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); grain(g, w, h, 3, 600, 0.06);
    }),
  });

export const gearGeo = (teeth: number, r0: number, r1: number, depth = 0.12) => {
  const s = new THREE.Shape(); const n = teeth * 4;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const k = i % 4; const rr = k === 1 || k === 2 ? r1 : r0; const aa = a; s.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
  s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, r0 * 0.28, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let k = 0; k < 4; k++) { const sp = new THREE.Path(); const a0 = (k / 4) * Math.PI * 2 + 0.3, a1 = ((k + 1) / 4) * Math.PI * 2 - 0.3; sp.absarc(0, 0, r0 * 0.78, a0, a1, false); sp.absarc(0, 0, r0 * 0.42, a1, a0, true); s.holes.push(sp); }
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
};

export const Gear: React.FC<{ p?: [number, number, number]; r?: number; teeth?: number; spin?: number; color?: string; depth?: number; rot?: [number, number, number] }> = ({ p = [0, 0, 0], r = 0.5, teeth = 16, spin = 0, color = "#c99a3a", depth = 0.12, rot = [0, 0, 0] }) => {
  const geo = useMemo(() => gearGeo(teeth, r * 0.86, r, depth), [teeth, r, depth]);
  const mat = useMemo(() => toon(color), [color]);
  return <group position={p} rotation={rot}><group rotation={[0, 0, spin]}><Ink geometry={geo} material={mat} px={1.8} /></group></group>;
};

export const Lump: React.FC<{ p?: [number, number, number]; s?: number; rot?: [number, number, number]; gear?: boolean; t?: number }> = ({ p = [0, 0, 0], s = 1, rot = [0, 0, 0], gear = true, t = 0 }) => {
  const x = AT();
  const geo = useMemo(() => { const r = rng(8); return smoothBlob(4, (v) => { const k = 0.84 + 0.26 * Math.sin(v.x * 3.1 + v.y * 2.3) * Math.cos(v.z * 2.7) + (r() - 0.5) * 0.02; return new THREE.Vector3(v.x * 1.25 * k, v.y * 0.8 * k, v.z * k); }); }, []);
  const mat = useMemo(() => { const t2 = x.crust.clone(); t2.needsUpdate = true; t2.repeat.set(1.6, 1.6); return toon(t2); }, [x]);
  return (
    <group position={p} rotation={rot} scale={s}>
      <Ink geometry={geo} material={mat} px={2.0} />
      {gear ? <Gear p={[0.62, 0.26, 0.5]} r={0.3} teeth={14} spin={t * 0.5} rot={[0.5, 0.2, 0.3]} depth={0.1} /> : null}
    </group>
  );
};

const dialTex = (kind: "moon" | "sun" | "games") =>
  cv(512, 512, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.fillStyle = "#e6d6a2"; g.beginPath(); g.arc(cx, cy, 250, 0, 7); g.fill(); g.lineWidth = 14; g.strokeStyle = INKD; g.stroke();
    g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 200, 0, 7); g.stroke();
    g.fillStyle = INKD; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * 224, cy + Math.sin(a) * 224, i % 4 ? 3 : 7, 0, 7); g.fill(); }
    if (kind === "moon") { g.fillStyle = "#1c2a4a"; g.beginPath(); g.arc(cx, cy, 130, 0, 7); g.fill(); g.fillStyle = "#f5efd0"; g.beginPath(); g.arc(cx, cy, 130, -Math.PI / 2, Math.PI / 2); g.bezierCurveTo(cx + 70, cy + 80, cx + 70, cy - 80, cx, cy - 130); g.fill(); g.lineWidth = 8; g.strokeStyle = INKD; g.beginPath(); g.arc(cx, cy, 130, 0, 7); g.stroke(); }
    if (kind === "sun") { g.fillStyle = "#f2b83a"; g.beginPath(); g.arc(cx - 40, cy, 100, 0, 7); g.fill(); g.fillStyle = "#1c2a4a"; g.beginPath(); g.arc(cx + 30, cy, 100, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = INKD; g.beginPath(); g.arc(cx - 40, cy, 100, 0, 7); g.stroke(); g.beginPath(); g.arc(cx + 30, cy, 100, 0, 7); g.stroke(); }
    if (kind === "games") { g.fillStyle = "#2f8f5a"; g.beginPath(); g.arc(cx, cy, 130, 0, 7); g.fill(); g.strokeStyle = "#fff6d0"; g.lineWidth = 12; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 32, 0, 7); g.stroke(); } }
    grain(g, w, h, 3, 800, 0.05);
  });

export const Machine: React.FC<{ p?: [number, number, number]; s?: number; rot?: [number, number, number]; t?: number; crank?: boolean; hand?: number }> = ({ p = [0, 0, 0], s = 1, rot = [0, 0, 0], t = 0, crank = true, hand = 0 }) => {
  const dials = useMemo(() => (["moon", "sun", "games"] as const).map((k) => new THREE.MeshBasicMaterial({ map: dialTex(k) })), []);
  const body = useMemo(() => toon("#c99a3a"), []);
  const wood = useMemo(() => toon("#6a4a2c"), []);
  const x = AT();
  const plate = useMemo(() => new THREE.MeshBasicMaterial({ map: x.letters }), [x]);
  const spin = t * 1.4 + hand;
  return (
    <group position={p} rotation={rot} scale={s}>
      <Ink geometry={box(2.0, 1.3, 0.55)} material={wood} px={2.2} />
      <Ink geometry={box(1.84, 1.14, 0.1)} material={body} position={[0, 0, 0.3]} px={1.8} />
      {[[-0.5, 0.25, 0.36, 0], [0.5, 0.25, 0.36, 1], [0, -0.28, 0.36, 2]].map(([x0, y0, z0, k], i) => (
        <group key={i} position={[x0 as number, y0 as number, z0 as number]}>
          <mesh material={dials[k as number]}><circleGeometry args={[0.34, 28]} /></mesh>
          <mesh position={[0, 0, 0.01]} rotation={[0, 0, -spin * (1 + i * 0.4)]}><planeGeometry args={[0.03, 0.28]} /><meshBasicMaterial color={INKD} /></mesh>
          <mesh position={[0, 0, 0.012]}><circleGeometry args={[0.035, 8]} /><meshBasicMaterial color={INKD} /></mesh>
        </group>
      ))}
      <mesh material={plate} position={[0.0, -0.46, 0.355]}><planeGeometry args={[0.8, 0.14]} /></mesh>
      <Gear p={[-0.1, 0.62, 0.0]} r={0.2} teeth={10} spin={spin} depth={0.08} />
      {crank ? <group position={[1.08, 0, 0]} rotation={[0, 0, spin]}><Ink geometry={box(0.5, 0.06, 0.06)} material={wood} position={[0.2, 0, 0]} px={1.6} /><Ink geometry={new THREE.SphereGeometry(0.08, 10, 8)} material={body} position={[0.45, 0, 0]} px={1.4} /></group> : null}
    </group>
  );
};

export const Fish: React.FC<{ t: number; seed?: number; color?: string; center?: [number, number, number]; radius?: number; speed?: number; s?: number }> = ({ t, seed = 1, color = "#f2a23a", center = [0, 2, 0], radius = 4, speed = 0.5, s = 1 }) => {
  const body = useMemo(() => { const g = new THREE.SphereGeometry(0.3, 12, 10); g.scale(1.5, 0.8, 0.5); return g; }, []);
  const tail = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-0.34, 0.26); sh.lineTo(-0.34, -0.26); sh.closePath(); return new THREE.ShapeGeometry(sh); }, []);
  const m = useMemo(() => toon(color), [color]); const dark = useMemo(() => new THREE.MeshBasicMaterial({ color: INKD, side: THREE.DoubleSide }), []);
  const a = t * speed + seed * 2.1;
  const pos: [number, number, number] = [center[0] + Math.cos(a) * radius, center[1] + Math.sin(a * 1.7 + seed) * 0.4, center[2] + Math.sin(a) * radius * 0.5];
  const yaw = -Math.atan2(Math.cos(a) * radius * 0.5, -Math.sin(a) * radius) + Math.PI / 2;
  return (
    <group position={pos} rotation={[0, yaw, 0]} scale={s}>
      <Ink geometry={body} material={m} px={1.6} cast={false} />
      <group position={[-0.42, 0, 0]} rotation={[0, Math.sin(t * 9 + seed) * 0.5, 0]}><mesh geometry={tail} material={dark} scale={1.14} /><mesh geometry={tail} material={m} position={[0, 0, 0.002]} /></group>
      <mesh position={[0.28, 0.06, 0.15]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color="#fff" /></mesh><mesh position={[0.3, 0.06, 0.19]}><sphereGeometry args={[0.025, 8, 6]} /><meshBasicMaterial color={INKD} /></mesh>
    </group>
  );
};

export const Bubbles: React.FC<{ t: number; n?: number; center?: [number, number, number]; spread?: number; height?: number }> = ({ t, n = 26, center = [0, 0, 0], spread = 2, height = 6 }) => {
  const b = useMemo(() => { const r = rng(21); return Array.from({ length: n }, () => ({ x: (r() - 0.5) * spread, z: (r() - 0.5) * spread, sp: 0.5 + r() * 0.8, ph: r() * 6, s: 0.04 + r() * 0.09 })); }, [n, spread]);
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: "#dff6ff", transparent: true, opacity: 0.55, depthWrite: false }), []);
  const g = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  return <group>{b.map((q, i) => <mesh key={i} geometry={g} material={m} scale={q.s} position={[center[0] + q.x + Math.sin(t * 1.5 + q.ph) * 0.12, center[1] + ((t * q.sp + q.ph) % height), center[2] + q.z]} />)}</group>;
};

export const LightRays: React.FC<{ t?: number; p?: [number, number, number]; n?: number; w?: number; h?: number }> = ({ t = 0, p = [0, 8, -2], n = 6, w = 1.6, h = 14 }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: AT().rays, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45 }), []);
  return <group position={p}>{Array.from({ length: n }, (_, i) => <mesh key={i} material={m} position={[-6 + i * 2.4 + Math.sin(t * 0.4 + i) * 0.3, 0, -i * 0.4]} rotation={[0, 0, -0.28]}><planeGeometry args={[w, h]} /></mesh>)}</group>;
};

export const Seaweed: React.FC<{ p: [number, number, number]; t: number; h?: number; color?: string; seed?: number }> = ({ p, t, h = 2.2, color = "#3f9a62", seed = 1 }) => {
  const geo = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.12, 0); s.quadraticCurveTo(-0.08, h * 0.5, 0, h); s.quadraticCurveTo(0.08, h * 0.5, 0.12, 0); s.closePath(); return new THREE.ShapeGeometry(s, 8); }, [h]);
  const m = useMemo(() => new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide }), [color]);
  return <group position={p}>{[-1, 0, 1].map((k) => <mesh key={k} geometry={geo} material={m} position={[k * 0.14, 0, k * 0.05]} rotation={[0, k * 0.5, Math.sin(t * 1.4 + seed + k) * 0.14]} />)}</group>;
};

export const Rock: React.FC<{ p: [number, number, number]; s?: number; color?: string; seed?: number }> = ({ p, s = 1, color = "#8a8a8a", seed = 1 }) => {
  const geo = useMemo(() => { const r = rng(seed * 5); return smoothBlob(3, (v) => { const k = 0.86 + 0.18 * Math.sin(v.x * 2.6 + seed) * Math.cos(v.z * 2.2 + v.y) + (r() - 0.5) * 0.015; return new THREE.Vector3(v.x * k * 1.1, v.y * k * 0.62, v.z * k); }); }, [seed]);
  const m = useMemo(() => toon(color), [color]);
  return <Ink geometry={geo} material={m} position={p} scale={s} px={2.0} />;
};

export const Sea: React.FC<{ t: number; y?: number; size?: [number, number]; z?: number }> = ({ t, y = 0, size = [260, 200], z = -60 }) => {
  const m = useMemo(() => { const tx = AT().sea.clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(size[0] / 8, size[1] / 8); return new THREE.MeshBasicMaterial({ map: tx, fog: true }); }, [size]);
  React.useLayoutEffect(() => { if (m.map) m.map.offset.set(t * 0.012, t * 0.02); });
  return <mesh material={m} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, z]}><planeGeometry args={size} /></mesh>;
};

export const Ship: React.FC<{ p?: [number, number, number]; s?: number; t?: number; rot?: [number, number, number]; sink?: number }> = ({ p = [0, 0, 0], s = 1, t = 0, rot = [0, 0, 0], sink = 0 }) => {
  const hull = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(-2.4, 0.5); sh.lineTo(2.7, 0.5); sh.quadraticCurveTo(2.3, -0.5, 1.2, -0.7); sh.lineTo(-1.6, -0.7); sh.quadraticCurveTo(-2.4, -0.4, -2.4, 0.5); return new THREE.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false }); }, []);
  const sail = useMemo(() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(1.7, 0.6, 1.6, 3.2); sh.lineTo(-0.1, 3.5); sh.quadraticCurveTo(0.25, 1.6, 0, 0); return new THREE.ShapeGeometry(sh, 12); }, []);
  const hm = useMemo(() => { const w = woodTexture(["#8a5a34", "#7a4a2c", "#9a6a40"], 3, 6); w.wrapS = w.wrapT = THREE.RepeatWrapping; w.repeat.set(0.5, 0.5); return toon(w); }, []);
  const sm = useMemo(() => { const cv2 = document.createElement("canvas"); cv2.width = 256; cv2.height = 256; const g = cv2.getContext("2d")!; g.fillStyle = "#f4e8c8"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#c8403a"; g.fillRect(0, 96, 256, 36); g.strokeStyle = "rgba(90,60,30,.4)"; g.lineWidth = 3; for (let y = 20; y < 256; y += 38) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + 6); g.stroke(); } const tx = new THREE.CanvasTexture(cv2); tx.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshToonMaterial({ map: tx, side: THREE.DoubleSide }); }, []);
  const rail = useMemo(() => toon("#6a4a2c"), []);
  return (
    <group position={[p[0], p[1] - sink + Math.sin(t * 1.3) * 0.08, p[2]]} rotation={[rot[0] + Math.sin(t * 1.1) * 0.03, rot[1], rot[2] + Math.sin(t * 0.9) * 0.05 + sink * 0.18]} scale={s}>
      <Ink geometry={hull} material={hm} position={[0, 0, -0.65]} px={2.4} />
      <Ink geometry={box(5.2, 0.5, 0.14)} material={rail} position={[0.15, 0.82, 0.62]} px={1.8} /><Ink geometry={box(5.2, 0.5, 0.14)} material={rail} position={[0.15, 0.82, -0.62]} px={1.8} />
      {[-2, -1, 0, 1, 2].map((q) => <React.Fragment key={q}><Ink geometry={box(0.1, 0.5, 0.1)} material={rail} position={[q * 0.95 + 0.2, 0.8, 0.62]} px={1.4} cast={false} /><Ink geometry={box(0.1, 0.5, 0.1)} material={rail} position={[q * 0.95 + 0.2, 0.8, -0.62]} px={1.4} cast={false} /></React.Fragment>)}
      <Ink geometry={box(0.15, 4.8, 0.15)} material={rail} position={[0.2, 2.9, 0]} px={2} />
      <Ink geometry={box(2.4, 0.12, 0.12)} material={rail} position={[0.95, 3.9, 0]} px={1.6} />
      <group position={[0.3, 0.9, 0.05]}><mesh geometry={sail} material={sm} /><mesh geometry={sail} material={sm} position={[0, 0, -0.05]} /></group>
      <Ink geometry={box(1.5, 0.6, 1.0)} material={toon("#a8693b")} position={[-1.6, 0.85, 0]} px={2} />
      <mesh position={[0.2, 5.45, 0]}><planeGeometry args={[0.9, 0.5]} /><meshBasicMaterial color="#2b6aa8" side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

export const Candle: React.FC<{ p: [number, number, number]; t: number; seed?: number; h?: number }> = ({ p, t, seed = 1, h = 0.4 }) => (
  <group position={p}>
    <Ink geometry={new THREE.CylinderGeometry(0.07, 0.08, h, 10)} material={toon("#f6ecd0")} position={[0, h / 2, 0]} px={1.4} cast={false} />
    <mesh position={[0, h + 0.1 + Math.sin(t * 9 + seed) * 0.01, 0]} scale={[1, 1.5 + Math.sin(t * 13 + seed) * 0.12, 1]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color="#ffd36a" /></mesh>
    <Glow p={[0, h + 0.1, 0.1]} s={0.9} />
  </group>
);

export const Vase: React.FC<{ p: [number, number, number]; s?: number; color?: string }> = ({ p, s = 1, color = "#c99a3a" }) => {
  const geo = useMemo(() => new THREE.LatheGeometry([[0.0, 0], [0.22, 0.02], [0.3, 0.2], [0.36, 0.45], [0.26, 0.7], [0.14, 0.8], [0.18, 0.92], [0.0, 0.92]].map(([x, y]) => new THREE.Vector2(x, y)), 18), []);
  return <Ink geometry={geo} material={toon(color)} position={p} scale={s} px={1.8} />;
};
export { clamp };
