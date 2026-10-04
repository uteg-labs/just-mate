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
import {
  describeAppearance,
  writeCharacter,
  writeIcebreaker,
  writeQuestion,
  writeRelated,
  writeTaste,
  writeVibe,
} from "./llm"

function route<T, R>(parse: (body: unknown) => Parsed<T>, write: (req: T) => Promise<R>) {
  return ({ body, status }: { body: unknown; status: (code: 400, body: unknown) => unknown }) => {
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
