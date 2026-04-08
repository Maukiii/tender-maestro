"""
Canonical section templates — single source of truth shared with the frontend.

Each template defines the expected blocks and their scaffold markdown.
The backend's /tender/generate-section endpoint uses these templates to return
pre-structured blocks that the AI can then fill.
"""

from __future__ import annotations
from dataclasses import dataclass, field

@dataclass
class BlockTemplate:
    title_suffix: str
    markdown: str = ""

@dataclass
class SectionTemplate:
    id: str
    label: str
    blocks: list[BlockTemplate] = field(default_factory=list)


SECTION_TEMPLATES: list[SectionTemplate] = [
    SectionTemplate(
        id="exec-summary",
        label="Executive Summary",
        blocks=[BlockTemplate("Overview")],
    ),
    SectionTemplate(
        id="problem-framing",
        label="Problem Framing",
        blocks=[BlockTemplate("Problem Statement")],
    ),
    SectionTemplate(
        id="methodology",
        label="Proposed Methodology",
        blocks=[
            BlockTemplate("Scope Definition"),
            BlockTemplate("Data Sourcing & Framework"),
            BlockTemplate("Approach & Scoring"),
        ],
    ),
    SectionTemplate(
        id="workplan",
        label="Workplan & Deliverables",
        blocks=[
            BlockTemplate(
                "Workplan",
                "| Milestone | Deliverable | Timeline |\n"
                "|-----------|-------------|----------|\n"
                "| Inception | D1 – Inception Report | Months 1–2 |\n"
                "| Analysis | D2 – Analysis Report | Months 3–4 |\n"
                "| Implementation | D3 – Solution Delivery | Months 5–8 |\n"
                "| Close-out | D4 – Final Report | Months 9–10 |",
            )
        ],
    ),
    SectionTemplate(
        id="team",
        label="Team",
        blocks=[
            BlockTemplate(
                "Team Lead",
                "| Name | Role | Days Allocated |\n"
                "|------|------|----------------|\n"
                "| — | Team Lead | 40 |",
            ),
            BlockTemplate(
                "Senior Analyst",
                "| Name | Role | Days Allocated |\n"
                "|------|------|----------------|\n"
                "| — | Senior Analyst | 30 |",
            ),
            BlockTemplate(
                "Junior Analyst",
                "| Name | Role | Days Allocated |\n"
                "|------|------|----------------|\n"
                "| — | Junior Analyst | 25 |",
            ),
        ],
    ),
    SectionTemplate(
        id="pricing",
        label="Price Summary",
        blocks=[
            BlockTemplate(
                "Price Breakdown",
                "| Item | Days | Day Rate (EUR) | Total (EUR) |\n"
                "|------|------|----------------|-------------|\n"
                "| Team Lead | 40 | 1,200 | 48,000 |\n"
                "| Senior Analyst | 30 | 900 | 27,000 |\n"
                "| Junior Analyst | 25 | 600 | 15,000 |\n"
                "| **Total** | | | **90,000** |",
            )
        ],
    ),
]


def get_template_by_id(template_id: str) -> SectionTemplate | None:
    return next((t for t in SECTION_TEMPLATES if t.id == template_id), None)


def get_template_by_label(label: str) -> SectionTemplate | None:
    lower = label.lower()
    return next((t for t in SECTION_TEMPLATES if t.label.lower() == lower), None)
