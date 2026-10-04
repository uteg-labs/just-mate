import {
  APPEARANCE_MAX,
  type AppearanceReply,
  type AppearanceRequest,
  CHARACTER_MAX,
  type CharacterReply,
  type CharacterRequest,
  ICEBREAKER_MAX,
  type IcebreakerReply,
  type IcebreakerRequest,
  type QA,
  type QuestionReply,
  type QuestionRequest,
  type RelatedReply,
  type RelatedRequest,
  TASTE_MAX,
  type TasteReply,
  type TasteRequest,
  type VibeReply,
  type VibeRequest,
} from "@justmate/protocol"

import {
  type Question,
  SAMPLE_ICEBREAKERS,
  SAMPLE_QUESTIONS,
  SAMPLE_RELATED,
  SAMPLE_VIBES,
} from "./samples"

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

const QUESTION_TIMEOUT_MS = 12_000
const VIBE_TIMEOUT_MS = 10_000
const RELATED_TIMEOUT_MS = 8_000
const CHARACTER_TIMEOUT_MS = 10_000
const TASTE_TIMEOUT_MS = 8_000
const APPEARANCE_TIMEOUT_MS = 12_000
const ICEBREAKER_TIMEOUT_MS = 8_000

const apiKey = process.env.OPENAI_API_KEY

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }

const EMOJI = /\p{Extended_Pictographic}/u
const QUOTES = /["“”«»]/
const MODE_PITCH = {
  date: "meet someone to date, a few streets away",
  mate: "find people nearby for a beer, a game or a run, right now",
}

const QUESTION_SYSTEM = `You write onboarding questions for JustMate, a faceless app where people nearby meet in person: no photos, no chat. Each question reveals personality and builds on what the person already answered.

Rules:
- the question is in sentence case, under 60 characters, no emoji, no exclamation marks
- never repeat a topic that was already asked
- exactly 4 answer options, lowercase, under 26 characters each, distinct and specific
- English only`

const VIBE_SYSTEM = `You write the vibe line on a JustMate badge: the one line a match sees about a person before meeting them.

Rules:
- two short lowercase clauses joined by " — " (space, em dash, space)
- wry and specific, drawn from the answers more than the interest list
- 60 characters at most, no names, no emoji, no quotes
- English only

Examples:
quietly funny — will out-argue you about pizza
techno on fridays — crosswords on sundays
plans the trip — forgets the charger`

const RELATED_SYSTEM = `You suggest interests for a JustMate profile. Given one interest, suggest 3 closely related, more specific ones (coffee → flat white, café hopping, specialty roasters).

Rules:
- lowercase, 1 to 3 words, under 24 characters each
- none of the interests the person already sees
- English only`

const CHARACTER_SYSTEM = `You write the character of a faceless JustMate profile: what matching reads about a person, never shown to a match.

Rules:
- exactly 5 lines, one sentence each, shaped "Trait — concrete detail." (for example "Quietly funny — the kind of joke that lands three seconds late.")
- third person, warm, concrete, drawn from the answers and interests
- never invent facts, never mention looks, age, names or locations
- no heading, bullets or Markdown
- English only`

const TASTE_SYSTEM = `You summarize a JustMate user's taste in people from descriptions of the sample photos they liked.

Rules:
- find the traits that repeat across the picks (hair, build, style, mood and whatever else the descriptions share)
- use only what is written in the descriptions, never invent
- one line of comma-separated traits, at most 20 words, no heading or Markdown
- English only`

const APPEARANCE_SYSTEM = `You describe only the visible facial and hair features of the person in a photo, for a matching profile nobody else sees.

Rules:
- cover hair (color, length, style), face shape, cheekbones, eyes, eyebrows, facial hair and glasses
- one line of comma-separated traits, at most 25 words, no heading or Markdown
- never state or guess age, ethnicity, nationality, gender, weight, emotion or name, and never identify the person
- if no face is visible, answer with an empty string
- English only`

const ICEBREAKER_SYSTEM = `You write one ice-breaker for two people who just met in person through JustMate, a faceless app: the line one of them can say first.

Rules:
- a light question or playful remark, one sentence, under ${ICEBREAKER_MAX} characters
- build on an interest they share, or on the other person's vibe line
- never mention looks, age, the app, matching or how they found each other
- no pickup lines, no emoji, no quotation marks, no exclamation marks
- English only`

const textSchema = (key: string) => ({
  type: "object",
  properties: { [key]: { type: "string" } },
  required: [key],
  additionalProperties: false,
})

const QUESTION_SCHEMA = {
  type: "object",
  properties: {
    question: { type: "string" },
    options: { type: "array", items: { type: "string" } },
  },
  required: ["question", "options"],
  additionalProperties: false,
}

const VIBE_SCHEMA = {
  type: "object",
  properties: { vibe: { type: "string" } },
  required: ["vibe"],
  additionalProperties: false,
}

const RELATED_SCHEMA = {
  type: "object",
  properties: { items: { type: "array", items: { type: "string" } } },
  required: ["items"],
  additionalProperties: false,
}

async function ask(
  system: string,
  prompt: string | Part[],
  schema: Record<string, unknown>,
  timeout: number,
): Promise<unknown> {
  if (!apiKey) return

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 400,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "reply", strict: true, schema },
        },
      }),
      signal: AbortSignal.timeout(timeout),
    })
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    const text = (await response.json()).choices?.[0]?.message?.content
    return text ? JSON.parse(text) : undefined
  } catch (err) {
    console.warn(`[onboarding] ${MODEL} failed, using the sample:`, err)
  }
}

