# syntax=docker/dockerfile:1.7
#
# Containerized build for the standalone `match_scorer` binary.
# Output: ./dist/match_scorer/{match_scorer, checkpoints/, _internal/}
# Run via BuildKit `--output type=local,dest=./dist` so we never have to
# `docker run` a scratch image just to copy artifacts out.
#
# Usage:
#   docker buildx build \
#     --platform linux/amd64 \
#     --output type=local,dest=./dist \
#     .
#
# Or via the helper script:
#   bash scripts/build_match_scorer_docker.sh
#
# Override the bundled model with --build-arg MODEL_PATH=checkpoints/x.onnx
# Override Python with --build-arg PYTHON_VERSION=3.12

ARG PYTHON_VERSION=3.12

# ----------------------------------------------------------------------------
# Stage 1: builder — full Python toolchain + PyInstaller
# ----------------------------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim AS builder

WORKDIR /build

# gcc is only a fallback: numpy / onnxruntime ship manylinux wheels, but pip
# still wants a compiler on hand for any source-only transitive dep that
# might be missing a binary wheel.
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# Runtime + build deps. Versions pinned to match ml/pyproject.toml so the
# build is reproducible against uv.lock.
RUN pip install --no-cache-dir \
    'numpy==1.26.4' \
    'onnxruntime==1.19.2' \
    'pyinstaller>=6.10'

# Scorer source + bundled model.
# .dockerignore limits the build context to scripts/ and checkpoints/*.onnx.
COPY scripts/    scripts/
COPY checkpoints/ checkpoints/

# Build the standalone binary.
ARG MODEL_PATH=checkpoints/model_v0.onnx
RUN pyinstaller \
    --name match_scorer \
    --onedir \
    --noconfirm \
    --clean \
    --strip \
    --collect-data onnxruntime \
    --copy-metadata onnxruntime \
    --hidden-import onnxruntime.capi._pybind_state \
    --hidden-import onnxruntime.backend \
    --hidden-import onnxruntime.backend.adapters \
    --add-data "${MODEL_PATH}:checkpoints" \
    scripts/match_scorer.py

# Verify the bundle is internally consistent before we copy it out.
# Without this, a broken build propagates to the deploy host and fails there.
RUN ./dist/match_scorer/match_scorer --help >/dev/null || \
    (echo "ERROR: built binary failed self-check" >&2 && exit 1)

# ----------------------------------------------------------------------------
# Stage 2: release — empty scratch image carrying only the build artifact.
# Used purely as an export target for `--output type=local`; not runnable.
# ----------------------------------------------------------------------------
FROM scratch AS release

COPY --from=builder /build/dist/match_scorer /match_scorer