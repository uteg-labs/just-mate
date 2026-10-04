# T01 — Project bootstrap

> **Status: original hackathon spec, kept for history.** It was not built as written: the modules, file names and architecture here don't match `ml/`. Actual modules are listed at the top of [`../PLAN.md`](../PLAN.md); the current design is [`docs/ML-MATCHING.md`](../../../docs/ML-MATCHING.md).

**Goal:** standalone ML project with PyTorch + OpenAI + sklearn + matplotlib deps, `.env` with `OPENAI_API_KEY`, directory skeleton.

**Time:** 20 min.

**Prerequisites:** none.

---

## Dependencies

```bash
command -v uv >/dev/null || (curl -LsSf https://astral.sh/uv/install.sh | sh && source $HOME/.local/bin/env)

# from the repo root
mkdir -p ml/{src/just_mate_ml/{data,model},data,checkpoints,reports/figures,tests}
cd ml

uv init --no-readme --no-workspace --python 3.11

uv add torch==2.4.0 numpy==1.26.4 openai==1.51.0 \
       scikit-learn==1.5.2 matplotlib==3.9.2 \
       pytest==8.3.3 python-dotenv==1.0.1 tenacity==9.0.0

touch src/just_mate_ml/__init__.py
touch src/just_mate_ml/{data,model}/__init__.py
touch tests/__init__.py

echo "3.11" > .python-version
echo "OPENAI_API_KEY=sk-REPLACE-ME" > .env
```

Edit `.env` and replace `sk-REPLACE-ME` with a real key from https://platform.openai.com/api-keys.

---

## `.gitignore`

```gitignore
.venv/
__pycache__/
*.pyc
.pytest_cache/
.coverage
htmlcov/
.env
data/*.jsonl
data/*.npy
data/*.npz
data/*.json
checkpoints/*.pt
reports/figures/*.png
```

---

## `tests/test_bootstrap.py`

```python
def test_imports():
    import torch
    import openai
    import sklearn
    import matplotlib
    import numpy as np
    assert torch.__version__ == "2.4.0"


def test_dotenv_loads():
    from dotenv import load_dotenv
    import os
    load_dotenv()
    key = os.environ.get("OPENAI_API_KEY", "")
    assert key, "OPENAI_API_KEY not in .env"
    assert not key.startswith("sk-REPLACE"), "still placeholder"


def test_project_layout():
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    for p in [
        "src/just_mate_ml/__init__.py",
        "src/just_mate_ml/data/__init__.py",
        "src/just_mate_ml/model/__init__.py",
        "tests/__init__.py",
    ]:
        assert (root / p).exists(), f"missing {p}"
```

---

## CLI

```bash
cd ml
uv run pytest tests/test_bootstrap.py -v
```

---

## Definition of Done

- [ ] `ml/pyproject.toml` has all 9 deps at pinned versions
- [ ] `ml/.python-version` says `3.11`
- [ ] `ml/.env` has a real `OPENAI_API_KEY` (not `sk-REPLACE-ME`)
- [ ] `uv run pytest tests/test_bootstrap.py` passes (3/3)
- [ ] All `__init__.py` files exist