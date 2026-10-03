import { eq } from "drizzle-orm"

import { db } from "../db"
import { plan, planAnchor } from "../db/schema"
import type { PlanRepo, PlanRow } from "./repo"

type Stored = typeof plan.$inferSelect

function toRow({ createdAt, updatedAt, startsAt, expiresAt, ...rest }: Stored): PlanRow {
  return { ...rest, startsAt: startsAt.getTime(), expiresAt: expiresAt?.getTime() ?? null }
}

function toStored(row: PlanRow) {
  return {
    ...row,
    startsAt: new Date(row.startsAt),
    expiresAt: row.expiresAt === null ? null : new Date(row.expiresAt),
  }
}

export const pgRepo: PlanRepo = {
  async load() {
    const [rows, anchors] = await Promise.all([
      db.select().from(plan),
      db.select().from(planAnchor),
    ])
    return {
      rows: rows.map(toRow),
      anchors: anchors.map((a) => [a.userId, { lat: a.lat, lng: a.lng }]),
    }
  },

  async save(row) {
    const values = toStored(row)
    await db
      .insert(plan)
      .values(values)
      .onConflictDoUpdate({ target: plan.id, set: { ...values, updatedAt: new Date() } })
  },

  async remove(id) {
    await db.delete(plan).where(eq(plan.id, id))
  },

  async saveAnchor(userId, at) {
    await db
      .insert(planAnchor)
      .values({ userId, ...at })
      .onConflictDoUpdate({ target: planAnchor.userId, set: { ...at, updatedAt: new Date() } })
  },
}
