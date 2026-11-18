"""Motion-graphics sample "The town that has been on fire since 1962" (Centralia, Pennsylvania).
Voice: Kokoro am_liam (steady, no processing). "You see," is its own beat (generated inside its full sentence, cut at the comma, 0.42 s pause, 25 ms fades).
Writes public/centralia_mix.wav and src/mg/timing.json.
Usage (from video/): python -I projects/centralia/make_voice.py <model_dir> <ffmpeg_path>"""
import sys, os, json, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
MODELS, FFMPEG = sys.argv[1], sys.argv[2]
SR = 44100; rng = np.random.default_rng(5)
SENT = [
    "A town in Pennsylvania has been on fire for more than sixty years.",
    "In May nineteen sixty two, the town of Centralia burned its trash in an old coal pit.",
    "You see, the pit was connected to coal tunnels under the town.",
    "The fire slipped inside, and it never went out.",
    "Smoke rose from cracks in the ground. Roads split open. Steam poured out of the grass.",
    "In nineteen eighty one, the ground opened under a twelve year old boy. He grabbed a tree root and held on until his cousin pulled him out.",
    "About a thousand people lived there. Today, five.",
    "And the fire is still burning.",
]
GAPS = [0.0, 0.40, 0.30, 0.25, 0.40, 0.45, 0.45, 0.55]
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, a_, b_): b, a = butter(2, [a_ / (SR / 2), min(0.99, b_ / (SR / 2))], "band"); return lfilter(b, a, x)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
wh = WhisperModel("small.en", device="cpu", compute_type="int8")
def gen(text):
    a, s = k.create(text, voice="am_liam", speed=1.0, lang="en-us"); a = resample_poly(a, 147, 80) if s == 24000 else a
    nz = np.where(np.abs(a) > 0.01 * np.abs(a).max())[0]; return a[nz[0]: nz[-1] + 1]
def words_of(a):
    segs, _ = wh.transcribe(resample_poly(a, 160, 441).astype("float32"), language="en", word_timestamps=True)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
def fade(a, ms=25):
    n = int(SR * ms / 1000); a = a.copy(); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n); return a
pieces = []   # (start_time, audio)
timing = []; cur = 0.0
for i, text in enumerate(SENT):
    a = gen(text); wd = words_of(a)
    cur += GAPS[i]
    if i == 2:   # "You see," beat: cut at the comma gap, insert 0.42 s of silence
        see = next(w for w in wd if w[0].lower().startswith("see")); nxt = wd[wd.index(see) + 1]
        cut_a = int(see[2] * SR); cut_b = int(max(see[2], nxt[1] - 0.02) * SR)
        A = fade(a[:cut_a]); B = fade(a[cut_b:]); pause = 0.42
        pieces.append((cur, A)); pieces.append((cur + len(A) / SR + pause, B))
        shift = len(A) / SR + pause - cut_b / SR
        words = []
        for w, t0, t1 in wd:
            words.append({"w": w, "t0": round(cur + (t0 if t1 <= see[2] + 1e-6 else t0 + shift), 3), "t1": round(cur + (t1 if t1 <= see[2] + 1e-6 else t1 + shift), 3)})
        dur = len(A) / SR + pause + len(B) / SR
    else:
        pieces.append((cur, fade(a))); dur = len(a) / SR
        words = [{"w": w, "t0": round(cur + t0, 3), "t1": round(cur + t1, 3)} for w, t0, t1 in wd]
    timing.append({"text": text, "start": round(cur, 3), "end": round(cur + dur, 3), "words": words}); cur += dur
    print(i, round(timing[-1]["start"], 2), "->", round(timing[-1]["end"], 2), "|", " ".join(w["w"] for w in words))
TOTAL = cur + 2.4; N = int(SR * TOTAL); T = np.arange(N) / SR
voice = np.zeros(N)
for st, a in pieces: a = a / np.abs(a).max() * 0.8; i = int(st * SR); voice[i:i + len(a)] += a
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * g
mix = np.zeros(N)
S = [x["start"] for x in timing]; E = [x["end"] for x in timing]
def noise(n): return rng.standard_normal(n)
def whoosh(t0, dur=0.9, g=0.5):
    n = int(SR * dur); tt = np.arange(n) / SR; x = bp(noise(n), 300, 5000) * np.sin(np.pi * (tt / dur)) ** 2; put(mix, x / np.abs(x).max(), t0, g)
def boom(t0, g=0.9, f=48):
    n = int(SR * 1.8); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * np.cumsum(f * np.exp(-tt * 1.6) + 26) / SR) * np.exp(-tt / 0.7), t0, g)
def crackle(t0, dur, g=0.4, rate=60):
    n = int(SR * dur); x = np.zeros(n)
    for _ in range(int(dur * rate)): i = rng.integers(0, n - 400); L = rng.integers(60, 360); x[i:i + L] += noise(L) * np.exp(-np.arange(L) / (L * 0.3)) * rng.random()
    put(mix, hp(x, 1500) / max(1e-6, np.abs(x).max()), t0, g)
