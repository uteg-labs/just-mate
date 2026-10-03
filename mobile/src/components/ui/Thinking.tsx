import { StyleSheet, Text, View } from "react-native"

import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { PulseDot } from "./PulseDot"
import { useScheme } from "./scheme"

export type ThinkingProps = { label: string; lines?: number }

// something is actually loading: a pulsing dot, its lowercase status, and still skeleton bars
export const Thinking = ({ label, lines = 2 }: ThinkingProps) => {
  const { c } = useScheme()

  return (
    <View style={styles.stack} accessibilityLiveRegion="polite" accessibilityLabel={label}>
      <View style={styles.status}>
        <PulseDot size={7} />
        <Text style={[type.mono, { color: c.fg2 }]}>{label}</Text>
      </View>
      {Array.from({ length: lines }, (_, i) => i).map((line) => (
        <View
          key={line}
          style={[
            styles.bar,
            { backgroundColor: c.surfaceChip, width: line === lines - 1 ? "60%" : "100%" },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: space.m },
  status: { flexDirection: "row", alignItems: "center", gap: space.s },
  bar: { height: 14, borderRadius: radius.pill },
})
