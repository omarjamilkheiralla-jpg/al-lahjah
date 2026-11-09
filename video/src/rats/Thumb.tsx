import React, { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, useDelayRender } from "remotion";
import { loadFonts } from "../full/fonts";
import { ratHead, ratBody } from "./rat";
import { INKD } from "../full/paint";

const INK = INKD;
const rnd = (s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

const outlineText = (g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, stroke = INK, lw = size * 0.2) => {
  g.font = `400 ${size}px 'Lilita One', Impact, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(text, x, y + size * 0.07);
  g.save(); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 0; g.shadowOffsetY = size * 0.08; g.strokeText(text, x, y); g.restore();
  g.strokeText(text, x, y);
  const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, fill); g.fillStyle = fill === "#ffffff" ? "#ffffff" : gr; g.fillText(text, x, y);
};

const draw = (g: CanvasRenderingContext2D, W: number, H: number) => {
  const vertical = H > W; const r = rnd(5);
  // background: deep warm gradient + sunburst + vignette + grain
  const bg = g.createRadialGradient(W * (vertical ? 0.5 : 0.35), H * 0.5, 40, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  bg.addColorStop(0, "#ffd36a"); bg.addColorStop(0.45, "#f08a3a"); bg.addColorStop(1, "#8a2a2a"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W * (vertical ? 0.5 : 0.35), H * 0.5); g.fillStyle = "rgba(255,240,190,0.17)";
  for (let i = 0; i < 20; i++) { g.rotate((Math.PI * 2) / 20); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.max(W, H) * 1.2, -Math.max(W, H) * 0.045); g.lineTo(Math.max(W, H) * 1.2, Math.max(W, H) * 0.045); g.closePath(); g.fill(); }
  g.restore();
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, "rgba(40,10,10,0)"); vg.addColorStop(1, "rgba(40,10,10,0.55)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);

  // layout
  const S = vertical ? W : H;
  const rc = vertical ? { x: W * 0.5, y: H * 0.5, s: W * 0.8 } : { x: W * 0.27, y: H * 0.5, s: H * 0.86 };
  // rat body (under the head)
  const body = (ratBody("grey") as any).image as HTMLCanvasElement; const head = (ratHead("smug", "grey", 0) as any).image as HTMLCanvasElement;
  g.save(); g.shadowColor = "rgba(40,10,10,.5)"; g.shadowBlur = S * 0.04; g.shadowOffsetY = S * 0.025;
  g.drawImage(body, rc.x - rc.s * 0.3, rc.y + rc.s * 0.3, rc.s * 0.6, rc.s * 0.78);
  g.drawImage(head, rc.x - rc.s * 0.5, rc.y - rc.s * 0.42, rc.s, rc.s); g.restore();

  if (vertical) {
  // cut-off tail, floating beside the rat with a dashed snip line where it used to attach
  const tx = rc.x + rc.s * 0.22, ty = rc.y + rc.s * 0.44;
  g.save(); g.translate(tx, ty); g.rotate(-0.25); g.lineCap = "round"; g.lineJoin = "round";
  const tail = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(rc.s * 0.1, -rc.s * 0.16, rc.s * 0.24, rc.s * 0.1, rc.s * 0.36, -rc.s * 0.06); };
  tail(); g.lineWidth = rc.s * 0.075; g.strokeStyle = INK; g.stroke(); tail(); g.lineWidth = rc.s * 0.05; g.strokeStyle = "#f0a8a0"; g.stroke(); tail(); g.lineWidth = rc.s * 0.012; g.strokeStyle = "rgba(255,255,255,.55)"; g.stroke();
  g.restore();
  // snip marks
  g.strokeStyle = "#fff6d8"; g.lineWidth = S * 0.012; g.lineCap = "round"; g.setLineDash([S * 0.02, S * 0.018]);
  g.beginPath(); g.arc(tx + rc.s * 0.01, ty - rc.s * 0.01, rc.s * 0.12, Math.PI * 0.55, Math.PI * 1.45); g.stroke(); g.setLineDash([]);
  // scissors
  g.save(); g.translate(tx - rc.s * 0.3, ty + rc.s * 0.01); g.rotate(0.06); g.lineJoin = "round";
  for (const sgn of [1, -1]) { g.save(); g.rotate(sgn * 0.22); g.beginPath(); g.moveTo(0, 0); g.lineTo(rc.s * 0.3, -rc.s * 0.02); g.lineTo(rc.s * 0.3, rc.s * 0.02); g.closePath(); g.fillStyle = "#cfd8e4"; g.fill(); g.lineWidth = S * 0.012; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(-rc.s * 0.05, 0, rc.s * 0.045, 0, 7); g.lineWidth = S * 0.018; g.strokeStyle = "#e0b23a"; g.stroke(); g.lineWidth = S * 0.008; g.strokeStyle = INK; g.stroke(); g.restore(); }
  g.fillStyle = "#6a7488"; g.beginPath(); g.arc(0, 0, rc.s * 0.018, 0, 7); g.fill();
  g.restore();
  }
  // gold coin 1 cent
  const cx = vertical ? W * 0.18 : W * 0.46, cy = vertical ? H * 0.3 : H * 0.2, cr = S * (vertical ? 0.11 : 0.11);
  g.save(); g.translate(cx, cy); g.rotate(-0.25); const cg = g.createRadialGradient(-cr * 0.3, -cr * 0.3, cr * 0.1, 0, 0, cr); cg.addColorStop(0, "#fff0a0"); cg.addColorStop(0.6, "#e8b83a"); cg.addColorStop(1, "#b8862a");
  g.beginPath(); g.arc(0, 0, cr, 0, 7); g.fillStyle = cg; g.fill(); g.lineWidth = S * 0.014; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.arc(0, 0, cr * 0.78, 0, 7); g.lineWidth = S * 0.006; g.stroke();
  g.font = `400 ${cr * 0.95}px 'Lilita One', Impact, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#6a4a12"; g.fillText("1¢", 0, cr * 0.06); g.restore();

  // headline
  if (vertical) {
    outlineText(g, "THEY CUT THE", W / 2, H * 0.075, W * 0.12, "#ffffff");
    outlineText(g, "TAILS OFF RATS", W / 2, H * 0.145, W * 0.122, "#ffd23f");
    outlineText(g, "...THEN LET", W / 2, H * 0.865, W * 0.12, "#ffffff");
    outlineText(g, "THEM ALL GO", W / 2, H * 0.935, W * 0.13, "#ff6a4a");
  } else {
    outlineText(g, "THEY CUT THE", W * 0.73, H * 0.17, H * 0.125, "#ffffff");
    outlineText(g, "TAILS OFF RATS", W * 0.73, H * 0.34, H * 0.138, "#ffd23f");
    outlineText(g, "...THEN LET", W * 0.73, H * 0.62, H * 0.125, "#ffffff");
    outlineText(g, "THEM ALL GO", W * 0.73, H * 0.79, H * 0.138, "#ff6a4a");
  }
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? "rgba(40,10,10,0.05)" : "rgba(255,255,255,0.05)"; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
};

export const Thumb: React.FC<{ w?: number; h?: number }> = ({ w = 1080, h = 1920 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("thumb"));
  useLayoutEffect(() => {
    loadFonts().then(() => { const c = ref.current!; c.width = w; c.height = h; draw(c.getContext("2d")!, w, h); continueRender(handle); });
  }, [w, h, handle, continueRender]);
  return <AbsoluteFill><canvas ref={ref} style={{ width: w, height: h }} /></AbsoluteFill>;
};
