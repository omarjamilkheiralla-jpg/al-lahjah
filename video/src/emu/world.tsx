import * as THREE from "three";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { Ink, box, toon, rng, clamp, woodTexture } from "../hotel/kit";
import { INKD } from "../full/paint";
import { tex as natureTex } from "../full/nature";

type V3 = [number, number, number];
export const cv = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const blur = (g: CanvasRenderingContext2D, px: number, fn: () => void) => { g.filter = `blur(${px}px)`; fn(); g.filter = "none"; };
const grain = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n = 1200, a = 0.04) => { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(42,26,30,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };
const wrap = (w: number, h: number, fn: (ox: number, oy: number) => void) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) fn(ox, oy); };
const memo = <T,>(k: string, f: () => T): T => { const m = (memo as any).c ??= new Map(); if (!m.has(k)) m.set(k, f()); return m.get(k); };

/* ------------------------------------------------------------ textures */
export const TX = () => memo("tx", () => ({
  dirt: cv(1024, 1024, (g, w, h) => {
    const r = rng(21); g.fillStyle = "#b06a44"; g.fillRect(0, 0, w, h);
    blur(g, 34, () => { for (let i = 0; i < 90; i++) { g.fillStyle = ["#b97449", "#ae6a42", "#bf7c52", "#a8643f", "#b56f46"][i % 5]; const x = r() * w, y = r() * h, rx = 60 + r() * 140, ry = 30 + r() * 80, rot = r() * 3; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rx, ry, rot, 0, 7); g.fill(); }); } });
    blur(g, 22, () => { for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? "rgba(120,60,34,.05)" : "rgba(220,150,100,.05)"; const x = r() * w, y = r() * h, rx = 50 + r() * 90; wrap(w, h, (ox, oy) => { g.beginPath(); g.ellipse(x + ox, y + oy, rx, rx * 0.6, 0, 0, 7); g.fill(); }); } });
    for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < 0.5 ? "#c9b070" : "#8a7a3e"; wrap(w, h, (ox, oy) => { for (let b = -2; b <= 2; b++) { g.beginPath(); g.moveTo(x + ox + b * 5, y + oy); g.lineTo(x + ox + b * 7 - 3, y + oy - 16 - r() * 8); g.lineTo(x + ox + b * 5 + 4, y + oy); g.fill(); } }); }
    for (let i = 0; i < 460; i++) { const x = r() * w, y = r() * h, rr = 1.6 + r() * 3.6; g.fillStyle = r() < 0.5 ? "#d9a074" : "#6a3320"; wrap(w, h, (ox, oy) => { g.beginPath(); g.arc(x + ox, y + oy, rr, 0, 7); g.fill(); }); }
    grain(g, w, h, 5, 2600, 0.035);
  }, true),
  wheat: cv(128, 256, (g, w, h) => {
    const stalk = (x: number, lean: number, top: number, hh: number) => {
      const bx = x, tx2 = x + lean;
      g.fillStyle = "#9a8a34"; g.beginPath(); g.moveTo(bx - 4, h); g.quadraticCurveTo(bx - 3 + lean * 0.4, h * 0.6, tx2 - 3, top + hh); g.lineTo(tx2 + 3, top + hh); g.quadraticCurveTo(bx + 3 + lean * 0.4, h * 0.6, bx + 4, h); g.closePath(); g.fill();
      const hg = g.createLinearGradient(tx2 - 12, 0, tx2 + 12, 0); hg.addColorStop(0, "#d9b43a"); hg.addColorStop(0.5, "#f2d25a"); hg.addColorStop(1, "#c8a02e");
      g.fillStyle = hg; g.beginPath(); g.moveTo(tx2, top - 6); g.quadraticCurveTo(tx2 + 14, top + hh * 0.3, tx2 + 10, top + hh); g.lineTo(tx2 - 10, top + hh); g.quadraticCurveTo(tx2 - 14, top + hh * 0.3, tx2, top - 6); g.closePath(); g.fill();
      g.fillStyle = "rgba(150,100,10,.09)"; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(tx2 + (k % 2 ? 5 : -5), top + 10 + k * (hh / 7.5), 5, 7, k % 2 ? 0.5 : -0.5, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,240,170,.42)"; g.beginPath(); g.ellipse(tx2 - 4, top + hh * 0.4, 3.4, hh * 0.32, 0, 0, 7); g.fill();
      g.fillStyle = "#8a7e2e"; g.beginPath(); g.moveTo(bx + 2, h * 0.78); g.quadraticCurveTo(bx + 30, h * 0.6, bx + 36, h * 0.5); g.quadraticCurveTo(bx + 20, h * 0.66, bx - 2, h * 0.84); g.closePath(); g.fill();
    };
    stalk(26, -5, 34, 78); stalk(62, 4, 14, 84); stalk(98, -3, 40, 74);
    const gr = g.createLinearGradient(0, h * 0.5, 0, h); gr.addColorStop(0, "rgba(40,30,0,0)"); gr.addColorStop(1, "rgba(40,30,0,.7)"); g.fillStyle = gr; g.globalCompositeOperation = "source-atop"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over";
  }),
  bark: cv(256, 512, (g, w, h) => {
    const r = rng(2); g.fillStyle = "#d8cfba"; g.fillRect(0, 0, w, h);
    blur(g, 14, () => { for (let i = 0; i < 40; i++) { g.fillStyle = ["#b9ac90", "#e6dec8", "#c9a47a", "#a89a80"][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 40, 40 + r() * 100, 0, 0, 7); g.fill(); } });
    grain(g, w, h, 3, 1200, 0.05);
  }),
  gumLeaf: cv(256, 256, (g, w, h) => {
    const r = rng(8); g.fillStyle = "#6f9a82"; g.fillRect(0, 0, w, h);
    blur(g, 8, () => { for (let i = 0; i < 60; i++) { g.fillStyle = ["#86b09a", "#5a8a74", "#a0c4ae", "#4f7a68"][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 30, 6 + r() * 14, r() * 3, 0, 7); g.fill(); } });
    grain(g, w, h, 4, 600, 0.05);
  }, true),
  iron: cv(256, 256, (g, w, h) => {
    const r = rng(4); g.fillStyle = "#9aa4a8"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, "rgba(255,255,255,.28)"); gr.addColorStop(0.5, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.24)"); g.fillStyle = gr; g.fillRect(x, 0, 32, h); }
    blur(g, 12, () => { for (let i = 0; i < 26; i++) { g.fillStyle = i % 2 ? "rgba(150,80,40,.34)" : "rgba(60,50,40,.22)"; g.beginPath(); g.ellipse(r() * w, r() * h, 14 + r() * 24, 24 + r() * 50, 0, 0, 7); g.fill(); } });
    grain(g, w, h, 4, 900, 0.04);
  }, true),
  plank: woodTexture(["#9a6a44", "#8a5c3a", "#a8763e"], 4, 8, true),
  canvas: cv(512, 512, (g, w, h) => {
    const r = rng(12); g.fillStyle = "#e0d2a6"; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 128) { const gr = g.createLinearGradient(x, 0, x + 128, 0); gr.addColorStop(0, "rgba(255,255,255,.18)"); gr.addColorStop(0.5, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(80,60,20,.2)"); g.fillStyle = gr; g.fillRect(x, 0, 128, h); }
    blur(g, 16, () => { for (let i = 0; i < 30; i++) { g.fillStyle = i % 2 ? "rgba(120,90,40,.18)" : "rgba(255,255,255,.16)"; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 60, 20 + r() * 50, 0, 0, 7); g.fill(); } });
    for (let y = 0; y < h; y += 4) { g.fillStyle = "rgba(90,70,30,.05)"; g.fillRect(0, y, w, 2); }
    grain(g, w, h, 6, 1600, 0.04);
  }, true),
  truckPaint: cv(256, 256, (g, w, h) => {
    const r = rng(14); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7e8a54"); gr.addColorStop(0.7, "#6a7646"); gr.addColorStop(1, "#4f5a34"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    blur(g, 16, () => { for (let i = 0; i < 34; i++) { g.fillStyle = i % 3 ? "rgba(170,100,50,.3)" : "rgba(200,160,110,.28)"; g.beginPath(); g.ellipse(r() * w, h * 0.55 + r() * h * 0.45, 20 + r() * 40, 8 + r() * 20, 0, 0, 7); g.fill(); } });
    g.fillStyle = "rgba(30,36,18,.55)"; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(14 + (i % 9) * 28, i < 9 ? 18 : h - 18, 3.4, 0, 7); g.fill(); }
    grain(g, w, h, 3, 1200, 0.05);
  }),
  metal: cv(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#8a97a8"); gr.addColorStop(0.5, "#5e6a7c"); gr.addColorStop(1, "#444e5e"); g.fillStyle = gr; g.fillRect(0, 0, w, h); blur(g, 6, () => { const r = rng(9); for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.ellipse(r() * w, r() * h, 18, 6, 0.5, 0, 7); g.fill(); } }); grain(g, w, h, 5, 500, 0.05); }),
  smoke: cv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(245,240,232,.9)"); gr.addColorStop(0.55, "rgba(225,215,200,.5)"); gr.addColorStop(1, "rgba(215,205,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  flash: cv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,250,210,1)"); gr.addColorStop(0.3, "rgba(255,200,90,.85)"); gr.addColorStop(1, "rgba(255,140,40,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  glow: cv(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,236,190,.95)"); gr.addColorStop(1, "rgba(255,236,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  map: cv(1024, 768, (g, w, h) => {
    const r = rng(7); g.fillStyle = "#e6d6a6"; g.fillRect(0, 0, w, h);
    blur(g, 30, () => { for (let i = 0; i < 30; i++) { g.fillStyle = i % 2 ? "rgba(150,110,50,.12)" : "rgba(255,255,255,.18)"; g.beginPath(); g.ellipse(r() * w, r() * h, 80 + r() * 100, 50 + r() * 70, 0, 0, 7); g.fill(); } });
    g.fillStyle = "#d9c27a"; for (const [x, y, ww, hh] of [[120, 140, 260, 180], [440, 110, 220, 150], [700, 200, 220, 200], [150, 420, 240, 200], [480, 400, 260, 220]] as const) { g.fillRect(x, y, ww, hh); g.lineWidth = 8; g.strokeStyle = "#8a6a2a"; g.strokeRect(x, y, ww, hh); }
    g.strokeStyle = "#4a8ab8"; g.lineWidth = 22; g.lineCap = "round"; g.beginPath(); g.moveTo(40, 640); g.bezierCurveTo(260, 560, 360, 700, 620, 600); g.bezierCurveTo(800, 530, 900, 600, 990, 520); g.stroke();
    g.strokeStyle = "#8a6a4a"; g.lineWidth = 12; g.setLineDash([26, 18]); g.beginPath(); g.moveTo(60, 60); g.bezierCurveTo(300, 330, 640, 330, 970, 700); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#c8403a"; g.font = "400 66px 'Lilita One', Impact, sans-serif"; g.textAlign = "center"; g.fillText("CAMPION", 330, 520); g.fillStyle = "#2a1a1e"; g.font = "400 44px 'Playfair Display', Georgia, serif"; g.fillText("WESTERN AUSTRALIA", 560, 730);
    g.lineWidth = 14; g.strokeStyle = "#2a1a1e"; g.strokeRect(10, 10, w - 20, h - 20); grain(g, w, h, 5, 1400, 0.04);
  }),
}));
const tc = (t: THREE.Texture, rx: number, ry: number) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); return c; };

