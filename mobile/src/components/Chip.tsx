import { Pressable, StyleSheet, Text } from "react-native"

import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

type Props = { label: string; selected: boolean; onPress: () => void }

export const Chip = ({ label, selected, onPress }: Props) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.selected,
      pressed && { transform: [{ scale: 0.97 }] },
    ]}
  >
    <Text style={[type.headline, { color: selected ? colors.onGlow : colors.textPrimary }]}>
      {label}
    </Text>
  </Pressable>
)

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.l,
    paddingVertical: space.s,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceRaised,
  },
  selected: { backgroundColor: colors.glow },
})
