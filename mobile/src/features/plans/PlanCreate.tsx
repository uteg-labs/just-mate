import type { Venue } from "@justmate/protocol"
import type { Dispatch, SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn, SlideInLeft, SlideInRight } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import {
  Button,
  Card,
  Chip,
  FieldLabel,
  Icon,
  IconButton,
  type IconName,
  Segmented,
  StepDots,
  Switch,
  useScheme,
} from "@/components/ui"
import { intentIcon, picksLabel } from "@/features/home/categories"
import { Step } from "@/features/onboarding/Step"
import { toggle } from "@/lib/list"
import { layout, space } from "@/theme/layout"
import { duration } from "@/theme/motion"
import { type } from "@/theme/type"

import { type Draft, PLAN_DAYS, pickedDays, slotTimes, timesFor } from "./draft"
import { MapFrame } from "./parts"
import { capital, dateMono, dayAt, dayChip, dayWord, slotGroups, timeOf } from "./time"

export type CreateStep = "when" | "review"

export type PlanCreateProps = {
  step: CreateStep
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  venues: Venue[]
  onWhere: () => void
  onEditWhat: () => void
  onWhen: () => void
  onSend: () => void
  onBack: () => void
  onExit: () => void
}

const noon = (day: number) => dayAt(day, "12:00").getTime()

const DAYS = Array.from({ length: PLAN_DAYS }, (_, day) => day)

// plan for later, steps 2 (when) and 4 (review); step 3 (where) is its own sheet over the map
export const PlanCreate = ({
  step,
  draft,
  setDraft,
  venues,
  onWhere,
  onEditWhat,
  onWhen,
  onSend,
  onBack,
  onExit,
}: PlanCreateProps) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isWhen = step === "when"
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <View
      style={[
        styles.page,
        { paddingTop: insets.top + space.s, paddingBottom: Math.max(insets.bottom, space.xxl) },
      ]}
    >
      <View style={styles.nav}>
        <IconButton
          icon="arrow-left"
          label={t("plans.create.back")}
          variant="ghost"
          onPress={isWhen ? onBack : onWhere}
        />
        <StepDots count={4} active={isWhen ? 1 : 3} />
        <IconButton icon="x" label={t("plans.create.close")} variant="ghost" onPress={onExit} />
      </View>
      <Animated.View
        key={step}
        entering={(isWhen ? SlideInLeft : SlideInRight).duration(duration.default)}
        style={styles.body}
      >
        {isWhen ? (
          <When draft={draft} set={set} onNext={onWhere} />
        ) : (
          <Review
            draft={draft}
            set={set}
            venues={venues}
            onWhat={onEditWhat}
            onWhen={onWhen}
            onWhere={onWhere}
            onSend={onSend}
          />
        )}
      </Animated.View>
    </View>
  )
}

type WhenProps = { draft: Draft; set: (patch: Partial<Draft>) => void; onNext: () => void }

