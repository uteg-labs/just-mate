# just-mate — demo & pitch script (HackYeah 2026)

Stage format: ~5 min pitch + ~5 min jury Q&A, 10-slide max. **The wow moment must land inside minute two.**

## 5-minute stage script

- **0:00 — Hook.** "Dating apps solved matching. They broke meeting." Three numbers on screen: loneliness ≈ 15 cigarettes/day (US Surgeon General 2023); the average user swipes for hours per real-life date; most matches never meet.
- **0:45 — The rules.** "just-mate has three rules: no faces, no chat, no pins." One-liner: two compatible strangers who want the same thing right now — faceless, mutual, on foot.
- **1:15 — Why now.** One slide: happn proved proximity (retrospective, photo-first), Breeze proved skipping chat (scheduled), S'More proved faceless (dead), Zenly proved live maps (friends only). "Every quarter of this mechanic is validated. Nobody assembled the walk."
- **1:45 — LIVE DEMO (the wow).** Two presenters, two phones, opposite ends of the stage.
  1. A: profile (no photo), intent "beer", toggles search. Map glows.
  2. Both phones buzz simultaneously. B reads the banner aloud: "Someone compatible — 78%, wants beer, *quietly funny, will out-argue you about pizza*."
  3. Both tap **Open compass**. B walks; the arrow rotates; haptics go hot; the crowd watches the distance bucket shrink.
  4. They meet center-stage. A reads B's card. Bottles up. ("The interface is the street.")
- **3:30 — Safety by design.** Mutual by construction / zones not pins / ephemeral / 10-minute window / Vanish. Preempts the jury's first question.
- **4:00 — Tech, 30s.** Geofenced search sessions, geohash-6 zones, on-device attraction vectors (photos never leave the phone), MapLibre map, PWA.
- **4:30 — Close.** "No swipes. No chats. Meet for real." + health frame: "a social prescription you literally walk to." Team slide.

## 60-second submission video cut

Black screen → "Dating apps solved matching. They broke meeting." → phone screen-record: profile, search toggle, glowing map → both phones buzzing (split screen) → compass walk (fast cut) → handshake → logo + "Meet for real." Record twice, edit to ≤60s, English.

## Indoor-GPS reality (Tauron Arena)

GPS inside the arena is unreliable — **do not bet the demo on it.**

- Demo mode: `?demo=a` / `?demo=b` feed scripted converging positions through the identical pipeline (match, notify, compass math all real).
- Compass heading uses the device compass (magnetometer) — verify on both demo phones; if drifty on stage, the arrow rotation still reads perfectly from ~5 m away.
- Real-GPS test (for the repo/demo link): `adb reverse tcp:5173 tcp:5173` on Android over USB → `http://localhost:5173` (secure context for geolocation). Walk outside the arena.

## Rehearsal checklist

- [ ] 5 full run-throughs with both phones, out loud, someone timing
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
- **"How good is the AI matching really?"** → Honest answer: today it's a transparent compatibility function (interests + intents + a private attraction vector). The architecture is where a model plugs in; we credit AI use in the submission.
