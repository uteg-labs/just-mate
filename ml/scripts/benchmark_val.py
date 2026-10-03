"""Benchmark the trained match model on the held-out val set.

Loads 1000 (configurable) val triplets, runs symmetric pair scoring via
ONNX Runtime directly (no subprocess overhead), and reports precision /
recall / F1 / confusion-matrix at a configurable threshold.

Usage:
    python scripts/benchmark_val.py
    python scripts/benchmark_val.py --n 5000 --threshold 0.78
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort


ML_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ML_DIR / "data"
CKPT_DIR = ML_DIR / "checkpoints"


def load_data(n_pairs: int):
    self_emb = np.load(DATA_DIR / "profile_embeddings_self.npy")
    target_emb = np.load(DATA_DIR / "profile_embeddings_target.npy")
    profile_ids = json.loads((DATA_DIR / "profile_ids.json").read_text())
    triplets = np.load(DATA_DIR / "triplets.npz")
    pid_to_idx = {p: i for i, p in enumerate(profile_ids)}

    # Same 80/20 split as training (seed=42)
    rng = np.random.default_rng(42)
    anchors = sorted(set(triplets["anchor"].tolist()))
    rng.shuffle(anchors)
    n_train = int(0.8 * len(anchors))
    train_set = set(anchors[:n_train])
    val_mask = np.array([a not in train_set for a in triplets["anchor"]])
    val_idx = np.where(val_mask)[0]
    val_idx = val_idx[:n_pairs]  # take first N (deterministic — same anchors each run)

    return {
        "self_emb": self_emb,
        "target_emb": target_emb,
        "triplets": triplets,
        "val_idx": val_idx,
        "n_profiles": len(profile_ids),
    }


def load_onnx_session(model_path: Path) -> ort.InferenceSession:
    so = ort.SessionOptions()
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.intra_op_num_threads = 4
    so.inter_op_num_threads = 1
    return ort.InferenceSession(str(model_path), sess_options=so)


def score_batch(sess, t, s, batch: int = 256):
    """Score all pairs (target=t, self=s). Returns (N,) sigmoid scores."""
    out = np.empty(len(t), dtype=np.float32)
    for s_i in range(0, len(t), batch):
        e_i = s_i + batch
        tt = t[s_i:e_i].astype(np.float32)
        ss = s[s_i:e_i].astype(np.float32)
        out[s_i:e_i] = sess.run(None, {"target_emb": tt, "self_emb": ss})[0].squeeze()
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Benchmark model on val triplets.")
    parser.add_argument("--n", type=int, default=1000, help="number of val triplets to use")
    parser.add_argument("--threshold", type=float, default=0.78, help="symmetric pair threshold")
    parser.add_argument("--model", default=str(CKPT_DIR / "model_v0.onnx"))
    args = parser.parse_args()

    print(f"benchmark: {args.n} val triplets @ threshold {args.threshold}")
    sess = load_onnx_session(Path(args.model))
    print(f"loaded {Path(args.model).name}")

    data = load_data(args.n)
    val_idx = data["val_idx"]
    triplets = data["triplets"]
    self_emb = data["self_emb"]
    target_emb = data["target_emb"]
    n_pairs = len(val_idx)

    # Build the (target, self) pairs for positive and negative
    pos_a = triplets["anchor"][val_idx]; pos_b = triplets["positive"][val_idx]
    neg_a = triplets["anchor"][val_idx]; neg_b = triplets["negative"][val_idx]

    t0 = time.time()
    # Positive: directional score(A→B) + score(B→A)
    s_pos_ab = score_batch(sess, target_emb[pos_a], self_emb[pos_b])
    s_pos_ba = score_batch(sess, target_emb[pos_b], self_emb[pos_a])
    s_pos = s_pos_ab + s_pos_ba
    # Negative: directional score(A→C) + score(C→A)
    s_neg_ab = score_batch(sess, target_emb[neg_a], self_emb[neg_b])
    s_neg_ba = score_batch(sess, target_emb[neg_b], self_emb[neg_a])
    s_neg = s_neg_ab + s_neg_ba
    elapsed = time.time() - t0
    print(f"scored {n_pairs * 2} pairs in {elapsed*1000:.0f}ms  ({n_pairs * 2 / elapsed:.0f} pairs/sec)")

    # Ground truth: positive label = 1, negative = 0
    y_true = np.concatenate([np.ones(n_pairs), np.zeros(n_pairs)])
    pair_scores = np.concatenate([s_pos, s_neg])

    # At the requested threshold
    thr = args.threshold
    pred = (pair_scores >= thr).astype(int)
    tp = int(((pred == 1) & (y_true == 1)).sum())
    fp = int(((pred == 1) & (y_true == 0)).sum())
    fn = int(((pred == 0) & (y_true == 1)).sum())
    tn = int(((pred == 0) & (y_true == 0)).sum())

    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    specificity = tn / max(1, tn + fp)
    accuracy = (tp + tn) / len(y_true)
    f1 = 2 * precision * recall / max(1e-12, precision + recall)

    # Also sweep threshold for a curve
    from sklearn.metrics import roc_auc_score, f1_score as sk_f1
    auc = float(roc_auc_score(y_true, pair_scores))
    # F1-best
    best_f1, best_thr = -1.0, 1.0
    for t in np.linspace(0.10, 1.90, 73):
        f1_t = sk_f1(y_true, (pair_scores >= t).astype(int), zero_division=0)
        if f1_t > best_f1:
            best_f1, best_thr = float(f1_t), float(t)

    # Score distribution
    print(f"\n=== {n_pairs} val triplets (positive + negative) ===\n")
    print(f"  pos scores: mean={s_pos.mean():.3f}  std={s_pos.std():.3f}  min={s_pos.min():.3f}  max={s_pos.max():.3f}")
    print(f"  neg scores: mean={s_neg.mean():.3f}  std={s_neg.std():.3f}  min={s_neg.min():.3f}  max={s_neg.max():.3f}")
    print(f"  margin (pos - neg): mean={(s_pos - s_neg).mean():.3f}  median={np.median(s_pos - s_neg):.3f}")
    print(f"  AUC: {auc:.4f}")

    print(f"\n=== Confusion matrix @ threshold {thr:.2f} ===\n")
    print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}  (n={tp+fp+fn+tn})")
    print(f"  accuracy:  {accuracy:.4f}  ({accuracy*100:.1f}%)")
    print(f"  precision: {precision:.4f}  ({precision*100:.1f}%)")
    print(f"  recall:    {recall:.4f}  ({recall*100:.1f}%)")
    print(f"  specificity:{specificity:.4f}  ({specificity*100:.1f}%)")
    print(f"  F1:        {f1:.4f}")

    print(f"\n=== F1-best threshold ===")
    print(f"  best F1 = {best_f1:.4f} @ threshold {best_thr:.2f}")

    # How many thresholds give specific precisions?
    print(f"\n=== Threshold sweep (precision / recall) ===")
    print(f"  {'thr':>6s}  {'precision':>9s}  {'recall':>7s}  {'F1':>6s}  {'TP':>4s}  {'FP':>4s}")
    for t in [0.50, 0.60, 0.65, 0.70, 0.75, 0.78, 0.80, 0.85, 0.90, 1.00, 1.10]:
        pp = (pair_scores >= t).astype(int)
        tp_t = int(((pp == 1) & (y_true == 1)).sum())
        fp_t = int(((pp == 1) & (y_true == 0)).sum())
        fn_t = int(((pp == 0) & (y_true == 1)).sum())
        prec_t = tp_t / max(1, tp_t + fp_t)
        rec_t = tp_t / max(1, tp_t + fn_t)
        f1_t = 2 * prec_t * rec_t / max(1e-12, prec_t + rec_t)
        print(f"  {t:6.2f}  {prec_t:9.4f}  {rec_t:7.4f}  {f1_t:6.4f}  {tp_t:4d}  {fp_t:4d}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())