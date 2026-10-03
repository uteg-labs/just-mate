# JustMate — 24h build plan (HackYeah 2026)

Window: Sat 11:00 → Sun 11:00. Submission via HackTribe (Discord account required).

Stack: Expo (React Native) dev-client app · Bun + Elysia backend (WebSocket per `docs/PROTOCOL.md`) · explainable compatibility scoring (learned model as stretch) · **compiled C++ inference binary `match_scorer`** built against `onnxruntime`, **spawned by the Bun server as a subprocess** (stdin/stdout JSON-lines, **no FastAPI / no HTTP between server and model**) — M1 roadmap for the scoring source · PostgreSQL with pgvector (per-user embedding & z-vector cache, M1) · OpenAI `text-embedding-3-small` (M1) · custom Siamese model (Shared Encoder + Match Head, triplet + match-loss joint training, M1), **exported to ONNX** and loaded by `match_scorer` · native maps via `expo-maps` (Apple Maps / Google Maps).

## Division of labor (4 roles)

- **Mobile**: Expo dev-client app — auth, onboarding (Date / Mate, vibe badge, 18+ gate), map with category bento + heat, match card, compass + haptics, post-meet (names, keep in touch), settings — one morphing surface (`STRUCTURE.md`). **This is the critical path**: one person, eight shapes.
- **Backend**: Bun/Elysia — ws per `docs/PROTOCOL.md`, distance-gated matching (400 m, not zone), hard gates (active intent / cooldown / session / ghost), bearing-only compass relay, offer/session TTLs, ghost seeding, demo tracks, ML fallback. Target: protocol-complete by Sat 15:00, then **moves to mobile** (second pair of hands on the critical path). Learned model only after Sat 19:00 if the core loop is already demoable.
- **ML (M1+ stretch, only after Sat 19:00)**: PyTorch training (synthetic data, Shared Encoder + Match Head, triplet + match-loss, calibration) → `export.py` writes `model_v0.onnx` → CMake builds the C++ binary `match_scorer` against `onnxruntime` → Bun spawns it once at server startup, `/compat` calls pipe JSON-lines over stdin/stdout, falls back to the explainable baseline if the subprocess is down / errors / times out. Architecture documented in `docs/ML-MATCHING.md`; not a critical-path role in M0.
- **Pitch/design**: deck, screenshots, demo script owner, mentor rounds, presenter; owns `DESIGN.md` tokens

## Milestones

| Time | Milestone | Definition of done | 
|---|---|---|
| Sat 11:30 | Demo script written (before core code) | `docs/DEMO.md` read aloud once |
| Sat 12:00 | **EAS dev-client builds started** (iOS + Android) | Builds queued; `expo-dev-client`, `expo-maps`, `expo-sensors`, `expo-haptics`, `expo-location` in `app.json` plugins. Expo Go is **not** a fallback for this stack (see risks) |
| Sat 12:30 | Protocol frozen | `docs/PROTOCOL.md` agreed; mobile runs against a mock server replaying it, backend against `wscat` |
| Sat 14:00 (H+3) | Skeleton | Two devices on dev-client + Elysia ws skeleton + map renders a zone (or the SVG radar fallback) |
| Sat 15:00 | Backend protocol-complete | `match_offer` → `accept` → `session_start` → `partner_position` → `session_end` all pass the transcript in PROTOCOL.md |
| Sat 16:00 | **Money shot** | Match card with the vibe badge on both phones simultaneously (screenshot for the 20:00 draft) |
| Sat 19:00 (H+8) | **The project is real** | Full loop on both phones over WebSocket: match card → compass → buckets → vanish/met. No push involved |
| Sat 19:00+ | Stretch only — **Model v0 trained & compiled into a binary** | Only if everything above is green: synthetic profiles (≥5k) → Shared Encoder + Match Head trained (triplet + match-loss joint) → ONNX exported (`model_v0.onnx`) → `match_scorer` C++ binary built against `onnxruntime` → Bun spawns it once at startup, `/compat` pipes requests/responses as JSON-lines over stdin/stdout, explainable-baseline fallback if the subprocess is down / errors / times out; pgvector cache populated for canned profiles. Demo honesty: with synthetic data only, the model learns the baseline — it is presented as "training pipeline is real, data is synthetic", not as "AI matching". See `docs/ML-MATCHING.md`. |
| Sat 20:00 | **Mandatory HackTribe draft** | Title + 500-word description + screenshot + draft deck uploaded |
| Sat evening | Real deck | 10-slide English deck built before sleeping (it is the first judge) |
| Overnight | Juice | Pass the `DESIGN.md` quick-reference on every screen: springs/press feedback, sheet momentum, compass haptic escalation, materials, reduce-motion fallbacks; seeded fixtures, demo-mode timing tuned |
| Sun 07:00 | **FREEZE** | Code locked; backup video ×2; hardcoded demo path verified |
| Sun 10:30 | **Submit** | 30 min before deadline, always |
| Sun 11:00–15:00 | Rehearse ×5 | Touch code only for demo-visibility fixes |
| Sun 16:00 | Pitch | Both phones charged, prop (beer) ready |

