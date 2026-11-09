"""Narration for 'The Computer in the Shipwreck': the version-5 voice (Kokoro am_liam), same delivery as the rat video.
One steady voice, speed varies only a little, NO pitch shifting. Run: python3 -I make_voice.py <kokoro.onnx> <voices.bin> <out_dir> [voice]"""
import sys, json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
onnx, bins, out = sys.argv[1], sys.argv[2], sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else "am_liam"
k = Kokoro(onnx, bins)
# per shot: (text, speed, gain_db, gap_after_seconds). No "?" or "!" . Long stop before "You see,".
SHOTS = [
 [("Divers pulled a rusty lump off the sea floor... and inside it was a computer.", 0.96, 1.5, 0.55), ("Two thousand years old.", 0.9, 1.5, 0.5)],
 [("In nineteen oh one, Greek sponge divers lifted treasure from an ancient shipwreck.", 1.06, 0.3, 0.3), ("Most of it was easy to understand.", 1.04, 0.0, 0.25), ("One piece looked like junk.", 0.96, 0.4, 0.4)],
 [("So it sat in a museum, and for a long time nobody knew what it was.", 1.02, 0.0, 0.45)],
 [("But when scientists finally looked inside with X-rays, they found gears.", 1.06, 0.5, 0.4)],
 [("More than thirty tiny bronze gears, all fitted together like the inside of a watch.", 1.04, 0.3, 0.4)],
 [("And that should have been impossible.", 0.95, 0.6, 0.4), ("Nothing this complicated was known for another thousand years.", 1.0, 0.4, 0.95)],
 [("You see,", 0.98, 0.6, 0.3), ("scans found hidden writing that explained how it worked.", 1.02, 0.5, 0.3), ("Turn the crank, and the gears moved pointers across the sky.", 1.04, 0.4, 0.4)],
 [("One dial showed the phases of the moon.", 1.0, 0.3, 0.25), ("Another warned of eclipses.", 1.02, 0.3, 0.25), ("A third counted the years between the Olympic games.", 1.06, 0.5, 0.4)],
 [("So around two thousand years ago, someone built a machine the size of a shoebox that could predict the sky.", 1.02, 0.8, 0.45)],
 [("Nobody knows who made it.", 0.94, 0.4, 0.4), ("Nothing like it appeared again for over a thousand years.", 0.96, 0.5, 0.45)],
 [("The ancient Greeks built a computer,", 0.94, 1.0, 0.2), ("and the sea kept it for two thousand years.", 0.9, 1.5, 0.0)],
]
SR = 24000; parts, t, starts = [], 0.08, []
for sh in SHOTS:
    starts.append(t)
    for text, sp, gdb, gap in sh:
        a, sr = k.create(text, voice=voice, speed=1.0 + (sp - 1.0) * 0.35, lang="en-us"); assert sr == SR
        a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[nz[0]:nz[-1] + 1] * 10 ** (min(gdb, 0.8) / 20)
        n = len(a); f = min(n // 8, int(0.012 * SR)); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
        parts += [a, np.zeros(int(gap * SR), dtype=np.float32)]; t += len(a) / SR + gap
w = np.concatenate([np.zeros(int(0.08 * SR), dtype=np.float32)] + parts); w = w / np.abs(w).max() * 0.9
sf.write(f"{out}/voice_anti.wav", w, SR)
json.dump({"starts": starts, "total": len(w) / SR}, open(f"{out}/lines_anti.json", "w"), indent=1)
print("total %.1fs" % (len(w) / SR), [round(s, 1) for s in starts])
