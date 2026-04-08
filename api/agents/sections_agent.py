"""
Sections Agent

Fills all proposal sections except Team and Pricing:
  - Executive Summary
  - Problem Framing
  - Proposed Methodology
  - Workplan & Deliverables
"""
from __future__ import annotations

import json
from typing import Any

from services.ai import generate_text

# ── System prompt — edit this to change the agent's behaviour ─────────────────

SYSTEM_PROMPT = """You are a Senior Proposal Writer at Meridian Intelligence GmbH.
Your task is to fill four sections of a tender proposal:
  1. Executive Summary   (section_id: "exec-summary")
  2. Problem Framing     (section_id: "problem-framing")
  3. Proposed Methodology (section_id: "methodology")
  4. Workplan & Deliverables (section_id: "workplan")

Write in a professional, concise EU-tender style.
Tailor every section to the specific tender requirements provided.
Draw on Meridian's WebMap pipeline, OSINT/NLP capabilities, ISO 27001 compliance,
and relevant past project experience from the knowledge base.

Block structure per section:
  exec-summary  → 1 block "Overview":          3–4 paragraph executive narrative
  problem-framing → 1 block "Problem Statement": articulate the client's challenge
  methodology   → 3 blocks:
                    "Scope Definition"          (what is in / out of scope)
                    "Data Sourcing & Framework" (how data is collected and classified)
                    "Approach & Scoring"        (analytical pipeline and quality controls)
  workplan      → 1 block "Workplan":           markdown table (Milestone | Deliverable | Timeline)

Return a JSON object — no markdown fences, just pure JSON:
{
  "sections": [
    {
      "section_id": "exec-summary",
      "blocks": [{"title": "Overview", "markdown": "..."}]
    },
    {
      "section_id": "problem-framing",
      "blocks": [{"title": "Problem Statement", "markdown": "..."}]
    },
    {
      "section_id": "methodology",
      "blocks": [
        {"title": "Scope Definition", "markdown": "..."},
        {"title": "Data Sourcing & Framework", "markdown": "..."},
        {"title": "Approach & Scoring", "markdown": "..."}
      ]
    },
    {
      "section_id": "workplan",
      "blocks": [{"title": "Workplan", "markdown": "| Milestone | Deliverable | Timeline |\\n..."}]
    }
  ]
}"""


# ── Entry point ───────────────────────────────────────────────────────────────

async def run_sections_agent(
    tender_data: dict[str, Any],
    kb_profile: dict[str, Any],
) -> dict[str, Any]:
    """
    Fill Executive Summary, Problem Framing, Methodology, and Workplan sections.

    Args:
        tender_data:  Structured tender info from the extraction agent.
        kb_profile:   Company KB (methodology docs, company profile, past projects).

    Returns:
        Dict with key "sections": list of {section_id, blocks}.
    """
    tender_text = json.dumps(tender_data, indent=2, ensure_ascii=False, default=str)[:3000]

    # Pull relevant KB context: methodology + company profile summary
    methodology_docs = kb_profile.get("methodology_documents", [])
    company_docs = kb_profile.get("company_documents", [])

    company_profile = ""
    if company_docs:
        doc = company_docs[0]
        company_profile = json.dumps({
            "basic_info": doc.get("basic_info", {}),
            "services": doc.get("company_profile", {}).get("services", []),
            "capabilities": doc.get("capabilities", {}).get("capabilities_list", []),
        }, indent=2, ensure_ascii=False, default=str)[:2000]

    methodology_text = json.dumps(methodology_docs, indent=2, ensure_ascii=False, default=str)[:2000]

    user_msg = (
        "TENDER REQUIREMENTS:\n" + tender_text + "\n\n"
        "COMPANY PROFILE:\n" + company_profile + "\n\n"
        "METHODOLOGY REFERENCE:\n" + methodology_text
    )

    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT,
        max_tokens=8192,
    )

    return _parse_json(raw)


# ── Helper ────────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    clean = _strip_fence(raw)
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except json.JSONDecodeError:
                pass
    raise RuntimeError(f"sections_agent returned invalid JSON. Raw: {raw[:300]}")


def _strip_fence(raw: str) -> str:
    lines = raw.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()
