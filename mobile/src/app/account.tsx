import { router } from "expo-router"
import { ArrowLeft, LogOut } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { authClient } from "@/lib/auth-client"
import { colors } from "@/theme/colors"
import { shadow } from "@/theme/elevation"
import { layout, radius, space } from "@/theme/layout"
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
        <Text style={[type.mono, styles.eyebrow]}>{t("account.eyebrow")}</Text>
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
        <Button title={t("account.signOut")} variant="tertiary" icon={LogOut} onPress={signOut} />
        <Button title={t("account.backToMap")} icon={ArrowLeft} onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: layout.gutter, backgroundColor: colors.background },
  header: { gap: space.s, marginTop: space.xl },
  eyebrow: { color: colors.fg2 },
  title: { color: colors.fg1 },
  description: { color: colors.fg2 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.l,
    marginTop: space.xxxl,
    padding: 20,
    borderRadius: radius.card,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceCard,
    boxShadow: shadow[3],
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.surfaceChip,
    boxShadow: `inset 0 0 0 1px ${colors.separator}`,
  },
  avatarText: { color: colors.fg1 },
  identity: { flex: 1, gap: space.xs },
  footer: { marginTop: "auto", gap: space.m },
})
