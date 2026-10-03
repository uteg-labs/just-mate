# just-mate — product definition

## One-liner

just-mate helps two compatible strangers who want the same thing right now find each other in the real world — faceless, mutual, and on foot.

## Personas

- **Ania, 24, Kraków.** Deleted Tinder twice. Tired of being judged on photos and of chats that die. Wants: a way to meet people at a party/café/festival without the profile-picture economy.
- **Tomek, 28, moved to Kraków for work.** Knows nobody. Wants a beer buddy tonight, not a girlfriend. Swiping for friends feels absurd; Meetup is scheduled and slow.
- **Marta, 31.** Would love serendipity but not creepiness: no stranger should ever know where she is unless she said "now, this person, yes."

## Screens

1. **Onboarding / profile** (3 screens max): nickname (optional, never shown to others), intents (date / friends / beer / coffee / walking / sports / music), interests (chips). No photo upload in the demo; the "attraction profile" is described as on-device and private.
2. **Map**: dark map, glowing geohash zones (density of searching users), own position dot. One big toggle: **search mode** (default OFF). No list, no search field, no pins — by design.
3. **Match banner** (arrives on both phones simultaneously): "Someone compatible is in this zone — 78% · wants: beer · *quietly funny, will out-argue you about pizza*". Buttons: **Open compass** / Dismiss. Both must accept for the compass to unlock.
4. **Compass**: full-screen directional arrow (bearing only — never a map position of the other person), hot/cold color + haptics, distance bucket ("cold / warm / hot / burning"), 10:00 countdown, **Vanish** button always visible.
5. **Settings**: search default, activity intents editable, kill switch.

## Matching spec

- Intents must overlap (≥1 shared intent) — the activity IS the match context.
- Compatibility = `0.7 × Jaccard(interests) + 0.3 × intentOverlap`. Threshold ≥ 0.45.
- Attraction vector ("faces you like"): represented in the demo by a stable per-user random vector; pitch language: computed on-device, never uploaded as photos, only a similarity number leaves the phone.
- Pair cooldown 5 minutes after any match/dismiss.
- Personality card: 2 canned vibe lines, deterministic per user pair (hackathon stand-in for an LLM-generated card — Bielik would be the Polish-flavored swap).

## Zones & privacy spec

- Zone = geohash precision 6 (~1.2 km × 0.6 km at Kraków's latitude).
- Glow = count of search-mode users in the zone (including demo ghosts). No identities, no movement history.
- Server stores position only for the live socket session; nothing persisted.

## Match session lifecycle

`both searching + same zone + intents overlap + compat ≥ 0.45` → notify both → both accept → compass unlocked (10-min TTL, positions relayed only between the pair) → either Vanish or TTL expiry → session destroyed, cooldown starts.

## Out of scope (say it in the pitch — scope honesty scores)

Chat (the anti-chat IS the product), push-notification infrastructure, real ML training, photo upload, moderation tooling, backend persistence.

## Non-goals / future

Venue partnerships ("first beer" B2B), festival/campus density-first launch, on-device face-embedding for the attraction vector, RODO-compliant data-protection impact assessment for production.
