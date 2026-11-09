"""Assemble the Chatterbox phrases into one narration (voice_rats.wav) + lines_rats.json.
python3 -I assemble_chatterbox.py <phrase_dir> <out_dir>"""
import sys, json, numpy as np, soundfile as sf
sys.path.insert(0, "projects/hanoi-rats")
from phrases import SHOTS
src, out = sys.argv[1], sys.argv[2]
SR = 24000; parts, t, starts = [], 0.08, []
rms = lambda a: float(np.sqrt((a ** 2).mean()) + 1e-9)
target = 0.11
for i, sh in enumerate(SHOTS):
    starts.append(t)
    for k, (text, gap) in enumerate(sh):
        a, sr = sf.read(f"{src}/s{i}p{k}_seed7.wav"); a = a.astype(np.float32)
        if a.ndim > 1: a = a.mean(1)
        nz = np.where(np.abs(a) > 0.008)[0]; a = a[max(0, nz[0] - int(0.02 * sr)):nz[-1] + int(0.06 * sr)]
        a = a * min(2.5, target / rms(a))                      # same loudness for every phrase
        n = len(a); f = int(0.012 * sr); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
        parts += [a, np.zeros(int(gap * sr), dtype=np.float32)]; t += len(a) / sr + gap
w = np.concatenate([np.zeros(int(0.08 * SR), dtype=np.float32)] + parts)
w = w / np.abs(w).max() * 0.9
sf.write(f"{out}/voice_rats.wav", w, SR)
json.dump({"starts": starts, "total": len(w) / SR}, open(f"{out}/lines_rats.json", "w"), indent=1)
print("total %.1fs" % (len(w) / SR), [round(s, 1) for s in starts])
