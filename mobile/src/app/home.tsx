import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { INTENTS, type Intent } from "@justmate/protocol"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { MatchBanner } from "@/components/MatchBanner"
import { ZoneMap } from "@/components/ZoneMap"
import { authClient } from "@/lib/auth-client"
import { usePositionReports } from "@/lib/location"
import { send, useStore } from "@/lib/store"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

export default function Home() {
  const { t } = useTranslation()
  const { data: authSession } = authClient.useSession()
  const [intent, setIntent] = useState<Intent>("beer")
  const intents = useStore((s) => s.intents)
  const zones = useStore((s) => s.zones)
  const config = useStore((s) => s.config)
  const sessionId = useStore((s) => s.session?.id)

  const searching = intents.length > 0
  usePositionReports(searching, config.positionIntervalMs)

  useEffect(() => {
    if (sessionId) router.push("/compass")
  }, [sessionId])

  return (
    <View style={styles.screen}>
      <ZoneMap zones={zones} />

      <SafeAreaView style={styles.pill} pointerEvents="none">
        <BlurView tint="systemThinMaterialDark" intensity={60} style={styles.pillBody}>
          <Text style={[type.caption, styles.text]}>
            {searching
              ? t("home.searching", {
                  intents: intents.map((item) => t(`intents.${item}`)).join(", "),
                })
              : t("home.invisible")}
          </Text>
        </BlurView>
      </SafeAreaView>

      <SafeAreaView style={styles.accountArea} pointerEvents="box-none">
        <Pressable
          accessibilityLabel={t("home.openAccount")}
          onPress={() => router.push("/account")}
          style={({ pressed }) => [styles.account, pressed && styles.accountPressed]}
        >
          <Text style={[type.caption, styles.accountText]}>
            {authSession?.user.name.slice(0, 1).toUpperCase()}
          </Text>
        </Pressable>
      </SafeAreaView>

      <BottomSheet
        snapPoints={["28%"]}
        enableDynamicSizing={false}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
        backgroundComponent={({ style }) => (
          <BlurView tint="systemChromeMaterialDark" intensity={80} style={[style, styles.sheet]} />
        )}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={[type.largeTitle, styles.text]}>{t("home.title")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {INTENTS.map((i) => (
              <Chip
                key={i}
                label={t(`intents.${i}`)}
                selected={i === intent}
                onPress={() => setIntent(i)}
              />
            ))}
          </ScrollView>
          {searching ? (
            <Button
              title={t("home.stop")}
              variant="ghost"
              onPress={() => send({ t: "search_off" })}
            />
          ) : (
            <Button
              title={t("home.find")}
              onPress={() => send({ t: "search_on", intents: [intent] })}
            />
          )}
        </BottomSheetView>
      </BottomSheet>

      <MatchBanner />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pill: { position: "absolute", top: 0, alignSelf: "center" },
  accountArea: { position: "absolute", top: 0, right: space.l },
  account: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.glow,
  },
  accountPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  accountText: { color: colors.onGlow },
  pillBody: {
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: "hidden",
  },
  sheetContent: { paddingHorizontal: space.xl, gap: space.l },
  chips: { gap: space.s },
  text: { color: colors.textPrimary },
})
