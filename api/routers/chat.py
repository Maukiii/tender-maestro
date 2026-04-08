import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest
from services import ai

router = APIRouter()


@router.post("/chat/stream")
async def stream_chat(request: ChatRequest):
    """
    Streams Server-Sent Events:
      data: {"type": "chunk", "content": "..."}
      data: {"type": "done"}
      data: {"type": "error", "message": "..."}
    """
    system = (
        "You are an AI assistant helping to write and improve a tender proposal. "
        "When the user provides selected content (marked with <selected_content>), "
        "apply their instruction directly to that content. "
        "If the instruction is to edit, rewrite, shorten, improve, or modify the content, "
        "output ONLY the revised markdown — no preamble, no explanation. "
        "If the instruction is a question or discussion, answer concisely. "
        "Use markdown for formatting."
    )

    # Build context string from selection if provided
    context_part = ""
    if request.context:
        ctx = request.context
        label = ctx.sectionLabel or ctx.blockTitle or "selected text"
        context_part = (
            f"\n\n<selected_content label=\"{label}\">\n"
            f"{ctx.text}\n"
            f"</selected_content>"
        )

    # Build message history
    messages: list[dict] = [
        {"role": m.role, "content": m.content}
        for m in (request.history or [])
    ]
    messages.append({"role": "user", "content": f"{request.message}{context_part}"})

    async def event_stream():
        try:
            async for chunk in ai.stream_text(messages=messages, system=system):
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
