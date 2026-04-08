import { useState } from "react";
import { Bot, SendHorizonal } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AiChatPane() {
  const [input, setInput] = useState("");
  const [messages] = useState<ChatMessage[]>([]);

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
              How can I help?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ask me to refine sections, suggest content, or review your proposal.
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary/40 transition-shadow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant…"
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
