import type { LucideIcon } from "lucide-react-native"
import { Pressable, StyleSheet, Text } from "react-native"

import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { type } from "@/theme/type"

type Props = { label: string; selected: boolean; onPress: () => void; icon?: LucideIcon }

export const Chip = ({ label, selected, onPress, icon: Icon }: Props) => {
  const color = selected ? colors.background : colors.fg1

  return (
    <Pressable
      onPress={onPress}
      hitSlop={2}
      style={({ pressed }) => [
        styles.chip,
        Icon && styles.withIcon,
        selected ? styles.selected : styles.idle,
        pressed && styles.pressed,
      ]}
    >
      {Icon && <Icon size={17} color={color} strokeWidth={selected ? 2 : 1.75} />}
      <Text style={[type.labelMd, { color }, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
  },
  withIcon: { paddingLeft: space.m },
  idle: {
    backgroundColor: colors.surfaceChip,
    boxShadow: `inset 0 0 0 1px ${colors.separator}`,
  },
  selected: { backgroundColor: colors.fg1 },
  selectedLabel: { fontWeight: "600" },
  pressed: { transform: [{ scale: pressScale.default }] },
})
