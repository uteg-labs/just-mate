# JustMate — HackYeah submission pack

Hard limits (enforced): title ≤5 words EN · description ≤500 words EN incl. team members · ≥1 image · deck EN PDF ≤10 slides · video ≤60s EN optional · ONE repo, judge-accessible.

| Item | Value |
|---|---|
| Task | OPEN: Sport & Healthcare — loneliness and social connection |
| Pitch structure | Problem → User → Value → Solution → Reality → Next (after the HackYeah workshop "Pitch Like an Architect") |
| One-liner | For anyone lonely in a new city: a plan near you, a person who fits, and someone waiting when you get there. |
| Deck | [`submission/JustMate-Deck.pdf`](submission/JustMate-Deck.pdf) — 10 slides, source [`submission/deck.html`](submission/deck.html) |
| Whitepaper | [`submission/JustMate-Whitepaper.pdf`](submission/JustMate-Whitepaper.pdf) — 22 pages, chapters 00–14 (product, Plan and Now, safety, architecture, matching & AI, engineering, business, roadmap), source [`submission/whitepaper-src/`](submission/whitepaper-src/README.md) (`python3 build.py wp`). `submission/whitepaper.html` is the earlier 10-page short version and is no longer exported. |
| Images | [`submission/cover.png`](submission/cover.png) first, then app screens in [`submission/screens/`](submission/screens/) |
| Website | https://just-mate-site.vercel.app — source in [`site/`](../site/), with the launch film, use-case clips and a waitlist |
| Video | [`video/motion`](../video/motion) — Remotion launch film; script in `DEMO.md` › Launch video |
| Repo | https://github.com/uteg-labs/just-mate |

## Title

`JustMate: Meet For Real` (4 words)

## Description (final, 489 words incl. team and sources)

> Loneliness affects 1 in 6 people worldwide and is linked to more than 871,000 deaths a year; lonely people are twice as likely to get depressed [1]. In the EU, 13% feel lonely most or all of the time [2]. People with stronger social relationships have a 50% higher likelihood of survival [4], and 31% of adults don't get enough physical activity [5].
>
> We build for young adults new to a city, like Tomek (persona): 28, moved to Kraków for work, works from home, and spends weekends without speaking to anyone. Apps can match him with people. What stops him is the step out of the door: organising anything feels like too much, he fears nobody will come, and photo-first apps make meeting feel like an audition.
>
> JustMate takes those steps off him. He builds a profile once: Mate (friends, a running or climbing partner) or Date, his interests, and four short questions an LLM writes from his picks. Others see the one-line vibe it writes, never a photo. The app then proposes one concrete plan with a compatible person: an activity they both picked, a public venue within a 15-minute walk of both, a time they are both free, and the walking time for each. He only taps Accept plan. The plan is on only when both accept, and both phones show "you're both in" at the same moment. Fifteen minutes before the start, a compass guides them to each other with a bearing and a distance bucket, never a position. When they meet, first names unlock and the app shows how far he walked. He can also put out his own plan, offered to compatible people one at a time. When he is already out, Now pings two compatible people nearby who want the same thing at the same moment.
>
> Health value comes from repeated, active, in-person contact: every meeting starts on foot, 16 of 44 Mate activities are sport or outdoors, and friendship takes about 50 hours together [3]. We will measure plans that happen, repeat meetings and an opt-in UCLA-3 loneliness score. JustMate is not therapy, makes no health claims and stores no mood data or location history.
>
> Built and demoed: LLM onboarding and vibe line, plan proposals from real profiles, mutual accept on two phones, compass with haptics, names and distance after meeting, one-tap Vanish, Report that blocks (two reports pause the account), moderation, age gates, support lines in Settings, 18 public venues in Kraków, English, Polish and Slovak, 177 server tests. Production path: "same again next week?" scheduling, verification, group plans.
>
> Next: real users in Kraków, measuring show-ups, repeat meetings and loneliness, and training the matching model on real outcomes.
>
> Team: Arthur Kozubov, Jozef Zvalo, Andrej Zak, Nikita Orlov, Serhii Vielkin.
>
> Sources: [1] WHO, 30 Jun 2025 · [2] JRC EU Loneliness Survey 2022 · [3] Hall, JSPR 2018 · [4] Holt-Lunstad et al., PLoS Med 2010 · [5] WHO, 26 Jun 2024.

