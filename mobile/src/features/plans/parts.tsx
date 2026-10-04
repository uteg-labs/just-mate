import type { Venue } from "@justmate/protocol"
import type { TFunction } from "i18next"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native"

import { AnimatedPressable, Icon, type IconName, usePress, useScheme } from "@/components/ui"
import { VenueMap } from "@/components/ZoneMap"
import { picksLabel } from "@/features/home/categories"
import type { LivePlan } from "@/lib/store"
import { radius, space } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { type } from "@/theme/type"

import { capital, dayWord, timeOf } from "./time"

// "Wine, Thursday 19:30 +2"
export function planTitle(t: TFunction, plan: LivePlan): string {
  const ms = Date.parse(plan.startsAt)
  const more = plan.mine && plan.state === "open" ? (plan.slots?.length ?? 1) - 1 : 0
  const title = `${capital(picksLabel(t, plan.intents))}, ${dayWord(t, ms)} ${timeOf(ms)}`
  return more > 0 ? `${title} +${more}` : title
}

// "board-game café · 7 min walk"
export function venueMeta(t: TFunction, venue: Venue, walk?: number): string {
  return [t(`plans.kinds.${venue.kind}`), walk ? t("plans.walk", { n: walk }) : undefined]
    .filter(Boolean)
    .join(" · ")
}

export function venueHours(t: TFunction, venue: Venue): string {
  return venue.closes ? t("plans.openTill", { time: venue.closes }) : t("plans.alwaysOpen")
}

export type VenueLineProps = { venue: Venue; walk?: number }

// "board-game café · [star] 4.8 · 7 min walk · open till 23:00"
export const VenueLine = ({ venue, walk }: VenueLineProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()

  return (
    <Text numberOfLines={1} style={[type.footnote, { color: c.fg2 }]}>
      {t(`plans.kinds.${venue.kind}`)}
      {!!venue.rating && (
        <>
          {" · "}
          <Icon name="star" size={12} color={c.fg2} /> {venue.rating}
        </>
      )}
      {walk ? ` · ${t("plans.walk", { n: walk })}` : ""}
      {` · ${venueHours(t, venue)}`}
    </Text>
  )
}

export type SectionProps = { label: string; right?: ReactNode; children: ReactNode }

export const Section = ({ label, right, children }: SectionProps) => {
  const { c } = useScheme()

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[type.mono, { color: c.fg2 }]}>{label}</Text>
        {typeof right === "string" ? (
          <Text style={[type.mono, { color: c.fg3 }]}>{right}</Text>
        ) : (
          right
        )}
      </View>
      {children}
    </View>
  )
}

export const Empty = ({ text }: { text: string }) => {
  const { c } = useScheme()

  return (
    <View style={[styles.empty, { backgroundColor: c.surfaceChip }]}>
      <Text style={[type.footnote, styles.center, { color: c.fg2 }]}>{text}</Text>
    </View>
  )
}

export type IconDiscProps = { icon: IconName; size?: number; solid?: boolean }

export const IconDisc = ({ icon, size = 40, solid }: IconDiscProps) => {
  const { c } = useScheme()

  return (
    <View
      style={[
        styles.disc,
        { width: size, height: size, backgroundColor: solid ? c.fg1 : c.surfaceChip },
      ]}
    >
      <Icon
        name={icon}
        size={Math.round(size * 0.45)}
        strokeWidth={1.75}
        color={solid ? c.background : c.fg1}
      />
    </View>
  )
}

export type TapCardProps = {
  onPress: () => void
  label: string
  level?: 2 | 3
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

// a whole card is the button: press scale plus the active tint
export const TapCard = ({ onPress, label, level = 2, style, children }: TapCardProps) => {
  const { c, shadow } = useScheme()
  const { pressed, style: pressStyle, handlers } = usePress(pressScale.row)

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.card,
        { backgroundColor: pressed ? c.surfaceRaised : c.surfaceCard, boxShadow: shadow[level] },
        style,
        pressStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  )
}

export type MapFrameProps = { venue: Venue; height: number; r?: number }

export const MapFrame = ({ venue, height, r = radius.row - 4 }: MapFrameProps) => {
  const { c } = useScheme()

  return (
    <View style={[styles.map, { height, borderRadius: r, backgroundColor: c.mapBg }]}>
      <VenueMap venue={venue} />
    </View>
  )
}

export type InfoRowProps = { icon: IconName; label: string; value: string; last?: boolean }

export const InfoRow = ({ icon, label, value, last }: InfoRowProps) => {
  const { c } = useScheme()

  return (
    <View style={styles.info}>
      <Icon name={icon} size={18} color={c.fg2} />
      <Text style={[type.body, styles.grow, { color: c.fg1 }]}>{label}</Text>
      <Text style={[type.mono, styles.tabular, { color: c.fg2 }]}>{value}</Text>
      {!last && <View style={[styles.rule, { backgroundColor: c.separator }]} />}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: space.s },
  sectionHead: {
    minHeight: 22,
    paddingHorizontal: space.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  empty: { paddingVertical: 18, paddingHorizontal: space.l, borderRadius: radius.row },
  center: { textAlign: "center" },
  disc: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: radius.row, borderCurve: "continuous" },
  map: { overflow: "hidden" },
  info: {
    minHeight: 48,
    paddingHorizontal: space.l,
    paddingVertical: space.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
  },
  grow: { flex: 1 },
  tabular: { fontVariant: ["tabular-nums"] },
  rule: { position: "absolute", left: 46, right: 0, bottom: 0, height: 1 },
})
