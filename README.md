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
4. When two compatible people, both searching, with aligned intents enter the same zone — **both** get notified, with a 2-line personality card of the other person.
5. Either opens the **compass**: a directional arrow with hot/cold haptics, active for 10 minutes.
6. Walk. Meet. Talk. A real conversation in the real world.

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

## Repo layout

```
docs/          product definition, pitch/demo scripts, build plan, submission pack
server/        Node + ws realtime server: zones, matching, compass relay, demo ghosts
app/           Vite + React PWA: profile, zone map (MapLibre/OpenFreeMap), compass
```

## Run

```bash
# terminal 1 — realtime server (:8787)
cd server && npm install && npm start

# terminal 2 — client (:5173)
cd app && npm install && npm run dev
```

- Two laptops/phones: open `http://localhost:5173/?demo=a` and `/?demo=b` — scripted converging positions (GPS indoors at an arena is unreliable; the pipeline is identical, only the position source is scripted).
- Real GPS: open without `?demo`. Geolocation needs a secure context — on an Android phone over USB run `adb reverse tcp:5173 tcp:5173` and open `http://localhost:5173`.
- Both sides: fill profile → enable search → wait for the zone match → accept → compass.

## What's real vs canned (demo honesty)

| Real | Canned (labelled) |
|---|---|
| Profiles, intents, interests | The private attraction vector (precomputed stable vectors; the story: "your photo never leaves your phone — only an anonymous compatibility number does") |
| Zone glow from live positions | Ghost users adding density (server spawns wandering ghosts) |
| Mutual match + notification | Personality-card strings (canned vibe pairs) |
| Compass bearing math, haptics, vanish | Push notifications (in-app banner + vibration instead) |
