import { useState } from "react";
import { Bot, SendHorizonal, X, Quote, Layers } from "lucide-react";

export interface SelectionContext {
  text: string;
  blockTitle: string;
  /** When set, this references an entire section rather than selected text */
  sectionLabel?: string;
}

interface AiChatPaneProps {
  selection: SelectionContext | null;
  onClearSelection: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: string;
}

export function AiChatPane({ selection, onClearSelection }: AiChatPaneProps) {
  const [input, setInput] = useState("");
  const [messages] = useState<ChatMessage[]>([]);

  const isSection = selection?.sectionLabel && !selection.blockTitle;

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-card flex flex-col h-screen">
      {/* Header */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
            <div className="p-3 rounded-full bg-accent">
              <Bot className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {selection ? "Ask about the selection" : "How can I help?"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selection
                ? "Type a question or instruction about the highlighted text."
                : "Select text in the document, or reference a section heading."}
            </p>
          </div>
        )}
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
            placeholder={
              selection
                ? "Ask about this selection…"
                : "Select text or a section…"
            }
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="button"
            disabled={!input.trim()}
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
