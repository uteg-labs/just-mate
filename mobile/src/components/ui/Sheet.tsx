import type { ReactNode } from "react"
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"

import { radius, space } from "@/theme/layout"

import { Material } from "./Material"
import { useScheme } from "./scheme"

export type SheetProps = { children: ReactNode; padding?: number; style?: StyleProp<ViewStyle> }

// DESIGN.md §13.1 — the paper morph surface as a floating sheet: thick material, inset 8
export const Sheet = ({ children, padding = 20, style }: SheetProps) => {
  const { shadow } = useScheme()

  return (
    <View style={[styles.frame, { boxShadow: shadow[6] }, style]}>
      <Material thickness="thick" style={[styles.surface, { padding }]}>
        {children}
      </Material>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    marginHorizontal: space.s,
    marginBottom: space.s,
    borderRadius: radius.morph,
    borderCurve: "continuous",
  },
  surface: { borderRadius: radius.morph },
})
