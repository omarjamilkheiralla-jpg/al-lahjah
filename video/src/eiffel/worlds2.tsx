import * as THREE from "three";
import React from "react";
import { Bx, Cy, Sp, Pl, Glow, Sky, Char, Tower, M, BM, BG, PG, tx, rnd, memo, type V3 } from "./kit";
import { wt, ss, se, pop, sm, clamp } from "./timeline";

/** ============================ SALON: the grand hotel room with the six dealers ============================ */
const SalonStatic = React.memo(() => {
  const chairs: React.ReactNode[] = [];
  const spots: [number, number, number][] = [[-3.2, -2.6, 0], [0, -2.6, 0], [3.2, -2.6, 0], [-3.2, 2.6, Math.PI], [0, 2.6, Math.PI], [3.2, 2.6, Math.PI]];
  spots.forEach(([x, z, ry], i) => chairs.push(
    <group key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Bx g={[0.9, 0.12, 0.9]} p={[0, 0.62, 0]} m={M("#7a2a34", null, 0.7)} />
      <Bx g={[0.95, 1.2, 0.12]} p={[0, 1.2, -0.46]} m={M("#9a5a2e", null, 0.6)} /><Bx g={[0.7, 0.9, 0.06]} p={[0, 1.25, -0.4]} m={M("#7a2a34", null, 0.7)} />
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([a, b], k) => <Bx key={k} g={[0.09, 0.62, 0.09]} p={[a, 0.31, b]} m={M("#8a4a24", null, 0.6)} />)}
    </group>));
  return (
    <group>
      <Bx g={[22, 0.2, 18]} p={[0, -0.1, 0]} m={M("#ffffff", tx("parquet", 5, 4), 0.35)} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}><planeGeometry args={[11, 7]} /><meshStandardMaterial map={tx("rug")} roughness={0.95} /></mesh>
      <Bx g={[22, 8, 0.3]} p={[0, 4, -8.5]} m={M("#ffffff", tx("damask", 6, 2.4), 0.8)} />
      <Bx g={[0.3, 8, 18]} p={[-11, 4, 0]} m={M("#ffffff", tx("damask", 5, 2.4), 0.8)} />
      <Bx g={[0.3, 8, 18]} p={[11, 4, 0]} m={M("#ffffff", tx("damask", 5, 2.4), 0.8)} />
      <Bx g={[22, 8, 0.3]} p={[0, 4, 8.8]} m={M("#ffffff", tx("damask", 6, 2.4), 0.8)} />
      <Bx g={[22, 0.2, 18]} p={[0, 8.1, 0]} m={M("#e8dcc0", null, 0.9)} />
      <Bx g={[22, 1.9, 0.2]} p={[0, 0.95, -8.28]} m={M("#ffffff", tx("panel", 11, 2), 0.5)} />
      <Bx g={[0.2, 1.9, 18]} p={[-10.8, 0.95, 0]} m={M("#ffffff", tx("panel", 9, 2), 0.5)} /><Bx g={[0.2, 1.9, 18]} p={[10.8, 0.95, 0]} m={M("#ffffff", tx("panel", 9, 2), 0.5)} />
      <Bx g={[22, 0.4, 0.5]} p={[0, 7.8, -8.2]} m={M("#c9a24a", null, 0.4, undefined, 1, { metalness: 0.4 })} /><Bx g={[22, 0.2, 0.3]} p={[0, 1.95, -8.2]} m={M("#c9a24a", null, 0.4)} />
      {/* tall windows with night Paris and the tower, drapes */}
      {[-6, 6].map((x) => <group key={x} position={[x, 0, -8.3]}>
        <mesh position={[0, 4.2, 0.05]}><planeGeometry args={[3.2, 5.2]} /><meshBasicMaterial map={tx("skyNight")} /></mesh>
        <Bx g={[3.5, 0.2, 0.3]} p={[0, 1.7, 0.1]} m={M("#c9a24a", null, 0.4)} /><Bx g={[0.1, 5.4, 0.2]} p={[0, 4.2, 0.12]} m={M("#c9a24a", null, 0.4)} /><Bx g={[3.3, 0.1, 0.2]} p={[0, 4.3, 0.12]} m={M("#c9a24a", null, 0.4)} />
        <Bx g={[0.95, 6.6, 0.4]} p={[-1.85, 4.3, 0.4]} m={M("#a8283a", null, 0.9)} /><Bx g={[0.95, 6.6, 0.4]} p={[1.85, 4.3, 0.4]} m={M("#a8283a", null, 0.9)} /><Bx g={[4.9, 0.6, 0.5]} p={[0, 7.4, 0.4]} m={M("#c9a24a", null, 0.5)} />
        <mesh position={[0, 4.0, 2.0]} rotation={[-0.5, 0, 0]}><planeGeometry args={[2.6, 6]} /><meshBasicMaterial map={tx("shaft")} color="#8aa0ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
        <pointLight color="#7a98e8" intensity={26} distance={16} decay={1.6} position={[0, 4, 1]} />
      </group>)}
      {/* fireplace + painting */}
      <group position={[0, 0, -8.0]}>
        <Bx g={[3.4, 2.4, 0.7]} p={[0, 1.2, 0]} m={M("#d8cdb4", null, 0.6)} /><Bx g={[2.0, 1.6, 0.2]} p={[0, 0.9, 0.35]} m={M("#1a1210", null, 0.9)} /><Bx g={[3.8, 0.2, 1.0]} p={[0, 2.5, 0.1]} m={M("#b8a888", null, 0.5)} />
        <Glow p={[0, 0.7, 0.6]} s={3.4} c="#ff9040" o={0.9} /><pointLight color="#ff8a40" intensity={14} distance={9} decay={1.6} position={[0, 0.8, 1.2]} />
        <Bx g={[2.4, 3.0, 0.14]} p={[0, 4.4, 0.18]} m={M("#c9a24a", null, 0.4)} /><mesh position={[0, 4.4, 0.27]}><planeGeometry args={[2.0, 2.6]} /><meshBasicMaterial map={tx("skyDusk")} /></mesh>
      </group>
      {/* long table with cloth and table things */}
      <Bx g={[10.4, 0.16, 2.6]} p={[0, 0.98, 0]} m={M("#f2ecde", null, 0.9)} />
      <Bx g={[10.2, 0.8, 2.4]} p={[0, 0.58, 0]} m={M("#f2ecde", null, 0.9)} />
      <Bx g={[10.45, 0.08, 2.65]} p={[0, 1.04, 0]} m={M("#2a5a3c", null, 0.9)} />
      {[-3.5, -1.2, 1.4, 3.6].map((x, i) => <group key={i} position={[x, 1.07, (i % 2 ? 0.4 : -0.3)]}><Cy r={0.06} h={0.3} p={[0, 0.15, 0]} m={M("#dfe8f0", null, 0.1, undefined, 1, { transparent: true, opacity: 0.6 })} s={10} cast={false} /><Cy r={0.14} rb={0.04} h={0.2} p={[0, 0.4, 0]} m={M("#e8f0f8", null, 0.1, undefined, 1, { transparent: true, opacity: 0.55 })} s={12} cast={false} /></group>)}
      {chairs}
      {/* the suitcase on the table */}
      <group position={[-1.2, 1.12, 0.5]}><Bx g={[1.3, 0.3, 0.9]} p={[0, 0.15, 0]} m={M("#6a3a1e", null, 0.7)} /><Bx g={[1.2, 0.02, 0.8]} p={[0, 0.3, 0]} m={M("#1a0e08", null, 0.9)} /><Bx g={[1.3, 0.8, 0.08]} p={[0, 0.7, -0.5]} m={M("#6a3a1e", null, 0.7)} r={[-0.15, 0, 0]} /><Bx g={[0.2, 0.06, 0.06]} p={[0, 0.3, 0.46]} m={M("#c9a24a", null, 0.3)} /></group>
      {/* chandelier */}
      <group position={[0, 6.6, 0]}>
        <Cy r={0.02} h={2.8} p={[0, 1.4, 0]} m={M("#b8923a", null, 0.4)} s={6} cast={false} />
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.2, 0.07, 8, 36]} /><meshStandardMaterial color="#d6b050" roughness={0.3} metalness={0.7} /></mesh>
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.05, 8, 30]} /><meshStandardMaterial color="#d6b050" roughness={0.3} metalness={0.7} /></mesh>
        {Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return <group key={i}><Cy r={0.05} h={0.2} p={[Math.cos(a) * 1.2, 0.12, Math.sin(a) * 1.2]} m={M("#f4efe6", null, 0.6)} s={8} cast={false} /><Sp r={0.06} p={[Math.cos(a) * 1.2, 0.3, Math.sin(a) * 1.2]} m={BM("#ffe8a8")} sc={[0.7, 1.4, 0.7]} /></group>; })}
        <Glow p={[0, 0.1, 0]} s={8} c="#ffd08a" o={0.7} />
        <pointLight color="#ffd08a" intensity={120} distance={26} decay={1.3} position={[0, -0.3, 0]} />
        <pointLight color="#ffc890" intensity={50} distance={20} decay={1.4} position={[-3, 3.5, 5]} /><pointLight color="#ffc890" intensity={50} distance={20} decay={1.4} position={[5, 3.5, 5]} />
      </group>
      {/* potted palms, side tables */}
      {[-9, 9].map((x) => <group key={x} position={[x, 0, 5.5]}><Cy r={0.5} rb={0.4} h={0.9} p={[0, 0.45, 0]} m={M("#b0602a", null, 0.7)} s={14} />{[0, 1, 2, 3, 4, 5].map((k) => <mesh key={k} position={[Math.cos(k) * 0.5, 2.0, Math.sin(k) * 0.5]} rotation={[0.9 * Math.sin(k), k, 0.9 * Math.cos(k)]}><planeGeometry args={[0.5, 2.2]} /><meshStandardMaterial color="#3a6a32" roughness={0.8} side={THREE.DoubleSide} /></mesh>)}</group>)}
      <hemisphereLight args={["#b098b8", "#6a4a34", 1.3]} />
    </group>
  );
});
export const Salon: React.FC<{ t: number; cam: V3; phase?: number }> = ({ t, cam, phase = 0 }) => {
  const talk = (a: number, b: number) => t > a && t < b;
  const dealers: [string, number, number, any][] = phase === 0
    ? [["dealer", -3.2, -2.35, "think"], ["poisson", 0, -2.35, t > wt(6, 3) ? "grin" : "smile"], ["dealer2", 3.2, -2.35, "think"], ["dealer", -3.2, 2.35, "think"], ["dealer2", 0, 2.35, "worried"], ["dealer", 3.2, 2.35, "think"]]
    : [["dealer2", -3.2, -2.35, "smile"], ["dealer", 0, -2.35, "think"], ["dealer2", 3.2, -2.35, "worried"], ["dealer", -3.2, 2.35, "smile"], ["dealer2", 0, 2.35, "think"], ["dealer2", 3.2, 2.35, "smile"]];
  void talk;
  const sold = t > wt(13, 0);
  const vx = -4.6;
  return (
    <group>
      <fog attach="fog" args={["#1c1014", 14, 32]} /><color attach="background" args={["#1c1014"]} />
      <SalonStatic />
      {dealers.map(([look, x, z, ex], i) => <Char key={i} look={look} expr={ex} t={t} p={[x, 0, z]} cam={cam} scale={1.0} sit={0.25} pose="idle" tint="#ffdcb8" seed={i + 2} emph={i === 1 && t > wt(7, 0) && t < se(7) ? 1 : 0} />)}
      <Char look="victor" expr={t > wt(5, 13) ? "smug" : "deadpan"} t={t} p={[vx, 0, 0.2]} cam={cam} scale={1.15} pose={t > wt(5, 13) && t < wt(5, 17) ? "point" : "idle"} tint="#ffdcb8" seed={5}>
        {t > wt(5, 13) && t < se(5) + 0.4 ? <mesh position={[0.07, 1.46 * 1.15, 0.17]}><planeGeometry args={[0.07, 0.24]} /><meshBasicMaterial color="#fdfdfa" /></mesh> : null}
      </Char>
      {/* cash on the table once Poisson pays (S7) */}
      {phase === 0 ? <Cash t={t} /> : null}
      {sold ? null : null}
      {Array.from({ length: 28 }, (_, i) => <mesh key={i} position={[-5 + ((i * 41) % 100) / 10 + Math.sin(t * 0.3 + i) * 0.4, 1.4 + ((i * 61 + t * 6) % 55) / 10, -3 + ((i * 17) % 60) / 10]}><planeGeometry args={[0.035, 0.035]} /><meshBasicMaterial map={tx("glow")} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.5} /></mesh>)}
      {/* cigar smoke curl */}
      {[0, 1, 2, 3, 4, 5].map((i) => { const u = ((t * 0.35 + i / 6) % 1); return <mesh key={i} position={[2.6 + Math.sin(u * 7 + i) * 0.15, 1.5 + u * 1.4, -0.4]}><planeGeometry args={[0.2 + u * 0.4, 0.2 + u * 0.4]} /><meshBasicMaterial map={tx("glow")} color="#cfc8c0" transparent depthWrite={false} opacity={0.2 * (1 - u)} /></mesh>; })}
    </group>
  );
};
const Cash: React.FC<{ t: number }> = ({ t }) => {
  const t0 = wt(7, 0) + 0.4, u = sm((t - t0) / 2.0); const x = 0; const z = -0.2; const sc = u > 0.92 ? Math.max(0.001, 1 - (u - 0.92) / 0.08) : 1;
  const roll = (c: string, w: number, ox: number, oy: number) => <group position={[ox, 1.17 + oy, 0]}><Bx g={[w, 0.18, 0.6]} p={[0, 0, 0]} m={M(c, null, 0.8)} /><Bx g={[w + 0.02, 0.2, 0.12]} p={[0, 0, 0]} m={M("#d8c8a0", null, 0.9)} /></group>;
  return (
    <group position={[x, 0, z + 0.2]} scale={[sc, sc, sc]}>
      <group position={[2.8 - u * 4.0, 0, 0.5]}>{roll("#6a9a5a", 0.9, 0, 0)}{roll("#6a9a5a", 0.9, 0.0, 0.2)}</group>
      <group position={[3.4 - u * 4.6, 0, 0.7]}>{roll("#8aaa6a", 0.5, 0, 0)}</group>
    </group>
  );
};

