import type { Profile } from "@justmate/protocol"
import { type Dispatch, type ReactNode, type SetStateAction, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native"
import Animated, {
  type EntryAnimationsValues,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconButton, StepDots, useScheme } from "@/components/ui"
import { saveProfile } from "@/lib/profile"
import { layout } from "@/theme/layout"
import { duration, spring } from "@/theme/motion"
import { type } from "@/theme/type"

import { FLOWS, GROUP, type OnboardingStep, SaveContext, type StepProps } from "./flow"
import { StepInterests } from "./StepInterests"
import { StepMode } from "./StepMode"
import { StepName } from "./StepName"
import { StepQuestions } from "./StepQuestions"
import { StepSchedule } from "./StepSchedule"
import { StepSwipe } from "./StepSwipe"
import { StepVerify } from "./StepVerify"
import { StepWho } from "./StepWho"

export type OnboardingProps = {
  profile: Profile
  setProfile: Dispatch<SetStateAction<Profile>>
  onDone: (profile: Profile) => void
  onExit: () => void
  startStep?: OnboardingStep
  single?: boolean
}

const STEPS = {
  mode: StepMode,
  name: StepName,
  interests: StepInterests,
  questions: StepQuestions,
  who: StepWho,
  swipe: StepSwipe,
  schedule: StepSchedule,
  verify: StepVerify,
} satisfies Record<OnboardingStep, (props: StepProps) => ReactNode>

const SLIDE = 28

function slideIn(dir: number) {
  return (_: EntryAnimationsValues) => {
    "worklet"
    return {
      initialValues: { opacity: 0, transform: [{ translateX: SLIDE * dir }] },
      animations: {
        opacity: withTiming(1, { duration: duration.default }),
        transform: [{ translateX: withSpring(0, spring.default) }],
      },
    }
  }
}

export const Onboarding = ({
  profile,
  setProfile,
  onDone,
  onExit,
  startStep,
  single = false,
}: OnboardingProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const flow: readonly OnboardingStep[] = FLOWS[profile.mode]
  const [first] = useState(() => Math.max(0, startStep ? flow.indexOf(startStep) : 0))
  const [index, setIndex] = useState(first)
  const [dir, setDir] = useState(1)
  const [save, setSave] = useState({ isSaving: false, hasFailed: false })

  const step = flow[index]
  const group = GROUP[step]
  const inGroup = flow.filter((s) => GROUP[s] === group)
  const groupName = t(`onboarding.groups.${group}`)
  const eyebrow =
    step === "mode"
      ? groupName
      : t("onboarding.eyebrow", {
          group: groupName,
          n: inGroup.indexOf(step) + 1,
          m: inGroup.length,
        })

  const finish = async () => {
    setSave({ isSaving: true, hasFailed: false })
    try {
      onDone(await saveProfile(profile))
    } catch {
      setSave({ isSaving: false, hasFailed: true })
    }
  }

  const next = () => {
    setDir(1)
    if (single || index === flow.length - 1) return void finish()
    setIndex(index + 1)
  }

  const back = () => {
    setDir(-1)
    if (single || index === first) return onExit()
    setIndex(index - 1)
  }

  const set = useCallback(
    (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch })),
    [setProfile],
  )
  const Current = STEPS[step]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.fill}
    >
      <View
        style={[
          styles.page,
          { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, layout.gutter) },
        ]}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            label={t("onboarding.back")}
            variant="ghost"
            onPress={back}
          />
          {single ? (
            <Text style={[type.mono, { color: c.fg2 }]}>{t("onboarding.editing")}</Text>
          ) : (
            <StepDots count={flow.length} active={index} />
          )}
          <View style={styles.spacer} />
        </View>
        <SaveContext value={save}>
          <Animated.View key={step} entering={slideIn(dir)} style={styles.step}>
            <Current
              profile={profile}
              setProfile={setProfile}
              set={set}
              next={next}
              eyebrow={eyebrow}
              isEditing={single}
            />
          </Animated.View>
        </SaveContext>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { flex: 1, paddingHorizontal: layout.gutter },
  header: {
    height: layout.hitMin,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  spacer: { width: layout.hitMin },
  step: { flex: 1 },
})
