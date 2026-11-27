"""Style 1 story short: "He Sold the Eiffel Tower. Twice." Slow narrator (Kokoro am_liam, speed 0.9).
Narration: Kokoro am_liam, steady, no pitch shifting/processing. "You see," is its own beat (generated inside its full sentence, cut at the comma gap,
25 ms fades, 0.42 s pause, no sound effect on it). Writes projects/bear-saloon/narration.wav (dry voice) and projects/bear-saloon/timing.json.
Usage (from video/): python -I projects/eiffel-con/make_voice.py <model_dir>"""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); MODELS = sys.argv[1]
SR = 44100
SENT = json.load(open(os.path.join(HERE, "script_lines.json")))
GAPS = [0.0, 0.5, 0.7, 0.6, 0.6, 0.7, 0.7, 0.6, 0.6, 0.6, 0.9, 0.8, 0.7, 0.9, 0.7, 0.9]
SPEED = 0.9
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
wh = WhisperModel("small.en", device="cpu", compute_type="int8")
def gen(text):
    a, s = k.create(text.replace("Poisson", "Pwasson").replace("André", "Andray").replace("Eiffel", "Eye-full" if False else "Eiffel"), voice="am_liam", speed=SPEED, lang="en-us"); a = resample_poly(a, 147, 80) if s == 24000 else a
    nz = np.where(np.abs(a) > 0.01 * np.abs(a).max())[0]; return a[nz[0]: nz[-1] + 1]
def words_of(a):
    segs, _ = wh.transcribe(resample_poly(a, 160, 441).astype("float32"), language="en", word_timestamps=True)
    return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
def fade(a, ms=25):
    n = int(SR * ms / 1000); a = a.copy(); a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n); return a
pieces = []; timing = []; cur = 0.8
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
TOTAL = cur + 2.6; N = int(SR * TOTAL); voice = np.zeros(N)
for st, a in pieces: a = a / np.abs(a).max() * 0.8; i = int(st * SR); voice[i:i + len(a)] += a
sf.write(os.path.join(HERE, "..", "..", "public", "eiffel", "narration.wav"), voice, SR)
import re as _re
def _fix(w):
    lw = _re.sub(r"\W", "", w.lower())
    if lw.startswith(("pwas", "pwos", "poiso", "pois", "pwa", "pew", "poisson")): return _re.sub(r"^[\w-]+", "Poisson", w)
    if lw.startswith(("andr", "ondr", "andray", "andre")): return _re.sub(r"^[\w-]+", "André", w)
    return w
for _s in timing:
    _o = []
    for _w in _s["words"]:
        if _o and _re.fullmatch(r"p\.?-?", _o[-1]["w"].lower()) and _re.sub(r"\W", "", _w["w"].lower()).startswith("was"):
            _o[-1] = {"w": "Poisson" + _re.sub(r"^\w+", "", _w["w"]), "t0": _o[-1]["t0"], "t1": _w["t1"]}; continue
        _o.append(dict(_w))
    _s["words"] = _o
    for _w in _s["words"]: _w["w"] = _fix(_w["w"])
json.dump({"total": round(TOTAL, 3), "sentences": timing, "estimate": False, "voice": "Kokoro am_liam"}, open(os.path.join(HERE, "..", "..", "src", "eiffel", "timing.json"), "w"), indent=1)
segs, _ = wh.transcribe(resample_poly(voice, 160, 441).astype("float32"), language="en")
print("HEARD:", " ".join(s.text.strip() for s in segs)); print("total", round(TOTAL, 2))
