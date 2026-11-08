import * as THREE from "three";
import React, { useMemo } from "react";
import { Ink, INK, box, toon, rng } from "../hotel/kit";
import { INKD } from "./paint";

const mk = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const soft = (g: CanvasRenderingContext2D, px: number, fn: () => void) => { g.filter = `blur(${px}px)`; fn(); g.filter = "none"; };
const dots = (g: CanvasRenderingContext2D, w: number, h: number, seed: number, n: number, a: number) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(42,26,30,${a})` : `rgba(255,255,255,${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
};

/* ------------------------------------------------------------ textures */
let C: any = null;
const T = () =>
  (C ??= {
    sky: mk(8, 1024, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "#5f9fdc"); gr.addColorStop(0.2, "#86bdea"); gr.addColorStop(0.38, "#b9dcf2"); gr.addColorStop(0.47, "#f6e6c8"); gr.addColorStop(0.5, "#fbeacb"); gr.addColorStop(1, "#fbeacb");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }),
    clouds: [3, 8, 14].map((seed) =>
      mk(512, 256, (g, w, h) => {
        const r = rng(seed);
        soft(g, 6, () => {
          for (let i = 0; i < 22; i++) {
            const x = 90 + r() * 330, y = 120 + (r() - 0.5) * 50 - Math.sin((x / w) * Math.PI) * 28, rad = 28 + r() * 46;
            const gr = g.createRadialGradient(x - rad * 0.2, y - rad * 0.3, rad * 0.1, x, y, rad);
            gr.addColorStop(0, "rgba(255,255,255,0.98)"); gr.addColorStop(0.7, "rgba(250,247,244,0.9)"); gr.addColorStop(1, "rgba(235,228,232,0)");
            g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
          }
        });
        // soft warm underside shading
        g.globalCompositeOperation = "source-atop";
        const sh = g.createLinearGradient(0, 100, 0, 200); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(206,190,206,0.55)");
        g.fillStyle = sh; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "source-over";
      }),
    ),
    mud: mk(1024, 1024, (g, w, h) => {
      const r = rng(11);
      g.fillStyle = "#765a44"; g.fillRect(0, 0, w, h);
      soft(g, 38, () => { for (let i = 0; i < 70; i++) { g.fillStyle = ["#6a503c", "#85684e", "#5e4634", "#917358", "#7d6a4c"][Math.floor(r() * 5)]; g.beginPath(); g.ellipse(r() * w, r() * h, 60 + r() * 150, 30 + r() * 80, r() * 3, 0, 7); g.fill(); } });
      // wheel ruts: soft dark channels with a light rim
      for (const y of [h * 0.28, h * 0.34, h * 0.72, h * 0.78]) {
        soft(g, 7, () => { g.strokeStyle = "rgba(48,32,24,0.55)"; g.lineWidth = 22; g.beginPath(); g.moveTo(-10, y); for (let x = 0; x <= w + 10; x += 40) g.lineTo(x, y + Math.sin(x * 0.012 + y) * 9); g.stroke(); });
        soft(g, 3, () => { g.strokeStyle = "rgba(200,170,130,0.25)"; g.lineWidth = 5; g.beginPath(); g.moveTo(-10, y - 14); for (let x = 0; x <= w + 10; x += 40) g.lineTo(x, y - 14 + Math.sin(x * 0.012 + y) * 9); g.stroke(); });
      }
      // sky-mirroring puddles with soft rims
      for (let i = 0; i < 9; i++) {
        const x = r() * w, y = r() * h, rx = 40 + r() * 90, ry = 16 + r() * 34;
        soft(g, 8, () => { g.fillStyle = "rgba(40,28,20,0.55)"; g.beginPath(); g.ellipse(x, y, rx + 14, ry + 10, 0, 0, 7); g.fill(); });
        const gr = g.createLinearGradient(0, y - ry, 0, y + ry); gr.addColorStop(0, "#cfe0ea"); gr.addColorStop(0.6, "#a9c4d6"); gr.addColorStop(1, "#8aa6bb");
        soft(g, 2, () => { g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); });
        g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.4, ry * 0.18, 0, 0, 7); g.fill();
      }
      for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? "#a58a6c" : "#4e3a2c"; g.beginPath(); g.arc(r() * w, r() * h, 1.5 + r() * 3.5, 0, 7); g.fill(); }
      // sparse grass tufts
      g.strokeStyle = "#7a8a46"; g.lineWidth = 2.5; g.lineCap = "round";
      for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.globalAlpha = 0.55; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + k * 3, y - 6 - r() * 4); g.stroke(); } g.globalAlpha = 1; }
      dots(g, w, h, 4, 2500, 0.035);
    }, true),
    cobble: mk(1024, 1024, (g, w, h) => {
      const r = rng(5);
      g.fillStyle = "#4a3c36"; g.fillRect(0, 0, w, h);
      const cell = 64;
      for (let y = -1; y < 17; y++) for (let x = -1; x < 17; x++) {
        const off = (y % 2) * (cell / 2), cx = x * cell + off + r() * 6, cy = y * cell + r() * 6, sw = cell - 7 - r() * 6, sh = cell - 8 - r() * 6;
        const base = [[168, 148, 124], [152, 134, 112], [178, 160, 136], [138, 122, 104], [160, 142, 128]][Math.floor(r() * 5)];
        const gr = g.createLinearGradient(cx, cy, cx + sw, cy + sh);
        gr.addColorStop(0, `rgb(${base[0] + 22},${base[1] + 20},${base[2] + 18})`); gr.addColorStop(1, `rgb(${base[0] - 26},${base[1] - 24},${base[2] - 22})`);
        g.fillStyle = gr; g.beginPath(); g.roundRect(cx, cy, sw, sh, 16); g.fill();
        g.strokeStyle = "rgba(42,26,30,0.45)"; g.lineWidth = 2; g.stroke();
      }
      soft(g, 30, () => { for (let i = 0; i < 18; i++) { g.fillStyle = r() < 0.5 ? "rgba(90,70,50,0.35)" : "rgba(110,130,70,0.22)"; g.beginPath(); g.ellipse(r() * w, r() * h, 70 + r() * 90, 40 + r() * 50, r() * 3, 0, 7); g.fill(); } });
      dots(g, w, h, 8, 1500, 0.03);
    }, true),
    shingle: mk(512, 512, (g, w, h) => {
      const r = rng(9);
      g.fillStyle = "#4a3436"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 14; y++) for (let x = -1; x < 12; x++) {
        const off = (y % 2) * 22; g.fillStyle = ["#7a4a3c", "#6a3f36", "#8a5646", "#5e3830"][Math.floor(r() * 4)];
        g.beginPath(); g.roundRect(x * 44 + off, y * 37, 41, 38, [2, 2, 14, 14]); g.fill(); g.strokeStyle = "rgba(42,26,30,.5)"; g.lineWidth = 2; g.stroke();
      }
      dots(g, w, h, 3, 900, 0.04);
    }, true),
    leaf: mk(256, 256, (g, w, h) => {
      const r = rng(6);
      g.fillStyle = "#5aa056"; g.fillRect(0, 0, w, h);
      soft(g, 6, () => { for (let i = 0; i < 50; i++) { g.fillStyle = ["#74b866", "#4a8c4c", "#86c874", "#3f7c44"][Math.floor(r() * 4)]; g.beginPath(); g.arc(r() * w, r() * h, 18 + r() * 26, 0, 7); g.fill(); } });
      dots(g, w, h, 2, 600, 0.05);
    }, true),
    strata: mk(1024, 256, (g, w, h) => {
      const r = rng(17);
      const layers: [number, string][] = [[0.0, "#9a8a76"], [0.13, "#8a6f56"], [0.34, "#a89478"], [0.5, "#5e4634"], [0.78, "#4a3828"]];
      layers.forEach(([y0, c], i) => { const y1 = (layers[i + 1]?.[0] ?? 1) * h; g.fillStyle = c; g.fillRect(0, y0 * h, w, y1 - y0 * h); });
      // cobbles on top
      for (let x = 0; x < w; x += 46) { g.fillStyle = ["#b5a28a", "#a08d76", "#c2b09a"][Math.floor(r() * 3)]; g.beginPath(); g.roundRect(x + 2, 3, 42, 28, 9); g.fill(); g.strokeStyle = "rgba(42,26,30,.5)"; g.lineWidth = 2; g.stroke(); }
      // buried old street: a darker rutted surface with a few planks and stones
      g.strokeStyle = "#35261c"; g.lineWidth = 7; g.beginPath(); g.moveTo(0, h * 0.5); for (let x = 0; x <= w; x += 32) g.lineTo(x, h * 0.5 + Math.sin(x * 0.03) * 5); g.stroke();
      g.fillStyle = "#8a5a34"; for (let i = 0; i < 6; i++) g.fillRect(60 + i * 160, h * 0.5 + 8, 70, 12);
      soft(g, 14, () => { for (let i = 0; i < 24; i++) { g.fillStyle = r() < 0.5 ? "rgba(42,26,30,.22)" : "rgba(255,255,255,.12)"; g.beginPath(); g.ellipse(r() * w, r() * h, 40 + r() * 70, 14 + r() * 24, 0, 0, 7); g.fill(); } });
      for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.5 ? "#c0ac90" : "#3e2e22"; g.beginPath(); g.arc(r() * w, h * 0.13 + r() * h * 0.85, 1.5 + r() * 4, 0, 7); g.fill(); }
      g.fillStyle = "rgba(42,26,30,.5)"; g.fillRect(0, 0, w, 4); g.fillRect(0, h * 0.13 - 2, w, 4);
      dots(g, w, h, 5, 1500, 0.04);
    }),
    glow: mk(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,236,190,0.9)"); gr.addColorStop(1, "rgba(255,236,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
    smoke: mk(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(235,228,230,0.75)"); gr.addColorStop(1, "rgba(235,228,230,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
    lake: mk(512, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#d6ecf6"); gr.addColorStop(0.3, "#8fc5e6"); gr.addColorStop(1, "#4f93c8");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const r = rng(3); g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 2; g.lineCap = "round";
      for (let i = 0; i < 70; i++) { const x = r() * w, y = 20 + r() * (h - 20), l = 10 + y * 0.15 + r() * 24; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke(); }
    }, true),
  });

