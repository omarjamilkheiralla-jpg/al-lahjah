import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { seeded } from "./kit";

/** STYLE 3 rig: organic bodies from signed-distance fields (surface nets), skinned to a real skeleton, faceted flat shading + per-triangle colour. */
export type V = [number, number, number];
export type SDF = (x: number, y: number, z: number) => number;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const smin = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);
export const sph = (c: V, r: number): SDF => (x, y, z) => Math.hypot(x - c[0], y - c[1], z - c[2]) - r;
export const cone2 = (a: V, b: V, ra: number, rb: number): SDF => { const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2]; const l2 = ax * ax + ay * ay + az * az || 1e-9; return (x, y, z) => { const t = clamp(((x - a[0]) * ax + (y - a[1]) * ay + (z - a[2]) * az) / l2); return Math.hypot(x - a[0] - ax * t, y - a[1] - ay * t, z - a[2] - az * t) - (ra + (rb - ra) * t); }; };
export const ellip = (c: V, r: V): SDF => (x, y, z) => { const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2]; const k0 = Math.hypot(px, py, pz); const k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]); return k1 < 1e-9 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1; };
export const box = (c: V, h: V): SDF => (x, y, z) => { const qx = Math.abs(x - c[0]) - h[0], qy = Math.abs(y - c[1]) - h[1], qz = Math.abs(z - c[2]) - h[2]; return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0); };
export const U = (k: number, ...fs: SDF[]): SDF => (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k); return d; };

/* ------------------------------------------------------------------ surface nets */
const surfaceNets = (f: SDF, mn: V, mx: V, h: number, smooth = 2) => {
  const nx = Math.ceil((mx[0] - mn[0]) / h) + 1, ny = Math.ceil((mx[1] - mn[1]) / h) + 1, nz = Math.ceil((mx[2] - mn[2]) / h) + 1;
  const F = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[i + nx * (j + ny * k)] = f(mn[0] + i * h, mn[1] + j * h, mn[2] + k * h);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1; const cell = new Int32Array(cx * cy * cz).fill(-1); const verts: number[] = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]; const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v8 = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let m = 0; for (let c = 0; c < 8; c++) { v8[c] = F[i + C[c][0] + nx * (j + C[c][1] + ny * (k + C[c][2]))]; if (v8[c] < 0) m |= 1 << c; }
    if (m === 0 || m === 255) continue; let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) { const va = v8[a], vb = v8[b]; if ((va < 0) !== (vb < 0)) { const t = va / (va - vb); sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++; } }
    cell[i + cx * (j + cy * k)] = verts.length / 3; verts.push(mn[0] + (i + sx / n) * h, mn[1] + (j + sy / n) * h, mn[2] + (k + sz / n) * h);
  }
  const idx: number[] = []; const cid = (i: number, j: number, k: number) => cell[i + cx * (j + cy * k)];
  const quad = (a: number, b: number, c: number, d: number, dir: V, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return; const P = (q: number) => [verts[q * 3], verts[q * 3 + 1], verts[q * 3 + 2]];
    const Q = [P(a), P(b), P(c), P(d)]; let nxv = 0, nyv = 0, nzv = 0; for (let i = 0; i < 4; i++) { const p0 = Q[i], p1 = Q[(i + 1) % 4]; nxv += (p0[1] - p1[1]) * (p0[2] + p1[2]); nyv += (p0[2] - p1[2]) * (p0[0] + p1[0]); nzv += (p0[0] - p1[0]) * (p0[1] + p1[1]); } const dot = (nxv * dir[0] + nyv * dir[1] + nzv * dir[2]) * (flip ? -1 : 1);
    if (dot >= 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 0; i < cx; i++) { const a = F[i + nx * (j + ny * k)], b = F[i + 1 + nx * (j + ny * k)]; if ((a < 0) !== (b < 0)) quad(cid(i, j - 1, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i, j - 1, k), [1, 0, 0], a >= 0); }
  for (let k = 1; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 1; i < cx; i++) { const a = F[i + nx * (j + ny * k)], b = F[i + nx * (j + 1 + ny * k)]; if ((a < 0) !== (b < 0)) quad(cid(i - 1, j, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i - 1, j, k), [0, 1, 0], a >= 0); }
  for (let k = 0; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) { const a = F[i + nx * (j + ny * k)], b = F[i + nx * (j + ny * (k + 1))]; if ((a < 0) !== (b < 0)) quad(cid(i - 1, j - 1, k), cid(i, j - 1, k), cid(i, j, k), cid(i - 1, j, k), [0, 0, 1], a >= 0); }
  if (smooth > 0) { const nV = verts.length / 3; const nb: number[][] = Array.from({ length: nV }, () => []); for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const a = idx[t + k], b = idx[t + (k + 1) % 3]; nb[a].push(b); nb[b].push(a); } for (let it = 0; it < smooth; it++) { const nv = verts.slice(); for (let q = 0; q < nV; q++) { const L = nb[q]; if (!L.length) continue; let sx = 0, sy = 0, sz = 0; for (const o of L) { sx += verts[o * 3]; sy += verts[o * 3 + 1]; sz += verts[o * 3 + 2]; } nv[q * 3] = verts[q * 3] * 0.45 + (sx / L.length) * 0.55; nv[q * 3 + 1] = verts[q * 3 + 1] * 0.45 + (sy / L.length) * 0.55; nv[q * 3 + 2] = verts[q * 3 + 2] * 0.45 + (sz / L.length) * 0.55; } for (let q = 0; q < verts.length; q++) verts[q] = nv[q]; } }
  return { verts, idx };
};

