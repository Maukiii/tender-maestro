"""
In-memory log queue for streaming backend logs to the browser.

Usage:
    Call install() once at startup (before importing routers) to attach
    the queue handler to the root logger.  The /logs/stream SSE endpoint
    then drains the queue in real time.
"""
from __future__ import annotations

import asyncio
import logging


_log_queue: asyncio.Queue[str] = asyncio.Queue(maxsize=500)


class _QueueHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        line = self.format(record)
        try:
            _log_queue.put_nowait(line)
        except asyncio.QueueFull:
            pass  # drop when full; never block application code


def get_queue() -> asyncio.Queue[str]:
    return _log_queue


def install(level: int = logging.INFO) -> None:
    """Attach the queue handler to the root logger. Call once at startup."""
    handler = _QueueHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)-8s %(name)s — %(message)s",
        datefmt="%H:%M:%S",
    ))
    logging.getLogger().addHandler(handler)
    logging.getLogger().setLevel(level)
