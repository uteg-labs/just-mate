# JustMate — product definition

> **Meet for real.**
> JustMate helps two compatible strangers who want the same thing *right now* find each other in the real world — faceless, mutual, and on foot.

## 1. Elevator pitch (30 seconds)

Dating apps solved matching and broke meeting. JustMate replaces swiping and chatting with one mechanic: you carry a faceless profile of *what you want to do and who you'd like to do it with*; when a compatible person — also looking for the same thing, also within walking range — is near you, both phones ping at the same moment, each showing the other's vibe badge: a one-line vibe and what they want. Both accept, a compass unlocks, and finding each other becomes a ten-minute game that ends with two people talking face to face. No faces. No chat. No pins.

## 2. Problem & vision

**The problem.** Matching is solved; meeting is broken. People swipe alone at home, chat for weeks, and never meet — while loneliness is a declared public-health issue (WHO 2023; US Surgeon General 2023: health impact equivalent to 15 cigarettes a day). Existing apps monetize attention spent *on the phone*; their incentive is the opposite of getting you outside.

**Why existing formats fail:**

| Format | Failure mode |
|---|---|
| Swipe apps (Tinder, Bumble) | Photo-first judgment; chat purgatory; meetings are the exception |
| Scheduled dating (Breeze, Timeleft) | Real meetings, but planned hours/days ahead — zero serendipity |
| Proximity dating (happn) | Retrospective ("who you passed 7 days ago"), photo-first, chat-gated |
| Ambient proximity (Highlight, Sonar — dead) | Always-on creepiness, battery drain, empty rooms, safety gaps |
| Activity platforms (Meetup) | Scheduled groups; not "I want a beer buddy *now*" |

**Vision.** A generation that meets by walking toward each other, not by swiping. The phone's job ends where the conversation starts: *the interface is the street.*

## 3. The three rules (product constitution)

1. **No faces.** No profile photos anywhere. Attraction is a private, on-device compatibility vector, never a picture to be judged. Kills the appearance economy and the mirror-anxiety of profile curation.
2. **No chat.** There is no messaging. The product's success event is a real conversation; every feature points at it. The match output is *legs, not thumbs*. Names unlock only after you've met; keeping in touch is a mutual save, not a chat.
3. **No pins.** Location is never a point — only zones (geohash cells) with anonymous density glow. Nobody can be found, followed, or looked up. Ever.

Every feature decision is tested against these three rules; anything that violates one is out by definition.

## 4. Personas & user stories

- **Ania, 24, Kraków, student.** Deleted Tinder twice; tired of being judged on photos and of chats that die. *"When I'm at a festival, I switch on search — compatible people can find me without knowing who I am. If I like the vibe walking up, great; if not, I vanish."*
- **Tomek, 28, relocated for work, knows nobody.** *"I want a beer buddy tonight, not a girlfriend. I don't want to browse people — I want the app to tell me: someone's 200 m away, they also want a beer, go."*
- **Marta, 31, safety-conscious.** *"Serendipity without creepiness: no stranger ever knows where I am unless I said 'now, this person, yes' — and I can end that instantly."*
- **Secondary:** conference/festival attendees ("find a co-founder to talk to in the coffee queue"), travelers, newcomers to a city.

## 5. The core loop

