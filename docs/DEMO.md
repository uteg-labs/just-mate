# JustMate — demo & pitch script (HackYeah 2026)

Stage format: ~5 min pitch + ~5 min jury Q&A, 10-slide max. **The wow moment must land inside minute two.**

The story is loneliness, not dating: one hero, **Tomek** (`PRODUCT.md` §4.1), and one arc, **couch → yes → door → table → again**. The live demo shows the Plan loop, the answer to "how do you get a lonely person out of the door?", and ends with the compass walk.

## 5-minute stage script

Structure from the HackYeah workshop "Pitch Like an Architect": **Problem → User → Value → Solution → Reality → Ask**. One slide per beat (`docs/submission/deck.html`). Every number on screen has a source on the slide footer; sources in `SUBMISSION.md` › Sources.

- **0:00 — Problem (slide 2).** "One in six people worldwide is affected by loneliness. WHO links it to more than 871,000 deaths a year, and lonely people are twice as likely to get depressed. In the EU, 13% feel lonely most or all of the time." Then the friction: "The hard part isn't meeting someone online. It's the step out of the door."
- **0:35 — User (slide 3).** "Tomek is 28, moved to Kraków for a job, works from home. Sunday night, he hasn't spoken to anyone all weekend." Three frictions: initiative, uncertainty, judgment.
- **1:00 — Value (slide 4).** "The app makes the plan. He only says yes. The goal is not one meeting but the repeat: friendship takes about 50 hours together. We'll know it works from plans that happen, repeat meetings, and an opt-in UCLA-3 loneliness score."
- **1:30 — Solution + live demo (slides 5–6).** Two presenters, two phones. A is Tomek.
  1. A opens the map, **your plans · 1 new**: B's vibe, an activity, a venue, "9 min for you, 7 for them". A reads it aloud.
  2. A taps **Accept plan** → "waiting for them…". B taps **Accept plan** → both phones turn **you're both in** at the same moment. "He didn't plan anything. He said yes, and he knows someone will be there."
  3. Demo plan starts two minutes after confirmation, so **Open compass** is live. Both open it; B walks; the bucket goes cold, warm, hot, burning; haptics speed up.
  4. They meet centre stage. **We met** → "you found each other".
  5. One line on Now: "Already out? Two compatible people nearby who want the same thing get pinged at once, same compass."
- **3:20 — Design choices (slide 7).** Pick one: "No photos, only a vibe line. It costs us information, especially for dating. We mitigate with an LLM-written vibe and taste training."
- **3:40 — Risk (slide 8).** Stalking, unsafe users, no-shows, empty city: what's in the build, what's production path, how we validate.
- **4:05 — Reality (slide 9).** Known (built and demoed), assumed (people accept app-made plans, venues pay), to validate (show-up rate, repeats, UCLA-3).
- **4:30 — Ask (slide 10).** "Help us run a 4-week pilot in Kraków with one student community and five partner venues. We'll measure show-ups, repeat meetings and UCLA-3."

**Words we use:** loneliness, social connection, the step out of the door. **Words we never use:** "cure", "antidote", "treats depression", "therapy", "mental-health app" (`PRODUCT.md` §3.1). Never say a number without its source.

## Launch video (60 s, optional)

No filmed video required. If made, it is a screen recording of the two simulators plus the deck, English captions, no voice-over needed.

| Time | Picture | On-screen text |
|---|---|---|
| 0–8 s | Slide 2 numbers | "1 in 6 people are affected by loneliness. (WHO, 2025)" |
| 8–14 s | Slide 3 | "The hard part is the step out of the door." |
| 14–24 s | Plan card on phone A | "The app proposes one concrete plan nearby." |
| 24–32 s | Both phones turn "you're both in" | "It's on only when both say yes." |
| 32–44 s | Compass, cold → burning | "A compass walks you to each other. A bearing, never a location." |
| 44–50 s | "you found each other" | "Then do it again. Friendship takes ~50 hours. (Hall, 2018)" |
| 50–60 s | Cover image | "JustMate: Meet For Real · github.com/uteg-labs/just-mate" |

## Demo-mode reality (Tauron Arena)

GPS inside the arena is unreliable, and nobody waits until Thursday on stage — **do not bet the demo on either.**

- **Positions:** a dev-build toggle feeds scripted converging positions through the identical pipeline (plan, compass math, buckets all real). The track is defined relative to the stage (`STAGE_A` / `STAGE_B`, set after seeing the room) because the arrow uses the real magnetometer — a mismatched script makes the arrow point into the audience. For the plan, the same scripted track runs from **Open compass**, so the walk goes cold → warm → hot → burning.
- **Time:** a demo socket's plans start two minutes after they're proposed or confirmed, so **Open compass** (start − 15 min) is reachable live.
- **Ghosts:** never join plans. Demo sockets are only ever proposed to each other.
- Compass heading comes from the device magnetometer (expo-sensors) — verify on both demo phones; if drifty on stage, the arrow rotation still reads perfectly from ~5 m away.

## If Plans isn't green by the freeze (Sun 07:00)

