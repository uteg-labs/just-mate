# ML Deployment Guide — Match Scorer (HTTP container)

> **Status: container is built and runs.** `match_scorer` and `interest_matcher` ship together as one HTTP container (`ml/Dockerfile.scorer` → `docker-compose.yml` → `match-scorer` image, `scorer` service). Bun server does **not** call them today — PR #34 reverted the HTTP clients; live matching uses the rules-based `compat()` in `server/src/matching/compat.ts`. This guide documents the production container and the intended server integration; the `server/src/matching/scorer_http.ts` client, `MATCH_SCORER_URL` env var, and the in-memory pair-score cache pattern are ready to be restored when the wiring is needed.

How the Bun/Elysia backend would talk to `match_scorer` and `interest_matcher`, two HTTP daemons (`ml/scripts/match_scorer_server.py`, `ml/scripts/interest_matcher_server.py`) launched together by `ml/scripts/run_servers.py` inside one container. Both daemons run `onnxruntime` against the published ONNX checkpoint; the v3 model is a 3-input ONNX (`target_emb`, `self_emb`, `soft_jacc`).

**Why a score cache.** `compat()` runs synchronously for every candidate pair on every matching tick (`server/src/realtime/session.ts`), so it can't await a network round-trip. The intended integration: score pairs off the hot path (on profile create/change, in the background) into an in-memory `pairKey → pair_score` cache; `compat()` reads it synchronously and falls back to the rules-based score on a miss or while the scorer is down.

## Table of contents

