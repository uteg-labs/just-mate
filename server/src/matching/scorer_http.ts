// HTTP client for the match_scorer container.
//
// Same public surface as the spawn-based Scorer described in
// ml/DEPLOYMENT.md §4.1, with the wire format converted from NDJSON
// over stdin/stdout to HTTP POST. When MATCH_SCORER_URL is set the
// server talks to the scorer across the compose network; when it is
// unset the helper throws at boot so misconfiguration fails loud.

import type { Config } from "@justmate/protocol"

export type ScoreReq = {
  target_emb: number[]
  self_emb: number[]
  soft_jacc: number
}

export type PairReq = {
  target_a: number[]
  self_a: number[]
  target_b: number[]
  self_b: number[]
  soft_ab: number
  soft_ba: number
}

export type PairScore = { score_ab: number; score_ba: number; pair_score: number }

const FETCH_TIMEOUT_MS = 5_000
const READY_TIMEOUT_MS = 15_000

export class ScorerHttp {
  constructor(private readonly base: string) {}

  async ready(): Promise<void> {
    const deadline = Date.now() + READY_TIMEOUT_MS
    while (Date.now() < deadline) {
      try {
        const r = await this.fetch("/ready", { method: "GET" })
        if (r.ok) return
      } catch {
        // scorer not up yet — retry
      }
      await Bun.sleep(250)
    }
    throw new Error(`scorer at ${this.base} not ready after ${READY_TIMEOUT_MS}ms`)
  }

  async score(req: ScoreReq): Promise<number> {
    const r = await this.fetch("/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    if (!r.ok) throw await errorFromResponse(r)
    const body = (await r.json()) as { score: number }
    return body.score
  }

  async pair(req: PairReq): Promise<PairScore> {
    const r = await this.fetch("/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    if (!r.ok) throw await errorFromResponse(r)
    return (await r.json()) as PairScore
  }

  private fetch(path: string, init: RequestInit): Promise<Response> {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    return fetch(`${this.base}${path}`, { ...init, signal: ctrl.signal })
      .finally(() => clearTimeout(timer))
  }
}

async function errorFromResponse(r: Response): Promise<Error> {
  const text = await r.text().catch(() => "")
  return new Error(`scorer ${r.status}: ${text || r.statusText}`)
}

let _scorer: ScorerHttp | null = null

export async function getScorer(): Promise<ScorerHttp> {
  if (_scorer) return _scorer
  const url = process.env.MATCH_SCORER_URL
  if (!url) {
    throw new Error("MATCH_SCORER_URL is not set — scorer container is unreachable")
  }
  const s = new ScorerHttp(url.replace(/\/+$/, ""))
  await s.ready()
  _scorer = s
  return s
}

export function pairThreshold(_config: Config): number {
  return Number(process.env.MATCH_PAIR_THRESHOLD ?? 0.40)
}