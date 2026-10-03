import Anthropic from "@anthropic-ai/sdk"
import type {
  QA,
  QuestionReply,
  QuestionRequest,
  RelatedReply,
  RelatedRequest,
  VibeReply,
  VibeRequest,
} from "@justmate/protocol"

import { type Question, SAMPLE_QUESTIONS, SAMPLE_RELATED, SAMPLE_VIBES } from "./samples"

const MODEL = "claude-haiku-4-5"

const QUESTION_TIMEOUT_MS = 12_000
const VIBE_TIMEOUT_MS = 10_000
const RELATED_TIMEOUT_MS = 8_000

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey, maxRetries: 0 }) : undefined

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
  prompt: string,
  schema: Record<string, unknown>,
  timeout: number,
): Promise<unknown> {
  if (!client) return

  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: { type: "json_schema", schema } },
      },
      { timeout },
    )
    const text = response.content.find((block) => block.type === "text")?.text
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

export async function writeRelated(req: RelatedRequest): Promise<RelatedReply> {
  const have = new Set([req.item, ...req.have].map((h) => h.toLowerCase()))
  const prompt = `Interest: ${req.item}
They want to ${MODE_PITCH[req.mode]}.
Already on screen: ${[...have].join(", ")}`

  const live = await ask(RELATED_SYSTEM, prompt, RELATED_SCHEMA, RELATED_TIMEOUT_MS)
  const suggested = (live as { items?: unknown } | undefined)?.items
  const items = relatedItems(Array.isArray(suggested) ? suggested : [], have)
  return { items: items.length ? items : relatedItems(SAMPLE_RELATED[req.item] ?? [], have) }
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
