# JustMate — design system (visual · motion · interaction)

The source of truth for how the app **looks, moves and feels**. Screens and flows live in `STRUCTURE.md`. This doc says how to build them.

Source: the **JustMate Design System** project in Claude Design, https://claude.ai/design/p/c59ab891-429e-48c6-8f77-d899971225cc. It covers the token kit and the app prototype (*JustMate App*). Where an older note in this repo disagrees with either, Claude Design wins. Token sources mirror this doc one to one: native = `mobile/src/theme/*.ts`, web = `mobile/src/theme/web.css`. Missing token → add it here first, then to both.

Foundations:

- **Apple's interface principles** (WWDC *Designing Fluid Interfaces*, *The Details of UI Typography*, *Principles of Great Design*), as distilled in [emilkowalski/skills › apple-design](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md), translated to our stack: **Expo · react-native-reanimated · react-native-gesture-handler · @gorhom/bottom-sheet · expo-blur · expo-haptics · expo-sensors · lucide-react-native**.
- **[Fluid Functionalism](https://www.fluidfunctionalism.com/)** ([source](https://github.com/mickadesign/fluid-functionalism)) for the close-up: true-neutral surface ladder, layered shadows, Inter Variable with paired optical size, monochrome controls, button press mechanics, switch geometry, badge recipe, tone of voice.

> The through-line: **motion starts from the current on-screen value, inherits the finger's velocity, projects momentum forward, and can be grabbed and reversed at any instant.** Springs make that natural, so springs are the default for everything a user can touch.

## 0. Design intent — what the user should feel

**Calm courage.** Calm, bright, Apple-clean: a pale paper map with warm amber light where people are. It never shouts, never begs for attention, and gets out of the way the moment two people stand in front of each other. When a match arrives the surface turns to ink, and the walk happens at night: compass and post-meet are the dark rooms. Delight comes from the compass walk and the simultaneous buzz, not from confetti.

The three product rules are also visual rules:

| Rule | Visual consequence |
|---|---|
| No faces | No avatars of other people, ever. No imagery of people at all. Identity = vibe card typography only. Own avatar = monogram |
| No chat | No text inputs after onboarding. No message bubbles, no typing indicators |
| No pins | No point markers for people. Location is only ever a soft zone glow or a compass bearing. The only dot drawn is your own (`self`) |

## 1. Principles (the names we reason with)

1. **Purpose**: one surface over the map that morphs through eight shapes (auth, onboarding, select, search, match, compass, post-meet, settings; §13.1). Every new element must earn its place on one of them.
2. **Agency**: invisible by default; searching is a deliberate per-occasion act; Vanish is always one tap away.
3. **Responsibility**: safety UI is never hidden, paywalled, or animated slowly. Vanish has no confirmation dialog and no animation delay on its effect.
4. **Familiarity**: Home borrows Bolt/Uber's map + sheet; Match borrows the iOS notification banner; Compass borrows the system compass. No novel gestures to learn.
5. **Flexibility**: respect Dynamic Type, Reduce Motion, Reduce Transparency, Increase Contrast (§11). One-handed: primary actions live in the bottom third.
6. **Simplicity, not minimalism**: one primary action per screen. Common path first; profile and settings one level deeper (monogram).
7. **Craft**: every value below is a token, not a guess. If it isn't in this doc, add it here first.
8. **Delight**: the sum of the above. Two phones buzzing on the same frame, an arrow that feels physical, a glow that breathes in when people arrive.

## 2. Voice & content

**Voice: calm courage.** Quiet, specific, never begging.

- **Lowercase in-product status and system copy**: `invisible`, `searching: beer`, `offer expired`, `waiting for them…`, `finding signal…`, `cold / warm / hot / burning`. Titles and buttons use sentence case: "What are you up for?", "Find people for beer", "Open compass".
- **Specific labels beat generic**: "Find people for coffee or wine", "Stop searching", "Open compass", "Dismiss", "Vanish", "We met", "Same again next week?", "Back to the map", "Call me Alex", "Train my taste", "Keep this vibe", "Enter the map". A disabled CTA says what's missing: "Pick 2 more", "Type your name", "Pick at least one". Never "OK", "Continue", "Home", "Submit".
- **Second person, present tense, active voice**: "You're invisible. Pick what you want right now." Nothing "can be" or "allows you to".
- **Short.** One line per intro. A fragment is fine: "No photos here. Not yours, not theirs."
- **Numbers stay numeric and lead**: "~4 compatible around here", "0:45", "10:00 left · beer", "24 – 35", "3 of 6".
- **Consent made visible.** Captions say what happens next: "unlocks only if they accept too".
- **Never blame or reveal rejection.** A dismissed offer reads "offer expired", never "they declined".
- **Vibe cards are lowercase, wry, two short clauses**: *"quietly funny — will out-argue you about pizza"*. They are the icebreaker that replaces "hey". Vibe quotes are the one place an em dash appears in product copy; everywhere else use commas, colons and full stops.
- **`·` is the separator** in copy and metadata ("wants · beer", "5 meetings · this device only").
- **Plain words.** No "seamless", "powerful", "AI-powered". Anything not real in the build is labelled "production path" (`PRODUCT.md`).
- **No emoji. No exclamation marks. No confetti language.** Delight comes from the walk, not the copy. `●` appears only as the searching status glyph in docs.
- Brand name is **JustMate** (one word, capital J and M) everywhere: product, docs, store listing, video, web. Never "just-mate", "Just Mate" or "Justmate". The lowercase `just-mate` survives only in identifiers (repo slug, file names, Expo slug).

## 3. Color

### 3.1 Theme

- **Light is the default** (`:root`, `.light`): paper ladder `#FAFAFA` → white, near-black ink text `#171717`, a pale greyscale map.
- **`.dark`** pins the night palette on a subtree (ink `#0A0A0D`, neutral dark ladder). The app uses it in exactly these places:
  - **match card**: *ink* tone, pure `#000` + `shadow-8`;
  - **compass** and **post-meet**: *night* tone, `--jm-ink`, fully opaque;
  - the **open category card** in the bento (a `fg-1` square with `.dark` content);
  - the **selfie panel** on the verify step.
- `.light` re-pins paper inside a dark subtree. The **vibe badge is always `.light`**, a paper card even on the ink match card.
- The app does not follow the system appearance: light everywhere else.
- Controls are **monochrome**: primary buttons, selected chips, the segmented indicator and checked rows use the foreground fill (`fg-1` with `background` text). Secondary is a see-through tint, tertiary a 1px outline.
- **One warm accent**, amber `glow`, for the zone glow and the match moment only (**Open compass**, **We met**).
- Colour never stands alone: always a label, and a haptic where the moment has one.

Native keys are the camelCase of the CSS name (`--surface-card` → `surfaceCard`, `--fg-1` → `fg1`, `--temp-cold` → `tempCold`).

### 3.2 Surfaces & text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--jm-ink` | `#0A0A0D` | `#0A0A0D` | brand ink: night background, dark wordmark ground |
| `--surface-1` | `#FAFAFA` | `#171717` | base surface, sheet without material |
| `--surface-2` | `#FCFCFC` | `#1E1E1E` | elevation level 2 |
| `--surface-3` | `#FFFFFF` | `#252525` | level 3 (cards, vibe card) |
| `--surface-4` | `#FFFFFF` | `#2C2C2C` | level 4 |
| `--surface-5` | `#FFFFFF` | `#333333` | level 5 |
| `--surface-6` | `#FFFFFF` | `#3A3A3A` | level 6 |
| `--surface-7` | `#FFFFFF` | `#414141` | level 7 |
| `--surface-8` | `#FFFFFF` | `#484848` | level 8 (match card) |
| `--fg-1` | `#171717` | `#F5F5F7` | primary text, primary/selected fills |
| `--fg-2` | `#737373` | `rgba(235,235,245,0.62)` | secondary text, mono labels, ghost labels |
| `--fg-3` | `#A3A3A3` | `rgba(235,235,245,0.32)` | tertiary, grabber, inactive step dots, compass ticks |
| `--fg-muted` | `#737373` | `#A3A3A3` | muted text on `--muted`, neutral badge dot |

On paper, levels 3–8 share white and differ only by shadow (§6).

### 3.3 Accent — warm light

| Token | Light | Dark | Use |
|---|---|---|---|
| `--glow` | `#FFB23F` | `#FFB23F` | zone glow, `glow` button, searching dot |
| `--glow-core` | `#FFD9A0` | `#FFD9A0` | centre of dense zones |
| `--on-glow` | `#1A1205` | `#1A1205` | text and icons on amber |
| `--glow-hover` | `glow` 90% + white (oklab) | same | `glow` button hover |
| `--glow-press` | `glow` 86% + black (oklab) | same | `glow` button pressed |
| `--glow-blend` | `multiply` | `screen` | zone glow blend mode over the map |
| `--link` | `#B86E00` | `#FFB23F` | inline links (amber is never body text on paper) |

Zone glow gradient (`ZoneGlow`): radial, `rgba(255,190,90,a)` at 0% → `rgba(255,160,40,0.6a)` at 35% → `rgba(255,160,40,0.14)` at 70% → transparent, where core opacity `a = min(0.9, 0.25 + 0.06·n)`.

### 3.4 Reserved colours

| Token | Light | Dark | Use |
|---|---|---|---|
| `--self` | `#14B8A6` | `#5EEAD4` | mint: own position dot on the map, the only dot ever drawn |
| `--danger` | `#FF3B30` | `#FF453A` | **Vanish only**, never decorative |
| `--success` | `#28C840` | `#30D158` | the both-accepted tick, nothing else |
| `--focus-ring` | `#6B97FF` | `#6B97FF` | focus ring; switch on (hover `#5C89F2`) |

### 3.5 Compass temperature (distance buckets)

Physical metaphor: metal heating up. Colour is always paired with a label and a haptic.

| Bucket | Distance | Token | Light | Dark |
|---|---|---|---|---|
| cold | over 200 m | `--temp-cold` | `#3B8FDB` | `#64B5F6` |
| warm | under 200 m | `--temp-warm` | `#F5A524` | `#FFB23F` |
| hot | under 80 m | `--temp-hot` | `#FF7A1A` | `#FF7A1A` |
| burning | under 30 m | `--temp-burning` | `#FFE2B8` | `#FFF1DC` |

`burning` is white-hot plus an outer `temp-hot` ring and glow, on purpose, so it never collides with `danger` red.

### 3.6 Overlays, lines, scrims

| Token | Light | Dark | Use |
|---|---|---|---|
| `--overlay` | `0 0 0` | `255 255 255` | rgb triplet for `rgb(var(--overlay) / a)` mixes |
| `--hover` | `rgb(0 0 0 / 0.04)` | `rgb(255 255 255 / 0.06)` | ghost/tertiary hover |
| `--active` | `rgb(0 0 0 / 0.07)` | `rgb(255 255 255 / 0.10)` | ghost/tertiary pressed |
| `--tint` | `rgb(0 0 0 / 0.06)` | `rgb(255 255 255 / 0.12)` | secondary button, `tint` icon button |
| `--tint-hover` | `rgb(0 0 0 / 0.05)` | `rgb(255 255 255 / 0.16)` | secondary hover |
| `--track-off` | `#E5E5E5` | `#333333` | switch track off, neutral badge fill |
| `--thumb` | `#FFFFFF` | `#FFFFFF` | switch and range slider thumbs |
| `--white` | `#FFFFFF` | `#FFFFFF` | badge face light: top highlight, pattern, shine, blob and metal tints |
| `--black` | `#000000` | `#000000` | *ink* morph tone (match card), badge edge darkening |
| `--separator` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.08)` | inset 1px rings on chips, rows, dial; only where a scroll-edge fade can't be used |
| `--hairline-top` | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.12)` | 1px bright top edge on blurred surfaces |
| `--scrim` | `rgba(0,0,0,0.28)` | `rgba(0,0,0,0.45)` | dim behind modal tasks (match) |
| `--border` | `fg-1` 12% over transparent | same | tertiary outline, dot badge |

