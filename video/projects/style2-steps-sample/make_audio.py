"""Style 2 sample soundtrack v2 (no voice): street ambience that fades into space, A-minor chords, plucked arpeggio, bass, drums that build,
an ascending bell on every step, risers and a big finale. python3 -I make_audio.py <out.wav>"""
import sys, wave
import numpy as np
from scipy.signal import lfilter, fftconvolve, butter
SR = 44100; rng = np.random.default_rng(7)
TITLE, STEP, END, NS = 2.6, 2.5, 2.4, 7
END0 = TITLE + NS * STEP; TOTAL = END0 + END; N = int(SR * TOTAL); T = np.arange(N) / SR
BPM = 124; BEAT = 60 / BPM
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < -len(sig): return
    a = max(0, -i); j = min(N, i + len(sig)); buf[max(i, 0):j] += sig[a: a + (j - max(i, 0))] * g
def lowpass(x, fc, order=2):
    b, a = butter(order, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def highpass(x, fc):
    b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def saw(f, n, det=(0.0,)):
    t = np.arange(n) / SR; o = np.zeros(n)
    for d in det: o += 2 * ((f * (1 + d) * t) % 1) - 1
    return o / len(det)
def pluck(m, d=0.35):
    n = int(SR * d); x = saw(hz(m), n, (0, 0.004)) * env(n, 0.002, 0.11); return lowpass(x, 3800 + m * 20)
def bell(m, d=1.6):
    n = int(SR * d); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.4) + 0.3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.2)) * env(n, 0.002, 0.7)
def kick():
    n = int(SR * 0.42); t = np.arange(n) / SR; f = 46 + 130 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) + 0.3 * highpass(rng.uniform(-1, 1, n), 2500) * np.exp(-t / 0.01))
def hat(open_=False):
    n = int(SR * (0.22 if open_ else 0.06)); return highpass(rng.uniform(-1, 1, n), 7000) * env(n, 0.001, 0.09 if open_ else 0.02)
def clap():
    n = int(SR * 0.3); x = highpass(rng.uniform(-1, 1, n), 1200); e = np.zeros(n)
    for k in range(3): e[int(k * 0.012 * SR):] += np.exp(-np.arange(n - int(k * 0.012 * SR)) / SR / 0.06) * (0.5 if k < 2 else 1)
    return lowpass(x, 7000) * e
def riser(d, g=1.0):
    n = int(SR * d); x = rng.uniform(-1, 1, n); ramp = np.linspace(0, 1, n) ** 2.2
    out = np.zeros(n); k = 6
    for s in range(k):  # sweeping filter by chunks
        a, b = int(n * s / k), int(n * (s + 1) / k); out[a:b] = lowpass(x[a:b], 400 + 9000 * (s / k) ** 2)
    return out * ramp * g
def impact():
    n = int(SR * 2.8); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t * 1.8) + 26) / SR) * np.exp(-t / 0.9)
    nz = lowpass(rng.uniform(-1, 1, n), 1800) * np.exp(-t / 0.45)
    return sub * 1.2 + nz * 0.8
def reverb(x, secs=1.3, mix=0.28):
    n = int(SR * secs); ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR / (secs / 3.2)); ir = lowpass(ir, 5000)
    wet = fftconvolve(x, ir)[: len(x)]; wet /= max(1e-6, np.abs(wet).max()) / max(1e-6, np.abs(x).max()); return x * (1 - mix) + wet * mix
