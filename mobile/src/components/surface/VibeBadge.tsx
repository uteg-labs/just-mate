import { useId } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  FadeIn,
  Keyframe,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg"
import { Icon, Scope, useReduceMotion, useScheme } from "@/components/ui"
import { wordLabel } from "@/features/home/categories"
import { light } from "@/theme/colors"
import { radius } from "@/theme/layout"
import { duration, easing, spring } from "@/theme/motion"
import { font, type } from "@/theme/type"
import type { BadgeDesign } from "./badgeDesign"

export type VibeBadgeProps = {
  design?: BadgeDesign
  eyebrow: string
  quote?: string
  name?: string
  tag?: string
  width?: number
  strap?: number
  fadeStrap?: boolean
  lifted?: boolean
  turnKey?: string | number
  dim?: boolean
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const HOLE_Y = 26
const HOLE_R = 11
const STRAP_W = 40
const CLIP_H = 96
const CLIP_OVERLAP = 6
const CARD_OVERLAP = 30
const SMALL = 240
const SWING_MAX = 24
const SWING_GAIN = 0.14
const TILT_X = 16
const TILT_Y = 22
const PERSPECTIVE = 900

const FALLBACK = {
  colors: [light.self, light.glow, light.glowCore],
  blobs: [
    [22, 30],
    [86, 8],
    [55, 55],
  ],
} as const

function channels(hex: string) {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
}

function mix(from: string, to: string, t: number) {
  const a = channels(from)
  const b = channels(to)
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`
}

function alpha(hex: string, a: number) {
  return `rgba(${channels(hex).join(",")},${a})`
}

function clamp(v: number, min: number, max: number) {
  "worklet"
  return Math.min(max, Math.max(min, v))
}

function cardPath(w: number, h: number) {
  const r = radius.badge
  const x = w / 2 - HOLE_R
  return [
    `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h - r} A${r},${r} 0 0 1 ${w - r},${h}`,
    `H${r} A${r},${r} 0 0 1 0,${h - r} V${r} A${r},${r} 0 0 1 ${r},0 Z`,
    `M${x},${HOLE_Y} a${HOLE_R},${HOLE_R} 0 1 0 ${2 * HOLE_R},0 a${HOLE_R},${HOLE_R} 0 1 0 ${-2 * HOLE_R},0 Z`,
  ].join(" ")
}

function dropKeyframe(height: number) {
  const at = (y: number, deg: number) => ({
    transform: [{ translateY: y * height }, { rotate: `${deg}deg` }],
  })
  return new Keyframe({
    0: at(-1.1, 0),
    45: { ...at(0.02, -6), easing: easing.out },
    62: { ...at(-0.01, 4), easing: easing.out },
    78: { ...at(0, -2), easing: easing.out },
    90: { ...at(0, 0.8), easing: easing.out },
    100: { ...at(0, 0), easing: easing.out },
  }).duration(duration.drop)
}

type StrapProps = { height: number; colors: readonly string[]; fade: boolean }

const Strap = ({ height, colors, fade }: StrapProps) => {
  const { c } = useScheme()
  const id = useId().replace(/[^\w-]/g, "")
  const [a, , b] = colors

  return (
    <View style={{ width: STRAP_W, height }}>
      <Svg width={STRAP_W} height={height}>
        <Defs>
          <LinearGradient id={`${id}fill`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.surfaceChip} />
            <Stop offset="0.45" stopColor={mix(c.surfaceChip, a, 0.34)} />
            <Stop offset="0.8" stopColor={mix(c.surfaceChip, b, 0.6)} />
            <Stop offset="1" stopColor={c.surfaceChip} />
          </LinearGradient>
          <Pattern
            id={`${id}up`}
            width={3}
            height={3}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width={1} height={3} fill={c.white} fillOpacity={0.38} />
          </Pattern>
          <Pattern
            id={`${id}down`}
            width={3}
            height={3}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <Rect width={1} height={3} fill={c.black} fillOpacity={0.05} />
          </Pattern>
          <LinearGradient id={`${id}edge`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c.black} stopOpacity={0.14} />
            <Stop offset="0.08" stopColor={c.black} stopOpacity={0} />
            <Stop offset="0.92" stopColor={c.black} stopOpacity={0} />
            <Stop offset="1" stopColor={c.black} stopOpacity={0.14} />
          </LinearGradient>
          <LinearGradient
            id={`${id}fade`}
            x1="0"
            y1="0"
            x2="0"
            y2={40}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={c.white} stopOpacity={0} />
            <Stop offset="1" stopColor={c.white} stopOpacity={1} />
          </LinearGradient>
          <Mask id={`${id}mask`}>
            <Rect width={STRAP_W} height={height} fill={`url(#${id}fade)`} />
          </Mask>
        </Defs>
        <G mask={fade ? `url(#${id}mask)` : undefined}>
          {["fill", "up", "down", "edge"].map((layer) => (
            <Rect key={layer} width={STRAP_W} height={height} fill={`url(#${id}${layer})`} />
          ))}
        </G>
      </Svg>
      <View
        style={[
          styles.pin,
          {
            backgroundColor: c.background,
            boxShadow: `inset 0 1px 2px ${alpha(c.black, 0.35)}, 0 0 0 2px ${mix(c.surfaceChip, c.white, 0.5)}`,
          },
        ]}
      />
    </View>
  )
}

