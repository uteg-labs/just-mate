"""Run match_scorer and interest_matcher in one process, on separate ports.

Used as the container CMD so both HTTP servers live in a single image and
share the Python + numpy + onnxruntime dependency stack. Each runs in its
own ThreadingHTTPServer thread; signal handling fans SIGTERM/SIGINT to both.

Layout in the container:

    match_scorer  →  0.0.0.0:8000   (default MATCH_SCORER_PORT)
    interest_matcher → 0.0.0.0:8001  (default INTEREST_MATCHER_PORT)

Override ports via env: MATCH_SCORER_PORT=9000 INTEREST_MATCHER_PORT=9001.
"""
from __future__ import annotations

import argparse
import logging
import os
import signal
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import Callable

# Ensure both server modules can be imported regardless of CWD (the
# Dockerfile sets WORKDIR /app; this also keeps `python scripts/run_servers.py`
# from the repo root working).
_HERE = Path(__file__).resolve().parent
if str(_HERE) not in __import__("sys").path:
    import sys as _sys
    _sys.path.insert(0, str(_HERE))


def _spawn(name: str, factory: Callable[[], ThreadingHTTPServer]) -> ThreadingHTTPServer:
    server = factory()
    t = threading.Thread(target=server.serve_forever, name=name, daemon=True)
    t.start()
    return server


def main() -> None:
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "info").upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    log = logging.getLogger("run_servers")

    parser = argparse.ArgumentParser(description="Run both ML HTTP servers in one process.")
    parser.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    parser.add_argument("--match-scorer-port", type=int,
                        default=int(os.environ.get("MATCH_SCORER_PORT", "8000")))
    parser.add_argument("--interest-matcher-port", type=int,
                        default=int(os.environ.get("INTEREST_MATCHER_PORT", "8001")))
    args = parser.parse_args()

    # Lazy imports — both modules do work at import time (logging.basicConfig,
    # module-level constants), and we want logs in a known order.
    from match_scorer_server import build_server as build_ms
    from interest_matcher_server import build_server as build_im

    log.info("booting match_scorer on %s:%d", args.host, args.match_scorer_port)
    ms = _spawn("match_scorer", lambda: build_ms(args.host, args.match_scorer_port))

    log.info("booting interest_matcher on %s:%d", args.host, args.interest_matcher_port)
    im = _spawn("interest_matcher", lambda: build_im(args.host, args.interest_matcher_port))

    log.info("both servers up")
    stop = threading.Event()

    def _shutdown(*_: object) -> None:
        log.info("signal received — shutting down both servers")
        ms.shutdown()
        im.shutdown()
        stop.set()

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)
    stop.wait()

    ms.server_close()
    im.server_close()
    log.info("done")


if __name__ == "__main__":
    main()