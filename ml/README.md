# JustMate ML

PyTorch training of the asymmetric Siamese matching model (Shared Encoder + Match Head, triplet + match loss), exported to ONNX. The Bun/Elysia server spawns `scripts/match_scorer.py` as a long-lived subprocess for inference (newline-delimited JSON over stdin/stdout).

Full process spec lives in [`../docs/ML-MATCHING.md`](../docs/ML-MATCHING.md) and [`../docs/ml/PLAN.md`](../docs/ml/PLAN.md). This README is the run-it-yourself guide.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Install](#2-install)
3. [Run the pre-trained model](#3-run-the-pre-trained-model)
   - 3.1 [Download the weights from GitHub Releases](#31-download-the-weights-from-github-releases)
   - 3.2 [Sanity-check the toolchain](#32-sanity-check-the-toolchain)
   - 3.3 [Self-test the model](#33-self-test-the-model)
   - 3.4 [Score a pair of raw profiles](#34-score-a-pair-of-raw-profiles)
   - 3.5 [Serve over stdio (for the Bun server)](#35-serve-over-stdio-for-the-bun-server)
4. [How the Bun/Elysia server uses it](#4-how-the-bunelysia-server-uses-it)
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
| C++ toolchain | `clang` (macOS) or `gcc` (Linux) | Sanity-checked by `tests/test_bootstrap.py` |

If you only want to **run inference** (download the weights, score profiles, serve for the Bun server), you don't need the OpenAI API key — only the training pipeline does.

---

## 2. Install

```bash
cd ml/

# Creates .venv/ + installs pyproject.toml deps (numpy, torch, onnxruntime, openai, …)
uv sync

# Optional: register the venv as a Jupyter kernel for the eval notebook
uv run ipython kernel install --user --name=just-mate-ml
```

The `pyproject.toml` declares the project but doesn't package it (`[tool.uv] package = false`). Source is consumed in-place via `sys.path.insert(0, "src")` (this is what scripts do). For notebooks, prefer `uv run jupyter lab` from `ml/` so the path resolves.

---

## 3. Run the pre-trained model

This is the path most contributors want — you don't need to retrain, just download the published weights and score profiles.

### 3.1 Download the weights from GitHub Releases

The trained checkpoint is published as a GitHub Release asset (not in the repo — `.pt` and `.onnx` are gitignored):

| Release tag | Assets |
|---|---|
| `@just-mate@model_attachments@0.0.1` | `model_v0.pt`, `model_v0.onnx` |

Download both into `ml/checkpoints/`:

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
shasum -a 256 checkpoints/model_v0.pt checkpoints/model_v0.onnx
```

Expected digests (from the release of Oct 2026):

```
5b2ebf499d391457255c2649788e45056fc3c28cf6d2a375a9e9c06ec4b9b0cf  model_v0.pt
d157c14236a278d913d99fcf1646389faa1d4b65c4b69f2ae51442a3086ace36  model_v0.onnx
```

### 3.2 Sanity-check the toolchain

```bash
uv run pytest tests/test_bootstrap.py -v
```

This checks Python version, imports, ONNX Runtime availability, and the C++ compiler (needed if you later build torch extensions). It does **not** require the model or OpenAI access.

### 3.3 Self-test the model

Runs a single match-head forward pass against real cached profile embeddings to confirm the model isn't corrupted:

```bash
uv run python scripts/match_scorer.py --self-test
```

Expected output (numbers may shift slightly with new releases, but the ordering is what matters):

```
{"loaded": "checkpoints/model_v0.onnx", "load_ms": …}
self-pair score       = ~0.95   (anchor's target vs anchor's self; HIGH)
match directional     = ~0.85   (HIGH)
nonmatch directional  = ~0.30   (< match)
symmetric match pair  = ~1.7    (well above threshold 0.78)
symmetric nonmatch    = ~0.6    (below threshold)
```

If `self-pair score` isn't above `match directional`, the model is broken or the embeddings are stale.

### 3.4 Score a pair of raw profiles

`scripts/score_pair.py` takes two JSON profiles (one positional argument each), embeds them with OpenAI, runs the match head both directions, and prints the symmetric pair score.

Required env: `OPENAI_API_KEY`.

```bash
export OPENAI_API_KEY=sk-…

JSON_A='{"interests":["music","hiking"],"my_character":"Curious and patient.","my_appearance":"Tall, glasses.","you_character":"Kind and curious.","you_appearance":"Brown hair, blue eyes."}'

JSON_B='{"interests":["reading","cooking"],"my_character":"Thoughtful introvert.","my_appearance":"Short, dark hair.","you_character":"Outdoorsy and patient.","you_appearance":"Athletic build."}'

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

Each profile must have **all 5 fields** (`interests` is `list[str]`, the rest are `str`). The 5 fields match the canonical `Profile` shape used during training; omitting any field is a hard error.

Flags:

| Flag | Default | What |
|---|---|---|
| `--threshold FLOAT` | `0.78` | Pair score above which `would_match` flips to `true`. The product uses this as the calibrated gate. |
| `--model PATH` | `checkpoints/model_v0.onnx` | ONNX model path. Resolved relative to `ml/` if not absolute. |

### 3.5 Serve over stdio (for the Bun server)

The Bun/Elysia server consumes `scripts/match_scorer.py` as a long-lived subprocess. Wire format is newline-delimited JSON (NDJSON):

```bash
uv run python scripts/match_scorer.py checkpoints/model_v0.onnx
```

Request on stdin (one JSON object per line):

```json
{"id":"req_42","target_emb":[...1536 floats...],"self_emb":[...1536 floats...]}
```

Response on stdout (one JSON object per line):

```json
{"id":"req_42","score":0.78}
```

Errors come back as `{"id":"req_42","error":"<message>"}` on stdout (the server handles them — no exit, no exception).

Run it foreground for dev; the server manages its lifecycle in production. Server-side see [`../server/`](../server/) and [`../docs/PROTOCOL.md`](../docs/PROTOCOL.md) §6.1 for the spawner config.

---

## 4. How the Bun/Elysia server uses it

```
Bun server (matching loop)
        │
        │ spawn() long-lived subprocess
        ▼
python scripts/match_scorer.py checkpoints/model_v0.onnx
        │
        │ NDJSON over stdin/stdout
        │
        ▼
onnxruntime → score ∈ [0, 1] per direction
        │
        ▼
server: pair_score = score_ab + score_ba, gate at ≥ 0.78
```

Key facts:

- The server pre-embeds both user profiles with OpenAI **once** (cached per profile change), then sends only the 1536-d vectors to the scorer. The scorer itself never calls OpenAI.
- The server keeps one scorer process per CPU core (tunable).
- `pair_score` is the product signal; per-direction scores are diagnostic.
- Calibrated threshold is **0.78** (override per-request via `--threshold` on the scorer if experimenting).

---

## 5. Train from scratch

Only needed if you're improving the model or reproducing from zero. The pipeline is fully self-contained — synthetic data → embeddings → triplets → train → export.

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

Writes `data/triplets.npz` (keys: `anchor`, `positive`, `negative` — all `(N,)` int32 arrays of profile indices) and a metadata `data/triplets_meta.json`.

### 5.5 Train (v2 or v3)

```bash
# v2 — Shared Encoder + symmetric Match Head [|diff|, prod, cos]
uv run python scripts/train_experiments_v2.py

# v3 — asymmetric head ([target-self, target*self, cos]) + soft_jaccard + bidirectional BCE
uv run python scripts/train_experiments_v3.py
```

Sweeps hyperparams, keeps the best checkpoint by val AUC, writes `checkpoints/model_v0.pt`. Typical runtime: ~10–30 min on a laptop CPU. Both scripts are GPU-agnostic (device is `cpu`); the model is small enough that GPU doesn't help.

### 5.6 Export to ONNX

ONNX is what `match_scorer.py` loads at inference. Export is currently a manual step in the training script's tail — read the last 30 lines of `train_experiments_v3.py` for the export call. Result: `checkpoints/model_v0.onnx`.

Verify parity:

```bash
uv run python scripts/match_scorer.py --self-test
```

If `--self-test` numbers match the in-training val AUC, you're good.

### 5.7 Calibrate the threshold and evaluate

```bash
uv run python scripts/threshold_sweep.py
uv run python scripts/benchmark_val.py
uv run python scripts/build_eval_notebook.py  # → notebooks/evaluate_matching_model.ipynb
```

- `threshold_sweep.py` — full precision/recall/F1 sweep over the calibrated threshold (0.78 by default).
- `benchmark_val.py` — final val AUC, F1, accuracy, latency per ONNX forward pass.
- `build_eval_notebook.py` — regenerates `notebooks/evaluate_matching_model.ipynb` from the current data + checkpoint.

When done, publish the new checkpoint as a release (see §3.1 for the download path; bump the version, re-upload).

---

## 6. Project layout

```
ml/
├── README.md                          ← this file
├── pyproject.toml                     ← uv-managed deps; package = false
├── src/just_mate_ml/
│   └── data/
│       ├── embed.py                   ← OpenAI embeddings + profile parser
│       ├── profile_descriptions_v2.py ← Synthetic profile generator (parallel)
│       ├── triplets_v2.py             ← Strict bidirectional triplets
│       └── triplets_v3.py             ← V3 triplets (interest jaccard, asymmetric)
├── scripts/
│   ├── train_experiments_v2.py        ← V2 train sweep → checkpoints/model_v0.pt
│   ├── train_experiments_v3.py        ← V3 train sweep (asymmetric head + soft_jaccard)
│   ├── benchmark_val.py               ← ONNX benchmark (val AUC, F1, latency)
│   ├── threshold_sweep.py             ← Threshold precision/recall sweep
│   ├── build_eval_notebook.py         ← Regenerate the eval notebook
│   ├── build_interest_embeddings.py   ← Cache per-interest OpenAI embeddings (v3)
│   ├── match_scorer.py                ← ONNX inference daemon (NDJSON over stdio)
│   └── score_pair.py                  ← CLI: take 2 JSON profiles → embed → score
├── notebooks/
│   └── evaluate_matching_model.ipynb  ← Eval notebook (regenerable)
├── tests/
│   └── test_bootstrap.py              ← Toolchain sanity (deps + ONNX + C++)
├── data/                              ← Synthetic profiles + embeddings + triplets (gitignored)
└── checkpoints/                       ← model_v0.pt + model_v0.onnx (gitignored; downloaded from Releases)
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

# Full test suite (when present)
uv run pytest -v
```

The bootstrap test is the only one wired into CI today. Add new tests under `tests/`; pytest discovers them via the `[tool.pytest.ini_options]` block in `pyproject.toml` (`testpaths = ["tests"]`).

---

## 8. Troubleshooting

**`OPENAI_API_KEY not set in env`** when running `score_pair.py` — export it before invoking. The scorer subprocess does **not** call OpenAI; only `score_pair.py` does.

**`profile X missing fields: [...]`** — every profile needs `interests`, `my_character`, `my_appearance`, `you_character`, `you_appearance`. `interests` must be a `list[str]`; the other four must be `str`. Empty strings are allowed but produce out-of-distribution target text.

**`profile X.interests must be a list[str]`** — the field is rejected as a list, but elements inside the list must also be strings. `["music", 42]` will fail this check.

**`model not found: checkpoints/model_v0.onnx`** — you haven't downloaded the weights, or you ran from the wrong CWD. The path is resolved relative to `ml/`. See §3.1.

**`scorer subprocess closed: ...`** — `match_scorer.py` died (usually an ONNX parse error or OOM). Run it foreground with `python scripts/match_scorer.py checkpoints/model_v0.onnx` and read its stderr.

**`self-test` numbers look swapped (self-pair < match)** — the cached embeddings in `data/profile_embeddings_self.npy` were built with a different `embed.py` than the model was trained against. Re-run step 5.2 with the current source.

**Triplet step is slow** — expected for 25k profiles. ~5–10 min on a laptop. If it hangs, check that the embeddings in `data/` are the right shape: `python -c "import numpy as np; print(np.load('data/profile_embeddings_self.npy').shape)"` should print `(25000, 1536)`.

**ONNX export fails on macOS arm64 with `aten::empty` not supported** — your `torch` is too old or too new for `onnx==1.17`. Pin both per `pyproject.toml` and reinstall: `uv sync --reinstall`.

**Threshold value** — `0.78` is calibrated on the synthetic v0 dataset. Re-run `scripts/threshold_sweep.py` after any model change; the right threshold moves with the data.

---

When something is wrong with the model itself (not the pipeline), bump the version on the release tag (`@just-mate@model_attachments@X.Y.Z`) and re-upload the new `model_v0.pt` + `model_v0.onnx`. The Bun server reads by URL only — no version pinning in the server config.