/* ------------------------------------------------------------ sky + horizon */
const SKY: Record<string, [number, string][]> = {
  day: [[0, "#4f8fd8"], [0.3, "#86bce8"], [0.45, "#cfe6f2"], [0.5, "#f6e8cc"], [1, "#f6e8cc"]],
  gold: [[0, "#4a74b8"], [0.22, "#7aa6d8"], [0.38, "#f2c98a"], [0.46, "#ffb066"], [0.5, "#ffc17a"], [1, "#ffc17a"]],
  dusk: [[0, "#2c2f6a"], [0.22, "#7a4a8a"], [0.38, "#e0707a"], [0.46, "#ff9a5a"], [0.5, "#ffb56a"], [1, "#ffb56a"]],
};
export const Sky: React.FC<{ kind?: "day" | "gold" | "dusk"; t?: number; sun?: V3 }> = ({ kind = "day", t = 0, sun }) => {
  const skyTex = useMemo(() => cv(8, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); SKY[kind].forEach(([s, c]) => gr.addColorStop(s, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), [kind]);
  const clouds = useMemo(() => { const r = rng(33); return Array.from({ length: 11 }, (_, i) => ({ ang: -1.15 + (i / 10) * 2.3 + (r() - 0.5) * 0.2, h: 24 + r() * 40, s: 55 + r() * 45, v: i % 3, drift: 0.01 + r() * 0.02, d: 150 + r() * 25 })); }, []);
  const ct = natureTex().clouds as THREE.Texture[];
  const tint = kind === "day" ? "#ffffff" : kind === "gold" ? "#ffd9a8" : "#ffb0a0";
  const mats = useMemo(() => ct.map((tx) => new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, fog: false, color: tint })), [ct, tint]);
  const sunPos: V3 = sun ?? (kind === "gold" ? [-70, 24, -150] : kind === "dusk" ? [30, 9, -150] : [40, 70, -150]);
  const gm = useMemo(() => new THREE.MeshBasicMaterial({ map: TX().glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), []);
  return (
    <group>
      <mesh renderOrder={-10}><sphereGeometry args={[210, 32, 20]} /><meshBasicMaterial map={skyTex} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
      {clouds.map((c, i) => { const a = c.ang + t * c.drift; return <mesh key={i} material={mats[c.v]} position={[Math.sin(a) * c.d, c.h, -Math.cos(a) * c.d]} rotation={[0, -a, 0]} renderOrder={-9}><planeGeometry args={[c.s, c.s / 2]} /></mesh>; })}
      {kind !== "day" ? <group position={sunPos}><mesh><circleGeometry args={[kind === "dusk" ? 12 : 9, 36]} /><meshBasicMaterial color="#fff2c4" fog={false} /></mesh><mesh material={gm} position={[0, 0, 1]}><planeGeometry args={[120, 120]} /></mesh><mesh material={gm} position={[0, 0, 2]}><planeGeometry args={[260, 200]} /></mesh></group> : null}
    </group>
  );
};