/* ------------------------------------------------------------------ skeleton */
export const BONE_DEFS: { n: string; p: string; w: V }[] = (() => {
  const L: { n: string; p: string; w: V }[] = [{ n: "hips", p: "root", w: [0, 0.95, 0] }, { n: "spine", p: "hips", w: [0, 1.02, 0] }, { n: "chest", p: "spine", w: [0, 1.2, 0] }, { n: "neck", p: "chest", w: [0, 1.47, 0] }, { n: "head", p: "neck", w: [0, 1.6, 0] }, { n: "jaw", p: "head", w: [0, 1.64, -0.01] }];
  for (const s of [-1, 1]) {
    const S = s < 0 ? "L" : "R"; const sh: V = [s * 0.2, 1.43, 0], el: V = [sh[0] + s * Math.sin(0.28) * 0.29, sh[1] - Math.cos(0.28) * 0.29, 0], wr: V = [el[0] + s * Math.sin(0.22) * 0.26, el[1] - Math.cos(0.22) * 0.26, 0.02];
    L.push({ n: "sh" + S, p: "chest", w: sh }, { n: "ua" + S, p: "sh" + S, w: sh }, { n: "fa" + S, p: "ua" + S, w: el }, { n: "hd" + S, p: "fa" + S, w: wr }, { n: "f1" + S, p: "hd" + S, w: [wr[0], wr[1] - 0.1, wr[2]] }, { n: "f2" + S, p: "f1" + S, w: [wr[0], wr[1] - 0.15, wr[2]] }, { n: "t1" + S, p: "hd" + S, w: [wr[0] - s * 0.012, wr[1] - 0.04, wr[2] + 0.024] }, { n: "t2" + S, p: "t1" + S, w: [wr[0] - s * 0.016, wr[1] - 0.075, wr[2] + 0.04] });
    L.push({ n: "th" + S, p: "hips", w: [s * 0.095, 0.93, 0] }, { n: "sn" + S, p: "th" + S, w: [s * 0.09, 0.5, 0.01] }, { n: "ft" + S, p: "sn" + S, w: [s * 0.085, 0.09, 0] });
  }
  return L;
})();
const BIDX: Record<string, number> = {}; BONE_DEFS.forEach((b, i) => (BIDX[b.n] = i));
const W = (n: string) => BONE_DEFS[BIDX[n]].w;
export const makeBones = () => {
  const root = new THREE.Bone(); root.name = "root"; const map: Record<string, THREE.Bone> = { root }; const list: THREE.Bone[] = [];
  BONE_DEFS.forEach((d) => { const b = new THREE.Bone(); b.name = d.n; const pw = d.p === "root" ? ([0, 0, 0] as V) : W(d.p); b.position.set(d.w[0] - pw[0], d.w[1] - pw[1], d.w[2] - pw[2]); map[d.p].add(b); map[d.n] = b; list.push(b); });
  return { root, map, list };
};
type Seg = { b: string; a: V; c: V; r: number };
const segDist = (p: V, a: V, c: V) => { const ax = c[0] - a[0], ay = c[1] - a[1], az = c[2] - a[2]; const l2 = ax * ax + ay * ay + az * az || 1e-9; const t = clamp(((p[0] - a[0]) * ax + (p[1] - a[1]) * ay + (p[2] - a[2]) * az) / l2); return Math.hypot(p[0] - a[0] - ax * t, p[1] - a[1] - ay * t, p[2] - a[2] - az * t); };
const weightsFor = (p: V, segs: Seg[], sigma = 0.02): [number[], number[]] => {
  const best: Record<string, number> = {}; for (const s of segs) { const d = Math.max(0, segDist(p, s.a, s.c) - s.r); if (best[s.b] === undefined || d < best[s.b]) best[s.b] = d; }
  const arr = Object.entries(best).map(([b, d]) => [b, d] as [string, number]).sort((a, b) => a[1] - b[1]).slice(0, 4); const d0 = arr[0][1];
  const ws = arr.map(([, d]) => Math.exp(-(d - d0) / sigma)); const sum = ws.reduce((a, b) => a + b, 0);
  const si = [0, 0, 0, 0], sw = [0, 0, 0, 0]; arr.forEach(([b], i) => { si[i] = BIDX[b]; sw[i] = ws[i] / sum; }); return [si, sw];
};
const bodySegs = (): Seg[] => {
  const segs: Seg[] = [{ b: "hips", a: [0, 0.93, 0], c: [0, 1.0, 0], r: 0.12 }, { b: "spine", a: [0, 1.02, 0], c: [0, 1.18, 0], r: 0.12 }, { b: "chest", a: [0, 1.22, 0], c: [0, 1.44, 0], r: 0.15 }, { b: "neck", a: [0, 1.47, 0], c: [0, 1.57, 0], r: 0.045 }];
  for (const s of ["L", "R"]) { const g = (n: string) => W(n); segs.push({ b: "ua" + s, a: g("ua" + s), c: g("fa" + s), r: 0.05 }, { b: "fa" + s, a: g("fa" + s), c: g("hd" + s), r: 0.04 }, { b: "th" + s, a: g("th" + s), c: g("sn" + s), r: 0.08 }, { b: "sn" + s, a: g("sn" + s), c: g("ft" + s), r: 0.05 }, { b: "ft" + s, a: g("ft" + s), c: [g("ft" + s)[0], 0.02, 0.15], r: 0.04 }); }
  return segs;
};

