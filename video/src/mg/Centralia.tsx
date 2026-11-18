import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useDelayRender } from "remotion";
import { seeded } from "../style3/kit";
import TIM from "./timing.json";

/** Motion-graphics sample: "The town that has been on fire since 1962" (Centralia, Pennsylvania). 1080x1920, 30 fps, vector scenes + kinetic captions. */
export const FPS = 30;
export const CENT_TOTAL = (TIM as any).total as number;
const W = 1080, H = 1920;
const S = (TIM as any).sentences as { text: string; start: number; end: number; words: { w: string; t0: number; t1: number }[] }[];
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const rnd = "'Lilita One', 'Inter', Arial, sans-serif"; const sans = "Inter, Arial, sans-serif";
const EMBER = "#ff6a1f", AMBER = "#ffb347", CREAM = "#fff4dc";
const FONTS: [string, string, string][] = [["Lilita One", "fonts/LilitaOne-Regular.ttf", "400"], ["Inter", "fonts/inter-latin-700-normal.woff2", "700"], ["Inter", "fonts/inter-latin-900-normal.woff2", "900"]];
let fp: Promise<void> | null = null;
const loadFonts = () => (fp ??= Promise.all(FONTS.map(async ([f, p, w]) => { try { const ff = new FontFace(f, `url(${staticFile(p)})`, { weight: w }); await ff.load(); (document as any).fonts.add(ff); } catch { /* ignore */ } })).then(() => undefined));

