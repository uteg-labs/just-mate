import type { MatchPartner, Mode } from "@justmate/protocol"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { badgeDesignFromHash } from "@/components/surface/badgeDesign"
import { VibeBadge } from "@/components/surface/VibeBadge"
import { Button, clock, useScheme } from "@/components/ui"
import type { Match, Offer } from "@/lib/store"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { intentLabel } from "./categories"
import { secondsUntil, useNow } from "./useNow"

export type Pronoun = "her" | "his" | "their"

export type MatchCardProps = {
  offer: Offer
  match: Match
  pronoun: Pronoun
  onAccept: () => void
  onDismiss: () => void
}

const BADGE_W = 262
const STRAP = 150
const PILL_H = 52

// the badge only claims what the server vouched for
export function tagOf(t: TFunction, partner: Pick<MatchPartner, "tags">, mode: Mode) {
  if (!partner.tags.verified) return t(`modes.${mode}`).toLowerCase()
  return partner.tags.adult && mode === "date" ? t("match.adult") : t("match.verified")
}

export const MatchCard = ({ offer, match, pronoun, onAccept, onDismiss }: MatchCardProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const now = useNow()
  const { partner, mode, sharedIntent } = match
  const isExpired = offer.state === "expired"
  const isAccepted = offer.state === "accepted"

  return (
    <View
      accessibilityLiveRegion="assertive"
      style={[styles.card, { height: height - insets.top - space.s }]}
    >
      <View style={styles.badge}>
        <VibeBadge
          design={badgeDesignFromHash(partner.badgeSeed, {
            interests: partner.interests,
            hasAnswers: true,
            mode,
          })}
          width={BADGE_W}
          strap={STRAP}
          fadeStrap={false}
          eyebrow={t("match.eyebrow", {
            vibe: t(`match.vibe.${pronoun}`),
            intent: intentLabel(t, sharedIntent),
          })}
          quote={partner.vibe}
          tag={tagOf(t, match.partner, match.mode)}
          turnKey={offer.offerId}
          dim={isExpired}
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.meta}>
          <Text style={[type.mono, { color: c.fg2 }]}>{t("match.meta")}</Text>
          {!isExpired && (
            <Text style={[type.mono, styles.tabular, { color: c.fg2 }]}>
              {clock(secondsUntil(offer.endsAt, now))}
            </Text>
          )}
        </View>

        {isExpired ? (
          <View style={[styles.expired, { backgroundColor: c.muted }]}>
            <Text style={[type.headline, { color: c.fg2 }]}>{t("match.expired")}</Text>
          </View>
        ) : isAccepted ? (
          <Button title={t("match.waiting")} variant="secondary" fullWidth disabled />
        ) : (
          <Button
            title={t("match.openCompass")}
            variant="glow"
            leadingIcon="compass"
            fullWidth
            onPress={onAccept}
          />
        )}
        {!isExpired && (
          <Button
            title={t("match.dismiss")}
            variant="ghost"
            size="md"
            fullWidth
            disabled={isAccepted}
            onPress={onDismiss}
          />
        )}
        <Text style={[type.footnote, styles.footnote, { color: c.fg2 }]}>
          {isExpired ? t("match.stillSearching") : t("match.unlocks")}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingBottom: space.xl },
  badge: { flex: 1, minHeight: 0, alignItems: "center", overflow: "hidden" },
  actions: { gap: 6 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xs,
    paddingBottom: 10,
  },
  tabular: { fontVariant: ["tabular-nums"] },
  expired: {
    height: PILL_H,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  footnote: { textAlign: "center", paddingTop: 6 },
})