export const OutbackHorizon: React.FC<{ tone?: "day" | "gold" | "dusk" }> = ({ tone = "day" }) => {
  const cols = tone === "day" ? ["#c9917e", "#b7765f", "#9d5e48"] : tone === "gold" ? ["#d9906a", "#c4744c", "#a65a3a"] : ["#a8607a", "#8a4a68", "#6a3a56"];
  const hills = useMemo(() => { const r = rng(61); const L: { x: number; z: number; w: number; h: number; d: number; c: number }[] = []; [[-98, 10, 0], [-78, 7, 1], [-60, 5, 2]].forEach(([z, h, c]) => { for (let i = 0; i < 9; i++) L.push({ x: -150 + i * 36 + r() * 12, z: z + r() * 8, w: 26 + r() * 34, h: h * (0.6 + r() * 0.8), d: 16, c }); }); return L; }, []);
  const trees = useMemo(() => { const r = rng(9); return Array.from({ length: 36 }, () => ({ x: -90 + r() * 180, z: -50 - r() * 10, s: 1.6 + r() * 1.6 })); }, []);
  return (
    <group>
      {hills.map((hl, i) => <mesh key={i} position={[hl.x, -hl.h * 0.32, hl.z]} scale={[hl.w, hl.h, hl.d]}><sphereGeometry args={[1, 24, 12]} /><meshBasicMaterial color={cols[hl.c]} fog /></mesh>)}
      {[[-60, -105, 12], [70, -110, 9]].map(([x, z, h], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, (h as number) / 2 - 1, 0]}><boxGeometry args={[34, h as number, 14]} /><meshBasicMaterial color={cols[0]} fog /></mesh><mesh position={[0, (h as number) + 0.6, 0]}><boxGeometry args={[36, 1.6, 15]} /><meshBasicMaterial color={cols[1]} fog /></mesh></group>)}
      {trees.map((tr, i) => <mesh key={i} position={[tr.x, tr.s * 0.5, tr.z]} scale={[tr.s * 1.2, tr.s * 0.8, tr.s]}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial color={tone === "dusk" ? "#3f4a58" : "#5d7a68"} fog /></mesh>)}
    </group>
  );
};

