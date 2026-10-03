import { Elysia } from "elysia"

import { authPlugin } from "./auth/auth.plugin"
import { realtimePlugin } from "./realtime/realtime.plugin"
import { tastePlugin } from "./taste/taste.plugin"

export const app = new Elysia()
  .use(authPlugin)
  .use(realtimePlugin)
  .use(tastePlugin)
  .get("/health", () => ({ ok: true }))
