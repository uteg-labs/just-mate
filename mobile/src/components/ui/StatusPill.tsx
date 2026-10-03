import { StyleSheet, Text, View } from "react-native"

import { radius } from "@/theme/layout"
import { type } from "@/theme/type"

import { Icon } from "./Icon"
import { Material } from "./Material"
import { PulseDot } from "./PulseDot"
import { useScheme } from "./scheme"

export type PillStatus = "invisible" | "searching" | "offline"

export type StatusPillProps = { status: PillStatus; label: string; detail?: string }

const GLYPH = { invisible: "eye-off", offline: "wifi-off" } as const

// DESIGN.md §12.4 — a live region; `detail` trails the label in fg-2 ("searching" + ": beer")
export const StatusPill = ({ status, label, detail }: StatusPillProps) => {
  const { c, shadow } = useScheme()

  return (
    <View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      style={[styles.shadow, { boxShadow: shadow[3] }]}
    >
      <Material thickness="thin" style={styles.body}>
        {status === "searching" ? (
          <PulseDot />
        ) : (
          <Icon name={GLYPH[status]} size={15} strokeWidth={2} color={c.fg1} />
        )}
        <Text style={[type.status, { color: c.fg1 }]} maxFontSizeMultiplier={1.3}>
          {label}
          {detail && <Text style={{ color: c.fg2 }}>{detail}</Text>}
        </Text>
      </Material>
    </View>
  )
}

const styles = StyleSheet.create({
  shadow: { alignSelf: "flex-start", borderRadius: radius.pill },
  body: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: radius.pill,
  },
})
