import type { Intent, Mode } from "@justmate/protocol"

export const MATCH_ALGORITHM_VERSION = process.env.MATCH_SCORER_MODEL_VERSION ?? "model-v3-best"

export type MatchScoreRecord = {
  userAId: string
  userBId: string
  scoreAToB: number
  scoreBToA: number
  score: number
  algorithmVersion: string
  calculatedAt: Date
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
