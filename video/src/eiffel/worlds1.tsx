import * as THREE from "three";
import React from "react";
import { Bx, Cy, Sp, Pl, Glow, Sky, Char, Tower, M, BM, BG, CG, SG, PG, tx, rnd, memo, type V3 } from "./kit";
import { wt, ss, pop, sm, clamp } from "./timeline";

/** ============================ STREET: Paris at dusk, the tower at the end of the street ============================ */
const facadeMat = (side: number, v: number) => memo(`fm${side}${v}`, () => {
  const plain = new THREE.MeshStandardMaterial({ color: "#d8c6a2", roughness: 0.9 });
  const face = new THREE.MeshStandardMaterial({ map: tx(["facade", "facade2", "facade3"][v]), roughness: 0.85, emissive: "#ffd0a0", emissiveMap: tx(["facade", "facade2", "facade3"][v]), emissiveIntensity: 0.22 });
  return side < 0 ? [face, plain, plain, plain, plain, plain] : [plain, face, plain, plain, plain, plain];
});
const StreetStatic = React.memo(() => {
  const r = rnd(17);
  const bld: React.ReactNode[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const z = 34 - i * 14.2; const v = (i + (side < 0 ? 0 : 1)) % 3; const x = side * 17;
    bld.push(<mesh key={`b${side}${i}`} geometry={BG(14, 21, 14.2)} material={facadeMat(side, v) as any} position={[x, 10.5, z]} castShadow receiveShadow />);
    for (const [y, d] of [[1.9, 0.5], [5.6, 0.7], [9.25, 0.5], [13.0, 0.7], [16.7, 0.5]]) bld.push(<Bx key={`l${side}${i}${y}`} g={[d + 0.2, 0.28, 14.3]} p={[side * (10 - d / 2), y, z]} m={M("#c4b08a", null, 0.9)} />);
    for (const y of [5.3, 12.7]) { bld.push(<Bx key={`bs${side}${i}${y}`} g={[1.3, 0.16, 14.1]} p={[side * (10 - 0.65), y, z]} m={M("#b8a47e", null, 0.9)} />); bld.push(<mesh key={`ir${side}${i}${y}`} geometry={PG(14.1, 1.05)} material={BM("#ffffff", tx("iron", 5, 1), 1, THREE.NormalBlending, THREE.DoubleSide)} position={[side * (10 - 1.28), y + 0.62, z]} rotation={[0, side * Math.PI / 2 * -1, 0]} />); }
    bld.push(<Bx key={`aw${side}${i}`} g={[1.8, 0.14, 11]} p={[side * (10 - 0.9), 2.9, z]} m={M(i % 2 ? "#a8322e" : "#2c5a46", null, 0.8)} r={[0, 0, side * 0.35]} />);
    for (let c = 0; c < 3; c++) { const cx = side * (17 + (r() - 0.5) * 6), cz = z + (c - 1) * 4; bld.push(<Bx key={`ch${side}${i}${c}`} g={[1.1, 3.0, 1.1]} p={[cx, 22.5, cz]} m={M("#a89270", null, 0.9)} />); bld.push(<Cy key={`cp${side}${i}${c}`} r={0.28} h={0.6} p={[cx, 24.2, cz]} m={M("#b05a3a", null, 0.8)} s={10} />); }
    bld.push(<Bx key={`rt${side}${i}`} g={[14.4, 0.5, 14.4]} p={[x, 21.2, z]} m={M("#3a4558", null, 0.8)} />);
  }
  const lamps: React.ReactNode[] = [];
  for (const side of [-1, 1]) for (let k = 0; k < 7; k++) { const z = 28 - k * 16 + side * 3; const x = side * 8.4; lamps.push(
    <group key={`lp${side}${k}`} position={[x, 0, z]}>
      <Cy r={0.11} rb={0.17} h={4.6} p={[0, 2.3, 0]} m={M("#1c1d22", null, 0.5, undefined, 1, { metalness: 0.4 })} s={10} />
      <Cy r={0.3} rb={0.2} h={0.5} p={[0, 0.25, 0]} m={M("#1c1d22", null, 0.5)} s={10} />
      <Bx g={[0.5, 0.62, 0.5]} p={[0, 4.9, 0]} m={M("#ffe8b0", null, 0.3, "#ffbe5a", 1.8)} cast={false} />
      <Bx g={[0.7, 0.12, 0.7]} p={[0, 5.28, 0]} m={M("#1c1d22", null, 0.5)} cast={false} />
      <Glow p={[0, 4.9, 0]} s={5.5} c="#ffbe6a" o={0.75} />
    </group>); }
  const trees: React.ReactNode[] = [];
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) { const z = 22 - k * 14 - side * 2; const x = side * 9.1; const sc = 0.9 + r() * 0.35; trees.push(
    <group key={`t${side}${k}`} position={[x, 0, z]} scale={sc}>
      <Cy r={0.22} rb={0.32} h={5} p={[0, 2.5, 0]} m={M("#ffffff", tx("bark", 1, 2), 0.95)} s={8} />
      <mesh geometry={memo("ico", () => new THREE.IcosahedronGeometry(2.2, 1))} material={M("#ffffff", tx("leaf", 2, 2), 0.9, "#1a2a0e", 0.2, { flatShading: true })} position={[0, 6.3, 0]} scale={[1.15, 1, 1.15]} castShadow />
      <mesh geometry={memo("ico", () => new THREE.IcosahedronGeometry(2.2, 1))} material={M("#d8e8a0", tx("leaf", 2, 2), 0.9, "#1a2a0e", 0.2, { flatShading: true })} position={[1.3, 5.6, 0.6]} scale={0.8} castShadow />
      <mesh geometry={memo("ico", () => new THREE.IcosahedronGeometry(2.2, 1))} material={M("#ffd8a0", tx("leaf", 2, 2), 0.9, "#1a2a0e", 0.2, { flatShading: true })} position={[-1.2, 5.4, -0.5]} scale={0.75} castShadow />
    </group>); }
  // far low skyline around the tower
  const far: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) { const x = -70 + i * 10.5 + (r() - 0.5) * 4; if (Math.abs(x) < 22) continue; const h = 9 + r() * 7; far.push(<mesh key={`f${i}`} geometry={BG(9.5, h, 9)} material={M("#ffffff", tx("facade3"), 0.9, "#ffb070", 0.1)} position={[x, h / 2, -66 - r() * 18]} />); }
  return (
    <group>
      <Sky />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]} receiveShadow><planeGeometry args={[240, 240]} /><meshStandardMaterial map={tx("cobble", 46, 46)} roughness={0.8} /></mesh>
      <Bx g={[3.2, 0.26, 200]} p={[-9.6, 0.1, -30]} m={M("#9a949c", null, 0.9)} />
      <Bx g={[3.2, 0.26, 200]} p={[9.6, 0.1, -30]} m={M("#9a949c", null, 0.9)} />
      <Bx g={[0.3, 0.3, 200]} p={[-8.0, 0.12, -30]} m={M("#6a666e", null, 0.8)} />
      <Bx g={[0.3, 0.3, 200]} p={[8.0, 0.12, -30]} m={M("#6a666e", null, 0.8)} />
      {bld}{lamps}{trees}{far}
      <Tower p={[0, 0, -80]} />
      {/* warm low sun behind the tower */}
      <Glow p={[-4, 20, -170]} s={190} c="#ffb070" o={0.85} />
      <Glow p={[-4, 20, -170]} s={60} c="#fff0c0" o={0.95} />
      <Glow p={[0, 4, -72]} s={90} c="#ff9a6a" o={0.32} />
      {/* drifting ground haze for depth */}
      {[-34, -48, -60].map((z, i) => <Glow key={i} p={[0, 1.2, z]} s={60} c="#e8a890" o={0.16} />)}
      <hemisphereLight args={["#8c92d0", "#4a3a3c", 0.7]} />
      <directionalLight color="#ffa868" intensity={2.4} position={[-34, 16, -120]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-46} shadow-camera-right={46} shadow-camera-top={46} shadow-camera-bottom={-46} shadow-camera-near={1} shadow-camera-far={220} shadow-bias={-0.0006} />
      <directionalLight color="#7a8cd8" intensity={0.55} position={[14, 24, 50]} />
      <pointLight color="#ffc47a" intensity={30} distance={20} decay={1.6} position={[-6, 4.4, 22]} />
      <pointLight color="#ffc47a" intensity={30} distance={20} decay={1.6} position={[6, 4.4, 6]} />
      <pointLight color="#ffc47a" intensity={30} distance={20} decay={1.6} position={[-6, 4.4, -12]} />
    </group>
  );
});
const Birds: React.FC<{ t: number }> = ({ t }) => {
  const r = React.useMemo(() => { const q = rnd(3); return Array.from({ length: 14 }, () => ({ x0: -40 + q() * 80, y: 22 + q() * 26, z: -20 - q() * 60, sp: 2 + q() * 2.5, ph: q() * 6, s: 0.5 + q() * 0.5 })); }, []);
  return <>{r.map((b, i) => { const x = ((b.x0 + t * b.sp + 60) % 120) - 60; const fl = Math.sin(t * 14 + b.ph); return <group key={i} position={[x, b.y + Math.sin(t * 0.7 + b.ph) * 0.8, b.z]} rotation={[0, -0.2, 0]}>
    <mesh position={[-b.s * 0.45, fl * b.s * 0.28, 0]} rotation={[0, 0, 0.5 + fl * 0.5]}><planeGeometry args={[b.s, 0.16 * b.s]} /><meshBasicMaterial color="#1a1620" side={THREE.DoubleSide} fog={false} /></mesh>
    <mesh position={[b.s * 0.45, fl * b.s * 0.28, 0]} rotation={[0, 0, -0.5 - fl * 0.5]}><planeGeometry args={[b.s, 0.16 * b.s]} /><meshBasicMaterial color="#1a1620" side={THREE.DoubleSide} fog={false} /></mesh>
  </group>; })}</>;
};
const Leaves: React.FC<{ t: number }> = ({ t }) => {
  const r = React.useMemo(() => { const q = rnd(9); return Array.from({ length: 40 }, () => ({ x: -8 + q() * 16, z: -50 + q() * 80, y0: q() * 9, sp: 0.4 + q() * 0.6, ph: q() * 6, c: ["#c8782a", "#d89a3a", "#a8502a", "#e8b24a"][Math.floor(q() * 4)] })); }, []);
  return <>{r.map((l, i) => { const y = 9 - ((l.y0 + t * l.sp) % 9); return <mesh key={i} position={[l.x + Math.sin(t * 0.9 + l.ph) * 0.9, y, l.z]} rotation={[t * 1.5 + l.ph, t + l.ph, 0]}><planeGeometry args={[0.2, 0.14]} /><meshBasicMaterial color={l.c} side={THREE.DoubleSide} fog={false} /></mesh>; })}</>;
};
/** the newsstand and Morris column (S9 headline slide runs along it) */
const Stand = React.memo(() => (
  <group position={[4.8, 0, -4]}>
    <Cy r={1.15} h={4.6} p={[-5.2, 2.3, 0]} m={M("#ffffff", tx("poster", 3, 1), 0.7)} s={28} />
    <Cy r={1.3} rb={1.2} h={0.4} p={[-5.2, 0.2, 0]} m={M("#2c5a46", null, 0.6)} s={28} />
    <Cy r={0.05} rb={1.45} h={1.0} p={[-5.2, 5.1, 0]} m={M("#2c5a46", null, 0.6)} s={28} />
    <Bx g={[5.4, 2.4, 0.2]} p={[0, 1.2, -1.3]} m={M("#6a4a2a", null, 0.8)} />
    <Bx g={[5.6, 0.18, 2.4]} p={[0, 2.5, -0.2]} m={M("#2c5a46", null, 0.7)} r={[0.12, 0, 0]} />
    <Bx g={[5.2, 0.16, 1.5]} p={[0, 1.05, -0.2]} m={M("#7a5a38", null, 0.7)} r={[-0.42, 0, 0]} />
    <Bx g={[5.2, 1.0, 0.1]} p={[0, 0.5, 0.45]} m={M("#6a4a2a", null, 0.8)} />
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} geometry={PG(0.95, 1.25)} material={M("#ffffff", tx(["newsA", "newsB", "newsC", "newsD", "newsA"][i]), 0.9)} position={[-2.0 + i * 1.0, 1.2, 0.05 + 0.0]} rotation={[-0.42, 0, 0]} />)}
    {[0, 1, 2, 3].map((i) => <mesh key={`b${i}`} geometry={PG(0.7, 0.92)} material={M("#ffffff", tx(["newsD", "newsC", "newsB", "newsA"][i]), 0.9)} position={[-1.5 + i * 1.0, 2.05, -0.28]} rotation={[-0.1, 0, 0]} />)}
    <pointLight color="#ffd28a" intensity={14} distance={9} decay={1.6} position={[0, 2.2, 1.4]} />
  </group>
));
const Cafe = React.memo(() => (
  <group position={[-9.2, 0, 10]}>
    {[0, 1, 2].map((i) => <group key={i} position={[0, 0, -i * 3.2]}>
      <Cy r={0.55} h={0.07} p={[0, 1.0, 0]} m={M("#2a2a30", null, 0.5)} s={20} />
      <Cy r={0.05} h={1.0} p={[0, 0.5, 0]} m={M("#2a2a30", null, 0.5)} s={8} />
      {[0, 2.1, 4.2].map((a, k) => <group key={k} position={[Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95]}><Bx g={[0.4, 0.05, 0.4]} p={[0, 0.5, 0]} m={M("#6a4a2a", null, 0.7)} /><Bx g={[0.4, 0.5, 0.05]} p={[0, 0.78, 0.18]} m={M("#6a4a2a", null, 0.7)} /></group>)}
      <Cy r={0.07} h={0.1} p={[0.1, 1.08, 0.05]} m={M("#f4efe6", null, 0.4)} s={10} cast={false} />
    </group>)}
  </group>
));
const SoldSign: React.FC<{ p: V3; rot: number; t: number; t0: number; }> = ({ p, rot, t, t0 }) => {
  const k = pop((t - t0) / 0.35); const s = Math.max(0.0001, k) * 0.8;
  return (
    <group position={p} rotation={[0, rot, 0]} scale={[s, s, s]}>
      <Bx g={[4.4, 2.3, 0.14]} p={[0, 2.4, 0]} m={M("#ffffff", tx("sold"), 0.8)} />
      <Bx g={[0.18, 2.4, 0.18]} p={[-1.8, 1.2, -0.2]} m={M("#5a3a22", null, 0.8)} /><Bx g={[0.18, 2.4, 0.18]} p={[1.8, 1.2, -0.2]} m={M("#5a3a22", null, 0.8)} />
      {t > t0 && t < t0 + 0.5 ? <Glow p={[0, 2.4, 0.4]} s={9 * (1 - (t - t0) / 0.5) + 3} c="#fff0c8" o={0.7 * (1 - (t - t0) / 0.5)} /> : null}
    </group>
  );
};
export const Street: React.FC<{ t: number; cam: V3; variant?: "hook" | "sold" | "plaque" | "news" }> = ({ t, cam, variant = "hook" }) => {
  const t1 = wt(1, 2), t2 = wt(1, 4);
  return (
    <group>
      <fog attach="fog" args={["#c08a8a", 40, 230]} /><color attach="background" args={["#c08a8a"]} />
      <StreetStatic /><Stand /><Cafe />
      <Birds t={t} /><Leaves t={t} />
      <SoldSign p={[-6.0, 0, -61]} rot={0.2} t={t} t0={t1} /><SoldSign p={[-2.5, 0.4, -60.2]} rot={-0.1} t={t} t0={t2} />
      {/* a worker painting the tower's foot, a plaque, pigeons on the cobbles */}
      <group position={[7.5, 0, -58]}>
        <Bx g={[3.4, 2.0, 0.14]} p={[0, 2.2, 0]} m={M("#ffffff", tx("plaque"), 0.8)} />
        <Bx g={[0.18, 2.2, 0.18]} p={[-1.4, 1.1, -0.2]} m={M("#5a3a22", null, 0.8)} /><Bx g={[0.18, 2.2, 0.18]} p={[1.4, 1.1, -0.2]} m={M("#5a3a22", null, 0.8)} />
      </group>
      {variant === "hook" ? <Char look="victor" expr={t > ss(0) + 2.2 ? "smug" : "grin"} t={t} p={[-1.0, 0.0, 17]} cam={cam} scale={1.05} pose={t > 1.4 && t < 4.6 ? "salute" : "idle"} tint="#ffe2c0" /> : null}
      {variant === "news" ? <Char look="victor" expr="worried" t={t} p={[9.4, 0, -2.2]} cam={cam} scale={1.0} pose="hold" tint="#ffe2c0" /> : null}
      {variant === "plaque" ? <Char look="dealer" expr="think" t={t} p={[4.8, 0, -52]} cam={cam} scale={1.0} tint="#ffe2c0" seed={4} pose="hold" handR={<mesh position={[0, -0.1, 0.05]}><boxGeometry args={[0.06, 0.5, 0.06]} /><meshBasicMaterial color="#6a4a2a" /></mesh>} /> : null}
      <Char look="dealer2" expr="think" t={t} p={[-6.0, 0, -6]} cam={cam} scale={1.0} tint="#ffe2c0" seed={7} />
      {[0, 1, 2, 3, 4].map((i) => { const bx = 3.6 + i * 0.5 + Math.sin(t * 0.8 + i) * 0.1; const peck = Math.max(0, Math.sin(t * 5 + i * 2)); return <group key={i} position={[bx, 0.2, 18 - i * 0.6]}><Sp r={0.07} p={[0, 0.02, 0]} m={M("#b4b0b8", null, 0.8)} sc={[1, 0.8, 1.4]} /><Sp r={0.04} p={[0, 0.07 - peck * 0.05, 0.1 + peck * 0.04]} m={M("#8a8690", null, 0.8)} /></group>; })}
    </group>
  );
};

