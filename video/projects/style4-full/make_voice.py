"""STYLE 4 full video (68 s): "Package for you". Voices (Kokoro, a different voice per character) + ambience + mix + caption timings.
Usage (from video/):  python -I projects/style4-full/make_voice.py <model_dir> <ffmpeg_path>
Writes public/style4full_mix.wav and src/style4/full/captions.json"""
import sys, os, json, subprocess, tempfile, re
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, lfilter, fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
MODELS = sys.argv[1]; FFMPEG = sys.argv[2]
SR = 44100; TOTAL = 68.0; N = int(SR * TOTAL); T = np.arange(N) / SR
rng = np.random.default_rng(7)
# (speaker, spoken text, caption text, start s, colour, effect)
LINES = [
    ("nora", "Who rings the bell at two a.m.?", "Who rings the bell at 2 a.m.?", 2.8, "y", None),
    ("courier", "Delivery. We have a package for Nora Hale. I need you to open the door.", "Delivery. We have a package for Nora Hale. I need you to open the door.", 5.7, "w", "cam"),
    ("nora", "I didn't order anything.", "I didn't order anything.", 11.0, "y", None),
    ("courier", "It says it's from you. Open up. It's raining.", "It says it's from you. Open up. It's raining.", 13.1, "w", "cam"),
    ("disp", "Nine one one. What's your emergency?", "911. What's your emergency?", 17.3, "b", "phone"),
    ("nora", "A man is at my door. Did you send him?", "A man is at my door. Did you send him?", 20.2, "y", None),
    ("disp", "Ma'am, we sent no one to your address.", "Ma'am, we sent no one to your address.", 24.5, "b", "phone"),
    ("courier", "I can hear you on the phone, Nora.", "I can hear you on the phone, Nora.", 28.3, "w", "cam"),
    ("nora", "How does he know I'm calling?", "How does he know I'm calling?", 31.6, "y", None),
    ("disp", "Do not open that door. Officers are four minutes out.", "Do not open that door. Officers are four minutes out.", 34.0, "b", "phone"),
    ("disp", "Ma'am, is he still at the door?", "Ma'am, is he still at the door?", 42.4, "b", "phone"),
    ("nora", "No. He's gone.", "No. He's gone.", 45.3, "y", None),
    ("courier", "Package for you, Nora. Open the door.", "Package for you, Nora. Open the door.", 53.4, "p", "peep"),
]
VOICES = {"nora": ("af_nicole", 0.82), "courier": ("am_onyx", 0.88), "disp": ("bf_emma", 0.95)}
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, a_, b_): b, a = butter(2, [a_ / (SR / 2), min(0.99, b_ / (SR / 2))], "band"); return lfilter(b, a, x)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * g
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
voice = np.zeros(N); duck = np.ones(N); caps = []
for i, (who, spoken, cap, t0, col, fx) in enumerate(LINES):
    v, sp = VOICES[who]
    a, s = k.create(spoken, voice=v, speed=sp, lang="en-us"); a = resample_poly(a, 147, 80) if s == 24000 else a
    nz = np.where(np.abs(a) > 0.01 * np.abs(a).max())[0]; a = a[nz[0]: nz[-1] + 1]; a = a / np.abs(a).max() * 0.8
    if fx == "phone": a = bp(a, 350, 3600) * 1.5
    elif fx == "cam": a = bp(a, 200, 5500) * 1.2
    elif fx == "peep":
        a = lp(a, 1800) * 0.9; ir = rng.standard_normal(int(SR * 0.3)) * np.exp(-np.arange(int(SR * 0.3)) / (SR * 0.07)); ir[0] = 0; a = a + 0.22 * fftconvolve(a, ir * 0.04)[: len(a)]
    a = a / max(1e-6, np.abs(a).max()) * 0.8
    sf.write(os.path.join(HERE, f"line_{i:02d}.wav"), a, SR)
    j = int(t0 * SR); e = min(N, j + len(a)); voice[j:e] += a[: e - j]
    d0, d1 = max(0, j - int(0.1 * SR)), min(N, e + int(0.25 * SR)); duck[d0:d1] = 0.5
    dur = len(a) / SR; words = cap.split(); ws = np.array([len(w) + 1 for w in words], float); ends = np.cumsum(ws) / ws.sum() * dur
    starts = np.concatenate([[0], ends[:-1]])
    # chunks of 2-3 words (break after sentence punctuation)
    ch = []; cur = []
    for w, a0, b0 in zip(words, starts, ends):
        cur.append((w, a0, b0))
        if len(cur) >= 3 or re.search(r"[.?!]$", w) or (len(cur) == 2 and len(" ".join(x[0] for x in cur)) > 14): ch.append(cur); cur = []
    if cur: ch.append(cur)
    for c in ch: caps.append({"t0": round(t0 + c[0][1], 3), "t1": round(t0 + c[-1][2] + 0.12, 3), "text": " ".join(x[0] for x in c), "col": col})
    print(i, who, round(t0, 1), "->", round(t0 + dur, 1), "s")
