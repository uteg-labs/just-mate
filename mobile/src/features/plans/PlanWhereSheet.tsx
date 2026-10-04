import type { LatLng, Venue } from "@justmate/protocol"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import { Button, Card, Icon, IconButton, StepDots, TextField, useScheme } from "@/components/ui"
import { venueIcon, walkMin } from "@/lib/venues"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { IconDisc, venueHours, venueMeta } from "./parts"

export type PlanWhereSheetProps = {
  venues: Venue[]
  intents: string[]
  here?: LatLng
  venueId: string | null
  onPick: (id: string) => void
  onBack: () => void
  onNext: () => void
  onExit: () => void
}

// the map above this sheet shows the same venues: a tap there or a row here picks one
const SHEET_SHARE = 0.6

type RowProps = {
  venue: Venue
  walk?: number
  selected: boolean
  last: boolean
  onPress: () => void
}

const VenueRow = ({ venue, walk, selected, last, onPress }: RowProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={venue.name}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.hover }]}
    >
      <IconDisc icon={venueIcon(venue.kind)} solid={selected} />
      <View style={styles.grow}>
        <Text style={[type.headline, { color: c.fg1 }]}>{venue.name}</Text>
        <Text numberOfLines={1} style={[type.footnote, { color: c.fg2 }]}>
          {`${venueMeta(t, venue, walk)} · ${venueHours(t, venue)}`}
        </Text>
      </View>
      <View
        style={[
          styles.check,
          selected ? { backgroundColor: c.fg1 } : { boxShadow: `inset 0 0 0 1.5px ${c.border}` },
        ]}
      >
        {selected && <Icon name="check" size={14} strokeWidth={2.5} color={c.background} />}
      </View>
      {!last && <View style={[styles.rule, { backgroundColor: c.separator }]} />}
    </Pressable>
  )
}

export const PlanWhereSheet = ({
  venues,
  intents,
  here,
  venueId,
  onPick,
  onBack,
  onNext,
  onExit,
}: PlanWhereSheetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const { height } = useWindowDimensions()
  const [query, setQuery] = useState("")
  const chosen = venues.find((v) => v.id === venueId)
  const walkOf = (v: Venue) => (here ? walkMin(here, v) : undefined)
  const fits = (v: Venue) => Number(v.fits.some((f) => intents.includes(f)))

  const needle = query.trim().toLowerCase()
  const rows = venues
    .filter((v) => `${v.name} ${t(`plans.kinds.${v.kind}`)}`.toLowerCase().includes(needle))
    .sort((a, b) => fits(b) - fits(a) || (walkOf(a) ?? 0) - (walkOf(b) ?? 0))

  return (
    <View style={[styles.sheet, { height: Math.round(height * SHEET_SHARE) }]}>
      <View style={styles.nav}>
        <IconButton
          icon="arrow-left"
          label={t("plans.create.back")}
          variant="ghost"
          size={40}
          onPress={onBack}
        />
        <StepDots count={4} active={2} />
        <IconButton
          icon="x"
          label={t("plans.create.close")}
          variant="ghost"
          size={40}
          onPress={onExit}
        />
      </View>
      <View style={styles.head}>
        <Text style={[type.mono, { color: c.fg2 }]}>{t("plans.create.eyebrow", { n: 3 })}</Text>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
            {t("plans.where.title")}
          </Text>
          <Text style={[type.footnote, { color: c.fg2 }]}>{t("plans.where.hint")}</Text>
        </View>
      </View>
      <TextField
        label={t("plans.where.search")}
        value={query}
        onChangeText={setQuery}
        placeholder={t("plans.where.placeholder")}
      />
      <Card level={2} padding={0} style={styles.list}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {rows.length ? (
            rows.map((v, i) => (
              <VenueRow
                key={v.id}
                venue={v}
                walk={walkOf(v)}
                selected={v.id === venueId}
                last={i === rows.length - 1}
                onPress={() => onPick(v.id)}
              />
            ))
          ) : (
            <Text style={[type.footnote, styles.none, { color: c.fg2 }]}>
              {t("plans.where.none", { query })}
            </Text>
          )}
        </ScrollView>
      </Card>
      <Button
        title={chosen ? t("plans.where.next", { place: chosen.name }) : t("plans.where.pick")}
        fullWidth
        disabled={!chosen}
        onPress={onNext}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: space.l, paddingBottom: space.xl, gap: space.m },
  nav: {
    height: 40,
    marginTop: space.s,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  head: { gap: space.xs, paddingHorizontal: 2 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.s,
  },
  list: { flex: 1, minHeight: 0, overflow: "hidden" },
  row: {
    minHeight: 64,
    paddingVertical: space.s,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
  },
  grow: { flex: 1, minWidth: 0 },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  rule: { position: "absolute", left: 66, right: 0, bottom: 0, height: 1 },
  none: { padding: 18, textAlign: "center" },
})
