# JustMate — ML matching process

> Source of truth for the compatibility scoring pipeline. Read `PRODUCT.md` §7 first for the high-level framing; this doc specifies the model, training loop, data flow, and decisions we locked in.

## 1. TL;DR

- **What it does:** given two faceless profiles (intents + interests + vibe card), output a pairwise compatibility score in `[0, 1]`.
- **Stack:** OpenAI `text-embedding-3-small` → custom PyTorch model (Shared Encoder + Match Head) served by **Python + FastAPI**. Vectors cached in **PostgreSQL with pgvector**.
- **Training objective:** triplet loss + binary match loss, jointly, on synthetic profiles for M0 / HackYeah 2026; on real meeting outcomes for M1.
- **Hard rules (zones, cooldown, session limit, K-anonymity, intent gate) are NOT learned.** Model is one of several gates; everyone else is server-side logic.

## 2. Why a Siamese / Triplet + Match Head

The match problem is pairwise: given two profile embeddings, output a probability that they should meet. Two heads work better than one:

- **Shared Encoder** learns a **compatibility space** — a 128-d vector where compatible profiles are close and incompatible ones are far. Triplet loss drives this.
- **Match Head** sits on top, takes `[|zA−zB|, zA⊙zB, cos(zA, zB)]` (257-d) and outputs the final probability.

Why two heads (not just cosine similarity on OpenAI embeddings, not just a single classifier):
- Raw OpenAI embeddings encode general semantic similarity, not compatibility. A 128-d projector learned on triplets refocuses them.
- The match head learns the *decision boundary*, not just the geometry — handles calibration and class imbalance cleanly.
- Joint training makes both heads cooperate: encoder optimizes for "this pair is close" geometry, head optimizes for "this pair should match" decision. Either alone is weaker.

## 3. Architecture

```
                ┌────────────────────┐
                │  Profile text      │
                │  (intents +        │
                │   interests +      │
                │   vibe card)       │
                └────────┬───────────┘
                         │
                         ▼
              ┌────────────────────┐
              │ OpenAI embed       │
              │ text-embedding-     │
              │   3-small · 1536d  │   (cached per user)
              └────────┬───────────┘
                       e_A · e_B
                         │
                         ▼
              ┌────────────────────┐
              │  Shared Encoder    │
              │  1536 → 512 →      │   (MLP, trained per
              │  512 → 256 →       │    user via triplet
              │  256 → 128         │    + match head)
              └────────┬───────────┘
                       z_A · z_B  (128d)
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       ┌────────────┐        ┌─────────────┐
       │  Triplet   │        │ Match Head  │
       │   Loss     │        │  [|zA−zB|,  │  (analytic on
       │  (training │        │   zA⊙zB,    │   inference)
       │   only)    │        │   cos(zA,zB)│
       └────────────┘        │   ] → 257d  │
                             │   → logit   │
                             └──────┬──────┘
                                    ▼
                              sigmoid → score ∈ [0, 1]
```

### 3.1 OpenAI embedding (`text-embedding-3-small`)

- Frozen. Not fine-tuned (cost, stability, vendor lock-in avoidance).
- Cached per user: `user_id → e[1536]`. Recomputed only on profile change. For hackathon we can pre-compute the whole canned population once.

### 3.2 Shared Encoder

MLP, ReLU activations, LayerNorm between layers:

```
Linear(1536, 512) → LayerNorm → ReLU
Linear( 512, 256) → LayerNorm → ReLU
Linear( 256, 128) → LayerNorm (no ReLU at the end)
```

Output `z` is L2-normalized before the head sees it (stable cosine, stable match head).

### 3.3 Match Head

```
features = concat([
    |z_a − z_b|,         # 128
    z_a ⊙ z_b,           # 128
    cos(z_a, z_b),       # 1
])                       # → 257d

Linear(257, 128) → ReLU
Linear(128,  32) → ReLU
Linear( 32,   1)        # → logit
```

Output is `score = sigmoid(logit)`. The three input feature groups are not redundant: `|·|` measures coordinate-wise disagreement, `⊙` measures coordinate-wise agreement, `cos` measures overall direction.

## 4. Joint training loop

One triplet `(A, B, C)` produces **two** training examples for the head and **one** for the encoder.