### 3.7 Materials

| Token | Light | Dark |
|---|---|---|
| `--material-thick` | `rgba(250,250,250,0.78)` | `rgba(28,28,30,0.72)` |
| `--material-thin` | `rgba(255,255,255,0.68)` | `rgba(44,44,46,0.55)` |
| `--blur-thick` | `saturate(180%) blur(30px)` | same |
| `--blur-thin` | `saturate(160%) blur(18px)` | same |

Rules in §5.

### 3.8 Map

| Token | Light | Dark |
|---|---|---|
| `--map-bg` | `#ECECEE` | `#0E0E11` |
| `--map-line` | `rgba(0,0,0,0.035)` | `rgba(255,255,255,0.03)` |
| `--map-street` | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.05)` |

Native: `expo-maps` (Apple Maps on iOS, Google Maps on Android) in the light colour scheme, with muted, near-greyscale styling where the provider allows, so the amber glow and mint dot are the only colour. Web and prototypes use `--map-bg` with a faint street grid (`--map-line`, `--map-street`), no external tiles.

### 3.9 Semantic aliases

| Alias | Light | Dark |
|---|---|---|
| `--background` | `#FAFAFA` | `#0A0A0D` |
| `--foreground` · `--text-body` | `fg-1` | `fg-1` |
| `--text-secondary` · `--text-tertiary` | `fg-2` · `fg-3` | `fg-2` · `fg-3` |
| `--surface-card` | `#FFFFFF` | `#171717` |
| `--surface-raised` | `#F4F4F5` | `#252525` |
| `--surface-chip` | `#EDEDEF` | `#252525` |
| `--muted` · `--muted-foreground` | `#F4F4F5` · `fg-muted` | `#1E1E1E` · `fg-muted` |
| `--cta-bg` · `--cta-fg` | `glow` · `on-glow` | same |

## 4. Typography

**Inter.** Web: Inter Variable (`mobile/assets/fonts/InterVariable.ttf`, weight axis 100–900, optical size axis). Fallback stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`. Mono: `ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace`.

Native: React Native can't drive a variable font's weight axis, so the app embeds static cuts from `@expo-google-fonts/inter` with the `expo-font` config plugin. Each cut is its own family, named after its PostScript name on both platforms, and the family carries the weight (`font.*` in `mobile/src/theme/type.ts`; never set `fontWeight` or `fontStyle` next to it):

| Web weight | Native family |
|---|---|
| `--fw-normal` 400 | `Inter-Regular` |
| `--fw-medium` 450 | `Inter-Medium` (500) |
| `--fw-semibold` 550 | `Inter-SemiBold` (600) |
| `--fw-bold` 700 | `Inter-Bold` |
| medium italic (vibe) | `Inter-MediumItalic` |

### 4.1 Weight paired with optical size

Weight and optical size move together, so a label can shift weight on hover without changing width.

| Token | Variation settings | Use |
|---|---|---|
| `--fw-normal` | `"wght" 400, "opsz" 14` | body, footnote |
| `--fw-medium` | `"wght" 450, "opsz" 15` | button and chip labels at rest, vibe quote, badges |
| `--fw-semibold` | `"wght" 550, "opsz" 18` | labels on hover/press/selected, title, headline, caption, status pill |
| `--fw-bold` | `"wght" 700, "opsz" 25` | display, large title, wordmark |

### 4.2 Scale

| Token | Size / line-height | Weight | Letter-spacing | Use |
|---|---|---|---|---|
| `display` | 64 / 64 | bold | −1.6 | compass countdown (tabular) |
| `largeTitle` | 34 / 38 | bold | −0.7 | select headline, onboarding step titles, "Looking for beer", "Say hi to Ola.", category in the open card |
| `title` | 22 / 26 | semibold | −0.3 | screen/section headers, bucket label |
| `vibe` | 20 / 27 | medium italic | −0.2 | the vibe-card quote (compact: 17 / 23) |
| `headline` | 17 / 22 | semibold | −0.1 | row labels, card headings |
| `body` | 17 / 24 | normal | 0 | copy |
| `footnote` | 13 / 18 | normal | +0.1 | captions ("unlocks only if they accept too"), `fg-2` |
| `caption` | 11 / 14 | semibold | +0.4 | small uppercase labels |
| `mono` | 11 / 14 | normal | +0.6 | metadata label, uppercase, `fg-2`: "their vibe", "match · wants: beer", bucket range, "left" |

Button labels: 16 / 15 / 13 (lg / md / sm), medium → semibold on hover and press, −0.1. Status pill: 13 / 18 semibold.

Rules (from *The Details of UI Typography*):

- **Tracking is size-specific.** Large text → negative letter-spacing; body ≈ 0; small text → slightly positive. Never one `letterSpacing` for all styles.
- **Leading tracks size inversely.** Tight on display, comfortable on body.
- **Hierarchy = weight + size + leading as a set.** Emphasise with weight before size.
- **Numbers that change use tabular figures** (`fontVariant: ['tabular-nums']` / `font-variant-numeric: tabular-nums`): countdown, offer timer, search clock, zone counts, age range, badges and serials.
- **Respect Dynamic Type** (`allowFontScaling` stays on). Cap only fixed chrome with `maxFontSizeMultiplier` (countdown, pill: `1.3`). Layout grows with text; no fixed-height text containers.
- Headings `text-wrap: balance`, paragraphs `pretty` on web.

On translucent surfaces (§5) bump one weight step and use `fg-1`, never `fg-3` (flat grey dies on blur).

## 5. Materials & depth

Translucency = a floating functional layer over the map; the map keeps moving underneath. Blur is only for floating chrome over the map.

| Surface | Material | Notes |
|---|---|---|
| Morph surface, *paper* tone (auth, select, search) | thick: `material-thick` + `blur-thick` + inset `hairline-top` + `shadow-6` · native `BlurView` thick material, intensity ~80 | largest surface → thickest blur |
| Status pill, monogram, floating icon buttons | thin: `material-thin` + `blur-thin` · native `BlurView` thin material | small → lighter; `shadow-3` |
| Chips, buttons, rows on the sheet | **solid** (`surface-chip`, `fg-1`, `tint`) | never translucent on translucent |
| Morph surface, *page* tone (onboarding, settings) | solid `background` (paper) | full screen, no material |
| Match | *ink* tone: solid `#000` + `shadow-8` (`.dark`) **+ `--scrim`** over the map | modal task → dim to focus; the status bar hides |
| Compass, post-meet | *night* tone: fully opaque `--jm-ink` (`.dark`) | the walk is the only thing on screen; dark status bar |

