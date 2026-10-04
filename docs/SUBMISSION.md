# JustMate — HackYeah submission pack

Hard limits (enforced): title ≤5 words EN · description ≤500 words EN incl. team members · ≥1 image · deck EN PDF ≤10 slides · video ≤60s EN optional · ONE repo, judge-accessible.

| Item | Value |
|---|---|
| Task | OPEN: Sport & Healthcare — loneliness and social connection |
| Story | Loneliness first: hero Tomek, arc couch → yes → door → table → again (`PRODUCT.md` §4.1) |
| Video | The motion launch (Remotion `Launch55`, ~54 s), no filmed video; updated to the new story separately (`DEMO.md` › Launch video) |

## Title

`JustMate: Meet For Real`

## Description (draft, ~355 words — fill team members)

> Loneliness touches one in six people and is linked to about 871,000 deaths a year; lonely people are twice as likely to become depressed (WHO, 2025). Apps solved matching. Nobody solved the door: a lonely person rarely goes out on a whim. They need a reason, a time, a place, and proof that someone will be there.
>
> JustMate is a faceless, walk-to-meet app with three rules: no faces, no chat, no people pins. Users pick Mate or Date and build a faceless profile from interests and a few short questions; an LLM turns the answers into a vibe on a badge, the only thing anyone else sees.
>
> **Plans** get people out of the door. The app proposes one concrete, active plan nearby — a run on Thursday at 19:00 in a park ten minutes away — and shows who it's with as a vibe badge. You only accept. The plan is on once both say yes, and a cancel tells the other side at once. Near the start a compass unlocks for the two of you to find each other. After meeting, first names unlock, the app shows how far you walked to say hi, and one tap asks "same again next week?", because friendships grow from repeat meetings.
>
> **Now** is serendipity for when you're already out. When two compatible people who want the same thing are within walking range, both phones ping at the same moment; if both accept, a hot/cold compass guides them to each other within ten minutes.
>
> Safety is the architecture, not a feature: mutual consent before anything unlocks, zones instead of locations, plans only at public venues, a compass that reveals a bearing and never a pin, 10-minute sessions, no stored location history, and a one-tap Vanish that ends the session for both. Production path: phone and ID verification, report-and-block with an automatic pause, and women-only plans.
>
> JustMate is not therapy and makes no health claims. It is a reason to go out, and someone waiting when you get there. Venues pay to fill off-peak tables; meeting people and staying safe stay free.
>
> Team: [Name Surname — email], [Name Surname — email], [Name Surname — email]

## 10-slide deck outline

1. **Title** — JustMate: Meet For Real + team names
2. **Problem** — loneliness, with sourced numbers only: 1 in 6 lonely, ~871,000 deaths a year, lonely people twice as likely to become depressed (WHO Commission on Social Connection, 2025). Line: "Apps solved matching. Nobody solved the door."
3. **Meet Tomek** — the hero (28, new in Kraków, works from home) + the three barriers: initiative · the empty table · judgment
4. **The idea** — three rules (no faces, no chat, no people pins) + two speeds (Plan / Now) + the badge screenshot
5. **How Plan gets you out** — the app proposes an active plan, you say yes · who it's with as a badge · on once both confirm · *same again next week?* (friendship ≈ 40–60 hours together, Hall 2018); labelled production path: group plans with a go-ahead minimum, leave-at, status chips
6. **Demo** — live: Plans → Accept plan → "you're both in" on both phones → compass → We met → "Say hi to Ola" + distance walked → same again; screenshot strip as the fallback
7. **Safety by design** — mutual / no people pins / public venues / 10-min / Vanish; labelled production path: verification ladder, report = block + automatic pause, meeting point first, women-only plans
8. **Business** — venues fill off-peak tables (primary), JustMate+ (host plans, travel mode), event licensing; never paywall a meeting or safety; one-city estimate at 5,000 monthly active users: ~€820 costs vs ~€2,200 revenue a month
9. **Launch & tech** — plans need an order of magnitude less density than real-time matching, so a city opens with plans; WebSocket session, 400 m distance gate, bearing-only relay, explainable scoring, seeded public venues, Expo app, Bun + Elysia; real-vs-canned honesty line
10. **Credits & licenses** — AI use credited, Apple Maps / Google Maps attribution (shown by the native map), sources (WHO 2025, Hall 2018), test data only

## Screenshots to capture (for gallery + deck)

1. Your badge (onboarding, no photo)
2. Map — Mate select sheet with the **Plans** tile and category bento
3. Plan card: *running · Błonia Meadow · walk time* with the badge
4. The plan turning **on** on two phones side by side (the money shot)
5. Plan page: the venue as the only pin, **Open compass**
6. Compass full-screen (arrow + distance bucket + countdown)
7. Post-meet: *Say hi to Ola* + distance walked + **Same again next week?**
8. Now loop: match card with the vibe badge on two phones (for the Now slide)
9. Vanish button close-up

## AI-use disclosure (required by rules)

"AI tools were used for ideation support and boilerplate; the core idea, mechanic and solution are the team's work. The product itself uses AI: an LLM interviews the user and writes their vibe, and an automated service moderates profiles. Matching and plan proposals use an explainable compatibility score. Profiles are also embedded (OpenAI text-embedding-3-small) for a compatibility model the team trained on synthetic data; that model is not yet used for matching."

## Pre-submit checklist (Sun 10:30)

- [ ] Title/description final, team members' names+emails included, description ≤500 words
- [ ] ≥1 image uploaded (money shot first)
- [ ] Deck exported to PDF, ≤10 slides, English
- [ ] Repo public/judge-accessible, README run instructions work from clean clone
- [ ] Every sentence in description + deck describes the demo or is labelled "production path" (AI claims only for parts that run in the build; bracketed parts above resolved)
- [ ] Every Plans sentence matches what's built; anything not built is retagged in `PRODUCT.md` §17–§18 and said as production path
- [ ] No health claims anywhere: "loneliness" and "social connection", never "treats depression" (`PRODUCT.md` §3.1)
- [ ] Stats on slides each have a named source, or were cut
- [ ] Motion launch updated to the new story, or every line in it still true for the demo
- [ ] Demo link (if included) + credentials
- [ ] Submitted by 10:30 — screenshot the confirmation
