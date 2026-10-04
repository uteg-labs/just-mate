import type { Mode, Venue } from "@justmate/protocol"
import { type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  type StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native"
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import type { Shape } from "@/components/surface/Morph"
import {
  Badge,
  Material,
  Monogram,
  type PillStatus,
  Segmented,
  StatusPill,
  useReduceMotion,
  useScheme,
} from "@/components/ui"
import { ZoneMap } from "@/components/ZoneMap"
import { SHEET_SHARE } from "@/features/plans/PlanWhereSheet"
import type { Live } from "@/lib/store"
import { useVenues } from "@/lib/venues"
import { layout, radius, space } from "@/theme/layout"
import { duration } from "@/theme/motion"
import { font, type } from "@/theme/type"

export type MapChromeProps = {
  shape: Shape
  live: Live
  picks: string
  hasActivity: boolean
  initials: string
  mode: Mode
  onMode: (mode: Mode) => void
  onProfile: () => void
  /** the where step: venues to pick from on the map; home shows every venue of the mode */
  venues?: Venue[]
  venue?: Venue
  onVenue?: (id: string) => void
}

const RISE = 8
const FADE_H = 140
const ZONE_MS = 2400
const PILL_ROW = 50
const SEGMENTED_W = 240
const SEGMENTED_H = 44

type RevealProps = { on: boolean; style: StyleProp<ViewStyle>; children: ReactNode }

// DESIGN.md §13.2 — chrome shows and hides with opacity and an 8 pt rise
const Reveal = ({ on, style, children }: RevealProps) => {
  const reduceMotion = useReduceMotion()
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(on ? 1 : 0, { duration: duration.default }),
    transform: [
      { translateY: reduceMotion ? 0 : withTiming(on ? 0 : -RISE, { duration: duration.default }) },
    ],
  }))

  return (
    <Animated.View pointerEvents={on ? "box-none" : "none"} style={[style, fade]}>
      {children}
    </Animated.View>
  )
}

export const MapChrome = ({
  shape,
  live,
  picks,
  hasActivity,
  initials,
  mode,
  onMode,
  onProfile,
  venues,
  venue,
  onVenue,
}: MapChromeProps) => {
  const { t } = useTranslation()
  const { c, shadow } = useScheme()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [zone, setZone] = useState<number>()
  const places = useVenues()

  const isAuth = shape === "auth"
  const isSearch = shape === "search"
  const isMatch = shape === "match" || shape === "planoffer"
  const status: PillStatus = live.link === "lost" ? "offline" : isSearch ? "searching" : "invisible"
  const isTracking =
    !!live.search || !!live.session || !!live.going || shape === "select" || shape === "where"
  const top = insets.top + 4
  const isHome = shape === "select" || isSearch
  const chrome = shape === "select" ? PILL_ROW + SEGMENTED_H + space.s : isSearch ? PILL_ROW : 0
  const sheet = shape === "where" ? Math.round(height * SHEET_SHARE) + space.s : 0

  useEffect(() => {
    if (zone === undefined) return
    const timer = setTimeout(() => setZone(undefined), ZONE_MS)
    return () => clearTimeout(timer)
  }, [zone])

  const scrim = useAnimatedStyle(() => ({
    opacity: withTiming(isMatch ? 1 : 0, { duration: duration.default }),
  }))

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.mapBg }]}>
      <ZoneMap
        track={isTracking}
        zones={live.search ? live.zones : []}
        hasDummy={hasActivity && isHome}
        canRecenter={isHome}
        onZone={isSearch ? setZone : undefined}
        venues={isHome ? places.filter((v) => v.modes.includes(mode)) : venues}
        selected={venue}
        onVenue={isHome ? undefined : onVenue}
        inset={{ top: top + chrome, bottom: sheet }}
      />
      <View
        pointerEvents="none"
        style={[
          styles.fade,
          { experimental_backgroundImage: `linear-gradient(${c.background}, transparent)` },
        ]}
      />

      <Reveal on={isAuth} style={[styles.brand, { top: top + 20 }]}>
        <Text style={[styles.wordmark, { color: c.fg1 }]}>just-mate</Text>
        <Text style={[type.title, styles.tagline, { color: c.fg2 }]}>
          {t("home.brand.tagline")}
        </Text>
        <Text style={[type.body, styles.line, { color: c.fg2 }]}>{t("home.brand.line")}</Text>
        <Text style={[type.mono, styles.rules, { color: c.fg2 }]}>{t("home.brand.rules")}</Text>
      </Reveal>

      <Reveal on={shape === "select" || isSearch} style={[styles.row, { top }]}>
        <StatusPill
          status={status}
          label={t(`home.${status}`)}
          detail={status === "searching" ? t("home.searchingFor", { picks }) : undefined}
        />
        <Monogram label={t("home.openSettings")} initials={initials} onPress={onProfile} />
      </Reveal>

      <Reveal on={shape === "select"} style={[styles.center, { top: top + PILL_ROW }]}>
        <View style={[styles.segmented, { boxShadow: shadow[3] }]}>
          <Material thickness="thin" style={styles.segmentedMaterial}>
            <Segmented
              items={[
                { value: "date", label: t("modes.date"), icon: "heart" },
                { value: "mate", label: t("modes.mate"), icon: "users" },
              ]}
              value={mode}
              onChange={onMode}
              style={styles.clear}
            />
          </Material>
        </View>
      </Reveal>

      <Reveal on={isSearch && zone !== undefined} style={[styles.center, { top: top + PILL_ROW }]}>
        <Material thickness="thin" style={styles.zone}>
          <Badge color="glow" variant="dot" label={t("home.zone", { n: zone ?? 0 })} />
        </Material>
      </Reveal>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, scrim]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fade: { position: "absolute", top: 0, left: 0, right: 0, height: FADE_H },
  brand: { position: "absolute", left: layout.sheetPadding, right: layout.sheetPadding },
  wordmark: { fontFamily: font.bold, fontSize: 56, lineHeight: 56, letterSpacing: -2 },
  tagline: { marginTop: 10 },
  line: { marginTop: 6 },
  rules: { marginTop: 18 },
  row: {
    position: "absolute",
    left: layout.gutter,
    right: layout.gutter,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  segmented: { width: SEGMENTED_W, borderRadius: radius.pill },
  segmentedMaterial: { borderRadius: radius.pill },
  clear: { backgroundColor: "transparent" },
  zone: { borderRadius: radius.pill, padding: 4 },
})
