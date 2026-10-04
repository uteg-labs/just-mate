import { DEFAULT_PROFILE, type Profile } from "@justmate/protocol"
import * as SecureStore from "expo-secure-store"

import { FLOWS, type OnboardingStep } from "./flow"

type Progress = { userId: string; step: OnboardingStep; profile: Profile }

const KEY = "justmate.onboarding"

// android can kill the app while the system camera is open; the draft brings onboarding back
export function readProgress(userId: string) {
  try {
    const saved: Progress | null = JSON.parse(SecureStore.getItem(KEY) ?? "null")
    if (saved?.userId !== userId) return
    const profile = { ...DEFAULT_PROFILE, ...saved.profile }
    const flow: readonly OnboardingStep[] = FLOWS[profile.mode]
    return { profile, index: Math.max(0, flow.indexOf(saved.step)) }
  } catch {
    return
  }
}

export function writeProgress(progress: Progress) {
  SecureStore.setItemAsync(KEY, JSON.stringify(progress)).catch(() => {})
}

export function clearProgress() {
  SecureStore.deleteItemAsync(KEY).catch(() => {})
}
