from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

EMBEDDING_DIM = 1536

# train_experiments_v3.py keeps the first 10 known interests per profile
MAX_INTERESTS = 10

# ONNX input layout. The released interest_matcher.onnx is a Linear(10 → 1) +
# Sigmoid trained on 10 features whose exact order was never committed. We pad
# the 6 features we can compute to 10 zeros-for-unknown and run inference
# anyway — the trained weights for the unknown positions multiply zeros, so the
# score reflects what the model thinks about the 6 it does know.
ONNX_FEATURE_DIM = 10

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
    """Loads ONNX if available, falls back to linear blend otherwise.

    ONNX input:  name='features', shape=(B, 10), float32
    ONNX output: name='score',    shape=(B, 1),          float32  ∈ [0, 1]
    """

    def __init__(self, onnx_path: Path | None) -> None:
        self.path = onnx_path
        self.session = None
        self.mode = "linear"
        if onnx_path is None or not onnx_path.exists():
            return
        try:
            import onnxruntime as ort

            so = ort.SessionOptions()
            so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            so.intra_op_num_threads = 1
            so.inter_op_num_threads = 1
            self.session = ort.InferenceSession(str(onnx_path), sess_options=so)
            self.mode = "trained"

            # Introspect expected input feature width from the ONNX graph so
            # we don't hard-code 10. Falls back to the constant if introspection
            # fails for some reason (defensive).
            try:
                shape = self.session.get_inputs()[0].shape
                # shape is something like ['batch', 10] or ['N', 10]
                for d in shape:
                    if isinstance(d, int) and d > 1:
                        self._feature_dim = d
                        return
            except Exception:
                pass
            self._feature_dim = ONNX_FEATURE_DIM
        except Exception:
            # treat any load failure as "no ONNX" — server still runs in linear mode
            self.session = None
            self.mode = "linear"
            self._feature_dim = ONNX_FEATURE_DIM

    @property
    def feature_dim(self) -> int:
        """Input dimensionality the loaded ONNX expects (10 for the released model)."""
        return getattr(self, "_feature_dim", ONNX_FEATURE_DIM)

    def score_array(self, features: np.ndarray) -> float:
        """features: shape (FEATURE_DIM,) or (1, FEATURE_DIM), float32.

        Pads to the ONNX-expected dimensionality with zeros if needed, then
        runs inference. Falls back to combine_linear() if no session loaded.
        """
        arr = np.asarray(features, dtype=np.float32)
        if arr.ndim == 1:
            arr = arr[None, :]
        if arr.shape[1] < self.feature_dim:
            pad = np.zeros((arr.shape[0], self.feature_dim - arr.shape[1]), dtype=np.float32)
            arr = np.concatenate([arr, pad], axis=1)
        elif arr.shape[1] > self.feature_dim:
            arr = arr[:, : self.feature_dim]
        if self.session is None:
            return combine_linear(_from_array(arr[0]))
        out = self.session.run(None, {"features": arr})[0].flatten()
        return float(np.clip(out[0], 0.0, 1.0))


def _from_array(arr: np.ndarray):
    """Inverse of Features.to_array() — for the linear-mode fallback path."""
    return Features(
        s_ab=float(arr[0]),
        s_ba=float(arr[1]),
        soft_jacc=float(arr[2]),
        exact_jaccard=float(arr[3]),
        n_a=int(arr[4]),
        n_b=int(arr[5]),
    )


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
    return features.soft_jacc


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