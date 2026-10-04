from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

EMBEDDING_DIM = 1536

# train_experiments_v3.py keeps the first 10 known interests per profile
MAX_INTERESTS = 10

# app labels (packages/protocol INTERESTS) spelled differently from the trained vocabulary
ALIASES = {
    "board_games": "boardgames",
    "gym": "fitness",
    "gaming": "video_games",
    "coding": "tech",
}


@dataclass(frozen=True)
class Features:
    s_ab: float
    s_ba: float
    soft_jacc: float
    exact_jaccard: float
    n_a: int
    n_b: int

    def to_array(self) -> np.ndarray:
        return np.asarray(list(asdict(self).values()), dtype=np.float32)

    def as_dict(self) -> dict[str, float]:
        return asdict(self)


class InterestMatchModel:
    # the released interest_matcher.onnx takes 10 features whose layout was never committed,
    # so every score is the soft jaccard that model_v3 was trained on
    def __init__(self, onnx_path: Path | None) -> None:
        self.path = onnx_path
        self.session = None
        self.mode = "linear"


def vocab_key(label: str) -> str:
    key = label.strip().lower().replace(" ", "_").replace("-", "_")
    return ALIASES.get(key, key)


def load_interest_table(data_dir: Path) -> tuple[np.ndarray, dict[str, int]]:
    vec = np.load(data_dir / "interest_embeddings.npz")["vectors"].astype(np.float32)
    interests = json.loads((data_dir / "interest_index.json").read_text())["interests"]
    norms = np.linalg.norm(vec, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vec / norms, {name: i for i, name in enumerate(interests)}


def _unit(emb: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(emb, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return emb / norms


def _exact_jaccard(labels_a: set[str] | None, labels_b: set[str] | None) -> float:
    if not labels_a or not labels_b:
        return 0.0
    return len(labels_a & labels_b) / len(labels_a | labels_b)


def extract_features(
    interests_a_emb: np.ndarray,
    interests_b_emb: np.ndarray,
    labels_a: set[str] | None = None,
    labels_b: set[str] | None = None,
) -> Features:
    a = _unit(interests_a_emb[:MAX_INTERESTS])
    b = _unit(interests_b_emb[:MAX_INTERESTS])
    exact = _exact_jaccard(labels_a, labels_b)
    if not len(a) or not len(b):
        return Features(0.0, 0.0, 0.0, exact, len(a), len(b))

    sims = np.clip(a @ b.T, -1.0, 1.0)
    s_ab = float(sims.max(axis=1).mean())
    s_ba = float(sims.max(axis=0).mean())
    return Features(s_ab, s_ba, (s_ab + s_ba) / 2, exact, len(a), len(b))


def known_interests(labels: list[str], name_to_row: dict[str, int]) -> list[str]:
    keys = dict.fromkeys(vocab_key(label) for label in labels)
    return [k for k in keys if k in name_to_row][:MAX_INTERESTS]


def extract_features_from_strings(
    interests_a: list[str],
    interests_b: list[str],
    int_vec: np.ndarray,
    name_to_row: dict[str, int],
) -> Features:
    known_a = known_interests(interests_a, name_to_row)
    known_b = known_interests(interests_b, name_to_row)
    return extract_features(
        int_vec[[name_to_row[k] for k in known_a]],
        int_vec[[name_to_row[k] for k in known_b]],
        labels_a={vocab_key(x) for x in interests_a},
        labels_b={vocab_key(x) for x in interests_b},
    )


def combine_linear(features: Features) -> float:
    return max(features.soft_jacc, features.exact_jaccard)


def best_match_breakdown(
    interests_a_emb: np.ndarray,
    interests_b_emb: np.ndarray,
    labels_a: list[str] | None = None,
    labels_b: list[str] | None = None,
) -> list[dict]:
    if not len(interests_a_emb) or not len(interests_b_emb):
        return []
    sims = _unit(interests_a_emb) @ _unit(interests_b_emb).T
    best = sims.argmax(axis=1)
    rows = []
    for i, j in enumerate(best):
        row: dict = {"cos": round(float(sims[i, j]), 4)}
        if labels_a is not None and i < len(labels_a):
            row["a"] = labels_a[i]
        if labels_b is not None and j < len(labels_b):
            row["best_match"] = labels_b[j]
        rows.append(row)
    return rows
