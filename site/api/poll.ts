// /api/poll on Vercel. Anonymous counters in the Upstash Redis hash `poll` (`q1:yes` → n, `total` → n).
function need(...names: string[]) {
  const value = names.map((n) => process.env[n]).find(Boolean)
  if (!value) throw new Error(`missing env: ${names.join(" or ")}`)
  return value
}

const url = need("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL")
const token = need("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN")

const QUESTIONS: Record<string, string[]> = {
  q1: ["yes", "maybe", "no"],
  q2: ["yes", "either", "no"],
  q3: ["yes", "no"],
  q4: ["yes", "same", "no"],
}

function redis(path: string, body: unknown) {
  return fetch(`${url}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).catch(() => undefined)
}

export async function POST(request: Request) {
  const body: Record<string, unknown> = Object(await request.json().catch(() => ({})))

  // honeypot: bots fill the hidden field, people never see it
  if (body.website) return Response.json({ ok: true })

  const fields = Object.entries(QUESTIONS).map(([q, answers]) => {
    const answer = answers.find((a) => a === body[q])
    return answer ? `${q}:${answer}` : ""
  })
  if (fields.includes("")) return Response.json({ ok: false }, { status: 400 })

  // one transaction, so `total` always equals each question's sum
  const res = await redis(
    "/multi-exec",
    [...fields, "total"].map((f) => ["HINCRBY", "poll", f, "1"]),
  )
  if (!res?.ok) return Response.json({ ok: false }, { status: 502 })
  return Response.json({ ok: true })
}

export async function GET() {
  const res = await redis("", ["HGETALL", "poll"])
  if (!res?.ok) return Response.json({ ok: false }, { status: 502 })

  const flat: string[] = (await res.json()).result ?? []
  const stored = new Map<string, number>()
  for (let i = 0; i < flat.length; i += 2) stored.set(flat[i], Number(flat[i + 1]))

  const counts = Object.fromEntries(
    Object.entries(QUESTIONS).map(([q, answers]) => [
      q,
      Object.fromEntries(answers.map((a) => [a, stored.get(`${q}:${a}`) ?? 0])),
    ]),
  )
  return Response.json({ total: stored.get("total") ?? 0, counts })
}
