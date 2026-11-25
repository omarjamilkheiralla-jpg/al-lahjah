"""Sound design + music + final mix for 'She Fell Two Miles Out of the Sky' (voice stays dry, ta-ding at the end).
Usage (from video/): python -I projects/koepcke-fall/make_mix.py   -> public/juliane_mix.wav"""
import os, json, re, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import butter, lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); VIDEO = os.path.abspath(os.path.join(HERE, "..", ".."))
FF = os.path.join(VIDEO, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe")
TIM = json.load(open(os.path.join(HERE, "timing.json"))); SEN = TIM["sentences"]
voice, SR = sf.read(os.path.join(HERE, "narration.wav"))
TOTAL = TIM["total"] + 1.6; N = int(TOTAL * SR); voice = np.pad(voice, (0, N - len(voice))); T = np.arange(N) / SR
rng = np.random.default_rng(7)
def norm(w): return re.sub(r"[^a-z0-9']", "", w.lower())
def W(line, word):
    for x in SEN[line]["words"]:
        if norm(x["w"]).startswith(word): return x["t0"]
    return SEN[line]["start"]
def L(i): return SEN[i]["start"] - 0.1
def E(i): return SEN[i]["end"]
def lp(x, fc): b, a = butter(2, min(0.99, fc / (SR / 2))); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, a_, b_): b, a = butter(2, [a_ / (SR / 2), min(0.99, b_ / (SR / 2))], "band"); return lfilter(b, a, x)
def noise(n): return rng.standard_normal(n)
def env(n, a=0.004, d=0.2): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    if i < 0: sig = sig[-i:]; i = 0
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * g
def win(a, b, fade=0.4):
    """0..1 window over [a, b] with fades"""
    return np.clip((T - a) / fade, 0, 1) * np.clip((b - T) / fade, 0, 1)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

amb = np.zeros(N); fx = np.zeros(N); mus = np.zeros(N)
# ---------------------------------------------------------------- ambience beds
def jungle_bed(n, seed):
    r = np.random.default_rng(seed); x = bp(r.standard_normal(n), 2500, 7000) * 0.05      # insect hiss
    tt = np.arange(n) / SR
    x += np.sin(2 * np.pi * 4200 * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * tt)) * 0.012   # cicada pulse
    for k in range(int(n / SR * 0.9)):                                                         # bird calls
        t0 = r.uniform(0, n / SR - 1); f0 = r.uniform(1400, 3200); m = int(SR * r.uniform(0.12, 0.35)); u = np.arange(m) / SR
        call = np.sin(2 * np.pi * np.cumsum(f0 + 600 * np.sin(2 * np.pi * r.uniform(6, 14) * u)) / SR) * np.sin(np.pi * u / u[-1]) ** 2
        for rep in range(r.integers(1, 4)): put(x, call * r.uniform(0.02, 0.05), t0 + rep * r.uniform(0.18, 0.3))
    return x
