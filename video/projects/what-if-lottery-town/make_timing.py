"""Caption timing: transcribe the final voice with faster-whisper, then align the REAL script words to it (captions show the exact script text).
python3 -I make_timing.py <voice_town.wav> <lines_town.json> <out timing.json>"""
import sys, os, re, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shots import SHOTS
from faster_whisper import WhisperModel
voice, lines, out = sys.argv[1:4]
import subprocess, numpy as np
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", voice, "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], capture_output=True).stdout
segs, _ = WhisperModel("small.en", compute_type="int8").transcribe(np.frombuffer(raw, dtype=np.float32), word_timestamps=True, language="en")
W = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
norm = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())
script = []
for sh in SHOTS:
    for t, *_ in sh: script += t.replace("@YOUSEE:", "").split()
a = [norm(x) for x in script]; b = [norm(w[0]) for w in W]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
t0 = [None] * len(script); t1 = [None] * len(script)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and (i2 - i1) == (j2 - j1)):
        for k in range(i2 - i1): t0[i1 + k], t1[i1 + k] = W[j1 + k][1], W[j1 + k][2]
n = len(script); i = 0
while i < n:
    if t0[i] is None:
        j = i
        while j < n and t0[j] is None: j += 1
        left = t1[i - 1] if i > 0 else 0.0
        right = t0[j] if j < n else left + 0.3 * (j - i)
        for k in range(i, j):
            t0[k] = left + (right - left) * (k - i) / (j - i); t1[k] = left + (right - left) * (k - i + 1) / (j - i) - 0.02
        i = j
    else: i += 1
words = [[script[k], round(t0[k], 3), round(max(t1[k], t0[k] + 0.05), 3)] for k in range(n)]
L = json.load(open(lines))
json.dump({"starts": L["starts"], "total": L["total"], "words": words}, open(out, "w"))
print("words", n, "whisper", len(W), "unmatched blocks", sum(1 for op in sm.get_opcodes() if op[0] != "equal"), "total", round(L["total"], 1))
