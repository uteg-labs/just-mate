# T06 — Evaluation

> **Status: original hackathon spec, kept for history.** It was not built as written: the modules, file names and architecture here don't match `ml/`. Actual modules are listed at the top of [`../PLAN.md`](../PLAN.md); the current design is [`docs/ML-MATCHING.md`](../../ML-MATCHING.md).

**Goal:** measure trained model on held-out test set, compare against rule-based baseline, output `reports/eval_report.md` + figures.

**Time:** 30 min.

**Prerequisites:** T05 (checkpoint exists), T03 (pair dataset).

**Outputs:**
- `reports/eval_report.md`
- `reports/figures/roc_curve.png`
- `reports/figures/score_distribution.png`
- `reports/figures/confusion_matrix.png`

**Metrics:** ROC-AUC, F1, accuracy, precision, recall, FPR, TPR — at the F1-best threshold on the test set.

**Comparison:** trained Siamese model vs rule-based baseline (`0.7 × Jaccard + 0.3 × shared_intents`).

---

## `src/just_mate_ml/data/baseline.py`

```python
from just_mate_ml.data.compat import jaccard, shared_intents


def rule_score(a: dict, b: dict) -> float:
    j = jaccard(a["interests"], b["interests"])
    si = min(1.0, shared_intents(a["intents"], b["intents"]))
    return 0.7 * j + 0.3 * si
```

---

## `src/just_mate_ml/evaluate.py`

