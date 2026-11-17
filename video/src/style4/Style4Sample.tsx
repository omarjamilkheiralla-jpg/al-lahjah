import * as THREE from "three";
import React, { useLayoutEffect } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree, createPortal } from "@react-three/fiber";
import { PostFX } from "../hotel/PostFX";
import { G, MS, MB, Mesh, Person5, PovHands, NORA, COURIER, ease, clamp, mix, tex, type V3 } from "./kit5";
import { LivingRoom, Porch, Hallway, Rain } from "./world5";

/** STYLE 4 sample (10 s): "Package for you": first-person phone horror in the Two-Choices style. */
export const FPS = 30;
export const S4_TOTAL = 10;
const SEG = [0, 2.5, 5.1, 7.5, 10];
const sans = "Inter, Arial, Helvetica, sans-serif";

const FONTS: [string, string, string][] = [["Inter", "fonts/inter-latin-600-normal.woff2", "600"], ["Inter", "fonts/inter-latin-700-normal.woff2", "700"], ["Inter", "fonts/inter-latin-800-normal.woff2", "800"], ["Inter", "fonts/inter-latin-900-normal.woff2", "900"]];
let fp: Promise<void> | null = null;
const loadFonts4 = () => (fp ??= Promise.all(FONTS.map(async ([fam, path, w]) => { const f = new FontFace(fam, `url(${staticFile(path)})`, { weight: w }); await f.load(); (document as any).fonts.add(f); })).then(() => undefined).catch(() => undefined));

type Key = { t: number; p: V3; l: V3; fov?: number; roll?: number };
const Cam = (keys: Key[], s: number, tt: number, sway = 1) => {
  let i = 0; while (i < keys.length - 2 && s > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(keys.length - 1, i + 1)]; const k = ease((s - a.t) / Math.max(1e-4, b.t - a.t));
  const m = (u: V3, v: V3): V3 => [mix(u[0], v[0], k), mix(u[1], v[1], k), mix(u[2], v[2], k)];
  const p = m(a.p, b.p); const l = m(a.l, b.l);
  p[0] += Math.sin(tt * 1.3) * 0.012 * sway; p[1] += Math.sin(tt * 2.1 + 1) * 0.01 * sway; l[0] += Math.sin(tt * 0.9) * 0.02 * sway; l[1] += Math.sin(tt * 1.7) * 0.012 * sway;
  return { p, l, fov: mix(a.fov ?? 50, b.fov ?? 50, k), roll: mix(a.roll ?? 0, b.roll ?? 0, k) + Math.sin(tt * 0.7) * 0.004 * sway };
};
const CAM_FN = [
  (s: number, t: number) => Cam([{ t: 0, p: [0.0, 0.98, 2.0], l: [0.1, 0.95, -3], fov: 58 }, { t: 2.5, p: [0.05, 0.96, 1.5], l: [0.25, 0.9, -3], fov: 55 }], s, t),
  (s: number, t: number) => Cam([{ t: 0, p: [0.0, 1.45, 0.0], l: [0.0, 1.05, 3.2], fov: 84 }, { t: 2.6, p: [0.0, 1.4, 0.05], l: [0.0, 1.1, 3.2], fov: 78 }], s, t, 0.4),
  (s: number, t: number) => Cam([{ t: 0, p: [0.14, 1.12, 0.5], l: [0.2, 1.08, -1.5], fov: 34, roll: 0.02 }, { t: 2.4, p: [0.1, 1.1, -0.15], l: [0.2, 1.07, -1.5], fov: 27, roll: -0.015 }], s, t, 0.5),
  (s: number, t: number) => Cam([{ t: 0, p: [0.05, 0.98, 3.0], l: [0.15, 1.0, -2.3], fov: 60 }, { t: 2.5, p: [0.12, 0.96, -0.55], l: [0.28, 1.0, -2.3], fov: 56 }], s, t),
];
const Rig: React.FC<{ p: V3; l: V3; fov: number; roll: number; pov: boolean; children?: React.ReactNode }> = ({ p, l, fov, roll, pov, children }) => {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera; const scene = useThree((st) => st.scene);
  useLayoutEffect(() => { if (pov && camera.parent !== scene) scene.add(camera); camera.fov = fov; camera.near = 0.03; camera.far = 200; camera.updateProjectionMatrix(); camera.position.set(...p); camera.up.set(0, 1, 0); camera.lookAt(...l); camera.rotateZ(roll); camera.updateMatrixWorld(true); });
  return pov ? createPortal(<>{children}</>, camera) : null;
};

