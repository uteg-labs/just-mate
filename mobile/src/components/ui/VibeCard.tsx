import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { useScheme } from "./scheme"

export type VibeCardProps = {
  quote: string
  eyebrow: string
  detail?: string
  compact?: boolean
  children?: ReactNode
}

// DESIGN.md §12.3 — the faceless identity: typography only. `detail` is the mono "wants · beer"
export const VibeCard = ({ quote, eyebrow, detail, compact, children }: VibeCardProps) => {
  const { c, shadow } = useScheme()

  return (
    <View
      style={[
        styles.card,
        compact ? styles.compact : styles.regular,
        { backgroundColor: c.surfaceCard, boxShadow: shadow[3] },
      ]}
    >
      <View style={styles.head}>
        <Text style={[type.mono, { color: c.fg2 }]}>{eyebrow}</Text>
        {detail && <Text style={[type.mono, { color: c.fg2 }]}>{detail}</Text>}
      </View>
      <Text style={[compact ? type.vibeCompact : type.vibe, { color: c.fg1 }]}>“{quote}”</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderCurve: "continuous" },
  regular: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20, gap: space.m },
  compact: { paddingHorizontal: 18, paddingVertical: space.l, gap: space.s },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.s,
  },
})
