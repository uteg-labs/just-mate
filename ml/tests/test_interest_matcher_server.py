"""HTTP smoke test for interest_matcher_server.

Boots the server in-process on an ephemeral port and asserts the wire
contract for both numeric and string request paths. Run with:

    uv run pytest tests/test_interest_matcher_server.py
"""
from __future__ import annotations

import json
import threading
import time
from http.client import HTTPConnection
from pathlib import Path

import numpy as np
import pytest

from scripts.interest_matcher_server import (  # type: ignore[import-not-found]
    EMBEDDING_DIM,
    Handler,
    _boot,
    _model,
)


@pytest.fixture(scope="module")
def server(tmp_path_factory):
    data_dir = Path(__file__).resolve().parents[1] / "data"
    if not (data_dir / "interest_embeddings.npz").exists():
        pytest.skip("interest_embeddings.npz missing — skip")
    onnx = Path(__file__).resolve().parents[1] / "checkpoints" / "interest_matcher.onnx"
    try:
        _boot(onnx, data_dir)
    except Exception as e:
        pytest.skip(f"could not boot matcher: {e}")

    from http.server import ThreadingHTTPServer
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    yield port
    httpd.shutdown()
    httpd.server_close()


def _post(port: int, path: str, body: dict) -> tuple[int, dict]:
    conn = HTTPConnection("127.0.0.1", port, timeout=5)
    conn.request("POST", path, body=json.dumps(body), headers={"Content-Type": "application/json"})
    r = conn.getresponse()
    data = r.read()
    conn.close()
    return r.status, json.loads(data) if data else {}


def _get(port: int, path: str) -> tuple[int, dict]:
    conn = HTTPConnection("127.0.0.1", port, timeout=5)
    conn.request("GET", path)
    r = conn.getresponse()
    data = r.read()
    conn.close()
    return r.status, json.loads(data) if data else {}


def test_health(server):
    status, body = _get(server, "/health")
    assert status == 200
    assert body == {"ok": True}


def test_ready_reports_mode(server):
    status, body = _get(server, "/ready")
    assert status == 200
    assert body["ready"] is True
    assert body["mode"] in ("linear", "trained")
    assert body["vocab_size"] > 0


def test_string_identical_scores_high(server):
    a = ["music", "cinema", "books"]
    status, body = _post(server, "/score", {"interests_a": a, "interests_b": a})
    assert status == 200
    assert 0.9 <= body["score"] <= 1.0
    assert body["matched_exact"] == sorted(a)
    assert "breakdown" in body
    assert "features" in body


def test_string_disjoint_scores_low(server):
    a = ["music", "cinema", "books"]
    b = ["cars", "investing", "real-estate"]
    status, body = _post(server, "/score", {"interests_a": a, "interests_b": b})
    assert status == 200
    assert body["score"] < 0.5
    assert body["matched_exact"] == []


def test_numeric_path_runs(server):
    rng = np.random.default_rng(42)
    a = rng.standard_normal((3, EMBEDDING_DIM)).tolist()
    b = rng.standard_normal((3, EMBEDDING_DIM)).tolist()
    status, body = _post(server, "/score", {"interests_a_emb": a, "interests_b_emb": b})
    assert status == 200
    assert 0.0 <= body["score"] <= 1.0


def test_numeric_rejects_wrong_dim(server):
    status, body = _post(server, "/score", {
        "interests_a_emb": [[0.0] * 100],
        "interests_b_emb": [[0.0] * EMBEDDING_DIM],
    })
    assert status == 400
    assert "1536" in body["error"]


def test_batch_returns_n_rows(server):
    rows = [
        {"interests_a": ["music", "cinema"], "interests_b": ["music", "books"]},
        {"interests_a": ["cars"], "interests_b": ["investing"]},
    ]
    status, body = _post(server, "/batch", {"rows": rows})
    assert status == 200
    assert len(body["rows"]) == 2
    assert all("score" in r for r in body["rows"])


def test_unknown_path_returns_404(server):
    status, _ = _get(server, "/nope")
    assert status == 404


def test_missing_required_field(server):
    status, body = _post(server, "/score", {"interests_a": ["music"]})
    assert status == 400
    assert "missing key" in body["error"] or "interests_b" in body["error"]