```python
for batch in dataloader:           # batch = (A, B, C) triplets
    # 1. Embedding (frozen)
    e_a = openai_embed(batch["a"])   # [B, 1536]
    e_b = openai_embed(batch["b"])
    e_c = openai_embed(batch["c"])

    # 2. Shared encoder (trainable)
    z_a = encoder(e_a)               # [B, 128]
    z_b = encoder(e_b)
    z_c = encoder(e_c)

    # 3. Triplet loss — encoder only
    loss_triplet = triplet_margin_loss(
        anchor=z_a, positive=z_b, negative=z_c,
        margin=1.0, p=2
    )

    # 4. Match head — two examples per triplet
    logit_ab = match_head(z_a, z_b)  # target 1
    logit_ac = match_head(z_a, z_c)  # target 0

    loss_match = (
        bce_with_logits(logit_ab, torch.ones_like(logit_ab))
        + bce_with_logits(logit_ac, torch.zeros_like(logit_ac))
    )

    # 5. Total loss — both tasks backprop through encoder
    loss = loss_triplet + 0.5 * loss_match

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

`λ = 0.5` is a starting point; tune on a held-out synthetic validation set.

## 5. Synthetic training data (M0 / HackYeah 2026)

Real meeting outcomes don't exist before launch. Strategy is honest-proxy training.

**Step 1.** Generate ~5,000 synthetic profiles programmatically:
- Random combination of `intents ⊂ {date, friends, beer, coffee, walking, sports, music}`
- Random combination of `interests ⊂ {beer, coffee, boardgames, rock, techno, hiking, cinema, books, travel, tech, dogs, climbing, photography, food}`
- Vibe card from a canned template pool (deterministic per profile id)

**Step 2.** Define ground-truth compatibility as the explainable baseline + noise:

```
gt_compat(A, B) = clip(
    0.7 * jaccard(A.interests, B.interests)
    + 0.3 * min(1.0, |A.intents ∩ B.intents|)
    + ε,
    0, 1
)
where ε ~ N(0, 0.05)
```

**Step 3.** Sample triplets:
- For each anchor `A`:
  - Positive `B`: high `gt_compat` (≥ 0.7) — strong overlap of interests + shared intent
  - Negative `C`: low `gt_compat` (< 0.2) — disjoint interests, no shared intent

Random negatives are fine for demo; M1 can use semi-hard mining (C closer than the margin but still negative).

**Step 4.** Train 5–10 epochs, batch size 64, AdamW, lr 1e-3.

The model learns to reproduce `gt_compat` with a non-trivial nonlinearity. It's not a trivial lookup of the rule — the encoder compresses, the head generalizes.

## 6. Inference pipeline

For every position update from a searching user (every ~2s):

```
1. client → server: { user_id, lat, lon, ts, session_state }
2. server → db:  SELECT user_embedding WHERE user_id = ?       -- e (cached)
3. server → ml:   POST /score { e_self, candidates: [e_i ...] }  -- z cached server-side
4. ml:           z_self = encoder(e_self)                       -- cached
                 for each candidate_i:
                     z_i = encoder(e_i)                          -- cached
                     score_i = sigmoid(match_head(z_self, z_i))
5. ml → server:  [{ user_id, score_i }]
6. server:       apply hard gates (distance ≤ 400 m, active intent, cooldown, K-anon)
                 for each surviving candidate:
                     if score_i >= threshold_calibrated:
                         offer mutual match
```

**Key point: per-pair encoders are NOT re-encoded on each candidate. `z` is cached per user (in PostgreSQL), keyed by `user_id`.**

### Cache strategy

| Stage | Cache layer | Key | Value | Recomputed on |
|---|---|---|---|---|
| OpenAI embedding | PostgreSQL `users.embedding` | `user_id` | `vector(1536)` | profile change |
| Shared encoder z | PostgreSQL `users.z` (pgvector) | `user_id` | `vector(128)` | encoder retrain / profile change |
| Match Head | in-process | — | weights | model reload |

`pgvector` lets us do approximate nearest-neighbour over `z` for fast candidate selection (production: HNSW index, M=16, ef_construction=64). For hackathon: brute-force cosine over all searching users within `R_MATCH` (fine at small scale).

## 7. Hard gates (server-side, NOT in model)

The model only scores pairs that already passed these:

| Gate | Where | Rule |
|---|---|---|
| Both in search mode | server | `session.state == "searching"` for both |
| Within walking range | server | `haversine(self, candidate) <= R_MATCH` (400 m) — **not** same geohash cell: a geohash-6 cell is ~1.2 km wide and its boundaries split neighbours (`PRODUCT.md` §7) |
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

`compat ≥ 0.45` in PRODUCT.md §7 is the **explainable baseline threshold** for the `0.7 × Jaccard + 0.3 × shared_intents` formula. The neural model output is on a **different scale** and needs a separately calibrated threshold.

Calibration procedure (post-training):
1. Hold out 20% of synthetic profiles as a calibration set.
2. Generate all positive pairs (gt_compat ≥ 0.7) and all negative pairs (gt_compat < 0.2).
3. Run inference, collect raw scores.
4. Plot two distributions. Pick threshold so:
   - False-positive rate (negative pair scoring above) ≤ 5%
   - True-positive rate (positive pair scoring above) ≥ 80%
5. Document the calibrated threshold in the model card.

For M0 hackathon demo: a single `MATCH_THRESHOLD = 0.65` constant, tuned manually.

## 9. Fallback path

The match head is **not** on the critical path of the demo. If anything fails (model not loaded, encoder OOM, FastAPI timeout), the server falls back to the explainable baseline:

```python
def compat(a, b):
    try:
        score = ml_client.score(z_a, z_b, timeout_ms=200)
        return score
    except (Timeout, ServiceUnavailable, ModelNotLoaded):
        return baseline_compat(a, b)   # 0.7 * jaccard + 0.3 * shared_intents
