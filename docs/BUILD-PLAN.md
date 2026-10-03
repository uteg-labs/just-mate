# just-mate — 24h build plan (HackYeah 2026)

Window: Sat 11:00 → Sun 11:00. Submission via HackTribe (Discord account required).

## Division of labor (3 roles)

- **FE**: map screen, glow zones, compass UI + haptics, dark "glow" aesthetic
- **BE**: ws server, matching, ghost seeding, demo-mode paths, match-session TTL
- **Pitch/design**: deck, screenshots, demo script owner, mentor rounds, presenter

## Milestones

| Time | Milestone | Definition of done |
|---|---|---|
| Sat 11:30 | Demo script written (before core code) | `docs/DEMO.md` read aloud once |
| Sat 14:00 (H+3) | Skeleton | Two clients + ws echo + map renders a zone |
| Sat 19:00 (H+8) | **The project is real** | Match + mutual notify working on both phones |
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
| Scope creep (real ML, chat, push) | MED | Everything canned is listed in README honesty table; no new scope after Sat 20:00 |
| PWA geolocation blocked over LAN http | LOW | `adb reverse` localhost trick (docs/DEMO.md); demo mode unaffected |

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
