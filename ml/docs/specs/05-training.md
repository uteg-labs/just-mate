# T05 — Training

> **Status: original hackathon spec, kept for history.** It was not built as written: the modules, file names and architecture here don't match `ml/`. Actual modules are listed at the top of [`../PLAN.md`](../PLAN.md); the current design is [`docs/ML-MATCHING.md`](../../../docs/ML-MATCHING.md).

**Goal:** train `SiameseCompatModel` on triplet dataset (built from T03 pairs), save best checkpoint by val loss.

**Time:** 60 min.

**Prerequisites:** T03, T04.

> **Face embeddings are intentionally NOT used in training.** The model only sees the 1536-d text embedding (`e`). Face similarity is computed at scoring stage, not here. Confirm in the train loop: `model(a, b)` and `model(a, c)` only consume `e_a`, `e_b`, `e_c` — never `face_a`, `face_b`, `face_c`.

**Hyperparameters:**
- AdamW, lr=1e-3, weight_decay=1e-4
- batch=64 triplets, epochs=10, patience=3
- triplet margin=1.0, λ (match loss weight)=0.5
- train/val split: 80/20 by anchor (not by pair)

**Loss:** `triplet_margin(anchor, pos, neg) + 0.5 × BCE(ab, 1) + 0.5 × BCE(ac, 0)`

---

## `src/just_mate_ml/model/losses.py`

```python
import torch
import torch.nn.functional as F

TRIPLET_MARGIN = 1.0
LAMBDA = 0.5


def triplet_margin_loss(z_a, z_b, z_c):
    return F.triplet_margin_loss(z_a, z_b, z_c, margin=TRIPLET_MARGIN, p=2)


def match_loss(logit_ab, logit_ac):
    return (
        F.binary_cross_entropy_with_logits(logit_ab, torch.ones_like(logit_ab))
        + F.binary_cross_entropy_with_logits(logit_ac, torch.zeros_like(logit_ac))
    )


def joint_loss(z_a, z_b, z_c, logit_ab, logit_ac):
    return triplet_margin_loss(z_a, z_b, z_c) + LAMBDA * match_loss(logit_ab, logit_ac)
```

---

## `src/just_mate_ml/data/triplets.py`

```python
import random
from collections import defaultdict

import numpy as np


def build_triplets(idx_a: np.ndarray, idx_b: np.ndarray, label: np.ndarray,
                   max_triplets_per_anchor: int = 5, seed: int = 42
                   ) -> list[tuple[int, int, int]]:
    """Group pairs by anchor. For each anchor (≥1 pos + ≥1 neg), form up to
    max_triplets_per_anchor (anchor, pos, neg) tuples."""
    rng = random.Random(seed)
    by_anchor: dict[int, dict[str, list[int]]] = defaultdict(lambda: {"pos": [], "neg": []})
    for a, b, lab in zip(idx_a, idx_b, label):
        a, b = int(a), int(b)
        bucket = "pos" if lab == 1 else "neg"
        by_anchor[a][bucket].append(b)

    triplets: list[tuple[int, int, int]] = []
    for anchor, sides in by_anchor.items():
        if not sides["pos"] or not sides["neg"]:
            continue
        n = min(len(sides["pos"]), len(sides["neg"]), max_triplets_per_anchor)
        rng.shuffle(sides["pos"])
        rng.shuffle(sides["neg"])
        for i in range(n):
            triplets.append((anchor, sides["pos"][i], sides["neg"][i]))

    rng.shuffle(triplets)
    return triplets


def split_triplets_by_anchor(triplets, train_frac=0.8, seed=42):
    rng = random.Random(seed)
    anchors = sorted({t[0] for t in triplets})
    rng.shuffle(anchors)
    n_train = int(len(anchors) * train_frac)
    train_anchors = set(anchors[:n_train])
    train = [t for t in triplets if t[0] in train_anchors]
    val = [t for t in triplets if t[0] not in train_anchors]
    return train, val
```

---

## `src/just_mate_ml/train.py`

