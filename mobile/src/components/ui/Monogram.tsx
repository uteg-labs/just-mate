import { StyleSheet, Text } from "react-native"

import { layout, radius } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { font } from "@/theme/type"

import { Material } from "./Material"
import { AnimatedPressable, usePress } from "./press"
import { useScheme } from "./scheme"

export type MonogramProps = { label: string; onPress: () => void; initials?: string; size?: number }

// DESIGN.md §12.3 — own avatar only; other people never get one
export const Monogram = ({ label, onPress, initials = "", size = 40 }: MonogramProps) => {
  const { c, shadow } = useScheme()
  const { style: pressStyle, handlers } = usePress(pressScale.icon)

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Math.max(0, (layout.hitMin - size) / 2)}
      style={[styles.round, { boxShadow: shadow[3] }, pressStyle]}
    >
      <Material
        thickness="thin"
        style={[
          styles.round,
          styles.center,
          {
            width: size,
            height: size,
            boxShadow: `inset 0 1px 0 0 ${c.hairlineTop}, inset 0 0 0 1px ${c.separator}`,
          },
        ]}
      >
        <Text style={[styles.text, { color: c.fg1, fontSize: Math.round(size * 0.38) }]}>
          {initials.slice(0, 2).toUpperCase()}
        </Text>
      </Material>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  round: { borderRadius: radius.full },
  center: { alignItems: "center", justifyContent: "center" },
  text: { fontFamily: font.semibold, letterSpacing: -0.2 },
})
