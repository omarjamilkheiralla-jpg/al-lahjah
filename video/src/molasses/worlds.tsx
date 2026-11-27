import * as THREE from "three";
import React from "react";
import { Bx, Cy, Sp, Glow, Char, M, BM, BG, PG, Lit, memo, rnd, type V3 } from "../eiffel/kit";
import { tx2 } from "./tex";
import { tx } from "../eiffel/tex";
import { wt, ss, se, clamp, sm, pop } from "./timeline";

const MOL = () => memo("molMat", () => new THREE.MeshStandardMaterial({ vertexColors: true, color: "#ffffff", roughness: 0.4, metalness: 0.05, emissive: "#5a2a0c", emissiveIntensity: 0.8 }));
const MOLF = () => M("#6a3410", null, 0.14, "#4a2208", 0.9, { metalness: 0.15 });
export const WAVE_SPEED = 19;
const moundGeo = (sx: number, sy: number, sz: number, seed: number) => memo(`mound${sx}${sy}${sz}${seed}`, () => {
  const g = new THREE.IcosahedronGeometry(1, 5); const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); const lo = new THREE.Color("#5a2a0e"), hi = new THREE.Color("#d0832e");
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const n = Math.sin(x * 4.1 + seed) * 0.05 + Math.sin(y * 5.3 + z * 3.7 + seed * 2) * 0.05 + Math.sin(x * 9 + z * 8) * 0.02; const k = 1 + n;
    x *= sx * k; y *= sy * k; z *= sz * k; pos.setXYZ(i, x, y, z); const c = lo.clone().lerp(hi, Math.min(1, Math.max(0, (y / sy + 0.2) * 0.8)) ** 1.6); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
});
const waveGeo = () => memo("waveGeo2", () => {
  const sh = new THREE.Shape(); const P: [number, number][] = [[-11, 0], [-11, 2.6], [-7, 5.6], [-3.2, 8.4], [-0.4, 10.0], [1.8, 10.2], [3.4, 9.2], [3.6, 7.6], [2.8, 6.4], [3.4, 4.6], [3.2, 2.0], [4.0, 0]];
  sh.moveTo(-P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) sh.lineTo(-P[i][0], P[i][1]); sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 14.6, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.9, bevelSegments: 6, curveSegments: 8 }); g.translate(0, 0, -7.3); g.rotateY(Math.PI / 2);
  const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); const lo = new THREE.Color("#4a200a"), hi = new THREE.Color("#b8742a");
  for (let i = 0; i < pos.count; i++) { const k = Math.min(1, Math.max(0, pos.getY(i) / 10.4)); const c = lo.clone().lerp(hi, k ** 1.5); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
});
const frontZ = (t: number, tw: number | null) => (tw === null || t < tw ? -56 : Math.min(80, -56 + (t - tw) * WAVE_SPEED));

