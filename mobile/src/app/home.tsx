import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { INTENTS, type Intent } from "@justmate/protocol"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import {
  Beer,
  Coffee,
  Dumbbell,
  FerrisWheel,
  Heart,
  type LucideIcon,
  Music,
  Search,
  Users,
} from "lucide-react-native"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { MatchBanner } from "@/components/MatchBanner"
import { Monogram } from "@/components/Monogram"
import { StatusPill } from "@/components/StatusPill"
import { ZoneMap } from "@/components/ZoneMap"
import { authClient } from "@/lib/auth-client"
import { usePositionReports } from "@/lib/location"
import { send, useStore } from "@/lib/store"
import { colors } from "@/theme/colors"
import { shadow } from "@/theme/elevation"
import { layout, radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

// DESIGN.md §9
const INTENT_ICON: Record<Intent, LucideIcon> = {
  soul_mate: Heart,
  date: FerrisWheel,
  beer: Beer,
  coffee: Coffee,
  friends: Users,
  sports: Dumbbell,
  music: Music,
}

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

      <SafeAreaView style={styles.top} pointerEvents="box-none">
        <View pointerEvents="none">
          <StatusPill
            searching={searching}
            label={
              searching
                ? t("home.searching", {
                    intents: intents.map((item) => t(`intents.${item}`)).join(", "),
                  })
                : t("home.invisible")
            }
          />
        </View>
        <Monogram
          label={t("home.openAccount")}
          initials={authSession?.user.name.slice(0, 1)}
          onPress={() => router.push("/account")}
        />
      </SafeAreaView>

      <BottomSheet
        snapPoints={["28%"]}
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.grabber}
        backgroundComponent={({ style }) => (
          <BlurView tint="systemThickMaterialLight" intensity={80} style={[style, styles.sheet]} />
        )}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={[type.largeTitle, styles.text]}>{t("home.title")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsBleed}
            contentContainerStyle={styles.chips}
          >
            {INTENTS.map((i) => (
              <Chip
                key={i}
                label={t(`intents.${i}`)}
                icon={INTENT_ICON[i]}
                selected={i === intent}
                onPress={() => setIntent(i)}
              />
            ))}
          </ScrollView>
          {searching ? (
            <Button
              title={t("home.stop")}
              variant="secondary"
              size="md"
              onPress={() => send({ t: "search_off" })}
            />
          ) : (
            <Button
              title={t("home.find")}
              icon={Search}
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
  screen: { flex: 1, backgroundColor: colors.mapBg },
  top: {
    position: "absolute",
    top: 0,
    left: layout.gutter,
    right: layout.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: "continuous",
    overflow: "hidden",
    boxShadow: `inset 0 1px 0 0 ${colors.hairlineTop}, ${shadow.sheet}`,
  },
  grabber: { width: 36, height: 5, backgroundColor: colors.fg3 },
  sheetContent: { paddingHorizontal: layout.sheetPadding, gap: 14 },
  chipsBleed: { marginHorizontal: -layout.sheetPadding },
  chips: { gap: space.s, paddingHorizontal: layout.sheetPadding },
  text: { color: colors.fg1 },
})
