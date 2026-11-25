"""Narration for 'She Fell Two Miles Out of the Sky' (Style 1, true story).
Voice: ElevenLabs 'Will' on Eleven v3, one request per line (emotion tags per line), pauses added between lines.
"You see," is its own beat: found by transcription inside its sentence, a 0.42 s pause is inserted after "see".
Writes projects/koepcke-fall/narration.wav and timing.json (script words with times, for captions + shots).
Usage (from video/): python -I projects/koepcke-fall/make_voice.py [redo line numbers, e.g. 5 12]
Needs the ELEVENLABS_API_KEY environment variable. Already generated lines are reused (saves credits)."""
import os, sys, json, re, subprocess, urllib.request, difflib
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
FF = os.path.join(VIDEO, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe")
KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE = "bIHbv24MWmeRgasZH58o"      # Will
SR = 44100
# (text with v3 tags, pause after in seconds). Tags are spoken as tone, never as words.
LINES = [
    ("[serious] On Christmas Eve, nineteen seventy-one, a seventeen-year-old girl fell two miles out of the sky, still buckled into her seat.", 0.55),
    ("She landed in the middle of the Amazon rainforest.", 0.35),
    ("[softly] Alone.", 1.0),
    ("That morning, Juliane and her mom got on a plane in Lima, Peru, to fly over the jungle and spend Christmas with her dad.", 0.45),
    ("Half an hour in, they flew straight into a storm.", 0.4),
    ("[tense] Lightning hit the wing, and the plane broke apart in the air.", 0.65),
    ("[sad] The last thing she heard was her mom saying, \"That's the end. It's all over.\"", 1.1),
    ("[quietly] Juliane wakes up on the jungle floor, still strapped to her row of seats.", 0.45),
    ("Her collarbone is broken, one eye is swollen shut, and she has lost her glasses and one shoe.", 0.45),
    ("[sad] Her mom is gone. All she can find is a small bag of candy.", 1.0),
    ("But Juliane knows something most people don't.", 0.4),
    ("Her parents were scientists who studied this exact jungle, and her dad taught her one rule.", 0.45),
    ("[warmly] \"If you're ever lost, find water. Small streams lead to bigger rivers, and rivers lead to people.\"", 0.55),
    ("[determined] She finds a tiny stream, and she starts walking.", 1.0),
    ("She wades down the river, poking the water with a stick to scare away stingrays.", 0.45),
    ("Rescue planes fly right over her head. [frustrated] They can't see her through the trees.", 0.5),
    ("[quietly] The candy runs out.", 1.0),
    ("A cut on her arm is now full of maggots, and she can barely stand.", 0.5),
    ("[hopeful] Then, on the riverbank, she sees a boat, and a path, and a little wooden hut.", 0.45),
    ("Inside, she finds a can of gasoline, and she pours it on her arm.", 0.45),
    ("Thirty maggots crawl out. [deadpan] She counts them.", 1.0),
    ("You see, the safest thing she could have done looked like staying at the crash.", 0.4),
    ("But under trees that thick, nobody would ever have found her.", 0.4),
    ("One sentence from her dad got her moving.", 1.0),
    ("The next day, three loggers walk into the hut and find a girl covered in mud and cuts.", 0.45),
    ("[lightly] She explains, very politely, that she fell out of a plane.", 0.5),
    ("They take her down the river, and she is flown to her dad.", 1.0),
    ("Juliane was the only survivor out of ninety-two people on board.", 0.55),
    ("Today, she is a biologist, and she runs her parents' research station.", 0.45),
    ("[softly] In the same jungle.", 0.0),
]
YOUSEE = 21
LEAD = 0.35   # silence at the very start

def clean(t): return re.sub(r"\[[^\]]*\]\s*", "", t).strip()
def norm(w): return re.sub(r"[^a-z0-9']", "", w.lower().replace("-", ""))

def tts(text, out_mp3, seed):
    body = json.dumps({"text": text, "model_id": "eleven_v3", "seed": seed, "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", data=body, method="POST",
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    with urllib.request.urlopen(req, timeout=180) as r: open(out_mp3, "wb").write(r.read())

def load(mp3):
    wav = mp3[:-4] + ".wav"
    if not os.path.exists(wav) or os.path.getmtime(wav) < os.path.getmtime(mp3):
        subprocess.run([FF, "-v", "error", "-y", "-i", mp3, "-ac", "1", "-ar", str(SR), wav], capture_output=True, check=True)
    a, _ = sf.read(wav); a = a.astype(np.float64)
    # trim leading/trailing silence (keep 30 ms)
    env = np.convolve(np.abs(a), np.ones(441) / 441, "same"); thr = 0.02 * env.max(); idx = np.where(env > thr)[0]
    i0 = max(0, idx[0] - int(0.03 * SR)); i1 = min(len(a), idx[-1] + int(0.06 * SR)); a = a[i0:i1]
    f = int(0.012 * SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f); return a

def main():
    redo = {int(x) for x in sys.argv[1:]}
    raw_dir = os.path.join(HERE, "voice_raw"); os.makedirs(raw_dir, exist_ok=True)
    for i, (txt, _) in enumerate(LINES):
        p = os.path.join(raw_dir, f"line_{i:02d}.mp3")
        if i in redo or not os.path.exists(p):
            if not KEY: sys.exit("ELEVENLABS_API_KEY is not set")
            tts(txt, p, 1000 + i + (100 * (i in redo))); print("tts", i, flush=True)
    from faster_whisper import WhisperModel
    from scipy.signal import resample_poly
    wh = WhisperModel("small.en", device="cpu", compute_type="int8")
    def words_of(a):
        segs, _ = wh.transcribe(resample_poly(a, 160, 441).astype(np.float32), language="en", word_timestamps=True)
        return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    out = [np.zeros(int(LEAD * SR))]; cur = LEAD; timing = []; heard_all = []
    for i, (txt, gap) in enumerate(LINES):
        a = load(os.path.join(raw_dir, f"line_{i:02d}.mp3")); hw = words_of(a)
        see = None
        if i == YOUSEE:
            # "You see," beat: cut after "see" at the quietest point within 0.25 s, insert a 0.42 s pause
            ws = [w for w in hw if norm(w[0]) == "see"]
            assert len(hw) >= 2 and norm(hw[0][0]) == "you" and ws, f"You see check failed: {hw[:3]}"
            e = ws[0][2]; lo, hi = int((e - 0.05) * SR), int(min(len(a) / SR, e + 0.25) * SR)
            env = np.convolve(np.abs(a), np.ones(220) / 220, "same"); cut = lo + int(np.argmin(env[lo:hi]))
            f = int(0.025 * SR); A, Bq = a[:cut].copy(), a[cut:].copy(); A[-f:] *= np.linspace(1, 0, f); Bq[:f] *= np.linspace(0, 1, f)
            a = np.concatenate([A, np.zeros(int(0.42 * SR)), Bq]); shift_at, shift = cut / SR, 0.42
            hw = [(w, s + (shift if s >= shift_at else 0), e_ + (shift if s >= shift_at else 0)) for w, s, e_ in hw]
            see = {"t0": round(cur, 3), "cut": round(cur + cut / SR, 3), "first_half": round(cut / SR, 3)}
            print("YOU SEE first half", round(cut / SR, 2), "s", flush=True)
        # align script words to heard words
        sw = clean(txt).split(); sn = [norm(w) for w in sw]; hn = [norm(w[0]) for w in hw]
        sm = difflib.SequenceMatcher(a=sn, b=hn, autojunk=False); times = [None] * len(sw)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size): times[blk.a + k] = (hw[blk.b + k][1], hw[blk.b + k][2])
        dur = len(a) / SR
        known = [k for k, t in enumerate(times) if t]
        for k in range(len(sw)):
            if times[k]: continue
            prv = max([j for j in known if j < k], default=None); nxt = min([j for j in known if j > k], default=None)
            t0 = times[prv][1] if prv is not None else 0.0; t1 = times[nxt][0] if nxt is not None else dur
            n = (nxt if nxt is not None else len(sw)) - (prv if prv is not None else -1) - 1; pos = k - (prv if prv is not None else -1) - 1
            times[k] = (t0 + (t1 - t0) * pos / n, t0 + (t1 - t0) * (pos + 1) / n)
        words = [{"w": w, "t0": round(cur + t[0], 3), "t1": round(cur + t[1], 3)} for w, t in zip(sw, times)]
        timing.append({"i": i, "text": clean(txt), "start": round(cur, 3), "end": round(cur + dur, 3), "words": words, "see": see})
        heard_all.append(" ".join(w[0] for w in hw)); print(i, round(cur, 2), "->", round(cur + dur, 2), "|", heard_all[-1], flush=True)
        out.append(a); out.append(np.zeros(int(gap * SR))); cur += dur + gap
    voice = np.concatenate(out); voice = voice / np.abs(voice).max() * 0.89
    sf.write(os.path.join(HERE, "narration.wav"), voice, SR)
    total = round(len(voice) / SR, 3)
    json.dump({"total": total, "sentences": timing}, open(os.path.join(HERE, "timing.json"), "w"), indent=1)
    print("total", total)

if __name__ == "__main__": main()
