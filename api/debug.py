#!/usr/bin/env python3
"""
Debug CLI for Tender Maestro agents.

Usage (run from the api/ directory with the venv active):

  # Extract structured data from a tender PDF
  python debug.py extract path/to/tender.pdf

  # Score a tender against the KB
  python debug.py score path/to/tender.pdf

  # Run all 6 proposal section agents on a tender
  python debug.py draft path/to/tender.pdf

  # Parse and dump the knowledge base
  python debug.py kb

  # Run a single section agent: exec-summary | problem-framing | methodology | workplan | team | pricing
  python debug.py section exec-summary path/to/tender.pdf

Examples:
  python debug.py extract ../documents/tenders/abc123_mytender.pdf
  python debug.py score ../documents/tenders/abc123_mytender.pdf
  python debug.py kb
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

# Make sure api/ is on sys.path
sys.path.insert(0, str(Path(__file__).parent))


def _print_json(data: dict) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False, default=str))


def _resolve_tender(raw: str) -> Path:
    p = Path(raw)
    if p.exists():
        return p
    # Try relative to documents/tenders/
    candidate = Path(__file__).parent.parent / "documents" / "tenders" / raw
    if candidate.exists():
        return candidate
    print(f"[ERROR] File not found: {raw}", file=sys.stderr)
    sys.exit(1)


async def cmd_kb() -> None:
    from agents.kb_parser import load_kb_profile
    print("[KB] Parsing knowledge base…")
    profile = load_kb_profile()
    print(f"  company_documents : {len(profile.get('company_documents', []))}")
    print(f"  methodology_docs  : {len(profile.get('methodology_documents', []))}")
    print(f"  team_cvs          : {len(profile.get('team_cvs', []))}")
    if "error" in profile:
        print(f"  [ERROR] {profile['error']}", file=sys.stderr)
        return
    team_names = [cv.get("name") or cv.get("basic_info", {}).get("name", "?") for cv in profile.get("team_cvs", [])]
    print(f"  team members      : {team_names}")
    print()
    _print_json(profile)


async def cmd_extract(tender_path: Path) -> dict:
    from agents.tender_extraction_agent import run_tender_extractor_agent
    print(f"[EXTRACT] {tender_path.name}…")
    result = await run_tender_extractor_agent(tender_path)
    _print_json(result)
    return result


async def cmd_score(tender_path: Path) -> None:
    from agents.tender_extraction_agent import run_tender_extractor_agent
    from agents.kb_parser import load_kb_profile
    from agents.scoring_boss import run_scoring_boss

    print(f"[EXTRACT] {tender_path.name}…")
    tender_data = await run_tender_extractor_agent(tender_path)
    print("[KB] Loading knowledge base…")
    kb_profile = load_kb_profile()
    print("[SCORE] Running scoring boss…")
    result = await run_scoring_boss(tender_data, kb_profile)
    _print_json(result)


async def cmd_section(section_id: str, tender_path: Path) -> None:
    from agents.tender_extraction_agent import run_tender_extractor_agent
    from agents.kb_parser import load_kb_profile
    import agents.sections_agent as sa
    import agents.team_agent as ta
    import agents.cost_agent as ca

    dispatch = {
        "exec-summary":    lambda td, kb: sa.run_exec_summary_agent(td, kb),
        "problem-framing": lambda td, kb: sa.run_problem_framing_agent(td, kb),
        "methodology":     lambda td, kb: sa.run_methodology_agent(td, kb),
        "workplan":        lambda td, kb: sa.run_workplan_agent(td, kb),
        "team":            lambda td, kb: ta.run_team_agent(td, kb),
        "pricing":         lambda td, kb: ca.run_cost_agent(td, kb, None),
    }
    if section_id not in dispatch:
        print(f"[ERROR] Unknown section '{section_id}'. Choose from: {', '.join(dispatch)}", file=sys.stderr)
        sys.exit(1)

    print(f"[EXTRACT] {tender_path.name}…")
    tender_data = await run_tender_extractor_agent(tender_path)
    print("[KB] Loading knowledge base…")
    kb_profile = load_kb_profile()
    print(f"[{section_id.upper()}] Running agent…")
    result = await dispatch[section_id](tender_data, kb_profile)
    _print_json(result)


async def cmd_draft(tender_path: Path) -> None:
    from agents.tender_extraction_agent import run_tender_extractor_agent
    from agents.kb_parser import load_kb_profile
    from agents.sections_agent import (
        run_exec_summary_agent, run_problem_framing_agent,
        run_methodology_agent, run_workplan_agent,
    )
    from agents.team_agent import run_team_agent
    from agents.cost_agent import run_cost_agent

    print(f"[EXTRACT] {tender_path.name}…")
    tender_data = await run_tender_extractor_agent(tender_path)
    print("[KB] Loading knowledge base…")
    kb_profile = load_kb_profile()
    print("[DRAFT] Running 6 agents in parallel…")

    results = await asyncio.gather(
        run_exec_summary_agent(tender_data, kb_profile),
        run_problem_framing_agent(tender_data, kb_profile),
        run_methodology_agent(tender_data, kb_profile),
        run_workplan_agent(tender_data, kb_profile),
        run_team_agent(tender_data, kb_profile),
        run_cost_agent(tender_data, kb_profile, None),
        return_exceptions=True,
    )
    labels = ["exec-summary", "problem-framing", "methodology", "workplan", "team", "pricing"]
    for label, result in zip(labels, results):
        print(f"\n{'='*60}")
        print(f"  SECTION: {label}")
        print('='*60)
        if isinstance(result, Exception):
            print(f"  [ERROR] {result}", file=sys.stderr)
        else:
            _print_json(result)


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(0)

    cmd = args[0]

    if cmd == "kb":
        asyncio.run(cmd_kb())

    elif cmd == "extract":
        if len(args) < 2:
            print("Usage: python debug.py extract <tender_file>", file=sys.stderr)
            sys.exit(1)
        asyncio.run(cmd_extract(_resolve_tender(args[1])))

    elif cmd == "score":
        if len(args) < 2:
            print("Usage: python debug.py score <tender_file>", file=sys.stderr)
            sys.exit(1)
        asyncio.run(cmd_score(_resolve_tender(args[1])))

    elif cmd == "section":
        if len(args) < 3:
            print("Usage: python debug.py section <section-id> <tender_file>", file=sys.stderr)
            sys.exit(1)
        asyncio.run(cmd_section(args[1], _resolve_tender(args[2])))

    elif cmd == "draft":
        if len(args) < 2:
            print("Usage: python debug.py draft <tender_file>", file=sys.stderr)
            sys.exit(1)
        asyncio.run(cmd_draft(_resolve_tender(args[1])))

    else:
        print(f"[ERROR] Unknown command '{cmd}'", file=sys.stderr)
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
