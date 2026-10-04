"""V3 triplet generation — interest-gated + new negative bucket types.

Improvements over v2:
- 4-gate positive criterion: jaccard >=0.4 AND bidirectional cos >=0.5
  AND soft_interest_match (semantic) >=0.55
- New "opposite_values" negative bucket: A's preferences align with C
  but C's preferences oppose what A actually IS.
- Uses cached interest_embeddings.npz for fast soft_jaccard.

Output:
  data/triplets.npz        anchor/positive/negative int32 arrays
  data/triplets_ids.json   list of {anchor, positive, negative}
"""
from __future__ import annotations

import json
import random
import time
from collections import defaultdict
from pathlib import Path

import numpy as np

from just_mate_ml.data.embed import EMBEDDING_DIM, parse_profiles


ML_DIR = Path(__file__).resolve().parents[3]
INT_NPZ = ML_DIR / "data" / "interest_embeddings.npz"
INT_JSON = ML_DIR / "data" / "interest_index.json"


def _jaccard(a: set[str], b: set[str]) -> float:
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def _asym_cosine_matrix(target_emb: np.ndarray, self_emb: np.ndarray) -> np.ndarray:
    t = target_emb / np.linalg.norm(target_emb, axis=1, keepdims=True)
    s = self_emb / np.linalg.norm(self_emb, axis=1, keepdims=True)
    return t @ s.T


