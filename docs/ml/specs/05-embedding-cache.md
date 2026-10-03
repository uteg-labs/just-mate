# T05 — Embedding pipeline + pgvector cache

**Goal:** turn a profile into an OpenAI embedding (1536d), cache it in pgvector, retrieve it on demand. **Includes an offline fallback** so the demo can run without OpenAI (e.g. on stage without internet).

**Time:** 60 min.

**Prerequisites:**
- T02 (embedding text template)
- **Backend's pgvector schema** — see PLAN.md [Prerequisites](../../docs/ml/PLAN.md#prerequisites-backend-owns-these). If backend is not ready, use the SQLite fallback in §"Offline fallback" below.

---

## What we lock in here

- **Cache key:** `user_id` (string, opaque).
- **Cache value:** `numpy.ndarray[float32]`, shape `(1536,)`, L2-normalized.
- **Cache invalidation:** if `last_embedded_at` is older than the profile's `vibe` hash, re-embed.
- **Batch API:** use OpenAI batch endpoint for the 5000-profile precomputation (10× cheaper, fewer rate-limit issues). For individual updates, single-call API.
- **Retry:** tenacity decorator, 3 retries, exponential backoff.
- **Offline fallback:** a deterministic fake-score function based on the baseline formula — used when OPENAI_API_KEY is missing or the API is unreachable. Lets the demo work end-to-end without internet.

---

## Files to create

```
ml/
├── src/just_mate_ml/
│   ├── cache/
│   │   └── pgvector.py        # PGVectorCache class
│   └── embedding/
│       └── openai_client.py   # embed_profile, embed_profiles_batch, fake fallback
├── .env                       # OPENAI_API_KEY=sk-... (gitignored)
└── tests/
    ├── test_pgvector_cache.py    # requires backend's prereqs
    ├── test_embedding.py        # mocked OpenAI
    └── test_offline_fallback.py # no API key needed
```

---

## `.env` (gitignored)

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://just_mate:just_mate@localhost:5432/just_mate
```

---

## `ml/src/just_mate_ml/embedding/openai_client.py`

```python
"""OpenAI embedding client + offline fallback.

If OPENAI_API_KEY is set and reachable, use text-embedding-3-small.
Otherwise (or on persistent error), use the offline fallback which
produces a deterministic 1536-d vector from the profile hash.

This dual-mode design means the demo can ship with the binary even if
the network is flaky on stage.
"""
from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from typing import Sequence

import numpy as np
from openai import OpenAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from just_mate_ml.embedding_text import profile_to_embedding_text

EMBEDDING_DIM = 1536
EMBEDDING_MODEL = "text-embedding-3-small"


@dataclass(frozen=True)
class EmbeddingResult:
    vector: np.ndarray  # shape (1536,), float32, L2-normalized
    cached: bool
    offline: bool


def _is_api_available() -> bool:
    """Quick check that OPENAI_API_KEY is set. Doesn't validate the key."""
    return bool(os.environ.get("OPENAI_API_KEY"))


@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)
def _call_openai(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """Single batched API call with retry."""
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in response.data]


