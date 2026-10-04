from __future__ import annotations


def test_imports():
    import numpy
    import onnx
    import onnxruntime
    import openai  # noqa: F401
    import torch

    assert numpy.__version__ == "1.26.4", numpy.__version__
    assert torch.__version__ == "2.4.0", torch.__version__
    assert onnx.__version__ == "1.17.0", onnx.__version__
    assert onnxruntime.__version__ == "1.19.2", onnxruntime.__version__


def test_package_importable():
    from just_mate_ml.data import embed

    assert embed.EMBEDDING_DIM == 1536
