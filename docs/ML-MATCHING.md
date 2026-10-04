# JustMate — ML matching process

> Source of truth for the learned compatibility model: what the code in `ml/` trains, how it is served, and how it would plug into the server. Read `PRODUCT.md` §7 first for the high-level framing. Run-it-yourself commands are in [`ml/README.md`](../ml/README.md); the planned server integration in [`ml/DEPLOYMENT.md`](../ml/DEPLOYMENT.md).

## 1. TL;DR

- **What it does:** given two profiles, output a pairwise compatibility score: one directional score in `[0, 1]` per direction, summed into a symmetric `pair_score` in `[0, 2]`.
- **Stack:** OpenAI `text-embedding-3-small` (two embeddings per profile: *self* and *target*) → custom PyTorch model (Shared Encoder + asymmetric Match Head) trained in Python → exported to ONNX → served by **`match_scorer`** as an HTTP daemon (`ml/scripts/match_scorer_server.py`), bundled in one container alongside **`interest_matcher`** (`ml/scripts/interest_matcher_server.py`) — both launched together by `ml/scripts/run_servers.py` and built into `ml/Dockerfile.scorer` (PR #32). The same model is also exposed via an NDJSON subprocess (`ml/scripts/match_scorer.py`, Python or PyInstaller-frozen binary) for dev. There is no FastAPI, no in-process model in Bun, no C++ binary.
- **Status.** The HTTP container exposes `match_scorer` on `:8000` and `interest_matcher` on `:8001`. Now matching for real accounts uses it: when a profile changes, the server scores that person against everyone through the HTTP container (`server/src/matching/recalculation.ts`, `match.repository.ts`) and pairs only above the threshold. Demo mode, tests and plan proposals use the rules-based `compat()` in `server/src/matching/compat.ts` (`0.7 × interest Jaccard + 0.3 × shared intent`).
- **Training objective:** triplet loss + binary match loss (+ a bidirectional BCE term in v3), jointly, on synthetic profiles; real meeting outcomes in M1.
- **Hard rules (zones, cooldown, session limit, K-anonymity, intent gate) are NOT learned.** The model is one of several gates; everything else is server-side logic.

## 2. Why a Siamese / Triplet + Match Head

The match problem is pairwise and directional: does A's idea of a partner fit who B is, and the other way round? Two parts work better than one:

- **Shared Encoder** learns a **compatibility space** — a 128-d vector where a profile's *target* ("what I want") lands near the *self* ("who I am") of profiles that fit it. Triplet loss drives this.
- **Match Head** sits on top, takes pair features of `(z_target_A, z_self_B)` and outputs the directional probability.

Why two heads (not just cosine similarity on OpenAI embeddings, not just a single classifier):
- Raw OpenAI embeddings encode general semantic similarity, not compatibility. A 128-d projector learned on triplets refocuses them.
- The match head learns the *decision boundary*, not just the geometry — handles calibration and class imbalance cleanly.
- Joint training makes both cooperate: the encoder optimizes geometry, the head optimizes the decision.

Why separate *self* and *target* texts: with one embedding per profile, "I'm redheaded" and "I'm looking for a redhead" collapse to a falsely high cosine. Comparing A's *target* with B's *self* keeps the direction.

## 3. Architecture

As implemented in `ml/scripts/train_experiments_v2.py` and `train_experiments_v3.py` (defaults shown; the sweeps also try other widths).

```
   profile A                                   profile B
   target text                                 self text
   ([Target] Character/Appearance)             (Interests + [Self] Character/Appearance)
        │                                           │
        ▼                                           ▼
   OpenAI text-embedding-3-small · 1536-d · frozen, cached per profile
        │ target_emb_A                              │ self_emb_B
        ▼                                           ▼
   ┌──────────────────────── Shared Encoder (same weights) ────────────────────────┐
   │ Linear(1536, 256) → LayerNorm → ReLU → Linear(256, 128) → LayerNorm → L2-norm │
   └───────────────────────────────────────────────────────────────────────────────┘
        │ z_t (128)                                 │ z_s (128)
        └──────────────────┬────────────────────────┘
                           ▼
        Match Head: [z_t − z_s, z_t ⊙ z_s, cos(z_t, z_s)] (257) + soft_jacc (1, v3)
                    → Linear(·, 128) → ReLU → Linear(128, 32) → ReLU → Linear(32, 1)
                           ▼
                 sigmoid → score(A→B) ∈ [0, 1]

   pair_score(A, B) = score(A→B) + score(B→A) ∈ [0, 2]
```

### 3.1 OpenAI embeddings (`text-embedding-3-small`)

- Frozen. Not fine-tuned (cost, stability, vendor lock-in avoidance).
- Two per profile, built by `build_self_text` / `build_target_text` in `ml/src/just_mate_ml/data/embed.py`:
  - **self**: `Interests: …` + `[Self] Character: …` + `[Self] Appearance: …`
  - **target**: `[Target] Character: …` + `[Target] Appearance: …`
- Cached per profile; recomputed only on profile change.

### 3.2 Shared Encoder

One MLP applied to both inputs: `Linear(1536, 256) → LayerNorm → ReLU → Linear(256, 128) → LayerNorm`, then L2-normalized. The sweeps also try `(512, 256)`, `(128,)`, `(192,)`, `(320,)` hidden layers and dropout.

### 3.3 Match Head

| | v2 (`model_v0`, published) | v3 (`model_v3`, not published) |
|---|---|---|
| Pair features | `[abs(z_t − z_s), z_t ⊙ z_s, cos]` → 257 | `[z_t − z_s, z_t ⊙ z_s, cos]` → 257, plus `soft_jacc` → 258 |
| MLP | `→ 128 → 32 → 1`, ReLU | same |
| ONNX inputs | `target_emb`, `self_emb` | `target_emb`, `self_emb`, `soft_jacc` |

v3's signed difference makes the head itself asymmetric. `soft_jacc` is the semantic interest overlap of the pair, from per-interest embeddings (`ml/data/interest_embeddings.npz`):

```
s_ab      = mean over a ∈ A.interests of max over b ∈ B.interests of cos(a, b)
s_ba      = mean over b ∈ B.interests of max over a ∈ A.interests of cos(a, b)
soft_jacc = (s_ab + s_ba) / 2
```

(`compute_full_soft_jaccard()` in `train_experiments_v3.py`, cached as `ml/data/soft_jaccard.npy`.)

## 4. Joint training loop

One triplet `(A, B, C)` — anchor, bidirectional positive, negative — trains both parts. Simplified from `train_one()` in `train_experiments_v3.py`:

```python
z_t = encoder(target_emb[A])
z_p = encoder(self_emb[B])
z_n = encoder(self_emb[C])

loss_triplet = triplet_margin_loss(z_t, z_p, z_n, margin=1.0, p=2)

logit_p = head(z_t, z_p, soft_jacc_AB)       # target 1
logit_n = head(z_t, z_n, soft_jacc_AC)       # target 0
loss_bce = bce(logit_p, 1) + bce(logit_n, 0)

# v3 only: the reverse direction must agree
logit_p_rev = head(z_p, z_t, soft_jacc_AB)   # target 1
logit_n_rev = head(z_n, z_t, soft_jacc_AC)   # target 0
loss_bidir = bce(logit_p, 1) + bce(logit_p_rev, 1) + bce(logit_n, 0) + bce(logit_n_rev, 0)

loss = loss_triplet + 0.5 * loss_bce + lam_bidir * loss_bidir   # v2: no loss_bidir
```

That is the default loss; both sweeps also try ranking-only and triplet-only variants. AdamW (lr 1e-3, weight decay 1e-4), batch 256, cosine LR schedule, Gaussian input noise σ = 0.01, optional hard-negative mining, early stopping on val AUC of the symmetric `pair_score` (80/20 split by anchor, seed 42). Each script sweeps a list of configs and saves the best: v2 → `ml/checkpoints/model_v0.pt`, v3 → `ml/checkpoints/model_v3.pt`.

## 5. Synthetic training data (M0)

Real meeting outcomes don't exist before launch. Strategy is honest-proxy training.

1. **Profiles.** `just_mate_ml.data.profile_descriptions_v2` generates 25k deterministic profiles: interests plus self/target character and appearance text.
2. **Embeddings.** `just_mate_ml.data.embed` writes the self and target embedding matrices.
3. **Triplets.** `just_mate_ml.data.triplets_v2` / `triplets_v3` pick, per anchor, K = 5 positives and negatives by hard rules: a positive needs interest Jaccard ≥ 0.4 and `cos(target, self) ≥ 0.5` in **both** directions (v3 adds `soft_jacc ≥ 0.55`); negatives come from typed buckets (no shared interests, low overlap, both reject, one-sided, …). Output: `data/triplets.npz` + `data/triplets_ids.json`.

The model learns to reproduce these rules with a non-trivial nonlinearity. With synthetic data only, it is a demonstration of the pipeline, not evidence of real-world matching quality.

## 6. Inference (HTTP scorer container; server wiring pending)

The trained ONNX runs in a single Docker container (`ml/Dockerfile.scorer`) that hosts two `ThreadingHTTPServer` daemons — `match_scorer` on `:8000` and `interest_matcher` on `:8001` — both launched by `ml/scripts/run_servers.py`. The Bun server does **not** call them today (PR #34 reverted the HTTP clients; live matching is the rules-based `compat()`).

### 6.0 `match_scorer` HTTP API

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{"ok": true}` |
| `GET` | `/ready` | — | `{"ready": true, "uptime_s": …}` after ONNX load |
| `POST` | `/score` | `{"target_emb":[…1536…], "self_emb":[…1536…], "soft_jacc": <float>}` | `{"score": <float>}` |
| `POST` | `/pair` | `{"target_a":[…], "self_a":[…], "target_b":[…], "self_b":[…], "soft_ab": <float>, "soft_ba": <float>}` | `{"score_ab": <float>, "score_ba": <float>, "pair_score": <float>}` |
| `POST` | `/batch` | `{"rows": [{…}, …]}` (cap 256) | `{"scores": [<float>, …]}` |

Errors come back as HTTP 4xx with `{"error": "..."}` body; the daemon never crashes on a bad request.

### 6.1 `interest_matcher` HTTP API

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | `{"ok": true}` |
| `GET` | `/ready` | — | `{"ready": true, "uptime_s": …}` after model + vocab load |
| `POST` | `/score` | numeric: `{"interests_a_emb": [[…1536…], …], "interests_b_emb": […], "labels_a": […], "labels_b": […]}` (labels optional); string: `{"interests_a": ["music", …], "interests_b": […]}` | `{"score": <float>, "mode": "linear"|"trained", "features": {...}, "breakdown": […], "matched_exact": […]}` |
| `POST` | `/batch` | `{"rows": [{…}, …]}` (cap 256) | `{"rows": [{…}, …]}` |

Wire payload is auto-detected by key name (`interests_a_emb` → numeric, `interests_a` → string).

### 6.2 Intended server integration

The container is wired for scale; the Bun client is the missing piece:

```
profile create / change (background, off the matching tick)
  1. server: embed self + target text with OpenAI, store per profile
  2. server: for each relevant counterpart B, compute soft_jacc(A, B) (via POST /score on :8001)
  3. server → match_scorer (POST /pair on :8000):
        {target_a, self_a, target_b, self_b, soft_ab, soft_ba}
        → {score_ab, score_ba, pair_score}
  4. server: pair_score → in-memory `pairKey → pair_score` cache

matching tick (every sessionIntervalMs)
  5. canMatch(a, b) hard gates (unchanged)
  6. compat(a, b): synchronous cache read; rules-based score on a miss
```

`compat()` is synchronous and runs per pair per tick, so the scorer is never called inline. The ONNX graph contains encoder + head and takes raw 1536-d embeddings, so every directional score is one full forward pass (sub-millisecond on CPU).

### 6.3 NDJSON dev path

`scripts/match_scorer.py` is the legacy NDJSON daemon, field-for-field identical to `match_scorer_server.py`. Run locally without a container:

```bash
python scripts/match_scorer.py
# NDJSON on stdin: {"id": "r1", "target_emb":[…1536…], "self_emb":[…1536…], "soft_jacc": 0.81}
# NDJSON on stdout: {"id": "r1", "score": 0.78}
```

PyInstaller builds (`scripts/build_match_scorer.sh` + `build_local_mac_and_linux.sh`) freeze the script into a standalone binary so the host needs no Python.

### 6.4 Cache strategy

| Stage | Cache | Key | Value | Recomputed on |
|---|---|---|---|---|
| Profile texts (LLM onboarding) | profile in PostgreSQL | `user_id` | interests, character/appearance text | profile change |
| OpenAI embeddings (planned) | per profile | `user_id` | self + target `float[1536]` | profile change |
| Pair score (planned) | server memory | pair of `user_id`s | `pair_score` | either profile changes, new model |
| Model | container memory (`run_servers.py` process) | — | ONNX weights | container restart |

## 7. Hard gates (server-side, NOT in model)

The model only scores pairs that already passed these:

| Gate | Where | Rule |
|---|---|---|
| Both in search mode | server | `session.state == "searching"` for both |
| Within walking range | server | `haversine(self, candidate) <= R_MATCH` (800 m by default: the shorter of both "walk up to" settings, 5 / 10 / 15 min → 400 / 800 / 1200 m) — **not** same geohash cell: a geohash-6 cell is ~1.2 km wide and its boundaries split neighbours (`PRODUCT.md` §7) |
| Shared active intent | server | `len(session.intents ∩ candidate.session.intents) >= 1` (intents are per session, not per profile) |
| K-anonymity | server | `count_searching_in_zone >= K` (M0: K=1 demo, M1: K=3) — zone = geohash-6, display/anonymity unit only |
| Pair cooldown | server | `now − last_offer_or_vanish(candidate) >= 5 min` |
| One active offer/session | server | `user.active_session is None and user.open_offer is None` |
| Not self, not ghost | server | `user_id != candidate_id and not candidate.ghost` |

Match Head is called only when ALL gates pass. This is important:
- The model never has to learn "do they share intent" (rule-gated)
- The model focuses purely on "given shared intent X, how compatible are they on it"
- Negative sampling simplifies (everyone within range is a candidate for negatives)

## 8. Calibration & threshold

`compat ≥ 0.45` (`COMPAT_THRESHOLD` in `server/src/matching/compat.ts`) is the threshold of the explainable formula. The model's `pair_score` ∈ [0, 2] is on a different scale with its own, model-specific threshold, picked as the F1-best value on the held-out val split:

| Threshold | Applies to |
|---|---|
| **0.78** | Published v2 `model_v0` — default of `score_pair.py` and `benchmark_val.py`; `threshold_sweep.py` sweeps around it |
| 0.85 | Same v2 config, from the training sweep's coarse 0.05 grid (quoted in the eval notebook) |
| **0.40** | v3 run (val AUC 0.9637), only for a v3 model |

Re-run `ml/scripts/threshold_sweep.py` (2-input models) or `gate_sweep.py` (any model) after every retrain; the threshold moves with the data.

## 9. Fallback path

The model is **not** on the critical path. In the planned integration a missing cache entry, a scorer that is down, errors or times out all leave `compat()` on the rules-based score:

```ts
function compat(a: Seeker, b: Seeker): number {
  return modelScores.get(pairKey(a, b)) ?? rulesCompat(a, b)   // 0.7 × Jaccard + 0.3 × shared intent
}
```

The demo never breaks if the scorer has a hiccup, and the explainable formula stays as a transparent sanity check (and as the actual scoring algorithm while the model is disabled). The model score and the formula have different thresholds (§8), so the planned code compares each against its own.

## 10. M0 vs M1 differences

| | M0 (HackYeah 2026) | M1 (production MVP) |
|---|---|---|
| Training data | Synthetic profiles + rule-based labels | Real outcomes: mutual accept + met → 1; dismissed/vanished → 0 |
| Negative sampling | Rule-typed buckets + optional hard-negative mining | Semi-hard (margin-aware) + easy mix |
| k-anonymity gate | K=1 (demo shows all zones) | K=3 (zones <3 stay dark) |
| Embedding | OpenAI `text-embedding-3-small`, self + target | Same, regenerated on profile change |
| Position crypto | Plaintext | E2E position encryption between matched session |
| Model serving | HTTP container exists (`match_scorer` + `interest_matcher` via `run_servers.py`); Bun server doesn't call them yet (PR #34 reverted clients); rules-based `compat()` is the live path | Bun client restored, `match_scorer` + `interest_matcher` containers scale horizontally behind a load balancer. Adds DPIA + extended audit. |
| Audit | None | Persistence-free audit log (decision-only, no positions) |
| DPIA | None | RODO DPIA filed; data subject rights delegated |

## 11. What's real vs canned (ML honesty)

| Real | Canned (labelled) |
|---|---|
| OpenAI embedding API calls | Synthetic profile generation (deterministic per id) |
| Shared Encoder architecture + weights | Training labels (rule-based, not real interactions) |
| Match Head architecture + weights | Profile texts for synthetic profiles |
| Joint training loop (triplet + match) | Negative buckets (rule-typed) |
| `match_scorer` + `interest_matcher` HTTP containers, NDJSON dev daemon, PyInstaller builds | Server integration (planned, §6.2 — PR #34 reverted the client) |
| Threshold sweeps on held-out synthetic data | Calibration on real interactions |

## 12. Open questions

- **λ values.** `0.5` for BCE, `lam_bidir` swept over 0.25 / 0.5 / 1.0 in v3.
- **ONNX export.** The export step is not in the repo; the training scripts save only the PyTorch state dict. The published `model_v0.onnx` was exported outside it. The graph contract the scorer needs is in `ml/README.md` §5.6.
- **Score cache invalidation.** Pairs are `O(n²)`; score only counterparts that can pass the hard gates (same mode/category, nearby, active recently).
- **Attraction vector.** M1 may add it as an extra side feature next to `soft_jacc`.
- **Latency budget.** One directional score is one forward pass (encoder + head) on CPU; scores are computed off the matching tick, so tick latency is unaffected.

## 13. File layout

```
ml/
├── pyproject.toml                    # uv project; installs src/just_mate_ml (hatchling)
├── README.md                         # run-it-yourself guide
├── DEPLOYMENT.md                     # HTTP container deployment (PR #32)
├── Dockerfile.scorer                 # single image hosting match_scorer (:8000) + interest_matcher (:8001)
├── src/just_mate_ml/data/
│   ├── profile_descriptions_v2.py    # synthetic profile generator
│   ├── embed.py                      # profile parser + self/target texts + OpenAI embeddings
│   ├── triplets_v2.py                # rule-based triplets
│   └── triplets_v3.py                # + soft-Jaccard gate and extra negative buckets
├── scripts/
│   ├── build_interest_embeddings.py  # per-interest embeddings for soft_jacc
│   ├── train_experiments_v2.py       # v2 sweep → checkpoints/model_v0.pt
│   ├── train_experiments_v3.py       # v3 sweep → checkpoints/model_v3.pt
│   ├── benchmark_val.py, threshold_sweep.py, gate_sweep.py, build_eval_notebook.py
│   ├── match_scorer.py               # NDJSON ONNX scorer (dev)
│   ├── match_scorer_server.py        # HTTP ONNX scorer on :8000 (production)
│   ├── interest_matcher_server.py    # HTTP interest scorer on :8001 (production)
│   ├── run_servers.py                # launches both HTTP servers in one process
│   ├── score_pair.py                 # CLI pair scoring through match_scorer
│   └── build_match_scorer.sh, build_local_mac_and_linux.sh   # PyInstaller builds
├── notebooks/evaluate_matching_model.ipynb
├── tests/test_bootstrap.py
├── data/                             # generated, gitignored
└── checkpoints/                      # model_v0.{pt,onnx} from Releases, gitignored

docker-compose.yml                    # scorer + server, scorer has healthcheck, internal only
```

**Deployment:** the scorer container (`Dockerfile.scorer`) runs both `match_scorer` (`:8000`) and `interest_matcher` (`:8001`) in one process via `run_servers.py`. `docker-compose.yml` wires it into a network alongside the Bun server; the server is responsible for OpenAI embeddings and `soft_jacc` per pair (planned, see `ml/DEPLOYMENT.md` §6.2).
