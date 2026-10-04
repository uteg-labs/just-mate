// POST /api/waitlist on Vercel. Emails land in the Upstash Redis hash `waitlist` (email → json).
type Entry = { email?: unknown; role?: unknown; city?: unknown; lang?: unknown; website?: unknown }

function need(...names: string[]) {
  const value = names.map((n) => process.env[n]).find(Boolean)
  if (!value) throw new Error(`missing env: ${names.join(" or ")}`)
  return value
}

const url = need("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL")
const token = need("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN")

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES = ["person", "venue"]
const LANGS = ["en", "pl"]

function pick(value: unknown, allowed: string[]) {
  const s = String(value)
  return allowed.includes(s) ? s : allowed[0]
}

export async function POST(request: Request) {
  const body: Entry = await request.json().catch(() => ({}))

  // honeypot: bots fill the hidden field, people never see it
  if (body.website) return Response.json({ ok: true })

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase()
  if (email.length > 254 || !EMAIL.test(email)) {
    return Response.json({ ok: false }, { status: 400 })
  }

  const entry = {
    role: pick(body.role, ROLES),
    city: String(body.city ?? "")
      .trim()
      .slice(0, 80),
    lang: pick(body.lang, LANGS),
    at: new Date().toISOString(),
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(["HSETNX", "waitlist", email, JSON.stringify(entry)]),
  }).catch(() => undefined)

  if (!res?.ok) return Response.json({ ok: false }, { status: 502 })
  return Response.json({ ok: true })
}
