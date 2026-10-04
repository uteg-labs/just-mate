import { and, eq, isNull, ne, or, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

import { db } from "../db"
import { profile, profileEmbedding, userMatch, userMatchScore } from "../db/schema"
import { getInterestMatcher } from "./interest_matcher_http"
import {
  DATE_MATCH_ALGORITHM_VERSION,
  MATE_MATCH_ALGORITHM_VERSION,
  type MatchScoreRecord,
  type MatchStore,
} from "./match"
import { getScorer } from "./scorer_http"

export {
  DATE_MATCH_ALGORITHM_VERSION,
  MATE_MATCH_ALGORITHM_VERSION,
  type MatchScoreRecord,
  type MatchStore,
} from "./match"

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

// users missing a current-version score against at least one other embedded user
export async function staleMatchScoreUsers(userId?: string): Promise<string[]> {
  const other = alias(profileEmbedding, "other")
  const dateScore = alias(userMatchScore, "date_score")
  const mateScore = alias(userMatchScore, "mate_score")
  const rows = await db
    .selectDistinct({ userId: profileEmbedding.userId })
    .from(profileEmbedding)
    .innerJoin(other, ne(other.userId, profileEmbedding.userId))
    .leftJoin(
      dateScore,
      and(
        eq(dateScore.mode, "date"),
        eq(dateScore.algorithmVersion, DATE_MATCH_ALGORITHM_VERSION),
        or(
          and(eq(dateScore.userAId, profileEmbedding.userId), eq(dateScore.userBId, other.userId)),
          and(eq(dateScore.userAId, other.userId), eq(dateScore.userBId, profileEmbedding.userId)),
        ),
      ),
    )
    .leftJoin(
      mateScore,
      and(
        eq(mateScore.mode, "mate"),
        eq(mateScore.algorithmVersion, MATE_MATCH_ALGORITHM_VERSION),
        or(
          and(eq(mateScore.userAId, profileEmbedding.userId), eq(mateScore.userBId, other.userId)),
          and(eq(mateScore.userAId, other.userId), eq(mateScore.userBId, profileEmbedding.userId)),
        ),
      ),
    )
    .where(
      and(
        or(isNull(dateScore.userAId), isNull(mateScore.userAId)),
        userId ? eq(profileEmbedding.userId, userId) : undefined,
      ),
    )
  return rows.map((row) => row.userId)
}

export async function unembeddedUsers(): Promise<string[]> {
  const rows = await db
    .select({ userId: profile.userId })
    .from(profile)
    .leftJoin(profileEmbedding, eq(profileEmbedding.userId, profile.userId))
    .where(isNull(profileEmbedding.userId))
  return rows.map((row) => row.userId)
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

  const dateScore = alias(userMatchScore, "date_score")
  const mateScore = alias(userMatchScore, "mate_score")
  const candidates = await db
    .select({
      userId: profile.userId,
      interests: profile.interests,
      selfEmb: profileEmbedding.selfEmb,
      targetEmb: profileEmbedding.targetEmb,
      dateScore: dateScore.userAId,
      mateScore: mateScore.userAId,
    })
    .from(profile)
    .innerJoin(profileEmbedding, eq(profileEmbedding.userId, profile.userId))
    .leftJoin(
      dateScore,
      and(
        eq(dateScore.mode, "date"),
        eq(dateScore.algorithmVersion, DATE_MATCH_ALGORITHM_VERSION),
        or(
          and(eq(dateScore.userAId, userId), eq(dateScore.userBId, profile.userId)),
          and(eq(dateScore.userAId, profile.userId), eq(dateScore.userBId, userId)),
        ),
      ),
    )
    .leftJoin(
      mateScore,
      and(
        eq(mateScore.mode, "mate"),
        eq(mateScore.algorithmVersion, MATE_MATCH_ALGORITHM_VERSION),
        or(
          and(eq(mateScore.userAId, userId), eq(mateScore.userBId, profile.userId)),
          and(eq(mateScore.userAId, profile.userId), eq(mateScore.userBId, userId)),
        ),
      ),
    )
    .where(ne(profile.userId, userId))
  const others = candidates.filter((other) => !other.dateScore || !other.mateScore)
  if (!others.length) return []

  const interestMatcher = await getInterestMatcher()
  const scorer = others.some((other) => !other.dateScore) ? await getScorer() : undefined
  const interestScores = await interestMatcher.scoreBatch(
    others.flatMap((other) => [
      { interests_a: current.interests, interests_b: other.interests },
      { interests_a: other.interests, interests_b: current.interests },
    ]),
  )
  const records = (
    await Promise.all(
      others.map(async (other, index): Promise<MatchScoreRecord[]> => {
        const softAB = interestScores[index * 2]?.score
        const softBA = interestScores[index * 2 + 1]?.score
        if (softAB === undefined || softBA === undefined)
          throw new Error("interest matcher returned an incomplete batch")
        const result = other.dateScore
          ? undefined
          : await scorer?.pair({
              target_a: current.targetEmb,
              self_a: current.selfEmb,
              target_b: other.targetEmb,
              self_b: other.selfEmb,
              soft_ab: softAB,
              soft_ba: softBA,
            })
        const currentFirst = userId < other.userId
        const userAId = currentFirst ? userId : other.userId
        const userBId = currentFirst ? other.userId : userId
        const exact = interestJaccard(current.interests, other.interests)
        const mateAToB = Math.max(currentFirst ? softAB : softBA, exact)
        const mateBToA = Math.max(currentFirst ? softBA : softAB, exact)
        const calculatedAt = new Date()
        const dateRecord: MatchScoreRecord[] = result
          ? [
              {
                userAId,
                userBId,
                mode: "date",
                scoreAToB: currentFirst ? result.score_ab : result.score_ba,
                scoreBToA: currentFirst ? result.score_ba : result.score_ab,
                score: result.pair_score,
                algorithmVersion: DATE_MATCH_ALGORITHM_VERSION,
                calculatedAt,
              },
            ]
          : []
        const mateRecord: MatchScoreRecord[] = other.mateScore
          ? []
          : [
              {
                userAId,
                userBId,
                mode: "mate",
                scoreAToB: mateAToB,
                scoreBToA: mateBToA,
                score: (mateAToB + mateBToA) / 2,
                algorithmVersion: MATE_MATCH_ALGORITHM_VERSION,
                calculatedAt,
              },
            ]
        return [...dateRecord, ...mateRecord]
      }),
    )
  ).flat()

  await db
    .insert(userMatchScore)
    .values(records)
    .onConflictDoUpdate({
      target: [userMatchScore.userAId, userMatchScore.userBId, userMatchScore.mode],
      set: scoreUpdate(),
    })
  return records
}

function scoreUpdate() {
  return {
    scoreAToB: sql`excluded."scoreAToB"`,
    scoreBToA: sql`excluded."scoreBToA"`,
    score: sql`excluded.score`,
    algorithmVersion: sql`excluded."algorithmVersion"`,
    calculatedAt: sql`excluded."calculatedAt"`,
  }
}

function interestJaccard(a: string[], b: string[]): number {
  const left = new Set(a)
  const right = new Set(b)
  const union = left.union(right).size
  return union ? left.intersection(right).size / union : 0
}