const Horse: React.FC<{ p: V3; ry: number; t: number }> = ({ p, ry, t }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Bx g={[0.9, 1.0, 2.3]} p={[0, 1.7, 0]} m={M("#6a3e22", null, 0.8)} />
    {[[-0.3, -0.85], [0.3, -0.85], [-0.3, 0.85], [0.3, 0.85]].map(([x, z], i) => <Bx key={i} g={[0.2, 1.3, 0.2]} p={[x, 0.65, z]} m={M("#4a2a16", null, 0.8)} r={[Math.sin(t * 2 + i) * 0.05, 0, 0]} />)}
    <Bx g={[0.4, 1.2, 0.5]} p={[0, 2.3, 1.2]} m={M("#6a3e22", null, 0.8)} r={[0.5, 0, 0]} /><Bx g={[0.4, 0.4, 0.8]} p={[0, 2.8, 1.65]} m={M("#6a3e22", null, 0.8)} r={[0.3, 0, 0]} />
    <Bx g={[0.08, 0.7, 0.5]} p={[0, 2.5, 0.75]} m={M("#1c1410", null, 0.9)} /><Bx g={[0.15, 0.9, 0.15]} p={[0, 1.4, -1.25]} m={M("#1c1410", null, 0.9)} r={[0.3 + Math.sin(t * 2) * 0.1, 0, 0]} />
  </group>
);
const Cart: React.FC<{ p: V3; t: number }> = ({ p, t }) => (
  <group position={p}>
    <Horse p={[0, 0, 2.6]} ry={0} t={t} />
    <Bx g={[2.2, 0.3, 3.4]} p={[0, 1.1, -0.6]} m={M("#6a4a2a", null, 0.8)} /><Bx g={[2.2, 0.8, 0.12]} p={[0, 1.6, -2.2]} m={M("#6a4a2a", null, 0.8)} />
    {[-1.05, 1.05].map((x) => [-1.4, 0.2].map((z, k) => <Cy key={`${x}${k}`} r={0.62} h={0.12} p={[x, 0.62, z]} m={M("#2a2018", null, 0.7)} rot={[0, 0, Math.PI / 2]} s={14} />))}
    {[-0.5, 0.5].map((x) => <group key={x}><Cy r={0.4} h={0.8} p={[x, 1.7, -0.9]} m={M("#7a5230", null, 0.8)} s={12} /><Cy r={0.41} h={0.06} p={[x, 1.9, -0.9]} m={M("#2a2018", null, 0.7)} s={12} /></group>)}
  </group>
);
const Lamp: React.FC<{ p: V3; dusk: boolean }> = ({ p, dusk }) => (
  <group position={p}>
    <Cy r={0.09} rb={0.15} h={4.8} p={[0, 2.4, 0]} m={M("#1c1d22", null, 0.5)} s={8} /><Bx g={[0.5, 0.7, 0.5]} p={[0, 5.1, 0]} m={M("#fff0c0", null, 0.3, "#ffbe5a", dusk ? 2.4 : 0.9)} cast={false} /><Bx g={[0.66, 0.12, 0.66]} p={[0, 5.55, 0]} m={M("#1c1d22", null, 0.5)} cast={false} />
    <Glow p={[0, 5.1, 0]} s={dusk ? 6.5 : 3} c="#ffbe6a" o={dusk ? 0.85 : 0.35} />
  </group>
);

