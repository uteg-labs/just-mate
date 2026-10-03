import type { Mode, Profile, WhenSlot } from "@justmate/protocol"

import { local, minuteOf } from "./city"

type Window = { days: number[]; from: number; to: number }

const WEEKDAYS = [1, 2, 3, 4, 5]
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

const window = (days: number[], from: string, to: string): Window => ({
  days,
  from: minuteOf(from),
  to: minuteOf(to),
})

// PROTOCOL.md › Plans rule 2
const WHEN: Record<WhenSlot, Window> = {
  "weekday mornings": window(WEEKDAYS, "08:00", "11:00"),
  "lunch breaks": window(WEEKDAYS, "11:30", "14:00"),
  "after work": window(WEEKDAYS, "17:00", "20:00"),
  "late nights": window(EVERY_DAY, "20:00", "23:30"),
  weekends: window([0, 6], "10:00", "22:00"),
}

const EVENINGS = window(EVERY_DAY, "17:00", "23:00")

function windowsOf(profile: Profile, mode: Mode): Window[] {
  if (mode === "date" || !profile.mate.when.length) return [EVENINGS]
  return profile.mate.when.map((slot) => WHEN[slot])
}

export function isFree(profile: Profile, mode: Mode, ms: number, slackMin = 0): boolean {
  const { wd, min } = local(ms)
  return windowsOf(profile, mode).some(
    (w) => w.days.includes(wd) && min >= w.from - slackMin && min < w.to + slackMin,
  )
}
