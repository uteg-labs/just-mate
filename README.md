# JustMate

**Meet for real.** A faceless, walk-to-meet app that gets lonely people out of the door: it proposes one concrete plan nearby, or pings two compatible people who are already out, and a compass walks them to each other.

Built at [HackYeah 2026](https://hackyeah.pl) (Oct 3–4, TAURON Arena Kraków) for the OPEN: Sport & Healthcare task.

## The problem

Loneliness touches one in six people and is linked to about 871,000 deaths a year; lonely people are twice as likely to become depressed (WHO Commission on Social Connection, 2025). Apps solved matching. Nobody solved the door: a lonely person rarely goes out on a whim. They need a reason, a time, a place, and proof that someone will be there.

JustMate is not therapy and makes no health claims. It is a reason to go out, and someone waiting when you get there.

## Three rules

1. **No faces.** Nobody sees a photo, ever. Others see only a vibe badge written from your answers.
2. **No chat.** The match ends with two people standing in front of each other, talking.
3. **No people pins.** The map shows anonymized *zones* (geohash cells) with a density glow. The only pins are public venues; a person is never more than a bearing.

## Two speeds: Plan and Now

Build a faceless profile once: Mate or Date, interests and a few short questions. An LLM turns the answers into the vibe on your badge.

**Plan** gets you out of the door. The app proposes one concrete plan nearby — chess on Thursday at 19:00 in a café nine minutes away — and shows who's going as a vibe badge. You only tap **I'm in**; the plan goes ahead when both confirm. You can also put out your own invitation with a few times, and it is offered to one compatible person at a time. On the day, the compass opens shortly before the start.

**Now** is serendipity for when you're already out. Pick what you want right now (a beer, coffee, a board game…) and tap **Find people**. When two compatible people who want the same thing are within walking range, both phones buzz at the same moment with each other's badge. If both accept, a hot/cold compass guides them together within ten minutes.

After meeting: **We met**, and a note of how far you walked.

## Safety by design

- **Mutual by construction** — both must accept before the compass unlocks.
- **Zones, not pins** — the compass reveals a bearing and a distance bucket, never a position.
- **Public venues** — plans happen only at seeded public places.
- **Ephemeral** — live positions exist only inside an active session; no location history is stored.
- **10-minute window** — the compass expires automatically.
- **Vanish** — one tap ends the session for both, instantly.
- **Moderation** — free-text profile answers run through the OpenAI moderation model; a flagged user silently never sees or is seen by anyone.

Production path (not in the build): phone and ID verification, report-and-block with an automatic pause, women-only plans.

## Why now (the wedge: *consented serendipity*)

Every leg of this mechanic is market-validated; nobody assembled it: happn proved proximity (but retrospective, photo-first), Breeze proved skipping chat (but scheduled dates), S'More proved faceless demand (dead), the Zenly lineage proved people love live maps (but friends only). JustMate is the assembly: mutual, faceless, on foot.

## Stack

- **Mobile** — Expo (React Native) **dev-client build**: the map is native `expo-maps` (Apple Maps on iOS, Google Maps on Android, zone glow as circle overlays), so Expo Go does not run it.
- **Server** — Bun + Elysia, one WebSocket per client for zones, matching, plans and the compass relay. Contract in [`docs/PROTOCOL.md`](docs/PROTOCOL.md), typed in `@justmate/protocol`.
- **Data** — Better Auth (email + password, magic links) and PostgreSQL via Drizzle for accounts, profiles and plans. Live positions stay in memory per socket.
- **AI** — `gpt-4o-mini` writes onboarding questions, the vibe line, related interests and the character; OpenAI moderation screens profiles. Without `OPENAI_API_KEY` everything falls back to fixed samples.
- **Matching** — explainable compatibility scoring ([`docs/PRODUCT.md`](docs/PRODUCT.md) §7), geohash-6 zones for display, a walking-distance gate for matching.
- **ML (research, not wired into the server)** — `ml/` holds a PyTorch Siamese matching model trained on synthetic profiles and exported to ONNX. See [`ml/README.md`](ml/README.md) and [`docs/ML-MATCHING.md`](docs/ML-MATCHING.md).

```
docs/            product definition, app structure, design system, protocol, pitch/demo scripts, ML matching, submission pack
mobile/          Expo dev-client app — auth, onboarding, map, plans, match card, compass, post-meet, settings
server/          Bun + Elysia + Drizzle — auth, profile, onboarding LLM helpers, zones, matching, plans, compass relay
packages/        @justmate/protocol — the PROTOCOL.md wire types, shared by mobile and server
ml/              PyTorch Siamese matching model (synthetic data → train → eval → ONNX), standalone
```

## Run

Needs Bun ≥ 1.3, a local PostgreSQL database, and Xcode (iOS) or Android Studio (Android). Conventions for humans and agents: [`AGENTS.md`](AGENTS.md).

```bash
bun install
```

Backend on `:3000` (`ws://<host>:3000/ws`), or the mock that replays the PROTOCOL.md happy path on `:3001`:

```bash
cp server/.env.example server/.env
bun --cwd server db:migrate
bun run dev:server
```

Set `DATABASE_URL` to your local PostgreSQL database and `BETTER_AUTH_SECRET` to a random value
before starting. Drizzle owns the schema in `server/src/db` and migrations in `server/drizzle`;
use `bun --cwd server db:generate` after schema changes. In local development, auth emails
(password resets, magic links) are printed in the server terminal when `SMTP_HOST` is empty;
set the `SMTP_*` variables and `AUTH_EMAIL_FROM` to deliver real email (required in production).
`OPENAI_API_KEY` is optional: without it, onboarding questions, vibe lines, related interests,
the character, taste and selfie descriptions use fixed samples.

```bash
bun run dev:mock
```

Mobile is a dev-client build — `expo-maps` is native, so Expo Go cannot run it. Copy `mobile/.env.example` to `mobile/.env` (API/WS URLs; Google Maps key for Android), then build and run on a simulator or a plugged-in phone:

```bash
bun --cwd mobile ios
```

Or build in the cloud for both demo phones:

```bash
bunx eas-cli build --profile development --platform all
```

Checks (run before every push):

```bash
bun run lint && bun run typecheck && bun run test
```

## What's real vs canned (demo honesty)

| Real | Canned (labelled) |
|---|---|
| Accounts, faceless profiles, intents, interests | Ghost users adding zone density (the server spawns wandering ghosts in demo mode) |
| LLM onboarding: questions, vibe line, character (with `OPENAI_API_KEY`) | Fixed sample questions and vibe lines when no key is set |
| Zone glow from live positions | Demo-mode scripted positions (indoor GPS) |
| Mutual match delivered live to both phones (WebSocket, in-app buzz) | The seeded venue list for Kraków |
| Plans proposed from real profiles and free times, I'm in, the go-ahead on both phones | Demo-mode plans start in 2 minutes so the compass can open on stage |
| Explainable compatibility scoring ([`docs/PRODUCT.md`](docs/PRODUCT.md) §7) | |
| Compass (magnetometer bearing), haptics, vanish, post-meet distance | |

Not in the build by decision: remote push (the app is in the foreground whenever you are searching) and the ML model in the live matching path (it runs standalone in `ml/`, trained on synthetic data).

## License

[MIT](LICENSE)
