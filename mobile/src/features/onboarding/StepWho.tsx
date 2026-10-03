import {
  ADULT_AGE,
  AGE_MAX,
  AGE_MIN,
  ENERGIES,
  GROUPS,
  LOOKING_FOR,
  MATE_WHO,
  PARTNER_CHARACTER_MAX,
  SEEKS,
} from "@justmate/protocol"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import {
  Button,
  Chip,
  FieldLabel,
  type Range,
  RangeSlider,
  Segmented,
  TextField,
} from "@/components/ui"
import { space } from "@/theme/layout"

import { ageLabel, SLIDER_MAX, type StepProps } from "./flow"
import { Step } from "./Step"

const Field = ({
  label,
  right,
  children,
}: {
  label: string
  right?: string
  children: ReactNode
}) => (
  <View style={styles.field}>
    <FieldLabel right={right}>{label}</FieldLabel>
    {children}
  </View>
)

export const StepWho = ({ profile, setProfile, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const isDate = profile.mode === "date"
  const prefs = isDate ? profile.date : profile.mate

  const setDate = (patch: Partial<typeof profile.date>) =>
    setProfile((p) => ({ ...p, date: { ...p.date, ...patch } }))
  const setMate = (patch: Partial<typeof profile.mate>) =>
    setProfile((p) => ({ ...p, mate: { ...p.mate, ...patch } }))

  const setAge = ([ageMin, top]: Range) => {
    const range = { ageMin, ageMax: top >= SLIDER_MAX ? AGE_MAX : top }
    if (isDate) setDate(range)
    else setMate(range)
  }

  const age = (
    <Field label={t("onboarding.who.age")} right={ageLabel(prefs.ageMin, prefs.ageMax)}>
      <RangeSlider
        min={isDate ? ADULT_AGE : AGE_MIN}
        max={SLIDER_MAX}
        value={[prefs.ageMin, Math.min(prefs.ageMax, SLIDER_MAX)]}
        onChange={setAge}
      />
    </Field>
  )

  const partner = (
    <TextField
      label={t("onboarding.who.partner")}
      maxLength={PARTNER_CHARACTER_MAX}
      value={profile.partnerCharacter}
      onChangeText={(partnerCharacter) => setProfile((p) => ({ ...p, partnerCharacter }))}
      placeholder={t("onboarding.who.partnerPlaceholder")}
    />
  )

  if (isDate)
    return (
      <Step
        eyebrow={eyebrow}
        title={t("onboarding.who.date.title")}
        sub={t("onboarding.who.date.sub")}
        cta={<Button title={t("onboarding.who.date.cta")} fullWidth onPress={next} />}
      >
        <View style={styles.fields}>
          <Field label={t("onboarding.who.date.seek")}>
            <Segmented
              items={SEEKS.map((v) => ({ value: v, label: t(`onboarding.who.seeks.${v}`) }))}
              value={profile.date.seek}
              onChange={(seek) => setDate({ seek })}
            />
          </Field>
          {age}
          <Field label={t("onboarding.who.date.looking")}>
            <View style={styles.chips}>
              {LOOKING_FOR.map((looking) => (
                <Chip
                  key={looking}
                  label={t(`onboarding.who.lookingFor.${looking}`)}
                  selected={profile.date.looking === looking}
                  onPress={() => setDate({ looking })}
                />
              ))}
            </View>
          </Field>
          {partner}
        </View>
      </Step>
    )

  return (
    <Step
      eyebrow={eyebrow}
      title={t("onboarding.who.mate.title")}
      sub={t("onboarding.who.mate.sub")}
      cta={<Button title={t("onboarding.who.mate.cta")} fullWidth onPress={next} />}
    >
      <View style={styles.fields}>
        <Field label={t("onboarding.who.mate.who")}>
          <Segmented
            items={MATE_WHO.map((v) => ({ value: v, label: t(`onboarding.who.whos.${v}`) }))}
            value={profile.mate.who}
            onChange={(who) => setMate({ who })}
          />
        </Field>
        <Field label={t("onboarding.who.mate.group")}>
          <Segmented
            items={GROUPS.map((v) => ({ value: v, label: t(`onboarding.who.groups.${v}`) }))}
            value={profile.mate.group}
            onChange={(group) => setMate({ group })}
          />
        </Field>
        <Field label={t("onboarding.who.mate.energy")}>
          <Segmented
            items={ENERGIES.map((v) => ({ value: v, label: t(`onboarding.who.energies.${v}`) }))}
            value={profile.mate.energy}
            onChange={(energy) => setMate({ energy })}
          />
        </Field>
        {age}
        {partner}
      </View>
    </Step>
  )
}

const styles = StyleSheet.create({
  fields: { gap: 22, paddingTop: space.s },
  field: { gap: space.s },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
})
