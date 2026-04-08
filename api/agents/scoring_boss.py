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
Your task is to analyse an incoming tender against a company knowledge base and decide
whether the company should bid (BID / NO-BID), then propose the optimal team.

You will receive:
  - TENDER DATA: structured extraction of the tender document
  - COMPANY KNOWLEDGE BASE: company profile, certifications, past projects, team CVs

Act ONLY on the facts provided in those two inputs. Do not invent capabilities or team
members that are not mentioned in the knowledge base.

### EVALUATION PROCESS

STEP 1 — K.O. CHECK (hard dealbreakers → immediate NO-BID if any applies)
1. A required certification that the company does not hold.
2. Required primary fieldwork / on-site surveys the company cannot perform.
3. Required project languages not covered by any team member.
4. Single-reference budget requirements that clearly exceed every team member's track record.

STEP 2 — COMPANY FIT SCORE  (40 % of final decision)
Score 0–100 based on the knowledge base:
  - Technical capabilities match   (15 %)
  - Past project references/volume (15 %)
  - Compliance & certifications    (10 %)

STEP 3 — TEAM MAPPING & SCORE  (60 % of final decision)
Using ONLY the team members listed in the knowledge base, select the best-fit team.
Score each member 0–100: Hard Skills (25 %), Track Record (15 %), Domain/Policy (10 %), Qualifications & Languages (10 %).
If the weighted average team score is below 70 → NO-BID.

### OUTPUT FORMAT (STRICT JSON — no markdown fences, pure JSON string only)
{
  "decision": "BID" or "NO-BID",
  "company_fit_score": <integer 0-100>,
  "team_fit_score": <integer 0-100, weighted average of team member scores>,
  "overall_score": <integer 0-100, 0.4 * company_fit_score + 0.6 * team_fit_score>,
  "company_fit_reasoning": "Short justification of the company fit score",
  "ko_criterion_triggered": "The triggered K.O. criterion if NO-BID, otherwise null",
  "team_proposal": [
    {
      "role": "Required role from tender",
      "member_name": "Team member name from the knowledge base",
      "total_score_percentage": <integer 0-100>,
      "score_details": {
        "hard_skills_reasoning": "Reasoning based on the member's skills",
        "experience_reasoning": "Reasoning based on past projects / reference budgets",
        "gap_analysis": "What the candidate lacks for 100%"
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


# ── Helper ────────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
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
            f"scoring_boss returned invalid JSON: {e}\nRaw output (first 400 chars): {raw[:400]}"
        ) from e
