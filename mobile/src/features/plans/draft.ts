import { type Mode, type PlanInvite, type PlanUntil, parsePlanInvite } from "@justmate/protocol"

import { dayAt } from "./time"

// the invitation being written: days are offsets from today, times "HH:MM" on this phone
export type Draft = {
  mode: Mode
  category: string
  intents: string[]
  slots: Record<number, string[]>
  flex: boolean
  until: PlanUntil
  venueId: string | null
}

export const PLAN_TIMES = [
  "09:00",
  "11:00",
  "13:00",
  "15:00",
  "17:30",
  "18:00",
  "19:00",
  "19:30",
  "20:00",
  "21:00",
]

export const PLAN_DAYS = 10

// today keeps only times at least an hour away
export function timesFor(day: number): string[] {
  if (day > 0) return PLAN_TIMES
  const soonest = Date.now() + 60 * 60_000
  return PLAN_TIMES.filter((time) => dayAt(0, time).getTime() > soonest)
}

export function pickedDays(draft: Draft): number[] {
  return Object.keys(draft.slots)
    .map(Number)
    .sort((a, b) => a - b)
}

export function slotTimes(draft: Draft): number[] {
  return pickedDays(draft).flatMap((day) =>
    (draft.slots[day] ?? []).map((time) => dayAt(day, time).getTime()),
  )
}

export function inviteOf(draft: Draft): PlanInvite | undefined {
  const parsed = parsePlanInvite({
    t: "plan_invite",
    mode: draft.mode,
    category: draft.category,
    intents: draft.intents,
    slots: slotTimes(draft).map((ms) => new Date(ms).toISOString()),
    flex: draft.flex,
    venueId: draft.venueId,
    until: draft.until,
  })
  return parsed.ok ? parsed.value : undefined
}
