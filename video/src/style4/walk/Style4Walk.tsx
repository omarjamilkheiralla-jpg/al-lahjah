import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, createPortal } from "@react-three/fiber";
import { PostQ } from "./PostQ";
import { ease, clamp, mix, type V3 } from "../kit5";
import { Skin, Banner, EndCard } from "../full/Style4Full";
import { HouseW, CourierW, HandsW, herm, walked, speedAt, flashAt, flickerAt, DOORBELL, PEEP } from "./W";
import CAPS from "./captions.json";
import TL from "./timeline.json";

/** STYLE 4, one continuous first-person take (68 s, 1080x1920, 30 fps): no cuts, the camera walks through the house. */
export const FPS = 30;
export const S4W_TOTAL = 68;
const sans = "Inter, Arial, Helvetica, sans-serif";
const rnd = "'Lilita One', Inter, Arial, sans-serif";
const OUT: React.CSSProperties = { WebkitTextStroke: "9px #000", paintOrder: "stroke fill" as any, textShadow: "0 5px 10px rgba(0,0,0,.5)" };
const FONTS: [string, string, string][] = [["Lilita One", "fonts/LilitaOne-Regular.ttf", "400"], ["Inter", "fonts/inter-latin-600-normal.woff2", "600"], ["Inter", "fonts/inter-latin-700-normal.woff2", "700"], ["Inter", "fonts/inter-latin-800-normal.woff2", "800"], ["Inter", "fonts/inter-latin-900-normal.woff2", "900"]];
let fp: Promise<void> | null = null;
const loadFonts = () => (fp ??= Promise.all(FONTS.map(async ([fam, path, w]) => { try { const f = new FontFace(fam, `url(${staticFile(path)})`, { weight: w }); await f.load(); (document as any).fonts.add(f); } catch { /* ignore */ } })).then(() => undefined));
const COL: Record<string, string> = { y: "#ffd21f", w: "#ffffff", b: "#5cc8ff", p: "#ff9aa8" };
const MODES: [number, number, "cam" | "camnv" | "call" | "failed"][] = [[5.0, 16.3, "cam"], [16.3, 19.9, "call"], [24.3, 28.0, "call"], [33.6, 38.0, "call"], [42.2, 44.6, "camnv"], [44.6, 46.8, "call"], [58.0, 60.6, "failed"]];
const SPEAK: [number, number][] = [[17.3, 19.3], [24.6, 26.6], [34.1, 37.4], [42.4, 44.1], [45.4, 46.4]];
const COURIER_TALK: [number, number][] = [[6.7, 10.3], [13.4, 16.1], [28.4, 31.2], [53.4, 56.7]];

