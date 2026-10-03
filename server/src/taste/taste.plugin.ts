import { Elysia, t } from "elysia"

import { saveProfileCard } from "./profiles"
import { listTaste, tastePhoto } from "./taste"

const dev = process.env.NODE_ENV !== "production"

export const tastePlugin = new Elysia({ name: "taste" })
  .get("/taste", listTaste)
  .get("/taste/:group/:n/photo", async ({ params, status }) => {
    const file = await tastePhoto(params.group, params.n)
    return file ?? status(404)
  })
  .post(
    "/dev/profiles",
    async ({ body, status }) => {
      if (!dev) return status(404)
      await saveProfileCard(body.id, body.markdown)
      return { ok: true }
    },
    {
      body: t.Object({
        id: t.String({ pattern: "^[A-Za-z0-9_-]{1,40}$" }),
        markdown: t.String({ maxLength: 20_000 }),
      }),
    },
  )
