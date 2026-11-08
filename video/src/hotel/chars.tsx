import * as THREE from "three";
import React, { useMemo } from "react";
import { INK, rng, clamp } from "./kit";

type P = [number, number];

/* ---------- 2D polygon helpers ---------- */
const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 44): P[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P;
  });

const rect = (x0: number, y0: number, x1: number, y1: number): P[] => [
  [x0, y0], [x1, y0], [x1, y1], [x0, y1],
];

const smooth = (pts: P[], n = 60): P[] => {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal");
  return c.getPoints(n).map((v) => [v.x, v.y] as P);
};

/** tapered limb from a to b, widths wa->wb */
const limb = (ax: number, ay: number, bx: number, by: number, wa: number, wb: number): P[] => {
  const dx = bx - ax, dy = by - ay;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  const pts: P[] = [];
  pts.push([ax + nx * wa, ay + ny * wa]);
  pts.push([bx + nx * wb, by + ny * wb]);
  for (let i = 1; i < 6; i++) {
    const a = Math.atan2(ny, nx) - (i / 6) * Math.PI;
    pts.push([bx + Math.cos(a) * wb, by + Math.sin(a) * wb]);
  }
  pts.push([bx - nx * wb, by - ny * wb]);
  pts.push([ax - nx * wa, ay - ny * wa]);
  for (let i = 1; i < 6; i++) {
    const a = Math.atan2(-ny, -nx) - (i / 6) * Math.PI;
    pts.push([ax + Math.cos(a) * wa, ay + Math.sin(a) * wa]);
  }
  return pts;
};

const centroid = (pts: P[]): P => {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  return [x / pts.length, y / pts.length];
};

/** push a polygon outward (hand-drawn: thickness varies slightly) */
const grow = (pts: P[], d: number, seed: number, wob = 0.35): P[] => {
  const r = rng(seed);
  const [cx, cy] = centroid(pts);
  const n = pts.length;
  const phase = r() * 6;
  return pts.map(([x, y], i) => {
    const prev = pts[(i + n - 1) % n], next = pts[(i + 1) % n];
    let tx = next[0] - prev[0], ty = next[1] - prev[1];
    const l = Math.hypot(tx, ty) || 1;
    let nx = ty / l, ny = -tx / l;
    if ((x - cx) * nx + (y - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const k = d * (1 + wob * Math.sin(i * 0.9 + phase));
    return [x + nx * k, y + ny * k] as P;
  });
};

const shapeOf = (pts: P[]) => {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return new THREE.ShapeGeometry(s);
};

const flatMat = (c: string) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });

