import * as THREE from "three";
import { rng } from "../hotel/kit";

export const INKD = "#2a1a1e";

export type Look = {
  skin: string; skinShade: string;
  hair: string; hairHi: string; hairStyle?: "side" | "fringe" | "bald" | "bun";
  shirt: string; shirtShade: string; shirtHi: string;
  tie?: string; tie2?: string; collar?: string; vest?: string;
  pants: string;
  hat?: "top" | "bowler" | "cap" | "balaclava" | "nightcap" | "pith" | "conical" | "diver" | "slouch" | "none"; hatColor?: string; hatBand?: string;
  glasses?: boolean; mustache?: boolean; stripes?: boolean;
  /** reference style (Cashiers video): white egg head, grey lidded eyes, hair cap with curl, polo + name tag */
  ref?: boolean; curl?: boolean; polo?: string; tag?: string; badge?: string; bowtie?: string; apron?: string; slick?: boolean;
};

export type Expr =
  | "deadpan" | "smug" | "worried" | "strain" | "shock" | "grin" | "sleep" | "blink"
  | "laugh" | "angry" | "proud" | "think" | "smile" | "sad";

const tex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
};

const mkc = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return { c, g: c.getContext("2d")! };
};

/** hand-inked outline: width varies along the stroke, slight wobble, round caps */
export const inkStroke = (g: CanvasRenderingContext2D, pts: [number, number][], w: number, seed = 1, closed = false, col = INKD) => {
  const r = rng(seed);
  g.strokeStyle = col; g.fillStyle = col; g.lineCap = "round"; g.lineJoin = "round";
  const n = pts.length;
  const ph = r() * 6;
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    g.lineWidth = w * (0.82 + 0.3 * Math.sin(i * 0.37 + ph) + (r() - 0.5) * 0.08);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
};

const blob = (cx: number, cy: number, rx: number, ry: number, n = 90, wob = 0.012, seed = 3): [number, number][] => {
  const r = rng(seed);
  const ph = r() * 6, ph2 = r() * 6;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * Math.sin(a * 3 + ph) + wob * 0.6 * Math.sin(a * 7 + ph2);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as [number, number];
  });
};

const path = (g: CanvasRenderingContext2D, pts: [number, number][]) => {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
};

const grain = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n = 900, a = 0.05) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(42,26,30,${a})` : `rgba(255,255,255,${a})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
  }
};

