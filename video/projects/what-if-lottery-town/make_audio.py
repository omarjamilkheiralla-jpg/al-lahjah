"""Soundtrack for "What if a town won the lottery": voice + an original, section-by-section playful score + sound effects.
Run: python3 -I make_audio.py <voice_full.wav> <timing.json> <out_dir>"""
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
    (0, "sparse", ['Am', 'F', 'C', 'G']),
    (1, "sparse", ['C', 'G', 'Am', 'F']),
    (2, "curious", ['Dm', 'G', 'C', 'Am']),
    (3, "build", ['Am', 'E', 'Am', 'E']),
    (4, "play", ['C', 'Am', 'F', 'G']),
    (5, "play", ['F', 'C', 'G', 'C']),
    (6, "triumph", ['Am', 'F', 'C', 'G']),
    (7, "play", ['C', 'G', 'Am', 'F']),
    (8, "comic", ['Dm', 'G', 'C', 'Am']),
    (9, "comic", ['Am', 'E', 'Am', 'E']),
    (10, "comic", ['C', 'Am', 'F', 'G']),
    (11, "sparse", ['F', 'C', 'G', 'C']),
    (12, "build", ['Am', 'F', 'C', 'G']),
    (13, "tense", ['C', 'G', 'Am', 'F']),
    (14, "tense", ['Dm', 'G', 'C', 'Am']),
    (15, "comic", ['Am', 'E', 'Am', 'E']),
    (16, "comic", ['C', 'Am', 'F', 'G']),
    (17, "tense", ['F', 'C', 'G', 'C']),
    (18, "build", ['Am', 'F', 'C', 'G']),
    (19, "lull", ['C', 'G', 'Am', 'F']),
    (20, "play", ['Dm', 'G', 'C', 'Am']),
    (21, "lull", ['Am', 'E', 'Am', 'E']),
    (22, "sparse", ['C', 'Am', 'F', 'G']),
    (23, "curious", ['F', 'C', 'G', 'C']),
    (24, "resolve", ['Am', 'F', 'C', 'G']),
    (25, "play", ['C', 'G', 'Am', 'F']),
    (26, "resolve", ['Dm', 'G', 'C', 'Am']),
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
def boom():
    n = int(SR * 1.1); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 5) + 38) / SR) * np.exp(-t / 0.35) * 1.2
def pop():
    n = int(SR * 0.16); t = np.arange(n) / SR
    return (lp(rng.uniform(-1, 1, n), 5) * 1.0 + np.sin(2 * np.pi * 140 * t) * 0.6) * np.exp(-t / 0.035)
def putter(d=2.0):
    n = int(SR * d); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 62 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * np.minimum(1, t * 3) * 0.5
def thud():
    n = int(SR * 0.14); t = np.arange(n) / SR; return np.sin(2 * np.pi * 80 * t) * np.exp(-t / 0.04)
def wind(d=4.0):
    n = int(SR * d); return lp(rng.uniform(-1, 1, n), 60) * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2 * 1.4
def rustle(d=1.2):
    n = int(SR * d); x = np.convolve(rng.uniform(-1, 1, n), [1, -0.95], "same") * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * np.arange(n) / SR)); return x * np.sin(np.pi * np.linspace(0, 1, n)) * 0.5
def patter(d=1.6):
    n = int(SR * d); x = np.zeros(n)
    for q in range(int(d * 9)): i = int(q / 9 * SR); x[i:i + 900] += np.sin(2 * np.pi * 90 * np.arange(900) / SR) * np.exp(-np.arange(900) / 250) * rng.uniform(0.4, 0.9)
    return x
def cheer(d=2.0):
    n = int(SR * d); x = lp(rng.uniform(-1, 1, n), 7) + 0.5 * lp(rng.uniform(-1, 1, n), 20); t = np.linspace(0, 1, n)
    return x * np.minimum(1, t * 12) * np.exp(-t * 1.4) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t))
def chop(d=3.0):
    n = int(SR * d); x = np.zeros(n)
    for q in range(int(d * 11)): i = int(q / 11 * SR); k = 1200; x[i:i + k] += np.sin(2 * np.pi * 70 * np.arange(k) / SR) * np.exp(-np.arange(k) / 380) * 0.9
    return x
def water(d=2.5):
    n = int(SR * d); t = np.linspace(0, 1, n); return lp(rng.uniform(-1, 1, n), 4) * np.minimum(1, t * 6) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * t)) * 0.7
def cha():
    return np.concatenate([ding(2093, 0.18)[: int(SR * 0.18)], ding(3136, 1.0)]) * 0.8
