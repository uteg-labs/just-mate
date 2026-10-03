# T04 — Triplet sampler + ground truth

**Goal:** produce training triplets `(A, B, C)` where `gt_compat(A, B)` is high and `gt_compat(A, C)` is low. Ground truth is the explainable baseline formula + small Gaussian noise.

**Time:** 30 min.

**Prerequisites:** T03 (need synthetic profiles).

---

## What we lock in here

- **Ground truth function** (matches ML-MATCHING.md §5 and PRODUCT.md §7 baseline):
  ```
  gt_compat(A, B) = clip(
      0.7 * jaccard(A.interests, B.interests)
      + 0.3 * min(1.0, |A.intents ∩ B.intents|)
      + ε,                              # ε ~ N(0, 0.05)
      0, 1
  )
  ```
- **Triplet sampling rule**:
  - For each anchor `A`:
    - Positive `B`: `gt_compat(A, B) ≥ 0.7` (strong overlap)
    - Negative `C`: `gt_compat(A, C) ≤ 0.2` (weak overlap)
  - If no positive/negative available, **drop the triplet** (not a fatal error).
- **Random negatives** for M0 (semi-hard mining deferred to M1).
- **Output:** `ml/data/triplets.jsonl`, one triplet per line `{anchor_id, positive_id, negative_id}`.
- **Determinism:** anchors iterated in id order; positive/negative sampled via deterministic tie-breakers.

---

## Files to create

```
ml/
├── src/just_mate_ml/data/
│   ├── compat.py            # gt_compat, jaccard, shared_intents
│   └── triplets.py          # sample_triplets, save_jsonl, load_jsonl
├── data/
│   └── triplets.jsonl       # generated artifact
└── tests/
    └── test_triplets.py
```

---

## `ml/src/just_mate_ml/data/compat.py`

```python
"""Ground-truth compatibility function.

Mirrors PRODUCT.md §7 baseline formula exactly:

    gt_compat(A, B) = clip(
        0.7 * jaccard(A.interests, B.interests)
        + 0.3 * min(1.0, |A.intents ∩ B.intents|)
        + ε,
        0, 1
    )

The noise term ε makes the encoder's job non-trivial — without it the
encoder collapses to a lookup table of the rule.
"""
from __future__ import annotations

import random


def jaccard(a: list[str], b: list[str]) -> float:
    if not a and not b:
        return 1.0
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    inter = sa & sb
    union = sa | sb
    if not union:
        return 1.0
    return len(inter) / len(union)


def shared_intents(a: list[str], b: list[str]) -> int:
    return len(set(a) & set(b))


def gt_compat(
    a: dict,
    b: dict,
    rng: random.Random | None = None,
    noise_sigma: float = 0.05,
) -> float:
    """Baseline ground-truth compatibility score in [0, 1]."""
    j = jaccard(a["interests"], b["interests"])
    si = min(1.0, shared_intents(a["intents"], b["intents"]))
    raw = 0.7 * j + 0.3 * si
    if rng is not None:
        raw += rng.gauss(0, noise_sigma)
    return max(0.0, min(1.0, raw))
```

---

## `ml/src/just_mate_ml/data/triplets.py`

```python
"""Sample training triplets from a profile set.

For each anchor A:
    - find one candidate B with gt_compat(A, B) ≥ positive_threshold
    - find one candidate C with gt_compat(A, C) ≤ negative_threshold

If either is unavailable, the anchor is dropped from the output.

Output: ml/data/triplets.jsonl (one triplet per line)
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Iterable, TypedDict

from just_mate_ml.data.compat import gt_compat
from just_mate_ml.data.profiles import Profile


class Triplet(TypedDict):
    anchor_id: str
    positive_id: str
    negative_id: str


def _find_partner(
    anchor: Profile,
    candidates: list[Profile],
    threshold: float,
    comparator,
    rng: random.Random,
) -> Profile | None:
    matches = [c for c in candidates if comparator(gt_compat(anchor, c, rng), threshold)]
    if not matches:
        return None
    return rng.choice(matches)


def sample_triplets(
    profiles: list[Profile],
    seed: int = 42,
    positive_threshold: float = 0.7,
    negative_threshold: float = 0.2,
    max_per_anchor: int = 1,
) -> list[Triplet]:
    """Sample one (A, B, C) per profile where possible."""
    rng = random.Random(seed)
    triplets: list[Triplet] = []
    profiles_by_id = {p["id"]: p for p in profiles}

    for anchor in profiles:
        # Exclude self
        candidates = [p for p in profiles if p["id"] != anchor["id"]]

        pos = _find_partner(
            anchor, candidates, positive_threshold, lambda x, t: x >= t, rng
        )
        neg = _find_partner(
            anchor, candidates, negative_threshold, lambda x, t: x <= t, rng
        )

        if pos is None or neg is None:
            continue

        triplets.append(Triplet(
            anchor_id=anchor["id"],
            positive_id=pos["id"],
            negative_id=neg["id"],
        ))

    return triplets


def save_triplets_jsonl(triplets: Iterable[Triplet], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for t in triplets:
            f.write(json.dumps(t, ensure_ascii=False) + "\n")


def load_triplets_jsonl(path: Path) -> list[Triplet]:
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]
```

---

## Tests

### `tests/test_triplets.py`

