import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, createPortal } from "@react-three/fiber";
import { PostFX } from "../../hotel/PostFX";
import { ease, clamp, mix, G, Mesh, type V3 } from "../kit5";
import { FL, FaceHead, Courier, LivingF, BackRoomF, PorchF, PovF, HERO } from "./F";
import CAPS from "./captions.json";

/** STYLE 4 full video (68 s, 30 fps, 1080x1920): "Package for you", first-person phone horror, built to match the "cop knocked at midnight" reference. */
export const FPS = 30;
export const S4F_TOTAL = 68;
const sans = "Inter, Arial, Helvetica, sans-serif";
const FONTS: [string, string, string][] = [["Inter", "fonts/inter-latin-600-normal.woff2", "600"], ["Inter", "fonts/inter-latin-700-normal.woff2", "700"], ["Inter", "fonts/inter-latin-800-normal.woff2", "800"], ["Inter", "fonts/inter-latin-900-normal.woff2", "900"]];
let fp: Promise<void> | null = null;
const loadFonts = () => (fp ??= Promise.all(FONTS.map(async ([fam, path, w]) => { try { const f = new FontFace(fam, `url(${staticFile(path)})`, { weight: w }); await f.load(); (document as any).fonts.add(f); } catch { /* ignore */ } })).then(() => undefined));

