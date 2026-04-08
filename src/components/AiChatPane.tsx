import { useState, useRef, useEffect } from "react";
import { Bot, SendHorizonal, X, Quote, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat } from "@/lib/api";
import type { SelectionContext as ApiContext, ChatMessage as ApiChatMessage } from "@/lib/api";

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
  streaming?: boolean;
}

export function AiChatPane({ selection, onClearSelection }: AiChatPaneProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");

    // Snapshot history before adding the new user message
    const history: ApiChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const context: ApiContext | undefined = selection
      ? {
          text: selection.text,
          blockTitle: selection.blockTitle || undefined,
          sectionLabel: selection.sectionLabel,
        }
      : undefined;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setIsStreaming(true);

    try {
      for await (const chunk of streamChat(text, context, history)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: detail } : m
        )
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
      setIsStreaming(false);
    }
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
              Ask anything about your proposal, or select text in the document for more context.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
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
          ))
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
