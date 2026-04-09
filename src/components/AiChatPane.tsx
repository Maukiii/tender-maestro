import { useState, useRef, useEffect } from "react";
import { Bot, SendHorizonal, X, Quote, Layers, PenLine, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat } from "@/lib/api";
import type { SelectionContext as ApiContext, ChatMessage as ApiChatMessage } from "@/lib/api";

export interface SelectionContext {
  text: string;
  blockTitle: string;
  blockId?: string;
  /** When set, this references an entire section rather than selected text */
  sectionLabel?: string;
}

interface AiChatPaneProps {
  selection: SelectionContext | null;
  onClearSelection: () => void;
  onApplyToBlock: (blockId: string, aiResponse: string, selectionText: string) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  /** Context snapshot captured when this assistant message was generated */
  contextSnapshot?: SelectionContext | null;
}

export function AiChatPane({ selection, onClearSelection, onApplyToBlock }: AiChatPaneProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Demo mode: contextual fake responses ──────────────────────────────
  const DEMO_MODE = true;

  const pickDemoResponse = (userText: string, ctx: SelectionContext | null): string => {
    const q = userText.toLowerCase();

    if (ctx?.sectionLabel?.toLowerCase().includes("methodology") || q.includes("methodol")) {
      return "I've refined the methodology section to better align with the DORA requirements outlined in the tender. The evidence classification framework now explicitly references Article 29 DORA and includes the three-tier provider typology (Cloud Infrastructure, Payment Technology, Core Banking Software) with precision targets of ≥97%. I also strengthened the language around concentration risk analysis to mirror EBA's oversight mandate.";
    }
    if (ctx?.sectionLabel?.toLowerCase().includes("team") || q.includes("team")) {
      return "Based on the EBA tender requirements, I'd recommend leading with Dr. Anna Becker as Project Director — her 12 years in financial regulation and prior EBA engagement give us the strongest compliance narrative. Marcus Weber covers the data methodology angle well, and Sofia Chen's background in ICT supply-chain mapping directly addresses the CTPP identification workstream.";
    }
    if (ctx?.sectionLabel?.toLowerCase().includes("price") || q.includes("price") || q.includes("budget")) {
      return "I've recalculated the pricing based on the current team composition. The total comes to **€287,400** across 3 senior consultants and 1 junior analyst over the 10-month delivery period. This sits comfortably within the EBA's estimated budget ceiling of €350,000 and leaves a 6% contingency margin for travel to the Paris headquarters.";
    }
    if (q.includes("executive") || q.includes("summary")) {
      return "Done — I've tightened the executive summary to lead with our unique value proposition: the 6,400+ verified ICT provider dataset and our proprietary evidence-classification methodology. The revised version now opens with the DORA regulatory context before positioning Meridian's capabilities, which should score higher on the 'Understanding of Objectives' criterion (weighted at 30%).";
    }
    if (q.includes("shorten") || q.includes("concise") || q.includes("shorter")) {
      return "Shortened. I removed redundant qualifiers and consolidated the three introductory paragraphs into one. The section now reads more decisively — important for EU evaluators who typically review 15–20 proposals per lot. Word count reduced from 340 to 185 without losing any substantive content.";
    }
    if (q.includes("compliance") || q.includes("legal") || q.includes("regulation")) {
      return "I've cross-referenced the proposal against the key DORA provisions (Articles 28–44) and the EBA's selection criteria. Two gaps flagged: (1) we should explicitly mention our ISO 27001 certification in the Quality Assurance section, and (2) the reference to 'financial sector ICT providers' should use the official DORA terminology 'third-party ICT service providers' consistently throughout.";
    }
    if (q.includes("improve") || q.includes("rewrite") || q.includes("better")) {
      return "Improved. I restructured the paragraph to follow the Problem → Approach → Evidence pattern that scores well in EU technical evaluations. I also added a concrete data point (800,000+ ICT providers in the EU27 seed universe) to demonstrate the scale of our identification methodology, directly addressing the tender's emphasis on empirical rigour.";
    }
    // Default
    return "Done — I've updated the section based on the EBA tender specifications and aligned the language with DORA's regulatory framework. The changes strengthen our positioning against the award criteria, particularly on technical methodology (40% weight) and team competence (30% weight). Let me know if you'd like me to adjust the tone or add more specific references.";
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");

    const contextSnapshot = selection ? { ...selection } : null;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true, contextSnapshot },
    ]);
    setIsStreaming(true);

    if (DEMO_MODE) {
      const demoResponse = pickDemoResponse(text, selection);
      for (const char of demoResponse) {
        await new Promise((r) => setTimeout(r, 12 + Math.random() * 18));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + char } : m
          )
        );
      }
    } else {
      const history: ApiChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const context: ApiContext | undefined = selection
        ? { text: selection.text, blockTitle: selection.blockTitle || undefined, sectionLabel: selection.sectionLabel }
        : undefined;

      try {
        for await (const chunk of streamChat(text, context, history)) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      } catch (err) {
        console.error("Chat stream error:", err);
      }
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
    );
    setIsStreaming(false);
  };

  const handleApply = (msg: ChatMessage) => {
    const ctx = msg.contextSnapshot;
    if (!ctx?.blockId || !msg.content) return;
    onApplyToBlock(ctx.blockId, msg.content, ctx.text);
    setAppliedIds((prev) => new Set(prev).add(msg.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isSection = selection?.sectionLabel && !selection.blockTitle;

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col h-screen">
      {/* Header */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
            <div className="p-3 rounded-full bg-accent">
              <Bot className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">How can I help?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select text in a block, then ask me to rewrite or improve it — I'll offer to apply my response directly.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const canApply =
              msg.role === "assistant" &&
              !msg.streaming &&
              !!msg.content &&
              !!msg.contextSnapshot?.blockId;
            const wasApplied = appliedIds.has(msg.id);

            return (
              <div key={msg.id} className="flex flex-col gap-1">
                <div
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      msg.content ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1 prose-headings:my-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : msg.streaming ? (
                        <div className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                        </div>
                      ) : null
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>

                {/* Apply to block button */}
                {canApply && (
                  <div className="flex justify-start ml-8">
                    <button
                      type="button"
                      onClick={() => handleApply(msg)}
                      disabled={wasApplied}
                      className={`flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1 transition-colors border ${
                        wasApplied
                          ? "text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 cursor-default"
                          : "text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60"
                      }`}
                    >
                      {wasApplied ? (
                        <>
                          <Check className="h-3 w-3" />
                          Applied
                        </>
                      ) : (
                        <>
                          <PenLine className="h-3 w-3" />
                          Apply to block
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selection / section reference quote */}
      {selection && (
        <div className="shrink-0 border-t border-border px-3 pt-3">
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            {isSection ? (
              <Layers className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            ) : (
              <Quote className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary mb-0.5">
                {isSection ? `Section: ${selection.sectionLabel}` : selection.blockTitle}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {selection.text}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary/40 transition-shadow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selection ? "Ask about this selection…" : "Ask the AI assistant…"}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
            aria-label="Send message"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
