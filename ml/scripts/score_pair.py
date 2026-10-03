"""Score a pair of profiles (raw JSON) via the match_scorer subprocess.

Usage:
    python scripts/score_pair.py '<json_a>' '<json_b>'

Each JSON is a profile with 5 fields:
  interests       list[str]
  my_character    str   (self personality)
  my_appearance   str   (self physical)
  you_character   str   (desired partner personality)
  you_appearance  str   (desired partner physical)

Pipeline:
  1. self text   = "Interests: ...\n[Self] Character: ...\n[Self] Appearance: ..."
  2. target text = "[Target] Character: ...\n[Target] Appearance: ..."
  3. both texts embedded via OpenAI text-embedding-3-small (1536-d)
  4. match_scorer.py: score_ab = match(target_A, self_B); score_ba = match(target_B, self_A)
  5. pair_score = score_ab + score_ba   ∈ [0, 2]; product signal is pair_score ≥ threshold

Output (JSON):
  {"a": <profile_a>, "b": <profile_b>,
   "score_ab": 0.62, "score_ba": 0.71,
   "pair_score": 1.33,
   "would_match": false}

Required env: OPENAI_API_KEY.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from openai import OpenAI

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from just_mate_ml.data.embed import build_self_text, build_target_text  # noqa: E402

ML_DIR = Path(__file__).resolve().parents[1]
SCORER = ML_DIR / "scripts" / "match_scorer.py"
DEFAULT_MODEL = "checkpoints/model_v0.onnx"
MATCH_THRESHOLD = 0.78
EMBEDDING_MODEL = "text-embedding-3-small"

REQUIRED_FIELDS = ("interests", "my_character", "my_appearance", "you_character", "you_appearance")


def validate_profile(raw: object, who: str) -> dict:
    if not isinstance(raw, dict):
        raise ValueError(f"profile {who} must be a JSON object, got {type(raw).__name__}")
    missing = [f for f in REQUIRED_FIELDS if f not in raw]
    if missing:
        raise ValueError(f"profile {who} missing fields: {missing}")
    if not isinstance(raw["interests"], list) or not all(isinstance(x, str) for x in raw["interests"]):
        raise ValueError(f"profile {who}.interests must be a list[str]")
    for f in REQUIRED_FIELDS:
        if f == "interests":
            continue
        if not isinstance(raw[f], str):
            raise ValueError(f"profile {who}.{f} must be a string")
    return raw


def embed_pair(client: OpenAI, profile: dict) -> tuple[np.ndarray, np.ndarray]:
    """Returns (self_emb, target_emb), each shape (1536,)."""
    resp = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[build_self_text(profile), build_target_text(profile)],
    )
    return (
        np.asarray(resp.data[0].embedding, dtype=np.float32),
        np.asarray(resp.data[1].embedding, dtype=np.float32),
    )


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

    def score_directional(self, target_emb: np.ndarray, self_emb: np.ndarray) -> float:
        self._next_id += 1
        req_id = f"req_{self._next_id}"
        self.proc.stdin.write(json.dumps({
            "id": req_id,
            "target_emb": target_emb.tolist(),
            "self_emb": self_emb.tolist(),
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
        description="Score a pair of profiles (raw JSON) via the match_scorer subprocess.",
    )
    parser.add_argument("a", help="JSON string for profile A")
    parser.add_argument("b", help="JSON string for profile B")
    parser.add_argument("--threshold", type=float, default=MATCH_THRESHOLD,
                        help=f"pair_score threshold for would_match (default {MATCH_THRESHOLD})")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"path to ONNX model (default {DEFAULT_MODEL}, resolved relative to ml/)")
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

    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY not set in env", file=sys.stderr)
        return 1

    model_path = Path(args.model)
    if not model_path.is_absolute():
        model_path = ML_DIR / args.model
    if not model_path.exists():
        print(f"model not found: {model_path}", file=sys.stderr)
        return 1

    client = OpenAI()
    self_a, target_a = embed_pair(client, profile_a)
    self_b, target_b = embed_pair(client, profile_b)

    scorer = ScorerClient(model_path)
    try:
        score_ab = scorer.score_directional(target_a, self_b)
        score_ba = scorer.score_directional(target_b, self_a)
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