const Rig: React.FC<{ p: V3; l: V3; fov: number; roll: number; pov: boolean; children?: React.ReactNode }> = ({ p, l, fov, roll, pov, children }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera; const scene = useThree((st) => st.scene);
  useLayoutEffect(() => { if (pov && camera.parent !== scene) scene.add(camera); camera.fov = fov; camera.near = 0.03; camera.far = 200; camera.updateProjectionMatrix(); camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...l); camera.rotateZ(roll); camera.updateMatrixWorld(true); });
  return pov ? createPortal(<>{children}</>, camera) : null;
};
const talking = (t: number) => (COURIER_TALK.some(([a, b]) => t >= a && t <= b) ? (Math.sin(t * 15) > -0.2 ? 0.55 + 0.3 * Math.sin(t * 9) : 0.12) : 0);
const Feed: React.FC<{ w: number; h: number; cam: { p: V3; l: V3 }; fov: number; t: number; frame: number }> = ({ w, h, cam, fov, t }) => (
  <ThreeCanvas width={w} height={h} flat shadows camera={{ fov, near: 0.03, far: 200, position: cam.p }} gl={{ antialias: true }}>
    <color attach="background" args={["#172a55"]} />
    <Rig p={cam.p} l={cam.l} fov={fov} roll={0} pov={false} />
    <HouseW t={t} /><CourierW t={t} mouth={talking(t)} />
  </ThreeCanvas>
);
const HudW: React.FC<{ t: number }> = ({ t }) => { const k = ease((t - 0.1) / 0.3) * (1 - ease((t - 4.7) / 0.5)); return <div style={{ position: "absolute", left: 40, top: 60, fontFamily: rnd, color: "#fff", opacity: k }}><div style={{ fontSize: 66, letterSpacing: 1, ...OUT }}>TUESDAY &middot; 12:04 AM</div><div style={{ fontSize: 40, color: "#ffd21f", marginTop: -4, ...OUT, WebkitTextStroke: "7px #000" }}>Home alone</div></div>; };
const Cap: React.FC<{ t: number }> = ({ t }) => {
  const c = (CAPS as any[]).find((x) => t >= x.t0 && t < x.t1); if (!c) return null; const k = ease((t - c.t0) / 0.07);
  return <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", fontFamily: rnd, fontSize: 84, lineHeight: 1.05, color: COL[c.col], padding: "0 50px", ...OUT, transform: `scale(${0.94 + 0.06 * k})`, opacity: k }}>{c.text}</div>;
};
const PhoneW: React.FC<{ mode: "cam" | "camnv" | "call" | "failed"; u: number; t: number; frame: number }> = ({ mode, u, t, frame }) => {
  const sec = Math.max(0, Math.floor(t - 17.25)); const tm = `00:${String(Math.min(59, sec)).padStart(2, "0")}`; const calling = t < 17.25;
  const speaking = SPEAK.some(([a, b]) => t > a && t < b);
  const bars = Array.from({ length: 34 }, (_, i) => { const a = speaking ? 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + t * 11) * Math.sin(i * 0.6 + t * 5)) : 0.05; return <div key={i} style={{ width: 9, height: 100 * a + 8, borderRadius: 5, background: "#3cd28c" }} />; });
  const tilt = `perspective(1700px) rotateY(${-7 + Math.sin(t * 0.8) * 1.5}deg) rotateX(${2 + Math.sin(t * 1.1)}deg) rotateZ(${1.5 + Math.sin(t * 0.7) + (1 - u) * 8}deg)`;
  const ring = (t * 0.9) % 1; const cam = mode === "cam" || mode === "camnv"; const clock = `12:04:${String(Math.min(59, 20 + Math.floor(t - 5))).padStart(2, "0")} AM`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 150, top: 150 + (1 - u) * 1800, width: 790, height: 1620, transform: tilt, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 70, background: "#0b0b0e", border: "10px solid #1b1b20", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />
        {cam ? <>
          <div style={{ position: "absolute", left: 18, top: 18, width: 754, height: 1584, borderRadius: 54, overflow: "hidden", filter: mode === "camnv" ? "grayscale(1) sepia(1) hue-rotate(60deg) saturate(2.6) brightness(.9) contrast(1.15)" : "saturate(.85) contrast(1.05)" }}>
            {u > 0.02 ? <Feed w={754} h={1584} cam={DOORBELL} fov={78} t={t} frame={frame} /> : null}
            <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0px, rgba(0,0,0,.10) 2px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 5px)" }} />
            <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%)" }} />
            <div style={{ position: "absolute", left: 44, top: 64, display: "flex", alignItems: "center", gap: 10, fontFamily: sans, color: "#fff", fontWeight: 800, fontSize: 30 }}><div style={{ width: 16, height: 16, borderRadius: 8, background: mode === "camnv" ? "#3cd25a" : Math.sin(t * 5) > -0.3 ? "#ff3b3b" : "#7a2020" }} />{mode === "camnv" ? "NIGHT VISION" : "LIVE"}</div>
            <div style={{ position: "absolute", left: 44, top: 104, fontFamily: sans, color: "rgba(255,255,255,.65)", fontWeight: 600, fontSize: 24 }}>Front Door</div>
            <div style={{ position: "absolute", right: 44, top: 70, fontFamily: sans, color: "#fff", fontWeight: 700, fontSize: 24 }}>{clock}</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", gap: 34, fontFamily: sans, color: "#fff", fontWeight: 800, fontSize: 20 }}><div style={{ width: 92, height: 92, borderRadius: 46, background: "rgba(20,24,36,.88)", border: "2px solid rgba(255,255,255,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>TALK</div><div style={{ width: 92, height: 92, borderRadius: 46, background: "#e0402c", display: "flex", alignItems: "center", justifyContent: "center" }}>LOCK</div></div>
          </div>
        </> : <>
          <div style={{ position: "absolute", left: 58, top: 62, color: "#fff", fontFamily: sans, fontWeight: 700, fontSize: 24, opacity: 0.75 }}>12:05</div>
          <div style={{ position: "absolute", right: 58, top: 62, color: "#fff", fontFamily: sans, fontWeight: 700, fontSize: 24, opacity: 0.75 }}>{mode === "failed" ? "No service" : "LTE"}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", color: "#ff4a5e", fontFamily: sans, fontWeight: 800, fontSize: 31, letterSpacing: 1 }}>EMERGENCY CALL</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", color: "#fff", fontFamily: rnd, fontSize: 270, letterSpacing: -2, textShadow: "8px 8px 0 rgba(255,255,255,.12)" }}>911</div>
          {mode === "failed" ? <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#ff7a8a", fontFamily: sans, fontWeight: 800, fontSize: 44 }}>Call failed</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 625, textAlign: "center", color: "#8aa0d8", fontFamily: sans, fontWeight: 600, fontSize: 30 }}>Connection lost</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", color: "#ff4a5e", fontSize: 220, fontFamily: sans, fontWeight: 300 }}>&#x2715;</div>
          </> : calling ? <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#fff", fontFamily: sans, fontWeight: 800, fontSize: 46 }}>Calling...</div>
            {[0, 1].map((i) => <div key={i} style={{ position: "absolute", left: 395 - 120 - ((ring + i * 0.5) % 1) * 90, top: 960 - 120 - ((ring + i * 0.5) % 1) * 90, width: 240 + ((ring + i * 0.5) % 1) * 180, height: 240 + ((ring + i * 0.5) % 1) * 180, borderRadius: "50%", border: "4px solid rgba(60,210,140,.8)", opacity: 1 - ((ring + i * 0.5) % 1) }} />)}
            <div style={{ position: "absolute", left: 395 - 105, top: 960 - 105, width: 210, height: 210, borderRadius: "50%", background: "#3cd28c" }} />
          </> : <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", color: "#3cd28c", fontFamily: sans, fontWeight: 800, fontSize: 46 }}>{tm}</div>
            <div style={{ position: "absolute", left: 90, right: 90, top: 880, height: 130, display: "flex", alignItems: "center", justifyContent: "space-between" }}>{bars}</div>
          </>}
          <div style={{ position: "absolute", left: 395 - 90, top: 1330, width: 180, height: 180, borderRadius: "50%", background: "#e8283c", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 80, height: 34, borderTop: "14px solid #fff", borderRadius: "80px 80px 0 0" }} /></div>
        </>}
        <Skin style={{ left: -90, top: 840, width: 190, height: 520, borderRadius: 110, transform: "rotate(14deg)" }} />
        {[0, 1, 2].map((i) => <Skin key={i} style={{ left: 735, top: 800 + i * 190, width: 190, height: 170, borderRadius: 90 }} />)}
      </div>
    </AbsoluteFill>
  );
};