```python
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.metrics import (
    ConfusionMatrixDisplay, confusion_matrix, f1_score,
    precision_score, recall_score, roc_auc_score, roc_curve,
)

from just_mate_ml.data.baseline import rule_score
from just_mate_ml.data.embed import load_embeddings
from just_mate_ml.data.pairs import load_pairs
from just_mate_ml.data.profiles import load_jsonl
from just_mate_ml.data.triplets import build_triplets, split_triplets_by_anchor
from just_mate_ml.model.siamese import SiameseCompatModel


ML_DIR = Path(__file__).resolve().parents[2]
EMBEDDINGS_PATH = ML_DIR / "data" / "embeddings.npy"
USER_ID_INDEX = ML_DIR / "data" / "user_id_index.json"
PAIRS_PATH = ML_DIR / "data" / "pairs.npz"
PROFILES_PATH = ML_DIR / "data" / "profiles.jsonl"
CHECKPOINT_PATH = ML_DIR / "checkpoints" / "model_v0.pt"
REPORT_PATH = ML_DIR / "reports" / "eval_report.md"
FIG_DIR = ML_DIR / "reports" / "figures"

TRAIN_FRAC = 0.8
SEED = 42


def _load_model():
    model = SiameseCompatModel()
    ckpt = torch.load(CHECKPOINT_PATH, weights_only=True)
    model.encoder.load_state_dict(ckpt["encoder"])
    model.head.load_state_dict(ckpt["head"])
    model.eval()
    return model


def _score_model(model, embeddings, idx_a, idx_b, batch_size=256):
    scores = np.empty(len(idx_a), dtype=np.float32)
    with torch.no_grad():
        for i in range(0, len(idx_a), batch_size):
            ai = idx_a[i:i + batch_size]
            bi = idx_b[i:i + batch_size]
            e_a = torch.from_numpy(embeddings[ai]).float()
            e_b = torch.from_numpy(embeddings[bi]).float()
            scores[i:i + batch_size] = model.score(e_a, e_b).numpy()
    return scores


def _score_baseline(profiles, idx_a, idx_b):
    scores = np.empty(len(idx_a), dtype=np.float32)
    for i, (ai, bi) in enumerate(zip(idx_a, idx_b)):
        scores[i] = rule_score(profiles[ai], profiles[bi])
    return scores


def _best_threshold(scores, label):
    best_f1, best_thr = -1.0, 0.5
    for thr in np.linspace(0.05, 0.95, 91):
        f1 = f1_score(label, (scores >= thr).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1, best_thr = f1, float(thr)
    return best_thr


def _metrics_at_threshold(scores, label, threshold):
    pred = (scores >= threshold).astype(int)
    n_pos = max(1, (label == 1).sum())
    n_neg = max(1, (label == 0).sum())
    return {
        "threshold": threshold,
        "accuracy": float((pred == label).mean()),
        "f1": float(f1_score(label, pred, zero_division=0)),
        "precision": float(precision_score(label, pred, zero_division=0)),
        "recall": float(recall_score(label, pred, zero_division=0)),
        "fpr": float(((pred == 1) & (label == 0)).sum() / n_neg),
        "tpr": float(((pred == 1) & (label == 1)).sum() / n_pos),
    }


def _save_figures(model_scores, baseline_scores, label, model_metrics):
    FIG_DIR.mkdir(parents=True, exist_ok=True)

    fpr_m, tpr_m, _ = roc_curve(label, model_scores)
    fpr_b, tpr_b, _ = roc_curve(label, baseline_scores)
    plt.figure(figsize=(6, 6))
    plt.plot(fpr_m, tpr_m, label=f"model (AUC={roc_auc_score(label, model_scores):.3f})", lw=2)
    plt.plot(fpr_b, tpr_b, label=f"baseline (AUC={roc_auc_score(label, baseline_scores):.3f})", lw=2)
    plt.plot([0, 1], [0, 1], "k--", alpha=0.3)
    plt.xlabel("False-positive rate")
    plt.ylabel("True-positive rate")
    plt.title("ROC: trained Siamese vs rule-based baseline")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "roc_curve.png", dpi=120)
    plt.close()

    plt.figure(figsize=(8, 5))
    plt.hist(model_scores[label == 1], bins=40, alpha=0.6, label="positives", color="tab:green")
    plt.hist(model_scores[label == 0], bins=40, alpha=0.6, label="negatives", color="tab:red")
    plt.axvline(model_metrics["threshold"], color="k", linestyle="--",
                label=f"thr={model_metrics['threshold']:.2f}")
    plt.xlabel("Model score")
    plt.ylabel("Count")
    plt.title("Score distributions")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "score_distribution.png", dpi=120)
    plt.close()

    pred = (model_scores >= model_metrics["threshold"]).astype(int)
    cm = confusion_matrix(label, pred)
    disp = ConfusionMatrixDisplay(cm, display_labels=["bad", "good"])
    fig, ax = plt.subplots(figsize=(5, 5))
    disp.plot(ax=ax, values_format="d", cmap="Blues")
    plt.title(f"Confusion matrix (thr={model_metrics['threshold']:.2f})")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "confusion_matrix.png", dpi=120)
    plt.close()


def _write_report(model_metrics, baseline_metrics, model_auc, baseline_auc, n_test):
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    verdict = "beats" if model_auc > baseline_auc else "loses to"
    REPORT_PATH.write_text(f"""# ML evaluation report

Test set: {n_test} pairs (20% hold-out), balanced pos/neg.

## Trained Siamese model

| Metric | Value |
|---|---|
| ROC-AUC | **{model_auc:.4f}** |
| Threshold (F1-best) | {model_metrics["threshold"]:.4f} |
| Accuracy | {model_metrics["accuracy"]:.4f} |
| F1 | {model_metrics["f1"]:.4f} |
| Precision | {model_metrics["precision"]:.4f} |
| Recall | {model_metrics["recall"]:.4f} |
| FPR | {model_metrics["fpr"]:.4f} |
| TPR | {model_metrics["tpr"]:.4f} |

## Rule-based baseline

| Metric | Value |
|---|---|
| ROC-AUC | {baseline_auc:.4f} |
| Threshold (F1-best) | {baseline_metrics["threshold"]:.4f} |
| Accuracy | {baseline_metrics["accuracy"]:.4f} |
| F1 | {baseline_metrics["f1"]:.4f} |

## Verdict

Trained model **{verdict}** the baseline on ROC-AUC
({model_auc:.4f} vs {baseline_auc:.4f}).

On F1: model = {model_metrics["f1"]:.4f}, baseline = {baseline_metrics["f1"]:.4f}.

## Figures
- `figures/roc_curve.png`
- `figures/score_distribution.png`
- `figures/confusion_matrix.png`
""")


def main():
    embeddings, _ = load_embeddings(EMBEDDINGS_PATH, USER_ID_INDEX)
    idx_a, idx_b, gt, label = load_pairs(PAIRS_PATH)
    profiles = load_jsonl(PROFILES_PATH)

    triplets = build_triplets(idx_a, idx_b, label, max_triplets_per_anchor=5)
    _, val_triplets = split_triplets_by_anchor(triplets, train_frac=TRAIN_FRAC, seed=SEED)
    val_anchors = {a for a, _, _ in val_triplets}
    test_mask = np.isin(idx_a, list(val_anchors))
    idx_a_te = idx_a[test_mask]
    idx_b_te = idx_b[test_mask]
    label_te = label[test_mask]
    print(f"test pairs: {len(idx_a_te)} (pos={int(label_te.sum())}, neg={int(len(label_te) - label_te.sum())})")

    model = _load_model()
    model_scores = _score_model(model, embeddings, idx_a_te, idx_b_te)
    baseline_scores = _score_baseline(profiles, idx_a_te, idx_b_te)

    model_metrics = _metrics_at_threshold(model_scores, label_te, _best_threshold(model_scores, label_te))
    baseline_metrics = _metrics_at_threshold(baseline_scores, label_te, _best_threshold(baseline_scores, label_te))
    model_auc = float(roc_auc_score(label_te, model_scores))
    baseline_auc = float(roc_auc_score(label_te, baseline_scores))

    _save_figures(model_scores, baseline_scores, label_te, model_metrics)
    _write_report(model_metrics, baseline_metrics, model_auc, baseline_auc, len(idx_a_te))
    print(f"wrote {REPORT_PATH}")
    print(f"wrote figures to {FIG_DIR}/")


if __name__ == "__main__":
    main()
```

