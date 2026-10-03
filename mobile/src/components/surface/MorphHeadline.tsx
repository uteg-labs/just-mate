import { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useReduceMotion, useScheme } from "@/components/ui"
import { duration, spring } from "@/theme/motion"
import { type } from "@/theme/type"

type Phase = "in" | "out" | "wait"

export type MorphHeadlineProps = { lines: string[]; paused?: boolean }

const RISE = 10
const ENTER_DELAY = 140

const Word = ({ word, index, phase }: { word: string; index: number; phase: Phase }) => {
  const { c } = useScheme()
  const isIn = phase === "in"
  const opacity = useSharedValue(isIn ? 1 : 0)
  const y = useSharedValue(isIn ? 0 : RISE)

  useEffect(() => {
    if (phase === "wait") {
      opacity.set(0)
      y.set(RISE)
      return
    }

    const delay = index * duration.stagger + (phase === "in" ? ENTER_DELAY : 0)
    opacity.set(withDelay(delay, withTiming(phase === "in" ? 1 : 0, { duration: duration.word })))
    y.set(withDelay(delay, withSpring(phase === "in" ? 0 : -RISE, spring.morph)))
  }, [phase, index, opacity, y])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: y.get() }],
  }))

  return <Animated.Text style={[type.largeTitle, { color: c.fg1 }, style]}>{word}</Animated.Text>
}

// DESIGN.md §13.8 — words rise in staggered while the old line lifts out; blur is web-only
export const MorphHeadline = ({ lines, paused }: MorphHeadlineProps) => {
  const reduceMotion = useReduceMotion()
  const [{ current, prev }, setPair] = useState({ current: 0, prev: -1 })
  const [heights, setHeights] = useState<Record<number, number>>({})
  const count = lines.length
  const isStill = paused || reduceMotion || count < 2

  useEffect(() => {
    if (isStill) return
    const timer = setInterval(
      () => setPair((p) => ({ prev: p.current, current: (p.current + 1) % count })),
      duration.headline,
    )
    return () => clearInterval(timer)
  }, [isStill, count])

  const shown = current % Math.max(1, count)

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLiveRegion="polite"
      accessibilityLabel={lines[shown]}
      style={{ height: Math.max(0, ...Object.values(heights)) }}
    >
      {lines.map((line, k) => (
        <View
          key={line}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height
            setHeights((all) => (all[k] === h ? all : { ...all, [k]: h }))
          }}
          style={styles.line}
        >
          {line.split(" ").map((word, j) => (
            <Word
              // biome-ignore lint/suspicious/noArrayIndexKey: a line can repeat a word
              key={j}
              word={word}
              index={j}
              phase={k === shown ? "in" : k === prev ? "out" : "wait"}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: Math.round(type.largeTitle.fontSize * 0.26),
  },
})
