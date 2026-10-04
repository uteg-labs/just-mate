import {
  type Parsed,
  parseAppearanceRequest,
  parseCharacterRequest,
  parseIcebreakerRequest,
  parseQuestionRequest,
  parseRelatedRequest,
  parseTasteRequest,
  parseVibeRequest,
} from "@justmate/protocol"
import { Elysia } from "elysia"

import { authPlugin } from "../auth/auth.plugin"
import { fixedWindow } from "../rate-limit"
import {
  describeAppearance,
  writeCharacter,
  writeIcebreaker,
  writeQuestion,
  writeRelated,
  writeTaste,
  writeVibe,
} from "./llm"

type Ctx = {
  body: unknown
  user: { id: string }
  status: (code: 400 | 429, body: unknown) => unknown
}

const LLM_CALLS_MAX = Number(process.env.ONBOARDING_LLM_CALLS_MAX ?? 60)
const LLM_WINDOW_MS = Number(process.env.ONBOARDING_LLM_WINDOW_MS ?? 10 * 60_000)
const allowCall = fixedWindow(LLM_CALLS_MAX, LLM_WINDOW_MS)

function route<T, R>(parse: (body: unknown) => Parsed<T>, write: (req: T) => Promise<R>) {
  return ({ body, user, status }: Ctx) => {
    if (!allowCall(user.id)) return status(429, { error: "rate_limited" })
    const parsed = parse(body)
    return parsed.ok ? write(parsed.value) : status(400, { error: parsed.error })
  }
}

export const onboardingPlugin = new Elysia({ name: "onboarding", prefix: "/api/onboarding" })
  .use(authPlugin)
  .post("/question", route(parseQuestionRequest, writeQuestion), { authenticated: true })
  .post("/vibe", route(parseVibeRequest, writeVibe), { authenticated: true })
  .post("/related", route(parseRelatedRequest, writeRelated), { authenticated: true })
  .post("/character", route(parseCharacterRequest, writeCharacter), { authenticated: true })
  .post("/taste", route(parseTasteRequest, writeTaste), { authenticated: true })
  .post("/icebreaker", route(parseIcebreakerRequest, writeIcebreaker), { authenticated: true })
  .post("/appearance", route(parseAppearanceRequest, describeAppearance), {
    authenticated: true,
  })
