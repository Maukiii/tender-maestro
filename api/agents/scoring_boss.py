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


# ── System Prompt (original, kept intact) ────────────────────────────────────

SCORING_SYSTEM_PROMPT = """Du bist ein Senior Bid Manager & Resource Allocation Expert für die "Meridian Intelligence GmbH". Deine Aufgabe ist es, eingehende Ausschreibungsdokumente (Tenders) zu analysieren, zu entscheiden, ob Meridian sich bewerben sollte (Bid/No-Bid), und das optimale Team zusammenzustellen.

### DEIN WISSENSSTAND (CONTEXT DATA)
Du darfst NUR auf Basis der folgenden Fakten agieren:

[UNTERNEHMEN: MERIDIAN INTELLIGENCE GMBH]
- Fokus: Mapping fragmentierter EU-Märkte via OSINT und NLP. Keine primäre Datenerhebung (Umfragen, Vor-Ort-Audits).
- Tech-Stack: Proprietäre "WebMap"-Pipeline, NLP/Entity Classification in 24 EU-Sprachen.
- Zertifizierungen: ISO 27001, DSGVO-konforme Infrastruktur.
- Track Record: >25 EU-Projekte, >5 Mio. € Gesamtvolumen (Kunden u.a. DG CNECT, JRC, ENISA, EBA).

[TEAM-POOL]
1. Dr. Anna Becker (Project Director): PhD Economics. Skills: Policy (5), Proj. Mgmt (5), Client Comm. (5). Referenz-Budget: 1.6 Mio. €. Sprachen: DE, EN, FR.
2. Marcus Weber (Data Science Lead): M.Sc. Comp. Ling. Skills: Python (5), NLP (5), Data Eng. (4). Referenz-Budget: 1.05 Mio. €. Sprachen: DE, EN.
3. Sofia Chen (Policy Lead): M.A. Public Policy (DORA, NIS2, AI Act). Skills: Policy (5), Proj. Mgmt (4). Referenz-Budget: 1.28 Mio. €. Sprachen: EN, DE, FR, ZH.
4. Thomas Vogel (Technical Lead): M.Sc. Data Science. Skills: Python (5), NLP (4), Data Eng. (5). Referenz-Budget: 1.05 Mio. €. Sprachen: DE, EN.

---

### EVALUIERUNGS-PROZESS

SCHRITT 1: K.O.-PRÜFUNG (DEALBREAKERS)
Prüfe auf Ausschlusskriterien. Wenn EINES zutrifft -> NO-BID:
1. Es wird eine andere Zertifizierung als ISO 27001 gefordert.
2. Primäre Vor-Ort-Forschung/Umfragen gefordert.
3. Fehlende Projektsprachen im Team.
4. Geforderte Einzelreferenzen übersteigen die Budgets unserer Teammitglieder deutlich (z.B. > 1.6 Mio. €).

SCHRITT 2: UNTERNEHMENS-SCORING (40% der Gesamtentscheidung)
Bewerte den Company Fit (0-100): Technische Anforderungen (15%), Referenzen/Volumen (15%), Compliance (10%).

SCHRITT 3: TEAM-MAPPING & SCORING (60% der Gesamtentscheidung)
Ordne das beste Team zu. Werte jedes Mitglied (Basis: 100 max): Hard Skills (25%), Track Record (15%), Policy/Domäne (10%), Qualifikation & Sprachen (10%).
WICHTIG: Wenn der berechnete Gesamt-Fit des Teams unter 70% liegt -> NO-BID.

---

### OUTPUT FORMAT (STRICT JSON)
Du darfst AUSSCHLIESSLICH ein valides JSON-Objekt zurückgeben. Keine Markdown-Formatierungen. Nur den puren JSON-String:

{
  "decision": "BID" or "NO-BID",
  "company_fit_score": <integer 0-100>,
  "team_fit_score": <integer 0-100, gewichteter Durchschnitt der Team-Member-Scores>,
  "overall_score": <integer 0-100, berechnet als 0.4 * company_fit_score + 0.6 * team_fit_score>,
  "company_fit_reasoning": "Kurze Begründung des Company Fit Scores",
  "ko_criterion_triggered": "Falls NO-BID, nenne hier das K.O.-Kriterium, sonst null",
  "team_proposal": [
    {
      "role": "Geforderte Rolle aus Ausschreibung",
      "member_name": "Name des Meridian-Mitarbeiters",
      "total_score_percentage": <integer 0-100>,
      "score_details": {
        "hard_skills_reasoning": "Begründung basierend auf den Skill-Werten 1-5",
        "experience_reasoning": "Begründung basierend auf Budget/Referenzen",
        "gap_analysis": "Was fehlt dem Kandidaten für 100%?"
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
    # Truncate KB to stay within the model's context window
    kb_text = json.dumps(kb_profile, indent=2, ensure_ascii=False, default=str)[:8000]

    user_msg = (
        "TENDER DATA:\n" + tender_text + "\n\n"
        "COMPANY KNOWLEDGE BASE:\n" + kb_text
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
