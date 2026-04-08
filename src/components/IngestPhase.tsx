import { useState } from "react";
import { ArrowRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ProposalBlock {
  id: string;
  title: string;
  markdown: string;
}

const DEFAULT_BLOCKS: ProposalBlock[] = [
  {
    id: "exec-summary",
    title: "Executive Summary",
    markdown: "Provide a high-level overview of your proposal, key differentiators, and why your organisation is the best fit for this tender.",
  },
  {
    id: "technical-approach",
    title: "Technical Approach & Methodology",
    markdown: "Describe your delivery methodology, architecture decisions, key phases, and timeline.",
  },
  {
    id: "team",
    title: "Team Composition",
    markdown: "List the key personnel, their roles, and relevant experience.",
  },
  {
    id: "pricing",
    title: "Pricing Summary",
    markdown: "Outline your pricing structure, payment milestones, and total cost.",
  },
  {
    id: "risk",
    title: "Risk Mitigation",
    markdown: "Identify key risks and your strategies to mitigate them.",
  },
];

interface IngestPhaseProps {
  onAnalyze: (file: File) => void;
}

export function IngestPhase({ onAnalyze }: IngestPhaseProps) {
  const [blocks, setBlocks] = useState<ProposalBlock[]>(DEFAULT_BLOCKS);

  const updateBlock = (id: string, markdown: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, markdown } : b))
    );
  };

  const hasContent = blocks.some((b) => b.markdown.trim().length > 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-full max-w-3xl mx-auto space-y-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {block.title}
                </h3>
              </div>
              <Textarea
                value={block.markdown}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                placeholder={`Write ${block.title.toLowerCase()} content…`}
                className="min-h-[100px] resize-y border-none bg-muted/30 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border bg-card px-8 py-4 flex justify-center">
        <Button
          size="lg"
          disabled={!hasContent}
          onClick={() => {
            // Create a synthetic file from blocks for downstream compatibility
            const combined = blocks
              .map((b) => `## ${b.title}\n\n${b.markdown}`)
              .join("\n\n---\n\n");
            const blob = new Blob([combined], { type: "text/markdown" });
            const syntheticFile = new File([blob], "proposal-blocks.md", {
              type: "text/markdown",
            });
            onAnalyze(syntheticFile);
          }}
          className="px-8 py-6 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
        >
          Analyze & Draft
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