/* ------------------------------------------------------------------ HEAD */
const headCache = new Map<string, THREE.CanvasTexture>();
export const headTexture = (look: Look, expr: Expr, key: string, v = 0) => {
  const id = key + ":" + expr + ":" + v;
  const hit = headCache.get(id);
  if (hit) return hit;
  const S = 512;
  const { c, g } = mkc(S, S);
  // draw the head at 78% inside the canvas (anchored at the chin) so tall hats fit without being clipped
  g.save(); g.translate(S / 2, S * 0.9); g.scale(0.78, 0.78); g.translate(-S / 2, -S * 0.905);
  const cx = S / 2, cy = S * 0.5, rx = S * 0.41, ry = S * 0.405;
  const outline = blob(cx, cy, rx, ry, 100, 0.012, 5 + v * 7);

  // base skin with soft cel shading (light top-left, cool shade bottom-right)
  g.save(); path(g, outline); g.clip();
  const gr = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  gr.addColorStop(0, look.skin); gr.addColorStop(0.55, look.skin); gr.addColorStop(1, look.skinShade);
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // crescent shade
  g.fillStyle = look.skinShade; g.globalAlpha = look.ref ? 0.3 : 0.55;
  g.beginPath(); g.ellipse(cx + rx * 0.22, cy + ry * 0.2, rx * 1.02, ry * 1.0, 0, 0, 7);
  g.ellipse(cx - rx * 0.08, cy - ry * 0.12, rx * 0.95, ry * 0.95, 0, 0, 7, true);
  g.fill("evenodd"); g.globalAlpha = 1;
  // window-blind light stripes
  if (look.stripes) {
    g.fillStyle = "rgba(255,255,255,0.22)";
    for (let i = -2; i < 9; i++) {
      g.save(); g.translate(cx, cy); g.rotate(-0.5);
      g.fillRect(-S, -ry + i * 72, S * 2, 30); g.restore();
    }
  }
  if (look.ref) {
    // painted lighting like the Cashiers video: warm key from the top left, cool bounce, glowing rim, soft form shading
    const key = g.createRadialGradient(cx - rx * 0.38, cy - ry * 0.55, 10, cx - rx * 0.2, cy - ry * 0.3, rx * 1.15); key.addColorStop(0, "rgba(255,238,200,0.75)"); key.addColorStop(0.5, "rgba(255,238,200,0.22)"); key.addColorStop(1, "rgba(255,238,200,0)");
    g.fillStyle = key; g.fillRect(0, 0, S, S);
    const cool = g.createRadialGradient(cx + rx * 0.55, cy + ry * 0.62, 10, cx + rx * 0.3, cy + ry * 0.35, rx * 1.05); cool.addColorStop(0, "rgba(120,130,170,0.5)"); cool.addColorStop(0.6, "rgba(150,160,190,0.18)"); cool.addColorStop(1, "rgba(150,160,190,0)");
    g.fillStyle = cool; g.fillRect(0, 0, S, S);
    g.fillStyle = "rgba(235,170,150,0.22)"; g.filter = "blur(14px)"; g.beginPath(); g.ellipse(cx - rx * 0.58, cy + ry * 0.3, 46, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + rx * 0.58, cy + ry * 0.3, 46, 26, 0, 0, 7); g.fill(); g.filter = "none";
    g.strokeStyle = "rgba(255,226,170,0.85)"; g.lineWidth = 16; g.lineCap = "round"; g.filter = "blur(3px)"; g.beginPath(); g.arc(cx, cy, rx - 10, Math.PI * 0.82, Math.PI * 1.32); g.stroke(); g.filter = "none";
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, rx - 22, Math.PI * 0.86, Math.PI * 1.22); g.stroke();
  }
  // cheeks + nose bump
  g.fillStyle = look.ref ? "rgba(240,150,150,0.0)" : "rgba(240,150,150,0.35)";
  g.beginPath(); g.ellipse(cx - rx * 0.56, cy + ry * 0.24, 30, 17, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(cx + rx * 0.56, cy + ry * 0.24, 30, 17, 0, 0, 7); g.fill();
  grain(g, S, S, 9);

  // ---- hair
  if (look.hairStyle !== "bald") {
    const L0 = Math.PI * 1.03, L1 = Math.PI * 1.97;
    const lx = cx + Math.cos(L0) * (rx + 10), ly = cy + Math.sin(L0) * (ry + 10);
    const rxp = cx + Math.cos(L1) * (rx + 10), ryp = cy + Math.sin(L1) * (ry + 10);
    const side = look.hairStyle === "side" ? 1 : 0;
    g.beginPath();
    g.moveTo(lx, ly);
    g.ellipse(cx, cy, rx + 10, ry + 10, 0, L0, L1);
    // fringe edge back across the forehead: smooth swoops, not zig-zags
    g.bezierCurveTo(rxp - rx * 0.1, cy - ry * 0.12, cx + rx * (0.62 + side * 0.1), cy - ry * (0.5 - side * 0.08), cx + rx * 0.2, cy - ry * 0.42);
    g.bezierCurveTo(cx - rx * 0.02, cy - ry * 0.35, cx - rx * 0.28, cy - ry * (0.2 + side * 0.18), cx - rx * 0.52, cy - ry * 0.4);
    g.bezierCurveTo(cx - rx * 0.78, cy - ry * 0.55, lx + rx * 0.08, cy - ry * 0.3, lx, ly);
    g.closePath();
    const hg = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy);
    hg.addColorStop(0, look.hair); hg.addColorStop(1, look.hair);
    g.fillStyle = hg; g.fill();
    g.save(); g.clip();
    g.strokeStyle = look.hairHi; g.lineCap = "round";
    g.globalAlpha = 0.9; g.lineWidth = 24; g.beginPath(); g.arc(cx, cy + 10, ry * 0.92, Math.PI * 1.1, Math.PI * 1.52); g.stroke();
    g.globalAlpha = 0.55; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy + 10, ry * 0.8, Math.PI * 1.18, Math.PI * 1.46); g.stroke();
    g.globalAlpha = 0.3; g.strokeStyle = INKD; g.lineWidth = 6;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - rx * 0.5 + i * 60, cy - ry * 0.95); g.quadraticCurveTo(cx - rx * 0.4 + i * 60, cy - ry * 0.7, cx - rx * 0.3 + i * 60 + side * 20, cy - ry * 0.45); g.stroke(); }
    g.globalAlpha = 1; g.restore();
    g.lineWidth = 9; g.strokeStyle = INKD; g.lineJoin = "round"; g.stroke();
    if (look.ref) {
      // glossy parallel streaks across the fringe
      g.save(); g.clip(); g.strokeStyle = look.hairHi; g.lineCap = "round"; g.globalAlpha = 0.9;
      for (let k = 0; k < 4; k++) { g.lineWidth = 9 - k; g.beginPath(); g.moveTo(cx - rx * 0.78 + k * 18, cy - ry * (0.52 - k * 0.05)); g.quadraticCurveTo(cx - rx * 0.1, cy - ry * (0.98 - k * 0.07), cx + rx * 0.7 - k * 18, cy - ry * (0.52 - k * 0.04)); g.stroke(); }
      g.restore();
    }
  }
  g.restore();
  inkStroke(g, outline, 15, 2 + v * 5, true);
  if (look.curl && look.hairStyle !== "bald") {
    // the little curl on top
    g.save(); g.fillStyle = look.hair; g.lineWidth = 11; g.strokeStyle = INKD; g.lineJoin = "round";
    g.beginPath(); g.moveTo(cx + rx * 0.02, cy - ry * 0.98); g.bezierCurveTo(cx + rx * 0.02, cy - ry * 1.28, cx + rx * 0.3, cy - ry * 1.36, cx + rx * 0.42, cy - ry * 1.18);
    g.bezierCurveTo(cx + rx * 0.3, cy - ry * 1.22, cx + rx * 0.2, cy - ry * 1.16, cx + rx * 0.22, cy - ry * 0.96); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = look.hairHi; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + rx * 0.06, cy - ry * 1.04); g.quadraticCurveTo(cx + rx * 0.1, cy - ry * 1.22, cx + rx * 0.26, cy - ry * 1.24); g.stroke(); g.restore();
  }
  if (look.slick) {
    // slicked-back shine for the con man
    g.save(); g.strokeStyle = look.hairHi; g.lineCap = "round"; g.lineWidth = 8; g.globalAlpha = 0.75;
    g.beginPath(); g.moveTo(cx - rx * 0.7, cy - ry * 0.62); g.quadraticCurveTo(cx, cy - ry * 0.98, cx + rx * 0.72, cy - ry * 0.58); g.stroke(); g.restore();
  }

  // ---- hat
  const hc = look.hatColor ?? "#2a2630";
  if (look.hat === "top") {
    g.fillStyle = hc;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.86, rx * 1.12, 26, 0, 0, 7); g.fill();
    g.fillRect(cx - rx * 0.62, cy - ry * 1.62, rx * 1.24, ry * 0.8);
    g.fillStyle = look.hatBand ?? "#c8403a"; g.fillRect(cx - rx * 0.62, cy - ry * 1.04, rx * 1.24, 26);
    g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(cx - rx * 0.5, cy - ry * 1.56, 26, ry * 0.7);
    g.lineWidth = 12; g.strokeStyle = INKD; g.strokeRect(cx - rx * 0.62, cy - ry * 1.62, rx * 1.24, ry * 0.8);
    g.beginPath(); g.ellipse(cx, cy - ry * 0.86, rx * 1.12, 26, 0, 0, 7); g.stroke();
  } else if (look.hat === "bowler") {
    g.fillStyle = hc;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.78, rx * 1.12, 28, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(cx, cy - ry * 0.8, rx * 0.74, ry * 0.52, 0, Math.PI, 0); g.fill();
    g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.ellipse(cx - rx * 0.28, cy - ry * 1.15, 40, 18, -0.5, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = INKD;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.78, rx * 1.12, 28, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(cx, cy - ry * 0.8, rx * 0.74, ry * 0.52, 0, Math.PI, 0); g.stroke();
  } else if (look.hat === "cap") {
    g.fillStyle = hc;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.7, rx * 0.98, ry * 0.58, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.moveTo(cx + 40, cy - ry * 0.72); g.quadraticCurveTo(cx + rx * 1.15, cy - ry * 0.66, cx + rx * 1.12, cy - ry * 0.5); g.quadraticCurveTo(cx + rx * 0.5, cy - ry * 0.62, cx + 20, cy - ry * 0.62); g.fill();
    // cap pinstripes, clipped to the dome so they never poke out
    g.save(); g.beginPath(); g.ellipse(cx, cy - ry * 0.7, rx * 0.98, ry * 0.58, 0, Math.PI, 0); g.clip();
    g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 8;
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 48, cy - ry * 0.72); g.quadraticCurveTo(cx + i * 40, cy - ry * 1.05, cx + i * 20, cy - ry * 1.3); g.stroke(); }
    g.restore();
    g.lineWidth = 12; g.strokeStyle = INKD;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.7, rx * 0.98, ry * 0.58, 0, Math.PI, 0); g.stroke();
    g.beginPath(); g.moveTo(cx + 40, cy - ry * 0.72); g.quadraticCurveTo(cx + rx * 1.15, cy - ry * 0.66, cx + rx * 1.12, cy - ry * 0.5); g.quadraticCurveTo(cx + rx * 0.5, cy - ry * 0.62, cx + 20, cy - ry * 0.62); g.stroke();
  } else if (look.hat === "nightcap") {
    g.fillStyle = "#f4f7fb";
    g.beginPath(); g.moveTo(cx - rx * 0.98, cy - ry * 0.35); g.quadraticCurveTo(cx - rx * 0.4, cy - ry * 1.45, cx + rx * 0.5, cy - ry * 1.05);
    g.quadraticCurveTo(cx + rx * 1.1, cy - ry * 0.95, cx + rx * 1.2, cy - ry * 0.5); g.lineTo(cx + rx * 0.98, cy - ry * 0.4);
    g.quadraticCurveTo(cx, cy - ry * 0.7, cx - rx * 0.98, cy - ry * 0.35); g.fill();
    g.fillStyle = "rgba(180,190,225,0.5)"; g.beginPath(); g.ellipse(cx + rx * 0.2, cy - ry * 0.7, rx * 0.8, 30, 0.1, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = "#e0463f"; g.beginPath(); g.arc(cx + rx * 1.2, cy - ry * 0.46, 36, 0, 7); g.fill(); g.lineWidth = 10; g.stroke();
  } else if (look.hat === "pith") {
    g.fillStyle = hc;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.74, rx * 1.28, 30, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(cx, cy - ry * 0.78, rx * 0.94, ry * 0.7, 0, Math.PI, 0); g.fill();
    g.fillStyle = "rgba(160,140,110,0.5)"; g.fillRect(cx - rx * 0.94, cy - ry * 0.86, rx * 1.88, 26);
    g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.ellipse(cx - rx * 0.3, cy - ry * 1.28, 70, 22, -0.4, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = INKD;
    g.beginPath(); g.ellipse(cx, cy - ry * 0.74, rx * 1.28, 30, 0, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(cx, cy - ry * 0.78, rx * 0.94, ry * 0.7, 0, Math.PI, 0); g.stroke();
  } else if (look.hat === "conical") {
    const ax = cx, ay = cy - ry * 1.75, bx = rx * 1.45, by = cy - ry * 0.62;
    g.fillStyle = hc;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx + bx, by); g.quadraticCurveTo(cx, by + 46, cx - bx, by); g.closePath(); g.fill();
    g.save(); g.clip();
    g.strokeStyle = "rgba(120,80,30,0.45)"; g.lineWidth = 5;
    for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx + i * bx / 7, by + 50); g.stroke(); }
    for (let k = 1; k < 6; k++) { g.beginPath(); g.ellipse(ax, ay + (by - ay) * (k / 6) * 0.98, bx * (k / 6) * 1.02, 14 + k * 5, 0, 0.05, Math.PI - 0.05); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx - bx * 0.45, by); g.lineTo(cx - bx * 0.15, by); g.closePath(); g.fill();
    g.restore();
    g.lineWidth = 12; g.strokeStyle = INKD; g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx + bx, by); g.quadraticCurveTo(cx, by + 46, cx - bx, by); g.closePath(); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(cx - rx * 0.9, by + 14); g.quadraticCurveTo(cx - rx * 0.95, cy + ry * 0.3, cx - rx * 0.55, cy + ry * 0.78); g.moveTo(cx + rx * 0.9, by + 14); g.quadraticCurveTo(cx + rx * 0.95, cy + ry * 0.3, cx + rx * 0.55, cy + ry * 0.78); g.stroke();
  } else if (look.hat === "diver") {
    const br = "#c99a3a", R = Math.max(rx, ry);
    // single clean helmet: brass shell, glass window, riveted rim
    g.beginPath(); g.ellipse(cx, cy - ry * 0.06, rx * 1.2, ry * 1.2, 0, 0, Math.PI * 2);
    const bg2 = g.createRadialGradient(cx - rx * 0.5, cy - ry * 0.7, 20, cx, cy, R * 1.3); bg2.addColorStop(0, "#f4d27a"); bg2.addColorStop(0.5, br); bg2.addColorStop(1, "#a8782a");
    g.fillStyle = bg2; g.fill(); g.lineWidth = 15; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = "#8a6420"; for (let i = 0; i < 16; i++) { const aa = (i / 16) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(aa) * rx * 1.06, cy - ry * 0.06 + Math.sin(aa) * ry * 1.06, 7, 0, 7); g.fill(); }
    g.beginPath(); g.ellipse(cx, cy, rx * 0.93, ry * 0.93, 0, 0, Math.PI * 2); g.fillStyle = look.skin; g.fill(); g.lineWidth = 13; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = "rgba(255,248,210,0.55)"; g.beginPath(); g.ellipse(cx - rx * 0.75, cy - ry * 0.95, 60, 18, -0.6, 0, 7); g.fill();
  } else if (look.hat === "slouch") {
    const band = look.hatBand ?? "#5a4a2a";
    const crown = () => { g.beginPath(); g.ellipse(cx, cy - ry * 0.8, rx * 0.84, ry * 0.7, 0, Math.PI, 0); g.closePath(); };
    // brim (wide, soft), then the up-turned right side, then the crown, band and dent
    g.fillStyle = hc; g.beginPath(); g.ellipse(cx, cy - ry * 0.74, rx * 1.36, 32, 0, 0, 7); g.fill();
    const bg3 = g.createLinearGradient(cx - rx * 1.3, 0, cx + rx * 1.3, 0); bg3.addColorStop(0, "rgba(255,255,255,0.18)"); bg3.addColorStop(1, "rgba(0,0,0,0.22)"); g.fillStyle = bg3; g.beginPath(); g.ellipse(cx, cy - ry * 0.74, rx * 1.36, 32, 0, 0, 7); g.fill();
    g.lineWidth = 12; g.strokeStyle = INKD; g.beginPath(); g.ellipse(cx, cy - ry * 0.74, rx * 1.36, 32, 0, 0, 7); g.stroke();
    g.fillStyle = "rgba(0,0,0,0.2)"; g.beginPath(); g.ellipse(cx + rx * 1.02, cy - ry * 0.86, rx * 0.34, 20, -0.5, 0, 7); g.fill();
    g.fillStyle = hc; crown(); g.fill();
    g.save(); crown(); g.clip();
    const cg2 = g.createLinearGradient(cx - rx * 0.8, 0, cx + rx * 0.8, 0); cg2.addColorStop(0, "rgba(255,255,255,0.28)"); cg2.addColorStop(0.55, "rgba(255,255,255,0)"); cg2.addColorStop(1, "rgba(0,0,0,0.25)"); g.fillStyle = cg2; g.fillRect(cx - rx, cy - ry * 1.6, rx * 2, ry * 1.1);
    g.fillStyle = band; g.fillRect(cx - rx, cy - ry * 0.8 - 34, rx * 2, 34);
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(cx, cy - ry * 1.42, rx * 0.46, 18, 0, 0, 7); g.fill();
    g.restore();
    g.lineWidth = 12; g.strokeStyle = INKD; crown(); g.stroke();
  } else if (look.hat === "balaclava") {
    g.save(); path(g, outline); g.fillStyle = "#1b1b27"; g.fill(); g.restore();
    g.fillStyle = look.skin;
    g.beginPath(); g.roundRect(cx - rx * 0.62, cy - ry * 0.28, rx * 1.24, ry * 0.4, 28); g.fill();
    g.lineWidth = 10; g.strokeStyle = "#0e0e15"; g.stroke();
    g.fillStyle = "rgba(255,255,255,0.1)"; g.beginPath(); g.ellipse(cx - rx * 0.3, cy - ry * 0.55, rx * 0.35, ry * 0.2, -0.4, 0, 7); g.fill();
    inkStroke(g, outline, 17, 2, true);
  }

  // ---- face: brows, eyes, mouth
  const ex = rx * 0.36, ey = cy + ry * 0.02;
  const eye = (side: number, h: number, tilt = 0, white = false) => {
    const x = cx + side * ex;
    if (white) {
      g.fillStyle = "#fff"; g.beginPath(); g.ellipse(x, ey, 36, 40 * h + 4, 0, 0, 7); g.fill();
      g.lineWidth = 8; g.strokeStyle = INKD; g.stroke();
    }
    g.fillStyle = INKD; g.beginPath(); g.ellipse(x + side * 3, ey + 4, white ? 12 : 20, (white ? 14 : 27) * h + 3, 0, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x - 6 + side * 3, ey - 6, 6, 0, 7); g.fill();
  };
  const lid = (side: number, amount: number, droop = 0) => {
    // heavy upper lid line over the eye (amount 0 = open, 1 = shut)
    const x = cx + side * ex, y = ey - 36 + amount * 36;
    g.fillStyle = look.skin;
    g.beginPath(); g.roundRect(x - 44, ey - 70, 88, 70 - 36 + amount * 36 + 2, 8); g.fill();
    inkStroke(g, [[x - 44, y + droop * side], [x, y - 2], [x + 44, y - droop * side]], 11, 31 + side);
  };
  const brow = (side: number, lift: number, tilt: number, thick = 9) => {
    const x = cx + side * ex, y = ey - 66 - lift;
    inkStroke(g, [[x - 40, y + tilt * side * 1.0], [x, y - 6], [x + 40, y - tilt * side * 1.0]], thick, 41 + side);
  };
  const mouth = (kind: string) => {
    const mx = cx, my = cy + ry * 0.5;
    if (kind === "o") { g.fillStyle = INKD; g.beginPath(); g.ellipse(mx, my, 14, 12, 0, 0, 7); g.fill(); }
    else if (kind === "flat") inkStroke(g, [[mx - 34, my], [mx, my + 4], [mx + 34, my]], 10, 51);
    else if (kind === "smirk") inkStroke(g, [[mx - 32, my + 8], [mx, my + 10], [mx + 40, my - 8]], 10, 52);
    else if (kind === "wavy") inkStroke(g, Array.from({ length: 9 }, (_, i) => [mx - 44 + i * 11, my + (i % 2 ? 7 : -7)] as [number, number]), 9, 53);
    else if (kind === "frown") inkStroke(g, [[mx - 38, my + 14], [mx, my - 4], [mx + 38, my + 14]], 11, 54);
    else if (kind === "grin") {
      g.fillStyle = "#6b1f2a"; g.beginPath(); g.moveTo(mx - 62, my - 8); g.quadraticCurveTo(mx, my + 78, mx + 62, my - 8); g.closePath(); g.fill();
      g.fillStyle = "#fff"; g.fillRect(mx - 52, my - 8, 104, 18);
      g.lineWidth = 11; g.strokeStyle = INKD; g.beginPath(); g.moveTo(mx - 62, my - 8); g.quadraticCurveTo(mx, my + 78, mx + 62, my - 8); g.closePath(); g.stroke();
    } else if (kind === "laugh") {
      g.fillStyle = "#6b1f2a"; g.beginPath(); g.ellipse(mx, my + 12, 60, 46, 0, 0, Math.PI); g.fill();
      g.fillStyle = "#fff"; g.fillRect(mx - 56, my + 12, 112, 16);
      g.fillStyle = "#e0645f"; g.beginPath(); g.ellipse(mx, my + 46, 30, 14, 0, 0, 7); g.fill();
      g.lineWidth = 11; g.strokeStyle = INKD; g.beginPath(); g.ellipse(mx, my + 12, 60, 46, 0, 0, Math.PI); g.closePath(); g.stroke();
    } else if (kind === "sleepO") { g.fillStyle = "#7a2a35"; g.beginPath(); g.ellipse(mx + 6, my + 6, 22, 16, 0, 0, 7); g.fill(); g.lineWidth = 9; g.strokeStyle = INKD; g.stroke(); }
    else if (kind === "strain") {
      g.fillStyle = "#6b1f2a"; g.beginPath(); g.roundRect(mx - 46, my - 6, 92, 30, 12); g.fill();
      g.fillStyle = "#fff"; g.fillRect(mx - 40, my - 3, 80, 11);
      g.lineWidth = 10; g.strokeStyle = INKD; g.beginPath(); g.roundRect(mx - 46, my - 6, 92, 30, 12); g.stroke();
    }
  };

  const refEye = (side: number, open: number) => {
    const x = cx + side * ex; const hh = 34 * open;
    g.fillStyle = "#6f6f74"; g.beginPath(); g.ellipse(x, ey + 4, 46, hh + 8, 0, 0, Math.PI); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(x - 14, ey + 14, 10, 5, 0, 0, 7); g.fill();
    inkStroke(g, [[x - 50, ey + 2], [x, ey + 1], [x + 50, ey + 2]], 10, 80 + side);
  };
  const refMouth = (kind: string) => {
    const mx = cx, my = cy + ry * 0.5;
    if (kind === "bar") { g.fillStyle = "#6f6f74"; g.beginPath(); g.roundRect(mx - 52, my - 10, 104, 28, 12); g.fill(); }
    else if (kind === "smile") inkStroke(g, [[mx - 50, my - 6], [mx - 24, my + 14], [mx + 10, my + 20], [mx + 40, my + 8], [mx + 58, my - 10]], 10, 55);
    else if (kind === "smirk") inkStroke(g, [[mx - 40, my + 8], [mx, my + 10], [mx + 50, my - 10]], 10, 56);
    else if (kind === "frown") inkStroke(g, [[mx - 42, my + 16], [mx, my - 2], [mx + 42, my + 16]], 10, 57);
    else if (kind === "oh") { g.fillStyle = "#4a3a42"; g.beginPath(); g.ellipse(mx, my + 4, 22, 28, 0, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = INKD; g.stroke(); }
  };
  const refSweat = () => { g.fillStyle = "#a8d8f2"; g.beginPath(); g.moveTo(cx + rx * 0.74, cy - ry * 0.62); g.quadraticCurveTo(cx + rx * 0.92, cy - ry * 0.3, cx + rx * 0.74, cy - ry * 0.22); g.quadraticCurveTo(cx + rx * 0.54, cy - ry * 0.3, cx + rx * 0.74, cy - ry * 0.62); g.fill(); g.lineWidth = 7; g.strokeStyle = INKD; g.stroke(); };
  const happyArc = (side: number) => { const x = cx + side * ex; inkStroke(g, [[x - 42, ey + 12], [x - 20, ey - 10], [x, ey - 18], [x + 20, ey - 10], [x + 42, ey + 12]], 11, 60 + side); };
  if (look.ref) {
    switch (expr) {
      case "smug": case "proud": refEye(-1, 0.5); refEye(1, 0.5); inkStroke(g, [[cx - ex - 40, ey - 44], [cx - ex + 40, ey - 54]], 9, 91); inkStroke(g, [[cx + ex - 40, ey - 58], [cx + ex + 40, ey - 44]], 9, 92); refMouth("smirk"); break;
      case "shock": case "worried": eye(-1, 1.25, 0, true); eye(1, 1.25, 0, true); brow(-1, 30, -4, 8); brow(1, 30, -4, 8); refMouth(expr === "shock" ? "oh" : "frown"); refSweat(); break;
      case "grin": case "smile": case "laugh": happyArc(-1); happyArc(1); refMouth("smile"); break;
      case "angry": case "strain": refEye(-1, 0.55); refEye(1, 0.55); inkStroke(g, [[cx - ex - 44, ey - 62], [cx - ex + 44, ey - 38]], 12, 93); inkStroke(g, [[cx + ex - 44, ey - 38], [cx + ex + 44, ey - 62]], 12, 94); refMouth("frown"); break;
      case "sad": refEye(-1, 0.6); refEye(1, 0.6); inkStroke(g, [[cx - ex - 44, ey - 36], [cx - ex + 44, ey - 60]], 10, 95); inkStroke(g, [[cx + ex - 44, ey - 60], [cx + ex + 44, ey - 36]], 10, 96); refMouth("frown"); break;
      case "blink": case "sleep": inkStroke(g, [[cx - ex - 44, ey + 4], [cx - ex, ey + 12], [cx - ex + 44, ey + 4]], 12, 65); inkStroke(g, [[cx + ex - 44, ey + 4], [cx + ex, ey + 12], [cx + ex + 44, ey + 4]], 12, 66); refMouth("bar"); break;
      default: refEye(-1, 0.55); refEye(1, 0.55); refMouth("bar");
    }
  } else
  switch (expr) {
    case "smile": eye(-1, 0.85); eye(1, 0.85); lid(-1, 0.2); lid(1, 0.2); brow(-1, 10, -6); brow(1, 10, -6); mouth("smirk"); break;
    case "sad": eye(-1, 0.8); eye(1, 0.8); lid(-1, 0.4); lid(1, 0.4); brow(-1, 4, -14); brow(1, 4, -14); mouth("frown"); break;
    case "deadpan": eye(-1, 0.75); eye(1, 0.75); lid(-1, 0.45); lid(1, 0.45); brow(-1, 0, 4); brow(1, 0, 4); mouth("o"); break;
    case "smug": eye(-1, 0.7); eye(1, 0.7); lid(-1, 0.5); lid(1, 0.5); brow(-1, 4, 10); brow(1, 14, -6); mouth("smirk"); break;
    case "think": eye(-1, 0.8); eye(1, 0.8); lid(-1, 0.3); lid(1, 0.3); brow(-1, 18, -4); brow(1, 2, 10); mouth("flat"); break;
    case "proud": eye(-1, 0.8); eye(1, 0.8); lid(-1, 0.38); lid(1, 0.38); brow(-1, 8, 6); brow(1, 8, 6); mouth("smirk"); break;
    case "worried": eye(-1, 1.1, 0, true); eye(1, 1.1, 0, true); brow(-1, 22, -16); brow(1, 22, -16); mouth("wavy");
      g.fillStyle = "#9fd2f0"; g.beginPath(); g.moveTo(cx + rx * 0.72, cy - ry * 0.55); g.quadraticCurveTo(cx + rx * 0.9, cy - ry * 0.2, cx + rx * 0.72, cy - ry * 0.12); g.quadraticCurveTo(cx + rx * 0.5, cy - ry * 0.2, cx + rx * 0.72, cy - ry * 0.55); g.fill();
      g.lineWidth = 7; g.strokeStyle = INKD; g.stroke(); g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.ellipse(cx + rx * 0.66, cy - ry * 0.28, 7, 12, 0.2, 0, 7); g.fill(); break;
    case "strain": eye(-1, 0.25); eye(1, 0.25); brow(-1, -6, 20, 12); brow(1, -6, 20, 12); mouth("flat");
      g.fillStyle = "#9fd2f0"; g.beginPath(); g.moveTo(cx + rx * 0.7, cy - ry * 0.6); g.quadraticCurveTo(cx + rx * 0.88, cy - ry * 0.3, cx + rx * 0.7, cy - ry * 0.22); g.quadraticCurveTo(cx + rx * 0.5, cy - ry * 0.3, cx + rx * 0.7, cy - ry * 0.6); g.fill(); g.lineWidth = 7; g.strokeStyle = INKD; g.stroke(); break;
    case "shock": eye(-1, 1.25, 0, true); eye(1, 1.25, 0, true); brow(-1, 30, -6); brow(1, 30, -6); mouth("o"); break;
    case "grin": eye(-1, 0.85); eye(1, 0.85); lid(-1, 0.2); lid(1, 0.2); brow(-1, 14, -8); brow(1, 14, -8); mouth("grin"); break;
    case "laugh": inkStroke(g, [[cx - ex - 40, ey + 8], [cx - ex, ey - 22], [cx - ex + 40, ey + 8]], 12, 61); inkStroke(g, [[cx + ex - 40, ey + 8], [cx + ex, ey - 22], [cx + ex + 40, ey + 8]], 12, 62); brow(-1, 20, -10); brow(1, 20, -10); mouth("laugh"); break;
    case "angry": eye(-1, 0.6); eye(1, 0.6); lid(-1, 0.35, 8); lid(1, 0.35, 8); brow(-1, -6, 18, 13); brow(1, -6, 18, 13); mouth("frown"); break;
    case "sleep": inkStroke(g, [[cx - ex - 40, ey - 6], [cx - ex, ey + 20], [cx - ex + 40, ey - 6]], 12, 63); inkStroke(g, [[cx + ex - 40, ey - 6], [cx + ex, ey + 20], [cx + ex + 40, ey - 6]], 12, 64); brow(-1, 6, -6, 10); brow(1, 6, -6, 10); mouth("sleepO"); break;
    case "blink": inkStroke(g, [[cx - ex - 40, ey + 4], [cx - ex, ey + 12], [cx - ex + 40, ey + 4]], 12, 65); inkStroke(g, [[cx + ex - 40, ey + 4], [cx + ex, ey + 12], [cx + ex + 40, ey + 4]], 12, 66); brow(-1, 0, 4); brow(1, 0, 4); mouth("o"); break;
  }
  if (look.glasses) {
    g.lineWidth = 9; g.strokeStyle = INKD;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * ex, ey, 62, 54, 0, 0, 7); g.stroke(); }
    inkStroke(g, [[cx - ex + 60, ey - 4], [cx + ex - 60, ey - 4]], 8, 71);
    g.fillStyle = "rgba(255,255,255,0.18)"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * ex - 14, ey - 16, 18, 8, -0.6, 0, 7); g.fill(); }
  }
  if (look.mustache) {
    g.fillStyle = look.hair;
    g.beginPath(); g.moveTo(cx, cy + ry * 0.4); g.quadraticCurveTo(cx - 70, cy + ry * 0.28, cx - 96, cy + ry * 0.5); g.quadraticCurveTo(cx - 40, cy + ry * 0.56, cx, cy + ry * 0.46);
    g.quadraticCurveTo(cx + 40, cy + ry * 0.56, cx + 96, cy + ry * 0.5); g.quadraticCurveTo(cx + 70, cy + ry * 0.28, cx, cy + ry * 0.4); g.fill();
    g.lineWidth = 9; g.strokeStyle = INKD; g.stroke();
  }
  g.restore();
  const t = tex(c);
  headCache.set(id, t);
  return t;
};

