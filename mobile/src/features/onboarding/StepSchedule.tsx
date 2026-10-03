import { HANGOUT_LENGTHS, WHEN_SLOTS, type WhenSlot } from "@justmate/protocol"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button, Chip, FieldLabel, Segmented } from "@/components/ui"
import { space } from "@/theme/layout"

import type { StepProps } from "./flow"
import { Step } from "./Step"

export const StepSchedule = ({ profile, setProfile, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const { when, length } = profile.mate

  const setMate = (patch: Partial<typeof profile.mate>) =>
    setProfile((p) => ({ ...p, mate: { ...p.mate, ...patch } }))
  const toggle = (slot: WhenSlot) =>
    setMate({ when: when.includes(slot) ? when.filter((s) => s !== slot) : [...when, slot] })

  return (
    <Step
      eyebrow={eyebrow}
      title={t("onboarding.schedule.title")}
      sub={t("onboarding.schedule.sub")}
      cta={
        <Button
          title={t(when.length ? "onboarding.schedule.cta" : "onboarding.schedule.ctaEmpty")}
          fullWidth
          disabled={!when.length}
          onPress={next}
        />
      }
    >
      <View style={styles.chips}>
        {WHEN_SLOTS.map((slot) => (
          <Chip
            key={slot}
            label={t(`onboarding.schedule.slots.${slot}`)}
            selected={when.includes(slot)}
            onPress={() => toggle(slot)}
          />
        ))}
      </View>
      <View style={styles.field}>
        <FieldLabel>{t("onboarding.schedule.length")}</FieldLabel>
        <Segmented
          items={HANGOUT_LENGTHS.map((v) => ({
            value: v,
            label: t(`onboarding.schedule.lengths.${v}`),
          }))}
          value={length}
          onChange={(value) => setMate({ length: value })}
        />
      </View>
    </Step>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s, paddingTop: space.xs },
  field: { gap: space.s, paddingTop: 10 },
})
