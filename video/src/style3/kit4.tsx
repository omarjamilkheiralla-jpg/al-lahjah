import * as THREE from "three";
import React from "react";
import { createPortal } from "@react-three/fiber";
import { buildRig, HC, EYE_H, type LookR, type Rig } from "./rig";
import type { Look2, Pose2 } from "./kit2";
import type { V3 } from "./kit";
export { BEN2, GARY2, MIA2, GREY2, walkP } from "./kit2";
export type { Pose2 as Pose4 } from "./kit2";

/** Person v4: smooth skinned bodies. Same props as v2/v3 so scenes keep working. */
const toLook = (L: Look2, stain?: boolean): LookR => ({ kind: L.kind, skin: L.skin, hair: L.hair, top: L.top, pants: L.pants, shoe: L.shoe, sole: L.sole, vest: L.vest, shades: L.shades, sleeveless: L.sleeveless, stain } as LookR);
const A0 = 0.28; const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ez = (x: number) => x;
export const applyPose = (rig: Rig, pose: Pose2, shadesOn: boolean) => {
  const m = rig.map; const { walk, amp = 0.5, crouch = 0, lean = 0, bob = 0, twist = 0, sit = false, rArm, lArm, rElbow = 0.2, lElbow = 0.2, rGrip = 0, lGrip = 0, headX = 0, headY = 0, headZ = 0, expr = "calm", legSpread = 0, blink = 0, mouthOpen = 0 } = pose;
  const walking = walk !== undefined; const ph = walk ?? 0;
  const thR = walking ? Math.sin(ph) * amp : 0, thL = walking ? -Math.sin(ph) * amp : 0;
  const knR = walking ? Math.max(0, Math.cos(ph)) * amp * 1.4 : 0, knL = walking ? Math.max(0, -Math.cos(ph)) * amp * 1.4 : 0;
  const cT = sit ? -1.5 : -1.3 * crouch, cK = sit ? 1.5 : 2.3 * crouch;
  const hipY = 0.09 + 0.41 * Math.cos(cT + cK) + 0.43 * Math.cos(cT);
  m.hips.position.y = 0.95 + (hipY - 0.93) + bob + (walking ? Math.abs(Math.cos(ph)) * 0.035 : 0);
  m.hips.rotation.set(walking ? Math.sin(ph * 2) * 0.02 : 0, walking ? -Math.sin(ph) * 0.1 * amp * 2 : 0, walking ? Math.sin(ph) * 0.035 : 0);
  m.spine.rotation.set(lean * 0.45, twist * 0.5 + (walking ? Math.sin(ph) * 0.12 * amp * 2 : 0), walking ? -Math.sin(ph) * 0.03 : 0);
  m.chest.rotation.set(lean * 0.55, twist * 0.5, 0);
  for (const [S, s, th, kn] of [["L", -1, thL, knL], ["R", 1, thR, knR]] as const) {
    m["th" + S].rotation.set(cT + th, 0, s * legSpread * 1.5); m["sn" + S].rotation.set(cK + kn, 0, 0); m["ft" + S].rotation.set(-(cT + th + cK + kn) + (walking ? Math.max(0, -Math.sin(ph) * s) * 0.2 : 0), 0, 0);
  }
  const aR: [number, number] = rArm ?? [walking ? -Math.sin(ph) * amp * 0.9 : 0.05, 0.1]; const aL: [number, number] = lArm ?? [walking ? Math.sin(ph) * amp * 0.9 : 0.05, -0.1];
  m.uaR.rotation.set(aR[0], 0, aR[1] - A0); m.uaL.rotation.set(aL[0], 0, aL[1] + A0); m.faR.rotation.set(-rElbow, 0, 0); m.faL.rotation.set(-lElbow, 0, 0);
  for (const [S, s, g] of [["L", -1, lGrip], ["R", 1, rGrip]] as const) { const c = 0.16 + g * 1.2; m["f1" + S].rotation.set(0, 0, -s * c); m["f2" + S].rotation.set(0, 0, -s * c * 0.95); m["t1" + S].rotation.set(-(0.15 + g * 0.5), 0, 0); m["t2" + S].rotation.set(-(0.1 + g * 0.5), 0, 0); m["hd" + S].rotation.set(0.05, 0, 0); }
  m.neck.rotation.set(headX * 0.4, headY * 0.4, headZ * 0.4); m.head.rotation.set(headX * 0.6, headY * 0.6, headZ * 0.6);
  const e = expr as string; const f = rig.face;
  const open = ({ sleepy: 0.3, smug: 0.55, calm: 0.74, annoyed: 0.52, smile: 0.62, sad: 0.6, shock: 1.0, shout: 0.88 } as any)[e] ?? 0.7; const cover = (1 - clamp01(open * (1 - blink))) * 2 * EYE_H;
  const brow = ({ calm: 0.04, smile: -0.1, smug: 0.2, shock: -0.28, shout: 0.38, sad: -0.4, annoyed: 0.5, sleepy: 0.0 } as any)[e] ?? 0.04; const by = ({ shock: 0.007, sad: 0.002, annoyed: -0.003, smug: -0.0005 } as any)[e] ?? 0;
  f.eyes.forEach((eye, idx) => { const sd = idx === 0 ? -1 : 1; const c = Math.max(0.0001, cover); eye.lid.visible = cover > 0.0004; eye.line.visible = true; eye.lid.scale.set(1, Math.max(0.0001, c / 2 + 0.0004), 1); eye.lid.position.y = EYE_H - c / 2 + 0.0002; eye.line.position.y = EYE_H - c - 0.0003; eye.line.scale.set(1, cover > 0.0004 ? 1 : 1.2, 1); eye.brow.rotation.z = sd * brow; eye.brow.position.y = EYE_H + 0.0105 + by; eye.brow.visible = !shadesOn; eye.grp.visible = !shadesOn; });
  const mo = Math.max(mouthOpen, e === "shock" ? 0.65 : e === "shout" ? 1.0 : 0); m.jaw.rotation.x = mo * 0.2;
  f.mouthIn.visible = mo > 0.08; f.mouthIn.scale.set(1 + mo * 0.1, 0.3 + mo * 1.0, 1); f.teeth.visible = mo > 0.4;
  const sm = e === "smile" ? 1 : e === "smug" ? 0.55 : e === "sad" || e === "annoyed" ? -0.55 : 0; f.smile.visible = Math.abs(sm) > 0.05 && mo < 0.3; f.mline.visible = mo < 0.2; f.smile.rotation.z = sm >= 0 ? Math.PI : 0; f.smile.scale.set(1, 0.18 + Math.abs(sm) * 0.35, 1);
  f.shades.visible = shadesOn;
};
export const Person: React.FC<{ look: Look2; p: V3; yaw?: number; pose?: Pose2; s?: number; itemR?: React.ReactNode; itemL?: React.ReactNode; rim?: string; stain?: boolean; itemRRot?: V3; itemLRot?: V3; itemROffset?: V3; itemLOffset?: V3 }> = ({ look, p, yaw = 0, pose = {}, s = 1, itemR, itemL, rim, stain, itemRRot = [0, 0, 0], itemLRot = [0, 0, 0], itemROffset = [0, 0, 0], itemLOffset = [0, 0, 0] }) => {
  const key = `${look.kind}${look.skin}${look.top}${look.pants}${look.hair}${look.shoe}${rim ?? ""}${stain ? "s" : ""}`;
  const rig = React.useMemo(() => buildRig(toLook(look, stain), rim), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const gR = React.useRef<THREE.Group>(null), gL = React.useRef<THREE.Group>(null);
  const shadesOn = pose.shadesOn ?? !!look.shades;
  React.useLayoutEffect(() => {
    applyPose(rig, pose, shadesOn); rig.root.updateMatrixWorld(true);
    for (const [g, bone, rot, off, base] of [[gR.current, rig.map.hdR, itemRRot, itemROffset, [-0.012, -0.07, 0.02]], [gL.current, rig.map.hdL, itemLRot, itemLOffset, [0.012, -0.07, 0.02]]] as const) { if (!g) continue; const q = new THREE.Quaternion(); bone.getWorldQuaternion(q); const inv = q.clone().invert(); g.quaternion.copy(inv); g.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))); const o = new THREE.Vector3(off[0] / s, off[1] / s, off[2] / s).applyQuaternion(inv); g.position.set(base[0] + o.x, base[1] + o.y, base[2] + o.z); }
  });
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <primitive object={rig.root} />
      {itemR ? createPortal(<group ref={gR} position={[-0.012, -0.07, 0.02]}>{itemR}</group>, rig.map.hdR) : null}
      {itemL ? createPortal(<group ref={gL} position={[0.012, -0.07, 0.02]}>{itemL}</group>, rig.map.hdL) : null}
    </group>
  );
};
void HC; void ez;
