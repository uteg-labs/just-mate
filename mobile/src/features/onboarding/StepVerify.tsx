import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle, Ellipse } from "react-native-svg"
import { scheduleOnRN } from "react-native-worklets"

import { Button, CheckRow, Icon, Scope, useScheme } from "@/components/ui"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import type { StepProps } from "./flow"
import { Step } from "./Step"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const SCAN_MS = 2400
const SIZE = 236
const RING_R = 110
const RING = 2 * Math.PI * RING_R

type Phase = "idle" | "scanning" | "done"

const STATUS = { idle: "center", scanning: "hold", done: "done" } as const

// the selfie check is simulated in this build: a timed scan that marks the profile verified
const Scanner = ({ phase, progress }: { phase: Phase; progress: SharedValue<number> }) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const isDone = phase === "done"
  const ring = useAnimatedProps(() => ({ strokeDashoffset: RING * (1 - progress.get()) }))

  return (
    <View style={[styles.panel, { backgroundColor: c.ink }]}>
      <View style={styles.scanner}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Ellipse
            cx={SIZE / 2}
            cy={SIZE / 2}
            rx={72}
            ry={94}
            stroke={c.fg3}
            strokeWidth={1.5}
            strokeDasharray="4 6"
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_R}
            stroke={c.separator}
            strokeWidth={3}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RING_R}
            stroke={isDone ? c.success : c.glow}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={RING}
            fill="none"
            rotation={-90}
            origin={`${SIZE / 2}, ${SIZE / 2}`}
            animatedProps={ring}
          />
        </Svg>
        <Icon
          name={isDone ? "shield-check" : "scan-face"}
          size={40}
          color={isDone ? c.success : c.fg2}
          strokeWidth={1.5}
        />
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={[type.mono, { color: isDone ? c.success : c.fg2 }]}
      >
        {t(`onboarding.verify.${STATUS[phase]}`)}
      </Text>
    </View>
  )
}

export const StepVerify = ({ profile, set, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const [phase, setPhase] = useState<Phase>(profile.verified ? "done" : "idle")
  const [isAdult, setIsAdult] = useState(false)
  const progress = useSharedValue(profile.verified ? 1 : 0)
  const isDate = profile.mode === "date"
  const isDone = phase === "done"

  const finishScan = () => {
    set({ verified: true })
    setPhase("done")
  }

  const scan = () => {
    setPhase("scanning")
    progress.set(
      withTiming(1, { duration: SCAN_MS, easing: Easing.inOut(Easing.quad) }, (finished) => {
        if (finished) scheduleOnRN(finishScan)
      }),
    )
  }

  return (
    <Step
      eyebrow={eyebrow}
      title={t(isDate ? "onboarding.verify.titleDate" : "onboarding.verify.titleMate")}
      sub={t("onboarding.verify.sub")}
      footer={
        <Text style={[type.mono, styles.center, { color: c.fg2 }]}>
          {t("onboarding.verify.footer")}
        </Text>
      }
      cta={
        isDone ? (
          <Button
            title={t("onboarding.verify.enter")}
            leadingIcon="map"
            fullWidth
            disabled={isDate && !isAdult}
            onPress={next}
          />
        ) : (
          <Button
            title={t("onboarding.verify.take")}
            leadingIcon="camera"
            fullWidth
            loading={phase === "scanning"}
            onPress={scan}
          />
        )
      }
    >
      <Scope scheme="dark">
        <Scanner phase={phase} progress={progress} />
      </Scope>
      {isDate && (
        <CheckRow
          label={t("onboarding.verify.adult")}
          description={t("onboarding.verify.adultNote")}
          checked={isAdult}
          onToggle={() => setIsAdult(!isAdult)}
        />
      )}
    </Step>
  )
}

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    gap: space.l,
    paddingVertical: space.xl,
    borderRadius: radius.sheet,
    borderCurve: "continuous",
  },
  scanner: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
})
