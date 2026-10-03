import { Elysia } from "elysia"

import { authPlugin } from "./auth/auth.plugin"
import { realtimePlugin } from "./realtime/realtime.plugin"

export const app = new Elysia()
  .use(authPlugin)
  .use(realtimePlugin)
  .get("/health", () => ({ ok: true }))
