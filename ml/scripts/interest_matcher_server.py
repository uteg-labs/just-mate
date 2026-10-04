"""HTTP wrapper around scripts/interest_matcher.py.

Same wire contract as the original stdin/stdout NDJSON daemon, but over HTTP
so the matcher can run alongside the match_scorer in the same container
(see scripts/run_servers.py). The Bun server hits it across the compose
network on a separate port.

Endpoints
---------
GET  /health            liveness, always 200
GET  /ready             readiness — 200 only after model + vocab are loaded
POST /score             one pair; payload auto-detected:
                          numeric:  {"interests_a_emb": [[...1536...], ...],
                                     "interests_b_emb": [...],
                                     "labels_a": [...], "labels_b": [...]}   # optional
                          string:   {"interests_a": ["music", "cinema"],
                                     "interests_b": ["books", "rock"]}
                        → {"score": float, "mode": "linear"|"trained",
                           "features": {...}, "breakdown": [...],
                           "matched_exact": [...]}
POST /batch             many pairs in one request (cap: 256)
                        → {"rows": [{...}, {...}]}

Run standalone:
    python scripts/interest_matcher_server.py [--port 8001]

Run alongside the match scorer:
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

ML_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ML_DIR / "src"
sys.path.insert(0, str(SRC_DIR))

from just_mate_ml.models.interest_matcher import (  # noqa: E402
    EMBEDDING_DIM,
    InterestMatchModel,
    best_match_breakdown,
    combine_linear,
    extract_features,
    extract_features_from_strings,
    known_interests,
    load_interest_table,
)

BATCH_CAP = 256


def _normalize(s: str) -> str:
    return s.strip().lower()


def _normalize_set(items: list[str]) -> set[str]:
    return {_normalize(x) for x in items if x and x.strip()}


def _matched_exact(a: list[str] | None, b: list[str] | None) -> list[str]:
    if a is None or b is None:
        return []
    return sorted(_normalize_set(a) & _normalize_set(b))


def _parse_embedding_list(raw: object, field: str) -> np.ndarray:
    if raw is None:
        return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
    if not isinstance(raw, list):
        raise ValueError(f"{field} must be a list of 1536-float lists")
    if len(raw) == 0:
        return np.zeros((0, EMBEDDING_DIM), dtype=np.float32)
    arr = np.asarray(raw, dtype=np.float32)
    if arr.ndim != 2 or arr.shape[1] != EMBEDDING_DIM:
        raise ValueError(f"{field} must have shape (n, {EMBEDDING_DIM}), got {arr.shape}")
    return arr


def score_pair_numeric(
    interests_a_emb: np.ndarray,
    interests_b_emb: np.ndarray,
    labels_a: list[str] | None,
    labels_b: list[str] | None,
    model: InterestMatchModel,
) -> dict:
    feats = extract_features(
        interests_a_emb, interests_b_emb,
        labels_a=_normalize_set(labels_a) if labels_a is not None else None,
        labels_b=_normalize_set(labels_b) if labels_b is not None else None,
    )
    score = (
        model.score_array(feats.to_array())
        if model.session is not None
        else combine_linear(feats)
    )
    breakdown = best_match_breakdown(
        interests_a_emb, interests_b_emb,
        labels_a=labels_a, labels_b=labels_b,
    )
    return {
        "score": round(float(np.clip(score, 0.0, 1.0)), 4),
        "mode": model.mode,
        "features": feats.as_dict(),
        "breakdown": breakdown,
        "matched_exact": _matched_exact(labels_a, labels_b),
    }


def score_pair_strings(
    interests_a: list[str],
    interests_b: list[str],
    int_vec: np.ndarray,
    name_to_row: dict[str, int],
    model: InterestMatchModel,
) -> dict:
    feats = extract_features_from_strings(interests_a, interests_b, int_vec, name_to_row)
    score = (
        model.score_array(feats.to_array())
        if model.session is not None
        else combine_linear(feats)
    )
    known_a = known_interests(interests_a, name_to_row)
    known_b = known_interests(interests_b, name_to_row)
    breakdown = best_match_breakdown(
        int_vec[[name_to_row[k] for k in known_a]],
        int_vec[[name_to_row[k] for k in known_b]],
        labels_a=known_a, labels_b=known_b,
    )
    return {
        "score": round(float(np.clip(score, 0.0, 1.0)), 4),
        "mode": model.mode,
        "features": feats.as_dict(),
        "breakdown": breakdown,
        "matched_exact": _matched_exact(interests_a, interests_b),
    }


def _is_numeric_request(req: dict) -> bool:
    return "interests_a_emb" in req or "interests_b_emb" in req


# Boot-time loaded state. Single threaded under the GIL is fine: the
# matcher is a 10-d → 1 forward, sub-millisecond. Loading is done once at
# boot under _boot_lock.
_model: InterestMatchModel | None = None
_int_vec: np.ndarray | None = None
_name_to_row: dict[str, int] | None = None
_loaded_at: float = 0.0
_boot_lock = threading.Lock()
_log = logging.getLogger("interest_matcher")


class Handler(BaseHTTPRequestHandler):
    server_version = "interest_matcher/1.0"

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

    def _score_one(self, req: dict) -> dict:
        if _model is None or _int_vec is None or _name_to_row is None:
            raise RuntimeError("model not loaded")
        if _is_numeric_request(req):
            a_emb = _parse_embedding_list(req.get("interests_a_emb"), "interests_a_emb")
            b_emb = _parse_embedding_list(req.get("interests_b_emb"), "interests_b_emb")
            return score_pair_numeric(
                a_emb, b_emb,
                req.get("labels_a"), req.get("labels_b"),
                _model,
            )
        a = req["interests_a"]
        b = req["interests_b"]
        if not isinstance(a, list) or not isinstance(b, list):
            raise ValueError("interests_a and interests_b must be lists of strings")
        return score_pair_strings(a, b, _int_vec, _name_to_row, _model)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(HTTPStatus.OK, {"ok": True})
        elif self.path == "/ready":
            if _model is None:
                self._send_json(HTTPStatus.SERVICE_UNAVAILABLE, {"ready": False})
            else:
                self._send_json(HTTPStatus.OK, {
                    "ready": True,
                    "mode": _model.mode,
                    "vocab_size": len(_name_to_row or {}),
                    "uptime_s": time.time() - _loaded_at,
                })
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
                self._send_json(HTTPStatus.OK, self._score_one(body))

            elif self.path == "/batch":
                rows = body.get("rows")
                if not isinstance(rows, list) or not rows:
                    raise ValueError("rows must be a non-empty list")
                if len(rows) > BATCH_CAP:
                    raise ValueError(f"batch size {len(rows)} exceeds cap {BATCH_CAP}")
                out = [self._score_one(r) for r in rows]
                self._send_json(HTTPStatus.OK, {"rows": out})

            else:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})

        except KeyError as e:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": f"missing key: {e}"})
        except ValueError as e:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            _log.exception("inference failed")
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(e)})


def _default_data_dir() -> Path:
    override = os.environ.get("INTEREST_MATCHER_DATA_DIR")
    if override:
        return Path(override)
    return ML_DIR / "data"


def _default_model_path() -> Path:
    override = os.environ.get("INTEREST_MATCHER_MODEL")
    if override:
        return Path(override)
    return ML_DIR / "checkpoints" / "interest_matcher.onnx"


def _boot(model_path: Path, data_dir: Path) -> None:
    """Load ONNX + interest table once. Idempotent under the boot lock."""
    global _model, _int_vec, _name_to_row, _loaded_at
    with _boot_lock:
        if _model is not None:
            return
        t0 = time.time()
        int_vec, name_to_row = load_interest_table(data_dir)
        onnx_path = model_path if model_path.exists() else None
        if onnx_path is None:
            _log.warning("no model at %s — using linear-blend fallback", model_path)
        _model = InterestMatchModel(onnx_path)
        _int_vec = int_vec
        _name_to_row = name_to_row
        _loaded_at = time.time()
        _log.info(json.dumps({
            "event": "model_loaded",
            "mode": _model.mode,
            "path": str(onnx_path) if onnx_path else None,
            "vocab_size": len(name_to_row),
            "load_ms": (_loaded_at - t0) * 1000,
        }))


def build_server(host: str, port: int) -> ThreadingHTTPServer:
    """Boot the model + vocab and return a bound ThreadingHTTPServer.

    Used by scripts/run_servers.py to host both servers in one container.
    """
    _boot(_default_model_path(), _default_data_dir())
    return ThreadingHTTPServer((host, port), Handler)


def main() -> None:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "info").upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    parser = argparse.ArgumentParser(description="HTTP interest matcher.")
    parser.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("INTEREST_MATCHER_PORT", "8001")))
    parser.add_argument("--model", default=str(_default_model_path()))
    parser.add_argument("--data-dir", default=str(_default_data_dir()))
    args = parser.parse_args()

    try:
        _boot(Path(args.model), Path(args.data_dir))
    except Exception as e:
        print(json.dumps({"error": f"boot failed: {e}"}), file=sys.stderr)
        sys.exit(1)

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


if __name__ == "__main__":
    main()