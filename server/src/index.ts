import { Elysia } from "elysia"

import { type Client, connect, disconnect, receive } from "./ws"

const port = Number(process.env.PORT ?? 3000)

const sockets = new Map<string, Client>()

const app = new Elysia()
  .get("/health", () => ({ ok: true }))
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
  .listen(port)

console.log(`server on ${app.server?.url}`)
