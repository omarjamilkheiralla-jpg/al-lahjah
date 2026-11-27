"""Eiffel Tower short: synthesises the music bed and the sound effects (numpy only, no samples). Writes public/eiffel/*.wav (44.1 kHz mono)."""
import numpy as np, os
import wave
class sf:
    @staticmethod
    def write(path, x, sr):
        with wave.open(path, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
SR = 44100; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "eiffel"); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)
def env(n, a=0.005, d=0.2, s=0.0, r=0.1):
    e = np.zeros(n); na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, max(na, 1)); e[na:na + nd] = np.linspace(1, s, max(nd, 1))[: max(0, n - na)][: nd]
    e[na + nd:] = s; e[-nr:] *= np.linspace(1, 0, nr) if nr < n else 1; return e[:n]
def tone(f, dur, shape="sine"):
    t = np.arange(int(dur * SR)) / SR; w = np.sin(2 * np.pi * f * t)
    if shape == "tri": w = 2 / np.pi * np.arcsin(w)
    if shape == "rich": w = w + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)
    return w
def lp(x, k):
    y = np.zeros_like(x); a = 1 / k; acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def norm(x, peak=0.8): return x / (np.abs(x).max() + 1e-9) * peak
def save(name, x): sf.write(os.path.join(OUT, f"sfx_{name}.wav" if name != "bed" else "bed.wav"), x.astype("float32"), SR)
# ---- sfx
n = int(0.6 * SR); noise = rng.standard_normal(n); sw = np.convolve(noise, np.ones(40) / 40, "same") * np.sin(np.linspace(0, np.pi, n)) ** 2; save("whoosh", norm(sw, 0.6))
n = int(0.7 * SR); t = np.arange(n) / SR; slam = (np.sin(2 * np.pi * (90 * np.exp(-t * 6)) * t) * np.exp(-t * 9) + rng.standard_normal(n) * np.exp(-t * 40) * 0.6); save("slam", norm(slam, 0.9))
n = int(0.5 * SR); t = np.arange(n) / SR; st = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 14) + rng.standard_normal(n) * np.exp(-t * 90) * 0.5; save("stamp", norm(st, 0.8))
n = int(0.5 * SR); pp = lp(rng.standard_normal(n), 5) * np.sin(np.linspace(0, np.pi, n)) ** 1.5; save("paper", norm(pp, 0.5))
n = int(0.9 * SR); c = np.zeros(n)
for k in range(7): i = int(k * 0.07 * SR); m = 2000; c[i:i + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / 300)
save("cash", norm(c, 0.6))
n = int(1.2 * SR); t = np.arange(n) / SR; wh = (np.sin(2 * np.pi * 740 * t + 6 * np.sin(2 * np.pi * 6 * t)) + 0.5 * np.sin(2 * np.pi * 1110 * t)) * env(n, 0.04, 0.9, 0.0, 0.2); save("whistle", norm(wh, 0.5))
n = int(6.0 * SR); tr = np.zeros(n)
for k in range(24):
    i = int(k * 0.25 * SR); m = int(0.2 * SR); tr[i:i + m] += lp(rng.standard_normal(m), 6) * np.exp(-np.arange(m) / (0.06 * SR)) * (0.4 + 0.6 * min(1, k / 12))
tr += lp(rng.standard_normal(n), 40) * 0.5; save("train", norm(tr, 0.6))
n = int(0.12 * SR); t = np.arange(n) / SR; ck = rng.standard_normal(n) * np.exp(-t * 120); save("click", norm(ck, 0.6))
n = int(3.0 * SR); t = np.arange(n) / SR; pol = np.zeros(n)
for k in range(4): i = int(k * 0.55 * SR); m = int(0.4 * SR); tt = np.arange(m) / SR; pol[i:i + m] += (np.sin(2 * np.pi * (2800 + 300 * np.sin(2 * np.pi * 30 * tt)) * tt)) * env(m, 0.01, 0.3, 0.0, 0.08)
save("police", norm(pol, 0.45))
n = int(2.8 * SR); t = np.arange(n) / SR; td = np.zeros(n)
for (st_, f) in [(0.0, 880), (0.14, 1320)]:
    i = int(st_ * SR); m = n - i; tt = np.arange(m) / SR; td[i:] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 2.4) * (0.7 if f > 1000 else 0.5)
save("tading", norm(td, 0.75))
# ---- music bed: playful jazz-detective, D minor, 100 bpm, 100 s
bpm = 100; beat = 60 / bpm; DUR = 100.0; N = int(DUR * SR); bed = np.zeros(N)
prog = [("D", 38, [62, 65, 69]), ("G", 43, [59, 62, 67]), ("A", 45, [61, 64, 69]), ("D", 38, [62, 65, 69])]
mf = lambda m: 440 * 2 ** ((m - 69) / 12)
bars = int(DUR / (beat * 4))
for b in range(bars):
    root, bass, chord = prog[b % 4][0], prog[b % 4][1], prog[b % 4][2]
    for k in range(4):  # walking bass
        note = bass + [0, 3, 5, 7][k] + (2 if b % 4 == 1 and k == 3 else 0); i = int((b * 4 + k) * beat * SR); x = tone(mf(note), beat * 0.9, "tri") * env(int(beat * 0.9 * SR), 0.006, 0.25, 0.1, 0.1) * 0.5
        bed[i:i + len(x)] += x[: N - i] if i + len(x) > N else x
    for k in (1, 3):  # muted piano chord stabs on 2 and 4 (swung)
        i = int(((b * 4 + k) + 0.33) * beat * SR); m = int(0.35 * SR)
        for nt in chord: x = tone(mf(nt), 0.35, "rich") * np.exp(-np.arange(m) / (0.09 * SR)) * 0.12; bed[i:i + m] += x[: max(0, min(m, N - i))] if i + m > N else x
    for k in range(8):  # brushed hat
        i = int((b * 4 + k * 0.5) * beat * SR); m = int(0.08 * SR); x = rng.standard_normal(m) * np.exp(-np.arange(m) / (0.02 * SR)) * (0.06 if k % 2 == 0 else 0.03)
        if i + m <= N: bed[i:i + m] += x
bed = norm(bed, 0.6); bed[: int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR)); bed[-int(3 * SR):] *= np.linspace(1, 0, int(3 * SR)); save("bed", bed)
print("ok")
