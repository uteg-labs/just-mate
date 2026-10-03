import type { Bucket } from "@justmate/protocol"
import * as Haptics from "expo-haptics"
import { Vibration } from "react-native"

const { ImpactFeedbackStyle: Impact, NotificationFeedbackType: Notify } = Haptics

const BUCKET_IMPACT: Record<Exclude<Bucket, "cold">, Haptics.ImpactFeedbackStyle> = {
  warm: Impact.Light,
  hot: Impact.Medium,
  burning: Impact.Heavy,
}

export const HEARTBEAT_MS: Record<Bucket, number> = { cold: 0, warm: 3000, hot: 1500, burning: 700 }

const MATCH_PATTERN = [0, 200, 100, 200]

let isOn = true

// Settings › feel › Haptics turns every one of these off
export function setHaptics(on: boolean) {
  isOn = on
}

function when<A extends unknown[]>(fire: (...args: A) => unknown) {
  return (...args: A) => {
    if (isOn) void fire(...args)
  }
}

// DESIGN.md §14 — fire on the state change, in the same frame as the visual
export const haptic = {
  select: when(() => Haptics.selectionAsync()),
  find: when(() => Haptics.impactAsync(Impact.Medium)),
  match: when(() => {
    Vibration.vibrate(MATCH_PATTERN)
    return Haptics.notificationAsync(Notify.Success)
  }),
  unlock: when(() => Haptics.notificationAsync(Notify.Success)),
  bucket: when((bucket: Bucket) => bucket !== "cold" && Haptics.impactAsync(BUCKET_IMPACT[bucket])),
  warning: when(() => Haptics.notificationAsync(Notify.Warning)),
  vanish: when(() => Haptics.notificationAsync(Notify.Error)),
}
