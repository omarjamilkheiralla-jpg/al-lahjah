import * as THREE from "three";
import React, { useMemo } from "react";
import { INKD } from "../full/paint";
import { rng, clamp } from "../hotel/kit";

const mk = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const softShadow = () => memo("sh", () => mk(128, 64, (g) => { const r = g.createRadialGradient(64, 32, 2, 64, 32, 62); r.addColorStop(0, "rgba(40,18,10,.9)"); r.addColorStop(1, "rgba(40,18,10,0)"); g.save(); g.scale(1, 0.5); g.translate(0, 32); g.fillStyle = r; g.fillRect(0, -32, 128, 128); g.restore(); }));
const cache = new Map<string, THREE.Texture>();
const memo = (k: string, f: () => THREE.Texture) => { let v = cache.get(k); if (!v) { v = f(); cache.set(k, v); } return v; };
const ink = (g: CanvasRenderingContext2D, w: number) => { g.lineWidth = w; g.strokeStyle = INKD; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };

/** shaggy body, side view facing left; the outline is scalloped and the surface is long soft feather strands (not blobs) */
export const emuBody = (shade = 0) => memo("body" + shade, () => mk(640, 480, (g, w, h) => {
  const r = rng(11 + shade); const pts: [number, number][] = [];
  const bez = (a: number[], b: number[], c: number[], d: number[], n: number) => { for (let i = 0; i < n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } };
  bez([70, 260], [60, 150], [240, 70], [430, 100], 22); bez([430, 100], [560, 130], [630, 230], [580, 320], 22); bez([580, 320], [520, 400], [250, 410], [130, 370], 22); bez([130, 370], [80, 340], [64, 300], [70, 260], 14);
  const cx = 340, cy = 250; const out = pts.map(([x, y], i) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, k = 4 + 8 * Math.abs(Math.sin(i * 1.9 + shade)) + r() * 3; return [x + (dx / l) * k, y + (dy / l) * k] as [number, number]; });
  const path = () => { g.beginPath(); const n = out.length; g.moveTo((out[0][0] + out[n - 1][0]) / 2, (out[0][1] + out[n - 1][1]) / 2); for (let i = 0; i < n; i++) { const a = out[i], b = out[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } g.closePath(); };
  path(); const gr = g.createLinearGradient(0, 60, 0, 430); gr.addColorStop(0, "#a08a6c"); gr.addColorStop(0.5, "#7e684e"); gr.addColorStop(1, "#5a483a"); g.fillStyle = gr; g.fill();
  g.save(); path(); g.clip();
  const strand = (x: number, y: number, len: number, ang: number, wd: number, col: string) => { g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, len / 2, wd, 0, 0, 7); g.fill(); g.restore(); };
  g.filter = "blur(1.2px)";
  for (let i = 0; i < 900; i++) { const x = 70 + r() * 560, y = 70 + r() * 350; const flow = 0.25 + (y - 250) / 700 + (x - 340) / 1600; strand(x, y, 22 + r() * 30, flow + (r() - 0.5) * 0.5, 2.4 + r() * 2.6, ["rgba(196,172,134,.34)", "rgba(52,38,28,.34)", "rgba(132,108,80,.4)", "rgba(222,204,170,.2)", "rgba(80,62,46,.36)"][i % 5]); }
  g.filter = "blur(16px)"; g.fillStyle = "rgba(214,194,156,.34)"; g.beginPath(); g.ellipse(300, 130, 190, 46, -0.1, 0, 7); g.fill(); g.fillStyle = "rgba(255,226,170,.22)"; g.beginPath(); g.ellipse(160, 250, 50, 90, 0, 0, 7); g.fill(); g.fillStyle = "rgba(30,20,14,.4)"; g.beginPath(); g.ellipse(350, 410, 260, 56, 0, 0, 7); g.fill(); g.filter = "none";
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,28,20,0.05)" : "rgba(255,255,255,0.05)"; g.fillRect(r() * w, r() * h, 2, 2); }
  g.restore(); path(); ink(g, 12);
}));

