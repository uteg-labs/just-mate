import { type Seek, TASTE_MAX, type TasteGroup, type TasteSample } from "@justmate/protocol"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Image, StyleSheet, Text, View } from "react-native"
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

import { Button, Icon, IconButton, type IconName, Thinking, useScheme } from "@/components/ui"
import { api } from "@/lib/api"
import { apiURL } from "@/lib/auth-client"
import { radius, space } from "@/theme/layout"
import { duration, spring } from "@/theme/motion"
import { type } from "@/theme/type"

import type { StepProps } from "./flow"
import { Step } from "./Step"

const COUNT = 10
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

const SEEK_GROUPS: Record<Seek, TasteGroup[]> = {
  women: ["women"],
  men: ["man"],
  everyone: ["women", "man"],
}

// a sample photo from GET /taste, or a striped placeholder when the server has none
type Sample = { traits: string; uri?: string }

// "everyone" alternates the groups
function samplesFor(all: TasteSample[], seek: Seek): Sample[] {
  const groups = SEEK_GROUPS[seek].map((g) => all.filter((s) => s.group === g))
  const rounds = Math.max(...groups.map((g) => g.length))
  return Array.from({ length: rounds }, (_, i) => groups.map((g) => g[i]))
    .flat()
    .filter((s) => s !== undefined)
    .map((s) => ({ traits: s.description, uri: `${apiURL}${s.photo}` }))
}

type CardProps = {
  index: number
  count: number
  sample: Sample
  pending?: boolean
  onVote: (isInto: boolean) => void
}

// keyed per sample, so every card starts centred with its own offset
const SwipeCard = ({ index, count, sample, pending, onVote }: CardProps) => {
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
          {sample.uri ? (
            <Image
              source={{ uri: sample.uri }}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <Placeholder number={number} />
          )}
          <Stamp x={x} side={1} icon="heart" label={t("onboarding.swipe.into")} />
          <Stamp x={x} side={-1} icon="x" label={t("onboarding.swipe.not")} />
        </View>
        <View style={styles.meta}>
          <Text
            numberOfLines={3}
            style={[sample.uri ? type.footnote : type.headline, { color: c.fg1 }]}
          >
            {sample.traits}
          </Text>
          <Text style={[type.mono, { color: c.fg2 }]}>
            {t("onboarding.swipe.count", { n: index + 1, m: count })}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

const Placeholder = ({ number }: { number: string }) => {
  const { t } = useTranslation()
  const { c } = useScheme()

  return (
    <>
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
    </>
  )
}

export const StepSwipe = ({ profile, set, next, eyebrow }: StepProps) => {
  const { t } = useTranslation()
  const { c, shadow } = useScheme()
  const [samples, setSamples] = useState<Sample[]>()
  const [votes, setVotes] = useState<boolean[]>([])
  const [pending, setPending] = useState<boolean>()
  const [isWriting, setIsWriting] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const seek = profile.date.seek
  const count = samples?.length ?? COUNT
  const index = votes.length
  const isDone = index >= count || isConfirmed
  const into = votes.filter(Boolean).length

  useEffect(() => {
    const placeholders = (t("onboarding.swipe.traits", { returnObjects: true }) as string[]).map(
      (traits) => ({ traits }),
    )
    let isLive = true
    api
      .tasteSamples()
      .then((all) => samplesFor(all, seek))
      .catch(() => [])
      .then((photos) => {
        if (!isLive) return
        for (const { uri } of photos) if (uri) Image.prefetch(uri).catch(() => {})
        setSamples(photos.length ? photos : placeholders)
      })
    return () => {
      isLive = false
    }
  }, [seek, t])

  // only words leave this step: the traits the liked samples share, never a photo
  const writeTaste = (picks: string[]) => {
    if (!picks.length) return set({ taste: "" })
    setIsWriting(true)
    api
      .taste({ picks })
      .then((reply) => set({ taste: reply.taste }))
      .catch(() => set({ taste: picks.join("; ").slice(0, TASTE_MAX) }))
      .finally(() => setIsWriting(false))
  }

  const likedTraits = (all: boolean[]) =>
    (samples ?? []).filter((_, i) => all[i]).map((s) => s.traits)

  const vote = (isInto: boolean) => {
    const all = [...votes, isInto]
    setVotes(all)
    setPending(undefined)
    if (all.length === count) writeTaste(likedTraits(all))
  }

  const confirm = () => {
    setIsConfirmed(true)
    writeTaste(likedTraits(votes))
  }

  const skip = () => {
    set({ taste: "" })
    next()
  }

  return (
    <Step
      eyebrow={eyebrow}
      title={t("onboarding.swipe.title")}
      sub={t("onboarding.swipe.sub")}
      cta={
        isDone ? (
          <Button title={t("onboarding.swipe.cta")} fullWidth loading={isWriting} onPress={next} />
        ) : (
          <View style={styles.actions}>
            <Button
              title={t("onboarding.swipe.confirm", { count: into })}
              fullWidth
              disabled={into === 0 || pending !== undefined}
              onPress={confirm}
            />
            <Button
              title={t("onboarding.swipe.skip")}
              variant="ghost"
              fullWidth
              disabled={pending !== undefined}
              onPress={skip}
            />
          </View>
        )
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
            {t("onboarding.swipe.tally", { into, not: index - into })}
          </Text>
        </Animated.View>
      ) : !samples ? (
        <Thinking label={t("onboarding.swipe.loading")} />
      ) : (
        <>
          <SwipeCard
            key={index}
            index={index}
            count={count}
            sample={samples[index] as Sample}
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
              {t("onboarding.swipe.progress", { n: index, m: count })}
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
  actions: { gap: space.s },
  buttons: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xl },
  count: { minWidth: 48, textAlign: "center", fontVariant: ["tabular-nums"] },
})
