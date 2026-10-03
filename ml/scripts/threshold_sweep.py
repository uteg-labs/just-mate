"""Sweep the symmetric-pair threshold 0.76 → 0.84 and find the best one.

Uses the full held-out val set (25k triplets). Reports precision / recall /
F1 / specificity / accuracy / confusion-matrix for every threshold in the
sweep, and highlights the best one (F1).

Usage:
    python scripts/threshold_sweep.py
    python scripts/threshold_sweep.py --low 0.70 --high 0.95 --step 0.01
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import onnxruntime as ort
from sklearn.metrics import f1_score, roc_auc_score

from benchmark_val import load_data, load_onnx_session, score_batch

ML_DIR = Path(__file__).resolve().parents[1]
CKPT_DIR = ML_DIR / "checkpoints"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--low", type=float, default=0.76)
    p.add_argument("--high", type=float, default=0.84)
    p.add_argument("--step", type=float, default=0.005)
    p.add_argument("--model", default=str(CKPT_DIR / "model_v0.onnx"))
    args = p.parse_args()

    sess = load_onnx_session(Path(args.model))
    print(f"loaded {Path(args.model).name}")
    data = load_data(25_000)  # full val

    triplets = data["triplets"]; val_idx = data["val_idx"]
    self_emb = data["self_emb"]; target_emb = data["target_emb"]
    n = len(val_idx)

    pos_a = triplets["anchor"][val_idx]; pos_b = triplets["positive"][val_idx]
    neg_a = triplets["anchor"][val_idx]; neg_b = triplets["negative"][val_idx]

    print("scoring positives…")
    s_pos = score_batch(sess, target_emb[pos_a], self_emb[pos_b]) \
          + score_batch(sess, target_emb[pos_b], self_emb[pos_a])
    print("scoring negatives…")
    s_neg = score_batch(sess, target_emb[neg_a], self_emb[neg_b]) \
          + score_batch(sess, target_emb[neg_b], self_emb[neg_a])

    y_true = np.concatenate([np.ones(n), np.zeros(n)])
    pair = np.concatenate([s_pos, s_neg])
    auc = float(roc_auc_score(y_true, pair))

    print(f"\nval n={n} pairs={len(y_true)}  pos_mean={s_pos.mean():.3f}  neg_mean={s_neg.mean():.3f}  AUC={auc:.4f}\n")

    thresholds = np.arange(args.low, args.high + 1e-9, args.step)
    rows = []
    for t in thresholds:
        pred = (pair >= t).astype(int)
        tp = int(((pred == 1) & (y_true == 1)).sum())
        fp = int(((pred == 1) & (y_true == 0)).sum())
        fn = int(((pred == 0) & (y_true == 1)).sum())
        tn = int(((pred == 0) & (y_true == 0)).sum())
        prec = tp / max(1, tp + fp)
        rec = tp / max(1, tp + fn)
        spec = tn / max(1, tn + fp)
        acc = (tp + tn) / len(y_true)
        f1 = f1_score(y_true, pred, zero_division=0)
        rows.append((t, prec, rec, spec, acc, f1, tp, fp, fn, tn))

    print(f"  {'thr':>6s}  {'prec':>6s}  {'recall':>6s}  {'spec':>6s}  {'acc':>6s}  {'F1':>6s}  {'TP':>5s}  {'FP':>5s}  {'FN':>5s}  {'TN':>5s}")
    print(f"  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*6}  {'-'*5}  {'-'*5}  {'-'*5}  {'-'*5}")
    for r in rows:
        t, prec, rec, spec, acc, f1, tp, fp, fn, tn = r
        marker = " ← best F1" if abs(f1 - max(x[5] for x in rows)) < 1e-9 else ""
        print(f"  {t:6.3f}  {prec:6.3f}  {rec:6.3f}  {spec:6.3f}  {acc:6.3f}  {f1:6.4f}  {tp:5d}  {fp:5d}  {fn:5d}  {tn:5d}{marker}")

    best = max(rows, key=lambda r: r[5])
    t, prec, rec, spec, acc, f1, tp, fp, fn, tn = best
    print(f"\n=== BEST @ F1-best threshold {t:.3f} ===")
    print(f"  precision = {prec:.4f}  ({prec*100:.1f}%)")
    print(f"  recall    = {rec:.4f}  ({rec*100:.1f}%)")
    print(f"  specificity= {spec:.4f}  ({spec*100:.1f}%)")
    print(f"  accuracy  = {acc:.4f}  ({acc*100:.1f}%)")
    print(f"  F1        = {f1:.4f}")
    print(f"  confusion matrix:  TP={tp}  FP={fp}  FN={fn}  TN={tn}")
    print(f"  per-class:        'match' = {(tp+fp)/len(y_true)*100:.1f}% of all  |  'no match' = {(fn+tn)/len(y_true)*100:.1f}% of all")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())