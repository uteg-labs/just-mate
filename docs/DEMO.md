# JustMate — demo & pitch script (HackYeah 2026)

Stage format: ~5 min pitch + ~5 min jury Q&A, 10-slide max. **The wow moment must land inside minute two.**

## 5-minute stage script

- **0:00 — Hook.** "Dating apps solved matching. They broke meeting." Numbers on screen **only with a citable source** (one hostile fact-check sinks the opening): loneliness ≈ 15 cigarettes/day (US Surgeon General Advisory 2023, citing Holt-Lunstad). The "hours swiped per date" and "% of matches never meet" lines stay in only if a named source is found by Sat 20:00 — otherwise cut them and keep the one bulletproof number.
- **0:45 — The rules.** "JustMate has three rules: no faces, no chat, no pins." One-liner: two compatible strangers who want the same thing right now — faceless, mutual, on foot.
- **1:15 — Why now.** One slide: happn proved proximity (retrospective, photo-first), Breeze proved skipping chat (scheduled), S'More proved faceless (dead), Zenly proved live maps (friends only). "Every quarter of this mechanic is validated. Nobody assembled the walk."
- **1:45 — LIVE DEMO (the wow).** Two presenters, two phones, opposite ends of the stage.
  1. A: picks **Beer** on the "Where to?" sheet, taps **Find people**. Zones glow.
  2. Both phones buzz simultaneously. B reads the banner aloud: "Someone compatible — 78%, wants beer, *quietly funny, will out-argue you about pizza*."
  3. Both tap **Open compass**. B walks; the arrow rotates; haptics go hot; the crowd watches the distance bucket shrink.
  4. They meet center-stage. A reads B's card. B taps **we met** → screen: *"you walked 14 m to meet — 2.3 km walked to meetings so far."* Bottles up. ("The interface is the street.")
- **3:30 — Safety by design.** Mutual by construction / zones not pins / ephemeral / 10-minute window / Vanish. Preempts the jury's first question.
- **4:00 — Tech, 30s.** Session-scoped search over one WebSocket, geohash-6 zones for display + 400 m distance gate for matching, server relays *bearing* not position, Expo native app, Bun + Elysia backend, explainable compatibility scoring. One sentence, clearly labelled production path: on-device attraction vectors (photos never leave the phone). Mention the learned model only if it actually runs.
- **4:30 — Close.** "No swipes. No chats. Meet for real." + health frame: "a social prescription you literally walk to." Team slide.

## 60-second submission video cut

Black screen → "Dating apps solved matching. They broke meeting." → phone screen-record: onboarding → intent pick on "Where to?" → glowing zones → both phones buzzing (split screen) → compass walk (fast cut) → handshake → logo + "Meet for real." Record twice, edit to ≤60s, English.

## Indoor-GPS reality (Tauron Arena)

GPS inside the arena is unreliable — **do not bet the demo on it.**

- Demo mode: a dev-build toggle feeds scripted converging positions through the identical pipeline (match, notify, compass math all real). The scripted track is defined relative to the stage (`STAGE_A` / `STAGE_B` env vars, set after seeing the room) because the arrow uses the real magnetometer — a mismatched script makes the arrow point into the audience.
- Compass heading comes from the device magnetometer (expo-sensors) — verify on both demo phones; if drifty on stage, the arrow rotation still reads perfectly from ~5 m away.
- Real GPS works natively (Expo) — test the true path outside the arena; no secure-context caveats.

## Rehearsal checklist

- [ ] 5 full run-throughs with both phones, out loud, someone timing
- [ ] One run-through *on the actual stage orientation* to confirm the arrow points at B, not off-stage
- [ ] Both demo phones on the same Wi-Fi/hotspot as the laptop running the server; hotspot fallback tested
- [ ] Backup video recorded twice, stored locally on the pitch laptop
- [ ] Phones charged + brightness max + do-not-disturb OFF for the demo pair only
- [ ] Fallback if live demo dies: play the 60s video, keep talking, never debug on stage
- [ ] Presenter never says "it should also…" — only what works

## Jury Q&A prep

- **"This is a stalker tool."** → It's the opposite by construction: mutual consent before anything unlocks, bearing-not-position compass, zones-not-pins map, 10-min TTL, one-tap Vanish for both, zero history. Grindr's distance-display harms are documented; we designed against exactly that.
- **"Cold start / empty rooms killed Sonar and Highlight."** → Density-first launch: one campus, one festival, one city — the zone glow is an aggregate, so the map feels alive from day one; venues (breweries, cafés) seed zones as partners. And search mode is session-scoped: no always-on battery/privacy tax that killed the 2012 wave.
- **"Why not just happn?"** → happn is retrospective (who you passed 7 days ago), photo-first, chat-gated. We are real-time, faceless, and end in a walk-up, not a chat.
- **"Monetization?"** → Venue partnerships (the "first beer" B2B), event/festival licensing, premium safety features stay free.
- **"RODO/GDPR?"** → Location is processed only inside active sessions with explicit consent, never persisted; production path includes a DPIA. In the demo: test data only.
- **"How good is the AI matching really?"** → Honest answer: the demo runs a transparent, explainable scoring function (intents gate, interests score) — we can show the formula. The architecture has a drop-in slot for a learned model; if we trained one during the event, it was trained on synthetic data and we say so. We would rather show a formula we can defend than a model we can't. **Under-the-hood (only if the jury leans technical):** a Siamese model with a Shared Encoder projecting profile embeddings (OpenAI `text-embedding-3-small`) into 128-d compatibility vectors `zA, zB`, plus a Match Head scoring pairs on `concat(|zA−zB|, zA⊙zB, cos(zA,zB))`, trained jointly with triplet + classification loss on synthetic data. Per-user vectors cache in PostgreSQL with pgvector; per-pair inference is the head only. Full pipeline in `docs/ML-MATCHING.md` — labelled "canned training data, real pipeline" in the README, not "AI matching" in M0.
- **"How do you keep minors out of a faceless dating app?"** → Explicit blocking 18+ gate today; production needs real age assurance before launch (M1), and we would launch in event/venue contexts first, where the crowd is already adult-verified at the door.
- **"Isn't 'faces I like' biometric data?"** → Yes — which is why it is a production-path item behind a DPIA and two-sided explicit consent, not something the demo runs. Today the demo uses simulated vectors.
