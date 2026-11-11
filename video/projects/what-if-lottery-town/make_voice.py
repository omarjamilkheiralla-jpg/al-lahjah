"""Narration for 'What if a town won the lottery': version-5 voice (Kokoro am_liam), steady, no pitch shifting.
'You see,' is generated INSIDE its full sentence (a two-word phrase on its own sounds clipped / like "You'll see"),
then split at the natural comma gap, and the pause is inserted by us. The result is verified by transcription.
python3 -I make_voice.py <kokoro.onnx> <voices.bin> <out_dir>"""
import sys, json, subprocess
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from faster_whisper import WhisperModel

onnx, bins, out = sys.argv[1], sys.argv[2], sys.argv[3]
k = Kokoro(onnx, bins); wh = WhisperModel("small.en", compute_type="int8")
SR = 24000
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shots import SHOTS
def synth(text, sp, gdb):
    a, sr = k.create(text, voice="am_liam", speed=1.0 + (sp - 1.0) * 0.35, lang="en-us"); assert sr == SR
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]
    return a[nz[0]:nz[-1] + 1] * 10 ** (min(gdb, 0.8) / 20)
def words_of(a):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], input=a.tobytes(), capture_output=True).stdout
    segs, _ = wh.transcribe(np.frombuffer(r, dtype=np.float32), word_timestamps=True)
    return [(w.word.strip().lower(), w.start, w.end) for s in segs for w in s.words]
def yousee(text, sp, gdb, gap):
    text = text.split(":", 1)[1]; a1 = np.zeros(1, dtype=np.float32)
    for spd in (sp, sp - 0.05, sp - 0.1, sp - 0.15, sp - 0.2, sp + 0.03, sp - 0.3):
        a = synth(text, spd, gdb); w = words_of(a)
        if len(w) >= 4 and w[0][0] == "you" and w[1][0].startswith("see"):
            e1, s2 = w[1][2], w[2][1]
            lo, hi = int(max(0, e1 - 0.03) * SR), int(min(len(a) / SR, s2 + 0.03) * SR)
            env = np.convolve(np.abs(a[lo:hi]), np.ones(int(0.01 * SR)) / int(0.01 * SR), "same")
            cut = lo + int(np.argmin(env))
            a1, a2 = a[:cut].copy(), a[cut:].copy()
            nz = np.where(np.abs(a2) > 0.01)[0]; a2 = a2[nz[0]:]
            if 0.36 < len(a1) / SR < 1.3:
                f = int(0.01 * SR); a1[-f:] *= np.linspace(1, 0, f); a2[:f] *= np.linspace(0, 1, f)
                print("  'You see,' ok at speed %.2f: part1 %.2fs" % (spd, len(a1) / SR)); return [a1, np.zeros(int(0.42 * SR), dtype=np.float32), a2]
        print("  'You see' attempt at %.2f heard %s part1 %.2f" % (spd, [x[0] for x in w[:4]], len(a1)/SR if len(w)>=4 and w[0][0]=='you' else -1))
    raise SystemExit("could not make a clean 'You see,'")
parts, t, starts = [], 0.08, []
for sh in SHOTS:
    starts.append(t)
    for text, sp, gdb, gap in sh:
        segs = yousee(text, sp, gdb, gap) if text.startswith("@YOUSEE:") else [synth(text, sp, gdb)]
        for a in segs:
            n = len(a); f = min(n // 8, int(0.012 * SR)); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
            parts.append(a); t += len(a) / SR
        parts.append(np.zeros(int(gap * SR), dtype=np.float32)); t += gap
w = np.concatenate([np.zeros(int(0.08 * SR), dtype=np.float32)] + parts); w = w / np.abs(w).max() * 0.9
sf.write(f"{out}/voice_town.wav", w, SR)
json.dump({"starts": starts, "total": len(w) / SR}, open(f"{out}/lines_town.json", "w"), indent=1)
print("total %.1fs" % (len(w) / SR), [round(s, 1) for s in starts])
