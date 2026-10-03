"""V2 training experiments — 25k profiles, hard neg mining, multi-loss.

Improvements over train_experiments.py (v1, 1k profiles):
- Loads triplet INDICES (not embeddings) — scales to any dataset size
- Hard negative mining: in each batch, replace the negative with the
  hardest one available (closest to anchor in current embedding space)
- MarginRankingLoss as a drop-in alternative to BCE
- Harder sweeps: more configs, more diversity

Same model class as v1 (encoder_hidden, dropout, noise, scheduler knobs).
Same eval (symmetric pair score AUC on hold-out anchors).
"""
from __future__ import annotations

import json
import time
from copy import deepcopy
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from sklearn.metrics import f1_score, roc_auc_score

ML_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ML_DIR / "data"
CKPT_DIR = ML_DIR / "checkpoints"
CKPT_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = torch.device("cpu")
ENCODER_INPUT_DIM = 1536
ENCODER_OUTPUT = 128
PAIR_FEATURE_DIM = 2 * ENCODER_OUTPUT + 1  # 257
TRIPLET_MARGIN = 1.0
SEED = 42

torch.manual_seed(SEED)
np.random.seed(SEED)


# --- Model (same as v1) --------------------------------------------------

class SharedEncoder(nn.Module):
    def __init__(self, hidden_dims=(256,), dropout=0.0):
        super().__init__()
        layers: list[nn.Module] = []
        prev = ENCODER_INPUT_DIM
        for h in hidden_dims:
            layers += [nn.Linear(prev, h), nn.LayerNorm(h), nn.ReLU()]
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            prev = h
        layers += [nn.Linear(prev, ENCODER_OUTPUT), nn.LayerNorm(ENCODER_OUTPUT)]
        self.network = nn.Sequential(*layers)

    def forward(self, e):
        z = self.network(e)
        return F.normalize(z, p=2, dim=-1)


def build_pair_features(z_a, z_b):
    diff = (z_a - z_b).abs()
    prod = z_a * z_b
    cos = (z_a * z_b).sum(dim=-1, keepdim=True)
    return torch.cat([diff, prod, cos], dim=-1)


class MatchHead(nn.Module):
    def __init__(self, hidden_dims=(128, 32), dropout=0.0):
        super().__init__()
        layers: list[nn.Module] = []
        prev = PAIR_FEATURE_DIM
        for h in hidden_dims:
            layers += [nn.Linear(prev, h), nn.ReLU()]
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            prev = h
        layers.append(nn.Linear(prev, 1))
        self.network = nn.Sequential(*layers)

    def forward(self, z_a, z_b):
        features = build_pair_features(z_a, z_b)
        return self.network(features).squeeze(-1)


class AsymmetricCompatModel(nn.Module):
    def __init__(self, encoder_hidden=(256,), head_hidden=(128, 32),
                 encoder_dropout=0.0, head_dropout=0.0):
        super().__init__()
        self.encoder = SharedEncoder(encoder_hidden, encoder_dropout)
        self.head = MatchHead(head_hidden, head_dropout)

    def forward(self, e_target, e_self):
        z_target = self.encoder(e_target)
        z_self = self.encoder(e_self)
        logit = self.head(z_target, z_self)
        return logit, z_target, z_self

    def score(self, e_target, e_self):
        logit, _, _ = self.forward(e_target, e_self)
        return torch.sigmoid(logit)


# --- Losses --------------------------------------------------------------

def triplet_loss(z_t, z_p, z_n):
    return F.triplet_margin_loss(z_t, z_p, z_n, margin=TRIPLET_MARGIN, p=2)


def bce_loss(logit_p, logit_n):
    return (
        F.binary_cross_entropy_with_logits(logit_p, torch.ones_like(logit_p))
        + F.binary_cross_entropy_with_logits(logit_n, torch.zeros_like(logit_n))
    )


def ranking_loss(logit_p, logit_n, margin=1.0):
    """MarginRankingLoss: logit_p should beat logit_n by at least `margin`."""
    target = torch.ones_like(logit_p)
    return F.margin_ranking_loss(logit_p, logit_n, target, margin=margin)


# --- Data ---------------------------------------------------------------