const Clip = () => {
  const { c, shadow } = useScheme()
  const metal = {
    backgroundColor: c.ink,
    experimental_backgroundImage: `linear-gradient(90deg, ${mix(c.ink, c.white, 0.26)}, ${c.ink} 55%, ${mix(c.ink, c.white, 0.14)})`,
  }

  return (
    <View pointerEvents="none" style={styles.clip}>
      <View
        style={[
          styles.ring,
          {
            borderColor: c.ink,
            boxShadow: `inset 0 1px 0 ${alpha(c.white, 0.16)}, 0 1px 0 ${alpha(c.white, 0.12)}`,
          },
        ]}
      />
      <View style={[styles.neck, metal]} />
      <View
        style={[
          styles.shank,
          metal,
          { boxShadow: `inset 0 1px 0 ${alpha(c.white, 0.2)}, ${shadow.clip}` },
        ]}
      >
        <View style={[styles.glint, { backgroundColor: alpha(c.white, 0.14) }]} />
      </View>
      <View style={[styles.tail, metal]} />
    </View>
  )
}

type FaceArtProps = {
  width: number
  height: number
  design?: BadgeDesign
  shine: { x: SharedValue<number>; y: SharedValue<number>; on: SharedValue<number> }
}

const FaceArt = ({ width, height, design, shine }: FaceArtProps) => {
  const { c } = useScheme()
  const id = useId().replace(/[^\w-]/g, "")
  const [a, b, d] = design?.colors ?? FALLBACK.colors
  const blobs = design?.blobs ?? FALLBACK.blobs
  const glowH = height * 0.6
  const patternH = height * 0.52
  const path = cardPath(width, height)
  const pattern = design?.pattern ?? "none"
  const ring = blobs[0]
  const rings = Array.from(
    { length: Math.ceil(Math.hypot(width, patternH) / 11) + 1 },
    (_, k) => 11 * k + 0.5,
  )

  const blobSpec = [
    { color: mix(d, c.white, 0.1), size: [0.9, 0.7], at: blobs[2], end: 0.75 },
    { color: mix(b, c.white, 0.25), size: [0.6, 0.55], at: blobs[1], end: 0.7 },
    { color: mix(a, c.white, 0.15), size: [0.7, 0.6], at: blobs[0], end: 0.72 },
  ]

  const shineProps = useAnimatedProps(() => ({
    cx: shine.x.get(),
    cy: shine.y.get(),
    opacity: shine.on.get(),
  }))

  return (
    <Svg width={width} height={height + 2} style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={`${id}face`}>
          <Path d={path} clipRule="evenodd" />
        </ClipPath>
        {blobSpec.map((blob, i) => (
          <RadialGradient
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed three blobs
            key={i}
            id={`${id}blob${i}`}
            gradientUnits="userSpaceOnUse"
            cx={(blob.at[0] / 100) * width}
            cy={(blob.at[1] / 100) * glowH}
            rx={blob.size[0] * width}
            ry={blob.size[1] * glowH}
          >
            <Stop offset="0" stopColor={blob.color} />
            <Stop offset={blob.end} stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        ))}
        <LinearGradient id={`${id}glowFade`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.45" stopColor={c.white} />
          <Stop offset="1" stopColor={c.white} stopOpacity={0} />
        </LinearGradient>
        <Mask id={`${id}glowMask`}>
          <Rect width={width} height={glowH} fill={`url(#${id}glowFade)`} />
        </Mask>
        <LinearGradient id={`${id}patternFade`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.3" stopColor={c.white} />
          <Stop offset="1" stopColor={c.white} stopOpacity={0} />
        </LinearGradient>
        <Mask id={`${id}patternMask`}>
          <Rect width={width} height={patternH} fill={`url(#${id}patternFade)`} />
        </Mask>
        {pattern === "dots" && (
          <Pattern id={`${id}pattern`} width={9} height={9} patternUnits="userSpaceOnUse">
            <Circle cx={4.5} cy={4.5} r={1.3} fill={c.white} fillOpacity={0.42} />
          </Pattern>
        )}
        {pattern === "lines" && (
          <Pattern
            id={`${id}pattern`}
            width={7}
            height={7}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${design?.angle ?? 0})`}
          >
            <Rect width={7} height={1} fill={c.white} fillOpacity={0.42} />
          </Pattern>
        )}
        {pattern === "grid" && (
          <Pattern id={`${id}pattern`} width={14} height={14} patternUnits="userSpaceOnUse">
            <Rect width={14} height={1} fill={c.white} fillOpacity={0.42} />
            <Rect width={1} height={14} fill={c.white} fillOpacity={0.42} />
          </Pattern>
        )}
        <RadialGradient id={`${id}shine`}>
          <Stop offset="0" stopColor={c.white} stopOpacity={0.5} />
          <Stop offset="1" stopColor={c.white} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Path
        d={path}
        fillRule="evenodd"
        fill={mix(c.surfaceChip, c.black, 0.16)}
        transform="translate(0 1.5)"
      />
      <G clipPath={`url(#${id}face)`}>
        <Rect width={width} height={height} fill={c.surfaceChip} />
        <G mask={`url(#${id}glowMask)`}>
          {blobSpec.map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed three blobs
            <Rect key={i} width={width} height={glowH} fill={`url(#${id}blob${i})`} />
          ))}
        </G>
        <G mask={`url(#${id}patternMask)`}>
          {pattern === "rings" &&
            rings.map((r) => (
              <Circle
                key={r}
                cx={(ring[0] / 100) * width}
                cy={(ring[1] / 100) * patternH}
                r={r}
                stroke={c.white}
                strokeOpacity={0.42}
                fill="none"
              />
            ))}
          {pattern !== "none" && pattern !== "rings" && (
            <Rect width={width} height={patternH} fill={`url(#${id}pattern)`} />
          )}
        </G>
        <AnimatedCircle r={width * 0.6} fill={`url(#${id}shine)`} animatedProps={shineProps} />
        <Rect width={width} height={1} fill={c.white} fillOpacity={0.8} />
        <Path d={path} fill="none" stroke={c.black} strokeOpacity={0.05} strokeWidth={2} />
      </G>
    </Svg>
  )
}

type FaceTextProps = Pick<VibeBadgeProps, "design" | "eyebrow" | "quote" | "name" | "tag"> & {
  isSmall: boolean
}

const FaceText = ({ design, eyebrow, quote, name, tag, isSmall }: FaceTextProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const hasIcon = design && design.icon !== "sparkle"

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.rule}>
        <View style={[styles.line, { backgroundColor: c.surfaceCard }]} />
        {hasIcon ? (
          <Icon
            name={design.icon}
            size={15}
            strokeWidth={2}
            color={c.surfaceCard}
            style={styles.icon}
          />
        ) : (
          <Icon
            name="sparkle"
            size={14}
            strokeWidth={2}
            color={c.surfaceCard}
            fill={c.surfaceCard}
            style={styles.sparkle}
          />
        )}
      </View>
      {design && !(isSmall && name) && (
        <Text style={[type.mono, styles.serial, { color: c.surfaceCard }]}>
          no. {design.serial}
        </Text>
      )}

      <View style={styles.content}>
        <View>
          <Text style={[type.mono, { color: c.fg2 }]}>{eyebrow}</Text>
          {name ? (
            <Text style={[isSmall ? styles.nameSmall : styles.name, { color: c.fg1 }]}>{name}</Text>
          ) : (
            <Text
              numberOfLines={isSmall ? 3 : 4}
              style={[isSmall ? styles.quoteSmall : styles.quote, { color: c.fg1 }]}
            >
              “{quote}”
            </Text>
          )}
        </View>
        <View style={styles.foot}>
          {design && !name && !isSmall && design.tags.length > 0 && (
            <Text numberOfLines={1} style={[type.mono, { color: c.fg2 }]}>
              {design.tags.map((tag) => wordLabel(t, tag)).join(" · ")}
            </Text>
          )}
          <View style={styles.footRow}>
            <Text style={[isSmall ? styles.markSmall : styles.mark, { color: c.fg1 }]}>
              JustMate
            </Text>
            {!isSmall && !!tag && (
              <View style={styles.tag}>
                <Icon name="shield-check" size={12} strokeWidth={2} color={c.fg2} />
                <Text style={[type.mono, { color: c.fg2 }]}>{tag}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

// DESIGN.md §13.4 — always paper; drops in on its strap, tilts toward the finger, swings when dragged
export const VibeBadge = ({
  design,
  eyebrow,
  quote,
  name,
  tag,
  width = SMALL,
  strap = 120,
  fadeStrap = true,
  lifted = false,
  turnKey,
  dim = false,
}: VibeBadgeProps) => {
  const reduceMotion = useReduceMotion()
  const { shadow } = useScheme("light")
  const height = Math.round(width * 1.38)
  const total = strap + CLIP_H - CLIP_OVERLAP - CARD_OVERLAP + height
  const colors = design?.colors ?? FALLBACK.colors

  const swing = useSharedValue(0)
  const tiltX = useSharedValue(0)
  const tiltY = useSharedValue(0)
  const shineX = useSharedValue(width / 2)
  const shineY = useSharedValue(height / 2)
  const shineOn = useSharedValue(0)

  function aim(x: number, y: number) {
    "worklet"
    const px = clamp(x / width, 0, 1)
    const py = clamp(y / height, 0, 1)
    const follow = { duration: duration.follow }
    tiltX.set(withTiming((0.5 - py) * TILT_X, follow))
    tiltY.set(withTiming((px - 0.5) * TILT_Y, follow))
    shineX.set(px * width)
    shineY.set(py * height)
    shineOn.set(withTiming(1, follow))
  }

  const pan = Gesture.Pan()
    .enabled(!reduceMotion)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin((e) => aim(e.x, e.y))
    .onTouchesMove((e) => {
      const touch = e.allTouches[0]
      if (touch) aim(touch.x, touch.y)
    })
    .onUpdate((e) => swing.set(clamp(e.translationX * SWING_GAIN, -SWING_MAX, SWING_MAX)))
    .onFinalize((e) => {
      swing.set(withSpring(0, { ...spring.swing, velocity: e.velocityX * SWING_GAIN }))
      tiltX.set(withSpring(0, spring.settle))
      tiltY.set(withSpring(0, spring.settle))
      shineOn.set(withTiming(0, { duration: duration.default }))
    })

  const liftStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: withTiming(lifted ? 0 : 1, { duration: duration.fade }) }
    const lift = { duration: duration.lift, easing: easing.lift }
    return { transform: [{ translateY: lifted ? withTiming(-1.3 * total, lift) : 0 }] }
  })
  const swingStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.get()}deg` }] }))
  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: PERSPECTIVE },
      { rotateX: `${tiltX.get()}deg` },
      { rotateY: `${tiltY.get()}deg` },
    ],
  }))
  const dimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dim ? 0.55 : 1, { duration: duration.fade }),
  }))

  return (
    <Scope scheme="light">
      <View style={styles.root}>
        <Animated.View style={liftStyle}>
          <Animated.View
            key={turnKey}
            entering={reduceMotion ? FadeIn.duration(duration.fade) : dropKeyframe(total)}
            style={styles.hang}
          >
            <Animated.View style={[styles.column, swingStyle]}>
              <Strap height={strap} colors={colors} fade={fadeStrap} />
              <Clip />
              <GestureDetector gesture={pan}>
                <Animated.View
                  accessible
                  accessibilityLabel={[eyebrow, name ?? quote].filter(Boolean).join(", ")}
                  style={[
                    styles.card,
                    { width, height, transformOrigin: `50% ${HOLE_Y}px`, boxShadow: shadow.badge },
                    tiltStyle,
                  ]}
                >
                  <Animated.View style={[StyleSheet.absoluteFill, dimStyle]}>
                    <FaceArt
                      width={width}
                      height={height}
                      design={design}
                      shine={{ x: shineX, y: shineY, on: shineOn }}
                    />
                    <FaceText
                      design={design}
                      eyebrow={eyebrow}
                      quote={quote}
                      name={name}
                      tag={tag}
                      isSmall={width < SMALL}
                    />
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </Scope>
  )
}

const styles = StyleSheet.create({
  root: { alignItems: "center" },
  hang: { transformOrigin: "top" },
  column: { alignItems: "center", transformOrigin: "top" },
  pin: {
    position: "absolute",
    bottom: 20,
    left: STRAP_W / 2 - 6,
    width: 12,
    height: 12,
    borderRadius: radius.full,
  },
  clip: {
    zIndex: 2,
    width: 60,
    height: CLIP_H,
    marginTop: -CLIP_OVERLAP,
    alignItems: "center",
  },
  ring: {
    width: 46,
    height: 24,
    borderWidth: 4,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },
  neck: { width: 14, height: 10, marginTop: -2, borderRadius: 3 },
  shank: {
    width: 30,
    height: 46,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 9,
    borderBottomLeftRadius: 15,
  },
  glint: { position: "absolute", left: 7, top: 10, bottom: 8, width: 2, borderRadius: 2 },
  tail: {
    width: 11,
    height: 22,
    marginTop: -4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  card: { zIndex: 1, marginTop: -CARD_OVERLAP, borderRadius: radius.badge },
  rule: { position: "absolute", top: 22, left: 20, flexDirection: "row", alignItems: "center" },
  line: { width: 26, height: 1.5, borderRadius: 2, opacity: 0.9 },
  icon: { marginLeft: 4 },
  sparkle: { marginLeft: -2 },
  serial: {
    position: "absolute",
    top: 22,
    right: 20,
    opacity: 0.95,
    fontVariant: ["tabular-nums"],
  },
  content: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "46%",
    bottom: 18,
    justifyContent: "space-between",
  },
  name: {
    marginTop: 6,
    fontFamily: font.medium,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  nameSmall: {
    marginTop: 6,
    fontFamily: font.medium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  quote: { ...type.vibe, marginTop: 8, fontSize: 19, lineHeight: 25 },
  quoteSmall: { ...type.vibeCompact, marginTop: 6, fontSize: 15, lineHeight: 20 },
  foot: { gap: 8 },
  footRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  mark: { fontFamily: font.bold, fontSize: 17, lineHeight: 20, letterSpacing: -0.6 },
  markSmall: { fontFamily: font.bold, fontSize: 15, lineHeight: 20, letterSpacing: -0.6 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4 },
})
