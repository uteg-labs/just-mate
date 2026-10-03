import { Image, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

import type { TastePhoto } from "@/lib/taste"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { spring } from "@/theme/motion"
import { type } from "@/theme/type"

const SWIPE = 110

type Props = { photos: TastePhoto[]; onSwipe: (photo: TastePhoto, yes: boolean) => void }

type CardProps = { photo: TastePhoto; onSwipe: (yes: boolean) => void }

const Photo = ({ uri }: { uri: string }) => (
  <Image
    source={{ uri }}
    resizeMode="cover"
    style={styles.image}
    onError={(e) => console.warn("[taste] image failed:", uri, e.nativeEvent.error)}
  />
)

const TopCard = ({ photo, onSwipe }: CardProps) => {
  const { width } = useWindowDimensions()
  const x = useSharedValue(0)

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onChange((e) => {
      x.set(x.get() + e.changeX)
    })
    .onEnd((e) => {
      const projected = x.get() + e.velocityX * 0.2
      if (Math.abs(projected) < SWIPE) {
        x.set(withSpring(0, { ...spring.momentum, velocity: e.velocityX }))
        return
      }

      const yes = projected < 0
      x.set(
        withSpring(
          (yes ? -1 : 1) * width * 1.4,
          { ...spring.snappy, velocity: e.velocityX },
          (done) => {
            if (done) scheduleOnRN(onSwipe, yes)
          },
        ),
      )
    })

  const card = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { rotate: `${x.get() / 20}deg` }],
  }))
  const yesLabel = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-SWIPE, 0], [1, 0], "clamp"),
  }))
  const noLabel = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, SWIPE], [0, 1], "clamp"),
  }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, card]}>
        <Photo uri={photo.uri} />
        <Animated.View style={[styles.label, styles.yes, yesLabel]}>
          <Text style={[type.title, { color: colors.glow }]}>YES</Text>
        </Animated.View>
        <Animated.View style={[styles.label, styles.no, noLabel]}>
          <Text style={[type.title, { color: colors.textPrimary }]}>NO</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

export const SwipeDeck = ({ photos, onSwipe }: Props) => {
  const [top, next] = photos
  if (!top) return null

  return (
    <View style={styles.stack}>
      {next && (
        <View style={[styles.card, styles.behind]}>
          <Photo uri={next.uri} />
        </View>
      )}
      <TopCard key={top.id} photo={top} onSwipe={(yes) => onSwipe(top, yes)} />
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { width: "100%", aspectRatio: 3 / 4 },
  card: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised,
  },
  behind: { transform: [{ scale: 0.95 }] },
  image: { width: "100%", height: "100%" },
  label: {
    position: "absolute",
    top: space.xl,
    paddingHorizontal: space.m,
    paddingVertical: space.xs,
    borderRadius: radius.button,
    borderWidth: 3,
    backgroundColor: colors.scrim,
  },
  yes: { right: space.xl, borderColor: colors.glow },
  no: { left: space.xl, borderColor: colors.textPrimary },
})
