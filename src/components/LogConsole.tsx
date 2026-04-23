import { useState, useEffect, useRef } from "react";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE } from "@/lib/api";

const MAX_LINES = 200;

export function LogConsole() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/logs/stream`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "log") {
          setLines((prev) => [...prev.slice(-(MAX_LINES - 1)), event.line]);
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, open]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Terminal className="h-3.5 w-3.5 shrink-0" />
        <span>Backend Logs</span>
        {lines.length > 0 && !open && (
          <span className="ml-1 text-[10px] text-primary font-medium">
            ({lines.length})
          </span>
        )}
        <span className="ml-auto">
          {open
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronUp className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open && (
        <pre className="h-48 overflow-y-auto px-4 py-2 text-[10px] font-mono text-green-400 bg-black/90 leading-relaxed">
          {lines.length === 0
            ? <span className="text-muted-foreground">No logs yet — backend activity will appear here.</span>
            : lines.map((l, i) => <div key={i}>{l}</div>)
          }
          <div ref={bottomRef} />
        </pre>
      )}
    </div>
  );
}