/** ============================ STATION: steam train leaving Paris ============================ */
const StationStatic = React.memo(() => (
  <group>
    <Sky night p={[0, 0, 0]} r={260} />
    <Bx g={[120, 0.3, 7]} p={[0, -0.15, 3.5]} m={M("#ffffff", tx("platform", 20, 1.2), 0.9)} />
    <Bx g={[120, 0.35, 0.5]} p={[0, 0.02, -0.1]} m={M("#e8c84a", null, 0.6)} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -6]}><planeGeometry args={[120, 12]} /><meshStandardMaterial map={tx("rail", 40, 3)} roughness={0.95} /></mesh>
    <Bx g={[120, 0.1, 0.25]} p={[0, 0.06, -4.4]} m={M("#8c8c96", null, 0.3, undefined, 1, { metalness: 0.7 })} /><Bx g={[120, 0.1, 0.25]} p={[0, 0.06, -5.6]} m={M("#8c8c96", null, 0.3)} />
    {/* iron + glass roof ribs */}
    {Array.from({ length: 14 }, (_, i) => <group key={i} position={[-48 + i * 7.4, 0, 0]}>
      {[-1, 1].map((s) => <Cy key={s} r={0.22} h={9} p={[0, 4.5, s * 6 + 1]} m={M("#2a3a2e", null, 0.5, undefined, 1, { metalness: 0.5 })} s={8} />)}
      {Array.from({ length: 9 }, (_, k) => { const a0 = (k / 9) * Math.PI, a1 = ((k + 1) / 9) * Math.PI; const x0 = Math.cos(a0) * 7, y0 = 9 + Math.sin(a0) * 4.5, x1 = Math.cos(a1) * 7, y1 = 9 + Math.sin(a1) * 4.5; const len = Math.hypot(x1 - x0, y1 - y0); return <Bx key={k} g={[len + 0.1, 0.3, 0.3]} p={[0, (y0 + y1) / 2, (x0 + x1) / 2 + 1]} m={M("#2a3a2e", null, 0.5)} r={[Math.atan2(y1 - y0, x1 - x0) * 0 + 0, Math.PI / 2, Math.atan2(y1 - y0, x1 - x0)]} cast={false} />; })}
    </group>)}
    <mesh position={[0, 12.5, 0.5]} rotation={[0, 0, 0]}><planeGeometry args={[130, 0.01]} /><meshBasicMaterial color="#000" /></mesh>
    {/* hanging sign, clock and lanterns */}
    <mesh position={[-4, 6.3, 6.6]}><planeGeometry args={[7, 1.3]} /><meshStandardMaterial map={tx("stationSign")} roughness={0.7} emissive="#fff6d8" emissiveMap={tx("stationSign")} emissiveIntensity={0.25} /></mesh>
    <mesh position={[8, 5, 6.6]}><circleGeometry args={[1.0, 32]} /><meshStandardMaterial map={tx("clock")} roughness={0.5} emissive="#ffffff" emissiveMap={tx("clock")} emissiveIntensity={0.3} /></mesh>
    {Array.from({ length: 14 }, (_, i) => <group key={i} position={[-45 + i * 7.4, 0, 6.2]}><Cy r={0.07} h={4.2} p={[0, 2.1, 0]} m={M("#1c1d22", null, 0.5)} s={8} /><Bx g={[0.4, 0.5, 0.4]} p={[0, 4.4, 0]} m={M("#ffe8b0", null, 0.3, "#ffbe5a", 1.8)} cast={false} /><Glow p={[0, 4.4, 0]} s={4.5} c="#ffc070" o={0.7} /></group>)}
    {/* back wall and arches */}
    <Bx g={[120, 11, 0.4]} p={[0, 5.5, 7.4]} m={M("#ffffff", tx("wall", 24, 3), 0.9)} />
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[-44 + i * 8, 3.2, 7.15]}><planeGeometry args={[2.4, 4.4]} /><meshStandardMaterial color="#2a3550" roughness={0.6} emissive="#ffb868" emissiveIntensity={i % 3 === 0 ? 0.7 : 0.1} /></mesh>)}
    {/* benches, trunks, crates */}
    {[-14, 2, 18].map((x, i) => <group key={i} position={[x, 0, 5.2]}><Bx g={[2.4, 0.12, 0.7]} p={[0, 0.55, 0]} m={M("#6a4a2a", null, 0.7)} /><Bx g={[2.4, 0.7, 0.1]} p={[0, 0.95, -0.3]} m={M("#6a4a2a", null, 0.7)} /><Bx g={[0.1, 0.55, 0.6]} p={[-1.1, 0.27, 0]} m={M("#1c1d22", null, 0.5)} /><Bx g={[0.1, 0.55, 0.6]} p={[1.1, 0.27, 0]} m={M("#1c1d22", null, 0.5)} /></group>)}
    {[[-6, 3.6], [-5.2, 3.6], [9, 4.5], [24, 3.9], [-26, 4]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Bx g={[1.0, 0.7, 0.6]} p={[0, 0.35, 0]} m={M(["#5a3a22", "#7a4a2a", "#3a4a3a"][i % 3], null, 0.8)} /><Bx g={[1.04, 0.08, 0.64]} p={[0, 0.5, 0]} m={M("#c9a24a", null, 0.4)} /></group>)}
    <hemisphereLight args={["#8a98d0", "#3a2c28", 0.7]} />
    <pointLight color="#ffd9a0" intensity={50} distance={26} decay={1.4} position={[-10, 8, 3]} />
    <pointLight color="#ffd9a0" intensity={50} distance={26} decay={1.4} position={[8, 8, 3]} />
    <pointLight color="#8aa4ff" intensity={24} distance={30} decay={1.5} position={[0, 12, -8]} />
  </group>
));
export const Train: React.FC<{ x: number; t: number }> = ({ x, t }) => (
  <group position={[x, 0, -5]}>
    {/* locomotive: boiler, funnel, cab, wheels, cow-catcher */}
    <group position={[6.5, 0, 0]}>
      <Cy r={1.05} h={5.2} p={[0.4, 2.0, 0]} m={M("#1f4a36", null, 0.35, undefined, 1, { metalness: 0.3 })} rot={[0, 0, Math.PI / 2]} s={22} />
      <Cy r={1.08} h={0.3} p={[3.0, 2.0, 0]} m={M("#d6b050", null, 0.35)} rot={[0, 0, Math.PI / 2]} s={22} />
      <Cy r={0.32} rb={0.55} h={1.5} p={[2.4, 3.55, 0]} m={M("#1c1d22", null, 0.5)} s={14} />
      <Cy r={0.22} h={0.7} p={[0.6, 3.25, 0]} m={M("#c9a24a", null, 0.3)} s={12} />
      <Bx g={[2.0, 2.4, 2.1]} p={[-2.6, 2.2, 0]} m={M("#7a2a22", null, 0.6)} /><Bx g={[2.3, 0.2, 2.4]} p={[-2.6, 3.5, 0]} m={M("#1c1d22", null, 0.6)} />
      <Bx g={[0.1, 1.0, 1.0]} p={[-1.55, 2.6, 0]} m={M("#ffe0a0", null, 0.4, "#ffbe5a", 1)} />
      {[-1.6, 0.6, 2.2].map((wx, i) => <group key={i}><Cy r={i === 0 ? 0.9 : 0.62} h={0.18} p={[wx, i === 0 ? 0.9 : 0.62, 1.05]} m={M("#7a2a22", null, 0.5, undefined, 1, { metalness: 0.4 })} rot={[Math.PI / 2, 0, t * (-6)]} s={22} /><Cy r={i === 0 ? 0.9 : 0.62} h={0.18} p={[wx, i === 0 ? 0.9 : 0.62, -1.05]} m={M("#7a2a22", null, 0.5)} rot={[Math.PI / 2, 0, t * (-6)]} s={22} /></group>)}
      <Bx g={[5.6, 0.14, 0.16]} p={[0.6, 0.95, 1.2]} m={M("#c8c8d0", null, 0.3)} />
      <Bx g={[1.0, 0.8, 1.6]} p={[3.9, 0.6, 0]} m={M("#1c1d22", null, 0.6)} r={[0, 0, -0.5]} />
      <Sp r={0.28} p={[3.3, 2.1, 0]} m={BM("#fff2c0")} /><Glow p={[3.5, 2.1, 0]} s={4} c="#fff0b0" o={0.8} />
    </group>
    {[0, 1].map((i) => <group key={i} position={[-3 - i * 11.4, 0, 0]}>
      <mesh position={[0, 2.0, 1.51]}><planeGeometry args={[10.8, 2.6]} /><meshStandardMaterial map={tx("carriage")} roughness={0.5} emissive="#ffc060" emissiveMap={tx("carriage")} emissiveIntensity={0.25} /></mesh>
      <Bx g={[10.8, 3.2, 3.0]} p={[0, 2.2, 0]} m={M("#7a2a22", null, 0.55)} /><Bx g={[11.2, 0.3, 3.4]} p={[0, 3.9, 0]} m={M("#2a2a30", null, 0.6)} />
      <mesh position={[0, 2.0, 1.52]}><planeGeometry args={[10.6, 2.8]} /><meshStandardMaterial map={tx("carriage")} roughness={0.5} emissive="#ffc060" emissiveMap={tx("carriage")} emissiveIntensity={0.3} /></mesh>
      {[-4, -1.4, 1.4, 4].map((wx, k) => <group key={k}><Cy r={0.5} h={0.14} p={[wx, 0.5, 1.2]} m={M("#2a2a30", null, 0.4)} rot={[Math.PI / 2, 0, t * -6]} s={18} /><Cy r={0.5} h={0.14} p={[wx, 0.5, -1.2]} m={M("#2a2a30", null, 0.4)} rot={[Math.PI / 2, 0, 0]} s={18} /></group>)}
    </group>)}
  </group>
);
export const Steam: React.FC<{ x: number; t: number }> = ({ x, t }) => (
  <group>{Array.from({ length: 22 }, (_, i) => { const u = ((t * 0.55 + i / 22) % 1); return <mesh key={i} position={[x + 8.9 - u * (4 + (x > 0 ? 0 : 0)) + Math.sin(u * 8 + i) * 0.4, -1.5 + 5.8 + u * 7, -5 + Math.cos(i) * 0.3]}><planeGeometry args={[1.4 + u * 4, 1.4 + u * 4]} /><meshBasicMaterial map={tx("glow")} color="#ece6e0" transparent depthWrite={false} opacity={0.5 * (1 - u)} /></mesh>; })}</group>
);
export const stationState = (t: number) => {
  const t0 = ss(8); const leap = t0 + 2.1; const runStart = t0 + 0.1;
  const ts = (tt: number) => { const u = Math.max(0, tt - (t0 + 0.2)); return u < 3 ? 0.5 * 2.2 * u * u : 0.5 * 2.2 * 9 + 6.6 * (u - 3); };
  const trainX = ts(t) - 4; const door = (tt: number) => ts(tt) - 4 - 3 - 11.4 + 5.0;
  const runX = (tt: number) => -26 + (tt - runStart) * 6.2 + (tt - runStart) ** 2 * 1.4;
  let vx: number, vy = 0, vz = 2.2, pose: any = "walk", onboard = false;
  if (t < leap) vx = runX(t);
  else { const u = clamp((t - leap) / 0.9); vx = (1 - u) * runX(leap) + u * door(t); vy = Math.sin(u * Math.PI) * 1.2; vz = 2.2 * (1 - u) - 4.4 * u; pose = u > 0.15 ? "cheer" : "walk"; }
  if (t > leap + 0.9) { vx = door(t); vy = 0; vz = -4.3; pose = "salute"; onboard = true; }
  return { trainX, vx, vy, vz, pose, onboard };
};
export const Station: React.FC<{ t: number; cam: V3 }> = ({ t, cam }) => {
  const { trainX, vx, vy, vz, pose, onboard } = stationState(t);
  return (
    <group>
      <fog attach="fog" args={["#1a1a2c", 20, 70]} /><color attach="background" args={["#10101e"]} />
      <StationStatic />
      <Train x={trainX} t={t} /><Steam x={trainX} t={t} />
      <Char look="victor" expr={onboard ? "laugh" : "worried"} t={t} p={[vx, vy, vz]} cam={cam} scale={1.0} pose={pose} gait={1.8} amp={2.0} tint="#ffdcb8" seed={5} handL={<mesh position={[0, -0.25, 0.05]}><boxGeometry args={[0.5, 0.36, 0.2]} /><meshBasicMaterial color="#6a4a2a" /></mesh>} />
    </group>
  );
};