const When = ({ draft, set, onNext }: WhenProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const days = pickedDays(draft)
  const total = slotTimes(draft).length
  const first = days[0] === undefined ? [] : (draft.slots[days[0]] ?? [])
  const fitted = (day: number) => first.filter((time) => timesFor(day).includes(time))
  const canCopy =
    days.length > 1 &&
    first.length > 0 &&
    days.some((d) => draft.slots[d]?.join() !== fitted(d).join())

  // a new day starts with the last day's times, so picking a week is one tap a day
  const toggleDay = (day: number) => {
    const { [day]: removed, ...rest } = draft.slots
    if (removed) return set({ slots: rest })
    const last = days.at(-1)
    const carried = last === undefined ? [] : (draft.slots[last] ?? [])
    set({
      slots: { ...draft.slots, [day]: carried.filter((time) => timesFor(day).includes(time)) },
    })
  }
  const toggleTime = (day: number, time: string) =>
    set({ slots: { ...draft.slots, [day]: toggle(draft.slots[day] ?? [], time).toSorted() } })
  const sameForAll = () => set({ slots: Object.fromEntries(days.map((d) => [d, fitted(d)])) })

  return (
    <Step
      eyebrow={t("plans.create.eyebrow", { n: 2 })}
      title={t("plans.when.title")}
      sub={t("plans.when.sub")}
      cta={
        <Button
          title={total ? t("plans.when.next", { count: total }) : t("plans.when.pick")}
          fullWidth
          disabled={!total}
          onPress={onNext}
        />
      }
    >
      <View style={styles.group}>
        <FieldLabel right={days.length ? t("plans.when.picked", { n: days.length }) : undefined}>
          {t("plans.when.days")}
        </FieldLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.strip}
          contentContainerStyle={styles.stripContent}
        >
          {DAYS.map((day) => (
            <Chip
              key={day}
              label={dayChip(t, noon(day))}
              selected={day in draft.slots}
              icon={day in draft.slots ? "check" : undefined}
              onPress={() => toggleDay(day)}
            />
          ))}
        </ScrollView>
      </View>

      {!days.length && (
        <View style={[styles.hint, { backgroundColor: c.surfaceChip }]}>
          <Text style={[type.footnote, styles.center, { color: c.fg2 }]}>
            {t("plans.when.empty")}
          </Text>
        </View>
      )}

      {days.map((day) => {
        const picked = draft.slots[day] ?? []
        const times = timesFor(day)
        return (
          <Animated.View key={day} entering={FadeIn.duration(duration.default)}>
            <Card level={2} padding={14} style={styles.day}>
              <View style={styles.dayHead}>
                <View style={styles.dayName}>
                  <Text style={[type.headline, { color: c.fg1 }]}>
                    {capital(dayWord(t, noon(day)))}
                  </Text>
                  <Text style={[type.mono, { color: c.fg2 }]}>{dateMono(noon(day))}</Text>
                </View>
                <View style={styles.dayRight}>
                  <Text
                    style={[type.mono, styles.tabular, { color: picked.length ? c.fg1 : c.fg3 }]}
                  >
                    {picked.length
                      ? t("plans.when.times", { count: picked.length })
                      : t("plans.when.pickTimes")}
                  </Text>
                  <IconButton
                    icon="x"
                    label={t("plans.when.remove", { day: dayWord(t, noon(day)) })}
                    variant="ghost"
                    size={32}
                    onPress={() => toggleDay(day)}
                  />
                </View>
              </View>
              <View style={styles.times}>
                {times.length ? (
                  times.map((time) => (
                    <Chip
                      key={time}
                      size="sm"
                      label={time}
                      selected={picked.includes(time)}
                      onPress={() => toggleTime(day, time)}
                    />
                  ))
                ) : (
                  <Text style={[type.footnote, { color: c.fg2 }]}>{t("plans.when.tooLate")}</Text>
                )}
              </View>
            </Card>
          </Animated.View>
        )
      })}

      {canCopy && days[0] !== undefined && (
        <Button
          title={t("plans.when.same", { day: dayWord(t, noon(days[0])) })}
          variant="ghost"
          size="sm"
          leadingIcon="shuffle"
          onPress={sameForAll}
        />
      )}

      <Card level={2} padding={0} style={styles.flex}>
        <View style={styles.grow}>
          <Text style={[type.body, { color: c.fg1 }]}>{t("plans.when.flex")}</Text>
          <Text style={[type.footnote, { color: c.fg2 }]}>{t("plans.when.flexSub")}</Text>
        </View>
        <Switch
          checked={draft.flex}
          label={t("plans.when.flex")}
          onToggle={() => set({ flex: !draft.flex })}
        />
      </Card>
    </Step>
  )
}

type ReviewProps = {
  draft: Draft
  set: (patch: Partial<Draft>) => void
  venues: Venue[]
  onWhat: () => void
  onWhen: () => void
  onWhere: () => void
  onSend: () => void
}

type RowProps = {
  icon: IconName
  label: string
  value: string
  lines?: string[]
  last?: boolean
  onPress: () => void
}

const ReviewRow = ({ icon, label, value, lines, last, onPress }: RowProps) => {
  const { c } = useScheme()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.review, pressed && { backgroundColor: c.active }]}
    >
      <Icon name={icon} size={20} color={c.fg2} />
      <Text style={[type.mono, styles.reviewLabel, { color: c.fg2 }]}>{label}</Text>
      <View style={styles.grow}>
        <Text numberOfLines={1} style={[type.body, { color: c.fg1 }]}>
          {value}
        </Text>
        {lines?.map((line) => (
          <Text key={line} style={[type.footnote, styles.tabular, { color: c.fg2 }]}>
            {line}
          </Text>
        ))}
      </View>
      <Icon name="pencil" size={15} strokeWidth={1.75} color={c.fg3} />
      {!last && <View style={[styles.rule, { backgroundColor: c.separator }]} />}
    </Pressable>
  )
}

