"""Standalone match-scorer binary.

Runs the exported ONNX model (full pipeline: 1536-d embeddings → score)
in a single Python interpreter. Communicates with the parent process via
newline-delimited JSON on stdin/stdout — same shape as the spec's
`match_scorer` binary from docs/ML-MATCHING.md §6.1.

Run as a subprocess from any language:

    python scripts/match_scorer.py <model.onnx>

Wire format (newline-delimited JSON):
  request  → stdin :  {"id":"req_42", "target_emb":[...1536 floats...],
                         "self_emb":  [...1536 floats...]}
  response → stdout:  {"id":"req_42", "score":0.78}

Errors are returned as:
  response → stdout:  {"id":"req_42", "error":"<message>"}

Test in-process:
    python scripts/match_scorer.py --self-test
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort


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


def score_one(sess, target_emb: list[float], self_emb: list[float]) -> float:
    target_arr = np.asarray(target_emb, dtype=np.float32)[None, :]   # (1, 1536)
    self_arr = np.asarray(self_emb, dtype=np.float32)[None, :]
    score = sess.run(None, {"target_emb": target_arr, "self_emb": self_arr})[0]
    return float(score[0])


def score_pair(sess, target_a, self_a, target_b, self_b) -> float:
    """Symmetric pair score: A→B + B→A, sum ∈ [0, 2]. Inference on the
    production server uses this with the calibrated threshold (≈0.85)."""
    s_ab = score_one(sess, target_a, self_b)
    s_ba = score_one(sess, target_b, self_a)
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
            score = score_one(sess, req["target_emb"], req["self_emb"])
            sys.stdout.write(json.dumps({"id": req_id, "score": score}) + "\n")
        except KeyError as e:
            sys.stdout.write(json.dumps({"id": req.get("id"), "error": f"missing key: {e}"}) + "\n")
        except Exception as e:
            sys.stdout.write(json.dumps({"id": req.get("id"), "error": str(e)}) + "\n")
        sys.stdout.flush()


def self_test(sess) -> None:
    """Sanity check using REAL profile embeddings from data/.

    A self-pair (target=target, self=self) MUST score high. A cross-pair
    (target=A, self=B where A≠B and they don't match well) MUST score low.
    Using random Gaussian vectors doesn't work — the model is trained on
    OpenAI text-embedding-3-small outputs, so out-of-distribution inputs
    give meaningless numbers.
    """
    from pathlib import Path
    here = Path(__file__).resolve().parents[1]
    self_emb = np.load(here / "data" / "profile_embeddings_self.npy")
    target_emb = np.load(here / "data" / "profile_embeddings_target.npy")

    # Pick a profile that has a real match in the triplets and one that doesn't.
    z = np.load(here / "data" / "triplets.npz")
    val = z["anchor"][0]; pos = z["positive"][0]; neg = z["negative"][0]

    s_self = score_one(sess, target_emb[val].tolist(), self_emb[val].tolist())
    s_match = score_one(sess, target_emb[val].tolist(), self_emb[pos].tolist())
    s_nonmatch = score_one(sess, target_emb[val].tolist(), self_emb[neg].tolist())
    s_pair_match = score_pair(sess, target_emb[val].tolist(), self_emb[val].tolist(),
                                target_emb[pos].tolist(), self_emb[pos].tolist())
    s_pair_nonmatch = score_pair(sess, target_emb[val].tolist(), self_emb[val].tolist(),
                                   target_emb[neg].tolist(), self_emb[neg].tolist())
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
    print(f"symmetric match pair  = {s_pair_match:.4f}  (expect HIGH, well above threshold 0.85)")
    print(f"symmetric nonmatch    = {s_pair_nonmatch:.4f}  (expect LOW, below threshold)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Standalone match-scorer (ONNX).")
    parser.add_argument("model", nargs="?", default="checkpoints/model_v0.onnx",
                        help="path to ONNX model")
    parser.add_argument("--self-test", action="store_true",
                        help="run a sanity check and exit")
    parser.add_argument("--score", type=str, default=None,
                        help="score one pair inline: 'target.json,target.json' (comma-separated)")
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
        # holding a list of 1536 floats.
        try:
            t_path, s_path = args.score.split(",", 1)
            target = json.loads(Path(t_path).read_text())
            self_ = json.loads(Path(s_path).read_text())
            s = score_one(sess, target, self_)
            print(json.dumps({"score": s}))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)
        return

    serve_loop(sess)


if __name__ == "__main__":
    main()