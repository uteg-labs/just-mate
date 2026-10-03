import { ADULT_AGE, AGE_MAX, AGE_MIN, GENDERS } from "@justmate/protocol"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button, FieldLabel, Segmented, TextField } from "@/components/ui"
import { space } from "@/theme/layout"

import type { StepProps } from "./flow"
import { Step } from "./Step"

function ctaKey(hasName: boolean, ageText: string, age: number, isDate: boolean) {
  if (!hasName) return "ctaName"
  if (!ageText) return "ctaAge"
  if (age < AGE_MIN || age > AGE_MAX) return "ctaAgeRange"
  if (isDate && age < ADULT_AGE) return "ctaAdult"
  return "cta"
}

export const StepName = ({ profile, set, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const [ageText, setAgeText] = useState(profile.name ? String(profile.age) : "")
  const name = profile.name.trim()
  const key = ctaKey(!!name, ageText, Number(ageText), profile.mode === "date")
  const isReady = key === "cta"

  const changeAge = (text: string) => {
    const digits = text.replace(/\D/g, "")
    setAgeText(digits)
    if (digits) set({ age: Number(digits) })
  }

  return (
    <Step
      eyebrow={eyebrow}
      title={t("onboarding.name.title")}
      sub={t("onboarding.name.sub")}
      cta={
        <Button
          title={t(`onboarding.name.${key}`, { name })}
          fullWidth
          disabled={!isReady}
          onPress={next}
        />
      }
    >
      <View style={styles.row}>
        <View style={styles.name}>
          <TextField
            label={t("onboarding.name.label")}
            kind="name"
            textContentType="givenName"
            autoComplete="given-name"
            maxLength={40}
            value={profile.name}
            onChangeText={(v) => set({ name: v })}
            placeholder={t("onboarding.name.placeholder")}
            returnKeyType="next"
          />
        </View>
        <View style={styles.age}>
          <TextField
            label={t("onboarding.name.age")}
            keyboardType="number-pad"
            maxLength={2}
            value={ageText}
            onChangeText={changeAge}
            placeholder={t("onboarding.name.agePlaceholder")}
            onSubmitEditing={() => isReady && next()}
          />
        </View>
      </View>
      <View style={styles.field}>
        <FieldLabel>{t("onboarding.name.gender")}</FieldLabel>
        <Segmented
          items={GENDERS.map((g) => ({ value: g, label: t(`onboarding.name.genders.${g}`) }))}
          value={profile.gender}
          onChange={(gender) => set({ gender })}
        />
      </View>
    </Step>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.m, paddingTop: space.s },
  name: { flex: 1 },
  age: { width: 112 },
  field: { gap: space.s },
})
