import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useDelayRender } from "remotion";
import TIM from "../../projects/bear-saloon/timing.json";

/** Style 1 fact/story short: "The Bear in the Saloon". Blender-rendered base video + captions, graphics, grade, sound. 1080x1920, 30 fps. */
export const FPS = 30;
export const BEAR_TOTAL = (TIM as any).total as number;
const SEN = (TIM as any).sentences as { text: string; start: number; end: number; words: { w: string; t0: number; t1: number }[] }[];
const lil = "'Lilita One', 'Inter', Arial, sans-serif";
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const FONTS: [string, string, string][] = [["Lilita One", "fonts/LilitaOne-Regular.ttf", "400"], ["Inter", "fonts/inter-latin-900-normal.woff2", "900"]];
let fp: Promise<void> | null = null;
const loadFonts = () => (fp ??= Promise.all(FONTS.map(async ([f, p, w]) => { try { const ff = new FontFace(f, `url(${staticFile(p)})`, { weight: w }); await ff.load(); (document as any).fonts.add(ff); } catch { /* ignore */ } })).then(() => undefined));
const OUT: React.CSSProperties = { WebkitTextStroke: "11px #000", paintOrder: "stroke fill" as any, textShadow: "0 7px 14px rgba(0,0,0,.45)" };

const NUM: Record<string, string> = { "14": "fourteen", "9": "nine", "1999": "nineteen ninety nine", "2": "two" };
const KEY = /bear|gorilla|half|fourteen|nine|1999|keys|brain|job|drink|shuffle/i;
const CAPS = (() => {
  const toks: { w: string; t0: number; t1: number }[] = [];
  for (const s of SEN) for (const w of s.words) toks.push({ w: NUM[w.w.replace(/[.,?!]/g, "")] ?? w.w, t0: w.t0, t1: w.t1 });
  const out: { t0: number; t1: number; words: string[] }[] = []; let cur: typeof toks = [];
  const flush = () => { if (cur.length) { out.push({ t0: cur[0].t0, t1: cur[cur.length - 1].t1 + 0.1, words: cur.map((c) => c.w) }); cur = []; } };
  for (const tk of toks) { cur.push(tk); if (cur.length >= 3 || /[.?!,]$/.test(tk.w)) flush(); }
  flush(); return out;
})();
const Cap: React.FC<{ t: number }> = ({ t }) => {
  const c = CAPS.find((x) => t >= x.t0 && t < x.t1); if (!c) return null; const p = ease((t - c.t0) / 0.08);
  return <div style={{ position: "absolute", left: 0, right: 0, top: 1380, textAlign: "center", fontFamily: lil, fontSize: 96, lineHeight: 1.04, padding: "0 50px", transform: `scale(${0.9 + 0.1 * p})`, opacity: p, ...OUT }}>{c.words.map((w, i) => <span key={i} style={{ color: KEY.test(w) ? "#ffd21f" : "#fff" }}>{w} </span>)}</div>;
};
const sh = SEN[2].words.filter((w) => w.w.toLowerCase().startsWith("shuffle")).map((w) => w.t0);
const wordT = (si: number, key: string) => SEN[si].words.find((w) => w.w.toLowerCase().startsWith(key))?.t0 ?? SEN[si].start;
const Pop: React.FC<{ t: number; a: number; b: number; children: React.ReactNode; top: number; size?: number; color?: string; rot?: number }> = ({ t, a, b, children, top, size = 260, color = "#ffd21f", rot = 0 }) => {
  if (t < a || t > b) return null; const p = easeOut((t - a) / 0.22), q = 1 - ease((t - (b - 0.15)) / 0.15);
  return <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: lil, fontSize: size, color, transform: `rotate(${rot}deg) scale(${(1.7 - 0.7 * p)})`, opacity: p * q, ...OUT }}>{children}</div>;
};
const Graphics: React.FC<{ t: number }> = ({ t }) => (
  <>
    {sh.map((x, i) => <Pop key={i} t={t} a={x} b={x + 0.55} top={360} size={300}>{i + 1}</Pop>)}
    <Pop t={t} a={wordT(5, "fourteen")} b={SEN[5].end + 0.5} top={330} size={340}>14</Pop>
    <Pop t={t} a={wordT(6, "nine")} b={28.2} top={330} size={150} color="#ffffff">9 SECONDS</Pop>
    <Pop t={t} a={30.45} b={32.8} top={300} size={110} color="#ff6a5a" rot={-4}>HARVARD · 1999</Pop>
    {t >= 34.5 && t < 36.7 ? <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", opacity: ease((t - 34.5) / 0.2) * (1 - ease((t - 36.4) / 0.25)) }}>
      <svg width={420} height={420} viewBox="-60 -60 120 120" style={{ filter: "drop-shadow(0 8px 14px rgba(0,0,0,.5))" }}><circle r={50} fill="#fff" stroke="#000" strokeWidth={4} /><path d={`M0,0 L0,-50 A50,50 0 ${1} 1 0,50 Z`} fill="#ff6a5a" stroke="#000" strokeWidth={4} /></svg>
      <div style={{ fontFamily: lil, fontSize: 190, color: "#ffd21f", marginTop: -10, ...OUT }}>50%</div></div> : null}
  </>
);
const Iris: React.FC<{ t: number }> = ({ t }) => {
  const a = 25.9, b = 28.42; if (t < a - 0.01 || t > b) return null; const r = 520 * ease((t - a) / 0.5) * (1 - ease((t - (b - 0.3)) / 0.3)) + 4;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 900px, rgba(0,0,0,0) ${r - 6}px, #a07a2a ${r - 2}px, #3a2a0c ${r + 14}px, #000 ${r + 16}px)` }} />
      <AbsoluteFill style={{ background: "rgba(140,100,40,.28)", mixBlendMode: "multiply", clipPath: `circle(${r}px at 50% 900px)` }} />
    </AbsoluteFill>
  );
};
export const BearSaloon: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#000" }} />;
  const replay = t >= 25.9 && t < 28.42;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: replay ? "sepia(0.9) contrast(1.15) saturate(.8) brightness(1.0)" : "saturate(1.28) contrast(1.08) brightness(1.04)" }}>
        <OffthreadVideo src={staticFile("bear_base.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%)" }} />
      <Iris t={t} />
      <Graphics t={t} />
      <Cap t={t} />
      {audio ? <Audio src={staticFile("bear_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