/* ------------------------------------------------------------ ground + wheat */
export const RedDirt: React.FC<{ w?: number; d?: number; z?: number; y?: number; x?: number; tile?: number }> = ({ w = 240, d = 160, z = -30, y = 0, x = 0, tile = 12 }) => {
  const m = useMemo(() => toon(tc(TX().dirt, w / tile, d / tile)), [w, d, tile]);
  const g = useMemo(() => new THREE.PlaneGeometry(w, d), [w, d]);
  return <mesh geometry={g} material={m} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]} />;
};

export const Wheat: React.FC<{ x?: number; z?: number; w: number; d: number; n?: number; t: number; h?: number; seed?: number; hole?: { x: number; z: number; r: number }; sway?: number }> = ({ x = 0, z = 0, w, d, n = 2200, t, h = 1.15, seed = 1, hole, sway = 1 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(0.5, 1); g.translate(0, 0.5, 0); return g; }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: TX().wheat, alphaTest: 0.4, side: THREE.DoubleSide }), []);
  const base = useMemo(() => { const r = rng(seed * 7); const a: { x: number; z: number; yaw: number; s: number; ph: number }[] = []; for (let i = 0; i < n; i++) { const px = x + (r() - 0.5) * w, pz = z + (r() - 0.5) * d; if (hole && Math.hypot(px - hole.x, pz - hole.z) < hole.r) continue; a.push({ x: px, z: pz, yaw: r() * Math.PI, s: 0.8 + r() * 0.5, ph: r() * 6 }); } return a; }, [x, z, w, d, n, seed, hole]);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return; const o = new THREE.Object3D(); const c = new THREE.Color();
    base.forEach((b, i) => { const sw = (Math.sin(t * 1.6 + b.x * 0.35 + b.ph * 0.2) * 0.06 + Math.sin(t * 2.7 + b.z * 0.5) * 0.025) * sway; o.position.set(b.x, 0, b.z); o.rotation.set(sw, b.yaw, sw * 0.6); o.scale.set(b.s, b.s * h, b.s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); const k = 0.82 + ((i * 37) % 100) / 100 * 0.3; c.setRGB(k, k * 0.98, k * 0.9); m.setColorAt(i, c); });
    m.count = base.length; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [base, t, h, sway]);
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
};