const blink = (t: number, o = 0) => { const k = (t + o) % 3.1; return k < 0.12 ? Math.sin((k / 0.12) * Math.PI) : 0; };
const Scene1: React.FC<{ s: number; t: number }> = ({ s, t }) => <LivingRoom t={t} />;
const Scene2: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const lean = ease(s / 1.2) * 0.1; const wave = Math.sin(t * 2.4) * 0.05;
  return (
    <>
      <Porch t={t} />
      <Person5 look={COURIER} p={[0.05, 0.0, 2.6]} yaw={Math.PI} s={1.6} waist pose={{ headX: 0.05 + lean * 0.5, headY: Math.sin(t * 0.8) * 0.05, headZ: wave * 0.4, blink: blink(t, 0.4), brow: 0.15, mouth: s > 1.4 && s < 2.4 ? (Math.sin(t * 15) > 0 ? 0.5 : 0.12) : 0, smile: 0.4, armR: [-1.0, 0.1], armL: [-1.0, 0.1], elbowR: 1.1, elbowL: 1.1, lean: -lean, breathe: Math.sin(t * 2) }} />
      <group position={[0.05, 0.78, 2.15]} rotation={[0.2, 0, 0]} scale={1.15}><Mesh g={G.rbox(0.42, 0.3, 0.32, 0.02)} m={MS("#ffffff", { map: "cardboard", rough: 0.8 })} /><Mesh g={G.box(0.05, 0.302, 0.322)} m={MS("#d8c8a8", { rough: 0.6 })} p={[0, 0, 0]} /><mesh position={[0, 0.02, 0.162]}><planeGeometry args={[0.18, 0.12]} /><meshStandardMaterial map={labelTex()} /></mesh></group>
    </>
  );
};
const labelTex = () => { const m = ((labelTex as any).c ??= new THREE.CanvasTexture((() => { const c = document.createElement("canvas"); c.width = 256; c.height = 170; const g = c.getContext("2d")!; g.fillStyle = "#fbfbf6"; g.fillRect(0, 0, 256, 170); g.fillStyle = "#101010"; g.font = "800 30px Inter"; g.fillText("NORA", 16, 50); g.font = "600 20px Inter"; g.fillText("14 Maple Lane", 16, 80); g.fillText("FROM: NORA", 16, 112); for (let i = 0; i < 28; i++) { g.fillRect(16 + i * 8, 128, 2 + (i * 7) % 4, 28); } return c; })())); m.colorSpace = THREE.SRGBColorSpace; return m as THREE.CanvasTexture; };
const Scene3: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const wide = ease(s / 0.5);
  return (
    <>
      <group position={[0, 0, -0.6]}><LivingRoom t={t} dim={0.55} /></group>
      <Person5 look={NORA} p={[0.2, 0.0, -1.5]} yaw={0.05} s={1.1} waist pose={{ headX: 0.04, headY: 0.06 * Math.sin(t * 0.9), headZ: 0.05, blink: blink(t, 1.2), brow: -0.35 * wide, browY: 0.004 * wide, mouth: s > 0.4 && s < 2.1 ? (Math.sin(t * 14) > 0 ? 0.45 : 0.1) : 0, smile: -0.4, look: [Math.sin(t * 0.8) * 0.4, -0.3], breathe: Math.sin(t * 2.4), armR: [0.1, 0.1], armL: [0.1, -0.1] }} />
      <pointLight position={[0.2, 1.05, -0.6]} color="#69a6ff" intensity={3.2} distance={3.5} />
    </>
  );
};
const Scene4: React.FC<{ s: number; t: number }> = ({ s, t }) => <Hallway t={t} lock={0} />;