/* ------------------------------------------------------------------ bodies */
export type LookR = { stain?: boolean; kind: "ben" | "gary" | "mia" | "grey"; skin: string; hair: string; top: string; pants: string; shoe: string; sole: string; vest?: string; shades?: boolean; sleeveless?: boolean; iris?: string };
const memo = <T,>(k: string, f: () => T): T => { const m = ((memo as any).c ??= new Map()); if (!m.has(k)) m.set(k, f()); return m.get(k); };
const bodyField = (): SDF => {
  const parts: SDF[] = [];
  const torso = U(0.06, ellip([0, 1.36, 0], [0.14, 0.195, 0.092]), ellip([0, 1.14, 0], [0.115, 0.17, 0.082]), ellip([0, 0.99, 0], [0.142, 0.105, 0.098]), ellip([-0.078, 1.4, 0.058], [0.088, 0.06, 0.05]), ellip([0.078, 1.4, 0.058], [0.088, 0.06, 0.05]), ellip([0, 1.47, -0.03], [0.09, 0.05, 0.056]));
  parts.push(torso);
  for (const s of [-1, 1]) {
    const S = s < 0 ? "L" : "R"; const sh = W("ua" + S), el = W("fa" + S), wr = W("hd" + S), hip = W("th" + S), kn = W("sn" + S), an = W("ft" + S);
    parts.push(U(0.03, sph([sh[0], sh[1], 0], 0.054), cone2([sh[0], sh[1], 0], el, 0.05, 0.037), sph([(sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2 + 0.03, 0.01], 0.044), cone2(el, wr, 0.037, 0.027), sph([el[0] * 0.8 + wr[0] * 0.2, el[1] * 0.75 + wr[1] * 0.25, 0.0], 0.04), cone2([s * 0.05, 1.5, -0.02], [sh[0] - s * 0.03, sh[1] + 0.03, 0], 0.05, 0.05)));
    parts.push(U(0.04, cone2([hip[0], hip[1] + 0.02, 0], kn, 0.088, 0.054), sph([s * 0.075, 0.97, -0.065], 0.08), cone2(kn, an, 0.046, 0.031), sph([s * 0.088, 0.33, -0.026], 0.047), sph([s * 0.09, 0.62, 0.03], 0.074)));
  }
  parts.push(cone2([0, 1.46, 0], [0, 1.54, 0.005], 0.043, 0.04));
  return U(0.035, ...parts);
};
const paintGeo = (nets: { verts: number[]; idx: number[] }, seed: number, colorFn: (p: V, n: V) => THREE.Color | null, segs: Seg[], opts: { jitter?: number; ao?: number; weightFn?: (p: V) => [number[], number[]]; sigma?: number } = {}) => {
  const jit = opts.jitter ?? 0.12, aoK = opts.ao ?? 0.22; const r = seeded(seed * 911 + 5); const V = nets.verts; const I = nets.idx; const nT = I.length / 3;
  const pos = new Float32Array(nT * 9), col = new Float32Array(nT * 9), nor = new Float32Array(nT * 9), si = new Float32Array(nT * 12), sw = new Float32Array(nT * 12); const wcache = new Map<number, [number[], number[]]>();
  const sm = new Float32Array(V.length); // smooth vertex normals for the hull
  for (let t = 0; t < nT; t++) {
    const a = I[t * 3], b = I[t * 3 + 1], c = I[t * 3 + 2]; const P = [a, b, c].map((q) => [V[q * 3], V[q * 3 + 1], V[q * 3 + 2]] as V);
    const ux = P[1][0] - P[0][0], uy = P[1][1] - P[0][1], uz = P[1][2] - P[0][2], wx = P[2][0] - P[0][0], wy = P[2][1] - P[0][1], wz = P[2][2] - P[0][2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    for (const q of [a, b, c]) { sm[q * 3] += nx; sm[q * 3 + 1] += ny; sm[q * 3 + 2] += nz; }
    const cen: V = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3, (P[0][2] + P[1][2] + P[2][2]) / 3];
    const base = colorFn(cen, [nx, ny, nz]) ?? new THREE.Color("#ff00ff"); const k = (1 + (r() - 0.5) * 2 * jit) * (1 - aoK * (1 - (ny * 0.5 + 0.5)));
    for (let v = 0; v < 3; v++) {
      const o = t * 9 + v * 3; pos.set(P[v], o); nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz; col[o] = base.r * k; col[o + 1] = base.g * k; col[o + 2] = base.b * k;
      const q = [a, b, c][v]; let w = wcache.get(q); if (!w) { w = (opts.weightFn ?? ((p: V) => weightsFor(p, segs, opts.sigma)))(P[v]); wcache.set(q, w); }
      for (let m = 0; m < 4; m++) { si[t * 12 + v * 4 + m] = w[0][m]; sw[t * 12 + v * 4 + m] = w[1][m]; }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4)); g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
  // hull: shared smooth geometry pushed along smoothed normals
  const hp = new Float32Array(pos.length), hs = new Float32Array(si.length), hw = new Float32Array(sw.length); hs.set(si); hw.set(sw);
  for (let t = 0; t < nT; t++) for (let v = 0; v < 3; v++) { const q = I[t * 3 + v]; const l = Math.hypot(sm[q * 3], sm[q * 3 + 1], sm[q * 3 + 2]) || 1; const o = t * 9 + v * 3; hp[o] = pos[o] + (sm[q * 3] / l) * 0.011; hp[o + 1] = pos[o + 1] + (sm[q * 3 + 1] / l) * 0.011; hp[o + 2] = pos[o + 2] + (sm[q * 3 + 2] / l) * 0.011; }
  const hull = new THREE.BufferGeometry(); hull.setAttribute("position", new THREE.BufferAttribute(hp, 3)); hull.setAttribute("skinIndex", new THREE.BufferAttribute(hs, 4)); hull.setAttribute("skinWeight", new THREE.BufferAttribute(hw, 4));
  g.userData.hull = hull; return g;
};
const C = (h: string) => new THREE.Color(h);
const skinColor = (L: LookR) => { const base = C(L.skin); const dark = base.clone().multiplyScalar(0.8).lerp(C("#8a4a3a"), 0.08); return (p: V, n: V) => { const k = clamp(0.5 + n[2] * 0.25 + n[1] * 0.1, 0, 1); return dark.clone().lerp(base, 0.6 + 0.4 * k); }; };

const buildBody = (L: LookR) => memo("body" + JSON.stringify(L), () => {
  const field = bodyField(); const segs = bodySegs();
  const skin = paintGeo(surfaceNets(field, [-0.5, 0.0, -0.175], [0.5, 1.62, 0.2], 0.025), 1, skinColor(L), segs, { jitter: 0.07, ao: 0.16, sigma: 0.022 });
  const out: Record<string, THREE.BufferGeometry> = { skin };
  const mkTee = (topCol: string, sleeve: number, hem: number): THREE.BufferGeometry => {
    const reg: SDF = U(0.02, box([0, (hem + 1.53) / 2, 0], [0.3, (1.53 - hem) / 2, 0.26]), cone2([-0.2, 1.43, 0], [-0.2 - 0.04 * sleeve * 4, 1.43 - sleeve, 0], 0.078, 0.076), cone2([0.2, 1.43, 0], [0.2 + 0.04 * sleeve * 4, 1.43 - sleeve, 0], 0.078, 0.076));
    const hole = cone2([0, 1.42, 0.0], [0, 1.8, 0], 0.07, 0.07);
    const f: SDF = (x, y, z) => { const off = 0.02 + 0.012 * clamp((1.34 - y) / 0.3, 0, 1); return Math.max(Math.max(field(x, y, z) - off, reg(x, y, z)), -hole(x, y, z)); };
    return paintGeo(surfaceNets(f, [-0.5, hem - 0.04, -0.2], [0.5, 1.58, 0.225], 0.025), 2, (p) => { const c = C(topCol); if (L.stain) { const dx = p[0] - 0.01, dy = p[1] - 1.3; const r = Math.hypot(dx, dy) + 0.012 * Math.sin(Math.atan2(dy, dx) * 7) + 0.008 * Math.sin(dx * 90) * Math.sin(dy * 80); if (p[2] > 0.05 && r < 0.1) c.lerp(C("#4e2c14"), 0.95); } return c; }, segs, { jitter: 0.05, ao: 0.28, sigma: 0.025 });
  };
  const mkTank = (topCol: string, off0: number): THREE.BufferGeometry => {
    const arms = [-1, 1].map((s) => cone2([s * 0.2, 1.43, 0], [s * (0.2 + 0.1), 1.0, 0], 0.085, 0.085));
    const reg: SDF = box([0, 1.28, 0], [0.19, 0.28, 0.26]);
    const scoop = ellip([0, 1.56, 0.12], [0.1, 0.13, 0.2]);
    const f: SDF = (x, y, z) => { const off = off0 + 0.014 * clamp((1.34 - y) / 0.3, 0, 1); return Math.max(Math.max(Math.max(field(x, y, z) - off, reg(x, y, z)), -arms[0](x, y, z)), Math.max(-arms[1](x, y, z), -scoop(x, y, z))); };
    return paintGeo(surfaceNets(f, [-0.3, 0.96, -0.2], [0.3, 1.6, 0.225], 0.025), 3, () => C(topCol), segs, { jitter: 0.05, ao: 0.28, sigma: 0.025 });
  };
  const mkPants = (col: string): THREE.BufferGeometry => {
    const f: SDF = (x, y, z) => { const off = 0.028 + 0.012 * clamp((0.45 - y) / 0.35, 0, 1); const reg = Math.max(Math.max(y - 1.05, 0.13 - y), Math.abs(x) - 0.26); return Math.max(field(x, y, z) - off, reg); };
    return paintGeo(surfaceNets(f, [-0.3, 0.1, -0.2], [0.3, 1.08, 0.2], 0.025), 4, (p) => C(col).lerp(C("#000000"), p[1] > 0.99 ? 0.4 : 0), segs, { jitter: 0.05, ao: 0.28, sigma: 0.022 });
  };
  if (L.kind === "gary" || L.kind === "mia") out.top = mkTank(L.top, 0.028); else out.top = mkTee(L.top, 0.15, 1.0);
  if (L.vest) { const reg: SDF = box([0, 1.28, 0], [0.205, 0.27, 0.27]); const strip = box([0, 1.28, 0.2], [0.065, 0.4, 0.13]); const arms = [-1, 1].map((s) => cone2([s * 0.2, 1.43, 0], [s * 0.3, 1.0, 0], 0.088, 0.088)); const f: SDF = (x, y, z) => Math.max(Math.max(Math.max(field(x, y, z) - 0.04 - 0.012 * clamp((1.34 - y) / 0.3, 0, 1), reg(x, y, z)), -strip(x, y, z)), Math.max(-arms[0](x, y, z), -arms[1](x, y, z))); out.vest = paintGeo(surfaceNets(f, [-0.3, 0.96, -0.225], [0.3, 1.58, 0.25], 0.025), 5, () => C(L.vest!), segs, { jitter: 0.05, ao: 0.28 }); }
  out.pants = mkPants(L.pants);
  return out;
});

/* ------------------------------------------------------------------ hands (own fine grid) */
const buildHand = (L: LookR, s: number) => memo(`hand${L.skin}${s}`, () => {
  const S = s < 0 ? "L" : "R"; const o = W("hd" + S);
  const pal = ellip([o[0] - s * 0.002, o[1] - 0.054, o[2]], [0.017, 0.052, 0.04]);
  const parts: SDF[] = [pal, cone2([o[0], o[1] + 0.03, o[2]], [o[0], o[1] - 0.01, o[2]], 0.031, 0.034)];
  const lens = [0.075, 0.084, 0.078, 0.062]; const segs: Seg[] = [{ b: "hd" + S, a: [o[0], o[1] + 0.03, o[2]], c: [o[0], o[1] - 0.09, o[2]], r: 0.04 }];
  lens.forEach((l, i) => { const z = o[2] - 0.027 + i * 0.018; const a: V = [o[0] - s * 0.002, o[1] - 0.095, z], m: V = [a[0], a[1] - l * 0.55, z], e: V = [a[0], a[1] - l, z]; parts.push(cone2(a, m, 0.0092, 0.0085), cone2(m, e, 0.0085, 0.0068)); segs.push({ b: "f1" + S, a, c: m, r: 0.006 }, { b: "f2" + S, a: m, c: e, r: 0.006 }); });
  const tb: V = W("t1" + S), tm: V = W("t2" + S); const te: V = [tm[0] - s * 0.004, tm[1] - 0.035, tm[2] + 0.014];
  parts.push(cone2([tb[0], tb[1] + 0.012, tb[2] - 0.008], tm, 0.0115, 0.0098), cone2(tm, te, 0.0098, 0.0078)); segs.push({ b: "t1" + S, a: tb, c: tm, r: 0.006 }, { b: "t2" + S, a: tm, c: te, r: 0.006 });
  const f = U(0.012, ...parts);
  return paintGeo(surfaceNets(f, [o[0] - 0.06, o[1] - 0.2, o[2] - 0.07], [o[0] + 0.06, o[1] + 0.05, o[2] + 0.09], 0.0075, 0), 6 + s, skinColor(L), segs, { jitter: 0.06, ao: 0.18, sigma: 0.008 });
});

/* ------------------------------------------------------------------ head + face */
export const HC: V = [0, 1.665, 0.0];
const headField = (L: LookR): SDF => memo("hf" + L.kind, () => {
  const [hx, hy, hz] = HC; const q = (x: number, y: number, z: number): V => [x, y, z];
  const sk = U(0.022, ellip(q(0, 0.02, -0.005), q(0.067, 0.116, 0.086)), ellip(q(0, -0.07, 0.006), q(0.049, 0.064, 0.07)), sph(q(0, -0.116, 0.056), 0.02), sph(q(-0.039, -0.03, 0.054), 0.014), sph(q(0.039, -0.03, 0.054), 0.014), cone2(q(-0.04, -0.062, -0.005), q(-0.02, -0.108, 0.044), 0.02, 0.015), cone2(q(0.04, -0.062, -0.005), q(0.02, -0.108, 0.044), 0.02, 0.015), cone2(q(-0.046, 0.04, 0.074), q(0.046, 0.04, 0.074), 0.011, 0.011), cone2(q(0, 0.024, 0.08), q(0, -0.024, 0.104), 0.0085, 0.0105), sph(q(0, -0.034, 0.108), 0.0112), sph(q(-0.0125, -0.032, 0.098), 0.0075), sph(q(0.0125, -0.032, 0.098), 0.0075), ellip(q(-0.07, -0.008, -0.01), q(0.012, 0.03, 0.02)), ellip(q(0.07, -0.008, -0.01), q(0.012, 0.03, 0.02)), cone2(q(0, -0.08, 0.0), q(0, -0.2, -0.005), 0.044, 0.047));
  return (x, y, z) => { x -= hx; y -= hy; z -= hz; let d = sk(x, y, z); d = smin(d, Math.min(cone2(q(-0.0155, -0.0705, 0.077), q(0.0155, -0.0705, 0.077), 0.0072, 0.0072)(x, y, z), cone2(q(-0.0135, -0.082, 0.078), q(0.0135, -0.082, 0.078), 0.0085, 0.0085)(x, y, z)), 0.005); return d; };
});
export const headSurfaceZ = (L: LookR, x: number, y: number) => { const f = headField(L); let lo = 0, hi = 0.18; for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (f(x, y, HC[2] + m) < 0) lo = m; else hi = m; } return lo; };
export const headNormal = (L: LookR, x: number, y: number, zl: number): V => { const f = headField(L); const e = 0.002; const z = HC[2] + zl; const n: V = [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)]; const l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
const buildHead = (L: LookR) => memo("head" + L.skin + L.kind, () => {
  const [hx, hy, hz] = HC; const raw = headField(L);
  const segs: Seg[] = [{ b: "head", a: [hx, hy, hz], c: [hx, hy + 0.01, hz], r: 0.1 }];
  const weightFn = (p: V): [number[], number[]] => { const y = p[1] - hy, z = p[2] - hz; const wn = sstep(-0.1, -0.15, y); const wj = sstep(-0.058, -0.085, y) * (z > -0.03 ? 1 : 0) * 0.95 * (1 - wn); const wh = 1 - wj - wn; return [[BIDX.head, BIDX.jaw, BIDX.neck, 0], [wh, wj, wn, 0]]; };
  const sk = C(L.skin); const lip = C("#a8625c"); const dark = C("#7a3a30");
  const color = (p: V, n: V) => { const x = Math.abs(p[0] - hx), y = p[1] - hy, z = p[2] - hz; let c = sk.clone(); const shade = clamp(0.55 + n[2] * 0.2 + n[1] * 0.2, 0, 1); c.multiplyScalar(0.88 + 0.12 * shade);
    if (z > 0.05 && y < -0.01 && y > -0.045 && x > 0.034 && x < 0.062) c.lerp(C("#e07a6a"), 0.08);
    return c; };
  return paintGeo(surfaceNets(raw, [hx - 0.1, hy - 0.2, hz - 0.115], [hx + 0.1, hy + 0.14, hz + 0.135], 0.0125, 1), 7, color, segs, { jitter: 0.035, ao: 0.08, weightFn });
});

