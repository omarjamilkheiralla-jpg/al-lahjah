"""Soundtrack for "The Computer in the Shipwreck" (Antikythera): voice + an original, section-by-section playful score + sound effects.
Run: python3 -I make_audio_full.py <voice_full.wav> <timing.json> <out_dir>"""
import sys, json, wave, math
import numpy as np

SR = 44100
rng = np.random.default_rng(11)
timing = json.load(open(sys.argv[2]))
TOTAL = timing["total"] + 1.5
N = int(SR * TOTAL)
END = timing["words"][-1][2]            # end of the last spoken word: the "ta-ding" lands right after it
starts = [0.0] + [s - 0.1 for s in timing["starts"][1:]]
ends = starts[1:] + [TOTAL]


def put(buf, sig, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf) or i < 0: return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * g


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)


def lp(x, k):
    return np.convolve(x, np.ones(k) / k, "same")


def pluck(f, dur=0.5, dec=0.995):
    n = int(SR * dur); p = max(2, int(SR / f)); b = rng.uniform(-1, 1, p); o = np.zeros(n)
    for i in range(n):
        o[i] = b[i % p]; b[i % p] = dec * 0.5 * (b[i % p] + b[(i + 1) % p])
    return o * env(n, 0.001, dur * 0.5)


def marimba(f, dur=0.5):
    n = int(SR * dur); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.04) + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.02)
    return s * env(n, 0.001, 0.14)


def musicbox(f, dur=1.2):
    n = int(SR * dur); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.3) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.12)
    return s * env(n, 0.002, 0.45)


def bass(f, dur=0.35):
    n = int(SR * dur); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2 * t)) * env(n, 0.004, 0.12)


def pad(f, dur=2.0, vol=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * m * t + k) * (0.6 / m) for k, m in enumerate([1, 2, 3, 4]))
    s += 0.5 * np.sin(2 * np.pi * f * 1.005 * t)
    a = np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.6)
    return s * a * vol


def brass(f, dur=0.6):
    n = int(SR * dur); t = np.arange(n) / SR
    saw = 2 * ((f * t) % 1) - 1
    s = lp(saw, 14) * 1.4
    return s * np.minimum(1, t / 0.04) * np.exp(-t / (dur * 0.9))


def kick():
    n = int(SR * 0.2); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 26) + 45) / SR) * np.exp(-t / 0.07)


def snap():
    n = int(SR * 0.05); x = np.convolve(rng.uniform(-1, 1, n), [1, -0.9], "same"); return x * env(n, 0.0008, 0.012)


def shaker():
    n = int(SR * 0.07); x = rng.uniform(-1, 1, n); x = x - np.concatenate([[0], x[:-1]]); return x * env(n, 0.003, 0.025)


def clap():
    n = int(SR * 0.16); x = lp(rng.uniform(-1, 1, n), 4)
    e = np.exp(-np.arange(n) / SR / 0.04) * (1 + 0.8 * (np.sin(np.arange(n) / SR * 180) > 0.4)); return x * e * 0.8


def click():
    n = int(SR * 0.03); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1900 * t) * 0.5 + rng.uniform(-1, 1, n) * 0.5) * env(n, 0.0005, 0.006)


def whoosh(d=0.45, up=False):
    n = int(SR * d); x = lp(rng.uniform(-1, 1, n), 50); t = np.linspace(0, 1, n)
    return x * (np.sin(np.pi * t) ** 2) * (1.3 if not up else 1.0)


def creak(d=0.8):
    n = int(SR * d); t = np.arange(n) / SR; f = 170 + 70 * np.sin(2 * np.pi * 5 * t) + 110 * t
    return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.2) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5


def boing():
    n = int(SR * 0.45); t = np.arange(n) / SR; f = 420 + 260 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.15) + 120 * np.exp(-t / 0.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)


def snore():
    n = int(SR * 0.6); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 95 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t)) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * 0.6


def bubble():
    n = int(SR * 0.22); t = np.arange(n) / SR; f = 300 + 900 * t / 0.22
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) * 0.6


def ding(f=1320, d=1.2):
    n = int(SR * d); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.4 * t)) * env(n, 0.001, 0.5)


def wah():  # comic "mwah-mwah" for the but-beat
    n = int(SR * 0.9); t = np.arange(n) / SR; f = 220 * (1 - 0.18 * (t > 0.45)) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    wob = 0.5 + 0.5 * np.sin(2 * np.pi * 3.2 * t - 1)
    return lp(saw, 12) * wob * np.minimum(1, t / 0.03) * np.exp(-t / 0.7)


