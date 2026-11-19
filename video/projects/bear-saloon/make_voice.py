"""Style 1 fact/story short: "The Bear in the Saloon" (inattentional blindness, Simons & Chabris 1999).
Narration: Kokoro am_liam, steady, no pitch shifting/processing. "You see," is its own beat (generated inside its full sentence, cut at the comma gap,
25 ms fades, 0.42 s pause, no sound effect on it). Writes projects/bear-saloon/narration.wav (dry voice) and projects/bear-saloon/timing.json.
Usage (from video/): python -I projects/bear-saloon/make_voice.py <model_dir>"""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); MODELS = sys.argv[1]
SR = 44100
SENT = [
    "In a famous experiment, half the people who stared right at a gorilla never saw it.",
    "Imagine you're in a saloon, and the sheriff gives you one job. Count how many times the dealer shuffles the deck.",
    "Easy. You watch his hands. Shuffle. Shuffle. Shuffle.",
    "Behind him, a giant brown bear walks in, stops in the middle of the room, waves at the crowd, and walks out.",
    "The sheriff asks, notice anything strange?",
    "You say, no. Fourteen shuffles.",
    "Then he plays it back. And there's a bear. Right there, for nine whole seconds.",
    "Nothing is wrong with your eyes. In nineteen ninety nine, researchers at Harvard ran this test with a gorilla suit, and about half the people missed it.",
    "You see, think about the last time you searched the whole house for your keys, and they were right there on the table.",
    "Your eyes saw them. Your brain just wasn't looking for them.",
    "Give it a job, and it ignores everything that isn't part of the job. Even a bear.",
    "The bear, for the record, got a free drink.",
]
GAPS = [0.0, 0.55, 0.35, 0.35, 0.40, 0.30, 0.30, 0.45, 0.45, 0.35, 0.35, 0.40]
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
pieces = []; timing = []; cur = 0.0
for i, text in enumerate(SENT):
    a = gen(text); wd = words_of(a); cur += GAPS[i]
    if text.startswith("You see,"):
        see = next(w for w in wd if w[0].lower().startswith("see")); nxt = wd[wd.index(see) + 1]
        cut_a = int(see[2] * SR); cut_b = int(max(see[2], nxt[1] - 0.02) * SR); A = fade(a[:cut_a]); B = fade(a[cut_b:]); pause = 0.42
        pieces.append((cur, A)); pieces.append((cur + len(A) / SR + pause, B)); shift = len(A) / SR + pause - cut_b / SR
        words = [{"w": w, "t0": round(cur + (t0 if t1 <= see[2] + 1e-6 else t0 + shift), 3), "t1": round(cur + (t1 if t1 <= see[2] + 1e-6 else t1 + shift), 3)} for w, t0, t1 in wd]
        dur = len(A) / SR + pause + len(B) / SR; see_t = (round(cur + see[1], 3), round(cur + len(A) / SR + pause, 3))
    else:
        pieces.append((cur, fade(a))); dur = len(a) / SR; words = [{"w": w, "t0": round(cur + t0, 3), "t1": round(cur + t1, 3)} for w, t0, t1 in wd]; see_t = None
    timing.append({"text": text, "start": round(cur, 3), "end": round(cur + dur, 3), "words": words, "see": see_t}); cur += dur
    print(i, round(timing[-1]["start"], 2), "->", round(timing[-1]["end"], 2), "|", " ".join(w["w"] for w in words))
TOTAL = cur + 2.0; N = int(SR * TOTAL); voice = np.zeros(N)
for st, a in pieces: a = a / np.abs(a).max() * 0.8; i = int(st * SR); voice[i:i + len(a)] += a
sf.write(os.path.join(HERE, "narration.wav"), voice, SR)
json.dump({"total": round(TOTAL, 3), "sentences": timing}, open(os.path.join(HERE, "timing.json"), "w"), indent=1)
segs, _ = wh.transcribe(resample_poly(voice, 160, 441).astype("float32"), language="en")
print("HEARD:", " ".join(s.text.strip() for s in segs)); print("total", round(TOTAL, 2))
