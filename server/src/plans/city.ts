import type { Venue } from "@justmate/protocol"

// venues are all in one city, so plan times live in its zone whatever the server's clock says
const CITY_TZ = "Europe/Warsaw"

export const MIN_MS = 60_000
export const HOUR_MS = 60 * MIN_MS
export const DAY_MS = 24 * HOUR_MS

export type Local = { y: number; mo: number; d: number; wd: number; min: number }

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const format = new Intl.DateTimeFormat("en-GB", {
  timeZone: CITY_TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hourCycle: "h23",
})

export function local(ms: number): Local {
  const p = Object.fromEntries(format.formatToParts(ms).map((x) => [x.type, x.value]))
  return {
    y: Number(p.year),
    mo: Number(p.month),
    d: Number(p.day),
    wd: WEEKDAYS.indexOf(p.weekday ?? ""),
    min: Number(p.hour) * 60 + Number(p.minute),
  }
}

// wall-clock minute `min` on the city day that contains `dayMs`
export function atLocal(dayMs: number, min: number): number {
  const { y, mo, d } = local(dayMs)
  const guess = Date.UTC(y, mo - 1, d, 0, min)
  const seen = local(guess)
  const drift = Date.UTC(seen.y, seen.mo - 1, seen.d, 0, seen.min) - guess
  return guess - drift
}

export function minuteOf(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(":").map(Number)
  return h * 60 + m
}

// open for at least the first hour of the plan; a closing time before opening runs past midnight
export function isOpen(venue: Venue, ms: number): boolean {
  if (!venue.opens || !venue.closes) return true
  const at = local(ms).min
  const opens = minuteOf(venue.opens)
  const closes = minuteOf(venue.closes)
  const end = closes <= opens ? closes + DAY_MS / MIN_MS : closes
  return at >= opens && at + 60 <= end
}
