# T03 — Synthetic profile generator

**Goal:** generate N deterministic synthetic profiles that respect the canonical vocab (intents + interests from STRUCTURE.md), satisfy the validation rules (≥1 intent, ≥3 interests), and have a vibe from the pool (T02).

**Time:** 45 min.

**Prerequisites:** T02.

---

## What we lock in here

- **Canonical vocab** (from STRUCTURE.md, also PRODUCT.md §6.1):
  - Intents (7): `soul_mate`, `coffee`, `beer`, `date`, `friends`, `sports`, `music`
  - Interests (14): `beer`, `coffee`, `boardgames`, `rock`, `techno`, `hiking`, `cinema`, `books`, `travel`, `tech`, `dogs`, `climbing`, `photography`, `food`
- **Reproducibility:** seed-based RNG; same seed → same profiles forever.
- **Per-id determinism:** profile is keyed by string `id` (e.g. `u_<n>`). All random draws are derived from `id`.
- **Constraint validation:** every generated profile is checked against the rules from PROTOCOL.md `hello` frame: ≥1 intent, ≥3 interests, no duplicates.
- **Output:** JSONL file `ml/data/synthetic_profiles.jsonl`, one profile per line.

---

## Files to create

```
ml/
├── src/just_mate_ml/data/
│   ├── profiles.py          # generate_profiles, save_jsonl, load_jsonl
│   └── vocab.py             # INTENT_VOCAB, INTEREST_VOCAB
├── data/
│   └── synthetic_profiles.jsonl   # generated artifact
└── tests/
    └── test_profiles.py
```

---

## `ml/src/just_mate_ml/data/vocab.py`

```python
"""Canonical vocabularies for synthetic profile generation.

Source of truth: docs/STRUCTURE.md (also PRODUCT.md §6.1).
Any change here must be reflected in the matching pipeline and the
onboarding UI (mobile role).
"""
from __future__ import annotations

# Per STRUCTURE.md §2 onboarding step 1
INTENT_VOCAB: tuple[str, ...] = (
    "soul_mate",
    "coffee",
    "beer",
    "date",
    "friends",
    "sports",
    "music",
)

# Per STRUCTURE.md §2 onboarding step 2
INTEREST_VOCAB: tuple[str, ...] = (
    "beer",
    "coffee",
    "boardgames",
    "rock",
    "techno",
    "hiking",
    "cinema",
    "books",
    "travel",
    "tech",
    "dogs",
    "climbing",
    "photography",
    "food",
)
```

---

## `ml/src/just_mate_ml/data/profiles.py`

```python
"""Deterministic synthetic profile generator.

A profile dict has:
    {
      "id": str,           # canonical user id, e.g. "u_00042"
      "intents": list[str],
      "interests": list[str],
      "vibe": str          # from pick_vibe(id)
    }

Validation rules (mirror PROTOCOL.md hello frame):
    - intents: ≥1, unique, all in INTENT_VOCAB
    - interests: ≥3, unique, all in INTEREST_VOCAB

Determinism: every random draw is seeded from a hash of the profile id,
so generating the same id again gives the same profile. Re-running with
the same N produces the same JSONL.
"""
from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path
from typing import Iterable, TypedDict

from just_mate_ml.data.vocab import INTENT_VOCAB, INTEREST_VOCAB
from just_mate_ml.embedding_text import pick_vibe


class Profile(TypedDict):
    id: str
    intents: list[str]
    interests: list[str]
    vibe: str


def _seeded_rng(profile_id: str) -> random.Random:
    """SHA256 → int → seeded Random. Same id → same RNG state."""
    seed = int(hashlib.sha256(profile_id.encode("utf-8")).hexdigest()[:16], 16)
    return random.Random(seed)


def _sample_subset(rng: random.Random, vocab: tuple[str, ...], min_n: int, max_n: int) -> list[str]:
    """Sample min_n..max_n unique items from vocab."""
    n = rng.randint(min_n, max_n)
    n = min(n, len(vocab))
    return rng.sample(list(vocab), n)


def make_profile(profile_id: str) -> Profile:
    """Build one profile deterministically from its id."""
    rng = _seeded_rng(profile_id)
    intents = _sample_subset(rng, INTENT_VOCAB, min_n=1, max_n=3)
    interests = _sample_subset(rng, INTEREST_VOCAB, min_n=3, max_n=6)
    vibe = pick_vibe(profile_id)
    return Profile(
        id=profile_id,
        intents=intents,
        interests=interests,
        vibe=vibe,
    )


def generate_profiles(n: int, prefix: str = "u_") -> list[Profile]:
    """Generate n profiles, ids formatted as `<prefix><n:06d>`."""
    profiles: list[Profile] = []
    for i in range(n):
        pid = f"{prefix}{i:06d}"
        profiles.append(make_profile(pid))
    return profiles


def save_jsonl(profiles: Iterable[Profile], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for p in profiles:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")


def load_jsonl(path: Path) -> list[Profile]:
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def validate_profile(profile: Profile) -> None:
    """Raises ValueError if profile violates PROTOCOL.md hello rules."""
    if not profile["intents"]:
        raise ValueError(f"profile {profile['id']} has empty intents")
    if len(set(profile["intents"])) != len(profile["intents"]):
        raise ValueError(f"profile {profile['id']} has duplicate intents")
    for intent in profile["intents"]:
        if intent not in INTENT_VOCAB:
            raise ValueError(f"profile {profile['id']} has unknown intent: {intent}")
    if len(profile["interests"]) < 3:
        raise ValueError(f"profile {profile['id']} has {len(profile['interests'])} interests, need ≥3")
    if len(set(profile["interests"])) != len(profile["interests"]):
        raise ValueError(f"profile {profile['id']} has duplicate interests")
    for interest in profile["interests"]:
        if interest not in INTEREST_VOCAB:
            raise ValueError(f"profile {profile['id']} has unknown interest: {interest}")
```