/* ------------------------------------------------------------ shared drawing parts */
const Defs = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    <filter id="glowL" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="22" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    <filter id="blur30" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="30" /></filter>
    <filter id="blur10"><feGaussianBlur stdDeviation="10" /></filter>
    <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#06060f" /><stop offset="0.55" stopColor="#1a0e1f" /><stop offset="1" stopColor="#4a1c0c" /></linearGradient>
    <linearGradient id="earth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2416" /><stop offset="0.5" stopColor="#2a1a12" /><stop offset="1" stopColor="#1a0e0a" /></linearGradient>
    <radialGradient id="ember" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff2c0" /><stop offset="0.35" stopColor={AMBER} stopOpacity="0.9" /><stop offset="1" stopColor={EMBER} stopOpacity="0" /></radialGradient>
    <radialGradient id="smokeG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#8a8290" stopOpacity="0.8" /><stop offset="1" stopColor="#4a4450" stopOpacity="0" /></radialGradient>
  </defs>
);
const Stars: React.FC<{ t: number; n?: number }> = ({ t, n = 80 }) => { const r = seeded(3); return <g>{Array.from({ length: n }, (_, i) => { const x = r() * W, y = r() * 900, s = 1 + r() * 2.2, ph = r() * 6; return <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={0.35 + 0.35 * Math.sin(t * 1.5 + ph)} />; })}</g>; };
const Embers: React.FC<{ t: number; seed: number; n?: number; x0: number; x1: number; y0: number; rise?: number; speed?: number }> = ({ t, seed, n = 50, x0, x1, y0, rise = 900, speed = 0.18 }) => {
  const r = seeded(seed);
  return <g filter="url(#glow)">{Array.from({ length: n }, (_, i) => { const bx = mix(x0, x1, r()), ph = r(), sz = 2 + r() * 5, sw = 20 + r() * 40; const life = (t * speed * (0.6 + ph) + ph * 3) % 1; const x = bx + Math.sin(t * 0.9 + i) * sw * life, y = y0 - life * rise; return <circle key={i} cx={x} cy={y} r={sz * (1 - life * 0.7)} fill={life < 0.5 ? AMBER : EMBER} opacity={clamp((1 - life) * 1.4) * (0.6 + 0.4 * Math.sin(t * 12 + i))} />; })}</g>;
};
const Smoke: React.FC<{ t: number; x: number; y: number; seed: number; rise?: number; wd?: number; glowBase?: boolean }> = ({ t, x, y, seed, rise = 800, wd = 1, glowBase = true }) => {
  const r = seeded(seed);
  return <g>
    {glowBase ? <circle cx={x} cy={y} r={120 * wd} fill="url(#ember)" opacity={0.55 + 0.15 * Math.sin(t * 6 + seed)} /> : null}
    {Array.from({ length: 11 }, (_, i) => { const life = (t * 0.1 + i / 11 + seed * 0.07) % 1; const cx = x + Math.sin(life * 5 + i * 1.7) * 50 * life * wd + life * 90 * wd, cy = y - life * rise; const rad = (50 + life * 170) * wd; return <circle key={i} cx={cx} cy={cy} r={rad} fill="url(#smokeG)" opacity={0.75 * (1 - life) * clamp(life * 6)} />; })}
  </g>;
};
const Flame: React.FC<{ x: number; y: number; s: number; t: number; seed: number }> = ({ x, y, s, t, seed }) => {
  const fx = 1 + 0.12 * Math.sin(t * 9 + seed), fy = 1 + 0.22 * Math.sin(t * 7.3 + seed * 2);
  const P = "M0,0 C-46,-34 -36,-98 0,-165 C36,-98 46,-34 0,0Z";
  return <g transform={`translate(${x} ${y}) scale(${s * fx} ${s * fy})`} filter="url(#glow)"><path d={P} fill="#ff3d00" /><path d={P} fill="#ff8a1f" transform="scale(.72 .78)" /><path d={P} fill="#ffe08a" transform="scale(.4 .5)" /></g>;
};
const House: React.FC<{ x: number; y: number; s: number; t: number; seed: number; col?: string }> = ({ x, y, s, t, seed, col = "#0c0a12" }) => {
  const lit = Math.sin(t * 2 + seed * 3) > -0.6;
  return <g transform={`translate(${x} ${y}) scale(${s})`}><rect x={-60} y={-80} width={120} height={80} fill={col} /><path d="M-72,-80 L0,-135 L72,-80Z" fill={col} />{lit ? <rect x={-14} y={-58} width={28} height={30} fill={AMBER} opacity={0.9} filter="url(#glow)" /> : null}<rect x={36} y={-135} width={14} height={34} fill={col} /></g>;
};
const Txt: React.FC<{ x: number; y: number; size: number; fill?: string; anchor?: "middle" | "start" | "end"; stroke?: number; font?: string; ls?: number; opacity?: number; glow?: boolean; children: React.ReactNode; rot?: number; scale?: number }> = ({ x, y, size, fill = CREAM, anchor = "middle", stroke = 0, font = rnd, ls = 0, opacity = 1, glow, children, rot = 0, scale = 1 }) => (
  <text transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} textAnchor={anchor} fontFamily={font} fontSize={size} fill={fill} stroke={stroke ? "#000" : "none"} strokeWidth={stroke} paintOrder="stroke fill" strokeLinejoin="round" letterSpacing={ls} opacity={opacity} filter={glow ? "url(#glow)" : undefined}>{children}</text>
);
/** slam-in text: scale 1.6->1 with a small overshoot */
const slam = (p: number) => { const k = easeOut(p); return (1.5 - 0.5 * k) + (p > 0.6 ? Math.sin((p - 0.6) * 20) * 0.015 * (1 - p) : 0); };
const Cracks: React.FC<{ seed: number; x0: number; y0: number; w: number; n?: number; t: number; reveal?: number }> = ({ seed, x0, y0, w, n = 6, t, reveal = 1 }) => {
  const r = seeded(seed);
  return <g filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round" fill="none">{Array.from({ length: n }, (_, i) => { let x = x0 + r() * w, y = y0 + r() * 120; let d = `M${x},${y}`; const segs = 7; for (let k = 0; k < Math.floor(segs * reveal); k++) { x += (r() - 0.5) * 120; y += 30 + r() * 70; d += ` L${x},${y}`; } return <path key={i} d={d} stroke={i % 2 ? EMBER : AMBER} strokeWidth={5 + r() * 6} opacity={0.75 + 0.25 * Math.sin(t * 7 + i)} />; })}</g>;
};
const Town: React.FC<{ t: number; y: number; scale?: number; glow?: number }> = ({ t, y, scale = 1, glow = 1 }) => (
  <g>
    <path d={`M-100,${y + 160} Q250,${y - 40} 560,${y + 40} T1200,${y + 20} L1200,${y + 400} L-100,${y + 400}Z`} fill="#0a0810" />
    {[90, 230, 380, 520, 650, 790, 940].map((x, i) => <House key={i} x={x} y={y + 50 + (i % 3) * 18} s={(0.7 + (i % 3) * 0.18) * scale} t={t} seed={i + 1} />)}
    <g transform={`translate(1010 ${y + 62})`}><rect x={-26} y={-150} width={52} height={150} fill="#0c0a12" /><path d="M-34,-150 L0,-240 L34,-150Z" fill="#0c0a12" /><rect x={-8} y={-110} width={16} height={26} fill={AMBER} opacity={0.8} /></g>
    {[200, 590, 880].map((x, i) => <Smoke key={i} t={t} x={x} y={y + 95} seed={i + 4} rise={700} wd={0.9} />)}
    <rect x={0} y={y + 95} width={W} height={H} fill="#0a0810" />
    <Cracks seed={9} x0={80} y0={y + 130} w={900} n={8} t={t} />
    <ellipse cx={540} cy={y + 130} rx={520} ry={80} fill="url(#ember)" opacity={0.35 * glow} filter="url(#blur30)" />
  </g>
);

