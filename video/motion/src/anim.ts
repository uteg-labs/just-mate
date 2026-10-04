import { Easing, interpolate, spring } from "remotion"
import { FPS } from "./theme"

// Critically damped by default, like the app's spring.default (DESIGN.md §6.1).
export const sp = (frame: number, delay = 0, durationInFrames = 18, bounce = false) =>
  spring({
    frame: frame - delay,
    fps: FPS,
    durationInFrames,
    config: bounce ? { damping: 12, mass: 0.8, stiffness: 140 } : { damping: 200 },
  })

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const

export const lerp = (
  f: number,
  a: number,
  b: number,
  from: number,
  to: number,
  ease = Easing.bezier(0.23, 1, 0.32, 1),
) => interpolate(f, [a, b], [from, to], { ...clamp, easing: ease })

export const fadeOut = (f: number, dur: number, len = 8) =>
  interpolate(f, [dur - len, dur], [1, 0], clamp)

export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0)

// Deterministic pseudo-random (Remotion renders frames out of order).
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}
