"""Style 4 sample sound (no voices): rain, TV hum, tense drone, phone buzz + chime, door-cam beep, box tap, low pulse, footsteps, door creak, end stinger.
python3 -I make_audio.py <out.wav>"""
import sys, wave
import numpy as np
from scipy.signal import lfilter, butter
SR = 44100; rng = np.random.default_rng(11); TOTAL = 10.0; N = int(SR * TOTAL); T = np.arange(N) / SR
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, a_, b_): b, a = butter(2, [a_ / (SR / 2), min(0.99, b_ / (SR / 2))], "band"); return lfilter(b, a, x)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * g
def hz(m): return 440 * 2 ** ((m - 69) / 12)
mix = np.zeros(N)
# rain: filtered noise, a little louder outside (door cam 2.5-5.1) and muffled in the room
rain = hp(lp(rng.uniform(-1, 1, N), 7000), 1200) * 0.16
room = np.where((T < 2.5) | ((T > 5.1)), 0.55, 1.0); mix += rain * room
# tv hum / room tone in the living room
mix += (np.sin(2 * np.pi * 120 * T) * 0.02 + lp(rng.uniform(-1, 1, N), 300) * 0.05) * np.where(T < 2.5, 1.0, 0.0)
# drone that rises through the whole clip
d = (np.sin(2 * np.pi * 55 * T) + 0.6 * np.sin(2 * np.pi * 55.7 * T) + 0.35 * np.sin(2 * np.pi * 82.5 * T)) * (0.04 + 0.13 * (T / TOTAL) ** 1.6); mix += d
# phone buzz at 1.5-2.1 s (two bursts) and chime
for t0 in (1.5, 1.85):
    n = int(SR * 0.28); tt = np.arange(n) / SR; b = np.sign(np.sin(2 * np.pi * 170 * tt)) * 0.3 * np.sin(np.pi * tt / 0.28); put(mix, lp(b, 900), t0, 0.7)
def bell(m, d=0.9):
    n = int(SR * d); tt = np.arange(n) / SR; f = hz(m); return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.25)) * env(n, 0.002, d / 3)
put(mix, bell(84, 0.8), 1.8, 0.28); put(mix, bell(91, 0.8), 1.96, 0.24)
# door-cam beep and box tap
n = int(SR * 0.12); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 1200 * tt) * np.exp(-tt / 0.05), 2.55, 0.25)
put(mix, lp(rng.uniform(-1, 1, 2200), 600) * env(2200, 0.001, 0.03), 3.9, 0.7); put(mix, lp(rng.uniform(-1, 1, 2200), 600) * env(2200, 0.001, 0.03), 4.1, 0.55)
# low pulse (scene 3), steadily quickening
t = 5.1; step = 0.8
while t < 7.5: n = int(SR * 0.3); tt = np.arange(n) / SR; put(mix, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.1) * 0.55, t, 1.0); put(mix, np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.1) * 0.35, t + 0.18, 1.0); t += step; step = max(0.5, step - 0.07)
# footsteps in the hallway (scene 4) and a door creak
for k in range(5): put(mix, lp(rng.uniform(-1, 1, 3000), 450) * env(3000, 0.002, 0.05), 7.6 + k * 0.42, 0.55)
n = int(SR * 0.9); tt = np.arange(n) / SR; cr = bp(rng.uniform(-1, 1, n), 700, 1600) * np.sin(2 * np.pi * (3 + 6 * tt) * tt) ** 2 * 0.2 * np.sin(np.pi * tt / 0.9); put(mix, cr, 8.7, 0.8)
# stinger when the end card appears (low boom + high screech)
n = int(SR * 1.8); tt = np.arange(n) / SR; boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 2) + 28) / SR) * np.exp(-tt / 0.7) * 0.9; scr = (np.sin(2 * np.pi * np.cumsum(1800 + 700 * np.sin(tt * 7)) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(1900 + 600 * np.sin(tt * 6)) / SR)) * 0.09 * np.exp(-tt / 0.9)
put(mix, boom + scr, 8.4, 1.0)
x = mix; x /= max(1e-6, np.abs(x).max()) / 0.9; x *= np.minimum(1, T / 0.03) * np.minimum(1, (N - np.arange(N)) / (SR * 0.2))
pcm = (np.clip(np.tanh(x * 1.15) / np.tanh(1.15), -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("ok")
