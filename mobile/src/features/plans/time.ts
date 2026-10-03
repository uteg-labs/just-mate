import type { TFunction } from "i18next"

import { currentLanguage } from "@/localization/i18n"

const DAY_MS = 86_400_000

// wall-clock day difference on this phone, so "tomorrow" flips at local midnight
export function dayOffset(ms: number, now = Date.now()): number {
  const a = new Date(ms).setHours(0, 0, 0, 0)
  const b = new Date(now).setHours(0, 0, 0, 0)
  return Math.round((a - b) / DAY_MS)
}

export function dayAt(offset: number, hhmm: string): Date {
  const [h = 0, m = 0] = hhmm.split(":").map(Number)
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d
}

function format(ms: number, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(currentLanguage(), options).format(ms)
}

export function timeOf(ms: number): string {
  return format(ms, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
}

// "today" · "tomorrow" · "Thursday"
export function dayWord(t: TFunction, ms: number): string {
  const offset = dayOffset(ms)
  if (offset === 0) return t("plans.today")
  if (offset === 1) return t("plans.tomorrow")
  return format(ms, { weekday: "long" })
}

// "today" · "tomorrow" · "thu 8"
export function dayChip(t: TFunction, ms: number): string {
  const offset = dayOffset(ms)
  if (offset < 2) return dayWord(t, ms)
  return `${format(ms, { weekday: "short" })} ${new Date(ms).getDate()}`.toLowerCase()
}

// "thu 8 oct"
export function dateMono(ms: number): string {
  return format(ms, { weekday: "short", day: "numeric", month: "short" })
    .replace(",", "")
    .toLowerCase()
}

export function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function slotGroups(slots: readonly number[]): { day: number; times: number[] }[] {
  const days = new Map<number, number[]>()
  for (const ms of [...slots].sort((a, b) => a - b)) {
    const day = new Date(ms).setHours(0, 0, 0, 0)
    days.set(day, [...(days.get(day) ?? []), ms])
  }
  return [...days].map(([day, times]) => ({ day, times }))
}