/** neck + head, side view facing left */
export const emuHead = (expr: string) => memo("head" + expr, () => mk(320, 640, (g, w, h) => {
  const skin = "#a7b6c4";
  const P0 = [206, 640], P1 = [250, 470], P2 = [90, 380], P3 = [148, 160];
  const at = (t: number) => { const u = 1 - t; return [u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]; };
  const rad = (t: number) => 50 - 26 * t;
  for (let i = 0; i <= 60; i++) { const [x, y] = at(i / 60); g.fillStyle = INKD; g.beginPath(); g.arc(x, y, rad(i / 60) + 8, 0, 7); g.fill(); }
  for (let i = 0; i <= 60; i++) { const [x, y] = at(i / 60); g.fillStyle = skin; g.beginPath(); g.arc(x, y, rad(i / 60), 0, 7); g.fill(); }
  g.save(); g.globalAlpha = 0.5; for (let i = 0; i <= 60; i++) { const [x, y] = at(i / 60); g.fillStyle = "#dbe6ef"; g.beginPath(); g.arc(x - rad(i / 60) * 0.35, y, rad(i / 60) * 0.42, 0, 7); g.fill(); } g.globalAlpha = 0.28; for (let i = 0; i <= 60; i++) { const [x, y] = at(i / 60); g.fillStyle = "#5a6c80"; g.beginPath(); g.arc(x + rad(i / 60) * 0.55, y, rad(i / 60) * 0.4, 0, 7); g.fill(); } g.restore();
  { const rr = rng(3); g.filter = "blur(1px)"; for (let i = 0; i < 70; i++) { const t = rr() * 0.62; const [x, y] = at(t); const a0 = rr() * 6.28, d = rad(t) * 0.85 * rr(); g.fillStyle = i % 3 ? "rgba(96,76,58,.62)" : "rgba(150,126,98,.5)"; g.save(); g.translate(x + Math.cos(a0) * d, y + Math.sin(a0) * d); g.rotate(0.5 + (rr() - 0.5) * 0.6); g.beginPath(); g.ellipse(0, 0, 12 + rr() * 8, 3, 0, 0, 7); g.fill(); g.restore(); } g.filter = "none"; }
  // head
  const hx = 142, hy = 122;
  g.fillStyle = skin; g.beginPath(); g.ellipse(hx, hy, 58, 48, -0.1, 0, 7); g.fill(); ink(g, 12);
  const hg = g.createRadialGradient(hx - 24, hy - 24, 6, hx, hy, 70); hg.addColorStop(0, "rgba(255,255,255,.45)"); hg.addColorStop(1, "rgba(60,80,110,.25)"); g.fillStyle = hg; g.beginPath(); g.ellipse(hx, hy, 56, 46, -0.1, 0, 7); g.fill();
  // beak
  g.fillStyle = "#4a4a54"; g.beginPath(); g.moveTo(82, 98); g.quadraticCurveTo(34, 106, 8, 134); g.quadraticCurveTo(46, 152, 90, 140); g.closePath(); g.fill(); ink(g, 11);
  g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.ellipse(52, 118, 28, 6, 0.4, 0, 7); g.fill(); g.fillStyle = INKD; g.beginPath(); g.ellipse(30, 126, 5, 3, 0, 0, 7); g.fill();
  // head tuft
  g.fillStyle = "#6a5642"; for (const [dx, dy, rot] of [[-6, -52, -0.5], [14, -58, 0.1], [34, -50, 0.6]] as const) { g.beginPath(); g.ellipse(hx + dx, hy + dy, 9, 22, rot, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = INKD; g.stroke(); }
  // eye
  const ex = 120, ey = 104; const open = expr === "blink" ? 0 : expr === "shock" ? 1.25 : expr === "alert" ? 1.05 : expr === "smug" ? 0.8 : 0.9;
  if (open > 0) {
    g.fillStyle = "#fff6d8"; g.beginPath(); g.ellipse(ex, ey, 24, 26 * open, 0, 0, 7); g.fill(); ink(g, 8);
    g.fillStyle = "#c8761e"; g.beginPath(); g.ellipse(ex - 3, ey + 1, 15, 17 * open, 0, 0, 7); g.fill(); g.fillStyle = INKD; g.beginPath(); g.ellipse(ex - 3, ey + 1, expr === "shock" ? 5 : 9, expr === "shock" ? 5 : 12 * open, 0, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(ex - 9, ey - 6, 4.5, 0, 7); g.fill();
    if (expr === "smug" || expr === "deadpan") { g.save(); g.beginPath(); g.ellipse(ex, ey, 24, 26 * open, 0, 0, 7); g.clip(); g.fillStyle = skin; g.fillRect(ex - 30, ey - 34, 60, expr === "smug" ? 30 : 20); g.restore(); g.beginPath(); g.moveTo(ex - 26, ey - (expr === "smug" ? 4 : 8)); g.quadraticCurveTo(ex, ey - (expr === "smug" ? 12 : 16), ex + 26, ey - (expr === "smug" ? 2 : 6)); ink(g, 8); }
  } else { g.beginPath(); g.moveTo(ex - 22, ey + 2); g.quadraticCurveTo(ex, ey + 14, ex + 22, ey + 2); ink(g, 8); }
  if (expr === "alert" || expr === "shock") { g.beginPath(); g.moveTo(ex - 22, ey - 40); g.quadraticCurveTo(ex, ey - 52, ex + 24, ey - 42); ink(g, 7); }
}));

export const emuWing = () => memo("wing", () => mk(160, 200, (g) => {
  g.fillStyle = "#5e4a38"; g.beginPath(); g.moveTo(80, 10); g.quadraticCurveTo(150, 80, 110, 188); g.quadraticCurveTo(70, 170, 40, 80); g.closePath(); g.fill(); ink(g, 10);
  g.fillStyle = "rgba(210,190,150,.25)"; g.beginPath(); g.ellipse(76, 80, 26, 50, 0.2, 0, 7); g.fill();
}));

const ribbon = (len: number, w0: number, w1: number) => { const s = new THREE.Shape(); s.moveTo(-w0, 0); s.lineTo(-w1, -len); for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; s.lineTo(Math.cos(a) * w1, -len + Math.sin(a) * w1); } s.lineTo(w0, 0); s.closePath(); return new THREE.ShapeGeometry(s); };
const inkM = new THREE.MeshBasicMaterial({ color: INKD, side: THREE.DoubleSide });
const legM = new THREE.MeshBasicMaterial({ color: "#9a9088", side: THREE.DoubleSide });
const legHi = new THREE.MeshBasicMaterial({ color: "#c2b8ae", side: THREE.DoubleSide });
const up = ribbon(0.4, 0.115, 0.08), upIn = ribbon(0.4, 0.085, 0.056), lo = ribbon(0.4, 0.08, 0.06), loIn = ribbon(0.4, 0.052, 0.038);
const fur = new THREE.MeshBasicMaterial({ color: "#7a644e", side: THREE.DoubleSide }), furHi = new THREE.MeshBasicMaterial({ color: "#9a8466", side: THREE.DoubleSide });
const toe = (() => { const g = new THREE.CircleGeometry(1, 14); g.scale(0.14, 0.036, 1); return g; })();

export type EmuMode = "stand" | "walk" | "run" | "wave" | "peck";
export type EmuProps = { t: number; position?: [number, number, number]; cam?: [number, number, number]; scale?: number; facing?: 1 | -1; expr?: string; mode?: EmuMode; seed?: number; shade?: number; lean?: number; tint?: string };

export const Emu: React.FC<EmuProps> = ({ t, position = [0, 0, 0], cam, scale = 1, facing = 1, expr = "deadpan", mode = "stand", seed = 1, shade = 0, lean = 0, tint = "#ffffff" }) => {
  const ph = (seed * 1.37) % 6;
  const run = mode === "run", walk = mode === "walk";
  const f = run ? 11 : walk ? 5.2 : 0, A = run ? 0.62 : walk ? 0.3 : 0.02, B = run ? 1.0 : walk ? 0.42 : 0.05;
  const bob = run ? Math.abs(Math.sin(t * f + ph)) * 0.07 : walk ? Math.abs(Math.sin(t * f + ph)) * 0.025 : Math.sin(t * 2.2 + ph) * 0.008;
  const bm = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const hm = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const wm = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }), []);
  const blinking = mode !== "run" && (((t + ph) % (3.4 + (seed % 3) * 0.5)) / (3.4 + (seed % 3) * 0.5)) > 0.96;
  bm.color.set(tint); hm.color.set(tint); wm.color.set(tint);
  bm.map = emuBody(shade); hm.map = emuHead(blinking ? "blink" : expr); wm.map = emuWing();
  const yaw = cam ? clamp(Math.atan2(cam[0] - position[0], cam[2] - position[2]), -0.35, 0.35) : 0;
  const neckRot = lean + (run ? 0.2 + Math.sin(t * f * 2 + ph) * 0.03 : walk ? Math.sin(t * f * 2 + ph) * 0.05 : Math.sin(t * 1.6 + ph) * 0.03) + (mode === "peck" ? Math.max(0, Math.sin(t * 3 + ph)) * 0.5 : 0);
  const leg = (side: number, z: number) => {
    const a = Math.sin(t * f + ph + side * Math.PI), flex = Math.max(0, Math.sin(t * f + ph + side * Math.PI + 0.9)) * B;
    return (
      <group position={[0.05 + side * 0.04, 0.8, z]} rotation={[0, 0, a * A]}>
        <mesh geometry={up} material={inkM} /><mesh geometry={upIn} material={legM} position={[0, -0.01, 0.001]} />
        <group position={[0, -0.4, 0.002]} rotation={[0, 0, -a * A * 0.4 + flex]}>
          <mesh geometry={lo} material={inkM} /><mesh geometry={loIn} material={legM} position={[0, -0.01, 0.001]} /><mesh geometry={loIn} material={legHi} position={[-0.012, -0.01, 0.002]} scale={[0.45, 1, 1]} />
          <group position={[0, -0.4, 0.003]} rotation={[0, 0, -(a * A * 0.6) - flex * 0.9 + (run ? 0.15 : 0)]}>
            {[0.28, 0, -0.3].map((rot, k) => <group key={k} rotation={[0, 0, rot]}><mesh geometry={toe} material={inkM} position={[-0.17, 0, 0]} scale={[1.18, 1.5, 1]} /><mesh geometry={toe} material={legM} position={[-0.17, 0, 0.001]} /></group>)}
          </group>
        </group>
      </group>
    );
  };
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={[scale * facing, scale, scale]}>
      <group position={[0, bob + 0.09, 0]}>
        {leg(1, -0.07)}
        <mesh material={bm} position={[0.05, 1.08, 0]}><planeGeometry args={[1.4, 1.05]} /></mesh>
        {leg(0, -0.035)}
        <group position={[-0.4, 1.26, -0.03]} rotation={[0, 0, neckRot]}><mesh material={hm} position={[-0.075, 0.5, 0]}><planeGeometry args={[0.6, 1.2]} /></mesh></group>
        {mode === "wave" ? <group position={[-0.12, 1.2, 0.05]} rotation={[0, 0, 0.5 + Math.sin(t * 9) * 0.5]}><mesh material={wm} position={[0.05, -0.25, 0]}><planeGeometry args={[0.32, 0.4]} /></mesh></group> : null}
      </group>
      <mesh position={[0.05, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}><planeGeometry args={[1.5, 0.7]} /><meshBasicMaterial map={softShadow()} transparent depthWrite={false} opacity={0.55} /></mesh>
    </group>
  );
};
