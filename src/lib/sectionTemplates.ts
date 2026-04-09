import {
  FileText,
  Target,
  Compass,
  CalendarCheck,
  Users,
  DollarSign,
  ShieldCheck,
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

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: "headline",
    label: "Headline",
    icon: FileText,
    blocks: [
      {
        titleSuffix: "Title Page",
        markdown: "",
      },
    ],
  },
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
    id: "understanding",
    label: "Understanding of Objective",
    icon: Target,
    blocks: [
      {
        titleSuffix: "Objective Analysis",
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
        titleSuffix: "Seed Universe Construction",
        markdown: "",
      },
      {
        titleSuffix: "Evidence Classification",
        markdown:
          "| Evidence Type | Weight | Example |\n|---------------|--------|---------|\n| — | — | — |",
      },
      {
        titleSuffix: "Supply Chain Mapping",
        markdown: "",
      },
    ],
  },
  {
    id: "workplan",
    label: "Work Plan",
    icon: CalendarCheck,
    blocks: [
      {
        titleSuffix: "Work Plan",
        markdown:
          "| Milestone | Deliverable | Month |\n|-----------|-------------|-------|\n| — | — | — |",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    blocks: [
      {
        titleSuffix: "Team Composition",
        markdown:
          "| Name | Role | Days Allocated |\n|------|------|----------------|\n| — | — | — |",
      },
    ],
  },
  {
    id: "quality-assurance",
    label: "Quality Assurance",
    icon: ShieldCheck,
    blocks: [
      {
        titleSuffix: "QA Framework",
        markdown: "",
      },
    ],
  },
  {
    id: "pricing",
    label: "Price",
    icon: DollarSign,
    blocks: [
      {
        titleSuffix: "Price Breakdown",
        markdown:
          "| Item | Days | Day Rate (EUR) | Total (EUR) |\n|------|------|----------------|-------------|\n| — | — | — | — |",
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
