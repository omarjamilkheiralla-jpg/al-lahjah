import * as THREE from "three";
import { cv } from "../emu/world";
import { memo, rnd, T as ET } from "../eiffel/tex";
type G = CanvasRenderingContext2D;
const speck = (g: G, w: number, h: number, seed: number, n: number, a = 0.06) => { const r = rnd(seed); for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); } };
const F = "'Lilita One', 'Arial Black', sans-serif";
function brickDraw(g: G, w: number, h: number, seed: number, litP: number) {
  const r = rnd(seed); g.fillStyle = "#8a4636"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? -16 : 0; x < w; x += 32) { const v = r(); g.fillStyle = v < 0.3 ? "#9c5240" : v < 0.6 ? "#7e3e30" : v < 0.85 ? "#8a4636" : "#a65e48"; g.fillRect(x + 1, y + 1, 30, 10); }
  g.fillStyle = "rgba(210,190,170,.28)"; for (let y = 0; y < h; y += 12) g.fillRect(0, y, w, 1.5);
  for (let f = 0; f < 5; f++) for (let c = 0; c < 4; c++) {
    const x = 40 + c * 118, y = 70 + f * 130, ww = 62, wh = 86; const lit = r() < litP;
    g.fillStyle = "#c9b898"; g.fillRect(x - 8, y - 14, ww + 16, 12); g.fillRect(x - 6, y + wh, ww + 12, 8);
    g.fillStyle = "#e8e0cc"; g.fillRect(x - 5, y - 4, ww + 10, wh + 6);
    const gl = g.createLinearGradient(0, y, 0, y + wh); if (lit) { gl.addColorStop(0, "#ffe6a0"); gl.addColorStop(1, "#f0a850"); } else { gl.addColorStop(0, "#5a6a8a"); gl.addColorStop(1, "#2a3552"); } g.fillStyle = gl; g.fillRect(x, y, ww, wh);
    g.fillStyle = "#e8e0cc"; g.fillRect(x + ww / 2 - 2, y, 4, wh); g.fillRect(x, y + wh * 0.4, ww, 4);
    if (!lit) { g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x + 30, y); g.lineTo(x + 42, y); g.lineTo(x + 8, y + wh); g.closePath(); g.fill(); }
    if (f % 2 === 1 && c % 2 === 0) { g.strokeStyle = "#16141a"; g.lineWidth = 3; g.strokeRect(x - 12, y + wh + 6, ww + 24, 34); for (let b = 0; b <= 7; b++) { g.beginPath(); g.moveTo(x - 12 + b * ((ww + 24) / 7), y + wh + 6); g.lineTo(x - 12 + b * ((ww + 24) / 7), y + wh + 40); g.stroke(); } }
    if (f === 2 && c === 1 && r() < 0.8) { g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 30, y + 6); g.lineTo(x + ww + 30, y + 22); g.stroke(); g.fillStyle = "rgba(240,240,255,.8)"; g.fillRect(x + 4, y + 12, 22, 16); }
  }
  g.fillStyle = "#c9b898"; g.fillRect(0, 0, w, 36); g.fillStyle = "#e8e0cc"; g.fillRect(0, 36, w, 6); g.fillStyle = "#2a2430"; g.fillRect(0, h - 74, w, 74);
  [[16, 150], [196, 140], [370, 126]].forEach(([x, ww], i) => { const lg = g.createLinearGradient(0, h - 70, 0, h); lg.addColorStop(0, i === 1 ? "#ffd896" : "#c89a58"); lg.addColorStop(1, "#6a4a2a"); g.fillStyle = lg; g.fillRect(x, h - 66, ww, 66); g.fillStyle = "#2a1a14"; g.fillRect(x + ww / 2 - 2, h - 66, 4, 66); });
  g.fillStyle = ["#2c5a46", "#a8322e", "#2c4a7a"][seed % 3]; g.fillRect(0, h - 82, w, 12);
  g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(0, 0, w, 10); speck(g, w, h, seed + 3, 4200, 0.06);
  const vg = g.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, "rgba(255,230,200,.12)"); vg.addColorStop(1, "rgba(20,20,40,.16)"); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
