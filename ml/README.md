# ml — compatibility scoring (stretch)

Not on the M0 critical path. Today `/score` serves the same explainable baseline as `server/src/compat.ts`; the Shared Encoder + Match Head from [`docs/ML-MATCHING.md`](../docs/ML-MATCHING.md) replace it behind the same endpoint (file layout: §13).

```bash
uv sync
uv run fastapi dev src/just_mate_ml/serve/app.py --port 8000
uv run pytest
uv run ruff check
```
