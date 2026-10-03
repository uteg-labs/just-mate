import { INTERESTS } from "@justmate/protocol"
import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { authClient } from "@/lib/auth-client"
import { completeOnboarding } from "@/lib/onboarding"
import { send } from "@/lib/store"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

const MIN_INTERESTS = 3

export default function Onboarding() {
  const { t } = useTranslation()
  const { data: session } = authClient.useSession()
  const [interests, setInterests] = useState<string[]>([])
  const [adult, setAdult] = useState(false)

  const toggle = (interest: string) =>
    setInterests((current) =>
      current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest],
    )

  const enter = async () => {
    if (!session) return

    await completeOnboarding(session.user.id)
    const sessionCookie = await authClient.getCookie()
    send({ t: "hello", sessionCookie, interests, adult: true })
    router.replace("/home")
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.largeTitle, styles.text]}>{t("onboarding.title")}</Text>
        <Text style={[type.body, styles.muted]}>
          {t("onboarding.description", { count: MIN_INTERESTS })}
        </Text>

        <View style={styles.chips}>
          {INTERESTS.map((interest) => (
            <Chip
              key={interest}
              label={t(`interests.${interest}`)}
              selected={interests.includes(interest)}
              onPress={() => toggle(interest)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.check} onPress={() => setAdult(!adult)} hitSlop={10}>
          <View style={[styles.box, adult && styles.boxOn]} />
          <Text style={[type.body, styles.text]}>{t("onboarding.adult")}</Text>
        </Pressable>
        <Button
          title={t("onboarding.enter")}
          disabled={!adult || interests.length < MIN_INTERESTS}
          onPress={enter}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.l, gap: space.l },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  footer: { padding: space.l, gap: space.l },
  check: { flexDirection: "row", alignItems: "center", gap: space.m },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.button / 2,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  boxOn: { backgroundColor: colors.glow, borderColor: colors.glow },
  text: { color: colors.textPrimary },
  muted: { color: colors.textSecondary },
})
