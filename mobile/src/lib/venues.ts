import type { LatLng, Venue, VenueKind } from "@justmate/protocol"
import type { LucideIconData } from "lucide-react-native"
import { __iconData as beer } from "lucide-react-native/icons/beer"
import { __iconData as coffee } from "lucide-react-native/icons/coffee"
import { __iconData as dice5 } from "lucide-react-native/icons/dice-5"
import { __iconData as dumbbell } from "lucide-react-native/icons/dumbbell"
import { __iconData as film } from "lucide-react-native/icons/film"
import { __iconData as gamepad2 } from "lucide-react-native/icons/gamepad-2"
import { __iconData as martini } from "lucide-react-native/icons/martini"
import { __iconData as mountain } from "lucide-react-native/icons/mountain"
import { __iconData as music } from "lucide-react-native/icons/music"
import { __iconData as palette } from "lucide-react-native/icons/palette"
import { __iconData as trees } from "lucide-react-native/icons/trees"
import { __iconData as utensils } from "lucide-react-native/icons/utensils"
import { __iconData as waves } from "lucide-react-native/icons/waves-horizontal"
import { __iconData as wine } from "lucide-react-native/icons/wine"
import { useEffect, useSyncExternalStore } from "react"

import type { IconName } from "@/components/ui"
import { api } from "./api"

const WALK_M_PER_MIN = 80
const M_PER_DEG = 111_320

// DESIGN.md §9 › Plans: venues reuse the intent glyphs
const KIND_ICON: Record<VenueKind, IconName> = {
  wine_bar: "wine",
  cafe: "coffee",
  board_game_cafe: "dice-5",
  beer_bar: "beer",
  cinema: "film",
  climbing_gym: "mountain",
  riverside: "waves",
  rooftop_bar: "martini",
  park: "trees",
  restaurant: "utensils",
  bowling: "gamepad-2",
  museum: "palette",
  jazz_club: "music",
  sports_centre: "dumbbell",
  pool: "waves",
}

// the same glyphs as SF Symbols, for the Apple Maps marker balloons
const KIND_SYMBOL: Record<VenueKind, string> = {
  wine_bar: "wineglass.fill",
  cafe: "cup.and.saucer.fill",
  board_game_cafe: "dice.fill",
  beer_bar: "mug.fill",
  cinema: "film.fill",
  climbing_gym: "figure.climbing",
  riverside: "water.waves",
  rooftop_bar: "wineglass",
  park: "tree.fill",
  restaurant: "fork.knife",
  bowling: "figure.bowling",
  museum: "building.columns.fill",
  jazz_club: "music.note",
  sports_centre: "dumbbell.fill",
  pool: "figure.pool.swim",
}

// the same glyphs as raw svg nodes, drawn into the Google Maps marker images
const KIND_GLYPH: Record<VenueKind, LucideIconData> = {
  wine_bar: wine,
  cafe: coffee,
  board_game_cafe: dice5,
  beer_bar: beer,
  cinema: film,
  climbing_gym: mountain,
  riverside: waves,
  rooftop_bar: martini,
  park: trees,
  restaurant: utensils,
  bowling: gamepad2,
  museum: palette,
  jazz_club: music,
  sports_centre: dumbbell,
  pool: waves,
}

let venues: Venue[] = []
let isAsked = false
const listeners = new Set<() => void>()

// the seeded list changes only with a server deploy: once per app run is enough
function load() {
  if (isAsked) return
  isAsked = true
  api
    .venues()
    .then((list) => {
      venues = list
      for (const listener of listeners) listener()
    })
    .catch(() => {
      isAsked = false
    })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useVenues() {
  useEffect(load, [])
  return useSyncExternalStore(subscribe, () => venues)
}

export function venueIcon(kind: VenueKind): IconName {
  return KIND_ICON[kind]
}

export function venueSymbol(kind: VenueKind): string {
  return KIND_SYMBOL[kind]
}

export function venueGlyph(kind: VenueKind): LucideIconData {
  return KIND_GLYPH[kind]
}

export function metersBetween(from: LatLng, to: LatLng): number {
  const north = (to.lat - from.lat) * M_PER_DEG
  const east = (to.lng - from.lng) * M_PER_DEG * Math.cos((from.lat * Math.PI) / 180)
  return Math.hypot(north, east)
}

export function walkMin(from: LatLng, to: LatLng): number {
  return Math.max(1, Math.round(metersBetween(from, to) / WALK_M_PER_MIN))
}
