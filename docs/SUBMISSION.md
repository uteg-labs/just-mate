# JustMate — HackYeah submission pack

Hard limits (enforced): title ≤5 words EN · description ≤500 words EN incl. team members · ≥1 image · deck EN PDF ≤10 slides · video ≤60s EN optional · ONE repo, judge-accessible.

| Item | Value |
|---|---|
| Task | OPEN: Sport & Healthcare — loneliness and social connection |
| Pitch structure | Problem → User → Value → Solution → Reality → Ask (HackYeah workshop "Pitch Like an Architect") |
| One-liner | A plan near you, a person who fits, and someone waiting when you get there. |
| Deck | [`submission/JustMate-deck.pdf`](submission/JustMate-deck.pdf) (10 slides, source `submission/deck.html`) |
| Images | [`submission/images/`](submission/images/) — `cover.png` first, then app screenshots in `app/` |
| Website | [`site/index.html`](../site/index.html) |
| Video | Optional; 60 s script in `DEMO.md` › Launch video |
| Repo | https://github.com/uteg-labs/just-mate |

## Title

`JustMate: Meet For Real` (4 words)

## Description (final, 450 words incl. team and sources)

> Loneliness affects 1 in 6 people worldwide and is linked to more than 871,000 deaths a year; lonely people are twice as likely to get depressed [1]. In the EU, 13% feel lonely most or all of the time [2]. People with stronger social relationships have a 50% higher likelihood of survival [3].
>
> The people we build for are young adults new to a city, like Tomek (persona): 28, moved to Kraków for work, works from home, and spends weekends without speaking to anyone. Apps can match him with people. What stops him is the step out of the door: organising anything feels like too much, he fears nobody will come, and photo-first apps make meeting feel like an audition.
>
> JustMate takes those three steps off him. He builds a profile once: Mate (friends, a running or climbing partner) or Date, his interests, and four short questions an LLM writes from his picks. Others see the one-line vibe it writes from his answers, never a photo. The app then proposes one concrete plan with a compatible person: an activity they both picked, a public venue within a 15-minute walk of both, a time they are both free, and the walking time for each. He only taps Accept plan. The plan is on only when both accept, and both phones show "you're both in" at the same moment. Fifteen minutes before the start, a compass opens and guides them to each other with a bearing and a distance bucket, never a position. He can also put out his own plan (a few times, one place), and it is offered to compatible people one at a time. When he is already out, Now pings two compatible people nearby who want the same thing at the same moment.
>
> Health value comes from repeated contact. Friendship takes about 50 hours together [4], so we will measure plans that happen, repeat meetings and an opt-in UCLA-3 loneliness score. JustMate is not therapy, makes no health claims and stores no mood data or location history.
>
> Built and demoed: onboarding with LLM questions and vibe line, plan proposals from real profiles, mutual accept on two phones, compass with haptics, one-tap Vanish for both, profile moderation, age gates, 15 public venues in Kraków, English, Polish and Slovak. Production path: report and block, verification, names unlocking after meeting, "same again next week?", local support lines.
>
> Ask: a 4-week pilot in Kraków with one student community and five partner venues.
>
> Team: Artur Kozubov, Jozef Zvalo, Andrej Zak, Vielkin Serhej, Nikita Orlov.
>
> Sources: [1] WHO, 30 Jun 2025, who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death · [2] JRC EU Loneliness Survey 2022 · [3] Holt-Lunstad et al., PLoS Med 2010, doi.org/10.1371/journal.pmed.1000316 · [4] Hall, JSPR 2018, doi.org/10.1177/0265407518761225

## Sources

Every number in the description, deck and website comes from one of these. Nothing else is quoted.

