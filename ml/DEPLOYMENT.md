# ML Deployment Guide — Match Scorer (planned)

> **Status: planned, not implemented.** Nothing in `server/` spawns the scorer today, and the server image (`server/Dockerfile`, `oven/bun` slim) has no Python. Live matching uses the synchronous rules-based `compat()` in `server/src/matching/compat.ts`. This guide is the intended integration; every server-side path, env var and class below (`server/src/matching/scorer.ts`, `SCORER_*`, Postgres embedding columns) is a proposal.

How the Bun/Elysia backend would talk to `match_scorer`, the ONNX inference daemon (`ml/scripts/match_scorer.py`, run as a Python script or as the PyInstaller binary from `ml/scripts/build_match_scorer.sh`). The scorer runs the model: 1536-d embeddings (+ soft-jaccard for v3 models) → score ∈ [0, 1]. It is a stateless, long-lived process; the Bun side is responsible for embeddings, interest soft-jaccard, caching, and lifecycle.

**Why a score cache.** `compat()` runs synchronously for every candidate pair on every matching tick (`server/src/realtime/session.ts`), so it can't await a subprocess round-trip. The plan: score pairs off the hot path (on profile create/change, in the background) into an in-memory `pairKey → pair_score` cache; `compat()` reads it synchronously and falls back to the rules-based score on a miss or while the scorer is down.

## Table of contents

