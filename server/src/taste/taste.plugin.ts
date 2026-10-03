import { Elysia } from "elysia"

import { listTaste, tastePhoto } from "./taste"

export const tastePlugin = new Elysia({ name: "taste" })
  .get("/taste", listTaste)
  .get("/taste/:group/:n/photo", async ({ params, status }) => {
    const file = await tastePhoto(params.group, params.n)
    return file ?? status(404)
  })