1. [Architecture](#1-architecture)
2. [Container image](#2-container-image)
   - 2.1 [Runtime inside the image](#21-runtime-inside-the-image)
   - 2.2 [Build args and env vars](#22-build-args-and-env-vars)
   - 2.3 [Local run without Docker](#23-local-run-without-docker)
3. [HTTP scorer service](#3-http-scorer-service)
   - 3.1 [`match_scorer` endpoints (`:8000`)](#31-match_scorer-endpoints-8000)
   - 3.2 [`interest_matcher` endpoints (`:8001`)](#32-interest_matcher-endpoints-8001)
   - 3.3 [Wire format (JSON over HTTP)](#33-wire-format-json-over-http)
   - 3.4 [Lifecycle — boot, shutdown, restart](#34-lifecycle--boot-shutdown-restart)
   - 3.5 [NDJSON dev daemon (alternative)](#35-ndjson-dev-daemon-alternative)
4. [Intended Bun client](#4-intended-bun-client)
   - 4.1 [`ScorerHttp` shape](#41-scorerhttp-shape)
   - 4.2 [Boot wiring and `MATCH_SCORER_URL`](#42-boot-wiring-and-match_scorer_url)
   - 4.3 [Scaling — replicas, not threads](#43-scaling--replicas-not-threads)
5. [Input fields](#5-input-fields)
   - 5.1 [`target_emb` — 1536-d float list](#51_target_emb--1536-d-float-list)
   - 5.2 [`self_emb` — 1536-d float list](#52_self_emb--1536-d-float-list)
   - 5.3 [`soft_jacc` — scalar float ∈ [-1, 1] (v3 models)](#53_soft_jacc--scalar-float-in--1-1-v3-models)
6. [Symmetric pair scoring — one `/pair` request](#6-symmetric-pair-scoring--one-pair-request)
   - 6.1 [Why two directions](#61-why-two-directions)
   - 6.2 [Pair-score calculation](#62-pair-score-calculation)
7. [End-to-end example](#7-end-to-end-example)
8. [Production checklist](#8-production-checklist)
   - 8.1 [Environment variables](#81-environment-variables)
   - 8.2 [Monitoring](#82-monitoring)
   - 8.3 [Scaling](#83-scaling)

---

## 1. Architecture

```
┌──────────────────────────────────────────────────┐         ┌─────────────────────────────────┐
│ Bun / Elysia backend (cloud server)              │         │ scorer container                │
│                                                  │         │ python run_servers.py           │
│  background scoring (on profile change)           │         │   :8000  match_scorer           │
│   1. read profile embeddings from Postgres       │  HTTP   │   :8001  interest_matcher       │
│   2. compute soft_jacc from interest cache       │ ──────► │                                 │
│      (planned: POST /score on :8001)             │  JSON   │  match_scorer (ThreadingHTTP):  │
│   3. write {target_a, self_a, target_b, self_b,  │         │   inputs = target_emb +         │
│      soft_ab, soft_ba} → POST /pair on :8000     │         │            self_emb +           │
│   4. read {score_ab, score_ba, pair_score}       │ ◄────── │            soft_jacc            │
│   5. pair_score → in-memory cache                 │         │                                 │
│  matching tick:  compat() reads the cache          │         │  interest_matcher (Threading):  │
│                 rules-based score on a miss       │         │   inputs = interests_a_emb +    │
│                                                  │         │            interests_b_emb +    │
│                                                  │         │            labels (optional)    │
└──────────────────────────────────────────────────┘         └─────────────────────────────────┘
```

The published v2 `model_v0.onnx` takes only `target_emb` + `self_emb`; the scorer reads the model's input names and drops `soft_jacc` for it. The mobile app never sees Python, the model, or the OpenAI key — it talks to the Bun backend over HTTP / WebSocket and receives match candidates.

---

## 2. Container image

`Dockerfile.scorer` builds a slim `python:3.11-slim` image with `numpy` + `onnxruntime`, both scorer scripts, the published ONNX checkpoint, and the interest embeddings (`interest_embeddings.npz` + `interest_index.json`).

### 2.1 Runtime inside the image

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir 'numpy==1.26.4' 'onnxruntime==1.19.2'

COPY scripts/match_scorer_server.py scripts/interest_matcher_server.py scripts/run_servers.py scripts/
COPY data ./data
COPY checkpoints ./checkpoints

ARG MODEL_FILE=model_v3.onnx
ENV MATCH_SCORER_MODEL=/app/checkpoints/${MODEL_FILE} \
    INTEREST_MATCHER_MODEL=/app/checkpoints/interest_matcher.onnx \
    PORT=8000 \
    INTEREST_MATCHER_PORT=8001 \
    HOST=0.0.0.0 \
    LOG_LEVEL=info

EXPOSE 8000 8001
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

CMD ["python", "scripts/run_servers.py"]
```

### 2.2 Build args and env vars

| Arg / Var | Default | Purpose |
|---|---|---|
| `MODEL_FILE` (build arg) | `model_v3.onnx` | Which ONNX in `ml/checkpoints/` to bake into the image. |
| `MATCH_SCORER_MODEL` | `/app/checkpoints/${MODEL_FILE}` | Path to the `match_scorer` ONNX. |
| `INTEREST_MATCHER_MODEL` | `/app/checkpoints/interest_matcher.onnx` | Path to the `interest_matcher` ONNX (optional; falls back to the cold-start linear blend). |
| `HOST` | `0.0.0.0` | Bind host. |
| `PORT` | `8000` | `match_scorer` port. |
| `INTEREST_MATCHER_PORT` | `8001` | `interest_matcher` port. |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warning` / `error`. |

### 2.3 Local run without Docker

Useful for debugging — runs both HTTP servers in one foreground process:

```bash
cd ml/
uv run python scripts/run_servers.py \
    --match-checkpoint checkpoints/model_v3.onnx \
    --interest-checkpoint checkpoints/interest_matcher.onnx \
    --host 127.0.0.1 --match-scorer-port 8000 --interest-port 8001
```

Same wire contract as the containerized version; the Bun client points at `http://127.0.0.1:8000` (or `MATCH_SCORER_URL=http://localhost:8000`).

The legacy NDJSON subprocess daemon (`scripts/match_scorer.py`) is still available for one-shot CLIs and PyInstaller builds — see §3.5.

---

## 3. HTTP scorer service

### 3.1 `match_scorer` endpoints (`:8000`)

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{"ok": true}` |
| `GET` | `/ready` | — | `{"ready": true, "uptime_s": …}` after ONNX load |
| `POST` | `/score` | `{"target_emb":[…1536…], "self_emb":[…1536…], "soft_jacc": <float>}` | `{"score": <float>}` |
| `POST` | `/pair` | `{"target_a":[…], "self_a":[…], "target_b":[…], "self_b":[…], "soft_ab": <float>, "soft_ba": <float>}` | `{"score_ab": <float>, "score_ba": <float>, "pair_score": <float>}` |
| `POST` | `/batch` | `{"rows": [{…}, …]}` (cap 256) | `{"scores": [<float>, …]}` |

### 3.2 `interest_matcher` endpoints (`:8001`)

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{"ok": true}` |
| `GET` | `/ready` | — | `{"ready": true, "uptime_s": …}` after model + vocab load |
| `POST` | `/score` | numeric: `{"interests_a_emb": [[…1536…], …], "interests_b_emb": […], "labels_a": […], "labels_b": […]}` (labels optional); string: `{"interests_a": ["music", …], "interests_b": […]}` | `{"score": <float>, "mode": "linear"|"trained", "features": {...}, "breakdown": […], "matched_exact": […]}` |
| `POST` | `/batch` | `{"rows": [{…}, …]}` (cap 256) | `{"rows": [{…}, …]}` |

Wire payload is auto-detected by key name (`interests_a_emb` → numeric, `interests_a` → string).

### 3.3 Wire format (JSON over HTTP)

Field-for-field identical to the NDJSON daemon (`target_emb`, `self_emb`, `soft_jacc`), transported over HTTP:

```http
POST /pair HTTP/1.1
Content-Type: application/json

{
  "target_a": [...1536 floats...],
  "self_a":   [...1536 floats...],
  "target_b": [...1536 floats...],
  "self_b":   [...1536 floats...],
  "soft_ab":  0.81,
  "soft_ba":  0.62
}
```

→

```json
{
  "score_ab":   0.62,
  "score_ba":   0.71,
  "pair_score": 1.33
}
```

### 3.4 Lifecycle — boot, shutdown, restart

| Event | What to do |
|---|---|
| Container boot | `run_servers.py` boots both daemons in threads; each logs `{"event": "model_loaded", "load_ms": …}` on stderr and flips `/ready` to 200 once its ONNX (and vocab, for `interest_matcher`) is loaded. |
| Scorer returns 4xx | Bad request body. The daemon never restarts on a single bad request. |
| Scorer exits unexpectedly | Compose restarts the container (`restart: unless-stopped` in `docker-compose.yml`). Caller-side logic should re-establish readiness by polling `/ready` before retrying. |
| `SIGTERM` to container | `run_servers.py` registers `SIGTERM`/`SIGINT` and calls `server.shutdown()` on each `ThreadingHTTPServer`. Inflight requests finish; new connections are refused mid-shutdown. |
| Caller startup | Poll `/ready` for up to 15 s before accepting traffic (the daemons load the ONNX synchronously at boot). |

### 3.5 NDJSON dev daemon (alternative)

`scripts/match_scorer.py` is the legacy NDJSON daemon, field-for-field identical to `match_scorer_server.py`. Useful for local debugging without standing up a container, or for PyInstaller builds where the host has no Python:

```bash
uv run python scripts/match_scorer.py checkpoints/model_v3.onnx
```

Request on stdin (one JSON object per line):

```json
{"id":"req_42","target_emb":[...1536 floats...],"self_emb":[...1536 floats...],"soft_jacc":0.81}
```

Response on stdout:

```json
{"id":"req_42","score":0.78}
```

Errors come back as `{"id":"req_42","error":"<message>"}` on stdout. PyInstaller builds (`scripts/build_match_scorer.sh`, `scripts/build_local_mac_and_linux.sh`) freeze this script into a standalone binary at `dist/match_scorer/` with the model bundled under `checkpoints/`.

---

## 4. Intended Bun client

The HTTP container exists; the Bun client was reverted by PR #34. The intended shape (what `server/src/matching/scorer_http.ts` looked like before the revert):

### 4.1 `ScorerHttp` shape

```typescript
// server/src/matching/scorer_http.ts (intended; reverted in PR #34)
import type { Config } from "@justmate/protocol"

export type ScoreReq = {
  target_emb: number[]   // length 1536
  self_emb:   number[]   // length 1536
  soft_jacc:  number
}

export type PairReq = {
  target_a: number[]; self_a: number[]
  target_b: number[]; self_b: number[]
  soft_ab:  number
  soft_ba:  number
}

export type PairScore = { score_ab: number; score_ba: number; pair_score: number }

export class ScorerHttp {
  constructor(private readonly base: string) {}

  async ready(): Promise<void>  { /* polls /ready for up to 15s */ }
  async score(req: ScoreReq): Promise<number> { /* POST /score */ }
  async pair(req: PairReq): Promise<PairScore> { /* POST /pair */ }
}

export async function getScorer(): Promise<ScorerHttp> {
  const url = process.env.MATCH_SCORER_URL
  if (!url) throw new Error("MATCH_SCORER_URL is not set")
  const s = new ScorerHttp(url.replace(/\/+$/, ""))
  await s.ready()
  return s
}

export function pairThreshold(_config: Config): number {
  return Number(process.env.MATCH_PAIR_THRESHOLD ?? 0.78)
}
```

### 4.2 Boot wiring and `MATCH_SCORER_URL`

The intended server boot:

```typescript
// server/src/index.ts (when restored)
import { getScorer } from "./matching/scorer_http"

const scorer = await getScorer()      // throws if MATCH_SCORER_URL is unset

// matching loop reads from scorer instead of computing rules inline
```

`server/.env.example` carries the URL hint:

```env
MATCH_SCORER_URL=http://scorer:8000
MATCH_PAIR_THRESHOLD=0.78
```

Local compose: `http://scorer:8000` (the service name resolves across the compose network). Local dev without Docker: `http://localhost:8000` after running `scripts/run_servers.py` in another terminal.

### 4.3 Scaling — replicas, not threads

ORT inference is single-threaded by design (`intra_op_num_threads = 1`). Run **more container replicas**, not more threads:

```yaml
# docker-compose.yml (excerpt)
services:
  scorer:
    build:
      context: ./ml
      dockerfile: Dockerfile.scorer
    image: match-scorer:local
    # No `ports:` — internal only. Publish if you need to debug with curl.
    expose: ["8000", "8001"]
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8000/health"]
      interval: 10s
      timeout: 3s
      start_period: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      replicas: 4                     # ~450 pair/sec/replica on a laptop CPU
```

Put a load balancer (or your orchestrator's round-robin) in front of the replicas. The Bun client is stateless, so any replica can serve any request.

---

## 5. Input fields

### 5.1 `target_emb` — 1536-d float list

What this profile wants in a partner. Comes from OpenAI `text-embedding-3-small` on the text:

```
[Target] Character: {you_character}
[Target] Appearance: {you_appearance}
```

(text construction: `ml/src/just_mate_ml/data/embed.py:build_target_text`; reuse that function verbatim — it is the same text used at training time.)

**Stored in PostgreSQL** at `profile.target_emb FLOAT[1536]` once onboarding finishes. (Current schema lives in the server-side migration files; per-profile embedding cache is the planned, not-yet-shipped state.)

### 5.2 `self_emb` — 1536-d float list

Who this profile is. Same OpenAI model on the text:

```
Interests: {interests_joined_by_comma}
[Self] Character: {my_character}
[Self] Appearance: {my_appearance}
```

(text construction: `embed.py:build_self_text`.)

**Stored in PostgreSQL** at `profile.self_emb FLOAT[1536]`.

### 5.3 `soft_jacc` — scalar float ∈ [-1, 1] (v3 models)

Semantic interest overlap between the pair. Computed server-side per pair at scoring time from the per-interest embedding cache (`ml/data/interest_embeddings.npz` + `ml/data/interest_index.json`). Bidirectional best-match mean:

```
s_ab      = mean over i ∈ A.interests of max over j ∈ B.interests of cos(emb_i, emb_j)
s_ba      = mean over j ∈ B.interests of max over i ∈ A.interests of cos(emb_i, emb_j)
soft_jacc = clip((s_ab + s_ba) / 2, 0, 1)
```

(`compute_soft_jaccard_pair()` in `ml/src/just_mate_ml/data/embed.py`.) Fed to the `match_scorer` ONNX only when the model declares a `soft_jacc` input (v3); 2-input v2 models ignore it.

---

## 6. Symmetric pair scoring — one `/pair` request

### 6.1 Why two directions

The match head is asymmetric: `match(target_A, self_B)` answers *"does A's preferences fit B's identity?"* — not the reverse. For a full pair decision you need both directions:

```
score_AB = match(target_A, self_B, soft_jacc_AB)   # "would A like B?"
score_BA = match(target_B, self_A, soft_jacc_BA)   # "would B like A?"
```

The `/pair` endpoint runs both directions in one request and returns all three numbers. Per-direction scores are diagnostic; the threshold lives in `compat()`.

### 6.2 Pair-score calculation

```typescript
// server/src/matching/pair.ts (intended; reverted in PR #34)
import type { ScorerHttp, PairScore } from "./scorer_http"

export async function pairScore(
  scorer: ScorerHttp,
  a: { target_emb: number[]; self_emb: number[]; interests: string[] },
  b: { target_emb: number[]; self_emb: number[]; interests: string[] },
  softJacc: (interestsA: string[], interestsB: string[]) => number,
): Promise<PairScore & { would_match: boolean }> {
  const result = await scorer.pair({
    target_a: a.target_emb,
    self_a:   a.self_emb,
    target_b: b.target_emb,
    self_b:   b.self_emb,
    soft_ab:  softJacc(a.interests, b.interests),
    soft_ba:  softJacc(b.interests, a.interests),
  })
  const threshold = pairThreshold(config)
  return { ...result, would_match: result.pair_score >= threshold }
}
```

---

## 7. End-to-end example

A complete call from the background scoring path (planned):

```typescript
import { getScorer } from "./matching/scorer_http"
import { pairScore } from "./matching/pair"
import { computeSoftJacc } from "./matching/soft_jacc"

const scorer = await getScorer()   // singleton; throws if MATCH_SCORER_URL is unset

const a = {
  target_emb: pgResult.rows[0].target_emb,           // FLOAT[1536] from Postgres (planned)
  self_emb:   pgResult.rows[0].self_emb,
  interests:  pgResult.rows[0].interests,           // text[]
}

const b = {
  target_emb: pgResult.rows[1].target_emb,
  self_emb:   pgResult.rows[1].self_emb,
  interests:  pgResult.rows[1].interests,
}

const result = await pairScore(scorer, a, b, computeSoftJacc)
// {
//     score_ab:   0.58,
//     score_ba:   0.71,
//     pair_score: 1.29,
//     would_match: true,           // pair_score >= MATCH_PAIR_THRESHOLD (0.78 default)
//   }
```

Under the hood: one `POST /pair` JSON body → two ONNX forward passes (AB and BA) → `{score_ab, score_ba, pair_score}`. End-to-end round-trip on the compose network: ~5–10 ms.

---

## 8. Production checklist

### 8.1 Environment variables

#### Scorer side (compose env, read by `run_servers.py` inside the container)

| Variable | Default | Purpose |
|---|---|---|
| `MATCH_SCORER_MODEL` | `/app/checkpoints/${MODEL_FILE}` | Path to the `match_scorer` ONNX. |
| `INTEREST_MATCHER_MODEL` | `/app/checkpoints/interest_matcher.onnx` | Path to the `interest_matcher` ONNX (optional; falls back to the cold-start linear blend). |
| `MODEL_FILE` (build arg) | `model_v3.onnx` | Which ONNX to bake into the image. |
| `HOST` | `0.0.0.0` | Bind host. |
| `PORT` | `8000` | `match_scorer` port. |
| `INTEREST_MATCHER_PORT` | `8001` | `interest_matcher` port. |
| `LOG_LEVEL` | `info` | One of `debug`, `info`, `warning`, `error`. |

#### Server side (`server/.env.example`, intended wiring — currently absent after PR #34)

| Variable | Default | Purpose |
|---|---|---|
| `MATCH_SCORER_URL` | unset | URL of the scorer container. Local compose: `http://scorer:8000`. Throws at boot if unset when the client is restored. |
| `MATCH_PAIR_THRESHOLD` | `0.78` | Threshold on `pair_score` for `would_match`. The scorer returns scores; the threshold lives in `compat()`. |

### 8.2 Monitoring

Track at minimum:

- **Boot latency**: time from container start to both `/ready` endpoints returning 200. Cold (no model cache): ~50–100 ms per daemon.
- **Per-pair latency**: histogram of `/pair` round-trip. p99 should be < 20 ms in compose networking; < 50 ms across multi-host networks.
- **Error rate**: count of 4xx responses per minute. Sustained > 0.1 % indicates bad embeddings or model drift.
- **Container uptime**: a restart loop (`docker ps --filter name=scorer` shows frequent restarts) suggests the model failed to load — check `docker logs just-mate-scorer-1` for the `{"event": "model_loaded", "error": …}` line.
- **`/ready` churn**: `/ready` flipping between 200 and 503 repeatedly means a stuck container or a corrupted model on disk.

### 8.3 Scaling

- **Vertical**: single-threaded by design; raise CPU/memory on the container, not intra-op threads.
- **Horizontal (single host)**: bump `replicas` on the `scorer` service in `docker-compose.yml`. ~450 pair/sec/replica on a laptop CPU; ~10× on a beefy box. Put a load balancer or your orchestrator's round-robin in front.
- **Horizontal (multi-host)**: externalize the scorer behind a load balancer; the scorer is stateless (no shared cache between replicas). The Bun client only needs `MATCH_SCORER_URL` to point at the LB.
- **Embedding cache** is the actual scaling bottleneck: re-embedding at 1536-d on every pair is O(few ms), so the server caches it per-user in Postgres. Invalidated on profile change only.