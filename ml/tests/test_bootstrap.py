"""Smoke test that all critical imports work and the C++ toolchain is on disk.

Adapted from docs/ml/specs/01-bootstrap.md to also probe macOS Homebrew paths
(/opt/homebrew/include and /opt/homebrew/opt/<pkg>/include) in addition to the
Linux paths (/usr/include, /usr/local/include) that the spec covers.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def _candidate_include_roots() -> list[str]:
    """Search roots for C++ headers. Order: Homebrew formulae prefixes first
    (more specific), then Homebrew include, then Linux defaults."""
    roots: list[str] = []
    for pkg in ("onnxruntime", "nlohmann-json"):
        prefix = shutil.which(f"brew") and subprocess.run(
            ["brew", "--prefix", pkg],
            capture_output=True,
            text=True,
            check=False,
        ).stdout.strip()
        if prefix:
            roots.append(f"{prefix}/include")
    roots += [
        "/opt/homebrew/include",
        "/usr/local/include",
        "/usr/include",
    ]
    # de-dup, preserve order
    seen: set[str] = set()
    return [r for r in roots if r and not (r in seen or seen.add(r))]


def test_imports():
    from importlib import metadata

    import torch
    import onnx
    import onnxruntime
    import pgvector
    import openai
    import psycopg

    assert torch.__version__ == "2.4.0", torch.__version__
    assert onnx.__version__ == "1.17.0", onnx.__version__
    assert onnxruntime.__version__ == "1.19.2", onnxruntime.__version__
    # pgvector doesn't expose __version__; check via package metadata instead.
    assert metadata.version("pgvector") == "0.3.6"


def test_cpp_toolchain():
    """Required C++ headers must be on disk before T11."""
    roots = _candidate_include_roots()
    assert roots, "no include roots to search"

    missing: list[str] = []
    for needle in ("nlohmann/json.hpp", "onnxruntime/onnxruntime_cxx_api.h"):
        cmd = ["find", *roots, "-name", Path(needle).name, "-path", f"*{needle.rsplit('/', 1)[0]}*"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        hits = [line for line in result.stdout.splitlines() if needle in line]
        if not hits:
            missing.append(needle)

    assert not missing, (
        "missing C++ headers required for T11:\n  - "
        + "\n  - ".join(missing)
        + "\nsearched: " + ", ".join(roots)
    )


def test_cmake_and_compiler():
    cmake = shutil.which("cmake")
    compiler = shutil.which("clang++") or shutil.which("g++")
    assert cmake is not None, "cmake not on PATH (brew install cmake)"
    assert compiler is not None, "no C++ compiler on PATH"