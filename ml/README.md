# JustMate ML

PyTorch training of the asymmetric Siamese matching model (Shared Encoder + Match Head, triplet + match-loss), exported to ONNX. The Bun/Elysia server spawns `scripts/match_scorer.py` as a long-lived subprocess for inference (newline-delimited JSON over stdin/stdout).

See [`../docs/ML-MATCHING.md`](../docs/ML-MATCHING.md) for the full process specification.

## Quickstart

```bash
# Python deps
uv sync

# Sanity-check the toolchain
uv run pytest tests/test_bootstrap.py -v
```

## Pipeline

```bash
# 1. Generate synthetic profiles (25k profiles, parallel)
uv run python -m just_mate_ml.data.profile_descriptions_v2 25000 data/profiles_descriptions.txt

# 2. Embed them via OpenAI text-embedding-3-small → dual embeddings (self + target)
export OPENAI_API_KEY=sk-...
uv run python -m just_mate_ml.data.embed data/profiles_descriptions.txt data/

# 3. Build triplet training set (25k anchors × 5 = 125k triplets)
uv run python -m just_mate_ml.data.triplets_v2 data/profiles_descriptions.txt \
    data/profile_embeddings_self.npy data/profile_embeddings_target.npy data/

# 4. Train — sweeps hyperparams, saves best checkpoint to checkpoints/model_v0.pt
uv run python scripts/train_experiments_v2.py

# 5. Export best → ONNX (manual step; ONNX is checked into checkpoints/)

# 6. Calibrate threshold + eval
uv run python scripts/threshold_sweep.py
uv run python scripts/benchmark_val.py
uv run python scripts/build_eval_notebook.py  # → notebooks/evaluate_matching_model.ipynb

# 7. Serve: start the scorer (consumed by the Bun server)
uv run python scripts/match_scorer.py checkpoints/model_v0.onnx
```

## Layout

```
src/just_mate_ml/
├── data/
│   ├── embed.py                    # OpenAI embeddings + profile parser (parse_profiles)
│   ├── profile_descriptions_v2.py  # Synthetic profile generator (parallel, 25k pools)
│   └── triplets_v2.py              # Strict bidirectional triplet selection
scripts/
├── train_experiments_v2.py         # Hyperparam sweep → checkpoints/model_v0.pt
├── benchmark_val.py                # ONNX benchmark (val AUC, F1, threshold sweep)
├── threshold_sweep.py              # Detailed threshold sweep on full val set
├── build_eval_notebook.py          # Generate the eval notebook
├── match_scorer.py                 # Standalone ONNX inference (newline JSON over stdio)
└── score_pair.py                   # CLI client for match_scorer.py
notebooks/
└── evaluate_matching_model.ipynb   # Eval notebook (regenerable via build_eval_notebook.py)
tests/
└── test_bootstrap.py               # Deps + C++ toolchain sanity
data/                               # Synthetic profiles + embeddings + triplets (gitignored large files)
checkpoints/                        # model_v0.pt + model_v0.onnx (gitignored)
```