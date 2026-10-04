# T04 — Model architecture

> **Status: original hackathon spec, kept for history.** It was not built as written: the modules, file names and architecture here don't match `ml/`. Actual modules are listed at the top of [`../PLAN.md`](../PLAN.md); the current design is [`docs/ML-MATCHING.md`](../../ML-MATCHING.md).
>
> **As built (current code, summary — full detail in `docs/ML-MATCHING.md` §3):**
> - `train_experiments_v3.py` defines the architecture inline (within the training script). There is no `model/encoder.py` / `model/head.py` / `model/siamese.py` module split; the encoder is `SharedEncoder` and the head is `MatchHead`, both as top-level classes in the training script.
> - Shared Encoder: `Linear(1536, 256) → LayerNorm → ReLU → Linear(256, 128) → LayerNorm → L2-norm`. Same weights applied to both `self_emb` and `target_emb`. The sweeps try other widths.
> - Match Head (v3, asymmetric): `[z_t − z_s, z_t ⊙ z_s, cos(z_t, z_s)]` → 257-d, plus an optional `soft_jacc` (1-d, v3 only) → 258-d, then `Linear(258, 128) → ReLU → Linear(128, 32) → ReLU → Linear(32, 1)` → logit → sigmoid.
> - v2 (older, kept for ablation): symmetric features `[abs(z_t − z_s), z_t ⊙ z_s, cos]` → 257-d, same MLP head. 2-input ONNX (`target_emb`, `self_emb`).
> - v3 (current, not published yet): asymmetric features, `soft_jacc` side feature, bidirectional BCE term in the loss. 3-input ONNX (`target_emb`, `self_emb`, `soft_jacc`).
> - The model is exported to ONNX in the training script's tail (`scripts/train_experiments_v2.py`, `train_experiments_v3.py`); the scorer is `ml/scripts/match_scorer.py` (NDJSON, dev) or `ml/scripts/match_scorer_server.py` (HTTP, production).
>
> The TDLR below remains for history.

**Goal (original):** PyTorch modules for Shared Encoder (1536→128) and Match Head (257→1), wrapped in a joint `SiameseCompatModel`.

**Time:** 30 min.

**Prerequisites:** T01.

---

## `src/just_mate_ml/model/encoder.py`

```python
import torch
import torch.nn as nn

ENCODER_INPUT_DIM = 1536
ENCODER_HIDDEN_DIMS = (512, 256)
ENCODER_OUTPUT_DIM = 128


class SharedEncoder(nn.Module):
    def __init__(self, input_dim=ENCODER_INPUT_DIM, hidden_dims=ENCODER_HIDDEN_DIMS,
                 output_dim=ENCODER_OUTPUT_DIM):
        super().__init__()
        layers: list[nn.Module] = []
        prev = input_dim
        for hidden in hidden_dims:
            layers.append(nn.Linear(prev, hidden))
            layers.append(nn.LayerNorm(hidden))
            layers.append(nn.ReLU())
            prev = hidden
        layers.append(nn.Linear(prev, output_dim))
        layers.append(nn.LayerNorm(output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, e: torch.Tensor) -> torch.Tensor:
        z = self.network(e)
        return torch.nn.functional.normalize(z, p=2, dim=-1)
```

---

## `src/just_mate_ml/model/head.py`

```python
import torch
import torch.nn as nn

ENCODER_OUTPUT_DIM = 128
PAIR_FEATURE_DIM = 2 * ENCODER_OUTPUT_DIM + 1  # 257


def build_pair_features(z_a: torch.Tensor, z_b: torch.Tensor) -> torch.Tensor:
    """[B, 128], [B, 128] → [B, 257]: concat(|diff|, prod, cos)."""
    diff = (z_a - z_b).abs()
    prod = z_a * z_b
    cos = (z_a * z_b).sum(dim=-1, keepdim=True)  # since |z|=1
    return torch.cat([diff, prod, cos], dim=-1)


class MatchHead(nn.Module):
    def __init__(self, input_dim=PAIR_FEATURE_DIM, hidden_dims=(128, 32)):
        super().__init__()
        layers: list[nn.Module] = []
        prev = input_dim
        for hidden in hidden_dims:
            layers.append(nn.Linear(prev, hidden))
            layers.append(nn.ReLU())
            prev = hidden
        layers.append(nn.Linear(prev, 1))
        self.network = nn.Sequential(*layers)

    def forward(self, z_a, z_b) -> torch.Tensor:
        features = build_pair_features(z_a, z_b)
        return self.network(features).squeeze(-1)
```