# ----------------------------- ambience
mix = np.zeros(N)
def seg(t0, t1): return ((T >= t0) & (T < t1)).astype(float)
rain = hp(lp(rng.uniform(-1, 1, N), 7000), 1200) * 0.2
outside = np.convolve(seg(5.4, 16.5) + seg(28, 31) + seg(42, 44) + seg(54, 58), np.ones(2000) / 2000, "same")
mix += rain * (0.45 + 0.9 * outside)
mix += (np.sin(2 * np.pi * 120 * T) * 0.015 + lp(rng.uniform(-1, 1, N), 300) * 0.04) * seg(0, 5.4)
d = (np.sin(2 * np.pi * 55 * T) + 0.6 * np.sin(2 * np.pi * 55.7 * T) + 0.35 * np.sin(2 * np.pi * 82.5 * T)) * (0.03 + 0.14 * (T / TOTAL) ** 1.8); mix += d
def bell(m, dd=0.9): n = int(SR * dd); tt = np.arange(n) / SR; f = 440 * 2 ** ((m - 69) / 12); return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.25)) * env(n, 0.002, dd / 3)
put(mix, bell(84, 1.0), 2.45, 0.2); put(mix, bell(79, 1.2), 2.62, 0.2)   # doorbell
for t0 in (16.5, 17.0): n = int(SR * 0.35); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 440 * tt) * np.sin(np.pi * tt / 0.35) * 0.12 + np.sin(2 * np.pi * 480 * tt) * np.sin(np.pi * tt / 0.35) * 0.12, t0, 1.0)  # ringing
for t0 in (5.45, 28.2, 42.4): n = int(SR * 0.1); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 1200 * tt) * np.exp(-tt / 0.04), t0, 0.2)  # cam beeps
for t0 in (6.2, 9.4, 15.0): put(mix, lp(rng.uniform(-1, 1, 2000), 700) * env(2000, 0.001, 0.03), t0, 0.5)
t = 38.0; step = 0.9
while t < 66: n = int(SR * 0.3); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.1) * 0.5, t, 1.0); put(mix, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.1) * 0.3, t + 0.18, 1.0); t += step; step = max(0.45, step - 0.02)
for t0 in (50.4, 51.0): put(mix, lp(rng.uniform(-1, 1, 5000), 500) * env(5000, 0.001, 0.06), t0, 0.7)  # back-door thump
n = int(SR * 1.8); tt = np.arange(n) / SR; boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 2) + 28) / SR) * np.exp(-tt / 0.7) * 0.9
put(mix, boom, 60.4, 0.8); put(mix, boom, 62.0, 1.0)
n = int(SR * 1.2); tt = np.arange(n) / SR; put(mix, (np.sin(2 * np.pi * np.cumsum(1800 + 700 * np.sin(tt * 7)) / SR)) * 0.08 * np.exp(-tt / 0.6), 58.6, 1.0)  # call failed
mix /= np.abs(mix).max() / 0.9
sm = int(0.08 * SR); duck = np.convolve(duck, np.ones(sm) / sm, "same")
out = mix * duck * 0.85 + voice
out /= max(1e-6, np.abs(out).max()) / 0.85
out *= np.minimum(1, T / 0.03) * np.minimum(1, (N - np.arange(N)) / (SR * 0.4))
raw = os.path.join(tempfile.gettempdir(), "s4full_raw.wav"); sf.write(raw, out, SR, subtype="PCM_16")
subprocess.run([FFMPEG, "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "44100", "-ac", "1", os.path.join(VIDEO, "public", "style4full_mix.wav")], check=True, capture_output=True)
os.makedirs(os.path.join(VIDEO, "src", "style4", "full"), exist_ok=True)
json.dump(caps, open(os.path.join(VIDEO, "src", "style4", "full", "captions.json"), "w"), indent=1)
print("done", len(caps), "caption chunks")
