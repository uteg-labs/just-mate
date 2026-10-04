# exports the best v3 run (checkpoints/model_v3.pt + its cfg from reports/train_experiments_v3.json,
# best run first) to the graph match_scorer_server.py feeds:
# target_emb (B, 1536), self_emb (B, 1536), soft_jacc (B, 1) -> score (B,) in [0, 1].
# also writes the .json model card release_models.sh uploads, then checks torch/onnxruntime parity.
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
import torch.nn as nn
from train_experiments_v3 import CKPT_DIR, ENCODER_INPUT_DIM, ML_DIR, AsymmetricCompatModel

OPSET = 17
INPUTS = ["target_emb", "self_emb", "soft_jacc"]
OUTPUT = "score"


class Scorer(nn.Module):
    def __init__(self, model: AsymmetricCompatModel):
        super().__init__()
        self.model = model

    def forward(self, target_emb, self_emb, soft_jacc):
        return self.model.score(target_emb, self_emb, soft_jacc)


def load_best_run(report_path: Path) -> dict:
    return json.loads(report_path.read_text())[0]


def build_model(cfg: dict, pt_path: Path) -> AsymmetricCompatModel:
    if not cfg["use_soft_jaccard"]:
        raise SystemExit(f"{cfg['name']} has no soft_jacc input; the scorer server needs one")
    model = AsymmetricCompatModel(
        encoder_hidden=tuple(cfg["encoder_hidden"]),
        head_hidden=tuple(cfg["head_hidden"]),
        encoder_dropout=cfg["encoder_dropout"],
        head_dropout=cfg["head_dropout"],
        n_extras=1,
    )
    state = torch.load(pt_path, map_location="cpu")
    model.encoder.load_state_dict(state["encoder"])
    model.head.load_state_dict(state["head"])
    return model.eval()


def random_inputs(batch: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    gen = torch.Generator().manual_seed(0)
    return (
        torch.randn(batch, ENCODER_INPUT_DIM, generator=gen),
        torch.randn(batch, ENCODER_INPUT_DIM, generator=gen),
        torch.rand(batch, 1, generator=gen),
    )


def export(scorer: Scorer, onnx_path: Path) -> None:
    torch.onnx.export(
        scorer,
        random_inputs(2),
        str(onnx_path),
        input_names=INPUTS,
        output_names=[OUTPUT],
        dynamic_axes={**{name: {0: "batch"} for name in INPUTS}, OUTPUT: {0: "batch"}},
        opset_version=OPSET,
    )


def check_parity(scorer: Scorer, onnx_path: Path) -> float:
    inputs = random_inputs(64)
    with torch.no_grad():
        expected = scorer(*inputs).numpy()
    sess = ort.InferenceSession(str(onnx_path))
    actual = sess.run(None, {name: t.numpy() for name, t in zip(INPUTS, inputs)})[0]
    np.testing.assert_allclose(actual, expected, rtol=1e-4, atol=1e-5)
    return float(np.abs(actual - expected).max())


def write_card(onnx_path: Path, pt_path: Path, best: dict) -> None:
    card = {
        "name": best["cfg"]["name"],
        "source": pt_path.name,
        "opset": OPSET,
        "inputs": {"target_emb": [None, ENCODER_INPUT_DIM], "self_emb": [None, ENCODER_INPUT_DIM],
                   "soft_jacc": [None, 1]},
        "output": {OUTPUT: [None]},
        "cfg": best["cfg"],
        "val": best["best_extras"],
    }
    onnx_path.with_suffix(".json").write_text(json.dumps(card, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pt", type=Path, default=CKPT_DIR / "model_v3.pt")
    parser.add_argument("--onnx", type=Path, default=CKPT_DIR / "model_v3_best.onnx")
    parser.add_argument("--report", type=Path,
                        default=ML_DIR / "reports" / "train_experiments_v3.json")
    args = parser.parse_args()

    best = load_best_run(args.report)
    scorer = Scorer(build_model(best["cfg"], args.pt)).eval()
    export(scorer, args.onnx)
    max_diff = check_parity(scorer, args.onnx)
    write_card(args.onnx, args.pt, best)
    print(f"wrote {args.onnx} ({best['cfg']['name']}), parity max |diff| = {max_diff:.2e}")


if __name__ == "__main__":
    main()