- Native tints follow the scope: `systemThickMaterialLight` / `systemThinMaterialLight` on paper, the `…Dark` pair inside `.dark`.
- **Bright top edge** on blurred surfaces: inset 1px `--hairline-top`, light catching the material.
- **Scroll-edge fades, not dividers**: where content meets the sheet or pill, fade with a short gradient mask instead of a 1px border.
- **Materialize, don't just fade**: blurred surfaces enter by animating blur intensity + scale (0.96 → 1) + opacity together.
- **No decorative gradients.** The only gradients are radial zone glows, the compass halo, the brand mark's glows, and scroll-edge fades.
- Android: `experimentalBlurMethod="dimezisBlurView"`; if performance or support is poor, fall back to the reduced-transparency style (§11).

## 6. Elevation

Fluid Functionalism shadow ladder, levels 1–8, each paired with `surface-N`. Full values in `web.css`; native uses the same strings through React Native's `boxShadow` style.

- **Light recipe**: a 1px ring (`0 0 0 1px`) plus halving drops, all at `rgb(0 0 0 / 0.06)`. Level N adds drops of 1, 3, 6, 12, 24, 48, 96px (offset = blur, spread = −blur/2).
- **Dark recipe**: inset 1px top highlight (0.01 → 0.06 white) + inset 1px ring (0.02 → 0.06 white) + an outer black ring (0.12 → 0.22) + the same stacked drops at `rgba(0,0,0,0.18)`.
- **`--shadow-glow`** (amber button only): light `0 0 0 1px rgba(255,178,63,0.45), 0 8px 24px -8px rgba(255,160,40,0.55)` · dark `0 0 0 1px rgba(255,178,63,0.35), 0 8px 32px -8px rgba(255,178,63,0.55)`.
- **`--shadow-thumb`** (switch thumb): `0 1px 2px rgba(0,0,0,0.25)` in both scopes.
- **`--shadow-badge`** (vibe badge card): `0 34px 50px -22px rgba(0,0,0,0.38), 0 10px 20px -10px rgba(0,0,0,0.2)` in both scopes.
- **`--shadow-clip`** (vibe badge metal clip): `0 6px 10px -4px rgba(0,0,0,0.4)` in both scopes.
- **`--shadow-sheet`**: light `0 0 0 1px rgb(0 0 0 / 0.05), 0 -12px 40px -12px rgba(0,0,0,0.14)` · dark `0 -1px 0 0 hairline-top, 0 -24px 48px -12px rgba(0,0,0,0.5)`.

Level 3 is the default: cards, vibe card, status pill, floating icon buttons. Level 8 is the match card. Go higher only for something that floats above another card.

Cards have no border: the shadow's 1px ring is the edge. No coloured left-border accents.

## 7. Layout, spacing, radii

- **4-pt grid.** Tokens: `xs 4 · s 8 · m 12 · l 16 · xl 24 · xxl 32 · xxxl 48`.
- Screen gutter `--gutter` 16. Sheet internal padding `--sheet-padding` 24. Card padding 16–22.
- **Hit targets ≥ 44 × 44 pt** (`--hit-min`). Controls drawn smaller (sm button 36, chips 32/40, monogram 36) get `hitSlop` to reach 44.
- **Grouping & mapping**: controls sit next to what they change. Intent chips live on the sheet that starts the search; Vanish lives next to the countdown it kills.
- Primary action in the bottom third (thumb zone); status at the top. Map fullscreen, pill fixed top, sheet fixed bottom. On the compass, Vanish sits bottom-left and is never covered.

### Radii

Every control is a full pill. iOS uses `borderCurve: 'continuous'` on every rounded rect.

| Token | Value | Use |
|---|---|---|
| `--radius-button` | full (`9999`) | buttons, icon buttons |
| `--radius-chip` | full | chips, segmented and its indicator, badges, status pill, step dots |
| `--radius-row` | 20 | check rows, list rows |
| `--radius-card` | 24 | cards, vibe card |
| match card | 32 | match card |
| `--radius-sheet` | 32 | `Sheet` component top corners |
| `--radius-morph` · morph sheet · morph card | 40 | the morph surface as a floating sheet or card, inset 8 from the screen edges (§13.1) |
| morph full | device corner | onboarding, settings, compass, post-meet (48 on the 402 × 874 frame) |
| `--radius-tile` · `--radius-tile-open` · `--radius-tile-pill` | 20 · 28 · 26 | category bento: tile · open card · folded pill (§13.3) |
| `--radius-badge` · selfie panel | 20 · 32 | vibe badge (§13.4) · selfie panel (§13.6) |
| `--radius-container` | 12 | small containers inside cards |
| `--radius-inner` | 8 | inner elements, focus target of the switch row |
| `--radius-full` | `9999` | anything circular |

**Concentric nesting**: inner radius = outer radius − inset.

## 8. Motion

### 8.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-spring` | `cubic-bezier(0.23, 1, 0.32, 1)` | default: critically damped, no overshoot |
| `--ease-momentum` | `cubic-bezier(0.34, 1.36, 0.64, 1)` | **only** after a flick carrying velocity |
| `--ease-out-quad` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | non-touch fades, reduce-motion fallback |
| `--dur-fast` | 80 ms | colour, fill and weight shifts on hover/press |
| `--dur-press` | 100 ms | press-in scale |
| `--dur-moderate` | 160 ms | small indicators: segmented slide, switch thumb, step dots |
| `--dur-fade` | 200 ms | cross-fades, countdown colour, reduced-motion replacement |
| `--dur-sensor` | 250 ms | compass arrow re-targeting |
| `--dur-snappy` | 300 ms | chip select, button release, pill content swap |
| `--dur-default` | 400 ms | repositioning, overlays, glow size, programmatic sheet moves |
| `--press-scale` | 0.97 | pressed scale for buttons, chips, bento tiles, mode cards |
| morph | 520 ms (Reduce Motion 220 ms) | the one surface changing shape (§13.1) |
| bento | 440 ms | category tile ↔ open card ↔ folded strip |
| `--stagger-word` | 55 ms | per-word delay in the rotating headline |
| `--dur-follow` | 120 ms | badge tilt following the finger |
| `--dur-word` | 360 ms | headline word opacity in / out |
| `--dur-lift` · `--ease-lift` | 420 ms · `cubic-bezier(0.5, 0, 0.75, 0)` | badge lifting away |
| `--dur-settle` | 700 ms | badge tilt settling back after release |
| `--dur-swing` | 1100 ms | badge swinging back on its strap after a drag |
| `--dur-drop` | 1300 ms, `ease-out` per keyframe | badge dropping in on its strap |
| `--dur-headline` | 3200 ms | how long each headline line holds |

### 8.2 Springs (native, default for anything touchable)

Apple's two designer-facing parameters map onto Reanimated's `withSpring({ dampingRatio, duration })`:

- **dampingRatio**: `1` = no overshoot (`--ease-spring` on web). `< 1` = bounce (`--ease-momentum`).
- **duration ≈ Apple "response"**: how fast it gets there (ms), matched to the duration tokens above.

