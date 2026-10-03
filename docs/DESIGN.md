# just-mate — design system (visual · motion · interaction)

Source of truth for how the app **looks, moves, and feels**. Screens and flows live in `STRUCTURE.md`; this doc says how to build them.

Foundation: Apple's interface principles (WWDC *Designing Fluid Interfaces*, *The Details of UI Typography*, *Principles of Great Design*), as distilled in [emilkowalski/skills › apple-design](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md) — translated here from the web to our stack: **Expo · react-native-reanimated (v3+) · react-native-gesture-handler · @gorhom/bottom-sheet · expo-blur · expo-haptics · expo-sensors**.

> The through-line: **motion starts from the current on-screen value, inherits the finger's velocity, projects momentum forward, and can be grabbed and reversed at any instant.** Springs make that natural — so springs are the default for everything a user can touch.

## 0. Design intent — what the user should feel

**Calm courage.** The app is a quiet, dark street at night with warm lights where people are. It never shouts, never begs for attention, and gets out of the way the moment two people are standing in front of each other. Delight comes from the compass walk and the simultaneous buzz — not from confetti.

The three product rules are also visual rules:

| Rule | Visual consequence |
|---|---|
| No faces | No avatars of other people, ever. Identity = vibe card typography only. Own avatar = monogram/abstract shape |
| No chat | No text inputs after onboarding. No message bubbles, no typing indicators |
| No pins | No point markers for people. Location is only ever soft, blurred zone glow or a compass bearing |

## 1. Principles (the names we reason with)

1. **Purpose** — four surfaces (Onboarding, Home, Match, Compass). Every new element must earn its place against them.
2. **Agency** — invisible by default; searching is a deliberate per-occasion act; Vanish is always one tap away.
3. **Responsibility** — safety UI is never hidden, paywalled, or animated slowly. Vanish has no confirmation dialog and no animation delay on its effect.
4. **Familiarity** — Home borrows Bolt/Uber's map + sheet; Match borrows the iOS notification banner; Compass borrows the system compass. No novel gestures to learn.
5. **Flexibility** — respect Dynamic Type, Reduce Motion, Reduce Transparency, Increase Contrast (§9). One-handed: primary actions live in the bottom third.
6. **Simplicity, not minimalism** — one primary action per screen. Common path first; edit profile one level deeper (avatar).
7. **Craft** — every value below (spacing, timing, color) is a token, not a guess. If it isn't in this doc, add it here first.
8. **Delight** — the sum of the above: two phones buzzing on the same frame, an arrow that feels physical, a glow that breathes in when people arrive.

## 2. Color

Dark-only for M0 (the map is the brand). Colors are tokens in `mobile/theme/colors.ts`.

### Base

| Token | Value | Use |
|---|---|---|
| `bg` | `#0A0A0D` | app background, compass background |
| `mapBase` | dark OpenFreeMap style, desaturated, labels at 60% | map |
| `surface` | `#16161B` | solid cards (vibe card, reduced-transparency fallback) |
| `surfaceRaised` | `#202027` | chips, secondary buttons on sheets |
| `separator` | `rgba(255,255,255,0.08)` | only where a scroll-edge fade can't be used |
| `textPrimary` | `#F5F5F7` | |
| `textSecondary` | `rgba(235,235,245,0.62)` | |
| `textTertiary` | `rgba(235,235,245,0.32)` | placeholders, disabled |

### Accent — warm light

| Token | Value | Use |
|---|---|---|
| `glow` | `#FFB23F` (amber) | zone glow, primary CTA fill, active intent chip |
| `glowCore` | `#FFD9A0` | centre of dense zones |
| `onGlow` | `#1A1205` | text/icons on amber |
| `danger` | `#FF453A` | **Vanish only** — reserved, never decorative |
| `success` | `#30D158` | "both accepted" tick, nothing else |

### Compass temperature (distance buckets)

Physical metaphor: metal heating up. Color is always paired with a label + haptic, never color alone.

| Bucket | Distance | Token | Value |
|---|---|---|---|
| cold | > 200 m | `tempCold` | `#64B5F6` |
| warm | < 200 m | `tempWarm` | `#FFB23F` |
| hot | < 80 m | `tempHot` | `#FF7A1A` |
| burning | < 30 m | `tempBurning` | `#FFF1DC` (white-hot) + outer `tempHot` glow |

`burning` is white-hot on purpose so it never collides with `danger` red.

## 3. Typography

**System font** (SF Pro on iOS, Roboto on Android) — it already ships optical sizing and legibility tuning. No custom face in M0.

Rules (from *The Details of UI Typography*):

