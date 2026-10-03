import { Pressable, StyleSheet, Text } from "react-native"

import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

type Props = {
  title: string
  onPress: () => void
  variant?: "primary" | "ghost" | "danger"
  disabled?: boolean
}

export const Button = ({ title, onPress, variant = "primary", disabled }: Props) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.base,
      styles[variant],
      pressed && styles.pressed,
      disabled && styles.disabled,
    ]}
  >
    <Text
      style={[type.headline, { color: variant === "primary" ? colors.onGlow : colors.textPrimary }]}
    >
      {title}
    </Text>
  </Pressable>
)

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.button,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  primary: { backgroundColor: colors.glow },
  ghost: { backgroundColor: colors.surfaceRaised },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.4 },
})
