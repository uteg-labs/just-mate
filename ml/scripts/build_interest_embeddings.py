"""Build interest_embeddings.npz + interest_index.json from all profiles.

Each distinct interest string in the dataset is embedded once with
text-embedding-3-small and cached. Inference code reads the cached vectors
to compute semantic interest similarity (soft jaccard).

Output:
  data/interest_embeddings.npz     keys: 'vectors' (N, 1536) float32
  data/interest_index.json        {interests, embedding_dim, model, n_profiles, interest_counts}
"""
from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from openai import OpenAI

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

ML_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ML_DIR / "data"
EMBEDDING_MODEL = "text-embedding-3-small"
DIM = 1536
BATCH = 100


def collect_interests():
    from just_mate_ml.data.embed import parse_profiles
    profiles = parse_profiles(DATA_DIR / "profiles_descriptions.txt")
    counter: Counter[str] = Counter()
    for p in profiles:
        counter.update(p["interests"])
    interests = sorted(counter.keys())
    return interests, counter, len(profiles)


def build():
    interests, counts, n_profiles = collect_interests()
    print(f"unique interests: {len(interests)}  profiles: {n_profiles}")

    h = hashlib.sha256("\n".join(interests).encode("utf-8")).hexdigest()[:16]
    cache_key = f"{EMBEDDING_MODEL}:{len(interests)}:{h}"

    npz_path = DATA_DIR / "interest_embeddings.npz"
    json_path = DATA_DIR / "interest_index.json"

    if json_path.exists() and npz_path.exists():
        existing = json.loads(json_path.read_text())
        if existing.get("cache_key") == cache_key:
            print("cache up to date, skipping")
            return

    print("embedding interests via OpenAI…")
    client = OpenAI()
    vectors = np.zeros((len(interests), DIM), dtype=np.float32)
    for start in range(0, len(interests), BATCH):
        batch = interests[start:start + BATCH]
        resp = client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        for k, item in enumerate(resp.data):
            vectors[start + k] = item.embedding

    np.savez_compressed(npz_path, vectors=vectors)
    json_path.write_text(json.dumps({
        "interests": interests,
        "embedding_dim": DIM,
        "model": EMBEDDING_MODEL,
        "n_profiles": n_profiles,
        "interest_counts": dict(counts),
        "cache_key": cache_key,
    }, indent=2))
    print(f"saved {npz_path.stat().st_size:,} bytes ({len(interests)} interests)")


if __name__ == "__main__":
    build()