# JustMate Design System

**Meet for real.** JustMate helps two compatible strangers who want the same thing *right now* find each other in the real world: faceless, mutual, and on foot. You pick an intent (beer, coffee, a date), switch search on, and when a compatible person nearby is searching too, both phones ping at once. Both accept, a compass unlocks, and you walk to each other. No faces. No chat. No pins.

One product, one surface: the **Expo mobile app** (iOS first). Four screens: Onboarding, Home ("Where to?"), Match, Compass, plus a post-meet screen.

## Sources

- **JustMate docs** (local mount `just-mate/docs/`, mirrors `https://github.com/uteg-labs/just-mate/tree/main/docs`): `DESIGN.md` (visual, motion, haptics; the source for every token here), `STRUCTURE.md` (screens, flows), `PRODUCT.md` (rules, copy, states), `README.md`. The GitHub repo returned 404 to our importer (private or app not installed); everything was read from the local mount.
- **Fluid Functionalism** by Micka: `https://github.com/mickadesign/fluid-functionalism` and `https://www.fluidfunctionalism.com/`. Requested as the visual source for colours and components: neutral surface ladder, shadow ladder, Inter Variable with paired optical size, button press mechanics, switch geometry, badge recipe, spring tiers, tone of voice. Files read: `app/globals.css`, `tone-of-voice.md`, `registry/base/button.tsx`, `registry/base/switch.tsx`, `registry/default/badge.tsx`, `registry/default/lib/{springs,shape-context,font-weight}.ts(x)`, `lib/docs/icon-map.tsx`.
- **Mood references** (uploads): `assets/reference/mood-dark-light.jpg` (dark chrome, paper cards, segmented pill), `assets/reference/mood-monochrome.jpg` (monochrome, mono labels, dusk gradients).

Explore both repositories further when building new screens: the docs carry exact copy and state machines; Fluid Functionalism carries interaction detail beyond what is reproduced here.

## How the two sources merge

JustMate's DESIGN.md defines *what* (dark map, amber glow, type scale, springs, the three rules). Fluid Functionalism defines *how it looks up close* (true-neutral greys instead of blue-greys, layered shadows, Inter, 1px press collapse, see-through secondary fills). Where they conflict: JustMate wins on semantics and sizes (mobile: 44pt targets, 14px button radius), FF wins on neutrals and shadows. **Theme decision:** DESIGN.md specifies dark-only; per the brief this system ships **light as the default** and keeps the dark palette as a `.dark` scope.

---

## CONTENT FUNDAMENTALS

**Voice: calm courage.** Quiet, specific, never begging. The app gets out of the way once two people stand in front of each other.

- **Lowercase in-product status and system copy.** `invisible`, `searching: beer`, `offer expired`, `waiting for them…`, `finding signal…`, `cold / warm / hot / burning`. Titles and buttons use sentence case: "Where to?", "Find people", "Open compass".
- **Specific labels beat generic.** "Find people", "Stop searching", "Open compass", "Dismiss", "Vanish", "Enter the map", "We met". Never "OK", "Continue", "Home", "Submit".
- **Second person, present tense, active voice.** "You're invisible. Pick what you want right now." Nothing "can be" or "allows you to" (FF rule 5).
- **Short. One line per intro.** A fragment is fine (FF rule 1). "No photos here. Not yours, not theirs."
- **Numbers stay numeric** and lead: "78% match · wants: beer", "~4 compatible around here", "480 m", "10:00".
- **Consent made visible.** Captions explain what happens next: "unlocks only if they accept too".
- **Never blame or reveal rejection.** A dismissed offer reads "offer expired", never "they declined".
- **Vibe cards are lowercase, wry, two short clauses:** *"quietly funny — will out-argue you about pizza"*. They're the icebreaker that replaces "hey". (Vibe quotes are the one place an em dash appears; everywhere else follow FF rule 6: commas, colons, full stops.)
- **Plain words.** No "seamless", "powerful", "AI-powered". Honesty rule from PRODUCT.md: anything not real in the build is labelled "production path".
- **No emoji. No exclamation marks. No confetti language.** Delight comes from the walk, not the copy.
- Brand name written **JustMate** (one word, capital J and M) everywhere.

