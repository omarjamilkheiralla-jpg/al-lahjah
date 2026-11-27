import timing from "./timing.json";
export const SENT = timing.sentences as { text: string; start: number; end: number; words: { w: string; t0: number; t1: number }[]; see: number[] | null }[];
export const TOTAL = timing.total as number;
export const ss = (i: number) => SENT[i].start;
export const se = (i: number) => SENT[i].end;
/** start time of word w (whitespace tokens) of sentence i */
export const wt = (i: number, w: number) => SENT[i].words[Math.min(w, SENT[i].words.length - 1)].t0;
export const OX = { street: 0, attic: 200, desk: 400, salon: 600, station: 800, study: 1000, modern: 1200, roofs: 1400 } as const;
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x: number) => { const k = clamp(x); return k * k * (3 - 2 * k); };
export const pop = (x: number) => { const k = clamp(x); return k < 0.6 ? sm(k / 0.6) * 1.18 : 1.18 - 0.18 * sm((k - 0.6) / 0.4); };
