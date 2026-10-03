import { INTERESTS } from "@justmate/protocol"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"

import { authPlugin } from "../auth/auth.plugin"
import { db } from "../db"
import { user as users } from "../db/schema"

const known: readonly string[] = INTERESTS

export const profilePlugin = new Elysia({ name: "profile" }).use(authPlugin).put(
  "/api/profile",
  async ({ user, body }) => {
    await db
      .update(users)
      .set({
        interests: [...new Set(body.interests)].filter((i) => known.includes(i)),
        character: body.character,
        appearance: body.appearance,
      })
      .where(eq(users.id, user.id))
    return { ok: true }
  },
  {
    authenticated: true,
    body: t.Object({
      interests: t.Array(t.String(), { maxItems: 20 }),
      character: t.String({ maxLength: 2000 }),
      appearance: t.Nullable(t.String({ maxLength: 1000 })),
    }),
  },
)