---

## `tests/test_baseline.py`

```python
from just_mate_ml.data.baseline import rule_score


def test_baseline_identical():
    p = {"interests": ["a", "b"], "intents": ["x"]}
    assert rule_score(p, p) == 1.0


def test_baseline_zero_overlap():
    a = {"interests": ["a"], "intents": ["x"]}
    b = {"interests": ["z"], "intents": ["y"]}
    assert rule_score(a, b) == 0.0


def test_baseline_in_unit_range():
    a = {"interests": ["a", "b", "c"], "intents": ["x"]}
    b = {"interests": ["a", "c"], "intents": ["y"]}
    assert 0 <= rule_score(a, b) <= 1
```

## `tests/test_evaluate.py`

```python
import numpy as np

from just_mate_ml.evaluate import _best_threshold, _metrics_at_threshold


def test_best_threshold_in_unit_range():
    scores = np.random.default_rng(0).uniform(0, 1, 100)
    label = (scores > 0.5).astype(int)
    assert 0 <= _best_threshold(scores, label) <= 1


def test_metrics_at_threshold_basic():
    label = np.array([0, 0, 1, 1])
    scores = np.array([0.1, 0.4, 0.6, 0.9])
    m = _metrics_at_threshold(scores, label, 0.5)
    assert m["accuracy"] == 1.0
    assert m["f1"] == 1.0
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_baseline.py tests/test_evaluate.py -v
uv run python -m just_mate_ml.evaluate
cat reports/eval_report.md
```

---

## Definition of Done

- [ ] All 5 tests pass
- [ ] `reports/eval_report.md` has 2 metric tables (model / baseline)
- [ ] 3 PNG figures exist
- [ ] ROC-AUC > 0.7 (otherwise training needs investigation)
- [ ] Model beats baseline on ROC-AUC, OR report explains why not

---

## How to read the verdict

| If | Then |
|---|---|
| model AUC > 0.85, F1 > 0.80 | ship it |
| AUC 0.7-0.85 | works, try more data or simpler architecture |
| AUC < 0.7 | something broken — check embeddings + training loss |
| baseline beats model | model is overfit or learned noise — retrain |