/** ============================ ATTIC: Victor's broke little room ============================ */
export const Attic: React.FC<{ t: number; cam: V3 }> = ({ t, cam }) => {
  const sw = Math.sin(t * 1.6) * 0.16 + Math.sin(t * 2.7) * 0.05;
  return (
    <group>
      <fog attach="fog" args={["#1a1620", 10, 24]} /><color attach="background" args={["#14121a"]} />
      <AtticStatic />
      {/* swinging bare bulb */}
      <group position={[0, 6.2, 0.4]} rotation={[0, 0, sw]}>
        <Cy r={0.012} h={2.6} p={[0, -1.3, 0]} m={M("#1a1a1a", null, 0.6)} s={6} cast={false} />
        <Cy r={0.1} h={0.2} p={[0, -2.7, 0]} m={M("#2a2a2a", null, 0.5)} s={10} cast={false} />
        <Sp r={0.17} p={[0, -2.9, 0]} m={BM("#fff2c8")} />
        <Glow p={[0, -2.9, 0]} s={6.5} c="#ffcc7a" o={0.7} />
        <pointLight color="#ffc678" intensity={34} distance={16} decay={1.5} position={[0, -2.9, 0.1]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.001} />
      </group>
      <Char look="victor" expr={t < wt(2, 6) ? "sad" : "worried"} t={t} p={[0.2, 0, -0.4]} cam={cam} scale={1.1} pose="idle" tint="#ffd9b0" seed={5}>
        {/* turned-out pockets */}
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.36 * 1.1, 0.88 * 1.1, 0.08]} rotation={[0, 0, s * 0.2]}><planeGeometry args={[0.16, 0.24]} /><meshBasicMaterial color="#f1ecdc" side={THREE.DoubleSide} /></mesh>)}
      </Char>
      {/* dust and moon rays */}
      {Array.from({ length: 30 }, (_, i) => <mesh key={i} position={[-3 + ((i * 37) % 60) / 10 + Math.sin(t * 0.3 + i) * 0.3, 0.4 + ((i * 53 + t * 8) % 50) / 10, -1.6 + ((i * 29) % 40) / 10]}><planeGeometry args={[0.03, 0.03]} /><meshBasicMaterial map={tx("glow")} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.5} /></mesh>)}
    </group>
  );
};
const AtticStatic = React.memo(() => (
  <group>
    <Bx g={[9, 0.2, 7]} p={[0, -0.1, 0]} m={M("#ffffff", tx("planks", 3, 3), 0.7)} />
    {/* slanted roof planes (gable) */}
    <mesh position={[-2.3, 4.45, 0]} rotation={[0, 0, 0.74]} receiveShadow><boxGeometry args={[6.3, 0.2, 8]} /><meshStandardMaterial map={tx("planks", 3, 3)} roughness={0.9} /></mesh>
    <mesh position={[2.3, 4.45, 0]} rotation={[0, 0, -0.74]} receiveShadow><boxGeometry args={[6.3, 0.2, 8]} /><meshStandardMaterial map={tx("planks", 3, 3)} roughness={0.9} /></mesh>
    <Bx g={[0.2, 2.4, 8]} p={[-4.5, 1.2, 0]} m={M("#ffffff", tx("atticWall", 2, 1), 0.95)} /><Bx g={[0.2, 2.4, 8]} p={[4.5, 1.2, 0]} m={M("#ffffff", tx("atticWall", 2, 1), 0.95)} />
    <Bx g={[9, 7.0, 0.2]} p={[0, 3.5, -3.6]} m={M("#ffffff", tx("atticWall", 2, 2), 0.95)} />
    {[-3, -1.5, 0, 1.5, 3].map((x) => <Bx key={x} g={[0.22, 0.26, 7.6]} p={[x * 1.0, 6.2 - Math.abs(x) * 0.82 - 0.35, 0]} m={M("#4a3220", null, 0.8)} />)}
    <Bx g={[0.3, 0.3, 7.8]} p={[0, 6.35, 0]} m={M("#4a3220", null, 0.8)} />
    {/* round window with the tower far away in it */}
    <group position={[0, 3.2, -3.45]}>
      <mesh><circleGeometry args={[1.35, 32]} /><meshBasicMaterial map={tx("skyNight")} /></mesh>
      <mesh position={[0, -0.4, 0.02]}><planeGeometry args={[0.28, 1.5]} /><meshBasicMaterial color="#0d0d1a" /></mesh>
      <mesh position={[0, -0.9, 0.03]}><circleGeometry args={[0.18, 3]} /><meshBasicMaterial color="#0d0d1a" /></mesh>
      <mesh rotation={[0, 0, 0]}><torusGeometry args={[1.38, 0.1, 10, 40]} /><meshStandardMaterial color="#4a3a2a" roughness={0.7} /></mesh>
      <Bx g={[2.8, 0.07, 0.1]} p={[0, 0, 0.04]} m={M("#4a3a2a", null, 0.7)} /><Bx g={[0.07, 2.8, 0.1]} p={[0, 0, 0.04]} m={M("#4a3a2a", null, 0.7)} />
      <mesh position={[0, 0, 0.3]} rotation={[-0.2, 0, 0]}><planeGeometry args={[2.8, 1.8]} /><meshBasicMaterial map={tx("shaft")} transparent opacity={0.0} /></mesh>
      <pointLight color="#8aa4ff" intensity={20} distance={14} decay={1.7} position={[0.4, 0.4, 1.2]} />
      <mesh position={[0.3, -2.2, 3.5]} rotation={[-1.15, 0, 0]}><planeGeometry args={[2.0, 7]} /><meshBasicMaterial map={tx("shaft")} color="#9fb6ff" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    </group>
    {/* iron bed with a thin mattress */}
    <group position={[-2.9, 0, -1.4]}>
      <Bx g={[2.6, 0.12, 1.3]} p={[0, 0.52, 0]} m={M("#9aa0b0", null, 0.4)} /><Bx g={[2.5, 0.22, 1.2]} p={[0, 0.7, 0]} m={M("#c9b99a", null, 0.9)} /><Bx g={[0.6, 0.16, 0.9]} p={[-0.85, 0.9, 0]} m={M("#e8e0cc", null, 0.9)} />
      {[[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]].map(([x, z], i) => <Cy key={i} r={0.04} h={0.6} p={[x, 0.3, z]} m={M("#3a3a44", null, 0.4)} s={6} />)}
      <Bx g={[0.08, 0.9, 1.3]} p={[-1.3, 0.95, 0]} m={M("#3a3a44", null, 0.4)} />
    </group>
    {/* little table with a bread crust */}
    <group position={[2.9, 0, -1.2]}>
      <Cy r={0.5} h={0.06} p={[0, 0.95, 0]} m={M("#7a5230", null, 0.7)} s={16} /><Cy r={0.05} h={0.95} p={[0, 0.47, 0]} m={M("#4a3220", null, 0.7)} s={6} />
      <Cy r={0.22} h={0.03} p={[0, 1.0, 0]} m={M("#e8e0d0", null, 0.4)} s={16} cast={false} /><Sp r={0.1} p={[0.02, 1.05, 0]} m={M("#b57a3a", null, 0.9)} sc={[1.6, 0.7, 0.9]} />
      <Cy r={0.07} h={0.2} p={[0.3, 1.1, 0.1]} m={M("#c8b890", null, 0.6)} s={10} />
    </group>
    <Bx g={[0.5, 0.5, 0.5]} p={[-1.0, 0.25, 1.5]} m={M("#6a4a2a", null, 0.8)} r={[0, 0.4, 0]} />
    <hemisphereLight args={["#7a88c8", "#2a2024", 0.7]} />
  </group>
));

