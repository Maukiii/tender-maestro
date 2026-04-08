import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviseDraft } from "@/api/tenderApi";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

interface ReviewPhaseProps {
  draft: string;
  onDraftUpdate: (newDraft: string) => void;
}

export function ReviewPhase({ draft, onDraftUpdate }: ReviewPhaseProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [revising, setRevising] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const instruction = input.trim();
      if (!instruction || revising) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: instruction }]);
      setRevising(true);

      try {
        const result = await reviseDraft({
          instruction,
          currentDraft: draft,
        });
        onDraftUpdate(result.markdown);
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: result.agentMessage },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "agent", content: "Sorry, revision failed. Please try again." },
        ]);
      } finally {
        setRevising(false);
      }
    },
    [input, draft, revising, onDraftUpdate]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Draft Area — scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin relative">
        {revising && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-300">
            <div className="flex items-center gap-3 bg-card px-6 py-3 rounded-xl shadow-lg border border-border">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm font-medium text-foreground">
                Revising draft...
              </span>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="prose prose-slate max-w-none">
            <MarkdownRenderer content={draft} />
          </div>
        </div>
      </div>

      {/* Chat Panel — fixed bottom */}
      <div className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-8 py-4 space-y-3">
          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "agent" && (
                    <div className="p-1 rounded bg-accent shrink-0">
                      <Bot className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                  )}
                  <span
                    className={`inline-block px-3 py-1.5 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </span>
                  {msg.role === "user" && (
                    <div className="p-1 rounded bg-primary/10 shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Instruct the agent to revise the draft (e.g., 'Remove Fabi from the team', 'Make the methodology shorter')"
              disabled={revising}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || revising}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Simple markdown-to-HTML renderer for the draft */
function MarkdownRenderer({ content }: { content: string }) {
  const html = content
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match
        .split("|")
        .filter(Boolean)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "___TABLE_SEP___";
      return `<tr>${cells.map((c) => `<td class="border border-border px-3 py-2 text-sm">${c}</td>`).join("")}</tr>`;
    })
    .replace(
      /(<tr>[\s\S]*?<\/tr>\n?)___TABLE_SEP___\n?/g,
      (match) =>
        `<table class="w-full border-collapse border border-border my-4"><thead>${match.replace("___TABLE_SEP___", "").replace(/<td/g, "<th").replace(/<\/td>/g, "</th>")}</thead><tbody>`
    )
    .replace(/(<\/tr>)\n(?!<tr>)/g, "$1</tbody></table>\n")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-foreground mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-foreground mb-4">$1</h1>')
    // HR
    .replace(/^---$/gm, '<hr class="my-6 border-border" />')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // List items
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-foreground/90">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-sm text-foreground/90">$2</li>')
    // Paragraphs for remaining lines
    .replace(/^(?!<[hltuo]|<hr|<st|<em|___)([\w].+)$/gm, '<p class="text-sm leading-relaxed text-foreground/85 mb-3">$1</p>');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
