import * as Device from "expo-device"
import * as ImagePicker from "expo-image-picker"
import { useEffect, useEffectEvent, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, Text, View } from "react-native"
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
import { api } from "@/lib/api"
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

// one front-camera photo, kept in memory only; undefined = cancelled, null = no camera or no access
async function takeSelfie(): Promise<string | null | undefined> {
  // the iOS simulator has no camera and the picker raises a native exception there, not a JS error
  if (!Device.isDevice && Platform.OS === "ios") return null
  try {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync()
    if (!granted) return null
    const shot = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      base64: true,
      quality: 0.4,
    })
    if (shot.canceled) return
    return shot.assets[0]?.base64 ?? null
  } catch {
    return null
  }
}

// android may kill the app while the system camera is open; the photo it took waits here
async function pendingSelfie(): Promise<string | null | undefined> {
  const shot = await ImagePicker.getPendingResultAsync().catch(() => null)
  if (!shot || "code" in shot || shot.canceled) return
  return shot.assets[0]?.base64 ?? null
}

async function describe(photo: string | null) {
  if (!photo) return ""
  return api
    .appearance({ photo })
    .then((reply) => reply.appearance)
    .catch(() => "")
}

// the liveness check is simulated in this build: the photo is only described (hair, face shape),
// and a phone without a camera still passes with the timed scan
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

  const sweep = () =>
    new Promise<void>((resolve) =>
      progress.set(
        withTiming(1, { duration: SCAN_MS, easing: Easing.inOut(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(resolve)
        }),
      ),
    )

  const check = async (photo: string | null) => {
    setPhase("scanning")
    const [appearance] = await Promise.all([describe(photo), sweep()])
    set({ verified: true, appearance })
    setPhase("done")
  }

  const scan = async () => {
    setPhase("scanning")
    const photo = await takeSelfie()
    if (photo === undefined) return setPhase("idle")
    await check(photo)
  }

  const resume = useEffectEvent(async () => {
    const photo = await pendingSelfie()
    if (photo !== undefined) await check(photo)
  })

  useEffect(() => {
    void resume()
  }, [])

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
            onPress={() => void scan()}
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
