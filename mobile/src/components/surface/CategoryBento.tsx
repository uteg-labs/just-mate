import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native"
import Animated, {
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import {
  AnimatedPressable,
  Chip,
  Icon,
  IconButton,
  type IconName,
  Scope,
  usePress,
  useReduceMotion,
  useScheme,
} from "@/components/ui"
import { toggle } from "@/lib/list"
import { radius, space } from "@/theme/layout"
import { duration, spring } from "@/theme/motion"
import { font, type } from "@/theme/type"

export type BentoCategory = { id: string; label: string; icon: IconName; intents: string[] }

export type CategoryBentoProps = {
  categories: BentoCategory[]
  selected: string | null
  onPick: (id: string | null) => void
  picks: string[]
  onPicks: (next: string[]) => void
}

const GAP = space.s
const ROW = 88
const PILL = 52
const OTHER = "other"
const RADIUS = { tile: radius.tile, open: radius.tileOpen, pill: radius.tilePill } as const

// [col, row, colSpan, rowSpan]: A A B / A A C / D E F
const SLOTS = [
  [0, 0, 2, 2],
  [2, 0, 1, 1],
  [2, 1, 1, 1],
  [0, 2, 1, 1],
  [1, 2, 1, 1],
  [2, 2, 1, 1],
] as const

type Mode = "tile" | "pill" | "open"

type Place = { x: number; y: number; w: number; h: number; tw: number; th: number; mode: Mode }

function placeOf(index: number, selected: number, width: number): Place {
  const cell = (width - 2 * GAP) / 3
  const [col, row, cols, rows] = SLOTS[index]
  const tw = cols * cell + (cols - 1) * GAP
  const th = rows * ROW + (rows - 1) * GAP
  const tile = { x: col * (cell + GAP), y: row * (ROW + GAP), w: tw, h: th, tw, th }
  if (selected < 0) return { ...tile, mode: "tile" }
  if (index === selected) return { ...tile, x: 0, y: 0, w: width, h: width, mode: "open" }

  const pill = (width - 4 * GAP) / 5
  const slot = index < selected ? index : index - 1
  return { ...tile, x: slot * (pill + GAP), y: width + GAP, w: pill, h: PILL, mode: "pill" }
}

function settle(value: number, isStill: boolean) {
  "worklet"
  return isStill ? value : withSpring(value, spring.bento)
}

type LayerProps = { on: boolean; style: StyleProp<ViewStyle>; children: ReactNode }

const Layer = ({ on, style, children }: LayerProps) => {
  const reduceMotion = useReduceMotion()
  const fade = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: withTiming(on ? 1 : 0, { duration: duration.fade }) }
    if (!on) return { opacity: withTiming(0, { duration: duration.bento * 0.2 }) }
    return {
      opacity: withDelay(duration.bento * 0.25, withTiming(1, { duration: duration.bento * 0.5 })),
    }
  })

  return (
    <Animated.View
      pointerEvents={on ? "auto" : "none"}
      importantForAccessibility={on ? "auto" : "no-hide-descendants"}
      accessibilityElementsHidden={!on}
      style={[styles.layer, style, fade]}
    >
      {children}
    </Animated.View>
  )
}

type TileProps = {
  category: BentoCategory
  place: Place
  width: number
  picks: string[]
  onPick: (id: string | null) => void
  onPicks: (next: string[]) => void
}