type Key = { p: V3; l: V3; fov?: number; roll?: number };
type Kind = "room" | "porch" | "face" | "phone" | "door" | "back" | "peep";
type Shot = { a: number; b: number; k: Kind; cam?: [Key, Key]; c?: { p: V3; wave?: number; tilt?: number; yaw?: number }; hands?: boolean; dark?: boolean; nv?: boolean; ph?: { mode: "calling" | "call" | "failed"; sec: number }; fig?: number; banner?: boolean; end?: boolean; talk?: [number, number][]; faceTalk?: [number, number]; blue?: boolean };
const K = (p: V3, l: V3, fov = 60, roll = 0): Key => ({ p, l, fov, roll });
const PC = (z: number, x = 0): { p: V3 } => ({ p: [x, 0, z] });
const SHOTS: Shot[] = [
  { a: 0, b: 2.7, k: "room", cam: [K([-0.3, 1.15, 2.6], [0.9, 1.1, -3.4], 70), K([-0.1, 1.15, 2.3], [1.3, 1.15, -3.4], 66)], hands: true },
  { a: 2.7, b: 5.4, k: "room", cam: [K([0, 1.15, 1.7], [1.6, 1.2, -3.4], 64), K([0.5, 1.15, 0.5], [1.9, 1.2, -3.4], 56)], hands: true },
  { a: 5.4, b: 8.0, k: "porch", cam: [K([0, 1.4, -0.2], [0, 1.1, 3], 72), K([0.1, 1.4, -0.2], [0, 1.1, 3], 70)], c: { ...PC(2.4, 0.05), wave: 1 }, talk: [[5.7, 9.6]] },
  { a: 8.0, b: 10.0, k: "porch", cam: [K([-0.15, 1.5, -0.2], [0, 1.1, 3], 70), K([-0.05, 1.5, -0.2], [0, 1.15, 3], 66)], c: PC(2.2), talk: [[5.7, 9.6]] },
  { a: 10.0, b: 12.4, k: "porch", cam: [K([0.25, 1.2, -0.2], [0, 1.25, 3], 70), K([0.15, 1.2, -0.2], [0, 1.25, 3], 66)], c: PC(2.6, -0.05) },
  { a: 12.4, b: 14.2, k: "porch", cam: [K([0, 1.55, -0.4], [0, 1.1, 3], 62), K([0, 1.5, -0.4], [0, 1.1, 3], 60)], c: { ...PC(3.3), tilt: 0.1 }, talk: [[13.1, 15.7]] },
  { a: 14.2, b: 16.5, k: "porch", cam: [K([0.1, 0.7, 0.8], [0, 1.5, 2.8], 78), K([0.05, 0.7, 1.2], [0, 1.55, 2.8], 74)], c: { ...PC(2.7), tilt: 0.14 }, talk: [[13.1, 15.7]] },
  { a: 16.5, b: 19.6, k: "phone", ph: { mode: "calling", sec: 0 } },
  { a: 19.6, b: 24.4, k: "face", cam: [K([0.2, 1.3, -0.35], [0.2, 1.3, -1.8], 50), K([0.2, 1.3, -0.55], [0.2, 1.3, -1.8], 46)], faceTalk: [20.2, 24.2] },
  { a: 24.4, b: 28.2, k: "phone", ph: { mode: "call", sec: 10 } },
  { a: 28.2, b: 30.5, k: "porch", cam: [K([0, 0.6, 1.3], [0, 1.95, 2.5], 80, 0.03), K([0.05, 0.7, 1.5], [0, 1.95, 2.5], 74, -0.03)], c: PC(2.5), talk: [[28.3, 30.5]] },
  { a: 30.5, b: 31.5, k: "porch", cam: [K([0.1, 0.9, 1.7], [0, 1.9, 2.5], 66, -0.02), K([0.1, 0.95, 1.9], [0, 1.9, 2.5], 60, 0.02)], c: { ...PC(2.5), tilt: 0.12 } },
  { a: 31.5, b: 33.8, k: "face", cam: [K([0.2, 1.3, -0.5], [0.2, 1.3, -1.8], 46), K([0.2, 1.3, -0.4], [0.2, 1.3, -1.8], 52)], faceTalk: [31.6, 33.7] },
  { a: 33.8, b: 37.8, k: "phone", ph: { mode: "call", sec: 20 } },
  { a: 37.8, b: 40.0, k: "door", cam: [K([0.9, 1.1, -1.6], [1.9, 1.1, -3.43], 55), K([1.3, 1.1, -2.3], [1.9, 1.1, -3.43], 50)], hands: true },
  { a: 40.0, b: 42.4, k: "door", dark: true, cam: [K([1.7, 1.1, -1.8], [2.15, 1.1, -3.43], 52), K([1.95, 1.1, -2.4], [2.2, 1.05, -3.43], 46)], hands: true },
  { a: 42.4, b: 44.6, k: "porch", nv: true, cam: [K([0, 1.3, 0], [0, 0.8, 3], 70, 0.12), K([0, 1.3, 0], [0, 0.8, 3], 70, 0.15)] },
  { a: 44.6, b: 45.4, k: "phone", ph: { mode: "call", sec: 30 }, dark: true },
  { a: 45.4, b: 48.2, k: "face", dark: true, blue: true, cam: [K([0.2, 1.3, -0.5], [0.2, 1.3, -1.8], 48), K([0.2, 1.3, -0.4], [0.2, 1.3, -1.8], 52)], faceTalk: [45.5, 46.6] },
  { a: 48.2, b: 50.3, k: "back", hands: true, cam: [K([0.2, 1.15, 0.8], [0, 1.2, -5.4], 62), K([0.2, 1.15, 0.3], [0, 1.2, -5.4], 58)] },
  { a: 50.3, b: 52.4, k: "back", hands: true, fig: 1, banner: true, cam: [K([0.2, 1.15, 0.3], [0, 1.2, -5.4], 58), K([0.2, 1.15, 0.0], [0, 1.2, -5.4], 56)] },
  { a: 52.4, b: 53.4, k: "door", dark: true, hands: true, cam: [K([1.7, 1.1, -2.0], [2.15, 1.1, -3.43], 50), K([1.95, 1.1, -2.4], [2.2, 1.1, -3.43], 48)] },
  { a: 53.4, b: 56.0, k: "peep", cam: [K([0, 1.55, 0], [0, 1.82, 2.4], 36), K([0, 1.55, 0], [0, 1.82, 2.4], 32)], c: PC(2.4), talk: [[53.4, 55.8]] },
  { a: 56.0, b: 58.3, k: "peep", cam: [K([-0.05, 1.6, 0], [0, 1.85, 2.4], 30), K([-0.05, 1.6, 0], [0, 1.85, 2.4], 28)], c: PC(2.4) },
  { a: 58.3, b: 60.3, k: "phone", ph: { mode: "failed", sec: 31 }, dark: true },
  { a: 60.3, b: 62.2, k: "back", hands: true, fig: 2, cam: [K([0.2, 1.15, -0.2], [0, 1.25, -5.4], 54), K([0.2, 1.15, -0.6], [0, 1.3, -5.4], 50)] },
  { a: 62.2, b: 68, k: "back", hands: true, fig: 3, end: true, cam: [K([0.2, 1.15, -0.6], [0, 1.3, -5.4], 50), K([0.2, 1.15, -1.0], [0, 1.4, -5.4], 46)] },
];
const COL: Record<string, string> = { y: "#ffd21f", w: "#ffffff", b: "#5cc8ff", p: "#ff9aa8" };