## VISUAL FOUNDATIONS

- **Theme:** **light is the default** (`:root`): FF paper ladder `#FAFAFA` → white, near-black `#171717` ink text, a pale greyscale map. `.dark` pins the original night palette (ink `#0A0A0D`, FF dark ladder) on any subtree, e.g. a night-mode compass; `.light` re-pins paper inside a dark scope.
- **Mood:** calm, bright, Apple-clean; warm amber light marks where people are.
- **Colour:** neutrals are FF's true-neutral ladders (light: `#FAFAFA / #F4F4F5 / #EDEDEF / #E5E5E5 / #FFFFFF`; dark: `#171717 → #484848` over `#0A0A0D`). Controls are monochrome like Fluid Functionalism: primary buttons and selected chips use the foreground fill (`#171717` on paper), secondary is a see-through tint, tertiary a 1px outline. One warm accent, amber `--glow #FFB23F`, is kept for zone glow and the match moment (Open compass, We met). Switch-on and focus use FF blue `#6B97FF`. Mint `--self` is the only dot ever drawn (your own position). Red `--danger` is reserved for Vanish; green `--success` for the both-accepted tick. Compass temperature: cold blue → warm amber → hot orange → burning white-hot. Colour never stands alone: always label + haptic.
- **Type:** Inter Variable (from FF) with weight paired to optical size (`--fw-*`). Scale from DESIGN.md: display 64/64 −1.6, large title 34/38 −0.7, title 22/26 −0.3, vibe 20/27 italic, headline 17/22, body 17/24, footnote 13/18 +0.1, caption 11/14 +0.4 uppercase. Tracking is size-specific; leading tightens as size grows. Changing numbers use tabular figures. Small metadata in a **mono uppercase label** (ui-monospace 11/14 +0.6), taken from the monochrome reference.
- **Spacing:** 4-pt grid (`4 8 12 16 24 32 48`). Screen gutter 16, sheet padding 24, targets ≥ 44. Primary action in the bottom third, status at the top.
- **Radii (FF pill shape):** every control is a full pill: buttons, chips, segmented, badges, pill rows. Check rows 20, cards 24, match card 32, sheet top 32. Concentric nesting (inner = outer − inset).
- **Backgrounds:** the map (prototype: plain `--map-bg` with a faint CSS street grid; production: maplibre + OpenFreeMap) or flat ink. No gradients as decoration; the only gradients are radial zone glows, the compass halo, and short scroll-edge fades (ink → transparent) instead of dividers.
- **Imagery:** none of people, ever (no faces rule). Imagery = the map. Reference mood is cool dusk, monochrome, low saturation.
- **Materials & transparency:** blur only for floating chrome over the map. Sheet = thick material (light `rgba(250,250,250,.78)`, dark `rgba(28,28,30,.72)`, 30px blur), pill/monogram = thin (light `rgba(255,255,255,.68)`, dark `rgba(44,44,46,.55)`, 18px). Chips and buttons on a sheet are solid: never translucent on translucent. Blurred surfaces get a 1px bright top edge. Modal tasks use a solid card + `--scrim` (28% light, 45% dark). Compass is fully opaque. Zone glows blend `multiply` on paper, `screen` on dark (`--glow-blend`).
- **Elevation:** FF shadow ladder, levels 1–8, each paired with a surface. Dark recipe = inset highlight + inset ring + stacked drops; light recipe = 1px ring + halving drops. The primary CTA gets a soft amber glow shadow.
- **Cards:** solid surface, no border (the shadow's 1px ring does the edge), radius 20, 16–22px padding. No coloured left-border accents.
- **Motion:** springs, critically damped by default (CSS `--ease-spring cubic-bezier(.23,1,.32,1)`): default 400ms, snappy 300ms, sensor 250ms. Bounce (`--ease-momentum`) only after a flick carrying velocity. Things leave the way they came: sheet up/down, match from the top, compass expands from its button, zones grow from centre. No idle loops except the 1Hz searching dot. Reduce Motion → 200ms cross-fades.
- **Hover (pointer only):** FF-style: fills shift ~10% toward the background, ghost gains `--hover` tint, label weight 450 → 550 (opsz-paired, so width holds), icon stroke 1.5 → 2.
- **Press:** feedback on press-in, not release: scale 0.97 (100ms), spring back on release; the commit happens on release. Fills darken (primary → `--glow-press`).
- **Focus:** single FF ring `#6B97FF`, 1px, 2px offset.
- **Layout rules:** map fullscreen; pill fixed top; sheet fixed bottom; Vanish bottom-left on compass, never covered.

## ICONOGRAPHY

- **Lucide** line icons, the default set of Fluid Functionalism (`registry/default/lib/icon-context`). 24 grid, round caps/joins, stroke 1.5 at rest, 2 on hover/selected.
- 40 glyphs copied programmatically from `lucide-static@0.460.0` into `assets/icons/*.svg`, and inlined into `components/core/Icon.jsx` (`<Icon name="beer" />`, `ICONS` map). For any other glyph, pull the same version from unpkg/lucide-static; don't hand-draw.
- Intent icons: heart (Soul mate), beer, coffee, ferris-wheel (Attractions), users (Friends), dumbbell (Sports), music.
- The compass arrow is Lucide `navigation-2`, filled with the bucket colour.
- No emoji. No unicode pictographs, except `●` for searching status in docs and `·` as a separator in copy.
- No logo was supplied: the wordmark is the name set in Inter Bold, `JustMate`, −2px tracking. **Do not invent a mark.**

---

## Index

- `styles.css` — entry point; `@import`s only.
- `tokens/` — `fonts.css`, `colors.css` (light default + `.dark` scope), `typography.css`, `spacing.css`, `elevation.css`, `motion.css`, `base.css` (element defaults + `.t-*` type classes).
- `assets/fonts/InterVariable.ttf` · `assets/icons/` (Lucide SVGs) · `assets/reference/` (mood uploads).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Elevation, Motion, Brand).
- `components/` — React primitives, each with `.d.ts` + `.prompt.md`, one card per folder.
- `ui_kits/app/` — interactive recreation of the mobile app (`index.html`).
- `SKILL.md` — agent skill entry. `github.md` — source association.

### Components

- core: **Button**, **IconButton**, **Icon** (+ `ICONS`)
- forms: **Chip**, **Segmented**, **Switch**, **CheckRow**
- display: **VibeCard**, **Badge**, **StepDots**, **Monogram**, **Card**
- feedback: **StatusPill**, **MatchCard**
- surfaces: **Sheet**
- compass: **CompassDial**, **BucketLabel** (+ `BUCKETS`), **Countdown**
- map: **ZoneGlow**

Derived from DESIGN.md / STRUCTURE.md: Button (primary/ghost/Vanish), Chip, StatusPill, Sheet, MatchCard, VibeCard, CompassDial, BucketLabel, Countdown, ZoneGlow, Monogram, CheckRow.

### Intentional additions

- **Icon** — wrapper for the copied Lucide set.
- **Switch** — FF switch geometry, for settings (haptics, reduce motion); search mode stays a Button.
- **Segmented** — FF tabs pattern, as in the reference upload; for any 2–4-way view switch.
- **Badge** — FF badge recipe for aggregate counts ("~4 compatible around here") and states.
- **StepDots** — FF carousel-dots pattern for onboarding progress.
- **Card** — FF surface/shadow pairing for post-meet totals and settings groups.