```python
import json
import random
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch

from just_mate_ml.data.embed import load_embeddings
from just_mate_ml.data.pairs import load_pairs
from just_mate_ml.data.profiles import load_jsonl
from just_mate_ml.data.triplets import build_triplets, split_triplets_by_anchor
from just_mate_ml.model.losses import joint_loss
from just_mate_ml.model.siamese import SiameseCompatModel


ML_DIR = Path(__file__).resolve().parents[2]
EMBEDDINGS_PATH = ML_DIR / "data" / "embeddings.npy"
USER_ID_INDEX = ML_DIR / "data" / "user_id_index.json"
PAIRS_PATH = ML_DIR / "data" / "pairs.npz"
PROFILES_PATH = ML_DIR / "data" / "profiles.jsonl"
CHECKPOINT_PATH = ML_DIR / "checkpoints" / "model_v0.pt"
TRAIN_LOG_PATH = ML_DIR / "checkpoints" / "train_log.json"


@dataclass
class TrainConfig:
    epochs: int = 10
    batch_size: int = 64
    lr: float = 1e-3
    weight_decay: float = 1e-4
    seed: int = 42
    train_frac: float = 0.8
    patience: int = 3
    max_triplets_per_anchor: int = 5


def _batched(triplets, batch_size):
    return [triplets[i:i + batch_size] for i in range(0, len(triplets), batch_size)]


def train_jointly(embeddings, triplets, cfg=None):
    cfg = cfg or TrainConfig()
    torch.manual_seed(cfg.seed)
    np.random.seed(cfg.seed)
    random.seed(cfg.seed)

    train_triplets, val_triplets = split_triplets_by_anchor(
        triplets, train_frac=cfg.train_frac, seed=cfg.seed
    )
    print(f"train: {len(train_triplets)}, val: {len(val_triplets)}")

    model = SiameseCompatModel()
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay
    )

    log: list[dict] = []
    best_val = float("inf")
    epochs_no_improve = 0

    for epoch in range(1, cfg.epochs + 1):
        # train
        model.train()
        train_loss = n_batches = 0
        shuffled = list(train_triplets)
        random.Random(cfg.seed + epoch).shuffle(shuffled)
        for batch in _batched(shuffled, cfg.batch_size):
            a = torch.from_numpy(embeddings[[t[0] for t in batch]]).float()
            b = torch.from_numpy(embeddings[[t[1] for t in batch]]).float()
            c = torch.from_numpy(embeddings[[t[2] for t in batch]]).float()
            logit_ab, z_a, z_b = model(a, b)
            logit_ac, _, z_c = model(a, c)
            loss = joint_loss(z_a, z_b, z_c, logit_ab, logit_ac)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            n_batches += 1
        train_loss /= max(1, n_batches)

        # val
        model.eval()
        val_loss = n_val = 0
        with torch.no_grad():
            for batch in _batched(val_triplets, cfg.batch_size):
                a = torch.from_numpy(embeddings[[t[0] for t in batch]]).float()
                b = torch.from_numpy(embeddings[[t[1] for t in batch]]).float()
                c = torch.from_numpy(embeddings[[t[2] for t in batch]]).float()
                logit_ab, z_a, z_b = model(a, b)
                logit_ac, _, z_c = model(a, c)
                loss = joint_loss(z_a, z_b, z_c, logit_ab, logit_ac)
                val_loss += loss.item()
                n_val += 1
        val_loss /= max(1, n_val)

        log.append({"epoch": epoch, "train_loss": train_loss, "val_loss": val_loss})
        print(f"epoch {epoch:2d}  train={train_loss:.4f}  val={val_loss:.4f}")

        if val_loss < best_val:
            best_val = val_loss
            epochs_no_improve = 0
            CHECKPOINT_PATH.parent.mkdir(parents=True, exist_ok=True)
            torch.save({
                "encoder": model.encoder.state_dict(),
                "head": model.head.state_dict(),
            }, CHECKPOINT_PATH)
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= cfg.patience:
                print(f"early stop at epoch {epoch}")
                break

    TRAIN_LOG_PATH.write_text(json.dumps(log, indent=2))
    return model, log


def main():
    embeddings, _ = load_embeddings(EMBEDDINGS_PATH, USER_ID_INDEX)
    idx_a, idx_b, _, label = load_pairs(PAIRS_PATH)
    triplets = build_triplets(idx_a, idx_b, label, max_triplets_per_anchor=5)
    print(f"embeddings: {embeddings.shape}, pairs: {len(idx_a)}, triplets: {len(triplets)}")

    model, log = train_jointly(embeddings, triplets)
    best = min(e["val_loss"] for e in log)
    print(f"done. best val_loss: {best:.4f}; saved to {CHECKPOINT_PATH}")


if __name__ == "__main__":
    main()
```

