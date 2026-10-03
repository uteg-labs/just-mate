import { Navigation2 } from "lucide-react-native"
import { StyleSheet, View } from "react-native"
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from "react-native-svg"

import { dark } from "@/theme/colors"

type Props = { rotation: number; color: string; burning: boolean; waiting: boolean; size?: number }

const TICKS = Array.from({ length: 60 }, (_, i) => i)

export const CompassDial = ({ rotation, color, burning, waiting, size = 280 }: Props) => {
  const r = size / 2
  const glow = burning ? `drop-shadow(0 0 24px ${dark.tempHot})` : `drop-shadow(0 0 14px ${color})`

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="halo">
            <Stop offset="0" stopColor={color} stopOpacity={0.16} />
            <Stop offset="0.7" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill="url(#halo)" />
        <Circle cx={r} cy={r} r={r - 0.5} stroke={dark.separator} fill="none" />
        {TICKS.map((i) => {
          const major = i % 5 === 0
          const angle = (i * 6 * Math.PI) / 180
          const outer = r - 8
          const inner = outer - (major ? 10 : 6)
          return (
            <Line
              key={i}
              x1={r + outer * Math.sin(angle)}
              y1={r - outer * Math.cos(angle)}
              x2={r + inner * Math.sin(angle)}
              y2={r - inner * Math.cos(angle)}
              stroke={i % 15 === 0 ? dark.fg2 : dark.fg3}
              strokeWidth={major ? 2 : 1}
            />
          )
        })}
      </Svg>
      <View
        style={[
          styles.arrow,
          { opacity: waiting ? 0.4 : 1, transform: [{ rotate: `${rotation}deg` }] },
        ]}
      >
        <Navigation2
          size={size * 0.62}
          color={color}
          fill={color}
          strokeWidth={1}
          style={{ filter: glow }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  arrow: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
})
