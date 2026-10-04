#!/usr/bin/env bash
# Build a standalone `match_scorer` binary with PyInstaller (--onedir).
# Cross-platform: macOS / Linux / Windows (Git Bash).
# Pure pip — only Python 3.11+ is required on the build machine, nothing else.
#
# Output:
#   dist/match_scorer/match_scorer[.exe] ← the binary
#   dist/match_scorer/checkpoints/...    ← the bundled .onnx model
#   dist/match_scorer/_internal/...      ← python + numpy + onnxruntime + native libs
#
# Drop the `dist/match_scorer/` directory on the server, point Bun at the
# binary, done. No Python, no uv, no pip on the server.
#
# IMPORTANT: build on the same OS/CPU arch as the deploy target.
# PyInstaller does not cross-compile.
#
# Override the bundled model via env var:
#   MODEL_PATH=checkpoints/model_v3_sym-loss-1.0.onnx bash scripts/build_match_scorer.sh
#
# Override output directory:
#   OUT_DIR=/tmp/release bash scripts/build_match_scorer.sh
#
# Override Python interpreter:
#   PYTHON=python3.12 bash scripts/build_match_scorer.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
DIST="${OUT_DIR:-$ROOT/dist}"

MODEL_PATH="${MODEL_PATH:-checkpoints/model_v0.onnx}"
echo "→ Bundling model: $MODEL_PATH"

if [[ ! -f "$MODEL_PATH" ]]; then
  echo "ERROR: model file not found: $MODEL_PATH" >&2
  exit 1
fi

# --- OS detection (Git Bash on Windows → MSYS_NT-* or MINGW*) ---
case "$(uname -s 2>/dev/null || echo Windows_NT)" in
  Linux*)               OS_ID="linux" ;;
  Darwin*)              OS_ID="macos" ;;
  MINGW*|MSYS*|CYGWIN*) OS_ID="windows" ;;
  *)                    OS_ID="windows" ;;
esac

# --- Binary name ---
BIN_NAME="match_scorer"
if [[ "$OS_ID" == "windows" ]]; then
  BIN_NAME="match_scorer.exe"
fi

# --- --strip is ELF/Mach-O only, not valid for PE (.exe) ---
PYI_ARGS=(--name match_scorer --onedir --noconfirm --clean)
if [[ "$OS_ID" == "linux" || "$OS_ID" == "macos" ]]; then
  PYI_ARGS+=(--strip)
fi

echo "→ OS: $OS_ID  Binary: $BIN_NAME"

# --- Pick a Python ≥ 3.11 ---
PYTHON="${PYTHON:-python3}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  # fallback to python3.11 / 3.12 / 3.13 if python3 is absent
  for cand in python3.11 python3.12 python3.13 python; do
    if command -v "$cand" >/dev/null 2>&1; then
      PYTHON="$cand"
      break
    fi
  done
fi

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "ERROR: no python3 found on PATH. Install Python ≥ 3.11 first." >&2
  exit 1
fi

PY_VERSION="$("$PYTHON" -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
if "$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)'; then
  echo "→ Python: $($PYTHON --version) (need ≥ 3.11)"
else
  echo "ERROR: $PYTHON is $PY_VERSION, need ≥ 3.11" >&2
  exit 1
fi

# --- Create venv if it doesn't exist ---
VENV="$ROOT/.venv"
VENV_PY="$VENV/bin/python"
if [[ "$OS_ID" == "windows" ]]; then
  VENV_PY="$VENV/Scripts/python.exe"
fi

if [[ ! -x "$VENV_PY" ]]; then
  echo "→ Creating venv at $VENV ..."
  "$PYTHON" -m venv "$VENV"
  # Some Debian/Ubuntu ships python3.11-venv without ensurepip; bootstrap it.
  if ! "$VENV_PY" -m pip --version >/dev/null 2>&1; then
    "$PYTHON" -m ensurepip --upgrade --default-pip
  fi
fi

# --- Install runtime + build deps via plain pip ---
echo "→ Installing numpy + onnxruntime + pyinstaller (pinned, no pickle)..."
"$VENV_PY" -m pip install --upgrade pip wheel setuptools >/dev/null
"$VENV_PY" -m pip install \
  'numpy==1.26.4' \
  'onnxruntime==1.19.2' \
  'pyinstaller>=6.10'

echo "→ Cleaning previous build..."
rm -rf "$DIST" "$ROOT/build" "$ROOT/match_scorer.spec"

echo "→ Running PyInstaller --onedir..."
"$VENV_PY" -m PyInstaller \
  "${PYI_ARGS[@]}" \
  --collect-data onnxruntime \
  --copy-metadata onnxruntime \
  --hidden-import onnxruntime.capi._pybind_state \
  --hidden-import onnxruntime.backend \
  --hidden-import onnxruntime.backend.adapters \
  --add-data "${MODEL_PATH}:checkpoints" \
  scripts/match_scorer.py

echo ""
echo "✓ Built: $DIST/match_scorer/$BIN_NAME"

# --- Smoke test ---
echo ""
echo "→ Smoke test (--self-test with bundled model)..."
if "$DIST/match_scorer/$BIN_NAME" --self-test 2>&1 | tee "$DIST/.smoke.log"; then
  echo ""
  echo "✓ Smoke test passed."
  echo ""
  echo "Deploy: copy $DIST/match_scorer/ to your server and spawn the binary directly."
  echo "  Example Bun spawn:"
  echo "    spawn('/opt/justmate/match_scorer/$BIN_NAME', [], { cwd: '/opt/justmate/match_scorer' })"
else
  echo ""
  echo "✗ Smoke test FAILED — see $DIST/.smoke.log" >&2
  exit 1
fi