## Sources

Every number in the description, deck and website comes from one of these, or is labelled as our estimate.

| # | Claim we use | Source |
|---|---|---|
| 1 | 1 in 6 people affected by loneliness; 871,000+ deaths a year (~100 an hour); lonely people twice as likely to get depressed; 17–21% of 13–29-year-olds lonely | WHO, *Social connection linked to improved health and reduced risk of early death*, 30 June 2025 — https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death (report: https://www.who.int/groups/commission-on-social-connection/report) |
| 2 | 13% of EU respondents lonely most or all of the time | European Commission JRC, EU Loneliness Survey 2022 — https://joint-research-centre.ec.europa.eu/scientific-activities/survey-methods-and-analysis-centre/loneliness/loneliness-prevalence-eu_en |
| 3 | ~50 hours together from acquaintance to casual friend, ~90 to friend, 200+ to close friend | Hall (2018), Journal of Social and Personal Relationships — https://doi.org/10.1177/0265407518761225 |
| 4 | Stronger social relationships → 50% higher likelihood of survival (148 studies, 308,849 participants) | Holt-Lunstad, Smith, Layton (2010), PLoS Medicine — https://doi.org/10.1371/journal.pmed.1000316 |
| 5 | 31% of adults (~1.8 billion) don't meet recommended physical activity | WHO, *Nearly 1.8 billion adults at risk of disease from not doing enough physical activity*, 26 June 2024 — https://www.who.int/news/item/26-06-2024-nearly-1.8-billion-adults-at-risk-of-disease-from-not-doing-enough-physical-activity |

From the repo, not external: 16 of 44 Mate activities are sport or outdoors (`packages/protocol` `CATEGORIES`); 18 public venues (`server/drizzle/0006`, `0008`); 177 server tests (`bun run test`, run in CI); a Siamese model trained on synthetic profiles scores Now matches for real accounts (`ml/`, `server/src/matching/`). We don't quote its synthetic AUC as a quality claim.

Our own estimates (labelled on slide 9, never presented as facts): €39 a month per partner venue, ~€820 a month running cost for one city (`PRODUCT.md` §16.3).

## Deck (10 slides)

1. **Title** — Meet for real. + decision opening (plan or right now) + team; "you're both in" (Plan) and "searching" (Now) screens
2. **Problem** — 1 in 6 · 871,000 · 2× [1] · 31% inactive [5]; the friction is the step out of the door
3. **User** — the quietly lonely in a city, 18–35; 17–21% [1], 13% EU [2]; four use cases: Tomek (Plan, newcomer) · Lucía (Now, solo traveller) · Ania (Now, Date mode) · the shy one
4. **Value** — capability (Plan and Now) → behaviour → outcome → evidence; health · sport · wellbeing [3][4]
5. **Solution** — two loops side by side: Plan (find · plan · both in · walk and meet) and Now (pick · both phones ping · both open compass · walk and meet); one profile; Plan for later
6. **Matching** — our own AI model: who I'd like to meet ↔ who they are, scored both ways; three steps; honest footer (synthetic training data, scores Now, plans use the explainable score)
7. **Design choices · Risk** — choice · why · in the build · cost, and next (four rows: no photos, the app proposes, no one's position, unsafe users)
8. **Reality** — known · assumed · to validate
9. **Business · competition** — B2B2C go-to-market (universities, employers relocating staff, city loneliness programmes), one campus at a time, partner venues ~€39/month vs ~€820/month per city (our estimates); Timeleft · Bumble BFF · Meetup · happn vs JustMate
10. **What's next** — real users in Kraków · measure what matters · learn from real meetings; team; full source links; AI-use disclosure

Re-export after changing `deck.html`, `cover.html`, the screens or `badges/`:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --allow-file-access-from-files --no-pdf-header-footer --virtual-time-budget=6000 --print-to-pdf=docs/submission/JustMate-Deck.pdf "file://$PWD/docs/submission/deck.html"
```

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --allow-file-access-from-files --hide-scrollbars --force-device-scale-factor=1 --window-size=1920,1080 --virtual-time-budget=6000 --screenshot=docs/submission/cover.png "file://$PWD/docs/submission/cover.html"
```

## Images

Upload `submission/cover.png` first, then only the real build captures: `home-places.jpg`, `now-sports.jpg`, `now-searching.jpg`, `profile-vibe.jpg`. The other files in `submission/screens/` are design-prototype captures (they show a match % and a VERIFIED chip the build doesn't have) and are not uploaded.

| File | Shows |
|---|---|
| `home-places.jpg` | Home: your plans, Plan for later, places for you (build) |
| `plan-proposal.jpg` | A plan for you: their vibe, place, time, minutes on foot |
| `plan-bothin.jpg` | you're both in |
| `plan-confirmed.jpg` | Confirmed: compass opens, names unlock when you meet |
| `plan-home.jpg`, `plan-list.jpg` | Your plans · Plans page |
| `plan-what.jpg`, `plan-when.jpg`, `plan-where.jpg`, `plan-review.jpg`, `plan-taker.jpg` | Plan for later, end to end |
| `plan-proposal-date.jpg` | A Date plan |
| `profile-vibe.jpg` | Your vibe line, no photo (build) |
| `now-sports.jpg`, `now-searching.jpg` | Now: sports picker, searching (build) |

Compass and post-meet screens in `video/motion/public/screens/` come from the design prototype; use them only for the film, not as app screenshots.

## What is real and what is production path

Real in the build: LLM onboarding and vibe line; Plans (proposed from profiles and free times, Accept plan, you're both in, Suggest this place, Plan for later offered one person at a time); 18 seeded public venues in Kraków; Now pings on both phones; bearing-only compass with buckets and haptics; post-meet first name and distance walked; Vanish; Report from the compass or after meeting blocks that person and ends the session, two independent reports pause the reported account; moderation; age gates; support lines in Settings; Now matches scored by the Siamese model for real accounts; demo mode (Tomek and Ola, scripted positions, plans starting in 2 minutes); en/pl/sk.

Production path (say it out loud): "same again next week?" scheduling (today a button with a local reply), verification, women-only plans, group plans, push reminders, UCLA-3 outcome survey, retraining the matching model on real meetings.

## AI-use disclosure (required by rules)

"AI tools were used for ideation support and boilerplate; the core idea, mechanic and solution are the team's work. The product itself uses AI: an LLM (gpt-4o-mini) writes the onboarding questions and turns the answers into the user's vibe line, and OpenAI moderation screens profile answers. A Siamese model trained on synthetic profiles scores Now matches for real accounts; plan proposals and the stage demo use an explainable compatibility score."

## Pre-submit checklist (Sun 10:30)

- [x] Title ≤5 words, description ≤500 words with team members
- [ ] ≥1 image uploaded (`cover.png` first)
- [x] Deck exported to PDF, 10 slides, English
- [ ] Repo public/judge-accessible, README run instructions work from a clean clone
- [x] Every sentence describes the build or says "production path"
- [x] No health claims: "loneliness" and "social connection", never "treats depression" (`PRODUCT.md` §3.1)
- [x] Every number has a linked source (table above) or is labelled as our estimate
- [ ] Submitted by 10:30 — screenshot the confirmation
