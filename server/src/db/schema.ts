import type {
  DatePrefs,
  Gender,
  Intent,
  MatePrefs,
  Mode,
  PlanKind,
  PlanState,
  PlanUntil,
  QA,
  ReportReason,
  Settings,
  VenueKind,
} from "@justmate/protocol"
import { relations } from "drizzle-orm"
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const MATCH_STATES = [
  "offered",
  "active",
  "met",
  "expired",
  "dismissed",
  "vanished",
  "disconnected",
] as const
export type MatchState = (typeof MATCH_STATES)[number]

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  // written by the first onboarding prototype (0001_user_profile); superseded by `profile`, kept so its data survives
  interests: text("interests").array().default([]).notNull(),
  character: text("character"),
  appearance: text("appearance"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const profile = pgTable("profile", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  mode: text("mode").$type<Mode>().notNull(),
  name: text("name").notNull(),
  gender: text("gender").$type<Gender>().notNull(),
  age: integer("age").notNull(),
  interests: text("interests").array().notNull(),
  qa: jsonb("qa").$type<QA[]>().notNull(),
  vibe: text("vibe").notNull(),
  date: jsonb("date").$type<DatePrefs>().notNull(),
  mate: jsonb("mate").$type<MatePrefs>().notNull(),
  adult: boolean("adult").notNull(),
  verified: boolean("verified").notNull(),
  appearance: text("appearance").default("").notNull(),
  taste: text("taste").default("").notNull(),
  character: text("character").default("").notNull(),
  partnerCharacter: text("partnerCharacter").default("").notNull(),
  settings: jsonb("settings").$type<Settings>().notNull(),
  dangerous: boolean("dangerous").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
})

// PROTOCOL.md › Plans: kept until 24 h after the start, then deleted by the plan loop
export const plan = pgTable(
  "plan",
  {
    id: text("id").primaryKey(),
    kind: text("kind").$type<PlanKind>().notNull(),
    mode: text("mode").$type<Mode>().notNull(),
    category: text("category").notNull(),
    intents: jsonb("intents").$type<Intent[]>().notNull(),
    venueId: text("venueId").notNull(),
    alts: jsonb("alts").$type<string[]>().notNull(),
    slots: jsonb("slots").$type<number[]>().notNull(),
    startsAt: timestamp("startsAt", { withTimezone: true }).notNull(),
    flex: boolean("flex").notNull(),
    until: text("until").$type<PlanUntil>().notNull(),
    state: text("state").$type<PlanState>().notNull(),
    ownerId: text("ownerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    guestId: text("guestId").references(() => user.id, { onDelete: "set null" }),
    accepted: jsonb("accepted").$type<string[]>().notNull(),
    passed: jsonb("passed").$type<string[]>().notNull(),
    suggestedBy: text("suggestedBy"),
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("plan_ownerId_idx").on(table.ownerId),
    index("plan_guestId_idx").on(table.guestId),
  ],
)

// a geohash-6 cell centre per person, for picking venues halfway; never a raw position
export const planAnchor = pgTable("plan_anchor", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
})

// PROTOCOL.md › Venue: public places plans happen at; partner venues pay for the table (PRODUCT.md §7)
export const venue = pgTable("venue", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").$type<VenueKind>().notNull(),
  rating: doublePrecision("rating"),
  opens: text("opens"),
  closes: text("closes"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  modes: jsonb("modes").$type<Mode[]>().notNull(),
  fits: jsonb("fits").$type<Intent[]>().notNull(),
  partner: boolean("partner").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
})

export const profileEmbedding = pgTable("profile_embedding", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  selfEmb: real("self_emb").array().notNull(),
  targetEmb: real("target_emb").array().notNull(),
  softJacc: real("soft_jacc"),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
})

export const userMatchScore = pgTable(
  "user_match_score",
  {
    userAId: text("userAId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userBId: text("userBId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mode: text("mode").$type<Mode>().notNull(),
    scoreAToB: doublePrecision("scoreAToB").notNull(),
    scoreBToA: doublePrecision("scoreBToA").notNull(),
    score: doublePrecision("score").notNull(),
    algorithmVersion: text("algorithmVersion").notNull(),
    calculatedAt: timestamp("calculatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_match_score_userBId_idx").on(table.userBId),
    primaryKey({ columns: [table.userAId, table.userBId, table.mode] }),
  ],
)

export const userMatch = pgTable(
  "user_match",
  {
    id: text("id").primaryKey(),
    userAId: text("userAId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userBId: text("userBId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("sessionId"),
    mode: text("mode").$type<Mode>().notNull(),
    category: text("category").notNull(),
    intent: text("intent").$type<Intent>().notNull(),
    compatibilityScore: doublePrecision("compatibilityScore").notNull(),
    rankingScore: doublePrecision("rankingScore").notNull(),
    algorithmVersion: text("algorithmVersion").notNull(),
    state: text("state").$type<MatchState>().default("offered").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp("startedAt", { withTimezone: true }),
    endedAt: timestamp("endedAt", { withTimezone: true }),
  },
  (table) => [
    index("user_match_userAId_createdAt_idx").on(table.userAId, table.createdAt),
    index("user_match_userBId_createdAt_idx").on(table.userBId, table.createdAt),
    uniqueIndex("user_match_sessionId_uidx").on(table.sessionId),
  ],
)

// PROTOCOL.md › rule 12: every report blocks, both ways; two different reporters pause the reported
export const block = pgTable(
  "block",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockerId: text("blockerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blockedId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").$type<ReportReason>(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("block_blockerId_blockedId_uidx").on(table.blockerId, table.blockedId),
    index("block_blockedId_idx").on(table.blockedId),
  ],
)

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profile),
}))

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))