/* ------------------------------------------------------------ scenes (each draws in a 1080x1920 SVG, t = seconds since scene start) */
const SceneHook: React.FC<{ t: number }> = ({ t }) => {
  const cam = easeOut(t / 3.4); const k = mix(3.0, 1.0, cam);
  const n = clamp((t - 2.1) / 1.2) * 60;
  return (
    <g>
      <rect width={W} height={H} fill="url(#skyN)" /><Stars t={t} />
      <g transform={`translate(540 1560) scale(${k}) translate(-540 -1560) translate(0 ${mix(-160, 0, cam) * 0})`}>
        <Town t={t} y={1160} /><Embers t={t} seed={1} n={70} x0={0} x1={1080} y0={1500} rise={1100} speed={0.22} />
      </g>
      <Txt x={540} y={170} size={34} font={sans} fill={AMBER} ls={9} opacity={ease((t - 0.3) / 0.5)}>CENTRALIA, PENNSYLVANIA</Txt>
      {"ON FIRE".split("").map((c, i) => { const p = clamp((t - 0.9 - i * 0.07) / 0.45); return p > 0 ? <Txt key={i} x={540 + (i - 3) * 118} y={560} size={230} stroke={14} glow scale={slam(p)} opacity={ease(p * 3)}>{c === " " ? "" : c}</Txt> : null; })}
      <g opacity={ease((t - 2.0) / 0.4)}><Txt x={540} y={760} size={190} fill={EMBER} stroke={12} glow>{Math.round(n)}{n >= 59.5 ? "+" : ""} YEARS</Txt></g>
    </g>
  );
};
const Truck: React.FC<{ x: number; tilt: number; t: number }> = ({ x, tilt, t }) => (
  <g transform={`translate(${x} 1330)`}>
    <g transform={`rotate(${-tilt * 32} 180 -10)`}><rect x={-120} y={-150} width={300} height={140} rx={8} fill="#2f6f4a" stroke="#0b1a12" strokeWidth={6} /><rect x={-100} y={-135} width={260} height={18} fill="#3d8a5c" /></g>
    <rect x={-240} y={-120} width={120} height={110} rx={10} fill="#3d8a5c" stroke="#0b1a12" strokeWidth={6} /><rect x={-232} y={-108} width={52} height={44} fill="#9ad0e8" />
    <rect x={-250} y={-20} width={450} height={26} fill="#1c1c24" />
    {[-170, 90, 150].map((wx, i) => <g key={i} transform={`translate(${wx} 6) rotate(${t * 180})`}><circle r={34} fill="#14141a" stroke="#000" strokeWidth={4} /><circle r={12} fill="#777" /><rect x={-3} y={-30} width={6} height={20} fill="#555" /></g>)}
  </g>
);
const ScenePit: React.FC<{ t: number }> = ({ t }) => {
  const truckX = mix(-420, 420, easeOut(t / 1.5)); const tilt = ease((t - 1.5) / 0.8); const fire = ease((t - 2.4) / 1.4);
  const r = seeded(15);
  return (
    <g>
      <rect width={W} height={H} fill="url(#skyN)" /><Stars t={t} />
      <path d="M-50,1180 Q250,1090 520,1160 T1130,1120 L1130,1960 L-50,1960Z" fill="#0b0912" />
      {[80, 220, 330].map((x, i) => <House key={i} x={x} y={1190 + i * 6} s={0.8} t={t} seed={i + 9} />)}
      <rect x={0} y={1330} width={W} height={600} fill="url(#earth)" />
      <path d="M380,1330 L760,1330 L690,1700 L450,1700Z" fill="#0a0604" stroke="#000" strokeWidth={6} />
      {Array.from({ length: 26 }, (_, i) => { const px = 470 + r() * 200, py = 1560 + r() * 130 - ease((t - 2.1) / 0.9) * 0; const dropT = clamp((t - 2.0 - r() * 0.8) / 0.7); return <rect key={i} x={px} y={mix(1280, py, dropT)} width={26 + r() * 20} height={18 + r() * 14} rx={4} fill={["#9a6a3a", "#6a7a8a", "#a84a3a", "#c8b070", "#555"][i % 5]} opacity={dropT > 0 ? 1 : 0} transform={`rotate(${r() * 90} ${px} ${py})`} />; })}
      <Truck x={truckX} tilt={tilt} t={t} />
      {[0, 1, 2, 3, 4].map((i) => <Flame key={i} x={470 + i * 52} y={1690} s={fire * (0.8 + (i % 2) * 0.35)} t={t} seed={i} />)}
      {fire > 0.05 ? <><Smoke t={t} x={570} y={1560} seed={2} rise={900} wd={fire} /><Embers t={t} seed={5} n={36} x0={440} x1={700} y0={1600} rise={1000} speed={0.25} /></> : null}
      <g opacity={ease(t / 0.3)}><Txt x={80} y={330} size={190} anchor="start" stroke={12} scale={slam(clamp((t - 0.1) / 0.5))} glow>MAY</Txt><Txt x={80} y={520} size={230} anchor="start" fill={EMBER} stroke={12} scale={slam(clamp((t - 0.35) / 0.5))} glow>1962</Txt></g>
      <Txt x={84} y={600} size={34} anchor="start" font={sans} fill={AMBER} ls={8} opacity={ease((t - 0.9) / 0.5)}>TOWN TRASH DUMP</Txt>
    </g>
  );
};
const TUN: string[] = ["M250,830 L250,1000 L900,1000", "M520,1000 L520,1230 L900,1230", "M740,1000 L740,1230", "M300,1230 L300,1470 L880,1470", "M520,1230 L520,1470", "M900,1000 L900,1470"];
const SceneTunnels: React.FC<{ t: number; seeP: number; spread: number }> = ({ t, seeP, spread }) => {
  const reveal = ease((t - 2.2) / 2.6); const quake = spread > 0.02 ? Math.sin(t * 40) * 3 * spread : 0;
  return (
    <g transform={`translate(${quake} 0)`}>
      <rect width={W} height={760} fill="url(#skyN)" /><Stars t={t} n={40} />
      <rect x={0} y={760} width={W} height={1160} fill="url(#earth)" />
      {Array.from({ length: 22 }, (_, i) => { const r = seeded(i + 40); return <path key={i} d={`M${r() * 1000},${800 + r() * 1000} q40,-14 90,0`} stroke="#150c08" strokeWidth={5} fill="none" opacity={0.7} />; })}
      {[560, 680, 800, 920, 1000].map((x, i) => <House key={i} x={x} y={778} s={0.55} t={t} seed={i + 20} />)}
      <rect x={0} y={760} width={W} height={14} fill="#1a3a22" />
      <path d="M130,760 L360,760 L330,860 L160,860Z" fill="#0a0604" /><rect x={160} y={850} width={170} height={30} fill="#0a0604" />
      {TUN.map((d, i) => <path key={"r" + i} d={d} stroke="#8a7458" strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(reveal * 1.3 - i * 0.08)} opacity={0.9} />)}
      {TUN.map((d, i) => <path key={i} d={d} stroke="#050303" strokeWidth={46} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(reveal * 1.3 - i * 0.08)} />)}
      {TUN.map((d, i) => <path key={"o" + i} d={d} stroke="#6a5a4a" strokeWidth={4} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(reveal * 1.3 - i * 0.08)} opacity={0.0} />)}
      {TUN.map((d, i) => { const sp = clamp(spread * 1.5 - i * 0.13); return <path key={"f" + i} d={d} stroke={i % 2 ? AMBER : EMBER} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - sp} filter="url(#glowL)" opacity={sp > 0 ? 0.95 : 0} />; })}
      {/* the pit and its flames */}
      <Flame x={200} y={860} s={1.0} t={t} seed={1} /><Flame x={290} y={860} s={0.8} t={t} seed={2} /><Smoke t={t} x={250} y={760} seed={6} rise={600} wd={0.7} />
      {/* "You see" beat: pulse ring on the connection */}
      {seeP > 0 ? <g opacity={seeP}><circle cx={250} cy={930} r={50 + 30 * Math.sin(t * 6)} fill="none" stroke={CREAM} strokeWidth={6} filter="url(#glow)" /><Txt x={250} y={1090} size={46} stroke={8}>THE PIT CONNECTS</Txt></g> : null}
      <g opacity={ease((t - 3.0) / 0.5)}><Txt x={540} y={1650} size={86} stroke={10} fill={AMBER} glow>COAL TUNNELS</Txt><Txt x={540} y={1735} size={34} font={sans} ls={7} fill={CREAM} opacity={0.85}>RIGHT UNDER THE TOWN</Txt></g>
      {spread > 0 ? <Embers t={t} seed={8} n={34} x0={200} x1={900} y0={1480} rise={650} speed={0.2} /> : null}
    </g>
  );
};
const SceneCracks: React.FC<{ t: number; p: number }> = ({ t, p }) => {
  const a = 1 - ease((p - 0.28) / 0.1), b = ease((p - 0.28) / 0.1) * (1 - ease((p - 0.64) / 0.1)), c = ease((p - 0.64) / 0.1);
  const grow = ease(p / 0.25);
  const r = seeded(61);
  return (
    <g>
      <rect width={W} height={H} fill="url(#skyN)" />
      <g opacity={a}>
        <rect x={0} y={900} width={W} height={1100} fill="#0c0808" /><Cracks seed={11} x0={60} y0={1000} w={900} n={9} t={t} reveal={grow} />
        {[160, 470, 800].map((x, i) => <Smoke key={i} t={t} x={x} y={1050 + i * 40} seed={i + 12} rise={950} wd={1.1} />)}<Embers t={t} seed={13} n={40} x0={40} x1={1040} y0={1500} rise={900} speed={0.2} />
      </g>
      <g opacity={b}>
        <path d="M-60,1960 L360,980 L720,980 L1140,1960Z" fill="#1b1b22" /><rect x={0} y={880} width={W} height={110} fill="#14141a" />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${535 - i * 4},${1930 - i * 340} L${545 - i * 3},${1930 - i * 340 - 150} L${535 - i * 3},${1930 - i * 340 - 150}Z`} fill="#e8d48a" opacity={0.85 - i * 0.12} />)}
        {(() => { const cr = clamp((p - 0.3) / 0.25); return <g filter="url(#glow)" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={`M540,990 ${Array.from({ length: Math.floor(10 * cr) }, (_, i) => `L${540 + Math.sin(i * 2.1) * 60},${990 + (i + 1) * 90}`).join(" ")}`} stroke="#000" strokeWidth={26} /><path d={`M540,990 ${Array.from({ length: Math.floor(10 * cr) }, (_, i) => `L${540 + Math.sin(i * 2.1) * 60},${990 + (i + 1) * 90}`).join(" ")}`} stroke={EMBER} strokeWidth={9} /></g>; })()}
        <g transform={`translate(${mix(900, 540, easeOut((p - 0.45) / 0.15))} 760)`} opacity={ease((p - 0.45) / 0.08)}><rect x={-180} y={-70} width={360} height={70} fill="#fff" stroke="#000" strokeWidth={5} /><path d="M-180,-70 l60,70 h-60z M-60,-70 l60,70 h-60z M60,-70 l60,70 h-60z" fill={EMBER} /><rect x={-14} y={0} width={28} height={140} fill="#444" /><Txt x={0} y={-90} size={52} stroke={8}>ROAD CLOSED</Txt></g>
      </g>
      <g opacity={c}>
        <rect x={0} y={1000} width={W} height={900} fill="#0b140c" />
        {Array.from({ length: 130 }, (_, i) => { const x = r() * W, y = 1010 + r() * 880, h = 30 + r() * 40; return <path key={i} d={`M${x},${y} q${(r() - 0.5) * 20},${-h / 2} ${(r() - 0.5) * 30},${-h}`} stroke={i % 3 ? "#1d3a22" : "#2a5230"} strokeWidth={4} fill="none" />; })}
        {[200, 540, 860].map((x, i) => <g key={i}><ellipse cx={x} cy={1500 + i * 60} rx={70} ry={20} fill="#000" /><ellipse cx={x} cy={1500 + i * 60} rx={50} ry={12} fill={EMBER} opacity={0.5} filter="url(#glow)" /></g>)}
        {[200, 540, 860].map((x, i) => Array.from({ length: 9 }, (_, j) => { const life = (t * 0.28 + j / 9 + i * 0.2) % 1; return <circle key={`${i}${j}`} cx={x + Math.sin(life * 6 + j) * 40 * life} cy={1500 + i * 60 - life * 800} r={30 + life * 120} fill="#dfe8f0" opacity={0.5 * (1 - life) * clamp(life * 8)} filter="url(#blur10)" />; }))}
      </g>
    </g>
  );
};
const Fig: React.FC<{ x: number; y: number; s?: number; col: string; hand: [number, number][]; foot: [number, number][]; lean?: number }> = ({ x, y, s = 1, col, hand, foot, lean = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${lean})`} stroke={col} strokeLinecap="round" fill="none">
    <circle cx={0} cy={-150} r={36} fill={col} stroke="none" /><line x1={0} y1={-112} x2={0} y2={-40} strokeWidth={46} />
    {hand.map((h, i) => <line key={"h" + i} x1={i ? 16 : -16} y1={-105} x2={h[0]} y2={h[1]} strokeWidth={16} />)}
    {foot.map((f, i) => <line key={"f" + i} x1={i ? 12 : -12} y1={-45} x2={f[0]} y2={f[1]} strokeWidth={18} />)}
  </g>
);
const SceneSink: React.FC<{ t: number }> = ({ t }) => {
  const open = ease((t - 2.0) / 0.5), fall = ease((t - 2.2) / 0.35), pull = ease((t - 5.3) / 1.5), cousin = easeOut((t - 3.6) / 1.2);
  const boyY = mix(mix(1010, 1130, fall), 1010, pull); const hanging = fall > 0.5 && pull < 0.5;
  const boy: [[number, number][], [number, number][]] = hanging ? [[[-30, -250], [38, -250]], [[-22, 80], [18, 90]]] : [[[-34, -30], [34, -30]], [[-16, 85], [16, 85]]];
  return (
    <g transform={`translate(${open > 0 && pull < 0.1 ? Math.sin(t * 50) * 3 * open : 0} 0)`}>
      <rect width={W} height={H} fill="url(#skyN)" /><Stars t={t} n={50} />
      <rect x={0} y={1010} width={W} height={900} fill="url(#earth)" /><ellipse cx={540} cy={1900} rx={600} ry={200} fill="url(#ember)" opacity={0.7} filter="url(#blur30)" />
      <rect x={0} y={1010} width={W} height={26} fill="#1f4a2a" />
      <path d={`M${540 - 150 * open},1010 L${540 + 150 * open},1010 L${540 + 90 * open},1500 L${540 - 90 * open},1500Z`} fill="#070302" />
      {open > 0.4 ? <path d="M390,1070 Q540,1050 690,1066" stroke="#5a3a1c" strokeWidth={14} fill="none" strokeLinecap="round" /> : null}
      <Fig x={540} y={boyY + 90} s={1.05} col="#3a3556" hand={boy[0]} foot={boy[1]} />
      {cousin > 0 ? <Fig x={mix(1300, 760, cousin)} y={1010} s={1.15} col="#4a4466" hand={[[-120, pull > 0 ? -60 : -10], [-120, pull > 0 ? -70 : 0]]} foot={[[-30, 90], [30, 90]]} lean={-14} /> : null}
      {open > 0.2 ? [0, 1, 2, 3, 4, 5].map((j) => { const life = (t * 0.35 + j / 6) % 1; return <circle key={j} cx={540 + Math.sin(life * 7 + j) * 80 * life} cy={1030 - life * 700} r={40 + life * 130} fill="#e4ecf4" opacity={0.55 * (1 - life)} filter="url(#blur10)" />; }) : null}
      <Txt x={540} y={300} size={260} stroke={14} fill={EMBER} glow scale={slam(clamp((t - 0.2) / 0.5))} opacity={ease(t / 0.2)}>1981</Txt>
      <g opacity={ease((t - 1.2) / 0.4)}><Txt x={540} y={470} size={96} stroke={10}>12 YEARS OLD</Txt></g>
      {pull > 0.7 ? <Txt x={540} y={640} size={60} stroke={8} fill={AMBER} opacity={ease((pull - 0.7) / 0.3)}>HE SURVIVED</Txt> : null}
    </g>
  );
};
const ScenePop: React.FC<{ t: number }> = ({ t }) => {
  const r = seeded(70); const order = Array.from({ length: 100 }, (_, i) => ({ i, k: r() })).sort((a, b) => a.k - b.k).map((o) => o.i);
  const rank = (i: number) => order.indexOf(i); const gone = clamp((t - 1.0) / 1.5); const keep = new Set(order.slice(95));
  const count = Math.round(mix(1000, 5, ease(gone))); const num = gone >= 0.99 ? 5 : count;
  return (
    <g>
      <rect width={W} height={H} fill="url(#skyN)" />
      <Txt x={540} y={300} size={44} font={sans} ls={8} fill={AMBER} opacity={ease(t / 0.4)}>PEOPLE IN CENTRALIA</Txt>
      <Txt x={540} y={520} size={250} stroke={14} glow fill={gone >= 0.99 ? EMBER : CREAM}>{num.toLocaleString("en-US")}</Txt>
      {Array.from({ length: 100 }, (_, i) => { const cx = 150 + (i % 10) * 86, cy = 700 + Math.floor(i / 10) * 100; const alive = keep.has(i) || gone * 95 < rank(i); const fade = keep.has(i) ? 1 : clamp(1 - (gone * 95 - rank(i)) / 2.5); return <g key={i} opacity={ease(t / 0.3) * fade} transform={`translate(${cx} ${cy}) scale(${keep.has(i) && gone > 0.99 ? 1 + 0.1 * Math.sin(t * 6 + i) : 1})`}><circle cy={-18} r={13} fill={alive && keep.has(i) && gone > 0.9 ? AMBER : "#d8cdbb"} /><path d="M-16,22 Q-16,-4 0,-4 Q16,-4 16,22Z" fill={alive && keep.has(i) && gone > 0.9 ? EMBER : "#b9ad9a"} /></g>; })}
      <g opacity={ease((t - 2.6) / 0.4)}><Txt x={540} y={1180} size={56} fill={AMBER} stroke={8} ls={4}>EACH FIGURE = 10 PEOPLE</Txt></g>
    </g>
  );
};
const SceneFinal: React.FC<{ t: number }> = ({ t }) => {
  const k = mix(1.0, 1.18, ease(t / 4)); const yr = Math.round(mix(1962, 2026, ease((t - 1.0) / 1.8)));
  return (
    <g>
      <rect width={W} height={H} fill="url(#skyN)" /><Stars t={t} />
      <g transform={`translate(540 1300) scale(${k}) translate(-540 -1300)`}><Town t={t} y={1180} glow={1.6} /><Embers t={t} seed={21} n={80} x0={0} x1={1080} y0={1560} rise={1200} speed={0.25} /></g>
      {["STILL", "BURNING"].map((w, i) => <Txt key={i} x={540} y={420 + i * 230} size={i ? 230 : 200} stroke={14} glow fill={i ? EMBER : CREAM} scale={slam(clamp((t - 0.1 - i * 0.25) / 0.5))} opacity={ease((t - i * 0.25) / 0.15)}>{w}</Txt>)}
      <g opacity={ease((t - 0.9) / 0.4)}><Txt x={540} y={900} size={150} stroke={10} fill={AMBER} glow>{yr}</Txt><Txt x={540} y={975} size={36} font={sans} ls={8} fill={CREAM}>{yr >= 2026 ? "AND COUNTING" : "SINCE"}</Txt></g>
    </g>
  );
};

