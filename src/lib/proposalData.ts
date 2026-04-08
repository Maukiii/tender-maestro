import { Users, Wrench, DollarSign, ShieldAlert, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ProposalBlock {
  id: string;
  title: string;
  markdown: string;
}

export interface ProposalSection {
  id: string;
  label: string;
  icon: LucideIcon;
  blocks: ProposalBlock[];
}

export const DEFAULT_SECTIONS: ProposalSection[] = [
  {
    id: "staffing",
    label: "Staffing",
    icon: Users,
    blocks: [
      { id: "staff-fabi", title: "Fabi Rosenberg", markdown: "**Role:** Lead Architect — 12 years experience in enterprise platform design and cloud-native solutions." },
      { id: "staff-phil", title: "Phil Hartmann", markdown: "**Role:** Project Director — 15 years leading large-scale government transformation programmes." },
      { id: "staff-priya", title: "Priya Sharma", markdown: "**Role:** QA Lead — 7 years in automated testing and quality assurance for regulated industries." },
    ],
  },
  {
    id: "technical",
    label: "Technical Approach",
    icon: Wrench,
    blocks: [
      { id: "tech-methodology", title: "Methodology", markdown: "Agile-SAFe hybrid delivery model with bi-weekly sprint demos and continuous integration." },
      { id: "tech-architecture", title: "Architecture", markdown: "Microservices on Kubernetes with event-driven messaging, deployed across multi-region cloud infrastructure." },
      { id: "tech-security", title: "Security & Compliance", markdown: "Built-in compliance for **ISO 27001**, **SOC 2**, and **GDPR** with automated security scanning." },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    blocks: [
      { id: "price-phases", title: "Phase Breakdown", markdown: "| Phase | Cost |\n|-------|------|\n| Discovery | $120,000 |\n| Development | $480,000 |\n| UAT & Go-Live | $95,000 |" },
      { id: "price-total", title: "Total & Terms", markdown: "**Total Fixed Price:** $695,000\n\nPayment milestones aligned to phase delivery gates." },
    ],
  },
  {
    id: "risk",
    label: "Risk Mitigation",
    icon: ShieldAlert,
    blocks: [
      { id: "risk-integration", title: "Integration Risk", markdown: "Early proof-of-concept integrations in Phase 1 to validate assumptions." },
      { id: "risk-scope", title: "Scope Management", markdown: "Strict change control board with documented CR process to prevent scope creep." },
    ],
  },
  {
    id: "exec-summary",
    label: "Executive Summary",
    icon: FileText,
    blocks: [
      { id: "exec-overview", title: "Overview", markdown: "Provide a **high-level overview** of your proposal, key differentiators, and why your organisation is the best fit." },
    ],
  },
];
