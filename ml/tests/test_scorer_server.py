"""HTTP smoke test for match_scorer_server.

Boots the server in-process on an ephemeral port, hits /health, /ready,
/score, /pair, /batch and asserts the JSON contract. Run with:

    uv run pytest tests/test_scorer_server.py
"""
from __future__ import annotations

import json
import threading
import time
from http.client import HTTPConnection
from pathlib import Path

import numpy as np
import pytest

from scripts.match_scorer_server import (  # type: ignore[import-not-found]
    EMB_DIM,
    Handler,
    _loaded_at,
    _session,
    load_session,
)


@pytest.fixture(scope="module")
def server():
    model = Path(__file__).resolve().parents[1] / "checkpoints" / "model_v3_best.onnx"
    if not model.exists():
        model = Path(__file__).resolve().parents[1] / "checkpoints" / "model_v0.onnx"
    assert model.exists(), f"no model found near {model}"

    import scripts.match_scorer_server as srv  # type: ignore[import-not-found]

    srv._session = load_session(model)
    srv._loaded_at = time.time()

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


def test_ready_after_model_loaded(server):
    status, body = _get(server, "/ready")
    assert status == 200
    assert body["ready"] is True
    assert body["uptime_s"] >= 0


def test_score_round_trip(server):
    rng = np.random.default_rng(0)
    target = rng.standard_normal(EMB_DIM).tolist()
    self_ = rng.standard_normal(EMB_DIM).tolist()
    status, body = _post(server, "/score", {"target_emb": target, "self_emb": self_, "soft_jacc": 0.5})
    assert status == 200
    assert "score" in body
    assert 0.0 <= body["score"] <= 1.0


def test_pair_returns_both_directions(server):
    rng = np.random.default_rng(1)
    ta = rng.standard_normal(EMB_DIM).tolist()
    sa = rng.standard_normal(EMB_DIM).tolist()
    tb = rng.standard_normal(EMB_DIM).tolist()
    sb = rng.standard_normal(EMB_DIM).tolist()
    status, body = _post(server, "/pair", {
        "target_a": ta, "self_a": sa,
        "target_b": tb, "self_b": sb,
        "soft_ab": 0.3, "soft_ba": 0.7,
    })
    assert status == 200
    assert body["score_ab"] + body["score_ba"] == pytest.approx(body["pair_score"], abs=1e-6)


def test_score_rejects_wrong_dim(server):
    status, body = _post(server, "/score", {"target_emb": [0.0] * 100, "self_emb": [0.0] * EMB_DIM, "soft_jacc": 0.0})
    assert status == 400
    assert "length" in body["error"]


def test_score_soft_jacc_default_zero(server):
    rng = np.random.default_rng(2)
    target = rng.standard_normal(EMB_DIM).tolist()
    self_ = rng.standard_normal(EMB_DIM).tolist()
    status, body = _post(server, "/score", {"target_emb": target, "self_emb": self_})
    assert status == 200
    assert "score" in body


def test_batch_returns_n_scores(server):
    rng = np.random.default_rng(3)
    rows = [
        {"target_emb": rng.standard_normal(EMB_DIM).tolist(),
         "self_emb": rng.standard_normal(EMB_DIM).tolist(),
         "soft_jacc": 0.1 * i}
        for i in range(5)
    ]
    status, body = _post(server, "/batch", {"rows": rows})
    assert status == 200
    assert len(body["scores"]) == 5


def test_unknown_path_returns_404(server):
    status, _ = _get(server, "/nope")
    assert status == 404