| Token (`mobile/src/theme/motion.ts`) | dampingRatio | duration | Web equivalent | Use |
|---|---|---|---|---|
| `spring.default` | 1.0 | 400 | `--dur-default` `--ease-spring` | repositioning, overlays, glow size changes, programmatic sheet moves |
| `spring.snappy` | 1.0 | 300 | `--dur-snappy` `--ease-spring` | chip select, button release, pill content swap |
| `spring.moderate` | 1.0 | 160 | `--dur-moderate` `--ease-spring` | segmented indicator, switch thumb, step dots |
| `spring.momentum` | 0.8 | 300 | `--dur-snappy` `--ease-momentum` | **only** after a flick/drag release carrying velocity (sheet snap) |
| `spring.sensor` | 1.0 | 250 | `--dur-sensor` `--ease-spring` | compass arrow re-targeting on each heading sample |
| `spring.morph` | 1.0 | 520 | 520 ms `--ease-spring` | morph surface geometry (position, size, radius) |
| `spring.bento` | 1.0 | 440 | 440 ms `--ease-spring` | bento tile ↔ open card ↔ folded strip |
| `spring.settle` | 1.0 | 700 | `--dur-settle` `--ease-spring` | badge tilt back to flat after release |
| `spring.swing` | 0.8 | 1100 | `--dur-swing` `--ease-momentum` | badge swinging back after a drag, carrying the release velocity |

Rule: **bounce only when the user's gesture carried momentum.** A sheet you flicked may overshoot; a match card that arrived on its own may not. The compass arrow uses `dampingRatio 1`: sensor noise + overshoot reads as wobble.

```ts
// mobile/src/theme/motion.ts
export const spring = {
  default: { dampingRatio: 1, duration: 400 },
  snappy: { dampingRatio: 1, duration: 300 },
  moderate: { dampingRatio: 1, duration: 160 },
  momentum: { dampingRatio: 0.8, duration: 300 },
  sensor: { dampingRatio: 1, duration: 250 },
  morph: { dampingRatio: 1, duration: 520 },
  bento: { dampingRatio: 1, duration: 440 },
  settle: { dampingRatio: 1, duration: 700 },
  swing: { dampingRatio: 0.8, duration: 1100 },
} as const
```

`spring.morph` drops to 220 ms under Reduce Motion (§13.1).

Non-touch fades (cross-fades, reduced motion) use `withTiming(…, { duration: 200, easing: Easing.out(Easing.quad) })`. Colour and weight shifts use `withTiming` at 80 ms.

### 8.3 Response — kill latency

- **Feedback on press-in, not release.** All pressables scale to `0.97` on press-in (100 ms) and spring back with `spring.snappy`; the action commits on release. Icon buttons press to `0.94`, full-width check rows to `0.985`.
- **Fills darken on press**: primary `fg-1` → 80% toward `background`; `glow` → `--glow-press`; danger → 85% toward black; ghost/tertiary gain `--active`. The 1px outer ring collapses to 0 while pressed.
- No debounces or artificial delays on the input path. Sending `session`, `accept`, `vanish` is optimistic: the UI changes in the same frame, the socket catches up.
- Continuous feedback during gestures: the sheet tracks the finger 1:1 the whole way, never animates only at the end.

### 8.4 Hover (pointer only: web, iPad pointer)

- Fills shift toward the background: primary 90% `fg-1`, `glow` → `--glow-hover`, danger 92%, chips mix 6% of `--overlay`.
- Ghost and tertiary gain `--hover`; ghost label `fg-2` → `fg-1`.
- Label weight `--fw-medium` → `--fw-semibold` (opsz-paired, so width holds).
- Icon stroke 1.5 → 2.
- Never on touch: hover state only for `pointerType === "mouse"`.

### 8.5 Interruptibility

- Never lock input during a transition. A sheet mid-snap can be grabbed; the match card mid-entry can be tapped.
- Always animate from the **current presented value**. Reanimated shared values + `withSpring` do this by default; never reset to a target before animating.
- No `LayoutAnimation` or fixed-duration keyframes on anything gesture-driven.
- Animate only `transform` and `opacity` (UI thread). Keep gesture logic in worklets.

### 8.6 Gestures — draggable surfaces

The morph surface sizes to its content. Over the map (select, search) it has two detents: open, and an 80 pt peek so the whole map shows. A 20 pt grab strip along its top edge carries a grabber (36 × 5 `fg-3`, 8 from the top); drag it down to the peek, drag or tap the peek to bring the sheet back. A new shape always opens. Wherever something is dragged (the vibe badge, the swipe cards, any future draggable sheet), these rules apply:


- **1:1 tracking**, respecting the grab offset (`@gorhom/bottom-sheet` does this; keep `enableOverDrag`).
- **Hysteresis ~10 pt** before committing to a drag direction, so taps on chips don't move the sheet.
- **Rubber-band** past the top snap point instead of a hard stop.
- **Momentum projection** picks the snap point from where the flick is *going*, not where the finger lifted:

```ts
// worklet: Apple's projection (decelerationRate 0.998 ≈ scroll feel)
export function project(velocity: number, d = 0.998) {
  "worklet"
  return ((velocity / 1000) * d) / (1 - d)
}
// on end: target = nearestSnap(translateY + project(e.velocityY))
// translateY.value = withSpring(target, { ...spring.momentum, velocity: e.velocityY })
```

- **Velocity handoff**: pass the release velocity into the spring (`velocity` option, px/s), no seam between drag and animation.
- **Decide commit vs. reverse by velocity sign**, not by position past the halfway line.

```ts
export function rubberband(overshoot: number, dimension: number, c = 0.55) {
  "worklet"
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot))
}
```

### 8.7 Spatial consistency

Things leave the way they came, and originate from what triggered them.

