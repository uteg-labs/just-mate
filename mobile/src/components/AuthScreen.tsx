import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LocalSvg } from "react-native-svg/css"

import { colors } from "@/theme/colors"
import { shadow } from "@/theme/elevation"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

const SYMBOL = require("@/assets/brand/just-mate-symbol.svg")

type Props = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export const AuthScreen = ({ eyebrow, title, description, children }: Props) => (
  <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LocalSvg asset={SYMBOL} width={56} height={56} />
        <View style={styles.copy}>
          <Text style={[type.mono, styles.eyebrow]}>{eyebrow}</Text>
          <Text style={[type.largeTitle, styles.title]}>{title}</Text>
          <Text style={[type.body, styles.description]}>{description}</Text>
        </View>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: space.xl, gap: space.xxl },
  copy: { gap: space.s },
  eyebrow: { color: colors.fg2 },
  title: { color: colors.fg1 },
  description: { color: colors.fg2 },
  card: {
    gap: space.l,
    padding: space.xl,
    borderRadius: radius.card,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceCard,
    boxShadow: shadow[3],
  },
})