---

## `tests/test_losses.py`

```python
import torch

from just_mate_ml.model.encoder import SharedEncoder
from just_mate_ml.model.head import MatchHead
from just_mate_ml.model.losses import joint_loss, match_loss, triplet_margin_loss


def test_triplet_loss_smaller_when_positive_is_close():
    z_a = torch.nn.functional.normalize(torch.randn(4, 128), dim=-1)
    z_close = torch.nn.functional.normalize(z_a + 0.01 * torch.randn(4, 128), dim=-1)
    z_far = -z_a
    assert triplet_margin_loss(z_a, z_close, z_far) < triplet_margin_loss(z_a, z_far, z_close)


def test_match_loss_returns_finite():
    loss = match_loss(torch.tensor([2.0]), torch.tensor([-2.0]))
    assert torch.isfinite(loss) and loss.item() > 0


def test_joint_loss_backprop_to_both_heads():
    encoder = SharedEncoder()
    head = MatchHead()
    e_a = torch.randn(4, 1536)
    e_b = torch.randn(4, 1536)
    e_c = torch.randn(4, 1536)
    z_a = encoder(e_a)
    z_b = encoder(e_b)
    z_c = encoder(e_c)
    logit_ab = head(z_a, z_b)
    logit_ac = head(z_a, z_c)
    joint_loss(z_a, z_b, z_c, logit_ab, logit_ac).backward()
    assert encoder.network[0].weight.grad is not None
    assert head.network[0].weight.grad is not None
```

## `tests/test_triplets.py`

```python
import numpy as np

from just_mate_ml.data.triplets import build_triplets, split_triplets_by_anchor


def test_build_triplets_produces_nonempty():
    idx_a = np.array([0, 0, 0, 1, 1])
    idx_b = np.array([10, 11, 12, 13, 14])
    label = np.array([1, 1, 0, 1, 0])
    triplets = build_triplets(idx_a, idx_b, label, max_triplets_per_anchor=5)
    assert len(triplets) > 0


def test_split_separates_anchors():
    triplets = [(i, 100, 200) for i in range(100)]
    train, val = split_triplets_by_anchor(triplets, train_frac=0.8)
    train_anchors = {t[0] for t in train}
    val_anchors = {t[0] for t in val}
    assert train_anchors.isdisjoint(val_anchors)
    assert len(train_anchors) == 80
```

## `tests/test_training_step.py`

```python
import torch

from just_mate_ml.model.losses import joint_loss
from just_mate_ml.model.siamese import SiameseCompatModel


def test_one_step_training_decreases_loss():
    torch.manual_seed(0)
    model = SiameseCompatModel()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-2)
    e = torch.nn.functional.normalize(torch.randn(1, 1536), dim=-1)
    e_pos = torch.nn.functional.normalize(e + 0.01 * torch.randn(1, 1536), dim=-1)
    e_neg = torch.nn.functional.normalize(-e + 0.1 * torch.randn(1, 1536), dim=-1)

    losses = []
    for _ in range(10):
        logit_ab, z_a, z_b = model(e, e_pos)
        logit_ac, _, z_c = model(e, e_neg)
        loss = joint_loss(z_a, z_b, z_c, logit_ab, logit_ac)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        losses.append(loss.item())

    assert losses[-1] < losses[0] - 0.01 or losses[-1] < losses[0] * 0.95
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_losses.py tests/test_triplets.py tests/test_training_step.py -v
uv run python -m just_mate_ml.train
cat checkpoints/train_log.json
```

---

## Definition of Done

- [ ] All 6 tests pass
- [ ] `checkpoints/model_v0.pt` exists with `{"encoder": ..., "head": ...}`
- [ ] `checkpoints/train_log.json` has ≥3 epochs, val_loss monotonically decreasing
- [ ] Best val_loss < 1.0 (sanity check: random init ≈ 1.5-2.0)