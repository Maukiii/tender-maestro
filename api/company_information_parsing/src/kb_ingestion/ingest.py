from __future__ import annotations

from pathlib import Path
from typing import Any

from .config import SUPPORTED_EXTENSIONS, normalize_category
from .parsers import PARSERS, TEXT_EXTRACTORS


def _category_from_path(file_path: Path, kb_path: Path) -> str:
    relative = file_path.relative_to(kb_path)
    if len(relative.parts) > 1:
        return normalize_category(relative.parts[0])
    return "uncategorized"


def parse_folder(kb_path: Path) -> list[dict[str, Any]]:
    kb: list[dict[str, Any]] = []
    print(f"Parsing folder: {kb_path}\n")

    for path in kb_path.rglob("*"):
        if not path.is_file():
            continue
        if path.name.startswith("~$"):
            continue
        if path.stem.lower() == "readme":
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        parser = PARSERS[path.suffix.lower()]
        category = _category_from_path(path, kb_path)

        try:
            chunks = parser(path)
            raw_text = TEXT_EXTRACTORS[path.suffix.lower()](path)
            kb.append(
                {
                    "id": f"{category}:{path.stem}",
                    "category": category,
                    "source": str(path),
                    "num_chunks": len(chunks),
                    "chunks": chunks,
                    "raw_text": raw_text,
                }
            )
            print(f"[OK] {path.name} ({len(chunks)} chunks) -> {category}")
        except Exception as exc:
            print(f"[ERROR] {path.name}: {exc}")

    return kb

