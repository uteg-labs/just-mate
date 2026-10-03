import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Material, type Scheme, Scope, useReduceMotion } from "@/components/ui"
import { dark, light } from "@/theme/colors"
import { shadowDark, shadowLight } from "@/theme/elevation"
import { radius, space } from "@/theme/layout"
import { duration, spring } from "@/theme/motion"

export type Shape =
  | "auth"
  | "onboard"
  | "select"
  | "search"
  | "match"
  | "compass"
  | "postmeet"
  | "settings"

export type MorphKind = "sheet" | "card" | "full"
export type MorphTone = "paper" | "page" | "ink" | "night"

export const SHAPES: Record<Shape, { kind: MorphKind; tone: MorphTone }> = {
  auth: { kind: "sheet", tone: "paper" },
  select: { kind: "sheet", tone: "paper" },
  search: { kind: "sheet", tone: "paper" },
  onboard: { kind: "full", tone: "page" },
  settings: { kind: "full", tone: "page" },
  match: { kind: "card", tone: "ink" },
  compass: { kind: "full", tone: "night" },
  postmeet: { kind: "full", tone: "night" },
}

const TONES: Record<MorphTone, { fill: string; scheme: Scheme }> = {
  paper: { fill: light.background, scheme: "light" },
  page: { fill: light.background, scheme: "light" },
  ink: { fill: dark.black, scheme: "dark" },
  night: { fill: dark.ink, scheme: "dark" },
}

const UNMEASURED = 320
const SETTLE = 120
const SCALE_FROM = 0.94

type Frame = { left: number; top: number; width: number; height: number; r: number }

type Screen = { width: number; height: number; top: number }

function frameOf(kind: MorphKind, height: number, screen: Screen): Frame {
  const inset = { left: space.s, width: screen.width - 2 * space.s, height, r: radius.morph }
  if (kind === "sheet") return { ...inset, top: screen.height - space.s - height }
  if (kind === "card") return { ...inset, top: screen.top }
  return { left: 0, top: 0, width: screen.width, height: screen.height, r: radius.morph + space.s }
}

type LayerProps = {
  name: Shape
  active: boolean
  width: number
  fullHeight: number
  dur: number
  reduceMotion: boolean
  render: (s: Shape) => ReactNode
  onHeight: (s: Shape, h: number) => void
}

const MorphLayer = ({
  name,
  active,
  width,
  fullHeight,
  dur,
  reduceMotion,
  render,
  onHeight,
}: LayerProps) => {
  const { kind, tone } = SHAPES[name]
  const isAuto = kind !== "full"
  const opacity = useSharedValue(active ? 1 : 0)
  const scale = useSharedValue(reduceMotion || active ? 1 : SCALE_FROM)

  useEffect(() => {
    if (active) {
      opacity.set(withDelay(dur * 0.28, withTiming(1, { duration: dur * 0.5 })))
      if (!reduceMotion) scale.set(withSpring(1, { ...spring.morph, duration: dur }))
      return
    }

    opacity.set(withTiming(0, { duration: dur * 0.22 }))
    if (!reduceMotion) scale.set(withSpring(SCALE_FROM, { ...spring.morph, duration: dur * 0.5 }))
  }, [active, dur, reduceMotion, opacity, scale])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }))

  return (
    <Scope scheme={TONES[tone].scheme}>
      <Animated.View
        pointerEvents={active ? "auto" : "none"}
        accessibilityElementsHidden={!active}
        importantForAccessibility={active ? "auto" : "no-hide-descendants"}
        onLayout={isAuto ? (e) => onHeight(name, e.nativeEvent.layout.height) : undefined}
        style={[
          styles.layer,
          { width, marginLeft: -width / 2, height: isAuto ? undefined : fullHeight },
          style,
        ]}
      >
        {render(name)}
      </Animated.View>
    </Scope>
  )
}

export type MorphProps = { shape: Shape; render: (s: Shape) => ReactNode }

