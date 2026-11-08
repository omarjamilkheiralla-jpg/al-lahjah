import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import React, { useMemo } from "react";

export const INK = "#351f22";
export const W = 1080;
export const H = 1920;

/* ---------- deterministic random ---------- */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/* ---------- math helpers ---------- */
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/* ---------- painted canvas textures ---------- */
const mk = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

export const brickTexture = (base: string[], mortar: string, seed = 3) =>
  mk(1024, 1024, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = mortar;
    g.fillRect(0, 0, w, h);
    const rows = 20, cols = 8;
    const bh = h / rows, bw = w / cols;
    for (let y = 0; y < rows; y++) {
      for (let x = -1; x < cols + 1; x++) {
        const off = (y % 2) * (bw / 2);
        g.fillStyle = base[Math.floor(r() * base.length)];
        g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
        if (r() < 0.12) {
          g.fillStyle = "rgba(53,31,34,0.18)";
          g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4);
        }
        if (r() < 0.07) {
          // chip
          g.fillStyle = "rgba(53,31,34,0.35)";
          g.fillRect(x * bw + off + 4 + r() * (bw - 20), y * bh + 4 + r() * (bh - 12), 7, 5);
        }
      }
    }
    // soot streaks
    for (let i = 0; i < 9; i++) {
      const x = r() * w;
      g.fillStyle = `rgba(53,31,34,${0.05 + r() * 0.06})`;
      g.fillRect(x, 0, 6 + r() * 18, h * (0.4 + r() * 0.6));
    }
  });

export const woodTexture = (base: string[], seed = 7, plankRows = 6, vertical = false) =>
  mk(512, 512, (g, w, h) => {
    const r = rng(seed);
    const n = plankRows;
    for (let i = 0; i < n; i++) {
      g.fillStyle = base[Math.floor(r() * base.length)];
      if (vertical) g.fillRect((i * w) / n, 0, w / n, h);
      else g.fillRect(0, (i * h) / n, w, h / n);
      g.strokeStyle = "rgba(53,31,34,0.55)";
      g.lineWidth = 3;
      g.beginPath();
      if (vertical) { g.moveTo((i * w) / n, 0); g.lineTo((i * w) / n, h); }
      else { g.moveTo(0, (i * h) / n); g.lineTo(w, (i * h) / n); }
      g.stroke();
      // grain
      g.strokeStyle = "rgba(53,31,34,0.18)";
      g.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        const o = (i + r() * 0.8 + 0.1) * (vertical ? w / n : h / n);
        g.beginPath();
        if (vertical) { g.moveTo(o, r() * h * 0.3); g.lineTo(o + 3, h * (0.5 + r() * 0.5)); }
        else { g.moveTo(r() * w * 0.3, o); g.lineTo(w * (0.5 + r() * 0.5), o + 3); }
        g.stroke();
      }
      // nails
      g.fillStyle = "rgba(53,31,34,0.7)";
      const o2 = (i + 0.5) * (vertical ? w / n : h / n);
      for (const p of [0.06, 0.94]) {
        g.beginPath();
        if (vertical) g.arc(o2, p * h, 4, 0, 7); else g.arc(p * w, o2, 4, 0, 7);
        g.fill();
      }
    }
  });

export const mudTexture = (seed = 11) =>
  mk(1024, 1024, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = "#7a5a46";
    g.fillRect(0, 0, w, h);
    const cols = ["#6c4e3c", "#86654d", "#5d4234", "#917156"];
    for (let i = 0; i < 90; i++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.beginPath();
      g.ellipse(r() * w, r() * h, 30 + r() * 90, 12 + r() * 40, r() * 3, 0, 7);
      g.fill();
    }
    // puddles that mirror the sky
    for (let i = 0; i < 7; i++) {
      const x = r() * w, y = r() * h, rx = 50 + r() * 80, ry = 18 + r() * 28;
      g.fillStyle = "#35242a";
      g.beginPath(); g.ellipse(x, y, rx + 6, ry + 5, 0, 0, 7); g.fill();
      g.fillStyle = "#f0c9a4";
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
      g.fillStyle = "#e7a98f";
      g.beginPath(); g.ellipse(x, y + ry * 0.25, rx * 0.8, ry * 0.5, 0, 0, 7); g.fill();
    }
    // wheel ruts
    g.strokeStyle = "rgba(53,31,34,0.35)";
    g.lineWidth = 10;
    for (const y of [h * 0.3, h * 0.36, h * 0.74, h * 0.8]) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 64) g.lineTo(x, y + Math.sin(x * 0.02) * 8);
      g.stroke();
    }
    // pebbles
    for (let i = 0; i < 220; i++) {
      g.fillStyle = r() < 0.5 ? "#a58769" : "#5a4032";
      g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 4, 0, 7); g.fill();
    }
  });

