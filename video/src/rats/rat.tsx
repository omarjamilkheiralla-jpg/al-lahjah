import * as THREE from "three";
import React, { useMemo } from "react";
import { INKD, inkStroke } from "../full/paint";
import { Ink, toon, rng } from "../hotel/kit";

export type RatExpr = "deadpan" | "smug" | "worried" | "grin" | "shock" | "laugh" | "angry" | "sleep";

const mkc = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return { c, g: c.getContext("2d")! }; };
const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const cache = new Map<string, THREE.CanvasTexture>();

const furPalettes = { grey: ["#b9aca4", "#8e8078", "#d8cdc6"], brown: ["#a8806a", "#7a5640", "#cfae98"], white: ["#f2ece6", "#cbbfd0", "#ffffff"] } as const;
export type Fur = keyof typeof furPalettes;

/** painted rat head: big round ears, pointed snout, heavy-lidded eyes, whiskers */
export const ratHead = (expr: RatExpr, fur: Fur, v = 0) => {
  const id = `h:${expr}:${fur}:${v}`;
  const hit = cache.get(id); if (hit) return hit;
  const S = 512; const { c, g } = mkc(S, S);
  const [base, shade, hi] = furPalettes[fur];
  const cx = S / 2, cy = S * 0.56;
  const ink = (w: number) => { g.lineWidth = w; g.strokeStyle = INKD; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
  // ears
  for (const s of [-1, 1]) {
    g.beginPath(); g.ellipse(cx + s * 150, cy - 140, 82, 92, s * 0.25, 0, 7); g.fillStyle = base; g.fill(); ink(14);
    g.beginPath(); g.ellipse(cx + s * 150, cy - 138, 50, 60, s * 0.25, 0, 7); g.fillStyle = "#f0a9a6"; g.fill();
    g.fillStyle = "rgba(255,255,255,0.3)"; g.beginPath(); g.ellipse(cx + s * 135, cy - 168, 22, 14, s * 0.25, 0, 7); g.fill();
  }
  // head: pear shape with a pointed snout
  g.beginPath(); g.moveTo(cx, cy + 150);
  g.bezierCurveTo(cx - 190, cy + 130, cx - 215, cy - 40, cx - 150, cy - 130);
  g.bezierCurveTo(cx - 90, cy - 190, cx + 90, cy - 190, cx + 150, cy - 130);
  g.bezierCurveTo(cx + 215, cy - 40, cx + 190, cy + 130, cx, cy + 150); g.closePath();
  const gr = g.createLinearGradient(cx - 200, cy - 180, cx + 200, cy + 160); gr.addColorStop(0, hi); gr.addColorStop(0.35, base); gr.addColorStop(1, shade);
  g.fillStyle = gr; g.fill(); ink(16);
  g.save(); g.clip();
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.ellipse(cx - 70, cy - 90, 80, 40, -0.5, 0, 7); g.fill();
  // muzzle patch
  g.fillStyle = hi; g.beginPath(); g.ellipse(cx, cy + 70, 105, 78, 0, 0, 7); g.fill();
  const r = rng(5); for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? "rgba(42,26,30,0.05)" : "rgba(255,255,255,0.06)"; g.fillRect(r() * S, r() * S, 2, 2); }
  g.restore();
  // nose
  g.fillStyle = "#e88a96"; g.beginPath(); g.ellipse(cx, cy + 112, 30, 22, 0, 0, 7); g.fill(); ink(9);
  g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.ellipse(cx - 8, cy + 104, 8, 5, 0, 0, 7); g.fill();
  // teeth + mouth
  if (expr === "grin" || expr === "laugh") {
    g.fillStyle = "#6b1f2a"; g.beginPath(); g.moveTo(cx - 62, cy + 150); g.quadraticCurveTo(cx, cy + 215, cx + 62, cy + 150); g.closePath(); g.fill();
    g.fillStyle = "#fff"; g.fillRect(cx - 18, cy + 144, 36, 28); g.lineWidth = 4; g.strokeStyle = INKD; g.strokeRect(cx - 18, cy + 144, 36, 28); ink(9);
  } else if (expr === "shock") { g.fillStyle = "#5a1a24"; g.beginPath(); g.ellipse(cx, cy + 158, 22, 26, 0, 0, 7); g.fill(); ink(8); }
  else if (expr === "worried") inkStroke(g, [[cx - 40, cy + 162], [cx - 15, cy + 150], [cx + 15, cy + 162], [cx + 40, cy + 150]], 8, 3);
  else if (expr === "smug") { inkStroke(g, [[cx - 50, cy + 146], [cx, cy + 156], [cx + 58, cy + 132]], 9, 4); }
  else inkStroke(g, [[cx - 40, cy + 150], [cx, cy + 156], [cx + 40, cy + 150]], 8, 5);
  g.fillStyle = "#fff"; g.fillRect(cx - 12, cy + 150, 24, expr === "deadpan" ? 14 : 0);
  // whiskers
  g.strokeStyle = "rgba(42,26,30,0.7)"; g.lineWidth = 4; g.lineCap = "round";
  for (const s of [-1, 1]) for (const [dy, dyEnd] of [[96, 70], [112, 120], [128, 170]]) { g.beginPath(); g.moveTo(cx + s * 60, cy + dy); g.quadraticCurveTo(cx + s * 150, cy + dy + (dyEnd - dy) * 0.3, cx + s * 235, cy + dyEnd); g.stroke(); }
  // eyes
  const ex = 78, ey = cy - 28;
  const eye = (s: number) => {
    const x = cx + s * ex;
    if (expr === "sleep") { inkStroke(g, [[x - 34, ey - 4], [x, ey + 18], [x + 34, ey - 4]], 9, 6 + s); return; }
    g.fillStyle = expr === "shock" || expr === "worried" ? "#fff" : INKD;
    g.beginPath(); g.ellipse(x, ey, expr === "shock" ? 36 : 26, expr === "shock" ? 40 : 32, 0, 0, 7); g.fill();
    if (expr === "shock" || expr === "worried") { ink(8); g.fillStyle = INKD; g.beginPath(); g.arc(x, ey + 2, 13, 0, 7); g.fill(); }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x - 8, ey - 8, 7, 0, 7); g.fill();
    if (expr === "deadpan" || expr === "smug" || expr === "grin") {
      const lid = expr === "grin" ? 0.25 : 0.5;
      g.save(); g.beginPath(); g.ellipse(x, ey, 27, 33, 0, 0, 7); g.clip();   // the lid only covers the eye itself (no visible box)
      g.fillStyle = base; g.beginPath(); g.moveTo(x - 42, ey - 56); g.lineTo(x + 42, ey - 56); g.lineTo(x + 42, ey - 34 + lid * 40); g.quadraticCurveTo(x, ey - 38 + lid * 44, x - 42, ey - 34 + lid * 40); g.closePath(); g.fill(); g.restore();
      inkStroke(g, [[x - 42, ey - 34 + lid * 40], [x, ey - 38 + lid * 44], [x + 42, ey - 34 + lid * 40]], 9, 7 + s);
    }
  };
  eye(-1); eye(1);
  // brows
  const brow = (s: number, lift: number, tilt: number) => inkStroke(g, [[cx + s * ex - 34, ey - 62 - lift + tilt * s], [cx + s * ex, ey - 68 - lift], [cx + s * ex + 34, ey - 62 - lift - tilt * s]], 8, 20 + s);
  if (expr === "smug") { brow(-1, 4, 8); brow(1, 16, -6); } else if (expr === "worried" || expr === "shock") { brow(-1, 18, -14); brow(1, 18, -14); }
  else if (expr === "angry") { brow(-1, -4, 16); brow(1, -4, 16); } else if (expr !== "sleep") { brow(-1, 2, 4); brow(1, 2, 4); }
  const t = tex(c); cache.set(id, t); return t;
};

