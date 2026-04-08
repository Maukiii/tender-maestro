import { useState, useCallback, useRef, useEffect } from "react";
import { GripVertical, Pencil, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProposalSection } from "@/lib/proposalData";

interface IngestPhaseProps {
  sections: ProposalSection[];
  onUpdateBlock: (blockId: string, markdown: string) => void;
  onTextSelect: (text: string, blockTitle: string) => void;
  onScrollContainerReady?: (el: HTMLElement) => void;
}

export function IngestPhase({ sections, onUpdateBlock, onTextSelect, onScrollContainerReady }: IngestPhaseProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleMouseUp = useCallback(
    (blockTitle: string) => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 0) {
        onTextSelect(text, blockTitle);
      }
    },
    [onTextSelect]
  );

  const scrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && onScrollContainerReady) onScrollContainerReady(el);
    },
    [onScrollContainerReady]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
                data-section-id={section.id}
              >
                {/* Section heading */}
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {section.label}
                  </h2>
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>

                {/* Blocks */}
                <div className="space-y-4">
                  {section.blocks.map((block) => {
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
                            onClick={() => setEditingId(isEditing ? null : block.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label={isEditing ? "Preview" : "Edit"}
                          >
                            {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                          </button>
                        </div>

                        {isEditing ? (
                          <Textarea
                            autoFocus
                            value={block.markdown}
                            onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                            onMouseUp={() => handleMouseUp(block.title)}
                            placeholder={`Write ${block.title.toLowerCase()} content…`}
                            className="min-h-[120px] resize-y border-none bg-muted/30 text-sm leading-relaxed font-mono focus-visible:ring-1 focus-visible:ring-primary/30"
                          />
                        ) : (
                          <div
                            onClick={() => {
                              const sel = window.getSelection();
                              if (!sel || sel.toString().trim().length === 0) {
                                setEditingId(block.id);
                              }
                            }}
                            onMouseUp={() => handleMouseUp(block.title)}
                            className="prose prose-sm max-w-none text-foreground cursor-text rounded-lg px-3 py-2 bg-muted/30 min-h-[60px]
                              prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary
                              prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-p:my-1"
                          >
                            {block.markdown.trim() ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.markdown}</ReactMarkdown>
                            ) : (
                              <p className="text-muted-foreground italic">Click to edit…</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
