import { parseQuestionRequest, parseRelatedRequest, parseVibeRequest } from "@justmate/protocol"
import { Elysia } from "elysia"

import { authPlugin } from "../auth/auth.plugin"
import { writeQuestion, writeRelated, writeVibe } from "./llm"

export const onboardingPlugin = new Elysia({ name: "onboarding", prefix: "/api/onboarding" })
  .use(authPlugin)
  .post(
    "/question",
    ({ body, status }) => {
      const parsed = parseQuestionRequest(body)
      return parsed.ok ? writeQuestion(parsed.value) : status(400, { error: parsed.error })
    },
    { authenticated: true },
  )
  .post(
    "/vibe",
    ({ body, status }) => {
      const parsed = parseVibeRequest(body)
      return parsed.ok ? writeVibe(parsed.value) : status(400, { error: parsed.error })
    },
    { authenticated: true },
  )
  .post(
    "/related",
    ({ body, status }) => {
      const parsed = parseRelatedRequest(body)
      return parsed.ok ? writeRelated(parsed.value) : status(400, { error: parsed.error })
    },
    { authenticated: true },
  )
