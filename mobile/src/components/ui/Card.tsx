import type { ReactNode } from "react"
import { type StyleProp, View, type ViewStyle } from "react-native"

import { radius } from "@/theme/layout"

import { useScheme } from "./scheme"

export type CardLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type CardProps = {
  children: ReactNode
  level?: CardLevel
  padding?: number
  style?: StyleProp<ViewStyle>
}

// DESIGN.md §6 — surface-N paired with shadow-N, no border: the shadow's ring is the edge
export const Card = ({ children, level = 3, padding = 20, style }: CardProps) => {
  const { c, shadow } = useScheme()

  return (
    <View
      style={[
        {
          padding,
          borderRadius: radius.card,
          borderCurve: "continuous",
          backgroundColor: c[`surface${level}`],
          boxShadow: shadow[level],
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
