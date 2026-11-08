"""Builds the 5-second soundtrack for the hotel hook: voice + quirky pizzicato/marimba bed + soft SFX.
Run: python3 -I make_audio.py <voice.wav> <out_dir>
Everything is synthesised here, so there is no copyrighted audio."""
import sys, wave, math
import numpy as np

SR = 44100
DUR = 5.0
N = int(SR * DUR)
rng = np.random.default_rng(7)


def mix_into(buf, sig, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def pluck(freq, dur=0.5, decay=0.996):
    """Karplus-Strong pizzicato"""
    n = int(SR * dur)
    p = int(SR / freq)
    b = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = b[i % p]
        b[i % p] = decay * 0.5 * (b[i % p] + b[(i + 1) % p])
    return out * env(n, 0.001, dur * 0.5)


def marimba(freq, dur=0.45):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.04) + 0.12 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t / 0.02)
    return s * env(n, 0.001, 0.13)


def bass(freq, dur=0.3):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)
    return s * env(n, 0.004, 0.11)


def kick():
    n = int(SR * 0.18)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 28) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06)


def shaker():
    n = int(SR * 0.07)
    x = rng.uniform(-1, 1, n)
    x = x - np.concatenate([[0], x[:-1]])  # high-pass-ish
    return x * env(n, 0.003, 0.025)


def snap():
    n = int(SR * 0.05)
    x = rng.uniform(-1, 1, n)
    x = np.convolve(x, [1, -0.9], "same")
    return x * env(n, 0.0008, 0.012)


def click():
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1900 * t) * 0.5 + rng.uniform(-1, 1, n) * 0.5) * env(n, 0.0005, 0.006)


def whoosh(dur=0.5):
    n = int(SR * dur)
    x = rng.uniform(-1, 1, n)
    k = np.ones(40) / 40
    x = np.convolve(x, k, "same")
    t = np.linspace(0, 1, n)
    return x * np.sin(np.pi * t) ** 2


def creak(dur=0.7):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 180 + 70 * np.sin(2 * np.pi * 5 * t) + 120 * t
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.2
    return s * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5


def boing():
    n = int(SR * 0.45)
    t = np.arange(n) / SR
    f = 420 + 260 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.15) + 120 * np.exp(-t / 0.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)


def snore():
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 95 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t))
    return s * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * 0.6


def note(m):  # midi -> hz
    return 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------ music
BPM = 116
beat = 60 / BPM
eighth = beat / 2
music = np.zeros(N)
chords = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]  # C Am F G
melody = [72, None, 76, 74, None, 72, 67, None, 69, 72, None, 71, 67, None, 69, 71]  # playful C-pentatonic-ish

t = 0.0
step = 0
while t < DUR:
    bar = int(t / (beat * 4)) % 4
    root, tri = chords[bar]
    pos = int(round((t % (beat * 4)) / eighth))
    # bouncy walking bass on beats 1 and 3, off-beat pizzicato chord stabs
    if pos in (0, 4):
        mix_into(music, bass(note(root)), t, 0.55)
    if pos in (3, 7):
        mix_into(music, bass(note(root + 7)), t, 0.35)
    if pos % 2 == 1:
        for m in tri:
            mix_into(music, pluck(note(m), 0.35, 0.99), t, 0.16)
    # marimba melody
    mm = melody[step % len(melody)]
    if mm and t > 0.05:
        mix_into(music, marimba(note(mm)), t, 0.42)
    # light percussion: soft kick on 1/3, snap on 2/4, shaker on every 8th
    if pos in (0, 4):
        mix_into(music, kick(), t, 0.38)
    if pos in (2, 6):
        mix_into(music, snap(), t, 0.5)
    mix_into(music, shaker(), t, 0.1 if pos % 2 else 0.06)
    t += eighth
    step += 1

# landing: little sparkle on "inside" + a comic plink
for k, m in enumerate([84, 88, 91]):
    mix_into(music, marimba(note(m), 0.5), 4.45 + k * 0.07, 0.3)
music *= np.linspace(0.0, 1, N) ** 0.25 * np.minimum(1, (N - np.arange(N)) / (SR * 0.25) + 0.0 + 1) if False else 1
fade_in = np.minimum(1, np.arange(N) / (SR * 0.15))
music *= fade_in
music /= max(1e-6, np.abs(music).max())

# ------------------------------------------------------------------ sfx
sfx = np.zeros(N)
PH = [0.4, 1.9, 3.3, 4.6]
for ph in PH:
    # a ratchet click at each end of the lever swing: sin(2.2 t + ph) hits +-1
    k = math.ceil((2.2 * 0.3 + ph - math.pi / 2) / math.pi)
    while True:
        tt = (math.pi / 2 + k * math.pi - ph) / 2.2
        if tt > DUR: break
        if tt > 0.3:
            for q in range(4):
                mix_into(sfx, click(), tt + q * 0.018, 0.5 - q * 0.08)
        k += 1
mix_into(sfx, whoosh(0.6), 1.55, 0.35)       # camera pulls back
mix_into(sfx, whoosh(0.9), 3.1, 0.4)         # crane up
mix_into(sfx, creak(0.8), 0.9, 0.3)          # timber taking the weight
mix_into(sfx, creak(0.9), 2.7, 0.25)
mix_into(sfx, boing(), 1.72, 0.3)            # "6 FT" board pops
mix_into(sfx, snore(), 4.55, 0.7)            # the sleeping guest
sfx /= max(1e-6, np.abs(sfx).max())

# ------------------------------------------------------------------ voice
with wave.open(sys.argv[1]) as w:
    sr = w.getframerate()
    raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
# resample (linear) to 44.1k
x = np.interp(np.arange(int(len(raw) * SR / sr)) / (SR / sr), np.arange(len(raw)), raw)
voice = np.zeros(N)
mix_into(voice, x, 0.12)
voice /= max(1e-6, np.abs(voice).max())

# ducking: music dips while the voice speaks
absv = np.abs(voice)
k = int(SR * 0.08)
envv = np.convolve(absv, np.ones(k) / k, "same")
envv = np.convolve(envv, np.ones(k * 3) / (k * 3), "same")
duck = 1 - 0.45 * np.clip(envv / 0.12, 0, 1)

mix = voice * 1.0 + music * 0.30 * duck + sfx * 0.16
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= max(1e-6, np.abs(mix).max()) / 0.89


def save(name, a):
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16)
    with wave.open(f"{sys.argv[2]}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


save("hotel_voice", voice)
save("hotel_music", music)
save("hotel_sfx", sfx)
save("hotel_mix_raw", mix)
print("ok")
