import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

type Props = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export const AuthScreen = ({ eyebrow, title, description, children }: Props) => (
  <SafeAreaView style={styles.screen}>
    <View style={styles.glow} />
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mark}>
          <View style={styles.markCore} />
        </View>
        <View style={styles.copy}>
          <Text style={[type.caption, styles.eyebrow]}>{eyebrow}</Text>
          <Text style={[type.largeTitle, styles.title]}>{title}</Text>
          <Text style={[type.body, styles.description]}>{description}</Text>
        </View>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  glow: {
    position: "absolute",
    top: -130,
    alignSelf: "center",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(255,178,63,0.06)",
  },
  content: { flexGrow: 1, justifyContent: "center", padding: space.xl, gap: space.xxl },
  mark: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,178,63,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,178,63,0.24)",
  },
  markCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.glow },
  copy: { gap: space.s },
  eyebrow: { color: colors.glow, textTransform: "uppercase" },
  title: { color: colors.textPrimary },
  description: { color: colors.textSecondary },
  card: {
    gap: space.l,
    padding: space.xl,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
  },
})