/* ------------------------------------------------------------------ TORSO */
const torsoCache = new Map<string, THREE.CanvasTexture>();
export const torsoTexture = (look: Look, key: string, v = 0) => {
  const hit = torsoCache.get(key + v);
  if (hit) return hit;
  const W = 480, H = 640;
  const { c, g } = mkc(W, H);
  // pear shape
  const cx = W / 2;
  const body: [number, number][] = [];
  const curve = (t: number) => {
    // t 0..1 top to bottom, half width
    const w = look.ref ? 105 + 80 * Math.sin(Math.min(1, t * 1.1) * Math.PI * 0.6) : 120 + 120 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.62);
    return Math.min(w, look.ref ? 175 : 210) * (t > 0.92 ? 1 - (t - 0.92) * 6 : 1);
  };
  for (let i = 0; i <= 50; i++) { const t = i / 50; body.push([cx + curve(t), 40 + t * (H - 80)]); }
  for (let i = 50; i >= 0; i--) { const t = i / 50; body.push([cx - curve(t), 40 + t * (H - 80)]); }
  g.save(); path(g, body); g.clip();
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, look.shirtHi); gr.addColorStop(0.35, look.shirt); gr.addColorStop(1, look.shirtShade);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = look.shirtShade; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(cx + 130, H * 0.62, 150, 300, 0.1, 0, 7); g.fill(); g.globalAlpha = 1;
  // vest / lower two-tone
  if (look.vest) {
    g.fillStyle = look.vest; g.beginPath(); g.moveTo(0, H * 0.5); g.quadraticCurveTo(cx, H * 0.42, W, H * 0.5); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.lineWidth = 8; g.strokeStyle = INKD; g.beginPath(); g.moveTo(0, H * 0.5); g.quadraticCurveTo(cx, H * 0.42, W, H * 0.5); g.stroke();
    g.fillStyle = "#e8c66a"; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, H * 0.6 + i * 60, 9, 0, 7); g.fill(); }
  }
  if (look.ref) {
    const kl = g.createRadialGradient(cx - 90, 110, 10, cx - 40, 220, 340); kl.addColorStop(0, "rgba(255,240,205,0.5)"); kl.addColorStop(1, "rgba(255,240,205,0)"); g.fillStyle = kl; g.fillRect(0, 0, W, H);
    const sd = g.createLinearGradient(cx + 20, 0, W, 0); sd.addColorStop(0, "rgba(20,10,40,0)"); sd.addColorStop(1, "rgba(20,10,40,0.38)"); g.fillStyle = sd; g.fillRect(0, 0, W, H);
    const bt = g.createLinearGradient(0, H * 0.55, 0, H); bt.addColorStop(0, "rgba(20,10,30,0)"); bt.addColorStop(1, "rgba(20,10,30,0.4)"); g.fillStyle = bt; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,230,180,0.6)"; g.lineWidth = 12; g.lineCap = "round"; g.filter = "blur(2px)"; g.beginPath(); g.moveTo(cx - 165, 140); g.quadraticCurveTo(cx - 185, 330, cx - 150, 560); g.stroke(); g.filter = "none";
    g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 5; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx - 120 + k * 14, 210 + k * 30); g.quadraticCurveTo(cx - 60, 300 + k * 40, cx - 100 + k * 8, 470 + k * 20); g.stroke(); }
  }
  // folds
  g.strokeStyle = "rgba(42,26,30,0.28)"; g.lineWidth = 7;
  for (const [x, y, l] of [[cx - 70, 300, 70], [cx + 40, 330, 90], [cx - 20, 420, 60]] as const) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y + l / 2, x - 10, y + l); g.stroke(); }
  // pocket
  g.fillStyle = look.shirtShade; g.globalAlpha = 0.6; g.beginPath(); g.roundRect(cx + 70, 300, 80, 70, 8); g.fill(); g.globalAlpha = 1; g.lineWidth = 6; g.strokeStyle = INKD; g.stroke();
  grain(g, W, H, 4, 700, 0.045);
  g.restore();
  if (look.apron) {
    g.save(); path(g, body); g.clip();
    g.fillStyle = look.apron; g.beginPath(); g.moveTo(cx - 118, 160); g.lineTo(cx + 118, 160); g.lineTo(cx + 150, H); g.lineTo(cx - 150, H); g.closePath(); g.fill();
    g.lineWidth = 8; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = "rgba(0,0,0,0.12)"; g.beginPath(); g.roundRect(cx - 70, 380, 140, 90, 10); g.fill(); g.stroke();
    g.strokeStyle = look.apron; g.lineWidth = 12; g.beginPath(); g.moveTo(cx - 118, 160); g.lineTo(cx - 80, 40); g.moveTo(cx + 118, 160); g.lineTo(cx + 80, 40); g.stroke();
    g.restore();
  }
  if (look.polo) {
    // polo collar with two buttons, like the Cashiers reference
    g.fillStyle = look.polo; g.lineWidth = 8; g.strokeStyle = INKD;
    g.beginPath(); g.moveTo(cx - 100, 44); g.lineTo(cx - 8, 56); g.lineTo(cx - 6, 170); g.lineTo(cx - 70, 110); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx + 100, 44); g.lineTo(cx + 8, 56); g.lineTo(cx + 6, 170); g.lineTo(cx + 70, 110); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#fbfbf6"; for (const yy of [92, 130]) { g.beginPath(); g.arc(cx, yy, 9, 0, 7); g.fill(); g.lineWidth = 5; g.stroke(); }
    if (look.tag) { g.fillStyle = "#fbfbf6"; g.beginPath(); g.roundRect(cx + 38, 250, 120, 56, 8); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = INKD; g.font = "900 40px 'Lilita One', Arial Black, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(look.tag, cx + 98, 280); }
    if (look.badge) { g.fillStyle = look.badge; g.beginPath(); g.arc(cx - 100, 270, 32, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = "#2b5fa8"; g.beginPath(); g.ellipse(cx - 100, 270, 16, 8, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(cx - 84, 270); g.lineTo(cx - 70, 260); g.lineTo(cx - 70, 280); g.fill(); }
  }
  // collar + tie
  if (!look.polo) {
  g.fillStyle = look.collar ?? "#fbf4ec";
  g.beginPath(); g.moveTo(cx - 90, 40); g.lineTo(cx, 40); g.lineTo(cx - 12, 150); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx + 90, 40); g.lineTo(cx, 40); g.lineTo(cx + 12, 150); g.closePath(); g.fill();
  g.lineWidth = 8; g.strokeStyle = INKD; g.stroke();
  if (look.tie) {
    g.fillStyle = look.tie; g.beginPath(); g.moveTo(cx - 20, 70); g.lineTo(cx + 20, 70); g.lineTo(cx + 32, 330); g.lineTo(cx, 372); g.lineTo(cx - 32, 330); g.closePath(); g.fill();
    g.save(); g.clip(); g.strokeStyle = look.tie2 ?? "rgba(255,255,255,0.4)"; g.lineWidth = 10;
    for (let y = 90; y < 400; y += 34) { g.beginPath(); g.moveTo(cx - 60, y + 30); g.lineTo(cx + 60, y - 30); g.stroke(); }
    g.restore(); g.lineWidth = 7; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = look.tie; g.beginPath(); g.roundRect(cx - 24, 56, 48, 46, 10); g.fill(); g.stroke();
  }
  }
  if (look.bowtie) { g.fillStyle = look.bowtie; g.lineWidth = 8; g.strokeStyle = INKD; g.beginPath(); g.moveTo(cx, 110); g.lineTo(cx - 62, 78); g.lineTo(cx - 62, 142); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx, 110); g.lineTo(cx + 62, 78); g.lineTo(cx + 62, 142); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(cx, 110, 15, 0, 7); g.fill(); g.stroke(); }
  inkStroke(g, body, 14, 8 + v * 5, true);
  const t = tex(c);
  torsoCache.set(key + v, t);
  return t;
};