function transcript(qa: QA[]): string {
  return qa.length ? qa.map(({ q, a }) => `- ${q} → ${a}`).join("\n") : "(nothing yet)"
}

export async function writeQuestion(req: QuestionRequest): Promise<QuestionReply> {
  const prompt = `They want to ${MODE_PITCH[req.mode]}.
First name: ${req.name || "(not given)"}
Interests: ${req.interests.join(", ") || "(none yet)"}
Asked so far:
${transcript(req.qa)}

Write question ${req.qa.length + 1} of 4.`

  const live = await ask(QUESTION_SYSTEM, prompt, QUESTION_SCHEMA, QUESTION_TIMEOUT_MS)
  if (isQuestion(live, req.qa))
    return { question: live.question, options: live.options, source: "live" }

  const sample = SAMPLE_QUESTIONS[req.mode][req.qa.length % 4] as Question
  return { ...sample, source: "sample" }
}

export function isQuestion(value: unknown, asked: QA[]): value is Question {
  const { question, options } = (value ?? {}) as Partial<Question>
  if (typeof question !== "string" || !Array.isArray(options)) return false

  const isSentenceCase = /^[A-Z][^A-Z!]*$/.test(question.replace(/\bI\b/g, "i"))
  const isNew = asked.every(({ q }) => q.toLowerCase() !== question.toLowerCase())
  const isOptionOk = (o: unknown) =>
    typeof o === "string" &&
    o.length < 26 &&
    o === o.toLowerCase() &&
    !o.includes("!") &&
    !EMOJI.test(o)
  return (
    question.length < 60 &&
    isSentenceCase &&
    !EMOJI.test(question) &&
    isNew &&
    options.length === 4 &&
    options.every(isOptionOk) &&
    new Set(options).size === 4
  )
}

export async function writeVibe(req: VibeRequest): Promise<VibeReply> {
  const avoid = req.avoid ?? []
  const prompt = `They want to ${MODE_PITCH[req.mode]}.
Interests: ${req.interests.join(", ")}
Answers:
${transcript(req.qa)}
${avoid.length ? `\nAlready shown, write something different:\n${avoid.join("\n")}\n` : ""}
Write their vibe line.`

  const live = await ask(VIBE_SYSTEM, prompt, VIBE_SCHEMA, VIBE_TIMEOUT_MS)
  const vibe = (live as { vibe?: unknown } | undefined)?.vibe
  if (isVibe(vibe, avoid)) return { vibe, source: "live" }

  const fresh = SAMPLE_VIBES.filter((v) => !avoid.includes(v))
  const pool = fresh.length ? fresh : SAMPLE_VIBES
  return { vibe: pool[Math.floor(Math.random() * pool.length)] as string, source: "sample" }
}

export function isVibe(value: unknown, avoid: string[]): value is string {
  if (typeof value !== "string") return false
  const clauses = value.split(" — ")
  return (
    value.length <= 60 &&
    value === value.toLowerCase() &&
    clauses.length === 2 &&
    clauses.every((c) => c.trim() === c && c.length > 0) &&
    !QUOTES.test(value) &&
    !EMOJI.test(value) &&
    !avoid.includes(value)
  )
}

