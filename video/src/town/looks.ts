import { LOOKS, type Look } from "../full/paint";
import { rng } from "../hotel/kit";

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (a: number[]) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a: string, b: string, k: number) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * k)); };

const SKINS = ["#f8efe6", "#f4e2d0", "#efd2b8", "#e2b894", "#cf9a70", "#b27a52", "#8d5a3c", "#6b4129"];
const HAIRS: [string, string][] = [["#2a1e20", "#5a4448"], ["#3d2a22", "#7d5a40"], ["#6a3a24", "#a8683f"], ["#b0562b", "#e08a50"], ["#d8b060", "#f2d890"], ["#8a8a92", "#d4d4dc"], ["#f0ece4", "#ffffff"], ["#8a2a20", "#c8503a"], ["#1a1416", "#45383c"]];
const SHIRTS = ["#2f9f93", "#e0592f", "#d9a82c", "#7a3d8f", "#2b4a8a", "#1f6f5f", "#cfe3f2", "#c24f8a", "#8a6a44", "#5a8a4a", "#c8503a", "#2b5fa8", "#e8b53a", "#a83a4a", "#4a7a9a", "#7a8a3a", "#d87a9a", "#3a3a5a", "#e8d8b0", "#9a5a3a", "#5a9a7a", "#b8a8d8"];
const PANTS = ["#4a3a44", "#3b3340", "#2c2530", "#4a4a3a", "#3a4a5a", "#5a4a3a", "#2a2a3a", "#6a5a4a", "#3a3a3a"];
const TIES = ["#c9403b", "#f2c53d", "#2b5fa8", "#8a3b2f", "#2f8a6a", "#7a3d8f", "#e8e0d0"];
const HATS: (Look["hat"])[] = ["none", "none", "none", "top", "bowler", "cap", "pith", "slouch", "cap", "none", "bowler"];
const HAT_COL: Record<string, string[]> = { top: ["#2a2630", "#3a2a3a", "#26222c"], bowler: ["#3a3340", "#5a3a2a", "#2f3a4a"], cap: ["#2b5fa8", "#8a3b2f", "#3a6a4a", "#d9a82c", "#5a5a66"], pith: ["#efe6d0", "#e8dcc0", "#d6c8a0"], slouch: ["#d6bf7a", "#8f7f4a", "#a8784a", "#6a5a3a"] };
const STYLES: Look["hairStyle"][] = ["side", "fringe", "side", "fringe", "bun", "bald"];

export const CROWD: string[] = [];
const r = rng(2024);
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
for (let i = 0; i < 44; i++) {
  const skin = SKINS[(i * 3 + Math.floor(r() * 3)) % SKINS.length]; const [hair, hairHi] = pick(HAIRS); const shirt = SHIRTS[(i * 5 + Math.floor(r() * 4)) % SHIRTS.length];
  const hat = pick(HATS); const woman = r() < 0.4; const style = woman ? (r() < 0.55 ? "bun" : "fringe") : pick(STYLES);
  const look: Look = {
    skin, skinShade: mix(skin, "#8a6cb0", 0.42), hair, hairHi, hairStyle: style,
    shirt, shirtShade: mix(shirt, "#2a1830", 0.32), shirtHi: mix(shirt, "#ffffff", 0.3), pants: pick(PANTS),
    tie: !woman && r() < 0.6 ? pick(TIES) : undefined, tie2: "rgba(255,255,255,.4)", collar: r() < 0.4 ? "#ffffff" : undefined, vest: r() < 0.22 ? mix(pick(SHIRTS), "#2a1830", 0.35) : undefined,
    hat: woman && hat === "top" ? "none" : hat, hatColor: hat && HAT_COL[hat] ? pick(HAT_COL[hat]) : undefined, hatBand: hat === "slouch" ? "#8a3b2f" : undefined,
    glasses: r() < 0.22, mustache: !woman && style !== "bun" && r() < 0.35, stripes: r() < 0.12,
  };
  const name = "t" + String(i).padStart(2, "0"); (LOOKS as Record<string, Look>)[name] = look; CROWD.push(name);
}