- **Tracking is size-specific.** Large text → negative letter-spacing; body ≈ 0; small text → slightly positive. Never one `letterSpacing` for all styles.
- **Leading tracks size inversely.** Tight on display, comfortable on body.
- **Hierarchy = weight + size + leading as a set.** Emphasise with weight before size.
- **Numbers that change use tabular figures** (`fontVariant: ['tabular-nums']`) — countdown, match %, zone counts — so they don't jitter.
- **Respect Dynamic Type** (`allowFontScaling` stays on). Cap only fixed chrome with `maxFontSizeMultiplier` (countdown, pill: `1.3`). Layout grows with text; no fixed-height text containers.

| Token | Size / line-height | Weight | Letter-spacing (pt) | Use |
|---|---|---|---|---|
| `display` | 64 / 64 | 700 | −1.6 | match %, compass countdown |
| `largeTitle` | 34 / 38 | 700 | −0.7 | "Where to?", onboarding step titles |
| `title` | 22 / 26 | 600 | −0.3 | screen/section headers, bucket label |
| `vibe` | 20 / 27 | 500 italic | −0.2 | the vibe-card quote |
| `headline` | 17 / 22 | 600 | −0.1 | buttons, chip labels |
| `body` | 17 / 24 | 400 | 0 | copy |
| `footnote` | 13 / 18 | 400 | +0.1 | captions ("unlocks only if they accept too") |
| `caption` | 11 / 14 | 600 | +0.4 | status pill, small uppercase labels |

On translucent surfaces (§5) bump one weight step and use `textPrimary`, never `textTertiary` (vibrancy rule: flat grey dies on blur).

## 4. Layout & spacing

- **4-pt grid.** Tokens: `xs 4 · s 8 · m 12 · l 16 · xl 24 · xxl 32 · xxxl 48`.
- Screen gutter `l` (16). Sheet internal padding `xl` (24).
- Corner radius: chip `full` · button `14` · card `20` · sheet top `28` (continuous curve via `borderCurve: 'continuous'` on iOS).
- Hit targets ≥ 44 × 44 pt; add `hitSlop` ~10 pt around small controls.
- **Grouping & mapping:** controls sit next to what they change — intent chips live on the sheet that starts the search; Vanish lives next to the countdown it kills.
- Primary action in the bottom third (thumb zone); status at the top.

## 5. Materials & depth

Translucency = a floating functional layer over the map; the map keeps scrolling underneath.

| Surface | Material | Notes |
|---|---|---|
| Bottom sheet (Home) | `BlurView` thick — `tint="systemChromeMaterialDark"`, intensity ~80 | largest surface → thickest blur + deepest shadow |
| Status pill (top) | `BlurView` thin — `tint="systemThinMaterialDark"` | small → lighter |
| Intent chips, buttons on the sheet | **solid** `surfaceRaised` / `glow` | never stack translucent on translucent |
| Match overlay | solid `surface` card **+ dim scrim** (`rgba(0,0,0,0.45)`) over the map | modal task → dim to focus |
| Compass | fully opaque `bg` | the walk is the only thing on screen |

- **Bright top edge** on blurred surfaces: 1 px `rgba(255,255,255,0.12)` — light catching the material.
- **Scroll-edge fades, not dividers:** where map content meets the sheet/pill, fade with a short gradient mask instead of a 1 px border.
- **Materialize, don't just fade:** blurred surfaces enter by animating blur intensity + scale (0.96 → 1) + opacity together.
- Android: `experimentalBlurMethod="dimezisBlurView"`; if performance or support is poor, fall back to the solid reduced-transparency style (§9).

## 6. Motion

### 6.1 Springs (default for anything touchable)

Apple's two designer-facing parameters map directly onto Reanimated's `withSpring({ dampingRatio, duration })`:

- **dampingRatio** — `1` = no overshoot. `< 1` = bounce.
- **duration ≈ Apple "response"** — how fast it gets there (ms). Not a fixed end time.

Tokens (`mobile/theme/motion.ts`):

| Token | dampingRatio | duration | Use |
|---|---|---|---|
| `spring.default` | 1.0 | 400 | repositioning, overlays, glow size changes, programmatic sheet moves |
| `spring.snappy` | 1.0 | 300 | chip select, button release, pill content swap |
| `spring.momentum` | 0.8 | 300 | **only** after a flick/drag release carrying velocity (sheet snap) |
| `spring.sensor` | 1.0 | 250 | compass arrow re-targeting on each heading sample |

Rule: **bounce only when the user's gesture carried momentum.** A sheet you flicked may overshoot; a banner that arrived on its own may not. The compass arrow uses `dampingRatio 1` — sensor noise + overshoot reads as wobble.

