import type { Venue } from "@justmate/protocol"
import type { TFunction } from "i18next"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { badgeDesignFromHash } from "@/components/surface/badgeDesign"
import { VibeBadge } from "@/components/surface/VibeBadge"
import { Button, Card, Chip, Icon, IconButton, useScheme } from "@/components/ui"
import { intentIcon, picksLabel } from "@/features/home/categories"
import { type Pronoun, tagOf } from "@/features/home/MatchCard"
import { useNow } from "@/features/home/useNow"
import { useLastPosition } from "@/lib/location"
import type { LivePlan } from "@/lib/store"
import { venueIcon, walkMin } from "@/lib/venues"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { MapFrame, VenueLine } from "./parts"
import { capital, dateMono, dayWord, timeOf } from "./time"

export type PlanOfferCardProps = {
  plan: LivePlan
  venues: Venue[]
  pronoun: Pronoun
  onAccept: (venueId?: string) => void
  onPass: () => void
  onLater: () => void
  onDone: () => void
}

const BADGE_W = 214
const STRAP = 28
const PILL_H = 52
const BOTH_IN_MS = 1100
const MIN_MS = 60_000
const HOUR_MS = 60 * MIN_MS

function leftLabel(t: TFunction, ms: number) {
  if (ms >= HOUR_MS) return t("plans.offer.hours", { n: Math.round(ms / HOUR_MS) })
  return t("plans.offer.minutes", { n: Math.max(1, Math.ceil(ms / MIN_MS)) })
}