export const Style4Walk: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false); const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#0c1020" }} />;
  // continuous camera: path + walking bob + handheld sway + thunder shake
  const v = speedAt(t); const w = clamp(v / 0.5); const ph = (walked(t) / 0.7) * Math.PI; const fl = flashAt(t), fk = flickerAt(t);
  const p = herm("p", t), l = herm("l", t);
  const P: V3 = [p[0] + Math.sin(ph) * 0.014 * w + Math.sin(t * 1.3) * 0.01, p[1] + Math.abs(Math.sin(ph)) * 0.032 * w - 0.01 + Math.sin(t * 2.1 + 1) * 0.008, p[2]];
  const Lk: V3 = [l[0] + Math.sin(t * 0.9) * 0.03 + fl * Math.sin(t * 90) * 0.02, l[1] - Math.abs(Math.sin(ph)) * 0.03 * w + Math.sin(t * 1.7) * 0.015, l[2]];
  const roll = Math.sin(ph) * 0.007 * w + Math.sin(t * 0.7) * 0.004;
  // phone (slides up into view, slides away: never a cut)
  const seg = MODES.find(([a, b]) => t >= a - 0.1 && t < b + 0.1);
  let u = 0; if (seg) { const merged = (a: number, b: number) => { let a2 = a, b2 = b; for (const [x, y] of MODES) { if (Math.abs(y - a2) < 0.2) a2 = Math.min(a2, x); if (Math.abs(x - b2) < 0.2) b2 = Math.max(b2, y); } return [a2, b2]; }; const [A, B] = merged(seg[0], seg[1]); u = ease((t - A) / 0.55) * ease((B - t) / 0.55); }
  const mode = (MODES.find(([a, b]) => t >= a && t < b) ?? seg ?? MODES[0])[2];
  const irisR = Math.max(0, ...TL.iris.map(([a, b]) => 430 * ease((t - a) / 0.6) * ease((b - t) / 0.6)));
  const dark = t > 40 ? 1 : 0; const dist = Math.hypot(P[0] - Lk[0], P[1] - Lk[1], P[2] - Lk[2]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: u > 0.01 ? `blur(${u * 7}px) brightness(${1 - u * 0.4})` : "none" }}>
        <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: 66, near: 0.03, far: 200, position: P }} gl={{ antialias: true }}>
          <color attach="background" args={["#14183a"]} />
          <Rig p={P} l={Lk} fov={t > 46 ? 58 : 64} roll={roll} pov>
            {u < 0.7 ? <HandsW t={t} dark={dark} /> : null}
          </Rig>
          <HouseW t={t} /><CourierW t={t} mouth={talking(t)} />
          <PostQ focus={Math.min(8, dist)} range={4} bokeh={2.6} frame={frame} grain={0.2} bloom={0.9 + fl * 0.6} />
        </ThreeCanvas>
      </AbsoluteFill>
      {irisR > 2 ? <>
        <AbsoluteFill style={{ clipPath: `circle(${irisR}px at 50% 960px)` }}><Feed w={width} h={height} cam={PEEP} fov={105} t={t} frame={frame} /></AbsoluteFill>
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 960px, rgba(0,0,0,0) ${irisR * 0.8}px, rgba(0,0,0,.65) ${irisR - 2}px, #a88a3a ${irisR}px, #4a3a14 ${irisR + 14}px, rgba(0,0,0,0) ${irisR + 15}px)` }} />
      </> : null}
      {u > 0.01 ? <PhoneW mode={mode} u={u} t={t} frame={frame} /> : null}
      {t < 5.4 ? <HudW t={t} /> : null}
      {t >= 50.3 && t < 52.5 ? <Banner s={t - 50.3} /> : null}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)", pointerEvents: "none" }} />
      <Cap t={t} />
      {t >= 62.2 ? <EndCard s={t - 62.2} /> : null}
      {fl > 0.02 ? <AbsoluteFill style={{ background: `rgba(210,225,255,${fl * 0.4})`, pointerEvents: "none" }} /> : null}
      {fk < 0.9 ? <AbsoluteFill style={{ background: `rgba(0,0,10,${(1 - fk) * 0.35})`, pointerEvents: "none" }} /> : null}
      {audio ? <Audio src={staticFile("style4walk_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
