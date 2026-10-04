import type { Profile } from "@justmate/protocol"

import { saveEmbeddings } from "../profile/embedding"
import { cacheMatchScores } from "../realtime/session"
import { clearMatchScoresForUser, recalculateMatchScores } from "./match.repository"

const queued = new Map<string, Profile>()
let draining = false

// AI and scorer requests never hold the profile response open. Repeated edits are
// coalesced, and one worker avoids competing writes to the same pair rows.
export function scheduleMatchScoreRecalculation(userId: string, profile: Profile) {
  queued.set(userId, profile)
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
      await clearMatchScoresForUser(userId)
      if (await saveEmbeddings(userId, profile))
        cacheMatchScores(await recalculateMatchScores(userId))
    } catch (error) {
      console.error(`[matching] could not recalculate scores for ${userId}:`, error)
    }
  }
  draining = false
}
