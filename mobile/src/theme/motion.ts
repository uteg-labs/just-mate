import { Easing } from "react-native-reanimated"

// DESIGN.md §6.1 — bounce only when the gesture carried momentum
export const spring = {
  default: { dampingRatio: 1, duration: 400 },
  snappy: { dampingRatio: 1, duration: 300 },
  momentum: { dampingRatio: 0.8, duration: 300 },
  sensor: { dampingRatio: 1, duration: 250 },
} as const

export const fade = { duration: 200, easing: Easing.out(Easing.quad) } as const
