import { type Position, parsePosition } from "@justmate/protocol"
import * as Location from "expo-location"
import { useEffect, useState, useSyncExternalStore } from "react"

import { ownFix, send } from "./store"

const WATCH_MS = 1000

let latest: Position | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function lastPosition() {
  return latest
}

// read-only view of the one watch, for anything besides the map that needs where you are
export function useLastPosition() {
  return useSyncExternalStore(subscribe, () => latest)
}

// the one position watch: feeds the own dot on the map and every report to the server.
// it runs only while the map needs it; reports to the server go out only while searching
export function useOwnPosition(active: boolean) {
  const [position, setPosition] = useState(latest)

  useEffect(() => {
    if (!active) return
    let subscription: Location.LocationSubscription | undefined
    let cancelled = false

    Location.requestForegroundPermissionsAsync()
      .then(async ({ granted }) => {
        if (!granted || cancelled) return
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: WATCH_MS, distanceInterval: 0 },
          ({ coords }) => {
            const parsed = parsePosition({
              lat: coords.latitude,
              lng: coords.longitude,
              acc: coords.accuracy ?? 0,
            })
            if (!parsed.ok) return
            latest = parsed.value
            ownFix(parsed.value)
            setPosition(parsed.value)
            for (const listener of listeners) listener()
          },
        )
        if (cancelled) subscription.remove()
      })
      .catch(() => {})

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [active])

  return position
}

// a standing phone may not emit new fixes, so the last one is re-sent on the server's cadence
export function usePositionReports(active: boolean, intervalMs: number) {
  useEffect(() => {
    if (!active) return

    const report = () => latest && send({ t: "position", ...latest })
    report()
    const timer = setInterval(report, intervalMs)
    return () => clearInterval(timer)
  }, [active, intervalMs])
}

export function useHeading(): number {
  const [heading, setHeading] = useState(0)

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined
    let cancelled = false

    Location.watchHeadingAsync(({ trueHeading, magHeading }) =>
      setHeading(trueHeading >= 0 ? trueHeading : magHeading),
    )
      .then((sub) => {
        subscription = sub
        if (cancelled) sub.remove()
      })
      .catch(() => {})

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])

  return heading
}
