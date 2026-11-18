"""STYLE 4 continuous first-person video (68 s): voices with emotion, footsteps from the camera path, thunder, flicker buzz, door rattle, ambience, mix, captions.
Usage (from video/):  python -I projects/style4-walk/make_voice.py <model_dir> <ffmpeg_path>
Writes public/style4walk_mix.wav and src/style4/walk/captions.json"""
import sys, os, json, subprocess, tempfile, re
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, lfilter, fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
MODELS = sys.argv[1]; FFMPEG = sys.argv[2]
TL = json.load(open(os.path.join(VIDEO, "src", "style4", "walk", "timeline.json")))
SR = 44100; TOTAL = 68.0; N = int(SR * TOTAL); T = np.arange(N) / SR; rng = np.random.default_rng(7)
# (who, spoken, caption, start, colour, effect, speed, tremor, breath)
LINES = [
    ("nora", "Who rings the bell at two a.m.?", "Who rings the bell at 2 a.m.?", 1.3, "y", None, 1.0, 0.0, False),
    ("courier", "Delivery. We have a package for Nora Hale. I need you to open the door.", "Delivery. We have a package for Nora Hale. I need you to open the door.", 6.7, "w", "cam", 1.0, 0.0, False),
    ("nora", "I didn't order anything.", "I didn't order anything.", 11.4, "y", None, 0.9, 0.03, False),
    ("courier", "It says it's from you. Open up. It's raining.", "It says it's from you. Open up. It's raining.", 13.4, "w", "cam", 0.88, 0.0, False),
    ("disp", "Nine one one. What's your emergency?", "911. What's your emergency?", 17.3, "b", "phone", 0.95, 0.0, False),
    ("nora", "A man is at my door. Did you send him?", "A man is at my door. Did you send him?", 20.2, "y", None, 0.85, 0.07, True),
    ("disp", "Ma'am, we sent no one to your address.", "Ma'am, we sent no one to your address.", 24.6, "b", "phone", 0.95, 0.0, False),
    ("courier", "I can hear you on the phone, Nora.", "I can hear you on the phone, Nora.", 28.4, "w", "door", 0.72, 0.0, False),
    ("nora", "How does he know I'm calling?", "How does he know I'm calling?", 31.8, "y", None, 0.78, 0.11, True),
    ("disp", "Do not open that door. Officers are four minutes out.", "Do not open that door. Officers are four minutes out.", 34.1, "b", "phone", 0.95, 0.0, False),
    ("disp", "Ma'am, is he still at the door?", "Ma'am, is he still at the door?", 42.4, "b", "phone", 0.95, 0.0, False),
    ("nora", "No. He's gone.", "No. He's gone.", 45.3, "y", None, 0.82, 0.08, True),
    ("courier", "Package for you, Nora. Open the door.", "Package for you, Nora. Open the door.", 53.4, "p", "glass", 0.68, 0.0, False),
    ("nora", "Come on... come on...", "Come on... come on...", 58.5, "y", None, 0.78, 0.12, True),
]
VOICES = {"nora": "af_bella", "courier": "am_onyx", "disp": "bf_emma"}
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, a_, b_): b, a = butter(2, [a_ / (SR / 2), min(0.99, b_ / (SR / 2))], "band"); return lfilter(b, a, x)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * g
def reverb(a, wet, secs=0.3, decay=0.08):
    ir = rng.standard_normal(int(SR * secs)) * np.exp(-np.arange(int(SR * secs)) / (SR * decay)); ir[0] = 0
    return a + wet * fftconvolve(a, ir * 0.04)[: len(a)]
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
voice = np.zeros(N); duck = np.ones(N); caps = []
for i, (who, spoken, cap, t0, col, fx, sp, trem, breath) in enumerate(LINES):
    a, s = k.create(spoken, voice=VOICES[who], speed=sp, lang="en-us"); a = resample_poly(a, 147, 80) if s == 24000 else a
    nz = np.where(np.abs(a) > 0.01 * np.abs(a).max())[0]; a = a[nz[0]: nz[-1] + 1]; a = a / np.abs(a).max() * 0.8
    if trem > 0: a = a * (1 - trem + trem * np.sin(2 * np.pi * 5.5 * np.arange(len(a)) / SR + 0.5))   # shaky, scared
    if breath:
        b_ = bp(rng.standard_normal(int(SR * 0.28)), 500, 4500) * np.sin(np.pi * np.arange(int(SR * 0.28)) / int(SR * 0.28)) * 0.12; a = np.concatenate([b_, a])
    if fx == "phone": a = bp(a, 350, 3600) * 1.5
    elif fx == "cam": a = bp(a, 200, 5500) * 1.2
    elif fx == "door": a = reverb(lp(a, 2600), 0.18)
    elif fx == "glass": a = reverb(lp(a, 1800) * 0.9, 0.3, 0.4, 0.12)
    a = a / max(1e-6, np.abs(a).max()) * 0.8
    sf.write(os.path.join(HERE, f"line_{i:02d}.wav"), a, SR)
    j = int(t0 * SR); e = min(N, j + len(a)); voice[j:e] += a[: e - j]
    d0, d1 = max(0, j - int(0.1 * SR)), min(N, e + int(0.25 * SR)); duck[d0:d1] = 0.5
    dur = len(a) / SR - (0.28 if breath else 0); t_start = t0 + (0.28 if breath else 0)
    words = cap.split(); ws = np.array([len(w) + 1 for w in words], float); ends = np.cumsum(ws) / ws.sum() * dur; starts = np.concatenate([[0], ends[:-1]])
    ch = []; cur = []
    for w, a0, b0 in zip(words, starts, ends):
        cur.append((w, a0, b0))
        if len(cur) >= 3 or re.search(r"[.?!]$", w) or (len(cur) == 2 and len(" ".join(x[0] for x in cur)) > 14): ch.append(cur); cur = []
    if cur: ch.append(cur)
    for c in ch: caps.append({"t0": round(t_start + c[0][1], 3), "t1": round(t_start + c[-1][2] + 0.12, 3), "text": " ".join(x[0] for x in c), "col": col})
    print(i, who, round(t0, 1), "->", round(t0 + len(a) / SR, 1), "s")
