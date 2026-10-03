import type { IconName } from "@/components/ui"
import { light } from "@/theme/colors"

// DESIGN.md §13.5 — same picks, same badge; the arithmetic matches the web prototype bit for bit
const PALETTE = {
  amber: light.glow,
  cream: light.glowCore,
  mint: light.self,
  sky: light.tempCold,
  ember: light.tempHot,
  iris: light.focusRing,
} as const

type Tone = keyof typeof PALETTE

const TONES = Object.keys(PALETTE) as Tone[]

const TONE_OF: Record<string, Tone> = {
  coffee: "amber",
  wine: "ember",
  cinema: "iris",
  books: "cream",
  travel: "sky",
  cooking: "ember",
  hiking: "mint",
  techno: "iris",
  jazz: "amber",
  art: "iris",
  dogs: "cream",
  yoga: "mint",
  photography: "sky",
  "street food": "ember",
  "board games": "amber",
  climbing: "mint",
  running: "sky",
  gym: "ember",
  football: "mint",
  padel: "sky",
  gaming: "iris",
  "pub quiz": "amber",
  cycling: "sky",
  concerts: "iris",
  coding: "iris",
  chess: "cream",
}

const ICON_OF: Record<string, IconName> = {
  coffee: "coffee",
  wine: "wine",
  cinema: "film",
  travel: "map",
  cooking: "utensils",
  hiking: "mountain",
  techno: "music",
  jazz: "music",
  art: "palette",
  dogs: "footprints",
  yoga: "sun",
  photography: "camera",
  "street food": "utensils",
  "board games": "dice-5",
  climbing: "mountain",
  running: "footprints",
  gym: "dumbbell",
  gaming: "gamepad-2",
  cycling: "bike",
  concerts: "ticket",
  chess: "dice-5",
  "film cameras": "camera",
  "pub quiz": "sparkles",
}

const PATTERNS = ["dots", "lines", "rings", "grid", "none"] as const
const ANGLES = [35, 60, 120, 145] as const

export type BadgePattern = (typeof PATTERNS)[number]
export type BadgeMode = "date" | "mate"

export type BadgeDesign = {
  colors: [string, string, string]
  blobs: [[number, number], [number, number], [number, number]]
  pattern: BadgePattern
  angle: number
  icon: IconName
  tags: string[]
  serial: string
  mode: BadgeMode
}

export type BadgeInput = {
  interests?: readonly string[]
  qa?: readonly { a: string }[]
  mode?: BadgeMode
  seed?: string
}

export function badgeHash(text: string) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h
}

// the prototype's xor can go negative for hashes ≥ 2^31 and index past the palette; wrap instead
function pick(h: number, k: number, n: number) {
  return ((((h >>> (k * 3)) ^ (h >>> 17)) % n) + n) % n
}

export function badgeDesignFromHash(
  h: number,
  {
    interests = [],
    hasAnswers,
    mode = "date",
  }: Pick<BadgeInput, "interests" | "mode"> & {
    hasAnswers: boolean
  },
): BadgeDesign {
  const tones: Tone[] = []
  for (const interest of interests) {
    const tone = TONE_OF[interest] ?? TONES[badgeHash(interest) % TONES.length]
    if (!tones.includes(tone)) tones.push(tone)
  }
  for (let k = 0; tones.length < 3; k++) {
    const tone = TONES[(pick(h, k, TONES.length) + k) % TONES.length]
    if (!tones.includes(tone)) tones.push(tone)
  }

  return {
    colors: [PALETTE[tones[0]], PALETTE[tones[1]], PALETTE[tones[2]]],
    blobs: [
      [14 + pick(h, 1, 22), 18 + pick(h, 2, 22)],
      [64 + pick(h, 3, 26), 4 + pick(h, 4, 20)],
      [36 + pick(h, 5, 28), 42 + pick(h, 6, 18)],
    ],
    pattern: PATTERNS[hasAnswers ? pick(h, 7, PATTERNS.length) : 4],
    angle: ANGLES[pick(h, 8, ANGLES.length)],
    icon: interests.map((i) => ICON_OF[i]).find(Boolean) ?? "sparkle",
    tags: interests.slice(0, 3),
    serial: String(h % 10000).padStart(4, "0"),
    mode,
  }
}

export function badgeDesign({ interests = [], qa = [], mode = "date", seed = "" }: BadgeInput) {
  const h = badgeHash(`${interests.join("|")}#${qa.map((x) => x.a).join("|")}#${seed}`)
  return badgeDesignFromHash(h, { interests, hasAnswers: qa.length > 0, mode })
}
