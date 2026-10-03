import { BlurView } from "expo-blur"
import { EyeOff } from "lucide-react-native"
import { StyleSheet, Text, View } from "react-native"

import { colors } from "@/theme/colors"
import { shadow } from "@/theme/elevation"
import { radius } from "@/theme/layout"
import { type } from "@/theme/type"

type Props = { label: string; searching: boolean }

export const StatusPill = ({ label, searching }: Props) => (
  <View style={styles.shadow} accessibilityLiveRegion="polite">
    <BlurView tint="systemThinMaterialLight" intensity={60} style={styles.body}>
      {!searching && <EyeOff size={15} color={colors.fg1} strokeWidth={2} />}
      <Text style={[type.status, styles.text]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </BlurView>
  </View>
)

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.pill, boxShadow: shadow[3] },
  body: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: radius.pill,
    overflow: "hidden",
    boxShadow: `inset 0 1px 0 0 ${colors.hairlineTop}`,
  },
  text: { color: colors.fg1 },
})