# ----------------------------- camera path -> footsteps
cam = TL["cam"]
def herm(f, t):
    ts = [c["t"] for c in cam]; P = [np.array(c[f], float) for c in cam]
    if t <= ts[0]: return P[0]
    if t >= ts[-1]: return P[-1]
    i = max(j for j in range(len(ts) - 1) if ts[j] <= t); t0, t1 = ts[i], ts[i + 1]; h = t1 - t0; u = (t - t0) / h
    if np.allclose(P[i], P[i + 1]): return P[i]
    m0 = (P[i + 1] - P[i - 1]) / (ts[i + 1] - ts[i - 1]) * h if i > 0 else (P[i + 1] - P[i])
    m1 = (P[i + 2] - P[i]) / (ts[i + 2] - ts[i]) * h if i + 2 < len(ts) else (P[i + 1] - P[i])
    return (2*u**3 - 3*u**2 + 1) * P[i] + (u**3 - 2*u**2 + u) * m0 + (-2*u**3 + 3*u**2) * P[i + 1] + (u**3 - u**2) * m1
mix = np.zeros(N)
dist = 0.0; last = herm("p", 0); steps_prev = 0; dt = 1 / 120
for n in range(1, int(TOTAL / dt)):
    t = n * dt; p = herm("p", t); v = np.hypot(p[0] - last[0], p[2] - last[2]); dist += v; last = p
    st = int(dist / 0.7)
    if st > steps_prev and v / dt > 0.15:
        put(mix, lp(rng.uniform(-1, 1, 2600), 380 + 120 * rng.random()) * env(2600, 0.002, 0.05), t, 0.55 + 0.25 * rng.random())
    steps_prev = st
# ----------------------------- ambience
def seg(t0, t1): return ((T >= t0) & (T < t1)).astype(float)
rain = hp(lp(rng.uniform(-1, 1, N), 7000), 1200) * 0.16; mix += rain * 0.8
mix += (np.sin(2 * np.pi * 120 * T) * 0.012 + lp(rng.uniform(-1, 1, N), 300) * 0.035) * seg(0, 5.4)
d = (np.sin(2 * np.pi * 55 * T) + 0.6 * np.sin(2 * np.pi * 55.7 * T) + 0.35 * np.sin(2 * np.pi * 82.5 * T)) * (0.03 + 0.14 * (T / TOTAL) ** 1.8); mix += d
def bell(m, dd=0.9): n = int(SR * dd); tt = np.arange(n) / SR; f = 440 * 2 ** ((m - 69) / 12); return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.25)) * env(n, 0.002, dd / 3)
put(mix, bell(84, 1.0), 0.55, 0.3); put(mix, bell(79, 1.2), 0.72, 0.3)
put(mix, lp(rng.uniform(-1, 1, 9000), 300) * env(9000, 0.05, 0.12), 4.3, 0.5)   # standing up from the sofa
for t0 in (16.5, 17.0): n = int(SR * 0.35); tt = np.arange(n) / SR; put(mix, (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * np.sin(np.pi * tt / 0.35) * 0.1, t0, 1.0)
for t0 in (5.1, 42.3): n = int(SR * 0.1); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 1200 * tt) * np.exp(-tt / 0.04), t0, 0.2)
# thunder after each flash
for f in TL["flashes"]:
    n = int(SR * 3.2); tt = np.arange(n) / SR; th = lp(rng.uniform(-1, 1, n), 140 + 60 * rng.random()) * np.minimum(1, tt / 0.15) * np.exp(-tt / 1.1) * (1 + 0.4 * np.sin(tt * 19))
    put(mix, th / np.abs(th).max(), f + 0.25 + 0.5 * rng.random(), 0.55)
    put(mix, hp(rng.uniform(-1, 1, 2500), 2500) * env(2500, 0.001, 0.04), f, 0.35)   # crack
