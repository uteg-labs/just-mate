import type { Bucket } from "@justmate/protocol"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { X } from "lucide-react-native"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { CompassDial } from "@/components/CompassDial"
import { useHeading } from "@/lib/location"
import { send, useStore } from "@/lib/store"
import { dark } from "@/theme/colors"
import { layout, space } from "@/theme/layout"
import { type } from "@/theme/type"

const BUCKET_COLOR: Record<Bucket, string> = {
  cold: dark.tempCold,
  warm: dark.tempWarm,
  hot: dark.tempHot,
  burning: dark.tempBurning,
}

const BURNING_GLOW = `0 0 0 3px ${dark.tempHot}, 0 0 16px ${dark.tempHot}`

const WARN_S = 60

function useSecondsLeft(endsAt = 0) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return Math.max(0, Math.round((endsAt - now) / 1000))
}

export default function Compass() {
  const { t } = useTranslation()
  const session = useStore((s) => s.session)
  const heading = useHeading()
  const left = useSecondsLeft(session?.endsAt)

  useEffect(() => {
    if (!session) router.back()
  }, [session])

  if (!session) return null

  const waiting = session.bearing === undefined
  const bucket = session.bucket ?? "cold"
  const isBurning = bucket === "burning"

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <Text
        style={[type.display, styles.countdown, left <= WARN_S && styles.warn]}
        maxFontSizeMultiplier={1.3}
      >
        {`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
      </Text>

      <View style={styles.center}>
        <CompassDial
          rotation={(session.bearing ?? 0) - heading}
          color={BUCKET_COLOR[bucket]}
          burning={isBurning}
          waiting={waiting}
        />
        {waiting ? (
          <Text style={[type.title, styles.muted]}>{t("compass.waiting")}</Text>
        ) : (
          <View style={styles.bucket}>
            <View
              style={[
                styles.dot,
                { backgroundColor: BUCKET_COLOR[bucket] },
                { boxShadow: isBurning ? BURNING_GLOW : `0 0 12px ${BUCKET_COLOR[bucket]}` },
              ]}
            />
            <Text style={[type.title, styles.text]}>{t(`compass.${bucket}`)}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={t("compass.vanish")}
          variant="danger"
          scheme="dark"
          icon={X}
          onPress={() => send({ t: "vanish", sessionId: session.id })}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: dark.background, padding: layout.gutter },
  countdown: { color: dark.fg1, textAlign: "center", marginTop: space.xl },
  warn: { color: dark.tempHot },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  bucket: { flexDirection: "row", alignItems: "center", gap: space.s },
  dot: { width: 10, height: 10, borderRadius: 5 },
  footer: { flexDirection: "row" },
  text: { color: dark.fg1 },
  muted: { color: dark.fg2 },
})
