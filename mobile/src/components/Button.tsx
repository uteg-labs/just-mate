import type { LucideIcon } from "lucide-react-native"
import { Pressable, StyleSheet, Text } from "react-native"

import { dark, light, type Palette } from "@/theme/colors"
import { shadowDark, shadowLight } from "@/theme/elevation"
import { radius } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { type } from "@/theme/type"

type Variant = "primary" | "secondary" | "tertiary" | "ghost" | "glow" | "danger"

type Props = {
  title: string
  onPress: () => void
  variant?: Variant
  size?: "lg" | "md"
  icon?: LucideIcon
  scheme?: "light" | "dark"
  disabled?: boolean
}

const SIZE = {
  lg: { minHeight: 52, paddingHorizontal: 24, gap: 8, icon: 18, label: type.labelLg },
  md: { minHeight: 44, paddingHorizontal: 20, gap: 6, icon: 17, label: type.labelMd },
} as const

type Look = { bg: string; pressed: string; fg: string; ring?: string; shadow?: string }

function look(c: Palette, glowShadow: string): Record<Variant, Look> {
  return {
    primary: { bg: c.fg1, pressed: c.primaryPress, fg: c.background },
    secondary: { bg: c.tint, pressed: c.tint, fg: c.fg1 },
    tertiary: { bg: "transparent", pressed: c.active, fg: c.fg1, ring: c.border },
    ghost: { bg: "transparent", pressed: c.active, fg: c.fg2 },
    glow: { bg: c.glow, pressed: c.glowPress, fg: c.onGlow, shadow: glowShadow },
    danger: { bg: c.danger, pressed: c.dangerPress, fg: c.onDanger },
  }
}

const LOOK = { light: look(light, shadowLight.glow), dark: look(dark, shadowDark.glow) }

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  icon: Icon,
  scheme = "light",
  disabled,
}: Props) => {
  const c = LOOK[scheme][variant]
  const s = SIZE[size]

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.minHeight,
          paddingHorizontal: Icon ? s.paddingHorizontal - 4 : s.paddingHorizontal,
          gap: s.gap,
          backgroundColor: pressed ? c.pressed : c.bg,
          borderColor: c.ring ?? "transparent",
          boxShadow: disabled ? undefined : c.shadow,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {({ pressed }) => (
        <>
          {Icon && <Icon size={s.icon} color={c.fg} strokeWidth={pressed ? 2 : 1.5} />}
          <Text style={[s.label, { color: c.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  pressed: { transform: [{ scale: pressScale.default }] },
  disabled: { opacity: 0.4 },
})