/* ------------------------------------------------------------ sky */
export const SkyDome: React.FC<{ t?: number }> = ({ t = 0 }) => {
  const x = T();
  const clouds = useMemo(() => {
    const r = rng(33);
    return Array.from({ length: 11 }, (_, i) => ({ ang: -1.15 + (i / 10) * 2.3 + (r() - 0.5) * 0.2, h: 28 + r() * 46, s: 55 + r() * 45, v: i % 3, drift: 0.01 + r() * 0.02, d: 150 + r() * 25 }));
  }, []);
  const mats = useMemo(() => x.clouds.map((tx: THREE.Texture) => new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, fog: false })), [x]);
  return (
    <group>
      <mesh renderOrder={-10}>
        <sphereGeometry args={[210, 32, 20]} />
        <meshBasicMaterial map={x.sky} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {clouds.map((c, i) => {
        const a = c.ang + t * c.drift;
        return (
          <mesh key={i} material={mats[c.v]} position={[Math.sin(a) * c.d, c.h, -Math.cos(a) * c.d]} rotation={[0, -a, 0]} renderOrder={-9}>
            <planeGeometry args={[c.s, c.s / 2]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ------------------------------------------------------------ ground */
export const Terrain: React.FC<{ kind?: "mud" | "cobble"; w?: number; d?: number; z?: number; y?: number; tile?: number; x?: number }> = ({ kind = "mud", w = 240, d = 160, z = -30, y = 0, tile = 14, x = 0 }) => {
  const tx = T();
  const m = useMemo(() => {
    const t = (kind === "mud" ? tx.mud : tx.cobble).clone();
    t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / tile, d / tile); t.anisotropy = 8;
    return toon(t);
  }, [kind, w, d, tile, tx]);
  const g = useMemo(() => new THREE.PlaneGeometry(w, d), [w, d]);
  return <mesh geometry={g} material={m} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]} receiveShadow />;
};

/* ------------------------------------------------------------ trees, fences, poles */
export const Tree: React.FC<{ p: [number, number, number]; s?: number; seed?: number }> = ({ p, s = 1, seed = 1 }) => {
  const tx = T();
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.18, 0.3, 3.0, 10), []);
  const leaf = useMemo(() => toon((() => { const t = tx.leaf.clone(); t.needsUpdate = true; t.repeat.set(2, 2); return t; })()), [tx]);
  const bark = useMemo(() => toon("#6a4a38"), []);
  const blobs = useMemo(() => { const r = rng(seed * 7); return Array.from({ length: 6 }, () => ({ x: (r() - 0.5) * 2.2, y: 3.4 + r() * 1.8, z: (r() - 0.5) * 1.8, r: 1.2 + r() * 0.8 })); }, [seed]);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  return (
    <group position={p} scale={s}>
      <Ink geometry={trunk} material={bark} position={[0, 1.5, 0]} px={2} />
      {blobs.map((b, i) => <Ink key={i} geometry={geo} material={leaf} position={[b.x, b.y, b.z]} scale={b.r} px={2.4} />)}
    </group>
  );
};

export const Fence: React.FC<{ p: [number, number, number]; n?: number; rot?: number }> = ({ p, n = 8, rot = 0 }) => {
  const post = useMemo(() => box(0.14, 1.1, 0.14), []);
  const rail = useMemo(() => box(1.0, 0.1, 0.07), []);
  const m = useMemo(() => toon("#c8b08a"), []);
  return (
    <group position={p} rotation={[0, rot, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[i * 1.0, 0, 0]}>
          <Ink geometry={post} material={m} position={[0, 0.55, 0]} px={1.6} cast={false} />
          <Ink geometry={rail} material={m} position={[0.5, 0.82, 0]} px={1.4} cast={false} /><Ink geometry={rail} material={m} position={[0.5, 0.45, 0]} px={1.4} cast={false} />
        </group>
      ))}
    </group>
  );
};