/** ============================ STUDY (Poisson's dark room) and MODERN room (laptop) ============================ */
export const Study: React.FC<{ t: number; cam: V3 }> = ({ t, cam }) => (
  <group>
    <fog attach="fog" args={["#0c0a12", 8, 20]} /><color attach="background" args={["#0c0a12"]} />
    <StudyStatic />
    <Char look="poisson" expr="sad" t={t} p={[0.0, 0, -0.6]} cam={cam} scale={1.15} sit={0.3} pose="sleep" tint="#aab4e0" seed={4} />
    {Array.from({ length: 20 }, (_, i) => <mesh key={i} position={[-2 + ((i * 37) % 40) / 10, 0.6 + ((i * 53 + t * 5) % 40) / 10, -2 + ((i * 29) % 30) / 10]}><planeGeometry args={[0.03, 0.03]} /><meshBasicMaterial map={tx("glow")} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.4} /></mesh>)}
  </group>
);
const StudyStatic = React.memo(() => (
  <group>
    <Bx g={[9, 0.2, 7]} p={[0, -0.1, 0]} m={M("#ffffff", tx("parquet", 3, 2.5), 0.4)} />
    <Bx g={[9, 6, 0.2]} p={[0, 3, -3.4]} m={M("#ffffff", tx("damask", 3, 2), 0.8)} />
    <Bx g={[0.2, 6, 7]} p={[-4.5, 3, 0]} m={M("#ffffff", tx("damask", 3, 2), 0.8)} /><Bx g={[0.2, 6, 7]} p={[4.5, 3, 0]} m={M("#ffffff", tx("damask", 3, 2), 0.8)} />
    <Bx g={[9, 0.2, 7]} p={[0, 6.0, 0]} m={M("#3a2a24", null, 0.9)} />
    {/* the window, with the tower in silhouette */}
    <group position={[0, 3.2, -3.28]}>
      <mesh><planeGeometry args={[3.0, 3.8]} /><meshBasicMaterial map={tx("skyNight")} /></mesh>
      <mesh position={[0, -0.9, 0.02]}><planeGeometry args={[0.16, 2.0]} /><meshBasicMaterial color="#080810" /></mesh>
      <mesh position={[0, 0.1, 0.02]}><planeGeometry args={[0.7, 0.09]} /><meshBasicMaterial color="#080810" /></mesh>
      <mesh position={[0, -0.5, 0.02]}><planeGeometry args={[1.1, 0.11]} /><meshBasicMaterial color="#080810" /></mesh>
      <Bx g={[3.3, 0.16, 0.2]} p={[0, -1.95, 0.1]} m={M("#4a3220", null, 0.8)} /><Bx g={[0.1, 3.9, 0.12]} p={[0, 0, 0.08]} m={M("#4a3220", null, 0.8)} /><Bx g={[3.1, 0.1, 0.12]} p={[0, 0.2, 0.08]} m={M("#4a3220", null, 0.8)} />
      <pointLight color="#6a8ae8" intensity={34} distance={14} decay={1.6} position={[0.5, 0, 1.8]} />
      <mesh position={[0.5, -1.5, 2.6]} rotation={[-1.0, 0, 0.1]}><planeGeometry args={[2.0, 6]} /><meshBasicMaterial map={tx("shaft")} color="#8aa4ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    </group>
    <Bx g={[2.4, 0.12, 1.2]} p={[2.2, 1.0, -1.6]} m={M("#ffffff", tx("deskwood"), 0.5)} /><Bx g={[0.1, 1.0, 1.1]} p={[3.3, 0.5, -1.6]} m={M("#4a2a18", null, 0.6)} /><Bx g={[0.1, 1.0, 1.1]} p={[1.1, 0.5, -1.6]} m={M("#4a2a18", null, 0.6)} />
    <mesh position={[2.0, 1.07, -1.6]} rotation={[-Math.PI / 2, 0, 0.3]}><planeGeometry args={[0.7, 0.9]} /><meshStandardMaterial map={tx("paper")} /></mesh>
    <hemisphereLight args={["#4a5a9a", "#1a1218", 0.5]} />
  </group>
));
export const Modern: React.FC<{ t: number; cam: V3 }> = ({ t, cam }) => {
  const tDel = wt(11, 16); const deleted = t > tDel;
  const kick = clamp((t - tDel) / 0.4);
  return (
    <group>
      <fog attach="fog" args={["#0a0e1a", 8, 22]} /><color attach="background" args={["#0a0e1a"]} />
      <ModernStatic />
      <mesh position={[-0.9, 1.72, -0.6]} rotation={[-0.1, 0.45, 0]}><planeGeometry args={[1.5, 0.94]} /><meshBasicMaterial map={tx(deleted ? "screenEmpty" : "screen")} color="#8a92a8" toneMapped={false} /></mesh>
      <Glow p={[-0.8, 1.7, -0.3]} s={3.4} c="#8ab4ff" o={0.22} />
      <pointLight color="#8ab4ff" intensity={7} distance={7} decay={1.6} position={[-0.6, 1.9, 0.6]} />
      <Char look="kyle" expr={deleted ? "shock" : t > wt(11, 8) ? "worried" : "deadpan"} t={t} p={[0.5, 0, 0.0]} cam={cam} scale={1.1} sit={0.34} pose={deleted ? "cheer" : "hold"} tint="#b8c8ff" seed={3} power={0.5 + kick} yawOverride={-0.5} />
    </group>
  );
};
const ModernStatic = React.memo(() => (
  <group>
    <Bx g={[9, 0.2, 7]} p={[0, -0.1, 0]} m={M("#ffffff", tx("planks", 3, 2.4), 0.6)} />
    <Bx g={[9, 6, 0.2]} p={[0, 3, -3.4]} m={M("#ffffff", tx("modernWall", 3, 2), 0.9)} />
    <Bx g={[0.2, 6, 7]} p={[-4.5, 3, 0]} m={M("#ffffff", tx("modernWall", 3, 2), 0.9)} /><Bx g={[0.2, 6, 7]} p={[4.5, 3, 0]} m={M("#ffffff", tx("modernWall", 3, 2), 0.9)} />
    <Bx g={[9, 0.2, 7]} p={[0, 6, 0]} m={M("#2a3048", null, 0.9)} />
    <group position={[2.6, 2.7, -3.28]}><mesh><planeGeometry args={[2.6, 3.0]} /><meshBasicMaterial map={tx("skyNight")} /></mesh><Bx g={[2.8, 0.14, 0.2]} p={[0, -1.55, 0.1]} m={M("#c8ccd8", null, 0.6)} /><Bx g={[0.08, 3.1, 0.1]} p={[0, 0, 0.06]} m={M("#c8ccd8", null, 0.6)} /><pointLight color="#6a8ae8" intensity={18} distance={12} decay={1.6} position={[0, 0, 1.5]} /></group>
    {/* desk, laptop, mug, lamp, posters, bed */}
    <Bx g={[4.6, 0.12, 1.6]} p={[0, 1.0, -0.4]} m={M("#c9b48a", null, 0.5)} />{[-2.1, 2.1].map((x) => <Bx key={x} g={[0.1, 1.0, 1.5]} p={[x, 0.5, -0.4]} m={M("#8a7a5a", null, 0.5)} />)}
    <group position={[-0.9, 0, -0.6]} rotation={[0, 0.45, 0]}><Bx g={[1.5, 0.06, 1.0]} p={[0, 1.1, 0]} m={M("#5a5c68", null, 0.5)} /><Bx g={[1.6, 1.0, 0.05]} p={[0, 1.62, -0.55]} m={M("#a8aab8", null, 0.3)} r={[-0.1, 0, 0]} /></group>
    <Cy r={0.1} h={0.18} p={[1.2, 1.15, -1.3]} m={M("#e8e0d0", null, 0.5)} s={12} />
    <Cy r={0.08} h={0.7} p={[-1.3, 1.4, -1.6]} m={M("#2a2a32", null, 0.5)} s={6} /><Glow p={[-1.3, 1.9, -1.5]} s={2.2} c="#ffd49a" o={0.5} /><pointLight color="#ffc888" intensity={6} distance={8} decay={1.6} position={[-1.3, 1.9, -1.4]} />
    {[[-3.2, 3.2], [-2.6, 4.2]].map(([x, y], i) => <mesh key={i} position={[x, y, -3.28]}><planeGeometry args={[0.8, 1.1]} /><meshBasicMaterial color={["#d84a3a", "#4a8ad8"][i]} /></mesh>)}
    <Bx g={[2.4, 0.5, 1.4]} p={[-3.2, 0.3, 1.0]} m={M("#6a7aa8", null, 0.9)} />
    <hemisphereLight args={["#6a78b8", "#1a1620", 0.5]} />
  </group>
));

