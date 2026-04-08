import { useState, useCallback } from "react";
import { GripVertical, Pencil, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

interface ProposalBlock {
  id: string;
  title: string;
  markdown: string;
}

const DEFAULT_BLOCKS: ProposalBlock[] = [
  {
    id: "exec-summary",
    title: "Executive Summary",
    markdown:
      "Provide a **high-level overview** of your proposal, key differentiators, and why your organisation is the best fit for this tender.",
  },
  {
    id: "technical-approach",
    title: "Technical Approach & Methodology",
    markdown:
      "Describe your delivery methodology, architecture decisions, key phases, and timeline.",
  },
  {
    id: "team",
    title: "Team Composition",
    markdown:
      "List the key personnel, their roles, and relevant experience.",
  },
  {
    id: "pricing",
    title: "Pricing Summary",
    markdown:
      "Outline your pricing structure, payment milestones, and total cost.",
  },
  {
    id: "risk",
    title: "Risk Mitigation",
    markdown:
      "Identify key risks and your strategies to mitigate them.",
  },
];

export function IngestPhase() {
  const [blocks, setBlocks] = useState<ProposalBlock[]>(DEFAULT_BLOCKS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateBlock = useCallback((id: string, markdown: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, markdown } : b))
    );
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-full max-w-3xl mx-auto space-y-4">
          {blocks.map((block) => {
            const isEditing = editingId === block.id;

            return (
              <div
                key={block.id}
                className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground tracking-tight">
                      {block.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId(isEditing ? null : block.id)
                    }
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label={isEditing ? "Preview" : "Edit"}
                  >
                    {isEditing ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {isEditing ? (
                  <Textarea
                    autoFocus
                    value={block.markdown}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder={`Write ${block.title.toLowerCase()} content…`}
                    className="min-h-[120px] resize-y border-none bg-muted/30 text-sm leading-relaxed font-mono focus-visible:ring-1 focus-visible:ring-primary/30"
                  />
                ) : (
                  <div
                    onClick={() => setEditingId(block.id)}
                    className="prose prose-sm max-w-none text-foreground cursor-text rounded-lg px-3 py-2 bg-muted/30 min-h-[60px]
                      prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary
                      prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-p:my-1"
                  >
                    {block.markdown.trim() ? (
                      <ReactMarkdown>{block.markdown}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Click to edit…
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
