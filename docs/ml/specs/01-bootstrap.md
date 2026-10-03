# T01 — Bootstrap (uv, pyproject, C++ toolchain, dirs)

**Goal:** standalone ML project with Python deps pinned, C++ build tools verified, directory skeleton in place.

**Time:** 30 min.

**Prerequisites:** nothing (this is task 01).

---

## Dependencies

### Python (managed by uv)

| Package | Version | Why |
|---|---|---|
| `python` | 3.11.x | pyenv / uv default |
| `torch` | 2.4.0 | Shared Encoder + Match Head |
| `numpy` | 1.26.4 | tensor ops |
| `openai` | 1.51.0 | embedding API client |
| `psycopg[binary]` | 3.2.3 | PostgreSQL driver (pgvector support) |
| `pgvector` | 0.3.6 | Python types for pgvector |
| `onnx` | 1.17.0 | PyTorch → ONNX export |
| `onnxruntime` | 1.19.2 | sanity-check the exported graph |
| `pytest` | 8.3.3 | unit tests |
| `pytest-cov` | 5.0.0 | coverage (optional) |
| `python-dotenv` | 1.0.1 | `.env` loader for OPENAI_API_KEY |
| `tenacity` | 9.0.0 | retry decorator for OpenAI calls |
| `requests` | — | (transitive, comes via `openai`) |

**Why these versions:** pinned to a snapshot that we tested at ML-MATCHING.md authoring time. Re-pinning mid-hackathon burns hours.

### C++ (system packages)

| Package | Why |
|---|---|
| `cmake` | build `match_scorer` |
| `libonnxruntime-dev` | inference inside the binary |
| `nlohmann-json3-dev` | JSON-lines protocol |
| `build-essential` | gcc, make, etc. |

**One-line install (Ubuntu/Debian):**
```bash
sudo apt-get install -y cmake libonnxruntime-dev nlohmann-json3-dev build-essential
```

**macOS (only if local dev on Mac):**
```bash
brew install cmake nlohmann-json
# onnxruntime: brew install onnxruntime  (or build from source — ~30 min)
```

> **Recommendation:** compile and test the C++ binary on the same OS where the demo runs. If the demo server is Linux, build on Linux. Cross-compile later if needed (M1).

---

## Files to create

```
ml/
├── pyproject.toml
├── uv.lock                     # auto-generated
├── .python-version
├── .gitignore
├── README.md
├── canned/                     # empty, populated by T02
├── src/just_mate_ml/
│   └── __init__.py
├── inference/                  # empty, populated by T11
├── data/                        # empty, populated by T03, T04
├── checkpoints/                # empty, populated by T09, T10
└── tests/
    └── __init__.py
```

---

## CLI commands

```bash
# 1. Install uv (skip if `uv --version` already works)
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env  # or restart shell

# 2. Create project structure
cd /Users/serhiivielkin/Projects/hackyear/just-mate
mkdir -p ml/{canned,src/just_mate_ml/{data,cache,embedding,model},inference/src,checkpoints,data,tests}
cd ml

# 3. Init uv project
uv init --no-readme --no-workspace --python 3.11
# (--no-workspace because ml/ is its own project, not part of repo's uv workspace)

# 4. Pin dependencies
uv add torch==2.4.0 numpy==1.26.4 openai==1.51.0 \
       "psycopg[binary]==3.2.3" pgvector==0.3.6 \
       onnx==1.17.0 onnxruntime==1.19.2 \
       pytest==8.3.3 pytest-cov==5.0.0 \
       python-dotenv==1.0.1 tenacity==9.0.0

# 5. Create .python-version
echo "3.11" > .python-version

# 6. Create __init__.py files (uv init does not create these)
touch src/just_mate_ml/__init__.py
touch src/just_mate_ml/{data,cache,embedding,model}/__init__.py
touch tests/__init__.py
```

---

## `.gitignore`

```gitignore
.venv/
__pycache__/
*.pyc
.pytest_cache/
.coverage
htmlcov/

# ML artifacts
checkpoints/*.pt
checkpoints/*.onnx
inference/build/

# Local secrets
.env
```

---

## `pyproject.toml` (after `uv add`)

