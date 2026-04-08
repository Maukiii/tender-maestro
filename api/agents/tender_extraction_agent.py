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


EXTRACTION_PROMPT = """Serve as a Senior EU Procurement Specialist with expertise in analyzing European Commission (DG CNECT) tenders. Your task is to fully capture the attached text (“Tender Specifications”) and create a highly detailed, technically accurate summary in a valid JSON format.

IMPORTANT INSTRUCTIONS FOR DATA EXTRACTION:
1. COMPLETENESS: Do not summarize lists loosely. Include all specific sub-items related to tasks, technical requirements, and minimum personnel requirements.
2. THRESHOLD VALUES: Extract all hard numbers (minimum turnover, years of professional experience, deadlines in months, weighting in percent).
3. TERMINOLOGY: Maintain official EU terminology (e.g., “Selection Criteria,” “Award Criteria,” “Deliverables,” “GPAI,” “AI Act Annex III”).
4. NO AGGREGATION: If a document has a very large number of pages (70+), I expect dozens of entries in the JSON file’s arrays. Do not reduce complex sections to a single sentence.

STRUCTURE OF THE JSON OBJECT:
The JSON must follow exactly the following hierarchy:

{
  “tender_metadata”: {
    “title”: “”,
    “reference_number”: “”,
    “contracting_authority”: “”,
    “estimated_value_euro”: 0,
    “initial_duration_months”: 0,
    “extension_options_months”: 0,
    “procedure_type”: “”,
    “submission_deadline”: “”
  },
  “strategic_context”: {
    “background_and_policy_context”: “”,
    “core_objectives”: []
  },
  “operational_scope”: {
    “tasks”: [
       { “task_id”: “”, “title”: “”, “detailed_description”: ‘’, “sub_tasks”: [] }
    ],
    “technical_methodology_requirements”: []
  },
  “deliverables”: [
    { “id”: “”, “title”: “”, “description”: “”, “delivery_month”: “”, ‘frequency’: “” }
  ],
  “resource_requirements”: {
    “team_profiles”: [
      { “role”: “”, ‘minimum_requirements_years_exp’: 0, “specific_expertise_required”: [] }
    ],
    “subcontracting_rules”: “”
  },
  “compliance_and_selection”: {
    “financial_economic_capacity”: { “min_turnover_required”: 0, ‘other_requirements’: “” },
    “technical_professional_capacity”: { “reference_projects_required”: 0, ‘reference_details’: “” }
    “required_reference_details_structure”: {"mandatory_fields": [
      "contract_value_euro",
      "contracting_authority_client",
      "period_of_performance_start_end",
      "description_of_deliverables",
      "contact_details_for_verification"
    ],
    "content_proof_requirements": [
      "comparable_contract_size_complexity",
      "large_scale_data_collection_evidence",
      "eu_digital_policy_experience"
    ]}
  },
  “evaluation_logic”: {
    “quality_price_ratio”: “”,
    “technical_award_criteria”: [
       { “criterion”: “”, “max_points”: 0, “weight”: “”, ‘detailed_evaluation_logic’: “” }
    ],
    “price_weight”: “”
  },
  “submission_logistics”: {
    “required_documents”: [],
    “page_limits”: { ‘technical_offer’: 0, “total_annexes”: 0 },
    “submission_platform”: “”
  }
}

OUTPUT RULES:
- Respond ONLY with the JSON string.
- No introduction (“Here is the summary...”).
- No Markdown code blocks (no backticks ```).
- Ensure that the JSON is valid and all special characters are correctly escaped.
- Parse the document step by step to avoid overlooking information in the middle and at the end of the document."""


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
        max_tokens=8192,
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
