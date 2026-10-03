import type { Intent } from "@justmate/protocol"

const url = process.env.EXPO_PUBLIC_LLM_URL ?? "http://localhost:11434"
const model = process.env.EXPO_PUBLIC_LLM_MODEL ?? "qwen2.5:7b-instruct"

export const QUESTIONS = 1

export type QA = { question: string; answer: string }

const FALLBACK = [
  "What does a perfect spontaneous hour with a stranger look like for you?",
  "What is something small that always makes your day better?",
  "How would your friends describe you in one sentence?",
  "What is a place in your city you would take a new friend to?",
  "What topic can you talk about for hours without noticing?",
  "Are you more of a plan-everything or a let-it-happen person?",
  "What was the best part of your last weekend?",
  "What small thing makes you like someone instantly?",
  "What are you curious about lately?",
  "What would make a first meeting with a stranger feel easy for you?",
]

const INTERVIEWER =
  "You interview a user of a faceless meet-in-person app to learn their personality. " +
  "Ask exactly ONE short, friendly, open-ended question. Build on their interests and previous " +
  "answers, go a little deeper each time, never repeat a question. Never ask about looks, age, " +
  'job, name or location. Reply only with JSON: {"question": "..."}'

const VIBE_WRITER =
  "You write the vibe of a faceless profile for a meet-in-person app: exactly 5 lines, one " +
  "sentence each, shaped 'Trait — concrete detail.' (for example 'Quietly funny — the kind of " +
  "joke that lands three seconds late.'). Third person, warm, concrete. Never invent facts or " +
  "mention looks, age, names or locations. No heading, bullets or Markdown, only the 5 lines."

const KEEP_ALIVE = "30m"

type Options = { maxTokens: number; json?: boolean }

export const warmUp = () =>
  fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, keep_alive: KEEP_ALIVE }),
  }).catch(() => undefined)

async function chat(system: string, user: string, { maxTokens, json }: Options): Promise<string> {
  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      keep_alive: KEEP_ALIVE,
      format: json ? "json" : undefined,
      options: { num_ctx: 2048, num_predict: maxTokens },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`llm ${res.status}: ${await res.text()}`)
  return (await res.json()).message.content
}

const transcript = (qa: QA[]) => qa.map((x) => `Q: ${x.question}\nA: ${x.answer}`).join("\n\n")

const brief = (intents: Intent[], interests: string[]) =>
  `Looking for: ${intents.join(", ")}\nInterests: ${interests.join(", ")}`

export async function nextQuestion(
  intents: Intent[],
  interests: string[],
  history: QA[],
): Promise<string> {
  try {
    const prompt = `${brief(intents, interests)}\n\n${transcript(history)}\n\nAsk question ${history.length + 1} of ${QUESTIONS}.`
    const { question } = JSON.parse(await chat(INTERVIEWER, prompt, { json: true, maxTokens: 80 }))
    if (typeof question === "string" && question.trim()) return question.trim()
  } catch (error) {
    console.warn("[llm] canned question:", error)
  }
  return FALLBACK[history.length % FALLBACK.length] ?? ""
}

const TASTE_WRITER =
  "You summarize a user's taste in people from descriptions of the reference photos they picked. " +
  "Find the traits that repeat across the picks (hair, build, style, mood and whatever else the " +
  "descriptions share). Use only what is written in the descriptions, never invent. Output a " +
  "single line of comma-separated traits, max 20 words, no heading or Markdown."

export async function describeTaste(picks: { group: string; description: string }[]) {
  if (!picks.length) return "none"
  try {
    const list = picks.map((p) => `${p.group}: ${p.description}`).join("\n")
    return (await chat(TASTE_WRITER, list, { maxTokens: 60 })).trim()
  } catch (error) {
    console.warn("[llm] taste fell back to raw descriptions:", error)
    return picks.map((p) => p.description).join("; ")
  }
}

export async function writeVibe(
  intents: Intent[],
  interests: string[],
  history: QA[],
): Promise<string> {
  try {
    const prompt = `${brief(intents, interests)}\n\n${transcript(history)}`
    const md = await chat(VIBE_WRITER, prompt, { maxTokens: 220 })
    return md.replace(/^```(?:markdown|md)?\s*|\s*```$/gi, "").trim()
  } catch (error) {
    console.warn("[llm] vibe fell back to raw answers:", error)
    return history.map((x) => x.answer.replace(/\s+/g, " ")).slice(0, 5).join("\n")
  }
}