export const ratBody = (fur: Fur) => {
  const id = `b:${fur}`; const hit = cache.get(id); if (hit) return hit;
  const W = 360, H = 460; const { c, g } = mkc(W, H); const [base, shade, hi] = furPalettes[fur];
  g.beginPath(); g.moveTo(W / 2, 20); g.bezierCurveTo(W * 0.92, 40, W * 0.98, H * 0.7, W * 0.7, H - 20); g.bezierCurveTo(W * 0.55, H, W * 0.45, H, W * 0.3, H - 20); g.bezierCurveTo(W * 0.02, H * 0.7, W * 0.08, 40, W / 2, 20); g.closePath();
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, hi); gr.addColorStop(0.4, base); gr.addColorStop(1, shade); g.fillStyle = gr; g.fill();
  g.save(); g.clip(); g.fillStyle = hi; g.beginPath(); g.ellipse(W / 2, H * 0.62, W * 0.26, H * 0.3, 0, 0, 7); g.fill();
  const r = rng(8); for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? "rgba(42,26,30,0.05)" : "rgba(255,255,255,0.06)"; g.fillRect(r() * W, r() * H, 2, 2); } g.restore();
  g.lineWidth = 14; g.strokeStyle = INKD; g.lineJoin = "round"; g.stroke();
  const t = tex(c); cache.set(id, t); return t;
};

