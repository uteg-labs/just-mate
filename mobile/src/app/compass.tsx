import type { Bucket } from "@justmate/protocol"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { useHeading } from "@/lib/location"
import { send, useStore } from "@/lib/store"
import { colors } from "@/theme/colors"
import { space } from "@/theme/layout"
import { type } from "@/theme/type"

const BUCKET_COLOR: Record<Bucket, string> = {
  cold: colors.tempCold,
  warm: colors.tempWarm,
  hot: colors.tempHot,
  burning: colors.tempBurning,
}

function useCountdown(endsAt = 0) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const left = Math.max(0, Math.round((endsAt - now) / 1000))
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`
}

export default function Compass() {
  const { t } = useTranslation()
  const session = useStore((s) => s.session)
  const heading = useHeading()
  const countdown = useCountdown(session?.endsAt)

  useEffect(() => {
    if (!session) router.back()
  }, [session])

  if (!session) return null

  const waiting = session.bearing === undefined
  const bucket = session.bucket ?? "cold"

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={[type.display, styles.text]}>{countdown}</Text>

      <View style={styles.center}>
        <Text
          style={[
            styles.arrow,
            { color: BUCKET_COLOR[bucket], opacity: waiting ? 0.4 : 1 },
            { transform: [{ rotate: `${(session.bearing ?? 0) - heading}deg` }] },
          ]}
        >
          ↑
        </Text>
        <Text style={[type.title, { color: BUCKET_COLOR[bucket] }]}>
          {waiting ? t("compass.waiting") : t(`compass.${bucket}`)}
        </Text>
      </View>

      <Button
        title={t("compass.vanish")}
        variant="danger"
        onPress={() => send({ t: "vanish", sessionId: session.id })}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.l, alignItems: "stretch" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.xl },
  arrow: { fontSize: 160, lineHeight: 180 },
  text: { color: colors.textPrimary, textAlign: "center" },
})
