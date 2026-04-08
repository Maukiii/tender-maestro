"""
Knowledge Base Parser

Parses the company knowledge base (documents/kb/) using the existing
company_information_parsing pipeline and returns a structured profile
for use by the scoring agent.

The parsed result is cached in memory after the first call; the KB
rarely changes while the server is running.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

# Add company_information_parsing/src to sys.path so we can import kb_ingestion.
_API_DIR = Path(__file__).parent.parent
_KIP_SRC = _API_DIR / "company_information_parsing" / "src"
if str(_KIP_SRC) not in sys.path:
    sys.path.insert(0, str(_KIP_SRC))

from kb_ingestion.ingest import parse_folder              # noqa: E402
from kb_ingestion.structured import build_standardized_output  # noqa: E402

KB_DIR = Path(os.getenv("KB_DIR", str(_API_DIR.parent / "documents" / "kb")))

_CACHE: dict[str, Any] | None = None


def load_kb_profile(force_reload: bool = False) -> dict[str, Any]:
    """
    Parse the knowledge base and return a structured company profile.

    The result is cached in memory after the first successful parse.
    Pass force_reload=True to re-parse (e.g. after KB files are updated).

    Returns a dict with keys: company_documents, methodology_documents, team_cvs.
    On error, returns {"error": "<message>"}.
    """
    global _CACHE
    if _CACHE is not None and not force_reload:
        return _CACHE

    if not KB_DIR.exists():
        return {"error": f"Knowledge base directory not found: {KB_DIR}"}

    try:
        entries = parse_folder(KB_DIR)
        profile = build_standardized_output(entries)
        _CACHE = profile
        return profile
    except Exception as e:
        return {"error": f"Failed to parse knowledge base: {e}"}


def kb_profile_as_text(profile: dict[str, Any], max_chars: int = 8000) -> str:
    """
    Serialise the KB profile to JSON text, truncated to max_chars so it
    fits within the scoring agent's token budget.
    """
    text = json.dumps(profile, indent=2, ensure_ascii=False, default=str)
    if len(text) > max_chars:
        text = text[:max_chars] + "\n... [truncated]"
    return text
