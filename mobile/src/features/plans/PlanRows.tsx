import type { Venue } from "@justmate/protocol"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { BadgeSwatch } from "@/components/surface/BadgeSwatch"
import { badgeDesignFromHash } from "@/components/surface/badgeDesign"
import { Badge, Icon, useScheme } from "@/components/ui"
import { intentIcon } from "@/features/home/categories"
import type { LivePlan } from "@/lib/store"
import { venueIcon } from "@/lib/venues"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { IconDisc, MapFrame, planTitle, TapCard } from "./parts"
import { timeOf } from "./time"

export type PlanRowProps = { plan: LivePlan; venue?: Venue; onPress: () => void }

// waiting on you: a proposal, or an invitation someone offered you
export function isPick(plan: LivePlan): boolean {
  if (plan.kind === "proposal") return plan.state === "proposed"
  return !plan.mine && plan.state === "offered"
}

const Swatch = ({ plan }: { plan: LivePlan }) => {
  if (!plan.partner) return <IconDisc icon="sparkles" />
  const design = badgeDesignFromHash(plan.partner.badgeSeed, {
    interests: plan.partner.interests,
    hasAnswers: true,
    mode: plan.mode,
  })
  return <BadgeSwatch colors={design.colors} blobs={design.blobs} width={40} height={55} r={9} />
}

type LinesProps = { eyebrow?: string; title: string; sub: string; tone?: string }

const Lines = ({ eyebrow, title, sub, tone }: LinesProps) => {
  const { c } = useScheme()

  return (
    <View style={styles.lines}>
      {!!eyebrow && <Text style={[type.mono, { color: tone ?? c.fg2 }]}>{eyebrow}</Text>}
      <Text style={[type.headline, { color: c.fg1 }]}>{title}</Text>
      <Text numberOfLines={1} style={[type.footnote, { color: c.fg2 }]}>
        {sub}
      </Text>
    </View>
  )
}

export const PlanRow = ({ plan, venue, onPress }: PlanRowProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const title = planTitle(t, plan)
  const place = venue?.name ?? ""

  if (isPick(plan)) {
    return (
      <TapCard onPress={onPress} label={title} style={styles.row}>
        <Swatch plan={plan} />
        <Lines
          eyebrow={t(plan.kind === "proposal" ? "plans.row.proposal" : "plans.row.offered", {
            mode: t(`modes.${plan.mode}`).toLowerCase(),
          })}
          title={title}
          sub={t("plans.row.halfway", { place })}
        />
        <Icon name="chevron-right" size={16} strokeWidth={2} color={c.fg3} />
      </TapCard>
    )
  }

  if (plan.state === "confirmed") {
    return (
      <TapCard onPress={onPress} label={title} style={styles.row}>
        <IconDisc icon={venue ? venueIcon(venue.kind) : "calendar-check"} />
        <Lines eyebrow={t("plans.confirmed")} tone={c.success} title={title} sub={place} />
        <Icon name="chevron-right" size={16} strokeWidth={2} color={c.fg3} />
      </TapCard>
    )
  }

  const isTaken = plan.state === "taken"
  const status = plan.mine ? (isTaken ? "someonesIn" : "open") : "waiting"
  return (
    <TapCard onPress={onPress} label={title} style={styles.row}>
      <IconDisc
        icon={intentIcon(plan.mode, plan.category, plan.intents[0] ?? "")}
        solid={isTaken && plan.mine}
      />
      <Lines title={title} sub={place} />
      <View>
        <Badge
          label={t(`plans.status.${status}`)}
          color={status === "someonesIn" ? "glow" : "gray"}
          variant="dot"
          size="sm"
        />
      </View>
      <Icon name="chevron-right" size={16} strokeWidth={2} color={c.fg3} />
    </TapCard>
  )
}

export const UpcomingCard = ({
  plan,
  venue,
  onPress,
  leadMs,
}: PlanRowProps & { leadMs: number }) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const title = planTitle(t, plan)
  const opens = timeOf(Date.parse(plan.startsAt) - leadMs)

  return (
    <TapCard onPress={onPress} label={title} level={3} style={styles.upcoming}>
      {venue ? (
        <MapFrame venue={venue} height={104} r={16} />
      ) : (
        <View style={[styles.noMap, { backgroundColor: c.surfaceChip }]} />
      )}
      <View style={styles.upcomingText}>
        <View style={styles.eyebrow}>
          <Icon name="circle-check" size={13} strokeWidth={2} color={c.success} />
          <Text style={[type.mono, { color: c.success }]}>
            {t("plans.confirmedMode", { mode: t(`modes.${plan.mode}`).toLowerCase() })}
          </Text>
        </View>
        <Text style={[type.headline, { color: c.fg1 }]}>{title}</Text>
        <View style={styles.between}>
          <Text numberOfLines={1} style={[type.footnote, styles.shrink, { color: c.fg2 }]}>
            {venue?.name}
          </Text>
          <Text style={[type.mono, styles.tabular, { color: c.fg2 }]}>
            {t("plans.compassAt", { time: opens })}
          </Text>
        </View>
      </View>
    </TapCard>
  )
}

export type PlaceCardProps = { venue: Venue; reason: string; walk?: number; onPress: () => void }

// a venue to start a plan at; an icon, not a map, so a strip of them stays cheap
export const PlaceCard = ({ venue, reason, walk, onPress }: PlaceCardProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()

  return (
    <TapCard onPress={onPress} label={venue.name} style={styles.place}>
      <View style={[styles.placeArt, { backgroundColor: c.mapBg }]}>
        <IconDisc icon={venueIcon(venue.kind)} size={48} solid />
      </View>
      <View style={styles.placeText}>
        <Text style={[type.headline, { color: c.fg1 }]}>{venue.name}</Text>
        <Text numberOfLines={1} style={[type.footnote, { color: c.fg2 }]}>
          {walk ? `${reason} · ${t("plans.min", { n: walk })}` : reason}
        </Text>
      </View>
    </TapCard>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingLeft: space.l,
    paddingRight: 14,
  },
  lines: { flex: 1, minWidth: 0, gap: 3 },
  upcoming: { padding: space.s, borderRadius: radius.card },
  noMap: { height: 64, borderRadius: 16 },
  upcomingText: { paddingTop: space.m, paddingHorizontal: 10, paddingBottom: space.s, gap: 4 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 6 },
  between: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  shrink: { flexShrink: 1 },
  tabular: { fontVariant: ["tabular-nums"] },
  place: { width: 208, padding: 6 },
  placeArt: { height: 92, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  placeText: { paddingTop: 10, paddingHorizontal: space.s, paddingBottom: 6, gap: 2 },
})