1. [Architecture](#1-architecture)
2. [Python runtime](#2-python-runtime)
   - 2.1 [Required packages](#21-required-packages)
   - 2.2 [Install with `uv` (recommended)](#22-install-with-uv-recommended)
   - 2.3 [Alternative: `pip` + `venv`](#23-alternative-pip--venv)
   - 2.4 [Alternative: Docker image with both runtimes](#24-alternative-docker-image-with-both-runtimes)
   - 2.5 [Standalone binary (no Python on the host)](#25-standalone-binary-no-python-on-the-host)
3. [Starting the scorer subprocess from Bun](#3-starting-the-scorer-subprocess-from-bun)
   - 3.1 [`spawn()` arguments](#31-spawn-arguments)
   - 3.2 [Wire format (NDJSON over stdio)](#32-wire-format-ndjson-over-stdio)
   - 3.3 [Lifecycle — boot, shutdown, restart on crash](#33-lifecycle--boot-shutdown-restart-on-crash)
4. [Bun client implementation](#4-bun-client-implementation)
   - 4.1 [`Scorer` class](#41-scorer-class)
   - 4.2 [Boot and shutdown wiring](#42-boot-and-shutdown-wiring)
   - 4.3 [Process pool (horizontal scaling per CPU core)](#43-process-pool-horizontal-scaling-per-cpu-core)
5. [Input fields](#5-input-fields)
   - 5.1 [`target_emb` — 1536-d float list](#51-target_emb--1536-d-float-list)
   - 5.2 [`self_emb` — 1536-d float list](#52-self_emb--1536-d-float-list)
   - 5.3 [`soft_jacc` — scalar float ∈ [-1, 1] (v3 models)](#53-soft_jacc--scalar-float--1-1-v3-models)
6. [Symmetric pair scoring — send twice](#6-symmetric-pair-scoring--send-twice)
   - 6.1 [Why two requests](#61-why-two-requests)
   - 6.2 [Pair-score calculation](#62-pair-score-calculation)
7. [End-to-end example](#7-end-to-end-example)
8. [Production checklist](#8-production-checklist)
   - 8.1 [Environment variables](#81-environment-variables)
   - 8.2 [Monitoring](#82-monitoring)
   - 8.3 [Scaling](#83-scaling)

---

## 1. Architecture

```
┌──────────────────────────────────────────────────┐         ┌────────────────────────────┐
│ Bun / Elysia backend (cloud server)              │         │ match_scorer (py / binary) │
│                                                  │         │ (ONNX inference daemon)    │
│  background scoring (on profile change)          │         │                            │
│   1. read profile embeddings from Postgres       │  NDJSON │ │ read line → sess.run()   │
│   2. compute soft_jacc from interest cache       │ ──────► │ │ write {id, score}        │
│   3. write {id, target_emb, self_emb, soft_jacc} │  stdin  │ │                          │
│      to scorer subprocess (twice: AB and BA)     │         │ │ single-threaded, no       │
│   4. read {id, score} for each direction         │ ◄────── │ │ state, no cache          │
│   5. pair_score = score_AB + score_BA → cache    │  stdout │ │                          │
│  matching tick: compat() reads the cache         │         │  v3 model:                │
│                                                  │         │   inputs = target_emb +   │
│                                                  │         │            self_emb +     │
│                                                  │         │            soft_jacc      │
└──────────────────────────────────────────────────┘         └────────────────────────────┘
```

The published v2 `model_v0.onnx` takes only `target_emb` + `self_emb`; the scorer reads the model's input names and drops `soft_jacc` for it.

The mobile app never sees Python, the model, or the OpenAI key. It only talks to the Bun backend over HTTP / WebSocket and receives match candidates.

---

## 2. Python runtime

Run the scorer either as a Python script — Python ≥ 3.11 plus a small set of libraries installed somewhere the Bun server can find (2.1–2.4) — or as the PyInstaller binary, which needs no Python on the host (2.5). The current server image has no Python, so the binary is the smaller change.

### 2.1 Required packages

The scorer is intentionally tiny — two runtime packages:

| Package | Version | Why |
|---|---|---|
| `python` | ≥ 3.11 | Required by `pyproject.toml` |
| `numpy` | `==1.26.4` | Embedding tensors (locked for ONNX ABI) |
| `onnxruntime` | `==1.19.2` | Runs the exported `.onnx` model |

No torch, no openai, no fastapi, no jupyter. Training and notebook work happen on developer machines; the production scorer carries nothing else.

### 2.2 Install with `uv` (recommended)

`uv` is the package manager used elsewhere in this monorepo. `pyproject.toml` uses PEP 735 `[dependency-groups]` to separate runtime from dev deps:

- **`[project.dependencies]`** — runtime only (`numpy`, `onnxruntime`). Used in production.
- **`[dependency-groups].dev`** — torch, openai, jupyter, matplotlib, scikit-learn, onnx (for export), pytest, tqdm. Used by people training or exploring the data.

```bash
cd ml/

# Production / scorer-only install (~10 packages, ~50 MB)
uv sync --no-group dev
ls .venv/bin/python
# /opt/justmate/ml/.venv/bin/python

# Dev install — adds training, notebooks, tests (~700 MB more)
uv sync
```

Bun points at `.venv/bin/python` regardless of which mode was used to create it:

```typescript
spawn("/opt/justmate/ml/.venv/bin/python", [...], { cwd: "/opt/justmate/ml" })
```

**Why this Python and not system `python3`**: it has `numpy==1.26.4` and `onnxruntime==1.19.2` pinned to versions tested against the model; using a different interpreter can introduce ABI mismatches and "DLL load failed" at runtime.

### 2.3 Alternative: `pip` + `venv`

If `uv` isn't available on the deploy host:

```bash
cd ml/
python3.11 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install numpy==1.26.4 onnxruntime==1.19.2
```

Same result — Bun points at `.venv/bin/python`.

### 2.4 Alternative: Docker image with both runtimes

For maximum reproducibility, bake the scorer Python env into a slim image that also contains Bun. The Bun server then spawns the embedded Python:

Sketch of the runtime stage `server/Dockerfile` would need (today it is Bun-only):

```dockerfile
FROM oven/bun:1.3-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv \
 && python3 -m venv /opt/justmate/ml/.venv \
 && /opt/justmate/ml/.venv/bin/pip install --no-cache-dir numpy==1.26.4 onnxruntime==1.19.2 \
 && rm -rf /var/lib/apt/lists/*
COPY ml/scripts/match_scorer.py /opt/justmate/ml/scripts/
COPY ml/checkpoints/model_v0.onnx /opt/justmate/ml/checkpoints/
# … the existing server build output …
```

Bun spawns `["/opt/justmate/ml/.venv/bin/python", "/opt/justmate/ml/scripts/match_scorer.py", "/opt/justmate/ml/checkpoints/model_v0.onnx"]`. Check that the base image's Python is ≥ 3.11.

### 2.5 Standalone binary (no Python on the host)

```bash
cd ml/
bash scripts/build_local_mac_and_linux.sh   # → dist/match-scorer-linux.tar.gz (built in python:3.12-slim)
```

Unpack `match_scorer-linux/` into the image (e.g. `COPY` to `/opt/justmate/match_scorer/`) and spawn `/opt/justmate/match_scorer/match_scorer` with no arguments: it loads the bundled `checkpoints/model_v0.onnx`, or `$MATCH_SCORER_MODEL` when set. Build for the image's arch (the script matches the host's); the binary is glibc-linked, which the Debian-based `oven/bun` slim image provides.

---

## 3. Starting the scorer subprocess from Bun

### 3.1 `spawn()` arguments

```typescript
import { spawn, type ChildProcess } from "node:child_process"

const proc = spawn(
  process.env.SCORER_PYTHON ?? "/opt/justmate/ml/.venv/bin/python",
  [
    "/opt/justmate/ml/scripts/match_scorer.py",
    "/opt/justmate/ml/checkpoints/model_v0.onnx",
  ],
  {
    cwd: "/opt/justmate/ml",       // so match_scorer.py's relative paths work
    env: process.env,              // forward OPENAI_API_KEY etc., even though scorer doesn't use it
    stdio: ["pipe", "pipe", "pipe"], // we own stdin/stdout/stderr
  },
)
```

Important:

- **`cwd`** must be `ml/` so `match_scorer.py` can resolve `data/soft_jaccard.npy` etc. on `--self-test`.
- **`stdio: ["pipe", "pipe", "pipe"]`** — never `inherit`. The server needs to read stdout line-by-line and parse JSON.
- **`SCORER_PYTHON`** env var lets you swap interpreters without rebuilding the server image.

### 3.2 Wire format (NDJSON over stdio)

One request = one JSON line on stdin. One response = one JSON line on stdout. **Always newline-terminated.**

```
stdin  (Bun → scorer):
    {"id":"r1","target_emb":[...1536 floats...],"self_emb":[...1536 floats...],"soft_jacc":0.81}\n

stdout (scorer → Bun):
    {"id":"r1","score":0.7823}\n
```

Errors come back as `{"id":"r1","error":"<message>"}` on stdout — the scorer **never crashes** on a bad request, only on a fatal startup problem. Bun can rely on this for restart logic.

### 3.3 Lifecycle — boot, shutdown, restart on crash

| Event | What to do |
|---|---|
| Server boot | Spawn one scorer (or N for a pool). Wait for the boot JSON on stderr: `{"loaded": "...", "load_ms": 47.3}` before accepting traffic. |
| Scorer emits error response | Log it, surface to caller as rejected Promise. **Do not** restart the process — a single bad embedding should not kill the daemon. |
| Scorer exits unexpectedly | Restart with cap (exponential backoff up to 1 min, give up after 5 in 60 s). Mark `ready = false` until boot JSON arrives again. |
| `SIGTERM` to server | `proc.stdin.end()` (sends EOF to scorer, which exits cleanly). `await proc.wait()`. Then exit Bun.

---

## 4. Bun client implementation

### 4.1 `Scorer` class

```typescript
// server/src/matching/scorer.ts
import { spawn, type ChildProcess } from "node:child_process"
import { resolve } from "node:path"

type ScoreReq = {
  target_emb: number[]   // length 1536
  self_emb:   number[]   // length 1536
  soft_jacc:  number
}

type ScoreOk  = { id: number; score: number }
type ScoreErr = { id: number; error: string }
type ScoreResp = ScoreOk | ScoreErr

export class Scorer {
  private proc!: ChildProcess
  private next = 0
  private pending = new Map<number, (resp: ScoreResp) => void>()
  private buf = ""

  constructor(
    private readonly python: string,
    private readonly scriptPath: string,
    private readonly modelPath: string,
    private readonly cwd: string,
  ) {}

  async start(): Promise<void> {
    this.proc = spawn(
      this.python,
      [this.scriptPath, this.modelPath],
      { cwd: this.cwd, env: process.env, stdio: ["pipe", "pipe", "pipe"] },
    )

    this.proc.stderr?.on("data", (chunk) => {
      process.stderr.write(`[scorer] ${chunk}`)
    })
    this.proc.stdout?.setEncoding("utf8")
    this.proc.stdout?.on("data", (chunk) => this.onStdout(chunk))

    const onExit = (code: number | null) => {
      const err = new Error(`scorer exited with code ${code}`)
      for (const cb of this.pending.values()) cb({ error: err.message } as unknown as ScoreResp)
      this.pending.clear()
    }
    this.proc.on("exit", onExit)

    // wait for the boot JSON before accepting traffic
    await new Promise<void>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        const text = chunk.toString("utf8")
        if (text.includes('"loaded"')) {
          this.proc.stderr?.off("data", onData)
          resolve()
        }
      }
      this.proc.stderr?.on("data", onData)
      setTimeout(() => reject(new Error("scorer boot timeout")), 10_000)
    })
  }

  private onStdout = (chunk: string) => {
    this.buf += chunk
    let i: number
    while ((i = this.buf.indexOf("\n")) !== -1) {
      const line = this.buf.slice(0, i)
      this.buf = this.buf.slice(i + 1)
      if (!line) continue
      let resp: ScoreResp
      try { resp = JSON.parse(line) as ScoreResp }
      catch { continue } // ignore malformed lines
      const cb = this.pending.get(resp.id)
      if (cb) {
        this.pending.delete(resp.id)
        cb(resp)
      }
    }
  }

  async score(req: ScoreReq): Promise<number> {
    return new Promise((resolve, reject) => {
      const id = ++this.next
      this.pending.set(id, (r) =>
        "error" in r ? reject(new Error(r.error)) : resolve(r.score),
      )
      this.proc.stdin?.write(JSON.stringify({ id, ...req }) + "\n")
    })
  }

  async stop(): Promise<void> {
    this.proc.stdin?.end()
    await new Promise<void>((resolve) => {
      this.proc.once("exit", () => resolve())
      setTimeout(() => { this.proc.kill("SIGKILL"); resolve() }, 5_000)
    })
  }
}
```

### 4.2 Boot and shutdown wiring

```typescript
// server/src/index.ts
import { Scorer } from "./matching/scorer"

const scorer = new Scorer(
  process.env.SCORER_PYTHON ?? "/opt/justmate/ml/.venv/bin/python",
  resolve(import.meta.dir, "../ml/scripts/match_scorer.py"),
  resolve(import.meta.dir, "../ml/checkpoints/model_v0.onnx"),
  resolve(import.meta.dir, "../ml"),
)
await scorer.start()

const shutdown = async () => {
  await scorer.stop()
  process.exit(0)
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
```

### 4.3 Process pool (horizontal scaling per CPU core)

ONNX Runtime is configured single-threaded in `match_scorer.py`. To use all cores, spawn one process per core and round-robin requests:

```typescript
export class ScorerPool {
  private readonly scorers: Scorer[]
  private cursor = 0

  constructor(n: number, factory: () => Scorer) {
    this.scorers = Array.from({ length: n }, factory)
  }

  async start() { await Promise.all(this.scorers.map((s) => s.start())) }
  async stop()  { await Promise.all(this.scorers.map((s) => s.stop()))  }

  score(req: ScoreReq): Promise<number> {
    const s = this.scorers[this.cursor++ % this.scorers.length]
    return s.score(req)
  }
}

const pool = new ScorerPool(
  Number(process.env.SCORER_WORKERS ?? require("node:os").cpus().length),
  () => new Scorer(PY, SCRIPT, MODEL, CWD),
)
await pool.start()
```

Throughput per process: ~400–500 pair/sec on a laptop CPU. With `cpus().length` processes the ceiling is roughly `cores × 450`.

---

## 5. Input fields

Every request carries two 1536-dimensional float vectors, plus a scalar `soft_jacc` that only v3 (3-input) models use.

### 5.1 `target_emb` — 1536-d float list

What this profile wants in a partner. Comes from OpenAI `text-embedding-3-small` on the text:

```
[Target] Character: {you_character}
[Target] Appearance: {you_appearance}
```

(text construction lives in `ml/src/just_mate_ml/data/embed.py:build_target_text`; reuse that function verbatim — it is the same text used at training time, do not paraphrase.)

**Stored in Postgres** at `profile.target_emb FLOAT[1536]`, computed once at onboarding (or on profile update) and cached indefinitely. The matching loop reads it, never re-embeds.

### 5.2 `self_emb` — 1536-d float list

Who this profile is. Comes from OpenAI on the text:

```
Interests: {interests_joined_by_comma}
[Self] Character: {my_character}
[Self] Appearance: {my_appearance}
```

(text construction: `embed.py:build_self_text`.)

**Stored in Postgres** at `profile.self_emb FLOAT[1536]`.

### 5.3 `soft_jacc` — scalar float ∈ [-1, 1] (v3 models)

Semantic interest overlap between the two profiles, computed per pair from unit-normalised per-interest embeddings (`ml/data/interest_embeddings.npz` + `interest_index.json`, built by `ml/scripts/build_interest_embeddings.py`). It is symmetric — the value training fed the model:

```
s_ab      = mean( over a ∈ interests_A of  max( over b ∈ interests_B of  cos(a, b) ) )
s_ba      = mean( over b ∈ interests_B of  max( over a ∈ interests_A of  cos(a, b) ) )
soft_jacc = (s_ab + s_ba) / 2
```

(Implementation: `compute_full_soft_jaccard()` in `ml/scripts/train_experiments_v3.py` for all pairs, `_soft_jaccard_batch()` in `ml/src/just_mate_ml/data/triplets_v3.py` for one profile vs many. The server would port this formula.)

For a v3 model, sending `soft_jacc = 0.0` because the interest cache isn't loaded still runs, but the score is **out-of-distribution**. Load the cache before serving traffic. 2-input models ignore the field.

### Example payload (truncated for display)

```json
{
  "id": 1,
  "target_emb": [0.0123, -0.0341, 0.0007, 0.0845, -0.0212, ... 1531 more floats ...],
  "self_emb":   [-0.0456, 0.0218, -0.0098, 0.0334, 0.0712, ... 1531 more floats ...],
  "soft_jacc":  0.8142
}
```

---

## 6. Symmetric pair scoring — send twice

### 6.1 Why two requests

The match head was trained as an **asymmetric** head: `match(target_A, self_B)` answers *"does A's preferences match B's identity?"* — not the other way around. For a full pair decision you need the answer in both directions:

```
score_AB = match(target_A, self_B, soft_jacc)   # "would A like B?"
score_BA = match(target_B, self_A, soft_jacc)   # "would B like A?"
```

Mutual interest (`pair_score = score_AB + score_BA ≥ threshold`) is what would gate a match. The threshold is model-specific: **0.78** for the published v2 `model_v0`, **0.40** for the v3 run (see `ml/README.md` §5.7). Single-direction scores are diagnostic only.

### 6.2 Pair-score calculation

```typescript
// server/src/matching/pair.ts
import type { Scorer } from "./scorer"

export async function pairScore(
  scorer: Scorer,
  a: { target_emb: number[]; self_emb: number[]; interests: string[] },
  b: { target_emb: number[]; self_emb: number[]; interests: string[] },
  softJacc: (interestsA: string[], interestsB: string[]) => number,
  threshold = 0.78,
): Promise<{ score_ab: number; score_ba: number; pair_score: number; would_match: boolean }> {
  const soft_jacc = softJacc(a.interests, b.interests)  // symmetric, same for both directions
  const [score_ab, score_ba] = await Promise.all([
    scorer.score({ target_emb: a.target_emb, self_emb: b.self_emb, soft_jacc }),
    scorer.score({ target_emb: b.target_emb, self_emb: a.self_emb, soft_jacc }),
  ])

  const pair_score = score_ab + score_ba
  return { score_ab, score_ba, pair_score, would_match: pair_score >= threshold }
}
```

Note that `Promise.all` is what makes this efficient: both requests fly out to the scorer concurrently; the wire is full-duplex.

---

## 7. End-to-end example

A complete call from the background scoring job (its result goes into the score cache that `compat()` reads):

```typescript
import { pairScore } from "./matching/pair"

const a = {
  target_emb: pgResult.rows[0].target_emb,           // FLOAT[1536] from Postgres
  self_emb:   pgResult.rows[0].self_emb,
  interests:  pgResult.rows[0].interests,           // text[]
}

const b = {
  target_emb: pgResult.rows[1].target_emb,
  self_emb:   pgResult.rows[1].self_emb,
  interests:  pgResult.rows[1].interests,
}

const result = await pairScore(scorer, a, b, computeSoftJacc, 0.78)
// {
//     score_ab: 0.58,
//     score_ba: 0.71,
//     pair_score: 1.29,
//     would_match: true,
//   }

scoreCache.set(pairKey(a, b), result.pair_score)
```

What happens under the hood:

1. Bun writes two JSON lines to scorer stdin (one per direction).
2. Scorer runs two ONNX forward passes and writes two JSON lines back.
3. Bun reads them, sums, decides.

Total round-trip on a single-core laptop: ~3–5 ms.

---

## 8. Production checklist

### 8.1 Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SCORER_PYTHON` | no | `/opt/justmate/ml/.venv/bin/python` | Python interpreter the Bun server spawns (unused with the standalone binary). |
| `SCORER_WORKERS` | no | `cpus().length` | Number of scorer subprocesses to pool. Set to `1` in dev. |
| `OPENAI_API_KEY` | yes (server) | — | Needed by the Bun server to embed profiles (cached at onboarding, not per pair). |
| `MATCH_SCORER_MODEL` | no | `checkpoints/model_v0.onnx` next to the script / binary | Read by `match_scorer` itself when no model path argument is given. Override only when shipping a new model. |

### 8.2 Monitoring

Track at minimum:

- **Boot latency**: time from `spawn()` to receiving the "loaded" stderr JSON. Cold: ~50–100 ms.
- **Per-pair latency**: histogram of `scorer.score()` round-trip. p99 should be < 20 ms.
- **Error rate**: count of `{"error": ...}` responses per minute. Sustained > 0.1 % indicates bad embeddings or model drift.
- **Subprocess uptime**: a restart loop suggests a bad request is killing the process (it shouldn't, but check stderr).

### 8.3 Scaling

- **Vertical**: `SCORER_WORKERS=N` where `N ≈ cpus().length`. Each worker is single-threaded by design.
- **Horizontal** (multi-instance deploys): put a load balancer in front of multiple Bun servers; they don't share state because the scorer is stateless. Embeddings and the interest cache are read-only on the server side.
- **Embedding cache** is the actual scaling bottleneck: re-embedding at 1536-d on every pair is O(few ms), so the server caches it per-user in Postgres. Invalidated on profile change only.