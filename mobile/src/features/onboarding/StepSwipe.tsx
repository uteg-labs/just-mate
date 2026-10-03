import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  clamp,
  FadeIn,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import Svg, { Defs, Pattern, Rect } from "react-native-svg"
import { scheduleOnRN } from "react-native-worklets"

import { Button, Icon, IconButton, type IconName, useScheme } from "@/components/ui"
import { radius, space } from "@/theme/layout"
import { duration, spring } from "@/theme/motion"
import { type } from "@/theme/type"

import type { StepProps } from "./flow"
import { Step } from "./Step"

const COUNT = 6
const THRESHOLD = 110
const FLICK = 800
const FLING = 520

type StampProps = { x: SharedValue<number>; side: 1 | -1; icon: IconName; label: string }

const Stamp = ({ x, side, icon, label }: StampProps) => {
  const { c } = useScheme()
  const style = useAnimatedStyle(() => ({ opacity: clamp((x.get() * side) / THRESHOLD, 0, 1) }))

  return (
    <Animated.View
      style={[
        styles.stamp,
        side > 0 ? styles.stampLeft : styles.stampRight,
        { backgroundColor: c.surfaceCard, boxShadow: `inset 0 0 0 1.5px ${c.fg1}` },
        style,
      ]}
    >
      <Icon name={icon} size={14} strokeWidth={2} />
      <Text style={[type.mono, { color: c.fg1 }]}>{label}</Text>
    </Animated.View>
  )
}

type CardProps = {
  index: number
  traits: string
  pending?: boolean
  onVote: (isInto: boolean) => void
}

// keyed per sample, so every card starts centred with its own offset
const SwipeCard = ({ index, traits, pending, onVote }: CardProps) => {
  const { t } = useTranslation()
  const { c, shadow } = useScheme()
  const x = useSharedValue(0)

  useEffect(() => {
    if (pending === undefined) return
    x.set(
      withTiming(pending ? FLING : -FLING, { duration: duration.snappy }, (finished) => {
        if (finished) scheduleOnRN(onVote, pending)
      }),
    )
  }, [pending, x, onVote])

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onChange((e) => x.set(x.get() + e.changeX))
    .onEnd((e) => {
      const dir =
        x.get() > THRESHOLD || e.velocityX > FLICK
          ? 1
          : x.get() < -THRESHOLD || e.velocityX < -FLICK
            ? -1
            : 0
      if (!dir) return x.set(withSpring(0, spring.momentum))
      x.set(
        withTiming(dir * FLING, { duration: duration.snappy }, (finished) => {
          if (finished) scheduleOnRN(onVote, dir > 0)
        }),
      )
    })

  const move = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { rotate: `${x.get() / 20}deg` }],
  }))
  const number = String(index + 1).padStart(2, "0")

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={FadeIn.duration(duration.fade)}
        style={[styles.card, { backgroundColor: c.surfaceCard, boxShadow: shadow[3] }, move]}
      >
        <View style={[styles.photo, { backgroundColor: c.surfaceRaised }]}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <Pattern
                id="stripes"
                width={14}
                height={14}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <Rect width={7} height={14} fill={c.surfaceChip} />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#stripes)" />
          </Svg>
          <Text style={[type.mono, { color: c.fg2 }]}>
            {t("onboarding.swipe.photo", { n: number })}
          </Text>
          <Stamp x={x} side={1} icon="heart" label={t("onboarding.swipe.into")} />
          <Stamp x={x} side={-1} icon="x" label={t("onboarding.swipe.not")} />
        </View>
        <View style={styles.meta}>
          <Text style={[type.headline, { color: c.fg1 }]}>{traits}</Text>
          <Text style={[type.mono, { color: c.fg2 }]}>
            {t("onboarding.swipe.count", { n: index + 1, m: COUNT })}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

export const StepSwipe = ({ set, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const { c, shadow } = useScheme()
  const [votes, setVotes] = useState<boolean[]>([])
  const [pending, setPending] = useState<boolean>()
  const traits = t("onboarding.swipe.traits", { returnObjects: true }) as string[]
  const index = votes.length
  const isDone = index >= COUNT
  const into = votes.filter(Boolean).length

  // only the count of "into it" leaves this step: the on-device taste score
  const vote = (isInto: boolean) => {
    const all = [...votes, isInto]
    setVotes(all)
    setPending(undefined)
    if (all.length === COUNT) set({ taste: all.filter(Boolean).length })
  }

  return (
    <Step
      eyebrow={eyebrow}
      title={t("onboarding.swipe.title")}
      sub={t("onboarding.swipe.sub")}
      cta={
        <Button
          title={
            isDone
              ? t("onboarding.swipe.cta")
              : t("onboarding.swipe.ctaLeft", { count: COUNT - index })
          }
          fullWidth
          disabled={!isDone}
          onPress={next}
        />
      }
    >
      {isDone ? (
        <Animated.View
          entering={FadeIn.duration(duration.default)}
          style={[
            styles.card,
            styles.done,
            { backgroundColor: c.surfaceCard, boxShadow: shadow[3] },
          ]}
        >
          <Icon name="circle-check" size={40} color={c.success} strokeWidth={1.75} />
          <Text style={[type.headline, { color: c.fg1 }]}>{t("onboarding.swipe.done")}</Text>
          <Text style={[type.footnote, { color: c.fg2 }]}>
            {t("onboarding.swipe.tally", { into, not: COUNT - into })}
          </Text>
        </Animated.View>
      ) : (
        <>
          <SwipeCard
            key={index}
            index={index}
            traits={traits[index]}
            pending={pending}
            onVote={vote}
          />
          <View style={styles.buttons}>
            <IconButton
              icon="x"
              label={t("onboarding.swipe.not")}
              variant="tint"
              size={60}
              disabled={pending !== undefined}
              onPress={() => setPending(false)}
            />
            <Text style={[type.mono, styles.count, { color: c.fg2 }]}>
              {t("onboarding.swipe.progress", { n: index, m: COUNT })}
            </Text>
            <IconButton
              icon="heart"
              label={t("onboarding.swipe.into")}
              variant="solid"
              size={60}
              disabled={pending !== undefined}
              onPress={() => setPending(true)}
            />
          </View>
        </>
      )}
    </Step>
  )
}

const styles = StyleSheet.create({
  card: { height: 360, borderRadius: radius.card, borderCurve: "continuous", overflow: "hidden" },
  photo: { flex: 1, alignItems: "center", justifyContent: "center" },
  meta: { gap: space.xs, paddingHorizontal: 18, paddingVertical: space.l },
  stamp: {
    position: "absolute",
    top: space.l,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.m,
    height: 32,
    borderRadius: radius.pill,
  },
  stampLeft: { left: space.l, transform: [{ rotate: "-8deg" }] },
  stampRight: { right: space.l, transform: [{ rotate: "8deg" }] },
  done: { alignItems: "center", justifyContent: "center", gap: space.s, padding: space.xl },
  buttons: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xl },
  count: { minWidth: 48, textAlign: "center", fontVariant: ["tabular-nums"] },
})