export const Pole: React.FC<{ p: [number, number, number] }> = ({ p }) => {
  const g = useMemo(() => new THREE.CylinderGeometry(0.1, 0.14, 7.5, 8), []);
  const arm = useMemo(() => box(1.8, 0.1, 0.1), []);
  const m = useMemo(() => toon("#6a4a38"), []);
  return (
    <group position={p}>
      <Ink geometry={g} material={m} position={[0, 3.75, 0]} px={1.8} cast={false} />
      <Ink geometry={arm} material={m} position={[0, 6.9, 0]} px={1.6} cast={false} />
      <Ink geometry={arm} material={m} position={[0, 6.2, 0]} scale={[0.7, 1, 1]} px={1.6} cast={false} />
    </group>
  );
};

/* ------------------------------------------------------------ roofs */
export const GableRoof: React.FC<{ w: number; depth?: number; y: number; pitch?: number; chimney?: boolean }> = ({ w, depth = 5, y, pitch = 0.5, chimney = true }) => {
  const tx = T();
  const run = depth / 2 / Math.cos(pitch);
  const slab = useMemo(() => box(w + 0.8, 0.2, run + 0.3), [w, run]);
  const m = useMemo(() => { const t = tx.shingle.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, (w + 0.8) / 2.6), Math.max(1, run / 2.6)); return toon(t); }, [tx, w, run]);
  const ridge = useMemo(() => box(w + 0.9, 0.16, 0.22), [w]);
  const rise = Math.sin(pitch) * run;
  const gable = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rise); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false }); }, [w, rise]);
  const chim = useMemo(() => box(0.7, 1.8, 0.7), []);
  const brick = useMemo(() => toon("#a8452f"), []);
  return (
    <group position={[0, y, 0]}>
      <Ink geometry={slab} material={m} position={[0, rise / 2 + 0.1, depth / 4 - depth / 2 + depth / 2 - depth / 2 + 0.0]} rotation={[pitch, 0, 0]} px={2.2} />
      <Ink geometry={slab} material={m} position={[0, rise / 2 + 0.1, -depth / 4 - 0.0 - depth / 2 + depth / 2]} rotation={[-pitch, 0, 0]} px={2.2} />
      <Ink geometry={ridge} material={toon("#4a3436")} position={[0, rise + 0.2, -depth / 4 * 0 - 0.0]} px={1.8} />
      <Ink geometry={gable} material={brick} position={[0, 0, -0.2]} px={2.2} />
      {chimney ? <Ink geometry={chim} material={brick} position={[w * 0.28, rise * 0.7 + 0.6, -depth * 0.25]} px={2.2} /> : null}
    </group>
  );
};

