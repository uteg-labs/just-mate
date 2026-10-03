import { Elysia, t } from "elysia"

import { saveProfileCard } from "./profiles"
import { listTaste, tastePhoto } from "./taste"
import { type Client, connect, disconnect, receive } from "./ws"

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== "production"

const sockets = new Map<string, Client>()

const app = new Elysia()
  .get("/health", () => ({ ok: true }))
  .get("/taste", listTaste)
  .get("/taste/:group/:n/photo", async ({ params, status }) => {
    const file = await tastePhoto(params.group, params.n)
    return file ?? status(404)
  })
  .ws("/ws", {
    open(ws) {
      const demo = ws.data.query.demo
      const client = connect(
        {
          send: (msg) => ws.send(JSON.stringify(msg)),
          close: (code, reason) => ws.close(code, reason),
        },
        demo === "a" || demo === "b" ? demo : undefined,
      )
      sockets.set(ws.id, client)
    },

    message(ws, frame) {
      const client = sockets.get(ws.id)
      if (client) receive(client, frame)
    },

    close(ws) {
      const client = sockets.get(ws.id)
      if (client) disconnect(client)
      sockets.delete(ws.id)
    },
  })

if (dev) {
  app.post(
    "/dev/profiles",
    async ({ body }) => {
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
}

app.listen(port)

console.log(`server on ${app.server?.url}`)