/* ------------------------------------------------------------ props */
export const GumTree: React.FC<{ p: V3; s?: number; seed?: number }> = ({ p, s = 1, seed = 1 }) => {
  const x = TX();
  const trunk = useMemo(() => { const g = new THREE.CylinderGeometry(0.14, 0.3, 4.4, 10, 8); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + Math.sin(pos.getY(i) * 0.7 + seed) * 0.22); g.computeVertexNormals(); return g; }, [seed]);
  const bark = useMemo(() => toon(tc(x.bark, 1, 2)), [x]); const leaf = useMemo(() => toon(tc(x.gumLeaf, 2, 2)), [x]);
  const blobs = useMemo(() => { const r = rng(seed * 13); return Array.from({ length: 6 }, (_, i) => ({ x: (r() - 0.5) * 3.2, y: 4.4 + r() * 1.4, z: (r() - 0.5) * 2.2, sx: 1.5 + r() * 0.9, sy: 0.7 + r() * 0.35, sz: 1.2 + r() * 0.7 })); }, [seed]);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  return (
    <group position={p} scale={s}>
      <Ink geometry={trunk} material={bark} position={[0, 2.2, 0]} px={2.2} />
      <Ink geometry={new THREE.CylinderGeometry(0.06, 0.12, 1.8, 8)} material={bark} position={[0.7, 3.9, 0]} rotation={[0, 0, -0.9]} px={1.6} />
      <Ink geometry={new THREE.CylinderGeometry(0.05, 0.1, 1.5, 8)} material={bark} position={[-0.6, 4.0, 0.1]} rotation={[0, 0, 0.9]} px={1.6} />
      {blobs.map((b, i) => <group key={i} position={[b.x, b.y, b.z]} scale={[b.sx, b.sy, b.sz]}><Ink geometry={geo} material={leaf} px={2.2} /></group>)}
    </group>
  );
};

