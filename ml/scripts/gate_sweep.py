"""Compare alternative match gates on the v3 model.

Three gates:
  A: pair_score = AB + BA                       (current default)
  B: min_score  = min(AB, BA)                   (strict mutual)
  C: two_stage  = (AB + BA >= T_sum) AND (min >= T_min)

Uses the same val split as train_experiments_v3.py (seed=42, 80/20 by anchor).
For each gate, sweeps the threshold and reports F1-best TPR / FPR / precision /
F1 / accuracy, plus the percentile distributions of AB, BA, sum, min on the
positive and negative pairs.

The scorer subprocess (match_scorer.py) is used to keep inference consistent
with the production stack. For very large val sets, consider raising --n.

Usage:
    python scripts/gate_sweep.py
    python scripts/gate_sweep.py --n 5000 --sum-low 0.30 --sum-high 1.40
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from sklearn.metrics import f1_score, roc_auc_score

ML_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ML_DIR / "data"
SCORER = ML_DIR / "scripts" / "match_scorer.py"
DEFAULT_MODEL = DATA_DIR.parent / "checkpoints" / "model_v3_best.onnx"
SEED = 42


def split_val(anchor_idx: np.ndarray) -> np.ndarray:
    """Replicate the 80/20 anchor split from train_experiments_v3.py."""
    rng = np.random.default_rng(SEED)
    anchors = sorted(set(anchor_idx.tolist()))
    rng.shuffle(anchors)
    n_train = int(0.8 * len(anchors))
    train_anchor_set = set(anchors[:n_train])
    is_train = np.array([a in train_anchor_set for a in anchor_idx])
    return np.where(~is_train)[0]


def score_via_subprocess(
    target_emb: np.ndarray,
    self_emb: np.ndarray,
    soft_jacc: np.ndarray,
    model_path: Path,
) -> np.ndarray:
    """Send (target_emb, self_emb, soft_jacc) triples to match_scorer via NDJSON
    and return the scores in the same order."""
    n = len(target_emb)
    assert len(self_emb) == n and len(soft_jacc) == n
    assert target_emb.shape[1] == 1536 and self_emb.shape[1] == 1536

    proc = subprocess.Popen(
        [sys.executable, str(SCORER), str(model_path)],
        cwd=str(ML_DIR),
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, bufsize=1,
    )
    try:
        time.sleep(0.3)
        proc.stderr.readline()  # boot JSON

        id_to_i: dict[str, int] = {}
        results = np.zeros(n, dtype=np.float32)
        for i in range(n):
            rid = f"r{i}"
            id_to_i[rid] = i
            req = {
                "id": rid,
                "target_emb": target_emb[i].tolist(),
                "self_emb": self_emb[i].tolist(),
                "soft_jacc": float(soft_jacc[i]),
            }
            proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()

        received = 0
        while received < n:
            line = proc.stdout.readline()
            resp = json.loads(line)
            if resp.get("id") in id_to_i:
                results[id_to_i[resp["id"]]] = resp["score"]
                received += 1
        return results
    finally:
        proc.stdin.close()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


def describe(name: str, arr: np.ndarray) -> str:
    p = np.percentile(arr, [1, 5, 25, 50, 75, 95, 99])
    return (
        f"  {name:14s} mean={arr.mean():.3f}  median={np.median(arr):.3f}  "
        f"p1={p[0]:.3f} p5={p[1]:.3f} p25={p[2]:.3f} p50={p[3]:.3f} "
        f"p75={p[4]:.3f} p95={p[5]:.3f} p99={p[6]:.3f}"
    )


def sweep_threshold(y_true: np.ndarray, scores: np.ndarray, thresholds: np.ndarray) -> list:
    rows = []
    for t in thresholds:
        pred = (scores >= t).astype(int)
        tp = int(((pred == 1) & (y_true == 1)).sum())
        fp = int(((pred == 1) & (y_true == 0)).sum())
        fn = int(((pred == 0) & (y_true == 1)).sum())
        tn = int(((pred == 0) & (y_true == 0)).sum())
        prec = tp / max(1, tp + fp)
        rec = tp / max(1, tp + fn)
        spec = tn / max(1, tn + fp)
        f1 = f1_score(y_true, pred, zero_division=0)
        rows.append((t, prec, rec, spec, f1, tp, fp, fn, tn))
    return rows


def print_gate_table(name: str, rows: list, f1_col: int = 4) -> None:
    best = max(rows, key=lambda r: r[f1_col])
    print(f"\n--- {name} ---")
    print(f"  {'thr':>6s}  {'prec':>6s}  {'recall':>6s}  {'spec':>6s}  {'F1':>6s}  {'TP':>5s}  {'FP':>5s}  {'FN':>5s}  {'TN':>5s}")
    for r in rows:
        t, prec, rec, spec, f1, tp, fp, fn, tn = r
        marker = " ← best F1" if abs(f1 - best[f1_col]) < 1e-9 else ""
        print(f"  {t:6.2f}  {prec:6.3f}  {rec:6.3f}  {spec:6.3f}  {f1:6.4f}  {tp:5d}  {fp:5d}  {fn:5d}  {tn:5d}{marker}")
    t, prec, rec, spec, f1, tp, fp, fn, tn = best
    print(f"\n  BEST @ F1-best {t:.2f}: prec={prec:.3f} rec={rec:.3f} spec={spec:.3f} F1={f1:.4f}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=1000,
                   help="positives AND negatives to sample from val")
    p.add_argument("--model", default=str(DEFAULT_MODEL))
    p.add_argument("--sum-low", type=float, default=0.20)
    p.add_argument("--sum-high", type=float, default=1.50)
    p.add_argument("--sum-step", type=float, default=0.05)
    p.add_argument("--min-low", type=float, default=0.02)
    p.add_argument("--min-high", type=float, default=0.50)
    p.add_argument("--min-step", type=float, default=0.02)
    args = p.parse_args()

    print(f"loading data from {DATA_DIR}…")
    self_emb = np.load(DATA_DIR / "profile_embeddings_self.npy")
    target_emb = np.load(DATA_DIR / "profile_embeddings_target.npy")
    sj_cache = np.load(DATA_DIR / "soft_jaccard.npy")
    triplets = np.load(DATA_DIR / "triplets.npz")
    anchor_idx = triplets["anchor"]
    pos_idx = triplets["positive"]
    neg_idx = triplets["negative"]

    val_sel = split_val(anchor_idx)
    print(f"val: {len(val_sel)} triplets (total {len(anchor_idx)})")

    rng = np.random.default_rng(SEED + 1)
    pos_sample = rng.choice(val_sel, size=min(args.n, len(val_sel)), replace=False)
    neg_sample = rng.choice(val_sel, size=min(args.n, len(val_sel)), replace=False)
    print(f"sampling {len(pos_sample)} positives + {len(neg_sample)} negatives")
    print(f"scoring {2 * (len(pos_sample) + len(neg_sample))} requests via match_scorer subprocess…")

    t0 = time.time()
    pos_ab = score_via_subprocess(
        target_emb[anchor_idx[pos_sample]], self_emb[pos_idx[pos_sample]],
        sj_cache[anchor_idx[pos_sample], pos_idx[pos_sample]], Path(args.model),
    )
    pos_ba = score_via_subprocess(
        target_emb[pos_idx[pos_sample]], self_emb[anchor_idx[pos_sample]],
        sj_cache[pos_idx[pos_sample], anchor_idx[pos_sample]], Path(args.model),
    )
    neg_ab = score_via_subprocess(
        target_emb[anchor_idx[neg_sample]], self_emb[neg_idx[neg_sample]],
        sj_cache[anchor_idx[neg_sample], neg_idx[neg_sample]], Path(args.model),
    )
    neg_ba = score_via_subprocess(
        target_emb[neg_idx[neg_sample]], self_emb[anchor_idx[neg_sample]],
        sj_cache[neg_idx[neg_sample], anchor_idx[neg_sample]], Path(args.model),
    )
    print(f"scored in {time.time() - t0:.1f}s")

    pos_pair = pos_ab + pos_ba
    neg_pair = neg_ab + neg_ba
    pos_min = np.minimum(pos_ab, pos_ba)
    neg_min = np.minimum(neg_ab, neg_ba)
    n = len(pos_sample)

    print("\n=== DISTRIBUTIONS ===")
    print("\nPositives:")
    print(describe("AB", pos_ab))
    print(describe("BA", pos_ba))
    print(describe("pair sum", pos_pair))
    print(describe("min(AB,BA)", pos_min))
    print("\nNegatives:")
    print(describe("AB", neg_ab))
    print(describe("BA", neg_ba))
    print(describe("pair sum", neg_pair))
    print(describe("min(AB,BA)", neg_min))

    def cohens_d(a: np.ndarray, b: np.ndarray) -> float:
        pooled = np.sqrt((a.var() + b.var()) / 2)
        return float("inf") if pooled == 0 else float((a.mean() - b.mean()) / pooled)

    print("\nSeparation (Cohen d):")
    print(f"  AB          d = {cohens_d(pos_ab, neg_ab):.2f}")
    print(f"  BA          d = {cohens_d(pos_ba, neg_ba):.2f}")
    print(f"  pair sum    d = {cohens_d(pos_pair, neg_pair):.2f}")
    print(f"  min(AB,BA)  d = {cohens_d(pos_min, neg_min):.2f}")

    y_pos = np.ones(n)
    y_neg = np.zeros(n)
    y_true = np.concatenate([y_pos, y_neg])

    sum_thresholds = np.round(np.arange(args.sum_low, args.sum_high + 1e-9, args.sum_step), 2)
    min_thresholds = np.round(np.arange(args.min_low, args.min_high + 1e-9, args.min_step), 2)

    print("\n=== GATES ===")
    print_gate_table(
        "Gate A: pair_score = AB + BA  (current default)",
        sweep_threshold(y_true, np.concatenate([pos_pair, neg_pair]), sum_thresholds),
    )
    print_gate_table(
        "Gate B: min(AB, BA)  (strict mutual)",
        sweep_threshold(y_true, np.concatenate([pos_min, neg_min]), min_thresholds),
    )

    print("\n--- Gate C: two-stage — sum >= T_sum AND min >= T_min ---")
    best_f1 = 0.0
    best_row: tuple | None = None
    rows_c: list = []
    for t_sum in sum_thresholds:
        for t_min in min_thresholds:
            pred = ((np.concatenate([pos_pair, neg_pair]) >= t_sum) &
                    (np.concatenate([pos_min, neg_min]) >= t_min)).astype(int)
            tp = int(((pred == 1) & (y_true == 1)).sum())
            fp = int(((pred == 1) & (y_true == 0)).sum())
            fn = int(((pred == 0) & (y_true == 1)).sum())
            tn = int(((pred == 0) & (y_true == 0)).sum())
            prec = tp / max(1, tp + fp)
            rec = tp / max(1, tp + fn)
            spec = tn / max(1, tn + fp)
            f1 = f1_score(y_true, pred, zero_division=0)
            rows_c.append((t_sum, t_min, prec, rec, spec, f1, tp, fp, fn, tn))
            if f1 > best_f1:
                best_f1 = f1
                best_row = (t_sum, t_min, prec, rec, spec, f1, tp, fp, fn, tn)
    if best_row is not None:
        t_sum, t_min, prec, rec, spec, f1, tp, fp, fn, tn = best_row
        print(f"  BEST @ sum>={t_sum:.2f} AND min>={t_min:.2f}: "
              f"prec={prec:.3f} rec={rec:.3f} spec={spec:.3f} F1={f1:.4f}  "
              f"(TP={tp} FP={fp} FN={fn} TN={tn})")

    print("\n=== ROC AUC (single-feature) ===")
    print(f"  AB          AUC = {roc_auc_score(y_true, np.concatenate([pos_ab, neg_ab])):.4f}")
    print(f"  BA          AUC = {roc_auc_score(y_true, np.concatenate([pos_ba, neg_ba])):.4f}")
    print(f"  pair sum    AUC = {roc_auc_score(y_true, np.concatenate([pos_pair, neg_pair])):.4f}")
    print(f"  min(AB,BA)  AUC = {roc_auc_score(y_true, np.concatenate([pos_min, neg_min])):.4f}")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())