# flicker buzz
for a_, b_ in TL["flicker"]:
    t = a_
    while t < b_: n = int(SR * (0.03 + 0.05 * rng.random())); tt = np.arange(n) / SR; put(mix, (np.sin(2 * np.pi * 100 * tt) + 0.5 * np.sin(2 * np.pi * 300 * tt)) * 0.05 * np.sin(np.pi * tt / (n / SR)), t, 1.0); t += 0.1 + 0.4 * rng.random()

# ----------------------------- cinematic score (A minor pads that swell, risers into each flash, sub hits)
def pad(freqs, t0, dur, gain):
    n = int(SR * dur); tt = np.arange(n) / SR; sig = np.zeros(n)
    for f in freqs:
        for dtn, w in ((0.997, 0.5), (1.0, 1.0), (1.003, 0.5)):
            sig += w * (np.sin(2 * np.pi * f * dtn * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * dtn * tt) + 0.15 * np.sin(2 * np.pi * 3 * f * dtn * tt))
    sig = lp(sig / max(1e-6, np.abs(sig).max()), 1100) * np.sin(np.pi * tt / dur) ** 0.8
    put(mix, sig, t0, gain)
CH = [(110, 130.8, 164.8), (87.3, 110, 130.8), (73.4, 87.3, 110), (82.4, 103.8, 123.5)]
for i in range(16):
    t0 = i * 4.25; pad(CH[i % 4], t0, 5.2, 0.16 + 0.5 * (t0 / TOTAL) ** 1.3)
for f in TL["flashes"]:
    n = int(SR * 2.0); tt = np.arange(n) / SR; ris = bp(rng.standard_normal(n), 400, 5000) * (tt / 2.0) ** 2.2; put(mix, ris / max(1e-6, np.abs(ris).max()), max(0, f - 2.0), 0.28)
    n = int(SR * 1.6); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 46 * tt * (1 - 0.15 * tt)) * np.exp(-tt / 0.5), f, 0.9)
# door rattle (someone tries the handle)
for k_, t0 in enumerate(np.linspace(TL["jiggle"][0], TL["jiggle"][1], 6)): n = int(SR * 0.09); put(mix, bp(rng.uniform(-1, 1, n), 900, 3800) * env(n, 0.001, 0.03), t0, 0.5)
# pulse (quickening) from 36 s
t = 36.0; step = 0.9
while t < 66: n = int(SR * 0.3); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.1) * 0.45, t, 1.0); put(mix, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.1) * 0.28, t + 0.18, 1.0); t += step; step = max(0.45, step - 0.02)
# glass thumps and boom at the end
for t0, g in ((60.9, 0.6), (62.5, 0.8), (63.9, 1.0)): n = int(SR * 0.4); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 80 * tt) * np.exp(-tt / 0.12) + lp(rng.uniform(-1, 1, n), 900) * env(n, 0.001, 0.04) * 0.6, t0, g * 0.8)
n = int(SR * 1.8); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 2) + 28) / SR) * np.exp(-tt / 0.7) * 0.9, 64.5, 0.8)
n = int(SR * 1.2); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * np.cumsum(1800 + 700 * np.sin(tt * 7)) / SR) * 0.07 * np.exp(-tt / 0.6), 58.4, 1.0)
mix /= np.abs(mix).max() / 0.9
sm = int(0.08 * SR); duck = np.convolve(duck, np.ones(sm) / sm, "same")
out = mix * duck * 0.85 + voice; out /= max(1e-6, np.abs(out).max()) / 0.85
out *= np.minimum(1, T / 0.03) * np.minimum(1, (N - np.arange(N)) / (SR * 0.4))
raw = os.path.join(tempfile.gettempdir(), "s4walk_raw.wav"); sf.write(raw, out, SR, subtype="PCM_16")
subprocess.run([FFMPEG, "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "44100", "-ac", "1", os.path.join(VIDEO, "public", "style4walk_mix.wav")], check=True, capture_output=True)
json.dump(caps, open(os.path.join(VIDEO, "src", "style4", "walk", "captions.json"), "w"), indent=1)
print("done", len(caps), "caption chunks, steps", steps_prev)
