# JustMate — demo & pitch script (HackYeah 2026)

Stage format: ~5 min pitch + ~5 min jury Q&A, 10-slide max. **The wow moment must land inside minute two.**

The story is loneliness, not dating: one hero, **Tomek** (`PRODUCT.md` §4.1), and one arc, **couch → yes → door → table → again**. The live demo shows the Plan loop, the answer to "how do you get a lonely person out of the door?", and ends with the compass walk.

## 5-minute stage script

- **0:00 — Hook.** "One in six people is lonely. Lonely people are twice as likely to become depressed." (WHO Commission on Social Connection, 2025.) "Apps solved matching. Nobody solved the door." Numbers on screen **only with a citable source** (one hostile fact-check sinks the opening).
- **0:30 — Meet Tomek.** One slide. 28, moved to Kraków for a job four months ago, works from home, hasn't said a word out loud all weekend. "He won't organise anything. He's scared nobody would come. And a big Meetup room is worse." The three barriers on screen: **initiative · the empty table · judgment**.
- **1:00 — The idea.** "JustMate has three rules: no faces, no chat, no people pins. And two speeds: **Plan**, for when you need a reason to go, and **Now**, for when you're already out."
- **1:20 — LIVE DEMO: Tomek's Thursday (the wow).** Two presenters, two phones, opposite ends of the stage. A is Tomek.
  1. "Sunday night." A opens the map. Under the bento, **your plans · 1 new**. A taps it: B's vibe badge drops from the island, *"early bird with a film camera — opinions on oat milk"*, with *running · Błonia Meadow* and a different walk time for each of them. A reads it aloud. (The demo pair, Tomek and Ola, share running, and Sports leads Mate, so the plan is a run, not a drink.)
  2. A taps **Accept plan** → "waiting for them…". B taps **Accept plan** → both phones turn "you're both in" at the same moment. "He didn't plan anything. He didn't chat with anyone. He said yes, and he knows someone will be there."
  3. "Thursday, 18:45." (Demo-mode time skip: a demo plan starts two minutes after it's proposed.) The plan page: the venue on the map, "Compass opens 18:45", **Open compass** turns amber.
  4. The stage is the meadow. Both tap **Open compass** → the compass unlocks on both phones. B walks; the arrow rotates; haptics escalate; the crowd watches the bucket go warm, hot, burning.
  5. They meet centre-stage. **We met** → *"Say hi to Ola."* plus how far he walked to say hi. Names unlock, nothing else does. One tap: **Same again next week?** "That's how a friendship starts. And next week he can put one out himself: **Plan for later**, pick a few evenings, pick a place, and the app finds the person."
- **3:20 — Now, in one breath.** Slide with two screenshots: "And when you're already out — a tourist on an evening walk — two compatible people who want the same thing ping at the same moment, and the same compass walks them together." (Lucía, `PRODUCT.md` §4.1.) Live only if the clock allows.
- **3:40 — Safety by design.** Mutual consent before anything unlocks / no people pins / plans only at public venues / 10-minute window / one-tap Vanish. Then, labelled **production path**: verification ladder (phone, selfie, ID), report = block with automatic pause after two independent reports, meeting point first, women-only plans. Preempts the jury's first question.
- **4:05 — Business, 20 s.** "Cafés have empty tables on a Tuesday; we fill them. Venues pay, users meet for free. We never charge for a meeting or for safety." One number: about 21 partner venues cover a city's running costs (`PRODUCT.md` §16.3, estimate).
- **4:25 — Tech, 15 s.** Session-scoped search over one WebSocket, 400 m distance gate for Now, plans from the same explainable compatibility score plus a seeded list of public venues, the server relays a *bearing*, never a position. Expo native app, Bun + Elysia backend. Mention the learned model only if it actually runs.
- **4:40 — Close.** "Not therapy. A reason to go out, and someone waiting when you get there. No swipes. No chat. Meet for real." Team slide.

**Words we use:** loneliness, social connection, getting out of the door. **Words we never use on stage:** "treats depression", "therapy", "mental-health app" (`PRODUCT.md` §3.1).

## Launch video

No filmed video. The submission video is the **motion launch** (Remotion `Launch55`, ~54 s). Its current cut still tells the Now-only story; it gets updated to the loneliness / Plan story separately. Until then, every line in it must describe what the demo does or be labelled production path.

## Demo-mode reality (Tauron Arena)

GPS inside the arena is unreliable, and nobody waits until Thursday on stage — **do not bet the demo on either.**

- **Positions:** a dev-build toggle feeds scripted converging positions through the identical pipeline (plan, compass math, buckets all real). The track is defined relative to the stage (`STAGE_A` / `STAGE_B`, set after seeing the room) because the arrow uses the real magnetometer — a mismatched script makes the arrow point into the audience. For the plan, the same scripted track runs from **Open compass**, so the walk goes cold → warm → hot → burning.
- **Time:** a demo socket's proposals start two minutes after they're proposed, so **Open compass** (start − 15 min) is reachable live. Invitations a demo phone creates keep the times picked in the app.
- **Switching it on:** the server needs `DEMO_MODE=1` (on by default outside production); phone A is built with `EXPO_PUBLIC_DEMO=a`, phone B with `EXPO_PUBLIC_DEMO=b`, both signed in to the same account. Demo phones only ever pair with each other.
- **Ghosts:** never join plans. Demo sockets are only ever proposed to each other.
- Compass heading comes from `Location.watchHeadingAsync` (expo-location) — verify on both demo phones; if drifty on stage, the arrow rotation still reads perfectly from ~5 m away.

## If Plans isn't green by the freeze (Sun 07:00)

Run the Now demo instead: A picks **Mate → Sports → running**, both phones ping with the badge, both **Open compass**, walk, **We met**, *"Say hi to Ola."*, **Same again next week?**. Plans then appear only on a slide with mockups, said out loud as **production path**, and `PRODUCT.md` §17–§18 are retagged before the submission.

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

- **"How do you get a lonely, maybe depressed person to actually go?"** → We remove the barriers one by one (`PRODUCT.md` §5.1): the app proposes one concrete plan and you only say yes; you see who's coming as badges; a plan is on only once both say yes, so nobody walks into an empty café; activities give you something to do besides talking; *same again next week?* turns one meeting into a habit (today a local nudge; the mutual repeat-plan is production path) — friendship takes roughly 40–60 hours together (Hall, 2018).
- **"Is this a mental-health app? A medical device?"** → No. It's a social-connection product. We make no health claims, collect no mood or health data, and point to local support lines in the app. Treating a condition would make it a medical device under the EU MDR; getting people out of the house doesn't (`PRODUCT.md` §3.1).
- **"This is a stalker tool."** → It's the opposite by construction: mutual consent before anything unlocks, bearing-not-position compass, zones not pins, plans only at public venues and never browsable by person, 10-min TTL, one-tap Vanish for both, zero history. Grindr's distance-display harms are documented; we designed against exactly that.
- **"How do you protect women specifically?"** → Today: she's invisible until she searches or joins a plan, a dismiss is invisible, Vanish is instant, her name shows only after meeting. Production path: verified-only matching, a verification ladder up to ID, report = block plus automatic pause after two independent reports, meeting point first (the compass leads to a public spot, not to her), women-only plans, trusted-contact share.
- **"What about no-shows?"** → Today a plan is 1:1 and confirmed only when both say yes; a cancel tells the other side at once. Production path: group plans with a go-ahead minimum, a still-in check an hour before, and a prepaid first round at partner venues, which also makes people show up.
- **"Cold start / empty rooms killed Sonar and Highlight."** → Plans need an order of magnitude less density than real-time matching: three or four compatible people within a ten-minute walk over two days, not two people in the same minute (`PRODUCT.md` §15). So a new city opens with plans; Now lights up as density grows. Plus density-first launches: one campus, one festival, venue partners.
- **"Why not Timeleft or Meetup?"** → Timeleft proved strangers show up to a concrete plan, but it's fixed weekly slots, paid per seat, anywhere in the city. Meetup needs an organiser and a big room. We're walkable, free for the user, faceless, and the app does the organising.
- **"Why not just happn?"** → happn is retrospective (who you passed 7 days ago), photo-first, chat-gated. We are real-time or planned, faceless, and end in a walk-up, not a chat.
- **"Monetization?"** → Venues pay to fill off-peak tables (primary); JustMate+ for hosting your own plans and travel mode; event licensing. We rejected "five free connections, then pay": it would charge lonely people for the one thing they came for. Back-of-envelope for one city at 5,000 monthly active users: ~€820 running costs vs ~€2,200 revenue a month (estimates).
- **"RODO/GDPR?"** → Location is processed only inside active sessions with explicit consent, never persisted; a plan stores who is going, never where they are; no mood or health data; production path includes a DPIA. In the demo: test data only.
- **"How good is the AI matching really?"** → An LLM interviews you and writes your vibe; matching and plan proposals use an explainable compatibility score we can show on a slide. A trained model exists in `ml/` but is not wired into the server, so we don't claim it on stage. Honest limit: before launch there are no real meetings to learn from, so any learned scoring model is trained on synthetic labels; real outcomes (met / same again / vanished) replace them in M1. **Under-the-hood (only if the jury leans technical):** a Siamese model with a shared encoder (`1536 → 256 → 128`) over two OpenAI `text-embedding-3-small` texts per person (who they are, who they want to meet), and a match head scoring one person's target against the other's self, trained with triplet + classification loss on synthetic data. Full pipeline in `docs/ML-MATCHING.md`.
- **"How do you keep minors out of a faceless app?"** → Date has a blocking 18+ gate. Mate admits 16–17-year-olds, but the server only ever matches or groups them with each other, never with an adult. Production needs real age assurance before launch (M1), and plans run only at public venues.
- **"Isn't 'faces I like' biometric data?"** → Yes — which is why it is a production-path item behind a DPIA and two-sided explicit consent, not something the demo runs. Today the demo uses simulated vectors.
