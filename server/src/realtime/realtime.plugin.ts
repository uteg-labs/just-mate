import { Elysia } from "elysia"

import { userIdForCookie } from "../auth/auth"
import { type Client, connect, disconnect, receive } from "./session"

const sockets = new Map<string, Client>()

export const realtimePlugin = new Elysia({ name: "realtime" }).ws("/ws", {
  open(ws) {
    const demo = ws.data.query.demo
    const client = connect(
      {
        send: (msg) => ws.send(JSON.stringify(msg)),
        close: (code, reason) => ws.close(code, reason),
      },
      demo === "a" || demo === "b" ? demo : undefined,
      userIdForCookie,
    )
    sockets.set(ws.id, client)
  },

  async message(ws, frame) {
    const client = sockets.get(ws.id)
    if (client) await receive(client, frame)
  },

  close(ws) {
    const client = sockets.get(ws.id)
    if (client) disconnect(client)
    sockets.delete(ws.id)
  },
})
