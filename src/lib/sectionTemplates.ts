import {
  FileText,
  Target,
  Compass,
  CalendarCheck,
  Users,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BlockTemplate {
  titleSuffix: string;
  markdown: string;
}

export interface SectionTemplate {
  id: string;
  label: string;
  icon: LucideIcon;
  blocks: BlockTemplate[];
}

/**
 * Canonical section templates.
 * The backend uses the same structure via POST /tender/generate-section.
 */
export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: "exec-summary",
    label: "Executive Summary",
    icon: FileText,
    blocks: [
      {
        titleSuffix: "Overview",
        markdown: "",
      },
    ],
  },
  {
    id: "problem-framing",
    label: "Problem Framing",
    icon: Target,
    blocks: [
      {
        titleSuffix: "Problem Statement",
        markdown: "",
      },
    ],
  },
  {
    id: "methodology",
    label: "Proposed Methodology",
    icon: Compass,
    blocks: [
      {
        titleSuffix: "Scope Definition",
        markdown: "",
      },
      {
        titleSuffix: "Data Sourcing & Framework",
        markdown: "",
      },
      {
        titleSuffix: "Approach & Scoring",
        markdown: "",
      },
    ],
  },
  {
    id: "workplan",
    label: "Workplan & Deliverables",
    icon: CalendarCheck,
    blocks: [
      {
        titleSuffix: "Workplan",
        markdown:
          "| Milestone | Deliverable | Timeline |\n|-----------|-------------|----------|\n| Inception | D1 – Inception Report | Months 1–2 |\n| Analysis | D2 – Analysis Report | Months 3–4 |\n| Implementation | D3 – Solution Delivery | Months 5–8 |\n| Close-out | D4 – Final Report | Months 9–10 |",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    blocks: [
      {
        titleSuffix: "Team Lead",
        markdown:
          "| Name | Role | Days Allocated |\n|------|------|----------------|\n| — | Team Lead | 40 |",
      },
      {
        titleSuffix: "Senior Analyst",
        markdown:
          "| Name | Role | Days Allocated |\n|------|------|----------------|\n| — | Senior Analyst | 30 |",
      },
      {
        titleSuffix: "Junior Analyst",
        markdown:
          "| Name | Role | Days Allocated |\n|------|------|----------------|\n| — | Junior Analyst | 25 |",
      },
    ],
  },
  {
    id: "pricing",
    label: "Price Summary",
    icon: DollarSign,
    blocks: [
      {
        titleSuffix: "Price Breakdown",
        markdown:
          "| Item | Days | Day Rate (EUR) | Total (EUR) |\n|------|------|----------------|-------------|\n| Team Lead | 40 | 1,200 | 48,000 |\n| Senior Analyst | 30 | 900 | 27,000 |\n| Junior Analyst | 25 | 600 | 15,000 |\n| **Total** | | | **90,000** |",
      },
    ],
  },
];

/** Lookup a template by its id */
export function getTemplateById(id: string): SectionTemplate | undefined {
  return SECTION_TEMPLATES.find((t) => t.id === id);
}

/** Lookup a template by label (case-insensitive) */
export function getTemplateByLabel(label: string): SectionTemplate | undefined {
  const lower = label.toLowerCase();
  return SECTION_TEMPLATES.find((t) => t.label.toLowerCase() === lower);
}
