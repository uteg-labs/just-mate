# just-mate — product definition

> **Meet for real.**
> just-mate helps two compatible strangers who want the same thing *right now* find each other in the real world — faceless, mutual, and on foot.

## 1. Elevator pitch (30 seconds)

Dating apps solved matching and broke meeting. just-mate replaces swiping and chatting with one mechanic: you carry a faceless profile of *what you want to do and who you'd like to do it with*; when a compatible person — also looking, also nearby — enters your zone, both phones ping at the same moment, each showing a two-line vibe card of the other. Both accept, a compass unlocks, and finding each other becomes a ten-minute game that ends with two people talking face to face. No faces. No chat. No pins.

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
2. **No chat.** There is no messaging. The product's success event is a real conversation; every feature points at it. The match output is *legs, not thumbs*.
3. **No pins.** Location is never a point — only zones (geohash cells) with anonymous density glow. Nobody can be found, followed, or looked up. Ever.

Every feature decision is tested against these three rules; anything that violates one is out by definition.

## 4. Personas & user stories

- **Ania, 24, Kraków, student.** Deleted Tinder twice; tired of being judged on photos and of chats that die. *"When I'm at a festival, I switch on search — compatible people can find me without knowing who I am. If I like the vibe walking up, great; if not, I vanish."*
- **Tomek, 28, relocated for work, knows nobody.** *"I want a beer buddy tonight, not a girlfriend. I don't want to browse people — I want the app to tell me: someone's 200 m away, they also want a beer, go."*
- **Marta, 31, safety-conscious.** *"Serendipity without creepiness: no stranger ever knows where I am unless I said 'now, this person, yes' — and I can end that instantly."*
- **Secondary:** conference/festival attendees ("find a co-founder to talk to in the coffee queue"), travelers, newcomers to a city.

## 5. The core loop

