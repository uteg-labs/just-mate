import { Elysia } from "elysia"

import { authPlugin } from "./auth/auth.plugin"
import { onboardingPlugin } from "./onboarding/onboarding.plugin"
import { venuesPlugin } from "./plans/venues.plugin"
import { profilePlugin } from "./profile/profile.plugin"
import { realtimePlugin } from "./realtime/realtime.plugin"
import { tastePlugin } from "./taste/taste.plugin"

export const app = new Elysia()
  .use(authPlugin)
  .use(profilePlugin)
  .use(onboardingPlugin)
  .use(realtimePlugin)
  .use(tastePlugin)
  .use(venuesPlugin)
  .get("/health", () => ({ ok: true }))
