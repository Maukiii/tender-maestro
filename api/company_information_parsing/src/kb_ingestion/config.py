from pathlib import Path

CHUNK_SIZE = 500

SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".xlsx",
    ".md",
    ".txt",
}

# Top-level folder name in documents/kb -> normalized category name
CATEGORY_ALIASES = {
    "team_cvs": "team_cv",
    "cvs": "team_cv",
    "company": "company_info",
    "company_info": "company_info",
    "past_tenders": "past_tenders",
    "methodology": "methodology",
    "certifications": "certifications",
    "references": "references",
}


def normalize_category(folder_name: str) -> str:
    return CATEGORY_ALIASES.get(folder_name.lower(), folder_name.lower())


def default_kb_path(base_dir: Path) -> Path:
    return base_dir / "documents" / "kb"

