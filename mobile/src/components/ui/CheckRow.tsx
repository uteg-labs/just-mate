import { StyleSheet, Text, View } from "react-native"

import { radius, space } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { type } from "@/theme/type"

import { Icon } from "./Icon"
import { AnimatedPressable, usePress } from "./press"
import { useScheme } from "./scheme"

export type CheckRowProps = {
  label: string
  checked: boolean
  onToggle: () => void
  description?: string
}

// DESIGN.md §12.2 — the explicit 18+ gate, never a tiny box
export const CheckRow = ({ label, checked, onToggle, description }: CheckRowProps) => {
  const { c } = useScheme()
  const { style: pressStyle, handlers } = usePress(pressScale.row)

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.row,
        { backgroundColor: c.surfaceRaised, boxShadow: `inset 0 0 0 1px ${c.separator}` },
        pressStyle,
      ]}
    >
      <View
        style={[
          styles.box,
          checked ? { backgroundColor: c.fg1 } : { boxShadow: `inset 0 0 0 1.5px ${c.fg3}` },
        ]}
      >
        {checked && <Icon name="check" size={16} color={c.background} strokeWidth={2.5} />}
      </View>
      <View style={styles.copy}>
        <Text style={[type.headline, { color: c.fg1 }]}>{label}</Text>
        {description && <Text style={[type.footnote, { color: c.fg2 }]}>{description}</Text>}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    borderRadius: radius.row,
    borderCurve: "continuous",
  },
  box: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  copy: { flex: 1, gap: 2 },
})
