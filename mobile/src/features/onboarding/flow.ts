import type { Mode, Profile } from "@justmate/protocol"
import { createContext, type Dispatch, type SetStateAction } from "react"

export const FLOWS = {
  date: ["mode", "name", "interests", "questions", "who", "swipe", "verify"],
  mate: ["mode", "name", "interests", "questions", "who", "schedule", "verify"],
} as const satisfies Record<Mode, readonly string[]>

export type OnboardingStep = (typeof FLOWS)[Mode][number]

export const GROUP = {
  mode: "welcome",
  name: "about",
  interests: "about",
  questions: "about",
  who: "who",
  swipe: "who",
  schedule: "who",
  verify: "last",
} as const satisfies Record<OnboardingStep, string>

export type StepProps = {
  profile: Profile
  setProfile: Dispatch<SetStateAction<Profile>>
  set: (patch: Partial<Profile>) => void
  next: () => void
  eyebrow: string
  isEditing: boolean
}

// the final save runs in Onboarding; every step's footer reflects it
export const SaveContext = createContext({ isSaving: false, hasFailed: false })

// the age slider tops out at 60, which stores as AGE_MAX and reads "60+"
export const SLIDER_MAX = 60

export function ageLabel(min: number, max: number) {
  return `${min} – ${max >= SLIDER_MAX ? `${SLIDER_MAX}+` : max}`
}