1. **Profile once (about two minutes).** Pick a mode, **Date** or **Mate**. Then your first name (revealed only after you've met), interests (at least 3, each opening related ones), and four short questions written live from your answers. The answers become a one-line **vibe** on a lanyard **badge** whose colours and pattern are designed from your picks. That badge is all a match ever sees. Then who you're after, and either a sample-photo swipe that trains your taste on the phone (date) or when you're usually around (mate). Last, a one-selfie liveness check (production path). No photo of you is ever shown to anyone.
2. **Pick what you're up for and search, deliberately, per occasion.** Default is invisible. On the map you choose Date or Mate, open a category (Food and drink, Nightlife, Sports, Games…), pick one or more things inside it, and tap **Find people for {picks}**. Battery, privacy and intent in one action; what you picked is the session's context, not a profile attribute. This is the anti-Highlight: session-scoped, never ambient. (`STRUCTURE.md` §2–3.)
3. **Watch the map warm up.** A soft heat field shows where compatible people are searching for the same thing. No list, no search field, no browsing. Scarcity of information is the feature.
4. **The ping (the product's heartbeat).** Two compatible people, both searching, picks aligned, within walking range (400 m, see §7) → both phones ping at the same moment. Each sees the other's badge: "her vibe · wants: wine" and their vibe line, with a 45-second countdown.
5. **Mutual accept → compass unlocks.** Only if both tap **Open compass**. Either alone sees nothing more ("waiting for them…").
6. **The walk.** A directional arrow with hot/cold colour and haptics. Distance is a bucket (cold / warm / hot / burning), never a map pin of the other person. 10-minute window.
7. **Meet. Talk.** At `burning` either taps **We met**. Names unlock ("Say hi to Mia."), an opener is offered if you need one, and **Keep in touch** saves the contact only if both tap it. Then the session ends and positions are discarded.
8. **Either can Vanish** at any moment, and the session is destroyed for both instantly.

## 6. Screen specification

`STRUCTURE.md` is the source of truth for screens, flows and exact copy. Visual language, motion, haptics and accessibility live in `DESIGN.md`: a pale map with warm glow, light by default, an ink match card and a night compass. Colours named here are its tokens. This section keeps the product reasoning per screen.

### 6.1 Account and onboarding

- **Auth**: one sheet over the map. Log in goes straight to the map; Create account grows into onboarding ("Next: a faceless profile. Two minutes, no photos of you shown to anyone.").
- **Mode first.** "What are you here for?" Date ("Someone to fall for, a few streets away.") or Mate ("People to grab a beer or a game with, right now."). You can switch on the map any time; the mode picks which questions, interests and categories you see.
- **Interests** are per mode (date: coffee, wine, cinema, books, travel…; mate: board games, climbing, running, gym, football…). At least 3; each pick opens 3 related ones.
- **Four live questions** replace a long form: each is written from the previous answers, with fixed sample questions as the fallback. They feed the vibe line and the matching profile (`ML-MATCHING.md` §2).
- **Your badge**: "Designed from your picks. All a match sees." Reroll the line until it fits, then **Keep this vibe**.
- **Who you're after**: date asks who you're interested in, an age range and what you're looking for ("something real / see where it goes / something light"). Mate asks who (anyone / same gender), group size, energy and age. "Used for matching only. Nobody sees your settings."
- **Who catches your eye** (date): swipe six *sample* photos, never real users. "Your taste trains on this phone and never leaves it." This is the attraction-vector story (§7) made tangible. In M0 the taste stays on the phone and the server never sees it.
- **When are you around** (mate): time slots and hangout length to time matches.
- **Verify**: "One selfie, checked once, then deleted. Nobody ever sees it." Date adds the required **"I'm 18 or older"** check ("Required for dating. Checked against your selfie."). The selfie check is labelled "production path · simulated in this build".

Design intent: the whole funnel communicates "this is not a profile-picture app" before the user ever sees the map.

### 6.2 Select: "What are you up for?"

- Pale greyscale native base map (`expo-maps`: Apple Maps on iOS, Google Maps on Android). Own position is the small mint dot; no other dots, ever.
- Date / Mate switch on the map. A sheet with a rotating headline, a footnote and a **category bento**: six categories per mode, each opening into a card of concrete intents plus "other". Pick any number, then **Find people for {picks}**. Until then: "You're invisible until you pick something."
- Date categories: Food and drink · Nightlife · Outdoors · Culture · Music · Attractions. Mate: Food and drink · Sports · Games · Outdoors · Music · Culture. Full lists in `STRUCTURE.md` §2.

### 6.3 Search

- The heat field appears: an aggregate warmth where compatible searchers are, never per-person marks. Zone tap → aggregate only ("~4 compatible around here"). No identities, no profiles, no history.
- The sheet says what you're looking for, lets you adjust picks, and shows "You're visible nearby · Both phones ping at once when it's mutual." with a running clock. **Stop searching** goes back to invisible; searching also stops by itself after 30 minutes (Settings).

### 6.4 Match (arrives on both phones simultaneously)

- An ink card from the top with their **vibe badge**: "her vibe · wants: wine", their line (*"reads the menu twice — orders the first thing"*), tag "verified · 18+" (date) or "verified" (mate).
- "match · nearby · on foot" and a countdown from **0:45**.
- **[ Open compass ]**: amber `glow` button; **[ Dismiss ]**: ghost button.
- Caption: *"unlocks only if they accept too"*. Consent made visible.
- Vibration `[200,100,200]` on arrival (expo-haptics; delivered over the live WebSocket while the app is open; no remote push in M0, see §8).
- **Offer TTL: 45 s.** If the other side dismisses or doesn't answer, the card quietly turns into *"offer expired"* and *"you're still searching"*. It never says "they declined", so a dismiss is invisible by construction. Pair cooldown applies either way.
- No match percentage on screen: the badge and the shared intent carry the moment.

### 6.5 Compass (full screen, night)

- **Arrow**: large, rotation = bearing(me→partner) − device heading. It points the way; the partner's position is *never* drawn on the map.
- **Distance as bucket** (gamified, deliberately imprecise): `cold` (over 200 m, blue `tempCold`) → `warm` (under 200 m, amber `tempWarm`) → `hot` (under 80 m, orange `tempHot`) → `burning` (under 30 m, white-hot `tempBurning`). Colour + label + haptic escalation. Red is reserved for Vanish.
- **Countdown**: "10:00 left · {intent}", always visible.
- Their vibe line stays pinned ("you're looking for").
- **Vanish**: always-visible red control; kills the session for both, instantly.
- **We met**: enabled only in `burning`.
- States: `waiting` (partner accepted but no position yet: "finding signal…"), `active`, `expired` (TTL), `vanished`.

### 6.6 Post-meet

- **Names unlock, nothing else does.** Both badges, now with first names; "Say hi to {name}."
- An opener for the pair if the conversation needs a push (*"pineapple. defend your position."*).
- **Keep in touch** is mutual: it only completes if both tap it ("{name} tapped it too. Saved on this phone."). Still no chat: it saves the other person on your phone, nothing more.
- Post-meet (future): optional one-tap "how did it go?" to tune matching.

### 6.7 Settings

Profile (name, interests, questions and vibe, who you're after, appearance taste or when you're around: each reopens its onboarding step), the map (start mode, walk up to 5 / 10 / 15 min, auto-stop after 30 min), feel (haptics, sounds, reduce motion), privacy and safety (taste and photos stay on this phone, blocked people, download my data), account (email, log out, delete account).

## 7. Matching system

**Data model.** `user = { id, mode, name, interests[], answers[], vibe, prefs (date: seek, age, looking · mate: who, group, energy, age, when, length), verified, adult, attractionVector (private, on-device), session: { mode, category, intents[], state } }` — in M0 nothing is persisted server-side beyond the live socket. (The stretch ML service keeps a per-user embedding cache in pgvector — profile vectors, never positions; see below.)

**Explainable scoring (M0 primary).** A transparent function, served by the Elysia backend, is what runs in the demo and what we defend in Q&A:

```
compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)
match  ⇔ both searching ∧ dist(a, b) ≤ R_MATCH (400 m) ∧ shared intent ≥ 1 ∧ compat ≥ 0.45
```

- **Mode and intents gate, interests score.** Both people must be searching in the same mode, and their picks must share at least one intent; that shared intent is the *context* of the match ("this is a beer match"). Interests and answers set the compatibility score. The score gates the match but isn't shown on screen.
- **Distance, not zone, is the match gate.** The server holds exact positions anyway; zones are a *display* abstraction (see §8). Matching on "same geohash cell" would (a) pair people up to 1.35 km apart — more than the ~830 m a person walks in the 10-minute window at 5 km/h — and (b) never pair two people 50 m apart on either side of a cell boundary. `R_MATCH = 400 m` ≈ 5 min on foot, leaving half the window for finding each other.
- **Offer TTL 45 s**, then the offer expires silently for both (see §6.4).
- **Pair cooldown: 5 min** after any match/dismiss/expiry/vanish — no re-pinging the same person, no notification spam.
- **One active session per user.**
- **Ghost users never match.** Ghosts (server-spawned wanderers that add zone density) carry `ghost: true` and are excluded from candidate pairs — otherwise a demo phone can be offered a ghost instead of the other demo phone.

**Hard gates (server-side, NOT learned).** Whatever scores the pair — the formula above or the stretch model — only sees pairs that have already passed: both searching · `dist ≤ R_MATCH` (400 m) · shared active intent ≥ 1 · K-anonymity of the *zone* (M0: K=1 demo, M1: K=3) · pair cooldown · one active session/offer · not self · not a ghost. The scorer focuses purely on "given shared intent X, how compatible are they on it". (Same table in `docs/ML-MATCHING.md` §7 and `docs/PROTOCOL.md`.)

**Compatibility model (M1+ — post-hackathon, documented, not in M0 demo).** A Siamese model with a Match Head, custom-trained by the team. Profile text (intents + interests + vibe card) is embedded via OpenAI `text-embedding-3-small` (frozen), passed through a learned **Shared Encoder** that projects to 128-d compatibility vectors `z_a`, `z_b`, then through a **Match Head** that consumes `concat(|z_a − z_b|, z_a ⊙ z_b, cos(z_a, z_b))` (257-d) and outputs a pairwise compatibility score in `[0, 1]`. Trained with **triplet loss + binary match loss** jointly (one triplet yields two training examples for the head).

- **Serving.** The trained Match Head is **exported to ONNX** and loaded by a **compiled C++ binary** (`match_scorer`, linked against `onnxruntime`) that the Bun/Elysia server **spawns once at startup as a long-lived subprocess**. The server and the binary live on the same machine and exchange requests/responses as **newline-delimited JSON over stdin/stdout** — no FastAPI, no HTTP, no socket plumbing between them. Vectors (`e` and `z`) are cached per user in **PostgreSQL with pgvector**; the binary only receives the pre-computed `z` pairs and runs the head. Match Head weights are loaded once when the binary boots; per-pair inference does NOT re-encode — it reads cached `z` from pgvector and runs only the head. If the subprocess is down or returns malformed/timeout JSON, the server transparently falls back to the explainable baseline (the demo never breaks).
- **Training data.** M0 / HackYeah 2026: synthetic profiles + rule-based ground truth (the explainable baseline + noise) — honest-proxy training. M1: real interaction outcomes (mutual accept + met → 1; dismissed/vanished → 0).
- **Threshold.** The `0.45` rule above applies to the explainable baseline. The neural model uses a **separately calibrated** threshold on a held-out synthetic set (target: FPR ≤ 5%, TPR ≥ 80%). Documented in the model card.
- **Fallback.** If the ML service is unavailable, the server transparently falls back to the explainable baseline. The demo never breaks.
- **Honesty on stage.** In M0, with synthetic data only, a learned model just learns the baseline. We do not say "AI matching" about something that is not learned from real signal — the explainable function stays the headline; the model card + `docs/ML-MATCHING.md` describe the *real* M1 pipeline.
- Full pipeline, training loop, file layout, and M1 roadmap: see `docs/ML-MATCHING.md`.

**Attraction vector (the no-faces trick — production path, one sentence on stage).** Users never publish photos. In production, a user may *privately* train an on-device embedding of "faces I like" (their own examples, never uploaded); during matching only a scalar similarity to the other's on-device vector is exchanged — a number, never an image. Hackathon demo: deterministic simulated vectors; the claim in the pitch is the architecture, demonstrated honestly as canned. **Legal caveat (do not improvise on stage):** anything derived from a face is biometric data under GDPR Art. 9 (special category) even in derived form, so the production design needs a DPIA and likely explicit consent on *both* sides before any similarity is computed. On stage it stays a one-liner labelled "production path"; the demo never claims it runs.

**Vibe lines and badges.** One wry line in two lowercase clauses (*"quietly funny — will out-argue you about pizza"*), written from your onboarding answers, rerolled until you keep it. It hangs on a badge whose colours, pattern and icon are designed deterministically from your interests and answers (`DESIGN.md` §13.5). At the match moment you see *their* badge; after you've met, an opener written for the pair replaces "hey". Demo: canned lines and openers, deterministic per user. Production: generated (Bielik/LLM) from the profile, cached per user, moderated.

## 8. Zones & location architecture

- **Zone = geohash precision 6** (~1.2 km × 0.6 km at Kraków's latitude) — the *display* unit: big enough for anonymity (a glow never points at one person). Zones are not the match unit; matching is by distance (`R_MATCH`, §7), so cell boundaries never split two nearby people.
- **Glow semantics:** count of *search-mode* users in the cell, rendered as size/brightness. Zones with fewer than **K=3** searching users stay dark (k-anonymity in production; demo shows all) — you can't follow a glow to *the only* person in it.
- **Data flow:** client sends position every ~2 s (while searching) → server keeps it in-memory keyed by socket → computes zone → matches → relays position *only* between mutually-accepted partners *only* during the session → everything discarded on disconnect/vanish/TTL. No database. No history. No logs of positions.
- **Transport: one WebSocket per client** (Elysia `ws`), message schema in `docs/PROTOCOL.md`. All real-time events — zones, match offer, partner position, expiry — ride this socket. **No remote push in M0:** the app is in the foreground whenever search mode is on (that is the product), so push adds EAS/APNs/FCM setup time and a failure mode without adding anything the jury can see. Remote push is an M1 item (search mode in background).
- **Demo mode:** scripted converging positions driven by a dev-build toggle (indoor GPS reality); identical pipeline. Scripted coordinates are expressed relative to the stage (A = stage-left end, B = stage-right end, both facing the audience) because the compass arrow uses the *real* magnetometer heading — if the scripted bearing does not match the physical layout, the arrow visibly points off-stage.

## 9. Match session lifecycle (state machine)

```
idle (invisible) → searching → [match offered ⇉ both phones, offer TTL 45 s]
     → both accept ⇉ compass active (10 min TTL, positions relayed pairwise)
     │                → we met → post-meet (names unlock · keep in touch if both tap) → idle
     │                → TTL expiry | either vanishes → idle
     └→ dismiss | offer expiry (either side; the other side sees only "expired")
          → cooldown (5 min per pair) → still searching
searching → stop searching | 30 min auto-stop → idle
```

Full event-by-event schema (client ↔ server) is in `docs/PROTOCOL.md`; it is the contract mobile and backend build against independently.

## 10. Safety & privacy by design (threat model)

| Threat | Countermeasure |
|---|---|
| Stalker follows a specific person | No identity, no search, no browsing; zones not pins; glow is aggregate (k-anonymity); nothing discoverable when search is off |
| Compass abused to locate someone | Unlocks only after **mutual** accept; reveals a *bearing*, never a map position; 10-min TTL; partner sees the same compass (symmetry — they know you're walking too) |
| Harassment | No chat = no DM channel; exposure is session-scoped; block & report (production) kill future matches pair-wide |
| Data breach / subpoena | Positions never persisted — in-memory per socket only; nothing to leak |
| Notification fatigue / ambush pings | Both parties opted in *per occasion* (category + intent pick + Find people); pair cooldown; one active session |
| Women's safety specifically | She is invisible unless she starts a search; she can dismiss any match invisibly (offer simply "expires" on the other side); Vanish is one tap and instant; her name is only shown after she has met someone in person |
| Fake or bot profiles | One-selfie liveness check, deleted after the check (production path in M0); a "verified" tag on the badge |
| Minors | No photos and no identity means no implicit age signal → explicit, blocking **"I'm 18 or older"** check on the date verify step, "checked against your selfie" (selfie check is production path in M0); the server still requires `adult: true` on every connection, for Mate too (open decision in `STRUCTURE.md` › Protocol gaps); production: age assurance appropriate to a dating product (M1) |

GDPR/RODO posture: location is personal data → processed solely inside explicit, session-scoped consent; no storage; production path includes a DPIA. Demo runs on test data only.

## 11. Gamification layer

**Core (hackathon):** the compass walk itself — hot/cold buckets, haptic escalation, the 10-minute window creating urgency, the vibe badge as loot (designed from your picks, no two alike, dropping in on a lanyard), and the reveal at the end: a first name and an opener.

**Planned (post-hackathon, in priority order):**
- **Brave streak**: consecutive weeks with ≥1 real meeting; gentle decay, no leaderboards (anti-attention-economy).
- **Zone heat events**: "this district is glowing tonight" — city-scale serendipity weather.
- **Icebreaker packs**: themed card packs (travel / music / sport) users can equip.

Deliberately excluded: points, ads, streak-guilt, leaderboards — gamification serves courage, not retention.

## 12. Competitive positioning

| | JustMate | happn | Breeze | Tinder | Meetup |
|---|---|---|---|---|---|
| Real-time proximity | ✅ live zones | ⚠ retrospective | ❌ | ❌ | ❌ |
| Faceless | ✅ core | ❌ | ❌ | ❌ | n/a |
| Ends in chat | ❌ ends IRL | ✅ | ❌ (skips chat) | ✅ | ⚠ |
| Serendipitous ("now") | ✅ | ⚠ | ❌ scheduled | ❌ | ❌ |
| Consent architecture | ✅ mutual+zones | ⚠ | ✅ | ❌ | n/a |

Wedge: **consented serendipity** — the four validated quarters (proximity / skip-chat / faceless / live maps) assembled into one walk.

## 13. Anti-goals (what JustMate will never do)

Chat. Photo profiles. Browsing/searching people. Followers, likes, feeds. Ads in the meeting flow. Selling attention. The app's success metric *decreases* phone usage — we build for that.

## 14. Success metrics

- **North star:** completed real-world meetings per active user per week.
- Secondary: search-mode minutes (out of home), match→meet conversion, repeat meetings.
- **Guardrails:** vanish rate (<10% — safety/quality signal), notification opt-out rate, session completion.
- Anti-metric watched on purpose: time-in-app should *not* grow — engagement is measured on the street, not the screen.

## 15. Launch & density strategy (the cold-start answer)

1. **Single-density launches:** one campus, one festival, one city district — anywhere the zone glow is genuinely populated from day one.
2. **Event mode:** festivals/conferences pre-seed official zones (a known, opt-in crowd — the perfect first market).
3. **Venue partnerships:** breweries, cafés, climbing gyms host and promote zones ("first beer" promos) — B2B seeds density and revenue at once.
4. **Ambassadors:** campus societies, expat communities.

The 2012 graveyard (Sonar, Highlight) died of empty rooms; JustMate launches where rooms are already full — and its zone glow, being aggregate, makes even a small crowd feel alive.

## 16. Business model

- **B2B venues & events** (primary): hosting/promoting zones, "first round" promos, event licensing.
- **Consumer premium** (secondary, later): icebreaker packs, multi-city travel mode. Core matching and all safety features stay free forever (safety is never paywalled).

## 17. Roadmap

| Stage | Scope |
|---|---|
| **M0 — HackYeah 2026** (this repo) | Expo dev-client app (Date / Mate modes, category picks, vibe badge, WebSocket events, magnetometer compass, haptics, 18+ gate, post-meet with names and keep in touch), Bun/Elysia backend (ws, distance-gated matching, offer/session TTLs, ghosts), explainable scoring, demo mode; learned model v0 only if time remains after Sat 19:00 |
| **M1 — production MVP** | remote push (background search mode), k-anonymity (K≥3), block/report, age assurance, persistence-free audit, DPIA, E2E position encryption between paired sessions, model v1 (real interaction data) |
| **v1** | On-device attraction vector (train-on-phone), generated vibe lines and openers (Bielik/LLM), brave streaks |
| **v2** | Venue/event platform (official zones, analytics), city heat events |

## 18. Demo scope & honesty

See README ("What's real vs canned"). Everything presentation-critical is real: profiles, zones from live positions, mutual match delivered live to both phones over WebSocket, explainable scoring, compass bearing, haptics, vanish. Everything auxiliary is honestly canned: ghost density, vibe-card strings, demo-mode positions; the attraction vector is simulated and the learned model (if shown) is trained on synthetic data. Rule for every sentence in the deck and the description: **it describes what the demo does, or it is labelled "production path".**