const BostonStatic = React.memo(({ dusk }: { dusk: boolean }) => {
  const r = rnd(23); const bld: React.ReactNode[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
    const z = 38 - i * 14.2; const v = (i + (side < 0 ? 0 : 1)) % 3; const x = side * 16; const h = 19 + r() * 3;
    const plain = M("#8a4636", null, 0.95); const mats = (() => { const face = Lit(tx2(["brick1", "brick2", "brick3"][v]), dusk ? "#8890b0" : "#ffffff", dusk ? 0.6 : 0.4, 0.9); return side < 0 ? [face, plain, plain, plain, plain, plain] : [plain, face, plain, plain, plain, plain]; })();
    bld.push(<mesh key={`b${side}${i}`} geometry={BG(14, h, 14.2)} material={mats as any} position={[x, h / 2, z]} castShadow receiveShadow />);
    bld.push(<Bx key={`s${side}${i}`} g={[14.6, 0.5, 14.6]} p={[x, h + 0.2, z]} m={M("#eef2fa", null, 0.9)} cast={false} />);
    for (let c = 0; c < 2; c++) bld.push(<group key={`c${side}${i}${c}`} position={[x + (r() - 0.5) * 6, h + 1.4, z + (c - 0.5) * 5]}><Bx g={[1.3, 2.6, 1.3]} p={[0, 0, 0]} m={M("#7a3a2c", null, 0.9)} /><Bx g={[1.5, 0.3, 1.5]} p={[0, 1.4, 0]} m={M("#eef2fa", null, 0.9)} cast={false} /><Glow p={[0, 3.4, 0]} s={3 + r() * 2} c="#e8e4ea" o={0.16} /></group>);
  }
  const far: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) { const x = -66 + i * 12; const h = 10 + r() * 9; far.push(<mesh key={i} geometry={BG(11, h, 10)} material={Lit(tx2(["brick1", "brick2", "brick3"][i % 3]), dusk ? "#7078a0" : "#d8dcec", dusk ? 0.5 : 0.2)} position={[x, h / 2, -108 - r() * 12]} />); }
  return (
    <group>
      <mesh position={[0, 0, 0]}><sphereGeometry args={[320, 32, 24]} /><meshBasicMaterial map={tx2(dusk ? "skyDuskB" : "skyDay")} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -30]} receiveShadow><planeGeometry args={[240, 240]} /><meshStandardMaterial map={tx2("snowCobble", 48, 48)} roughness={0.8} color={dusk ? "#8890b8" : "#ffffff"} emissive="#aab4c8" emissiveMap={tx2("snowCobble", 48, 48)} emissiveIntensity={dusk ? 0.1 : 0.5} /></mesh>
      {[-1, 1].map((s) => <Bx key={s} g={[3.4, 0.3, 200]} p={[s * 9.2, 0.14, -30]} m={M("#eaf0fa", null, 0.9)} />)}
      {[-1, 1].map((s) => <Bx key={`k${s}`} g={[0.3, 0.34, 200]} p={[s * 7.5, 0.16, -30]} m={M("#7a7a88", null, 0.8)} />)}
      {bld}{far}
      {/* harbour on the right with ships */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[75, 0.02, -60]}><planeGeometry args={[100, 200]} /><meshStandardMaterial map={tx2("water", 14, 22)} roughness={0.2} metalness={0.3} color={dusk ? "#6a7aa8" : "#ffffff"} /></mesh>
      {[[48, -40], [58, -80], [66, -10]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Bx g={[3, 1.6, 12]} p={[0, 0.8, 0]} m={M("#2a2a34", null, 0.7)} /><Cy r={0.12} h={11} p={[0, 6, -1]} m={M("#4a3a2a", null, 0.8)} s={6} /><Bx g={[0.1, 6, 3.8]} p={[0, 6, -1]} m={M("#e8e0cc", null, 0.9)} /></group>)}
      <Lamp p={[-8, 0, 28]} dusk={dusk} /><Lamp p={[8, 0, 12]} dusk={dusk} /><Lamp p={[-8, 0, -6]} dusk={dusk} /><Lamp p={[8, 0, -26]} dusk={dusk} /><Lamp p={[-8, 0, -40]} dusk={dusk} />
      <hemisphereLight args={dusk ? ["#6a7ab8", "#3a3a4a", 1.1] : ["#c8d8f0", "#a09088", 1.5]} />
      <directionalLight color={dusk ? "#8aa0ff" : "#ffe2b8"} intensity={dusk ? 0.9 : 3.6} position={[26, 24, 44]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50} shadow-camera-near={1} shadow-camera-far={160} shadow-bias={-0.0006} />
      <directionalLight color={dusk ? "#ff9a6a" : "#ffd8a8"} intensity={dusk ? 0.6 : 1.2} position={[-30, 14, -60]} />
      {dusk ? <><pointLight color="#ffc47a" intensity={34} distance={22} decay={1.6} position={[-6, 5, 10]} /><pointLight color="#ffc47a" intensity={34} distance={22} decay={1.6} position={[6, 5, -22]} /></> : null}
    </group>
  );
});
const Tank: React.FC<{ t: number; paint: number; burst: number | null; shake: number }> = ({ t, paint, burst, shake }) => {
  const sh = shake * (Math.sin(t * 61) * 0.06 + Math.sin(t * 37) * 0.05);
  return (
    <group position={[sh, 0, -70]}>
      <mesh position={[0, 10, 0]} castShadow receiveShadow><cylinderGeometry args={[16, 16, 20, 56, 1]} /><meshStandardMaterial map={tx2("tank", 9, 1)} roughness={0.6} metalness={0.15} color="#e8c8a8" emissive="#6a4a34" emissiveMap={tx2("tank", 9, 1)} emissiveIntensity={0.55} /></mesh>
      <Cy r={0.5} rb={16.2} h={3.2} p={[0, 21.6, 0]} m={M("#4a3224", null, 0.6, undefined, 1, { metalness: 0.2 })} s={56} />
      {[3, 7, 11, 15, 19].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[16.1, 0.16, 6, 56]} /><meshStandardMaterial color="#3a281c" roughness={0.5} metalness={0.4} /></mesh>)}
      <Cy r={16.8} h={0.9} p={[0, 0.45, 0]} m={M("#6a6a74", null, 0.9)} s={56} />
      <Bx g={[6.4, 2.2, 0.16]} p={[0, 15.5, 16.1]} m={M("#ffffff", tx2("purity"), 0.7)} />
      {[3.4, 5.2].map((x) => <Bx key={x} g={[0.16, 18, 0.1]} p={[x, 9.5, 16.1]} m={M("#1a1a1e", null, 0.6)} />)}
      {/* rust patch that the paint covers */}
      <mesh position={[0, 4.3, 16.14]}><planeGeometry args={[14, 5.6]} /><meshStandardMaterial color="#a8602e" roughness={0.9} emissive="#2a1004" emissiveIntensity={0.3} /></mesh>
      {paint > 0 ? <mesh position={[-7 + paint * 7, 4.3, 16.2]}><planeGeometry args={[14 * paint, 5.6]} /><meshStandardMaterial color="#5a3a24" roughness={0.6} /></mesh> : null}
      {/* gash after the burst */}
      {burst !== null && t > burst ? <group position={[0, 5, 16.22]}><mesh><planeGeometry args={[10 * Math.min(1, (t - burst) * 6), 9]} /><meshBasicMaterial color="#120804" /></mesh><Glow p={[0, 0, 0.3]} s={14} c="#6a3010" o={0.6} /></group> : null}
    </group>
  );
};
const Leak: React.FC<{ t: number; on: boolean }> = ({ t, on }) => {
  if (!on) return null; const drips = [-4.8, -2.4, -0.4, 1.8, 3.6, 5.4];
  return (
    <group position={[0, 0, -70]}>
      {drips.map((x, i) => { const u = ((t * (0.5 + (i % 3) * 0.12) + i * 0.31) % 1); const y = 6.4 - u * u * 6.2; return (
        <group key={i}>
          <mesh position={[x, 3.4, 16.18]}><planeGeometry args={[0.16, 6.2]} /><meshStandardMaterial color="#5a2c0e" roughness={0.2} metalness={0.2} transparent opacity={0.55} /></mesh>
          <mesh position={[x, y, 16.35]} scale={[1, 1.6, 1]}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color="#7a3c12" roughness={0.12} metalness={0.3} emissive="#6a3410" emissiveIntensity={0.8} /></mesh>
          <mesh position={[x, 0.14, 17.2]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.7 + 0.3 * Math.sin(t + i), 16]} /><meshStandardMaterial color="#2a1206" roughness={0.1} metalness={0.3} /></mesh>
        </group>); })}
    </group>
  );
};
const Splat: React.FC<{ t: number; z0: number }> = ({ t, z0 }) => {
  const r = React.useMemo(() => { const q = rnd(5); return Array.from({ length: 36 }, () => ({ x: (q() - 0.5) * 14, dz: 1 + q() * 6, h: 3 + q() * 8, s: 0.25 + q() * 0.5, ph: q() })); }, []);
  return <>{r.map((c, i) => { const u = ((t * 1.4 + c.ph) % 1); return <mesh key={i} position={[c.x, 1 + Math.sin(u * Math.PI) * c.h, z0 + c.dz + u * 6]}><sphereGeometry args={[c.s * 0.45, 8, 6]} /><meshStandardMaterial color="#8a4414" roughness={0.18} emissive="#4a2208" emissiveIntensity={0.7} /></mesh>; })}</>;
};
export type BostonProps = { t: number; cam: V3; tw?: number | null; paint?: number; leak?: boolean; flooded?: boolean; dusk?: boolean; shake?: number; burst?: number | null; showFolk?: "day" | "run" | "after" | "kids" | "none"; lanternsAt?: number | null; sign?: boolean };
export const Boston: React.FC<BostonProps> = ({ t, cam, tw = null, paint = 1, leak = true, flooded = false, dusk = false, shake = 0, burst = null, showFolk = "day", lanternsAt = null, sign = false }) => {
  const zf = frontZ(t, tw); const waving = tw !== null && t >= tw;
  const floodEnd = flooded ? 70 : waving ? zf - 7 : -56; const floodLen = Math.max(0.01, floodEnd + 56);
  const folk: React.ReactNode[] = [];
  const looks = ["dealer", "poisson", "gendarme", "pullman", "dealer2", "dealer"];
  if (showFolk === "day") {
    folk.push(<Char key="a" look="dealer2" expr="smile" t={t} p={[-5, 0, 16]} cam={cam} scale={1} tint="#ffeedd" seed={3} pose="idle" />, <Char key="b" look="poisson" expr="smug" t={t} p={[5.5, 0, 8]} cam={cam} scale={1} tint="#ffeedd" seed={4} pose="idle" />, <Char key="c" look="cap" expr="grin" t={t} p={[-2, 0, 6]} cam={cam} scale={0.62} tint="#ffeedd" seed={6} pose="cheer" />, <Char key="d" look="pullman" expr="deadpan" t={t} p={[3, 0, 24]} cam={cam} scale={1} tint="#ffeedd" seed={7} pose="walk" gait={0.9} amp={1} />, <Cart key="cart" p={[-3.2, 0, -12]} t={t} />);
  }
  if (showFolk === "kids") {
    const cup = <mesh position={[0, -0.12, 0.05]}><cylinderGeometry args={[0.1, 0.07, 0.16, 10]} /><meshBasicMaterial color="#c8c0b0" /></mesh>;
    folk.push(<Char key="k1" look="cap" expr="grin" t={t} p={[-3.8, 0, -50.4]} cam={cam} scale={0.7} tint="#ffeedd" seed={6} pose="hold" handR={cup} />, <Char key="k2" look="dealer2" expr="smile" t={t} p={[0.2, 0, -49.2]} cam={cam} scale={1} tint="#ffeedd" seed={9} pose="hold" handR={cup} />, <Char key="k3" look="gendarme" expr="smile" t={t} p={[4.2, 0, -50.8]} cam={cam} scale={0.8} tint="#ffeedd" seed={11} pose="hold" handR={cup} />);
  }
  if (showFolk === "run") {
    const rn = [[-3, 0], [3.2, 1], [-0.5, 2], [2, 3], [-5, 4], [5.5, 5]];
    rn.forEach(([x, k], i) => { const z0 = -30 + (k as number) * 7 - (k as number) * 3; const z = z0 + (t - (tw ?? 0)) * 9.0 * (1 - (k as number) * 0.05); if (z > zf - 3) return; folk.push(<Char key={`r${i}`} look={looks[i % 6]} expr="shock" t={t} p={[x as number, 0, z]} cam={cam} scale={1} tint="#ffeedd" seed={20 + i} pose="walk" gait={3.0} amp={2.6} lean={0.1} />); });
  }
  if (showFolk === "after") {
    [[-3, 8, 1.15], [3.5, 3, 1.2], [-1, -6, 1.1], [5, -14, 1.2], [-5.5, 18, 1.2]].forEach(([x, z, sit], i) => folk.push(<Char key={`s${i}`} look={looks[i % 6]} expr="worried" t={t} p={[x, 0, z]} cam={cam} scale={1} sit={sit} tint="#ffeedd" seed={30 + i} pose="cheer" shadow={false} />));
  }
  return (
    <group>
      <fog attach="fog" args={[dusk ? "#3a3a5a" : "#cfd8e6", dusk ? 30 : 60, dusk ? 160 : 260]} /><color attach="background" args={[dusk ? "#2a2a44" : "#cfd8e6"]} />
      <BostonStatic dusk={dusk} />
      <Tank t={t} paint={paint} burst={burst} shake={shake} /><Leak t={t} on={leak} />
      {/* the molasses: flood sheet + the wave */}
      {(waving || flooded) ? <mesh material={MOLF()} position={[0, 0.34, -56 + floodLen / 2]} scale={[1, 1, 1]}><boxGeometry args={[16, 0.68, floodLen]} /></mesh> : null}
      {(waving || flooded) ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.7, -56 + floodLen / 2]}><planeGeometry args={[16, floodLen]} /><meshStandardMaterial color="#7a3c12" roughness={0.08} metalness={0.4} emissive="#4a2208" emissiveIntensity={0.8} /></mesh> : null}
      {waving && zf < 70 ? <group position={[0, 0, zf - 3.4]}><mesh geometry={waveGeo()} material={MOL()} castShadow />{Array.from({ length: 7 }, (_, i) => <mesh key={i} geometry={moundGeo(1.5, 1.1, 1.4, i)} material={MOL()} position={[-6 + i * 2, 9.4 + Math.sin(t * 4 + i) * 0.3, 2.2]} />)}<Splat t={t} z0={1} /><Glow p={[0, 9, 2]} s={12} c="#ff9a50" o={0.18} /></group> : null}
      {folk}
      {/* 21 lanterns, one for each person */}
      {lanternsAt !== null ? Array.from({ length: 21 }, (_, i) => { const k = clamp((t - (lanternsAt + i * 0.11)) / 0.35); const row = i % 3, col = Math.floor(i / 3); return k > 0 ? <group key={i} position={[(row - 1) * 3.2, 0.95 + Math.sin(t * 1.6 + i) * 0.04, 8 - col * 5.6]} scale={[k, k, k]}><Cy r={0.16} h={0.3} p={[0, 0.15, 0]} m={M("#fff0c8", null, 0.4, "#ffa830", 2.2)} s={10} cast={false} /><Glow p={[0, 0.25, 0]} s={1.7} c="#ffb860" o={0.85} /></group> : null; }) : null}
      {sign ? <group position={[0, 0, 2]}><Cy r={0.1} h={3.4} p={[0, 1.7, 0]} m={M("#4a3a2a", null, 0.8)} s={8} /><Bx g={[3.6, 1.8, 0.12]} p={[0, 3.6, 0]} m={M("#ffffff", tx2("slowSign"), 0.6)} /></group> : null}
    </group>
  );
};

