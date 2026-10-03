import { useState } from "react"
import {
  type LayoutRectangle,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native"
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated"

import { radius } from "@/theme/layout"
import { spring } from "@/theme/motion"
import { font } from "@/theme/type"

import { Icon, type IconName } from "./Icon"
import { useScheme } from "./scheme"

export type SegmentedItem<T extends string> = { value: T; label?: string; icon?: IconName }

export type SegmentedProps<T extends string> = {
  items: SegmentedItem<T>[]
  value: T
  onChange: (value: T) => void
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
}

const INSET = 4

const Thumb = ({ frame, color }: { frame: LayoutRectangle; color: string }) => {
  const animated = useAnimatedStyle(() => ({
    width: withSpring(frame.width, spring.moderate),
    transform: [{ translateX: withSpring(frame.x, spring.moderate) }],
  }))

  return <Animated.View style={[styles.thumb, { backgroundColor: color }, animated]} />
}

// DESIGN.md §12.2 — sliding solid indicator; the thumb mounts on first layout so it never slides in
export const Segmented = <T extends string>({
  items,
  value,
  onChange,
  fullWidth = true,
  style,
}: SegmentedProps<T>) => {
  const { c } = useScheme()
  const [frames, setFrames] = useState<Record<number, LayoutRectangle>>({})
  const frame =
    frames[
      Math.max(
        0,
        items.findIndex((item) => item.value === value),
      )
    ]

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.track,
        { backgroundColor: c.muted, boxShadow: `inset 0 0 0 1px ${c.separator}` },
        !fullWidth && styles.hug,
        style,
      ]}
    >
      {frame && <Thumb frame={frame} color={c.fg1} />}
      {items.map((item, index) => {
        const isActive = item.value === value
        const fg = isActive ? c.background : c.fg2

        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityLabel={item.label ?? item.value}
            accessibilityState={{ selected: isActive }}
            onLayout={(e) => {
              const { layout } = e.nativeEvent
              setFrames((f) => ({ ...f, [index]: layout }))
            }}
            onPress={() => onChange(item.value)}
            style={[styles.item, fullWidth && styles.grow]}
          >
            {item.icon && (
              <Icon name={item.icon} size={18} color={fg} strokeWidth={isActive ? 2 : 1.5} />
            )}
            {item.label && (
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: fg, fontFamily: isActive ? font.semibold : font.medium },
                ]}
              >
                {item.label}
              </Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    minHeight: 44,
    flexDirection: "row",
    padding: INSET,
    borderRadius: radius.pill,
    borderCurve: "continuous",
  },
  hug: { alignSelf: "flex-start" },
  thumb: {
    position: "absolute",
    top: INSET,
    bottom: INSET,
    left: 0,
    borderRadius: radius.pill,
    borderCurve: "continuous",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  grow: { flex: 1 },
  label: { fontSize: 14, lineHeight: 18 },
})
