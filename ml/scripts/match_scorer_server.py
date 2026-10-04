"""HTTP wrapper around match_scorer.

Same wire contract as the stdin/stdout NDJSON daemon (DEPLOYMENT.md §3.2),
but over HTTP so the scorer can run in its own container and the Bun
server hits it across the compose network.

Endpoints
---------
GET  /health            liveness, always 200
GET  /ready             readiness — 200 only after model is loaded
POST /score             one ONNX forward pass (target_emb, self_emb, soft_jacc)
                        → {"score": float}
POST /pair              symmetric pair: both directions in one request
                        → {"score_ab": float, "score_ba": float, "pair_score": float}
POST /batch             many single scores in one request (cap: 256 per call)
                        → {"scores": [float, ...]}

Inputs mirror the original subprocess payload field-for-field. Errors come
back as HTTP 4xx with a JSON {"error": "..."} body — the scorer never
crashes on bad input, only on a fatal startup problem.

Run standalone:
    python scripts/match_scorer_server.py [--model PATH] [--port 8000] [--host 0.0.0.0]

Run alongside the interest matcher (multi-port container):
    python scripts/run_servers.py
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import signal
import sys
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort

EMB_DIM = 1536
BATCH_CAP = 256


def default_model_path() -> Path:
    override = os.environ.get("MATCH_SCORER_MODEL")
    if override:
        return Path(override)
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent / "checkpoints" / "model_v0.onnx"
    return Path(__file__).resolve().parents[1] / "checkpoints" / "model_v0.onnx"


def load_session(model_path: Path) -> ort.InferenceSession:
    so = ort.SessionOptions()
    so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    so.intra_op_num_threads = 1
    so.inter_op_num_threads = 1
    return ort.InferenceSession(str(model_path), sess_options=so)


# Model is loaded once at boot into this module-level handle. ThreadingHTTPServer
# hands each request to a worker thread; ORT inference here is single-threaded
# but small (~3 ms), so the GIL is fine. Run multiple container replicas to
# scale across cores.
_session: ort.InferenceSession | None = None
_session_lock = threading.Lock()
_loaded_at: float = 0.0
_log = logging.getLogger("match_scorer")


def score_one(target_emb: list[float], self_emb: list[float], soft_jacc: float) -> float:
    if _session is None:
        raise RuntimeError("model not loaded")
    target_arr = np.asarray(target_emb, dtype=np.float32)[None, :]
    self_arr = np.asarray(self_emb, dtype=np.float32)[None, :]
    sj_arr = np.asarray([soft_jacc], dtype=np.float32)[None, :]
    score = _session.run(
        None,
        {"target_emb": target_arr, "self_emb": self_arr, "soft_jacc": sj_arr},
    )[0]
    return float(score[0])


def score_batch(rows: list[dict[str, Any]]) -> list[float]:
    """One ORT forward pass over a stacked batch — cheaper than N calls."""
    if _session is None:
        raise RuntimeError("model not loaded")
    if len(rows) > BATCH_CAP:
        raise ValueError(f"batch size {len(rows)} exceeds cap {BATCH_CAP}")
    target = np.asarray([r["target_emb"] for r in rows], dtype=np.float32)
    self_ = np.asarray([r["self_emb"] for r in rows], dtype=np.float32)
    sj = np.asarray([float(r.get("soft_jacc", 0.0)) for r in rows], dtype=np.float32)[:, None]
    out = _session.run(
        None,
        {"target_emb": target, "self_emb": self_, "soft_jacc": sj},
    )[0]
    return [float(x) for x in out]


def _check_emb(field: str, value: Any) -> list[float]:
    if not isinstance(value, list):
        raise ValueError(f"{field} must be a list")
    if len(value) != EMB_DIM:
        raise ValueError(f"{field} length {len(value)} != {EMB_DIM}")
    return [float(x) for x in value]


class Handler(BaseHTTPRequestHandler):
    server_version = "match_scorer/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        _log.info("%s - %s", self.address_string(), fmt % args)

    def _send_json(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length <= 0:
            raise ValueError("empty body")
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            raise ValueError(f"bad json: {e}") from e

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(HTTPStatus.OK, {"ok": True})
        elif self.path == "/ready":
            if _session is None:
                self._send_json(HTTPStatus.SERVICE_UNAVAILABLE, {"ready": False})
            else:
                self._send_json(HTTPStatus.OK, {"ready": True, "uptime_s": time.time() - _loaded_at})
        else:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        try:
            body = self._read_json()
        except ValueError as e:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(e)})
            return

        try:
            if self.path == "/score":
                payload = {
                    "target_emb": _check_emb("target_emb", body["target_emb"]),
                    "self_emb": _check_emb("self_emb", body["self_emb"]),
                    "soft_jacc": float(body.get("soft_jacc", 0.0)),
                }
                with _session_lock:
                    score = score_one(payload["target_emb"], payload["self_emb"], payload["soft_jacc"])
                self._send_json(HTTPStatus.OK, {"score": score})

            elif self.path == "/pair":
                ta = _check_emb("target_a", body["target_a"])
                sa = _check_emb("self_a", body["self_a"])
                tb = _check_emb("target_b", body["target_b"])
                sb = _check_emb("self_b", body["self_b"])
                soft_ab = float(body.get("soft_ab", 0.0))
                soft_ba = float(body.get("soft_ba", 0.0))
                with _session_lock:
                    s_ab = score_one(ta, sb, soft_ab)
                    s_ba = score_one(tb, sa, soft_ba)
                self._send_json(HTTPStatus.OK, {
                    "score_ab": s_ab,
                    "score_ba": s_ba,
                    "pair_score": s_ab + s_ba,
                })

            elif self.path == "/batch":
                rows = body.get("rows")
                if not isinstance(rows, list) or not rows:
                    raise ValueError("rows must be a non-empty list")
                checked = [
                    {
                        "target_emb": _check_emb("target_emb", r["target_emb"]),
                        "self_emb": _check_emb("self_emb", r["self_emb"]),
                        "soft_jacc": float(r.get("soft_jacc", 0.0)),
                    }
                    for r in rows
                ]
                with _session_lock:
                    scores = score_batch(checked)
                self._send_json(HTTPStatus.OK, {"scores": scores})

            else:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})

        except KeyError as e:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": f"missing key: {e}"})
        except ValueError as e:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            _log.exception("inference failed")
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})


def main() -> None:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "info").upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(description="HTTP scorer (ONNX).")
    parser.add_argument("--model", default=str(default_model_path()))
    parser.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = parser.parse_args()

    global _session, _loaded_at
    model_path = Path(args.model)
    if not model_path.exists():
        print(json.dumps({"error": f"model not found: {model_path}"}), file=sys.stderr)
        sys.exit(1)

    t0 = time.time()
    _session = load_session(model_path)
    _loaded_at = time.time()
    load_ms = (_loaded_at - t0) * 1000
    _log.info(json.dumps({"event": "model_loaded", "path": str(model_path), "load_ms": load_ms}))

    server = ThreadingHTTPServer((args.host, args.port), Handler)

    def _shutdown(*_: Any) -> None:
        _log.info("shutting down")
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    _log.info("listening on http://%s:%d", args.host, args.port)
    try:
        server.serve_forever()
    finally:
        server.server_close()


def build_server(host: str, port: int, model_path: Path | None = None) -> ThreadingHTTPServer:
    """Build a server bound to (host, port) with the model pre-loaded.

    Used by `scripts/run_servers.py` to run this and the interest matcher in
    the same container on different ports. Loads the model if it has not
    been loaded yet (idempotent — safe to call from multiple threads).
    """
    global _session, _loaded_at
    if _session is None:
        path = model_path or default_model_path()
        if not path.exists():
            raise FileNotFoundError(f"model not found: {path}")
        t0 = time.time()
        _session = load_session(path)
        _loaded_at = time.time()
        _log.info(json.dumps({
            "event": "model_loaded",
            "path": str(path),
            "load_ms": (_loaded_at - t0) * 1000,
        }))
    return ThreadingHTTPServer((host, port), Handler)


if __name__ == "__main__":
    main()