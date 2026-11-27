"""Writes src/eiffel/timing.json from script_lines.json using a slow-narrator estimate (about 2.4 words/s).
The ElevenLabs script (make_voice_eleven.mjs) overwrites it with the real voice timing."""
import json, os, re
H = os.path.dirname(os.path.abspath(__file__)); L = json.load(open(os.path.join(H, "script_lines.json")))
GAP = [0.0, 0.5, 0.7, 0.6, 0.6, 0.7, 0.7, 0.6, 0.6, 0.6, 0.9, 0.8, 0.7, 0.9, 0.7, 0.9]
cur = 0.8; S = []
for i, text in enumerate(L):
    cur += GAP[i]; words = []; t = cur
    for w in text.split():
        d = 0.12 + 0.042 * len(re.sub(r"\W", "", w)); words.append({"w": w, "t0": round(t, 3), "t1": round(t + d, 3)}); t += d + (0.16 if w[-1] in ",." else 0.04)
    see = None
    if text.startswith("You see,"): see = [words[1]["t0"], words[2]["t0"]]
    S.append({"text": text, "start": round(cur, 3), "end": round(t, 3), "words": words, "see": see}); cur = t
total = round(cur + 1.0 + 1.6, 3)
json.dump({"total": total, "sentences": S, "estimate": True}, open(os.path.join(H, "..", "..", "src", "eiffel", "timing.json"), "w"), indent=1)
print("total", total)
