import type { Profile } from "@justmate/protocol"

const dir = new URL("../../../temporary/", import.meta.url)
const fence = "```"

const indent = (text: string, pad: string) =>
  text
    .split("\n")
    .map((line) => pad + line)
    .join("\n")

const list = (items: readonly string[]) => items.map((item) => `    - ${item}`).join("\n")

// same shape as docs/examples/profile_card.md
export function profileCard(id: string, profile: Profile) {
  const lines = profile.character
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const flat = lines.join(" ")
  const embedding = `Mode: ${profile.mode}.\nInterests: ${[...profile.interests].sort().join(", ")}.\nVibe: ${flat}`

  return `# just-mate — Profile Embedding Card

---

## Profile

${fence}yaml
profile:
  id: "${id}"
  mode: ${profile.mode}
  interests:
${list(profile.interests)}
  vibe: |
${indent(lines.join("\n"), "    ")}
  appearance: ${JSON.stringify(profile.appearance)}
  taste: ${JSON.stringify(profile.taste)}
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
banner_vibe: ${JSON.stringify(profile.vibe)}
${fence}

---

## Stats

${fence}yaml
stats:
  interests_count: ${profile.interests.length}
  vibe_sentences: ${lines.length}
  vibe_words: ${flat ? flat.split(/\s+/).length : 0}
  separator: " — "
  embedding_tokens_estimate: ~${Math.round(embedding.length / 4)}
${fence}
`
}

export async function saveProfileCard(id: string, profile: Profile) {
  await Bun.write(new URL(`${id}.md`, dir), profileCard(id, profile))
}
