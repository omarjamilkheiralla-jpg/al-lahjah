"""Style 1 story short: "The Day Molasses Flooded Boston" Slow narrator (Kokoro am_liam, speed 0.9).
Narration: Kokoro am_liam, steady, no pitch shifting/processing. "You see," is its own beat (generated inside its full sentence, cut at the comma gap,
25 ms fades, 0.42 s pause, no sound effect on it). Writes projects/bear-saloon/narration.wav (dry voice) and projects/bear-saloon/timing.json.
Usage (from video/): python -I projects/molasses-flood/make_voice.py <model_dir>"""
import sys, os, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); MODELS = sys.argv[1]
SR = 44100
SENT = json.load(open(os.path.join(HERE, "script_lines.json")))
GAPS = [0.0, 0.5, 0.7, 0.6, 0.5, 0.6, 0.7, 0.6, 0.7, 0.9, 0.8, 0.6, 0.7, 0.8, 0.9]
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
    cur += GAPS[i]
    if text.startswith("You see,"):
        # two clean takes (no cutting inside a word): "You see," then the rest, with a clear pause between
        A = gen("You see,"); B = gen(text[len("You see,"):].strip()); wA = words_of(A); wB = words_of(B); pause = 0.5
        A = fade(A, 40); B = fade(B, 30); offB = len(A) / SR + pause
        pieces.append((cur, A)); pieces.append((cur + offB, B))
        words = [{"w": "You", "t0": round(cur + wA[0][1], 3), "t1": round(cur + wA[0][2], 3)}, {"w": "see,", "t0": round(cur + wA[-1][1], 3), "t1": round(cur + wA[-1][2], 3)}] if len(wA) >= 2 else [{"w": "You", "t0": round(cur, 3), "t1": round(cur + 0.2, 3)}, {"w": "see,", "t0": round(cur + 0.2, 3), "t1": round(cur + len(A) / SR, 3)}]
        words += [{"w": w, "t0": round(cur + offB + t0, 3), "t1": round(cur + offB + t1, 3)} for w, t0, t1 in wB]
        dur = offB + len(B) / SR; see_t = (words[1]["t0"], words[2]["t0"])
    else:
        a = gen(text); wd = words_of(a)
        pieces.append((cur, fade(a))); dur = len(a) / SR; words = [{"w": w, "t0": round(cur + t0, 3), "t1": round(cur + t1, 3)} for w, t0, t1 in wd]; see_t = None
    timing.append({"text": text, "start": round(cur, 3), "end": round(cur + dur, 3), "words": words, "see": see_t}); cur += dur
    print(i, round(timing[-1]["start"], 2), "->", round(timing[-1]["end"], 2), "|", " ".join(w["w"] for w in words))
TOTAL = cur + 2.6; N = int(SR * TOTAL); voice = np.zeros(N)
for st, a in pieces: a = a / np.abs(a).max() * 0.8; i = int(st * SR); voice[i:i + len(a)] += a
sf.write(os.path.join(HERE, "..", "..", "public", "molasses", "narration.wav"), voice, SR)
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
for _i, _m in {13: {"family": "families"}, 14: {"them": "the"}, 9: {"The": "the"}}.items():
    for _w in timing[_i]["words"]:
        if _w["w"] in _m: _w["w"] = _m[_w["w"]]
json.dump({"total": round(TOTAL, 3), "sentences": timing, "estimate": False, "voice": "Kokoro am_liam"}, open(os.path.join(HERE, "..", "..", "src", "molasses", "timing.json"), "w"), indent=1)
segs, _ = wh.transcribe(resample_poly(voice, 160, 441).astype("float32"), language="en")
print("HEARD:", " ".join(s.text.strip() for s in segs)); print("total", round(TOTAL, 2))
