import { BlurView } from "expo-blur"
import type { ReactNode } from "react"
import type { StyleProp, ViewStyle } from "react-native"

import { useScheme } from "./scheme"

type Props = { thickness: "thick" | "thin"; style?: StyleProp<ViewStyle>; children?: ReactNode }

// DESIGN.md §5 — blur + material fill + bright top edge. android renders no blur without a
// BlurTargetView, so the fill alone has to read as the material there
export const Material = ({ thickness, style, children }: Props) => {
  const { scheme, c } = useScheme()
  const isThick = thickness === "thick"

  return (
    <BlurView
      tint={scheme}
      intensity={isThick ? 80 : 60}
      style={[
        {
          overflow: "hidden",
          borderCurve: "continuous",
          backgroundColor: isThick ? c.materialThick : c.materialThin,
          boxShadow: `inset 0 1px 0 0 ${c.hairlineTop}`,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  )
}
