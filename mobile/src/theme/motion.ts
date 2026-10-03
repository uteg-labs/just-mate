import { Easing } from "react-native-reanimated"

// DESIGN.md §8.1
export const duration = {
  fast: 80,
  press: 100,
  moderate: 160,
  fade: 200,
  sensor: 250,
  snappy: 300,
  default: 400,
  bento: 440,
  morph: 520,
  morphReduced: 220,
} as const

// DESIGN.md §8.3
export const pressScale = { default: 0.97, icon: 0.94, row: 0.985 } as const

// DESIGN.md §8.2 — bounce only when the gesture carried momentum
export const spring = {
  default: { dampingRatio: 1, duration: duration.default },
  snappy: { dampingRatio: 1, duration: duration.snappy },
  moderate: { dampingRatio: 1, duration: duration.moderate },
  momentum: { dampingRatio: 0.8, duration: duration.snappy },
  sensor: { dampingRatio: 1, duration: duration.sensor },
  bento: { dampingRatio: 1, duration: duration.bento },
  morph: { dampingRatio: 1, duration: duration.morph },
} as const

export const fade = { duration: duration.fade, easing: Easing.out(Easing.quad) } as const