```ts
// mobile/theme/motion.ts
export const spring = {
  default:  { dampingRatio: 1,   duration: 400 },
  snappy:   { dampingRatio: 1,   duration: 300 },
  momentum: { dampingRatio: 0.8, duration: 300 },
  sensor:   { dampingRatio: 1,   duration: 250 },
} as const;
```

Non-touch fades (cross-fades, reduced-motion) use `withTiming(…, { duration: 200, easing: Easing.out(Easing.quad) })`.

### 6.2 Response — kill latency

- **Feedback on press-in, not release.** All pressables: scale to `0.97` + slight dim on `onPressIn` (100 ms), spring back with `spring.snappy`. Commit the action on release.
- No debounces or artificial delays on the input path. Sending `session`, `accept`, `vanish` is optimistic: UI changes in the same frame, the socket catches up.
- Continuous feedback during gestures — the sheet tracks the finger 1:1 the whole way, never animates only at the end.

### 6.3 Interruptibility

- Never lock input during a transition. A sheet mid-snap can be grabbed; the match banner mid-entry can be tapped.
- Always animate from the **current presented value** — Reanimated shared values + `withSpring` do this by default; never reset to a target before animating.
- No `LayoutAnimation`/fixed-duration keyframes on anything gesture-driven.
- Animate only `transform` and `opacity` (UI thread). Keep gesture logic in worklets.

### 6.4 Gestures — the bottom sheet as the reference implementation

