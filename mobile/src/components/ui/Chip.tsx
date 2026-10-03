import { StyleSheet, Text } from "react-native"

import { radius } from "@/theme/layout"
import { font, type } from "@/theme/type"

import { Icon, type IconName } from "./Icon"
import { AnimatedPressable, usePress } from "./press"
import { useScheme } from "./scheme"

export type ChipProps = {
  label: string
  onPress?: () => void
  selected?: boolean
  icon?: IconName
  size?: "sm" | "md"
  disabled?: boolean
}

// DESIGN.md §12.2 — solid even on material, selected = foreground fill
export const Chip = ({ label, onPress, selected, icon, size = "md", disabled }: ChipProps) => {
  const { c } = useScheme()
  const { style: pressStyle, handlers } = usePress()
  const isSmall = size === "sm"
  const fg = selected ? c.background : c.fg1
  const px = isSmall ? 12 : 16

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      disabled={disabled}
      hitSlop={isSmall ? 6 : 2}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.chip,
        {
          height: isSmall ? 32 : 40,
          paddingLeft: icon ? px - 4 : px,
          paddingRight: px,
          backgroundColor: selected ? c.fg1 : c.surfaceChip,
          boxShadow: selected ? undefined : `inset 0 0 0 1px ${c.separator}`,
        },
        disabled && styles.disabled,
        pressStyle,
      ]}
    >
      {icon && (
        <Icon name={icon} size={isSmall ? 15 : 17} color={fg} strokeWidth={selected ? 2 : 1.75} />
      )}
      <Text
        style={[
          isSmall ? type.labelSm : type.labelMd,
          { color: fg },
          selected && { fontFamily: font.semibold },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    borderCurve: "continuous",
  },
  disabled: { opacity: 0.4 },
})