const BentoTile = ({ category, place, width, picks, onPick, onPicks }: TileProps) => {
  const { c, shadow } = useScheme()
  const reduceMotion = useReduceMotion()
  const { style: pressStyle, handlers } = usePress()
  const { x, y, w, h, tw, th, mode } = place
  const isOpen = mode === "open"
  const isBig = th > ROW
  const r = RADIUS[mode]
  const fill = isOpen ? c.fg1 : c.surfaceCard
  const pill = (width - 4 * GAP) / 5

  const frame = useAnimatedStyle(() => ({
    left: settle(x, reduceMotion),
    top: settle(y, reduceMotion),
    width: settle(w, reduceMotion),
    height: settle(h, reduceMotion),
    borderRadius: settle(r, reduceMotion),
    backgroundColor: withTiming(fill, { duration: duration.bento * 0.5 }),
  }))

  return (
    <AnimatedPressable
      {...(isOpen ? {} : handlers)}
      onPress={isOpen ? undefined : () => onPick(category.id)}
      accessibilityRole={isOpen ? undefined : "button"}
      accessibilityLabel={isOpen ? undefined : category.label}
      style={[styles.tile, { boxShadow: isOpen ? shadow[6] : shadow[2] }, frame, pressStyle]}
    >
      <Layer
        on={mode === "tile"}
        style={[styles.face, { width: tw, height: th, padding: isBig ? 14 : 12 }]}
      >
        <Icon name={category.icon} size={isBig ? 26 : 22} />
        <Text style={[type.labelMd, styles.label, { color: c.fg1 }]}>{category.label}</Text>
      </Layer>

      <Layer on={mode === "pill"} style={[styles.pill, { width: pill, height: PILL }]}>
        <Icon name={category.icon} size={20} />
      </Layer>

      <Layer on={isOpen} style={{ width, height: width }}>
        <Scope scheme="dark">
          <OpenCard
            category={category}
            picks={picks}
            onClose={() => onPick(null)}
            onToggle={(intent) => onPicks(toggle(picks, intent))}
          />
        </Scope>
      </Layer>
    </AnimatedPressable>
  )
}

type OpenCardProps = {
  category: BentoCategory
  picks: string[]
  onClose: () => void
  onToggle: (intent: string) => void
}

const OpenCard = ({ category, picks, onClose, onToggle }: OpenCardProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()

  return (
    <View style={styles.open}>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: c.tint }]}>
          <Icon name={category.icon} size={24} strokeWidth={1.75} />
        </View>
        <IconButton icon="x" label={t("bento.close")} variant="ghost" size={36} onPress={onClose} />
      </View>
      <Text style={[type.largeTitle, styles.title, { color: c.fg1 }]}>{category.label}</Text>
      <Text style={[type.mono, styles.count, { color: c.fg2 }]}>
        {t("bento.picks", { n: picks.length })}
      </Text>
      <View style={styles.chips}>
        {[...category.intents, OTHER].map((intent) => (
          <Chip
            key={intent}
            size="sm"
            label={
              intent === OTHER ? t("bento.other") : t(`vocab.${intent}`, { defaultValue: intent })
            }
            icon={intent === OTHER ? "plus" : undefined}
            selected={picks.includes(intent)}
            onPress={() => onToggle(intent)}
          />
        ))}
      </View>
    </View>
  )
}

// DESIGN.md §13.3 — a tile grows into a square card, the rest fold into an icon strip under it
export const CategoryBento = ({
  categories,
  selected,
  onPick,
  picks,
  onPicks,
}: CategoryBentoProps) => {
  const reduceMotion = useReduceMotion()
  const [width, setWidth] = useState(0)
  const index = categories.findIndex((c) => c.id === selected)
  const height = index < 0 ? 3 * ROW + 2 * GAP : width + GAP + PILL

  const grow = useAnimatedStyle(() => ({ height: settle(height, reduceMotion) }))

  return (
    <Animated.View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={grow}>
      {width > 0 &&
        categories
          .slice(0, SLOTS.length)
          .map((category, i) => (
            <BentoTile
              key={category.id}
              category={category}
              place={placeOf(i, index, width)}
              width={width}
              picks={picks}
              onPick={onPick}
              onPicks={onPicks}
            />
          ))}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tile: { position: "absolute", overflow: "hidden", borderCurve: "continuous" },
  layer: { position: "absolute", top: 0, left: 0 },
  face: { justifyContent: "space-between" },
  label: { fontFamily: font.semibold },
  pill: { alignItems: "center", justifyContent: "center" },
  open: { flex: 1, padding: 18 },
  head: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  badge: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 14 },
  count: { marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: GAP, marginTop: "auto", paddingTop: 14 },
})