jb = jungle_bed(N, 3)
wind = lp(noise(N), 500); rain = hp(noise(N), 1500) * 0.6; drone = np.zeros(N)
for h, g in ((1, 1.0), (2, 0.5), (3, 0.3), (4, 0.18)): drone += np.sin(2 * np.pi * 92 * h * T + h) * g
drone = drone * 0.05 + lp(noise(N), 300) * 0.06
t_fly = W(3, "fly") - 0.1
amb += wind * 0.5 * win(-1, L(1) + 1.5, 1.2) * (0.6 + 0.4 * np.clip(T / 8, 0, 1))          # falling wind
amb += wind * 0.25 * win(L(5), E(6) - 0.2, 0.3)                                               # break-up wind
amb += jb * 1.0 * (win(L(1) + 0.5, L(3) + 0.1, 1.0) + win(L(7) + 0.2, TOTAL + 1, 1.2))         # jungle
amb += lp(noise(N), 900) * 0.02 * win(L(3), t_fly, 0.3)                                        # airport murmur
amb += drone * (0.5 * win(L(3), t_fly, 0.3) + 1.0 * win(t_fly, L(4), 0.3))                      # engines outside
amb += lp(drone, 400) * 1.2 * win(L(4), E(6) - 0.4, 0.3)                                       # engines inside, muffled
amb += rain * 0.06 * win(L(4), E(6) - 0.4, 0.4)                                                # rain on the fuselage
amb += hp(noise(N), 3000) * 0.03 * win(L(17), L(19), 0.6)                                      # drizzle, day nine
# ---------------------------------------------------------------- effects
def thunder(t0, g=0.8, d=2.6): n = int(SR * d); tt = np.arange(n) / SR; x = lp(noise(n), 160) * np.exp(-tt / (d / 3)) * np.minimum(1, tt / 0.08); put(fx, x / np.abs(x).max(), t0, g)
def crack(t0, g=0.8): n = int(SR * 0.5); tt = np.arange(n) / SR; x = hp(noise(n), 800) * np.exp(-tt / 0.06) + lp(noise(n), 300) * np.exp(-tt / 0.25); put(fx, x / np.abs(x).max(), t0, g)
def whoosh(t0, d=0.7, g=0.35): n = int(SR * d); tt = np.arange(n) / SR; x = bp(noise(n), 300, 5000) * np.sin(np.pi * tt / d) ** 2; put(fx, x / np.abs(x).max(), t0, g)
def rip(t0, g=0.7): n = int(SR * 1.4); tt = np.arange(n) / SR; x = bp(noise(n), 200, 3000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 37 * tt))) * np.exp(-tt / 0.5) + lp(noise(n), 120) * np.exp(-tt / 0.6); put(fx, x / np.abs(x).max(), t0, g)
def splash(t0, g=0.3): n = int(SR * 0.4); tt = np.arange(n) / SR; x = bp(noise(n), 400, 4000) * np.exp(-tt / 0.09) * np.minimum(1, tt / 0.01); put(fx, x / np.abs(x).max(), t0, g)
def step(t0, g=0.25, wood=False): n = int(SR * 0.12); tt = np.arange(n) / SR; x = (lp(noise(n), 1200 if not wood else 500) + (np.sin(2 * np.pi * 140 * tt) * 0.8 if wood else 0)) * np.exp(-tt / 0.03); put(fx, x / np.abs(x).max(), t0, g)
def tick(t0, g=0.25): n = int(SR * 0.05); tt = np.arange(n) / SR; put(fx, hp(noise(n), 2500) * np.exp(-tt / 0.008), t0, g)
def glug(t0, d=1.6, g=0.35):
    n = int(SR * d); tt = np.arange(n) / SR; x = np.zeros(n)
    for k in np.arange(0, d - 0.15, 0.13): m = int(SR * 0.12); u = np.arange(m) / SR; put(x, np.sin(2 * np.pi * (260 + 300 * u / 0.12) * u) * np.exp(-u / 0.04), k)
    put(fx, x + bp(noise(n), 800, 3000) * 0.15 * np.sin(np.pi * tt / d), t0, g)
def flyby(t0, d=3.0, g=0.5):
    n = int(SR * d); tt = np.arange(n) / SR; f = 110 * (1.12 - 0.24 * tt / d); x = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in (1, 2, 3)) + lp(noise(n), 500) * 0.5
    put(fx, x * np.sin(np.pi * tt / d) ** 2 / 2, t0, g)
def motor(a, b, g=0.25):
    n = int(SR * (b - a)); tt = np.arange(n) / SR; x = np.sign(np.sin(2 * np.pi * 42 * tt)) * 0.3 + lp(noise(n), 400) * 0.6; put(fx, lp(x, 900) * np.clip(tt / 0.3, 0, 1) * np.clip((b - a - tt) / 0.3, 0, 1), a, g)
def chime(t0, m, g=0.3, d=1.8): n = int(SR * d); tt = np.arange(n) / SR; f = hz(m); put(fx, (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3)) * env(n, 0.003, d / 3), t0, g)

whoosh(L(1) - 0.2, 0.9, 0.4); thunder(1.5, 0.5); thunder(5.5, 0.4)
thunder(L(4) + 1.2, 0.6); thunder(L(4) + 2.9, 0.5)
tl = W(5, "lightning"); tb = W(5, "broke"); crack(tl, 0.9); thunder(tl + 0.15, 0.9, 3.0); rip(tb, 0.8); crack(tb + 0.1, 0.5)
thunder(L(6) + 1.4, 0.5); thunder(L(6) + 3.6, 0.45); crack(L(6) + 5.2, 0.4)
for k in range(5): step(L(3) + 0.4 + k * 0.45, 0.15)                                               # airport footsteps
for k in range(5): step(L(9) + 0.2 + k * 0.6, 0.18)                                                # wandering the wreck
for k in range(7): step(L(13) + 0.3 + k * 0.5, 0.18)                                               # walking the stream
for k in range(9): splash(L(14) + 0.3 + k * 0.55, 0.22 + 0.1 * (k % 2))                            # wading
flyby(L(15) - 0.1, 3.0, 0.55); flyby(W(15, "they") - 0.2, 3.0, 0.35)
for k in range(6): step(L(17) + 0.3 + k * 0.8, 0.14)                                               # weak steps
glug(W(19, "pours") - 0.2, 1.8, 0.4)
t0, t1 = W(20, "thirty"), W(20, "counts") + 0.9
for k in range(30): tick(t0 + (t1 - t0) * (k + 0.5) / 30, 0.18)
for k in range(10): step(L(24) + 0.2 + k * 0.42, 0.22, wood=True)                                  # loggers on the floorboards
motor(L(26) - 0.1, W(26, "and") - 0.1, 0.3); flyby(W(26, "and") - 0.3, 2.4, 0.3)
for tt in [L(i) for i in (1, 3, 5, 7, 11, 14, 17, 21, 24, 27)]: whoosh(tt - 0.25, 0.55, 0.18)
# ---------------------------------------------------------------- music: slow, emotional pads + sparse piano
def pad(a, b, notes, g=0.12):
    n = int(SR * (b - a)); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes:
        f = hz(m)
        for det in (-0.12, 0.0, 0.11): x += np.sign(np.sin(2 * np.pi * f * (1 + det / 100) * tt)) * 0.25 + np.sin(2 * np.pi * f * tt) * 0.4
    x = lp(x, 1100) * np.clip(tt / 1.2, 0, 1) * np.clip((b - a - tt) / 1.2, 0, 1); put(mus, x / max(1e-6, np.abs(x).max()), a, g)
