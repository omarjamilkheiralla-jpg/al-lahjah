import timing from "./timing.json";
export const SENT = timing.sentences as { text: string; start: number; end: number; words: { w: string; t0: number; t1: number }[]; see: number[] | null }[];
export const TOTAL = timing.total as number;
export const ss = (i: number) => SENT[i].start;
export const se = (i: number) => SENT[i].end;
export const wt = (i: number, w: number) => SENT[i].words[Math.min(w, SENT[i].words.length - 1)].t0;
export const OX = { boston: 0, car: 300, court: 600 } as const;
export { clamp, sm, pop } from "../eiffel/timeline";
