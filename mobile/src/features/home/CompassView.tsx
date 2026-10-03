import type { Bucket, Config } from "@justmate/protocol"
import type { TFunction } from "i18next"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BucketLabel, Button, CompassDial, Countdown, useScheme, VibeCard } from "@/components/ui"
import { useHeading } from "@/lib/location"
import type { Match, Session } from "@/lib/store"
import { layout, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { intentLabel } from "./categories"
import { HEARTBEAT_MS, haptic } from "./haptics"
import { secondsUntil, useNow } from "./useNow"

export type CompassViewProps = {
  session: Session
  match: Match
  buckets: Config["buckets"]
  /** a plan's venue, shown with the intent */
  place?: string
  onVanish: () => void
  onMet: () => void
}

const DIAL = 290
const WARN_S = 60

function rangeOf(t: TFunction, bucket: Bucket, buckets: Config["buckets"]) {
  if (bucket === "cold") return t("compass.over", { m: buckets.warm })
  return t("compass.under", { m: buckets[bucket] })
}

// DESIGN.md §14 — a tap on every change toward warmer, then a heartbeat that quickens
function useBucketHaptics(bucket?: Bucket) {
  useEffect(() => {
    if (!bucket || bucket === "cold") return
    haptic.bucket(bucket)
    const timer = setInterval(() => haptic.bucket(bucket), HEARTBEAT_MS[bucket])
    return () => clearInterval(timer)
  }, [bucket])
}

function useWarning(left: number) {
  const isLate = left <= WARN_S
  useEffect(() => {
    if (isLate) haptic.warning()
  }, [isLate])
}

export const CompassView = ({
  session,
  match,
  buckets,
  place,
  onVanish,
  onMet,
}: CompassViewProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const heading = useHeading()
  const now = useNow()
  const left = secondsUntil(session.endsAt, now)
  const { bearing, bucket } = session
  const isWaiting = !bucket
  const isBurning = bucket === "burning"
  const intent = intentLabel(t, match.sharedIntent)
  const label = place ? `${intent} · ${place}` : intent

  useBucketHaptics(bucket)
  useWarning(left)

  return (
    <View
      style={[
        styles.page,
        { paddingTop: insets.top + space.l, paddingBottom: Math.max(insets.bottom, 36) },
      ]}
    >
      <Countdown seconds={left} label={t("compass.left", { intent: label })} />

      <View style={styles.center}>
        <CompassDial
          rotation={(bearing ?? 0) - heading}
          bucket={bucket ?? "cold"}
          waiting={isWaiting}
          size={DIAL}
        />
        {isWaiting ? (
          <Text style={[type.title, { color: c.fg2 }]}>{t("compass.finding")}</Text>
        ) : (
          <BucketLabel
            bucket={bucket}
            label={t(`compass.buckets.${bucket}`)}
            range={rangeOf(t, bucket, buckets)}
          />
        )}
      </View>

      <VibeCard compact eyebrow={t("compass.lookingFor")} quote={match.partner.vibe} />
      <View style={styles.buttons}>
        <Button
          title={t("compass.vanish")}
          variant="danger"
          size="lg"
          leadingIcon="x"
          onPress={onVanish}
        />
        <View style={styles.grow}>
          <Button
            title={t("compass.met")}
            variant={isBurning ? "glow" : "secondary"}
            size="lg"
            leadingIcon="hand"
            fullWidth
            disabled={!isBurning}
            onPress={onMet}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "stretch", paddingHorizontal: layout.gutter },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 14 },
  grow: { flex: 1 },
})