export const T2: Record<string, () => THREE.CanvasTexture> = {
  brick1: () => memo("brk1", () => cv(512, 768, (g, w, h) => brickDraw(g, w, h, 4, 0.5))),
  brick2: () => memo("brk2", () => cv(512, 768, (g, w, h) => brickDraw(g, w, h, 8, 0.3))),
  brick3: () => memo("brk3", () => cv(512, 768, (g, w, h) => brickDraw(g, w, h, 15, 0.65))),
  snowCobble: () => cv(512, 512, (g, w, h) => {
    g.fillStyle = "#dfe6f2"; g.fillRect(0, 0, w, h); const r = rnd(5); const rowH = 46;
    for (let y = 0, row = 0; y < h + rowH; y += rowH, row++) for (let x = -(row % 2) * 28; x < w + 56; x += 56) { g.fillStyle = ["#8a8694", "#7a7684", "#9a96a2", "#6e6a78"][Math.floor(r() * 4)]; g.beginPath(); g.ellipse(x + 28, y + 23, 25, 20, 0, 0, 7); g.fill(); if (r() < 0.78) { g.fillStyle = "rgba(250,252,255,.95)"; g.beginPath(); g.ellipse(x + 28 + (r() - 0.5) * 8, y + 18, 18 + r() * 6, 10 + r() * 5, 0, 0, 7); g.fill(); } }
    for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(60,50,40,.28)"; g.fillRect(60 + i * 120, 0, 18, h); }
    speck(g, w, h, 3, 3000, 0.06);
  }, true),
  tank: () => cv(512, 512, (g, w, h) => {
    g.fillStyle = "#6b4a34"; g.fillRect(0, 0, w, h); const r = rnd(12);
    for (let y = 0; y < h; y += 64) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, y, w, 4); g.fillStyle = "rgba(255,220,180,.12)"; g.fillRect(0, y + 4, w, 3); for (let x = 8; x < w; x += 22) { g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.arc(x, y + 12, 4, 0, 7); g.fill(); g.fillStyle = "rgba(255,225,190,.35)"; g.beginPath(); g.arc(x - 1, y + 11, 2, 0, 7); g.fill(); g.fillStyle = "rgba(0,0,0,.4)"; g.beginPath(); g.arc(x, y + 56, 4, 0, 7); g.fill(); } }
    for (let x = 0; x < w; x += 170) { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x, 0, 5, h); }
    for (let i = 0; i < 26; i++) { const x = r() * w, y0 = r() * h; const lg = g.createLinearGradient(0, y0, 0, y0 + 90 + r() * 140); lg.addColorStop(0, "rgba(30,14,6,.7)"); lg.addColorStop(1, "rgba(30,14,6,0)"); g.fillStyle = lg; g.fillRect(x, y0, 6 + r() * 8, 140); }
    for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(150,90,50,.35)"; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 40, 6 + r() * 12, 0, 0, 7); g.fill(); }
    speck(g, w, h, 8, 2600, 0.08);
  }, true),
  skyDay: () => cv(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7aa0cc"); gr.addColorStop(0.35, "#b4cce0"); gr.addColorStop(0.5, "#f4e4cc"); gr.addColorStop(0.54, "#f8d8b0"); gr.addColorStop(0.58, "#7a7a8a"); gr.addColorStop(1, "#3a3a4a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rnd(2); for (let i = 0; i < 14; i++) { const x = r() * w, y = h * (0.18 + r() * 0.3), ww = 50 + r() * 100; const lg = g.createRadialGradient(x, y, 2, x, y, ww); lg.addColorStop(0, "rgba(255,255,255,.75)"); lg.addColorStop(1, "rgba(255,255,255,0)"); g.save(); g.translate(x, y); g.scale(1, 0.2); g.translate(-x, -y); g.fillStyle = lg; g.fillRect(x - ww, y - ww, ww * 2, ww * 2); g.restore(); } }, false),
  skyDuskB: () => cv(256, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0e1438"); gr.addColorStop(0.3, "#2a2a64"); gr.addColorStop(0.45, "#8a4a78"); gr.addColorStop(0.52, "#f09a68"); gr.addColorStop(0.56, "#ffcf9a"); gr.addColorStop(0.6, "#4a3a58"); gr.addColorStop(1, "#1a1428"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rnd(4); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.3, 1.4, 1.4); } }, false),
  slowSign: () => cv(512, 256, (g, w, h) => { g.fillStyle = "#f2c53d"; g.fillRect(0, 0, w, h); g.strokeStyle = "#1a1014"; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = "#1a1014"; g.font = `88px ${F}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SLOW AS", w / 2, 82); g.fillStyle = "#6a3a14"; g.fillText("MOLASSES", w / 2, 174); }, false),
  purity: () => cv(512, 160, (g, w, h) => { g.fillStyle = "#f0e4c4"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a2a1e"; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = "#7a2a1e"; g.font = `64px ${F}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PURITY DISTILLING", w / 2, h / 2 + 4); }, false),
  dash: () => cv(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2a2630"); gr.addColorStop(1, "#14121a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); speck(g, w, h, 4, 4000, 0.05);
    const dial = (cx: number, cy: number, r: number, label: string) => { g.fillStyle = "#08080c"; g.beginPath(); g.arc(cx, cy, r + 10, 0, 7); g.fill(); const rg = g.createRadialGradient(cx, cy, 4, cx, cy, r); rg.addColorStop(0, "#26303a"); rg.addColorStop(1, "#0e1218"); g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = "#e8e0cc"; g.lineWidth = 3; for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.8 + (i / 10) * Math.PI * 1.4; g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); g.lineTo(cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22)); g.stroke(); } g.strokeStyle = "#ff6a3a"; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(Math.PI * 1.35) * (r - 30), cy + Math.sin(Math.PI * 1.35) * (r - 30)); g.stroke(); g.fillStyle = "#cfc8b4"; g.font = "700 22px Arial"; g.textAlign = "center"; g.fillText(label, cx, cy + r * 0.5); };
    dial(250, 270, 170, "MPH"); dial(774, 270, 170, "RPM"); g.fillStyle = "#08080c"; g.fillRect(420, 120, 184, 300);
    }, false),
  engine: () => cv(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = "#ffc21a"; g.shadowColor = "#ffb000"; g.shadowBlur = 28; g.fillRect(88, 92, 80, 76); g.fillRect(60, 120, 36, 28); g.fillRect(160, 120, 36, 28); g.fillRect(100, 72, 56, 24); g.fillRect(110, 56, 36, 20); g.shadowBlur = 0; g.fillStyle = "#2a1a00"; g.fillRect(104, 112, 48, 36); }, false),
  tape: () => cv(256, 64, (g, w, h) => { g.fillStyle = "#18181c"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(0, 6, w, 6); speck(g, w, h, 1, 300, 0.1); }, false),
  blueprint: () => cv(512, 384, (g, w, h) => { g.fillStyle = "#1d4a86"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1; for (let x = 0; x < w; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.strokeStyle = "#e8f0ff"; g.lineWidth = 3; g.strokeRect(20, 20, w - 40, h - 40); g.beginPath(); g.ellipse(180, 190, 110, 40, 0, 0, 7); g.moveTo(70, 190); g.lineTo(70, 100); g.moveTo(290, 190); g.lineTo(290, 100); g.ellipse(180, 100, 110, 40, 0, 0, 7); g.stroke(); g.fillStyle = "#e8f0ff"; g.font = "700 20px Arial"; g.fillText("TANK  50 FT   2,300,000 GAL", 300, 60); g.fillText("PLATE  15/16 IN", 330, 330); }, false),
  signed: () => cv(512, 160, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "#c7312a"; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = "#c7312a"; g.font = `96px ${F}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SIGNED", w / 2, h / 2 + 4); }, false),
  water: () => cv(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#5a7898"); gr.addColorStop(1, "#2a4060"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rnd(3); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.25})`; g.fillRect(r() * w, r() * h, 8 + r() * 30, 1.5); } }, true),
  plankWall: () => ET.planks(),
};
export const tx2 = (n: string, rx = 1, ry = 1) => memo(`tx2${n}${rx}${ry}`, () => { const t = (T2[n] ?? ET[n])(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; });