- **1:1 tracking**, respecting the grab offset (`@gorhom/bottom-sheet` does this; keep `enableOverDrag`).
- **Hysteresis ~10 pt** before committing to a drag direction (so taps on chips don't move the sheet).
- **Rubber-band** past the top snap point instead of a hard stop.
- **Momentum projection** picks the snap point from where the flick is *going*, not where the finger lifted:

```ts
// worklet — Apple's projection (decelerationRate 0.998 ≈ scroll feel)
export function project(velocity: number, d = 0.998) {
  'worklet';
  return (velocity / 1000) * d / (1 - d);
}
// on end: target = nearestSnap(translateY + project(e.velocityY));
// translateY.value = withSpring(target, { ...spring.momentum, velocity: e.velocityY });
```

- **Velocity handoff:** pass the release velocity into the spring (`velocity` option, px/s) — no seam between drag and animation.
- **Decide commit vs. reverse by velocity sign**, not by position past the halfway line.

```ts
export function rubberband(overshoot: number, dimension: number, c = 0.55) {
  'worklet';
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}
```

### 6.5 Spatial consistency

Things leave the way they came, and originate from what triggered them.

| Element | Enters | Exits |
|---|---|---|
| Bottom sheet | up from bottom edge | down to bottom edge |
| Match banner | down from top (like a system notification) | back up to top |
| Compass | expands from the **Open compass** button (scale + opacity, origin = button) | collapses back toward Home's sheet |
| Profile edit | scales from the avatar (top-right origin) | back into the avatar |
| Zone glow | grows from its centre (scale 0.6 → 1 + opacity) | shrinks into its centre |

### 6.6 Hint in the direction of the outcome

- Tapping **Find people**: the sheet collapses *downward* while zones bloom outward from the user's position — the motion points at "the map is now live".
- Compass bucket change: the ring colour sweeps in the arrow's direction, not a flat cross-fade.

### 6.7 Ambient motion (careful)

- No idle looping animations on large areas (avoid slow ~0.2 Hz oscillation — vestibular trigger).
- Zone glow changes animate **once per data update** with `spring.default`; no continuous breathing.
- The single allowed loop: the small `●` searching dot in the pill (1 Hz pulse, ≤ 8 pt). Disabled under Reduce Motion.

## 7. Haptics & sound (expo-haptics)

Three rules: **causality** (fire on the causal event), **harmony** (same frame as the visual — trigger from the state change, not after the animation ends), **utility** (only meaningful moments).

| Moment | Haptic |
|---|---|
| Intent chip selected | `selectionAsync()` |
| Sheet snaps to a detent after a flick | `impactAsync(Light)` |
| **Find people** pressed | `impactAsync(Medium)` |
| Match arrives (foreground) | `notificationAsync(Success)` + vibration `[200,100,200]` (both phones, same instant) |
| Both accepted → compass unlocks | `notificationAsync(Success)` |
| Bucket → warm / hot / burning | `impactAsync(Light / Medium / Heavy)` on change, plus a heartbeat whose interval shrinks: warm 3 s · hot 1.5 s · burning 0.7 s |
| 1:00 remaining | `notificationAsync(Warning)` |
| Vanish | `notificationAsync(Error)` |

No haptics on scrolling, panning the map, or every heading sample. No sound in M0.

## 8. Feedback & wayfinding

**Four kinds of feedback, one home each:**

| Kind | Where |
|---|---|
| Status | top pill — `invisible` / `● searching: beer` |
| Completion | match banner; "both accepted" tick; compass "you found them" end state |
| Warning | compass at 1:00 left (countdown turns `tempHot`, warning haptic) |
| Error | compass `waiting-for-signal` (arrow dims to 40%, label "finding signal…"); socket lost (pill shows `offline`) |

**Wayfinding** — every screen answers *where am I / what can I do / how do I get out*:

- Home: the pill says whether you're visible. Compass: Vanish is always visible, countdown says when it ends on its own.
- Never trap the user: every overlay has an explicit exit; the system back gesture works everywhere.

**Labels — specific beats generic:** "Find people", "Stop searching", "Open compass", "Dismiss", "Vanish", "Enter the map". Never "OK", "Continue", "Home".

**Forgiveness vs. safety:**

- **Vanish: one tap, no confirmation, instant.** Safety outranks undo.
- **Dismiss a match:** explicit button only — no swipe-to-dismiss on the banner (an accidental swipe would trigger a 5-min pair cooldown).
- **Stop searching:** no confirmation; restarting is one tap.

## 9. Accessibility & reduced settings

| Setting | Read via | Behaviour |
|---|---|---|
| Reduce Motion | `useReducedMotion()` (Reanimated) | Springs/slides/scales → 200 ms opacity cross-fades. No overshoot. No searching-dot pulse. Compass arrow still rotates (it *is* the information) with `spring.sensor`. |
| Reduce Transparency | `AccessibilityInfo.isReduceTransparencyEnabled()` (iOS) | `BlurView`s → solid `surface` with a `separator` top border |
| Increase Contrast | `AccessibilityInfo.isDarkerSystemColorsEnabled()` (iOS) / `isHighTextContrastEnabled()` (Android) | solid surfaces, 1 px `rgba(255,255,255,0.3)` borders, `textSecondary` → `textPrimary` |
| Dynamic Type | default `allowFontScaling` | layout reflows; chips wrap to two rows; countdown capped at 1.3× |
| Screen readers | `accessibilityLabel` / `accessibilityLiveRegion` | compass announces bucket changes ("warm, under 200 metres"), not every heading change; match banner is a live region |

Also: never convey bucket or state by colour alone (label + haptic always paired); contrast ≥ 4.5:1 for text (amber CTA uses `onGlow` text).

## 10. Screen notes (applying the system)

- **Onboarding** — `largeTitle` per step, chips as solid `surfaceRaised` (selected = `glow` fill + `selectionAsync`). Step transitions slide horizontally and reverse on back. Vibe-card reroll: card cross-fades the text in place, card itself doesn't move.
- **Home** — map fullscreen, thin-material pill on top, thick-material sheet at bottom with detents `[collapsed, expanded]`. Primary CTA **Find people** is the only `glow`-filled button on screen.
- **Match** — scrim + solid card from the top; `display` match %, `vibe` quote, primary **Open compass**, ghost **Dismiss**, `footnote` "unlocks only if they accept too". After accept: button morphs in place into "waiting for them…" (no new screen).
- **Compass** — opaque `bg`; large arrow (≥ 60% screen width) tinted by bucket; bucket label in `title`; `display` countdown with tabular figures; vibe card pinned low; Vanish bottom-left in `danger`, always visible, never covered.

## 11. Process

- **Prototype interactively.** The sheet, the banner and the compass are built as working prototypes on a phone before they're polished — a static mock can't tell you whether the arrow feels right.
- **Interaction and visuals together** — no "add animations later" pass; the motion tokens ship with the first component.
- **Review motion slowly**: iOS Simulator *Debug › Slow Animations*, or screen-record and scrub frame-by-frame.
- **Test on the demo phones, in hand, walking.** The compass is judged at arm's length while moving.

## Quick reference

| Need | Do | Value |
|---|---|---|
| Default spring | `withSpring` | `dampingRatio 1, duration 400` |
| Flick release | momentum spring + velocity | `dampingRatio 0.8, duration 300, velocity: e.velocityY` |
| Snap target | project momentum | `pos + (v/1000)·0.998/(1−0.998)` |
| Press feedback | on press-in | `scale 0.97`, 100 ms |
| Over-drag | rubber-band | `c = 0.55` |
| Enter/exit | same path, from trigger | see §6.5 |
| Large text | negative tracking | `display −1.6`, `largeTitle −0.7` |
| Body text | neutral tracking | `0` |
| Floating chrome | `BlurView`, map scrolls under | thick for sheet, thin for pill |
| Modal task | solid card + scrim | `rgba(0,0,0,0.45)` |
| Reduce Motion | cross-fade | 200 ms opacity |
| Reserved colour | Vanish only | `danger #FF453A` |
