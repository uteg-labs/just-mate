# JustMate — HackYeah submission pack

Hard limits (enforced): title ≤5 words EN · description ≤500 words EN incl. team members · ≥1 image · deck EN PDF ≤10 slides · video ≤60s EN optional · ONE repo, judge-accessible.

## Title

`JustMate: Meet For Real`

## Description (draft, ~210 words — fill team members)

> Dating apps solved matching. They broke meeting: we swipe alone at home, chat for weeks, and never meet — while loneliness is now a declared public-health issue.
>
> JustMate is a faceless, proximity-based social app with three rules: no faces, no chat, no pins. Users pick Date or Mate and build a faceless profile from interests and four short questions, which becomes a vibe badge; on the map they pick what they're up for right now (wine, padel, board games). The architecture is designed so that attraction stays a private compatibility vector on the device, never a photo. There is no feed and no search — only a map that warms up where compatible people are searching. When two compatible people, both in opt-in search mode with aligned intents, come within walking range of each other, both phones notify simultaneously, each showing the other's vibe badge. Once both accept, a compass unlocks: a directional, hot/cold guide that turns finding the person into a small game — and ends with a real conversation in the real world, where first names unlock, and only then.
>
> Safety is the architecture, not a feature: mutual consent before anything unlocks, zones instead of locations, a compass that reveals a bearing and never a pin, 10-minute sessions, zero stored history, and a one-tap Vanish that ends the session for both.
>
> Team: [Name Surname — email], [Name Surname — email], [Name Surname — email]

## 10-slide deck outline

1. **Title** — JustMate: Meet For Real + team names
2. **Problem** — swiping replaced meeting; 3 stats (loneliness ≈ 15 cigarettes/day; hours swiped per real date; % matches never meet)
3. **Why now** — happn (proximity, retrospective) · Breeze (skip chat, scheduled) · S'More (faceless, dead) · Zenly (live maps, friends) — "nobody assembled the walk"
4. **The idea** — three rules + one-liner + app screenshot
5. **How it works** — the 6-step loop as a diagram (profile + badge → Date/Mate + category pick → heat map → mutual ping → compass → meet, names unlock)
6. **Safety by design** — mutual / zones-not-pins / ephemeral / 10-min / Vanish
7. **Demo** — live, or the 60s video + two phone screenshots
8. **Tech** — session-scoped WebSocket, geohash-6 zones (display) + 400 m distance gate (matching), bearing-only relay, explainable scoring, Expo app, Bun + Elysia backend; real-vs-canned honesty line
9. **Launch** — density-first: one campus/festival/city; venue partnerships ("first beer"); zone glow is an aggregate so the map is alive from day one
10. **Credits & licenses** — AI use credited (LLM questions, embeddings, matching model, LLM vibe lines and openers), Apple Maps / Google Maps attribution (shown by the native map), test data only

## Screenshots to capture (for gallery + deck)

1. Your badge (onboarding, no photo)
2. Map — category bento + heat (the Bolt-shot)
3. Match card with the vibe badge on two phones side by side (the money shot)
4. Compass full-screen (arrow + distance bucket + countdown)
5. Vanish button close-up

## AI-use disclosure (required by rules)

"AI tools were used for ideation support and boilerplate; the core idea, mechanic and solution are the team's work. The product itself uses AI: an LLM interviews the user and writes their profile, profiles are embedded (OpenAI text-embedding-3-small) and scored by a compatibility model the team trained during the event on synthetic data, and an LLM writes each user's vibe line and an opener for each matched pair."

## Pre-submit checklist (Sun 10:30)

- [ ] Title/description final, team members' names+emails included
- [ ] ≥1 image uploaded (money shot first)
- [ ] Deck exported to PDF, ≤10 slides, English
- [ ] Repo public/judge-accessible, README run instructions work from clean clone
- [ ] Every sentence in description + deck describes the demo or is labelled "production path" (no "computed on device"; AI claims only for parts that run in the build)
- [ ] Stats in slide 2 each have a named source, or were cut
- [ ] Demo link (if included) + credentials
- [ ] Submitted by 10:30 — screenshot the confirmation
