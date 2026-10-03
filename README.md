# JustMate

**Meet for real.** JustMate helps two compatible strangers who want the same thing *right now* find each other in the real world — faceless, mutual, and on foot.

Built at [HackYeah 2026](https://hackyeah.pl) (Oct 3–4, TAURON Arena Kraków).

## The problem

Dating apps solved matching and broke meeting. People swipe alone at home, chat for weeks, and never meet. Loneliness is now a declared public-health issue (WHO 2023; US Surgeon General: equivalent to 15 cigarettes a day). The interface needs to be the street, not the feed.

## Three rules

1. **No faces.** Nobody sees a photo, ever. Attraction is a private compatibility vector, not a profile picture.
2. **No chat.** There is no chat. The match ends with two people standing in front of each other, talking.
3. **No pins.** The map shows anonymized *zones* (geohash cells) with a density glow — never anyone's location.

## How it works

1. Build a faceless profile once: interests + a 2-line vibe card. No photo.
2. On the map, pick what you want *right now* (a beer, coffee, friends, a soul mate…) and tap **Find people** — only when you actually want to meet (default invisible: battery + privacy + intent in one action).
3. See zones glow where compatible people might be. Search/browse doesn't exist.
4. When two compatible people, both searching, with aligned intents come within ~400 m of each other — **both** get notified at the same moment, with a 2-line personality card of the other person.
5. Either opens the **compass**: a directional arrow with hot/cold haptics, active for 10 minutes.
6. Walk. Meet. Talk. A real conversation in the real world — and a note of how far you walked to get there.

## Safety by design

- **Mutual by construction** — both are notified, both must accept before the compass unlocks.
- **Zones, not pins** — the compass reveals a bearing, never the other person's position on a map.
- **Ephemeral** — positions live only inside an active session; no history is stored.
- **10-minute window** — the compass expires automatically.
- **Vanish** — one tap kills the session for both, instantly.

## Why now (the wedge: *consented serendipity*)

Every leg of this mechanic is market-validated; nobody assembled it: happn proved proximity (but retrospective, photo-first), Breeze proved skipping chat (but scheduled dates), S'More proved faceless demand (dead), the Zenly lineage proved people love live maps (but friends only). JustMate is the assembly: real-time, mutual, faceless, on foot.

## HackYeah 2026 submission plan

| Item | Value |
|---|---|
| Task (default) | OPEN: Sport & Healthcare — loneliness/mental-wellbeing framing ("a social prescription you walk to") |
| Task (alt) | OPEN: ImpactHer — if a woman on the team pitches the safety-by-design story |
| Title (≤5 words, EN) | `JustMate: Meet For Real` |
| Deck | English, ≤10 slides, PDF — see `docs/SUBMISSION.md` |
| Deadlines | Sat 20:00 draft upload (mandatory) · Sun 11:00 final · Sun 16:00 pitch |

## Stack

**M0 (what runs in the demo):** Expo (React Native, **dev-client build** — the map is a native module, so Expo Go does not run it) mobile app · Bun + Elysia backend over one WebSocket per client (zones, matching, compass relay — contract in `docs/PROTOCOL.md`) · explainable compatibility scoring · maplibre-react-native + OpenFreeMap (fallback inside Expo Go: `react-native-maps` with circle overlays — see `docs/BUILD-PLAN.md` risks) · geohash-6 zones for display, 400 m distance gate for matching. No database, no push.

**Stretch / M1 (documented, built only if the core loop is green by Sat 19:00):** PyTorch training of a Siamese model (Shared Encoder + Match Head, triplet + match-loss) → **export to ONNX** → **compiled C++ inference binary `match_scorer`** built against `onnxruntime` and **spawned by the Bun server as a long-lived subprocess**; the binary loads the ONNX graph at boot and exchanges pairwise scores with the server as **newline-delimited JSON over stdin/stdout** — **no FastAPI, no HTTP between server and model**. OpenAI `text-embedding-3-small` for profile text. PostgreSQL with pgvector as embedding cache. See `docs/ML-MATCHING.md`. Run instructions land with the scaffold.

```
docs/            product definition, app structure (STRUCTURE.md), design system (DESIGN.md), protocol (client↔server contract), pitch/demo scripts, build plan, ML matching, submission pack
mobile/          Expo dev-client app — onboarding, Home ("Where to?" map), match banner, compass, post-meet
server/          Bun + Elysia — zones, distance-gated matching, hard gates, compass relay, TTLs, ghosts
ml/              (stretch) PyTorch training (Shared Encoder, Match Head, calibration) → ONNX export · C++ inference binary `match_scorer` against onnxruntime — single executable, spawned by the server, no Python at inference time
shared-infra/    (stretch) PostgreSQL + pgvector schema, migrations
```

ML process details: see [`docs/ML-MATCHING.md`](docs/ML-MATCHING.md).

## What's real vs canned (demo honesty)

| Real | Canned (labelled) |
|---|---|
| Profiles, intents, interests | Ghost users adding zone density (server spawns wandering ghosts) |
| Zone glow from live positions | Vibe-card strings (until the model generates them) |
| Mutual match delivered live to both phones (WebSocket, in-app buzz) | Demo-mode scripted positions (indoor GPS) |
| Explainable compatibility scoring (the formula in `docs/PRODUCT.md` §7) | Attraction vector (simulated) |
| Compass (magnetometer bearing), haptics, vanish, post-meet distance | |
| *If the stretch ships:* Shared Encoder + Match Head training loop and the compiled `match_scorer` binary scoring `z` pairs over stdin/stdout | *If the stretch ships:* training labels are rule-based synthetic ground truth, not real interactions — "real pipeline, canned data", never "AI matching" |

Not in M0 by decision: remote push (the app is in the foreground whenever you are searching; push is an M1 item for background search) and any database (positions live in memory per socket; the pgvector cache belongs to the ML stretch).
