import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import { INTENTS, type Intent } from "@justmate/protocol"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { MatchBanner } from "@/components/MatchBanner"
import { ZoneMap } from "@/components/ZoneMap"
import { usePositionReports } from "@/lib/location"
import { send, useStore } from "@/lib/store"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

const label = (intent: string) => intent.replace("_", " ")

export default function Home() {
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
            {searching ? `● searching: ${intents.map(label).join(", ")}` : "invisible"}
          </Text>
        </BlurView>
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
          <Text style={[type.largeTitle, styles.text]}>Where to?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {INTENTS.map((i) => (
              <Chip key={i} label={label(i)} selected={i === intent} onPress={() => setIntent(i)} />
            ))}
          </ScrollView>
          {searching ? (
            <Button
              title="Stop searching"
              variant="ghost"
              onPress={() => send({ t: "search_off" })}
            />
          ) : (
            <Button
              title="Find people"
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
