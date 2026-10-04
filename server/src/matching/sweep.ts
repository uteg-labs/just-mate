import { loadProfile } from "../profile/profile.plugin"
import { staleMatchScoreUsers, unembeddedUsers } from "./match.repository"
import { scheduleMatchScoreRecalculation, scheduleMatchScoreRefresh } from "./recalculation"

const SWEEP_INTERVAL_MS = Number(process.env.MATCH_SWEEP_INTERVAL_MS ?? 600_000)

// picks up what profile saves missed: scorer or openai down, or a new model version
export function startMatchScoreSweep() {
  sweep()
  setInterval(sweep, SWEEP_INTERVAL_MS)
}

async function sweep() {
  try {
    for (const userId of await unembeddedUsers()) {
      const profile = await loadProfile(userId)
      if (profile) scheduleMatchScoreRecalculation(userId, profile)
    }
    for (const userId of await staleMatchScoreUsers()) scheduleMatchScoreRefresh(userId)
  } catch (error) {
    console.error("[matching] score sweep skipped:", error)
  }
}
