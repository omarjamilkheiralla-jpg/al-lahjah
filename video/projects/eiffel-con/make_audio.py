"""Eiffel Tower short: synthesises the music bed and the sound effects (numpy + scipy, no samples). Writes public/eiffel/*.wav (44.1 kHz mono).
v2: filtered/layered sounds with a small room reverb instead of raw tone + noise."""
import numpy as np, os, wave
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "eiffel"); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(11)
def write(name, x):
    x = np.clip(x, -1, 1); p = os.path.join(OUT, "bed.wav" if name == "bed" else f"sfx_{name}.wav")
    with wave.open(p, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype("<i2").tobytes())
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lpf(x, f, o=2): return sosfilt(butter(o, f, "lowpass", fs=SR, output="sos"), x)
def hpf(x, f, o=2): return sosfilt(butter(o, f, "highpass", fs=SR, output="sos"), x)
def reverb(x, rt=0.7, wet=0.25, seed=3):
    r = np.random.default_rng(seed); n = int(rt * SR); ir = r.standard_normal(n) * np.exp(-np.arange(n) / (rt * SR / 4.5)); ir = lpf(ir, 5000); ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    y = fftconvolve(x, ir)[: len(x) + n] * (1 / np.sqrt(np.sum(ir ** 2))) * 0.18
    out = np.zeros(len(y)); out[: len(x)] += x * (1 - wet * 0.5); out += y * wet * 2.2; return out
def norm(x, peak=0.8): return x / (np.abs(x).max() + 1e-9) * peak
def fade_end(x, ms=30): n = int(SR * ms / 1000); x = x.copy(); x[-n:] *= np.linspace(1, 0, n); return x
T = lambda d: np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
# ---------- whoosh (iris): swept band-passed air + soft tail
d = 0.7; t = T(d); n = noise(d); sw = np.zeros_like(n); 
for k, (lo, hi) in enumerate([(300, 900), (700, 2200), (1500, 4500)]): 
    seg = bp(n, lo, hi, 2) * (0.5 + 0.5 * np.sin(np.pi * np.clip(t / d + k * 0.12 - 0.12, 0, 1))) ; sw += seg
sw *= np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6; write("whoosh", norm(reverb(lpf(sw, 9000), 0.5, 0.2), 0.55))
# ---------- slam: stamped SOLD sign slap on wood
d = 0.9; t = T(d); body = np.sin(2 * np.pi * (140 * np.exp(-t * 14) + 48) * t) * np.exp(-t * 9)
slap = bp(noise(d), 600, 3500, 2) * np.exp(-t * 55); wood = bp(noise(d), 180, 420, 2) * np.exp(-t * 22) * 0.9
write("slam", norm(reverb(body + 0.6 * slap + wood, 0.5, 0.22), 0.9))
# ---------- rubber stamp on paper: dull thud + tiny squeak of ink
d = 0.5; t = T(d); th = np.sin(2 * np.pi * (95 * np.exp(-t * 16) + 55) * t) * np.exp(-t * 20); pf = bp(noise(d), 1200, 5000) * np.exp(-t * 90) * 0.35; lo = bp(noise(d), 120, 300) * np.exp(-t * 35)
write("stamp", norm(reverb(th + pf + lo, 0.35, 0.15), 0.8))
# ---------- paper slide: airy rustle with a couple of crinkles
d = 0.6; t = T(d); r = hpf(lpf(noise(d), 7000), 700) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.3 * 0.7
for c in (0.18, 0.31): i = int(c * SR); m = int(0.03 * SR); r[i:i + m] += hpf(noise(0.03), 2500) * np.exp(-np.arange(m) / (0.008 * SR)) * 0.5
write("paper", norm(reverb(r, 0.3, 0.12), 0.5))
# ---------- cash: thumb through a stack of notes
d = 1.0; t = T(d); c = np.zeros(len(t))
for k in range(16):
    i = int((0.04 + k * 0.045 + rng.uniform(0, 0.01)) * SR); m = int(0.05 * SR); c[i:i + m] += bp(noise(0.05), 1800, 7500) * np.exp(-np.arange(m) / (0.011 * SR)) * rng.uniform(0.5, 1.0)
c += bp(noise(d), 900, 3000) * 0.05 * np.sin(np.pi * np.clip(t / 0.8, 0, 1)); write("cash", norm(reverb(c, 0.35, 0.14), 0.6))
# ---------- steam train whistle: two pitched reeds + breath, slow swell
d = 1.7; t = T(d); env = np.clip(t / 0.12, 0, 1) * np.clip((d - t) / 0.5, 0, 1) ** 1.5; wob = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t)
w = sum(a * np.sin(2 * np.pi * f * t * wob + 0.8 * np.sin(2 * np.pi * f * 2 * t) * 0.15) for f, a in [(392, 0.5), (494, 0.45), (784, 0.15), (988, 0.12)])
w = (w + bp(noise(d), 1500, 5000) * 0.35 * env) * env; write("whistle", norm(reverb(lpf(w, 6500), 1.2, 0.35), 0.5))
# ---------- train pull-out: chuffs speed up, steam hiss, rail clatter
d = 7.0; t = T(d); tr = np.zeros(len(t)); tm = 0.0; step = 0.5
while tm < d - 0.3:
    m = int(0.22 * SR); i = int(tm * SR); ch = bp(noise(0.22), 120, 900, 2) * np.exp(-np.arange(m) / (0.07 * SR)); ch += 0.5 * hpf(noise(0.22), 2500) * np.exp(-np.arange(m) / (0.05 * SR))
    tr[i:i + m] += ch[: len(tr) - i] * (0.55 + 0.45 * min(1, tm / 4)); step = max(0.17, step * 0.93); tm += step
