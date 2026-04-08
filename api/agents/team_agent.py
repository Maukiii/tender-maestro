"""
Team Agent

Selects the optimal team from Meridian's pool for a specific tender and writes
the Team section blocks (one block per proposed team member).
"""
from __future__ import annotations

import json
from typing import Any

from services.ai import generate_text

# ── System prompt — edit this to change the agent's behaviour ─────────────────

SYSTEM_PROMPT = """You are a Senior Proposal Writer at Meridian Intelligence GmbH.
Your task is to fill the TEAM COMPOSITION section of a tender proposal.

Given the tender requirements and the company knowledge base, select the most
suitable team members from Meridian's pool and write a concise block for each.

Each block should contain:
- A markdown table:  Name | Role | Days Allocated
- 2-3 bullet points tailored to the specific tender (relevant skills, languages, past projects)

Rules:
- Only assign team members whose skills match the tender's requirements.
- Assign realistic day allocations based on the tender's duration and budget.
- If a language requirement exists, ensure at least one team member covers it.

Return a JSON object — no markdown fences, just pure JSON:
{
  "section_id": "team",
  "blocks": [
    {
      "title": "<Full Name> – <Role>",
      "markdown": "| Name | Role | Days Allocated |\\n|------|------|----------------|\\n| <name> | <role> | <days> |\\n\\n- Relevant point 1\\n- Relevant point 2"
    }
  ]
}"""


# ── Entry point ───────────────────────────────────────────────────────────────

async def run_team_agent(tender_data: dict[str, Any], kb_profile: dict[str, Any]) -> dict[str, Any]:
    """
    Fill the Team section for a tender.

    Args:
        tender_data:  Structured tender info from the extraction agent.
        kb_profile:   Structured company KB (team CVs, past projects).

    Returns:
        Dict with keys: section_id, blocks (list of {title, markdown}).
    """
    team_cvs = kb_profile.get("team_cvs", [])
    team_text = json.dumps(team_cvs, indent=2, ensure_ascii=False, default=str)[:4000]
    tender_text = json.dumps(tender_data, indent=2, ensure_ascii=False, default=str)[:3000]

    user_msg = (
        "TENDER REQUIREMENTS:\n" + tender_text + "\n\n"
        "AVAILABLE TEAM (CVs):\n" + team_text
    )

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
    raise RuntimeError(f"team_agent returned invalid JSON. Raw: {raw[:300]}")


def _strip_fence(raw: str) -> str:
    lines = raw.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()
