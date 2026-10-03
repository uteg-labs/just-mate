# just-mate — ML implementation plan

> Master plan for the ML matching pipeline. Per-task specs live in `docs/ml/specs/<NN>-<name>.md`. Read `docs/ML-MATCHING.md` first for the design rationale.

## What we're building

A Siamese compatibility model that scores two faceless profiles. Trained in Python, exported to ONNX, served by a compiled C++ binary (`match_scorer`) that the Bun/Elysia server spawns once and pipes newline-delimited JSON to over stdin/stdout. Vectors cached in PostgreSQL with pgvector.

**Rule-based baseline is M0 primary** (per PRODUCT §7). This plan covers the ML pipeline that becomes the **stretch** path: when the model works it scores; when it doesn't, the server falls back to the baseline transparently. **The demo must not break if ML is unfinished.**

## Scope (this plan covers)

- Synthetic data generation (profiles, triplets, ground truth)
- OpenAI embedding pipeline + pgvector cache
- Model architecture (Shared Encoder + Match Head)
- Joint training loop (triplet + binary match)
- Threshold calibration
- ONNX export
- C++ `match_scorer` binary + JSON-lines IPC
- Binary tests, end-to-end smoke

Out of scope (owned by **backend** role):
- Bun/Elysia server wiring (subprocess spawn, fallback, hard gates)
- pgvector schema migration — see [Prerequisites](#prerequisites)
- WebSocket protocol implementation

Out of scope (owned by **mobile** role):
- Onboarding UI, vibe-card reroll
- Match banner rendering
- Demo mode scripted positions

## Architecture in 30 seconds

```
profile text
   ↓
profile_to_embedding_text()           ← T02
   ↓
OpenAI text-embedding-3-small         ← T05
   ↓ e (1536d, cached in pgvector)
Shared Encoder                        ← T06
   ↓ z (128d, cached in pgvector)
Match Head (ONNX, in match_scorer)    ← T07, T10, T11
   ↓
sigmoid → score ∈ [0, 1]              ← T11, T09 threshold
```

Per-pair inference: encoder never runs. `z` is cached per user. Match Head takes pre-cached `z_a`, `z_b` and outputs the score. Latency target: **<5 ms CPU per pair** (256 candidates = 1.3 s for full zone evaluation).

## Prerequisites (backend owns these)

Before T05 starts, the backend must have:

1. **PostgreSQL 16+** with `pgvector` extension installed
2. **`users` table** with columns:
   ```sql
   user_id     TEXT NOT NULL PRIMARY KEY
   intents     TEXT[]   NOT NULL
   interests   TEXT[]   NOT NULL
   vibe        TEXT     NOT NULL
   embedding   VECTOR(1536)         -- populated by ML T05
   z           VECTOR(128)           -- populated by ML T10
   last_embedded_at  TIMESTAMPTZ
   ```
3. **HNSW index** on `z` for M1 candidate selection (M0: brute-force is fine, but the index speeds up calibration queries):
   ```sql
   CREATE INDEX users_z_hnsw ON users USING hnsw (z vector_cosine_ops);
   ```

**If prerequisites are not ready by T05**, ML T05 is blocked. Backend should prioritise this — without it, the cache layer cannot be tested.

## Task order

Each row is one spec file. Reorder is not recommended — each task depends on the previous.

| # | Task | Spec file | Time | Critical path? |
|---|---|---|---|---|
| 01 | Bootstrap (uv, pyproject, C++ toolchain, dirs) | `specs/01-bootstrap.md` | 30 min | yes — blocks all |
| 02 | Vibe pool + embedding template | `specs/02-vibe-pool-embedding-template.md` | 30 min | no — but blocks T03 |
| 03 | Synthetic profile generator | `specs/03-synthetic-profile-generator.md` | 45 min | yes |
| 04 | Triplet sampler + ground truth | `specs/04-triplets-ground-truth.md` | 30 min | yes |
| 05 | OpenAI embedding pipeline + pgvector cache | `specs/05-embedding-cache.md` | 60 min | yes — **requires prereqs** |
| 06 | Shared Encoder (1536 → 128) | `specs/06-shared-encoder.md` | 30 min | yes |
| 07 | Match Head (257 → 1) | `specs/07-match-head.md` | 30 min | yes |
| 08 | Joint training loop | `specs/08-training-loop.md` | 90 min | **stretch after Sat 19:00** |
| 09 | Calibration | `specs/09-calibration.md` | 45 min | after T08 |
| 10 | ONNX export + z-cache population | `specs/10-onnx-export-cache-population.md` | 60 min | after T09 |
| 11 | C++ `match_scorer` binary | `specs/11-cpp-match-scorer.md` | 120 min | **stretch** |
| 12 | Binary tests (`test_scorer_binary`) | `specs/12-binary-tests.md` | 45 min | after T10, T11 |
| 13 | End-to-end smoke test | `specs/13-end-to-end-smoke.md` | 30 min | after T12 |

**Total**: ~9 h focused work. Realistic for one ML engineer with no other context switching.

## Critical path (must work for any ML in demo)

```
T01 → T02 → T03 → T06 → T07 → T08 → T10 → T11 → T12
```

Stretch tasks: T04 (triplets), T05 (OpenAI), T13 (smoke). If we run out of time, **T05 can be replaced by a deterministic precomputed fake-score table** (per-pair hash → score). This means the demo can show "ML scores" without ever calling OpenAI, at the cost of no real semantic matching. Document this fallback in `specs/05-embedding-cache.md` §"Offline fallback".

## Time budget vs. BUILD-PLAN milestones

| BUILD-PLAN milestone | ML tasks in scope | Notes |
|---|---|---|
| Sat 16:00 — Model v0 trained | T01–T08 | Synthetic dataset → model served by C++ binary |
| Sat 19:00 — The project is real | T10, T11, T12 | Binary exported + Bun can call it |
| Sun 07:00 — FREEZE | T13 | Final smoke test |
| Stretch | T05, T09, T13 | Calibration real metrics, OpenAI real, end-to-end |

## What can ship without ML

Even if T01–T13 are not all done, the demo can ship:

- **Rule-based baseline** (PRODUCT.md §7) is M0 primary and ships independently
- **Canned vibes** work without ML (T02 alone)
- **Demo mode positions** work without ML (mobile role)
- **Hard gates** work without ML (backend)

ML is **one of three scorers** the server can use:
1. **match_scorer binary** (preferred, when alive)
2. **Rule-based baseline** (fallback when binary dies)
3. **Canned fake-score** (M0 stretch — deterministic, no model needed)

If T01–T13 don't finish, the demo ships with option 2 (baseline only). The architecture decision to keep ML as a separate subprocess with a try/except means the demo never breaks if ML is unfinished.

## Out-of-band for ML (T14+, optional)

If time permits after T13:
- **T14** — Bun-side reference impl of the JSON-lines client (helps backend integrate; backend can copy-paste)
- **T15** — Local ONNX inference before the dominant fallback (sanity check during dev)
- **T16** — Real OpenAI key integration test (smoke against live API)
- **T17** — Synthetic data augmentation (more vibes, more interest combinations)

## Reference: file layout after all tasks done

```
ml/
├── pyproject.toml                 ← T01
├── uv.lock
├── README.md
├── .python-version                ← T01
├── .gitignore                     ← T01
├── canned/
│   └── vibes.json                 ← T02
├── src/
│   └── just_mate_ml/
│       ├── __init__.py
│       ├── embedding_text.py      ← T02
│       ├── data/
│       │   ├── __init__.py
│       │   ├── profiles.py        ← T03
│       │   └── triplets.py        ← T04
│       ├── cache/
│       │   ├── __init__.py
│       │   └── pgvector.py        ← T05
│       ├── embedding/
│       │   ├── __init__.py
│       │   └── openai_client.py   ← T05
│       ├── model/
│       │   ├── __init__.py
│       │   ├── encoder.py         ← T06
│       │   ├── head.py            ← T07
│       │   └── losses.py          ← T08
│       ├── train.py               ← T08
│       ├── calibrate.py            ← T09
│       ├── export.py              ← T10
│       └── populate_z.py          ← T10
├── inference/                     ← T11
│   ├── CMakeLists.txt
│   ├── src/
│   │   ├── main.cpp
│   │   ├── scorer.hpp
│   │   ├── protocol.hpp
│   │   └── nlohmann/json.hpp      ← vendored
│   └── build/
│       └── match_scorer
├── checkpoints/                   ← T10, T09
│   ├── encoder_v0.pt
│   ├── head_v0.pt
│   ├── model_v0.onnx              ← only Match Head
│   ├── MATCH_THRESHOLD            ← single float
│   └── MODEL_CARD.md              ← calibration metrics
├── data/                          ← T03, T04
│   ├── synthetic_profiles.jsonl
│   └── triplets.jsonl
└── tests/
    ├── __init__.py
    ├── test_embedding_text.py
    ├── test_vibes.py
    ├── test_profiles.py
    ├── test_triplets.py
    ├── test_encoder_shape.py
    ├── test_match_head_shape.py
    ├── test_training_step.py
    ├── test_calibration.py
    ├── test_pgvector_cache.py     ← requires backend's prereqs
    ├── test_export_onnx.py
    ├── test_scorer_binary.py      ← spawns match_scorer
    └── test_end_to_end.py
```