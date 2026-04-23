"""SSE endpoint for streaming backend log lines to the browser."""
from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from services.log_queue import get_queue

router = APIRouter()


@router.get("/logs/stream", tags=["System"])
async def stream_logs():
    """
    Server-Sent Events stream of backend log lines.

    Each event is: data: {"type": "log", "line": "..."}\n\n

    The browser's EventSource reconnects automatically on drop.
    """
    async def event_stream():
        q = get_queue()
        while True:
            line = await q.get()
            yield f"data: {json.dumps({'type': 'log', 'line': line})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
