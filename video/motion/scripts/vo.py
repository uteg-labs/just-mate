# Scratch voiceover: renders one WAV per scene with Kokoro (local TTS) and writes durations.
# Final VO: replace public/audio/vo/<key>.wav with ElevenLabs takes (same names), re-run `bun run vo:measure`.
import json, sys, pathlib
import soundfile as sf

import shutil, subprocess


def to_mp3(wav):
    # mp3 keeps the repo and the HTML preview small; needs ffmpeg on PATH
    if shutil.which("ffmpeg") is None:
        return
    mp3 = pathlib.Path(wav).with_suffix(".mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "160k", str(mp3)], check=True)
    pathlib.Path(wav).unlink()
root = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((root / "scripts/vo.json").read_text())
out = root / "public/audio/vo"
out.mkdir(parents=True, exist_ok=True)
if "--measure" not in sys.argv:
    from kokoro_onnx import Kokoro
    k = Kokoro(sys.argv[1] if len(sys.argv) > 1 else "kokoro.onnx", sys.argv[2] if len(sys.argv) > 2 else "voices.bin")
    for key, text in cfg["lines"].items():
        s, sr = k.create(text, voice=cfg["voice"], speed=cfg["speed"], lang="en-us")
        sf.write(out / f"{key}.wav", s, sr)
        to_mp3(out / f"{key}.wav")
durs = {}
for f in sorted(out.glob("*.mp3")):
    info = sf.info(f)
    durs[f.stem] = round(info.frames / info.samplerate, 3)
(root / "src/vo-durations.json").write_text(json.dumps(durs, indent=2) + "\n")
print(json.dumps(durs, indent=2))