/* ------------------------------------------------------------ timeline */
type Sc = { a: number; b: number; draw: (t: number) => React.ReactNode };
const SC: Sc[] = (() => {
  const st = (i: number) => S[i].start, en = (i: number) => S[i].end;
  const see = S[2].words.find((w) => w.w.toLowerCase().startsWith("see"));
  const seeA = see ? see.t0 : st(2), seeB = see ? S[2].words[S[2].words.indexOf(see) + 1].t0 : st(2) + 0.7;
  const list: Sc[] = [
    { a: 0, b: st(1) - 0.15, draw: (t) => <SceneHook t={t} /> },
    { a: st(1) - 0.15, b: st(2) - 0.2, draw: (t) => <ScenePit t={t} /> },
    { a: st(2) - 0.2, b: st(4) - 0.2, draw: (t) => { const g = t + st(2) - 0.2; return <SceneTunnels t={t} seeP={ease((g - seeA) / 0.2) * (1 - ease((g - seeB - 0.1) / 0.2))} spread={clamp((g - st(3) + 0.1) / (en(3) - st(3) + 0.5))} />; } },
    { a: st(4) - 0.2, b: st(5) - 0.2, draw: (t) => <SceneCracks t={t} p={clamp(t / (st(5) - st(4)))} /> },
    { a: st(5) - 0.2, b: st(6) - 0.2, draw: (t) => <SceneSink t={t} /> },
    { a: st(6) - 0.2, b: st(7) - 0.15, draw: (t) => <ScenePop t={t} /> },
    { a: st(7) - 0.15, b: CENT_TOTAL + 1, draw: (t) => <SceneFinal t={t} /> },
  ];
  return list;
})();
const NUM: Record<string, string> = { "60": "sixty", "1962": "nineteen sixty two", "1981": "nineteen eighty one", "12": "twelve", "1,000": "a thousand" };
const CAPS = (() => {
  const toks: { w: string; t0: number; t1: number }[] = [];
  for (const s of S) for (let wi = 0; wi < s.words.length; wi++) { const w = s.words[wi]; if (w.w.toLowerCase() === "to" && s.words[wi + 1] && s.words[wi + 1].w.toLowerCase().startsWith("day")) { toks.push({ w: "today,", t0: w.t0, t1: s.words[wi + 1].t1 }); wi++; continue; } let x = w.w.replace(/^-/, ""); if (x === "year" || x === "old") { /* keep */ } const rw = NUM[x.replace(/[.,]/g, "")] ?? x; toks.push({ w: rw, t0: w.t0, t1: w.t1 }); }
  const out: { t0: number; t1: number; text: string }[] = []; let cur: typeof toks = [];
  const flush = () => { if (cur.length) { out.push({ t0: cur[0].t0, t1: cur[cur.length - 1].t1 + 0.12, text: cur.map((c) => c.w).join(" ") }); cur = []; } };
  for (const tk of toks) { cur.push(tk); if (cur.length >= 3 || /[.?!,]$/.test(tk.w)) flush(); }
  flush(); return out;
})();
const HOT = /fire|burning|burned|smoke|steam|cracks|tunnels|nineteen|sixty|thousand|five|twelve|ground|coal/i;
const Cap: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find((x) => t >= x.t0 && t < x.t1); if (!c) return null; const p = ease((t - c.t0) / 0.09);
  return <div style={{ position: "absolute", left: 0, right: 0, top: 1330, textAlign: "center", fontFamily: rnd, fontSize: 92, lineHeight: 1.04, padding: "0 50px", transform: `scale(${0.9 + 0.1 * p})`, opacity: p, WebkitTextStroke: "11px #000", paintOrder: "stroke fill" as any, textShadow: "0 6px 14px rgba(0,0,0,.55)" }}>{c.text.split(" ").map((w, i) => <span key={i} style={{ color: HOT.test(w) ? AMBER : CREAM }}>{w}{" "}</span>)}</div>;
};
const BOOMS = [S[0].start, S[1].start + 2.4, S[3].start, S[5].start + 2.0, S[6].start + 2.4, S[7].start];

