import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { magicLink } from "better-auth/plugins"

import { db } from "../db"
import * as schema from "../db/schema"
import { resolveLanguage } from "../localization/i18n"
import { sendMagicLink } from "./email"

const secret = process.env.BETTER_AUTH_SECRET
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

if (!secret) throw new Error("BETTER_AUTH_SECRET is required")

export const auth = betterAuth({
  appName: "JustMate",
  baseURL,
  secret,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: [
    "justmate://",
    "justmate://*",
    ...(process.env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
  ],
  advanced: { database: { joins: true, generateId: () => crypto.randomUUID() } },
  plugins: [
    expo(),
    magicLink({
      expiresIn: 600,
      storeToken: "hashed",
      sendMagicLink: ({ email, url, metadata }) =>
        sendMagicLink(email, url, resolveLanguage(metadata?.locale)),
    }),
  ],
})

export async function userIdForCookie(cookie: string): Promise<string | undefined> {
  const result = await auth.api.getSession({ headers: new Headers({ cookie }) })
  return result?.user.id
}
