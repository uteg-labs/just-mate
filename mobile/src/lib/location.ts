import * as Location from "expo-location"
import { useEffect, useState } from "react"

import { send } from "./store"

export function usePositionReports(active: boolean, intervalMs: number) {
  useEffect(() => {
    if (!active) return

    let subscription: Location.LocationSubscription | undefined
    let cancelled = false

    Location.requestForegroundPermissionsAsync().then(async ({ granted }) => {
      if (!granted || cancelled) return
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: intervalMs, distanceInterval: 0 },
        ({ coords }) =>
          send({
            t: "position",
            lat: coords.latitude,
            lng: coords.longitude,
            acc: coords.accuracy ?? 0,
          }),
      )
      if (cancelled) subscription.remove()
    })

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [active, intervalMs])
}

export function useHeading(): number {
  const [heading, setHeading] = useState(0)

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined
    let cancelled = false

    Location.watchHeadingAsync(({ trueHeading, magHeading }) =>
      setHeading(trueHeading >= 0 ? trueHeading : magHeading),
    ).then((sub) => {
      subscription = sub
      if (cancelled) sub.remove()
    })

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])

  return heading
}
