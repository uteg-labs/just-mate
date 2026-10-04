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
import { resolveLanguage, type SupportedLanguage } from "../localization/i18n"
import {
  describeAppearance,
  writeCharacter,
  writeIcebreaker,
  writeQuestion,
  writeRelated,
  writeTaste,
  writeVibe,
} from "./llm"

type Context = {
  body: unknown
  request: Request
  status: (code: 400, body: unknown) => unknown
}

function route<T, R>(
  parse: (body: unknown) => Parsed<T>,
  write: (req: T, language: SupportedLanguage) => Promise<R>,
) {
  return ({ body, request, status }: Context) => {
    const parsed = parse(body)
    if (!parsed.ok) return status(400, { error: parsed.error })
    return write(parsed.value, resolveLanguage(request.headers.get("accept-language")))
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
