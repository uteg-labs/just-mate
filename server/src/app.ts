import { Elysia } from "elysia"

import { authPlugin } from "./auth/auth.plugin"
import { onboardingPlugin } from "./onboarding/onboarding.plugin"
import { profilePlugin } from "./profile/profile.plugin"
import { realtimePlugin } from "./realtime/realtime.plugin"

export const app = new Elysia()
  .use(authPlugin)
  .use(profilePlugin)
  .use(onboardingPlugin)
  .use(realtimePlugin)
  .get("/health", () => ({ ok: true }))
