import { router } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { authClient } from "@/lib/auth-client"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

export default function Account() {
  const { t } = useTranslation()
  const { data: session } = authClient.useSession()

  const signOut = async () => {
    await authClient.signOut()
    router.replace("/sign-in")
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={[type.caption, styles.eyebrow]}>{t("account.eyebrow")}</Text>
        <Text style={[type.largeTitle, styles.title]}>{t("account.title")}</Text>
        <Text style={[type.body, styles.description]}>{t("account.description")}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={[type.title, styles.avatarText]}>
            {session?.user.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.identity}>
          <Text style={[type.headline, styles.title]}>{session?.user.name}</Text>
          <Text style={[type.footnote, styles.description]}>{session?.user.email}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Button title={t("account.signOut")} variant="ghost" onPress={signOut} />
        <Button title={t("account.backToMap")} onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: space.xl, backgroundColor: colors.bg },
  header: { gap: space.s, marginTop: space.xl },
  eyebrow: { color: colors.glow, textTransform: "uppercase" },
  title: { color: colors.textPrimary },
  description: { color: colors.textSecondary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.l,
    marginTop: space.xxxl,
    padding: space.l,
    borderRadius: radius.card,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.glow,
  },
  avatarText: { color: colors.onGlow },
  identity: { flex: 1, gap: space.xs },
  footer: { marginTop: "auto", gap: space.m },
})
