# JustMate — product definition

> **Meet for real.**
> JustMate gets lonely people out of the door and in front of someone compatible — faceless, mutual, and on foot. Right now, or at a small plan the app makes for you.

## 1. Elevator pitch (30 seconds)

One in six people is lonely, and lonely people are twice as likely to become depressed (WHO, 2025). Apps solved matching; nobody solved the door. A lonely person rarely goes out on a whim: they need a reason, a time, a place, and proof that someone will actually be there. JustMate gives them exactly that, with no faces and no chat. **Plan:** the app proposes one small, concrete plan near you with one compatible person ("board games · Thu 19:00 · 9 min on foot", with the vibe badge of who you're meeting); you only tap **Accept plan**, and it's on only when you're both in. **Now:** when you're already out, a compatible person who wants the same thing within walking range pings at the same moment, a compass unlocks, and finding each other becomes a ten-minute game. Both end the same way: two people talking face to face, a first name unlocked ("Say hi to Ola."), the distance you walked to get there, and one tap for *same again next week?*

## 2. Problem & vision

**The problem: loneliness, and the door.** Loneliness touches about 1 in 6 people worldwide and is linked to an estimated 871,000 deaths a year; it is highest among young people (17–21% of 13–29-year-olds), and lonely people are twice as likely to become depressed (WHO Commission on Social Connection, June 2025). The US Surgeon General (2023) put its health impact on par with smoking 15 cigarettes a day.

Matching is solved; meeting is broken, and it breaks hardest for a lonely, maybe low person. Three barriers stand between them and a real conversation:

1. **Initiative.** Low mood means low energy. Organising something, even choosing between options, is too much. "Find people now" assumes you are already out and already brave.
2. **The empty table.** "What if nobody comes, what if I'm stood up?" One no-show confirms the story "nobody wants me".
3. **Judgment.** Photo-first apps turn meeting into an audition; chat turns it into weeks of performance before anything real happens.

Existing apps monetise attention spent *on the phone*; their incentive is the opposite of getting you outside.

**Why existing formats fail:**

| Format | Failure mode |
|---|---|
| Swipe apps (Tinder, Bumble) | Photo-first judgment; chat purgatory; meetings are the exception |
| Scheduled dating (Breeze) | Real meetings, but planned hours/days ahead — zero serendipity |
| Stranger dinners (Timeleft) | Proves strangers show up to a fixed plan (dinners, coffees, runs), but on fixed weekly slots, paid per seat (€12.99 a dinner, Brussels 2024), venue anywhere in the city |
| AI-matched groups (Pie) | Small groups matched by a quiz, then a group chat before the event — the chat gate again |
| Proximity dating (happn) | Retrospective ("who you passed 7 days ago"), photo-first, chat-gated |
| Ambient proximity (Highlight, Sonar — dead) | Always-on creepiness, battery drain, empty rooms, safety gaps |
| Activity platforms (Meetup) | Needs an organiser and a group; big rooms are hard for the shy; not "I want a beer buddy *now*" |

One finding from Timeleft we build on: its co-founder saw that "the more information you give, the more people don't show up". A faceless badge is the right amount of information.

**Vision.** A generation that meets by walking toward each other, not by swiping. The phone's job ends where the conversation starts: *the interface is the street.* And because friendship takes time — roughly 40–60 hours together to go from acquaintance to casual friend (Hall, *Journal of Social and Personal Relationships*, 2018) — the product's job is not the first meeting but the second, the third and the tenth.

## 3. The three rules (product constitution)

1. **No faces.** No profile photos anywhere. Attraction is a private compatibility signal, never a picture to be judged; the only faces in the app are generated sample photos in the taste swipe, never a user. Kills the appearance economy and the mirror-anxiety of profile curation.
2. **No chat.** There is no messaging. The product's success event is a real conversation; every feature points at it. The match output is *legs, not thumbs*. A plan needs no messages: the card carries the time, the place and when the compass opens. Names unlock only after you've met.
3. **No people pins.** A person's location is never a point — only zones (geohash cells) with anonymous density glow. Nobody can be found, followed, or looked up. Ever. Places can be pinned: a plan's venue is a public place. People never are.

Every feature decision is tested against these three rules; anything that violates one is out by definition.

### 3.1 What JustMate is not: the mental-health line

JustMate is built for loneliness, which overlaps with low mood and depression. It is a **social-connection product, not therapy**, and the line is deliberate:

- **No health claims.** We never say JustMate treats or prevents depression. Software intended to diagnose or treat a condition is a medical device under the EU MDR (Medical Device Regulation 2017/745); a social app that gets people out of the house is not, and stays that way through what it claims.
- **No mood or health data.** We don't ask how you feel, track mood or infer mental state; that is special-category data under GDPR Art. 9. Post-meet feedback is about the meeting ("same again?"), never about you.
- **No guilt mechanics.** No "you haven't gone out in 7 days", no streaks that can be lost, no shaming copy. Invitations are easy to ignore and a decline is silent.
- **Signposting, not counselling.** Settings and help carry a "Need to talk to someone?" entry with local support lines per country. The app never plays counsellor.
- **Outcomes measured honestly.** Loneliness outcomes are measured only through opt-in, anonymous research surveys, never stored on a profile (§14).

## 4. Who it's for: target group, characters, use cases

**Primary: the quietly lonely in a city, 18–35.** Newcomers who moved for work or study, remote workers, people after a breakup or a move, students who haven't found their people. They are on their phones anyway, they can walk, and cities give the density the product needs. Loneliness peaks among young people (WHO 2025). Date is 18+; Mate admits 16–17-year-olds, who are only ever matched with each other (§10).

**Secondary:** solo travellers and tourists (the Now loop in an unfamiliar city), singles tired of swiping (Date mode), festival and conference crowds (launch markets, §15).

**Not now:** older adults. Up to 1 in 3 is socially isolated (WHO 2025), but they need a phone-light channel; we reach them later through partners (libraries, senior centres), not through this UI.

### 4.1 Characters (the story we tell)

- **Tomek, 28 — the hero.** Moved to Kraków for a job four months ago, works from home, evenings on the couch, weekends without saying a word out loud. Not "depressed", just flat and stuck: organising anything feels impossible and a big Meetup room feels worse. *Sunday night JustMate offers one plan: "board games · Thu 19:00 · 9 min on foot", with one vibe badge, the person he'd be meeting. He taps **Accept plan**; the app did the planning, he only had to say yes. "You're both in." On Thursday the compass opens at 18:45 and he walks there. At the table: "Say hi to Ola.", and the card shows how far he walked. Ninety minutes later: "Same again next week?" A month later it's "his Thursday".* The arc we show: **couch → yes → door → table → again.**
- **Lucía, 27 — the tourist.** Three days alone in Kraków. On an evening walk through Kazimierz she opens Mate → Food and drink → beer. Two minutes later both phones ping: someone 300 m away also wants a beer, also new in town. Compass, ten minutes, a first name, a beer. *The Now loop: no planning, pure serendipity.*
- **Ania, 24 — the dater.** Deleted Tinder twice; tired of being judged on photos and of chats that die. *"When I'm at a festival, I switch on search — compatible people can find me without knowing who I am. If I like the vibe walking up, great; if not, I vanish."*
- **Marta, 31 — the safety lens.** *"Serendipity without creepiness: no stranger ever knows where I am unless I said 'now, this person, yes' — and I can end that instantly."* She matches only with verified people, meets at a public spot first and joins women-only plans; when someone made her uncomfortable she reported him in two taps, he never appears for her again, and a second independent report paused him for review (M1 features, §10).
- **Piotr, 38 — the partner.** Runs a board-game café with empty tables on Tuesday and Thursday evenings. He lists two table slots a week; JustMate fills them with people who wanted exactly that (M1, §16).

### 4.2 Use cases

| Who | Situation | Loop | What JustMate does |
|---|---|---|---|
| Newcomer (Tomek) | Lonely, low energy, never initiates | Plan | Proposes one small plan in his "around" slots; social proof through a badge; he only taps Accept plan |
| Shy person | Big groups feel like too much, a date like an interview | Plan | Activity-first plan for two: something to do side by side, not an interview |
| Remote worker | Lunch alone every day | Plan / Now | "lunch · 12:30 · 6 min away" |
| Tourist (Lucía) | Alone in a city, already out walking | Now | Ping with a compatible person who wants the same thing within a 10-minute walk (800 m) |
| Single (Ania) | Wants to date without photos | Now (Date) | Faceless match, compass, names after meeting |
| Festival-goer | Lost their friends, wants company for a gig | Now | Event zones, ping, compass |
| Venue (Piotr) | Empty tables off-peak | Plan (hosted, M1) | Lists slots; JustMate fills them |

## 5. Two loops: Plan and Now

One faceless profile, two speeds. **Plan** gets people out of the door: the app proposes something concrete and you only have to say yes, with time to get ready. **Now** is serendipity for when you are already out. Both end the same way: you meet, the first name unlocks with the distance you walked, and *same again?* is one tap.

### 5.1 Getting out of the door (motivation design)

How do you get a lonely, maybe low person to actually go? That is the product's core problem. Each mechanic below removes one barrier from §2:

| Barrier | Mechanic | Stage |
|---|---|---|
| No energy to initiate | **The app proposes, you only say yes.** One concrete plan (activity, place, time, walk time) instead of a menu to browse. Inspired by behavioural activation (small, scheduled, concrete activities), as a design principle, not a clinical claim (§3.1). | M0 |
| "Will anyone come?" | **Social proof without faces:** the vibe badge of the one person you're meeting, before you go. You know who is coming, not what they look like. | M0 |
| Fear of being stood up | **A plan is on only when both say yes.** Both accept a proposal, or you confirm whoever took your invitation. "Can't make it" reaches the other side before they leave. | M0 in-app · M1 push |
| Talking is hard | **Activity-first plans:** board games, a walk, climbing, a quiz — something to do side by side, at a public venue picked for it. | M0 |
| Commitment feels big | **Short and time-boxed:** every plan has a soft end; "Can't make it" is one tap, not an apology. | M0 |
| Day-of hesitation | **"Compass opens at 18:45"** on the plan card, 15 minutes before the start. | M0 |
| One meeting doesn't fix loneliness | **Same again next week?** after every plan and meeting; in M0 a local button, scheduling the same pair for the same slot is production path. Later: **circles**, the same 3–4 people weekly for four weeks, because friendship needs repeated time (§2). | M0 button · M1 scheduling · v1 circles |
| A small push helps | **Venue perk on check-in** (e.g. first coffee −50%), paid by the partner venue. | M1 |
| Spam kills trust | **At most one new invite a day, only in your "when are you around" slots**; declines are silent. | M1 (needs push) |

### 5.2 The Now loop (when you're already out)

Step 1 (the profile) is shared by both loops; steps 7–8 are how both loops end.

1. **Profile once (about two minutes).** Pick a mode, **Date** or **Mate**. Then your first name (revealed only after you've met), interests (at least 3, each opening related ones), and four short questions written live from your answers. The answers become a one-line **vibe** on a lanyard **badge** whose colours and pattern are designed from your picks. That badge is all a match ever sees. Then who you're after, and either a swipe over generated sample photos that trains your taste (date) or when you're usually around (mate). Last, one selfie: described once (hair, face shape) for matching, then dropped; the liveness check is the production path. No photo of you is ever stored or shown to anyone.
2. **Pick what you're up for and search, deliberately, per occasion.** Default is invisible. On the map you choose Date or Mate, open a category (Food and drink, Nightlife, Sports, Games…), pick one or more things inside it, and tap **Find people for {picks}**. Battery, privacy and intent in one action; what you picked is the session's context, not a profile attribute. This is the anti-Highlight: session-scoped, never ambient. (`STRUCTURE.md` §2–3.)
3. **Watch the map warm up.** A soft heat field shows where compatible people are searching for the same thing. No list, no search field, no browsing. Scarcity of information is the feature.
4. **The ping (the product's heartbeat).** Two compatible people, both searching, picks aligned, within walking range (800 m by default, see §7) → both phones ping at the same moment. Each sees the other's badge: "her vibe · wants: wine" and their vibe line, with a 45-second countdown.
5. **Mutual accept → compass unlocks.** Only if both tap **Open compass**. Either alone sees nothing more ("waiting for them…").
6. **The walk.** A directional arrow with hot/cold colour and haptics. Distance is a bucket (cold / warm / hot / burning), never a map pin of the other person. 10-minute window.
7. **Meet. Talk.** At `burning` either taps **We met**. Names unlock ("Say hi to Ola.") and you see how far you walked. Then the session ends and positions are discarded.
8. **Either can Vanish** at any moment, and the session is destroyed for both instantly.

### 5.3 The Plan loop (when you need a reason to go)

Plans are 1:1, in both modes, and come two ways: the app proposes one, or you put one out yourself.

1. **The app proposes.** Below the category bento, **your plans** lists what the matcher made for you: a compatible person's vibe badge, an activity from your shared interests, a public venue halfway between you, and a time inside your "when are you around" slots. Two alternative venues sit under it. Opening the sheet exposes nothing: the other person only sees your badge on their own proposal.
2. **Accept, pass, or suggest a place.** **Accept plan** confirms only if they accept too ("waiting for them…" → "you're both in"). Picking another venue turns the button into **Suggest this place**; they see your pick and accept it, or it expires. **Pass** is silent: the other side only sees the proposal expire.
3. **Or plan it yourself.** **Plan for later** (or a venue under **places for you**) puts the sheet into plan mode: what (the same bento), when (several days, several times each, optionally flexible by 30 min), where (a public venue on the map or from search), review, **Send invitation**. You don't pick who: it is offered to compatible people free at one of your times, one at a time, and stays open until 2 h before or the day before.
4. **Someone's in.** The first person to take it picks one of your times. You see their vibe badge, the time and the place, then **Confirm plan** or **Pass** (it goes to someone else; they only see "plan filled").
5. **Confirmed.** The plan card shows when the compass opens (T−15 min). Names still unlock only when you meet.
6. **At the plan.** **Open compass** runs the same walk as Now (bearing + bucket, never a pin, up to 30 minutes), then **We met → post-meet**.
7. **Can't make it.** One tap, no reason asked; the other side sees "plan cancelled".

## 6. Screen specification

`STRUCTURE.md` is the source of truth for screens, flows and exact copy. Visual language, motion, haptics and accessibility live in `DESIGN.md`: a pale map with warm glow, light by default, an ink match card and a night compass. Colours named here are its tokens. This section keeps the product reasoning per screen.

### 6.1 Account and onboarding

- **Auth**: one sheet over the map. Log in goes straight to the map; Create account grows into onboarding ("Next: a faceless profile. Two minutes, no photos of you shown to anyone.").
- **Mode first.** "What are you here for?" Date ("Someone to fall for, a few streets away.") or Mate ("People to grab a beer or a game with, right now."). You can switch on the map any time; the mode picks which questions, interests and categories you see.
- **Interests** are per mode (date: coffee, wine, cinema, books, travel…; mate: board games, climbing, running, gym, football…). At least 3; each pick opens 3 related ones.
- **Four live questions** replace a long form: each is written from the previous answers, with fixed sample questions as the fallback. They feed the vibe line and the matching profile (`ML-MATCHING.md` §2).
- **Your badge**: "Designed from your picks. All a match sees." Reroll the line until it fits, then **Keep this vibe**.
- **Who you're after**: date asks who you're interested in, an age range and what you're looking for ("something real / see where it goes / something light"). Mate asks who (anyone / same gender), group size, energy and age. "Used for matching only. Nobody sees your settings."
- **Who catches your eye** (date): swipe six *sample* photos, never real users. This is the attraction-vector story (§7) made tangible. The samples are generated faces kept on the server only for this training, which is why they don't break "no faces": nobody's own photo is ever shown. In M0 only words leave the phone: the server reduces the descriptions of the samples you were into to the traits they share, and stores that line, never a photo.
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

- **Names unlock, nothing else does.** Both badges, now with first names; "Say hi to {name}." and the distance you walked ("You walked {m} m to say hi.").
- **Same again next week?** is a local button in M0; scheduling the pair again is production path.
- **Report** shows a notice in M0; block and report are M1 (§10.2). **Back to the map** ends it.
- Production path: an opener for the pair if the conversation needs a push; a mutual **Keep in touch** that saves the other person on your phone, still no chat; an optional one-tap "how did it go?" to tune matching.

### 6.7 Settings

Profile (name, interests, questions and vibe, who you're after, appearance taste or when you're around: each reopens its onboarding step), the map (start mode, walk up to 5 / 10 / 15 min (10 by default), auto-stop after 30 min), plans (invite me to plans, M1 with push), feel (haptics, sounds, reduce motion), privacy and safety (taste is a line of traits and photos are never stored, download my data; M1: blocked people, verified-only, meeting point first, women-only plans, trusted contact, my reports), help ("Need to talk to someone?" with local support lines, §3.1), account (email, log out, delete account).

### 6.8 Plans (Date and Mate, M0)

Screens and exact copy are in `STRUCTURE.md` §8; the wire contract is `PROTOCOL.md` › Plans. Product intent:

- **Entry**: below the bento the select sheet scrolls into **your plans** (up to three, "see all") with **Plan for later**, then **places for you** (venues that fit your interests; tapping one starts a plan there).
- **Proposal card** (ink, drops from the island like a match): their badge ("her vibe"), "a plan for you · date", "expires in 6 h", day and time, the venue on a small map, "9 min for you, 7 for them", alternative venues as chips, **Accept plan** (or **Suggest this place** after picking another venue), ghost **Pass**, "Confirms only if they accept too."
- **Plan for later**: what → when → where → review, four steps. When takes several days with several times each and "Flexible by 30 min". Where is a public venue picked on the map or from search. Review: **Send invitation**, "You don't pick who."
- **Someone's in** (ink card): their badge, the time they picked, the place, **Confirm plan** / **Pass** ("If you pass, it goes to someone else. They only see 'plan filled'.").
- **Plans page**: proposed for you · upcoming · your invitations ("open" / "someone's in"), and **New plan**.
- **Plan detail**: the venue on a map, title, venue meta, who you're meeting (their vibe) or "You don't pick who."; compass opens, names unlock; **Open compass** from T−15 and **Can't make it** → "They see 'plan cancelled'. No reason asked."
- **Copy rules**: never "X declined" or "X passed". A passed proposal only expires; a passed taker only sees "plan filled", the same way a dismissed match only "expires" (§6.4).

## 7. Matching system

**Data model.** `user = { id, mode, name, gender, age, interests[], answers[], vibe, prefs (date: seek, age range, looking · mate: who, group, energy, age range, when, length), verified, adult, appearance (selfie features, never shown), taste (traits of the liked samples), character (five trait lines from the answers), settings, attractionVector (private, on-device), session: { mode, category, intents[], walkMin, state } }`. The profile is stored server-side (`PROTOCOL.md` › Profile) so matching can use it; the search session and positions live only on the socket. (Onboarding also stores two profile embeddings per user in `profile_embedding` for the ML model — profile vectors, never positions; see below.)

**Explainable scoring (M0 primary).** A transparent function, served by the Elysia backend, is what runs in the demo and what we defend in Q&A:

```
compat = 0.7 × Jaccard(interests) + 0.3 × min(1, |shared intents|)
match  ⇔ both searching ∧ dist(a, b) ≤ R_MATCH (800 m by default) ∧ shared intent ≥ 1 ∧ compat ≥ 0.45
```

- **Mode and intents gate, interests score.** Both people must be searching in the same mode, and their picks must share at least one intent; that shared intent is the *context* of the match ("this is a running match"). Interests and answers set the compatibility score. The score gates the match but isn't shown on screen.
- **Distance, not zone, is the match gate.** The server holds exact positions anyway; zones are a *display* abstraction (see §8). Matching on "same geohash cell" would (a) pair people up to 1.35 km apart — more than the ~830 m a person walks in the 10-minute window at 5 km/h — and (b) never pair two people 50 m apart on either side of a cell boundary. `R_MATCH` is 800 m by default (the 10-minute "walk up to"): walking toward each other that is ~400 m, ~5 min each, leaving half the window for finding each other.
- **Offer TTL 45 s**, then the offer expires silently for both (see §6.4).
- **Pair cooldown: 5 min** after any match/dismiss/expiry/vanish — no re-pinging the same person, no notification spam.
- **One active session per user.**
- **Ghost users never match.** Ghosts (server-spawned wanderers that add zone density) carry `ghost: true` and are excluded from candidate pairs — otherwise a demo phone can be offered a ghost instead of the other demo phone.

**Hard gates (server-side, NOT learned).** Whatever scores the pair — the formula above or the stretch model — only sees pairs that have already passed: both searching · same mode and category · `dist ≤ R_MATCH` (800 m by default: the shorter of both "walk up to" settings, 5 / 10 / 15 min → 400 / 800 / 1200 m) · shared active intent ≥ 1 · the age and safety rules below · K-anonymity of the *zone* (M0: K=1 demo, M1: K=3) · pair cooldown · one active session/offer · not self · not a ghost. The scorer focuses purely on "given shared intent X, how compatible are they on it". (Same table in `docs/ML-MATCHING.md` §7 and `docs/PROTOCOL.md`.)

**Compatibility model (M1+ — post-hackathon, documented, not in M0 demo).** A Siamese text-embedding model with a Match Head, custom-trained by the team. The pipeline:

1. **Photo description (LLM).** At onboarding, the user's photo + (intents, interests) is sent to a vision LLM (e.g. `gpt-4o-mini`) which returns a 2–3 sentence plain-prose text covering how they look, their personality vibe, and who they want to meet. This text is cached in `profile["description"]`. No face data is shared between users — only the text description.
2. **Text embedding.** Two texts per profile — a *self* text (interests, character, appearance) and a *target* text (who they want to meet) — go to OpenAI `text-embedding-3-small` (1536-d, frozen).
3. **Shared Encoder.** A learned MLP `1536 → 256 → 128` (LayerNorm, L2-normalized output) projects them to 128-d compatibility vectors.
4. **Match Head.** Scores one person's target vector against the other's self vector from their difference, product and cosine (v3 also takes a soft-Jaccard of interests), `→ 32 → 1` logit. Exact heads in `docs/ML-MATCHING.md` §3.
5. **Joint training.** Triplet loss (margin=1.0, p=2) + binary match loss (BCE for logit_ab→1 and logit_ac→0) trained jointly on synthetic profiles for M0 / on real outcomes for M1.

- **Serving.** The ONNX model runs in an HTTP container (`ml/Dockerfile.scorer`). The server precomputes pair scores when a profile changes and Now matching reads them; plans and demo mode use the explainable score (`ml/DEPLOYMENT.md`).
- **Training data.** M0 / HackYeah 2026: synthetic profiles + rule-based ground truth (the explainable baseline + noise) — honest-proxy training. M1: real interaction outcomes (mutual accept + met → 1; dismissed/vanished → 0).
- **Threshold.** The `0.45` rule above applies to the explainable baseline. The neural model uses a **separately calibrated** threshold on a held-out synthetic set (target: FPR ≤ 5%, TPR ≥ 80%). Documented in the model card.
- **Fallback.** If the ML service is unavailable, the server transparently falls back to the explainable baseline. The demo never breaks.
- **Honesty on stage.** In M0, with synthetic data only, a learned model just learns the baseline. We do not say "AI matching" about something that is not learned from real signal — the explainable function stays the headline; the model card + `docs/ML-MATCHING.md` describe the *real* M1 pipeline.
- Full pipeline, training loop, file layout, and M1 roadmap: see `docs/ML-MATCHING.md` and `ml/README.md` (`docs/ml/PLAN.md` is the original plan, kept for history).

**Description generation (LLM, M0 stretch).** — Today's version of the attraction vector. The user's photo is uploaded once at onboarding; an LLM produces a 2–3 sentence plain-prose description (`Appearance + personality + what they're looking for`) which becomes part of the profile. The matching model never sees the photo, only the text. In M0 we use a canned pool of descriptions for synthetic profiles; in M1 a real LLM call produces them per-user. **Privacy note:** photos go to the LLM API. Production needs a DPIA + explicit consent per §10; the demo uses test data only.

**Vibe lines and badges.** One wry line in two lowercase clauses (*"quietly funny — will out-argue you about pizza"*), written from your onboarding answers, rerolled until you keep it. It hangs on a badge whose colours, pattern and icon are designed deterministically from your interests and answers (`DESIGN.md` §13.5). At the match moment you see *their* badge. Demo: canned lines, deterministic per user. Production: generated (Bielik/LLM) from the profile, cached per user, moderated, plus an opener written for the pair after you've met.

**Plan matching (M0, explainable).** Plans are 1:1 and reuse the gates and the score above, stretched over time instead of distance-right-now:

```
plan      = { id, kind (proposal | invite), mode, category, intents[], venueId, startsAt, members[2], state }
proposal  ⇔ the profile rules (mode, age, safety) ∧ compat ≥ 0.45 ∧ an intent from shared interests
            ∧ an overlapping "around" slot ∧ both anchors within 15 min on foot of the venue
venue     = among seeded venues for the mode that fit the intent, the one that minimises the longer walk
            (nobody walks much further); the next two are offered as alternatives
invite    → offered to the best-scoring compatible person free at one of its times, one at a time
            (offer TTL, then the next person) until "open until" passes
```

- **Venues.** M0 uses a seeded list of 18 hand-tagged public venues in Kraków, at least one for every sport (modes, intents, opening hours); partner venues add their own in M1 (§16).
- **One proposal at a time.** A person has at most one open proposal; passing or letting it expire frees the slot for the next one.
- **Pairs who met once** (M1). Two people who met and didn't both tap Keep in touch are not proposed to each other again for 30 days; a block makes it permanent (§10.2).
- **Age.** The age and safety rules from §10 apply to plans unchanged: a non-adult is only ever paired with non-adults, and date plans need both adults.
- **Ghosts** never join plans.

## 8. Zones & location architecture

- **Zone = geohash precision 6** (~1.2 km × 0.6 km at Kraków's latitude) — the *display* unit: big enough for anonymity (a glow never points at one person). Zones are not the match unit; matching is by distance (`R_MATCH`, §7), so cell boundaries never split two nearby people.
- **Glow semantics:** count of *search-mode* users in the cell, rendered as size/brightness. Zones with fewer than **K=3** searching users stay dark (k-anonymity in production; demo shows all) — you can't follow a glow to *the only* person in it.
- **Data flow:** client sends position every ~2 s (while searching) → server keeps it in-memory keyed by socket → computes zone → matches → relays position *only* between mutually-accepted partners *only* during the session → everything discarded on disconnect/vanish/TTL. No database. No history. No logs of positions.
- **Transport: one WebSocket per client** (Elysia `ws`), message schema in `docs/PROTOCOL.md`. All real-time events — zones, match offer, partner position, expiry — ride this socket. **No remote push in M0:** the app is in the foreground whenever search mode is on (that is the product), so push adds EAS/APNs/FCM setup time and a failure mode without adding anything the jury can see. Remote push is an M1 item (search mode in background).
- **Demo mode:** scripted converging positions driven by a dev-build toggle (indoor GPS reality); identical pipeline. Scripted coordinates are expressed relative to the stage (A = stage-left end, B = stage-right end, both facing the audience) because the compass arrow uses the *real* magnetometer heading — if the scripted bearing does not match the physical layout, the arrow visibly points off-stage.
- **Plans and venues.** Venues are the only coordinates a client ever receives. Venue picks use an *anchor*: the position you send when you open the app, rounded to a geohash-6 cell and kept with your plans; the other person's walk is sent as minutes, never as a place. A plan stores *who* is going and *which venue*, never *where they are*. Plans live in Postgres until 24 h after the start (so a report can still name the pair), then are deleted. M1: an opt-in **usual area** (a district you pick, stored as geohash-5 ≈ 4.9 × 4.9 km, never GPS history) lets proposals arrive before you open the app.

## 9. Match session and plan lifecycle (state machines)

```
idle (invisible) → searching → [match offered ⇉ both phones, offer TTL 45 s]
     → both accept ⇉ compass active (10 min TTL, positions relayed pairwise)
     │                → we met → post-meet (name unlocks · distance walked) → idle
     │                → TTL expiry | either vanishes → idle
     └→ dismiss | offer expiry (either side; the other side sees only "expired")
          → cooldown (5 min per pair) → still searching
searching → stop searching | 30 min auto-stop → idle
```

Full event-by-event schema (client ↔ server) is in `docs/PROTOCOL.md`; it is the contract mobile and backend build against independently.

**Plan lifecycle (M0):**

```
proposal  proposed → both accept → confirmed
          proposed → one side suggests another venue → proposed (the other side accepts it, or it expires)
          proposed → pass | TTL → gone (the other side only sees it expire)
invite    open → offered to one compatible person at a time → taken (they picked one of your times)
          taken → you confirm → confirmed | you pass → open again (they only see "plan filled")
          open → "open until" passes → gone
confirmed → T−15 min, both open the compass → walk (30 min TTL) → we met → post-meet → done
confirmed → can't make it (either side) → cancelled (the other side sees "plan cancelled", no reason)
```

## 10. Safety & privacy by design (threat model)

Safety is the architecture, but for women in particular architecture alone is not enough. Three layers on top of it: **prove you're real, meet in public, and remove someone from your world in one tap.** Every safety feature is free, forever (§16).

| Threat | Countermeasure |
|---|---|
| Stalker follows a specific person | No identity, no search, no browsing; zones not pins; glow is aggregate (k-anonymity); nothing discoverable when search is off; plans are proposed by the app, never browsable by person |
| Compass abused to locate someone | Unlocks only after **mutual** accept; reveals a *bearing*, never a map position; 10-min TTL; partner sees the same compass (symmetry — they know you're walking too); M1: meeting point first (§10.3) |
| Plan used to reach a specific person | Plans can't be searched or browsed; the other person sees your badge, not your name, until you've met; public venues only; M1: people who met aren't proposed to each other again for 30 days unless both kept in touch (§7), women-only and verified-only plans |
| Harassment | No chat = no DM channel; exposure is session- or plan-scoped; block and report (§10.2) remove the person from matches and plans for good |
| Serial abuser cycling through matches | M1 rate limits: at most 5 compass sessions a day and 3 open plans per person; repeated vanishes or reports from *different* people flag the account for review |
| Fake or bot profiles | One-selfie liveness check, deleted after the check (production path in M0); M1: one account per phone number, optional ID check, a "verified" / "ID verified" tag on the badge |
| Ban evasion | M1: a ban binds the phone number and the device (and the ID, for ID-verified accounts) |
| Weaponised false reports | Auto-pause needs two independent reporters; reports from verified accounts weigh more; a human reviews before any ban; appeal path |
| Data breach / subpoena | Positions never persisted — in-memory per socket only; plans hold who, never where; nothing to leak |
| Notification fatigue / ambush pings | Both parties opted in *per occasion* (category + intent pick + Find people, or Accept plan); pair cooldown; one active session; M1: at most one plan invite a day |
| Being stood up | A plan is on only when both say yes; "Can't make it" reaches the other side in the app before they leave (§5.3); M1: push |
| Women's safety specifically | She is invisible unless she starts a search or accepts a plan; she can dismiss any match invisibly (offer simply "expires" on the other side); Vanish is one tap and instant; her name is only shown after she has met someone in person; M1: verified-only, meeting point first, women-only plans, trusted contact |
| Minors | No photos and no identity means no implicit age signal → every profile states an age (16+), and the blocking **"I'm 18 or older"** check on the date verify step is "checked against your selfie" (selfie check is production path in M0). The 18+ gate is per mode, enforced server-side: date mode requires an adult; mate mode allows 16–17, but **a non-adult is only ever matched with another non-adult, in mate mode, and an adult is never offered a non-adult** (`PROTOCOL.md` › Server-side rules). Production: age assurance appropriate to a dating product (M1) |

GDPR/RODO posture: location is personal data → processed solely inside explicit, session-scoped consent; no storage; production path includes a DPIA (data protection impact assessment). No mood or health data is collected (§3.1). Demo runs on test data only.

### 10.1 Verification ladder

| Level | Check | Cost to us (est.) | Stage | Unlocks |
|---|---|---|---|---|
| 1 · Account | Email + password, or a magic link | ~€0 | M0 (real) | Mate, plans |
| 2 · Phone | SMS code, one account per number | ~€0.05–0.10 a check | M1 | Plans in production |
| 3 · Liveness | One selfie, deleted after the check | per provider | M0 simulated → M1 | "verified" tag, Date mode |
| 4 · ID | Document + selfie via an ID provider (Veriff self-serve: $0.80–1.89 a check, $49–209 monthly minimum) | ~€0.70 a check | M1, optional | "ID verified" tag; counts as verified for verified-only filters |

The user never pays for a level. Verified-only is a filter anyone can switch on: "only match me with verified people".

### 10.2 Block and report

- **Block** from the post-meet screen, a plan's detail, or **Recent**: the last 7 days of matches and plans as opaque badges, the only "history" the app keeps, so you can act after the fact (no positions, no times beyond the day). A block is instant, permanent and two-way: never matched, never in the same plan again. The blocked person is never told.
- **Report = block + flag.** One flow: a reason (made me uncomfortable · followed me · didn't take no · fake · looks under 18 · other) and an optional note to the safety team, the only free text in the app; it goes to people who review it, never to the other person. Reporting always blocks.
- **Auto-pause.** Two independent reports within 30 days pause the account from matching and plans until a human review: warning, or ban (§10 table: ban evasion).
- **Vanish, then report**: Vanish stays one tap with no confirmation; a 10-second prompt after it offers Report.
- **Met but not kept** (M1). If two people met and didn't both tap Keep in touch, they aren't matched or proposed to each other again for 30 days (§7) — a soft block nobody has to ask for.
- M0: Vanish, and Report as a local notice; block, report and Recent are M1.

### 10.3 Meet in public

- **Plans happen only at public venues**: the seeded list in M0, partner venues in M1. Never at an address.
- **Meeting point first** (M1, default on in Date): for a first 1:1 meeting from the Now loop, the compass points both people to a public spot between them (a partner venue or a landmark) instead of at each other; the person compass unlocks only within ~50 m of that spot.
- **Trusted contact** (M1): share "plan at {venue}, {start}–{end}" through the phone's share sheet; a "Home safe?" prompt after the end.
- **Women-only plans** and **verified-only** filters (M1), free.
- **I decide first** (M1, opt-in): your phone sees a match offer before theirs; their phone pings only if you accept, so nobody ever learns they were offered you. Trade-off: you give up the simultaneous ping.

## 11. Gamification layer

**Core (hackathon):** the compass walk itself — hot/cold buckets, haptic escalation, the 10-minute window creating urgency, the vibe badge as loot (designed from your picks, no two alike, dropping in on a lanyard), the plan's "you're both in", and the reveal at the end: a first name and the distance you walked.

**Planned (post-hackathon, in priority order):**
- **Brave log** (replaces the earlier streak idea): a private collection of the badges of people you've met, one per meeting. It only grows; there is no streak to lose. Losing a streak is guilt, and guilt is the wrong tool for people who already feel low (§3.1).
- **Circles**: the same 3–4 people, same slot, weekly for four weeks (§5.1).
- **Zone heat events**: "this district is glowing tonight" — city-scale serendipity weather.
- **Icebreaker packs**: themed card packs (travel / music / sport) users can equip.

Deliberately excluded: points, ads, streaks that reset, leaderboards, "you haven't gone out" nudges — gamification serves courage, not retention.

## 12. Competitive positioning

| | JustMate | Timeleft | happn | Tinder | Meetup |
|---|---|---|---|---|---|
| Concrete plan that gets you out | ✅ app-made, near you | ✅ fixed weekly slots | ❌ | ❌ | ⚠ needs an organiser |
| Real-time proximity ("now") | ✅ live zones | ❌ | ⚠ retrospective | ❌ | ❌ |
| Faceless | ✅ core | ⚠ little info before | ❌ | ❌ | n/a |
| Ends in person, not in chat | ✅ | ✅ | ❌ | ❌ | ⚠ |
| Walkable (neighbourhood scale) | ✅ 5–15 min on foot | ❌ anywhere in the city | ⚠ | ❌ | ❌ |
| Consent architecture | ✅ mutual + zones | ⚠ | ⚠ | ❌ | n/a |
| Core free to the user | ✅ | ❌ paid per seat | ⚠ freemium | ⚠ freemium | ✅ to attend |

Wedge: **consented serendipity, plus plans you only have to say yes to** — proximity, skip-chat, faceless and live maps assembled into one walk, with Timeleft's proof that strangers show up when the plan is concrete.

## 13. Anti-goals (what JustMate will never do)

Chat. Photo profiles. Browsing/searching people. Followers, likes, feeds. Ads in the meeting flow. Selling attention. **Paywalled connections** (no "five free matches, then pay", §16). **Guilt mechanics** (lost streaks, "you haven't gone out" nudges). **Health claims** (§3.1). The app's success metric *decreases* phone usage — we build for that.

## 14. Success metrics

- **North star:** completed real-world meetings per active user per week (Now and Plan).
- **Mission metric (loneliness):** repeat meetings — the share of active users who met the same person at least twice in 30 days. One meeting is an event; repetition is how a friendship starts (§2).
- **Activation:** the share of new users who attend a first plan or meeting within 7 days of signing up.
- **Plan health:** fill rate (proposed → on), show-up rate (target ≥ 80% of confirmed attendees), and **stood-up rate** (checked in, the other person never came) as a guardrail under 2%.
- **Safety guardrails:** vanish rate (<10% — safety/quality signal), reports per 1,000 meetings, median time to review a report under 24 h, notification opt-out rate.
- **Outcome (research only):** an opt-in, anonymous 3-item loneliness scale (UCLA short form) at sign-up and after 8 weeks, aggregated, never stored on a profile (§3.1).
- **Anti-metric watched on purpose:** time-in-app should *not* grow — engagement is measured on the street, not the screen.

## 15. Launch & density strategy (the cold-start answer)

**Plans lower the density bar.** Now needs two compatible people searching *in the same minute* within a 10-minute walk (800 m). A plan needs one compatible person within 15 minutes on foot of a venue *over a day or two*. Rough illustration for a district with 500 active users: if each searches 30 min a week, spread over evening hours (4 h × 7 days = 1,680 min), about 9 people are searching at any evening minute, split across modes and a dozen intents — a Now match is rare. If 40% are open to plans, that's 200 people over the next 48 h, ~16 per intent — a pair is easy to find. Plans work at an order of magnitude lower density than Now, so **a new city opens with plans; the Now loop lights up as density grows.**

1. **Single-density launches:** one campus, one festival, one city district — anywhere the zone glow is genuinely populated from day one.
2. **Event mode:** festivals/conferences pre-seed official zones and plans (a known, opt-in crowd — the perfect first market).
3. **Venue partnerships:** board-game cafés, breweries, climbing gyms host plan slots and perks — B2B (venues pay) seeds density and revenue at once.
4. **Ambassadors and newcomer channels:** campus societies, expat communities, HR onboarding for relocated staff, international-student offices.

The 2012 graveyard (Sonar, Highlight) died of empty rooms; JustMate launches where rooms are already full, plans don't need a full room, and the zone glow, being aggregate, makes even a small crowd feel alive.

## 16. Business model

Four principles: **meeting is never paywalled; safety is never paywalled; those who earn from people going out (venues, events) pay most; premium sells convenience and reach, not access.** Core matching, plans proposed by the app and all safety features stay free forever.

### 16.1 The options on the table

| Option | Verdict | Why |
|---|---|---|
| Partners create plans (cafés, restaurants, cinemas, climbing gyms) | ✅ **primary revenue** | They gain customers in off-peak hours, and their slots seed density. Rules: public venues only; partners see counts and check-ins, never identities; a partner plan looks like any plan, labelled "hosted by {venue}"; venues that attendees rate badly are delisted. |
| Premium users can create plans | ✅ with a change | Everyone accepts any plan for free, app-made plans stay free, and putting out your own invitation is free (it ships in M0). JustMate+ sells reach instead: several open invitations at once, travel mode, private plans. Public venues only. |
| X connections free, more for money | ❌ rejected | It paywalls the north-star event and charges lonely people for the one thing they came for; it rewards rationing meetings, the swipe-app model we position against (§13). Limits exist, but for safety (§10), not revenue. |

### 16.2 Revenue streams

1. **Partner venues (B2B, primary):** ~€39/month per venue to list plan slots, plus venue-funded perks on check-in (M1).
2. **Prepaid first round (M1):** at partner venues you can prepay a €5 voucher redeemable on site; JustMate keeps 15%. It doubles as a commitment device (prepaid people show up). Always optional: free plans at public places stay. Paid by card through a payment provider, not through app-store in-app purchase (store rules allow outside payment for goods and services consumed outside the app).
3. **JustMate+ (B2C, secondary):** €4.99/month — several open invitations at once, travel mode (join plans in another city before you arrive), private plans for your existing friends, themed icebreaker packs.
4. **Events and festivals:** licensing official zones and plans for an event (€500–2,000 per event).
5. **Later (B2B2C — a partner pays, the user uses it free):** employers onboarding relocated staff, universities onboarding international students, city wellbeing programmes. Loneliness is now on the WHO policy agenda.

### 16.3 Back-of-envelope: one city, 5,000 monthly active users

Assumptions are labelled; all figures are estimates to replace with real quotes.

| Monthly cost | Assumption | € |
|---|---|---|
| Hosting (API, PostgreSQL, backups) | 2 small VPS + managed DB | ~100 |
| LLM (questions, vibe lines, openers) | ~1,000 new users × ~€0.01, plus openers | ~20 |
| Phone verification | 1,000 new users × ~€0.07 | ~70 |
| ID verification | 40% of new users × $0.80 (Veriff Essential) | ~300 |
| Human moderation | 20 h × €15 | ~300 |
| Stores, email, misc | Apple $99/yr, email plan | ~30 |
| **Total** | | **~820** |

| Monthly revenue | Assumption | € |
|---|---|---|
| Partner venues | 25 venues × €39 | ~975 |
| Prepaid first round | 40% of MAU (monthly active users) = 2,000 users × 1.5 plans = 3,000 check-ins; 30% with a €5 voucher = 900 × (€0.75 commission − ~€0.33 card fee) | ~380 |
| JustMate+ | 3% of 5,000 = 150 × €4.99 → ~€3.45 net of 23% VAT and the 15% store fee | ~520 |
| Events | 1 festival a quarter × €1,000 | ~330 |
| **Total** | | **~2,200** |

Readout: ~21 partner venues cover a city's running costs on their own (820 ÷ 39); everything else is margin toward a team. The fixed card fee (~1.5% + €0.25) eats ~43% of a €5 voucher's commission, so vouchers are sold as a €20 wallet top-up (fee ~€0.55 per €20 ≈ €0.14 per voucher).

## 17. Roadmap

| Stage | Scope |
|---|---|
| **M0 — HackYeah 2026** (this repo) | Expo dev-client app (Mate / Date modes, Mate first, category picks, vibe badge, WebSocket events, compass from the device heading, haptics, 18+ gate, post-meet with the partner's first name, distance walked and a local *same again next week?*), Bun/Elysia backend (ws, distance-gated matching, offer/session TTLs, ghosts, position plausibility checks), explainable scoring, demo mode; **Plans, 1:1, Date and Mate** (app-made plans from profiles and 18 seeded public venues in Kraków, activities first; accept on both sides; your own invitation offered to one compatible person at a time; compass for the pair from T−15), Report as a local notice, a help row with local support lines; the learned model trained in `ml/` but not in the matching path |
| **M1 — production MVP** | group plans for 2–4 with attendee badges, go-ahead minimum, still-in check, leave-at time, status chips, I'm here; keep in touch and a mutual repeat plan; remote push (background search, plan invites and reminders), block / report / auto-pause and Recent, phone and ID verification, verified-only and women-only filters, meeting point first, trusted contact, rate limits, usual area, partner venues (slots, perks), prepaid first round, k-anonymity (K≥3), age assurance, persistence-free audit, DPIA, E2E position encryption between paired sessions, model v1 (real interaction data) |
| **v1** | Circles, JustMate+ (travel mode, private plans), brave log, on-device attraction vector (train-on-phone), production generated vibe lines and openers (Bielik/LLM, moderated) |
| **v2** | Venue/event platform (official zones, analytics), city heat events, employer and university programmes |

## 18. Demo scope & honesty

See README ("What's real vs canned"). Everything presentation-critical is real: profiles, zones from live positions, mutual match delivered live to both phones over WebSocket, explainable scoring, compass bearing, haptics, vanish, and plans: proposed from real profiles, accepted on both sides and turning on on both phones. Everything auxiliary is honestly canned: ghost density, the seeded venue list, fallback vibe lines and questions, profile descriptions (canned pool for synthetic profiles in M0; live `gpt-4o-mini` calls in M1), demo-mode positions; the learned model (if shown) is trained on synthetic data. Safety features marked M1 in §10 (block, report, verification beyond the simulated selfie, meeting point, women-only plans) are production path and are said so on stage. On mental health we say "loneliness" and "social connection", never "treats depression" (§3.1).

Rule for every sentence in the deck and the description: **it describes what the demo does, or it is labelled "production path".**
