import { eq, or } from "drizzle-orm"

import { db } from "../db"
import { block, profile, userMatch } from "../db/schema"
import { type BlockStore, rememberBlocks } from "./blocks"

const pairColumns = { blockerId: block.blockerId, blockedId: block.blockedId }

export const blockStore: BlockStore = {
  forUser(userId) {
    return db
      .select(pairColumns)
      .from(block)
      .where(or(eq(block.blockerId, userId), eq(block.blockedId, userId)))
  },

  async sessionPair(sessionId) {
    const [row] = await db
      .select({ a: userMatch.userAId, b: userMatch.userBId })
      .from(userMatch)
      .where(eq(userMatch.sessionId, sessionId))
    return row && [row.a, row.b]
  },

  async add(row) {
    await db.insert(block).values(row).onConflictDoNothing()
    const [blockedCount, reporters] = await Promise.all([
      db.$count(block, eq(block.blockerId, row.blockerId)),
      db.$count(block, eq(block.blockedId, row.blockedId)),
    ])
    return { blockedCount, reporters }
  },

  async pause(userId) {
    await db.update(profile).set({ dangerous: true }).where(eq(profile.userId, userId))
  },
}

// plans run for people who aren't connected, so every block is known from the start
export async function loadBlocks() {
  rememberBlocks(await db.select(pairColumns).from(block))
}
