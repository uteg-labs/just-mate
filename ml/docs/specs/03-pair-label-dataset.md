# T03 — Pair-label dataset

> **Status: original hackathon spec, kept for history.** It was not built as written: the modules, file names and architecture here don't match `ml/`. Actual modules are listed at the top of [`../PLAN.md`](../PLAN.md); the current design is [`docs/ML-MATCHING.md`](../../../docs/ML-MATCHING.md).

**Goal:** balanced labelled pair dataset (good/bad match) with OpenAI `text-embedding-3-small` text vectors.

**Time:** 45 min.

**Prerequisites:** T02.

**Outputs:**
- `data/embeddings.npy` — `(1000, 1536)` float32, L2-normalized text vectors
- `data/user_id_index.json` — list of 1000 user_ids in row order
- `data/pairs.npz` — `idx_a, idx_b, gt_compat, label` arrays (5000 pos + 5000 neg)

**Ground truth:** `gt_compat(A,B) = 0.7 × jaccard(A.interests, B.interests) + 0.3 × min(1, |A.intents ∩ B.intents|)`. Label=1 if gt ≥ 0.7, label=0 if gt ≤ 0.2.

**Embedding text:** intents + interests + description (LLM-generated per profile) — sent to OpenAI.

---

## `src/just_mate_ml/profile_text.py`

```python
"""Profile → embedding text. Includes description (appearance + preferences)."""
from __future__ import annotations


def profile_to_embedding_text(profile: dict) -> str:
    intents = ", ".join(sorted(profile.get("intents", [])))
    interests = ", ".join(sorted(profile.get("interests", [])))
    description = (profile.get("description") or "").strip()
    return f"Intent: {intents}.\nInterests: {interests}.\nDescription: {description}."
```

---

## `src/just_mate_ml/data/compat.py`

```python
def jaccard(a: list[str], b: list[str]) -> float:
    if not a and not b:
        return 1.0
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    inter, union = sa & sb, sa | sb
    return len(inter) / len(union) if union else 1.0


def shared_intents(a: list[str], b: list[str]) -> int:
    return len(set(a) & set(b))


def gt_compat(a: dict, b: dict) -> float:
    j = jaccard(a["interests"], b["interests"])
    si = min(1.0, shared_intents(a["intents"], b["intents"]))
    return 0.7 * j + 0.3 * si
```

---

## `src/just_mate_ml/data/embed.py`

```python
import json
from pathlib import Path

import numpy as np
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from just_mate_ml.profile_text import profile_to_embedding_text


EMBEDDING_DIM = 1536
EMBEDDING_MODEL = "text-embedding-3-small"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(1, 1, 10), reraise=True)
def _call_openai(client: OpenAI, texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in response.data]


def _l2_normalize(vec: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(vec)
    return vec / n if n != 0 else vec


def embed_profiles(profile_ids: list[str], profiles_by_id: dict[str, dict],
                   batch_size: int = 100) -> np.ndarray:
    """Returns (N, 1536) float32, L2-normalized, indexed by profile_ids order."""
    client = OpenAI()
    embeddings = np.zeros((len(profile_ids), EMBEDDING_DIM), dtype=np.float32)
    for i in range(0, len(profile_ids), batch_size):
        batch_ids = profile_ids[i:i + batch_size]
        texts = [profile_to_embedding_text(profiles_by_id[pid]) for pid in batch_ids]
        raw = _call_openai(client, texts)
        for j, vec in enumerate(raw):
            v = np.asarray(vec, dtype=np.float32)
            embeddings[i + j] = _l2_normalize(v)
        print(f"  embedded {i + len(batch_ids)}/{len(profile_ids)}")
    return embeddings


def save_embeddings(embeddings: np.ndarray, profile_ids: list[str],
                    embeddings_path: Path, index_path: Path) -> None:
    embeddings_path.parent.mkdir(parents=True, exist_ok=True)
    np.save(embeddings_path, embeddings)
    index_path.write_text(json.dumps(profile_ids, indent=2))


def load_embeddings(embeddings_path: Path, index_path: Path) -> tuple[np.ndarray, list[str]]:
    return np.load(embeddings_path), json.loads(index_path.read_text())
```

---

## `src/just_mate_ml/data/pairs.py`

```python
import random
from pathlib import Path

import numpy as np

from just_mate_ml.data.compat import gt_compat
from just_mate_ml.data.profiles import Profile


POS_THRESHOLD = 0.7
NEG_THRESHOLD = 0.2
TARGET_PER_CLASS = 5000


def build_pairs(profiles: list[Profile], seed: int = 42,
                target_per_class: int = TARGET_PER_CLASS
                ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    rng = random.Random(seed)
    n = len(profiles)

    pos: list[tuple[int, int, float]] = []
    neg: list[tuple[int, int, float]] = []
    seen: set[tuple[int, int]] = set()
    target_samples = max(50000, target_per_class * 20)

    while len(seen) < target_samples:
        i, j = rng.sample(range(n), 2)
        key = (min(i, j), max(i, j))
        if key in seen:
            continue
        seen.add(key)
        a, b = profiles[i], profiles[j]
        gt = gt_compat(a, b)
        if gt >= POS_THRESHOLD:
            pos.append((i, j, gt))
        elif gt <= NEG_THRESHOLD:
            neg.append((i, j, gt))
        if len(pos) >= target_per_class * 2 and len(neg) >= target_per_class * 2:
            break

    rng.shuffle(pos)
    rng.shuffle(neg)
    pos = pos[:target_per_class]
    neg = neg[:target_per_class]

    combined = (
        [(p[0], p[1], p[2], 1) for p in pos]
        + [(p[0], p[1], p[2], 0) for p in neg]
    )
    rng.shuffle(combined)
    idx_a, idx_b, gt, label = zip(*combined)

    return (
        np.asarray(idx_a, dtype=np.int32),
        np.asarray(idx_b, dtype=np.int32),
        np.asarray(gt, dtype=np.float32),
        np.asarray(label, dtype=np.int8),
    )


def save_pairs(pairs, path: Path) -> None:
    idx_a, idx_b, gt, label = pairs
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez(path, idx_a=idx_a, idx_b=idx_b, gt_compat=gt, label=label)


def load_pairs(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    data = np.load(path)
    return data["idx_a"], data["idx_b"], data["gt_compat"], data["label"]
```

