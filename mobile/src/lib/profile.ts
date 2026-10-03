import { ADULT_AGE, type Profile } from "@justmate/protocol"
import { type SetStateAction, useSyncExternalStore } from "react"

import { ApiError, api } from "./api"

// undefined = not loaded yet, null = signed in without a profile (GET answered no_profile)
let current: Profile | null | undefined
const listeners = new Set<() => void>()

function set(next: Profile | null | undefined) {
  current = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useProfile() {
  return useSyncExternalStore(subscribe, () => current)
}

export async function loadProfile(): Promise<Profile | null> {
  try {
    set(await api.profile())
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error
    set(null)
  }
  return current ?? null
}

export async function saveProfile(profile: Profile) {
  const stored = await api.saveProfile({ ...profile, adult: profile.age >= ADULT_AGE })
  set(stored)
  return stored
}

// applies at once so switches feel instant; a rejected save reloads what the server holds
export function updateProfile(next: SetStateAction<Profile>) {
  if (!current) return
  const value = typeof next === "function" ? next(current) : next
  set(value)
  api.saveProfile(value).catch(() => loadProfile().catch(() => {}))
}

export function clearProfile() {
  set(undefined)
}
