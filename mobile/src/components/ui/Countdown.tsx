import { StyleSheet, Text, View } from "react-native"
import Animated from "react-native-reanimated"

import { duration } from "@/theme/motion"
import { type } from "@/theme/type"

import { useScheme } from "./scheme"

export type CountdownProps = { seconds: number; size?: "display" | "largeTitle"; label?: string }

const HOT_AT_S = 60

export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

// DESIGN.md §12.5 — tabular m:ss, turns temp-hot at 1:00
export const Countdown = ({ seconds, size = "display", label }: CountdownProps) => {
  const { c } = useScheme()
  const isHot = seconds <= HOT_AT_S

  return (
    <View style={styles.stack}>
      <Animated.Text
        maxFontSizeMultiplier={1.3}
        style={[
          type[size],
          styles.tabular,
          {
            color: isHot ? c.tempHot : c.fg1,
            transitionProperty: "color",
            transitionDuration: duration.fade,
          },
        ]}
      >
        {clock(seconds)}
      </Animated.Text>
      {label && <Text style={[type.mono, { color: c.fg2 }]}>{label}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { alignItems: "center", gap: 2 },
  tabular: { fontVariant: ["tabular-nums"] },
})
