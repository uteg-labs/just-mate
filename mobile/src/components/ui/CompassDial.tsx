import type { Bucket } from "@justmate/protocol"
import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from "react-native-svg"

import { spring } from "@/theme/motion"

import { BUCKET_COLOR } from "./BucketLabel"
import { Icon } from "./Icon"
import { useScheme } from "./scheme"

export type CompassDialProps = {
  rotation: number
  bucket: Bucket
  waiting?: boolean
  size?: number
}

const TICKS = Array.from({ length: 60 }, (_, i) => i)

// the arrow is the information, so it keeps turning under reduce motion
const SENSOR = { ...spring.sensor, reduceMotion: ReduceMotion.Never }

// DESIGN.md §12.5 — rotation = bearing − heading, along the shortest arc
export const CompassDial = ({ rotation, bucket, waiting, size = 280 }: CompassDialProps) => {
  const { c } = useScheme()
  const angle = useSharedValue(rotation)
  const color = c[BUCKET_COLOR[bucket]]
  const isBurning = bucket === "burning"
  const r = size / 2

  useEffect(() => {
    const from = angle.get()
    const delta = ((((rotation - from) % 360) + 540) % 360) - 180
    angle.set(withSpring(from + delta, SENSOR))
  }, [rotation, angle])

  const arrow = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }))

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
        <Circle cx={r} cy={r} r={r - 0.5} stroke={c.separator} fill="none" />
        {TICKS.map((i) => {
          const isMajor = i % 5 === 0
          const a = (i * 6 * Math.PI) / 180
          const outer = r - 8
          const inner = outer - (isMajor ? 10 : 6)
          return (
            <Line
              key={i}
              x1={r + outer * Math.sin(a)}
              y1={r - outer * Math.cos(a)}
              x2={r + inner * Math.sin(a)}
              y2={r - inner * Math.cos(a)}
              stroke={i % 15 === 0 ? c.fg2 : c.fg3}
              strokeWidth={isMajor ? 2 : 1}
            />
          )
        })}
      </Svg>
      <Animated.View style={[styles.arrow, { opacity: waiting ? 0.4 : 1 }, arrow]}>
        <Icon
          name="navigation-2"
          size={size * 0.62}
          color={color}
          fill={color}
          strokeWidth={1}
          style={{
            filter: `drop-shadow(0 0 ${isBurning ? 24 : 14}px ${isBurning ? c.tempHot : color})`,
          }}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  arrow: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
})