// DESIGN.md §13.1 — one surface springs between shapes; its content cross-fades inside it
export const Morph = ({ shape, render }: MorphProps) => {
  const reduceMotion = useReduceMotion()
  const size = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [heights, setHeights] = useState<Partial<Record<Shape, number>>>({})
  const [layers, setLayers] = useState<Shape[]>([shape])
  const current = useRef(shape)
  const dur = reduceMotion ? duration.morphReduced : duration.morph

  const { kind, tone } = SHAPES[shape]
  const isMeasured = kind === "full" || heights[shape] !== undefined
  const screen = { width: size.width, height: size.height, top: insets.top }
  const target = frameOf(kind, heights[shape] ?? UNMEASURED, screen)
  const visible = layers.includes(shape) ? layers : [...layers, shape]
  const hasPaper = visible.some((s) => SHAPES[s].tone === "paper")
  const hasInk = visible.some((s) => SHAPES[s].tone === "ink")

  const left = useSharedValue(target.left)
  const top = useSharedValue(target.top)
  const width = useSharedValue(target.width)
  const height = useSharedValue(target.height)
  const r = useSharedValue(target.r)
  const shown = useSharedValue(0)
  const isReady = useRef(false)

  useEffect(() => {
    if (current.current === shape) return
    current.current = shape
    setLayers((ls) => (ls.includes(shape) ? ls : [...ls, shape]))
    const timer = setTimeout(() => setLayers([current.current]), dur + SETTLE)
    return () => clearTimeout(timer)
  }, [shape, dur])

  useEffect(() => {
    const move = (v: number) => {
      if (!isReady.current) return v
      if (reduceMotion) return withTiming(v, { duration: dur })
      return withSpring(v, spring.morph)
    }
    left.set(move(target.left))
    top.set(move(target.top))
    width.set(move(target.width))
    height.set(move(target.height))
    r.set(move(target.r))
    if (!isMeasured) return
    isReady.current = true
    shown.set(1)
  }, [
    target.left,
    target.top,
    target.width,
    target.height,
    target.r,
    isMeasured,
    reduceMotion,
    dur,
    left,
    top,
    width,
    height,
    r,
    shown,
  ])

  const onHeight = useCallback(
    (s: Shape, h: number) => setHeights((p) => (p[s] === h ? p : { ...p, [s]: h })),
    [],
  )

  const frameStyle = useAnimatedStyle(() => ({
    opacity: shown.get(),
    left: left.get(),
    top: top.get(),
    width: width.get(),
    height: height.get(),
  }))
  const radiusStyle = useAnimatedStyle(() => ({ borderRadius: r.get() }))

  const fill = TONES[tone].fill
  const isPaper = tone === "paper"
  const isInk = tone === "ink"
  const fadeMs = dur * 0.6
  const fillStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(fill, { duration: fadeMs }),
    opacity: withTiming(isPaper ? 0 : 1, { duration: fadeMs }),
  }))
  const materialStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPaper ? 1 : 0, { duration: fadeMs }),
  }))
  const paperShadowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPaper ? 1 : 0, { duration: dur }),
  }))
  const inkShadowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isInk ? 1 : 0, { duration: dur }),
  }))

  return (
    <Animated.View style={[styles.frame, frameStyle]}>
      {hasPaper && (
        <Animated.View
          style={[styles.fill, radiusStyle, { boxShadow: shadowLight[6] }, paperShadowStyle]}
        />
      )}
      {hasInk && (
        <Animated.View
          style={[styles.fill, radiusStyle, { boxShadow: shadowDark[8] }, inkShadowStyle]}
        />
      )}
      <Animated.View style={[styles.fill, styles.clip, radiusStyle]}>
        {hasPaper && (
          <Animated.View style={[styles.fill, materialStyle]}>
            <Scope scheme="light">
              <Material thickness="thick" style={styles.fill} />
            </Scope>
          </Animated.View>
        )}
        <Animated.View style={[styles.fill, fillStyle]} />
        {visible.map((s) => (
          <MorphLayer
            key={s}
            name={s}
            active={s === shape}
            width={frameOf(SHAPES[s].kind, 0, screen).width}
            fullHeight={size.height}
            dur={dur}
            reduceMotion={reduceMotion}
            render={render}
            onHeight={onHeight}
          />
        ))}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  frame: { position: "absolute" },
  fill: { ...StyleSheet.absoluteFill, borderCurve: "continuous" },
  clip: { overflow: "hidden" },
  layer: { position: "absolute", top: 0, left: "50%", transformOrigin: "top" },
})
