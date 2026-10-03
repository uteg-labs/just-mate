"""V2 triplet generation — strict hard rules + multi-triplet per anchor.

Triplet semantics (unchanged from v1):

    anchor A   = profile to focus on
    positive B = identity of B that bidirectionally matches A
    negative C = identity of C that does NOT bidirectionally match A

Hard rules (the team's M0/M1 policy):

  1. **No shared interests → definitely non-match.**  If jaccard(A.int, B.int) == 0,
     neither A nor B could survive the interest-jaccard gate. Strict non-match.

  2. **One-sided character expectations → non-match.**  If A's preferences align with
     B's identity but B's preferences do NOT align with A's identity, A and B
     would never accept each other in the real product (both must accept).
     Strict non-match.

  3. **Both directions must align for a positive.**  A and B both bidirectionally
     match → positive.  We don't accept "close" matches as positives —
     if a candidate doesn't pass both gates, it's a negative or excluded.

  4. **No random pairing.**  We don't pick (pos, neg) from the rest of the
     population blindly.  Each candidate is scored against the anchor on three
     signals — interest-jaccard, cos(target_A, self_B), cos(target_B, self_A) —
     and the strongest candidate in each pool wins.

Output:
  data/triplets.npz        keys 'anchor', 'positive', 'negative' (int32 each, shape (N*K,))
  data/triplets_ids.json   list of {anchor, positive, negative} id dicts

K = triplets_per_anchor (default 5). With 25k anchors × 5 = 125k triplets.
"""
from __future__ import annotations

import json
import random
from collections import defaultdict
from pathlib import Path

import numpy as np

from just_mate_ml.data.embed import EMBEDDING_DIM, parse_profiles


def _jaccard(a: set[str], b: set[str]) -> float:
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def _build_index_maps(profiles):
    """Return (interests, idx_to_id, id_to_idx)."""
    interests = [set(p["interests"]) for p in profiles]
    idx_to_id = [p["id"] for p in profiles]
    id_to_idx = {pid: i for i, pid in enumerate(idx_to_id)}
    return interests, idx_to_id, id_to_idx


def _asym_cosine_matrix(target_emb: np.ndarray, self_emb: np.ndarray) -> np.ndarray:
    """cos[i,j] = cosine(target_emb[i], self_emb[j]). Shape (N, N)."""
    t = target_emb / np.linalg.norm(target_emb, axis=1, keepdims=True)
    s = self_emb / np.linalg.norm(self_emb, axis=1, keepdims=True)
    return t @ s.T


def _build_candidate_pool(
    i: int,
    n: int,
    interests: list[set[str]],
    cos_ij: np.ndarray,
    cos_ji: np.ndarray,
    jaccard_threshold: float,
    cosine_threshold: float,
    forbid_pos: set[int],
    forbid_neg: set[int],
    max_pool: int = 50,
    sample_size: int = 1500,
    rng: random.Random | None = None,
) -> tuple[list[int], list[int]]:
    """Return (positive_pool, negative_pool) for anchor i.

    SAMPLE-based, not full-scan: we draw sample_size random candidates and
    score only those. This is O(sample_size) per anchor, not O(N).

    positive_pool = profiles j where:
      jaccard(i, j) >= jaccard_threshold
      AND cos(i, j) >= cosine_threshold       (target_A ↔ self_B)
      AND cos(j, i) >= cosine_threshold       (target_B ↔ self_A)
      AND j not in forbid_pos
    Up to max_pool candidates returned (top by combined cos + jaccard).

    negative_pool = stratified into no_overlap / low_overlap / both_reject /
    one_sided_ab / one_sided_ba / other. Priority order: no_overlap first
    (clearest true negatives), then one-sided (most informative for the model).
    """
    rng = rng or random.Random()

    pos_scores: list[tuple[float, int]] = []
    neg_by_type: dict[str, list[tuple[float, int]]] = defaultdict(list)

    # Sample candidate indices (excluding self)
    all_candidates = list(range(n))
    all_candidates.pop(i)  # O(n) but happens once per anchor; cheap at n=25k
    sample = rng.sample(all_candidates, min(sample_size, len(all_candidates)))

    for j in sample:
        if j in forbid_pos:
            continue
        j_int = _jaccard(interests[i], interests[j])
        c_ij = float(cos_ij[i, j])
        c_ji = float(cos_ji[i, j])

        interest_ok = j_int >= jaccard_threshold
        pref_ab = c_ij >= cosine_threshold
        pref_ba = c_ji >= cosine_threshold

        if interest_ok and pref_ab and pref_ba:
            score = j_int + 0.5 * (c_ij + c_ji)
            pos_scores.append((score, j))
            continue

        if j in forbid_neg:
            continue

        if j_int == 0.0:
            neg_by_type["no_overlap"].append((1.0 - c_ij, j))
        elif not interest_ok:
            neg_by_type["low_overlap"].append((1.0 - c_ij, j))
        elif not pref_ab and not pref_ba:
            neg_by_type["both_reject"].append((1.0 - 0.5 * (c_ij + c_ji), j))
        elif pref_ab and not pref_ba:
            neg_by_type["one_sided_ab"].append((c_ij, j))
        elif pref_ba and not pref_ab:
            neg_by_type["one_sided_ba"].append((c_ji, j))
        else:
            neg_by_type["other"].append((1.0 - 0.5 * (c_ij + c_ji), j))

    pos_scores.sort(key=lambda x: -x[0])
    pos_pool = [j for _, j in pos_scores[:max_pool]]

    neg_pool: list[int] = []
    for bucket in ("no_overlap", "low_overlap", "both_reject", "one_sided_ab", "one_sided_ba", "other"):
        items = sorted(neg_by_type[bucket], key=lambda x: x[0])
        neg_pool.extend(j for _, j in items[:max_pool])

    return pos_pool, neg_pool


