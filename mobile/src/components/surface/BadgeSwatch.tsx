import { useId } from "react"
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg"

import { useScheme } from "@/components/ui"
import type { BadgeDesign } from "./badgeDesign"

export type BadgeSwatchProps = Pick<BadgeDesign, "colors" | "blobs"> & {
  width?: number
  height?: number
  r?: number
}

// a badge's three glows on a chip: the badge at a glance, without the lanyard
export const BadgeSwatch = ({
  colors,
  blobs,
  width = 56,
  height = width,
  r = 16,
}: BadgeSwatchProps) => {
  const { c } = useScheme()
  // gradient ids are document-wide on some platforms; react ids carry characters url() rejects
  const id = `swatch${useId().replace(/\W/g, "")}`

  return (
    <Svg width={width} height={height}>
      <Defs>
        {colors.map((color, i) => (
          <RadialGradient
            key={color}
            id={`${id}${i}`}
            cx={`${blobs[i][0]}%`}
            cy={`${blobs[i][1]}%`}
            r="70%"
          >
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect width={width} height={height} rx={r} fill={c.surfaceChip} />
      {colors.map((color, i) => (
        <Rect key={color} width={width} height={height} rx={r} fill={`url(#${id}${i})`} />
      ))}
    </Svg>
  )
}
