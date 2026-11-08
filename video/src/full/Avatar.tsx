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

export const Avatar: React.FC<{ variant?: "head" | "screw" }> = ({ variant = "head" }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!; const g = c.getContext("2d")!;
    const S = 800; c.width = S; c.height = S;
    g.clearRect(0, 0, S, S);
    if (variant === "head") drawHead(g, S); else drawScrew(g, S);
  });
  return <AbsoluteFill style={{ backgroundColor: "#222" }}><canvas ref={ref} style={{ width: 800, height: 800 }} /></AbsoluteFill>;
};