const Rig: React.FC<{ k: Key; pov: boolean; children?: React.ReactNode }> = ({ k, pov, children }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera; const scene = useThree((st) => st.scene);
  useLayoutEffect(() => { if (pov && camera.parent !== scene) scene.add(camera); camera.fov = k.fov ?? 60; camera.near = 0.03; camera.far = 200; camera.updateProjectionMatrix(); camera.position.set(...k.p); camera.up.set(0, 1, 0); camera.lookAt(...k.l); camera.rotateZ(k.roll ?? 0); camera.updateMatrixWorld(true); });
  return pov ? createPortal(<>{children}</>, camera) : null;
};
const camAt = (c: [Key, Key], s: number, dur: number, t: number, sway = 1): Key => {
  const k = ease(s / dur); const m = (a: V3, b: V3): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
  const p = m(c[0].p, c[1].p), l = m(c[0].l, c[1].l);
  p[0] += Math.sin(t * 1.3) * 0.012 * sway; p[1] += Math.sin(t * 2.1 + 1) * 0.01 * sway; l[0] += Math.sin(t * 0.9) * 0.02 * sway; l[1] += Math.sin(t * 1.7) * 0.012 * sway;
  return { p, l, fov: mix(c[0].fov ?? 60, c[1].fov ?? 60, k), roll: mix(c[0].roll ?? 0, c[1].roll ?? 0, k) + Math.sin(t * 0.7) * 0.004 * sway };
};
const talking = (t: number, ranges?: [number, number][]) => (ranges && ranges.some(([a, b]) => t >= a && t <= b) ? (Math.sin(t * 15) > -0.2 ? 0.55 + 0.3 * Math.sin(t * 9) : 0.12) : 0);
const blink = (t: number, o = 0) => { const k = (t + o) % 3.1; return k < 0.12 ? Math.sin((k / 0.12) * Math.PI) : 0; };

const Hero3D: React.FC<{ t: number; talk: boolean; blue: boolean }> = ({ t, talk, blue }) => (
  <group position={[0.2, 1.3, -1.8]}>
    <FaceHead f={HERO} big={1.0} blink={blink(t, 1.2)} mouth={talk ? (Math.sin(t * 14) > 0 ? 0.55 : 0.15) : 0.35} look={[Math.sin(t * 0.8) * 0.8, 0.1]} brow={0.0} />
    <Mesh g={G.cap(0.3, 0.5)} m={FL(blue ? "#a8262c" : "#d8332a")} p={[0, -0.68, -0.02]} s={[1.2, 1, 0.8]} cast={false} />
    <Mesh g={G.cap(0.08, 0.2)} m={FL("#f3c19a")} p={[0, -0.28, 0.0]} cast={false} />
    {blue ? <pointLight position={[0, -0.1, 0.9]} color="#6aa0ff" intensity={5} distance={3} /> : <pointLight position={[0.3, 0.3, 0.9]} color="#fff0e0" intensity={5} distance={3} />}
  </group>
);