def rumble(t0, dur, g=0.5):
    n = int(SR * dur); tt = np.arange(n) / SR; x = lp(noise(n), 90) * np.sin(np.pi * tt / dur) ** 0.7; put(mix, x / np.abs(x).max(), t0, g)
def snap(t0, g=0.6): n = int(SR * 0.18); put(mix, bp(noise(n), 600, 6000) * env(n, 0.0005, 0.03), t0, g)
def hiss(t0, dur, g=0.25): n = int(SR * dur); tt = np.arange(n) / SR; x = hp(noise(n), 3000) * np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.5); put(mix, x / np.abs(x).max(), t0, g)
def bell(m, dd=1.2): n = int(SR * dd); tt = np.arange(n) / SR; f = 440 * 2 ** ((m - 69) / 12); return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3)) * env(n, 0.002, dd / 3)
def pad(freqs, t0, dur, g):
    n = int(SR * dur); tt = np.arange(n) / SR; sig = np.zeros(n)
    for f in freqs:
        for dtn, w in ((0.997, 0.5), (1.0, 1.0), (1.003, 0.5)): sig += w * (np.sin(2 * np.pi * f * dtn * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * dtn * tt) + 0.15 * np.sin(2 * np.pi * 3 * f * dtn * tt))
    put(mix, lp(sig / np.abs(sig).max(), 1000) * np.sin(np.pi * tt / dur) ** 0.8, t0, g)
# music bed: A minor pads swelling, deep drone, slow pulse
CH = [(110, 130.8, 164.8), (87.3, 110, 130.8), (73.4, 87.3, 110), (82.4, 103.8, 123.5)]
for i in range(int(TOTAL / 4.25) + 1): pad(CH[i % 4], i * 4.25, 5.4, 0.12 + 0.35 * min(1, (i * 4.25) / TOTAL) ** 1.2)
mix += (np.sin(2 * np.pi * 55 * T) + 0.6 * np.sin(2 * np.pi * 55.6 * T)) * (0.03 + 0.1 * (T / TOTAL) ** 1.5)
# fire bed grows with the story
crackle(0.0, TOTAL, 0.18, 35)
# scene sound design (visuals are keyed to the same sentence times)
boom(S[0] - 0.05, 1.0); whoosh(S[0] + 0.1, 1.2, 0.5)
whoosh(S[1] - 0.15, 0.8, 0.45); crackle(S[1] + 2.4, 3.0, 0.5, 120); rumble(S[1] + 2.4, 3.0, 0.4)       # trash ignites
whoosh(S[2] - 0.15, 0.7, 0.4)                                                                          # (no effect lands on "You see,")
rumble(S[3] - 0.2, E[3] - S[3] + 0.6, 0.6); hiss(S[3], E[3] - S[3], 0.2); crackle(S[3], E[3] - S[3], 0.5, 150)
for j, off in enumerate((0.5, 1.9, 3.2)): snap(S[4] + off, 0.7)
hiss(S[4] + 2.6, 2.5, 0.3); rumble(S[4] + 1.0, 2.0, 0.4)
whoosh(S[5] - 0.1, 0.7, 0.4); rumble(S[5] + 1.9, 2.0, 0.8); snap(S[5] + 2.0, 0.9); hiss(S[5] + 2.2, 4.0, 0.3)
for j in range(14): snap(S[6] + 1.2 + j * 0.1, 0.12 + 0.01 * j)                                        # dots disappearing
boom(S[6] + 2.4, 0.8, 40)
boom(S[7] - 0.05, 1.0, 44); crackle(S[7], 4.0, 0.6, 160); rumble(S[7], 3.5, 0.5)
mix /= np.abs(mix).max() / 0.85
# ta-ding at the very end
ta = np.zeros(N); put(ta, bell(88, 1.4), E[7] + 0.55, 0.5); put(ta, bell(95, 1.8), E[7] + 0.75, 0.5)
duck = np.ones(N)
for st, a in pieces: duck[max(0, int((st - 0.1) * SR)): int((st + len(a) / SR + 0.2) * SR)] = 0.45
sm = int(0.08 * SR); duck = np.convolve(duck, np.ones(sm) / sm, "same")
out = mix * duck * 0.9 + voice + ta * 0.55; out /= np.abs(out).max() / 0.85; out *= np.minimum(1, T / 0.03) * np.minimum(1, (N - np.arange(N)) / (SR * 0.5))
raw = os.path.join(tempfile.gettempdir(), "cent_raw.wav"); sf.write(raw, out, SR, subtype="PCM_16")
subprocess.run([FFMPEG, "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "44100", "-ac", "1", os.path.join(VIDEO, "public", "centralia_mix.wav")], check=True, capture_output=True)
os.makedirs(os.path.join(VIDEO, "src", "mg"), exist_ok=True)
json.dump({"total": round(TOTAL, 3), "sentences": timing}, open(os.path.join(VIDEO, "src", "mg", "timing.json"), "w"), indent=1)
# verify the voice by transcription of the assembled track (first 60 s)
segs, _ = wh.transcribe(resample_poly(voice, 160, 441).astype("float32"), language="en")
print("HEARD:", " ".join(s.text.strip() for s in segs))
print("total", round(TOTAL, 2))