/** A flat colour shape with a wobbly ink band, drawn at depth z. */
const Flat: React.FC<{ pts: P[]; color: string; z?: number; ink?: number; seed?: number; noInk?: boolean }> = ({
  pts, color, z = 0, ink = 0.022, seed = 1, noInk = false,
}) => {
  const { fill, band } = useMemo(
    () => ({
      fill: shapeOf(pts),
      band: noInk ? null : shapeOf(grow(pts, ink, seed)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts, ink, seed, noInk],
  );
  const fm = useMemo(() => flatMat(color), [color]);
  const bm = useMemo(() => flatMat(INK), []);
  return (
    <group>
      {band ? <mesh geometry={band} material={bm} position={[0, 0, z]} /> : null}
      <mesh geometry={fill} material={fm} position={[0, 0, z + 0.0015]} />
    </group>
  );
};

/** stroked polyline (mouth, brows) */
const stroke = (pts: P[], w: number): P[] => {
  const left: P[] = [], right: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return [...left, ...right.reverse()];
};

export type Palette = {
  skin: string; body: string; body2: string; pants: string; hair: string; hat?: "top" | "bowler" | "cap" | "none"; hatColor?: string;
  glasses?: boolean; tie?: string; shirt?: string;
};

export const PALETTES: Record<string, Palette> = {
  worker: { skin: "#fbf0e0", body: "#2f9f93", body2: "#1f7a72", pants: "#5a4244", hair: "#6b4130", hat: "cap", hatColor: "#2b5fa8", tie: "#d9453f", shirt: "#fff" },
  worker2: { skin: "#fbf0e0", body: "#e0592f", body2: "#b53f22", pants: "#3f3640", hair: "#2f2124", hat: "bowler", hatColor: "#3a3340", tie: "#f2c53d", shirt: "#fff" },
  worker3: { skin: "#fbf0e0", body: "#d9a82c", body2: "#b0831a", pants: "#4a3a3f", hair: "#b0562b", hat: "none", tie: "#2b5fa8", shirt: "#fff", glasses: true },
  boss: { skin: "#fbf0e0", body: "#7a3d8f", body2: "#5a2a6c", pants: "#2c2530", hair: "#3b2b2f", hat: "top", hatColor: "#2a2630", tie: "#f2c53d", shirt: "#fff" },
  guest: { skin: "#fbf0e0", body: "#cfe3f2", body2: "#a8c8e0", pants: "#cfe3f2", hair: "#7a4a2c", hat: "none", shirt: "#fff" },
};

/* ---------- full character ---------- */
export type PersonProps = {
  palette: Palette;
  t: number;
  position?: [number, number, number];
  yaw?: number;
  scale?: number;
  seed?: number;
  /** pushes a lever: arm angles oscillate with this phase speed */
  crank?: number;
  /** arms raised up in alarm / pointing */
  pose?: "idle" | "crank" | "watch";
  lookAt?: number;
  phase?: number;
};

export const Person: React.FC<PersonProps> = ({
  palette, t, position = [0, 0, 0], yaw = 0, scale = 1, seed = 1, pose = "idle", crank = 2.2, phase,
}) => {
  const r = useMemo(() => rng(seed), [seed]);
  const ph0 = useMemo(() => r() * 6, [r]);
  const ph = phase ?? ph0;

  // geometry (all in character space, feet at y=0, ~1.9 tall)
  const g = useMemo(() => {
    const head = ellipse(0, 1.52, 0.4, 0.375);
    const torso = smooth([
      [-0.1, 1.2], [0.1, 1.2], [0.2, 1.1], [0.27, 0.95], [0.3, 0.8], [0.23, 0.66],
      [0, 0.62], [-0.23, 0.66], [-0.3, 0.8], [-0.27, 0.95], [-0.2, 1.1],
    ], 50);
    const lower = torso.map(([x, y]) => [x, Math.min(y, 0.9)] as P);
    return { head, torso, lower };
  }, []);

  const blink = (() => {
    const per = 3.1 + (seed % 3) * 0.6;
    const x = ((t + ph) % per) / per;
    return x > 0.95 ? Math.sin(((x - 0.95) / 0.05) * Math.PI) : 0;
  })();

  const bob = Math.sin(t * 2.4 + ph) * 0.012;
  const breathe = 1 + Math.sin(t * 2.4 + ph) * 0.012;
  const nod = Math.sin(t * 1.3 + ph) * 0.035;

  const w = crank * t + ph;
  const swing = pose === "crank" ? Math.sin(w) : Math.sin(t * 1.6 + ph) * 0.25;
  const armL = pose === "crank" ? -0.62 + swing * 0.28 : pose === "watch" ? -0.2 : -0.12 + swing * 0.1;
  const armR = pose === "crank" ? 0.62 + swing * 0.28 : pose === "watch" ? 1.5 : 0.12 - swing * 0.1;
  const lean = pose === "crank" ? 0.08 + swing * 0.05 : 0;

  const hatC = palette.hatColor ?? "#2a2630";
  const limbCol = (c: string) => c;

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* legs */}
      <group position={[0, bob * 0.3, 0]}>
        <Flat pts={limb(-0.1, 0.66, -0.12, 0.06, 0.05, 0.04)} color={palette.pants} z={0.001} ink={0.02} seed={seed + 1} />
        <Flat pts={limb(0.1, 0.66, 0.12, 0.06, 0.05, 0.04)} color={palette.pants} z={0.001} ink={0.02} seed={seed + 2} />
        <Flat pts={ellipse(-0.16, 0.04, 0.12, 0.05)} color="#2a1c20" z={0.002} ink={0.016} seed={seed + 3} />
        <Flat pts={ellipse(0.17, 0.04, 0.12, 0.05)} color="#2a1c20" z={0.002} ink={0.016} seed={seed + 4} />
      </group>

      <group position={[0, bob, 0]} rotation={[0, 0, lean]}>
        {/* back arm */}
        <group position={[-0.24, 1.12, 0.004]} rotation={[0, 0, armL]}>
          <Flat pts={limb(0, 0, 0, -0.52, 0.045, 0.035)} color={palette.body2} z={0} ink={0.02} seed={seed + 5} />
          <Flat pts={ellipse(0, -0.56, 0.06, 0.06, 20)} color="#2a1c20" z={0.003} ink={0.012} seed={seed + 6} />
        </group>

        {/* torso */}
        <group scale={[1, breathe, 1]} position={[0, 0, 0.01]}>
          <Flat pts={g.torso} color={palette.body} z={0} ink={0.026} seed={seed + 7} />
          <Flat pts={g.lower} color={palette.body2} z={0.004} ink={0.0} seed={seed + 8} noInk />
          {/* pocket patch */}
          <Flat pts={rect(0.07, 0.8, 0.2, 0.9)} color={palette.body} z={0.007} ink={0.012} seed={seed + 9} />
          {/* collar + tie */}
          <Flat pts={[[-0.13, 1.2], [0, 1.2], [-0.04, 1.06]]} color={palette.shirt ?? "#fff"} z={0.008} ink={0.012} seed={seed + 10} />
          <Flat pts={[[0.13, 1.2], [0, 1.2], [0.04, 1.06]]} color={palette.shirt ?? "#fff"} z={0.008} ink={0.012} seed={seed + 11} />
          {palette.tie ? (
            <Flat pts={[[-0.03, 1.12], [0.03, 1.12], [0.04, 0.95], [0, 0.9], [-0.04, 0.95]]} color={palette.tie} z={0.01} ink={0.01} seed={seed + 12} />
          ) : null}
        </group>

        {/* head */}
        <group position={[0, 1.52, 0.03]} rotation={[0, 0, nod]}>
          <group position={[0, -1.52, 0]}>
            <Flat pts={g.head} color={palette.skin} z={0} ink={0.03} seed={seed + 13} />
            {/* hair fringe */}
            <Flat
              pts={[
                ...Array.from({ length: 14 }, (_, i) => {
                  const a = Math.PI * (0.92 - (i / 13) * 0.84);
                  return [Math.cos(a) * 0.405, 1.52 + Math.sin(a) * 0.38] as P;
                }),
                ...Array.from({ length: 9 }, (_, i) => {
                  const x = 0.33 - (i / 8) * 0.66;
                  return [x, 1.76 - (i % 2 ? 0.1 : 0.03)] as P;
                }),
              ]}
              color={palette.hair} z={0.012} ink={0.016} seed={seed + 14}
            />
            {/* eyes: half-lidded, calm */}
            {[-0.145, 0.145].map((ex, i) => (
              <group key={i} position={[ex, 1.5, 0.02]}>
                <Flat pts={ellipse(0, 0, 0.065, 0.075, 20)} color="#ffffff" z={0} ink={0.012} seed={seed + 20 + i} />
                <Flat pts={ellipse(0.01, -0.005, 0.034, 0.045, 16)} color={INK} z={0.004} ink={0} seed={seed + 22 + i} noInk />
                {/* upper lid (skin) covers the top - closes with blink */}
                <Flat
                  pts={rect(-0.085, 0.075 - (0.075 + 0.04) * (0.52 + blink * 0.5) + 0.0, 0.085, 0.09)}
                  color={palette.skin} z={0.008} ink={0.009} seed={seed + 24 + i}
                />
                <Flat pts={stroke([[-0.08, 0.14], [0, 0.17], [0.08, 0.13]], 0.011)} color={INK} z={0.012} ink={0} seed={1} noInk />
              </group>
            ))}
            {/* tiny smile */}
            <Flat pts={stroke(Array.from({ length: 9 }, (_, i) => [-0.06 + (i / 8) * 0.12, 1.33 - Math.sin((i / 8) * Math.PI) * 0.03] as P), 0.008)} color={INK} z={0.012} ink={0} seed={1} noInk />
            {/* cheeks */}
            <Flat pts={ellipse(-0.25, 1.4, 0.05, 0.03, 14)} color="#f2b9a6" z={0.003} ink={0} seed={1} noInk />
            <Flat pts={ellipse(0.25, 1.4, 0.05, 0.03, 14)} color="#f2b9a6" z={0.003} ink={0} seed={1} noInk />
            {/* glasses */}
            {palette.glasses ? (
              <>
                {[-0.145, 0.145].map((ex, i) => (
                  <Flat key={i} pts={stroke(ellipse(ex, 1.5, 0.1, 0.095, 24).concat([ellipse(ex, 1.5, 0.1, 0.095, 24)[0]]), 0.008)} color={INK} z={0.016} ink={0} seed={1} noInk />
                ))}
                <Flat pts={stroke([[-0.045, 1.51], [0.045, 1.51]], 0.008)} color={INK} z={0.016} ink={0} seed={1} noInk />
              </>
            ) : null}
            {/* hats */}
            {palette.hat === "top" ? (
              <group position={[0, 0, 0.02]}>
                <Flat pts={ellipse(0, 1.83, 0.4, 0.07, 30)} color={hatC} z={0.02} ink={0.02} seed={seed + 30} />
                <Flat pts={rect(-0.25, 1.83, 0.25, 2.2)} color={hatC} z={0.022} ink={0.022} seed={seed + 31} />
                <Flat pts={rect(-0.25, 1.87, 0.25, 1.96)} color="#d9453f" z={0.025} ink={0.008} seed={seed + 32} />
              </group>
            ) : null}
            {palette.hat === "bowler" ? (
              <group position={[0, 0, 0.02]}>
                <Flat pts={ellipse(0, 1.82, 0.42, 0.06, 30)} color={hatC} z={0.02} ink={0.02} seed={seed + 30} />
                <Flat pts={ellipse(0, 1.84, 0.27, 0.22, 30).filter((p) => p[1] >= 1.84)} color={hatC} z={0.022} ink={0.022} seed={seed + 31} />
              </group>
            ) : null}
            {palette.hat === "cap" ? (
              <group position={[0, 0, 0.02]}>
                <Flat pts={ellipse(0, 1.78, 0.4, 0.2, 30).filter((p) => p[1] >= 1.78)} color={hatC} z={0.02} ink={0.022} seed={seed + 30} />
                <Flat pts={[[0.1, 1.8], [0.5, 1.78], [0.46, 1.72], [0.12, 1.74]]} color={hatC} z={0.024} ink={0.016} seed={seed + 31} />
                <Flat pts={stroke(Array.from({ length: 8 }, (_, i) => [-0.34 + (i / 7) * 0.68, 1.8 + Math.sin((i / 7) * Math.PI) * 0.16] as P), 0.012)} color="#ffffff" z={0.028} ink={0} seed={1} noInk />
              </group>
            ) : null}
          </group>
        </group>

        {/* front arm */}
        <group position={[0.24, 1.12, 0.05]} rotation={[0, 0, armR]}>
          <Flat pts={limb(0, 0, 0, -0.52, 0.045, 0.035)} color={limbCol(palette.body)} z={0} ink={0.02} seed={seed + 40} />
          <Flat pts={ellipse(0, -0.56, 0.06, 0.06, 20)} color="#2a1c20" z={0.003} ink={0.012} seed={seed + 41} />
        </group>
      </group>
    </group>
  );
};

