# Synthesised SFX + a scratch music bed (numpy only). Swap music-*.wav for a real track
# (ElevenLabs Music or a licensed one) with the same name; keep it ~15 dB under the VO.
import json, pathlib
import numpy as np
import soundfile as sf

import shutil, subprocess


def to_mp3(wav):
    # mp3 keeps the repo and the HTML preview small; needs ffmpeg on PATH
    if shutil.which("ffmpeg") is None:
        return
    mp3 = pathlib.Path(wav).with_suffix(".mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "160k", str(mp3)], check=True)
    pathlib.Path(wav).unlink()

SR = 48000
root = pathlib.Path(__file__).resolve().parent.parent
sfx = root / "public/audio/sfx"
sfx.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)

def t(sec): return np.arange(int(SR * sec)) / SR
def env(n, a=0.005, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def lp(x, a):  # one-pole low-pass, a in (0,1): smaller = darker
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s += a * (v - s); y[i] = s
    return y
def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak
def write(name, x):
    sf.write(sfx / f"{name}.wav", np.stack([x, x], 1).astype(np.float32), SR)
    to_mp3(sfx / f"{name}.wav")

# haptic buzz [200, 100, 200] ms
def burst(d):
    tt = t(d); x = np.sign(np.sin(2 * np.pi * 170 * tt)) * 0.6 + np.sin(2 * np.pi * 85 * tt)
    return lp(x, 0.08) * env(len(tt), 0.004, 0.03)
write("buzz", norm(np.concatenate([burst(0.2), np.zeros(int(0.1 * SR)), burst(0.2)]), 0.8))

# whoosh: noise through a sweeping low-pass
n = int(0.45 * SR); noise = rng.standard_normal(n)
sweep = np.linspace(0.02, 0.35, n) ** 1.5
y = np.zeros(n); s = 0.0
for i in range(n): s += sweep[i] * (noise[i] - s); y[i] = s
write("whoosh", norm(y * np.hanning(n) ** 0.7, 0.7))

# flip: shorter, brighter whoosh + click
n = int(0.3 * SR); noise = rng.standard_normal(n); sweep = np.linspace(0.4, 0.05, n)
y = np.zeros(n); s = 0.0
for i in range(n): s += sweep[i] * (noise[i] - s); y[i] = s
y *= np.hanning(n); y[:200] += np.sin(np.linspace(0, 40, 200)) * 2
write("flip", norm(y, 0.7))

# pop: soft sine blip with pitch drop
tt = t(0.12); f = 900 * np.exp(-tt * 18) + 380
write("pop", norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.1), 0.6))

# chime: two-note bell (match / burning)
def bell(freq, d=1.4):
    tt = t(d); x = sum(np.sin(2 * np.pi * freq * m * tt) * a for m, a in [(1, 1), (2.01, 0.35), (3.02, 0.15)])
    return x * np.exp(-tt * 3.2) * env(len(tt), 0.003, 0.2)
ch = np.zeros(int(1.6 * SR)); b1 = bell(880); b2 = bell(1318.5)
ch[: len(b1)] += b1; o = int(0.12 * SR); ch[o : o + len(b2)] += b2[: len(ch) - o]
write("chime", norm(ch, 0.5))

# rise: filtered noise swell
n = int(0.9 * SR); noise = rng.standard_normal(n)
y = lp(noise, 0.06) * np.linspace(0, 1, n) ** 2 * env(n, 0.01, 0.05)
write("rise", norm(y, 0.5))

# music bed: cold (sparse minor plucks) → warm (major pad + soft pulse) at `turn` seconds
def note(m): return 440 * 2 ** ((m - 69) / 12)
def pad(freqs, d):
    tt = t(d); x = np.zeros_like(tt)
    for fq in freqs:
        for det in (-0.12, 0, 0.12):
            ph = rng.uniform(0, 2 * np.pi)
            x += np.sin(2 * np.pi * fq * (1 + det / 100) * tt + ph) + 0.3 * np.sin(2 * np.pi * 2 * fq * tt + ph)
    return x * env(len(tt), 0.6, 0.8)
def pluck(fq, d=1.2):
    tt = t(d); return (np.sin(2 * np.pi * fq * tt) + 0.4 * np.sin(4 * np.pi * fq * tt)) * np.exp(-tt * 4) * env(len(tt), 0.003, 0.1)

def bed(total, turn, name, bpm=96):
    out = np.zeros(int(SR * total) + SR)
    beat = 60 / bpm
    cold = [57, 60, 64, 62, 59, 57, 55, 59]  # A minor-ish, sparse
    k = 0; s = 0.4
    while s < turn - 0.3:
        x = pluck(note(cold[k % len(cold)] + 12)) * 0.25
        i = int(s * SR); out[i : i + len(x)] += x[: len(out) - i]; s += beat * 2; k += 1
    lowc = pad([note(45), note(52)], turn + 0.5) * 0.06
    out[: len(lowc)] += lowc
    chords = [[60, 64, 67, 71], [57, 60, 64, 67], [65, 69, 72, 76], [62, 65, 69, 72]]  # Cmaj7 Am7 Fmaj7 Dm7
    s = turn; k = 0; bar = beat * 4
    while s < total:
        d = min(bar * 2 + 0.8, total - s + 0.8)
        x = pad([note(m) for m in chords[k % 4]], d) * 0.05
        i = int(s * SR); out[i : i + len(x)] += x[: len(out) - i]; s += bar * 2; k += 1
    s = turn
    while s < total - 1.5:
        tt = t(0.25); kick = np.sin(2 * np.pi * (55 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14) * 0.35
        i = int(s * SR); out[i : i + len(kick)] += kick; s += beat
    fade = int(2.5 * SR); out = out[: int(SR * total)]; out[-fade:] *= np.linspace(1, 0, fade)
    out[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    out = lp(out, 0.25)
    sf.write(root / f"public/audio/{name}.wav", np.stack([out, out], 1).astype(np.float32) / (np.max(np.abs(out)) + 1e-9) * 0.7, SR)
    to_mp3(root / f"public/audio/{name}.wav")

cfg = json.loads((root / "scripts/music.json").read_text())
for name, v in cfg.items(): bed(v["total"], v["turn"], name)
print("ok")
