#!/usr/bin/env bash
# Build standalone `match_scorer` binary inside a Docker container.
# Cross-platform from any host with Docker BuildKit — produces a Linux
# binary that runs on the target server with no Python / uv / pip.
#
# Output:
#   dist/match_scorer/{match_scorer, checkpoints/, _internal/}
#
# Usage:
#   bash scripts/build_match_scorer_docker.sh
#
# Env overrides:
#   PLATFORM=linux/arm64   bash scripts/build_match_scorer_docker.sh
#   MODEL_PATH=checkpoints/model_v3_sym-loss-1.0.onnx \
#     bash scripts/build_match_scorer_docker.sh
#   OUT_DIR=/tmp/release   bash scripts/build_match_scorer_docker.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

PLATFORM="${PLATFORM:-linux/amd64}"
MODEL_PATH="${MODEL_PATH:-checkpoints/model_v0.onnx}"
DIST="${OUT_DIR:-$ROOT/dist}"

echo "→ Docker build: $PLATFORM, model=$MODEL_PATH"
echo "→ Output dir:   $DIST"

# BuildKit is required for --output type=local and --platform cross-builds.
if ! docker buildx version >/dev/null 2>&1; then
  echo "ERROR: docker buildx is required. Install Docker Desktop or the" >&2
  echo "       docker-buildx-plugin package, then enable buildkit:" >&2
  echo "       docker buildx create --use" >&2
  exit 1
fi

# `docker buildx build` with `--output type=local` writes the artifact
# directory from the named stage directly into ./dist on the host. No
# intermediate container run, no scratch-image hack.
docker buildx build \
  --platform "$PLATFORM" \
  --build-arg "MODEL_PATH=$MODEL_PATH" \
  --target release \
  --output "type=local,dest=$DIST" \
  -f Dockerfile \
  .

BIN="$DIST/match_scorer/match_scorer"
if [[ ! -x "$BIN" ]]; then
  echo "ERROR: $BIN not produced. Did .dockerignore exclude too much?" >&2
  exit 1
fi

echo ""
echo "✓ Built: $BIN"
echo ""
echo "Smoke test (--self-test on the host):"
if "$DIST/match_scorer/match_scorer" --self-test 2>&1 | tee "$DIST/.smoke.log"; then
  echo ""
  echo "✓ Smoke test passed."
  echo ""
  echo "Deploy: copy $DIST/match_scorer/ to your server and spawn the binary directly."
else
  echo ""
  echo "✗ Smoke test FAILED — see $DIST/.smoke.log" >&2
  exit 1
fi