def build_triplets(
    profiles_path: Path,
    self_emb_path: Path,
    target_emb_path: Path,
    triplets_per_anchor: int = 5,
    jaccard_threshold: float = 0.4,
    cosine_threshold: float = 0.50,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[dict]]:
    """Returns (anchor_idx, pos_idx, neg_idx, triplet_ids) where each
    array has length n_profiles * triplets_per_anchor."""
    profiles = parse_profiles(profiles_path)
    self_emb = np.load(self_emb_path)
    target_emb = np.load(target_emb_path)
    n = len(profiles)
    assert self_emb.shape == (n, EMBEDDING_DIM), self_emb.shape
    assert target_emb.shape == (n, EMBEDDING_DIM), target_emb.shape

    interests, idx_to_id, _ = _build_index_maps(profiles)
    cos_ij = _asym_cosine_matrix(target_emb, self_emb)
    # cos[j, i] for the reverse direction
    t_norm = target_emb / np.linalg.norm(target_emb, axis=1, keepdims=True)
    s_norm = self_emb / np.linalg.norm(self_emb, axis=1, keepdims=True)
    cos_ji = s_norm @ t_norm.T  # cos[j, i] = cosine(target_emb[j], self_emb[i])

    # Track which (anchor, pos) pairs have already been emitted — avoid duplicates
    used_pos_pairs: dict[int, set[int]] = defaultdict(set)
    used_neg_pairs: dict[int, set[int]] = defaultdict(set)

    anchor_idx_list: list[int] = []
    pos_idx_list: list[int] = []
    neg_idx_list: list[int] = []
    triplet_ids_list: list[dict] = []

    # We need a separate RNG per anchor so different anchors don't sample the
    # same candidate via the same global seed.
    fallback_pos_used = 0
    fallback_neg_used = 0

    for i in range(n):
        rng = random.Random(seed + i)

        for k in range(triplets_per_anchor):
            pos_pool, neg_pool = _build_candidate_pool(
                i, n, interests, cos_ij, cos_ji,
                jaccard_threshold=jaccard_threshold,
                cosine_threshold=cosine_threshold,
                forbid_pos=used_pos_pairs[i],
                forbid_neg=used_neg_pairs[i],
                max_pool=50,
                sample_size=1500,
                rng=rng,
            )

            if not pos_pool:
                # Fallback: top scorer in the whole population
                cand = np.argsort(-(cos_ij[i] + cos_ji[i])).tolist()
                for j in cand:
                    if j != i and j not in used_pos_pairs[i]:
                        pos_pool = [j]
                        fallback_pos_used += 1
                        break
                if not pos_pool:
                    continue  # truly hopeless

            if not neg_pool:
                # Fallback: lowest scorer in the whole population
                cand = np.argsort((cos_ij[i] + cos_ji[i])).tolist()
                for j in cand:
                    if j != i and j not in used_neg_pairs[i]:
                        neg_pool = [j]
                        fallback_neg_used += 1
                        break
                if not neg_pool:
                    continue

            # Vary which candidate we choose across the K triplets for this anchor
            # so the same profile doesn't always pair with the same partner.
            pos_idx = pos_pool[rng.randrange(len(pos_pool))]
            neg_idx = neg_pool[rng.randrange(len(neg_pool))]

            used_pos_pairs[i].add(pos_idx)
            used_neg_pairs[i].add(neg_idx)

            anchor_idx_list.append(i)
            pos_idx_list.append(pos_idx)
            neg_idx_list.append(neg_idx)
            triplet_ids_list.append({
                "anchor": idx_to_id[i],
                "positive": idx_to_id[pos_idx],
                "negative": idx_to_id[neg_idx],
            })

    print(f"pos fallbacks used: {fallback_pos_used}")
    print(f"neg fallbacks used: {fallback_neg_used}")
    print(f"total triplets: {len(triplet_ids_list)} (= {n} anchors × {triplets_per_anchor})")
    return (
        np.array(anchor_idx_list, dtype=np.int32),
        np.array(pos_idx_list, dtype=np.int32),
        np.array(neg_idx_list, dtype=np.int32),
        triplet_ids_list,
    )


def save_triplets(
    anchor_idx: np.ndarray,
    pos_idx: np.ndarray,
    neg_idx: np.ndarray,
    triplet_ids: list[dict],
    out_dir: Path,
) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    np.savez(
        out_dir / "triplets.npz",
        anchor=anchor_idx,
        positive=pos_idx,
        negative=neg_idx,
    )
    (out_dir / "triplets_ids.json").write_text(
        json.dumps(triplet_ids, ensure_ascii=False),
        encoding="utf-8",
    )


# --- CLI -----------------------------------------------------------------

if __name__ == "__main__":
    import sys
    import time
    profiles_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/profiles_descriptions.txt")
    self_emb_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data/profile_embeddings_self.npy")
    target_emb_path = Path(sys.argv[3]) if len(sys.argv) > 3 else Path("data/profile_embeddings_target.npy")
    out_dir = Path(sys.argv[4]) if len(sys.argv) > 4 else Path("data")
    k = int(sys.argv[5]) if len(sys.argv) > 5 else 5
    seed = int(sys.argv[6]) if len(sys.argv) > 6 else 42

    t0 = time.time()
    a, p, n, ids = build_triplets(profiles_path, self_emb_path, target_emb_path, triplets_per_anchor=k, seed=seed)
    save_triplets(a, p, n, ids, out_dir)
    print(f"elapsed: {time.time() - t0:.1f}s")
    print(f"saved to {out_dir}/triplets.npz + triplets_ids.json")