/* ------------------------------------------------------------ hazy horizon: lake, town, steeple, tree line, smoke */
export const Horizon: React.FC<{ t?: number; z?: number }> = ({ t = 0, z = -48 }) => {
  const tx = T();
  const items = useMemo(() => {
    const r = rng(21);
    const bs = Array.from({ length: 26 }, (_, i) => ({ x: -90 + i * 7 + r() * 3, w: 4 + r() * 4, h: 5 + r() * 9, d: 3 + r() * 2, c: ["#c4a8bc", "#cdb0b6", "#b8a4c2", "#d2b8b8"][i % 4], roof: r() < 0.65, chim: r() < 0.5, zz: z - r() * 10 }));
    const trees = Array.from({ length: 34 }, (_, i) => ({ x: -100 + i * 6 + r() * 4, s: 3 + r() * 2.6, zz: z + 6 - r() * 8, c: ["#8fb08e", "#9cbb96", "#86a888"][i % 3] }));
    return { bs, trees };
  }, [z]);
  const lakeM = useMemo(() => { const l = tx.lake.clone(); l.needsUpdate = true; l.repeat.set(8, 1); return new THREE.MeshBasicMaterial({ map: l, fog: true }); }, [tx]);
  const sm = useMemo(() => new THREE.MeshBasicMaterial({ map: tx.smoke, transparent: true, depthWrite: false }), [tx]);
  const roofM = useMemo(() => new THREE.MeshBasicMaterial({ color: "#a58aa0", fog: true }), []);
  const steep = useMemo(() => new THREE.ConeGeometry(1.6, 7, 4), []);
  return (
    <group>
      <mesh material={lakeM} position={[0, 0.02, z - 28]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[400, 70]} /></mesh>
      {items.bs.map((b, i) => (
        <group key={i} position={[b.x, 0, b.zz]}>
          <mesh position={[0, b.h / 2, 0]}><boxGeometry args={[b.w, b.h, b.d]} /><meshBasicMaterial color={b.c} fog /></mesh>
          {b.roof ? <mesh position={[0, b.h + 1.1, 0]} rotation={[0, Math.PI / 4, 0]} material={roofM}><coneGeometry args={[b.w * 0.78, 2.2, 4]} /></mesh> : null}
          {b.chim ? <mesh position={[b.w * 0.25, b.h + 1.3, 0]}><boxGeometry args={[0.7, 1.6, 0.7]} /><meshBasicMaterial color="#9a8498" fog /></mesh> : null}
          {b.chim ? <mesh material={sm} position={[b.w * 0.25 + Math.sin(t * 0.4 + i) * 0.5, b.h + 3.4 + ((t * 0.6 + i) % 2), 0.4]}><planeGeometry args={[3, 3]} /></mesh> : null}
        </group>
      ))}
      <mesh position={[18, 0, z - 14]} material={roofM}>
        <boxGeometry args={[3, 14, 3]} />
      </mesh>
      <mesh position={[18, 17.5, z - 14]} rotation={[0, Math.PI / 4, 0]} material={roofM} geometry={steep} />
      {items.trees.map((tr, i) => (
        <mesh key={i} position={[tr.x, tr.s * 0.62, tr.zz]}><icosahedronGeometry args={[tr.s, 1]} /><meshBasicMaterial color={tr.c} fog /></mesh>
      ))}
    </group>
  );
};

