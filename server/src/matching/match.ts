import type { Intent, Mode } from "@justmate/protocol"

export const DATE_MATCH_ALGORITHM_VERSION =
  process.env.MATCH_SCORER_MODEL_VERSION ?? "model-v3-best"
export const MATE_MATCH_ALGORITHM_VERSION = "soft-jaccard-exact-v1"
export const RULES_MATCH_ALGORITHM_VERSION = "rules-v1"

export type MatchScoreRecord = {
  userAId: string
  userBId: string
  mode: Mode
  scoreAToB: number
  scoreBToA: number
  score: number
  algorithmVersion: string
  calculatedAt: Date
}

export function matchAlgorithmVersion(mode: Mode): string {
  return mode === "date" ? DATE_MATCH_ALGORITHM_VERSION : MATE_MATCH_ALGORITHM_VERSION
}

export type MatchOfferRecord = {
  id: string
  userAId: string
  userBId: string
  mode: Mode
  category: string
  intent: Intent
  compatibilityScore: number
  rankingScore: number
  algorithmVersion: string
  createdAt: Date
}

export type TerminalMatchState = "met" | "expired" | "dismissed" | "vanished" | "disconnected"

export type MatchStore = {
  create(record: MatchOfferRecord): Promise<void>
  activate(id: string, sessionId: string, startedAt: Date): Promise<void>
  finish(id: string, state: TerminalMatchState, endedAt: Date): Promise<void>
}
