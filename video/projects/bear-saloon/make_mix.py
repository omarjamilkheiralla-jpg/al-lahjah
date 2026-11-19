"""Sound design + music + final mix for 'The Bear in the Saloon' (voice stays dry; ta-ding at the end).
Usage (from video/): python -I projects/bear-saloon/make_mix.py <ffmpeg_path>   -> public/bear_mix.wav"""
import sys, os, json, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
FFMPEG = sys.argv[1]
TIM = json.load(open(os.path.join(HERE, "timing.json"))); S = [x["start"] for x in TIM["sentences"]]; E = [x["end"] for x in TIM["sentences"]]
voice, SR = sf.read(os.path.join(HERE, "narration.wav")); N = len(voice); T = np.arange(N) / SR; rng = np.random.default_rng(3)
shuf = [w["t0"] for w in TIM["sentences"][2]["words"] if w["w"].lower().startswith("shuffle")]
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, a_, b_): b, a = butter(2, [a_ / (SR / 2), min(0.99, b_ / (SR / 2))], "band"); return lfilter(b, a, x)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i < 0: return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * g
def noise(n): return rng.standard_normal(n)
fx = np.zeros(N); mus = np.zeros(N)
def whoosh(t0, dur=0.7, g=0.45): n = int(SR * dur); tt = np.arange(n) / SR; x = bp(noise(n), 300, 5500) * np.sin(np.pi * tt / dur) ** 2; put(fx, x / np.abs(x).max(), t0, g)
def thud(t0, g=0.7, f=70): n = int(SR * 0.4); tt = np.arange(n) / SR; put(fx, (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.1) + lp(noise(n), 400) * np.exp(-tt / 0.05) * 0.5), t0, g)
def riffle(t0, dur=0.22, g=0.5):
    n = int(SR * dur); x = np.zeros(n)
    for k in range(int(dur * 70)): i = rng.integers(0, n - 300); L = 300; x[i:i + L] += hp(noise(L), 2500) * np.exp(-np.arange(L) / 60) * 0.6
    put(fx, x / max(1e-6, np.abs(x).max()), t0, g)
def click(t0, g=0.5): n = int(SR * 0.04); put(fx, hp(noise(n), 1500) * env(n, 0.0005, 0.01), t0, g)
def creak(t0, dur=0.7, g=0.35):
    n = int(SR * dur); tt = np.arange(n) / SR; f = 180 + 220 * np.sin(tt * 9) * tt; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + bp(noise(n), 500, 1800) * 0.3; put(fx, x * np.sin(np.pi * tt / dur), t0, g)
