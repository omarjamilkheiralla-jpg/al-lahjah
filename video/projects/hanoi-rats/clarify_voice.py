"""Voice clarity chain for TTS narration: proper upsample, harmonic 'air', presence EQ, gentle compression.
Run: python3 -I clarify_voice.py <in_24k.wav> <out_44k.wav>"""
import sys, subprocess, numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

a, sr = sf.read(sys.argv[1]); a = a.astype(np.float64)
if a.ndim > 1: a = a.mean(1)
x = resample_poly(a, 147, 80) if sr == 24000 else a          # 24 kHz -> 44.1 kHz with a real polyphase filter
SR = 44100
hp = butter(4, 3200, "high", fs=SR, output="sos"); air = butter(4, 6500, "high", fs=SR, output="sos")
band = sosfilt(hp, x)
harm = np.tanh(band * 5.0) / 5.0                                # soft saturation creates harmonics above the TTS band limit
harm = sosfilt(air, harm)
env = np.convolve(np.abs(x), np.ones(int(SR * 0.02)) / int(SR * 0.02), "same")
gate = np.clip(env / 0.03, 0, 1)                                # only add air while speaking (no hiss in pauses)
y = x + harm * 1.2 * gate
y = y / max(1e-6, np.abs(y).max()) * 0.9
sf.write(sys.argv[2] + ".tmp.wav", y.astype(np.float32), SR)
af = ("highpass=f=85,equalizer=f=250:t=q:w=1.0:g=-2,equalizer=f=3300:t=q:w=1.1:g=2,equalizer=f=8000:t=h:w=1:g=2,"
      "acompressor=threshold=-21dB:ratio=3:attack=4:release=90:makeup=2,alimiter=limit=0.92")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", sys.argv[2] + ".tmp.wav", "-af", af, sys.argv[2]], check=True)
import os; os.remove(sys.argv[2] + ".tmp.wav")
