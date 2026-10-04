import type { Profile } from "@justmate/protocol"

import { db } from "../db"
import { profileEmbedding } from "../db/schema"

const apiKey = process.env.OPENAI_API_KEY

const MODEL = "text-embedding-3-small"
const DIMENSIONS = 1536
const TIMEOUT_MS = 10_000

type Embeddings = { data: { embedding: number[] }[] }

export function buildSelfText(p: Profile): string {
  return `Interests: ${p.interests.join(", ")}.\n[Self] Character: ${p.character}\n[Self] Appearance: ${p.appearance}`
}

export function buildTargetText(p: Profile): string {
  return `[Target] Character: ${p.partnerCharacter}\n[Target] Appearance: ${p.taste}`
}

export function embeddingInputsChanged(before: Profile | undefined, after: Profile): boolean {
  if (!before) return true
  return (
    buildSelfText(before) !== buildSelfText(after) ||
    buildTargetText(before) !== buildTargetText(after)
  )
}

export async function saveEmbeddings(userId: string, profile: Profile): Promise<void> {
  if (!apiKey) return

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      input: [buildSelfText(profile), buildTargetText(profile)],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)

  const [self, target] = ((await response.json()) as Embeddings).data.map((d) => d.embedding)
  if (self?.length !== DIMENSIONS || target?.length !== DIMENSIONS)
    throw new Error("unexpected embedding size")

  await db.insert(profileEmbedding).values({ userId, selfEmb: self, targetEmb: target })
}
