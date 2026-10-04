import { Elysia } from "elysia"

import { userIdForCookie } from "../auth/auth"
import { pgRepo } from "../plans/pg-repo"
import { loadPlans } from "../plans/plans"
import { isDangerousUser, loadProfile } from "../profile/profile.plugin"
import { type Client, config, connect, disconnect, receive, tick } from "./session"

const allowsDemo =
  (process.env.DEMO_MODE || String(process.env.NODE_ENV !== "production")) === "true"

const sockets = new Map<string, Client>()

loadPlans(pgRepo, loadProfile, isDangerousUser).catch((err) =>
  console.error("plans: load failed", err),
)
setInterval(tick, config.sessionIntervalMs)

export const realtimePlugin = new Elysia({ name: "realtime" }).ws("/ws", {
  open(ws) {
    const demo = allowsDemo ? ws.data.query.demo : undefined
    const client = connect(
      {
        send: (msg) => ws.send(JSON.stringify(msg)),
        close: (code, reason) => ws.close(code, reason),
      },
      { userIdForCookie, profileFor: loadProfile, isDangerous: isDangerousUser },
      demo === "a" || demo === "b" ? demo : undefined,
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
