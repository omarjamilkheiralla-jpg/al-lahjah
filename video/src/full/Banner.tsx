import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useDelayRender } from "remotion";
import { drawHeadClean } from "./Avatar";
import { loadFonts } from "./fonts";

/** YouTube channel banner 2048x1152. Everything important sits inside the safe area (1235x338, centred: x 406..1641, y 407..745). */
const W = 2048, H = 1152;
const rnd = (() => { let s = 5; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
export const Banner: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ok, setOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  useLayoutEffect(() => {
    if (!ok) return; const c = ref.current!; c.width = W; c.height = H; const g = c.getContext("2d")!;
    // night sky + street silhouette
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0a1024"); bg.addColorStop(0.6, "#1a2650"); bg.addColorStop(1, "#2a2c4a"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.5})`; g.beginPath(); g.arc(rnd() * W, rnd() * H * 0.5, 1 + rnd() * 2.2, 0, 7); g.fill(); }
    const rays = (cx: number, cy: number, col: string, n = 28, len = 2600) => { g.save(); g.translate(cx, cy); g.fillStyle = col; for (let i = 0; i < n; i++) { g.rotate((Math.PI * 2) / n); g.beginPath(); g.moveTo(0, 0); g.lineTo(len, -len * 0.025); g.lineTo(len, len * 0.025); g.closePath(); g.fill(); } g.restore(); };
    rays(590, 576, "rgba(120,150,255,0.06)");
    // skyline of houses with lit windows
    for (let i = 0; i < 26; i++) { const x = i * 84 - 20, hh = 160 + rnd() * 240; g.fillStyle = i % 2 ? "#0d1226" : "#111830"; g.fillRect(x, H - hh - 60, 80, hh + 60); for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) if (rnd() < 0.3) { g.fillStyle = rnd() < 0.7 ? "rgba(255,206,120,0.85)" : "rgba(255,150,90,0.8)"; g.fillRect(x + 12 + q * 34, H - hh - 36 + r * 52, 22, 28); } }
    // ground + reflected glow
    const gr = g.createLinearGradient(0, H - 90, 0, H); gr.addColorStop(0, "#161a30"); gr.addColorStop(1, "#0a0c18"); g.fillStyle = gr; g.fillRect(0, H - 80, W, 80);
    // rain
    g.strokeStyle = "rgba(190,210,255,0.22)"; g.lineWidth = 2; for (let i = 0; i < 260; i++) { const x = rnd() * W, y = rnd() * H, l = 30 + rnd() * 50; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + l); g.stroke(); }
    // flashlight cone from the badge across the title
    const cone = g.createLinearGradient(700, 576, 1700, 576); cone.addColorStop(0, "rgba(255,200,120,0.42)"); cone.addColorStop(1, "rgba(255,200,120,0)");
    g.fillStyle = cone; g.beginPath(); g.moveTo(690, 590); g.lineTo(1700, 420); g.lineTo(1700, 760); g.closePath(); g.fill();
    // badge with the profile picture
    const off = document.createElement("canvas"); off.width = off.height = 900; drawHeadClean(off.getContext("2d")!, 900, true);
    const cx = 590, cy = 576, R = 150;
    g.save(); g.shadowColor = "rgba(255,170,80,0.55)"; g.shadowBlur = 50; g.fillStyle = "#101428"; g.beginPath(); g.arc(cx, cy, R + 14, 0, 7); g.fill(); g.restore();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.drawImage(off, cx - R, cy - R, R * 2, R * 2); g.restore();
    g.lineWidth = 8; g.strokeStyle = "#f2b655"; g.beginPath(); g.arc(cx, cy, R + 10, 0, 7); g.stroke();
    // title + tagline
    g.textBaseline = "alphabetic"; g.textAlign = "left";
    g.font = "128px 'Lilita One'"; g.save(); g.shadowColor = "rgba(255,150,60,0.55)"; g.shadowBlur = 40; g.fillStyle = "#fff4dc"; g.fillText("UNLIKELY TRUE", 800, 590); g.restore();
    g.lineWidth = 6; g.strokeStyle = "rgba(20,10,20,0.55)"; g.strokeText("UNLIKELY TRUE", 800, 590); g.fillStyle = "#fff4dc"; g.fillText("UNLIKELY TRUE", 800, 590);
    g.font = "italic 400 44px 'Playfair Display'"; g.fillStyle = "#f2b655"; g.fillText("Strange facts. What-ifs. Scary stories.", 806, 660);
    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1200); vg.addColorStop(0, "rgba(0,0,10,0)"); vg.addColorStop(1, "rgba(0,0,10,0.5)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  });
  return <AbsoluteFill style={{ backgroundColor: "#000" }}><canvas ref={ref} style={{ width: W, height: H }} /></AbsoluteFill>;
};
