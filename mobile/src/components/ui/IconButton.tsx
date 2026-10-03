import type { StyleProp, ViewStyle } from "react-native"
import { StyleSheet } from "react-native"

import { layout, radius } from "@/theme/layout"
import { pressScale } from "@/theme/motion"

import { Icon, type IconName } from "./Icon"
import { Material } from "./Material"
import { AnimatedPressable, usePress } from "./press"
import { useScheme } from "./scheme"

export type IconButtonVariant = "material" | "tint" | "solid" | "ghost"

export type IconButtonProps = {
  icon: IconName
  label: string
  onPress?: () => void
  variant?: IconButtonVariant
  size?: number
  iconSize?: number
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

// DESIGN.md §12.1 — round, icon only, always labelled
export const IconButton = ({
  icon,
  label,
  onPress,
  variant = "material",
  size = layout.hitMin,
  iconSize,
  disabled,
  style,
}: IconButtonProps) => {
  const { c, shadow } = useScheme()
  const { pressed, style: pressStyle, handlers } = usePress(pressScale.icon)
  const isMaterial = variant === "material"

  const bg = {
    material: "transparent",
    tint: c.tint,
    solid: c.fg1,
    ghost: pressed ? c.active : "transparent",
  }[variant]

  const glyph = (
    <Icon
      name={icon}
      size={iconSize ?? Math.round(size * 0.45)}
      color={variant === "solid" ? c.background : c.fg1}
      strokeWidth={pressed ? 2 : 1.75}
    />
  )

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Math.max(0, (layout.hitMin - size) / 2)}
      style={[
        styles.base,
        { width: size, height: size, backgroundColor: bg },
        isMaterial && { boxShadow: shadow[3] },
        disabled && styles.disabled,
        pressStyle,
        style,
      ]}
    >
      {isMaterial ? (
        <Material thickness="thin" style={[styles.base, styles.fill]}>
          {glyph}
        </Material>
      ) : (
        glyph
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  fill: { width: "100%", height: "100%" },
  disabled: { opacity: 0.4 },
})
