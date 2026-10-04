#!/usr/bin/env bash
# Build match_scorer for the current Mac (native) AND for Linux (via Docker).
# Windows needs a Windows machine (scripts/build_match_scorer.sh under Git Bash):
# PyInstaller does not cross-compile.
#
# Usage:
#   bash scripts/build_local_mac_and_linux.sh
#
# Output (under ml/dist/):
#   match_scorer/                ← macOS build (native, x86_64 or arm64)
#   match_scorer-linux/          ← Linux build (built inside python:3.11-slim)
#   match-scorer-macos.tar.gz
#   match-scorer-linux.tar.gz
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
DIST="$ROOT/dist"

MODEL_PATH="${MODEL_PATH:-checkpoints/model_v0.onnx}"

echo "════════════════════════════════════════"
echo " macOS build (native on this machine)"
echo "════════════════════════════════════════"
bash scripts/build_match_scorer.sh

# Move the native build aside so the Linux container doesn't overwrite it.
mv "$DIST/match_scorer" "$DIST/match_scorer-macos"
tar -czf "$DIST/match-scorer-macos.tar.gz" -C "$DIST" "match_scorer-macos"

# Detect host arch for the matching Linux container.
HOST_ARCH="$(uname -m)"
case "$HOST_ARCH" in
  x86_64)        LINUX_IMAGE_PLATFORM="linux/amd64" ;;
  arm64|aarch64) LINUX_IMAGE_PLATFORM="linux/arm64" ;;
  *)             LINUX_IMAGE_PLATFORM="linux/amd64" ;;
esac

echo ""
echo "════════════════════════════════════════"
echo " Linux build (Docker — $LINUX_IMAGE_PLATFORM)"
echo "════════════════════════════════════════"

# Use docker buildx with --platform so we can cross-build even when host ≠ target.
# python:3.12-slim is small and has glibc (works for onnxruntime native libs).
docker run --rm \
  --platform "$LINUX_IMAGE_PLATFORM" \
  -v "$ROOT:/src" \
  -w /src/ml \
  -e MODEL_PATH="$MODEL_PATH" \
  python:3.12-slim bash -c '
    set -euo pipefail
    apt-get update -qq && apt-get install -y --no-install-recommends curl ca-certificates >/dev/null
    curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null
    . "$HOME/.local/bin/env"
    uv sync --no-group dev
    uv pip install --python .venv/bin/python "pyinstaller>=6.10"
    bash scripts/build_match_scorer.sh
  '

# Move the in-container build aside too.
mv "$DIST/match_scorer" "$DIST/match_scorer-linux"
tar -czf "$DIST/match-scorer-linux.tar.gz" -C "$DIST" "match_scorer-linux"

echo ""
echo "════════════════════════════════════════"
echo " ✓ Both builds complete"
echo "════════════════════════════════════════"
echo "  $DIST/match_scorer-macos/    (native, run: ./match_scorer --self-test)"
echo "  $DIST/match_scorer-linux/    (can't run on macOS — for Linux server)"
echo "  $DIST/match-scorer-macos.tar.gz"
echo "  $DIST/match-scorer-linux.tar.gz"
echo ""
echo "For a Windows build, run scripts/build_match_scorer.sh under Git Bash on Windows."