/** ============================ DESK: top-down forging, envelopes slide in ============================ */
export const Desk: React.FC<{ t: number; cam: V3 }> = ({ t, cam }) => {
  const names = ["POISSON", "DUBOIS", "MARTIN", "LEROY", "GIRARD", "ROUX"];
  const stampK = (t0: number) => { const u = (t - t0) % 1.1; return u < 0.12 ? 1 - u / 0.12 : u < 0.28 ? (u - 0.12) / 0.16 * 0 : 0; };
  void stampK;
  const tS = ss(4) + 0.4; const st = (t - tS) % 1.2; const stampY = 1.18 + (st > 0 && st < 0.5 ? Math.abs(Math.cos(st / 0.5 * Math.PI)) * 0.55 : 0.55);
  return (
    <group>
      <fog attach="fog" args={["#1a1210", 8, 18]} /><color attach="background" args={["#1a1210"]} />
      <Bx g={[10, 0.3, 6]} p={[0, 0.9, 0]} m={M("#ffffff", tx("deskwood", 2, 1.2), 0.5)} />
      <Bx g={[4.2, 0.03, 2.8]} p={[0, 1.07, 0.2]} m={M("#ffffff", tx("felt"), 0.9)} />
      <mesh position={[-0.3, 1.1, 0.2]} rotation={[-Math.PI / 2, 0, 0.08]}><planeGeometry args={[1.5, 2.0]} /><meshStandardMaterial map={tx("paper")} roughness={0.9} /></mesh>
      <mesh position={[0.5, 1.103, 0.4]} rotation={[-Math.PI / 2, 0, -0.2]}><planeGeometry args={[1.4, 1.9]} /><meshStandardMaterial map={tx("paper")} roughness={0.9} /></mesh>
      {/* envelopes sliding in one by one */}
      {names.map((n, i) => { const t0 = ss(4) + 1.6 + i * 0.45; const u = sm((t - t0) / 0.7); const x = -3.5 + (i % 3) * 1.45 + 2.4; const z = -2.4 + Math.floor(i / 3) * 0.95 + 4.0; return (
        <mesh key={i} position={[x + (1 - u) * 6, 1.11 + i * 0.004, z + 0.2]} rotation={[-Math.PI / 2, 0, (i - 2.5) * 0.06 - (1 - u) * 0.6]}><planeGeometry args={[1.3, 0.8]} /><meshStandardMaterial map={tx("envelope")} roughness={0.9} /></mesh>); })}
      {names.map((n, i) => { const t0 = ss(4) + 1.6 + i * 0.45; const u = sm((t - t0) / 0.7); const x = -3.5 + (i % 3) * 1.45 + 2.4; const z = -2.4 + Math.floor(i / 3) * 0.95 + 4.0; return <NameTag key={`n${i}`} name={n} p={[x + (1 - u) * 6, 1.125 + i * 0.004, z + 0.2]} rot={(i - 2.5) * 0.06 - (1 - u) * 0.6} />; })}
      {/* stamp + ink pad */}
      <group position={[0.2, 0, 0.45]}>
        <Bx g={[0.9, 0.12, 0.7]} p={[1.2, 1.17, 1.0]} m={M("#6a1e22", null, 0.8)} />
        <group position={[-0.1, stampY, 0.2]}><Cy r={0.2} h={0.45} p={[0, 0.2, 0]} m={M("#a8743a", null, 0.4)} s={14} /><Cy r={0.3} h={0.14} p={[0, -0.04, 0]} m={M("#c4382e", null, 0.5)} s={14} /></group>
      </group>
      {/* brass lamp, ink pot, quill, candle + wax seal stick */}
      <group position={[-3.6, 1.05, -1.2]}><Cy r={0.5} h={0.12} p={[0, 0.06, 0]} m={M("#b8923a", null, 0.35, undefined, 1, { metalness: 0.5 })} s={20} /><Cy r={0.07} h={1.4} p={[0, 0.8, 0]} m={M("#b8923a", null, 0.35)} s={8} /><mesh position={[0, 1.65, 0]} geometry={memo("shade", () => new THREE.ConeGeometry(0.62, 0.55, 24, 1, true))} material={M("#1f6a4a", null, 0.5, "#0a3a22", 0.6, { side: THREE.DoubleSide })} /><Glow p={[0, 1.4, 0]} s={6} c="#ffd08a" o={0.5} />
        <pointLight color="#ffc678" intensity={36} distance={12} decay={1.5} position={[0, 1.4, 0.3]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} /></group>
      <group position={[3.2, 1.07, -1.0]}><Cy r={0.22} h={0.3} p={[0, 0.15, 0]} m={M("#1a1a22", null, 0.2, undefined, 1, { metalness: 0.4 })} s={14} /><Bx g={[0.04, 1.0, 0.04]} p={[0.2, 0.7, 0.0]} m={M("#f4efe6", null, 0.5)} r={[0, 0, -0.5]} /></group>
      <group position={[3.6, 1.07, 1.0]}><Cy r={0.12} h={0.5} p={[0, 0.25, 0]} m={M("#efe6cc", null, 0.8)} s={10} /><Sp r={0.06} p={[0, 0.58 + Math.sin(t * 9) * 0.01, 0]} m={BM("#ffd27a")} sc={[0.6, 1.5, 0.6]} /><Glow p={[0, 0.6, 0]} s={1.6} c="#ffb860" o={0.8} /><pointLight color="#ff9a50" intensity={4} distance={6} decay={1.6} position={[0, 0.7, 0.2]} /></group>
      {/* Victor behind the desk */}
      <Char look="victor" expr={t < ss(4) + 3.4 ? "smug" : "grin"} t={t} p={[0, 0.0, -3.2]} cam={cam} scale={1.35} pose="hold" tint="#ffd9b0" seed={5} />
      <hemisphereLight args={["#6a5a50", "#1a1210", 0.4]} />
    </group>
  );
};
const NameTag: React.FC<{ name: string; p: V3; rot: number }> = ({ name, p, rot }) => {
  const m = memo(`nt${name}`, () => { const c = document.createElement("canvas"); c.width = 256; c.height = 96; const g = c.getContext("2d")!; g.fillStyle = "#2a1a12"; g.font = "700 46px 'Playfair Display', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, 128, 54); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }); });
  return <mesh position={p} rotation={[-Math.PI / 2, 0, rot]} material={m}><planeGeometry args={[1.1, 0.42]} /></mesh>;
};
export { clamp };