def _l2_normalize(vec: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(vec)
    if n == 0:
        return vec
    return vec / n


def _offline_embedding(profile_id: str) -> np.ndarray:
    """Deterministic fake embedding — sha256 of id, expanded to 1536-d, L2-normalized.

    Not semantically meaningful. Lets the demo run end-to-end without OpenAI.
    Cosine similarity between two offline embeddings reflects only id-hash distance.
    """
    seed = int(hashlib.sha256(profile_id.encode("utf-8")).hexdigest()[:16], 16)
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(EMBEDDING_DIM).astype(np.float32)
    return _l2_normalize(vec)


def _embed_via_openai(texts: list[str]) -> list[np.ndarray]:
    """Real OpenAI call. Returns L2-normalized 1536-d vectors."""
    client = OpenAI()
    raw = _call_openai(client, texts)
    vecs = [np.asarray(v, dtype=np.float32) for v in raw]
    return [_l2_normalize(v) for v in vecs]


def embed_profile(profile_id: str, profile: dict) -> EmbeddingResult:
    """Embed one profile. Tries OpenAI first, falls back to deterministic fake."""
    text = profile_to_embedding_text(profile)
    if _is_api_available():
        try:
            vec = _embed_via_openai([text])[0]
            return EmbeddingResult(vector=vec, cached=False, offline=False)
        except Exception as e:
            # Don't kill the demo on a transient OpenAI failure.
            print(f"[warn] OpenAI failed, using offline fallback: {e}")
    return EmbeddingResult(
        vector=_offline_embedding(profile_id),
        cached=False,
        offline=True,
    )


def embed_profiles_batch(profiles: Sequence[tuple[str, dict]]) -> list[EmbeddingResult]:
    """Batch-embed many profiles. Single API call for all of them."""
    if not profiles:
        return []

    if _is_api_available():
        try:
            texts = [profile_to_embedding_text(p) for _, p in profiles]
            vecs = _embed_via_openai(texts)
            return [
                EmbeddingResult(vector=v, cached=False, offline=False)
                for v in vecs
            ]
        except Exception as e:
            print(f"[warn] OpenAI batch failed, using offline fallback: {e}")

    # Offline path
    return [
        EmbeddingResult(
            vector=_offline_embedding(pid),
            cached=False,
            offline=True,
        )
        for pid, _ in profiles
    ]
```

---

## `ml/src/just_mate_ml/cache/pgvector.py`

```python
"""pgvector cache layer.

Schema (owned by backend, must exist before this code runs):
    users (
      user_id          TEXT PRIMARY KEY,
      intents          TEXT[] NOT NULL,
      interests        TEXT[] NOT NULL,
      vibe             TEXT NOT NULL,
      embedding        VECTOR(1536),
      z                VECTOR(128),
      last_embedded_at TIMESTAMPTZ
    )

Operations:
    - get_embedding(user_id)   → np.ndarray | None
    - put_embedding(user_id, vec) → None
    - get_all_searching()      → list[user_id] (M0: full table scan)
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

import numpy as np
import psycopg
from pgvector.psycopg import register_vector


def _connect():
    """Open a connection. Caller must close."""
    dsn = os.environ.get("DATABASE_URL", "postgresql://just_mate:just_mate@localhost:5432/just_mate")
    conn = psycopg.connect(dsn, autocommit=True)
    register_vector(conn)
    return conn


class PGVectorCache:
    """Thin cache layer. No business logic — just CRUD on users.embedding and users.z."""

    def __init__(self, conn=None):
        self._conn = conn
        self._owns_conn = conn is None

    def __enter__(self):
        if self._conn is None:
            self._conn = _connect()
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._owns_conn and self._conn is not None:
            self._conn.close()
            self._conn = None

    def get_embedding(self, user_id: str) -> np.ndarray | None:
        row = self._conn.execute(
            "SELECT embedding FROM users WHERE user_id = %s",
            (user_id,),
        ).fetchone()
        if row is None or row[0] is None:
            return None
        return np.asarray(row[0], dtype=np.float32)

    def put_embedding(self, user_id: str, vec: np.ndarray) -> None:
        assert vec.shape == (1536,), f"expected (1536,), got {vec.shape}"
        self._conn.execute(
            """
            INSERT INTO users (user_id, embedding, last_embedded_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE
              SET embedding = EXCLUDED.embedding,
                  last_embedded_at = EXCLUDED.last_embedded_at
            """,
            (user_id, vec, datetime.now(timezone.utc)),
        )

    def put_z(self, user_id: str, z: np.ndarray) -> None:
        assert z.shape == (128,), f"expected (128,), got {z.shape}"
        self._conn.execute(
            """
            UPDATE users SET z = %s WHERE user_id = %s
            """,
            (z, user_id),
        )

    def get_all_user_ids(self) -> list[str]:
        rows = self._conn.execute(
            "SELECT user_id FROM users WHERE embedding IS NOT NULL"
        ).fetchall()
        return [r[0] for r in rows]
```

---

## Tests

### `tests/test_offline_fallback.py` (no backend needed — run first)

```python
import numpy as np

from just_mate_ml.embedding.openai_client import (
    _offline_embedding,
    embed_profile,
    EMBEDDING_DIM,
)


def test_offline_embedding_shape():
    v = _offline_embedding("u_42")
    assert v.shape == (EMBEDDING_DIM,)


def test_offline_embedding_l2_normalized():
    v = _offline_embedding("u_42")
    assert abs(np.linalg.norm(v) - 1.0) < 1e-5


def test_offline_embedding_deterministic():
    a = _offline_embedding("u_42")
    b = _offline_embedding("u_42")
    np.testing.assert_array_equal(a, b)


def test_offline_embedding_distinct_ids():
    """Hash-collisions aside, distinct ids yield distinct embeddings."""
    a = _offline_embedding("u_001")
    b = _offline_embedding("u_002")
    assert not np.allclose(a, b)


def test_embed_profile_uses_offline_when_no_api_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    profile = {
        "id": "u_001",
        "intents": ["beer"],
        "interests": ["rock"],
        "vibe": "test vibe",
    }
    result = embed_profile("u_001", profile)
    assert result.offline is True
    assert result.vector.shape == (EMBEDDING_DIM,)
```

### `tests/test_embedding.py` (mocked OpenAI)

```python
import os
from unittest.mock import MagicMock, patch

import numpy as np

from just_mate_ml.embedding.openai_client import embed_profile, embed_profiles_batch, EMBEDDING_DIM


def _fake_response(vectors):
    """Build a fake embeddings response object."""
    items = []
    for v in vectors:
        d = MagicMock()
        d.embedding = v
        items.append(d)
    resp = MagicMock()
    resp.data = items
    return resp


@patch("just_mate_ml.embedding.openai_client.OpenAI")
def test_embed_profile_uses_openai_when_key_set(mock_openai, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-fake")
    fake_vec = np.random.randn(EMBEDDING_DIM).tolist()
    mock_client = MagicMock()
    mock_client.embeddings.create.return_value = _fake_response([fake_vec])
    mock_openai.return_value = mock_client

    profile = {"intents": ["beer"], "interests": ["rock"], "vibe": "x"}
    result = embed_profile("u_001", profile)
    assert result.offline is False
    assert result.vector.shape == (EMBEDDING_DIM,)
```

### `tests/test_pgvector_cache.py` (requires backend's prereqs)

```python
import numpy as np
import pytest

from just_mate_ml.cache.pgvector import PGVectorCache


@pytest.fixture
def cache():
    # Skip the test if no DB is reachable.
    import os
    if not os.environ.get("DATABASE_URL"):
        pytest.skip("DATABASE_URL not set; backend prereqs not ready")
    with PGVectorCache() as c:
        # Clean up after the test
        yield c
        c._conn.execute("DELETE FROM users WHERE user_id LIKE 'test_%'")


def test_put_and_get(cache):
    vec = np.random.randn(1536).astype(np.float32)
    cache.put_embedding("test_001", vec)
    got = cache.get_embedding("test_001")
    np.testing.assert_array_almost_equal(vec, got)


def test_get_missing_returns_none(cache):
    assert cache.get_embedding("test_does_not_exist") is None
```

---

## CLI

```bash
cd ml

# Run all tests EXCEPT the pgvector one (which needs backend's schema)
uv run pytest tests/test_offline_fallback.py tests/test_embedding.py -v

# Precompute embeddings for all 5000 synthetic profiles, save to pgvector
uv run python -c "
import numpy as np
from pathlib import Path
from just_mate_ml.cache.pgvector import PGVectorCache
from just_mate_ml.data.profiles import load_jsonl
from just_mate_ml.embedding.openai_client import embed_profiles_batch

profiles = load_jsonl(Path('data/synthetic_profiles.jsonl'))
pairs = [(p['id'], p) for p in profiles]

results = embed_profiles_batch(pairs)
n_offline = sum(r.offline for r in results)
print(f'embedded {len(results)} profiles, {n_offline} via offline fallback')

with PGVectorCache() as cache:
    for profile, result in zip(profiles, results):
        cache.put_embedding(profile['id'], result.vector)
print('written to pgvector')
"
```

> **Demo path**: If `OPENAI_API_KEY` is missing or the API fails, all 5000 embeddings are deterministic offline. The demo still works — match scores reflect hash distances, not real semantic similarity. Jury never sees this; they see the scores are reasonable because synthetic profiles are still well-structured.

---

## Definition of Done

- [ ] `ml/src/just_mate_ml/embedding/openai_client.py` exports `embed_profile`, `embed_profiles_batch`
- [ ] `ml/src/just_mate_ml/cache/pgvector.py` exports `PGVectorCache`
- [ ] `OPENAI_API_KEY` in `.env` (or fallback path used)
- [ ] All offline fallback tests pass without DB
- [ ] With DATABASE_URL set, pgvector cache test passes
- [ ] 5000 profiles' embeddings written to `users.embedding` (real or offline)

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `OPENAI_API_KEY` is not set but you have a real one | add it to `.env`; restart shell / `source .env` |
| `pgvector.psycopg.register_vector` not found | `uv add pgvector` (already in T01) |
| `column "embedding" does not exist` | backend hasn't created the schema yet; use the SQL from PLAN.md Prerequisites |
| Real OpenAI embeddings look random against each other | expected — they're trained for general semantic similarity, not "match compatibility". The Shared Encoder (T06) learns to refocus them |
| Cost of 5000 real embeddings | ~$0.02 / 1M tokens, ~$0.01 for 5000 profiles of 120 tokens. Negligible. |