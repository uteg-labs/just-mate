import type { LatLng, Venue, VenueKind } from "@justmate/protocol"
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

export function metersBetween(from: LatLng, to: LatLng): number {
  const north = (to.lat - from.lat) * M_PER_DEG
  const east = (to.lng - from.lng) * M_PER_DEG * Math.cos((from.lat * Math.PI) / 180)
  return Math.hypot(north, east)
}

export function walkMin(from: LatLng, to: LatLng): number {
  return Math.max(1, Math.round(metersBetween(from, to) / WALK_M_PER_MIN))
}