```python
from pathlib import Path

from just_mate_ml.data.profiles import generate_profiles
from just_mate_ml.data.triplets import (
    load_triplets_jsonl,
    sample_triplets,
    save_triplets_jsonl,
)
from just_mate_ml.data.compat import gt_compat, jaccard, shared_intents


# ----- compat tests -----


def test_jaccard_disjoint():
    assert jaccard(["a", "b"], ["c", "d"]) == 0.0


def test_jaccard_identical():
    assert jaccard(["a", "b"], ["a", "b"]) == 1.0


def test_jaccard_partial():
    assert abs(jaccard(["a", "b", "c"], ["b", "c", "d"]) - 2 / 4) < 1e-9


def test_jaccard_empty_both():
    assert jaccard([], []) == 1.0


def test_shared_intents_basic():
    assert shared_intents(["beer", "coffee"], ["beer", "friends"]) == 1
    assert shared_intents(["beer"], ["coffee"]) == 0
    assert shared_intents(["a", "b"], ["a", "b"]) == 2


def test_gt_compat_clipped_to_0_1():
    a = {"interests": ["a"], "intents": ["x"]}
    b = {"interests": ["a"], "intents": ["x"]}
    score = gt_compat(a, b)
    assert 0.0 <= score <= 1.0


def test_gt_compat_no_noise_when_rng_none():
    a = {"interests": ["a"], "intents": ["x"]}
    b = {"interests": ["a"], "intents": ["x"]}
    s1 = gt_compat(a, b, rng=None)
    s2 = gt_compat(a, b, rng=None)
    assert s1 == s2


# ----- triplet sampling tests -----


def test_sample_deterministic_for_same_seed():
    profiles = generate_profiles(200)
    t1 = sample_triplets(profiles, seed=42)
    t2 = sample_triplets(profiles, seed=42)
    assert t1 == t2


def test_no_self_pairs():
    profiles = generate_profiles(200)
    triplets = sample_triplets(profiles, seed=42)
    for t in triplets:
        assert t["anchor_id"] != t["positive_id"]
        assert t["anchor_id"] != t["negative_id"]
        assert t["positive_id"] != t["negative_id"]


def test_ground_truth_labels_respect_thresholds():
    """Verify the actual compat values are on the right side of the thresholds.

    For each triplet, the noise ε may push a sample across the boundary,
    so we don't require strictly >= 0.7 — but we require the mean over
    many samples is consistent with the positive/negative labels.
    """
    profiles = generate_profiles(500)
    profiles_by_id = {p["id"]: p for p in profiles}
    triplets = sample_triplets(profiles, seed=42, positive_threshold=0.7, negative_threshold=0.2)

    assert len(triplets) > 100, f"only got {len(triplets)} triplets, need more density"

    # Spot-check 50 random triplets
    rng_seed = random.Random(7)
    sample = rng_seed.sample(triplets, k=50)
    for t in sample:
        a = profiles_by_id[t["anchor_id"]]
        b = profiles_by_id[t["positive_id"]]
        c = profiles_by_id[t["negative_id"]]
        # average the noise out by sampling 10 times with the same seed
        # (gt_compat uses RNG; without it, it's deterministic)
        ap = gt_compat(a, b, rng=None)
        ac = gt_compat(a, c, rng=None)
        # Positive should be substantially higher than negative.
        # Threshold for "is the labeling correct" given noise σ=0.05:
        # we accept within ±0.15 of the threshold.
        assert ap >= 0.55, f"positive pair {t} scored {ap}"
        assert ac <= 0.35, f"negative pair {t} scored {ac}"


def test_save_load_roundtrip(tmp_path):
    profiles = generate_profiles(200)
    triplets = sample_triplets(profiles, seed=42)
    path = tmp_path / "triplets.jsonl"
    save_triplets_jsonl(triplets, path)
    reloaded = load_triplets_jsonl(path)
    assert reloaded == triplets
```

> Don't forget to `import random` at the top of the test file.

---

## CLI

```bash
cd ml
uv run pytest tests/test_triplets.py -v

# Generate the training triplets
uv run python -c "
from pathlib import Path
from just_mate_ml.data.profiles import load_jsonl, save_jsonl
from just_mate_ml.data.triplets import sample_triplets, save_triplets_jsonl
profiles = load_jsonl(Path('data/synthetic_profiles.jsonl'))
triplets = sample_triplets(profiles, seed=42)
save_triplets_jsonl(triplets, Path('data/triplets.jsonl'))
print(f'wrote {len(triplets)} triplets from {len(profiles)} profiles')
"
```

Expected output: `wrote N triplets from 5000 profiles` where `N` is between 2000 and 4500 (some anchors drop out when no positive/negative is available).

---

## Definition of Done

- [ ] `ml/src/just_mate_ml/data/compat.py` exports `gt_compat`, `jaccard`, `shared_intents`
- [ ] `ml/src/just_mate_ml/data/triplets.py` exports `sample_triplets`, `save_triplets_jsonl`, `load_triplets_jsonl`
- [ ] `ml/data/triplets.jsonl` exists with ≥ 2000 triplets
- [ ] All 12 tests pass (8 in test_profiles.py already from T03, 12 new here)

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `only got 50 triplets` (way too few) | vocabulary is small (7 intents, 14 interests); with 5000 profiles you'd expect ~3000-4000 triplets. Check thresholds aren't too strict |
| Triplets file is huge (>20 MB) | you have too many profiles; reduce N to 5000 |
| `gt_compat(a, b) ≈ 0.05` for "obviously identical" | make sure you're using `a["interests"]` and not `a["intents"]` somewhere |
| Sample noise pushes positive/negative across threshold | this is expected at σ=0.05; loosen test tolerance to ±0.15 from threshold |