def load_data():
    self_emb = np.load(DATA_DIR / "profile_embeddings_self.npy")
    target_emb = np.load(DATA_DIR / "profile_embeddings_target.npy")
    profile_ids = json.loads((DATA_DIR / "profile_ids.json").read_text())
    triplets = np.load(DATA_DIR / "triplets.npz")
    anchor_idx = triplets["anchor"]
    pos_idx = triplets["positive"]
    neg_idx = triplets["negative"]
    n = len(profile_ids)

    pid_to_idx = {p: i for i, p in enumerate(profile_ids)}
    print(f"profiles: {n}  triplets: {len(anchor_idx)}")

    rng = np.random.default_rng(SEED)
    anchors = sorted(set(anchor_idx.tolist()))
    rng.shuffle(anchors)
    n_train = int(0.8 * len(anchors))
    train_anchor_set = set(anchors[:n_train])

    is_train = np.array([a in train_anchor_set for a in anchor_idx])
    train_sel = np.where(is_train)[0]
    val_sel = np.where(~is_train)[0]

    # Pair / triple lookups for hard-negative mining (per-anchor list of neg indices)
    train_anchor_to_negs: dict[int, list[int]] = {}
    for i, a, n in zip(train_sel, anchor_idx[train_sel], neg_idx[train_sel]):
        train_anchor_to_negs.setdefault(int(a), []).append(int(n))

    # Per-anchor pos for completeness
    train_anchor_to_pos: dict[int, list[int]] = {}
    for i, a, p in zip(train_sel, anchor_idx[train_sel], pos_idx[train_sel]):
        train_anchor_to_pos.setdefault(int(a), []).append(int(p))

    data = {
        "self_emb": torch.from_numpy(self_emb).float(),
        "target_emb": torch.from_numpy(target_emb).float(),
        "profile_ids": profile_ids,
        "pid_to_idx": pid_to_idx,
        "triplets_z": triplets,
        "n_profiles": n,
        # tensors (the entire training pool)
        "train_sel": train_sel,
        "val_sel": val_sel,
        "anchor_idx_train": anchor_idx[train_sel],
        "pos_idx_train": pos_idx[train_sel],
        "neg_idx_train": neg_idx[train_sel],
        # hard-negative mining support
        "train_anchor_to_negs": train_anchor_to_negs,
        "train_anchor_to_pos": train_anchor_to_pos,
    }
    print(f"train triplets: {len(train_sel)}  val triplets: {len(val_sel)}")
    return data


# --- Eval (same as v1) ---------------------------------------------------

@torch.no_grad()
def eval_symmetric_auc(model, data) -> tuple[float, dict]:
    model.eval()
    z = data["triplets_z"]
    sel = data["val_sel"]
    a = z["anchor"][sel]; p = z["positive"][sel]; n = z["negative"][sel]

    self_emb = data["self_emb"]
    target_emb = data["target_emb"]
    t_a = target_emb[a]; s_p = self_emb[p]; t_p = target_emb[p]; s_a = self_emb[a]
    t_n = target_emb[n]; s_n = self_emb[n]

    pos = model.score(t_a, s_p) + model.score(t_p, s_a)
    neg = model.score(t_a, s_n) + model.score(t_n, s_a)
    y_true = np.concatenate([np.ones(len(pos)), np.zeros(len(neg))])
    y_score = torch.cat([pos, neg]).numpy()
    auc = float(roc_auc_score(y_true, y_score))

    best_f1, best_thr = -1.0, 1.0
    for thr in np.linspace(0.05, 1.95, 39):
        f1 = f1_score(y_true, (y_score >= thr).astype(int), zero_division=0)
        if f1 > best_f1:
            best_f1, best_thr = float(f1), float(thr)
    return auc, {
        "auc": auc, "best_f1": best_f1, "best_threshold": best_thr,
        "pos_mean": float(pos.mean()), "neg_mean": float(neg.mean()),
        "pos_minus_neg_margin": float((pos - neg).mean()),
    }


# --- Hard negative mining ------------------------------------------------

