import Animated, { type CSSAnimationKeyframes } from "react-native-reanimated"

import { radius } from "@/theme/layout"
import { useReduceMotion } from "./motion"
import { useScheme } from "./scheme"

type Props = { size?: number; color?: string; delay?: number }

const PULSE: CSSAnimationKeyframes = {
  "0%": { opacity: 1, transform: [{ scale: 1 }] },
  "50%": { opacity: 0.45, transform: [{ scale: 0.8 }] },
  "100%": { opacity: 1, transform: [{ scale: 1 }] },
}

// DESIGN.md §8.9 — the one sanctioned loop: 1 Hz, off under reduce motion
export const PulseDot = ({ size = 8, color, delay = 0 }: Props) => {
  const { c } = useScheme()
  const reduceMotion = useReduceMotion()
  const tone = color ?? c.glow

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: tone,
          boxShadow: `0 0 ${size}px ${tone}`,
        },
        !reduceMotion && {
          animationName: PULSE,
          animationDuration: 1000,
          animationDelay: delay,
          animationIterationCount: "infinite",
          animationTimingFunction: "ease-in-out",
        },
      ]}
    />
  )
}
