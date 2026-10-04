#!/usr/bin/env bash
# Release the current ONNX checkpoints as a GitHub release asset set.
#
# Why a local script (and not a workflow):
#   ml/checkpoints/*.onnx is gitignored — the runner would not see the
#   files. The training pipeline produces them locally (notebook or
#   scripts/train_* + scripts/export_v3_onnx.py), so the upload has to
#   happen from the same machine that produced them.
#
# Usage:
#   bash ml/scripts/release_models.sh                       # tag = ml-models@<date>
#   bash ml/scripts/release_models.sh ml-models@1.0.0      # explicit tag
#   bash ml/scripts/release_models.sh --draft ml-models@1.0.0  # draft release (no notify)
#
# After running this:
#   - docker compose up --build   (set MODEL_RELEASE_TAG to the same value)
#   - или передай --build-arg MODEL_RELEASE_TAG=<tag> в docker build
#
# Required: gh CLI authenticated (gh auth status) and write access to the repo.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# --- arg parsing ---
DRAFT="false"
TAG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft) DRAFT="true"; shift ;;
    --help|-h) sed -n '2,30p' "$0"; exit 0 ;;
    -*) echo "unknown flag: $1" >&2; exit 1 ;;
    *) TAG="$1"; shift ;;
  esac
done

if [ -z "$TAG" ]; then
  TAG="ml-models@$(date -u +%Y.%m.%d-%H%M)"
  echo "→ no tag given, using $TAG"
fi

if [[ "$TAG" != ml-models@* ]]; then
  echo "ERROR: tag must start with 'ml-models@', got: $TAG" >&2
  exit 1
fi

# --- required files ---
ASSETS=(
  checkpoints/model_v3_best.onnx
  checkpoints/model_v3_best.json
  checkpoints/interest_matcher.onnx
  checkpoints/interest_matcher.json
  data/interest_embeddings.npz
  data/interest_index.json
)

missing=()
for f in "${ASSETS[@]}"; do
  if [ ! -s "$ROOT/$f" ]; then
    missing+=("$f")
  fi
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: missing or empty files in ml/checkpoints/:" >&2
  for f in "${missing[@]}"; do echo "  - $f" >&2; done
  echo "" >&2
  echo "Run your training pipeline first. Typical flow:" >&2
  echo "  python ml/scripts/train_experiments_v3.py   # → checkpoints/model_v3.pt" >&2
  echo "  python ml/scripts/export_v3_onnx.py         # → checkpoints/model_v3_best.{onnx,json}" >&2
  exit 1
fi

# --- smoke-test the model before publishing ---
echo "→ smoke-testing the local model…"
if ! .venv/bin/python scripts/match_scorer.py checkpoints/model_v3_best.onnx --self-test 2>&1 \
    | tee logs/"$TAG"-smoke.log; then
  echo "ERROR: match_scorer --self-test failed; refusing to publish." >&2
  exit 1
fi

# --- tag + push ---
echo "→ creating local tag"
git tag "$TAG"

REMOTE_EXISTS=$(git ls-remote --tags origin "$TAG" | wc -l | tr -d ' ')
if [ "$REMOTE_EXISTS" = "0" ]; then
  echo "→ pushing tag to origin"
  git push origin "$TAG"
else
  echo "→ tag $TAG already exists on origin; will reuse the release"
fi

# --- create or update the release ---
ARGS=(
  "$TAG"
  --title "$TAG"
  --generate-notes
  "${ASSETS[@]/#/$ROOT/}"
)
if [ "$DRAFT" = "true" ]; then
  ARGS+=(--draft)
fi

# `gh release create` fails if release exists; fall back to upload.
if gh release view "$TAG" >/dev/null 2>&1; then
  echo "→ release $TAG exists, uploading assets only"
  gh release upload "$TAG" "${ASSETS[@]/#/$ROOT/}" --clobber
else
  echo "→ creating release $TAG"
  gh release create "${ARGS[@]}"
fi

cat <<EOF

✓ Released $TAG
  assets: ${ASSETS[*]}

Next:
  1. Set MODEL_RELEASE_TAG=$TAG in docker-compose.yml under scorer.build.args
     (or pass --build-arg MODEL_RELEASE_TAG=$TAG to docker build)
  2. docker compose up --build
EOF