export const stoneTexture = (seed = 5) =>
  mk(512, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = "#4a3b3c";
    g.fillRect(0, 0, w, h);
    const rows = 5;
    for (let y = 0; y < rows; y++) {
      let x = -r() * 60;
      while (x < w) {
        const bw = 90 + r() * 90;
        g.fillStyle = ["#b3a08c", "#a08d7c", "#c2b09a", "#94826f"][Math.floor(r() * 4)];
        g.fillRect(x + 3, (y * h) / rows + 3, bw - 6, h / rows - 6);
        if (r() < 0.3) { g.fillStyle = "rgba(53,31,34,.22)"; g.fillRect(x + 3, (y * h) / rows + 3, bw - 6, 14); }
        x += bw;
      }
    }
  });

export const plasterTexture = (base: string, seed = 2) =>
  mk(512, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(53,31,34,${0.03 + r() * 0.05})`;
      g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, 7); g.fill();
    }
    g.strokeStyle = "rgba(53,31,34,0.12)";
    g.lineWidth = 2;
    for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });

export const signTexture = (text: string, bg: string, fg: string, w = 1024, h = 256, sub?: string) =>
  mk(w, h, (g) => {
    g.fillStyle = INK;
    g.fillRect(0, 0, w, h);
    g.fillStyle = bg;
    g.fillRect(10, 10, w - 20, h - 20);
    g.strokeStyle = fg;
    g.lineWidth = 5;
    g.strokeRect(24, 24, w - 48, h - 48);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const size = Math.min(h * (sub ? 0.46 : 0.58), (w * 0.86) / (text.length * 0.62));
    g.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
    g.fillText(text, w / 2, sub ? h * 0.42 : h * 0.52);
    if (sub) {
      g.font = `700 ${h * 0.16}px "Arial Black", Impact, sans-serif`;
      g.fillText(sub, w / 2, h * 0.76);
    }
    // wear
    const r = rng(text.length * 13);
    g.fillStyle = "rgba(53,31,34,0.22)";
    for (let i = 0; i < 30; i++) g.fillRect(r() * w, r() * h, 3 + r() * 14, 2 + r() * 4);
  });

/** painted measuring pole: one mark per foot, starting at `y0` metres, pole is `len` metres tall */
export const poleMarksTexture = (y0: number, len: number) =>
  mk(128, 1024, (g, w, h) => {
    g.fillStyle = "#f0d9a6";
    g.fillRect(0, 0, w, h);
    g.fillStyle = INK;
    g.font = "900 44px Arial Black, Impact, sans-serif";
    g.textAlign = "left";
    for (let i = 0; i <= 6; i++) {
      const y = h - ((y0 + i * 0.3048) / len) * h;
      g.fillRect(0, y - 4, i % 2 ? w * 0.5 : w * 0.85, 9);
      if (i > 0) g.fillText(String(i), w * 0.5, y - 8);
    }
  });

export const skyTexture = () =>
  mk(8, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#9f8fb8");
    gr.addColorStop(0.35, "#e0a9a6");
    gr.addColorStop(0.7, "#f6cfa0");
    gr.addColorStop(1, "#fbe6c4");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });

export const glowTexture = (color = "255,210,140") =>
  mk(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, `rgba(${color},0.95)`);
    gr.addColorStop(0.35, `rgba(${color},0.35)`);
    gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });

export const roomTexture = (seed = 4, warm = "#ffd08a", deep = "#e8944f") =>
  mk(256, 256, (g, w, h) => {
    const r = rng(seed);
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, warm);
    gr.addColorStop(1, deep);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    // wainscot + picture frame + wallpaper stripes
    g.fillStyle = "rgba(140,70,50,.35)";
    for (let x = 0; x < w; x += 24) g.fillRect(x, 0, 8, h * 0.62);
    g.fillStyle = "#8d553f";
    g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle = INK;
    g.fillRect(w * (0.2 + r() * 0.4), h * 0.2, 54, 40);
    g.fillStyle = "#f3d8a6";
    g.fillRect(w * 0.2 + 4, h * 0.2 + 4, 46, 32);
  });

/* ---------- toon shading ---------- */
let gradient: THREE.DataTexture | null = null;
export const toonGradient = () => {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
  }
  return gradient;
};

export const toon = (color: string | THREE.Texture, extra: Partial<THREE.MeshToonMaterialParameters> = {}) =>
  new THREE.MeshToonMaterial({
    gradientMap: toonGradient(),
    ...(typeof color === "string" ? { color } : { map: color }),
    ...extra,
  });

/* ---------- ink outlines (inverted hull, constant pixel width) ---------- */
const inkCache = new Map<number, THREE.ShaderMaterial>();
export const inkMaterial = (px: number) => {
  let m = inkCache.get(px);
  if (!m) {
    m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uPx: { value: px },
        uRes: { value: new THREE.Vector2(W, H) },
        uColor: { value: new THREE.Color(INK) },
      },
      vertexShader: /* glsl */ `
        uniform float uPx; uniform vec2 uRes;
        void main(){
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          vec3 vn = normalize(normalMatrix * normal);
          vec2 d = (projectionMatrix * vec4(vn,0.0)).xy;
          d = length(d) > 1e-4 ? normalize(d) : vec2(0.0);
          clip.xy += d * (uPx * 2.0) / uRes * clip.w;
          gl_Position = clip;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        void main(){
          gl_FragColor = vec4(uColor,1.0);
          #include <colorspace_fragment>
        }`,
    });
    inkCache.set(px, m);
  }
  return m;
};

const hullCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
export const hullGeometry = (geo: THREE.BufferGeometry) => {
  let h = hullCache.get(geo);
  if (!h) {
    const g = geo.clone();
    g.deleteAttribute("uv");
    g.deleteAttribute("normal");
    h = mergeVertices(g, 1e-3);
    h.computeVertexNormals();
    hullCache.set(geo, h);
  }
  return h;
};

type InkProps = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  px?: number;
  cast?: boolean;
  receive?: boolean;
  outline?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"mesh">, "geometry" | "material">;

/** A mesh with a dark ink outline around its silhouette. */
export const Ink: React.FC<InkProps> = ({
  geometry, material, px = 3, cast = true, receive = true, outline = true, children, ...rest
}) => {
  const hull = useMemo(() => hullGeometry(geometry), [geometry]);
  return (
    <mesh geometry={geometry} material={material} castShadow={cast} receiveShadow={receive} {...rest}>
      {outline ? <mesh geometry={hull} material={inkMaterial(px)} /> : null}
      {children}
    </mesh>
  );
};

/* ---------- geometry helpers ---------- */
export const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/** Rectangle with rectangular holes, extruded. Front face lies at z=0, back at z=-depth. */
export const wallWithHoles = (
  w: number,
  h: number,
  depth: number,
  holes: { x: number; y: number; w: number; h: number; arch?: boolean }[],
  doorNotch?: { x: number; w: number; h: number },
) => {
  const s = new THREE.Shape();
  if (doorNotch) {
    const a = doorNotch.x - doorNotch.w / 2, b = doorNotch.x + doorNotch.w / 2;
    s.moveTo(-w / 2, 0);
    s.lineTo(a, 0);
    s.lineTo(a, doorNotch.h);
    s.lineTo(b, doorNotch.h);
    s.lineTo(b, 0);
    s.lineTo(w / 2, 0);
  } else {
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
  }
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.lineTo(-w / 2, 0);
  for (const o of holes) {
    const p = new THREE.Path();
    const x0 = o.x - o.w / 2, x1 = o.x + o.w / 2;
    p.moveTo(x0, o.y);
    p.lineTo(x0, o.y + o.h - (o.arch ? o.w / 2 : 0));
    if (o.arch) p.absarc(o.x, o.y + o.h - o.w / 2, o.w / 2, Math.PI, 0, true);
    else p.lineTo(x1, o.y + o.h);
    if (!o.arch) { /* already at top-right */ }
    p.lineTo(x1, o.y);
    p.lineTo(x0, o.y);
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 16 });
  g.translate(0, 0, -depth);
  return g;
};

export const repeatTex = (t: THREE.Texture, rx: number, ry: number) => {
  const c = t.clone();
  c.needsUpdate = true;
  c.repeat.set(rx, ry);
  c.colorSpace = THREE.SRGBColorSpace;
  return c;
};