export function isIcebreaker(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= ICEBREAKER_MAX &&
    !QUOTES.test(value) &&
    !EMOJI.test(value)
  )
}

export async function writeIcebreaker(req: IcebreakerRequest): Promise<IcebreakerReply> {
  const shared = req.interests.filter((i) => req.partnerInterests.includes(i))
  const prompt = `They both ${MODE_PITCH[req.mode]}.
Shared interests: ${shared.join(", ") || "(none)"}
Their interests: ${req.partnerInterests.join(", ")}
Their vibe line: ${req.partnerVibe || "(none)"}

Write the ice-breaker.`

  const live = await ask(ICEBREAKER_SYSTEM, prompt, textSchema("line"), ICEBREAKER_TIMEOUT_MS)
  const line = (live as { line?: unknown } | undefined)?.line
  if (isIcebreaker(line)) return { line, source: "live" }

  const pool = SAMPLE_ICEBREAKERS[req.mode]
  return { line: pool[Math.floor(Math.random() * pool.length)] as string, source: "sample" }
}

export async function writeRelated(req: RelatedRequest): Promise<RelatedReply> {
  const have = new Set([req.item, ...req.have].map((h) => h.toLowerCase()))
  const prompt = `Interest: ${req.item}
They want to ${MODE_PITCH[req.mode]}.
Already on screen: ${[...have].join(", ")}`

  const live = await ask(RELATED_SYSTEM, prompt, RELATED_SCHEMA, RELATED_TIMEOUT_MS)
  const suggested = (live as { items?: unknown } | undefined)?.items
  const items = relatedItems(Array.isArray(suggested) ? suggested : [], have)
  const samples = (Object.hasOwn(SAMPLE_RELATED, req.item) && SAMPLE_RELATED[req.item]) || []
  return { items: items.length ? items : relatedItems(samples, have) }
}

function relatedItems(candidates: unknown[], have: Set<string>): string[] {
  const valid = candidates.filter(
    (c): c is string =>
      typeof c === "string" &&
      c.length > 0 &&
      c.length < 24 &&
      c === c.trim().toLowerCase() &&
      !have.has(c),
  )
  return [...new Set(valid)].slice(0, 3)
}

function textOf(value: unknown, key: string): string | undefined {
  const text = (value as Record<string, unknown> | undefined)?.[key]
  return typeof text === "string" ? text.trim() : undefined
}

export async function writeCharacter(req: CharacterRequest): Promise<CharacterReply> {
  const prompt = `They want to ${MODE_PITCH[req.mode]}.
Interests: ${req.interests.join(", ")}
Answers:
${transcript(req.qa)}

Write their character.`

  const live = textOf(
    await ask(CHARACTER_SYSTEM, prompt, textSchema("character"), CHARACTER_TIMEOUT_MS),
    "character",
  )
  if (live && live.length <= CHARACTER_MAX) return { character: live, source: "live" }
  return { character: req.qa.map(({ a }) => a).join("\n"), source: "sample" }
}

export async function writeTaste(req: TasteRequest): Promise<TasteReply> {
  if (!req.picks.length) return { taste: "", source: "sample" }

  const live = textOf(
    await ask(TASTE_SYSTEM, req.picks.join("\n"), textSchema("taste"), TASTE_TIMEOUT_MS),
    "taste",
  )
  if (live && live.length <= TASTE_MAX) return { taste: live, source: "live" }
  return { taste: req.picks.join("; ").slice(0, TASTE_MAX), source: "sample" }
}

// the photo goes to the model once and is never stored or logged
export async function describeAppearance(req: AppearanceRequest): Promise<AppearanceReply> {
  const content: Part[] = [
    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${req.photo}` } },
    { type: "text", text: "Describe the visible features." },
  ]
  const live = textOf(
    await ask(APPEARANCE_SYSTEM, content, textSchema("appearance"), APPEARANCE_TIMEOUT_MS),
    "appearance",
  )
  if (live !== undefined && live.length <= APPEARANCE_MAX)
    return { appearance: live, source: "live" }
  return { appearance: "", source: "sample" }
}