@torch.no_grad()
def get_hard_negatives(
    model: nn.Module,
    anchor_indices: torch.Tensor,                 # (M,) long
    target_emb: torch.Tensor,
    self_emb: torch.Tensor,
    train_anchor_to_negs: dict[int, list[int]],
    candidate_emb_batch: int = 4096,
) -> torch.Tensor:
    """For each anchor, pick the candidate negative whose self embedding is
    CLOSEST (cosine) to the anchor's TARGET embedding (i.e., most
    confusable). Vectorized: forward all anchor+candidate embeddings in one
    pass per type instead of N passes.

    Returns: tensor of hard-negative indices, shape (M,).
    """
    m = len(anchor_indices)
    hard_negs = torch.empty(m, dtype=torch.long)

    # Build (anchor_idx, cand_idx) pair list — only for anchors with candidates
    pairs_a: list[int] = []
    pairs_c: list[int] = []
    pair_owner: list[int] = []  # which row of `anchor_indices` this pair belongs to
    for k, a in enumerate(anchor_indices.tolist()):
        cands = train_anchor_to_negs.get(int(a), [])
        if not cands:
            hard_negs[k] = a
            continue
        for c in cands:
            pairs_a.append(a)
            pairs_c.append(c)
            pair_owner.append(k)

    if not pairs_a:
        return hard_negs

    a_t = torch.tensor(pairs_a, dtype=torch.long)
    c_t = torch.tensor(pairs_c, dtype=torch.long)

    # Encode in batches
    sims = torch.empty(len(pairs_a))
    for start in range(0, len(pairs_a), candidate_emb_batch):
        end = start + candidate_emb_batch
        z_t = model.encoder(target_emb[a_t[start:end]])
        z_c = model.encoder(self_emb[c_t[start:end]])
        sims[start:end] = (z_t * z_c).sum(dim=-1)

    # For each anchor row, find the candidate with max similarity
    owners = torch.tensor(pair_owner)
    best_local = torch.full((m,), -1, dtype=torch.long)
    best_val = torch.full((m,), -2.0)  # cosine of -1 is the worst
    for i, (k, s) in enumerate(zip(owners.tolist(), sims.tolist())):
        if s > best_val[k]:
            best_val[k] = s
            best_local[k] = i

    for k in range(m):
        if best_local[k] >= 0:
            hard_negs[k] = c_t[best_local[k]]
        else:
            hard_negs[k] = a_t[0].item()  # fallback
    return hard_negs


# --- One training run ----------------------------------------------------

@dataclass
class TrainCfg:
    name: str
    lr: float = 1e-3
    weight_decay: float = 1e-4
    epochs: int = 10
    batch_size: int = 256
    patience: int = 3
    encoder_hidden: tuple[int, ...] = (256,)
    head_hidden: tuple[int, ...] = (128, 32)
    encoder_dropout: float = 0.0
    head_dropout: float = 0.0
    loss_kind: str = "joint"       # "joint" | "triplet" | "ranking"
    lambda_bce: float = 0.5
    input_noise: float = 0.01
    seed: int = SEED
    scheduler: str = "cosine"       # "none" | "cosine"
    hard_neg_mining: bool = False    # recompute negatives each epoch
    hard_neg_fraction: float = 0.5   # 0..1, fraction of batch that uses hard negs
    hard_neg_every: int = 1         # recompute every N epochs
    mixup_alpha: float = 0.0


