"""Style 4 sample voices + final mix.
Nora = Kokoro af_nicole (soft, slow), courier = Kokoro am_onyx (deep, slow) (no pitch shifting). Last line is muffled behind a door (gentle low-pass + a little reverb).
Runs make_audio.py for the music/effects, places the four lines, ducks the music under them, loudnorm to -14 LUFS.
Usage (from video/):  python -I projects/style4-sample/make_voice.py <model_dir> [ffmpeg_path]
Writes public/style4_mix.wav and projects/style4-sample/voice_*.wav (checked by transcription)."""
import sys, os, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, lfilter, fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
MODELS = sys.argv[1]; FFMPEG = sys.argv[2] if len(sys.argv) > 2 else "ffmpeg"
SR = 44100; N = SR * 10
LINES = [  # (voice, text, start seconds, muffled)
    ("af_nicole", "Two a.m.?", 0.35, False),
    ("am_onyx", "Package for you, Nora.", 3.0, False),
    ("af_nicole", "I didn't order anything.", 5.5, False),
    ("am_onyx", "It's from you.", 7.8, True),
]
tmp = os.path.join(tempfile.gettempdir(), "style4_music.wav")
subprocess.run([sys.executable, "-I", os.path.join(HERE, "make_audio.py"), tmp], check=True)
music, sr = sf.read(tmp); assert sr == SR
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(MODELS, "kokoro-v1.0.onnx"), os.path.join(MODELS, "voices-v1.0.bin"))
voice = np.zeros(N); duck = np.ones(N); rng = np.random.default_rng(5)
for i, (v, text, t0, muf) in enumerate(LINES):
    a, s = k.create(text, voice=v, speed=(0.78 if v == "af_nicole" else 0.85), lang="en-us")
    a = resample_poly(a, 147, 80) if s == 24000 else a
    a = a / max(1e-6, np.abs(a).max()) * 0.8
    if muf:
        b, aa = butter(2, 1500 / (SR / 2)); a = lfilter(b, aa, a) * 0.8
        ir = rng.standard_normal(int(SR * 0.35)) * np.exp(-np.arange(int(SR * 0.35)) / (SR * 0.09)); ir[0] = 0
        a = a + 0.25 * fftconvolve(a, ir * 0.04)[: len(a)]
    sf.write(os.path.join(HERE, f"voice_{i}.wav"), a, SR)
    j = int(t0 * SR); e = min(N, j + len(a)); voice[j:e] += a[: e - j]
    d0, d1 = max(0, j - int(0.1 * SR)), min(N, e + int(0.25 * SR)); duck[d0:d1] = 0.55
sm = int(0.08 * SR); duck = np.convolve(duck, np.ones(sm) / sm, "same")
mix = music[:N] * duck + voice
mix /= max(1e-6, np.abs(mix).max()) / 0.85
raw = os.path.join(tempfile.gettempdir(), "style4_raw.wav"); sf.write(raw, mix, SR, subtype="PCM_16")
out = os.path.join(VIDEO, "public", "style4_mix.wav")
subprocess.run([FFMPEG, "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "44100", "-ac", "1", out], check=True, capture_output=True)
print("wrote", out)
from faster_whisper import WhisperModel
from scipy.signal import resample_poly
w = WhisperModel("small.en", device="cpu", compute_type="int8")
for i, (v, text, t0, muf) in enumerate(LINES):
    a_, sr_ = sf.read(os.path.join(HERE, f"voice_{i}.wav")); segs, _ = w.transcribe(resample_poly(a_, 160, 441).astype("float32"), language="en")
    print(i, v, "| want:", text, "| heard:", " ".join(s.text.strip() for s in segs))
