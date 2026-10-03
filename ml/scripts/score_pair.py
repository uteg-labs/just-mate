"""Score a pair of profiles by id via the standalone match_scorer subprocess.

Usage:
    python scripts/score_pair.py u_000042 u_000123
    python scripts/score_pair.py u_000042 u_000123 --json
    python scripts/score_pair.py --batch < pairs.txt
    python scripts/score_pair.py --ids u_000042,u_000123,u_000777 u_000042,u_000777,u_000042

Default: prints the symmetric pair score (target_A → self_B + target_B → self_A)
which is what the product uses. Pass --directional to also see the two
individual direction scores.

Modes:
  1. Two CLI args                : one score for that pair
  2. --ids "a,b,c a,b,d"         : score N pairs in one batch (space-separated columns)
  3. --batch                     : read "id_a id_b" lines from stdin

Output JSON (with --json or in --batch mode):
  {
    "a": "u_000042", "b": "u_000123",
    "score_ab": 0.62, "score_ba": 0.71,         # directional scores
    "pair_score": 1.33,                          # symmetric (the product signal)
    "would_match": true,                         # pair_score >= 0.85 (calibrated threshold)
  }
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np

ML_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ML_DIR / "data"
SCORER = ML_DIR / "scripts" / "match_scorer.py"
MATCH_THRESHOLD = 0.78  # override with --threshold


def load_profile_ids() -> list[str]:
    return json.loads((DATA_DIR / "profile_ids.json").read_text())


def load_embeddings() -> tuple[np.ndarray, np.ndarray, dict[str, int]]:
    self_emb = np.load(DATA_DIR / "profile_embeddings_self.npy")
    target_emb = np.load(DATA_DIR / "profile_embeddings_target.npy")
    ids = load_profile_ids()
    return self_emb, target_emb, {pid: i for i, pid in enumerate(ids)}


class ScorerClient:
    """Persistent subprocess wrapper around match_scorer.py."""

    def __init__(self) -> None:
        # Use sys.executable so we don't depend on uv for runtime.
        self.proc = subprocess.Popen(
            [sys.executable, str(SCORER)],
            cwd=str(ML_DIR),
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, bufsize=1,
        )
        self._next_id = 0

    def score_directional(self, target_emb, self_emb) -> float:
        self._next_id += 1
        req_id = f"req_{self._next_id}"
        self.proc.stdin.write(json.dumps({
            "id": req_id,
            "target_emb": target_emb.tolist(),
            "self_emb": self_emb.tolist(),
        }) + "\n")
        self.proc.stdin.flush()
        # Read until we get our id back (in case other responses queued up)
        while True:
            line = self.proc.stdout.readline()
            if not line:
                raise RuntimeError(f"scorer subprocess closed: {self.proc.stderr.read()}")
            resp = json.loads(line)
            if resp.get("id") == req_id:
                if "error" in resp:
                    raise RuntimeError(f"scorer error: {resp['error']}")
                return float(resp["score"])

    def score_pair(self, a_id: str, b_id: str, self_emb, target_emb, pid_to_idx, threshold: float = MATCH_THRESHOLD) -> dict:
        ia = pid_to_idx[a_id]
        ib = pid_to_idx[b_id]
        target_a = target_emb[ia]
        target_b = target_emb[ib]
        self_a = self_emb[ia]
        self_b = self_emb[ib]

        score_ab = self.score_directional(target_a, self_b)  # A wants B?
        score_ba = self.score_directional(target_b, self_a)  # B wants A?
        pair_score = score_ab + score_ba

        return {
            "a": a_id,
            "b": b_id,
            "score_ab": round(score_ab, 4),
            "score_ba": round(score_ba, 4),
            "pair_score": round(pair_score, 4),
            "would_match": pair_score >= threshold,
        }

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
    parser = argparse.ArgumentParser(description="Score profile pairs via match_scorer subprocess.")
    parser.add_argument("a", nargs="?", help="profile id A (target)")
    parser.add_argument("b", nargs="?", help="profile id B (self)")
    parser.add_argument("--ids", help='comma-separated list of "id_a,id_b" pairs, space-separated')
    parser.add_argument("--batch", action="store_true",
                        help="read 'id_a id_b' lines from stdin (one per line)")
    parser.add_argument("--json", action="store_true", help="emit JSON output instead of plain text")
    parser.add_argument("--show-ids", action="store_true",
                        help="print all available profile ids (first 20) and exit")
    parser.add_argument("--threshold", type=float, default=MATCH_THRESHOLD,
                        help=f"pair_score threshold for would_match (default {MATCH_THRESHOLD})")
    args = parser.parse_args()

    if args.show_ids:
        ids = load_profile_ids()
        print(f"{len(ids)} profiles. first 20:")
        for pid in ids[:20]:
            print(f"  {pid}")
        return 0

    # Resolve which pairs to score
    pairs: list[tuple[str, str]] = []
    if args.batch:
        for line in sys.stdin:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) != 2:
                print(f"skipping bad line: {line!r}", file=sys.stderr)
                continue
            pairs.append((parts[0], parts[1]))
    elif args.ids:
        for col in args.ids.split():
            ab = col.split(",")
            if len(ab) != 2:
                print(f"skipping bad column: {col!r}", file=sys.stderr)
                continue
            pairs.append((ab[0], ab[1]))
    elif args.a and args.b:
        pairs.append((args.a, args.b))
    else:
        parser.print_help()
        return 1

    if not pairs:
        print("no pairs to score", file=sys.stderr)
        return 1

    # Load embeddings + build id index
    self_emb, target_emb, pid_to_idx = load_embeddings()

    # Validate IDs up front (fail fast)
    for a, b in pairs:
        if a not in pid_to_idx:
            print(f"unknown profile id: {a}", file=sys.stderr)
            return 1
        if b not in pid_to_idx:
            print(f"unknown profile id: {b}", file=sys.stderr)
            return 1

    # Single subprocess for all pairs (fast — model is loaded once)
    client = ScorerClient()
    try:
        results = []
        for a, b in pairs:
            r = client.score_pair(a, b, self_emb, target_emb, pid_to_idx,
                                   threshold=args.threshold)
            results.append(r)

        if args.json:
            print(json.dumps(results if len(results) > 1 else results[0], indent=2))
        else:
            threshold = args.threshold
            for r in results:
                would = r["pair_score"] >= threshold
                tag = "✓ MATCH" if would else "✗ no"
                print(f"{r['a']} ↔ {r['b']}  "
                      f"A→B={r['score_ab']:.2f}  B→A={r['score_ba']:.2f}  "
                      f"pair={r['pair_score']:.2f}  {tag}  (thr {threshold:.2f})")
    finally:
        client.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())