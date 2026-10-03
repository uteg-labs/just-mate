import { MODES, type Mode } from "@justmate/protocol"
import * as Haptics from "expo-haptics"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { useAnimatedStyle, withSpring } from "react-native-reanimated"

import {
  AnimatedPressable,
  Button,
  Icon,
  type IconName,
  Scope,
  usePress,
  useScheme,
} from "@/components/ui"
import { radius, space } from "@/theme/layout"
import { spring } from "@/theme/motion"
import { type } from "@/theme/type"

import type { StepProps } from "./flow"
import { Step } from "./Step"

const ICON: Record<Mode, IconName> = { date: "heart", mate: "users" }

type CardProps = { mode: Mode; isSelected: boolean; onPress: () => void }

const ModeCard = ({ mode, isSelected, onPress }: CardProps) => {
  const { c, shadow } = useScheme()
  const { style: pressStyle, handlers } = usePress()
  const grow = useAnimatedStyle(() => ({
    minHeight: withSpring(isSelected ? 156 : 128, spring.default),
  }))

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? c.fg1 : c.surfaceCard,
          boxShadow: isSelected ? shadow[6] : shadow[3],
        },
        grow,
        pressStyle,
      ]}
    >
      <Scope scheme={isSelected ? "dark" : "light"}>
        <CardFace mode={mode} isSelected={isSelected} />
      </Scope>
    </AnimatedPressable>
  )
}

const CardFace = ({ mode, isSelected }: { mode: Mode; isSelected: boolean }) => {
  const { t } = useTranslation()
  const { c } = useScheme()

  return (
    <>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: isSelected ? c.tint : c.surfaceRaised }]}>
          <Icon name={ICON[mode]} size={20} strokeWidth={isSelected ? 2 : 1.5} />
        </View>
        <Text style={[type.mono, styles.dim, { color: c.fg1 }]}>
          {t(`onboarding.mode.${mode}.tag`)}
        </Text>
      </View>
      <View>
        <Text style={[type.largeTitle, { color: c.fg1 }]}>{t(`modes.${mode}`)}</Text>
        <Text style={[styles.desc, { color: c.fg1 }]}>{t(`onboarding.mode.${mode}.desc`)}</Text>
      </View>
    </>
  )
}

export const StepMode = ({ profile, set, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()

  const pick = (mode: Mode) => {
    if (mode === profile.mode) return
    if (profile.settings.haptics) void Haptics.selectionAsync()
    set({ mode, interests: [], qa: [], vibe: "" })
  }

  return (
    <Step
      eyebrow={eyebrow}
      title={t("onboarding.mode.title")}
      sub={t("onboarding.mode.sub")}
      cta={
        <Button
          title={t("onboarding.mode.cta")}
          trailingIcon="arrow-right"
          fullWidth
          onPress={next}
        />
      }
    >
      <View accessibilityRole="radiogroup" style={styles.cards}>
        {MODES.map((mode) => (
          <ModeCard
            key={mode}
            mode={mode}
            isSelected={profile.mode === mode}
            onPress={() => pick(mode)}
          />
        ))}
      </View>
    </Step>
  )
}

const styles = StyleSheet.create({
  cards: { gap: space.m, paddingTop: space.xs },
  card: {
    justifyContent: "space-between",
    gap: space.l,
    padding: 20,
    borderRadius: radius.card,
    borderCurve: "continuous",
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  dim: { opacity: 0.7 },
  desc: { ...type.body, fontSize: 15, lineHeight: 20, marginTop: space.xs, opacity: 0.72 },
})
