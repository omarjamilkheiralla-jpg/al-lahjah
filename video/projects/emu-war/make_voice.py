"""Narration for 'The Emu War': version-5 voice (Kokoro am_liam), steady, no pitch shifting.
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
# per shot: list of (text, speed, gain_db, gap_after). A text starting with "@YOUSEE:" is split after "see,".
SHOTS = [
 [("Australia sent soldiers with machine guns to fight birds... and the birds won.", 0.95, 1.5, 0.5)],
 [("In nineteen thirty-two, a drought pushed about twenty thousand emus onto the wheat farms of Western Australia.", 1.04, 0.4, 0.3),
  ("Many of the farmers were veterans on poor land, and the birds were wrecking their wheat.", 1.02, 0.2, 0.4)],
 [("So the farmers asked for help, and the government sent the army.", 1.04, 0.3, 0.4)],
 [("But the emus did something nobody expected.", 0.98, 0.5, 0.3), ("They split into small groups, and ran.", 1.04, 0.5, 0.4)],
 [("Every time the soldiers got close, the birds scattered, and stayed just out of range.", 1.02, 0.4, 0.45)],
 [("So the army tried a truck.", 1.0, 0.3, 0.25), ("They mounted a machine gun on the back, and chased the birds.", 1.05, 0.3, 0.25), ("But a bouncing truck is a terrible place to aim.", 0.98, 0.4, 1.0)],
 [("@YOUSEE:You see, a machine gun works best on a target that stays in one place.", 1.0, 0.6, 0.35), ("Emus are fast, and they scatter.", 1.02, 0.5, 0.45)],
 [("The soldiers fired round after round, and the emus kept running.", 1.02, 0.4, 0.45)],
 [("So in the end, the army gave up and went home.", 0.96, 0.4, 0.45)],
 [("Power does not help when your target will not stand still.", 0.95, 0.6, 0.5)],
 [("The army had machine guns.", 0.94, 0.6, 0.5), ("The emus had legs.", 0.9, 1.0, 0.0)],
]
def synth(text, sp, gdb):
    a, sr = k.create(text, voice="am_liam", speed=1.0 + (sp - 1.0) * 0.35, lang="en-us"); assert sr == SR
    a = a.astype(np.float32); nz = np.where(np.abs(a) > 0.01)[0]
    return a[nz[0]:nz[-1] + 1] * 10 ** (min(gdb, 0.8) / 20)
def words_of(a):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], input=a.tobytes(), capture_output=True).stdout
    segs, _ = wh.transcribe(np.frombuffer(r, dtype=np.float32), word_timestamps=True)
    return [(w.word.strip().lower(), w.start, w.end) for s in segs for w in s.words]
def yousee(text, sp, gdb, gap):
    text = text.split(":", 1)[1]
    for spd in (sp, sp - 0.02, sp + 0.02, sp - 0.04, sp + 0.04):
        a = synth(text, spd, gdb); w = words_of(a)
        if len(w) >= 4 and w[0][0] == "you" and w[1][0].startswith("see"):
            e1, s2 = w[1][2], w[2][1]
            lo, hi = int(max(0, e1 - 0.03) * SR), int(min(len(a) / SR, s2 + 0.03) * SR)
            env = np.convolve(np.abs(a[lo:hi]), np.ones(int(0.01 * SR)) / int(0.01 * SR), "same")
            cut = lo + int(np.argmin(env))
            a1, a2 = a[:cut].copy(), a[cut:].copy()
            nz = np.where(np.abs(a2) > 0.01)[0]; a2 = a2[nz[0]:]
            if 0.45 < len(a1) / SR < 1.3:
                f = int(0.01 * SR); a1[-f:] *= np.linspace(1, 0, f); a2[:f] *= np.linspace(0, 1, f)
                print("  'You see,' ok at speed %.2f: part1 %.2fs" % (spd, len(a1) / SR)); return [a1, np.zeros(int(0.42 * SR), dtype=np.float32), a2]
        print("  'You see' attempt at %.2f heard %s" % (spd, [x[0] for x in w[:4]]))
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
sf.write(f"{out}/voice_emu.wav", w, SR)
json.dump({"starts": starts, "total": len(w) / SR}, open(f"{out}/lines_emu.json", "w"), indent=1)
print("total %.1fs" % (len(w) / SR), [round(s, 1) for s in starts])