/** ============================ ROOFS: night Paris, the chase and the finale ============================ */
const RoofsStatic = React.memo(() => {
  const r = rnd(41); const roofs: React.ReactNode[] = [];
  for (let ix = -9; ix <= 9; ix++) for (let iz = -2; iz <= 9; iz++) {
    if (Math.abs(ix * 11) < 22 && iz < 6) continue; if (iz <= 1 && iz >= 0) continue;
    const x = ix * 11 + (r() - 0.5) * 2, z = 12 - iz * 11 + (r() - 0.5) * 2; const h = 9 + r() * 9; const rh = 2.2 + r() * 1.2;
    roofs.push(
      <group key={`${ix}_${iz}`} position={[x, 0, z]}>
        <mesh geometry={BG(10, h, 10)} material={M("#ffffff", tx("facade3"), 0.9, "#ffb070", 0.45)} position={[0, h / 2, 0]} />
        <mesh position={[0, h + rh / 2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[7.4, rh, 4]} /><meshStandardMaterial map={tx("roof", 3, 2)} roughness={0.7} /></mesh>
        {[0, 1].map((c) => <Bx key={c} g={[0.7, 1.7, 0.7]} p={[-2 + c * 3.4, h + rh + 0.2, 0.8 - c]} m={M("#7a6a58", null, 0.9)} />)}
      </group>);
  }
  return (
    <group>
      <Sky night r={320} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}><planeGeometry args={[420, 420]} /><meshStandardMaterial color="#10121c" roughness={1} /></mesh>
      {roofs}
      <hemisphereLight args={["#6a7ab8", "#3a2a24", 1.1]} />
      <directionalLight color="#9ab0ff" intensity={1.8} position={[30, 60, 40]} />
      <Bx g={[90, 11, 12]} p={[0, 5.5, 6]} m={M("#ffffff", tx("facade3", 6, 1), 0.9, "#ffb070", 0.35)} /><Bx g={[90, 0.4, 12.4]} p={[0, 11.2, 6]} m={M("#7a8aaa", null, 0.6, "#4a5a8a", 0.6)} />
      <directionalLight color="#ffb070" intensity={0.5} position={[-20, 10, -80]} />
    </group>
  );
});
export const Roofs: React.FC<{ t: number; cam: V3; finale?: number }> = ({ t, cam }) => {
  const tFin = ss(15);
  // chase: Victor runs along the rooftop line, gendarmes follow
  const u = clamp((t - ss(14)) / 5.2); const vx = -22 + u * 46;
  const blink = Math.floor(t * 0.9) % 4 === 0 && (t * 0.9) % 1 < 0.12;
  const look = Math.sin(t * 0.8) * 0.4;
  return (
    <group>
      <fog attach="fog" args={["#141a34", 30, 210]} /><color attach="background" args={["#0b1230"]} />
      <RoofsStatic />
      <Tower p={[0, 0, -92]} night t={t} />
      {/* the tower's worried face, two SOLD signs hanging on it (finale) */}
      <group position={[0, 0, -92 + 13.4]} visible={t > tFin - 2.5}>
        <group position={[-3.4, 25.5, 0]}><mesh scale={[1 + 0, blink ? 0.08 : 1, 1]}><planeGeometry args={[5.4, 5.4]} /><meshBasicMaterial map={tx("eyeWhite")} transparent /></mesh><mesh position={[look * 0.9, -0.2, 0.05]} scale={[blink ? 0.01 : 1, blink ? 0.01 : 1, 1]}><circleGeometry args={[1.05, 20]} /><meshBasicMaterial color="#14101a" /></mesh><mesh position={[0, 3.6, 0]} rotation={[0, 0, 0.35]}><planeGeometry args={[5.4, 0.7]} /><meshBasicMaterial color="#14101a" /></mesh></group>
        <group position={[3.4, 25.5, 0]}><mesh scale={[1, blink ? 0.08 : 1, 1]}><planeGeometry args={[5.4, 5.4]} /><meshBasicMaterial map={tx("eyeWhite")} transparent /></mesh><mesh position={[look * 0.9, -0.2, 0.05]} scale={[blink ? 0.01 : 1, blink ? 0.01 : 1, 1]}><circleGeometry args={[1.05, 20]} /><meshBasicMaterial color="#14101a" /></mesh><mesh position={[0, 3.6, 0]} rotation={[0, 0, -0.35]}><planeGeometry args={[5.4, 0.7]} /><meshBasicMaterial color="#14101a" /></mesh></group>
        {[[-9.5, 1.0], [8.5, -0.8]].map(([x, rz], i) => <group key={i} position={[x, 14, 1.2]} rotation={[0, 0, (rz as number) * 0.08 + Math.sin(t * 1.4 + i) * 0.05]}><mesh><planeGeometry args={[8.4, 4.2]} /><meshStandardMaterial map={tx("sold")} roughness={0.8} /></mesh><Bx g={[0.1, 5, 0.1]} p={[-3.4, 3.4, -0.2]} m={M("#8a7a5a", null, 0.9)} r={[0, 0, -0.3]} /><Bx g={[0.1, 5, 0.1]} p={[3.4, 3.4, -0.2]} m={M("#8a7a5a", null, 0.9)} r={[0, 0, 0.3]} /></group>)}
      </group>
      {/* roof ledge for the chase */}
      <Bx g={[80, 0.12, 5]} p={[0, 11.45, 6]} m={M("#ffffff", tx("roof", 14, 1), 0.7, "#4a5a8a", 0.7)} />
      <Bx g={[80, 0.7, 0.4]} p={[0, 11.9, 9.1]} m={M("#6a5a4a", null, 0.9)} />
      {[-30, -12, 10, 28].map((x, i) => <Bx key={i} g={[1.4, 2.6, 1.4]} p={[x, 12.8, 5]} m={M("#7a6a58", null, 0.9)} />)}
      <Char look="victor" expr="worried" t={t} p={[vx, 11.5, 6.4]} cam={cam} scale={1.0} pose="walk" gait={2.4} amp={2.4} tint="#a8b4e8" seed={5} />
      {[0, 1].map((i) => <Char key={i} look="gendarme" expr="angry" t={t} p={[vx - 9 - i * 4.5 + Math.sin(t * 3) * 0.3, 11.5, 6.4 - i * 0.2]} cam={cam} scale={1.0} pose="walk" gait={2.1} amp={2.2} tint="#a8b4e8" seed={10 + i} />)}
      {Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.28 + t * 6; return <mesh key={i} position={[-14 + i * 4, 15 + Math.sin(a) * 0.4, 2]}><circleGeometry args={[0.12, 8]} /><meshBasicMaterial color={i % 2 ? "#ff3a3a" : "#4a7aff"} /></mesh>; })}
      {/* warm lit windows glow on the roofs */}
      {Array.from({ length: 24 }, (_, i) => <Glow key={i} p={[-50 + (i * 41) % 100, 6 + (i * 13) % 9, -4 - (i * 23) % 70]} s={3.2} c="#ffc070" o={0.5} />)}
      {Array.from({ length: 6 }, (_, i) => <Glow key={`h${i}`} p={[0, 3, -88 - i * 3]} s={80} c="#ff9a6a" o={0.1} />)}
    </group>
  );
};
export { se };
