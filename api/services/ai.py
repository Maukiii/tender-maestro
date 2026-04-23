"""
Model-agnostic AI service.

Reads AI_PROVIDER from the environment (default: anthropic).
Supports: anthropic | openai
"""
from __future__ import annotations

import os
from typing import AsyncGenerator


def _provider() -> str:
    return os.getenv("AI_PROVIDER", "anthropic").lower()


async def stream_text(
    messages: list[dict],
    system: str = "",
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """Yield text chunks from the configured AI provider."""
    provider = _provider()
    if provider == "anthropic":
        async for chunk in _stream_anthropic(messages, system, max_tokens):
            yield chunk
    elif provider == "openai":
        async for chunk in _stream_openai(messages, system, max_tokens):
            yield chunk
    else:
        raise ValueError(
            f"Unknown AI_PROVIDER: '{provider}'. Set AI_PROVIDER to 'anthropic' or 'openai' in api/.env"
        )


async def generate_text(
    messages: list[dict],
    system: str = "",
    max_tokens: int = 4096,
) -> str:
    """Collect the full streamed response into a single string."""
    chunks: list[str] = []
    async for chunk in stream_text(messages, system, max_tokens):
        chunks.append(chunk)
    return "".join(chunks)


# ── Anthropic ─────────────────────────────────────────────────────────────────

async def _stream_anthropic(
    messages: list[dict],
    system: str,
    max_tokens: int,
) -> AsyncGenerator[str, None]:
    try:
        import anthropic
    except ImportError:
        raise RuntimeError(
            "anthropic package not installed. Run: pip install anthropic"
        )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add it to api/.env"
        )

    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    client = anthropic.AsyncAnthropic(api_key=api_key, timeout=120.0)

    kwargs: dict = dict(model=model, max_tokens=max_tokens, messages=messages)
    if system:
        kwargs["system"] = system

    try:
        async with client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text
    except anthropic.APIStatusError as e:
        body = getattr(e, "body", None)
        if isinstance(body, dict):
            msg = body.get("error", {}).get("message", str(e))
        else:
            msg = str(e)
        raise RuntimeError(msg)


# ── OpenAI ────────────────────────────────────────────────────────────────────

async def _stream_openai(
    messages: list[dict],
    system: str,
    max_tokens: int,
) -> AsyncGenerator[str, None]:
    try:
        from openai import AsyncOpenAI
    except ImportError:
        raise RuntimeError(
            "openai package not installed. Run: pip install openai"
        )

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to api/.env"
        )

    model = os.getenv("OPENAI_MODEL", "gpt-4o")
    client = AsyncOpenAI(api_key=api_key, timeout=120.0)

    all_messages: list[dict] = []
    if system:
        all_messages.append({"role": "system", "content": system})
    all_messages.extend(messages)

    stream = await client.chat.completions.create(
        model=model,
        messages=all_messages,  # type: ignore[arg-type]
        max_tokens=max_tokens,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