| Element | Enters | Exits |
|---|---|---|
| Morph surface | it never enters or exits; it changes shape (§13.1) | |
| Sheet → match card | the floating sheet springs up into a card at the top, like a system notification | back down into the sheet |
| Match card → compass | the card grows to full screen (night) | Vanish shrinks it back into the select sheet |
| Select → settings | the sheet grows to a full page (from the monogram's tap) | back down into the sheet |
| Onboarding steps | slide in 28 px from the side of travel (right on next, left on back) | the reverse |
| Category tile | grows in place into the open card; siblings fold under it | the card shrinks back into its slot |
| Vibe badge | drops in on its strap from above | lifts away upward |
| Zone glow | grows from its centre (scale 0.6 → 1 + opacity) | shrinks into its centre |

### 8.8 Hint in the direction of the outcome

- Tapping **Find people**: the sheet's content cross-fades to the search sheet while the heat field fades in and grows (scale 0.94 → 1, 700 ms, origin just above the own dot) and the street grid brightens from 60% to full, pointing at "the map is now live".
- Compass bucket change: the halo and arrow colour sweep in the arrow's direction, not a flat cross-fade.

### 8.9 Ambient motion (careful)

- No idle looping animations on large areas (avoid slow ~0.2 Hz oscillation, a vestibular trigger).
- One sanctioned exception: the select-sheet headline rotates every 3.2 s (§13.8). It pauses while a category is open and holds the first line under Reduce Motion.
- Short-lived loading indicators (three 5 pt dots pulsing 1 Hz, staggered 0.15 s) are allowed while something is actually loading.
- Zone glow changes animate **once per data update** with `spring.default`; no continuous breathing.
- The searching dot (8 pt in the pill, 7 pt in the search sheet): amber, 1 Hz pulse, opacity 1 → 0.45, scale 1 → 0.8. Disabled under Reduce Motion.

## 9. Iconography

- **Lucide** line icons: `lucide-react-native` on native, `lucide-react` on web. 24 grid, round caps and joins. Never hand-draw a glyph that Lucide has.
- **Stroke 1.5 at rest, 2 on hover/selected.** Icon-only controls and unselected chips rest at 1.75. Status glyphs in the pill: 15 at stroke 2.
- Sizes: button icons 18 / 17 / 16 (lg / md / sm), chip 17 / 15, icon button = 45% of its size, segmented 18.
- Icons inherit the label colour. Exceptions: the compass arrow (bucket colour) and the success glyph on post-meet (`success`).

**Modes**: Date = `heart`, Mate = `users` (segmented switch, mode cards).

**Categories** (bento tiles, open card, search sheet):

| Mode | Category | Glyph |
|---|---|---|
| Date | Food and drink | `utensils` |
| Date | Nightlife | `martini` |
| Date | Outdoors | `trees` |
| Date | Culture | `palette` |
| Date | Music | `music` |
| Date | Attractions | `ferris-wheel` |
| Mate | Food and drink | `utensils` |
| Mate | Sports | `dumbbell` |
| Mate | Games | `dice-5` |
| Mate | Outdoors | `mountain` |
| Mate | Music | `music` |
| Mate | Culture | `film` |

**Intents** take their category's glyph, except these: beer `beer` · coffee, tea `coffee` · wine `wine` · cycling `bike` · cinema `film` · gym `dumbbell` · board games, cards `dice-5` · arcade, video games `gamepad-2` · hike `mountain` · walk, running `footprints` · dancing `party-popper` · cocktails `martini` · funfair, ferris wheel `ferris-wheel` · live gig, gig, concert, festival `ticket` · stargazing `moon` · sunset `sun` · museum, exhibition `palette`. The "other" chip uses `plus` and reads "something else" in labels.

Other fixed glyphs: `eye-off` invisible · `wifi-off` offline · `search` Find people · `compass` Open compass · `x` Vanish, Stop searching, close category · `hand` We met · `circle-check` you found each other · `footprints` distance walked · `calendar-plus` Same again next week? · `shuffle` Reroll · `sparkles` question caption · `arrow-left` back · `arrow-right` Start with you, Create account · `camera` Take selfie · `scan-face` → `shield-check` verify · `map` Enter the map · `chevron-right` settings rows · `shield-check` badge tag.

**Plans**: `calendar-plus` Plan for later, New plan · `calendar-check` Accept plan, confirmed · `map-pin` venue · `send` Send invitation · `clock` when · `timer` open until · `eye-off` they see · `user` names unlock · `users` offered to · `pencil` edit a review row · `shuffle` same times for every day · `sparkles` See who's in · `check` picked · `star` rating. Venue kinds reuse the intent glyphs: wine bar `wine` · café `coffee` · board-game café `dice-5` · beer bar `beer` · cinema `film` · climbing gym `mountain` · park `trees` · rooftop bar `martini` · restaurant `utensils` · bowling `gamepad-2` · gallery `palette` · jazz club `music`, plus `waves` for the riverside.

**The compass arrow is Lucide `navigation-2`**, filled and stroked with the bucket colour (stroke 1, round join), 62% of the dial, with a drop-shadow glow of 14px in the bucket colour (24px `temp-hot` when burning).

No emoji. No unicode pictographs, except `·` as a separator in copy.

## 10. Brand

### 10.1 The mark

A white compass arrow, Lucide `navigation-2`, rotated **38°**, over a pale paper disc (`#EDEDEF`) lit by three soft radial glows: **mint** `#37C2B3` (upper left), **amber** `#FFC56F` (upper right), **cream** `#FFDDAA` (lower centre). The arrow carries a soft drop shadow (black, 16%). It reads as the product: a direction, not a pin, and warm light where people are.

- Never redraw the arrow, change its angle, recolour it, or put a person, pin or face inside the mark.
- The arrow in the mark is always white. Inside the app, the same glyph is the compass arrow and takes the bucket colour.

| File (`mobile/assets/brand/`) | What | Use |
|---|---|---|
| `just-mate-symbol.svg` | 512, circle-clipped mark | in-product mark, docs, decks |
| `favicon.svg` | 32, circle-clipped mark, tighter shadow | web favicon |
| `just-mate-app-icon.svg` | 1024, full-bleed square, warm glows | **default app icon** (the OS applies the mask) |
| `just-mate-app-icon-cool.svg` | 1024, cool glows: blue `#58A0E0`, periwinkle `#90B1FF`, mint `#37C2B3` | alternate icon |
| `just-mate-app-icon-ring.svg` | 1024, warm glows + white dial ring with four ticks (north solid, others 75%), smaller arrow | alternate icon |
| `just-mate-wordmark.svg` | `JustMate` in `#171717`, transparent ground | wordmark on paper |
| `just-mate-wordmark-dark.svg` | `JustMate` in `#F5F5F7` on `#0A0A0D` | wordmark on ink |
| `just-mate-lockup.svg` | symbol + `JustMate` side by side, transparent ground | horizontal logo on paper |
| `just-mate-lockup-dark.svg` | symbol + `JustMate` in `#F5F5F7` on `#0A0A0D` | horizontal logo on ink |

The PNGs referenced by `mobile/app.config.ts` (`mobile/assets/images/`: icon, adaptive icon layers, splash, favicon) are exported from these files. Re-export them when the mark changes; never edit the PNGs by hand.

### 10.2 Wordmark

- Always **`JustMate`**: one word, capital J and M (camel case), no space or hyphen. Never "just-mate", "Just Mate" or all caps in the wordmark.
- Set in **Inter Bold** (700, display optical size `opsz` 32), tracking −0.036em (−4.3 at 120 px). The SVG files carry the wordmark as outlined paths, so they render the same without Inter installed.
- `fg-1` on paper, `#F5F5F7` on ink. Never amber, never on a gradient other than the mark's own disc.
- The mark and the wordmark can stand alone or side by side; use the files, don't retype the wordmark in another face.

## 11. Accessibility & reduced settings

| Setting | Read via | Behaviour |
|---|---|---|
| Reduce Motion | `useReducedMotion()` (Reanimated) · `prefers-reduced-motion` · or the in-app switch (Settings › feel) | Springs, slides and scales → 200 ms opacity cross-fades; the morph runs at 220 ms. No overshoot (`--ease-momentum` → `--ease-out-quad`). No searching-dot pulse, no rotating headline, no badge drop or swing. Compass arrow still rotates (it *is* the information) with `spring.sensor`. |
| Reduce Transparency | `AccessibilityInfo.isReduceTransparencyEnabled()` (iOS) | blurred surfaces → solid `surface-1` with a `separator` top border |
| Increase Contrast | `AccessibilityInfo.isDarkerSystemColorsEnabled()` (iOS) / `isHighTextContrastEnabled()` (Android) | solid surfaces, 1px `fg-3` borders on rings and rows, `fg-2` → `fg-1` |
| Dynamic Type | default `allowFontScaling` | layout reflows; chips wrap to two rows; countdown and pill capped at 1.3× |
| Screen readers | `accessibilityLabel` / `accessibilityLiveRegion` | compass announces bucket changes ("warm, under 200 metres"), not every heading change; match card and status pill are live regions; icon-only controls always carry a label; the heat field reads "where compatible people are, roughly"; the rotating headline is a polite live region showing one line at a time; the vibe badge reads its eyebrow and quote |

Also:

- Never convey bucket or state by colour alone (label + haptic always paired).
- Contrast ≥ 4.5:1 for text. Amber is a fill, never body text on paper (use `--link` for amber-toned links); text on amber uses `on-glow`.
- **Focus** (keyboard, switch control, web): single 1px `--focus-ring` outline, 2px offset.
- Disabled controls drop to 40% opacity and stay in place; they never disappear.

## 12. Components

The kit the screens are built from. Each spec below is the source for both the native and the web implementation.

### 12.1 Core

| Component | Variants · sizes | Spec |
|---|---|---|
| **Button** | `primary` · `secondary` · `tertiary` · `ghost` · `glow` · `danger`; `lg` 52 · `md` 44 · `sm` 36 | Full pill. `primary` = `fg-1` fill, `background` label (the default action). `secondary` = `tint`. `tertiary` = transparent + 1px `border`. `ghost` = transparent, `fg-2` label. `glow` = amber + `shadow-glow`, **only** for the match moment (Open compass, We met). `danger` = `danger` fill, white label, **Vanish only**. Padding 24 / 20 / 16 (4 less on an icon side), label 16 / 15 / 13 medium, optional leading/trailing icon, `fullWidth`, `loading` (spinner, 0.8 s), disabled 40% |
| **IconButton** | `material` · `tint` · `solid` · `ghost`; default 44 | Round, icon only, always labelled. `material` = thin blur + hairline + `shadow-3`, floats over the map. `tint` sits on sheets. `solid` = `fg-1` fill. `ghost` is chrome (back). Press 0.94 |

### 12.2 Forms

| Component | Variants · sizes | Spec |
|---|---|---|
| **Chip** | `md` 40 · `sm` 32; optional icon | Intent and interest picker. Solid `surface-chip` with inset `separator` ring (never translucent on translucent). Selected = `fg-1` fill, `background` label, semibold, icon stroke 2. Label 15 / 13 medium |
| **Segmented** | 2–4 items, label and/or icon | 44 tall pill on `muted` with inset `separator`, 4 inset. Sliding solid `fg-1` indicator (`spring.moderate`); active label `background`, inactive `fg-2`, 14 semibold. Date / Mate, Log in / Create account, single-choice profile fields. Not for search mode |
| **Switch** | with label | 34 × 20 track, 16 thumb, 2 inset; thumb stretches +2 on hover, +4 wide / −4 tall on press. On = `#6B97FF`, off = `track-off`. Row ≥ 44, label 15 `fg-1` on / `fg-2` off. Settings only (auto-stop, haptics, sounds, reduce motion); search mode stays a Button |
| **CheckRow** | label + optional description | Full-width row, min 56, radius 20, `surface-raised` + inset `separator`. 24 round box: empty = 1.5 `fg-3` ring, checked = `fg-1` fill + `check`. Label `headline`, description `footnote` `fg-2`. The 18+ gate on the date verify step, never a tiny box |

### 12.3 Display

| Component | Variants · sizes | Spec |
|---|---|---|
| **VibeCard** | default · `compact`; eyebrow, intent | The faceless identity. `surface-card`, `shadow-3`, radius 24, padding 22 (compact 16 × 18). Mono eyebrow ("you're looking for") and "wants · beer", quote in `vibe` (compact 17 / 23) inside curly quotes. Typography only, never a photo |
| **Badge** | `solid` · `dot`; `md` 24 · `sm` 20; hues gray, glow, self, cold, hot, success, danger | Aggregate counts and states ("~4 compatible around here"). `solid` = hue at 18% over `background` (gray = `track-off`); `dot` = 1px `border` outline + 7 / 6 dot in the hue. Text stays `fg-1`, 12 / 11 medium, tabular |
| **StepDots** | count, active | 6 dots, gap 6; the active step stretches to a 20 wide dash in `fg-1`, others `fg-3`. Onboarding progress |
| **Monogram** | 36 · 40 on the map | Own avatar: up to two initials, uppercase, semibold, on thin material with hairline. Opens settings. Other people never get an avatar |
| **Card** | `level` 1–8, padding 20, radius 24 | Solid `surface-N` + `shadow-N`. Settings groups (level 2), stat rows |
| **VibeBadge** | width (default 240), strap length, quote or name | The lanyard badge (§13.4) with its deterministic design (§13.5). The match moment, your own badge, post-meet |

### 12.4 Feedback & surfaces

| Component | Variants · sizes | Spec |
|---|---|---|
| **StatusPill** | `invisible` · `searching` · `offline` | 36 tall thin-material pill, hairline + `shadow-3`, 13 / 18 semibold, live region. `invisible` + `eye-off`; `searching` + pulsing amber dot, intent in `fg-2` ("searching: beer"); `offline` + `wifi-off` |
| **MatchCard** | `offered` · `waiting` · `expired` | Radius 32, `surface-card`, `shadow-8`, padding 24 × 20. Mono "match · wants: beer", percent in `display` (the % sign 34 `fg-2`), mono offer timer `0:45`, vibe quote. `glow` **Open compass** + `ghost` **Dismiss** (md). `waiting`: the button becomes disabled `secondary` "waiting for them…" in place. `expired`: content at 40%, a `muted` 56 pill "offer expired", caption "you're still searching". Buttons only, no swipe-to-dismiss. In the app the match moment is the ink card with the lanyard badge (§13.8), which shows no percentage; `MatchCard` stays in the kit |
| **Sheet** | `material` on/off, grabber | Top radius 32, thick material + `shadow-sheet`, padding 24 (10 on top with grabber). Grabber 36 × 5 `fg-3`. Without material: solid `surface-1`. Chips and buttons inside stay solid. In the app, sheet content sits inside the morph surface (§13.1) with no material or grabber of its own, padding 20 |

### 12.5 Compass & map

| Component | Variants · sizes | Spec |
|---|---|---|
| **CompassDial** | `rotation`, `bucket`, default 280, `waiting` | Halo = radial bucket colour at 16%; inset `separator` ring; 60 ticks (every 5th 2 × 10, else 1 × 6; cardinal ticks `fg-2`, others `fg-3`). Arrow = filled `navigation-2` at 62%, rotation = bearing(me→partner) − heading via `spring.sensor`, dims to 40% while waiting. Never a map position |
| **BucketLabel** | `cold` · `warm` · `hot` · `burning` | 10 dot in the bucket colour with a 12 glow (burning: 3px `temp-hot` ring + 16 glow) + bucket word in `title`; mono range below ("under 80 m"). Colour always paired with the word |
| **Countdown** | `display` · `largeTitle` size, label | `m:ss`, tabular, bold. `fg-1`, turns `temp-hot` at 1:00 (`--dur-fade`). Mono label "left" |
| **ZoneGlow** | density `n`, size | Diameter `80 + 14·min(n, 12)`, amber radial (§3.3), `--glow-blend`. Grows from its centre (0.6 → 1) once per update with `spring.default`. Aggregate only, never a pin. The app's map uses the heat field (§13.2); `ZoneGlow` is its per-zone fallback |

## 13. App surfaces

How the components above become the app. Screen order, states and copy live in `STRUCTURE.md`; this section is the visual and motion spec for each surface.

### 13.1 The morph surface

The whole app is **one continuous surface over the map** that changes shape, the way the Dynamic Island does. Nothing pushes, nothing presents modally: the surface springs from one shape into the next and its content cross-fades inside it.

| Shape | Geometry | Tone |
|---|---|---|
| `auth` · `select` · `search` | **sheet**: inset 8 from left, right and bottom, height = its content, radius 40 | *paper* |
| `match` | **card**: inset 8 from the sides, 11 from the top, height = its content (nearly the full screen), radius 40 | *ink* |
| `onboard` · `settings` | **full**: the whole screen, device corner radius | *page* |
| `compass` · `postmeet` | **full** | *night* |

| Tone | Fill | Edge | Scope |
|---|---|---|---|
| *paper* | `material-thick` + `blur-thick` | inset 1px `hairline-top` + `shadow-6` | `.light` |
| *page* | `background` | none | `.light` |
| *ink* | `--black` | `shadow-8` | `.dark` |
| *night* | `--jm-ink` | none | `.dark` |

- **Geometry** (position, width, height, corner radius) springs with `spring.morph` (520 ms, `--ease-spring`). Background colour follows over 60% of that, the shadow over all of it.
- **Content layers** cross-fade so nothing reflows mid-morph. Incoming: opacity over 50% of the duration after a 28% delay, scale 0.94 → 1 over the full duration, blur 6 px → 0 with the opacity. Outgoing: opacity and blur out over 22%, scale back over 50%. Layers scale from the top centre. The outgoing layer is removed 120 ms after the morph ends.
- Sheet and card heights are measured from their content, so a growing select sheet (a category opening) is the same spring.
- **Reduce Motion**: 220 ms, cross-fade only (no scale, no blur).
- Status bar: dark text on paper and page, light on compass and post-meet, hidden on the match card.
- The map and its chrome sit underneath the surface. On `match` a `--scrim` covers the map.

### 13.2 Map & heat

- **Base**: `map-bg` with a faint street grid: 1px `map-line` every 64 px both ways, plus two street directions in `map-street` (6 px bands every 300 px at 32°, 4 px bands every 420 px at −58°). The grid sits at 60% while idle and 100% while searching. Native: the `expo-maps` styling from §3.8 plays this role.
- **Top fade**: 140 px gradient from `background` to transparent under the chrome. No divider.
- **Own dot**: 14 pt `self` with a 4 px ring of `self` at 22% and a 16 px glow at 60%. The only dot.
- **Heat field** (visible only while searching): a density field, never circles per person.
  1. Each zone (`n` searching nearby) scatters `30 + 20n` soft points stretched along the street directions (32° and −58°): spread `30 + 8n` along, `7 + 1.2n` across, each a radial alpha blob (radius 8–18, alpha 0.05–0.09 + 0.004n).
  2. Accumulate at half resolution, blur 4 px.
  3. Map alpha through a palette: transparent → `glow-core` (alpha 0.32 at 16%) → `glow` (0.62 at 42%) → `temp-hot` (0.78 at 72%, 0.92 at the peak).
  4. Faint isolines: above the midpoint, every 42nd level gets +0.14 alpha in `temp-hot`.
  5. Blur the result 5 px and blend with `--glow-blend` (multiply on paper).
- The field fades in with opacity over 400 ms and scales 0.94 → 1 over 700 ms (`--ease-spring`). It redraws once per zone update; it never breathes.
- **Zone tap** (search only): the nearest zone within 90 pt shows a dot `Badge` in `glow` on thin material, 32 tall, 13 pt: "~4 compatible around here". It sits under the pill and fades after 2.4 s.
- Native: `ZoneMap` draws the same recipe over the map. Where the provider cannot host a custom overlay, layered circle overlays (halo + core per zone, `ZoneGlow` recipe) stand in.

**Chrome over the map** (select and search only): `StatusPill` top-left and `Monogram` (40) top-right, 16 from the edges. On select, the **Date / Mate** `Segmented` (240 wide, `heart` / `users`) floats under them on thin material with hairline and `shadow-3`. Chrome shows and hides with opacity + 8 px rise over 400 ms.

On auth the chrome is the brand instead: wordmark set live at 56/56 bold −2 px, "Meet for real." in `title` `fg-2`, mono "no faces · no chat · no pins", 24 from the left.

### 13.3 Category bento

Six categories per mode on a 3 × 3 grid inside the select sheet (sheet padding 20, so 346 pt wide on a 402 pt screen).

- **Grid**: 3 columns, gap 8, row height 88. Slots `A A B / A A C / D E F`: the first category is the 2 × 2 tile, the next two stack on the right, the last three fill the bottom row.
- **Tile**: `surface-card`, `shadow-2`, radius 20, padding 14 (large tile) or 12. Icon top-left 26 / 22 at stroke 1.5, label bottom-left 15 / 20 semibold. Hover mixes 4% `--overlay`; press 0.97.
- **Open**: tapping a tile grows it into a square card the full width of the grid: radius 28, `fg-1` fill, `shadow-6`, `.dark` content, padding 18. Inside: a 48 `tint` circle with the icon (24, stroke 1.75), a 36 ghost `x` "Close category" top-right, the category in `largeTitle`, mono "pick any · {n} selected", and `sm` chips for every intent plus "other" (`plus`) wrapping at the bottom. The first intent is pre-selected.
- **Folded strip**: the other five tiles fold into a row of icon pills under the open card: 52 tall, radius 26, icon 20.
- Tile ↔ card ↔ pill and the bento's own height spring together with `spring.bento` (440 ms). Each layer cross-fades (in: 50% after a 25% delay; out: 20%).
- Tapping the open card's `x` or its own tile again closes it and clears the picks. Switching Date / Mate clears category and picks.

### 13.4 Vibe badge (lanyard)

The faceless identity. A paper badge on a fabric strap: what a match sees instead of a face. Always `.light`, even on the ink card.

- **Card**: width 240 by default (match 262, post-meet 150), height 1.38 × width, radius 20, `surface-chip` face with a 1px white top highlight and a slim edge in `surface-chip` darkened 16%. A punched hole (radius 11) sits 26 pt from the top.
- **Strap**: 40 wide, woven texture over a gradient from `surface-chip` through the badge's first and third colours. It fades in over its first 40 pt unless it runs off the top of the card (match, post-meet). A dark metal clip (`--jm-ink` with lit edges) joins strap and card.
- **Face, top 60%**: three soft radial blobs in the badge colours (mixed toward white), masked to fade down. Optional pattern in white at 42% over the top half: dots (9 pt), lines (every 7 pt at the badge angle), rings (every 11 pt), grid (14 pt) or none. Paper grain at 22% multiply over everything.
- **Face, top row**: a 26 × 1.5 rule and the badge icon (15, stroke 2) in white on the left, mono "no. 0000" serial on the right.
- **Face, body** (from 46% down, 20 side padding): mono eyebrow `fg-2` ("her vibe · wants: wine"), then either the vibe quote (italic 19 / 25, medium, small badge 17 / 23) or a NAME (uppercase 26 / 30, small 20 / 24, medium, +0.2) on post-meet.
- **Face, footer**: mono interest tags ("coffee · hiking · jazz"), then the wordmark "JustMate" (17 bold, −0.6) and a mono tag with `shield-check` 12: "verified", "verified · 18+", or the mode while onboarding.
- **Motion**: drops in on its strap (1300 ms, ease-out, from above); tilts toward the pointer or finger (perspective 900, up to ±8° on X and ±11° on Y, 120 ms follow, 700 ms `--ease-spring` settle) with a soft-light shine at the touch point; drag swings it on the strap (up to ±24°, released with 1100 ms `--ease-momentum`); lifts away upward (−130%, 420 ms, `cubic-bezier(0.5, 0, 0.75, 0)`). Dims to 55% when its offer expires. Reduce Motion: no drop, tilt or swing; it cross-fades.

### 13.5 Badge design (deterministic)

The same picks always produce the same badge; no two people's look alike.

1. **Seed**: djb2 hash of `interests joined by "|"` + `"#"` + `answers joined by "|"` + `"#"` + a seed (the user id).
2. **Colours**: each interest maps to a tone; unmapped interests hash to one. Keep the first three distinct tones, filling from the hash if fewer than three.

   | Tone | Token | Interests |
   |---|---|---|
   | amber | `glow` | coffee, jazz, board games, pub quiz |
   | cream | `glow-core` | books, dogs, chess |
   | mint | `self` | hiking, yoga, climbing, football |
   | sky | `temp-cold` | travel, photography, running, padel, cycling |
   | ember | `temp-hot` | wine, cooking, street food, gym |
   | iris | `focus-ring` | cinema, techno, art, gaming, concerts, coding |

3. **Blobs**: three positions from the hash (upper left, upper right, centre, each jittered).
4. **Pattern**: from the hash when there are answers (dots, lines, rings, grid or none); none without answers. **Angle**: 35°, 60°, 120° or 145°.
5. **Icon**: the first interest with a glyph (coffee `coffee`, wine `wine`, cinema `film`, travel `map`, cooking and street food `utensils`, hiking and climbing `mountain`, techno and jazz `music`, art `palette`, dogs and running `footprints`, yoga `sun`, photography `camera`, board games and chess `dice-5`, gym `dumbbell`, gaming `gamepad-2`, cycling `bike`, concerts `ticket`, pub quiz `sparkles`); otherwise a filled `sparkle`.
6. **Tags**: the first three interests. **Serial**: hash mod 10000, four digits.

Caption under your own badge: "Colours from {three interests}. Pattern from your {n} answers."

### 13.6 Onboarding

- *Page* tone, padding 56 top, 16 sides, 34 bottom. Header row 44 tall: ghost back `IconButton` (`arrow-left`), `StepDots` for the whole flow (or mono "editing" when one step is reopened from settings), a 44 spacer.
- **Step layout**: mono eyebrow ("about you · 2 of 3"), `largeTitle`, a `body` sub in `fg-2`, the content (scrolls if needed), then the footer and a full-width `primary` CTA pinned at the bottom (gap 10). The CTA label says what's missing ("Pick 2 more", "Type your name") and is disabled until it isn't.
- **Transitions**: the step slides in 28 pt from the right on next and from the left on back, 400 ms `--ease-spring`, with a fade.
- **Mode cards**: radius 24, padding 20, min height 128 (156 selected). Selected = `fg-1` fill, `background` text, `shadow-6`; otherwise `surface-card` + `shadow-3`. A 44 icon circle (`surface-raised`, or `background` at 14% when selected), mono tag at 70% top-right, the mode in `largeTitle`, a 15 / 20 description at 72%. Press 0.97; height springs over 400 ms.
- **Interests**: chips wrap. Picking one pops its three related chips in next to it (`plus` icon until picked, pop over 400 ms); while they load, a 56 × 40 chip-shaped pill shows three pulsing dots.
- **Questions**: mono eyebrow "about you · question n of 4", the question in `largeTitle`, a caption with `sparkles` ("Written from your last answer"), four option chips, and a free-text field ("or in your own words"). A mono trail "so far a · b · c" collects answers. While the next question is being written: "getting a feel for you…" / "reading your answers…".
- **Your badge**: the lanyard badge drops in; a `tertiary` md **Reroll** (`shuffle`) rewrites the line in place.
- **Fields**: lowercase labels above the control ("first name", "interested in", "age" with its value right-aligned, "a hangout usually lasts"). Single choices are `Segmented`, multi choices are chips, age is a two-thumb range slider 18–60 ("60+").
- **Swipe** (date): sample cards, never real people. A generated sample photo (`cover`) with its description in `footnote`, or, without samples, a striped placeholder with mono "sample photo 01" and a traits line ("tall · dark hair · beard"); mono "n of 6 · a sample, not a user". Stamps "into it" (`heart`) and "not for me" (`x`) as the card leaves. Two 60 round buttons under it: `x` (`tint`) and `heart` (`solid`), with "n / 6". The done card shows a `success` check, "Taste saved", "{n} into it · {m} not for me".
- **Verify**: a `.dark` ink panel, radius 32, with an oval face guide and a progress ring that fills in `glow` and turns `success` when done. Once taken, the selfie shows round inside the ring (in memory only); without one, `scan-face` becomes `shield-check`. Mono status under it: "center your face in the oval" → "hold still…" → "real person · photo deleted". Date adds a `CheckRow` for 18+. Mono footer "production path · simulated in this build".

### 13.7 Settings

- *Page* tone. Ghost back "Back to the map" (`arrow-left`), then "Settings" in `largeTitle`.
- **Profile** first: your lanyard badge (224, strap 64; eyebrow "{name} · wants: {first interest}", your vibe line, the verified tag), then a centred mono "{mode} · verified · no. 0000".
- Android back returns to the map (an edited step returns to Settings).
- **Groups**: a mono label above each group ("your profile", "the map", "feel", "privacy and safety", "account"), rows inside a `Card` at level 2.
- **Rows**: min height 52, a 20 icon (stroke 1.5, 2 on hover), label, value in `fg-2` on the right, `chevron-right` for rows that open something. Inset separators between rows, never a full-width line. Choice rows use `Segmented`; on/off rows use `Switch`.
- Footer: ghost **Delete account**, then mono "JustMate · prototype · production path simulated".

### 13.8 Screen layouts

- **Auth** (*paper* sheet): padding 20, gap 16. `Segmented` "Log in" / "Create account", two fields, a full-width `primary` button ("Create account" carries `arrow-right`), then a ghost sm "Forgot password" or the footnote about the faceless profile, cross-fading when the tab changes.
- **Select** (*paper* sheet): padding 20, gap 20. The headline rotates through its lines in `largeTitle` every 3.2 s: each word blurs (8 px) and rises 10 pt in, staggered 55 ms, while the old line lifts out (opacity and blur 360 ms, motion 520 ms `--ease-spring`). A `footnote` under it, the bento, then either a centred `footnote` ("You're invisible until you pick something.") or the full-width `primary` **Find people for {picks}** with `search`.
- **Search** (*paper* sheet): a 56 `fg-1` circle with the intent icon (24, stroke 1.75); mono line with the 7 pt searching dot ("searching · date · food and drink"); "Looking for {picks}" in `largeTitle`. A horizontal row of `sm` chips to adjust picks (at least one stays). A row card (radius 20, `surface-card`, `shadow-2`, padding 14 × 16) with "You're visible nearby" in `headline`, the footnote, and the elapsed clock in mono 13 tabular. Full-width `secondary` **Stop searching** with `x`.
- **Match** (*ink* card): padding 0 × 20 × 24. The lanyard badge hangs from the top edge (strap 150, not faded). At the bottom: a mono row "match · nearby · on foot" with the 45 s countdown "0:45" right-aligned, full-width `glow` **Open compass** (`compass`), ghost md **Dismiss**, centred `footnote`. After accept the glow button becomes a disabled `secondary` "waiting for them…" and Dismiss disables. Expired: the badge dims to 40%, a 52 tall `muted` pill reads "offer expired", the footnote reads "you're still searching". No match percentage is shown.
- **Compass** (*night*, full): padding 64 top, 16 sides, 36 bottom. `Countdown` at the top with the label "left · {intent}". `CompassDial` 290 centred with `BucketLabel` under it ("finding signal…" in `title` `fg-2` while waiting). Compact `VibeCard` "you're looking for" with their line. Bottom row: `danger` lg **Vanish** (`x`, its own width, left) and full-width **We met** (`hand`): disabled `secondary` until `burning`, then `glow`.
- **Post-meet** (*night*, full): two small badges (150) side by side, yours tilted +4° with your name, theirs −4° with their name, in a 384 tall band at the top. Then, bottom-aligned: mono "you found each other" in `success` with `circle-check`, "Say hi to {name}." in `largeTitle`, the `body` line in `fg-2`, and a `footnote` with `footprints`: "You walked {m} m to say hi." A row under it: `secondary` sm **Same again next week?** (`calendar-plus`; once tapped, a `circle-check` footnote "Glad it clicked." — local only, nothing is scheduled) and ghost sm **Report**, which turns into a `footnote` notice ("Reports reach our team in the next version. Feeling unsafe? Call 112."). Full-width `primary` lg **Back to the map** at the bottom. Calm, no confetti.

## 14. Haptics & sound (expo-haptics)

Three rules: **causality** (fire on the causal event), **harmony** (same frame as the visual; trigger from the state change, not after the animation ends), **utility** (only meaningful moments).

| Moment | Haptic |
|---|---|
| Chip selected (interest, intent), category opened, Date / Mate switched | `selectionAsync()` |
| **Find people** pressed | `impactAsync(Medium)` |
| Match arrives (foreground) | `notificationAsync(Success)` + vibration `[200,100,200]` (both phones, same instant) |
| Both accepted → compass unlocks | `notificationAsync(Success)` |
| Bucket → warm / hot / burning | `impactAsync(Light / Medium / Heavy)` on change, plus a heartbeat whose interval shrinks: warm 3 s · hot 1.5 s · burning 0.7 s |
| 1:00 remaining | `notificationAsync(Warning)` |
| Vanish | `notificationAsync(Error)` |

No haptics on scrolling, panning the map, or every heading sample. The **Haptics** switch in Settings (on by default) turns all of them off. **Sounds** is off by default; the app is silent unless it's switched on.

## 15. Feedback & wayfinding

**Four kinds of feedback, one home each:**

| Kind | Where |
|---|---|
| Status | top pill: `invisible` / `● searching: beer` / `offline` |
| Completion | match card; "waiting for them…" → compass; post-meet "you found each other"; "Glad it clicked." |
| Warning | compass at 1:00 left (countdown turns `temp-hot`, warning haptic) |
| Error | compass `waiting-for-signal` (arrow dims to 40%, label "finding signal…"); socket lost (pill shows `offline`) |

**Wayfinding**: every screen answers *where am I, what can I do, how do I get out*.

- Select: the pill says `invisible` and the footnote says why ("You're invisible until you pick something."). Search: the row card says "You're visible nearby". Compass: Vanish is always visible, the countdown says when it ends on its own.
- Never trap the user: every overlay has an explicit exit; the system back gesture works everywhere.

**Forgiveness vs. safety:**

- **Vanish: one tap, no confirmation, instant.** Safety outranks undo.
- **Dismiss a match**: explicit button only, no swipe-to-dismiss (an accidental swipe would trigger a 5-min pair cooldown).
- **Stop searching**: no confirmation; restarting is one tap.

## 16. Process

- **Prototype interactively.** The sheet, the match card and the compass are built as working prototypes on a phone before they're polished; a static mock can't tell you whether the arrow feels right.
- **Interaction and visuals together.** No "add animations later" pass; the motion tokens ship with the first component.
- **Review motion slowly**: iOS Simulator *Debug › Slow Animations*, or screen-record and scrub frame by frame.
- **Test on the demo phones, in hand, walking.** The compass is judged at arm's length while moving.

## Quick reference

| Need | Do | Value |
|---|---|---|
| Theme | light default, dark scopes | `:root` paper · `.dark` on match (ink `#000`), compass and post-meet (night `#0A0A0D`) · badge always `.light` |
| Default spring | `withSpring` | `dampingRatio 1, duration 400` · `--ease-spring` |
| Flick release | momentum spring + velocity | `dampingRatio 0.8, duration 300, velocity: e.velocityY` |
| Snap target | project momentum | `pos + (v/1000)·0.998/(1−0.998)` |
| Press feedback | on press-in | `scale 0.97`, 100 ms |
| Over-drag | rubber-band | `c = 0.55` |
| Enter/exit | same path, from trigger | see §8.7 |
| Type | Inter Variable, opsz-paired | `--fw-medium` 450/15 → `--fw-semibold` 550/18 on hover |
| Large text | negative tracking | `display −1.6`, `largeTitle −0.7` |
| Controls | full pill | rows 20 · cards 24 · match card and sheet 32 |
| Default button | `primary` | `fg-1` fill |
| Amber button | `glow` | Open compass, We met only |
| Floating chrome | blur, map moves under | thick for the paper surface (30px), thin for pill (18px) |
| Morph | one surface, eight shapes | sheet/card radius 40 inset 8 · 520 ms · Reduce Motion 220 ms |
| Modal task | solid card + scrim | `--scrim` 28% light · 45% dark |
| Icons | Lucide | stroke 1.5 rest · 2 hover/selected |
| Reduce Motion | cross-fade | 200 ms opacity |
| Reserved colour | Vanish only | `danger` `#FF3B30` light · `#FF453A` dark |