export const LOOKS: Record<string, Look> = {
  cap: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#4a2c24", hairHi: "#8a5a40", hairStyle: "fringe", shirt: "#2f9f93", shirtShade: "#1b6c66", shirtHi: "#57c2b4", tie: "#c9403b", tie2: "rgba(255,230,200,.5)", pants: "#4a3a44", hat: "cap", hatColor: "#2b5fa8", stripes: false },
  bowler: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#2f2124", hairHi: "#6b4a50", hairStyle: "side", shirt: "#e0592f", shirtShade: "#a83a1c", shirtHi: "#f58a55", tie: "#f2c53d", tie2: "rgba(120,70,0,.4)", pants: "#3b3340", hat: "bowler", hatColor: "#3a3340" },
  glasses: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#b0562b", hairHi: "#e08a50", hairStyle: "fringe", shirt: "#d9a82c", shirtShade: "#a87a14", shirtHi: "#f5cf62", tie: "#2b5fa8", tie2: "rgba(255,255,255,.4)", pants: "#4a3a3f", glasses: true },
  boss: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#2f2124", hairHi: "#6b4a50", hairStyle: "side", shirt: "#7a3d8f", shirtShade: "#4f2460", shirtHi: "#a463ba", tie: "#f2c53d", tie2: "rgba(120,70,0,.4)", pants: "#2c2530", hat: "top", hatColor: "#2a2630", mustache: true, vest: "#5a2a6c" },
  engineer: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#3d2a22", hairHi: "#7d5a40", hairStyle: "side", shirt: "#e8b53a", shirtShade: "#b07f14", shirtHi: "#ffd870", tie: "#8a3b2f", tie2: "rgba(255,210,160,.5)", pants: "#4a3a3f", stripes: true, glasses: false },
  pullman: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#3b2418", hairHi: "#8a5a3a", hairStyle: "side", shirt: "#2b4a8a", shirtShade: "#1b3060", shirtHi: "#5a7fc4", tie: "#d9453f", tie2: "rgba(255,255,255,.45)", pants: "#2a2a3a", vest: "#c4a15a", mustache: true },
  owner: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#8a8a92", hairHi: "#d4d4dc", hairStyle: "side", shirt: "#1f6f5f", shirtShade: "#124a3f", shirtHi: "#3aa28c", tie: "#c8403a", tie2: "rgba(255,255,255,.4)", pants: "#2c2530", hat: "top", hatColor: "#26222c", mustache: true, vest: "#8a2a35" },
  guest: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#7a4a2c", hairHi: "#b5805a", hairStyle: "fringe", shirt: "#cfe3f2", shirtShade: "#8fb2d0", shirtHi: "#f2f8ff", pants: "#cfe3f2", hat: "nightcap", collar: "#ffffff" },
  woman: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#7a2a35", hairHi: "#b8546a", hairStyle: "bun", shirt: "#c24f8a", shirtShade: "#8a2f60", shirtHi: "#e88abb", pants: "#4a2a4a", collar: "#fff" },
  official: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#3b2b2f", hairHi: "#7a5a50", hairStyle: "side", shirt: "#f1ece0", shirtShade: "#bdb4a0", shirtHi: "#ffffff", tie: "#2f3a5a", tie2: "rgba(255,255,255,.35)", pants: "#ece6d8", hat: "pith", hatColor: "#efe6d0", mustache: true, collar: "#ffffff" },
  catcher: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#2a1e20", hairHi: "#5a4448", hairStyle: "fringe", shirt: "#8a6a44", shirtShade: "#5e4628", shirtHi: "#b08e62", pants: "#2e2a30", hat: "conical", hatColor: "#dcb866", collar: "#8a6a44" },
  farmer: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#2a1e20", hairHi: "#5a4448", hairStyle: "fringe", shirt: "#5a8a4a", shirtShade: "#3a6030", shirtHi: "#86b872", pants: "#3a3236", hat: "conical", hatColor: "#e3c474", collar: "#5a8a4a" },
  vendor: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#2a1e20", hairHi: "#5a4448", hairStyle: "fringe", shirt: "#c8503a", shirtShade: "#8a3220", shirtHi: "#e8806a", pants: "#3a3236", hat: "conical", hatColor: "#d6b062", collar: "#c8503a" },
  diver: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#3d2a22", hairHi: "#7d5a40", hairStyle: "fringe", shirt: "#2b5fa8", shirtShade: "#1b3d78", shirtHi: "#5a8ad0", tie: undefined, pants: "#3a3a46", hat: "diver", collar: "#2b5fa8" },
  scientist: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#8a8a92", hairHi: "#d4d4dc", hairStyle: "side", shirt: "#f5f4ee", shirtShade: "#c0c0c8", shirtHi: "#ffffff", tie: "#2f8a6a", tie2: "rgba(255,255,255,.4)", pants: "#3a3a46", glasses: true, collar: "#ffffff" },
  greek: { skin: "#f4e6d8", skinShade: "#c6b4cc", hair: "#3d2a22", hairHi: "#7d5a40", hairStyle: "fringe", shirt: "#f4ead2", shirtShade: "#cdbf9a", shirtHi: "#ffffff", tie: undefined, pants: "#cdbf9a", collar: "#d9a82c" },
  craftsman: { skin: "#f4e6d8", skinShade: "#c6b4cc", hair: "#9a9aa2", hairHi: "#dcdce4", hairStyle: "bald", shirt: "#8a5a34", shirtShade: "#5e3a1e", shirtHi: "#b08050", vest: "#5a3a1e", pants: "#4a3a3a", mustache: true, collar: "#8a5a34" },
  clerk: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#3b2b2f", hairHi: "#7a5a50", hairStyle: "side", shirt: "#7a8a6a", shirtShade: "#4f5f44", shirtHi: "#a0b090", tie: "#8a3b2f", tie2: "rgba(255,210,160,.5)", pants: "#4a4a3a", glasses: true, vest: "#5a6a4a" },
  soldier: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#4a3224", hairHi: "#8a5a3a", hairStyle: "fringe", shirt: "#b6a468", shirtShade: "#857541", shirtHi: "#d9c98c", pants: "#6f6238", hat: "slouch", hatColor: "#8f7f4a", hatBand: "#4a3a22", collar: "#b6a468" },
  farm: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#6a4a30", hairHi: "#a8784a", hairStyle: "side", shirt: "#7f9fb4", shirtShade: "#58788c", shirtHi: "#a8c4d4", vest: "#7a5a34", pants: "#4f4036", hat: "slouch", hatColor: "#d6bf7a", hatBand: "#8a3b2f", mustache: true, collar: "#7f9fb4" },
  officer: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#3b2b2f", hairHi: "#7a5a50", hairStyle: "side", shirt: "#a39458", shirtShade: "#76693a", shirtHi: "#c8ba7c", tie: "#5a3a22", tie2: "rgba(255,230,180,.35)", pants: "#5f5430", hat: "slouch", hatColor: "#7d6f40", hatBand: "#3a2e1a", mustache: true, collar: "#a39458" },
  baker: { skin: "#f8efe6", skinShade: "#c6b4cc", hair: "#5a3a2a", hairHi: "#9a6a4a", hairStyle: "bald", shirt: "#f4f0e8", shirtShade: "#c0b8a8", shirtHi: "#ffffff", tie: undefined, pants: "#4a3a3a", hat: "none" },
  // ---- reference style (Cashiers video) looks
  kyle: { skin: "#fdfdfa", skinShade: "#d8d8de", hair: "#8a5a34", hairHi: "#c28a58", hairStyle: "fringe", curl: true, ref: true, shirt: "#e0302a", shirtShade: "#a81e1c", shirtHi: "#f2574a", polo: "#d8302a", tag: "KYLE", badge: "#f3d36a", pants: "#2c2c34" },
  victor: { skin: "#fdfdfa", skinShade: "#d8d8de", hair: "#241a1c", hairHi: "#6a5a60", hairStyle: "side", slick: true, ref: true, mustache: true, shirt: "#2a2d3e", shirtShade: "#171a28", shirtHi: "#4a4f6a", collar: "#fbfbf6", bowtie: "#b8342e", pants: "#1f2230", hat: "top", hatColor: "#23232e", hatBand: "#b8342e" },
  poisson: { skin: "#fdfdfa", skinShade: "#d8d8de", hair: "#6a4a32", hairHi: "#a87850", hairStyle: "fringe", ref: true, mustache: true, shirt: "#9a8a62", shirtShade: "#6e6040", shirtHi: "#c4b488", collar: "#fbfbf6", apron: "#d9d2bc", pants: "#4a3f34", hat: "bowler", hatColor: "#7a5a3c" },
  dealer: { skin: "#fdfdfa", skinShade: "#d8d8de", hair: "#3a2a22", hairHi: "#7a5a46", hairStyle: "side", ref: true, shirt: "#5a7a8a", shirtShade: "#3a5262", shirtHi: "#86a8b8", collar: "#fbfbf6", pants: "#3a3a44", hat: "slouch", hatColor: "#7a6a4a", hatBand: "#3a2e1a", mustache: true },
  dealer2: { skin: "#fdfdfa", skinShade: "#d8d8de", hair: "#8a8a92", hairHi: "#d4d4dc", hairStyle: "bald", ref: true, mustache: true, shirt: "#8a4a3a", shirtShade: "#5e2e22", shirtHi: "#b8705a", collar: "#fbfbf6", apron: "#c8c0a8", pants: "#3a3030" },
  gendarme: { skin: "#fdfdfa", skinShade: "#d8d8de", hair: "#241a1c", hairHi: "#6a5a60", hairStyle: "side", ref: true, mustache: true, shirt: "#28365a", shirtShade: "#162040", shirtHi: "#4a5e8e", collar: "#e8e0c8", pants: "#1f2842", hat: "cap", hatColor: "#28365a" },
};
