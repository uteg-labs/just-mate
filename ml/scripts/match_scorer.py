"""Match scorer: runs an exported ONNX match model behind newline-delimited
JSON on stdin/stdout. Runs as a Python script or as the PyInstaller binary
built by scripts/build_match_scorer.sh.

Run as a subprocess from any language:

    python scripts/match_scorer.py <model.onnx>

Wire format (newline-delimited JSON):
  request  → stdin :  {"id":"req_42", "target_emb":[...1536 floats...],
                         "self_emb":  [...1536 floats...],
                         "soft_jacc": <scalar float>}
  response → stdout:  {"id":"req_42", "score":0.78}

`soft_jacc` is fed only to models that declare a `soft_jacc` input (v3);
2-input models (v2, the published model_v0.onnx) ignore it. It is the
bidirectional soft-Jaccard of the two profiles' interests, see
`compute_full_soft_jaccard()` in scripts/train_experiments_v3.py.

One-shot CLI mode (for ad-hoc / debugging):
    python scripts/match_scorer.py <model.onnx> \
        --score target_emb.json,self_emb.json \
        --soft-jacc 0.5

Errors are returned as:
  response → stdout:  {"id":"req_42", "error":"<message>"}

Test in-process:
    python scripts/match_scorer.py --self-test
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from functools import cache
from pathlib import Path

import numpy as np
import onnxruntime as ort


def default_model_path() -> Path:
    """Path to the bundled ONNX model.

    In source runs: ml/checkpoints/model_v0.onnx
    In PyInstaller --onedir builds: <dist>/match_scorer/checkpoints/model_v0.onnx
      (we put the model there via `pyinstaller --add-data ...:checkpoints`,
       and `sys.executable.parent` resolves to `<dist>/match_scorer/`).

    Override at runtime by passing the path explicitly, or by setting the
    `MATCH_SCORER_MODEL` environment variable (e.g. for a/b-testing
    checkpoints without rebuilding the binary).
    """
    override = os.environ.get("MATCH_SCORER_MODEL")
    if override:
        return Path(override)

    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent / "checkpoints" / "model_v0.onnx"
    return Path(__file__).resolve().parents[1] / "checkpoints" / "model_v0.onnx"


def load_session(model_path: Path) -> ort.InferenceSession:
    """SessOptions: single-threaded CPU, all defaults otherwise.

    set-graph-optimization-level = ORT_ENABLE_ALL → uses all available graph
    optimizations (constant folding, fusion). The model is small so this is
    fast even on a single thread.
    """
    so = ort.SessionOptions()
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.intra_op_num_threads = 1
    so.inter_op_num_threads = 1
    return ort.InferenceSession(str(model_path), sess_options=so)


@cache
def takes_soft_jacc(sess: ort.InferenceSession) -> bool:
    return "soft_jacc" in {i.name for i in sess.get_inputs()}


def score_one(
    sess, target_emb: list[float], self_emb: list[float], soft_jacc: float = 0.0
) -> float:
    feeds = {
        "target_emb": np.asarray(target_emb, dtype=np.float32)[None, :],   # (1, 1536)
        "self_emb": np.asarray(self_emb, dtype=np.float32)[None, :],
    }
    if takes_soft_jacc(sess):
        feeds["soft_jacc"] = np.asarray([[soft_jacc]], dtype=np.float32)  # (1, 1)
    return float(sess.run(None, feeds)[0][0])


def score_pair(
    sess, target_a, self_a, target_b, self_b, soft_ab: float, soft_ba: float
) -> float:
    """Symmetric pair score: A→B + B→A, sum ∈ [0, 2]. Inference on the
    production server uses this with the calibrated threshold."""
    s_ab = score_one(sess, target_a, self_b, soft_ab)
    s_ba = score_one(sess, target_b, self_a, soft_ba)
    return s_ab + s_ba


def serve_loop(sess) -> None:
    """Main loop: read JSON requests, write JSON responses."""
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            req = json.loads(raw)
        except json.JSONDecodeError as e:
            sys.stdout.write(json.dumps({"error": f"bad json: {e}"}) + "\n")
            sys.stdout.flush()
            continue
        try:
            req_id = req["id"]
            soft = float(req.get("soft_jacc", 0.0))
            score = score_one(sess, req["target_emb"], req["self_emb"], soft)
            sys.stdout.write(json.dumps({"id": req_id, "score": score}) + "\n")
        except KeyError as e:
            sys.stdout.write(json.dumps({"id": req.get("id"), "error": f"missing key: {e}"}) + "\n")
        except Exception as e:
            sys.stdout.write(json.dumps({"id": req.get("id"), "error": str(e)}) + "\n")
        sys.stdout.flush()


def self_test(sess) -> None:
    """Sanity check using REAL profile embeddings (and the soft_jaccard cache
    for models that take it)."""
    here = Path(__file__).resolve().parents[1]
    self_emb = np.load(here / "data" / "profile_embeddings_self.npy")
    target_emb = np.load(here / "data" / "profile_embeddings_target.npy")
    sj_cache = (
        np.load(here / "data" / "soft_jaccard.npy", mmap_mode="r")
        if takes_soft_jacc(sess) else None
    )

    def soft(i: int, j: int) -> float:
        return 0.0 if sj_cache is None else float((sj_cache[i, j] + sj_cache[j, i]) / 2)

    # Pick a profile that has a real match in the triplets and one that doesn't.
    z = np.load(here / "data" / "triplets.npz")
    val = z["anchor"][0]; pos = z["positive"][0]; neg = z["negative"][0]
    soft_v_p = soft(val, pos)
    soft_v_n = soft(val, neg)

    s_self = score_one(sess, target_emb[val].tolist(), self_emb[val].tolist(), soft(val, val))
    s_match = score_one(sess, target_emb[val].tolist(), self_emb[pos].tolist(), soft_v_p)
    s_nonmatch = score_one(sess, target_emb[val].tolist(), self_emb[neg].tolist(), soft_v_n)
    s_pair_match = score_pair(
        sess, target_emb[val].tolist(), self_emb[val].tolist(),
        target_emb[pos].tolist(), self_emb[pos].tolist(),
        soft_v_p, soft_v_p,
    )
    s_pair_nonmatch = score_pair(
        sess, target_emb[val].tolist(), self_emb[val].tolist(),
        target_emb[neg].tolist(), self_emb[neg].tolist(),
        soft_v_n, soft_v_n,
    )
    print(json.dumps({
        "self_test": True,
        "score_self_pair": s_self,
        "score_match_directional": s_match,
        "score_nonmatch_directional": s_nonmatch,
        "symmetric_pair_match": s_pair_match,
        "symmetric_pair_nonmatch": s_pair_nonmatch,
    }))
    print(f"self-pair score       = {s_self:.4f}  (anchor's target vs anchor's self; expect HIGH, ≥ match)")
    print(f"match directional     = {s_match:.4f}  (expect HIGH)")
    print(f"nonmatch directional  = {s_nonmatch:.4f}  (expect < match)")
    print(f"symmetric match pair  = {s_pair_match:.4f}  (expect HIGH, well above threshold)")
    print(f"symmetric nonmatch    = {s_pair_nonmatch:.4f}  (expect LOW, below threshold)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Standalone match-scorer (ONNX).")
    parser.add_argument("model", nargs="?", default=str(default_model_path()),
                        help="path to ONNX model (default: bundled via default_model_path())")
    parser.add_argument("--self-test", action="store_true",
                        help="run a sanity check and exit")
    parser.add_argument("--score", type=str, default=None,
                        help="score one pair inline: 'target_emb.json,self_emb.json' "
                             "(paths to JSON files each holding 1536 floats)")
    parser.add_argument("--soft-jacc", type=float, default=0.0,
                        help="soft_jacc value for --score mode; fed only to models with a "
                             "soft_jacc input (v3), ignored by 2-input models (v2)")
    args = parser.parse_args()

    model_path = Path(args.model)
    if not model_path.exists():
        print(json.dumps({"error": f"model not found: {model_path}"}), file=sys.stderr)
        sys.exit(1)

    t0 = time.time()
    sess = load_session(model_path)
    load_ms = (time.time() - t0) * 1000
    print(json.dumps({"loaded": str(model_path), "load_ms": load_ms}), file=sys.stderr, flush=True)

    if args.self_test:
        self_test(sess)
        return

    if args.score:
        # Inline single-shot scoring for ad-hoc use.
        # Format: "target_emb.json,self_emb.json" — paths to JSON files each
        # holding a list of 1536 floats. soft_jacc passed via --soft-jacc.
        try:
            t_path, s_path = args.score.split(",", 1)
            target = json.loads(Path(t_path).read_text())
            self_ = json.loads(Path(s_path).read_text())
            s = score_one(sess, target, self_, args.soft_jacc)
            print(json.dumps({"score": s, "soft_jacc": args.soft_jacc}))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
        return

    serve_loop(sess)


if __name__ == "__main__":
    main()