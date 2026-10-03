import { StyleSheet, Text, View } from "react-native"

import { send, useStore } from "@/lib/store"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { Button } from "./Button"

// STRUCTURE.md §3 — buttons only, no swipe-to-dismiss
export const MatchBanner = () => {
  const offer = useStore((s) => s.offer)
  if (!offer) return null

  return (
    <View style={styles.scrim}>
      <View style={styles.card}>
        <Text style={[type.display, styles.primary]}>{offer.matchPct}%</Text>
        <Text style={[type.headline, styles.secondary]}>
          wants: {offer.sharedIntent.replace("_", " ")}
        </Text>
        <Text style={[type.vibe, styles.primary]}>“{offer.vibe}”</Text>

        <Button
          title={offer.accepted ? "waiting for them…" : "Open compass"}
          disabled={offer.accepted}
          onPress={() => send({ t: "accept", offerId: offer.offerId })}
        />
        <Button
          title="Dismiss"
          variant="ghost"
          onPress={() => send({ t: "dismiss", offerId: offer.offerId })}
        />
        <Text style={[type.footnote, styles.secondary]}>unlocks only if they accept too</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
    paddingTop: 80,
    paddingHorizontal: space.l,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderCurve: "continuous",
    padding: space.xl,
    gap: space.m,
  },
  primary: { color: colors.textPrimary },
  secondary: { color: colors.textSecondary },
})
