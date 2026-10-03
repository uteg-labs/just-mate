from fastapi.testclient import TestClient

from just_mate_ml.serve.app import app

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"ok": True}


def test_score_matches_the_server_baseline():
    me = {"id": "a", "interests": ["a", "b"], "intents": ["beer"]}
    same = {"id": "b", "interests": ["a", "b"], "intents": ["beer"]}
    half = {"id": "c", "interests": ["b", "c"], "intents": ["coffee"]}

    res = client.post("/score", json={"self": me, "candidates": [same, half]}).json()

    assert res[0] == {"id": "b", "score": 1.0}
    assert abs(res[1]["score"] - 0.7 / 3) < 1e-9
