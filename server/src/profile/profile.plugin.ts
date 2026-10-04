import { type Profile, parseProfile } from "@justmate/protocol"
import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { authPlugin } from "../auth/auth.plugin"
import { db } from "../db"
import { account, profile, session, user } from "../db/schema"
import { scheduleMatchScoreRecalculation } from "../matching/recalculation"
import { isDangerous } from "../onboarding/moderation"
import { forgetUser, invalidateMatchScores, updateProfile } from "../realtime/session"
import { saveProfileCard } from "./card"
import { embeddingInputsChanged } from "./embedding-text"

// a profile card per save, for the ML work; never in production or under test
const writesCards = !["production", "test"].includes(process.env.NODE_ENV ?? "")

export async function loadProfile(userId: string): Promise<Profile | undefined> {
  const [row] = await db.select().from(profile).where(eq(profile.userId, userId))
  if (!row) return
  const { userId: _, createdAt, updatedAt, dangerous, ...stored } = row
  return stored
}

export async function isDangerousUser(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ dangerous: profile.dangerous })
    .from(profile)
    .where(eq(profile.userId, userId))
  return row?.dangerous ?? false
}

export const profilePlugin = new Elysia({ name: "profile" })
  .use(authPlugin)
  .get(
    "/api/profile",
    async ({ user, status }) =>
      (await loadProfile(user.id)) ?? status(404, { error: "no_profile" }),
    { authenticated: true },
  )
  .put(
    "/api/profile",
    async ({ user, body, status }) => {
      const parsed = parseProfile(body)
      if (!parsed.ok) return status(400, { error: parsed.error })

      const before = await loadProfile(user.id)
      const flagged = await isDangerous([
        parsed.value.name,
        parsed.value.character,
        parsed.value.partnerCharacter,
        parsed.value.vibe,
        ...parsed.value.qa.map(({ a }) => a),
        ...parsed.value.interests,
      ])
      const [saved] = await db
        .insert(profile)
        .values({ userId: user.id, ...parsed.value, dangerous: flagged })
        .onConflictDoUpdate({
          target: profile.userId,
          set: { ...parsed.value, updatedAt: new Date(), ...(flagged && { dangerous: true }) },
        })
        .returning({ dangerous: profile.dangerous })
      updateProfile(user.id, parsed.value, saved?.dangerous ?? flagged)
      if (embeddingInputsChanged(before, parsed.value)) {
        invalidateMatchScores(user.id)
        scheduleMatchScoreRecalculation(user.id, parsed.value)
      }
      if (writesCards)
        saveProfileCard(user.id, parsed.value).catch((err) =>
          console.warn("[profile] card not saved:", err),
        )
      return parsed.value
    },
    { authenticated: true },
  )
  .delete(
    "/api/account",
    async ({ user: me, status }) => {
      await db.delete(user).where(eq(user.id, me.id))
      forgetUser(me.id)
      return status(204)
    },
    { authenticated: true },
  )
  .get(
    "/api/account/export",
    async ({ user: me }) => {
      const [stored, sessions, accounts] = await Promise.all([
        loadProfile(me.id),
        db
          .select({
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          })
          .from(session)
          .where(eq(session.userId, me.id)),
        db
          .select({ providerId: account.providerId, createdAt: account.createdAt })
          .from(account)
          .where(eq(account.userId, me.id)),
      ])
      return { user: me, profile: stored ?? null, sessions, accounts }
    },
    { authenticated: true },
  )
