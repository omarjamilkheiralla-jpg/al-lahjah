"""Narration for 'Cut Every Tail'. Run: python3 -I make_voice.py <kokoro.onnx> <voices.bin> <out_dir> [voice]"""
import sys, json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

onnx, bins, out = sys.argv[1], sys.argv[2], sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else "am_liam"
k = Kokoro(onnx, bins)
# (shot, text, speed, gap_after, gain_db)
LINES = [
 (1, "They cut the tails off rats... then let every single one go.", 1.0, 0.40, 1.5),
 (2, "Why would anyone do that? In nineteen oh two, Hanoi was crawling with rats, and its French rulers feared the plague.", 1.08, 0.25, 0.5),
 (3, "So they paid rat catchers for every rat they killed.", 1.1, 0.22, 0.0),
 (4, "But counting dead rats was messy, so the rule changed: just bring us the tail.", 1.1, 0.25, 0.3),
 (5, "Then they opened the offer to everyone: one cent for every rat tail!", 1.12, 0.25, 1.0),
 (6, "Soon, officials noticed something strange. Rats, running around, with no tails.", 0.97, 0.35, 0.0),
 (7, "You see, the reward was for the tail, not the rat. A rat left alive to breed was worth more than a dead one.", 1.05, 0.28, 0.6),
 (8, "So people cut off the tails, and set the rats free. Some even raised rats, just to harvest more tails.", 1.05, 0.25, 0.0),
 (9, "So the rats multiplied, and the French paid for more and more tails. Finally... they cancelled the program.", 1.0, 0.35, 0.5),
 (10, "Economists call this a perverse incentive: pay for the measurement, and you get the measurement, not the result.", 1.04, 0.3, 0.5),
 (11, "The French wanted fewer rats. They paid for tails... and that is exactly what they got.", 0.93, 0.0, 1.5),
]
SR = 24000
parts, t, starts = [], 0.0, []
for shot, text, sp, gap, g in LINES:
    a, sr = k.create(text, voice=voice, speed=sp, lang="en-us"); assert sr == SR
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[nz[0]:nz[-1] + 1] * 10 ** (g / 20)
    starts.append(t); parts += [a, np.zeros(int(gap * SR), dtype=np.float32)]; t += len(a) / SR + gap
w = np.concatenate([np.zeros(int(0.08 * SR), dtype=np.float32)] + parts); starts = [s + 0.08 for s in starts]
w = w / np.abs(w).max() * 0.9
sf.write(f"{out}/voice_rats.wav", w, SR)
json.dump({"starts": starts, "total": len(w) / SR, "lines": [(l[0], l[1]) for l in LINES]}, open(f"{out}/lines_rats.json", "w"), indent=1)
print("total", round(len(w) / SR, 2), [round(s, 2) for s in starts])