def crowd(d=1.4):
    n = int(SR * d); x = lp(rng.uniform(-1, 1, n), 9) + 0.6 * lp(rng.uniform(-1, 1, n), 25)
    t = np.linspace(0, 1, n); return x * (np.minimum(1, t * 6) * np.minimum(1, (1 - t) * 4)) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t))


def note(m): return 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------- music (sections follow the story)
music = np.zeros(N)
BPM = 112; beat = 60 / BPM; e8 = beat / 2
CH = {"C": (48, [60, 64, 67]), "Am": (45, [57, 60, 64]), "F": (41, [57, 60, 65]), "G": (43, [55, 59, 62]), "Dm": (50, [57, 62, 65]), "Em": (52, [59, 64, 67]), "Bb": (46, [58, 62, 65]), "E": (40, [56, 59, 64])}
MEL = [72, None, 76, 74, None, 72, 67, None, 69, 72, None, 71, 67, None, 69, 71]
SECTIONS = [
    (0, "sneak", ["Am", "E", "Am", "E"]), (1, "play", ["C", "Am", "F", "G"]), (2, "lull", ["F", "C", "G", "C"]), (3, "tense", ["Am", "E"]),
    (4, "build", ["C", "G", "Am", "F"]), (5, "tense", ["Dm", "E"]), (6, "curious", ["Dm", "G", "C", "Am"]), (7, "triumph", ["C", "F", "G", "C"]),
    (8, "lull", ["F", "C", "G", "C"]), (9, "sparse", ["Am", "F"]), (10, "resolve", ["F", "G", "C", "C"]),
]
t = 0.0; step = 0
while t < TOTAL - 0.05:
    si = max(i for i in range(len(starts)) if starts[i] <= t + 1e-6)
    mode, loop = SECTIONS[si][1], SECTIONS[si][2]
    ls = t - starts[si]
    bar = int(ls / (beat * 4)) % len(loop)
    root, tri = CH[loop[bar]]
    pos = int(round((ls % (beat * 4)) / e8)) % 8
    g = 1.0
    if mode == "play":
        if pos in (0, 4): put(music, bass(note(root)), t, 0.55); put(music, kick(), t, 0.34)
        if pos % 2 == 1:
            for m in tri: put(music, pluck(note(m), 0.32, 0.99), t, 0.15)
        mm = MEL[step % 16]
        if mm: put(music, marimba(note(mm)), t, 0.40)
        if pos in (2, 6): put(music, snap(), t, 0.45)
        put(music, shaker(), t, 0.07)
    elif mode == "sparse":
        if pos == 0: put(music, pad(note(root), beat * 4, 0.10), t, 1.0); put(music, bass(note(root), 0.5), t, 0.4)
        if pos in (3, 6): put(music, pluck(note(tri[(pos) % 3] + 12), 0.5, 0.995), t, 0.16)
    elif mode == "curious":
        if pos in (0, 4): put(music, bass(note(root)), t, 0.5)
        if pos % 2 == 1: put(music, pluck(note(tri[(pos // 2) % 3] + 12), 0.3, 0.99), t, 0.17)
        if pos in (2, 6): put(music, marimba(note(tri[(pos // 2) % 3] + 24), 0.3), t, 0.22)
        put(music, shaker(), t, 0.06)
    elif mode == "comic":
        if pos == 0: put(music, bass(note(root), 0.5), t, 0.55)
        if pos in (2, 3): put(music, pluck(note(tri[0] + 12), 0.25, 0.99), t, 0.2)
        if pos in (5, 7): put(music, marimba(note(tri[2] + 12), 0.25), t, 0.3)
    elif mode == "sneak":
        if pos in (0, 4): put(music, bass(note(root - 12), 0.4), t, 0.5)
        if pos in (1, 3, 5, 7): put(music, pluck(note(tri[(pos // 2) % 3] + 12), 0.2, 0.985), t, 0.22)
        if pos in (2, 6): put(music, snap(), t, 0.35)
        if pos == 0 and ls < 0.1: put(music, shaker(), t, 0.08)
    elif mode == "tense":
        if pos == 0: put(music, pad(note(root), beat * 4, 0.09), t, 1.0)
        if pos in (0, 4): put(music, bass(note(root - 12), 0.4), t, 0.5)
        if pos in (3, 7): put(music, pluck(note(tri[0] + 12), 0.25, 0.99), t, 0.12)
        if pos in (0, 4): put(music, click(), t, 0.1)
    elif mode == "build":
        if pos in (0, 4): put(music, bass(note(root)), t, 0.55); put(music, kick(), t, 0.4)
        if pos in (2, 6): put(music, clap(), t, 0.35)
        put(music, marimba(note(tri[(step) % 3] + 12 + (12 if ls > 1.5 else 0)), 0.2), t, 0.32)
        put(music, shaker(), t, 0.1)
    elif mode == "lull":
        if pos in (0, 4): put(music, musicbox(note(tri[(pos // 4) % 3] + 12)), t, 0.32)
        if pos in (2, 6): put(music, musicbox(note(tri[(pos // 2 + 1) % 3] + 24), 0.8), t, 0.2)
        if pos == 0: put(music, pad(note(root), beat * 4, 0.08), t, 1.0)
    elif mode == "triumph":
        if pos in (0, 4): put(music, bass(note(root)), t, 0.6); put(music, kick(), t, 0.4)
        if pos in (2, 6): put(music, clap(), t, 0.4)
        if pos in (0, 3, 6): put(music, brass(note(tri[(pos // 3) % 3] + 12), 0.45), t, 0.2)
        mm = MEL[(step * 2) % 16]
        if mm: put(music, marimba(note(mm + 12), 0.3), t, 0.3)
        put(music, shaker(), t, 0.09)
    elif mode == "resolve":
        if pos in (0, 4): put(music, bass(note(root)), t, 0.5)
        if pos % 2 == 1:
            for m in tri: put(music, pluck(note(m), 0.35, 0.99), t, 0.14)
        mm = MEL[step % 16]
        if mm and ls < ends[si] - starts[si] - 1.3: put(music, marimba(note(mm)), t, 0.36)
        if pos in (2, 6): put(music, snap(), t, 0.4)
    t += e8; step += 1
# a big final chord on the last line
put(music, pad(note(48), 2.6, 0.2), END + 0.25, 1.0)
put(music, marimba(note(79), 0.35), END + 0.12, 0.34)                                 # "ta"
for k, m in enumerate([84, 88, 91, 96]): put(music, marimba(note(m), 0.9), END + 0.36 + k * 0.07, 0.3)   # "-ding" sparkle
put(music, bass(note(36), 1.2), END + 0.36, 0.7)
music *= np.minimum(1, np.arange(N) / (SR * 0.2)) * np.minimum(1, (N - np.arange(N)) / (SR * 0.5))
music /= max(1e-6, np.abs(music).max())

# ------------------------------------------------------------------- sound effects
def tword(prefix, after=0.0):
    for w in timing["words"]:
        if w[1] >= after and w[0].lower().strip(".,!?").startswith(prefix): return w[1]
    return None
def hum(d=2.4, f=110):
    n = int(SR * d); t = np.arange(n) / SR; env2 = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.01 * t) + 0.25 * np.sin(2 * np.pi * f * 3.02 * t)) * env2 * 0.5
def beep(f=1320):
    n = int(SR * 0.12); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env(n, 0.002, 0.05) * 0.6
def splash():
    n = int(SR * 0.8); x = lp(rng.uniform(-1, 1, n), 14); t = np.linspace(0, 1, n); return x * np.exp(-t * 5) * 1.4
def gearclick():
    n = int(SR * 0.06); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 900 * t) * 0.5 + np.convolve(rng.uniform(-1, 1, n), [1, -0.9], "same") * 0.6) * env(n, 0.0005, 0.012)
def tick():
    n = int(SR * 0.04); t = np.arange(n) / SR; return np.sin(2 * np.pi * 2100 * t) * env(n, 0.0004, 0.008)
def crackle(d=2.0):
    n = int(SR * d); x = np.zeros(n)
    for _ in range(int(d * 14)): i = int(rng.uniform(0, n - 400)); x[i:i + 300] += rng.uniform(-1, 1, 300) * np.exp(-np.arange(300) / 60) * rng.uniform(0.2, 0.7)
    return x
def drone(d=2.0, f=70):
    n = int(SR * d); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * 0.6
sfx = np.zeros(N)
for i in range(1, 11): put(sfx, whoosh(0.4), starts[i] - 0.18, 0.45)
# 0: splash, bubbles, a bright chime on "computer" and a held low note on "Two thousand years old"
put(sfx, splash(), 0.05, 0.4)
for q in range(14): put(sfx, bubble(), 0.3 + q * 0.33 + rng.uniform(0, 0.1), 0.22)
tw = tword("computer");  put(sfx, ding(1568, 1.4), tw + 0.1 if tw else 3.0, 0.3) if tw else None
put(sfx, drone(2.2, 82), (tword("two") or 4.0), 0.3)
# 1: harbour: gull-like chirps and a cheerful clink for the treasure, a "huh" for the junk
for q in range(3): put(sfx, ding(2093 + q * 200, 0.4), starts[1] + 1.6 + q * 0.25, 0.14)
put(sfx, wah(), (tword("junk") or starts[1] + 7.0) - 0.15, 0.22)
# 2: museum: a fast clock ticking while years pass
for q in range(int(7 / 0.12)): put(sfx, tick(), starts[2] + 0.4 + q * 0.12, 0.2)
put(sfx, creak(0.9), starts[2] + 1.0, 0.18)
# 3: scanner hum, beeps, a sparkle on "gears"
put(sfx, hum(3.4, 110), starts[3] + 0.5, 0.4)
for q in range(5): put(sfx, beep(1320 + (q % 2) * 220), starts[3] + 1.2 + q * 0.4, 0.2)
tw = tword("gears", starts[3]); put(sfx, ding(1760, 1.4), tw, 0.3) if tw else None
# 4: gears click and mesh
for q in range(22): put(sfx, gearclick(), starts[4] + 0.4 + q * 0.17 + rng.uniform(0, 0.03), 0.28)
put(sfx, ding(1319, 1.2), starts[4] + 4.1, 0.25)
# 5: "impossible": a low rumble, then a whoosh along the timeline
tw = tword("impossible", starts[5]); put(sfx, drone(1.8, 65), (tw - 0.1) if tw else starts[5] + 0.4, 0.3)
put(sfx, whoosh(1.0), starts[5] + 3.6, 0.35)
# 6: "You see": one deep tick, a magic shimmer as the writing glows, crank ratchet
put(sfx, tick(), starts[6] + 0.05, 0.4)
tw = tword("hidden", starts[6]); [put(sfx, ding(1760 + k * 440, 1.0), (tw if tw else starts[6] + 1.5) + k * 0.12, 0.2) for k in range(3)]
for q in range(16): put(sfx, click(), starts[6] + 5.4 + q * 0.24, 0.3)
# 7: one chime per dial
for pref, f in (("moon", 1047), ("eclipse", 1319), ("olympic", 1568)):
    tw = tword(pref, starts[7]); put(sfx, ding(f, 1.2), tw if tw else starts[7] + 1.0, 0.28) if tw else None
# 8: workshop: candle crackle, filing, then the crank
put(sfx, crackle(5.0), starts[8] + 0.2, 0.18)
for q in range(8): put(sfx, snap(), starts[8] + 1.2 + q * 0.33, 0.12)
for q in range(8): put(sfx, click(), starts[8] + 6.2 + q * 0.22, 0.3)
put(sfx, ding(1568, 1.0), starts[8] + 7.6, 0.18)
# 9: sea wind and ship creaks, a sad low note
put(sfx, lp(rng.uniform(-1, 1, int(SR * 6)), 40) * np.sin(np.pi * np.linspace(0, 1, int(SR * 6))) * 0.5, starts[9], 0.35)
put(sfx, creak(1.2), starts[9] + 1.0, 0.2); put(sfx, drone(3.0, 98), starts[9] + 2.0, 0.22)
# 10: the sinking glug and bubbles, then the same ta-ding as the other videos
put(sfx, splash(), starts[10] + 0.1, 0.4)
for q in range(10): put(sfx, bubble(), starts[10] + 0.5 + q * 0.4, 0.2)
put(sfx, ding(1319, 0.5), END + 0.12, 0.2); put(sfx, ding(1976, 1.8), END + 0.36, 0.26)
sfx /= max(1e-6, np.abs(sfx).max())

# ------------------------------------------------------------------- voice + mix
with wave.open(sys.argv[1]) as w:
    sr = w.getframerate(); raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
x = np.interp(np.arange(int(len(raw) * SR / sr)) / (SR / sr), np.arange(len(raw)), raw)
voice = np.zeros(N); put(voice, x, 0.0, 1.0); voice /= max(1e-6, np.abs(voice).max())
k = int(SR * 0.08); ev = np.convolve(np.abs(voice), np.ones(k) / k, "same"); ev = np.convolve(ev, np.ones(k * 3) / (k * 3), "same")
duck = 1 - 0.5 * np.clip(ev / 0.12, 0, 1)
mix = voice + music * 0.32 * duck + sfx * 0.16
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix /= max(1e-6, np.abs(mix).max()) / 0.89


def save(name, a):
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16)
    with wave.open(f"{sys.argv[3]}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


save("anti_voice", voice); save("anti_music", music); save("anti_sfx", sfx); save("anti_mix_raw", mix)
print("ok", round(TOTAL, 2), "s")