---

## `src/just_mate_ml/model/siamese.py`

```python
import torch
import torch.nn as nn

from just_mate_ml.model.encoder import SharedEncoder
from just_mate_ml.model.head import MatchHead


class SiameseCompatModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = SharedEncoder()
        self.head = MatchHead()

    def forward(self, e_a, e_b):
        """[B, 1536] x2 → (logit [B], z_a [B, 128], z_b [B, 128])."""
        z_a = self.encoder(e_a)
        z_b = self.encoder(e_b)
        logit = self.head(z_a, z_b)
        return logit, z_a, z_b

    def score(self, e_a, e_b) -> torch.Tensor:
        """Returns score ∈ [0, 1] (sigmoid applied)."""
        logit, _, _ = self.forward(e_a, e_b)
        return torch.sigmoid(logit)
```

---

## `tests/test_encoder.py`

```python
import torch

from just_mate_ml.model.encoder import (
    ENCODER_INPUT_DIM, ENCODER_OUTPUT_DIM, SharedEncoder,
)


def test_forward_shape():
    enc = SharedEncoder()
    z = enc(torch.randn(8, ENCODER_INPUT_DIM))
    assert z.shape == (8, ENCODER_OUTPUT_DIM)


def test_output_l2_normalized():
    enc = SharedEncoder()
    z = enc(torch.randn(16, ENCODER_INPUT_DIM))
    assert torch.allclose(z.norm(p=2, dim=-1), torch.ones(16), atol=1e-5)


def test_gradient_flows():
    enc = SharedEncoder()
    z = enc(torch.randn(4, ENCODER_INPUT_DIM)).sum()
    z.backward()
    assert enc.network[0].weight.grad is not None
    assert enc.network[0].weight.grad.abs().sum() > 0
```

## `tests/test_head.py`

```python
import torch

from just_mate_ml.model.head import (
    ENCODER_OUTPUT_DIM, PAIR_FEATURE_DIM, MatchHead, build_pair_features,
)


def test_pair_features_shape():
    z_a = torch.randn(8, ENCODER_OUTPUT_DIM)
    z_b = torch.randn(8, ENCODER_OUTPUT_DIM)
    assert build_pair_features(z_a, z_b).shape == (8, PAIR_FEATURE_DIM)


def test_pair_features_symmetric():
    z_a = torch.nn.functional.normalize(torch.randn(4, ENCODER_OUTPUT_DIM), dim=-1)
    z_b = torch.nn.functional.normalize(torch.randn(4, ENCODER_OUTPUT_DIM), dim=-1)
    torch.testing.assert_close(
        build_pair_features(z_a, z_b), build_pair_features(z_b, z_a)
    )


def test_match_head_forward_shape():
    head = MatchHead()
    z = torch.randn(8, ENCODER_OUTPUT_DIM)
    assert head(z[:4], z[4:]).shape == (4,)


def test_match_head_symmetric():
    head = MatchHead()
    z = torch.randn(2, ENCODER_OUTPUT_DIM)
    a, b = head(z[0:1], z[1:2]).item(), head(z[1:2], z[0:1]).item()
    assert abs(a - b) < 1e-5
```

## `tests/test_siamese.py`

```python
import torch

from just_mate_ml.model.siamese import SiameseCompatModel
from just_mate_ml.model.encoder import ENCODER_INPUT_DIM, ENCODER_OUTPUT_DIM


def test_joint_forward_shape():
    model = SiameseCompatModel()
    e_a = torch.randn(4, ENCODER_INPUT_DIM)
    e_b = torch.randn(4, ENCODER_INPUT_DIM)
    logit, z_a, z_b = model(e_a, e_b)
    assert logit.shape == (4,)
    assert z_a.shape == (4, ENCODER_OUTPUT_DIM)
    assert z_b.shape == (4, ENCODER_OUTPUT_DIM)


def test_score_in_unit_range():
    model = SiameseCompatModel()
    e_a = torch.randn(8, ENCODER_INPUT_DIM)
    e_b = torch.randn(8, ENCODER_INPUT_DIM)
    score = model.score(e_a, e_b)
    assert (score >= 0.0).all() and (score <= 1.0).all()
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_encoder.py tests/test_head.py tests/test_siamese.py -v
```

---

## Definition of Done

- [ ] `SharedEncoder` output shape `[B, 128]`, L2-normalized
- [ ] `MatchHead` output shape `[B]`
- [ ] Pair features symmetric: `feat(a,b) = feats(b,a)`
- [ ] All 10 tests pass