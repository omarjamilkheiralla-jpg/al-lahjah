import * as THREE from "three";
import { INK, rng, signTexture, woodTexture } from "../hotel/kit";
import { inkStroke, INKD } from "./paint";

const mk = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const grain = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n = 500, a = 0.05) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(42,26,30,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
};

const outlineRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lw = 5) => { g.lineWidth = lw; g.strokeStyle = INKD; g.strokeRect(x, y, w, h); };

/** four painted hotel rooms (bedroom, dining room, study, parlour) */
export const roomTextures = () => {
  const wall = (g: CanvasRenderingContext2D, w: number, h: number, c1: string, c2: string, stripe: string) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = stripe; for (let x = 8; x < w; x += 26) g.fillRect(x, 0, 9, h * 0.7);
    g.fillStyle = "#7a4a34"; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = "#5c3624"; g.fillRect(0, h * 0.7, w, 8);
    g.fillStyle = "#b07a50"; g.fillRect(0, h * 0.92, w, h * 0.08);
  };
  const lamp = (g: CanvasRenderingContext2D, x: number, y: number) => {
    const gr = g.createRadialGradient(x, y, 4, x, y, 90); gr.addColorStop(0, "rgba(255,240,170,.95)"); gr.addColorStop(1, "rgba(255,220,120,0)"); g.fillStyle = gr; g.fillRect(x - 90, y - 90, 180, 180);
    g.fillStyle = "#fff0b0"; g.beginPath(); g.moveTo(x - 22, y + 18); g.lineTo(x - 12, y - 14); g.lineTo(x + 12, y - 14); g.lineTo(x + 22, y + 18); g.closePath(); g.fill(); g.lineWidth = 5; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = "#8a5a30"; g.fillRect(x - 5, y + 18, 10, 30); g.fillRect(x - 18, y + 46, 36, 8);
  };
  const frame = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = "#b5793f"; g.fillRect(x, y, w, h); g.fillStyle = c; g.fillRect(x + 6, y + 6, w - 12, h - 12); outlineRect(g, x, y, w, h, 4);
  };
  const out: THREE.Texture[] = [];
  // bedroom
  out.push(mk(256, 320, (g, w, h) => {
    wall(g, w, h, "#ffd9a0", "#f0a870", "rgba(190,90,60,.28)");
    frame(g, 24, 40, 56, 70, "#9ac4e0"); frame(g, 168, 56, 50, 40, "#e8b5b0");
    g.fillStyle = "#c04a3c"; g.fillRect(10, h * 0.5, w - 20, 90); g.fillStyle = "#f4f0e6"; g.beginPath(); g.roundRect(18, h * 0.5 - 8, 80, 34, 14); g.fill(); g.lineWidth = 5; g.strokeStyle = INKD; g.stroke();
    outlineRect(g, 10, h * 0.5, w - 20, 90, 6); g.fillStyle = "#8a2f28"; g.fillRect(10, h * 0.5 + 50, w - 20, 40);
    lamp(g, 215, 150); grain(g, w, h, 3);
  }));
  // dining room
  out.push(mk(256, 320, (g, w, h) => {
    wall(g, w, h, "#ffe4b0", "#f4b678", "rgba(60,130,110,.25)");
    frame(g, 90, 34, 76, 56, "#f2c7a0");
    g.fillStyle = "#fff"; g.fillRect(0, h * 0.56, w, 14); g.fillStyle = "#b24a3a"; g.fillRect(0, h * 0.62, w, 60); outlineRect(g, 0, h * 0.56, w, 74, 5);
    g.fillStyle = "#f6efe0"; g.beginPath(); g.ellipse(70, h * 0.56, 34, 9, 0, 0, 7); g.fill(); g.lineWidth = 4; g.stroke();
    lamp(g, 40, 120); grain(g, w, h, 4);
  }));
  // study
  out.push(mk(256, 320, (g, w, h) => {
    wall(g, w, h, "#ffcf94", "#e89a62", "rgba(120,60,90,.25)");
    g.fillStyle = "#7a4a2a"; g.fillRect(14, 30, 110, h * 0.68); outlineRect(g, 14, 30, 110, h * 0.68, 6);
    const r = rng(8); const cols = ["#c0453c", "#2f7a8a", "#e0b23a", "#4a8a52", "#8a4a9a"];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 7; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(20 + i * 15, 38 + row * 60, 12, 50 - r() * 10); outlineRect(g, 20 + i * 15, 38 + row * 60, 12, 50, 2); }
    lamp(g, 190, 140); frame(g, 150, 40, 80, 50, "#a8d0a0"); grain(g, w, h, 5);
  }));
  // parlour
  out.push(mk(256, 320, (g, w, h) => {
    wall(g, w, h, "#ffe0a8", "#eeae78", "rgba(200,120,60,.25)");
    g.fillStyle = "#6a3a8a"; g.beginPath(); g.roundRect(20, h * 0.5, 170, 80, 20); g.fill(); g.lineWidth = 6; g.strokeStyle = INKD; g.stroke();
    g.fillStyle = "#8a5ab0"; g.beginPath(); g.roundRect(30, h * 0.5 - 24, 150, 40, 18); g.fill(); g.stroke();
    frame(g, 98, 30, 64, 80, "#c8b0e0"); lamp(g, 218, 170); grain(g, w, h, 6);
  }));
  return out;
};

