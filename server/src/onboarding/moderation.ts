const apiKey = process.env.OPENAI_API_KEY

const TIMEOUT_MS = 8_000

const BLOCKED = new Set([
  "harassment",
  "harassment/threatening",
  "hate",
  "hate/threatening",
  "violence",
  "violence/graphic",
  "sexual/minors",
  "illicit/violent",
])

type Moderation = { results?: { categories?: Record<string, boolean> }[] }

export async function isDangerous(texts: string[]): Promise<boolean> {
  const input = texts
    .map((text) => text.trim())
    .filter(Boolean)
    .join("\n")
  if (!apiKey || !input) return false

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    const { results = [] } = (await response.json()) as Moderation
    return results.some(({ categories = {} }) =>
      Object.entries(categories).some(([name, hit]) => hit && BLOCKED.has(name)),
    )
  } catch (err) {
    console.warn("[moderation] failed, not flagging:", err)
    return false
  }
}