def _load_int_table():
    npz = np.load(INT_NPZ)
    vec = npz["vectors"]
    idx = json.loads(INT_JSON.read_text())
    interests = idx["interests"]
    name_to_row = {n: i for i, n in enumerate(interests)}
    norms = np.linalg.norm(vec, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    vec = vec / norms
    return vec, name_to_row


def _soft_jaccard_batch(int_a_idx: np.ndarray, j_int_lists: list[np.ndarray],
                         vec: np.ndarray) -> np.ndarray:
    """Compute soft_jaccard for anchor A (interests at int_a_idx) vs each j.

    Returns (len(j_int_lists),) array of soft_jaccards.
    """
    if len(int_a_idx) == 0:
        return np.zeros(len(j_int_lists), dtype=np.float32)
    a = vec[int_a_idx]  # (|A|, 1536)
    out = np.zeros(len(j_int_lists), dtype=np.float32)
    for k, b_idx in enumerate(j_int_lists):
        if len(b_idx) == 0:
            continue
        sims = a @ vec[b_idx].T  # (|A|, |B|)
        out[k] = (sims.max(axis=1).mean() + sims.max(axis=0).mean()) / 2
    return out


def build_triplets(
    profiles_path: Path,
    self_emb_path: Path,
    target_emb_path: Path,
    triplets_per_anchor: int = 5,
    jaccard_threshold: float = 0.4,
    soft_threshold: float = 0.55,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[dict]]:
    profiles = parse_profiles(profiles_path)
    self_emb = np.load(self_emb_path)
    target_emb = np.load(target_emb_path)
    n = len(profiles)
    assert self_emb.shape == (n, EMBEDDING_DIM)
    assert target_emb.shape == (n, EMBEDDING_DIM)

    interests = [set(p["interests"]) for p in profiles]
    idx_to_id = [p["id"] for p in profiles]

    int_vec, int_name_to_row = _load_int_table()
    print(f"loaded {len(int_name_to_row)} interest embeddings")

    # Pre-compute per-profile interest indices as np.ndarray for vectorized soft_jaccard
    MAX_INT = 10
    interest_idx_arr = np.full((n, MAX_INT), -1, dtype=np.int32)
    interest_count_arr = np.zeros(n, dtype=np.int32)
    for i, ints in enumerate(interests):
        valid_ints = [int_name_to_row[k] for k in ints if k in int_name_to_row]
        for k, idx in enumerate(valid_ints[:MAX_INT]):
            interest_idx_arr[i, k] = idx
        interest_count_arr[i] = min(len(valid_ints), MAX_INT)

    cos_ij = _asym_cosine_matrix(target_emb, self_emb)
    t_norm = target_emb / np.linalg.norm(target_emb, axis=1, keepdims=True)
    s_norm = self_emb / np.linalg.norm(self_emb, axis=1, keepdims=True)
    cos_ji = s_norm @ t_norm.T

    used_pos_pairs: dict[int, set[int]] = defaultdict(set)
    used_neg_pairs: dict[int, set[int]] = defaultdict(set)

    a_out: list[int] = []
    p_out: list[int] = []
    n_out: list[int] = []
    ids_out: list[dict] = []

    fallback_pos = fallback_neg = 0

    sample_size = 800
    progress_every = max(1, n // 50)  # ~50 progress lines total
    t_start = time.time()

    for i in range(n):
        rng = random.Random(seed + i)
        if i % progress_every == 0:
            elapsed = time.time() - t_start
            rate = i / max(elapsed, 1e-6)
            eta = (n - i) / max(rate, 1e-6)
            print(
                f"  [{i:>6d}/{n}]  {100*i/n:5.1f}%  "
                f"elapsed={elapsed:5.0f}s  eta={eta:5.0f}s  "
                f"rate={rate:.0f} anchor/s  triplets={len(a_out)}",
                flush=True,
            )
        # Sample 800 candidate j indices
        all_cands = list(range(n))
        all_cands.pop(i)
        sample = rng.sample(all_cands, min(sample_size, len(all_cands)))

        # Get interest indices for sample
        sample_int_list = []
        for j in sample:
            cnt = interest_count_arr[j]
            sample_int_list.append(interest_idx_arr[j, :cnt])

        # Compute soft_jaccard for all sample at once
        i_ints = interest_idx_arr[i, :interest_count_arr[i]]
        soft_scores = _soft_jaccard_batch(i_ints, sample_int_list, int_vec)

        pos_scores: list[tuple[float, int]] = []
        neg_by_type: dict[str, list[tuple[float, int]]] = defaultdict(list)

        for k_idx, j in enumerate(sample):
            if j in used_pos_pairs[i]:
                continue
            j_int = _jaccard(interests[i], interests[j])
            c_ij = float(cos_ij[i, j])
            c_ji = float(cos_ji[i, j])
            s_soft = float(soft_scores[k_idx])

            interest_ok = j_int >= jaccard_threshold
            pref_ab = c_ij >= 0.50
            pref_ba = c_ji >= 0.50
            soft_ok = s_soft >= soft_threshold

            if interest_ok and pref_ab and pref_ba and soft_ok:
                score = j_int + 0.5 * (c_ij + c_ji) + 0.5 * s_soft
                pos_scores.append((score, j))
                continue
            if j in used_neg_pairs[i]:
                continue

            if j_int == 0.0:
                neg_by_type["no_overlap"].append((1.0 - c_ij, j))
            elif not interest_ok:
                neg_by_type["low_overlap"].append((1.0 - c_ij, j))
            elif not soft_ok:
                neg_by_type["soft_mismatch"].append((1.0 - c_ij, j))
            elif not pref_ab and not pref_ba:
                neg_by_type["both_reject"].append((1.0 - 0.5 * (c_ij + c_ji), j))
            elif pref_ab and c_ji < 0.30:
                neg_by_type["opposite_values"].append((c_ij, j))
            elif pref_ab and not pref_ba:
                neg_by_type["one_sided_ab"].append((c_ij, j))
            elif pref_ba and not pref_ab:
                neg_by_type["one_sided_ba"].append((c_ji, j))
            else:
                neg_by_type["other"].append((1.0 - 0.5 * (c_ij + c_ji), j))

        pos_scores.sort(key=lambda x: -x[0])
        pos_pool = [j for _, j in pos_scores[:50]]

        neg_pool: list[int] = []
        for bucket in ("no_overlap", "low_overlap", "soft_mismatch", "both_reject",
                       "opposite_values", "one_sided_ab", "one_sided_ba", "other"):
            items = sorted(neg_by_type[bucket], key=lambda x: x[0])
            neg_pool.extend(j for _, j in items[:50])

        for _ in range(triplets_per_anchor):
            if not pos_pool:
                cand = np.argsort(-(cos_ij[i] + cos_ji[i])).tolist()
                for jj in cand:
                    if jj != i and jj not in used_pos_pairs[i]:
                        pos_pool = [jj]; fallback_pos += 1; break
                if not pos_pool: continue
            if not neg_pool:
                cand = np.argsort((cos_ij[i] + cos_ji[i])).tolist()
                for jj in cand:
                    if jj != i and jj not in used_neg_pairs[i]:
                        neg_pool = [jj]; fallback_neg += 1; break
                if not neg_pool: continue

            pos_idx = pos_pool[rng.randrange(len(pos_pool))]
            neg_idx = neg_pool[rng.randrange(len(neg_pool))]
            used_pos_pairs[i].add(pos_idx)
            used_neg_pairs[i].add(neg_idx)

            a_out.append(i); p_out.append(pos_idx); n_out.append(neg_idx)
            ids_out.append({"anchor": idx_to_id[i],
                            "positive": idx_to_id[pos_idx],
                            "negative": idx_to_id[neg_idx]})

    print(f"pos fallbacks: {fallback_pos}  neg fallbacks: {fallback_neg}")
    print(f"total triplets: {len(ids_out)}")
    return (np.array(a_out, dtype=np.int32),
            np.array(p_out, dtype=np.int32),
            np.array(n_out, dtype=np.int32),
            ids_out)


def save_triplets(a, p, n, ids, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    np.savez(out_dir / "triplets.npz", anchor=a, positive=p, negative=n)
    (out_dir / "triplets_ids.json").write_text(
        json.dumps(ids, ensure_ascii=False), encoding="utf-8"
    )


if __name__ == "__main__":
    import sys, time
    profiles_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/profiles_descriptions.txt")
    self_emb_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data/profile_embeddings_self.npy")
    target_emb_path = Path(sys.argv[3]) if len(sys.argv) > 3 else Path("data/profile_embeddings_target.npy")
    out_dir = Path(sys.argv[4]) if len(sys.argv) > 4 else Path("data")
    k = int(sys.argv[5]) if len(sys.argv) > 5 else 5
    seed = int(sys.argv[6]) if len(sys.argv) > 6 else 42
    t0 = time.time()
    a, p, n_, ids = build_triplets(profiles_path, self_emb_path, target_emb_path,
                                    triplets_per_anchor=k, seed=seed)
    save_triplets(a, p, n_, ids, out_dir)
    print(f"elapsed: {time.time() - t0:.1f}s")