def train_one(cfg: TrainCfg, data: dict, total_configs: int = 1, config_idx: int = 0) -> dict:
    t0 = time.time()
    torch.manual_seed(cfg.seed)
    np.random.seed(cfg.seed)

    model = AsymmetricCompatModel(
        encoder_hidden=cfg.encoder_hidden,
        head_hidden=cfg.head_hidden,
        encoder_dropout=cfg.encoder_dropout,
        head_dropout=cfg.head_dropout,
    ).to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)
    scheduler = (
        torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=cfg.epochs)
        if cfg.scheduler == "cosine" else None
    )

    train_sel = data["train_sel"]
    target_emb = data["target_emb"]
    self_emb = data["self_emb"]
    anchor_to_negs = data["train_anchor_to_negs"]

    best_auc = -1.0
    best_extras: dict | None = None
    best_state: dict | None = None
    epochs_no_improve = 0
    history: list[dict] = []

    rng = np.random.default_rng(cfg.seed)
    n_train = len(train_sel)

    print(
        f"\n[{config_idx + 1}/{total_configs}] {cfg.name}  "
        f"epochs={cfg.epochs} patience={cfg.patience} bs={cfg.batch_size}  "
        f"hard_neg={cfg.hard_neg_mining}(frac={cfg.hard_neg_fraction:.0%})  "
        f"loss={cfg.loss_kind} lr={cfg.lr} wd={cfg.weight_decay}  "
        f"enc={cfg.encoder_hidden} noise={cfg.input_noise}",
        flush=True,
    )

    for epoch in range(1, cfg.epochs + 1):
        epoch_t0 = time.time()
        model.train()
        perm = rng.permutation(n_train)
        train_loss_sum = 0.0
        n_batches = 0

        # Optionally recompute hard negatives once per N epochs.
        # Trigger on epoch 1, 1+N, 1+2N, ... — always at epoch 1 when every=1.
        hard_neg_indices: torch.Tensor | None = None
        if cfg.hard_neg_mining and (epoch - 1) % cfg.hard_neg_every == 0:
            a_idx_train = data["anchor_idx_train"]
            hard_neg_indices = get_hard_negatives(
                model, a_idx_train, target_emb, self_emb, anchor_to_negs
            )

        for i in range(0, len(perm), cfg.batch_size):
            batch_sel = perm[i:i + cfg.batch_size]
            a = torch.from_numpy(data["anchor_idx_train"][batch_sel]).long()
            p = torch.from_numpy(data["pos_idx_train"][batch_sel]).long()
            n_orig = torch.from_numpy(data["neg_idx_train"][batch_sel]).long()

            if hard_neg_indices is not None and cfg.hard_neg_fraction > 0:
                replace_mask = torch.rand(len(a)) < cfg.hard_neg_fraction
                n = torch.where(replace_mask, hard_neg_indices[a], n_orig)
            else:
                n = n_orig

            t = target_emb[a].clone()
            s_p = self_emb[p].clone()
            s_n = self_emb[n].clone()
            if cfg.input_noise > 0:
                t = t + cfg.input_noise * torch.randn_like(t)
                s_p = s_p + cfg.input_noise * torch.randn_like(s_p)
                s_n = s_n + cfg.input_noise * torch.randn_like(s_n)

            z_t = model.encoder(t)
            z_p = model.encoder(s_p)
            z_n = model.encoder(s_n)
            logit_p = model.head(z_t, z_p)
            logit_n = model.head(z_t, z_n)

            if cfg.loss_kind == "triplet":
                loss = triplet_loss(z_t, z_p, z_n)
            elif cfg.loss_kind == "ranking":
                loss = ranking_loss(logit_p, logit_n, margin=1.0)
            else:
                loss = triplet_loss(z_t, z_p, z_n) + cfg.lambda_bce * bce_loss(logit_p, logit_n)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss_sum += float(loss.item())
            n_batches += 1
        train_loss = train_loss_sum / max(1, n_batches)
        if scheduler is not None:
            scheduler.step()

        auc, extras = eval_symmetric_auc(model, data)
        history.append({"epoch": epoch, "train_loss": train_loss, **extras})

        epoch_t = time.time() - epoch_t0
        marker = "*" if auc >= best_auc else " "
        print(
            f"  epoch {epoch:2d}/{cfg.epochs}  "
            f"loss={train_loss:.4f}  auc={auc:.4f}  "
            f"f1={extras['best_f1']:.3f}  "
            f"({epoch_t:.0f}s) {marker}",
            flush=True,
        )

        if auc > best_auc:
            best_auc = auc
            best_extras = extras
            best_state = {
                "encoder": {k: v.detach().clone() for k, v in model.encoder.state_dict().items()},
                "head": {k: v.detach().clone() for k, v in model.head.state_dict().items()},
            }
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= cfg.patience:
                print(f"  early stop at epoch {epoch}", flush=True)
                break

    wall = time.time() - t0
    print(
        f"  -> {cfg.name} done: best_auc={best_auc:.4f}  "
        f"epochs={len(history)}  wall={wall:.1f}s\n",
        flush=True,
    )
    return {
        "cfg": asdict(cfg),
        "best_auc": best_auc,
        "best_extras": best_extras,
        "epochs_run": len(history),
        "history": history,
        "state": best_state,
        "wall_time_sec": wall,
    }


# --- Sweep ---------------------------------------------------------------

