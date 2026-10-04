import type { LatLng, Mode, Venue } from "@justmate/protocol"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CategoryBento } from "@/components/surface/CategoryBento"
import { MorphHeadline } from "@/components/surface/MorphHeadline"
import { Button, IconButton, Segmented, useScheme } from "@/components/ui"
import { isPick, PlaceCard, PlanRow } from "@/features/plans/PlanRows"
import { byStart } from "@/features/plans/PlansPage"
import { Empty, Section } from "@/features/plans/parts"
import type { LivePlan, Note } from "@/lib/store"
import { walkMin } from "@/lib/venues"
import { space } from "@/theme/layout"
import { duration } from "@/theme/motion"
import { type } from "@/theme/type"

import { bentoCategories, picksLabel, wordLabel } from "./categories"

export type SelectSheetProps = {
  mode: Mode
  category: string | null
  picks: string[]
  note?: Note
  autoStopMin: number
  plans: LivePlan[]
  venues: Venue[]
  interests: string[]
  here?: LatLng
  isPlanning: boolean
  onMode: (mode: Mode) => void
  onCategory: (id: string | null) => void
  onPicks: (picks: string[]) => void
  onFind: () => void
  onPlanning: (on: boolean, venueId?: string) => void
  onPlan: () => void
  onOpenPlan: (plan: LivePlan) => void
  onAllPlans: () => void
}

const ROWS_SHOWN = 3
const SHARE = { closed: 0.57, open: 0.76 }
const PLANNING_GAP = 50

// your plans, in the order they need you: picks, someone's in, confirmed by date, then the rest
function inOrder(plans: LivePlan[]): LivePlan[] {
  const isTakenMine = (p: LivePlan) => p.mine && p.state === "taken"
  return [
    ...plans.filter(isPick),
    ...plans.filter(isTakenMine),
    ...plans.filter((p) => p.state === "confirmed").sort(byStart),
    ...plans.filter((p) => !isPick(p) && !isTakenMine(p) && p.state !== "confirmed"),
  ]
}