## Risk register

| Risk | Sev | Mitigation |
|---|---|---|
| Indoor GPS at the arena | HIGH | Demo mode (`?demo=a/b`) by design; pipeline identical; compass heading is magnetometer (works indoors); scripted track calibrated to the physical stage layout |
| **Expo Go cannot run this stack** | **HIGH** | `expo-maps` is a native module (not in Expo Go; Android also needs a `GOOGLE_MAPS_API_KEY`); remote push does not work in Expo Go on Android since SDK 53. → EAS dev-client builds queued by 12:00 (15–40 min each, both platforms, both demo phones). Decision point 14:30 — if dev-client builds are not on both phones: **fallback 1 = `react-native-maps`**, which ships inside Expo Go and draws the same Apple/Google base maps; glow zones stay `Circle` overlays (halo + core, amber, low alpha) — same screen, same data, no native build. **Fallback 2 = SVG/Canvas "radar"** (concentric rings + glowing blobs) if even that misbehaves. Compass, haptics, ws are unaffected by either. Keep the map behind one `ZoneMap` component so the swap is one import |
| Jury raises stalking | HIGH | Safety-by-design slide at 3:30 — turn the question into the answer |
| Live demo dies on stage | MED | Backup video recorded twice; never debug on stage |
| Cold-start question | MED | Density-first launch answer rehearsed (campus/festival/venue partners) |
| Scope creep (real ML rabbit holes, chat, push infra) | MED | **Remote push is out of M0** (app is foreground while searching; ws delivers the buzz). Learned model only after 19:00 behind the same interface. No new scope after Sat 20:00 |
| Demo phone matched with a ghost instead of the other phone | MED | Ghosts are never match candidates; demo sockets pair only with each other (PROTOCOL.md) |
| Compass arrow points off-stage | MED | Scripted `STAGE_A/STAGE_B` set after seeing the stage; one rehearsal walk with the real heading |
| Overclaim caught by a judge reading the repo | MED | Every deck/description sentence describes the demo or is labelled "production path" (PRODUCT.md §18) |

## Rubric math (open-task rubric)

| Criterion | Weight | Our play | Est. |
|---|---|---|---|
| Idea & Innovation | 30% | Assembled wedge "consented serendipity" + 4-quarter validation story | 8–9 |
| Relation to Category | 20% | Open with the loneliness/health frame, not the mechanic; the 10-minute compass walk makes the walking literal | 7–8 |
| Practical Applicability | 20% | 3-screen app, zero-learning-curve core loop | 8 |
| Design | 20% | Pale map + amber glow, night compass; Apple-style fluid motion, materials and haptics per `DESIGN.md`; evening investment budgeted | 7–9 |
| Completeness | 10% | Core loop genuinely works on two phones | 8 |

## Mentor rounds (Sat 16:00–18:00)

Take the working demo to Mentors Village (floor 0, "Karate") and the task Discord channel. A mentor who has seen the compass walk is half the prize. Ask: "what would you cut?"
