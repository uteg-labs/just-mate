"""Score a pair of pre-computed embeddings via the match_scorer subprocess.

Usage:
    python scripts/score_pair.py '<emb_a>' '<emb_b>'

Each JSON is a profile object with three fields:

  self_emb     list[float] length 1536   "who I am" embedding
  target_emb   list[float] length 1536   "what I want" embedding
  soft_jacc    float                    soft-jaccard of THIS profile's
                                        interests against the OTHER profile

The script is a thin pass-through to match_scorer.py — no OpenAI, no
interest-cache lookups. The caller is responsible for producing these
three vectors (typically server-side, where the embedding cache and the
interest-index both already live).

Symmetric pair scoring:

  score_ab = match(target_a, self_b, soft_jacc_AB)
  score_ba = match(target_B, self_A, soft_jacc_BA)
  pair_score = score_ab + score_ba      ∈ [0, 2]

`soft_jacc_AB` is the soft-jaccard value carried on profile A;
`soft_jacc_BA` is the value on profile B. Compute them with
`compute_soft_jaccard_pair(interests_a, interests_b, ...)` and pass in.

Output (JSON):
  {"a": <profile_a>, "b": <profile_b>,
   "score_ab": 0.62, "score_ba": 0.71,
   "pair_score": 1.33,
   "would_match": false}
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ML_DIR = Path(__file__).resolve().parents[1]
SCORER = ML_DIR / "scripts" / "match_scorer.py"
DEFAULT_MODEL = "checkpoints/model_v3_best.onnx"
# F1-best on val set for v3-best (AUC=0.9637, F1=0.9137).
# v2 was tuned at 0.78 — v3 (with soft_jaccard feature) saturates faster, so
# the F1-best symmetric-pair threshold is much lower.
MATCH_THRESHOLD = 0.40
EMBEDDING_DIM = 1536


def validate_profile(raw: object, who: str) -> dict:
    if not isinstance(raw, dict):
        raise ValueError(f"profile {who} must be a JSON object, got {type(raw).__name__}")
    missing = [f for f in ("self_emb", "target_emb", "soft_jacc") if f not in raw]
    if missing:
        raise ValueError(f"profile {who} missing fields: {missing}")
    for field in ("self_emb", "target_emb"):
        emb = raw[field]
        if not isinstance(emb, list):
            raise ValueError(f"profile {who}.{field} must be a list")
        arr = np.asarray(emb, dtype=np.float32)
        if arr.shape != (EMBEDDING_DIM,):
            raise ValueError(
                f"profile {who}.{field} must have {EMBEDDING_DIM} floats, got {arr.shape}"
            )
        if not np.isfinite(arr).all():
            raise ValueError(f"profile {who}.{field} contains non-finite values")
    sj = raw["soft_jacc"]
    if not isinstance(sj, (int, float)) or isinstance(sj, bool):
        raise ValueError(f"profile {who}.soft_jacc must be a number")
    sj_f = float(sj)
    if not np.isfinite(sj_f):
        raise ValueError(f"profile {who}.soft_jacc must be finite")
    return raw


class ScorerClient:
    """Persistent subprocess wrapper around match_scorer.py."""

    def __init__(self, model_path: Path) -> None:
        self.proc = subprocess.Popen(
            [sys.executable, str(SCORER), str(model_path)],
            cwd=str(ML_DIR),
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, bufsize=1,
        )
        self._next_id = 0

    def score_directional(
        self, target_emb: list[float], self_emb: list[float], soft_jacc: float
    ) -> float:
        self._next_id += 1
        req_id = f"req_{self._next_id}"
        self.proc.stdin.write(json.dumps({
            "id": req_id,
            "target_emb": target_emb,
            "self_emb": self_emb,
            "soft_jacc": float(soft_jacc),
        }) + "\n")
        self.proc.stdin.flush()
        while True:
            line = self.proc.stdout.readline()
            if not line:
                err = self.proc.stderr.read()
                raise RuntimeError(f"scorer subprocess closed: {err}")
            resp = json.loads(line)
            if resp.get("id") == req_id:
                if "error" in resp:
                    raise RuntimeError(f"scorer error: {resp['error']}")
                return float(resp["score"])

    def close(self) -> None:
        try:
            self.proc.stdin.close()
        except Exception:
            pass
        try:
            self.proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            self.proc.kill()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Score a pair of pre-computed embeddings via the match_scorer subprocess.",
    )
    parser.add_argument(
        "a",
        help='JSON string for profile A: {"self_emb":[...1536...], "target_emb":[...1536...], "soft_jacc":<scalar>}',
    )
    parser.add_argument(
        "b",
        help='JSON string for profile B (same shape; soft_jacc = pair value against A)',
    )
    parser.add_argument(
        "--threshold", type=float, default=MATCH_THRESHOLD,
        help=f"pair_score threshold for would_match (default {MATCH_THRESHOLD})",
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"path to ONNX model (default {DEFAULT_MODEL}, resolved relative to ml/)",
    )
    args = parser.parse_args()

    try:
        profile_a = validate_profile(json.loads(args.a), "A")
    except json.JSONDecodeError as e:
        print(f"profile A: invalid JSON: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"profile A: {e}", file=sys.stderr)
        return 1

    try:
        profile_b = validate_profile(json.loads(args.b), "B")
    except json.JSONDecodeError as e:
        print(f"profile B: invalid JSON: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"profile B: {e}", file=sys.stderr)
        return 1

    model_path = Path(args.model)
    if not model_path.is_absolute():
        model_path = ML_DIR / args.model
    if not model_path.exists():
        print(f"model not found: {model_path}", file=sys.stderr)
        return 1

    scorer = ScorerClient(model_path)
    try:
        # score_ab uses profile A's soft_jacc (soft-jaccard with A as anchor, B as target).
        # score_ba uses profile B's soft_jacc (B as anchor, A as target).
        score_ab = scorer.score_directional(
            profile_a["target_emb"], profile_b["self_emb"], profile_a["soft_jacc"],
        )
        score_ba = scorer.score_directional(
            profile_b["target_emb"], profile_a["self_emb"], profile_b["soft_jacc"],
        )
    finally:
        scorer.close()

    pair_score = score_ab + score_ba
    out = {
        "a": profile_a,
        "b": profile_b,
        "score_ab": round(score_ab, 4),
        "score_ba": round(score_ba, 4),
        "pair_score": round(pair_score, 4),
        "would_match": pair_score >= args.threshold,
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())