export const SelectSheet = ({
  mode,
  category,
  picks,
  note,
  autoStopMin,
  plans,
  venues,
  interests,
  here,
  isPlanning,
  onMode,
  onCategory,
  onPicks,
  onFind,
  onPlanning,
  onPlan,
  onOpenPlan,
  onAllPlans,
}: SelectSheetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const scroller = useRef<ScrollView>(null)
  const lines = t(`home.headlines.${mode}`, { returnObjects: true }) as string[]
  const footer = note ? t(`home.ended.${note}`, { min: autoStopMin }) : t("home.invisibleNote")

  const ordered = inOrder(plans)
  const fresh = plans.filter((p) => isPick(p) || (p.mine && p.state === "taken")).length
  const venueOf = (p: LivePlan) => venues.find((v) => v.id === p.venueId)
  const sheetH = isPlanning
    ? height - insets.top - PLANNING_GAP
    : Math.round(height * (category ? SHARE.open : SHARE.closed))

  const places = venues
    .filter((v) => v.modes.includes(mode))
    .map((v) => {
      const liked = v.fits.find((f) => interests.includes(f))
      const reason = liked
        ? t("plans.places.youLike", { what: wordLabel(t, liked) })
        : t(`plans.kinds.${v.kind}`)
      return { venue: v, reason, liked: Number(!!liked), walk: here && walkMin(here, v) }
    })
    .sort((a, b) => b.liked - a.liked || (a.walk ?? 0) - (b.walk ?? 0))

  // plan mode starts at "what", wherever the sheet was scrolled
  const planning = (on: boolean, venueId?: string) => {
    scroller.current?.scrollTo({ y: 0, animated: true })
    onPlanning(on, venueId)
  }

  return (
    <View style={{ height: sheetH }}>
      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isPlanning ? (
          <Animated.View
            key="planning"
            entering={FadeIn.duration(duration.snappy)}
            style={styles.planHead}
          >
            <View style={styles.planTitle}>
              <View style={styles.headText}>
                <Text style={[type.mono, { color: c.fg2 }]}>{t("plans.create.step1")}</Text>
                <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
                  {t("plans.create.what")}
                </Text>
              </View>
              <IconButton
                icon="x"
                label={t("plans.create.leave")}
                variant="tint"
                size={40}
                onPress={() => planning(false)}
              />
            </View>
            <Segmented
              items={[
                { value: "mate", label: t("modes.mate"), icon: "users" },
                { value: "date", label: t("modes.date"), icon: "heart" },
              ]}
              value={mode}
              onChange={onMode}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key={`head-${mode}`}
            entering={FadeIn.duration(duration.snappy)}
            style={styles.head}
          >
            <MorphHeadline lines={lines} paused={!!category} />
            <Text style={[type.footnote, { color: c.fg2 }]}>{t(`home.footnote.${mode}`)}</Text>
          </Animated.View>
        )}

        <CategoryBento
          key={`bento-${mode}`}
          categories={bentoCategories(t, mode)}
          selected={category}
          onPick={onCategory}
          picks={picks}
          onPicks={onPicks}
        />

        {!isPlanning && !category && (
          <Text
            accessibilityLiveRegion="polite"
            style={[type.footnote, styles.center, { color: c.fg2 }]}
          >
            {footer}
          </Text>
        )}

        {!isPlanning && (
          <Section
            label={fresh ? t("plans.home.yoursNew", { n: fresh }) : t("plans.home.yours")}
            right={
              <Pressable onPress={onAllPlans} accessibilityRole="link" hitSlop={8}>
                <Text style={[type.mono, { color: c.fg2 }]}>{t("plans.home.seeAll")}</Text>
              </Pressable>
            }
          >
            {ordered.length ? (
              ordered
                .slice(0, ROWS_SHOWN)
                .map((p) => (
                  <PlanRow key={p.id} plan={p} venue={venueOf(p)} onPress={() => onOpenPlan(p)} />
                ))
            ) : (
              <Empty text={t("plans.home.empty")} />
            )}
            {ordered.length > ROWS_SHOWN && (
              <Button
                title={t("plans.home.seeAllN", { n: ordered.length })}
                variant="ghost"
                size="sm"
                onPress={onAllPlans}
              />
            )}
            <Button
              title={t("plans.home.later")}
              variant="secondary"
              leadingIcon="calendar-plus"
              fullWidth
              onPress={() => planning(true)}
            />
          </Section>
        )}

        {!isPlanning && places.length > 0 && (
          <Section label={t("plans.places.title")} right={t("plans.places.from")}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.strip}
              contentContainerStyle={styles.stripContent}
            >
              {places.map(({ venue, reason, walk }) => (
                <PlaceCard
                  key={venue.id}
                  venue={venue}
                  reason={reason}
                  walk={walk}
                  onPress={() => planning(true, venue.id)}
                />
              ))}
            </ScrollView>
          </Section>
        )}
      </ScrollView>

      {(isPlanning || !!category) && (
        <Animated.View entering={FadeIn.duration(duration.default)} style={styles.footer}>
          {isPlanning ? (
            <Button
              title={
                picks.length
                  ? t("plans.create.next", { picks: picksLabel(t, picks) })
                  : t("plans.create.pickWhat")
              }
              leadingIcon="calendar-plus"
              fullWidth
              disabled={!picks.length}
              onPress={onPlan}
            />
          ) : (
            <Button
              title={
                picks.length ? t("home.find", { picks: picksLabel(t, picks) }) : t("home.pickOne")
              }
              leadingIcon="search"
              fullWidth
              disabled={!picks.length}
              onPress={onFind}
            />
          )}
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, gap: 26 },
  head: { gap: 6 },
  headText: { flex: 1, gap: 6 },
  planHead: { gap: 14 },
  planTitle: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.m,
  },
  center: { textAlign: "center", marginTop: -14 },
  strip: { marginHorizontal: -20, flexGrow: 0 },
  stripContent: { paddingHorizontal: 20, paddingTop: space.xs, paddingBottom: space.s, gap: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 22 },
})
