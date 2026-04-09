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
