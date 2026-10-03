import type {
  AppearanceReply,
  AppearanceRequest,
  CharacterReply,
  CharacterRequest,
  Profile,
  QuestionReply,
  QuestionRequest,
  RelatedReply,
  RelatedRequest,
  TasteReply,
  TasteRequest,
  TasteSample,
  VibeReply,
  VibeRequest,
} from "@justmate/protocol"

import { apiURL, authClient } from "./auth-client"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
  }
}

// expo has no cookie jar: the session cookie travels by hand, and `omit` keeps fetch from adding its own
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { cookie: await authClient.getCookie() }
  if (body !== undefined) headers["content-type"] = "application/json"

  const res = await fetch(`${apiURL}${path}`, {
    method,
    headers,
    credentials: "omit",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const reply = await res.json().catch(() => ({}))
    throw new ApiError(res.status, reply.error ?? `http_${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  profile: () => request<Profile>("GET", "/api/profile"),
  saveProfile: (profile: Profile) => request<Profile>("PUT", "/api/profile", profile),
  deleteAccount: () => request<void>("DELETE", "/api/account"),
  exportAccount: () => request<unknown>("GET", "/api/account/export"),

  question: (body: QuestionRequest) =>
    request<QuestionReply>("POST", "/api/onboarding/question", body),
  vibe: (body: VibeRequest) => request<VibeReply>("POST", "/api/onboarding/vibe", body),
  related: (body: RelatedRequest) => request<RelatedReply>("POST", "/api/onboarding/related", body),
  character: (body: CharacterRequest) =>
    request<CharacterReply>("POST", "/api/onboarding/character", body),
  taste: (body: TasteRequest) => request<TasteReply>("POST", "/api/onboarding/taste", body),
  appearance: (body: AppearanceRequest) =>
    request<AppearanceReply>("POST", "/api/onboarding/appearance", body),

  tasteSamples: () => request<TasteSample[]>("GET", "/taste"),
}