const Review = ({ draft, set, venues, onWhat, onWhen, onWhere, onSend }: ReviewProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const venue = venues.find((v) => v.id === draft.venueId)
  const slots = slotTimes(draft)
  const groups = slotGroups(slots)
  const [only] = slots
  const when =
    slots.length === 1 && only !== undefined
      ? `${capital(dayWord(t, only))} ${timeOf(only)}`
      : t("plans.review.many", { count: slots.length, days: groups.length })

  return (
    <Step
      eyebrow={t("plans.create.eyebrow", { n: 4 })}
      title={t("plans.review.title")}
      sub={t("plans.review.sub")}
      cta={
        <Button
          title={t("plans.review.send")}
          leadingIcon="send"
          fullWidth
          disabled={!venue || !slots.length}
          onPress={onSend}
        />
      }
    >
      <Card level={2} padding={0} style={styles.clip}>
        {venue && (
          <View style={styles.mapInset}>
            <MapFrame venue={venue} height={110} r={16} />
          </View>
        )}
        <ReviewRow
          icon={intentIcon(draft.mode, draft.category, draft.intents[0] ?? "")}
          label={t("plans.review.what")}
          value={`${picksLabel(t, draft.intents)} · ${t(`modes.${draft.mode}`).toLowerCase()}`}
          onPress={onWhat}
        />
        <ReviewRow
          icon="clock"
          label={t("plans.review.when")}
          value={draft.flex ? `${when} ${t("plans.review.flex")}` : when}
          lines={
            slots.length > 1
              ? groups.map((g) => `${dayChip(t, g.day)} · ${g.times.map(timeOf).join(", ")}`)
              : undefined
          }
          onPress={onWhen}
        />
        <ReviewRow
          icon="map-pin"
          label={t("plans.review.where")}
          value={venue?.name ?? t("plans.where.pick")}
          last
          onPress={onWhere}
        />
      </Card>

      <View style={styles.group}>
        <FieldLabel>{t("plans.review.until")}</FieldLabel>
        <Segmented
          items={[
            { value: "2h", label: t("plans.until.2h") },
            { value: "day", label: t("plans.until.day") },
          ]}
          value={draft.until}
          onChange={(until) => set({ until })}
        />
      </View>

      <View style={styles.promises}>
        {(["users", "circle-check", "eye-off"] as const).map((icon, i) => (
          <View key={icon} style={styles.promise}>
            <Icon name={icon} size={16} strokeWidth={1.75} color={c.fg2} />
            <Text style={[type.footnote, styles.grow, { color: c.fg1 }]}>
              {t(`plans.review.promises.${i}`)}
            </Text>
          </View>
        ))}
      </View>
    </Step>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: layout.gutter },
  nav: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  body: { flex: 1, minHeight: 0 },
  group: { gap: space.s },
  strip: { marginHorizontal: -layout.gutter, flexGrow: 0 },
  stripContent: { paddingHorizontal: layout.gutter, paddingVertical: 2, gap: space.s },
  hint: { paddingVertical: 18, paddingHorizontal: space.l, borderRadius: 20 },
  center: { textAlign: "center" },
  day: { gap: 10 },
  dayHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginRight: -6,
  },
  dayName: { flexDirection: "row", alignItems: "baseline", gap: space.s },
  dayRight: { flexDirection: "row", alignItems: "center", gap: space.xs },
  tabular: { fontVariant: ["tabular-nums"] },
  times: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    paddingVertical: space.m,
    paddingHorizontal: space.l,
  },
  grow: { flex: 1, minWidth: 0 },
  clip: { overflow: "hidden" },
  mapInset: { margin: space.s },
  review: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    paddingVertical: 6,
    paddingHorizontal: space.l,
  },
  reviewLabel: { width: 52 },
  rule: { position: "absolute", left: 48, right: 0, bottom: 0, height: 1 },
  promises: { gap: 10, paddingHorizontal: space.xs, paddingTop: space.xs },
  promise: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
})
