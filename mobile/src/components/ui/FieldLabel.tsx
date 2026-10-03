import { StyleSheet, Text, View } from "react-native"

import { space } from "@/theme/layout"
import { type } from "@/theme/type"

import { useScheme } from "./scheme"

export type FieldLabelProps = { children: string; right?: string }

// DESIGN.md §13.6 — lowercase mono label above a control, its value right-aligned
export const FieldLabel = ({ children, right }: FieldLabelProps) => {
  const { c } = useScheme()

  return (
    <View style={styles.row}>
      <Text style={[type.mono, { color: c.fg2 }]}>{children}</Text>
      {right && <Text style={[type.mono, styles.tabular, { color: c.fg1 }]}>{right}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space.s,
    paddingHorizontal: space.l,
  },
  tabular: { fontVariant: ["tabular-nums"] },
})
