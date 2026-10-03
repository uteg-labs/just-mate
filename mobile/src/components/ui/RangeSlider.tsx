import { useEffect } from "react"
import { type AccessibilityActionEvent, StyleSheet, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  clamp,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import { layout, radius } from "@/theme/layout"
import { spring } from "@/theme/motion"

import { useScheme } from "./scheme"

export type Range = [number, number]

export type RangeSliderProps = {
  min: number
  max: number
  value: Range
  onChange: (value: Range) => void
  step?: number
  labels?: [string, string]
}

const THUMB = 28
const TRACK = 4

function toPx(v: number, min: number, max: number, width: number) {
  "worklet"
  return ((v - min) / (max - min)) * width
}

function toValue(px: number, min: number, max: number, step: number, width: number) {
  "worklet"
  const raw = width ? (px / width) * (max - min) : 0
  return min + Math.round(raw / step) * step
}

// two-thumb pan slider; thumbs track the finger 1:1 and snap to the step on release
export const RangeSlider = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  labels = ["minimum", "maximum"],
}: RangeSliderProps) => {
  const { c, shadow } = useScheme()
  const width = useSharedValue(0)
  const low = useSharedValue(0)
  const high = useSharedValue(0)
  const isDragging = useSharedValue(false)
  const [lowValue, highValue] = value

  function snap(px: number) {
    "worklet"
    return toValue(px, min, max, step, width.get())
  }

  useEffect(() => {
    if (isDragging.get()) return
    low.set(toPx(lowValue, min, max, width.get()))
    high.set(toPx(highValue, min, max, width.get()))
  }, [lowValue, highValue, min, max, low, high, width, isDragging])

  useAnimatedReaction(
    () => [snap(low.get()), snap(high.get())] as Range,
    (next, prev) => {
      if (!prev || !isDragging.get()) return
      if (next[0] !== prev[0] || next[1] !== prev[1]) scheduleOnRN(onChange, next)
    },
  )

  function pan(thumb: SharedValue<number>, isLow: boolean) {
    return Gesture.Pan()
      .hitSlop((layout.hitMin - THUMB) / 2)
      .onBegin(() => isDragging.set(true))
      .onChange((e) => {
        const floor = isLow ? 0 : low.get()
        const ceil = isLow ? high.get() : width.get()
        thumb.set(clamp(thumb.get() + e.changeX, floor, ceil))
      })
      .onFinalize(() => {
        isDragging.set(false)
        thumb.set(withSpring(toPx(snap(thumb.get()), min, max, width.get()), spring.snappy))
      })
  }

  const lowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: low.get() }] }))
  const highStyle = useAnimatedStyle(() => ({ transform: [{ translateX: high.get() }] }))
  const fillStyle = useAnimatedStyle(() => ({
    width: high.get() - low.get(),
    transform: [{ translateX: low.get() }],
  }))

  const adjust = (index: 0 | 1, e: AccessibilityActionEvent) => {
    const delta = e.nativeEvent.actionName === "increment" ? step : -step
    const next: Range = [lowValue, highValue]
    next[index] = clamp(next[index] + delta, index ? lowValue : min, index ? max : highValue)
    onChange(next)
  }

  const thumbs = [
    { shared: low, style: lowStyle, now: lowValue },
    { shared: high, style: highStyle, now: highValue },
  ] as const

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - THUMB
        width.set(w)
        low.set(toPx(lowValue, min, max, w))
        high.set(toPx(highValue, min, max, w))
      }}
    >
      <View style={[styles.track, { backgroundColor: c.trackOff }]}>
        <Animated.View style={[styles.fill, { backgroundColor: c.fg1 }, fillStyle]} />
      </View>
      {thumbs.map(({ shared, style, now }, index) => (
        <GestureDetector key={labels[index]} gesture={pan(shared, index === 0)}>
          <Animated.View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={labels[index]}
            accessibilityValue={{ min, max, now }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) => adjust(index === 0 ? 0 : 1, e)}
            style={[styles.thumb, { backgroundColor: c.thumb, boxShadow: shadow[3] }, style]}
          />
        </GestureDetector>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { height: layout.hitMin, justifyContent: "center" },
  track: {
    height: TRACK,
    marginHorizontal: THUMB / 2,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fill: { height: TRACK, borderRadius: radius.full },
  thumb: {
    position: "absolute",
    left: 0,
    top: (layout.hitMin - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
  },
})