export const Centralia: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#06060f" }} />;
  const idx = SC.findIndex((s) => t >= s.a && t < s.b); const cur = idx < 0 ? SC.length - 1 : idx;
  const layers = [cur - 1, cur].filter((i) => i >= 0);
  const shake = BOOMS.reduce((m, b) => Math.max(m, t > b && t < b + 0.5 ? Math.exp(-(t - b) * 8) : 0), 0);
  const flick = 0.96 + 0.04 * Math.sin(t * 31) * Math.sin(t * 7);
  const tEnd = S[7].end + 0.55; const flash = t > tEnd && t < tEnd + 0.6 ? Math.exp(-(t - tEnd) * 9) * 0.32 : 0;
  return (
    <AbsoluteFill style={{ background: "#050509" }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(t * 77) * 14 * shake}px, ${Math.cos(t * 63) * 14 * shake}px)`, filter: `contrast(1.08) saturate(1.12) brightness(${flick})` }}>
        {layers.map((i) => { const s = SC[i]; const lt = t - s.a; const fin = i === cur && i > 0 ? ease(lt / 0.3) : 1; return (
          <svg key={i} width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, opacity: fin, transform: i === cur && i > 0 ? `scale(${1 + (1 - fin) * 0.07})` : "none" }}><Defs />{s.draw(lt)}</svg>
        ); })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,.6) 100%)" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 2px, rgba(0,0,0,.02) 2px 4px)", mixBlendMode: "overlay" }} />
      <Cap t={t} />
      {flash > 0 ? <AbsoluteFill style={{ background: `rgba(255,220,160,${flash})` }} /> : null}
      {audio ? <Audio src={staticFile("centralia_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