const Hud1: React.FC<{ s: number }> = ({ s }) => {
  const k = ease(s / 0.3);
  return <div style={{ position: "absolute", left: 60, top: 70, fontFamily: sans, color: "#fff", opacity: k, textShadow: "0 0 3px #000, 0 2px 8px rgba(0,0,0,.7)" }}><div style={{ fontWeight: 800, fontSize: 44, letterSpacing: 1 }}>TUESDAY · 2:13 AM</div><div style={{ fontWeight: 700, fontSize: 30, color: "#ffd21f", marginTop: 2 }}>Home alone</div></div>;
};
const Cap: React.FC<{ text: string; color: string; s: number; t0: number; t1: number; top?: number }> = ({ text, color, s, t0, t1, top = 1330 }) => {
  if (s < t0 || s > t1) return null; const k = ease((s - t0) / 0.1) * (1 - ease((s - (t1 - 0.08)) / 0.08));
  return <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: sans, fontWeight: 800, fontSize: 70, lineHeight: 1.08, color, padding: "0 70px", textShadow: "0 0 2px #000, 0 0 6px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 6px 14px rgba(0,0,0,.6)", opacity: k, transform: `scale(${0.94 + 0.06 * k})` }}>{text}</div>;
};
const CamUI: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  const clock = `2:13:${String(23 + Math.floor(t - 2.5 + 0.0)).padStart(2, "0")} AM`; const rec = Math.sin(t * 5) > -0.3;
  return (
    <AbsoluteFill style={{ fontFamily: sans, color: "#fff", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 90, top: 70, display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 30, opacity: 0.95 }}><div style={{ width: 16, height: 16, borderRadius: 8, background: rec ? "#ff3b3b" : "#7a2020" }} />LIVE</div>
      <div style={{ position: "absolute", left: 90, top: 112, fontWeight: 600, fontSize: 25, opacity: 0.6 }}>Front Door</div>
      <div style={{ position: "absolute", right: 90, top: 76, fontWeight: 600, fontSize: 25, opacity: 0.9 }}>{clock}</div>
      {[[70, 190, 1, 1], [1010, 190, -1, 1], [70, 1650, 1, -1], [1010, 1650, -1, -1]].map(([x, y, sx, sy], i) => <div key={i} style={{ position: "absolute", left: Number(x) - (Number(sx) < 0 ? 50 : 0), top: Number(y) - (Number(sy) < 0 ? 50 : 0), width: 50, height: 50, borderTop: Number(sy) > 0 ? "3px solid rgba(255,255,255,.8)" : "none", borderBottom: Number(sy) < 0 ? "3px solid rgba(255,255,255,.8)" : "none", borderLeft: Number(sx) > 0 ? "3px solid rgba(255,255,255,.8)" : "none", borderRight: Number(sx) < 0 ? "3px solid rgba(255,255,255,.8)" : "none" }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", gap: 40 }}><div style={{ width: 96, height: 96, borderRadius: 48, background: "rgba(20,24,36,.85)", border: "2px solid rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>TALK</div><div style={{ width: 96, height: 96, borderRadius: 48, background: "#e0402c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>LOCK</div></div>
    </AbsoluteFill>
  );
};
const EndCard: React.FC<{ s: number }> = ({ s }) => {
  const k = ease((s - 0.9) / 0.5); if (k <= 0) return null; const b = ease((s - 1.3) / 0.4);
  return (
    <AbsoluteFill style={{ fontFamily: sans, color: "#fff", alignItems: "center", pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `rgba(4,6,14,${0.72 * k})` }} />
      <div style={{ position: "absolute", top: 1140, width: "100%", textAlign: "center", fontWeight: 900, fontSize: 84, lineHeight: 1.0, opacity: k, textShadow: "0 3px 0 rgba(0,0,0,.6)" }}>WHAT WOULD<br />YOU DO?</div>
      <div style={{ position: "absolute", top: 1420, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}><div style={{ background: "#2f78e8", borderRadius: 14, padding: "22px 30px", fontWeight: 800, fontSize: 34, textAlign: "center", lineHeight: 1.05 }}>OPEN THE<br />DOOR</div><div style={{ fontWeight: 700, fontSize: 30 }}>OR</div><div style={{ background: "#d83b3b", borderRadius: 14, padding: "22px 30px", fontWeight: 800, fontSize: 34, textAlign: "center", lineHeight: 1.05 }}>KEEP IT<br />LOCKED</div></div>
      <div style={{ position: "absolute", top: 1620, width: "100%", textAlign: "center", fontWeight: 800, fontSize: 36, opacity: b }}>Comment for <span style={{ color: "#ffd21f" }}>Part 2</span></div>
    </AbsoluteFill>
  );
};

export const Style4Sample: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const [ok, setOk] = React.useState(false);
  const { delayRender, continueRender } = useDelayRender();
  React.useEffect(() => { const h = delayRender("fonts"); loadFonts4().then(() => { setOk(true); continueRender(h); }); }, [delayRender, continueRender]);
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig(); const t = frame / FPS;
  if (!ok) return <AbsoluteFill style={{ background: "#0c1020" }} />;
  const idx = t >= SEG[3] ? 3 : t >= SEG[2] ? 2 : t >= SEG[1] ? 1 : 0; const s = t - SEG[idx];
  const cam = CAM_FN[idx](s, t); const pov = idx === 0 || idx === 3; const Sc = [Scene1, Scene2, Scene3, Scene4][idx];
  const alert = idx === 0 && s > 1.75; const buzz = idx === 0 ? clamp(1 - Math.abs(s - 1.95) / 0.45) * (s > 1.5 ? 1 : 0) : 0; const glow = alert ? 1 : 0.2;
  const subject = idx === 0 ? 0.62 : idx === 1 ? 2.3 : idx === 2 ? 1.5 : 1.5;
  const focus = idx === 0 ? 0.62 : idx === 1 ? 2.9 : idx === 2 ? new THREE.Vector3(...cam.p).distanceTo(new THREE.Vector3(0.2, 1.0, -1.5)) : 2.6; void subject;
  const reach = ease((s - 1.0) / 1.2); const fadeOut = idx === 3 ? ease((s - 1.9) / 0.6) : 0;
  const flash = idx > 0 ? Math.max(0, 1 - s / 0.1) * 0.35 : 0; const grade = idx === 1 ? "saturate(0.72) contrast(1.06) brightness(1.04)" : "none";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: grade }}>
        <ThreeCanvas width={width} height={height} flat shadows camera={{ fov: cam.fov, near: 0.03, far: 200, position: cam.p }} gl={{ antialias: true }}>
          <color attach="background" args={[idx === 1 ? "#0a1222" : "#0a0e1a"]} /><fog attach="fog" args={[idx === 1 ? "#0a1222" : "#0a0e1a", idx === 1 ? 14 : 8, idx === 1 ? 34 : 22]} />
          <Rig p={cam.p} l={cam.l} fov={cam.fov} roll={cam.roll} pov={pov}>
            {idx === 0 ? <><PovHands variant={alert ? "alert" : "lock"} buzz={buzz} glow={glow} /><pointLight position={[0, -0.08, -0.15]} color="#ffe4cc" intensity={0.18 + glow * 0.16} distance={1.0} /></> : null}
            {idx === 3 ? <pointLight position={[0.1, 0.05, -0.2]} color="#ffc890" intensity={0.8} distance={1.4} /> : null}
            {idx === 3 ? <group position={[mix(0.16, 0.03, reach), mix(-0.3, -0.045, reach), mix(-0.4, -0.5, reach)]} rotation={[mix(0.9, 0.2, reach), 0, mix(0.2, 0.0, reach)]}><Mesh g={G.cap(0.052, 0.3)} m={MS("#d23a30", { map: "knit", rx: 2, ry: 3, rough: 0.9 })} p={[0, -0.2, 0.02]} cast={false} /><Mesh g={G.sph(1, 24, 16)} m={MS("#efc2a0", { rough: 0.55 })} s={[0.04, 0.048, 0.026]} cast={false} />{[-0.022, -0.007, 0.008, 0.023].map((x, i) => <Mesh key={i} g={G.cap(0.0095, 0.034)} m={MS("#efc2a0", { rough: 0.55 })} p={[x, 0.055, 0.0]} r={[0.0, 0, (i - 1.5) * 0.06]} cast={false} />)}<Mesh g={G.cap(0.011, 0.03)} m={MS("#efc2a0", { rough: 0.55 })} p={[-0.036, 0.018, 0.008]} r={[0, 0, 0.8]} cast={false} /></group> : null}
          </Rig>
          <ambientLight intensity={0.08} />
          <Sc s={s} t={t} />
          {idx === 1 ? <pointLight position={[0.2, 1.7, 0.9]} color="#a8c0ff" intensity={2.6} distance={7} /> : null}
          {idx === 2 ? <><pointLight position={[0.15, 0.9, -0.3]} color="#7fb0ff" intensity={2.4} distance={3} /><pointLight position={[-0.7, 1.5, -0.6]} color="#ffc890" intensity={2.2} distance={4} /></> : null}
          <PostFX focus={focus} range={idx === 2 ? 1.2 : 3.2} bokeh={idx === 2 ? 4.5 : 3.0} frame={frame} grain={0.22} />
        </ThreeCanvas>
      </AbsoluteFill>
      {idx === 1 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)" }} /> : null}
      {idx === 1 ? <CamUI s={s} t={t} /> : null}
      {idx === 0 ? <Hud1 s={s} /> : null}
      {idx === 0 ? <Cap text="Two a.m.?" color="#ffd21f" s={s} t0={0.35} t1={1.6} top={1090} /> : null}
      {idx === 1 ? <Cap text="Package for you, Nora." color="#ffffff" s={s} t0={0.5} t1={2.5} top={1380} /> : null}
      {idx === 2 ? <Cap text="I didn't order anything." color="#ffd21f" s={s} t0={0.4} t1={2.3} /> : null}
      {idx === 3 ? <Cap text="It's from you." color="#ffffff" s={s} t0={0.2} t1={1.4} /> : null}
      {idx === 3 ? <EndCard s={s} /> : null}
      {idx === 3 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${fadeOut * 0.0})` }} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}
      {audio ? <Audio src={staticFile("style4_mix.wav")} /> : null}
    </AbsoluteFill>
  );
};
