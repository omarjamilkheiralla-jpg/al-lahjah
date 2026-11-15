"""Style 3 sample soundtrack (no voice, no ta-ding): bouncy comic bed that gets louder every scenario, a hit + riser into each cut, and a sound for every gag.
python3 -I make_audio.py <out.wav>"""
import sys, wave
import numpy as np
from scipy.signal import lfilter, butter
SR = 44100; rng = np.random.default_rng(3)
TOTAL = 10.0; SD = 2.5; N = int(SR * TOTAL); T = np.arange(N) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * g
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def tone(m, d=0.3, wave_="tri"):
    n = int(SR * d); t = np.arange(n) / SR; f = hz(m)
    x = (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * t)) if wave_ == "tri" else np.sin(2 * np.pi * f * t)
    return x * env(n, 0.003, d / 3)
def bell(m, d=1.0):
    n = int(SR * d); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25)) * env(n, 0.002, d / 3)
def kick():
    n = int(SR * 0.35); t = np.arange(n) / SR; f = 48 + 120 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
def hat(): n = int(SR * 0.05); return hp(rng.uniform(-1, 1, n), 7000) * env(n, 0.001, 0.015)
def clap():
    n = int(SR * 0.22); return lp(hp(rng.uniform(-1, 1, n), 1200), 6500) * env(n, 0.002, 0.05)
def whoosh(d=0.4, up=True):
    n = int(SR * d); x = rng.uniform(-1, 1, n); ramp = np.linspace(0, 1, n) if up else np.linspace(1, 0, n)
    out = np.zeros(n); k = 8
    for s in range(k): a, b = n * s // k, n * (s + 1) // k; out[a:b] = lp(x[a:b], 500 + 6000 * (ramp[a] ** 1.5))
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
def splat(): n = int(SR * 0.25); return lp(rng.uniform(-1, 1, n), 1400) * env(n, 0.002, 0.07) + np.sin(2 * np.pi * 120 * np.arange(n) / SR) * env(n, 0.002, 0.08) * 0.5
def boing(m=64, d=0.45):
    n = int(SR * d); t = np.arange(n) / SR; f = hz(m) * (1 + 0.5 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5) + 1.2 * np.exp(-t * 12))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.2)
def pop(): n = int(SR * 0.12); t = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t * 40) + 150) / SR) * np.exp(-t / 0.03)
def buzz(): n = int(SR * 0.4); t = np.arange(n) / SR; return lp(np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5, 900) * env(n, 0.005, 0.25)
bed = np.zeros(N); drums = np.zeros(N); fx = np.zeros(N)
BPM = 132; BEAT = 60 / BPM
# bouncy bass + pluck chords (C F G Am style, major so it stays funny)
prog = [(36, [60, 64, 67]), (41, [60, 65, 69]), (43, [62, 67, 71]), (33, [60, 64, 69])]
b = 0; t = 0.0
while t < TOTAL:
    root, ch = prog[(b // 2) % 4]
    put(bed, tone(root + 12, 0.28, "sin") * 0.7, t); put(bed, tone(root + 24 if b % 2 else root + 12, 0.18), t + BEAT / 2, 0.5)
    for m in ch: put(bed, tone(m + 12, 0.22), t + BEAT * 0.25, 0.22)
    if b % 4 in (1, 3): put(bed, tone(ch[(b // 4) % 3] + 24, 0.2), t + BEAT * 0.75, 0.3)
    put(drums, kick(), t, 0.8); put(drums, hat(), t + BEAT / 2, 0.25)
    if b % 2 == 1: put(drums, clap(), t, 0.45)
    t += BEAT; b += 1
grow = 0.45 + 0.55 * (T / TOTAL) ** 0.9           # gets louder all the way
SEG = [0.0, 2.3, 4.6, 7.0]
for i, t0 in enumerate(SEG):
    if i: put(fx, whoosh(0.35, True), t0 - 0.3, 0.55); put(fx, kick(), t0, 1.0); put(fx, bell(72 + i * 4, 0.9), t0, 0.35)
put(fx, whoosh(1.9, True), 0.0, 0.25)
# scenario B (coffee on shirt, 2.3 s): cup tilt, splash, sad little descending notes
put(fx, whoosh(0.3, False), 2.3 + 0.78, 0.25); put(fx, splat(), 2.3 + 0.95, 0.55); put(fx, splat(), 2.3 + 1.0, 0.4)
for k, m in enumerate([67, 64, 60]): put(fx, tone(m, 0.28), 2.3 + 1.25 + k * 0.17, 0.35)
# scenario C (car crash misses him, 4.6 s): engine rising, tyre screech, metal crash at 1.6 s, a relieved chime
eng = lp(rng.uniform(-1, 1, int(SR * 1.7)), 600) * np.linspace(0.05, 0.9, int(SR * 1.7)) ** 2; put(fx, eng, 4.6 + 0.0, 0.5)
put(fx, hp(rng.uniform(-1, 1, int(SR * 0.7)), 2500) * np.sin(np.pi * np.linspace(0, 1, int(SR * 0.7))) * 0.5, 4.6 + 0.85, 0.5)
def crash():
    n = int(SR * 1.6); t = np.arange(n) / SR; sub = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 3) + 40) / SR) * np.exp(-t / 0.4); nz = hp(rng.uniform(-1, 1, n), 800) * np.exp(-t / 0.25) * 0.9
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.5) * 0.15 for f in (410, 640, 1130)); return sub + nz + ring
put(fx, crash(), 4.6 + 1.6, 1.0)
for k in range(10): put(fx, hp(rng.uniform(-1, 1, 1200), 4000) * env(1200, 0.001, 0.02), 4.6 + 1.7 + k * 0.07 + rng.random() * 0.04, 0.3)
put(fx, bell(88, 0.9), 4.6 + 2.0, 0.3)
# scenario D (coffee lands perfectly in his hand, 3.0 s): fall whistle, soft thump, sparkle chime
n = int(SR * 1.1); t = np.arange(n) / SR; put(fx, np.sin(2 * np.pi * np.cumsum(1800 - 900 * (t / 1.1)) / SR) * 0.08 * np.linspace(0.2, 1, n), 7.0 + 0.35, 1.0)
put(fx, splat(), 7.0 + 1.45, 0.5); put(fx, kick(), 7.0 + 1.45, 0.7)
for k, m in enumerate([84, 88, 91, 96]): put(fx, bell(m, 1.0), 7.0 + 1.6 + k * 0.09, 0.32)
rain = np.zeros(N)
x = (bed * 0.5 + drums * 0.6) * grow + fx * 0.9 + rain
x /= max(1e-6, np.abs(x).max()) / 0.9
x *= np.minimum(1, T / 0.02) * np.minimum(1, (N - np.arange(N)) / (SR * 0.15))
pcm = (np.clip(np.tanh(x * 1.2) / np.tanh(1.2), -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("ok", TOTAL)
