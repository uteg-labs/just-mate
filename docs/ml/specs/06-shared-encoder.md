# T06 — Shared Encoder

**Goal:** the MLP that projects a 1536-d OpenAI embedding into a 128-d compatibility vector. Trained via triplet loss (T08). At inference time, called **once per user** to populate the pgvector cache — never in the per-pair scoring path.

**Time:** 30 min.

**Prerequisites:** T01.

---

## What we lock in here

- **Architecture** (per ML-MATCHING.md §3.2):
  ```
  Linear(1536, 512) → LayerNorm → ReLU
  Linear( 512, 256) → LayerNorm → ReLU
  Linear( 256, 128) → LayerNorm       (no ReLU at end — features live in linear regime)
  ```
- **Output:** L2-normalized 128-d vector (so cos(z_a, z_c) is well-defined).
- **Weight init:** PyTorch defaults (Kaiming uniform) — fine for hackathon.
- **Dropout:** none — model is small and we want it to fully use the small dataset.
- **Forward signature:** `forward(e: Tensor[B, 1536]) → Tensor[B, 128]`.

---

## Files to create

```
ml/
├── src/just_mate_ml/model/
│   └── encoder.py          # SharedEncoder
└── tests/
    └── test_encoder_shape.py
```

---

## `ml/src/just_mate_ml/model/encoder.py`

```python
"""Shared Encoder — projects 1536-d embedding to 128-d compatibility vector.

Architecture (ML-MATCHING.md §3.2):
    Linear(1536, 512) → LayerNorm → ReLU
    Linear( 512, 256) → LayerNorm → ReLU
    Linear( 256, 128) → LayerNorm       (no activation on final projection)

Output: L2-normalized 128-d vector.
"""
from __future__ import annotations

import torch
import torch.nn as nn


ENCODER_INPUT_DIM = 1536
ENCODER_HIDDEN_DIMS = (512, 256)
ENCODER_OUTPUT_DIM = 128


class SharedEncoder(nn.Module):
    def __init__(
        self,
        input_dim: int = ENCODER_INPUT_DIM,
        hidden_dims: tuple[int, ...] = ENCODER_HIDDEN_DIMS,
        output_dim: int = ENCODER_OUTPUT_DIM,
    ):
        super().__init__()
        layers: list[nn.Module] = []
        prev = input_dim
        for hidden in hidden_dims:
            layers.append(nn.Linear(prev, hidden))
            layers.append(nn.LayerNorm(hidden))
            layers.append(nn.ReLU())
            prev = hidden
        # Final projection: no ReLU — keep features in linear regime
        layers.append(nn.Linear(prev, output_dim))
        layers.append(nn.LayerNorm(output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, e: torch.Tensor) -> torch.Tensor:
        """e: [B, 1536] → z: [B, 128] (L2-normalized)"""
        z = self.network(e)
        return torch.nn.functional.normalize(z, p=2, dim=-1)
```

---

## Tests

### `tests/test_encoder_shape.py`

```python
import torch

from just_mate_ml.model.encoder import (
    ENCODER_INPUT_DIM,
    ENCODER_OUTPUT_DIM,
    SharedEncoder,
)


def test_forward_shape():
    enc = SharedEncoder()
    e = torch.randn(8, ENCODER_INPUT_DIM)
    z = enc(e)
    assert z.shape == (8, ENCODER_OUTPUT_DIM)


def test_forward_single_sample():
    """Batch size 1 also works (single-user cache population)."""
    enc = SharedEncoder()
    e = torch.randn(1, ENCODER_INPUT_DIM)
    z = enc(e)
    assert z.shape == (1, ENCODER_OUTPUT_DIM)


def test_output_is_l2_normalized():
    enc = SharedEncoder()
    e = torch.randn(16, ENCODER_INPUT_DIM)
    z = enc(e)
    norms = z.norm(p=2, dim=-1)
    assert torch.allclose(norms, torch.ones(16), atol=1e-5)


def test_custom_dims():
    """The architecture is parameterised for sanity checks elsewhere."""
    enc = SharedEncoder(input_dim=1536, hidden_dims=(256,), output_dim=64)
    e = torch.randn(2, 1536)
    z = enc(e)
    assert z.shape == (2, 64)


def test_gradient_flows():
    """Sanity: gradients must reach the first layer (no frozen params)."""
    enc = SharedEncoder()
    e = torch.randn(4, ENCODER_INPUT_DIM, requires_grad=True)
    z = enc(e)
    loss = z.sum()
    loss.backward()
    assert e.grad is not None
    # First Linear's weight gradient must be non-zero
    first_linear = enc.network[0]
    assert first_linear.weight.grad is not None
    assert first_linear.weight.grad.abs().sum() > 0
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_encoder_shape.py -v
```

Optional sanity check — what does the encoder output look like on real OpenAI embeddings before training?

```bash
uv run python -c "
import torch
from just_mate_ml.model.encoder import SharedEncoder
enc = SharedEncoder()
e = torch.randn(2, 1536)
z = enc(e)
print('z shape:', z.shape)
print('z norms:', z.norm(dim=-1))
print('z first 4 dims:', z[0, :4])
"
```

Expected: shape `(2, 128)`, norms ~1.0, values in some small range.

---

## Definition of Done

- [ ] `ml/src/just_mate_ml/model/encoder.py` exports `SharedEncoder`
- [ ] All 5 tests pass
- [ ] Forward shape is `[B, 128]` for any input batch
- [ ] Output is L2-normalized (test enforces)

---

## Open question (defer to T08 if needed)

- **Width:** current `1536 → 512 → 256 → 128`. Could go `1536 → 256 → 128` for fewer params; current is fine.
- **Dropout:** none. If T08 train loss < val loss by a lot, add 0.1 dropout before the final Linear.

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `z.norm()` not exactly 1.0 | `torch.nn.functional.normalize` does the work; verify the test asserts `atol=1e-5` |
| `Linear → ReLU → LayerNorm` ordering | we use `Linear → Layernorm → ReLU` — LayerNorm before activation is the modern convention and matches what the plan locks in |
| Output has NaNs | likely `1/0` in L2 norm — happens if hidden activations are all 0. Init weights shouldn't produce this; check `prev = input_dim` in init |