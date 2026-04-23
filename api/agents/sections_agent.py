"""
Sections Agent

Fills proposal sections: Executive Summary, Problem Framing,
Proposed Methodology, and Workplan & Deliverables.

Each section has its own prompt constant and async function so they can
run concurrently. run_sections_agent() is kept as a convenience wrapper.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any

from services.ai import generate_text


# ── System prompts — edit these to change each section's behaviour ────────────
# Do not mention specific company names, tools, or certifications here —
# those facts come from the knowledge base injected at runtime.

SYSTEM_PROMPT_EXEC_SUMMARY = """You are a Senior Proposal Writer.
Your task is to write the EXECUTIVE SUMMARY section of a tender proposal.

Write in a professional, concise EU-tender style.
Tailor this section to the specific tender requirements provided.
Draw exclusively on the company profile, capabilities, and past project
experience supplied in COMPANY PROFILE below.
Do not invent tools, certifications, or credentials not mentioned there.

Structure — 1 block titled "Overview":
  - Opening: demonstrate understanding of the client's challenge
  - Company fit: state the company's unique qualifications for this tender
  - Approach summary: summarise the proposed solution at a high level
  - Closing commitment statement

Return a JSON object — no markdown fences, just pure JSON:
{
  "section_id": "exec-summary",
  "blocks": [{"title": "Overview", "markdown": "..."}]
}"""


SYSTEM_PROMPT_PROBLEM_FRAMING = """You are a Senior Proposal Writer.
Your task is to write the PROBLEM FRAMING section of a tender proposal.

Write in a professional, concise EU-tender style.
Tailor this section to the specific tender requirements provided.
Do not invent facts, cite non-existent sources, or reference specific companies.

Structure — 1 block titled "Problem Statement":
  - Root Cause: explain the core gap or challenge that this tender addresses
  - Context: situate the problem within the relevant regulatory or operational landscape
  - Consequence: describe the risk if the problem is not addressed
  - Scope: clarify the boundaries of what the proposed work must cover

Return a JSON object — no markdown fences, just pure JSON:
{
  "section_id": "problem-framing",
  "blocks": [{"title": "Problem Statement", "markdown": "..."}]
}"""


SYSTEM_PROMPT_WORKPLAN = """You are a Senior Proposal Writer.
Your task is to write the WORKPLAN & DELIVERABLES section of a tender proposal.

Write in a professional, concise EU-tender style.
Base the timeline on the tender's stated duration, start date, and any
phasing requirements. Do not invent deliverables beyond what the tender scope implies.

Structure — 1 block titled "Workplan":
  - A brief narrative paragraph above the table summarising the phasing approach
  - A markdown table: Milestone | Deliverable | Timeline
    · 4–6 milestones appropriate to the tender scope
    · Timeline in months (e.g. "Months 1–2") unless exact dates are stated
    · Deliverable codes follow EU convention (D1, D2, …)

Return a JSON object — no markdown fences, just pure JSON:
{
  "section_id": "workplan",
  "blocks": [{"title": "Workplan", "markdown": "| Milestone | Deliverable | Timeline |\\n..."}]
}"""


SYSTEM_PROMPT_METHODOLOGY = """You are a Senior Proposal Writer.
Your task is to write the PROPOSED METHODOLOGY section of a tender proposal.

Write in a professional, concise EU-tender style.
Tailor this section to the specific tender requirements provided.
Draw exclusively on the company profile, capabilities, and methodology documents
supplied in COMPANY PROFILE and METHODOLOGY REFERENCE below.
Do not invent tools, frameworks, or processes not mentioned there.

Structure — 3 blocks:
  Block 1 "Approach Overview":
    - Describe the overall methodological approach and why it fits this tender
    - Reference the company's relevant framework or tooling from the KB
  Block 2 "Evidence & Classification Framework":
    - Detail the data collection and classification methodology
    - Reference specific techniques or quality thresholds from the KB
  Block 3 "Quality Assurance":
    - Describe QA processes and risk mitigation steps
    - Reference certifications or past-project validation from the KB

