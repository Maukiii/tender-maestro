import { useState, useCallback, useRef } from "react";
import { Eye, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProposalSection } from "@/lib/proposalData";

interface IngestPhaseProps {
  sections: ProposalSection[];
  onUpdateBlock: (blockId: string, markdown: string) => void;
  onTextSelect: (text: string, blockTitle: string) => void;
  onSectionReference: (sectionId: string) => void;
  onScrollContainerReady?: (el: HTMLElement) => void;
}

export function IngestPhase({ sections, onUpdateBlock, onTextSelect, onSectionReference, onScrollContainerReady }: IngestPhaseProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleMouseUp = useCallback(
    (blockTitle: string) => {
      // Use a short timeout so the selection is finalized before we read it
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 0) {
          onTextSelect(text, blockTitle);
        }
      }, 10);
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
                <div className="flex items-center gap-2 mb-4 group/heading">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {section.label}
                  </h2>
                  <div className="flex-1 h-px bg-border ml-2" />
                  <button
                    type="button"
                    onClick={() => onSectionReference(section.id)}
                    className="opacity-0 group-hover/heading:opacity-100 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-all"
                    aria-label={`Reference ${section.label} in AI chat`}
                    title="Reference in AI chat"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Blocks */}
                <div className="space-y-1">
                  {section.blocks.map((block) => {
                    const isEditing = editingId === block.id;

                    return (
                      <div
                        key={block.id}
                        className={`rounded-lg transition-all ${
                          isEditing
                            ? "ring-1 ring-primary/30 bg-card shadow-sm p-4"
                            : "hover:bg-muted/40 px-4 py-2 cursor-text"
                        }`}
                      >
                        {isEditing && (
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {block.title}
                            </h3>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="Done"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

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
                            onMouseDown={(e) => {
                              // Store the mouse-down target so we can check on click
                              (e.currentTarget as HTMLElement).dataset.mouseDownTime = String(Date.now());
                            }}
                            onClick={(e) => {
                              const sel = window.getSelection();
                              const hasSelection = sel && sel.toString().trim().length > 0;
                              if (!hasSelection) {
                                setEditingId(block.id);
                              }
                            }}
                            onMouseUp={() => handleMouseUp(block.title)}
                            className="prose prose-sm max-w-none text-foreground
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
