import { INTERESTS } from "@justmate/protocol"
import * as Haptics from "expo-haptics"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import Animated, { ZoomIn } from "react-native-reanimated"

import { Button, Chip, PulseDot, useScheme } from "@/components/ui"
import { wordLabel } from "@/features/home/categories"
import { api } from "@/lib/api"
import { radius, space } from "@/theme/layout"
import { duration } from "@/theme/motion"

import type { StepProps } from "./flow"
import { Step } from "./Step"

const MIN_PICKS = 3

type Slot = { item: string; isRelated: boolean } | { loading: string }

const LoadingPill = ({ label }: { label: string }) => {
  const { c } = useScheme()

  return (
    <Animated.View
      entering={ZoomIn.duration(duration.snappy)}
      accessibilityLabel={label}
      style={[
        styles.loading,
        { backgroundColor: c.surfaceChip, boxShadow: `inset 0 0 0 1px ${c.separator}` },
      ]}
    >
      {[0, 1, 2].map((k) => (
        <PulseDot key={k} size={5} color={c.fg3} delay={k * 150} />
      ))}
    </Animated.View>
  )
}

export const StepInterests = ({ profile, set, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const [related, setRelated] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState<string[]>([])
  const picked = profile.interests
  const base: readonly string[] = INTERESTS[profile.mode]

  const fetchRelated = async (item: string) => {
    setLoading((l) => [...l, item])
    const have = [...base, ...Object.values(related).flat(), ...picked]
    const reply = await api.related({ item, mode: profile.mode, have }).catch(() => ({ items: [] }))
    setRelated((r) => ({ ...r, [item]: reply.items.slice(0, 3) }))
    setLoading((l) => l.filter((x) => x !== item))
  }

  const toggle = (item: string) => {
    const isOn = !picked.includes(item)
    if (profile.settings.haptics) void Haptics.selectionAsync()
    set({ interests: isOn ? [...picked, item] : picked.filter((x) => x !== item) })
    if (isOn && !related[item] && !loading.includes(item)) void fetchRelated(item)
  }

  const slots: Slot[] = []
  const seen = new Set<string>()
  const walk = (item: string, isRelated: boolean) => {
    if (seen.has(item)) return
    seen.add(item)
    slots.push({ item, isRelated })
    if (!picked.includes(item)) return
    for (const r of related[item] ?? []) walk(r, true)
    if (loading.includes(item)) slots.push({ loading: item })
  }
  for (const item of base) walk(item, false)
  for (const item of picked) walk(item, true)

  const left = Math.max(0, MIN_PICKS - picked.length)

  return (
    <Step
      eyebrow={eyebrow}
      title={t(
        profile.mode === "date"
          ? "onboarding.interests.titleDate"
          : "onboarding.interests.titleMate",
      )}
      sub={t("onboarding.interests.sub")}
      cta={
        <Button
          title={
            left
              ? t("onboarding.interests.ctaLeft", { count: left })
              : t("onboarding.interests.cta")
          }
          fullWidth
          disabled={left > 0}
          onPress={next}
        />
      }
    >
      <View style={styles.chips}>
        {slots.map((slot) =>
          "loading" in slot ? (
            <LoadingPill
              key={`loading-${slot.loading}`}
              label={t("onboarding.interests.loading")}
            />
          ) : (
            <Animated.View
              key={slot.item}
              entering={slot.isRelated ? ZoomIn.duration(duration.default) : undefined}
            >
              <Chip
                label={wordLabel(t, slot.item)}
                selected={picked.includes(slot.item)}
                icon={slot.isRelated && !picked.includes(slot.item) ? "plus" : undefined}
                onPress={() => toggle(slot.item)}
              />
            </Animated.View>
          ),
        )}
      </View>
    </Step>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s, paddingTop: space.xs },
  loading: {
    width: 56,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    borderRadius: radius.pill,
  },
})