def piano(t0, m, g=0.16, d=2.2):
    n = int(SR * d); tt = np.arange(n) / SR; f = hz(m); x = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) * np.exp(-tt / 0.4) + 0.12 * np.sin(6 * np.pi * f * tt) * np.exp(-tt / 0.2)) * env(n, 0.004, d / 3.5); put(mus, x, t0, g)
# chord plan (D minor -> F -> Bb -> A ...), each section its own mood
plan = [(0, L(3), [50, 57, 62, 65], 0.10), (L(3), L(4), [53, 60, 65, 69], 0.08), (L(4), E(6), [46, 53, 58, 62], 0.12),
        (L(7) + 0.4, L(10), [50, 57, 62, 65], 0.09), (L(10), L(14), [53, 60, 65, 72], 0.10), (L(14), L(17), [48, 55, 60, 64], 0.08),
        (L(17), L(18), [46, 53, 58, 65], 0.09), (L(18), L(21), [53, 60, 65, 69], 0.10), (L(21), L(24), [50, 57, 62, 65], 0.11),
        (L(24), L(27), [55, 62, 67, 71], 0.09), (L(27), TOTAL, [50, 57, 62, 66], 0.12)]
for a, b, ch, g in plan: pad(a, b + 0.6, ch, g)
mel = [74, 72, 69, 67, 69, 65, 64, 62]
for k, tt in enumerate(np.arange(L(7) + 1.0, L(14), 1.6)): piano(tt, mel[k % len(mel)], 0.12)
for k, tt in enumerate(np.arange(L(18) + 0.5, L(21), 1.2)): piano(tt, [72, 74, 77, 76, 74, 72][k % 6], 0.12)
for k, tt in enumerate(np.arange(L(27), TIM["total"], 1.1)): piano(tt, [74, 78, 81, 79, 78, 74, 76][k % 7], 0.14)
mus *= 1 - win(E(6) - 0.2, L(7) + 0.3, 0.3)                                                      # silence after "It's all over"
# ---------------------------------------------------------------- ta-ding
ta = np.zeros(N); end = TIM["total"]
n = int(SR * 0.4); tt = np.arange(n) / SR; put(ta, np.sin(2 * np.pi * hz(79) * tt) * env(n, 0.002, 0.08), end + 0.12, 0.5)
for k, m in enumerate((86, 91, 95)): chime(end + 0.36 + k * 0.05, m, 0.0, 2.0); n2 = int(SR * 2.0); u = np.arange(n2) / SR; put(ta, (np.sin(2 * np.pi * hz(m) * u) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.76 * u) * np.exp(-u / 0.3)) * env(n2, 0.003, 0.7), end + 0.36 + k * 0.05, 0.35)
# ---------------------------------------------------------------- mix
duck = np.ones(N)
for s in SEN: duck[max(0, int((s["start"] - 0.1) * SR)): int((s["end"] + 0.2) * SR)] = 0.4
k = int(0.12 * SR); duck = np.convolve(duck, np.ones(k) / k, "same")
bed = (amb * 0.9 + mus * 1.0) * duck + fx * 0.8 + ta * 0.7
bed = bed / max(1e-6, np.abs(bed).max()) * 0.42
out = bed + voice * 1.0
out /= max(1e-6, np.abs(out).max()) / 0.9; out *= np.minimum(1, T / 0.02) * np.minimum(1, (N - np.arange(N)) / (SR * 0.4))
raw = os.path.join(tempfile.gettempdir(), "juliane_raw.wav"); sf.write(raw, out, SR, subtype="PCM_16")
dst = os.path.join(VIDEO, "public", "juliane_mix.wav")
r = subprocess.run([FF, "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "44100", "-ac", "2", dst], capture_output=True)
if r.returncode != 0: print("loudnorm failed, writing raw mix"); sf.write(dst, np.stack([out, out], 1), SR, subtype="PCM_16")
print("ok", round(N / SR, 1), "s ->", dst)
