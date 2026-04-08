"""
Cost Agent

Estimates project costs for a specific tender and writes the Price Summary
section block with a detailed day-rate breakdown.
"""
from __future__ import annotations

import json
from typing import Any

from services.ai import generate_text

# ── System prompt — edit this to change the agent's behaviour ─────────────────
# Day rates and team members come from the knowledge base at runtime —
# do not hard-code them here.

SYSTEM_PROMPT = """You are a Senior Bid Manager.
Your task is to fill the PRICE SUMMARY section of a tender proposal.

You will receive:
  - TENDER REQUIREMENTS: structured tender data (budget ceiling, duration, scope)
  - PROPOSED TEAM: team members and roles selected for this tender
  - TEAM CVs: profiles from the knowledge base including seniority and reference budgets
  - PAST PROJECT REFERENCES: past project values for cost calibration

Rules:
- Derive a realistic day rate for each team member from their CV / seniority level and
  the reference budgets in the knowledge base. If no explicit rate is available, estimate
  a market-appropriate rate for the role.
- Base day allocations on the tender's stated duration and scope.
- If a budget ceiling is stated, stay below it.
- Include a contingency line (5–10 % of labour costs).
- Round totals to nearest 500 EUR.
- Use only the team members listed in PROPOSED TEAM.

Return a JSON object — no markdown fences, just pure JSON:
{
  "section_id": "pricing",
  "blocks": [
    {
      "title": "Price Breakdown",
      "markdown": "| Item | Days | Day Rate (EUR) | Total (EUR) |\\n|------|------|----------------|-------------|\\n..."
    }
  ]
}"""


# ── Entry point ───────────────────────────────────────────────────────────────

async def run_cost_agent(
    tender_data: dict[str, Any],
    kb_profile: dict[str, Any],
    score_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Fill the Price Summary section for a tender.

    Args:
        tender_data:  Structured tender info from the extraction agent.
        kb_profile:   Company KB (past project costs provide reference points).
        score_data:   Optional scoring result (team_proposal gives day hints).

    Returns:
        Dict with keys: section_id, blocks (list of {title, markdown}).
    """
    tender_text = json.dumps(tender_data, indent=2, ensure_ascii=False, default=str)[:3000]

    team_hint = ""
    if score_data and score_data.get("team_proposal"):
        team_hint = "\n\nPROPOSED TEAM (from scoring):\n" + json.dumps(
            score_data["team_proposal"], indent=2, ensure_ascii=False, default=str
        )[:1500]

    # Team CVs — used by the agent to derive day rates from seniority / reference budgets
    team_cvs = kb_profile.get("team_cvs", [])
    cvs_text = ""
    if team_cvs:
        cvs_text = "\n\nTEAM CVs (for day-rate derivation):\n" + json.dumps(
            team_cvs, indent=2, ensure_ascii=False, default=str
        )[:2000]

    # Past project values as cost calibration reference
    past_projects = []
    for doc in kb_profile.get("company_documents", []):
        past_projects.extend(doc.get("projects", []))
    ref_text = ""
    if past_projects:
        ref_text = "\n\nPAST PROJECT REFERENCE VALUES:\n" + json.dumps(
            past_projects[:5], indent=2, ensure_ascii=False, default=str
        )[:1500]

    user_msg = "TENDER REQUIREMENTS:\n" + tender_text + team_hint + cvs_text + ref_text

    raw = await generate_text(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_PROMPT,
        max_tokens=2048,
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
    raise RuntimeError(f"cost_agent returned invalid JSON. Raw: {raw[:300]}")


def _strip_fence(raw: str) -> str:
    lines = raw.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()
