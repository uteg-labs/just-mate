import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"

import { layout, radius, space } from "@/theme/layout"
import { spring } from "@/theme/motion"
import { type } from "@/theme/type"

import { useScheme } from "./scheme"

export type SwitchProps = {
  checked: boolean
  onToggle: () => void
  label?: string
  disabled?: boolean
}

const TRACK_W = 34
const TRACK_H = 20
const THUMB = 16
const INSET = 2

// DESIGN.md §12.2 — fluid functionalism geometry; the thumb squashes while pressed
export const Switch = ({ checked, onToggle, label, disabled }: SwitchProps) => {
  const { c, shadow } = useScheme()
  const [pressed, setPressed] = useState(false)

  const width = pressed ? THUMB + 4 : THUMB
  const height = pressed ? THUMB - 4 : THUMB
  const x = checked ? TRACK_W - INSET - width : INSET
  const y = pressed ? INSET + 2 : INSET

  const thumb = useAnimatedStyle(() => ({
    width: withSpring(width, spring.moderate),
    height: withSpring(height, spring.moderate),
    transform: [
      { translateX: withSpring(x, spring.moderate) },
      { translateY: withSpring(y, spring.moderate) },
    ],
  }))

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onToggle}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View style={[styles.track, { backgroundColor: checked ? c.focusRing : c.trackOff }]}>
        <Animated.View
          style={[styles.thumb, { backgroundColor: c.thumb, boxShadow: shadow.thumb }, thumb]}
        />
      </View>
      {label && <Text style={[styles.label, { color: checked ? c.fg1 : c.fg2 }]}>{label}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { minHeight: layout.hitMin, flexDirection: "row", alignItems: "center", gap: space.m },
  track: { width: TRACK_W, height: TRACK_H, borderRadius: radius.full },
  thumb: { position: "absolute", borderRadius: radius.full },
  label: { ...type.body, fontSize: 15, lineHeight: 20 },
  disabled: { opacity: 0.4 },
})
