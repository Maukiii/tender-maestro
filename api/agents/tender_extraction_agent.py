"""
Tender Extraction Agent

Reads an uploaded tender document and uses Claude to extract structured
information: title, client, budget, deadline, requirements, certifications,
languages, and a plain-language summary.
"""
from __future__ import annotations

import json
from pathlib import Path

from services.ai import generate_text


EXTRACTION_PROMPT = """Task: Extract structured information from the attached tender document and return it as a JSON object.

Requirements:
- Create a valid JSON object with snake_case keys.
- Extract all data points visible in the document.
- Numbers as Number, Booleans as Boolean, lists as Array.
- Output ONLY the JSON. No explanations, no markdown fences.

JSON schema (use null for fields not found in the document):
{
  "title": "tender/project title",
  "client": "contracting authority name",
  "reference": "tender reference number or null",
  "deadline": "submission deadline as a string or null",
  "budget_eur": budget as integer in EUR or null,
  "duration_months": contract duration as integer or null,
  "topic_areas": ["list of main topic / domain areas"],
  "required_certifications": ["e.g. ISO 27001"] or [],
  "required_languages": ["EN", "DE", ...],
  "requires_primary_fieldwork": true or false,
  "key_requirements": ["bullet list of main technical / methodological requirements"],
  "evaluation_criteria": ["list of award criteria if stated"] or [],
  "summary": "2-3 sentence plain-language summary of what is being procured"
}"""


async def run_tender_extractor_agent(file_path: Path) -> dict:
    """
    Extract structured information from a tender document.

    Args:
        file_path: Path to the tender file (PDF, DOCX, etc.).

    Returns:
        Dict with structured tender information.

    Raises:
        RuntimeError: If the file cannot be read or the AI returns invalid JSON.
        ValueError:   If no text can be extracted from the file.
    """
    text = _read_file(file_path)

    if not text.strip():
        raise ValueError(f"No text could be extracted from '{file_path.name}'")

    user_msg = EXTRACTION_PROMPT + "\n\nTENDER DOCUMENT:\n" + text[:12000]

    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        max_tokens=2048,
    )

    return _parse_json(raw, agent="tender_extraction_agent")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _read_file(path: Path) -> str:
    """Extract plain text from a supported file format."""
    ext = path.suffix.lower()

    if ext == ".pdf":
        try:
            import pdfplumber
            with pdfplumber.open(path) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            raise RuntimeError(f"Could not read PDF '{path.name}': {e}") from e

    if ext == ".docx":
        try:
            from docx import Document
            return "\n".join(p.text for p in Document(path).paragraphs)
        except Exception as e:
            raise RuntimeError(f"Could not read DOCX '{path.name}': {e}") from e

    if ext in (".txt", ".md", ".csv"):
        return path.read_text(encoding="utf-8", errors="replace")

    raise ValueError(f"Unsupported file type for extraction: '{ext}'")


def _parse_json(raw: str, agent: str) -> dict:
    """Parse AI response as JSON, stripping accidental markdown fences."""
    clean = raw.strip()
    if clean.startswith("```"):
        parts = clean.split("```")
        inner = parts[1]
        if inner.startswith("json"):
            inner = inner[4:]
        clean = inner.strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"{agent} returned invalid JSON: {e}\nRaw output (first 400 chars): {raw[:400]}"
        ) from e