export const Windmill: React.FC<{ p: V3; t: number; s?: number }> = ({ p, t, s = 1 }) => {
  const x = TX(); const metal = useMemo(() => toon(x.metal), [x]); const wood = useMemo(() => toon(x.plank), [x]); const iron = useMemo(() => toon(tc(x.iron, 2, 2)), [x]);
  return (
    <group position={p} scale={s}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([lx, lz], i) => <Ink key={i} geometry={box(0.14, 9, 0.14)} material={wood} position={[lx * 0.95, 4.5, lz * 0.95]} rotation={[lz * 0.07, 0, -lx * 0.07]} px={1.8} />)}
      {[1.8, 4.2, 6.6].map((y, i) => <React.Fragment key={i}><Ink geometry={box(1.7 - i * 0.28, 0.1, 0.1)} material={wood} position={[0, y, 0.82 - i * 0.14]} px={1.4} cast={false} /><Ink geometry={box(1.7 - i * 0.28, 0.1, 0.1)} material={wood} position={[0, y, -0.82 + i * 0.14]} px={1.4} cast={false} /></React.Fragment>)}
      <Ink geometry={box(1.5, 0.16, 1.5)} material={wood} position={[0, 8.9, 0]} px={2} />
      <group position={[0, 9.4, 1.0]} rotation={[0, 0, t * 1.4]}>
        <Ink geometry={new THREE.CylinderGeometry(0.2, 0.2, 0.3, 14)} material={metal} rotation={[Math.PI / 2, 0, 0]} px={1.6} />
        {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return <group key={i} rotation={[0, 0, a]}><Ink geometry={box(0.07, 2.0, 0.04)} material={metal} position={[0, 1.2, 0]} px={1.2} cast={false} /><Ink geometry={box(0.34, 0.9, 0.04)} material={iron} position={[0.1, 2.0, 0]} rotation={[0, 0, 0.25]} px={1.4} cast={false} /></group>; })}
        <Ink geometry={new THREE.TorusGeometry(1.9, 0.06, 6, 40)} material={metal} px={1.2} cast={false} />
      </group>
      <Ink geometry={box(2.6, 0.12, 0.12)} material={wood} position={[0, 9.4, -0.9]} px={1.4} cast={false} />
      <Ink geometry={box(0.04, 1.2, 1.0)} material={iron} position={[0, 9.4, -2.0]} px={1.4} cast={false} />
      <Ink geometry={new THREE.CylinderGeometry(1.1, 1.1, 1.6, 24)} material={iron} position={[2.4, 0.8, 0]} px={2.2} />
    </group>
  );
};

export const Shed: React.FC<{ p: V3; s?: number; rot?: number }> = ({ p, s = 1, rot = 0 }) => {
  const x = TX(); const wall = useMemo(() => toon(tc(x.plank, 2, 1)), [x]); const roof = useMemo(() => toon(tc(x.iron, 3, 2)), [x]); const dark = useMemo(() => toon("#3a2a22"), []);
  return (
    <group position={p} scale={s} rotation={[0, rot, 0]}>
      <Ink geometry={box(5.4, 2.6, 3.6)} material={wall} position={[0, 1.3, 0]} px={2.4} />
      <Ink geometry={box(6.2, 0.14, 2.2)} material={roof} position={[0, 3.2, 0.85]} rotation={[0.38, 0, 0]} px={2.2} />
      <Ink geometry={box(6.2, 0.14, 2.2)} material={roof} position={[0, 3.2, -0.85]} rotation={[-0.38, 0, 0]} px={2.2} />
      <Ink geometry={box(1.3, 1.9, 0.12)} material={dark} position={[-1.1, 0.95, 1.84]} px={1.8} />
      <Ink geometry={box(1.0, 0.8, 0.1)} material={dark} position={[1.4, 1.5, 1.84]} px={1.8} />
      <mesh position={[1.4, 1.5, 1.9]}><planeGeometry args={[0.76, 0.58]} /><meshBasicMaterial color="#cfe3ee" /></mesh>
    </group>
  );
};