export const tex = T;
export const Glow: React.FC<{ p: [number, number, number]; s?: number }> = ({ p, s = 3 }) => {
  const tx = T();
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: tx.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [tx]);
  return <mesh material={m} position={p}><planeGeometry args={[s, s]} /></mesh>;
};

export { INK, INKD };

/** instanced stones / gravel scattered on the ground, for texture and scale */
export const Scatter: React.FC<{ count?: number; w?: number; d?: number; x?: number; z?: number; y?: number; seed?: number; size?: number; colors?: string[]; skip?: [number, number] }> = ({
  count = 700, w = 40, d = 40, x = 0, z = 0, y = 0, seed = 1, size = 0.1, colors = ["#a8957e", "#8a7866", "#b5a28a", "#6f5d52", "#c2b09a"], skip,
}) => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const mat = useMemo(() => toon("#ffffff"), []);
  React.useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const r = rng(seed); const o = new THREE.Object3D(); const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      let px = x + (r() - 0.5) * w, pz = z + (r() - 0.5) * d;
      if (skip && Math.abs(px) < skip[0] && Math.abs(pz - z) < skip[1]) { px += skip[0] * 2.2 * (px < 0 ? -1 : 1); }
      const s = size * (0.4 + r() * 1.3);
      o.position.set(px, y + s * 0.35, pz); o.rotation.set(r() * 3, r() * 3, r() * 3); o.scale.set(s * (0.9 + r() * 0.6), s * 0.6, s * (0.9 + r() * 0.6));
      o.updateMatrix(); m.setMatrixAt(i, o.matrix); c.set(colors[Math.floor(r() * colors.length)]); m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count, w, d, x, z, y, seed, size, colors, skip]);
  return <instancedMesh ref={ref} args={[geo, mat, count]} castShadow={false} receiveShadow />;
};
