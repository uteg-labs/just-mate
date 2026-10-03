import { ActivityIndicator, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native"

import type { Palette } from "@/theme/colors"
import { radius } from "@/theme/layout"
import { font, type } from "@/theme/type"

import { Icon, type IconName } from "./Icon"
import { AnimatedPressable, usePress } from "./press"
import { type Scheme, useScheme } from "./scheme"

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "glow" | "danger"

export type ButtonProps = {
  title: string
  onPress?: () => void
  variant?: ButtonVariant
  size?: "sm" | "md" | "lg"
  leadingIcon?: IconName
  trailingIcon?: IconName
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  scheme?: Scheme
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

const SIZE = {
  lg: { minHeight: 52, px: 24, gap: 8, icon: 18, label: type.labelLg },
  md: { minHeight: 44, px: 20, gap: 6, icon: 17, label: type.labelMd },
  sm: { minHeight: 36, px: 16, gap: 6, icon: 16, label: type.labelSm },
} as const

type Look = { bg: string; pressed: string; fg: string; ring?: string; glow?: boolean }

// DESIGN.md §12.1, §8.3
function look(c: Palette, variant: ButtonVariant): Look {
  switch (variant) {
    case "secondary":
      return { bg: c.tint, pressed: c.tint, fg: c.fg1 }
    case "tertiary":
      return { bg: "transparent", pressed: c.active, fg: c.fg1, ring: c.border }
    case "ghost":
      return { bg: "transparent", pressed: c.active, fg: c.fg2 }
    case "glow":
      return { bg: c.glow, pressed: c.glowPress, fg: c.onGlow, glow: true }
    case "danger":
      return { bg: c.danger, pressed: c.dangerPress, fg: c.onDanger }
    case "primary":
      return { bg: c.fg1, pressed: c.primaryPress, fg: c.background }
  }
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  leadingIcon,
  trailingIcon,
  fullWidth,
  loading,
  disabled,
  scheme,
  accessibilityLabel,
  style,
}: ButtonProps) => {
  const { c, shadow } = useScheme(scheme)
  const { pressed, style: pressStyle, handlers } = usePress()
  const l = look(c, variant)
  const s = SIZE[size]
  const isInert = disabled || loading

  const boxShadow = [
    !pressed && l.bg !== "transparent" && `0 0 0 1px ${l.bg}`,
    l.ring && `inset 0 0 0 1px ${l.ring}`,
    l.glow && !disabled && shadow.glow,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isInert, busy: loading }}
      style={[
        styles.base,
        {
          minHeight: s.minHeight,
          gap: s.gap,
          paddingLeft: leadingIcon ? s.px - 4 : s.px,
          paddingRight: trailingIcon ? s.px - 4 : s.px,
          backgroundColor: pressed ? l.pressed : l.bg,
          boxShadow,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={l.fg} />
      ) : (
        <>
          {leadingIcon && (
            <Icon name={leadingIcon} size={s.icon} color={l.fg} strokeWidth={pressed ? 2 : 1.5} />
          )}
          <Text
            numberOfLines={1}
            style={[s.label, { color: l.fg }, pressed && { fontFamily: font.semibold }]}
          >
            {title}
          </Text>
          {trailingIcon && (
            <Icon name={trailingIcon} size={s.icon} color={l.fg} strokeWidth={pressed ? 2 : 1.5} />
          )}
        </>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderCurve: "continuous",
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.4 },
})