---

## Tests

### `tests/test_profiles.py`

```python
import pytest
from just_mate_ml.data.profiles import (
    generate_profiles,
    load_jsonl,
    make_profile,
    save_jsonl,
    validate_profile,
)
from just_mate_ml.data.vocab import INTENT_VOCAB, INTEREST_VOCAB


def test_make_profile_deterministic():
    """Same id always produces the same profile."""
    a = make_profile("u_00042")
    b = make_profile("u_00042")
    assert a == b


def test_make_profile_distinct_ids_distinct_profiles():
    """Two ids almost never produce identical profiles."""
    a = make_profile("u_00001")
    b = make_profile("u_00002")
    assert a != b


def test_profile_satisfies_protocol_rules():
    """Every generated profile is valid for the hello frame."""
    for i in range(200):
        p = make_profile(f"u_{i:06d}")
        validate_profile(p)


def test_intents_within_vocab():
    for i in range(200):
        p = make_profile(f"u_{i:06d}")
        for intent in p["intents"]:
            assert intent in INTENT_VOCAB


def test_interests_within_vocab():
    for i in range(200):
        p = make_profile(f"u_{i:06d}")
        for interest in p["interests"]:
            assert interest in INTEREST_VOCAB


def test_interests_at_least_three():
    for i in range(200):
        p = make_profile(f"u_{i:06d}")
        assert len(p["interests"]) >= 3


def test_intents_at_least_one():
    for i in range(200):
        p = make_profile(f"u_{i:06d}")
        assert len(p["intents"]) >= 1


def test_vibe_present_and_consistent():
    """pick_vibe must return the same string as in the profile."""
    from just_mate_ml.embedding_text import pick_vibe
    for i in range(20):
        p = make_profile(f"u_{i:06d}")
        assert p["vibe"] == pick_vibe(p["id"])


def test_generate_5000_then_save_load(tmp_path):
    """End-to-end: generate 5000, save, reload, validate all."""
    path = tmp_path / "profiles.jsonl"
    profiles = generate_profiles(5000)
    assert len(profiles) == 5000
    save_jsonl(profiles, path)
    reloaded = load_jsonl(path)
    assert len(reloaded) == 5000
    for p in reloaded:
        validate_profile(p)


def test_jsonl_format_is_one_per_line(tmp_path):
    path = tmp_path / "profiles.jsonl"
    save_jsonl(generate_profiles(10), path)
    with open(path) as f:
        lines = [l for l in f if l.strip()]
    assert len(lines) == 10
    # Each line is valid JSON
    import json
    for line in lines:
        json.loads(line)
```

---

## CLI

```bash
cd ml
# Tests
uv run pytest tests/test_profiles.py -v

# Generate the dataset we'll use for training
uv run python -c "
from pathlib import Path
from just_mate_ml.data.profiles import generate_profiles, save_jsonl
save_jsonl(generate_profiles(5000), Path('data/synthetic_profiles.jsonl'))
print('wrote', sum(1 for _ in open('data/synthetic_profiles.jsonl')), 'profiles')
"
```

After this command you should see `wrote 5000 profiles` and a file `ml/data/synthetic_profiles.jsonl` ~3 MB.

---

## Definition of Done

- [ ] `ml/src/just_mate_ml/data/vocab.py` defines `INTENT_VOCAB` (7 items) and `INTEREST_VOCAB` (14 items)
- [ ] `ml/src/just_mate_ml/data/profiles.py` exports `make_profile`, `generate_profiles`, `save_jsonl`, `load_jsonl`, `validate_profile`
- [ ] All 10 tests pass
- [ ] `ml/data/synthetic_profiles.jsonl` contains 5000 valid profiles
- [ ] Re-running the generation script with same N yields the same file (sha256 matches)

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: just_mate_ml.data.vocab` | missing `__init__.py` in `data/`, run from `ml/` directory |
| `validate_profile` raises on synthetic data | check that `make_profile` calls `_sample_subset` with `min_n=3` for interests |
| `generate_profiles(5000)` returns fewer than 5000 | some ids may hash to invalid RNG states — this should not happen with `random.Random`, file an issue if it does |
| JSONL file has Windows line endings | open with `newline=""` not needed — JSONL convention is `\n`, our code uses that |