uv will populate this. Verify it contains:
```toml
[project]
name = "just-mate-ml"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "torch==2.4.0",
    "numpy==1.26.4",
    "openai==1.51.0",
    "psycopg[binary]==3.2.3",
    "pgvector==0.3.6",
    "onnx==1.17.0",
    "onnxruntime==1.19.2",
    "pytest==8.3.3",
    "pytest-cov==5.0.0",
    "python-dotenv==1.0.1",
    "tenacity==9.0.0",
]
```

---

## Toolchain verification

Run these commands. Each must succeed.

```bash
# Python
uv run python -V
# → Python 3.11.x

# PyTorch CPU (CUDA not required for inference)
uv run python -c "import torch; print(torch.__version__, 'CUDA:', torch.cuda.is_available())"
# → 2.4.0 CUDA: False  (False is fine; we don't need GPU for M0)

# ONNX
uv run python -c "import onnx; print(onnx.__version__)"
# → 1.17.0

# onnxruntime
uv run python -c "import onnxruntime as ort; print(ort.__version__)"
# → 1.19.2

# pgvector
uv run python -c "import pgvector; print(pgvector.__version__)"
# → 0.3.6

# pytest
uv run pytest --version
# → pytest 8.3.3

# C++ tools
cmake --version
# → cmake version 3.x.x

g++ --version
# → g++ (Ubuntu 13.x.x) ...

# onnxruntime headers
find /usr/include /usr/local/include -name "onnxruntime_cxx_api.h" 2>/dev/null | head -1
# → /usr/include/onnxruntime_cxx_api.h  (or wherever your distro puts it)

# nlohmann/json
find /usr/include /usr/local/include -name "json.hpp" -path "*nlohmann*" 2>/dev/null | head -1
# → /usr/include/nlohmann/json.hpp
```

If any of these fail, install the missing piece **before** proceeding to T02.

---

## Tests

`ml/tests/test_bootstrap.py` — smoke test that imports resolve and the embedded test for the C++ headers exists on disk:

```python
"""Smoke test that all critical imports work."""
def test_imports():
    import torch
    import onnx
    import onnxruntime
    import pgvector
    import openai
    import psycopg
    assert torch.__version__ == "2.4.0"
    assert onnx.__version__ == "1.17.0"
    assert onnxruntime.__version__ == "1.19.2"


def test_cpp_toolchain():
    """Headers must be on disk before T11."""
    import os
    import subprocess
    headers = subprocess.check_output(
        ["find", "/usr/include", "/usr/local/include", "-name", "json.hpp",
         "-path", "*nlohmann*"],
        text=True,
    ).strip()
    assert "nlohmann/json.hpp" in headers, f"nlohmann/json.hpp not found:\n{headers}"
```

Run:
```bash
uv run pytest tests/test_bootstrap.py -v
```

---

## Definition of Done

- [ ] `ml/pyproject.toml` exists with all pinned dependencies
- [ ] `uv run pytest tests/test_bootstrap.py` passes
- [ ] `cmake --version` works
- [ ] `find ... -name json.hpp -path "*nlohmann*"` returns at least one path
- [ ] `find ... -name onnxruntime_cxx_api.h` returns at least one path
- [ ] `ml/.gitignore` ignores `.venv/`, `__pycache__/`, `*.pt`, `*.onnx`, `inference/build/`, `.env`
- [ ] Empty directory skeleton exists (canned/, data/, checkpoints/, tests/, src/just_mate_ml/{data,cache,embedding,model}, inference/src/)

If you skip `libonnxruntime-dev` installation because you plan to vendor it, **don't** — system headers let CMake find it via `find_package(onnxruntime)`. Vendoring is for M1 when we ship a self-contained binary.

---

## Common pitfalls

| Symptom | Fix |
|---|---|
| `uv: command not found` | `source $HOME/.local/bin/env` |
| `python 3.11.x not found` | `uv python install 3.11` |
| `Cannot find onnxruntime` (during T11) | `sudo apt-get install libonnxruntime-dev` |
| `nlohmann/json.hpp: No such file` (during T11) | `sudo apt-get install nlohmann-json3-dev` |
| `torch.cuda.is_available()` returns False | OK for M0; we don't need GPU |
| `uv add` complains about workspace | ensure you ran `uv init --no-workspace` inside `ml/` |