Run the Now demo instead: A picks **Mate → Food and drink → beer → Find people for beer**, both phones ping with the vibe, both **Open compass**, walk, **We met**. Plans then appear only on a slide with mockups, said out loud as **production path**, and `PRODUCT.md` §17–§18 are retagged before the submission.

## Rehearsal checklist

- [ ] 5 full run-throughs with both phones, out loud, someone timing
- [ ] One run-through *on the actual stage orientation* to confirm the arrow points at B, not off-stage
- [ ] Plan time skip tested on both phones from a fresh plan; the plan turns **on** on both phones at the same moment
- [ ] Both demo phones on the same Wi-Fi/hotspot as the laptop running the server; hotspot fallback tested
- [ ] Fallback slide with screenshots of every demo step, in the deck appendix
- [ ] Phones charged + brightness max + do-not-disturb OFF for the demo pair only
- [ ] If the live demo dies: switch to the screenshot slide, keep talking, never debug on stage
- [ ] Presenter never says "it should also…" — only what works, or "production path"

## Jury Q&A prep

- **"How do you get a lonely, maybe depressed person to actually go?"** → We remove the barriers one by one (`PRODUCT.md` §5.1): the app proposes one concrete plan and you only say yes; you see who's coming as badges; a plan only goes ahead when enough people confirm, so nobody walks into an empty café; activities give you something to do besides talking; *same again next week?* turns one meeting into a habit — friendship takes roughly 40–60 hours together (Hall, 2018).
- **"Is this a mental-health app? A medical device?"** → No. It's a social-connection product. We make no health claims, collect no mood or health data, and point to local support lines in the app. Treating a condition would make it a medical device under the EU MDR; getting people out of the house doesn't (`PRODUCT.md` §3.1).
- **"This is a stalker tool."** → It's the opposite by construction: mutual consent before anything unlocks, bearing-not-position compass, zones not pins, plans only at public venues and never browsable by person, 10-min TTL, one-tap Vanish for both, zero history. Grindr's distance-display harms are documented; we designed against exactly that.
- **"How do you protect women specifically?"** → Today: she's invisible until she searches or joins a plan, a dismiss is invisible, Vanish is instant, her name shows only after meeting. Production path: verified-only matching, a verification ladder up to ID, report = block plus automatic pause after two independent reports, meeting point first (the compass leads to a public spot, not to her), women-only plans, trusted-contact share.
- **"What about no-shows?"** → A plan goes ahead only above its minimum; a still-in check an hour before; if it drops below, everyone is told before leaving and gets another plan. Production path: a prepaid first round at partner venues, which also makes people show up.
- **"Cold start / empty rooms killed Sonar and Highlight."** → Plans need an order of magnitude less density than real-time matching: three or four compatible people within a ten-minute walk over two days, not two people in the same minute (`PRODUCT.md` §15). So a new city opens with plans; Now lights up as density grows. Plus density-first launches: one campus, one festival, venue partners.
- **"Why not Timeleft or Meetup?"** → Timeleft proved strangers show up to a concrete plan, but it's fixed weekly slots, paid per seat, anywhere in the city. Meetup needs an organiser and a big room. We're walkable, free for the user, faceless, and the app does the organising.
- **"Why not just happn?"** → happn is retrospective (who you passed 7 days ago), photo-first, chat-gated. We are real-time or planned, faceless, and end in a walk-up, not a chat.
- **"Monetization?"** → Venues pay to fill off-peak tables (primary); JustMate+ for hosting your own plans and travel mode; event licensing. We rejected "five free connections, then pay": it would charge lonely people for the one thing they came for. Back-of-envelope for one city at 5,000 monthly active users: ~€820 running costs vs ~€2,200 revenue a month (estimates).
- **"RODO/GDPR?"** → Location is processed only inside active sessions with explicit consent, never persisted; a plan stores who is going, never where they are; no mood or health data; production path includes a DPIA. In the demo: test data only.
- **"How good is the AI matching really?"** → An LLM interviews you and writes your vibe; matching and plan proposals use an explainable compatibility score we can show on a slide. Honest limit: before launch there are no real meetings to learn from, so any learned scoring model is trained on synthetic labels; real outcomes (met / same again / vanished) replace them in M1. **Under-the-hood (only if the jury leans technical and the stretch shipped):** a Siamese model with a Shared Encoder projecting profile embeddings (OpenAI `text-embedding-3-small`) into 128-d compatibility vectors `zA, zB`, plus a Match Head scoring pairs on `concat(|zA−zB|, zA⊙zB, cos(zA,zB))`, trained jointly with triplet + classification loss on synthetic data. Full pipeline in `docs/ML-MATCHING.md`.
- **"How do you keep minors out of a faceless app?"** → Date has a blocking 18+ gate. Mate admits 16–17-year-olds, but the server only ever matches or groups them with each other, never with an adult. Production needs real age assurance before launch (M1), and plans run only at public venues.
- **"Isn't 'faces I like' biometric data?"** → Yes — which is why it is a production-path item behind a DPIA and two-sided explicit consent, not something the demo runs. Today the demo uses simulated vectors.
