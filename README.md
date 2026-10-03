# just-mate

**Meet for real.** just-mate helps two compatible strangers who want the same thing *right now* find each other in the real world — faceless, mutual, and on foot.

Built at [HackYeah 2026](https://hackyeah.pl) (Oct 3–4, TAURON Arena Kraków).

## The problem

Dating apps solved matching and broke meeting. People swipe alone at home, chat for weeks, and never meet. Loneliness is now a declared public-health issue (WHO 2023; US Surgeon General: equivalent to 15 cigarettes a day). The interface needs to be the street, not the feed.

## Three rules

1. **No faces.** Nobody sees a photo, ever. Attraction is a private compatibility vector, not a profile picture.
2. **No chat.** There is no chat. The match ends with two people standing in front of each other, talking.
3. **No pins.** The map shows anonymized *zones* (geohash cells) with a density glow — never anyone's location.

## How it works

1. Build a faceless profile: what you're looking for (date, friends, a beer, coffee, an activity) + interests.
2. Switch **search mode** on — only when you actually want to meet (default off: battery + privacy + intent).
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

Every leg of this mechanic is market-validated; nobody assembled it: happn proved proximity (but retrospective, photo-first), Breeze proved skipping chat (but scheduled dates), S'More proved faceless demand (dead), the Zenly lineage proved people love live maps (but friends only). just-mate is the assembly: real-time, mutual, faceless, on foot.

## HackYeah 2026 submission plan

| Item | Value |
|---|---|
| Task (default) | OPEN: Sport & Healthcare — loneliness/mental-wellbeing framing ("a social prescription you walk to") |
| Task (alt) | OPEN: ImpactHer — if a woman on the team pitches the safety-by-design story |
| Title (≤5 words, EN) | `just-mate: Meet For Real` |
| Deck | English, ≤10 slides, PDF — see `docs/SUBMISSION.md` |
| Deadlines | Sat 20:00 draft upload (mandatory) · Sun 11:00 final · Sun 16:00 pitch |

## Stack

Expo (React Native, **dev-client build** — the map is a native module, so Expo Go does not run it) · Bun + Elysia backend over one WebSocket per client · explainable compatibility scoring (learned model as a drop-in stretch) · maplibre-react-native + OpenFreeMap · geohash-6 zones for display, 400 m distance gate for matching. Run instructions land with the scaffold.

```
docs/     product definition, protocol (client↔server contract), pitch/demo scripts, build plan, submission pack
mobile/   Expo dev-client app — onboarding, zone map, match banner, compass, post-meet
server/   Bun + Elysia — zones, matching, compass relay
ml/       compatibility-model training
```

## What's real vs canned (demo honesty)

| Real | Canned (labelled) |
|---|---|
| Profiles, intents, interests | Ghost users adding zone density (server spawns wandering ghosts) |
| Zone glow from live positions | Vibe-card strings (until the model generates them) |
| Mutual match delivered live to both phones (WebSocket, in-app buzz) | Demo-mode scripted positions (indoor GPS) |
| Explainable compatibility scoring | Attraction vector (simulated); learned model, if shown, trained on synthetic data |
| Compass (magnetometer bearing), haptics, vanish, post-meet distance | |

Not in M0 by decision: remote push (the app is in the foreground whenever search mode is on; push is an M1 item for background search).
