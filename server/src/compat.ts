export const COMPAT_THRESHOLD = 0.45

export type Profile = { interests: string[]; intents: string[] }

export function compat(a: Profile, b: Profile): number {
  const shared = new Set(a.intents).intersection(new Set(b.intents)).size
  return 0.7 * jaccard(a.interests, b.interests) + 0.3 * Math.min(1, shared)
}

function jaccard(a: string[], b: string[]): number {
  const left = new Set(a)
  const right = new Set(b)
  const union = left.union(right).size
  return union ? left.intersection(right).size / union : 0
}