/** the engineer's plan: a street cross-section with a 14 FT arrow */
export const planTexture = () =>
  mk(1024, 640, (g, w, h) => {
    g.fillStyle = "#cfe0ea"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(60,100,130,.35)"; g.lineWidth = 2;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    // old street (low) and new street (high) with buildings
    g.fillStyle = "#8a6a50"; g.fillRect(0, 430, w, 210);
    g.fillStyle = "#b8956a"; g.fillRect(0, 250, w, 60);
    g.fillStyle = "#6b4c36"; g.fillRect(0, 310, w, 120);
    g.setLineDash([14, 10]); g.lineWidth = 4; g.strokeStyle = INKD; g.beginPath(); g.moveTo(0, 250); g.lineTo(w, 250); g.stroke(); g.setLineDash([]);
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 430); g.lineTo(w, 430); g.stroke();
    // buildings
    for (const [x, c] of [[80, "#c4472e"], [330, "#e0b23a"], [600, "#2f7a8a"], [850, "#c4472e"]] as const) { g.fillStyle = c; g.fillRect(x, 120, 150, 130); outlineRect(g, x, 120, 150, 130, 5); g.fillStyle = "#ffe9b0"; g.fillRect(x + 25, 150, 30, 40); g.fillRect(x + 95, 150, 30, 40); }
    // arrow + label
    g.strokeStyle = "#c8403a"; g.fillStyle = "#c8403a"; g.lineWidth = 12;
    g.beginPath(); g.moveTo(512, 440); g.lineTo(512, 270); g.stroke();
    g.beginPath(); g.moveTo(512, 245); g.lineTo(480, 292); g.lineTo(544, 292); g.closePath(); g.fill();
    g.font = "400 130px 'Lilita One', Impact, sans-serif"; g.textAlign = "left"; g.lineWidth = 12; g.strokeStyle = "#fff6e0"; g.strokeText("14 FT", 580, 400); g.fillStyle = "#c8403a"; g.fillText("14 FT", 580, 400);
    g.font = "400 44px 'Lilita One', Impact, sans-serif"; g.fillStyle = INKD; g.fillText("NEW STREET", 40, 235); g.fillText("OLD MUD", 40, 480);
    outlineRect(g, 0, 0, w, h, 14);
    grain(g, w, h, 12, 900, 0.04);
  });

/** what you see out of the engineer's window: lake, rooftops, chimney smoke */
export const windowViewTexture = () =>
  mk(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9bd1f2"); gr.addColorStop(0.55, "#f8e0b8"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#4a90c4"; g.fillRect(0, h * 0.58, w, h * 0.12);
    g.fillStyle = "#7a5a46"; g.fillRect(0, h * 0.7, w, h * 0.3);
    const r = rng(14);
    for (let i = 0; i < 9; i++) { const x = i * 58 + r() * 12, bh = 40 + r() * 60; g.fillStyle = ["#c4472e", "#e0b23a", "#8a6a98", "#2f7a8a"][i % 4]; g.fillRect(x, h * 0.7 - bh, 52, bh); outlineRect(g, x, h * 0.7 - bh, 52, bh, 3); }
    g.fillStyle = "rgba(255,255,255,.85)"; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(80 + i * 110, 70 + (i % 2) * 24, 52, 20, 0, 0, 7); g.fill(); }
    grain(g, w, h, 21);
  });