CONFIGS: list[TrainCfg] = [
    # Baseline v2 (mirror of best v1: cosine + 256 + noise 0.01)
    TrainCfg(name="v2-cosine-256-noise01"),
    TrainCfg(name="v2-cosine-256-noise02", input_noise=0.02),
    TrainCfg(name="v2-cosine-512x256", encoder_hidden=(512, 256)),

    # Hard negative mining (the big new lever)
    TrainCfg(name="v2-hard-frac0.5", hard_neg_mining=True, hard_neg_fraction=0.5),
    TrainCfg(name="v2-hard-frac0.7", hard_neg_mining=True, hard_neg_fraction=0.7),
    TrainCfg(name="v2-hard-frac1.0", hard_neg_mining=True, hard_neg_fraction=1.0),
    TrainCfg(name="v2-hard+512", hard_neg_mining=True, hard_neg_fraction=0.5,
             encoder_hidden=(512, 256)),
    TrainCfg(name="v2-hard-every2", hard_neg_mining=True, hard_neg_fraction=0.5,
             hard_neg_every=2),

    # Loss variants
    TrainCfg(name="v2-ranking-only", loss_kind="ranking"),
    TrainCfg(name="v2-ranking-hard", loss_kind="ranking", hard_neg_mining=True, hard_neg_fraction=0.5),
    TrainCfg(name="v2-triplet-only", loss_kind="triplet"),
    TrainCfg(name="v2-triplet-hard", loss_kind="triplet", hard_neg_mining=True, hard_neg_fraction=0.5),

    # Encoder variants on v2
    TrainCfg(name="v2-tiny-128", encoder_hidden=(128,)),
    TrainCfg(name="v2-tiny-128-hard", encoder_hidden=(128,), hard_neg_mining=True, hard_neg_fraction=0.5),
    TrainCfg(name="v2-192", encoder_hidden=(192,)),
    TrainCfg(name="v2-320", encoder_hidden=(320,)),

    # Batch sizes (v2 has 100k triplets, can afford bigger batches)
    TrainCfg(name="v2-bs-128", batch_size=128),
    TrainCfg(name="v2-bs-512", batch_size=512),
    TrainCfg(name="v2-bs-1024", batch_size=1024),

    # Longer training (more data → can train longer)
    TrainCfg(name="v2-30ep", epochs=30, patience=5),
    TrainCfg(name="v2-30ep-hard", epochs=30, patience=5, hard_neg_mining=True, hard_neg_fraction=0.5),

    # Combined: best combo
    TrainCfg(name="v2-combo-best",
             encoder_hidden=(256,), input_noise=0.01, scheduler="cosine",
             hard_neg_mining=True, hard_neg_fraction=0.5, epochs=20, patience=5),
    TrainCfg(name="v2-combo-tiny+hard",
             encoder_hidden=(128,), input_noise=0.01, scheduler="cosine",
             hard_neg_mining=True, hard_neg_fraction=0.5, epochs=30, patience=5),
]


def main() -> None:
    data = load_data()
    total = len(CONFIGS)
    progress_path = ML_DIR / "reports" / "train_v2_progress.json"
    print(f"\n{'='*70}\nSweep: {total} configs\n{'='*70}\n", flush=True)
    results: list[dict] = []
    sweep_t0 = time.time()
    for i, cfg in enumerate(CONFIGS):
        r = train_one(cfg, data, total_configs=total, config_idx=i)
        results.append(r)
        # Persist progress so external watchers can poll
        progress_path.write_text(json.dumps({
            "total": total,
            "done": i + 1,
            "current_or_last": cfg.name,
            "best_auc_so_far": max((x["best_auc"] for x in results), default=None),
            "elapsed_sec": time.time() - sweep_t0,
        }, indent=2))
    sweep_t = time.time() - sweep_t0
    results.sort(key=lambda r: -r["best_auc"])
    best = results[0]
    print(f"\n{'='*70}\n=== BEST: {best['cfg']['name']}  AUC={best['best_auc']:.4f}  ({sweep_t/60:.1f} min) ===")
    print(f"  pos_mean={best['best_extras']['pos_mean']:.4f}  neg_mean={best['best_extras']['neg_mean']:.4f}")
    print(f"  margin={best['best_extras']['pos_minus_neg_margin']:.4f}")
    print(f"  f1={best['best_extras']['best_f1']:.4f}  @ thr={best['best_extras']['best_threshold']:.2f}")
    if best["state"] is not None:
        torch.save(best["state"], CKPT_DIR / "model_v0.pt")
        print(f"saved best encoder+head to {CKPT_DIR / 'model_v0.pt'}")
    report = [{
        "cfg": r["cfg"], "best_auc": r["best_auc"], "best_extras": r["best_extras"],
        "epochs_run": r["epochs_run"], "wall_time_sec": r["wall_time_sec"],
    } for r in results]
    (ML_DIR / "reports" / "train_experiments_v2.json").write_text(json.dumps(report, indent=2))
    print(f"\nFull report: {ML_DIR / 'reports' / 'train_experiments_v2.json'}")


if __name__ == "__main__":
    main()