/** Sleeping guest leaning on a window sill (head + shoulders + hands). */
export const SleepingGuest: React.FC<{ t: number; position: [number, number, number]; scale?: number; seed?: number }> = ({
  t, position, scale = 1, seed = 9,
}) => {
  const breathe = Math.sin(t * 1.7 + seed) * 0.012;
  const tilt = 0.14 + Math.sin(t * 0.9 + seed) * 0.02;
  const head = useMemo(() => ellipse(0, 0, 0.4, 0.375), []);
  const body = useMemo(() => smooth([[-0.55, -0.7], [-0.4, -0.38], [-0.18, -0.36], [0.18, -0.36], [0.4, -0.38], [0.55, -0.7], [0, -0.82]], 40), []);
  const cap = useMemo<P[]>(
    () => [[-0.4, 0.1], [-0.34, 0.3], [-0.1, 0.52], [0.2, 0.6], [0.5, 0.5], [0.62, 0.34], [0.4, 0.3], [0.38, 0.1], [0, 0.18]],
    [],
  );
  return (
    <group position={position} scale={scale}>
      <Flat pts={body} color="#dfe9f5" z={0} ink={0.03} seed={seed} />
      <group position={[0, breathe, 0.03]} rotation={[0, 0, tilt]}>
        <Flat pts={head} color="#fbf0e0" z={0} ink={0.03} seed={seed + 1} />
        <Flat pts={cap} color="#f2f6fb" z={0.01} ink={0.024} seed={seed + 2} />
        <Flat pts={ellipse(0.62, 0.34, 0.09, 0.09, 16)} color="#d9453f" z={0.014} ink={0.016} seed={seed + 3} />
        {/* closed eyes */}
        {[-0.14, 0.14].map((x, i) => (
          <Flat key={i} pts={stroke(Array.from({ length: 8 }, (_, k) => [x - 0.07 + (k / 7) * 0.14, 0.02 - Math.sin((k / 7) * Math.PI) * 0.035] as P), 0.011)} color={INK} z={0.02} ink={0} seed={1} noInk />
        ))}
        <Flat pts={ellipse(0, -0.17, 0.045, 0.03 + Math.sin(t * 1.7 + seed) * 0.008, 14)} color="#8a3f3a" z={0.02} ink={0.01} seed={seed + 5} />
        <Flat pts={ellipse(-0.25, -0.06, 0.055, 0.03, 14)} color="#f2b9a6" z={0.012} ink={0} seed={1} noInk />
        <Flat pts={ellipse(0.25, -0.06, 0.055, 0.03, 14)} color="#f2b9a6" z={0.012} ink={0} seed={1} noInk />
      </group>
    </group>
  );
};

/** soft contact shadow blob */
export const ContactShadow: React.FC<{ position: [number, number, number]; r?: number }> = ({ position, r = 0.5 }) => {
  const geo = useMemo(() => new THREE.CircleGeometry(1, 28), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.32, depthWrite: false }), []);
  return <mesh geometry={geo} material={mat} position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[r, r * 0.55, 1]} renderOrder={1} />;
};

export const yawToward = (from: [number, number, number], cam: [number, number, number]) =>
  clamp(Math.atan2(cam[0] - from[0], cam[2] - from[2]), -0.7, 0.7);