export const posterTexture = (title: string, sub: string, bg = "#e8d6a8") =>
  mk(384, 512, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = "#2f7a8a"; g.fillRect(24, 24, w - 48, h * 0.5);
    g.fillStyle = "#e0b23a"; g.beginPath(); g.arc(w / 2, h * 0.3, 70, 0, 7); g.fill(); outlineRect(g, 24, 24, w - 48, h * 0.5, 6);
    g.fillStyle = "#7a4a2a"; g.fillRect(40, h * 0.44, w - 80, 22);
    g.fillStyle = INKD; g.textAlign = "center"; g.font = "900 52px 'Playfair Display', Georgia, serif"; (g as any).letterSpacing = "3px"; g.fillText(title, w / 2, h * 0.66);
    g.font = "400 32px 'Lilita One', Impact, sans-serif"; g.fillText(sub, w / 2, h * 0.76); (g as any).letterSpacing = "0px";
    outlineRect(g, 0, 0, w, h, 12); grain(g, w, h, 33);
  });

export const nameplateTexture = (text: string) =>
  mk(720, 160, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e6c079"); gr.addColorStop(0.5, "#c79a56"); gr.addColorStop(1, "#a8793a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,240,200,.7)"; g.lineWidth = 4; g.strokeRect(16, 16, w - 32, h - 32);
    let size = 58; const fam = "'Playfair Display', Georgia, serif"; g.font = `800 ${size}px ${fam}`; (g as any).letterSpacing = "4px";
    const mw = g.measureText(text).width; if (mw > w - 80) { size *= (w - 80) / mw; g.font = `800 ${size}px ${fam}`; }
    g.fillStyle = "rgba(255,244,214,.7)"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2 + 1.5, h / 2 + 3.5);
    g.fillStyle = "#4a2e12"; g.fillText(text, w / 2, h / 2 + 2);
    outlineRect(g, 0, 0, w, h, 8); grain(g, w, h, 34, 300, 0.07);
  });

export const wallTexture = (c1: string, c2: string, seed = 5) =>
  mk(512, 512, (g, w, h) => {
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    g.fillStyle = c2; g.fillRect(0, h * 0.66, w, h * 0.34);
    g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, h * 0.66, w, 10); g.fillStyle = "rgba(42,26,30,.4)"; g.fillRect(0, h * 0.66 + 10, w, 6);
    const r = rng(seed); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(42,26,30,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 40, 6 + r() * 26, r() * 3, 0, 7); g.fill(); }
    grain(g, w, h, seed, 900, 0.045);
  }, true);

export const cobbleTexture = (seed = 3) =>
  mk(512, 512, (g, w, h) => {
    g.fillStyle = "#6b5a52"; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
      const off = (y % 2) * 22;
      g.fillStyle = ["#a8957e", "#9a8670", "#b5a28a", "#8a7866"][Math.floor(r() * 4)];
      g.beginPath(); g.roundRect(x * 46 + off + 2, y * 46 + 2, 40, 40, 12); g.fill();
      g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(x * 46 + off + 8, y * 46 + 8, 18, 6);
    }
    grain(g, w, h, seed, 500, 0.05);
  }, true);

export const lakeTexture = () =>
  mk(512, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#c8e4f4"); gr.addColorStop(1, "#4a90c4"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3; const r = rng(2);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 24 + r() * 30, y); g.stroke(); }
  });

export const cloudTexture = () =>
  mk(256, 128, (g, w, h) => {
    g.fillStyle = "rgba(255,255,255,.95)";
    for (const [x, y, r] of [[70, 80, 44], [120, 62, 52], [176, 78, 42], [110, 90, 38], [150, 92, 36]] as const) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = "rgba(160,190,230,.5)"; g.fillRect(40, 96, 180, 20);
  });

export { signTexture, woodTexture, INK };