def pop(t0, g=0.6, f=520): n = int(SR * 0.25); tt = np.arange(n) / SR; put(fx, np.sin(2 * np.pi * (f + 900 * np.exp(-tt * 30)) * tt) * np.exp(-tt / 0.07), t0, g)
def boing(t0, g=0.5): n = int(SR * 0.6); tt = np.arange(n) / SR; put(fx, np.sin(2 * np.pi * np.cumsum(260 + 220 * np.sin(tt * 38) * np.exp(-tt * 5)) / SR) * np.exp(-tt / 0.25), t0, g)
def bell(m, dd=1.3): n = int(SR * dd); tt = np.arange(n) / SR; f = 440 * 2 ** ((m - 69) / 12); return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3)) * env(n, 0.002, dd / 3)
def pluck(f, dur=0.7):
    L = max(2, int(SR / f)); n = int(SR * dur); x = np.zeros(n); x[:L] = rng.uniform(-1, 1, L); a = np.zeros(L + 2); a[0] = 1; a[L] = -0.4985; a[L + 1] = -0.4985
    return lfilter([1.0], a, x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
# ---------------------------------------------------------------- music: dusty western pluck loop (A minor)
CH = [(45, [57, 60, 64]), (41, [53, 57, 60]), (36, [55, 60, 64]), (43, [55, 59, 62])]
beat = 0.3; k = 0; t = 0.0
while t < N / SR - 1.0:
    root, tri = CH[(k // 8) % 4]
    if k % 8 == 0: put(mus, pluck(hz(root), 1.0) * 0.9, t, 0.5)
    if k % 8 == 4: put(mus, pluck(hz(root + 7), 0.8) * 0.8, t, 0.4)
    put(mus, pluck(hz(tri[(k % 3)] + 12), 0.5), t, 0.35)
    if k % 2 == 1: n = int(SR * 0.05); put(mus, hp(noise(n), 5000) * env(n, 0.001, 0.015), t, 0.22)      # shaker
    t += beat; k += 1
mus = lp(mus, 4500)
# ---------------------------------------------------------------- ambience
street = lp(noise(N), 700) * 0.05 * (T < 4.74); murmur = bp(noise(N), 200, 900) * (0.09 + 0.04 * np.sin(T * 1.7)) * ((T >= 4.74) & (T < 36.6) | (T >= 45.5)).astype(float)
cab = lp(noise(N), 500) * 0.03 * ((T >= 36.6) & (T < 45.5)); amb = street + murmur + cab
# ---------------------------------------------------------------- sound effects keyed to the shots
for tt in (0.0, 4.74, 28.42, 30.3, 36.59, 42.26, 45.5, 50.25): whoosh(tt - 0.15 if tt > 0 else 0.0, 0.55)
for tt in (3.5, 3.8, 4.1, 4.4): boing(tt, 0.35) if tt == 3.5 else thud(tt, 0.6, 90)                              # gorilla thumps its chest
creak(4.9, 0.8); thud(5.6, 0.2)
for i, tt in enumerate(np.arange(4.8, 13.74, 0.5)): riffle(tt, 0.18, 0.18)
for tt in shuf: riffle(tt - 0.02, 0.3, 0.9); thud(tt, 0.3, 120)
creak(13.9, 0.9); thud(14.0, 0.8, 55); boing(14.05, 0.3)                                                          # the bear arrives
for tt in np.arange(14.5, 15.6, 0.45): thud(tt, 0.9, 55)
for tt in np.arange(17.7, 19.3, 0.45): thud(tt, 0.9, 55)
creak(17.5, 0.8); pop(15.9, 0.4, 700)
for tt in np.arange(24.3, 25.9, 0.09): click(tt, 0.45)
pop(22.5, 0.7, 440); whoosh(25.8, 0.5, 0.5)
for tt in np.arange(26.0, 28.4, 0.06): click(tt, 0.12)
for tt in np.arange(26.0, 28.4, 0.1): thud(tt, 0.05, 140)
pop(27.2, 0.5, 880)
thud(30.4, 0.9, 80); pop(34.5, 0.7, 660)
for tt in np.arange(47.3, 49.0, 0.5): thud(tt, 0.9, 55)
for tt in (36.7, 36.85, 37.0): pop(tt, 0.2, 1400 + 300 * (tt - 36.7))                                              # keys jingle
for tt in (38.6, 38.95, 39.3, 39.6): thud(tt, 0.6, 100)
boing(43.85, 0.45)
pop(51.3, 0.5, 300); thud(51.5, 0.3, 200); pop(52.2, 0.5, 600)
ta = np.zeros(N); put(ta, bell(88, 1.4), E[11] + 0.55, 0.5); put(ta, bell(95, 1.9), E[11] + 0.75, 0.5)               # ta-ding
# ---------------------------------------------------------------- mix
duck = np.ones(N)
for w in TIM["sentences"]:
    duck[max(0, int((w["start"] - 0.1) * SR)): int((w["end"] + 0.2) * SR)] = 0.45
sm = int(0.08 * SR); duck = np.convolve(duck, np.ones(sm) / sm, "same")
out = (mus * 0.55 * duck + amb * 0.9 * duck + fx * 0.75 + ta * 0.6); out = out / max(1e-6, np.abs(out).max()) * 0.5 + voice * 1.0
out /= max(1e-6, np.abs(out).max()) / 0.85; out *= np.minimum(1, T / 0.03) * np.minimum(1, (N - np.arange(N)) / (SR * 0.5))
raw = os.path.join(tempfile.gettempdir(), "bear_raw.wav"); sf.write(raw, out, SR, subtype="PCM_16")
subprocess.run([FFMPEG, "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "44100", "-ac", "2", os.path.join(VIDEO, "public", "bear_mix.wav")], check=True, capture_output=True)
print("ok", round(N / SR, 1), "s")
