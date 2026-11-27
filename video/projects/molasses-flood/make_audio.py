"""Molasses flood short: music bed + sound effects (numpy/scipy synthesis). Reuses the helper functions of the Eiffel audio script. Writes public/molasses/*.wav"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "eiffel-con", "make_audio.py")).read()
head = src[: src.index("# ---------- whoosh")]
head = head.replace('"eiffel"', '"molasses"')
exec(head)
# whoosh / click / slam / stamp / paper reused (same maker code)
for name in ("whoosh", "slam", "stamp", "click"):
    m = re.search(r"# -+ (?:whoosh|slam|rubber stamp|email click)[^\n]*\n(.*?)(?=\n# -+ )", src, re.S)
exec(src[src.index("# ---------- whoosh"): src.index("# ---------- slam")])
exec(src[src.index("# ---------- rubber stamp"): src.index("# ---------- paper slide")])
exec(src[src.index("# ---------- email click"): src.index("# ---------- police whistle")])
exec(src[src.index("# ---------- ta-ding"): src.index("# ---------- music bed")])
# ---------- metal groan: slow creaking pitch wobble + rivet pings
d = 3.2; t = T(d); f = 95 + 22 * np.sin(2 * np.pi * 0.7 * t) + 8 * np.sin(2 * np.pi * 3.1 * t); ph = np.cumsum(2 * np.pi * f / SR)
g = (np.sin(ph) + 0.6 * np.sin(2 * ph + 1) + 0.4 * np.sin(3 * ph + 2)) * np.clip(t / 0.8, 0, 1) * np.clip((d - t) / 0.7, 0, 1)
g += bp(noise(d), 300, 1400, 2) * 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.3 * t))
for k in range(9):
    i = int((0.6 + k * 0.27 + rng.uniform(0, 0.08)) * SR); m = int(0.18 * SR); tt = np.arange(m) / SR; g[i:i + m] += np.sin(2 * np.pi * rng.uniform(1800, 3600) * tt) * np.exp(-tt * 28) * 0.35
write("groan", norm(reverb(lpf(g, 4500), 1.0, 0.3), 0.7))
# ---------- burst: rivets popping like a rattle, then a deep boom and rushing slop
d = 4.0; t = T(d); b = np.zeros(len(t))
for k in range(26):
    i = int((k * 0.028 + rng.uniform(0, 0.012)) * SR); m = int(0.06 * SR); b[i:i + m] += (bp(noise(0.06), 800, 6000) * np.exp(-np.arange(m) / (0.01 * SR)) * 0.9)
i = int(0.5 * SR); tt = t[: len(t) - i]; b[i:] += np.sin(2 * np.pi * (70 * np.exp(-tt * 1.4) + 30) * tt) * np.exp(-tt * 1.1) * 1.2
b[i:] += lpf(noise(d), 700)[: len(tt)] * np.exp(-tt * 0.9) * 1.3 * np.clip(tt / 0.4, 0, 1)
write("burst", norm(reverb(b, 1.2, 0.3), 0.95))
# ---------- wave rumble: low rolling rumble + wet slosh
d = 6.0; t = T(d); r = lpf(noise(d), 220, 3) * 3.0 * np.clip(t / 1.2, 0, 1) * np.clip((d - t) / 1.5, 0, 1); r += bp(noise(d), 300, 1500, 2) * 0.35 * (0.6 + 0.4 * np.sin(2 * np.pi * 2.2 * t)) * np.clip(t / 1.5, 0, 1) * np.clip((d - t) / 1.0, 0, 1)
r += np.sin(2 * np.pi * 42 * t) * 0.5 * np.clip(t / 1.0, 0, 1) * np.clip((d - t) / 1.5, 0, 1); write("rumble", norm(lpf(r, 3000), 0.85))
# ---------- sticky drip: plop with wet tail
d = 0.5; t = T(d); dp = np.sin(2 * np.pi * (520 * np.exp(-t * 28) + 160) * t) * np.exp(-t * 16) + bp(noise(d), 400, 1800) * np.exp(-t * 40) * 0.3; write("drip", norm(reverb(dp, 0.3, 0.12), 0.55))
# ---------- brush swish on metal
d = 1.4; t = T(d); sw = hpf(lpf(noise(d), 4500), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.4 * t - 1.2)) * np.clip(t / 0.1, 0, 1) * np.clip((d - t) / 0.2, 0, 1); write("brush", norm(reverb(sw, 0.3, 0.1), 0.45))
# ---------- soft lantern chime (21 of them, plays once softly)
d = 3.0; t = T(d); ch = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec) for f, a, dec in [(659, 1, 1.4), (988, 0.5, 1.8), (1318, 0.25, 2.6)]); write("chime", norm(reverb(ch, 1.4, 0.35), 0.4))
# ---------- dashboard warning ding
d = 0.9; t = T(d); dg = np.zeros(len(t))
for st in (0.0, 0.32): i = int(st * SR); tt = t[: len(t) - i]; dg[i:] += np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt * 9) * np.clip(tt / 0.004, 0, 1)
write("ding", norm(reverb(dg, 0.3, 0.1), 0.5))
# ---------- gavel
d = 0.7; t = T(d); gv = np.sin(2 * np.pi * (260 * np.exp(-t * 30) + 170) * t) * np.exp(-t * 22) + bp(noise(d), 900, 4000) * np.exp(-t * 80) * 0.7; write("gavel", norm(reverb(gv, 0.8, 0.25), 0.8))
# ---------- cold wind bed for the street scenes
d = 12.0; t = T(d); wi = bp(noise(d), 200, 900, 2) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t) * np.sin(2 * np.pi * 0.11 * t + 1)); write("wind", norm(lpf(wi, 1200), 0.35))
# ---------- music bed: gentle Irish-Boston waltz-ish pluck, A minor, 90 bpm (3/4), warm and slightly sad with a pulse that tightens later
bpm = 96; beat = 60 / bpm; DUR = 80.0; N = int(DUR * SR); bed = np.zeros(N); mf = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62]), (45, [57, 60, 64])]
def add(x, i):
    j = min(len(x), N - i)
    if j > 0: bed[i:i + j] += x[:j]
bars = int(DUR / (beat * 3))
for b in range(bars):
    bass, chord = prog[b % 4]; i0 = int(b * 3 * beat * SR)
    d = beat * 1.8; tt = T(d); add(lpf((np.sin(2 * np.pi * mf(bass) * tt) + 0.3 * np.sin(2 * np.pi * mf(bass) * 2 * tt)) * np.exp(-tt * 2.5) * np.clip(tt / 0.01, 0, 1), 600) * 0.6, i0)
    for k in (1, 2):
        i = i0 + int(k * beat * SR); tt = T(0.6)
        for nt in chord: f0 = mf(nt + 12); x = (np.sin(2 * np.pi * f0 * tt) + 0.4 * np.sin(2 * np.pi * 2 * f0 * tt)) * np.exp(-tt * 7) * np.clip(tt / 0.003, 0, 1) * 0.08; add(lpf(x, 4000), i)
    mel = [chord[0] + 24, chord[2] + 12, chord[1] + 12][b % 3]; i = i0 + int(2.2 * beat * SR); tt = T(0.9); add(lpf(np.sin(2 * np.pi * mf(mel) * tt) * np.exp(-tt * 3) * 0.07, 2500), i)
bed = reverb(bed, 1.2, 0.25)[:N]; bed = norm(bed, 0.55); bed[: int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR)); bed[-int(3 * SR):] *= np.linspace(1, 0, int(3 * SR)); write("bed", bed)
print("ok")
