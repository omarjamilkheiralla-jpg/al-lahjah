import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { LOOKS, headTexture, torsoTexture, inkStroke, INKD } from "./paint";

const grain = (g: CanvasRenderingContext2D, w: number, h: number, n = 9000) => {
  let s = 7;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? "rgba(42,26,30,0.05)" : "rgba(255,255,255,0.06)"; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
};

const sunburst = (g: CanvasRenderingContext2D, S: number, col: string) => {
  g.save(); g.translate(S / 2, S * 0.52); g.fillStyle = col;
  for (let i = 0; i < 24; i++) { g.rotate((Math.PI * 2) / 24); g.beginPath(); g.moveTo(0, 0); g.lineTo(S, -S * 0.045); g.lineTo(S, S * 0.045); g.closePath(); g.fill(); }
  g.restore();
};

const drawHead = (g: CanvasRenderingContext2D, S: number) => {
  const bg = g.createRadialGradient(S / 2, S * 0.45, S * 0.1, S / 2, S / 2, S * 0.75);
  bg.addColorStop(0, "#fbe3a6"); bg.addColorStop(0.55, "#f2b655"); bg.addColorStop(1, "#d9822f");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  sunburst(g, S, "rgba(255,246,214,0.22)");
  // shoulders
  const look = LOOKS.cap;
  const torso = (torsoTexture(look, "av-cap", 0) as any).image as HTMLCanvasElement;
  g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, 7); g.clip();
  g.drawImage(torso, S * 0.2, S * 0.64, S * 0.6, S * 0.8);
  g.restore();
  // head
  const head = (headTexture(look, "smug", "av-cap", 0) as any).image as HTMLCanvasElement;
  g.save(); g.translate(S * 0.5, S * 0.47); g.rotate(-0.06);
  g.shadowColor = "rgba(60,30,10,0.35)"; g.shadowBlur = 24; g.shadowOffsetY = 12;
  g.drawImage(head, -S * 0.43, -S * 0.43, S * 0.86, S * 0.86);
  g.restore();
  g.lineWidth = 0; grain(g, S, S);
};

const drawScrew = (g: CanvasRenderingContext2D, S: number) => {
  const bg = g.createRadialGradient(S / 2, S * 0.45, S * 0.1, S / 2, S / 2, S * 0.75);
  bg.addColorStop(0, "#3fb3a6"); bg.addColorStop(0.6, "#1f7f78"); bg.addColorStop(1, "#14524f");
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  sunburst(g, S, "rgba(255,255,255,0.07)");
  const cx = S / 2;
  // base + housing
  const body = (x: number, y: number, w: number, h: number, c1: string, c2: string, r = 18) => {
    const gr = g.createLinearGradient(x, y, x + w, y); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); g.lineWidth = 14; g.strokeStyle = INKD; g.stroke();
  };
  body(cx - 190, S * 0.80, 380, 70, "#aab6c8", "#6a7488", 20);
  body(cx - 130, S * 0.60, 260, 140, "#aab6c8", "#6a7488", 28);
  // threaded rod with a real-looking thread
  const rx = cx - 62, rw = 124, top = S * 0.14, bot = S * 0.62;
  g.save(); g.beginPath(); g.roundRect(rx, top, rw, bot - top, 30); g.clip();
  const rg = g.createLinearGradient(rx, 0, rx + rw, 0); rg.addColorStop(0, "#f4f7fb"); rg.addColorStop(0.35, "#c9d3e2"); rg.addColorStop(1, "#7a869c");
  g.fillStyle = rg; g.fillRect(rx, top, rw, bot - top);
  g.strokeStyle = "#4a5568"; g.lineWidth = 16; g.lineCap = "round";
  for (let y = top - 40; y < bot + 40; y += 46) { g.beginPath(); g.moveTo(rx - 10, y + 30); g.quadraticCurveTo(cx, y + 6, rx + rw + 10, y - 24); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 6;
  for (let y = top - 40; y < bot + 40; y += 46) { g.beginPath(); g.moveTo(rx - 10, y + 22); g.quadraticCurveTo(cx, y - 2, rx + rw + 10, y - 32); g.stroke(); }
  g.restore();
  g.lineWidth = 14; g.strokeStyle = INKD; g.beginPath(); g.roundRect(rx, top, rw, bot - top, 30); g.stroke();
  // handle bar through the top
  g.save(); g.translate(cx, top + 70); g.rotate(-0.08);
  body(-250, -22, 500, 44, "#e0a35a", "#9a5f2c", 22);
  g.restore();
  g.lineWidth = 0; grain(g, S, S);
};

