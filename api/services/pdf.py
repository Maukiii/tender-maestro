"""PDF upload storage and text extraction."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/tender-maestro-uploads"))


def _ensure_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_upload(content: bytes, filename: str) -> str:
    """Save raw bytes to disk and return a unique document ID."""
    _ensure_dir()
    doc_id = str(uuid.uuid4())
    ext = Path(filename).suffix or ".pdf"
    (UPLOAD_DIR / f"{doc_id}{ext}").write_bytes(content)
    return doc_id


def get_upload_path(doc_id: str) -> Path | None:
    """Return the file path for a previously saved document, or None."""
    _ensure_dir()
    for path in UPLOAD_DIR.iterdir():
        if path.stem == doc_id:
            return path
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