const ribbon = (len: number, w0: number, w1: number) => {
  const s = new THREE.Shape(); s.moveTo(-w0, 0); s.lineTo(-w1, -len);
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; s.lineTo(Math.cos(a) * w1, -len + Math.sin(a) * w1 * 0.9); }
  s.lineTo(w0, 0); s.closePath(); return new THREE.ShapeGeometry(s);
};
const inkM = new THREE.MeshBasicMaterial({ color: INKD, side: THREE.DoubleSide });
const armG = ribbon(0.2, 0.034, 0.028), legG = ribbon(0.3, 0.036, 0.028);

export type RatProps = {
  t: number; position?: [number, number, number]; yaw?: number; scale?: number; expr?: RatExpr; fur?: Fur; tail?: boolean;
  pose?: "idle" | "walk" | "wave" | "point" | "cheer"; bowtie?: boolean; seed?: number; tailColor?: string; flip?: number;
};

export const Rat: React.FC<RatProps> = ({ t, position = [0, 0, 0], yaw = 0, scale = 1, expr = "deadpan", fur = "grey", tail = true, pose = "idle", bowtie, seed = 1, flip = 1 }) => {
  const ph = (seed * 1.7) % 6;
  const hm = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const bm = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const boil = Math.floor(t * 5 + seed) % 2;
  hm.map = ratHead(expr, fur, boil); bm.map = ratBody(fur);
  const walk = pose === "walk"; const st = Math.sin(t * 9 + ph);
  const bob = (walk ? Math.abs(st) * 0.03 : Math.sin(t * 3 + ph) * 0.008);
  const tailGeo = useMemo(() => {
    const pts = [[0, 0], [0.16, -0.04], [0.3, 0.04], [0.38, 0.2], [0.3, 0.36], [0.34, 0.5]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.034, 8, false);
  }, []);
  const tailMat = useMemo(() => toon("#e0a8a2"), []);
  const arm = (s: number, ang: number) => (
    <group position={[s * 0.19, 0.55, 0.03]} rotation={[0, 0, ang]}><mesh geometry={armG} material={inkM} /><mesh position={[0, -0.2, 0.002]}><circleGeometry args={[0.04, 12]} /><meshBasicMaterial color={INKD} /></mesh></group>
  );
  const aL = pose === "cheer" ? -2.5 : pose === "wave" ? -0.3 : walk ? -0.2 + st * 0.3 : -0.15;
  const aR = pose === "cheer" ? 2.5 : pose === "wave" ? 2.3 + Math.sin(t * 9) * 0.35 : pose === "point" ? 1.5 : walk ? 0.2 - st * 0.3 : 0.15;
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={[scale * flip, scale, scale]}>
      <group position={[0, bob, 0]}>
        {tail ? <group position={[0.12, 0.27, -0.03]} rotation={[0, 0, Math.sin(t * 3 + ph) * 0.1]}><Ink geometry={tailGeo} material={tailMat} px={1.4} cast={false} /></group> : null}
        {[-1, 1].map((side) => {
          const sw = walk ? side * st * 0.22 : 0;
          const lift = walk ? Math.max(0, side * st) * 0.06 : 0;
          return (
            <group key={side} position={[side * 0.115, 0.3 + lift, 0.001]} rotation={[0, 0, sw]}>
              <mesh geometry={legG} material={inkM} />
              <mesh position={[side * 0.035, -0.29, 0.002]} scale={[1.25, 0.6, 1]}><circleGeometry args={[0.07, 14]} /><meshBasicMaterial color={INKD} /></mesh>
            </group>
          );
        })}
        {arm(-1, aL)}
        <mesh material={bm} position={[0, 0.5, 0]}><planeGeometry args={[0.48, 0.61]} /></mesh>
        {bowtie ? <group position={[0, 0.6, 0.02]}>
          <mesh position={[-0.075, 0, 0]} rotation={[0, 0, Math.PI / 6]}><circleGeometry args={[0.085, 3]} /><meshBasicMaterial color="#c8403a" /></mesh>
          <mesh position={[0.075, 0, 0]} rotation={[0, 0, Math.PI + Math.PI / 6]}><circleGeometry args={[0.085, 3]} /><meshBasicMaterial color="#c8403a" /></mesh>
          <mesh position={[0, 0, 0.003]}><circleGeometry args={[0.032, 14]} /><meshBasicMaterial color="#9a2a26" /></mesh>
        </group> : null}
        <group position={[0, 0.98, 0.03]} rotation={[0, 0, Math.sin(t * 2 + ph) * 0.05]}><mesh material={hm}><planeGeometry args={[0.86, 0.86]} /></mesh></group>
        {arm(1, aR)}
      </group>
    </group>
  );
};
