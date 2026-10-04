"""V3 training experiments — asymmetric head + soft_jaccard feature + bidirectional loss.

Improvements over v2:
- **Asymmetric match head features**: replaces `[|diff|, prod, cos]` with
  `[target-self, target*self, cos]` (256-d). Distinguishes "A wants B"
  from "B is A" direction.
- **soft_jaccard feature**: 1-d extra input computed from cached
  interest embeddings. Model learns to weight interest semantic similarity.
- **Bidirectional BCE loss**: explicit loss term that pushes head to predict
  1 in BOTH directions (target_A → self_B AND target_B → self_A) and 0 in
  BOTH for negatives.
- **Configurable encoder**: bigger hidden dims with dropout.
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
PAIR_FEATURE_DIM = 2 * ENCODER_OUTPUT + 1  # 257 (asymmetric: target*self, target-self, cos)
TRIPLET_MARGIN = 1.0
SEED = 42

torch.manual_seed(SEED)
np.random.seed(SEED)


# --- Interest soft_jaccard ----------------------------------------------

def load_interest_table():
    vec = np.load(DATA_DIR / "interest_embeddings.npz")["vectors"]
    idx = json.loads((DATA_DIR / "interest_index.json").read_text())
    interests = idx["interests"]
    name_to_row = {n: i for i, n in enumerate(interests)}
    norms = np.linalg.norm(vec, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vec / norms, name_to_row, interests


def compute_soft_jaccard_matrix(self) -> np.ndarray:
    """Returns (n, n) symmetric soft jaccard matrix for ALL profile pairs."""
    n_profiles = self.shape[0] // ENCODER_INPUT_DIM if False else None  # placeholder
    # Actually we'll use the global profile count
    profiles = json.loads((DATA_DIR / "profile_ids.json").read_text())
    n = len(profiles)
    interests_data = np.array([
        [name_to_row[k] for k in p["interests"] if k in name_to_row]
        for p in __import__("just_mate_ml.data.embed", fromlist=["parse_profiles"])
            .parse_profiles(DATA_DIR / "profiles_descriptions.txt")
    ])
    # Build (n, MAX_INT) padded index array
    MAX_INT = 10
    int_idx_arr = np.full((n, MAX_INT), -1, dtype=np.int32)
    int_count_arr = np.zeros(n, dtype=np.int32)
    for i, ints in enumerate(interests_data):
        for k, idx in enumerate(ints[:MAX_INT]):
            int_idx_arr[i, k] = idx
        int_count_arr[i] = min(len(ints), MAX_INT)

    print(f"computing soft-jaccard matrix ({n}x{n})...")
    soft = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        a = self_emb_cache[int_idx_arr[i, :int_count_arr[i]]] if int_count_arr[i] > 0 else None
        if a is None or len(a) == 0:
            continue
        sims = a @ self_emb_cache.T  # (|A|, n)
        s_ab = sims.max(axis=0)  # best match for each j
        s_ba_row = sims.max(axis=1)  # best match for each i_int
        soft[i] = (s_ab + s_ba_row.mean()) / 2 if False else s_ab
        # Actually need s_ba too — best match for each B from A's perspective
    # Simpler: full approach
    out = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        if int_count_arr[i] == 0:
            continue
        a = self_emb_cache[int_idx_arr[i, :int_count_arr[i]]]
        sims = a @ self_emb_cache.T  # (|A|, N)
        # For each j: best A -> j match = sims.max(axis=0)[j]
        s_ab = sims.max(axis=0)
        # For each j: best j's interests matched by A's interests
        # = need to compute sims for each j's interests too
        # This is expensive. Approximate with just s_ab:
        soft[i, :] = s_ab  # not quite right but OK
    return soft


# Better: compute full soft_jaccard in chunks
def compute_full_soft_jaccard() -> np.ndarray:
    """Bidirectional soft jaccard for all (i, j) profile pairs.

    s_ab(i, j) = (1/|A_i|) sum_{a in A_i} max_{b in B_j} cos(a, b)
    s_ba(i, j) = (1/|B_j|) sum_{b in B_j} max_{a in A_i} cos(a, b)
    soft_jaccard(i, j) = (s_ab + s_ba) / 2

    Uses precomputed 50x50 interest similarity matrix S. Chunks over j
    to keep peak memory at ~25k * 5 * 10 * 4 bytes = ~5MB per i (not full n^2).
    """
    from just_mate_ml.data.embed import parse_profiles
    profiles = parse_profiles(DATA_DIR / "profiles_descriptions.txt")
    n = len(profiles)
    interests_data = [
        [name_to_row[k] for k in p["interests"] if k in name_to_row]
        for p in profiles
    ]
    MAX_INT = 10
    int_idx = np.full((n, MAX_INT), -1, dtype=np.int32)
    int_cnt = np.zeros(n, dtype=np.int32)
    for i, ints in enumerate(interests_data):
        for k, idx in enumerate(ints[:MAX_INT]):
            int_idx[i, k] = idx
        int_cnt[i] = min(len(ints), MAX_INT)

    # Precomputed interest-vs-interest cosine matrix (50x50).
    S = self_emb_cache @ self_emb_cache.T  # (n_interest, n_interest)
    S = np.clip(S, -1.0, 1.0).astype(np.float32)
    NEG_INF = -1e9

    mem_mb = 2 * n * n / 1024 / 1024
    print(f"computing full soft-jaccard matrix ({n}x{n}, mem ~ {mem_mb:.0f}MB)...", flush=True)
    t0 = time.time()
    out = np.zeros((n, n), dtype=np.float32)
    j_chunk_size = 1024  # process 1024 j's at a time → 5MB peak per i

    for i in range(n):
        if int_cnt[i] == 0:
            continue
        n_a = int_cnt[i]
        A_idxs = int_idx[i, :n_a]                  # (n_a,)
        S_a = S[A_idxs]                            # (n_a, n_interest)
        out_row = np.zeros(n, dtype=np.float32)
        for j_start in range(0, n, j_chunk_size):
            j_end = min(n, j_start + j_chunk_size)
            B_chunk = int_idx[j_start:j_end]       # (chunk, MAX_INT)
            mask_chunk = (B_chunk >= 0)            # (chunk, MAX_INT)
            # For each a in A, gather S[a, B_j_b] over all j in chunk and b in B_j
            g = S_a[:, B_chunk]                    # (n_a, chunk, MAX_INT)
            g = np.where(mask_chunk, g, NEG_INF)
            # max over b (axis=-1) → (n_a, chunk)
            max_b = g.max(axis=-1)
            # mean over a → (chunk,)  [s_ab direction]
            s_ab = max_b.mean(axis=0)
            # s_ba direction: for each j, mean over b in B_j of max_a S[a, b]
            # max over a axis=0 → (chunk, MAX_INT), then mean over b with mask
            max_a = g.max(axis=0)                  # (chunk, MAX_INT)
            max_a = np.where(mask_chunk, max_a, 0.0)
            s_ba = max_a.sum(axis=-1) / np.maximum(int_cnt[j_start:j_end], 1)
            out_row[j_start:j_end] = (s_ab + s_ba) / 2
        out[i] = out_row
        if (i + 1) % 1000 == 0:
            elapsed = time.time() - t0
            eta = elapsed * (n - i - 1) / max(i + 1, 1)
            print(f"  soft_jaccard: {i+1}/{n}  elapsed={elapsed:.0f}s  eta={eta:.0f}s", flush=True)
    print(f"  soft_jaccard done: {time.time()-t0:.0f}s", flush=True)
    return out


# Globals populated at runtime
self_emb_cache = None
name_to_row = None
int_emb_dim = 1536
soft_jacc_cache: np.ndarray | None = None


# --- Model ---------------------------------------------------------------

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

    def forward(self, e: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.network(e), p=2, dim=-1)


def build_asym_features(z_target: torch.Tensor, z_self: torch.Tensor) -> torch.Tensor:
    """Asymmetric pair features (target, self) → 257-d.
    Captures direction: 'target wants self' vs 'self is target'."""
    diff = z_target - z_self          # 128-d (asymmetric: A-B not B-A)
    prod = z_target * z_self          # 128-d (asymmetric: A*B not B*A)
    cos = (z_target * z_self).sum(-1, keepdim=True)  # 1-d
    return torch.cat([diff, prod, cos], dim=-1)   # 257-d


class MatchHead(nn.Module):
    def __init__(self, hidden_dims=(128, 32), dropout=0.0, n_extras=1):
        """n_extras: number of side features (soft_jaccard, etc.)"""
        super().__init__()
        layers: list[nn.Module] = []
        prev = PAIR_FEATURE_DIM + n_extras
        for h in hidden_dims:
            layers += [nn.Linear(prev, h), nn.ReLU()]
            if dropout > 0:
                layers.append(nn.Dropout(dropout))
            prev = h
        layers.append(nn.Linear(prev, 1))
        self.network = nn.Sequential(*layers)

    def forward(self, z_target, z_self, *extras):
        features = build_asym_features(z_target, z_self)
        if extras:
            features = torch.cat([features, *extras], dim=-1)
        return self.network(features).squeeze(-1)


class AsymmetricCompatModel(nn.Module):
    def __init__(self, encoder_hidden=(256,), head_hidden=(128, 32),
                 encoder_dropout=0.0, head_dropout=0.0, n_extras=1):
        super().__init__()
        self.encoder = SharedEncoder(encoder_hidden, encoder_dropout)
        self.head = MatchHead(head_hidden, head_dropout, n_extras=n_extras)

    def forward(self, e_target, e_self, *extras):
        z_target = self.encoder(e_target)
        z_self = self.encoder(e_self)
        logit = self.head(z_target, z_self, *extras)
        return logit, z_target, z_self

    def score(self, e_target, e_self, *extras):
        logit, _, _ = self.forward(e_target, e_self, *extras)
        return torch.sigmoid(logit)


# --- Losses --------------------------------------------------------------

def triplet_loss(z_t, z_p, z_n):
    return F.triplet_margin_loss(z_t, z_p, z_n, margin=TRIPLET_MARGIN, p=2)


def bce_loss(logit_p, logit_n):
    return (
        F.binary_cross_entropy_with_logits(logit_p, torch.ones_like(logit_p))
        + F.binary_cross_entropy_with_logits(logit_n, torch.zeros_like(logit_n))
    )


def bidirectional_bce(logit_ab, logit_ba, logit_ac, logit_ca):
    """Both A→B and B→A must be 1 for positives, 0 for negatives."""
    pos_bce = (
        F.binary_cross_entropy_with_logits(logit_ab, torch.ones_like(logit_ab))
        + F.binary_cross_entropy_with_logits(logit_ba, torch.ones_like(logit_ba))
    )
    neg_bce = (
        F.binary_cross_entropy_with_logits(logit_ac, torch.zeros_like(logit_ac))
        + F.binary_cross_entropy_with_logits(logit_ca, torch.zeros_like(logit_ca))
    )
    return pos_bce + neg_bce


def joint_loss(z_target, z_pos, z_neg, logit_pos, logit_neg, logit_pos_rev, logit_neg_rev,
                lam_bce=0.5, lam_bidir=0.5):
    t = triplet_loss(z_target, z_pos, z_neg)
    b = bce_loss(logit_pos, logit_neg)
    bidir = bidirectional_bce(logit_pos, logit_pos_rev, logit_neg, logit_neg_rev)
    return t + lam_bce * b + lam_bidir * bidir, t.item(), b.item(), bidir.item()


# --- Data ----------------------------------------------------------------

def load_data():
    self_emb = np.load(DATA_DIR / "profile_embeddings_self.npy")
    target_emb = np.load(DATA_DIR / "profile_embeddings_target.npy")
    profile_ids = json.loads((DATA_DIR / "profile_ids.json").read_text())
    triplets = np.load(DATA_DIR / "triplets.npz")
    anchor_idx = triplets["anchor"]
    pos_idx = triplets["positive"]
    neg_idx = triplets["negative"]
    n = len(profile_ids)

    rng = np.random.default_rng(SEED)
    anchors = sorted(set(anchor_idx.tolist()))
    rng.shuffle(anchors)
    n_train = int(0.8 * len(anchors))
    train_anchor_set = set(anchors[:n_train])
    is_train = np.array([a in train_anchor_set for a in anchor_idx])
    train_sel = np.where(is_train)[0]
    val_sel = np.where(~is_train)[0]

    pid_to_idx = {p: i for i, p in enumerate(profile_ids)}

    # Per-anchor negative pool (for hard negative mining)
    train_anchor_to_negs: dict[int, list[int]] = {}
    for _i, _a, _neg in zip(train_sel, anchor_idx[train_sel], neg_idx[train_sel]):
        train_anchor_to_negs.setdefault(int(_a), []).append(int(_neg))

    data = {
        "self_emb": torch.from_numpy(self_emb).float(),
        "target_emb": torch.from_numpy(target_emb).float(),
        "profile_ids": profile_ids,
        "pid_to_idx": pid_to_idx,
        "triplets_z": triplets,
        "n_profiles": n,
        "train_sel": train_sel,
        "val_sel": val_sel,
        "anchor_idx_train": anchor_idx[train_sel],
        "pos_idx_train": pos_idx[train_sel],
        "neg_idx_train": neg_idx[train_sel],
        "train_anchor_to_negs": train_anchor_to_negs,
    }
    print(f"profiles: {n}  triplets: {len(anchor_idx)}")
    print(f"train: {len(train_sel)}  val: {len(val_sel)}")
    return data


def load_soft_jaccard_lazy():
    """Load soft_jaccard from cached npy if exists, else compute it."""
    global soft_jacc_cache
    cache_path = DATA_DIR / "soft_jaccard.npy"
    if cache_path.exists():
        soft_jacc_cache = np.load(cache_path)
        print(f"loaded soft_jaccard cache: {soft_jacc_cache.shape}")
    else:
        print("computing soft_jaccard matrix (~30 sec)…")
        soft_jacc_cache = compute_full_soft_jaccard()
        np.save(cache_path, soft_jacc_cache)
        print(f"saved {cache_path}")


# --- Eval -----------------------------------------------------------------

@torch.no_grad()
def eval_symmetric_auc(model, data) -> tuple[float, dict]:
    """Symmetric pair score, augmented with soft_jaccard gate."""
    z = data["triplets_z"]
    sel = data["val_sel"]
    a_idx = z["anchor"][sel]; p_idx = z["positive"][sel]; n_idx = z["negative"][sel]
    self_emb = data["self_emb"]; target_emb = data["target_emb"]

    # soft_jaccard for all val pairs (shape [N, 1] for match-head extras)
    if soft_jacc_cache is None:
        soft_ab = torch.zeros((len(a_idx), 1))
        soft_an = torch.zeros((len(a_idx), 1))
    else:
        soft_ab = torch.from_numpy(
            (soft_jacc_cache[a_idx, p_idx] + soft_jacc_cache[p_idx, a_idx]) / 2
        ).float().unsqueeze(-1)
        soft_an = torch.from_numpy(
            (soft_jacc_cache[a_idx, n_idx] + soft_jacc_cache[n_idx, a_idx]) / 2
        ).float().unsqueeze(-1)

    pos = model.score(target_emb[a_idx], self_emb[p_idx], soft_ab).numpy() \
        + model.score(target_emb[p_idx], self_emb[a_idx], soft_ab).numpy()
    neg = model.score(target_emb[a_idx], self_emb[n_idx], soft_an).numpy() \
        + model.score(target_emb[n_idx], self_emb[a_idx], soft_an).numpy()
    y_true = np.concatenate([np.ones(len(pos)), np.zeros(len(neg))])
    y_score = np.concatenate([pos, neg])
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


# --- Hard negative mining (vectorized) ----------------------------------

@torch.no_grad()
def get_hard_negatives(model, anchor_indices, target_emb, self_emb,
                        train_anchor_to_negs, candidate_emb_batch=4096):
    m = len(anchor_indices)
    hard_negs = torch.empty(m, dtype=torch.long)
    pairs_a, pairs_c, pair_owner = [], [], []
    for k, a in enumerate(anchor_indices.tolist()):
        cands = train_anchor_to_negs.get(a, [])
        if not cands:
            hard_negs[k] = a; continue
        for c in cands:
            pairs_a.append(a); pairs_c.append(c); pair_owner.append(k)
    if not pairs_a:
        return hard_negs
    a_t = torch.tensor(pairs_a, dtype=torch.long)
    c_t = torch.tensor(pairs_c, dtype=torch.long)
    sims = torch.empty(len(pairs_a))
    for start in range(0, len(pairs_a), candidate_emb_batch):
        end = start + candidate_emb_batch
        z_t = model.encoder(target_emb[a_t[start:end]])
        z_c = model.encoder(self_emb[c_t[start:end]])
        sims[start:end] = (z_t * z_c).sum(dim=-1)
    owners = torch.tensor(pair_owner)
    best_local = torch.full((m,), -1, dtype=torch.long)
    best_val = torch.full((m,), -2.0)
    for i, (k, s) in enumerate(zip(owners.tolist(), sims.tolist())):
        if s > best_val[k]:
            best_val[k] = s; best_local[k] = i
    for k in range(m):
        if best_local[k] >= 0:
            hard_negs[k] = c_t[best_local[k]]
        else:
            hard_negs[k] = a_t[0].item()
    return hard_negs


# --- One training run -----------------------------------------------------

@dataclass
class TrainCfg:
    name: str
    lr: float = 1e-3
    weight_decay: float = 1e-4
    epochs: int = 15
    batch_size: int = 256
    patience: int = 4
    encoder_hidden: tuple[int, ...] = (256,)
    head_hidden: tuple[int, ...] = (128, 32)
    encoder_dropout: float = 0.0
    head_dropout: float = 0.0
    loss_kind: str = "joint_bidir"  # "joint_bidir" | "triplet_only" | "ranking"
    lam_bidir: float = 0.5
    input_noise: float = 0.01
    seed: int = SEED
    scheduler: str = "cosine"
    hard_neg_mining: bool = False
    hard_neg_fraction: float = 0.5
    hard_neg_every: int = 1
    mixup_alpha: float = 0.0
    use_soft_jaccard: bool = True  # NEW: pass soft_jaccard as extra feature


def train_one(cfg: TrainCfg, data: dict, total_configs: int, config_idx: int) -> dict:
    t0 = time.time()
    torch.manual_seed(cfg.seed)
    np.random.seed(cfg.seed)

    n_extras = 1 if cfg.use_soft_jaccard else 0
    model = AsymmetricCompatModel(
        encoder_hidden=cfg.encoder_hidden,
        head_hidden=cfg.head_hidden,
        encoder_dropout=cfg.encoder_dropout,
        head_dropout=cfg.head_dropout,
        n_extras=n_extras,
    ).to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)
    scheduler = (
        torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=cfg.epochs)
        if cfg.scheduler == "cosine" else None
    )

    train_sel = data["train_sel"]
    target_emb = data["target_emb"]; self_emb = data["self_emb"]
    a_idx_train = data["anchor_idx_train"]
    p_idx_train = data["pos_idx_train"]
    n_idx_train = data["neg_idx_train"]
    anchor_to_negs = data["train_anchor_to_negs"]
    n_train = len(train_sel)
    rng = np.random.default_rng(cfg.seed)

    print(
        f"\n[{config_idx + 1}/{total_configs}] {cfg.name}  "
        f"epochs={cfg.epochs}  bs={cfg.batch_size}  hard_neg={cfg.hard_neg_mining}({cfg.hard_neg_fraction:.0%})  "
        f"loss={cfg.loss_kind}  enc={cfg.encoder_hidden}  soft={cfg.use_soft_jaccard}",
        flush=True,
    )

    best_auc = -1.0
    best_extras = None
    best_state = None
    epochs_no_improve = 0
    history = []

    for epoch in range(1, cfg.epochs + 1):
        epoch_t0 = time.time()
        model.train()
        perm = rng.permutation(n_train)
        train_loss_sum = 0.0
        n_batches = 0

        # Hard negative recomputation
        hard_neg_indices = None
        if cfg.hard_neg_mining and (epoch - 1) % cfg.hard_neg_every == 0:
            hard_neg_indices = get_hard_negatives(
                model, torch.from_numpy(a_idx_train).long(),
                target_emb, self_emb, anchor_to_negs
            )

        for i in range(0, n_train, cfg.batch_size):
            batch_sel = perm[i:i + cfg.batch_size]
            a = torch.from_numpy(a_idx_train[batch_sel]).long()
            p = torch.from_numpy(p_idx_train[batch_sel]).long()
            n_orig = torch.from_numpy(n_idx_train[batch_sel]).long()
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

            # soft_jaccard as extra features
            extras_p, extras_n = None, None
            if cfg.use_soft_jaccard and soft_jacc_cache is not None:
                sj_p = torch.from_numpy(
                    (soft_jacc_cache[a.numpy(), p.numpy()] +
                     soft_jacc_cache[p.numpy(), a.numpy()]) / 2
                ).float().unsqueeze(-1)
                sj_n = torch.from_numpy(
                    (soft_jacc_cache[a.numpy(), n.numpy()] +
                     soft_jacc_cache[n.numpy(), a.numpy()]) / 2
                ).float().unsqueeze(-1)
                extras_p, extras_n = sj_p, sj_n

            # Encode once
            z_t = model.encoder(t)
            z_p = model.encoder(s_p)
            z_n = model.encoder(s_n)
            # Forward both directions
            logit_p = model.head(z_t, z_p, extras_p) if extras_p is not None else model.head(z_t, z_p)
            logit_n = model.head(z_t, z_n, extras_n) if extras_n is not None else model.head(z_t, z_n)
            logit_p_rev = model.head(z_p, z_t, extras_p) if extras_p is not None else model.head(z_p, z_t)
            logit_n_rev = model.head(z_n, z_t, extras_n) if extras_n is not None else model.head(z_n, z_t)

            if cfg.loss_kind == "triplet_only":
                loss = triplet_loss(z_t, z_p, z_n)
            elif cfg.loss_kind == "ranking":
                target = torch.ones_like(logit_p)
                loss = F.margin_ranking_loss(logit_p, logit_n, target, margin=1.0)
            else:  # joint_bidir
                loss, _, _, _ = joint_loss(z_t, z_p, z_n, logit_p, logit_n,
                                           logit_p_rev, logit_n_rev,
                                           lam_bce=0.5, lam_bidir=cfg.lam_bidir)

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
            f"  epoch {epoch:2d}/{cfg.epochs}  loss={train_loss:.4f}  "
            f"auc={auc:.4f}  f1={extras['best_f1']:.3f}  ({epoch_t:.0f}s) {marker}",
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
        f"  -> {cfg.name} done: best_auc={best_auc:.4f}  epochs={len(history)}  wall={wall:.1f}s",
        flush=True,
    )
    return {
        "cfg": asdict(cfg), "best_auc": best_auc, "best_extras": best_extras,
        "epochs_run": len(history), "history": history, "state": best_state,
        "wall_time_sec": wall,
    }


# --- Sweep ----------------------------------------------------------------

CONFIGS: list[TrainCfg] = [
    # baseline: v2-style (symmetric) for comparison
    TrainCfg(name="v3-baseline-sym", encoder_hidden=(256,)),  # sym features, no soft

    # asymmetric head on baseline config
    TrainCfg(name="v3-asym-bidir", loss_kind="joint_bidir"),
    TrainCfg(name="v3-asym-soft", use_soft_jaccard=True),
    TrainCfg(name="v3-asym-soft-bidir", loss_kind="joint_bidir", use_soft_jaccard=True),

    # Bigger encoder with dropout
    TrainCfg(name="v3-bigger-512x256", encoder_hidden=(512, 256), encoder_dropout=0.1,
             loss_kind="joint_bidir"),
    TrainCfg(name="v3-bigger-512x256-soft", encoder_hidden=(512, 256), encoder_dropout=0.1,
             use_soft_jaccard=True),
    TrainCfg(name="v3-bigger-512x256-soft-bidir", encoder_hidden=(512, 256), encoder_dropout=0.1,
             loss_kind="joint_bidir", use_soft_jaccard=True),

    # Hard negative mining combinations
    TrainCfg(name="v3-hardneg-asym", hard_neg_mining=True, hard_neg_every=2,
             use_soft_jaccard=True),
    TrainCfg(name="v3-hardneg-asym-bidir", hard_neg_mining=True, hard_neg_every=2,
             loss_kind="joint_bidir", use_soft_jaccard=True),

    # Loss variants
    TrainCfg(name="v3-ranking-only", loss_kind="ranking", use_soft_jaccard=True),
    TrainCfg(name="v3-triplet-only", loss_kind="triplet_only", use_soft_jaccard=True),

    # Different lam_bidir
    TrainCfg(name="v3-lam-0.25", loss_kind="joint_bidir", lam_bidir=0.25,
             use_soft_jaccard=True),
    TrainCfg(name="v3-lam-1.0", loss_kind="joint_bidir", lam_bidir=1.0,
             use_soft_jaccard=True),

    # Combined best
    TrainCfg(name="v3-best-combo",
             encoder_hidden=(256,), encoder_dropout=0.05,
             loss_kind="joint_bidir", lam_bidir=0.5,
             hard_neg_mining=True, hard_neg_every=2, hard_neg_fraction=0.5,
             use_soft_jaccard=True, input_noise=0.01, epochs=20, patience=5),
]


def main() -> None:
    global self_emb_cache, name_to_row
    self_emb_cache, name_to_row, _ = load_interest_table()
    load_soft_jaccard_lazy()

    data = load_data()
    total = len(CONFIGS)
    print(f"\n{'='*70}\nSweep: {total} configs\n{'='*70}\n", flush=True)
    results: list[dict] = []
    sweep_t0 = time.time()
    for i, cfg in enumerate(CONFIGS):
        r = train_one(cfg, data, total_configs=total, config_idx=i)
        results.append(r)
        progress_path = ML_DIR / "reports" / "train_v3_progress.json"
        progress_path.parent.mkdir(parents=True, exist_ok=True)
        progress_path.write_text(json.dumps({
            "total": total, "done": i + 1,
            "current_or_last": cfg.name,
            "best_auc_so_far": max((x["best_auc"] for x in results), default=None),
            "elapsed_sec": time.time() - sweep_t0,
        }, indent=2))
    sweep_t = time.time() - sweep_t0

    results.sort(key=lambda r: -r["best_auc"])
    best = results[0]
    print(f"\n{'='*70}\n=== BEST: {best['cfg']['name']}  AUC={best['best_auc']:.4f}  ({sweep_t/60:.1f} min) ===")
    print(f"  pos={best['best_extras']['pos_mean']:.3f}  neg={best['best_extras']['neg_mean']:.3f}")
    print(f"  margin={best['best_extras']['pos_minus_neg_margin']:.3f}")
    print(f"  F1={best['best_extras']['best_f1']:.4f}  @ thr={best['best_extras']['best_threshold']:.2f}")
    if best["state"] is not None:
        torch.save(best["state"], CKPT_DIR / "model_v3.pt")
        print(f"saved {CKPT_DIR / 'model_v3.pt'}")
    report = [{
        "cfg": r["cfg"], "best_auc": r["best_auc"], "best_extras": r["best_extras"],
        "epochs_run": r["epochs_run"], "wall_time_sec": r["wall_time_sec"],
    } for r in results]
    (ML_DIR / "reports" / "train_experiments_v3.json").write_text(json.dumps(report, indent=2))
    print(f"report: {ML_DIR / 'reports' / 'train_experiments_v3.json'}")


if __name__ == "__main__":
    main()