---

## `tests/test_compat.py`

```python
from just_mate_ml.data.compat import gt_compat, jaccard, shared_intents


def test_jaccard_disjoint():
    assert jaccard(["a", "b"], ["c", "d"]) == 0.0


def test_jaccard_identical():
    assert jaccard(["a", "b"], ["a", "b"]) == 1.0


def test_gt_compat_high_overlap():
    p = {"interests": ["a", "b", "c"], "intents": ["x"]}
    assert abs(gt_compat(p, p) - 1.0) < 1e-9


def test_gt_compat_zero_overlap():
    a = {"interests": ["a"], "intents": ["x"]}
    b = {"interests": ["z"], "intents": ["y"]}
    assert gt_compat(a, b) == 0.0
```

## `tests/test_pairs.py`

```python
import numpy as np

from just_mate_ml.data.pairs import build_pairs, save_pairs, load_pairs


def test_pairs_balanced():
    from just_mate_ml.data.profiles import generate_profiles
    profiles = generate_profiles(200)
    idx_a, idx_b, gt, label = build_pairs(profiles, target_per_class=50)
    assert len(idx_a) == 100
    assert sum(label == 1) == 50
    assert sum(label == 0) == 50


def test_pairs_no_self():
    from just_mate_ml.data.profiles import generate_profiles
    profiles = generate_profiles(200)
    idx_a, idx_b, _, _ = build_pairs(profiles, target_per_class=50)
    assert (idx_a != idx_b).all()


def test_pairs_label_matches_gt():
    from just_mate_ml.data.profiles import generate_profiles
    profiles = generate_profiles(200)
    idx_a, idx_b, gt, label = build_pairs(profiles, target_per_class=50)
    assert (gt[label == 1] >= 0.7).all()
    assert (gt[label == 0] <= 0.2).all()


def test_embedding_text_includes_description():
    from just_mate_ml.profile_text import profile_to_embedding_text
    p = {
        "intents": ["beer"],
        "interests": ["rock"],
        "description": "Athletic 30yo man with short dark hair.",
    }
    text = profile_to_embedding_text(p)
    assert "Intent: beer." in text
    assert "Interests: rock." in text
    assert "Description: Athletic 30yo man" in text


def test_save_load_roundtrip(tmp_path):
    from just_mate_ml.data.profiles import generate_profiles
    profiles = generate_profiles(200)
    pairs = build_pairs(profiles, target_per_class=50)
    save_pairs(pairs, tmp_path / "pairs.npz")
    reloaded = load_pairs(tmp_path / "pairs.npz")
    for orig, rel in zip(pairs, reloaded):
        np.testing.assert_array_equal(orig, rel)
```

## `tests/test_embed.py`

```python
from unittest.mock import MagicMock, patch

import numpy as np

from just_mate_ml.data.embed import EMBEDDING_DIM, embed_profiles


def _fake_response(vectors):
    items = [MagicMock(embedding=v) for v in vectors]
    return MagicMock(data=items)


@patch("just_mate_ml.data.embed.OpenAI")
def test_embed_profiles_shape(mock_openai):
    fake_vec = list(np.random.randn(EMBEDDING_DIM))
    mock_client = MagicMock()
    mock_client.embeddings.create.return_value = _fake_response([fake_vec])
    mock_openai.return_value = mock_client

    embeddings = embed_profiles(
        ["u_001"],
        {"u_001": {
            "intents": ["beer"], "interests": ["rock"],
            "description": "Athletic 30yo man."
        }},
    )
    assert embeddings.shape == (1, EMBEDDING_DIM)
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_compat.py tests/test_pairs.py tests/test_embed.py -v

# Embed all 1000 profiles via OpenAI (~30s, costs <$0.01)
uv run python -c "
from pathlib import Path
from just_mate_ml.data.profiles import load_jsonl
from just_mate_ml.data.embed import embed_profiles, save_embeddings
profiles = load_jsonl(Path('data/profiles.jsonl'))
profile_ids = [p['id'] for p in profiles]
embeddings = embed_profiles(profile_ids, {p['id']: p for p in profiles})
save_embeddings(embeddings, profile_ids,
               Path('data/embeddings.npy'), Path('data/user_id_index.json'))
print('saved embeddings:', embeddings.shape)
"

# Build the pair dataset
uv run python -c "
from pathlib import Path
from just_mate_ml.data.profiles import load_jsonl
from just_mate_ml.data.pairs import build_pairs, save_pairs
profiles = load_jsonl(Path('data/profiles.jsonl'))
pairs = build_pairs(profiles)
save_pairs(pairs, Path('data/pairs.npz'))
print('saved pairs:', len(pairs[0]))
"
```

---

## Definition of Done

- [ ] All 10 tests pass
- [ ] `data/embeddings.npy` is `(1000, 1536)` float32
- [ ] `data/pairs.npz` has 5000 pos + 5000 neg
- [ ] `gt_compat`: positives ≥ 0.7, negatives ≤ 0.2
- [ ] Embedding text includes `Description:` section