const gunMetal = () => memo("gunmetal", () => toon(TX().metal));
export const LewisGun: React.FC<{ p?: V3; rot?: number; s?: number; fire?: number; t?: number; tripod?: boolean; elev?: number }> = ({ p = [0, 0, 0], rot = 0, s = 1, fire = 0, t = 0, tripod = true, elev = 0 }) => {
  const m = gunMetal(); const dark = useMemo(() => toon("#2c3038"), []); const wood = useMemo(() => toon(TX().plank), []);
  const flash = useMemo(() => new THREE.MeshBasicMaterial({ map: TX().flash, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const rec = fire > 0 ? Math.sin(t * 60) * 0.015 : 0;
  return (
    <group position={p} rotation={[0, rot, 0]} scale={s}>
      {tripod ? [[-0.15, 0.55], [0.15, 0.55], [0, -0.6]].map(([lx, lz], i) => <Ink key={i} geometry={new THREE.CylinderGeometry(0.03, 0.045, 0.95, 8)} material={dark} position={[lx * 0.5, 0.45, lz * 0.5]} rotation={[lz * 0.5, 0, -lx * 1.2]} px={1.4} />) : null}
      <group position={[rec, 0.95, 0]} rotation={[0, 0, elev]}>
        <Ink geometry={box(0.62, 0.2, 0.17)} material={m} px={1.6} />
        <Ink geometry={new THREE.CylinderGeometry(0.075, 0.075, 1.05, 14)} material={m} position={[0.8, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} px={1.6} />
        {Array.from({ length: 7 }, (_, i) => <Ink key={i} geometry={new THREE.TorusGeometry(0.08, 0.018, 6, 14)} material={dark} position={[0.45 + i * 0.15, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} px={1} cast={false} />)}
        <Ink geometry={new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8)} material={dark} position={[1.5, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} px={1.2} />
        <Ink geometry={new THREE.CylinderGeometry(0.22, 0.22, 0.075, 22)} material={dark} position={[0.05, 0.2, 0]} px={1.6} />
        <Ink geometry={new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10)} material={m} position={[0.05, 0.26, 0]} px={1.2} cast={false} />
        <Ink geometry={box(0.55, 0.13, 0.1)} material={wood} position={[-0.55, -0.03, 0]} rotation={[0, 0, 0.08]} px={1.6} />
        <Ink geometry={box(0.07, 0.2, 0.07)} material={dark} position={[-0.12, -0.18, 0]} px={1.2} cast={false} />
        <Ink geometry={box(0.04, 0.09, 0.04)} material={dark} position={[1.2, 0.12, 0]} px={1} cast={false} />
        {fire > 0 ? <mesh material={flash} position={[1.78, 0.02, 0.05]} scale={0.7 + 0.3 * Math.sin(t * 70)}><planeGeometry args={[0.9, 0.9]} /></mesh> : null}
      </group>
    </group>
  );
};

export const Truck: React.FC<{ p?: V3; t?: number; s?: number; rot?: number; speed?: number; gun?: boolean; fire?: number; bounce?: number }> = ({ p = [0, 0, 0], t = 0, s = 1, rot = 0, speed = 3, gun = false, fire = 0, bounce = 1 }) => {
  const x = TX(); const paint = useMemo(() => toon(x.truckPaint), [x]); const dark = useMemo(() => toon("#2c3038"), []); const tire = useMemo(() => toon("#2a2628"), []); const wood = useMemo(() => toon(tc(x.plank, 2, 1)), [x]);
  const metal = gunMetal();
  const glass = useMemo(() => new THREE.MeshBasicMaterial({ color: "#86a8bc", transparent: true, opacity: 0.85 }), []);
  const hl = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff2b8" }), []);
  const bump = bounce * (Math.abs(Math.sin(t * 9)) * 0.07 + Math.sin(t * 17) * 0.015);
  const spin = (t * speed) / 0.55;
  return (
    <group position={[p[0], p[1] + bump, p[2]]} rotation={[0, rot, Math.sin(t * 9) * 0.012 * bounce]} scale={s}>
      <Ink geometry={box(4.4, 0.34, 1.6)} material={dark} position={[0, 0.78, 0]} px={2} />
      <Ink geometry={box(1.15, 0.85, 1.5)} material={paint} position={[1.65, 1.35, 0]} px={2.2} />
      {[0.2, 0.0, -0.2].map((o, i) => <Ink key={i} geometry={box(0.04, 0.5, 1.2)} material={dark} position={[2.25, 1.35 + o * 0.0, 0]} px={0.8} cast={false} />)}
      <Ink geometry={box(1.25, 1.25, 1.5)} material={paint} position={[0.4, 1.75, 0]} px={2.2} />
      <Ink geometry={box(1.35, 0.1, 1.6)} material={paint} position={[0.4, 2.42, 0]} px={2} />
      <mesh material={glass} position={[1.04, 1.9, 0]}><planeGeometry args={[0.02, 0.62]} /></mesh>
      <mesh material={glass} position={[1.03, 1.95, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.2, 0.62]} /></mesh>
      <mesh material={glass} position={[0.4, 1.95, 0.76]}><planeGeometry args={[0.9, 0.62]} /></mesh><mesh material={glass} position={[0.4, 1.95, -0.76]}><planeGeometry args={[0.9, 0.62]} /></mesh>
      <mesh material={hl} position={[2.27, 1.22, 0.5]}><circleGeometry args={[0.15, 14]} /></mesh><mesh material={hl} position={[2.27, 1.22, -0.5]}><circleGeometry args={[0.15, 14]} /></mesh>
      <Ink geometry={box(2.4, 0.1, 1.7)} material={wood} position={[-1.4, 1.0, 0]} px={2} />
      <Ink geometry={box(2.4, 0.5, 0.1)} material={wood} position={[-1.4, 1.3, 0.82]} px={1.8} /><Ink geometry={box(2.4, 0.5, 0.1)} material={wood} position={[-1.4, 1.3, -0.82]} px={1.8} /><Ink geometry={box(0.1, 0.5, 1.7)} material={wood} position={[-2.55, 1.3, 0]} px={1.8} />
      {[[1.55, 0.78], [1.55, -0.78], [-1.5, 0.78], [-1.5, -0.78]].map(([wx, wz], i) => (
        <group key={i} position={[wx, 0.55, wz]} rotation={[0, 0, -spin]}>
          <Ink geometry={new THREE.CylinderGeometry(0.55, 0.55, 0.3, 26)} material={[tire, toon("#7b848c"), toon("#7b848c")]} rotation={[Math.PI / 2, 0, 0]} px={2} />
          <Ink geometry={new THREE.CylinderGeometry(0.2, 0.2, 0.34, 14)} material={metal} rotation={[Math.PI / 2, 0, 0]} px={1.2} cast={false} />
          {Array.from({ length: 6 }, (_, k) => <mesh key={k} position={[Math.cos((k / 6) * 6.283) * 0.34, Math.sin((k / 6) * 6.283) * 0.34, wz > 0 ? 0.17 : -0.17]}><circleGeometry args={[0.04, 8]} /><meshBasicMaterial color="#2c3038" /></mesh>)}
        </group>
      ))}
      {[[1.55, 0.8], [1.55, -0.8], [-1.5, 0.8], [-1.5, -0.8]].map(([wx, wz], i) => <Ink key={i} geometry={box(1.1, 0.07, 0.34)} material={paint} position={[wx, 1.18, wz]} px={1.6} cast={false} />)}
      {gun ? <LewisGun p={[-1.3, 1.05, 0]} s={0.9} rot={0} fire={fire} t={t} tripod={false} elev={Math.sin(t * 9) * 0.05 + 0.1} /> : null}
    </group>
  );
};

/* ------------------------------------------------------------ smoke, dust, casings */
export const Puffs: React.FC<{ items: { x: number; y: number; z: number; born: number; life?: number; s0?: number; s1?: number; rise?: number; op?: number }[]; t: number; tint?: string }> = ({ items, t, tint = "#ffffff" }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: TX().smoke, transparent: true, depthWrite: false, color: tint }), [tint]);
  return <group>{items.map((it, i) => { const age = t - it.born, life = it.life ?? 1.4; if (age < 0 || age > life) return null; const k = age / life; const sc = (it.s0 ?? 0.3) + ((it.s1 ?? 1.4) - (it.s0 ?? 0.3)) * k; return <mesh key={i} position={[it.x, it.y + age * (it.rise ?? 0.5), it.z]} scale={sc}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={TX().smoke} transparent depthWrite={false} color={tint} opacity={(it.op ?? 0.6) * (1 - k) * Math.min(1, age * 8)} /></mesh>; })}</group>;
};
export const Casings: React.FC<{ n: number; center: V3; spread?: number; seed?: number }> = ({ n, center, spread = 1.4, seed = 3 }) => {
  const pts = useMemo(() => { const r = rng(seed); return Array.from({ length: 60 }, () => ({ x: center[0] + (r() - 0.5) * spread, z: center[2] + (r() - 0.2) * spread * 0.8, rot: r() * 3 })); }, [center, spread, seed]);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8), []); const m = useMemo(() => new THREE.MeshToonMaterial({ color: "#d8a83a" }), []);
  return <group>{pts.slice(0, Math.max(0, Math.min(60, Math.floor(n)))).map((q, i) => <mesh key={i} geometry={geo} material={m} position={[q.x, 0.04, q.z]} rotation={[Math.PI / 2, 0, q.rot]} />)}</group>;
};
export const SunDust: React.FC<{ t: number; n?: number; area?: V3 }> = ({ t, n = 40, area = [16, 6, 14] }) => {
  const pts = useMemo(() => { const r = rng(5); return Array.from({ length: n }, () => ({ x: (r() - 0.5) * area[0], y: 0.4 + r() * area[1], z: (r() - 0.5) * area[2], ph: r() * 6 })); }, [n, area]);
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffe6b0", transparent: true, opacity: 0.55, depthWrite: false }), []);
  return <group>{pts.map((q, i) => <mesh key={i} material={m} position={[q.x + Math.sin(t * 0.5 + q.ph) * 0.4, q.y + Math.sin(t * 0.7 + q.ph * 2) * 0.25, q.z]}><circleGeometry args={[0.025, 6]} /></mesh>)}</group>;
};
export { INKD, clamp };
