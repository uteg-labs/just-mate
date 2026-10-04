// HTTP client for the interest_matcher container. Mirrors the shape of
// scorer_http.ts so both backend services use the same retry/timeout
// conventions. The Bun server uses this to compute soft_jaccard (the third
// input to the match_scorer model) instead of doing it inline with the
// cached OpenAI interest embeddings.

export type StringScore = {
  interests_a: string[]
  interests_b: string[]
}

export type NumericScore = {
  interests_a_emb: number[][]
  interests_b_emb: number[][]
  labels_a?: string[] | null
  labels_b?: string[] | null
}

export type ScoreRow = {
  score: number
  mode: "linear" | "trained"
  features: Record<string, number | string>
  breakdown: Array<{ cos: number; a?: string; best_match?: string }>
  matched_exact: string[]
}

const FETCH_TIMEOUT_MS = 5_000
const READY_TIMEOUT_MS = 15_000

export class InterestMatcherHttp {
  constructor(private readonly base: string) {}

  async ready(): Promise<void> {
    const deadline = Date.now() + READY_TIMEOUT_MS
    while (Date.now() < deadline) {
      try {
        const r = await this.fetch("/ready", { method: "GET" })
        if (r.ok) return
      } catch {
        // matcher not up yet — retry
      }
      await Bun.sleep(250)
    }
    throw new Error(`interest_matcher at ${this.base} not ready after ${READY_TIMEOUT_MS}ms`)
  }

  async scoreStrings(req: StringScore): Promise<ScoreRow> {
    return this.postOne("/score", req)
  }

  async scoreNumeric(req: NumericScore): Promise<ScoreRow> {
    return this.postOne("/score", req)
  }

  async scoreBatch(reqs: Array<StringScore | NumericScore>): Promise<ScoreRow[]> {
    const r = await this.fetch("/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: reqs }),
    })
    if (!r.ok) throw await errorFromResponse(r)
    const body = (await r.json()) as { rows: ScoreRow[] }
    return body.rows
  }

  private postOne(path: string, body: unknown): Promise<ScoreRow> {
    return this.fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) throw await errorFromResponse(r)
      return (await r.json()) as ScoreRow
    })
  }

  private fetch(path: string, init: RequestInit): Promise<Response> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    return fetch(`${this.base}${path}`, { ...init, signal: ctrl.signal }).finally(() =>
      clearTimeout(timer),
    )
  }
}

async function errorFromResponse(r: Response): Promise<Error> {
  const text = await r.text().catch(() => "")
  return new Error(`interest_matcher ${r.status}: ${text || r.statusText}`)
}

let _matcher: InterestMatcherHttp | null = null

export async function getInterestMatcher(): Promise<InterestMatcherHttp> {
  if (_matcher) return _matcher
  const url = process.env.INTEREST_MATCHER_URL
  if (!url) {
    throw new Error("INTEREST_MATCHER_URL is not set — interest matcher container is unreachable")
  }
  const m = new InterestMatcherHttp(url.replace(/\/+$/, ""))
  await m.ready()
  _matcher = m
  return m
}
