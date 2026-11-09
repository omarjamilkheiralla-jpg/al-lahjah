"""Narration for 'Cut Every Tail', delivered phrase by phrase: each phrase has its own pace, pitch and gain so the
reading rises on questions, brightens on 'one cent!', slows for the joke and drops flat on 'cancelled'.
Run: python3 -I make_voice.py <kokoro.onnx> <voices.bin> <out_dir> [voice]"""
import sys, json
import numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro

onnx, bins, out = sys.argv[1], sys.argv[2], sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else "am_liam"
k = Kokoro(onnx, bins)
# per shot: list of (text, speed, pitch_semitones, gain_db, gap_after_seconds)
SHOTS = [
 [("They cut the tails off rats...", 0.96, 0.0, 1.5, 0.28), ("then let every single one go.", 1.0, -0.6, 1.5, 0.35)],
 [("Why would anyone do that?", 1.04, 1.3, 1.0, 0.32), ("In nineteen oh two, Hanoi was crawling with rats,", 1.08, 0.2, 0.0, 0.14), ("and its French rulers feared the plague.", 0.98, -1.2, 0.3, 0.2)],
 [("So they paid rat catchers for every rat they killed.", 1.1, 0.6, 0.0, 0.2)],
 [("But counting dead rats was messy,", 1.06, -0.6, 0.0, 0.1), ("so the rule changed:", 1.0, 0.0, 0.0, 0.2), ("just bring us the tail.", 1.1, 1.2, 0.8, 0.2)],
 [("Then they opened the offer to everyone:", 1.12, 0.6, 0.3, 0.16), ("one cent for every rat tail!", 1.1, 1.3, 1.6, 0.2)],
 [("Soon, officials noticed something strange.", 0.95, -1.0, 0.0, 0.4), ("Rats... running around... with no tails.", 0.9, 0.0, 0.6, 0.95)],
 [("You see,", 0.98, 0.0, 0.6, 0.3), ("the reward was for the tail, not the rat.", 1.02, 0.0, 0.5, 0.22), ("A rat left alive to breed was worth more than a dead one.", 1.05, -0.4, 0.2, 0.24)],
 [("So people cut off the tails... and set the rats free.", 1.05, 0.6, 0.0, 0.16), ("Some even raised rats, just to harvest more tails.", 1.05, 1.2, 0.5, 0.22)],
 [("So the rats multiplied,", 1.0, 0.0, 0.0, 0.1), ("and the French paid for more and more tails.", 1.06, 0.4, 0.0, 0.32), ("Finally... they cancelled the program.", 0.9, -1.3, 0.6, 0.3)],
 [("Economists call this a perverse incentive:", 1.0, 0.0, 0.3, 0.22), ("pay for the measurement, and you get the measurement... not the result.", 0.97, 0.4, 0.6, 0.3)],
 [("The French wanted fewer rats.", 0.95, -0.4, 0.5, 0.36), ("They paid for tails...", 0.92, 0.2, 0.5, 0.26), ("and that is exactly what they got.", 0.88, -1.3, 1.5, 0.0)],
]
SR = 24000
parts, t, starts = [], 0.0, []
for sh in SHOTS:
    starts.append(t)
    for text, sp, semi, gdb, gap in sh:
        a, sr = k.create(text, voice=voice, speed=1.0 + (sp - 1.0) * 0.35, lang="en-us"); assert sr == SR   # speed varies only a little, pitch never touched
        a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]; a = a[nz[0]:nz[-1] + 1]
        a = a * 10 ** (min(gdb, 0.8) / 20)
        # soft attack/release so phrases never click
        n = len(a); f = min(n // 8, int(0.012 * SR)); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
        parts += [a, np.zeros(int(gap * SR), dtype=np.float32)]; t += len(a) / SR + gap
w = np.concatenate([np.zeros(int(0.08 * SR), dtype=np.float32)] + parts); starts = [s + 0.08 for s in starts]
w = w / np.abs(w).max() * 0.9
sf.write(f"{out}/voice_rats.wav", w, SR)
json.dump({"starts": starts, "total": len(w) / SR}, open(f"{out}/lines_rats.json", "w"), indent=1)
f0, _, _ = librosa.pyin(w, fmin=70, fmax=420, sr=SR); f = f0[~np.isnan(f0)]
hop = 512 / SR; med = []
for st, en in zip(starts, starts[1:] + [len(w) / SR]):
    seg = f0[int(st / hop):int(en / hop)]; seg = seg[~np.isnan(seg)]
    med.append(round(float(np.median(seg)), 0) if len(seg) else 0)
print("median pitch per shot (Hz):", med, "| spread: %.1f semitones" % (12 * np.log2(max(med) / min(med))))
print("total", round(len(w) / SR, 2), "| pitch mean %.0f std %.0f range %.0f-%.0f Hz" % (f.mean(), f.std(), np.percentile(f, 5), np.percentile(f, 95)))
print([round(s, 2) for s in starts])