```

This means the demo never breaks if the ML service has a hiccup, and the explainable baseline stays as a transparent sanity check (and as the actual scoring algorithm if the model is disabled).

## 10. M0 vs M1 differences

| | M0 (HackYeah 2026) | M1 (production MVP) |
|---|---|---|
| Training data | Synthetic profiles + rule-based ground truth | Real outcomes: mutual accept + met → 1; dismissed/vanished → 0 |
| Negative sampling | Random from population | Semi-hard (margin-aware) + easy mix |
| k-anonymity gate | K=1 (demo shows all zones) | K=3 (zones <3 stay dark) |
| Cache backend | PostgreSQL + pgvector (small) | PostgreSQL + pgvector + HNSW index |
| Embedding | OpenAI `text-embedding-3-small` cached | Same, with TTL + user-side regeneration on profile change |
| Position crypto | Plaintext (in-process) | E2E position encryption between matched session |
| Model serving | FastAPI on localhost | FastAPI behind reverse proxy + health checks + metrics |
| Audit | None | Persistence-free audit log (decision-only, no positions) |
| DPIA | None | RODO DPIA filed; data subject rights delegated |

## 11. What's real vs canned (ML honesty)

| Real | Canned (labelled) |
|---|---|
| OpenAI embedding API calls | Synthetic profile generation (deterministic per id) |
| Shared Encoder architecture + weights | Training labels (rule-based ground truth, not real interactions) |
| Match Head architecture + weights | Attraction vector input (deterministic simulated, not trained-on-phone) |
| Joint training loop (triplet + match) | Negative sampling strategy (random for demo) |
| pgvector cache | HNSW index (planned for M1) |
| Calibration procedure | Real calibration metrics on held-out real interactions |

## 12. Open questions (to resolve during build)

- **λ value.** Start at 0.5; tune on synthetic validation.
- **Encoder width.** Current 512→256→128. Could go narrower (256→128) for fewer params; current is fine for hackathon.
- **Vibe card as input.** Should vibe-card text be concatenated to the profile text fed to OpenAI? Recommendation: yes — it carries personality signal.
- **Attraction vector.** M0 uses simulated deterministic scalar; M1 will train on-device. Model input should accept it as a one-dim side feature `cat([features, abs(attr_a − attr_b), attr_a * attr_b])` → 259d. Optional for M0.
- **Calibration data size.** Need at least 1000 positive + 1000 negative pairs for stable calibration; generate from ~5000 synthetic profiles.
- **Where is the model file?** Convention: `ml/checkpoints/model_v0.pt`, versioned. FastAPI startup loads the latest.
- **Latency budget.** End-to-end score for one candidate pair (cached z) should be <5ms on CPU. Encoder step (proxy) cached; only Match Head runs.

## 13. File layout

```
ml/
├── pyproject.toml
├── src/
│   └── just_mate_ml/
│       ├── __init__.py
│       ├── data/
│       │   ├── profiles.py        # synthetic profile generator
│       │   └── triplets.py        # triplet sampler (random for M0)
│       ├── model/
│       │   ├── encoder.py         # Shared Encoder (1536 → 128)
│       │   ├── head.py            # Match Head (257 → 1)
│       │   └── losses.py          # triplet + bce
│       ├── train.py               # training loop
│       ├── calibrate.py           # threshold calibration on hold-out
│       ├── export.py              # torch → onnx or torchscript
│       └── serve/
│           ├── app.py             # FastAPI app
│           ├── cache.py           # pgvector read/write
│           └── routes.py          # /score, /health, /reload
└── tests/
    ├── test_encoder_shape.py
    ├── test_match_head_shape.py
    ├── test_training_step.py
    └── test_serve.py
```