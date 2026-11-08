"""Synthesises the narration line by line with its own pace/energy, then writes timing.json.
Run: python3 -I make_voice.py <kokoro.onnx> <voices.bin> <out_dir> [voice]"""
import sys, json, subprocess
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

onnx, bins, out = sys.argv[1], sys.argv[2], sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else "am_liam"
k = Kokoro(onnx, bins)

# (shot, text, speed, gap_after_seconds, gain_db)
LINES = [
 (1, "A Chicago hotel was lifted six feet into the air... with every guest still inside.", 1.0, 0.40, 1.5),
 (2, "How is that even possible? Chicago sat barely above the lake, so its streets were mud, and its sewers couldn't drain.", 1.08, 0.22, 0.0),
 (3, "After cholera hit in eighteen fifty-four, one engineer proposed raising the streets, by up to fourteen feet!", 1.07, 0.30, 0.5),
 (4, "But the buildings were already standing there, and nobody wanted to knock them down.", 1.1, 0.22, 0.0),
 (5, "Then a young builder named George Pullman said he could lift them, with nothing but jackscrews.", 1.1, 0.25, 0.8),
 (6, "The hotel's owner agreed on one condition: no guest could be disturbed.", 1.0, 0.35, 0.0),
 (7, "You see, a jackscrew turns a tiny twist into a giant lift. So hundreds of men each took a screw.", 1.07, 0.28, 0.5),
 (8, "Inch by tiny inch, they raised the hotel, while guests kept eating and sleeping upstairs.", 0.97, 0.22, 0.0),
 (9, "So after the last turn, the hotel stood six feet higher... and not one guest had to leave!", 1.04, 0.35, 1.2),
 (10, "Soon, whole blocks of shops were rising too, with the stores still open.", 1.15, 0.30, 0.5),
 (11, "That's how Chicago lifted itself out of the mud... one tiny turn at a time.", 0.93, 0.0, 1.5),
]
SR = 24000
parts, t, starts = [], 0.0, []
for shot, text, sp, gap, g in LINES:
    a, sr = k.create(text, voice=voice, speed=sp, lang="en-us")
    assert sr == SR
    a = a.astype(np.float32)
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.01)[0]
    a = a[nz[0]:nz[-1] + 1]
    a *= 10 ** (g / 20)
    starts.append(t)
    parts.append(a)
    parts.append(np.zeros(int(gap * SR), dtype=np.float32))
    t += len(a) / SR + gap
voice_wav = np.concatenate([np.zeros(int(0.08 * SR), dtype=np.float32)] + parts)
starts = [s + 0.08 for s in starts]
peak = np.abs(voice_wav).max()
voice_wav = voice_wav / peak * 0.9
sf.write(f"{out}/voice_full.wav", voice_wav, SR)
json.dump({"starts": starts, "total": len(voice_wav) / SR, "lines": [(l[0], l[1]) for l in LINES]}, open(f"{out}/lines.json", "w"), indent=1)
print("total", round(len(voice_wav) / SR, 2), "starts", [round(s, 2) for s in starts])
