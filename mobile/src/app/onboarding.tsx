import { INTERESTS } from "@justmate/protocol"
import { router } from "expo-router"
import { Check } from "lucide-react-native"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { authClient } from "@/lib/auth-client"
import { send } from "@/lib/store"
import { colors } from "@/theme/colors"
import { layout, radius, space } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { type } from "@/theme/type"

const MIN_INTERESTS = 3

export default function Onboarding() {
  const { t } = useTranslation()
  const [interests, setInterests] = useState<string[]>([])
  const [adult, setAdult] = useState(false)

  const toggle = (interest: string) =>
    setInterests((current) =>
      current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest],
    )

  const enter = async () => {
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
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: adult }}
          style={({ pressed }) => [styles.check, pressed && styles.checkPressed]}
          onPress={() => setAdult(!adult)}
        >
          <View style={[styles.box, adult ? styles.boxOn : styles.boxOff]}>
            {adult && <Check size={16} color={colors.background} strokeWidth={2.5} />}
          </View>
          <Text style={[type.headline, styles.text]}>{t("onboarding.adult")}</Text>
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
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: layout.gutter, gap: space.l },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  footer: { padding: layout.gutter, gap: space.l },
  check: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    borderRadius: radius.row,
    borderCurve: "continuous",
    backgroundColor: colors.surfaceRaised,
    boxShadow: `inset 0 0 0 1px ${colors.separator}`,
  },
  checkPressed: { transform: [{ scale: pressScale.row }] },
  box: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  boxOff: { boxShadow: `inset 0 0 0 1.5px ${colors.fg3}` },
  boxOn: { backgroundColor: colors.fg1 },
  text: { color: colors.fg1 },
  muted: { color: colors.fg2 },
})