/** ======================= CAR dashboard, first person ======================= */
export const Car: React.FC<{ t: number }> = ({ t }) => {
  const t0 = wt(10, 13) - 0.2, tape = sm((t - t0) / 1.4); const blink = t < t0 + 1.0 ? (Math.sin(t * 7) > -0.2 ? 1 : 0.15) : 0;
  return (
    <group>
      <fog attach="fog" args={["#20202c", 8, 30]} /><color attach="background" args={["#20202c"]} />
      <mesh position={[0, 0.3, -9]}><planeGeometry args={[22, 9]} /><meshBasicMaterial map={tx2("skyDay")} /></mesh>
      <Bx g={[5, 0.4, 3.4]} p={[0, -1.1, -1.0]} m={M("#14121a", null, 0.6)} />
      <mesh position={[0, -0.1, -1.55]} rotation={[-0.38, 0, 0]}><planeGeometry args={[3.6, 1.8]} /><meshStandardMaterial map={tx2("dash")} roughness={0.35} emissive="#ffffff" emissiveMap={tx2("dash")} emissiveIntensity={0.9} /></mesh>
      <mesh position={[0, 0.0, -1.5]} rotation={[-0.38, 0, 0]}><planeGeometry args={[0.9, 0.9]} /><meshBasicMaterial map={tx2("engine")} transparent opacity={blink} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {blink > 0.5 ? <Glow p={[0, 0.1, -1.4]} s={1.0} c="#ffb000" o={0.55} /> : null}
      {tape > 0 ? <mesh position={[0.9 - tape * 0.9, 0.01, -1.47]} rotation={[-0.38, 0, 0.08]}><planeGeometry args={[0.9, 0.2]} /><meshStandardMaterial map={tx2("tape")} roughness={0.5} /></mesh> : null}
      <mesh position={[0, -1.25, -0.2]} rotation={[-1.1, 0, 0]}><torusGeometry args={[0.95, 0.11, 10, 40]} /><meshStandardMaterial color="#0e0e12" roughness={0.45} /></mesh>
      {/* the hand comes in with a roll of tape */}
      <group position={[1.4 - sm((t - (t0 - 0.9)) / 0.9) * 1.0 + sm((t - (t0 + 1.6)) / 0.6) * 1.2, -0.12 + sm((t - t0) / 1.4) * 0.0, -1.0]} rotation={[0, 0, 0.3]}>
        <Cy r={0.2} h={1.1} p={[0.6, -0.1, 0.1]} m={M("#2a3a6a", null, 0.9)} rot={[0, 0, Math.PI / 2 - 0.2]} s={12} />
        <Sp r={0.22} p={[0, 0, 0]} m={M("#f0c8a0", null, 0.7)} sc={[1.2, 0.8, 1]} /><Sp r={0.1} p={[-0.05, 0.1, 0.2]} m={M("#f0c8a0", null, 0.7)} />
        <mesh position={[-0.1, -0.1, 0.1]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.13, 0.05, 8, 18]} /><meshStandardMaterial color="#18181c" /></mesh>
      </group>
      <hemisphereLight args={["#9aa8c8", "#3a3036", 0.9]} /><pointLight color="#ffcf8a" intensity={14} distance={9} decay={1.6} position={[0, 1.6, -0.4]} />
    </group>
  );
};