def squeak(d=1.4):
    n = int(SR * d); t = np.arange(n) / SR; f = 500 + 900 * (t / d) ** 1.3
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.5
sfx = np.zeros(N)
for i in range(1, len(starts)): put(sfx, whoosh(0.4), starts[i] - 0.18, 0.4)
# 0-1: morning birds / town ambience
put(sfx, wind(5.0), 0.0, 0.12)
for q in range(6): put(sfx, ding(2600 + q * 150, 0.15), 0.8 + q * 0.7 + rng.uniform(0, 0.2), 0.05)
# 2: coins dropping into the jar, a week counter tick
for q in range(16): put(sfx, ding(1700 + (q % 4) * 140, 0.35), starts[2] + 0.5 + q * 0.62, 0.12)
# 3: lottery balls: one ding per ball, big fanfare on the jackpot
tw = tword("this", starts[3]) or starts[3] + 0.3
for q in range(6): put(sfx, ding(880 + q * 110, 0.5), tw + 0.2 + q * 0.5, 0.2)
tj = tword("jackpot", starts[3]) or starts[3] + 4.0
for q, m in enumerate([72, 76, 79, 84]): put(sfx, brass(note(m), 0.9), tj + 0.3 + q * 0.12, 0.22)
put(sfx, crowd(1.6), tj + 0.8, 0.3)
# 4-5: footsteps and a drum roll of excitement
put(sfx, patter(3.0), starts[4] + 1.0, 0.14)
# 6: three seconds of silence, then the scream and cheer and confetti
ts = tword("then", starts[6]) or starts[6] + 5.0
put(sfx, boom(), ts - 0.05, 0.6); put(sfx, cheer(3.5), ts, 0.7); put(sfx, crowd(2.0), ts + 0.1, 0.4)
for q in range(8): put(sfx, ding(1800 + q * 160, 0.5), ts + 0.2 + q * 0.18, 0.12)
# 7: car dealer: cha-chings and engines
for q in range(14): put(sfx, cha(), starts[7] + 0.9 + q * 0.32, 0.18)
put(sfx, putter(5.0), starts[7] + 3.0, 0.2)
# 8: boat: boing, happy ding
put(sfx, boing(), starts[8] + 1.0, 0.3); put(sfx, cha(), starts[8] + 4.8, 0.2)
# 9: gas: engine idle, pump click, empty buzz
put(sfx, putter(5.0), starts[9] + 0.2, 0.2)
for q in range(3): put(sfx, click(), starts[9] + 3.6 + q * 0.4, 0.4)
put(sfx, drone(1.2, 90), starts[9] + 5.2, 0.25)
# 10: each "I quit" pops
for w in ("bus", "cashier", "teacher", "plumber", "mechanic", "doctor"):
    tw = tword(w, starts[10]); put(sfx, boing(), (tw if tw else starts[10] + 3.0) + 0.2, 0.28)
# 11: oven crackle, a click when the lights go off
put(sfx, crackle(5.0), starts[11] + 0.1, 0.16); tl = tword("lights", starts[11]) or starts[11] + 5.0; put(sfx, click(), tl + 0.9, 0.5); put(sfx, drone(1.5, 70), tl + 1.0, 0.25)
# 12: a rush of footsteps and a shop bell
put(sfx, patter(5.0), starts[12] + 0.5, 0.22)
for q in range(5): put(sfx, ding(2400, 0.25), starts[12] + 0.4 + q * 0.5, 0.14)
# 13-14: price changes: a cash-register cha-ching and a gasp each time
tn = tword("now", starts[13]) or starts[13] + 5.0; put(sfx, cha(), tn, 0.3); put(sfx, crowd(1.0), tn + 0.1, 0.25)
tf = tword("fifty", starts[14]) or starts[14] + 1.0; put(sfx, cha(), tf, 0.3)
th = tword("hundred", starts[14]) or starts[14] + 3.2; put(sfx, cha(), th, 0.34); put(sfx, boom(), th, 0.4)
# 15-16: haggling and a lemonade cha-ching
put(sfx, cha(), starts[15] + 5.0, 0.26); put(sfx, cha(), starts[16] + 3.0, 0.24); tp = tword("pays", starts[16]) or starts[16] + 4.0; put(sfx, cha(), tp, 0.3)
# 17-19: empty shelves: low wind, a sad wah, the burst, water
put(sfx, wind(5.0), starts[17], 0.2); put(sfx, wah(), starts[17] + 1.0, 0.22)
tb = tword("bursts", starts[18]) or starts[18] + 0.5; put(sfx, boom(), tb, 0.5); put(sfx, water(6.0), tb, 0.35)
put(sfx, wind(4.0), starts[19], 0.2); put(sfx, drone(2.0, 75), starts[19] + 0.5, 0.25)
# 20: helicopter
put(sfx, chop(8.0), starts[20], 0.4); put(sfx, cheer(2.5), starts[20] + 4.5, 0.4)
# 21: the mayor cries: a sad little wah
put(sfx, wah(), (tword("cries", starts[21]) or starts[21] + 4.0), 0.3)
# 22: a heartbeat of dread
for q in range(6): put(sfx, thud(), starts[22] + 0.5 + q * 1.1, 0.3)
# 23: the balloon stretches, then a tiny pop
put(sfx, squeak(5.0), starts[23] + 0.2, 0.3); put(sfx, pop(), starts[23] + 5.8, 0.3)
# 24-25: footsteps and the oven fire, a hopeful chime
put(sfx, patter(5.0), starts[24] + 0.5, 0.2); put(sfx, crackle(5.0), starts[25] + 0.1, 0.16); put(sfx, ding(1320, 0.6), starts[25] + 2.0, 0.2)
# 26: murmur of the line, then the ta-ding
put(sfx, crowd(3.0), starts[26] + 0.5, 0.2)
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


save("town_voice", voice); save("town_music", music); save("town_sfx", sfx); save("town_mix_raw", mix)
print("ok", round(TOTAL, 2), "s")