tr += bp(noise(d), 2500, 7000) * 0.07 * np.clip(t / 2, 0, 1) * np.clip((d - t) / 1.5, 0, 1)
for k in range(int(d * 4)):
    i = int((k * 0.25 + rng.uniform(0, 0.02)) * SR); m = int(0.04 * SR)
    if i + m < len(tr): tr[i:i + m] += bp(noise(0.04), 400, 2500) * np.exp(-np.arange(m) / (0.01 * SR)) * 0.12 * np.clip(t[i] / 3, 0, 1)
write("train", norm(reverb(lpf(tr, 8000), 0.8, 0.25), 0.55))
# ---------- email click: crisp two-stage mouse click
d = 0.2; t = T(d); k1 = hpf(noise(d), 1800) * np.exp(-t * 400); k2 = np.zeros(len(t)); i = int(0.045 * SR); k2[i:] = (hpf(noise(d), 1000) * np.exp(-t * 250))[: len(t) - i]
write("click", norm(k1 + 0.7 * k2 + 0.25 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 300), 0.5))
# ---------- police whistle: pea-trill at ~3 kHz, four blasts
d = 3.2; t = T(d); pol = np.zeros(len(t))
for k in range(4):
    st = k * 0.62; m = int(0.45 * SR); i = int(st * SR); tt = np.arange(m) / SR; trill = np.sin(2 * np.pi * (2850 + 90 * np.sin(2 * np.pi * 28 * tt)) * tt) * (0.7 + 0.3 * np.sin(2 * np.pi * 28 * tt))
    e = np.clip(tt / 0.02, 0, 1) * np.clip((0.45 - tt) / 0.08, 0, 1); pol[i:i + m] += (trill + 0.3 * bp(noise(0.45), 2200, 5000) + 0.25 * np.sin(2 * np.pi * 5700 * tt)) * e
write("police", norm(reverb(lpf(pol, 7500), 1.0, 0.3), 0.45))
# ---------- ta-ding: two bell notes with inharmonic partials, long tail
d = 3.4; t = T(d); td = np.zeros(len(t))
for st, f, a in [(0.0, 784, 0.8), (0.17, 1175, 1.0)]:
    i = int(st * SR); tt = t[: len(t) - i]
    for pr, pa, dec in [(1, 1, 2.2), (2.01, 0.5, 3.0), (2.76, 0.28, 4.0), (4.07, 0.14, 6.0), (5.4, 0.07, 8.0)]: td[i:] += a * pa * np.sin(2 * np.pi * f * pr * tt) * np.exp(-tt * dec) * np.clip(tt / 0.003, 0, 1)
write("tading", norm(reverb(td, 1.3, 0.3), 0.75))
# ---------- music bed: warm playful jazz-noir, D minor, 100 bpm. Rhodes-ish chords (soft FM), upright bass, brushed hat, light reverb
bpm = 100; beat = 60 / bpm; DUR = 100.0; N = int(DUR * SR); bed = np.zeros(N); mf = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(38, [62, 65, 69, 72]), (43, [62, 67, 71, 74]), (45, [61, 64, 69, 72]), (38, [62, 65, 69, 74])]
def add(x, i): 
    j = min(len(x), N - i)
    if j > 0: bed[i:i + j] += x[:j]
for b in range(int(DUR / (beat * 4))):
    bass, chord = prog[b % 4]
    for k in range(4):
        note = bass + [0, 4, 7, 5][k]; d = beat * 0.9; tt = T(d); x = (np.sin(2 * np.pi * mf(note) * tt) + 0.35 * np.sin(2 * np.pi * mf(note) * 2 * tt)) * np.exp(-tt * 5) * np.clip(tt / 0.006, 0, 1); add(lpf(x, 700) * 0.55, int((b * 4 + k) * beat * SR))
    for k in (1, 3):
        i = int(((b * 4 + k) + 0.33) * beat * SR); d = 0.7; tt = T(d)
        for nt in chord: f = mf(nt); x = np.sin(2 * np.pi * f * tt + 1.2 * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9)) * np.exp(-tt * 4.5) * 0.09; add(lpf(x, 3500), i)
    for k in range(8):
        i = int((b * 4 + k * 0.5) * beat * SR); m = int(0.07 * SR); add(hpf(noise(0.07), 5000) * np.exp(-np.arange(m) / (0.018 * SR)) * (0.05 if k % 2 == 0 else 0.028), i)
bed = reverb(bed, 0.9, 0.18)[:N]; bed = norm(bed, 0.6); bed[: int(1.5 * SR)] *= np.linspace(0, 1, int(1.5 * SR)); bed[-int(3 * SR):] *= np.linspace(1, 0, int(3 * SR)); write("bed", bed)
print("ok")
