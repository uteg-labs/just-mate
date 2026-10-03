import { StyleSheet, Text, View } from "react-native"

import type { Palette } from "@/theme/colors"
import { radius } from "@/theme/layout"
import { type } from "@/theme/type"

import { useScheme } from "./scheme"

export type BadgeHue = "gray" | "glow" | "self" | "cold" | "hot" | "success" | "danger"

export type BadgeProps = {
  label: string
  color?: BadgeHue
  variant?: "solid" | "dot"
  size?: "sm" | "md"
}

const HUE: Record<Exclude<BadgeHue, "gray">, keyof Palette> = {
  glow: "glow",
  self: "self",
  cold: "tempCold",
  hot: "tempHot",
  success: "success",
  danger: "danger",
}

// 18% alpha over the page reads as the web's color-mix(hue 18%, background)
const SOLID_ALPHA = "2E"

// DESIGN.md §12.3 — the text never takes the hue
export const Badge = ({ label, color = "gray", variant = "solid", size = "md" }: BadgeProps) => {
  const { c } = useScheme()
  const hue = color === "gray" ? undefined : c[HUE[color]]
  const isSmall = size === "sm"
  const isDot = variant === "dot"
  const dot = isSmall ? 6 : 7

  return (
    <View
      style={[
        styles.badge,
        {
          height: isSmall ? 20 : 24,
          gap: isSmall ? 4 : 6,
          paddingHorizontal: isSmall ? 8 : 10,
        },
        isDot
          ? { boxShadow: `inset 0 0 0 1px ${c.border}` }
          : { backgroundColor: hue ? `${hue}${SOLID_ALPHA}` : c.trackOff },
      ]}
    >
      {isDot && (
        <View
          style={{
            width: dot,
            height: dot,
            borderRadius: radius.full,
            backgroundColor: hue ?? c.fgMuted,
          }}
        />
      )}
      <Text
        style={[
          type.labelSm,
          { color: c.fg1, fontSize: isSmall ? 11 : 12, lineHeight: 16 },
          styles.tabular,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
  },
  tabular: { fontVariant: ["tabular-nums"] },
})
