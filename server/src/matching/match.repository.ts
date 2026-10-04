import { eq, ne, or, sql } from "drizzle-orm"

import { db } from "../db"
import { profile, profileEmbedding, userMatch, userMatchScore } from "../db/schema"
import { getInterestMatcher } from "./interest_matcher_http"
import { MATCH_ALGORITHM_VERSION, type MatchScoreRecord, type MatchStore } from "./match"
import { getScorer } from "./scorer_http"

export { MATCH_ALGORITHM_VERSION, type MatchScoreRecord, type MatchStore } from "./match"

export const matchStore: MatchStore = {
  async create(record) {
    await db.insert(userMatch).values(record)
  },
  async activate(id, sessionId, startedAt) {
    await db
      .update(userMatch)
      .set({ sessionId, state: "active", startedAt })
      .where(eq(userMatch.id, id))
  },
  async finish(id, state, endedAt) {
    await db.update(userMatch).set({ state, endedAt }).where(eq(userMatch.id, id))
  },
}

export async function loadMatchScoresForUser(userId: string): Promise<MatchScoreRecord[]> {
  return db
    .select()
    .from(userMatchScore)
    .where(or(eq(userMatchScore.userAId, userId), eq(userMatchScore.userBId, userId)))
}

export async function clearMatchScoresForUser(userId: string): Promise<void> {
  await db
    .delete(userMatchScore)
    .where(or(eq(userMatchScore.userAId, userId), eq(userMatchScore.userBId, userId)))
}

export async function recalculateMatchScores(userId: string): Promise<MatchScoreRecord[]> {
  const [current] = await db
    .select({
      userId: profile.userId,
      interests: profile.interests,
      selfEmb: profileEmbedding.selfEmb,
      targetEmb: profileEmbedding.targetEmb,
    })
    .from(profile)
    .innerJoin(profileEmbedding, eq(profileEmbedding.userId, profile.userId))
    .where(eq(profile.userId, userId))
    .limit(1)
  if (!current) return []

  const others = await db
    .select({
      userId: profile.userId,
      interests: profile.interests,
      selfEmb: profileEmbedding.selfEmb,
      targetEmb: profileEmbedding.targetEmb,
    })
    .from(profile)
    .innerJoin(profileEmbedding, eq(profileEmbedding.userId, profile.userId))
    .where(ne(profile.userId, userId))
  if (!others.length) return []

  const [interestMatcher, scorer] = await Promise.all([getInterestMatcher(), getScorer()])
  const interestScores = await interestMatcher.scoreBatch(
    others.flatMap((other) => [
      { interests_a: current.interests, interests_b: other.interests },
      { interests_a: other.interests, interests_b: current.interests },
    ]),
  )
  const records = await Promise.all(
    others.map(async (other, index): Promise<MatchScoreRecord> => {
      const softAB = interestScores[index * 2]?.score
      const softBA = interestScores[index * 2 + 1]?.score
      if (softAB === undefined || softBA === undefined)
        throw new Error("interest matcher returned an incomplete batch")
      const result = await scorer.pair({
        target_a: current.targetEmb,
        self_a: current.selfEmb,
        target_b: other.targetEmb,
        self_b: other.selfEmb,
        soft_ab: softAB,
        soft_ba: softBA,
      })
      const currentFirst = userId < other.userId
      return {
        userAId: currentFirst ? userId : other.userId,
        userBId: currentFirst ? other.userId : userId,
        scoreAToB: currentFirst ? result.score_ab : result.score_ba,
        scoreBToA: currentFirst ? result.score_ba : result.score_ab,
        score: result.pair_score,
        algorithmVersion: MATCH_ALGORITHM_VERSION,
        calculatedAt: new Date(),
      }
    }),
  )

  await db
    .insert(userMatchScore)
    .values(records)
    .onConflictDoUpdate({
      target: [userMatchScore.userAId, userMatchScore.userBId],
      set: {
        scoreAToB: sql`excluded."scoreAToB"`,
        scoreBToA: sql`excluded."scoreBToA"`,
        score: sql`excluded.score`,
        algorithmVersion: sql`excluded."algorithmVersion"`,
        calculatedAt: sql`excluded."calculatedAt"`,
      },
    })
  return records
}
