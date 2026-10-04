# JustMate ML

PyTorch training of the asymmetric Siamese matching model (Shared Encoder + Match Head, triplet + match loss, v3 + `soft_jacc` side feature). Trained checkpoints are served as ONNX by **`match_scorer`** and **`interest_matcher`** — two HTTP daemons bundled in one Docker container (`Dockerfile.scorer`) launched together by `scripts/run_servers.py` (PR #32). A legacy NDJSON subprocess (`scripts/match_scorer.py`, Python or PyInstaller-frozen binary) is kept for local dev.

**The HTTP container is not wired into the Bun server today** — PR #34 reverted the server-side clients. Live matching uses the synchronous rules-based `compat()` in `server/src/matching/compat.ts` (`0.7 × interest Jaccard + 0.3 × shared intent`). The intended integration is a precomputed pair-score cache that `compat()` reads synchronously, with the rules as fallback (§4).

Model and pipeline design: [`../docs/ML-MATCHING.md`](../docs/ML-MATCHING.md). [`../docs/ml/PLAN.md`](../docs/ml/PLAN.md) and `docs/ml/specs/` are the original hackathon plan, kept for history. This README is the run-it-yourself guide.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Install](#2-install)
3. [Run the pre-trained model](#3-run-the-pre-trained-model)
   - 3.1 [Download the weights from GitHub Releases](#31-download-the-weights-from-github-releases)
   - 3.2 [Sanity-check the toolchain](#32-sanity-check-the-toolchain)
   - 3.3 [Self-test the model](#33-self-test-the-model)
   - 3.4 [Score a pair of pre-computed embeddings](#34-score-a-pair-of-pre-computed-embeddings)
   - 3.5 [Serve over HTTP (production)](#35-serve-over-http-production)
   - 3.6 [Serve over stdio (dev)](#36-serve-over-stdio-dev)
   - 3.7 [Standalone binary (PyInstaller)](#37-standalone-binary-pyinstaller)
4. [How the Bun/Elysia server would use it (planned)](#4-how-the-bunelysia-server-would-use-it-planned)
5. [Train from scratch](#5-train-from-scratch)
   - 5.1 [Synthesize profiles](#51-synthesize-profiles)
   - 5.2 [Embed them with OpenAI](#52-embed-them-with-openai)
   - 5.3 [Build the interest table (v3 only)](#53-build-the-interest-table-v3-only)
   - 5.4 [Build triplets](#54-build-triplets)
   - 5.5 [Train (v2 or v3)](#55-train-v2-or-v3)
   - 5.6 [Export to ONNX](#56-export-to-onnx)
   - 5.7 [Calibrate the threshold and evaluate](#57-calibrate-the-threshold-and-evaluate)
6. [Project layout](#6-project-layout)
7. [Tests](#7-tests)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

| What | Version | Why |
|---|---|---|
| Python | ≥ 3.11 | Required by `pyproject.toml` |
| [`uv`](https://docs.astral.sh/uv/) | latest | Manages the venv and deps in one tool |
| `ONNX Runtime` CPU | bundled via `onnxruntime` | Runs the exported model for inference |
| OpenAI API key | paid tier | Embedding step needs `text-embedding-3-small` (≈ 25k profiles cost a few USD) |
| GitHub access | public | Pre-trained weights live on `uteg-labs/just-mate` Releases |
| Docker | optional | Only for the Linux build in `scripts/build_local_mac_and_linux.sh` |

If you only want to **run inference** (download the weights, score pre-computed embeddings, serve over stdio), you don't need the OpenAI API key — only the training pipeline does.

---

## 2. Install

```bash
cd ml/

# Creates .venv/, installs runtime + dev deps and just_mate_ml (src/) in editable mode
uv sync

# Optional: register the venv as a Jupyter kernel for the eval notebook
uv run ipython kernel install --user --name=just-mate-ml
```

`uv sync` installs `src/just_mate_ml` as an editable package (hatchling build backend), so `uv run python -m just_mate_ml.…` and the scripts that import it work from `ml/`. Run the eval notebook with `uv run jupyter lab` from `ml/`; it resolves `ml/` as the parent of `notebooks/`.

---

## 3. Run the pre-trained model

This is the path most contributors want — you don't need to retrain, just download the published weights and score profiles.

### 3.1 Download the weights from GitHub Releases

The trained checkpoint is published as a GitHub Release asset (not in the repo — `.pt` and `.onnx` are gitignored):

| Release tag | Assets |
|---|---|
| `@just-mate@model_attachments@0.0.1` | `model_v0.pt`, `model_v0.onnx` (v2 pipeline, 2-input ONNX) |

Every script defaults to `checkpoints/model_v0.onnx`, the published v2 model (2 inputs: `target_emb`, `self_emb`). A v3 model (3 inputs, adds `soft_jacc`) is not published; train it yourself (§5, writes `checkpoints/model_v3.pt`) and pass `--model checkpoints/model_v3.onnx`.

```bash
mkdir -p checkpoints
BASE="https://github.com/uteg-labs/just-mate/releases/download/%40just-mate%40model_attachments%400.0.1"

curl -fL "$BASE/model_v0.pt"  -o checkpoints/model_v0.pt
curl -fL "$BASE/model_v0.onnx" -o checkpoints/model_v0.onnx

ls -lh checkpoints/
# model_v0.onnx  ~1.9M
# model_v0.pt    ~1.9M
```

If you want a pinned SHA-256 check (recommended for CI / supply-chain hygiene), compare against the digest shown on the release page:

```bash
shasum -a 256 checkpoints/*.pt checkpoints/*.onnx
```

Expected digests for v0 (from the release of Oct 2026):

```
5b2ebf499d391457255c2649788e45056fc3c28cf6d2a375a9e9c06ec4b9b0cf  model_v0.pt
d157c14236a278d913d99fcf1646389faa1d4b65c4b69f2ae51442a3086ace36  model_v0.onnx
```

### 3.2 Sanity-check the toolchain

```bash
uv run pytest tests/test_bootstrap.py -v
```

This checks the pinned versions of numpy, torch, onnx and onnxruntime, that `openai` imports, and that `just_mate_ml` is importable. It needs the dev install (`uv sync`), but not the model or OpenAI access.

### 3.3 Self-test the model

Runs a few forward passes against real cached profile embeddings to confirm the model isn't corrupted. It needs the training data in `data/` (`profile_embeddings_{self,target}.npy`, `triplets.npz`, plus `soft_jaccard.npy` for v3 models — see §5), not just the downloaded weights:

```bash
uv run python scripts/match_scorer.py --self-test
```

Expected output (numbers may shift slightly with new releases, but the ordering is what matters):

```
{"loaded": "checkpoints/model_v0.onnx", "load_ms": …}
self-pair score       = ~0.95   (anchor's target vs anchor's self; HIGH)
match directional     = ~0.85   (HIGH)
nonmatch directional  = ~0.30   (< match)
symmetric match pair  = ~1.7    (well above the v2 threshold 0.78)
symmetric nonmatch    = ~0.6    (below threshold)
```

If `self-pair score` isn't above `match directional`, the model is broken or the embeddings are stale.

### 3.4 Score a pair of pre-computed embeddings

`scripts/score_pair.py` is a thin pass-through to `match_scorer.py`. It takes two positional JSON profiles, each carrying pre-computed embeddings (and optionally `soft_jacc`), runs the match head both directions, and prints the symmetric pair score. **No OpenAI calls, no JSON profile parsing** — embedding + interest-jaccard are the caller's responsibility (typically the Bun/Elysia server, which already caches both).

```bash
JSON_A='{"self_emb": [...1536 floats...], "target_emb": [...1536 floats...], "soft_jacc": 0.81}'
JSON_B='{"self_emb": [...1536 floats...], "target_emb": [...1536 floats...], "soft_jacc": 0.62}'

uv run python scripts/score_pair.py "$JSON_A" "$JSON_B"
```

Output:

```json
{
  "a": { …profile A… },
  "b": { …profile B… },
  "score_ab": 0.62,
  "score_ba": 0.71,
  "pair_score": 1.33,
  "would_match": true
}
```

Each profile object carries:

| Field | Type | What |
|---|---|---|
| `self_emb` | `list[float]`, length 1536 | The profile's "who I am" embedding. |
| `target_emb` | `list[float]`, length 1536 | The profile's "what I want" embedding. |
| `soft_jacc` | `number` ∈ [-1, 1], optional (default `0.0`) | Soft-Jaccard of the two profiles' interests; only v3 (3-input) models use it. With unit-normalised interest embeddings (`data/interest_embeddings.npz`), it is `(mean_{a∈A} max_{b∈B} cos(a,b) + mean_{b∈B} max_{a∈A} cos(a,b)) / 2` — symmetric, so both profiles carry the same value. Code: `compute_full_soft_jaccard()` in `scripts/train_experiments_v3.py` (all pairs, cached as `data/soft_jaccard.npy`) and `_soft_jaccard_batch()` in `just_mate_ml.data.triplets_v3` (one profile vs many). |

The symmetric pair score uses both directions:

```
score_ab = match(target_A, self_B, soft_jacc_on_A)   # A's soft_jacc (A as anchor, B as target)
score_ba = match(target_B, self_A, soft_jacc_on_B)   # B's soft_jacc (B as anchor, A as target)
pair_score = score_ab + score_ba
```

Flags:

| Flag | Default | What |
|---|---|---|
| `--threshold FLOAT` | `0.78` | Pair score at or above which `would_match` flips to `true`. Tuned for the published v2 `model_v0`; pass `0.40` for a v3 model (see §5.7). |
| `--model PATH` | `checkpoints/model_v0.onnx` | ONNX model path. Resolved relative to `ml/` if not absolute. |

### 3.5 Serve over HTTP (production)

The ONNX model is wrapped by `scripts/match_scorer_server.py` (HTTP, port `:8000` by default) and bundled together with `scripts/interest_matcher_server.py` (HTTP, port `:8001`) into one Docker container by `scripts/run_servers.py` + `Dockerfile.scorer`. This is the production serving path — the container image is published as `match-scorer` and is the `scorer` service in `docker-compose.yml`.

Run the two servers together locally without a container (requires the trained checkpoints):

```bash
uv run python scripts/run_servers.py \
    --match-checkpoint checkpoints/model_v3.onnx \
    --match-scorer-port 8000 \
    --interest-port 8001
```

`match_scorer` endpoints:

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{"ok": true}` |
| `GET` | `/ready` | — | `{"ready": true, "uptime_s": …}` after ONNX load |
| `POST` | `/score` | `{"target_emb":[…1536…], "self_emb":[…1536…], "soft_jacc": <float>}` | `{"score": <float>}` |
| `POST` | `/pair` | `{"target_a":[…], "self_a":[…], "target_b":[…], "self_b":[…], "soft_ab": <float>, "soft_ba": <float>}` | `{"score_ab": <float>, "score_ba": <float>, "pair_score": <float>}` |
| `POST` | `/batch` | `{"rows": [{…}, …]}` (cap 256) | `{"scores": [<float>, …]}` |

Errors come back as HTTP 4xx with a JSON `{"error": "..."}` body; the daemon never crashes on a bad request.

### 3.6 Serve over stdio (dev)

`scripts/match_scorer.py` is the legacy NDJSON daemon, useful when standing up a container is overkill (local debugging, or wiring a non-HTTP client). Wire format is field-for-field identical to the HTTP body. One request = one JSON line on stdin, one response = one JSON line on stdout.

```bash
uv run python scripts/match_scorer.py checkpoints/model_v3.onnx
```

With no model argument it loads `$MATCH_SCORER_MODEL`, else `checkpoints/model_v0.onnx`.

Request on stdin:

```json
{"id":"req_42","target_emb":[...1536 floats...],"self_emb":[...1536 floats...],"soft_jacc":0.81}
```

`soft_jacc` is fed to the model only when it declares a `soft_jacc` input (v3); 2-input v2 models ignore it. Omitted, it defaults to `0.0`, which is out-of-distribution for a v3 model.

Response on stdout:

```json
{"id":"req_42","score":0.78}
```

Errors come back as `{"id":"req_42","error":"<message>"}` on stdout (the daemon handles them — no exit, no exception).

**One-shot CLI mode** (ad-hoc, no subprocess plumbing):

```bash
uv run python scripts/match_scorer.py checkpoints/model_v3.onnx \
    --score target_emb.json,self_emb.json \
    --soft-jacc 0.5
# → {"score": 0.7823, "soft_jacc": 0.5}
```

`target_emb.json` and `self_emb.json` are files each holding a JSON list of 1536 floats. `--soft-jacc` defaults to 0.0 and is ignored by 2-input models.

### 3.7 Standalone binary (PyInstaller)

The NDJSON daemon (`match_scorer.py`), frozen so the host needs no Python:

```bash
bash scripts/build_match_scorer.sh                      # native build → dist/match_scorer/
MODEL_PATH=checkpoints/model_v3.onnx bash scripts/build_match_scorer.sh
bash scripts/build_local_mac_and_linux.sh               # macOS native + Linux via Docker, tarballs in dist/
```

`dist/match_scorer/` holds the `match_scorer` executable, the bundled model under `checkpoints/`, and the runtime under `_internal/`. Same CLI and NDJSON protocol as the script; `MATCH_SCORER_MODEL` overrides the bundled model. PyInstaller doesn't cross-compile: build on the OS/arch you deploy to (Windows: run `build_match_scorer.sh` under Git Bash on Windows).

---

## 4. How the Bun/Elysia server would use it (planned)

The HTTP container exists (`match_scorer` on `:8000`, `interest_matcher` on `:8001`); the Bun server doesn't import HTTP clients for them today — PR #34 reverted them. Live matching uses the rules-based `compat()` in `server/src/matching/compat.ts`. The intended integration is a precomputed pair-score cache that `compat()` reads synchronously:

```
Bun server (background scoring, on profile create/change)
        │
        │ POST /score   interests_a → interests_b soft_jacc cache
        │ POST /pair    target_a, self_a, target_b, self_b, soft_ab, soft_ba → pair_score
        ▼
scorer container (match_scorer_server.py + interest_matcher_server.py in one process)
        │
        │ ONNX forward pass per direction
        ▼
onnxruntime → score_ab, score_ba ∈ [0, 1]
        │
        ▼
server: pair_score = score_ab + score_ba → in-memory cache (pairKey → pair_score)
        │
        ▼
compat(a, b): synchronous read of the cached pair_score, rules-based score on a miss
```

Key facts:

- The server pre-embeds both user profiles with OpenAI **once** (cached per profile change), then sends only the 1536-d vectors to the scorer. The scorer itself never calls OpenAI.
- The server also computes `soft_jacc` per pair from its interest-index cache and forwards it alongside the embeddings.
- `compat()` runs synchronously for every candidate pair on every matching tick, so it can't await a network round-trip. Pair scores are precomputed off the hot path (when a profile is created or changes) into a cache that `compat()` reads; a miss falls back to the rules-based score.
- The HTTP container is stateless. Scale by running more `scorer` replicas behind a load balancer (not by adding intra-process threads).
- `pair_score` is the product signal; per-direction scores are diagnostic.
- The gate on `pair_score` is model-specific: **0.78** for the published v2 `model_v0`, **0.40** for the v3 run (§5.7). The scorer only returns scores; the threshold lives with the caller.

---

## 5. Train from scratch

Only needed if you're improving the model or reproducing from zero. The pipeline is self-contained up to the PyTorch checkpoint — synthetic data → embeddings → triplets → train; the ONNX export step is not in the repo (§5.6).

### 5.1 Synthesize profiles

```bash
uv run python -m just_mate_ml.data.profile_descriptions_v2 25000 data/profiles_descriptions.txt
```

Writes a plain-text dump of 25k profiles in the canonical format (see `embed.parse_profiles`). Parallelized; takes ~30s on a laptop.

### 5.2 Embed them with OpenAI

```bash
export OPENAI_API_KEY=sk-…
uv run python -m just_mate_ml.data.embed data/profiles_descriptions.txt data/
```

Produces:

- `data/profile_embeddings_self.npy`   `(N, 1536) float32` — interests + `[Self] Character` + `[Self] Appearance`
- `data/profile_embeddings_target.npy` `(N, 1536) float32` — `[Target] Character` + `[Target] Appearance`
- `data/profile_ids.json`              list[str] in the same row order

The dual-encoder split is deliberate: `self` is "who I am", `target` is "what I want in a partner". Without it, "I'm redheaded" and "I'm looking for a redhead" collapse to a falsely high cosine. See `embed.build_self_text` / `build_target_text`.

### 5.3 Build the interest table (v3 only)

V3 adds a soft-jaccard interest-similarity feature; it needs per-interest embeddings cached:

```bash
uv run python scripts/build_interest_embeddings.py
```

Outputs `data/interest_embeddings.npz` + `data/interest_index.json`. Idempotent — skips if the cache key (`model:count:sha256`) matches.

Skip this step if you're training v2.

### 5.4 Build triplets

Each anchor profile needs a positive (would match) and a negative (would not). V2 uses strict bidirectional selection (`triplets_v2.py`); v3 adds interest-jaccard and asymmetric scoring (`triplets_v3.py`).

```bash
# v2
uv run python -m just_mate_ml.data.triplets_v2 \
    data/profiles_descriptions.txt \
    data/profile_embeddings_self.npy \
    data/profile_embeddings_target.npy \
    data/

# v3
uv run python -m just_mate_ml.data.triplets_v3 \
    data/profiles_descriptions.txt \
    data/profile_embeddings_self.npy \
    data/profile_embeddings_target.npy \
    data/
```

Writes `data/triplets.npz` (keys: `anchor`, `positive`, `negative` — all `(N,)` int32 arrays of profile indices) and `data/triplets_ids.json` (the same triplets as profile-id dicts).

### 5.5 Train (v2 or v3)

```bash
# v2 — Shared Encoder + symmetric Match Head [|diff|, prod, cos]
uv run python scripts/train_experiments_v2.py

# v3 — asymmetric head ([target-self, target*self, cos]) + soft_jaccard + bidirectional BCE
uv run python scripts/train_experiments_v3.py
```

Sweeps hyperparams and keeps the best checkpoint by val AUC: v2 writes `checkpoints/model_v0.pt`, v3 writes `checkpoints/model_v3.pt`. The first v3 run also computes and caches the all-pairs `data/soft_jaccard.npy`. Typical runtime: ~10–30 min on a laptop CPU. Both scripts are GPU-agnostic (device is `cpu`); the model is small enough that GPU doesn't help.

### 5.6 Export to ONNX

ONNX is what `match_scorer.py` loads at inference. **The export step is not in this repo**: the training scripts only save the PyTorch state dict (`{"encoder": …, "head": …}`), and the published `model_v0.onnx` was exported outside it. Whatever exports a new model must produce the graph the scorer expects: encoder + head + sigmoid on raw embeddings, inputs `target_emb` `(N, 1536)` and `self_emb` `(N, 1536)` float32, plus `soft_jacc` `(N, 1)` for v3, one output of directional scores in `[0, 1]`. Name it `checkpoints/model_v0.onnx` (v2) or `checkpoints/model_v3.onnx` (v3).

Verify parity:

```bash
uv run python scripts/match_scorer.py --self-test
```

If the `--self-test` ordering holds (self-pair ≥ match > nonmatch), the export is wired correctly.

### 5.7 Calibrate the threshold and evaluate

```bash
uv run python scripts/threshold_sweep.py
uv run python scripts/benchmark_val.py
uv run python scripts/gate_sweep.py --model checkpoints/model_v3.onnx
uv run python scripts/build_eval_notebook.py  # → notebooks/evaluate_matching_model.ipynb
```

- `threshold_sweep.py` — precision/recall/F1 sweep of the symmetric-pair threshold (default range 0.76–0.84, around the v2 value).
- `benchmark_val.py` — val AUC, F1, accuracy, latency per ONNX forward pass.
- `gate_sweep.py` — compares sum / min / two-stage gates through `match_scorer.py`; needs `data/soft_jaccard.npy`.
- `build_eval_notebook.py` — regenerates `notebooks/evaluate_matching_model.ipynb`, which evaluates the v2 `checkpoints/model_v0.pt` in PyTorch.

`threshold_sweep.py` and `benchmark_val.py` feed only `target_emb` and `self_emb`, so they work with 2-input (v2) models only; evaluate a v3 model with `gate_sweep.py`.

**Which threshold?** Three numbers appear in this repo, all on the symmetric `pair_score` ∈ [0, 2]: **0.78** is the threshold for the published v2 `model_v0` and the default of `score_pair.py` and `benchmark_val.py` (`threshold_sweep.py` sweeps around it); **0.85** is the F1-best value the v2 training sweep recorded on its coarse 0.05 grid, quoted in the eval notebook; **0.40** is the F1-best value for the unpublished v3 run (AUC 0.9637) and applies only to a v3 model. Re-run the sweep after any retrain.

When done, publish the new checkpoint as a release (see §3.1 for the download path; bump the version, re-upload).

---

## 6. Project layout

```
ml/
├── README.md                          ← this file
├── DEPLOYMENT.md                      ← planned server integration of match_scorer
├── Dockerfile.scorer                  ← HTTP scorer container (:8000 + :8001)
├── pyproject.toml                     ← uv-managed deps; installs src/just_mate_ml (hatchling)
├── src/just_mate_ml/
│   └── data/
│       ├── embed.py                   ← OpenAI embeddings + profile parser
│       ├── profile_descriptions_v2.py ← Synthetic profile generator (parallel)
│       ├── triplets_v2.py             ← Strict bidirectional triplets
│       └── triplets_v3.py             ← V3 triplets (interest jaccard, asymmetric)
├── scripts/
│   ├── train_experiments_v2.py        ← V2 train sweep → checkpoints/model_v0.pt
│   ├── train_experiments_v3.py        ← V3 train sweep (asymmetric head + soft_jaccard) → checkpoints/model_v3.pt
│   ├── benchmark_val.py               ← ONNX benchmark (val AUC, F1, latency; 2-input models)
│   ├── threshold_sweep.py             ← Threshold precision/recall sweep (2-input models)
│   ├── gate_sweep.py                  ← Sum / min / two-stage gate comparison via match_scorer
│   ├── build_eval_notebook.py         ← Regenerate the eval notebook
│   ├── build_interest_embeddings.py   ← Cache per-interest OpenAI embeddings (v3)
│   ├── match_scorer.py                ← ONNX inference daemon (NDJSON over stdio)
│   ├── match_scorer_server.py         ← same scorer over HTTP (:8000)
│   ├── interest_matcher_server.py     ← interest soft-jaccard over HTTP (:8001)
│   ├── run_servers.py                 ← both HTTP servers in one process (Dockerfile.scorer CMD)
│   ├── score_pair.py                  ← CLI: take 2 pre-computed embedding JSON → forward to scorer
│   ├── build_match_scorer.sh          ← PyInstaller build of match_scorer (native)
│   └── build_local_mac_and_linux.sh   ← macOS native + Linux (Docker) builds
├── notebooks/
│   └── evaluate_matching_model.ipynb  ← Eval notebook (regenerable)
├── tests/
│   ├── test_bootstrap.py              ← Dependency + package import sanity
│   ├── test_scorer_server.py          ← match_scorer_server HTTP endpoints
│   └── test_interest_matcher_server.py ← interest_matcher_server HTTP endpoints
├── data/                              ← Synthetic profiles + embeddings + triplets (gitignored)
└── checkpoints/                       ← model_v0.{pt,onnx} from Releases, model_v3.* if you train v3 (gitignored)
```

Gitignored (large or sensitive):

- `checkpoints/*.pt`, `checkpoints/*.onnx` — download from Releases, don't commit
- `data/*.npy`, `data/*.npz`, `data/profiles_descriptions.txt`, `data/triplets_ids.json`, `data/profile_ids.json`
- `.venv/`, `__pycache__/`, `.pytest_cache/`, `.coverage`, `htmlcov/`

---

## 7. Tests

```bash
# Toolchain sanity (no model or API key needed)
uv run pytest tests/test_bootstrap.py -v

# Full test suite
uv run pytest -v
```

Three test files: `test_bootstrap.py`, `test_scorer_server.py` and `test_interest_matcher_server.py`; the two server tests need the checkpoints from §3.1. None run in CI (CI covers the TypeScript workspace only). Add new tests under `tests/`; pytest discovers them via the `[tool.pytest.ini_options]` block in `pyproject.toml` (`testpaths = ["tests"]`).

---

## 8. Troubleshooting

**`profile X missing fields: [...]`** — every profile needs `self_emb` and `target_emb`, each a `list[float]` of length 1536. `soft_jacc` is optional but must be a finite number when present.

**`profile X.self_emb must have 1536 floats, got (…)?`** — embedding has the wrong shape. The match head is hard-coded for 1536-d (text-embedding-3-small output).

**`profile X.self_emb contains non-finite values`** — one of the floats is `NaN`/`Inf`. Check the upstream embedding step.

**`model not found: checkpoints/model_v0.onnx`** — you haven't downloaded the weights, or you ran from the wrong CWD. The path is resolved relative to `ml/`. See §3.1.

**`scorer subprocess closed: ...`** — `match_scorer.py` died (usually an ONNX parse error, shape mismatch on `soft_jacc`, or OOM). Run it foreground with `uv run python scripts/match_scorer.py checkpoints/model_v0.onnx` and read its stderr.

**`self-test` numbers look swapped (self-pair < match)** — the cached embeddings in `data/profile_embeddings_self.npy` were built with a different `embed.py` than the model was trained against. Re-run step 5.2 with the current source.

**Triplet step is slow** — expected for 25k profiles. ~5–10 min on a laptop. If it hangs, check that the embeddings in `data/` are the right shape: `python -c "import numpy as np; print(np.load('data/profile_embeddings_self.npy').shape)"` should print `(25000, 1536)`.

**ONNX export fails on macOS arm64 with `aten::empty` not supported** — your `torch` is too old or too new for `onnx==1.17`. Pin both per `pyproject.toml` and reinstall: `uv sync --reinstall`.

**Threshold value** — `0.78` (v2 `model_v0`) and `0.40` (v3) are F1-best thresholds on the synthetic dataset; see §5.7. Re-run the sweep after any model change; the right threshold moves with the data.

---

When something is wrong with the model itself (not the pipeline), bump the version on the release tag (`@just-mate@model_attachments@X.Y.Z`) and re-upload the new checkpoint.