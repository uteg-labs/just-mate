import type { Profile } from "@justmate/protocol"

import { saveEmbeddings } from "../profile/embedding"
import { cacheMatchScores } from "../realtime/session"
import {
  clearMatchScoresForUser,
  type MatchScoreRecord,
  recalculateMatchScores,
  staleMatchScoreUsers,
} from "./match.repository"

// a profile rebuilds its embeddings before scoring; null rescores the stored ones
const queued = new Map<string, Profile | null>()
let draining = false

// AI and scorer requests never hold the profile response open. Repeated edits are
// coalesced, and one worker avoids competing writes to the same pair rows.
export function scheduleMatchScoreRecalculation(userId: string, profile: Profile) {
  queued.set(userId, profile)
  drainSoon()
}

// never downgrades a pending rebuild to a rescore
export function scheduleMatchScoreRefresh(userId: string) {
  if (queued.has(userId)) return
  queued.set(userId, null)
  drainSoon()
}

function drainSoon() {
  if (draining) return
  draining = true
  queueMicrotask(drain)
}

async function drain() {
  while (queued.size) {
    const next = queued.entries().next().value
    if (!next) break
    const [userId, profile] = next
    queued.delete(userId)
    try {
      cacheMatchScores(await (profile ? rebuild(userId, profile) : refresh(userId)))
    } catch (error) {
      console.error(`[matching] could not recalculate scores for ${userId}:`, error)
    }
  }
  draining = false
}

async function rebuild(userId: string, profile: Profile): Promise<MatchScoreRecord[]> {
  await clearMatchScoresForUser(userId)
  return (await saveEmbeddings(userId, profile)) ? recalculateMatchScores(userId) : []
}

// an earlier refresh in the same drain may have scored every pair already
async function refresh(userId: string): Promise<MatchScoreRecord[]> {
  return (await staleMatchScoreUsers(userId)).length ? recalculateMatchScores(userId) : []
}