const Hud: React.FC<{ t: number }> = ({ t }) => { const k = ease((t - 0.1) / 0.3) * (1 - ease((t - 4.7) / 0.5)); return <div style={{ position: "absolute", left: 50, top: 70, fontFamily: sans, color: "#fff", opacity: k, textShadow: "0 0 3px #000, 0 2px 8px rgba(0,0,0,.7)" }}><div style={{ fontWeight: 800, fontSize: 46, letterSpacing: 1 }}>TUESDAY &middot; 2:13 AM</div><div style={{ fontWeight: 800, fontSize: 30, color: "#ffd21f" }}>Home alone</div></div>; };
const CamUI: React.FC<{ t: number; nv: boolean }> = ({ t, nv }) => {
  const sec = Math.floor(t); const clock = `2:13:${String(Math.min(59, 3 + (sec % 60))).padStart(2, "0")} AM`; const rec = Math.sin(t * 5) > -0.3;
  const br = (x: number, y: number, sx: number, sy: number, i: number) => <div key={i} style={{ position: "absolute", left: x - (sx < 0 ? 56 : 0), top: y - (sy < 0 ? 56 : 0), width: 56, height: 56, borderTop: sy > 0 ? "3px solid rgba(255,255,255,.85)" : "none", borderBottom: sy < 0 ? "3px solid rgba(255,255,255,.85)" : "none", borderLeft: sx > 0 ? "3px solid rgba(255,255,255,.85)" : "none", borderRight: sx < 0 ? "3px solid rgba(255,255,255,.85)" : "none" }} />;
  return (
    <AbsoluteFill style={{ fontFamily: sans, color: "#fff", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 90, top: 70, display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 32 }}><div style={{ width: 17, height: 17, borderRadius: 9, background: nv ? "#3cd25a" : rec ? "#ff3b3b" : "#7a2020" }} />{nv ? "NIGHT VISION" : "LIVE"}</div>
      <div style={{ position: "absolute", left: 90, top: 116, fontWeight: 600, fontSize: 26, opacity: 0.6 }}>Front Door</div>
      <div style={{ position: "absolute", right: 90, top: 76, fontWeight: 700, fontSize: 26, opacity: 0.9 }}>{clock}</div>
      {[br(70, 190, 1, 1, 0), br(1010, 190, -1, 1, 1), br(70, 1650, 1, -1, 2), br(1010, 1650, -1, -1, 3)]}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", gap: 40 }}><div style={{ width: 100, height: 100, borderRadius: 50, background: "rgba(20,24,36,.88)", border: "2px solid rgba(255,255,255,.65)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 21 }}>TALK</div><div style={{ width: 100, height: 100, borderRadius: 50, background: "#e0402c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 21 }}>LOCK</div></div>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0px, rgba(0,0,0,.10) 2px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 5px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)" }} />
    </AbsoluteFill>
  );
};
const Skin: React.FC<{ style: React.CSSProperties }> = ({ style }) => <div style={{ position: "absolute", background: "linear-gradient(160deg,#f6c9a4,#e8a47c)", boxShadow: "inset -10px -14px 28px rgba(150,70,40,.35), 0 10px 30px rgba(0,0,0,.4)", ...style }} />;
const PhoneUI: React.FC<{ ph: NonNullable<Shot["ph"]>; s: number; t: number; dark?: boolean }> = ({ ph, s, t, dark }) => {
  const connected = ph.mode !== "calling" || t > 17.25; const sec = ph.mode === "calling" ? (t > 17.25 ? Math.floor(t - 17.25) : 0) : ph.sec + Math.floor(s); const tm = `00:${String(Math.min(59, sec)).padStart(2, "0")}`;
  const speaking = (t > 17.3 && t < 19.3) || (t > 24.5 && t < 26.5) || (t > 34 && t < 37.3) || (t > 42.4 && t < 44.1) || (t > 45.4 && t < 46.4);
  const bars = Array.from({ length: 34 }, (_, i) => { const a = speaking ? 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + t * 11) * Math.sin(i * 0.6 + t * 5)) : 0.05; return <div key={i} style={{ width: 9, height: 100 * a + 8, borderRadius: 5, background: dark ? "#2fa88c" : "#3cd28c" }} />; });
  const tilt = `perspective(1700px) rotateY(${-7 + Math.sin(t * 0.8) * 1.5}deg) rotateX(${2 + Math.sin(t * 1.1)}deg) rotateZ(${1.5 + Math.sin(t * 0.7)}deg)`;
  const ring = (s * 0.9) % 1;
  return (
    <AbsoluteFill style={{ filter: dark ? "saturate(.7) brightness(.8) hue-rotate(10deg)" : "none" }}>
      <div style={{ position: "absolute", left: 150, top: 150, width: 790, height: 1620, transform: tilt, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 70, background: "#0b0b0e", border: "10px solid #1b1b20", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />
        <div style={{ position: "absolute", left: 58, top: 62, color: "#fff", fontFamily: sans, fontWeight: 700, fontSize: 24, opacity: 0.75 }}>12:05</div>
        <div style={{ position: "absolute", right: 58, top: 62, color: "#fff", fontFamily: sans, fontWeight: 700, fontSize: 24, opacity: 0.75 }}>{ph.mode === "failed" ? "No service" : "LTE"}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", color: "#ff4a5e", fontFamily: sans, fontWeight: 800, fontSize: 31, letterSpacing: 1 }}>EMERGENCY CALL</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", color: "#fff", fontFamily: sans, fontWeight: 900, fontSize: 250, letterSpacing: -6, textShadow: "0 0 14px rgba(255,255,255,.25)" }}>911</div>
        {ph.mode === "failed" ? <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#ff7a8a", fontFamily: sans, fontWeight: 800, fontSize: 44 }}>Call failed</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 625, textAlign: "center", color: "#8aa0d8", fontFamily: sans, fontWeight: 600, fontSize: 30 }}>Connection lost</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", color: "#ff4a5e", fontSize: 220, fontFamily: sans, fontWeight: 300 }}>&#x2715;</div>
        </> : !connected ? <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: 46 }}>Calling...</div>
          {[0, 1].map((i) => <div key={i} style={{ position: "absolute", left: 395 - 120 - ((ring + i * 0.5) % 1) * 90, top: 960 - 120 - ((ring + i * 0.5) % 1) * 90, width: 240 + ((ring + i * 0.5) % 1) * 180, height: 240 + ((ring + i * 0.5) % 1) * 180, borderRadius: "50%", border: "4px solid rgba(60,210,140,.8)", opacity: 1 - ((ring + i * 0.5) % 1) }} />)}
          <div style={{ position: "absolute", left: 395 - 105, top: 960 - 105, width: 210, height: 210, borderRadius: "50%", background: "#3cd28c" }} />
        </> : <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#3cd28c", fontFamily: sans, fontWeight: 800, fontSize: 46 }}>{tm}</div>
          <div style={{ position: "absolute", left: 90, right: 90, top: 880, height: 130, display: "flex", alignItems: "center", justifyContent: "space-between" }}>{bars}</div>
        </>}
        <div style={{ position: "absolute", left: 395 - 90, top: 1330, width: 180, height: 180, borderRadius: "50%", background: "#e8283c", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 80, height: 34, borderTop: "14px solid #fff", borderRadius: "80px 80px 0 0" }} /></div>
        {/* hand: big left thumb and three fingers on the right edge */}
        <Skin style={{ left: -90, top: 840, width: 190, height: 520, borderRadius: 110, transform: "rotate(14deg)" }} />
        {[0, 1, 2].map((i) => <Skin key={i} style={{ left: 735, top: 800 + i * 190, width: 190, height: 170, borderRadius: 90 }} />)}
      </div>
    </AbsoluteFill>
  );
};
const Cap: React.FC<{ t: number }> = ({ t }) => {
  const c = (CAPS as any[]).find((x) => t >= x.t0 && t < x.t1); if (!c) return null; const k = ease((t - c.t0) / 0.07);
  return <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", fontFamily: sans, fontWeight: 900, fontSize: 72, lineHeight: 1.05, color: COL[c.col], padding: "0 60px", textShadow: "0 0 2px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 6px 14px rgba(0,0,0,.6)", transform: `scale(${0.94 + 0.06 * k})`, opacity: k }}>{c.text}</div>;
};
const Banner: React.FC<{ s: number }> = ({ s }) => { const k = ease(s / 0.25) * (1 - ease((s - 1.8) / 0.25)); return <div style={{ position: "absolute", left: 60, right: 60, top: 70 - (1 - k) * 160, height: 118, borderRadius: 26, background: "#f4f4f6", display: "flex", alignItems: "center", gap: 22, padding: "0 28px", fontFamily: sans, boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}><div style={{ width: 62, height: 62, borderRadius: 16, background: "#2f78e8", color: "#fff", fontWeight: 900, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div><div><div style={{ fontWeight: 800, fontSize: 32, color: "#111" }}>Back Door</div><div style={{ fontWeight: 700, fontSize: 28, color: "#d8283c" }}>Motion detected</div></div></div>; };
const EndCard: React.FC<{ s: number }> = ({ s }) => {
  const k = ease((s - 0.2) / 0.5), b = ease((s - 0.7) / 0.4); if (k <= 0) return null;
  const btn = (bg: string, a: string, c: string) => <div style={{ background: bg, borderRadius: 16, padding: "24px 34px", fontWeight: 800, fontSize: 36, textAlign: "center", lineHeight: 1.05 }}>{a}<br />{c}</div>;
  return (
    <AbsoluteFill style={{ fontFamily: sans, color: "#fff", pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `rgba(4,6,20,${0.45 * k})` }} />
      <div style={{ position: "absolute", top: 1180, width: "100%", textAlign: "center", fontWeight: 900, fontSize: 88, lineHeight: 1.0, opacity: k }}>WHAT WOULD<br />YOU DO?</div>
      <div style={{ position: "absolute", top: 1440, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>{btn("#2f78e8", "OPEN THE", "FRONT DOOR")}<div style={{ fontWeight: 700, fontSize: 32 }}>OR</div>{btn("#d83b3b", "RUN AND", "HIDE")}</div>
      <div style={{ position: "absolute", top: 1650, width: "100%", textAlign: "center", fontWeight: 800, fontSize: 38, opacity: b }}>Comment for <span style={{ color: "#ffd21f" }}>Part 2</span></div>
    </AbsoluteFill>
  );
};

export const Style4Full: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#0c1020" }} />;
  const sh = SHOTS.find((x) => t >= x.a && t < x.b) ?? SHOTS[SHOTS.length - 1]; const s = t - sh.a; const dur = sh.b - sh.a;
  const k = sh.k; const phoneBg = k === "phone";
  const cam = phoneBg ? K([1.4, 1.2, -2.8], [1.9, 1.1, -3.43], 42) : camAt(sh.cam!, s, dur, t, sh.hands ? 1 : k === "porch" ? 0.5 : 0.6);
  const dark = !!sh.dark || k === "back"; const pov = !!sh.hands;
  const bgKind = phoneBg ? "door" : k;
  const focus = bgKind === "face" ? 0.55 : bgKind === "porch" || bgKind === "peep" ? new THREE.Vector3(...cam.p).distanceTo(new THREE.Vector3(0, 1.5, sh.c?.p[2] ?? 2.5)) : bgKind === "back" ? 5.5 : bgKind === "door" ? 1.6 : 3;
  const grade = sh.nv ? "grayscale(1) sepia(1) hue-rotate(60deg) saturate(2.4) brightness(.85) contrast(1.1)" : k === "porch" || k === "peep" ? "saturate(.8) contrast(1.05)" : "none";
  const figZ = sh.fig === 1 ? -5.3 : sh.fig === 2 ? mix(-5.3, -4.8, ease(s / dur)) : sh.fig === 3 ? mix(-4.8, -3.5, ease(s / dur)) : -5.3;
  const peepClip = k === "peep" ? "circle(410px at 50% 960px)" : "none";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: grade, clipPath: peepClip }}>
        <ThreeCanvas width={width} height={height} flat camera={{ fov: cam.fov, near: 0.03, far: 200, position: cam.p }} gl={{ antialias: true }}>
          <color attach="background" args={[k === "porch" || k === "peep" ? "#172a55" : dark ? "#14163a" : "#c8b898"]} />
          <Rig k={cam} pov={pov}>{pov ? <><PovF dark={dark ? 1 : 0} sway={Math.sin(t * 1.6)} /><pointLight position={[0, -0.05, -0.2]} color={dark ? "#8aa0ff" : "#ffe4cc"} intensity={dark ? 0.5 : 0.35} distance={1.2} /></> : null}</Rig>
          {bgKind === "room" ? <LivingF t={t} /> : null}
          {bgKind === "door" ? <LivingF t={t} dark={dark ? 1 : 0} /> : null}
          {bgKind === "face" ? <><LivingF t={t} dark={dark ? 1 : 0} /><Hero3D t={t} talk={!!sh.faceTalk && t >= sh.faceTalk[0] && t <= sh.faceTalk[1]} blue={!!sh.blue} /></> : null}
          {bgKind === "back" ? <>
            <BackRoomF t={t} light={sh.fig === 3 ? 1 : 0} />
            {sh.fig ? <group position={[0, 0, figZ]}><Courier p={[0, 0, 0]} yaw={0} s={0.95} t={t} mouth={0} />{sh.fig >= 2 ? <pointLight position={[0, 1.8, 0.8]} color="#9ab8ff" intensity={sh.fig === 3 ? 6 : 3} distance={4} /> : null}</group> : null}
          </> : null}
          {bgKind === "porch" || bgKind === "peep" ? <>
            <PorchF t={t} />
            {sh.c ? <Courier p={sh.c.p} yaw={Math.PI} s={1} t={t} mouth={talking(t, sh.talk)} wave={sh.c.wave ? Math.sin(t * 5) * 0 + 1 : 0} tilt={sh.c.tilt ?? 0} box={k === "porch" && !sh.c.wave} /> : null}
          </> : null}
          <PostFX focus={focus} range={bgKind === "face" ? 1.0 : phoneBg ? 0.5 : 3.5} bokeh={phoneBg ? 6 : bgKind === "face" ? 3.5 : 2.6} frame={frame} grain={0.16} />
        </ThreeCanvas>
      </AbsoluteFill>
      {k === "peep" ? <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 960px, rgba(0,0,0,0) 330px, rgba(0,0,0,.7) 412px, rgba(0,0,0,1) 414px)" }} /> : null}
      {phoneBg ? <PhoneUI ph={sh.ph!} s={s} t={t} dark={sh.dark} /> : null}
      {(k === "porch") ? <CamUI t={t} nv={!!sh.nv} /> : null}
      {t < 5.4 ? <Hud t={t} /> : null}
      {sh.banner ? <Banner s={s} /> : null}
      <Cap t={t} />
      {sh.end ? <EndCard s={s} /> : null}
      {audio ? <Audio src={staticFile("style4full_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};

