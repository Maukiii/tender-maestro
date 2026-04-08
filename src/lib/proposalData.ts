import type { LucideIcon } from "lucide-react";
import { SECTION_TEMPLATES } from "./sectionTemplates";

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

let idCounter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

/**
 * Build default sections from canonical templates.
 * Each template's blocks become ProposalBlocks with scaffold markdown.
 */
export const DEFAULT_SECTIONS: ProposalSection[] = SECTION_TEMPLATES.map((t) => ({
  id: t.id,
  label: t.label,
  icon: t.icon,
  blocks: t.blocks.map((bt) => ({
    id: genId("block"),
    title: bt.titleSuffix,
    markdown: bt.markdown,
  })),
}));
