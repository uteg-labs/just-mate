import { Compass } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { send, useStore } from "@/lib/store"
import { dark, light } from "@/theme/colors"
import { shadowDark } from "@/theme/elevation"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { Button } from "./Button"

// DESIGN.md §12.4 — buttons only, no swipe-to-dismiss
export const MatchBanner = () => {
  const { t } = useTranslation()
  const offer = useStore((s) => s.offer)
  if (!offer) return null

  return (
    <View style={styles.scrim}>
      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={[type.mono, styles.secondary]}>
            {t("match.wants", { intent: t(`intents.${offer.sharedIntent}`) })}
          </Text>
          <Text style={[type.display, styles.primary]}>
            {offer.matchPct}
            <Text style={[type.largeTitle, styles.secondary]}>%</Text>
          </Text>
        </View>
        <Text style={[type.vibe, styles.primary]}>“{offer.vibe}”</Text>

        <View style={styles.actions}>
          <Button
            title={offer.accepted ? t("match.waiting") : t("match.openCompass")}
            variant={offer.accepted ? "secondary" : "glow"}
            scheme="dark"
            icon={offer.accepted ? undefined : Compass}
            disabled={offer.accepted}
            onPress={() => send({ t: "accept", offerId: offer.offerId })}
          />
          <Button
            title={t("match.dismiss")}
            variant="ghost"
            size="md"
            scheme="dark"
            onPress={() => send({ t: "dismiss", offerId: offer.offerId })}
          />
        </View>
        <Text style={[type.footnote, styles.secondary, styles.center]}>{t("match.unlocks")}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: light.scrim,
    paddingTop: 56,
    paddingHorizontal: space.m,
  },
  card: {
    backgroundColor: dark.surfaceCard,
    borderRadius: radius.match,
    borderCurve: "continuous",
    boxShadow: shadowDark[8],
    paddingTop: space.xl,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 18,
  },
  head: { gap: 6 },
  actions: { gap: 6 },
  primary: { color: dark.fg1 },
  secondary: { color: dark.fg2 },
  center: { textAlign: "center" },
})
