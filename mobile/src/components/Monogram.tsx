import { BlurView } from "expo-blur"
import { Pressable, StyleSheet, Text } from "react-native"

import { colors } from "@/theme/colors"
import { radius } from "@/theme/layout"
import { pressScale } from "@/theme/motion"

type Props = { initials?: string; label: string; onPress: () => void; size?: number }

export const Monogram = ({ initials = "", label, onPress, size = 40 }: Props) => (
  <Pressable
    accessibilityLabel={label}
    onPress={onPress}
    hitSlop={(44 - size) / 2}
    style={({ pressed }) => pressed && styles.pressed}
  >
    <BlurView
      tint="systemThinMaterialLight"
      intensity={60}
      style={[styles.body, { width: size, height: size }]}
    >
      <Text style={[styles.text, { fontSize: Math.round(size * 0.38) }]}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </BlurView>
  </Pressable>
)

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    overflow: "hidden",
    boxShadow: `inset 0 1px 0 0 ${colors.hairlineTop}, inset 0 0 0 1px ${colors.separator}`,
  },
  text: { color: colors.fg1, fontWeight: "600", letterSpacing: -0.2 },
  pressed: { transform: [{ scale: pressScale.icon }] },
})
