# just-mate · motion

Remotion (React → MP4) project for the launch video and the use-case clips. Story strategy (after the mentor review): one umbrella video for the jury and the web hero, plus one short clip per use case for the web sections and social.

| Composition | Length | Use case | Who |
|---|---|---|---|
| `Main` | ~54 s | Loneliness → one app, two speeds (Plan + Now) → safety | HackYeah submission (limit 60 s), web hero |
| `Tomek` | ~26 s | **Plan**: the app proposes, he only says yes → on → walk to the venue → group table with status chips → same again | newcomer, works from home |
| `Lucia` | ~18 s | **Now**: already out, both phones ping, compass, beer | tourist, three days alone |
| `Ania` | ~20 s | **Date**: no photos, a vibe badge instead of a face, names after you meet | tired of swipe apps |
| `Marta` | ~18 s | **Safety**: invisible, zones not pins, mutual consent, Vanish; next steps labelled production path | safety lens |
| `Piotr` | ~19 s | **Venues**: a café lists quiet-night tables, the app fills them; venues pay, meeting stays free | partner venue (M1) |

Plan scenes with a group table, status chips, a go-ahead minimum or a leave-at time are product vision, not the current build: plans in the app are 1:1.

Characters and rules come from `docs/PRODUCT.md` §4.1, §10 and §16. No health claims (§3.1).

## Preview in the browser (no render)

```bash
cd video/motion
bun install
bun run studio          # Remotion Studio: every composition, hot reload, scrub the timeline
bun run preview         # or: a light player page for all pieces → out/preview, served locally
```

`bun run preview:build` writes `out/preview/` (`index.html`, `preview.js`, assets). The same page is published as a claude.ai artifact for quick review.

The public web page in [`site/`](../../site) at the repo root plays these same compositions as its hero and section clips.

## Render

```bash
bun run render:main     # out/just-mate-main.mp4
bun run render          # all six
```

## Voiceover, music, sound

- `public/audio/vo/*.mp3` is a scratch voice (Kokoro, local TTS); lines live in `scripts/vo.json`, one key per file. Final takes from ElevenLabs go into the same folder under the same names. If a take runs longer than its scene, change the scene length in `src/timeline.tsx`.
- Regenerate the scratch voice: `pip install kokoro-onnx soundfile`, download `kokoro-v1.0.onnx` + `voices-v1.0.bin` from the kokoro-onnx GitHub releases, then `python3 scripts/vo.py kokoro-v1.0.onnx voices-v1.0.bin` (needs ffmpeg for mp3).
- `public/audio/music-*.mp3` is a synthesised placeholder bed per piece (cold plucks → warm pad at the turn; `scripts/music.json`, `python3 scripts/audio.py`). Replace with a real track of the same name; it plays at volume 0.32 under the VO.
- SFX (`public/audio/sfx`) are synthesised; buzz = the app's `[200,100,200]` haptic.

## Where things come from

- Phone screens and vibe badges: captured from the design prototype (`video/Just-Mate App Prototype/`) at 2×, in `public/screens/` and `public/badges/`. Plan screens are in the prototype (`app/plans/`) but not captured; venue screens are not there at all. The plan card, mini phones, day-of card and partner card are drawn in `src/scenes/` from the copy in `docs/STRUCTURE.md` › Plans.
- Colours, type (Inter Variable), icons (Lucide): the just-mate design system export.
- World map dots: `node scripts/world-dots.mjs` (world-atlas 110m land, Equal Earth projection).

## Code map

- `src/timeline.tsx`: every piece as a list of scenes with VO and SFX cues (frame offsets). Edit lengths and order here.
- `src/scenes/cold.tsx` (hook, door), `src/scenes/warm.tsx` (rules, plan, on, leave, table, again, safety, outro), `src/scenes/kit.tsx` (persona, two speeds, ping pair, walk, met, safety beats, venue scenes).
- `preview/`: the browser player page.
