# JustMate — 24h build plan (HackYeah 2026)

Window: Sat 11:00 → Sun 11:00. Submission via HackTribe (Discord account required).

Stack: Expo (React Native) dev-client app · Bun + Elysia backend (WebSocket, `docs/PROTOCOL.md`) · explainable compatibility scoring (learned model as stretch) · maplibre-react-native.

## Division of labor (3 roles)

- **Mobile**: Expo dev-client app — onboarding (+18+ gate), map screen, glow zones, match banner, compass + haptics, post-meet distance screen. **This is the critical path**: one person, six screens.
- **Backend**: Bun/Elysia — ws per `docs/PROTOCOL.md`, distance-gated matching, offer/session TTLs, ghost seeding, demo tracks. Target: protocol-complete by Sat 15:00, then **moves to mobile** (second pair of hands on the critical path). Learned model only after Sat 19:00 if the core loop is already demoable.
- **Pitch/design**: deck, screenshots, demo script owner, mentor rounds, presenter

## Milestones

| Time | Milestone | Definition of done |
|---|---|---|
| Sat 11:30 | Demo script written (before core code) | `docs/DEMO.md` read aloud once |
| Sat 12:00 | **EAS dev-client builds started** (iOS + Android) | Builds queued; `expo-dev-client`, `@maplibre/maplibre-react-native`, `expo-sensors`, `expo-haptics`, `expo-location` in `app.json` plugins. Expo Go is **not** a fallback for this stack (see risks) |
| Sat 12:30 | Protocol frozen | `docs/PROTOCOL.md` agreed; mobile runs against a mock server replaying it, backend against `wscat` |
| Sat 14:00 (H+3) | Skeleton | Two devices on dev-client + Elysia ws skeleton + map renders a zone (or the SVG radar fallback) |
| Sat 15:00 | Backend protocol-complete | `match_offer` → `accept` → `session_start` → `partner_position` → `session_end` all pass the transcript in PROTOCOL.md |
| Sat 16:00 | **Money shot** | Match banner on both phones simultaneously (screenshot for the 20:00 draft) |
| Sat 19:00 (H+8) | **The project is real** | Full loop on both phones over WebSocket: banner → compass → buckets → vanish/met. No push involved |
| Sat 19:00+ | Stretch only | Learned model v0 behind `/compat` — only if everything above is green |
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
| Indoor GPS at the arena | HIGH | Demo mode (`?demo=a/b`) by design; pipeline identical; compass heading is magnetometer (works indoors); scripted track calibrated to the physical stage layout |
| **Expo Go cannot run this stack** | **HIGH** | `maplibre-react-native` is a native module (not in Expo Go); remote push does not work in Expo Go on Android since SDK 53. → EAS dev-client builds queued by 12:00 (15–40 min each, both platforms, both demo phones). If builds are not on phones by 14:30: **fallback = SVG/Canvas "radar"** (concentric rings + glowing blobs on dark background) instead of a real map, which runs in Expo Go; compass, haptics, ws all still work there |
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
| Relation to Category | 20% | Open with the loneliness/health frame, not the mechanic; post-meet "you walked 480 m to meet" screen makes the walking literal | 7–8 |
| Practical Applicability | 20% | 3-screen app, zero-learning-curve core loop | 8 |
| Design | 20% | Dark map + glow aesthetic; evening investment budgeted | 7–9 |
| Completeness | 10% | Core loop genuinely works on two phones | 8 |

## Mentor rounds (Sat 16:00–18:00)

Take the working demo to Mentors Village (floor 0, "Karate") and the task Discord channel. A mentor who has seen the compass walk is half the prize. Ask: "what would you cut?"
