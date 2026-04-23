"""
Scoring Boss

Evaluates an incoming tender against the company knowledge base and returns a
bid/no-bid decision with numeric scores and a proposed team composition.

Uses the original German-language scoring prompt crafted by the team.
"""
from __future__ import annotations

import json
from typing import Any

from services.ai import generate_text


# ── System Prompt ─────────────────────────────────────────────────────────────
# Describes the task and output schema only.
# All company-specific facts (name, capabilities, certifications, team pool)
# are injected at runtime from the knowledge base — edit them in documents/kb/.

SCORING_SYSTEM_PROMPT = """You are a Senior Bid Manager & Resource Allocation Expert.
Evaluate an incoming tender against a company knowledge base and return a bid/no-bid
decision with numeric scores and a proposed team composition.

You will receive:
  - TENDER DATA: structured extraction of the tender document
  - COMPANY PROFILE: company capabilities, certifications, past projects
  - TEAM CVs: team member profiles and experience

Act ONLY on the facts provided in those inputs. Do not invent capabilities or team
members not present in the knowledge base.

Internally apply the following evaluation (do NOT output this reasoning, only the final JSON):
  - K.O. CHECK: Immediately NO-BID if any of these apply: a required certification the
    company does not hold; mandatory on-site fieldwork the company cannot perform; required
    project languages not covered by any team member; min_turnover_required exceeds the
    company's annual turnover; fewer than three qualifying reference projects.
  - COMPANY FIT SCORE (0–100, 40% of decision): technical capabilities match (15%),
    past project references/volume (15%), compliance & certifications (10%).
  - TEAM MAPPING (0–100 per member, 60% of decision): use ONLY team members listed in
    the CVs. Score each: Hard Skills (25%), Track Record (15%), Domain/Policy (10%),
    Qualifications & Languages (10%). If weighted average < 70 → NO-BID.
  - OVERALL SCORE: 0.4 × company_fit_score + 0.6 × team_fit_score.

Your response MUST be a single JSON object and nothing else.
Do not include any explanation, preamble, markdown, or text outside the JSON.
Your response must start with { and end with }.

{
  "decision": "BID" or "NO-BID",
  "company_fit_score": <integer 0-100>,
  "team_fit_score": <integer 0-100>,
  "overall_score": <integer 0-100>,
  "company_fit_reasoning": "One or two sentences justifying the company fit score",
  "ko_criterion_triggered": "The triggered K.O. criterion, or null if BID",
  "team_proposal": [
    {
      "role": "Required role from tender",
      "member_name": "Exact name from the team CVs",
      "total_score_percentage": <integer 0-100>,
      "score_details": {
        "hard_skills_reasoning": "Based on the member's technical skills",
        "experience_reasoning": "Based on past projects and reference budgets",
        "gap_analysis": "What the candidate lacks for a perfect score"
      }
    }
  ]
}"""


# ── Main entry point ─────────────────────────────────────────────────────────

async def run_scoring_boss(tender_data: dict[str, Any], kb_profile: dict[str, Any]) -> dict[str, Any]:
    """
    Evaluate a tender against the company KB and return a scoring decision.

    Args:
        tender_data:  Structured tender info from run_tender_extractor_agent().
        kb_profile:   Structured company profile from load_kb_profile().

    Returns:
        Dict with keys: decision, company_fit_score, team_fit_score, overall_score,
        company_fit_reasoning, ko_criterion_triggered, team_proposal.

    Raises:
        RuntimeError: If the AI returns invalid JSON.
    """
    tender_text = json.dumps(tender_data, indent=2, ensure_ascii=False, default=str)

    # Build company profile from first document, keeping only scoring-relevant fields
    company_docs = kb_profile.get("company_documents", [])
    if company_docs:
        doc = company_docs[0]
        company_summary = json.dumps({
            "basic_info": doc.get("basic_info", {}),
            "services": doc.get("company_profile", {}).get("services", []),
            "capabilities": doc.get("capabilities", {}).get("capabilities_list", []),
            "certifications": doc.get("capabilities", {}).get("certifications", []),
            "past_projects": doc.get("experience", {}).get("past_projects", []),
        }, indent=2, ensure_ascii=False, default=str)[:4000]
    else:
        company_summary = "{}"

    # Team CVs get their own budget — critical for STEP 3 (60 % of decision).
    # 16 000 chars accommodates all 4 CVs; Claude's context window handles this easily.
    team_cvs = kb_profile.get("team_cvs", [])
    team_text = json.dumps(team_cvs, indent=2, ensure_ascii=False, default=str)[:16000]

    user_msg = (
        "TENDER DATA:\n" + tender_text + "\n\n"
        "COMPANY PROFILE:\n" + company_summary + "\n\n"
        "TEAM CVs:\n" + team_text
    )

    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SCORING_SYSTEM_PROMPT,
        max_tokens=4096,
    )

    return _parse_json(raw)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    """
    Parse AI response as JSON.

    Strategy (most to least lenient):
    1. Strip markdown fences, then try json.loads.
    2. Find the first '{' and last '}' and try json.loads on that substring.
    3. Raise RuntimeError with the first 400 chars of raw output for debugging.
    """
    clean = _strip_fence(raw)
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(raw[start:end])
        except json.JSONDecodeError:
            pass

    raise RuntimeError(
        f"scoring_boss returned invalid JSON.\nRaw output (first 400 chars): {raw[:400]}"
    )


def _strip_fence(raw: str) -> str:
    """Remove leading/trailing markdown code fences."""
    lines = raw.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()