/* ------------------------------------------------------------------ hair plates + shoes */
const hairField = (L: LookR): SDF => {
  const [hx, hy, hz] = HC; const q = (x: number, y: number, z: number): V => [x, y, z]; const kind = L.kind;
  const grow = kind === "mia" ? 0.026 : kind === "gary" ? 0.007 : kind === "grey" ? 0.009 : 0.012;
  const shell = ellip(q(0, 0.02, -0.01 - (kind === "mia" ? 0.012 : 0)), q(0.067 + grow, 0.116 + grow * 0.6 + (kind === "mia" ? 0.02 : 0), 0.086 + grow));
  const fringe = kind === "ben" || kind === "grey" ? U(0.008, ...[-0.05, -0.03, -0.01, 0.012, 0.032, 0.05].map((x, i) => cone2(q(x, 0.09, 0.052), q(x * 1.12 + 0.012, 0.056 - (i % 2) * 0.008, 0.097), 0.0125, 0.007))) : kind === "mia" ? U(0.008, ...[-0.045, -0.02, 0.005, 0.03, 0.05].map((x, i) => cone2(q(x, 0.09, 0.06), q(x * 1.15, 0.04 - (i % 2) * 0.01, 0.098), 0.016, 0.01))) : null;
  return (x, y, z) => {
    x -= hx; y -= hy; z -= hz; const ax = Math.abs(x); let d = shell(x, y, z);
    if (fringe) d = smin(d, fringe(x, y, z), 0.008);
    if (kind === "mia") { const cut = Math.max(-0.085 - y, 0); d = Math.max(d, Math.max(y - 0.15, -0.0 - (y + 0.11))); const face = box(q(0, -0.01, 0.105), q(0.056, 0.092, 0.066))(x, y, z); d = Math.max(d, -face); return Math.max(d, -(y + 0.1) + 0.0 * cut); }
    const u = clamp((z + 0.02) / 0.1), v = clamp((ax - 0.05) / 0.02); const jag = 0.011 * Math.abs(Math.sin(x * 95 + 0.4)) * u; const front = 0.056 + 0.034 * (ax / 0.07) ** 2 - jag + 0.012 * (x > 0 ? 1 : 0.4) * u, back = kind === "gary" ? -0.03 : -0.07; let cut = lerp2(back, front, u); cut = lerp2(cut, 0.012, v * (1 - 0.5 * u)); const strand = 0.0032 * Math.sin(Math.atan2(x, z + 0.03) * 22) * clamp((y + 0.02) / 0.1); return Math.max(d + strand, cut - y);
  };
};
const lerp2 = (a: number, b: number, k: number) => a + (b - a) * k;
const hairGeo = (L: LookR) => memo("hair" + L.kind + L.hair, () => {
  const [hx, hy, hz] = HC; const segs: Seg[] = [{ b: "head", a: [hx, hy, hz], c: [hx, hy + 0.01, hz], r: 0.2 }]; const hc = C(L.hair);
  const geo = paintGeo(surfaceNets(hairField(L), [hx - 0.125, hy - 0.14, hz - 0.14], [hx + 0.125, hy + 0.17, hz + 0.15], 0.01, 1), 9, (p, n) => { const k = 0.8 + 0.4 * clamp(0.5 + n[1] * 0.4 + n[2] * 0.2, 0, 1); const rr = L.kind === "gary" ? hc.clone().multiplyScalar(0.55) : hc.clone().multiplyScalar(k); return rr; }, segs, { jitter: 0.1, ao: 0.12, weightFn: () => [[BIDX.head, 0, 0, 0], [1, 0, 0, 0]] });
  return geo;
});
const moHawk = (L: LookR) => memo("mohawk" + L.hair, () => { const [hx, hy, hz] = HC; const hc = C(L.hair); const parts: THREE.BufferGeometry[] = []; for (let i = 0; i < 9; i++) { const h = 0.17 - Math.abs(i - 4) * 0.018; const g = new THREE.ConeGeometry(0.021, h, 4).toNonIndexed(); g.translate(0, h / 2, 0); g.rotateX(-0.3 + i * 0.075); g.translate(hx, hy + 0.108, hz + 0.085 - i * 0.021); g.deleteAttribute("uv"); g.computeVertexNormals(); const c = hc.clone().multiplyScalar(1.0 + (i % 2) * 0.25); const cs = new Float32Array(g.attributes.position.count * 3); for (let v = 0; v < cs.length; v += 3) { cs[v] = c.r; cs[v + 1] = c.g; cs[v + 2] = c.b; } g.setAttribute("color", new THREE.BufferAttribute(cs, 3)); parts.push(g); } return mergeGeometries(parts, false)!; });
const colorAttr = (g: THREE.BufferGeometry, c: string, seed: number, jit = 0.07, zRule?: (z: number) => string | null) => { const n = g.toNonIndexed(); n.computeVertexNormals(); const P = n.attributes.position; const cs = new Float32Array(P.count * 3); const r = seeded(seed); const base = C(c); for (let i = 0; i < P.count; i += 3) { const zc = (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3; const zr = zRule?.(zc); const cc = zr ? C(zr) : base; const k = 1 + (r() - 0.5) * 2 * jit; for (let v = 0; v < 3; v++) { cs[(i + v) * 3] = cc.r * k; cs[(i + v) * 3 + 1] = cc.g * k; cs[(i + v) * 3 + 2] = cc.b * k; } } n.setAttribute("color", new THREE.BufferAttribute(cs, 3)); return n; };
const loftZ = (st: [number, number, number][], bottom: number, flatTop = false) => { const pos: number[] = [], idx: number[] = []; const N = 9; st.forEach(([z, hw, top]) => { const hg = Math.max(0.004, top - bottom); const ring: [number, number][] = []; for (let k = 0; k <= N; k++) { const a = (Math.PI * k) / N; ring.push([Math.cos(a) * hw, bottom + (flatTop ? hg : Math.sin(a) * hg)]); } ring.push([-hw, bottom], [hw, bottom]); ring.forEach(([x, y]) => pos.push(x, y, z)); }); const M2 = N + 3; for (let k = 0; k < st.length - 1; k++) for (let i = 0; i < M2; i++) { const a = k * M2 + i, b = k * M2 + ((i + 1) % M2), c = a + M2, d = b + M2; idx.push(a, b, c, b, d, c); } const f0 = pos.length / 3; pos.push(0, bottom + 0.02, st[0][0]); for (let i = 0; i < M2; i++) idx.push(f0, (i + 1) % M2, i); const l = (st.length - 1) * M2, f1 = pos.length / 3; pos.push(0, bottom + 0.012, st[st.length - 1][0]); for (let i = 0; i < M2; i++) idx.push(f1, l + i, l + ((i + 1) % M2)); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g; };
const SHOE: [number, number, number][] = [[-0.128, 0.034, 0.004], [-0.108, 0.046, 0.05], [-0.07, 0.05, 0.066], [-0.02, 0.052, 0.05], [0.04, 0.056, 0.03], [0.09, 0.056, 0.014], [0.135, 0.05, -0.002], [0.165, 0.038, -0.014], [0.18, 0.02, -0.022]];
const shoeGeo = (L: LookR, s: number) => memo(`shoe${L.shoe}${L.sole}${s}`, () => {
  const S = s < 0 ? "L" : "R"; const an = W("ft" + S); const up = colorAttr(loftZ(SHOE, -0.058), L.shoe, 11, 0.07, (z) => (z > 0.1 ? "#f4f1ea" : null)); const so = colorAttr(loftZ([[-0.138, 0.04, -0.05], [-0.115, 0.052, -0.05], [-0.04, 0.056, -0.05], [0.06, 0.06, -0.05], [0.125, 0.056, -0.05], [0.17, 0.044, -0.05], [0.19, 0.024, -0.05]], -0.082, true), L.sole, 12, 0.04);
  const g = mergeGeometries([up, so], false)!; g.translate(an[0], 0.082, 0.015); return g;
});
export const MATS = { cloth: memo("matc", () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, side: THREE.DoubleSide })), v: memo("matv", () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.74, metalness: 0 })), hair: memo("math", () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.4 })), shoe: memo("mats", () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5 })) };
const HULLM = (c: string) => memo("hull" + c, () => new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide }));

