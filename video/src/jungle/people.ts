/* Character looks for "She Fell Two Miles Out of the Sky" (painted Person2 characters). Registering them in LOOKS on import. */
import { LOOKS, type Look } from "../full/paint";
import "../town/looks";   // registers the 44 generated crowd looks t00..t43 (passengers)

const add = (name: string, l: Look) => { (LOOKS as Record<string, Look>)[name] = l; };
const SK = "#f8efe6", SKS = "#c6b4cc";
add("jul", { skin: SK, skinShade: SKS, hair: "#d8b060", hairHi: "#f6e2a0", hairStyle: "fringe", shirt: "#eef2f4", shirtShade: "#b4c2cc", shirtHi: "#ffffff", pants: "#d8c8a8", collar: "#f2c8d0" });
add("julMud", { skin: "#efdcc8", skinShade: "#b89aa8", hair: "#b89458", hairHi: "#d8bc80", hairStyle: "fringe", shirt: "#c8bea4", shirtShade: "#8e8468", shirtHi: "#e0d8c2", pants: "#8a7a5a", collar: "#c8a8a0" });
add("julYoung", { skin: SK, skinShade: SKS, hair: "#e0bc6a", hairHi: "#fae8b0", hairStyle: "fringe", shirt: "#e8a040", shirtShade: "#b07020", shirtHi: "#f8c070", pants: "#4a5a7a", collar: "#ffffff" });
add("mom", { skin: SK, skinShade: SKS, hair: "#5a3a2a", hairHi: "#8a5a40", hairStyle: "bun", shirt: "#3f8a6a", shirtShade: "#24604a", shirtHi: "#6ab08e", pants: "#3a3a46", collar: "#ffffff" });
add("dad", { skin: SK, skinShade: SKS, hair: "#7a5a3a", hairHi: "#b08a60", hairStyle: "side", shirt: "#c8b88a", shirtShade: "#948458", shirtHi: "#e6d8ae", pants: "#5a5040", glasses: true, collar: "#c8b88a", hat: "pith", hatColor: "#e8dcc0" });
add("dadPlain", { skin: SK, skinShade: SKS, hair: "#7a5a3a", hairHi: "#b08a60", hairStyle: "side", shirt: "#c8b88a", shirtShade: "#948458", shirtHi: "#e6d8ae", pants: "#5a5040", glasses: true, collar: "#c8b88a" });
add("log1", { skin: "#cf9a70", skinShade: "#8a6070", hair: "#1a1416", hairHi: "#45383c", hairStyle: "side", shirt: "#c8503a", shirtShade: "#8a3220", shirtHi: "#e8806a", pants: "#3a3a46", hat: "slouch", hatColor: "#8f7f4a", hatBand: "#4a3a22", mustache: true, vest: "#5a4a30" });
add("log2", { skin: "#b27a52", skinShade: "#7a5060", hair: "#2a1e20", hairHi: "#5a4448", hairStyle: "fringe", shirt: "#2f6aa8", shirtShade: "#1b4278", shirtHi: "#5a8ad0", pants: "#4a3a2a", hat: "cap", hatColor: "#e8c040" });
add("log3", { skin: "#8d5a3c", skinShade: "#5e3a40", hair: "#1a1416", hairHi: "#45383c", hairStyle: "bald", shirt: "#5a8a4a", shirtShade: "#3a6030", shirtHi: "#86b872", pants: "#3a3236", mustache: true, hat: "slouch", hatColor: "#d6bf7a", hatBand: "#8a3b2f" });
add("julOld", { skin: SK, skinShade: SKS, hair: "#d8ccb0", hairHi: "#f4ecd8", hairStyle: "bun", shirt: "#7a8a5a", shirtShade: "#56643c", shirtHi: "#a0b07a", pants: "#5a5040", glasses: true, collar: "#7a8a5a" });
add("pilot", { skin: SK, skinShade: SKS, hair: "#3a2a22", hairHi: "#7a5a40", hairStyle: "side", shirt: "#f4f4f0", shirtShade: "#c0c0c8", shirtHi: "#ffffff", pants: "#2a2a3a", tie: "#2a2a3a", tie2: "rgba(255,255,255,.3)", hat: "cap", hatColor: "#1f2a4a", mustache: true });
export const PASSENGERS = Array.from({ length: 44 }, (_, i) => "t" + String(i).padStart(2, "0"));
