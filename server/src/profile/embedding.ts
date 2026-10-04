import type { Profile } from "@justmate/protocol"

import { db } from "../db"
import { profileEmbedding } from "../db/schema"
import { buildSelfText, buildTargetText } from "./embedding-text"

const apiKey = process.env.OPENAI_API_KEY

const MODEL = "text-embedding-3-small"
const DIMENSIONS = 1536
const TIMEOUT_MS = 10_000

type Embeddings = { data: { embedding: number[] }[] }

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

  await db
    .insert(profileEmbedding)
    .values({ userId, selfEmb: self, targetEmb: target })
    .onConflictDoUpdate({
      target: profileEmbedding.userId,
      set: { selfEmb: self, targetEmb: target, softJacc: null, updatedAt: new Date() },
    })
}