/* ------------------------------------------------------------------ rig instance */
export type Eye = { grp: THREE.Group; lid: THREE.Mesh; line: THREE.Mesh; iris: THREE.Group; brow: THREE.Mesh };
export type Face = { lipU: THREE.Mesh; lipL: THREE.Mesh; mline: THREE.Mesh; eyes: [Eye, Eye]; mouthIn: THREE.Mesh; teeth: THREE.Mesh; smile: THREE.Mesh; shades: THREE.Group };
export type Rig = { root: THREE.Group; map: Record<string, THREE.Bone>; face: Face; look: LookR };
export const EYE_H = 0.0072; export const EYE_W = 0.0135;
const eg = () => memo("eg", () => { const lens = new THREE.SphereGeometry(1, 12, 8); lens.scale(EYE_W, EYE_H, 0.0028); const iris = new THREE.CircleGeometry(0.0058, 12); const pup = new THREE.CircleGeometry(0.0029, 8); const lid = new THREE.SphereGeometry(1, 12, 8); lid.scale(EYE_W * 1.12, 1, 0.0034); const line = new THREE.BoxGeometry(EYE_W * 2.2, 0.0011, 0.0016); const brow = new THREE.BoxGeometry(0.042, 0.0078, 0.009); const mouth = new THREE.SphereGeometry(1, 10, 8); mouth.scale(0.0155, 0.011, 0.012); const teeth = new THREE.BoxGeometry(0.023, 0.0045, 0.004); const smile = new THREE.TorusGeometry(0.02, 0.0016, 4, 12, Math.PI); const slens = new THREE.BoxGeometry(0.058, 0.04, 0.012); const br = new THREE.BoxGeometry(0.02, 0.007, 0.008); const arm = new THREE.BoxGeometry(0.006, 0.007, 0.17); const lipU = new THREE.SphereGeometry(1, 12, 6); lipU.scale(0.0135, 0.0038, 0.003); const lipL = new THREE.SphereGeometry(1, 12, 6); lipL.scale(0.0118, 0.0048, 0.003); const mline = new THREE.BoxGeometry(0.026, 0.0012, 0.0016); return { lens, iris, pup, lid, line, brow, mouth, teeth, smile, slens, br, arm, lipU, lipL, mline }; });
const bindConst = (g: THREE.BufferGeometry, bone: string) => { if (!g.attributes.skinIndex) { const n = g.attributes.position.count; const si = new Float32Array(n * 4), sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) { si[i * 4] = BIDX[bone]; sw[i * 4] = 1; } g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4)); g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4)); } return g; };
export const buildRig = (L: LookR, hullCol?: string): Rig => {
  const { root, map, list } = makeBones(); const grp = new THREE.Group(); grp.add(root); grp.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(list);
  const add = (g: THREE.BufferGeometry, mat: THREE.Material, hull = true) => { const m = new THREE.SkinnedMesh(g, mat); m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; grp.add(m); m.updateMatrixWorld(true); m.bind(skeleton, m.matrixWorld); if (hullCol && hull && g.userData.hull) { const h = new THREE.SkinnedMesh(g.userData.hull as THREE.BufferGeometry, HULLM(hullCol)); h.frustumCulled = false; grp.add(h); h.updateMatrixWorld(true); h.bind(skeleton, h.matrixWorld); } return m; };
  const body = buildBody(L); add(body.skin, MATS.v); if (body.top) add(body.top, MATS.cloth); if (body.vest) add(body.vest, MATS.cloth, false); add(body.pants, MATS.cloth);
  add(buildHand(L, -1), MATS.v); add(buildHand(L, 1), MATS.v); add(buildHead(L), MATS.v, false);
  add(hairGeo(L), MATS.hair, false); if (L.kind === "gary") add(bindConst(moHawk(L), "head"), MATS.hair, false);
  for (const s of [-1, 1]) add(bindConst(shoeGeo(L, s), s < 0 ? "ftL" : "ftR"), MATS.shoe, false);
  // face parts parented to the head bone; eyes are flat lenses laid on the real surface
  const hb = map.head; const hw = W("head"); const G = eg(); const rel = (x: number, y: number, z: number): V => [x - hw[0], y - hw[1], z - hw[2]];
  const M0 = (c: string, rough = 0.5) => memo("fm" + c + rough, () => new THREE.MeshStandardMaterial({ color: c, roughness: rough, flatShading: true })); const B0 = (c: string) => memo("fb" + c, () => new THREE.MeshBasicMaterial({ color: c }));
  const eyes: Eye[] = [];
  for (const s of [-1, 1]) {
    const ex = HC[0] + s * 0.031, ey = HC[1] + 0.014; const zl = headSurfaceZ(L, ex, ey); const n = headNormal(L, ex, ey, zl);
    const g = new THREE.Group(); g.position.set(...rel(ex, ey, HC[2] + zl + 0.0006)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...n)); g.rotateZ(-s * 0.06);
    const sc = new THREE.Mesh(G.lens, M0("#eee8dc", 0.35)); const ig = new THREE.Group(); ig.position.z = 0.0026; const iris = new THREE.Mesh(G.iris, new THREE.MeshBasicMaterial({ color: L.iris ?? (L.kind === "ben" ? "#47301c" : L.kind === "mia" ? "#4a6a8a" : "#4a3220") })); const pup = new THREE.Mesh(G.pup, B0("#050303")); pup.position.z = 0.0006; ig.add(iris, pup);
    const lid = new THREE.Mesh(G.lid, M0(L.skin, 0.75)); lid.position.z = 0.0036; const line = new THREE.Mesh(G.line, B0("#2c1812")); line.position.z = 0.0042;
    const brow = new THREE.Mesh(G.brow, M0(L.hair, 0.5)); brow.position.set(0, EYE_H + 0.0105, 0.0016); g.add(sc, ig, lid, line, brow); hb.add(g); eyes.push({ grp: g, lid, line, iris: ig, brow });
  }
  const zm = headSurfaceZ(L, 0, HC[1] - 0.069);
  const mouthIn = new THREE.Mesh(G.mouth, B0("#2a0a0e")); mouthIn.position.set(...rel(HC[0], HC[1] - 0.069, HC[2] + zm - 0.012)); hb.add(mouthIn);
  const teeth = new THREE.Mesh(G.teeth, B0("#efe8dc")); teeth.position.set(...rel(HC[0], HC[1] - 0.067, HC[2] + zm - 0.004)); hb.add(teeth);
  const lipM = M0("#b0645e", 0.5); const lipU = new THREE.Mesh(G.lipU, lipM); const lipL = new THREE.Mesh(G.lipL, lipM); const mline = new THREE.Mesh(G.mline, B0("#40161a"));
  { const place = (m: THREE.Mesh, y: number, parent: THREE.Object3D, dz: number) => { const zz = headSurfaceZ(L, 0, HC[1] + y); const nn = headNormal(L, 0, HC[1] + y, zz); const pw = parent === hb ? hw : W("jaw"); m.position.set(0 - pw[0], HC[1] + y - pw[1], HC[2] + zz + dz - pw[2]); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...nn)); parent.add(m); }; place(lipU, -0.0655, hb, 0.0004); place(lipL, -0.0735, map.jaw, 0.0004); place(mline, -0.0692, hb, 0.0006); }
  const smile = new THREE.Mesh(G.smile, B0("#4a1c1c")); smile.position.set(...rel(HC[0], HC[1] - 0.052, HC[2] + zm + 0.0008)); smile.rotation.z = Math.PI; smile.scale.set(1, 0.4, 1); hb.add(smile);
  const shades = new THREE.Group(); shades.position.set(...rel(HC[0], HC[1] + 0.016, HC[2] + 0.102)); for (const s of [-1, 1]) { const l = new THREE.Mesh(G.slens, M0("#14161c", 0.2)); l.position.set(s * 0.037, 0, 0); shades.add(l); } shades.add(new THREE.Mesh(G.br, M0("#14161c", 0.3))); for (const s of [-1, 1]) { const a = new THREE.Mesh(G.arm, M0("#14161c", 0.3)); a.position.set(s * 0.074, 0.004, -0.085); shades.add(a); } hb.add(shades);
  return { root: grp, map, face: { lipU, lipL, mline, eyes: [eyes[0], eyes[1]], mouthIn, teeth, smile, shades }, look: L };
};
export { BIDX };