// an ink card from the island, like a match: a proposal, an invitation offered to you,
// or someone taking yours
export const PlanOfferCard = ({
  plan,
  venues,
  pronoun,
  onAccept,
  onPass,
  onLater,
  onDone,
}: PlanOfferCardProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const here = useLastPosition()
  const now = useNow()
  const [venueId, setVenueId] = useState(plan.venueId)

  const isTaker = plan.mine
  const isBothIn = plan.state === "confirmed"
  const isWaiting = !isBothIn && (plan.accepted || (!plan.mine && plan.state === "taken"))
  const isBusy = isWaiting || isBothIn
  const isSwapped = venueId !== plan.venueId
  const venue = venues.find((v) => v.id === venueId)
  const choices = plan.kind === "proposal" ? [plan.venueId, ...(plan.alts ?? [])] : []
  const ms = Date.parse(plan.startsAt)
  const partner = plan.partner

  useEffect(() => {
    if (!isBothIn) return
    const timer = setTimeout(onDone, BOTH_IN_MS)
    return () => clearTimeout(timer)
  }, [isBothIn, onDone])

  const myWalk = venue && here ? walkMin(here, venue) : undefined
  const walks = venue && !isTaker ? bothWalks(t, venue, myWalk, plan) : undefined
  const action = isTaker
    ? t("plans.offer.confirm")
    : isSwapped
      ? t("plans.offer.suggest")
      : t("plans.offer.accept")
  const footnote = isTaker
    ? t("plans.offer.takerNote")
    : isSwapped
      ? t("plans.offer.suggestNote")
      : t("plans.offer.acceptNote")

  return (
    <View style={[styles.card, { height: height - insets.top - space.s }]}>
      <IconButton
        icon="x"
        label={t("plans.offer.later")}
        variant="ghost"
        size={40}
        disabled={isBusy}
        onPress={onLater}
        style={styles.close}
      />
      <View style={styles.badge}>
        {partner && (
          <VibeBadge
            design={badgeDesignFromHash(partner.badgeSeed, {
              interests: partner.interests,
              hasAnswers: true,
              mode: plan.mode,
            })}
            width={BADGE_W}
            strap={STRAP}
            fadeStrap={false}
            eyebrow={t(`match.vibe.${pronoun}`)}
            quote={partner.vibe}
            tag={tagOf(t, partner, plan.mode)}
            turnKey={plan.id}
          />
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.meta}>
          <Text style={[type.mono, { color: c.fg2 }]}>
            {isTaker
              ? t("plans.offer.someonesIn")
              : t("plans.offer.forYou", { mode: t(`modes.${plan.mode}`).toLowerCase() })}
          </Text>
          {plan.expiresAt && !isBusy && (
            <Text style={[type.mono, { color: c.fg2 }]}>
              {t("plans.offer.expires", { left: leftLabel(t, plan.expiresAt - now) })}
            </Text>
          )}
        </View>

        <Card level={3} padding={0} style={styles.plan}>
          <View style={styles.when}>
            <View>
              <Text style={[type.mono, { color: c.fg2 }]}>{dateMono(ms)}</Text>
              <Text style={[type.title, styles.tabular, { color: c.fg1 }]}>
                {`${capital(dayWord(t, ms))}, ${timeOf(ms)}`}
              </Text>
            </View>
            <View style={[styles.intent, { backgroundColor: c.tint }]}>
              <Icon
                name={intentIcon(plan.mode, plan.category, plan.intents[0] ?? "")}
                size={15}
                strokeWidth={2}
              />
              <Text style={[type.labelSm, { color: c.fg1 }]}>{picksLabel(t, plan.intents)}</Text>
            </View>
          </View>
          {venue && (
            <View style={styles.mapInset}>
              <MapFrame venue={venue} height={104} r={16} />
            </View>
          )}
          <View style={styles.where}>
            <Text style={[type.headline, { color: c.fg1 }]}>
              {venue?.name ?? t("plans.offer.halfway")}
            </Text>
            {walks ? (
              <Text style={[type.footnote, { color: c.fg2 }]}>{walks}</Text>
            ) : (
              venue && <VenueLine venue={venue} walk={myWalk} />
            )}
          </View>
        </Card>

        {choices.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipStrip}
            contentContainerStyle={styles.chips}
          >
            {choices.map((id) => {
              const choice = venues.find((v) => v.id === id)
              return (
                choice && (
                  <Chip
                    key={id}
                    size="sm"
                    icon={venueIcon(choice.kind)}
                    label={choice.name}
                    selected={venueId === id}
                    disabled={isBusy}
                    onPress={() => setVenueId(id)}
                  />
                )
              )
            })}
          </ScrollView>
        )}

        <View style={styles.buttons}>
          {isBothIn ? (
            <View style={[styles.bothIn, { backgroundColor: c.tint }]}>
              <Icon name="circle-check" size={18} strokeWidth={2} color={c.success} />
              <Text style={[type.headline, { color: c.success }]}>{t("plans.offer.bothIn")}</Text>
            </View>
          ) : isWaiting ? (
            <Button title={t("match.waiting")} variant="secondary" fullWidth disabled />
          ) : (
            <Button
              title={action}
              variant="glow"
              leadingIcon="calendar-check"
              fullWidth
              onPress={() => onAccept(isSwapped ? venueId : undefined)}
            />
          )}
          <Button
            title={t("plans.offer.pass")}
            variant="ghost"
            size="md"
            fullWidth
            disabled={isBusy}
            onPress={onPass}
          />
          <Text style={[type.footnote, styles.center, { color: c.fg2 }]}>{footnote}</Text>
        </View>
      </View>
    </View>
  )
}

// "café · 9 min for you, 7 for them": their walk is known only for the venue the server sent
function bothWalks(t: TFunction, venue: Venue, mine: number | undefined, plan: LivePlan) {
  const theirs = venue.id === plan.venueId ? plan.partnerWalkMin : undefined
  if (!mine || !theirs) return
  return t("plans.offer.walks", { kind: t(`plans.kinds.${venue.kind}`), mine, theirs })
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingBottom: 22 },
  close: { position: "absolute", top: 14, right: 14, zIndex: 3 },
  badge: { flex: 1, minHeight: 0, alignItems: "center", overflow: "hidden" },
  actions: { gap: 10 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xs,
  },
  plan: { overflow: "hidden" },
  when: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingHorizontal: space.l,
    paddingBottom: space.m,
  },
  tabular: { fontVariant: ["tabular-nums"], marginTop: 2 },
  intent: {
    height: 32,
    paddingLeft: 10,
    paddingRight: space.m,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapInset: { marginHorizontal: space.s },
  where: { paddingTop: space.m, paddingHorizontal: space.l, paddingBottom: 14, gap: 2 },
  chipStrip: { marginHorizontal: -20, flexGrow: 0 },
  chips: { paddingHorizontal: 20, gap: 6 },
  buttons: { gap: space.xs, paddingTop: space.xs },
  bothIn: {
    height: PILL_H,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s,
  },
  center: { textAlign: "center", paddingTop: 2 },
})
