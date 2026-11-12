"""Style 2 sample soundtrack (no voice): a bed that gets louder every step, a hit per step, a riser, one big boom, silence for the end card.
python3 -I make_audio.py <out.wav>"""
import sys, wave
import numpy as np
SR = 44100; rng = np.random.default_rng(3)
TITLE, STEP, END, NSTEPS = 2.6, 2.7, 2.4, 7
TOTAL = TITLE + NSTEPS * STEP + END; N = int(SR * TOTAL); t = np.arange(N) / SR
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: buf[i:j] += sig[: j - i] * g
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def hit(w):
    n = int(SR * 0.5); tt = np.arange(n) / SR; f = 38 + 90 * np.exp(-tt * 22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (0.12 + 0.1 * w)) + 0.25 * lp(rng.uniform(-1, 1, n), 6) * np.exp(-tt / 0.03)
def riser(d, up=True):
    n = int(SR * d); x = lp(rng.uniform(-1, 1, n), 30); ramp = np.linspace(0, 1, n) ** 2
    return x * (ramp if up else ramp[::-1]) * 1.3
def boom():
    n = int(SR * 2.2); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 2.2) + 28) / SR) * np.exp(-tt / 0.9) + 0.5 * lp(rng.uniform(-1, 1, n), 12) * np.exp(-tt / 0.4)) * 1.2
end0 = TITLE + NSTEPS * STEP
amp = np.clip(t / end0, 0, 1) ** 1.1
bed = (np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.4 * t) * 0.3 + 0.18 * lp(rng.uniform(-1, 1, N), 80)) * (0.08 + 0.85 * amp)
bed *= np.where(t > end0, np.clip(1 - (t - end0) / 0.8, 0, 1), 1)
sfx = np.zeros(N)
put(sfx, riser(TITLE - 0.2), 0.0, 0.18)
for i in range(NSTEPS):
    t0 = TITLE + i * STEP; w = i / (NSTEPS - 1)
    put(sfx, riser(0.5), t0 - 0.45, 0.25 + 0.4 * w); put(sfx, hit(w), t0, 0.45 + 0.5 * w)
    for q in range(2 + i): put(sfx, hit(w * 0.5)[: int(SR * 0.2)], t0 + 0.8 + q * 0.38, 0.12 + 0.08 * w)
put(sfx, boom(), TITLE + (NSTEPS - 1) * STEP + 0.05, 0.9)
x = bed + sfx; x /= max(1e-6, np.abs(x).max()) / 0.9
x *= np.minimum(1, (N - np.arange(N)) / (SR * 0.6))
pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w2: w2.setnchannels(1); w2.setsampwidth(2); w2.setframerate(SR); w2.writeframes(pcm.tobytes())
print("ok", round(TOTAL, 2))