/** Clean redraw of the character: smooth bezier shapes, round joins, uniform ink line. Designed in a 1000-unit space. */
const drawHeadClean = (g: CanvasRenderingContext2D, S: number) => {
  const k = S / 1000;
  g.save(); g.scale(k, k);
  const INK = "#2a1a1e";
  const outline = (w: number) => { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); };
  // background
  const bg = g.createRadialGradient(500, 430, 80, 500, 500, 760);
  bg.addColorStop(0, "#fde7ae"); bg.addColorStop(0.55, "#f4b95a"); bg.addColorStop(1, "#d98430");
  g.fillStyle = bg; g.fillRect(0, 0, 1000, 1000);
  g.save(); g.filter = "blur(1.5px)"; g.translate(500, 520); g.fillStyle = "rgba(255,247,220,0.2)";
  for (let i = 0; i < 24; i++) { g.rotate((Math.PI * 2) / 24); g.beginPath(); g.moveTo(0, 0); g.lineTo(1100, -52); g.lineTo(1100, 52); g.closePath(); g.fill(); }
  g.restore();
  const vg = g.createRadialGradient(500, 500, 420, 500, 500, 760); vg.addColorStop(0, "rgba(120,50,10,0)"); vg.addColorStop(1, "rgba(120,50,10,0.28)");
  g.fillStyle = vg; g.fillRect(0, 0, 1000, 1000);

  g.save(); g.translate(500, 520); g.rotate(-0.05); g.translate(-500, -520);

  // shoulders: one smooth rounded shape
  g.beginPath(); g.moveTo(150, 1040); g.bezierCurveTo(150, 860, 290, 770, 500, 770); g.bezierCurveTo(710, 770, 850, 860, 850, 1040); g.closePath();
  const sh = g.createLinearGradient(200, 770, 820, 1000); sh.addColorStop(0, "#4cc0b2"); sh.addColorStop(0.55, "#2f9f93"); sh.addColorStop(1, "#1b6c66");
  g.fillStyle = sh; g.fill(); outline(20);
  // collar
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(500 + side * 8, 778); g.bezierCurveTo(500 + side * 70, 770, 500 + side * 140, 790, 500 + side * 150, 800); g.bezierCurveTo(500 + side * 110, 860, 500 + side * 60, 890, 500 + side * 14, 905); g.closePath();
    g.fillStyle = "#fdf6ec"; g.fill(); outline(14);
  }
  // tie
  g.save();
  g.beginPath(); g.moveTo(468, 800); g.bezierCurveTo(480, 790, 520, 790, 532, 800); g.lineTo(552, 940); g.bezierCurveTo(552, 960, 520, 990, 500, 1000); g.bezierCurveTo(480, 990, 448, 960, 448, 940); g.closePath();
  g.fillStyle = "#c9403b"; g.fill(); g.clip();
  g.strokeStyle = "rgba(255,225,200,0.7)"; g.lineWidth = 16;
  for (let y = 790; y < 1040; y += 44) { g.beginPath(); g.moveTo(430, y + 34); g.lineTo(570, y - 30); g.stroke(); }
  g.restore();
  g.beginPath(); g.moveTo(468, 800); g.bezierCurveTo(480, 790, 520, 790, 532, 800); g.lineTo(552, 940); g.bezierCurveTo(552, 960, 520, 990, 500, 1000); g.bezierCurveTo(480, 990, 448, 960, 448, 940); g.closePath(); outline(12);
  g.beginPath(); g.ellipse(500, 800, 42, 28, 0, 0, 7); g.fillStyle = "#c9403b"; g.fill(); outline(12);

  // head
  g.beginPath(); g.ellipse(500, 480, 345, 338, 0, 0, Math.PI * 2);
  const hg = g.createLinearGradient(240, 150, 780, 760); hg.addColorStop(0, "#fffaf2"); hg.addColorStop(0.55, "#f7ede4"); hg.addColorStop(1, "#c7b4cc");
  g.fillStyle = hg; g.fill();
  g.save(); g.clip();
  g.fillStyle = "rgba(160,130,180,0.28)"; g.beginPath(); g.ellipse(640, 560, 420, 380, 0, 0, 7); g.ellipse(470, 440, 400, 370, 0, 0, 7, true); g.fill("evenodd");
  g.filter = "blur(10px)"; g.fillStyle = "rgba(240,140,140,0.5)";
  g.beginPath(); g.ellipse(255, 565, 70, 40, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(745, 565, 70, 40, 0, 0, 7); g.fill();
  g.restore();
  g.beginPath(); g.ellipse(500, 480, 345, 338, 0, 0, Math.PI * 2); outline(22);

  // hair (smooth fringe under the cap)
  g.save(); g.beginPath(); g.ellipse(500, 480, 340, 333, 0, 0, Math.PI * 2); g.clip();
  g.beginPath(); g.moveTo(130, 330); g.bezierCurveTo(150, 190, 330, 110, 520, 120); g.bezierCurveTo(720, 125, 860, 220, 880, 360);
  g.bezierCurveTo(860, 420, 800, 400, 760, 360); g.bezierCurveTo(690, 300, 610, 330, 560, 400); g.bezierCurveTo(500, 330, 400, 300, 330, 380); g.bezierCurveTo(280, 430, 190, 430, 130, 330); g.closePath();
  const hr = g.createLinearGradient(200, 150, 700, 420); hr.addColorStop(0, "#6a3f2e"); hr.addColorStop(1, "#4a2c24");
  g.fillStyle = hr; g.fill(); g.lineWidth = 12; g.strokeStyle = INK; g.stroke();
  g.strokeStyle = "rgba(190,130,90,0.75)"; g.lineWidth = 26; g.lineCap = "round"; g.beginPath(); g.moveTo(260, 300); g.bezierCurveTo(340, 230, 440, 215, 520, 232); g.stroke();
  g.restore();

  // face
  const eye = (cx: number) => {
    g.fillStyle = INK; g.beginPath(); g.ellipse(cx, 500, 36, 42, 0, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(cx - 11, 488, 10, 0, 7); g.fill();
    // heavy lid
    g.fillStyle = "#f9efe6"; g.beginPath(); g.moveTo(cx - 62, 440); g.lineTo(cx + 62, 440); g.lineTo(cx + 62, 497); g.bezierCurveTo(cx + 30, 484, cx - 30, 484, cx - 62, 497); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx - 62, 497); g.bezierCurveTo(cx - 30, 484, cx + 30, 484, cx + 62, 497); outline(15);
  };
  eye(375); eye(625);
  g.lineCap = "round"; g.strokeStyle = INK;
  g.lineWidth = 18; g.beginPath(); g.moveTo(312, 418); g.bezierCurveTo(350, 392, 400, 392, 440, 408); g.stroke();                 // brow, calm
  g.lineWidth = 18; g.beginPath(); g.moveTo(560, 396); g.bezierCurveTo(600, 372, 650, 372, 690, 392); g.stroke();                  // brow, raised
  g.lineWidth = 16; g.beginPath(); g.moveTo(430, 650); g.bezierCurveTo(480, 666, 540, 664, 590, 628); g.stroke();                   // smirk

  // cap: smooth dome + rounded visor + button
  g.save(); g.beginPath(); g.moveTo(130, 340); g.bezierCurveTo(115, 170, 290, 70, 500, 72); g.bezierCurveTo(710, 74, 870, 180, 870, 345);
  g.bezierCurveTo(740, 300, 280, 300, 130, 340); g.closePath();
  const cg = g.createLinearGradient(130, 70, 760, 340); cg.addColorStop(0, "#3d78c8"); cg.addColorStop(0.6, "#2b5fa8"); cg.addColorStop(1, "#1f4880");
  g.fillStyle = cg; g.fill(); g.clip();
  g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 10; g.lineCap = "round";
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(500 + i * 66, 330); g.quadraticCurveTo(500 + i * 55, 190, 500 + i * 28, 60); g.stroke(); }
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.ellipse(330, 150, 150, 40, -0.35, 0, 7); g.fill();
  g.restore();
  g.beginPath(); g.moveTo(130, 340); g.bezierCurveTo(115, 170, 290, 70, 500, 72); g.bezierCurveTo(710, 74, 870, 180, 870, 345); g.bezierCurveTo(740, 300, 280, 300, 130, 340); g.closePath(); outline(20);
  // visor
  g.beginPath(); g.moveTo(600, 322); g.bezierCurveTo(720, 305, 900, 320, 940, 385); g.bezierCurveTo(940, 420, 880, 436, 800, 428); g.bezierCurveTo(710, 420, 640, 400, 600, 372); g.closePath();
  const vg2 = g.createLinearGradient(600, 320, 900, 430); vg2.addColorStop(0, "#2b5fa8"); vg2.addColorStop(1, "#1a3d70"); g.fillStyle = vg2; g.fill(); outline(18);
  g.fillStyle = INK; g.beginPath(); g.arc(500, 70, 26, 0, 7); g.fill();
  g.fillStyle = "#2b5fa8"; g.beginPath(); g.arc(500, 68, 17, 0, 7); g.fill();
  g.restore();
  g.restore();
};

export const Avatar: React.FC<{ variant?: "head" | "screw" | "clean"; size?: number }> = ({ variant = "head", size = 800 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!; const g = c.getContext("2d")!;
    const S = size; c.width = S; c.height = S;
    g.clearRect(0, 0, S, S);
    if (variant === "clean") drawHeadClean(g, S); else if (variant === "head") drawHead(g, S); else drawScrew(g, S);
  });
  return <AbsoluteFill style={{ backgroundColor: "#222" }}><canvas ref={ref} style={{ width: size, height: size }} /></AbsoluteFill>;
};
