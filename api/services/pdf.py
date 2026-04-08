"""PDF upload storage, score persistence, and text extraction."""
from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

# Tenders are stored here so they persist and can be listed.
# Default: documents/tenders/ relative to the project root (three levels up from this file).
TENDER_DIR = Path(
    os.getenv("TENDER_DIR", str(Path(__file__).parent.parent.parent / "documents" / "tenders"))
)


def _ensure_dir() -> None:
    TENDER_DIR.mkdir(parents=True, exist_ok=True)


def _safe_filename(name: str) -> str:
    """Strip unsafe characters, keeping alphanumeric, dash, underscore, dot."""
    return re.sub(r"[^a-zA-Z0-9._-]", "_", name) or "tender.pdf"


def save_upload(content: bytes, filename: str) -> str:
    """Save raw bytes to documents/tenders/ and return a unique document ID."""
    _ensure_dir()
    doc_id = str(uuid.uuid4())
    safe_name = _safe_filename(filename)
    (TENDER_DIR / f"{doc_id}_{safe_name}").write_bytes(content)
    return doc_id


def get_upload_path(doc_id: str) -> Path | None:
    """Return the file path for a previously saved document, or None."""
    _ensure_dir()
    for path in TENDER_DIR.iterdir():
        if path.is_file() and path.name.startswith(doc_id + "_"):
            return path
    return None


def list_tenders() -> list[dict]:
    """Return metadata (+ score if available) for all tenders, newest first."""
    _ensure_dir()
    result = []
    for path in sorted(TENDER_DIR.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not path.is_file():
            continue
        # Skip JSON sidecar files (score, tender data)
        if path.name.endswith("_score.json") or path.name.endswith("_tender.json"):
            continue
        parts = path.name.split("_", 1)
        if len(parts) != 2:
            continue
        doc_id, original_name = parts
        mtime = path.stat().st_mtime
        result.append({
            "id": doc_id,
            "filename": original_name,
            "uploadedAt": datetime.fromtimestamp(mtime).isoformat(),
            "score": load_score(doc_id),
        })
    return result


def save_tender_data(doc_id: str, tender_data: dict[str, Any]) -> None:
    """Persist the tender extraction result as a JSON sidecar file."""
    _ensure_dir()
    (TENDER_DIR / f"{doc_id}_tender.json").write_text(
        json.dumps(tender_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_tender_data(doc_id: str) -> dict[str, Any] | None:
    """Load a previously extracted tender, or None if not available."""
    data_file = TENDER_DIR / f"{doc_id}_tender.json"
    if not data_file.exists():
        return None
    try:
        return json.loads(data_file.read_text(encoding="utf-8"))
    except Exception:
        return None


def save_score(doc_id: str, score_data: dict[str, Any]) -> None:
    """Persist a scoring result as a JSON sidecar file."""
    _ensure_dir()
    (TENDER_DIR / f"{doc_id}_score.json").write_text(
        json.dumps(score_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_score(doc_id: str) -> dict[str, Any] | None:
    """Load a previously saved scoring result, or None if not yet scored."""
    score_file = TENDER_DIR / f"{doc_id}_score.json"
    if not score_file.exists():
        return None
    try:
        return json.loads(score_file.read_text(encoding="utf-8"))
    except Exception:
        return None


def extract_text(path: Path) -> str:
    """Extract all text from a PDF using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        raise RuntimeError(
            "pdfplumber not installed. Run: pip install pdfplumber"
        )

    pages: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    return "\n\n".join(pages)
