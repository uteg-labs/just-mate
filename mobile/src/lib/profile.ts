import type { Intent } from "@justmate/protocol"

const api = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

const fence = "```"

const indent = (text: string, pad: string) =>
  text
    .split("\n")
    .map((line) => pad + line)
    .join("\n")

const list = (items: string[]) => items.map((item) => `    - ${item}`).join("\n")

export const newProfileId = () => `u_${Math.random().toString(36).slice(2, 10)}`

// same shape as docs/examples/profile_card.md
export function profileCard(
  id: string,
  intents: Intent[],
  interests: string[],
  vibe: string,
  taste: string,
) {
  const lines = vibe
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean)
  const flat = lines.join(" ")
  const embedding = `Intent: ${intents.join(", ")}.\nInterests: ${[...interests].sort().join(", ")}.\nVibe: ${flat}`

  return `# just-mate — Profile Embedding Card

---

## Profile

${fence}yaml
profile:
  id: "${id}"
  intents:
${list(intents)}
  interests:
${list(interests)}
  vibe: |
${indent(lines.join("\n"), "    ")}
  taste: ${JSON.stringify(taste)}
${fence}

---

## \`embedding_text\`

${fence}yaml
embedding_text: |
${indent(embedding, "  ")}
${fence}

---

## \`banner_vibe\`

${fence}yaml
banner_vibe: |
${indent(`"${lines.join("\n")}"`, "  ")}
${fence}

---

## Stats

${fence}yaml
stats:
  intents_count: ${intents.length}
  interests_count: ${interests.length}
  vibe_sentences: ${lines.length}
  vibe_words: ${flat.split(/\s+/).length}
  vibe_pattern: "trait-concrete-${lines.length}"
  separator: " — "
  embedding_tokens_estimate: ~${Math.round(embedding.length / 4)}
${fence}
`
}

export async function saveProfileCard(id: string, markdown: string) {
  try {
    const res = await fetch(`${api}/dev/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, markdown }),
    })
    if (!res.ok) throw new Error(`${res.status}`)
  } catch (error) {
    console.warn("[profile] card not saved:", error)
  }
}
