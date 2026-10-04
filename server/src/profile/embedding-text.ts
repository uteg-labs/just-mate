import type { Profile } from "@justmate/protocol"

export function buildSelfText(p: Profile): string {
  return `Interests: ${p.interests.join(", ")}.\n[Self] Character: ${p.character}\n[Self] Appearance: ${p.appearance}`
}

export function buildTargetText(p: Profile): string {
  return `[Target] Character: ${p.partnerCharacter}\n[Target] Appearance: ${p.taste}`
}

export function embeddingInputsChanged(before: Profile | undefined, after: Profile): boolean {
  if (!before) return true
  return (
    buildSelfText(before) !== buildSelfText(after) ||
    buildTargetText(before) !== buildTargetText(after)
  )
}