| # | Claim we use | Source |
|---|---|---|
| 1 | 1 in 6 people affected by loneliness; 871,000+ deaths a year (~100 an hour); lonely people twice as likely to get depressed; 17–21% of 13–29-year-olds lonely | WHO, *Social connection linked to improved health and reduced risk of early death*, 30 June 2025 — https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death (full report: https://www.who.int/groups/commission-on-social-connection/report) |
| 2 | 13% of EU respondents lonely most or all of the time | European Commission JRC, EU Loneliness Survey 2022 — https://joint-research-centre.ec.europa.eu/scientific-activities/survey-methods-and-analysis-centre/loneliness/loneliness-prevalence-eu_en |
| 3 | Stronger social relationships → 50% higher likelihood of survival (148 studies, 308,849 participants) | Holt-Lunstad, Smith, Layton (2010), PLoS Medicine — https://doi.org/10.1371/journal.pmed.1000316 |
| 4 | ~50 hours together from acquaintance to casual friend, ~90 to friend, 200+ to close friend | Hall (2018), Journal of Social and Personal Relationships — https://doi.org/10.1177/0265407518761225 |

Our own assumptions (labelled as such on slide 9, never presented as facts): €39 a month per partner venue, ~€820 a month running cost for one city (`PRODUCT.md` §16.3).

## Deck (10 slides)

1. **Title** — Meet for real. + one-line decision opening + team
2. **Problem** — 1 in 6 · 871,000 · 2× · 13% [1][2]; the friction is the step out of the door
3. **User** — young adults new to a city; Tomek (persona); frictions: initiative · uncertainty · judgment
4. **Value** — capability → behaviour → outcome → evidence; 50 hours to a friend [4]; 50% survival [3]
5. **Solution** — profile → match → plan → both in → walk; Plan for later and Now
6. **Demo** — five steps with screenshots
7. **Design choices** — choice · reason · gain · cost · mitigation
8. **Risk** — risk · mitigation in the build · production path · validation
9. **Reality** — known · assumed · to validate
10. **Ask** — 4-week pilot in Kraków; team; full source links; AI-use disclosure

Re-export after changing `deck.html` or the screenshots:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --allow-file-access-from-files --no-pdf-header-footer --virtual-time-budget=4000 --print-to-pdf=docs/submission/JustMate-deck.pdf "file://$PWD/docs/submission/deck.html"
```

## Images

Upload `submission/images/cover.png` first. App screenshots (`submission/images/app/`, iPhone 17 Pro simulator):

| File | Shows |
|---|---|
| `02-home.png` | Home: your plans, Plan for later, places for you (hero) |
| `03-profile.png` | Your vibe line, no photo |
| `04-sports.png` | Sports picker: running, climbing |
| `05-searching.png` | Now: searching, visible nearby |
| `06-plan-when.png` | Plan for later · when |
| `07-plan-where.png` | Plan for later · where: public venues with walk time |
| `08-plan-review.png` | Plan for later · send it out |
| `09-plans.png` | Plans page with an open invitation |
| `01-welcome.png` | Welcome / log in |

Two-phone moments (plan accepted on both, compass, we met) are shown live on stage.

## What is real and what is production path

Real in the build: onboarding with LLM questions and the vibe line, Plans (proposed, Accept plan, you're both in, Suggest this place, Plan for later offered one person at a time), 15 seeded public venues in Kraków, Now pings on both phones, bearing-only compass with buckets and haptics, Vanish, post-meet, moderation, age gates, en/pl/sk.

Production path (say it out loud): names unlocking after meeting, "same again next week?", keep in touch, status chips, report and block, verification, women-only plans, local support lines, UCLA-3 outcome survey, the learned matching model (`ml/`, trained on synthetic data, not wired in).

## AI-use disclosure (required by rules)

"AI tools were used for ideation support and boilerplate; the core idea, mechanic and solution are the team's work. The product itself uses AI: an LLM (gpt-4o-mini) writes the onboarding questions and turns the answers into the user's vibe line, and OpenAI moderation screens profile answers. Matching and plan proposals use an explainable compatibility score. A learned matching model trained on synthetic data lives in `ml/` as research and is not wired into the server."

## Pre-submit checklist (Sun 10:30)

- [x] Title ≤5 words, description ≤500 words with team members
- [ ] ≥1 image uploaded (`cover.png` first)
- [x] Deck exported to PDF, 10 slides, English
- [ ] Repo public/judge-accessible, README run instructions work from a clean clone
- [x] Every sentence describes the build or says "production path"
- [x] No health claims: "loneliness" and "social connection", never "treats depression" (`PRODUCT.md` §3.1)
- [x] Every number has a linked source (table above) or is labelled as our assumption
- [ ] Submitted by 10:30 — screenshot the confirmation