Return a JSON object — no markdown fences, just pure JSON:
{
  "section_id": "methodology",
  "blocks": [
    {"title": "Approach Overview", "markdown": "..."},
    {"title": "Evidence & Classification Framework", "markdown": "..."},
    {"title": "Quality Assurance", "markdown": "..."}
  ]
}"""


# ── Shared context builder ────────────────────────────────────────────────────

def _build_context(tender_data: dict[str, Any], kb_profile: dict[str, Any]) -> tuple[str, str, str]:
    """Return (tender_text, company_profile, methodology_text) truncated for prompt use."""
    tender_text = json.dumps(tender_data, indent=2, ensure_ascii=False, default=str)[:3000]

    company_docs = kb_profile.get("company_documents", [])
    company_profile = ""
    if company_docs:
        doc = company_docs[0]
        company_profile = json.dumps({
            "basic_info": doc.get("basic_info", {}),
            "services": doc.get("company_profile", {}).get("services", []),
            "capabilities": doc.get("capabilities", {}).get("capabilities_list", []),
        }, indent=2, ensure_ascii=False, default=str)[:2000]

    methodology_docs = kb_profile.get("methodology_documents", [])
    methodology_text = json.dumps(methodology_docs, indent=2, ensure_ascii=False, default=str)[:2000]

    return tender_text, company_profile, methodology_text


# ── Per-section entry points ──────────────────────────────────────────────────

async def run_exec_summary_agent(
    tender_data: dict[str, Any], kb_profile: dict[str, Any]
) -> dict[str, Any]:
    """Generate the Executive Summary section."""
    tender_text, company_profile, _ = _build_context(tender_data, kb_profile)
    user_msg = (
        "TENDER REQUIREMENTS:\n" + tender_text + "\n\n"
        "COMPANY PROFILE:\n" + company_profile
    )
    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT_EXEC_SUMMARY,
        max_tokens=2048,
    )
    return _parse_json(raw, "exec_summary_agent")


async def run_problem_framing_agent(
    tender_data: dict[str, Any], kb_profile: dict[str, Any]
) -> dict[str, Any]:
    """Generate the Problem Framing section."""
    tender_text, _, _ = _build_context(tender_data, kb_profile)
    user_msg = "TENDER REQUIREMENTS:\n" + tender_text
    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT_PROBLEM_FRAMING,
        max_tokens=1024,
    )
    return _parse_json(raw, "problem_framing_agent")


async def run_methodology_agent(
    tender_data: dict[str, Any], kb_profile: dict[str, Any]
) -> dict[str, Any]:
    """Generate the Proposed Methodology section (3 blocks)."""
    tender_text, company_profile, methodology_text = _build_context(tender_data, kb_profile)
    user_msg = (
        "TENDER REQUIREMENTS:\n" + tender_text + "\n\n"
        "COMPANY PROFILE:\n" + company_profile + "\n\n"
        "METHODOLOGY REFERENCE:\n" + methodology_text
    )
    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT_METHODOLOGY,
        max_tokens=4096,
    )
    return _parse_json(raw, "methodology_agent")


async def run_workplan_agent(
    tender_data: dict[str, Any], kb_profile: dict[str, Any]
) -> dict[str, Any]:
    """Generate the Workplan & Deliverables section."""
    tender_text, _, _ = _build_context(tender_data, kb_profile)
    user_msg = "TENDER REQUIREMENTS:\n" + tender_text
    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT_WORKPLAN,
        max_tokens=1024,
    )
    return _parse_json(raw, "workplan_agent")


# ── Convenience wrapper (backward compat) ─────────────────────────────────────

async def run_sections_agent(
    tender_data: dict[str, Any],
    kb_profile: dict[str, Any],
) -> dict[str, Any]:
    """
    Run all 4 section agents concurrently and return the combined result.

    Returns:
        Dict with key "sections": list of {section_id, blocks}.
    """
    results = await asyncio.gather(
        run_exec_summary_agent(tender_data, kb_profile),
        run_problem_framing_agent(tender_data, kb_profile),
        run_methodology_agent(tender_data, kb_profile),
        run_workplan_agent(tender_data, kb_profile),
    )
    return {"sections": list(results)}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json(raw: str, agent: str) -> dict:
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
    raise RuntimeError(f"{agent} returned invalid JSON. Raw: {raw[:300]}")


def _strip_fence(raw: str) -> str:
    lines = raw.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()