1. **Profile once (3 minutes).** Interests + the private attraction setup (explain-only in M0). No photo, no nickname needed.
2. **Pick tonight's intent — deliberately, per occasion.** Home is a Bolt-style "Where to?" sheet: Soul mate · Beer · Coffee · Attractions · Friends · Sports · Music. Tap **Find people** and you're searching for exactly that; the default state is invisible. Battery, privacy, and intent in one action — the anti-Highlight: session-scoped, never ambient.
3. **Watch zones glow.** The map lights geohash zones by the density of *compatible* searchers for your intent. No list, no search field, no browsing — scarcity of information is the feature.
4. **The ping (the product's heartbeat).** Two compatible people, both searching, intents aligned, same zone → both phones notify simultaneously: match %, shared intent ("wants: beer"), and a 2-line vibe card of the other person.
5. **Mutual accept → compass unlocks.** Only if both tap "open compass". Either alone sees nothing more.
6. **The walk.** A directional arrow with hot/cold color and haptics; distance as a bucket (cold/warm/hot/burning), never a map pin of the other person. 10-minute window.
7. **Meet. Talk.** The vibe card doubles as the icebreaker. Afterward, session ends; positions are discarded.
8. **Either can Vanish** at any moment — session destroyed for both instantly.

## 6. Screens & flows

Four surfaces: **Onboarding** (faceless profile), **Home — "Where to?"** (Bolt-style fullscreen map + intent sheet: zones glow as a heatmap of compatible people), the **Match overlay**, and **Compass**. Full screen specs, use cases, sequence flows, and the client↔server message contract live in `STRUCTURE.md` — the source of truth for the mobile app. Visual language, motion, haptics and accessibility live in `DESIGN.md` (Apple fluid-interface principles applied to a dark map with warm glow).

## 7. Matching system

**Data model.** `user = { id, interests[], attractionVector (private) }` + `session = { activeIntents[], ttl }` — intents are picked per occasion on Home; interests/attraction live on the profile. Nothing persisted server-side beyond the live socket.

**Compatibility model (primary).** A small model, custom-trained by the team, served by the Elysia backend: preference/intent/interest data → pairwise match score. Trained during the event; the transparent function below stays as the explainable baseline and cold-start fallback (and as the sanity check in Q&A).

**Explainable baseline:**

```
compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)
match  ⇔ both searching ∧ same zone ∧ shared active intent ≥ 1 ∧ compat ≥ 0.45
```

- **Intents gate, interests score.** The shared intent is the *context* of the match ("this is a beer match"), interests set the percentage.
- **Pair cooldown: 5 min** after any match/dismiss/vanish — no re-pinging the same person, no notification spam.
- **One active session per user.**

**Attraction vector (the no-faces trick).** Users never publish photos. In production, a user may *privately* train an on-device embedding of "faces I like" (their own examples, never uploaded); during matching only a scalar similarity to the other's on-device vector is exchanged — a number, never an image. Hackathon demo: deterministic simulated vectors; the claim in the pitch is the architecture, demonstrated honestly as canned.

**Vibe cards.** Two-line personality summaries shown at the match moment — the icebreaker that replaces "hey". Demo: canned vibe pairs, deterministic per user. Production: generated (Bielik/LLM) from the profile, cached per user, moderated.

## 8. Zones & location architecture

- **Zone = geohash precision 6** (~1.2 km × 0.6 km at Kraków's latitude): big enough for anonymity, small enough for "walkable now".
- **Glow semantics:** count of *search-mode* users in the cell, rendered as size/brightness. Zones with fewer than **K=3** searching users stay dark (k-anonymity in production; demo shows all) — you can't follow a glow to *the only* person in it.
- **Data flow:** client sends position every ~2 s (while searching) → server keeps it in-memory keyed by socket → computes zone → matches → relays position *only* between mutually-accepted partners *only* during the session → everything discarded on disconnect/vanish/TTL. No database. No history. No logs of positions.
- **Demo mode:** scripted converging positions driven by a dev-build toggle (indoor GPS reality); identical pipeline.

## 9. Match session lifecycle (state machine)

```
idle → searching → [match offered ⇉ both phones]
     → both accept ⇉ compass active (10 min TTL, positions relayed pairwise)
     → meet | TTL expiry | either vanishes
     → cooldown(5 min per pair) → idle
```

## 10. Safety & privacy by design (threat model)

| Threat | Countermeasure |
|---|---|
| Stalker follows a specific person | No identity, no search, no browsing; zones not pins; glow is aggregate (k-anonymity); nothing discoverable when search is off |
| Compass abused to locate someone | Unlocks only after **mutual** accept; reveals a *bearing*, never a map position; 10-min TTL; partner sees the same compass (symmetry — they know you're walking too) |
| Harassment | No chat = no DM channel; exposure is session-scoped; block & report (production) kill future matches pair-wide |
| Data breach / subpoena | Positions never persisted — in-memory per socket only; nothing to leak |
| Notification fatigue / ambush pings | Both parties opted in *per occasion* (intent pick); pair cooldown; one active session |
| Women's safety specifically | She is invisible unless she switches search on; she can dismiss any match invisibly; Vanish is one tap and instant |

GDPR/RODO posture: location is personal data → processed solely inside explicit, session-scoped consent; no storage; production path includes a DPIA. Demo runs on test data only.

## 11. Gamification layer

**Core (hackathon):** the compass walk itself — hot/cold buckets, haptic escalation, the 10-minute window creating urgency, and the vibe card as loot ("you found: *quietly funny, will out-argue you about pizza*").

**Planned (post-hackathon, in priority order):**
- **Brave streak**: consecutive weeks with ≥1 real meeting; gentle decay, no leaderboards (anti-attention-economy).
- **Zone heat events**: "this district is glowing tonight" — city-scale serendipity weather.
- **Icebreaker packs**: themed card packs (travel / music / sport) users can equip.

Deliberately excluded: points, ads, streak-guilt, leaderboards — gamification serves courage, not retention.

## 12. Competitive positioning

| | just-mate | happn | Breeze | Tinder | Meetup |
|---|---|---|---|---|---|
| Real-time proximity | ✅ live zones | ⚠ retrospective | ❌ | ❌ | ❌ |
| Faceless | ✅ core | ❌ | ❌ | ❌ | n/a |
| Ends in chat | ❌ ends IRL | ✅ | ❌ (skips chat) | ✅ | ⚠ |
| Serendipitous ("now") | ✅ | ⚠ | ❌ scheduled | ❌ | ❌ |
| Consent architecture | ✅ mutual+zones | ⚠ | ✅ | ❌ | n/a |

Wedge: **consented serendipity** — the four validated quarters (proximity / skip-chat / faceless / live maps) assembled into one walk.

## 13. Anti-goals (what just-mate will never do)

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

The 2012 graveyard (Sonar, Highlight) died of empty rooms; just-mate launches where rooms are already full — and its zone glow, being aggregate, makes even a small crowd feel alive.

## 16. Business model

- **B2B venues & events** (primary): hosting/promoting zones, "first round" promos, event licensing.
- **Consumer premium** (secondary, later): icebreaker packs, multi-city travel mode. Core matching and all safety features stay free forever (safety is never paywalled).

## 17. Roadmap

| Stage | Scope |
|---|---|
| **M0 — HackYeah 2026** (this repo) | Expo app (push, magnetometer compass), Bun/Elysia backend, custom-trained model v0 + explainable baseline, demo mode |
| **M1 — production MVP** | k-anonymity (K≥3), block/report, persistence-free audit, DPIA, E2E position encryption between paired sessions, model v1 (real interaction data) |
| **v1** | On-device attraction vector (train-on-phone), generated vibe cards (Bielik/LLM), brave streaks |
| **v2** | Venue/event platform (official zones, analytics), city heat events |

## 18. Demo scope & honesty

See README ("What's real vs canned"). Everything presentation-critical is real: profiles, zones from live positions, mutual match + push, custom-trained model, compass bearing, haptics, vanish. Everything auxiliary is honestly canned: ghost density, vibe-card strings, demo-mode positions; attraction-side training data is synthetic until M1.