CHORDS = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]  # Am F C G
music = np.zeros(N); drums = np.zeros(N); amb = np.zeros(N); fx = np.zeros(N)
# ---- ambience: street (louder at the start) -> thinner wind -> space hum
street = lowpass(rng.uniform(-1, 1, N), 700) * 0.5 + lowpass(rng.uniform(-1, 1, N), 2500) * 0.12
street *= np.clip(1 - (T - 2.6) / 8.0, 0, 1) ** 1.4
for k in range(int(10 / 0.46)): put(amb, (highpass(rng.uniform(-1, 1, 1800), 600) * env(1800, 0.001, 0.02)), 0.3 + k * 0.46 + (k % 2) * 0.03, 0.28 * max(0, 1 - 0.1 * k))  # footsteps
space = np.sin(2 * np.pi * 41 * T) * 0.35 + lowpass(rng.uniform(-1, 1, N), 220) * 0.4; space *= np.clip((T - 12.0) / 4.0, 0, 1) * np.where(T > END0, np.clip(1 - (T - END0) / 1.0, 0, 1), 1)
amb += street + space
# ---- harmony: pad that opens up, bar = 4 beats
bars = int(TOTAL / (BEAT * 4)) + 1
for b in range(bars):
    root, tri = CHORDS[b % 4]; t0 = b * BEAT * 4; n = int(SR * BEAT * 4.4)
    pad = sum(saw(hz(m), n, (-0.006, 0.0, 0.006)) for m in tri + [root + 12]) / 4
    a = np.minimum(1, np.arange(n) / SR / 0.35) * np.minimum(1, (n - np.arange(n)) / SR / 0.7)
    prog = np.clip((t0 + 1) / END0, 0, 1); pad = lowpass(pad, 500 + 4200 * prog ** 1.3) * a
    put(music, pad, t0, 0.30 + 0.22 * prog)
    if t0 >= TITLE:  # bass
        for q in range(4):
            n2 = int(SR * BEAT * 0.9); bs = lowpass(saw(hz(root), n2) * 0.8 + np.sin(2 * np.pi * hz(root) * np.arange(n2) / SR), 520) * env(n2, 0.004, 0.32)
            put(music, bs, t0 + q * BEAT, 0.55 + 0.1 * prog)
# ---- arpeggio from step 1, climbing an octave as the steps climb
step16 = BEAT / 4; k = 0; t = 0.0
while t < END0 + 0.5:
    if t >= TITLE - 0.1:
        b = int(t / (BEAT * 4)); root, tri = CHORDS[b % 4]; si = (k % 8); notes = [tri[0], tri[1], tri[2], tri[1] + 12, tri[2], tri[1], tri[0] + 12, tri[1]]
        lift = 12 * int(min(2, max(0, (t - TITLE) / (STEP * 2.5))))
        put(music, pluck(notes[si] + lift), t, 0.30 + 0.12 * min(1, (t - TITLE) / 12))
    k += 1; t += step16
# ---- drums grow in: kick from step 3, hats from step 3, clap from step 4, tom fill into the last step
t = 0.0; bt = 0
while t < END0 + 0.2:
    if t >= TITLE + 2 * STEP - 0.1:
        put(drums, kick(), t, 0.9)
        put(drums, hat(), t + BEAT / 2, 0.22); 
        if bt % 4 == 3: put(drums, hat(True), t + BEAT / 2, 0.25)
    if t >= TITLE + 3 * STEP - 0.1 and bt % 2 == 1: put(drums, clap(), t, 0.5)
    bt += 1; t += BEAT
# ---- step stingers: an ascending bell + riser into each step, with weight growing
scale = [69, 72, 76, 79, 81, 84, 88]
for i in range(NS):
    t0 = TITLE + i * STEP; w = i / (NS - 1)
    put(fx, riser(0.55, 0.5 + 0.5 * w), t0 - 0.55, 0.5)
    put(fx, bell(scale[i]), t0, 0.5 + 0.2 * w); put(fx, bell(scale[i] - 12, 2.0), t0, 0.3)
    put(drums, kick(), t0, 0.8 + 0.5 * w)
put(fx, riser(TITLE - 0.15, 0.6), 0.0, 0.35)
put(fx, impact(), TITLE + (NS - 1) * STEP, 1.1)
put(fx, bell(93, 2.4), TITLE + (NS - 1) * STEP + 0.05, 0.4)
# ---- end card: a soft resolving chord
put(music, sum(saw(hz(m), int(SR * 2.4), (-0.005, 0.005)) for m in [57, 60, 64, 69]) / 4 * np.minimum(1, np.arange(int(SR * 2.4)) / SR / 0.3) * np.exp(-np.arange(int(SR * 2.4)) / SR / 1.2), END0 + 0.1, 0.35)
mus = reverb(lowpass(music, 9000) + fx, 1.4, 0.30)
x = mus * 0.9 + drums * 0.95 + amb * 0.55
x /= max(1e-6, np.abs(x).max()) / 0.92
x *= np.minimum(1, (N - np.arange(N)) / (SR * 0.7)) * np.minimum(1, T / 0.05)
pcm = (np.clip(np.tanh(x * 1.15) / np.tanh(1.15), -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w2: w2.setnchannels(1); w2.setsampwidth(2); w2.setframerate(SR); w2.writeframes(pcm.tobytes())
print("ok", round(TOTAL, 2))
