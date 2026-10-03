import { useState } from "react"
import { Pressable } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"

import { duration, pressScale, spring } from "@/theme/motion"
import { useReduceMotion } from "./motion"

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// DESIGN.md §8.3 — scale on press-in, spring back on release; no scale under reduce motion
export function usePress(to: number = pressScale.default) {
  const reduceMotion = useReduceMotion()
  const [pressed, setPressed] = useState(false)
  const scale = useSharedValue(1)
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  const onPressIn = () => {
    setPressed(true)
    if (!reduceMotion) scale.set(withTiming(to, { duration: duration.press }))
  }
  const onPressOut = () => {
    setPressed(false)
    scale.set(withSpring(1, spring.snappy))
  }

  return { pressed, style, handlers: { onPressIn, onPressOut } }
}
