# just-mate — 24h build plan (HackYeah 2026)

Window: Sat 11:00 → Sun 11:00. Submission via HackTribe (Discord account required).

Stack: Expo (React Native) app · Bun + Elysia backend (zones, matching, compass relay) · Python + FastAPI ML service (compatibility scoring) · PostgreSQL with pgvector (per-user embedding & z-vector cache) · OpenAI `text-embedding-3-small` · custom Siamese model (Shared Encoder + Match Head, triplet + match-loss joint training) · maplibre-react-native.

## Division of labor (4 roles)

- **Mobile**: Expo app — map screen, glow zones, compass + haptics, push
- **Backend**: Bun/Elysia — ws, hard gates (zone / intent / cooldown / session), compass relay, ghost seeding, demo paths, session TTL, ML fallback
- **ML**: Python + FastAPI — synthetic data generation, Shared Encoder + Match Head, triplet + match-loss training, calibration, pgvector cache integration, /score endpoint
- **Pitch/design**: deck, screenshots, demo script owner, mentor rounds, presenter

## Milestones

| Time | Milestone | Definition of done | 
|---|---|---|
| Sat 11:30 | Demo script written (before core code) | `docs/DEMO.md` read aloud once |
| Sat 13:00 | Dev builds started | Expo dev-client builds cooking on both demo phones (Expo Go fallback) |
| Sat 14:00 (H+3) | Skeleton | Two devices + Elysia ws skeleton + map renders a zone |
| Sat 16:00 | **Model v0 trained** | Synthetic profiles (≥5k) → Shared Encoder + Match Head trained (triplet + match-loss joint) → ONNX/torchscript exported → FastAPI `/score` live → Elysia wired to it with baseline fallback; pgvector cache populated for canned profiles |
| Sat 19:00 (H+8) | **The project is real** | Match + mutual push working on both phones |
| Sat 20:00 | **Mandatory HackTribe draft** | Title + 500-word description + screenshot + draft deck uploaded |
| Sat evening | Real deck | 10-slide English deck built before sleeping (it is the first judge) |
| Overnight | Juice | Compass polish, haptics, glow aesthetic, seeded fixtures, demo-mode timing tuned |
| Sun 07:00 | **FREEZE** | Code locked; backup video ×2; hardcoded demo path verified |
| Sun 10:30 | **Submit** | 30 min before deadline, always |
| Sun 11:00–15:00 | Rehearse ×5 | Touch code only for demo-visibility fixes |
| Sun 16:00 | Pitch | Both phones charged, prop (beer) ready |

## Risk register

| Risk | Sev | Mitigation |
|---|---|---|
| Indoor GPS at the arena | HIGH | Demo mode (`?demo=a/b`) by design; pipeline identical; compass heading is magnetometer (works indoors) |
| Jury raises stalking | HIGH | Safety-by-design slide at 3:30 — turn the question into the answer |
| Live demo dies on stage | MED | Backup video recorded twice; never debug on stage |
| Cold-start question | MED | Density-first launch answer rehearsed (campus/festival/venue partners) |
| Scope creep (real ML rabbit holes, chat, push infra) | MED | Model training timeboxed to 2h with baseline fallback; no new scope after Sat 20:00 |
| Expo dev-client build lead time | MED | Start builds by Sat 13:00; Expo Go as demo fallback |

## Rubric math (open-task rubric)

| Criterion | Weight | Our play | Est. |
|---|---|---|---|
| Idea & Innovation | 30% | Assembled wedge "consented serendipity" + 4-quarter validation story | 8–9 |
| Relation to Category | 20% | Open with the loneliness/health frame, not the mechanic | 7–8 |
| Practical Applicability | 20% | 3-screen app, zero-learning-curve core loop | 8 |
| Design | 20% | Dark map + glow aesthetic; evening investment budgeted | 7–9 |
| Completeness | 10% | Core loop genuinely works on two phones | 8 |

## Mentor rounds (Sat 16:00–18:00)

Take the working demo to Mentors Village (floor 0, "Karate") and the task Discord channel. A mentor who has seen the compass walk is half the prize. Ask: "what would you cut?"
