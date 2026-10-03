import { StyleSheet, View } from "react-native"
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated"

import { radius } from "@/theme/layout"
import { duration, spring } from "@/theme/motion"

import { useScheme } from "./scheme"

export type StepDotsProps = { count: number; active: number }

const Dot = ({ isActive }: { isActive: boolean }) => {
  const { c } = useScheme()
  const color = isActive ? c.fg1 : c.fg3

  const animated = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 20 : 6, spring.moderate),
    backgroundColor: withTiming(color, { duration: duration.moderate }),
  }))

  return <Animated.View style={[styles.dot, animated]} />
}

// DESIGN.md §12.3 — the active step stretches into a dash
export const StepDots = ({ count, active }: StepDotsProps) => (
  <View
    style={styles.row}
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 1, max: count, now: active + 1 }}
  >
    {Array.from({ length: count }, (_, i) => i).map((step) => (
      <Dot key={step} isActive={step === active} />
    ))}
  </View>
)

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 6, borderRadius: radius.full },
})