/** ======================= COURT ======================= */
export const Court: React.FC<{ t: number; cam: V3 }> = ({ t, cam }) => {
  const tG = ss(13) + 0.25; const tS = wt(13, 12); const gav = clamp((t - tG) / 0.25); const stamp = pop((t - tS) / 0.3); const sSc = t < tS ? 0.0001 : Math.max(0.0001, 1.9 - 0.9 * Math.min(1, (t - tS) / 0.12));
  void gav; void stamp;
  const rows: React.ReactNode[] = [];
  const looks = ["dealer", "poisson", "dealer2", "pullman", "gendarme", "dealer"];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rows.push(<Char key={`g${r}${c}`} look={looks[(r * 4 + c) % 6]} expr={(r + c) % 3 === 0 ? "worried" : "sad"} t={t} p={[-4.5 + c * 3.0 + (r % 2) * 0.8, 0, 6 + r * 2.8]} cam={cam} sit={0.2} scale={0.95} tint="#ffe0c0" seed={40 + r * 4 + c} />);
  return (
    <group>
      <fog attach="fog" args={["#140e0c", 14, 34]} /><color attach="background" args={["#140e0c"]} />
      <Bx g={[24, 0.2, 24]} p={[0, -0.1, 0]} m={M("#ffffff", tx("parquet", 5, 5), 0.4)} />
      <Bx g={[24, 9, 0.3]} p={[0, 4.5, -7]} m={M("#ffffff", tx("panel", 10, 3), 0.5)} />
      <Bx g={[0.3, 9, 24]} p={[-10, 4.5, 0]} m={M("#ffffff", tx("panel", 8, 3), 0.5)} /><Bx g={[0.3, 9, 24]} p={[10, 4.5, 0]} m={M("#ffffff", tx("panel", 8, 3), 0.5)} />
      {[-6, 6].map((x) => <group key={x} position={[x, 0, -6.8]}><mesh position={[0, 4.6, 0]}><planeGeometry args={[2.6, 4.6]} /><meshBasicMaterial map={tx2("skyDay")} /></mesh><Bx g={[2.9, 0.18, 0.3]} p={[0, 2.2, 0.1]} m={M("#c9a24a", null, 0.4)} /><pointLight color="#cfe0ff" intensity={30} distance={14} decay={1.6} position={[0, 4.5, 1]} /></group>)}
      {/* judge's bench */}
      <Bx g={[7, 2.4, 1.6]} p={[0, 1.2, -4.6]} m={M("#ffffff", tx("panel", 3, 1), 0.5)} /><Bx g={[7.4, 0.2, 2.0]} p={[0, 2.5, -4.6]} m={M("#4a2a18", null, 0.5)} />
      <Char look="pullman" expr="deadpan" t={t} p={[0, 0, -5.2]} cam={cam} scale={1.05} sit={-0.9} tint="#ffe0c0" seed={2} pose={t > tG && t < tG + 0.4 ? "shake" : "idle"} />
      <Bx g={[0.7, 0.14, 0.7]} p={[1.6, 2.65, -4.4]} m={M("#4a2a18", null, 0.5)} /><Bx g={[0.1, 0.1, 0.6]} p={[1.7 + (t > tG && t < tG + 0.15 ? -0.1 : 0), 2.9 + (t > tG && t < tG + 0.12 ? 0.4 : 0), -4.4]} m={M("#2a1a10", null, 0.5)} />
      {/* witness stand + the engineer with the blueprint */}
      <Bx g={[2.4, 1.3, 1.4]} p={[-5, 0.65, -2.2]} m={M("#ffffff", tx("panel", 1, 1), 0.5)} />
      <Char look="glasses" expr="smile" t={t} p={[-5, 0, -2.8]} cam={cam} scale={1.0} sit={-0.1} tint="#ffe0c0" seed={9} pose="hold" />
      {/* the desk with the blueprint and the SIGNED stamp */}
      <Bx g={[5.2, 0.18, 2.8]} p={[1.6, 1.2, 0.6]} m={M("#ffffff", tx("deskwood", 2, 1), 0.5)} /><Bx g={[0.2, 1.2, 2.6]} p={[-0.9, 0.6, 0.6]} m={M("#4a2a18", null, 0.6)} /><Bx g={[0.2, 1.2, 2.6]} p={[4.1, 0.6, 0.6]} m={M("#4a2a18", null, 0.6)} />
      <mesh position={[1.6, 1.31, 0.6]} rotation={[-Math.PI / 2, 0, 0.05]}><planeGeometry args={[3.4, 2.55]} /><meshStandardMaterial map={tx2("blueprint")} roughness={0.8} emissive="#16408a" emissiveIntensity={0.4} emissiveMap={tx2("blueprint")} /></mesh>
      <mesh position={[2.3, 1.33, 1.4]} rotation={[-Math.PI / 2, 0, -0.18]} scale={[sSc, sSc, sSc]}><planeGeometry args={[1.5, 0.47]} /><meshBasicMaterial map={tx2("signed")} transparent depthWrite={false} /></mesh>
      {rows}
      {Array.from({ length: 4 }, (_, r) => <Bx key={r} g={[16, 0.4, 0.9]} p={[0, 0.5, 5.2 + r * 2.8]} m={M("#4a2a18", null, 0.6)} />)}
      <pointLight color="#ffd9a0" intensity={60} distance={24} decay={1.4} position={[0, 7, 2]} />
      <pointLight color="#ffd9a0" intensity={30} distance={18} decay={1.5} position={[-4, 4, 6]} /><hemisphereLight args={["#b8a8a0", "#5a4234", 1.2]} />
    </group>
  );
};
export { se, ss };
