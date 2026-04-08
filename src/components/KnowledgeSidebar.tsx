import { useState, useCallback } from "react";
import {
  FileText,
  Users,
  Shield,
  LayoutTemplate,
  Upload,
  Database,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeStats } from "@/lib/api";
import { uploadKnowledgeDocument } from "@/lib/api";

interface KnowledgeSidebarProps {
  stats: KnowledgeStats;
}

const statItems = [
  { key: "pastTenders" as const, label: "Past Tenders", icon: FileText },
  { key: "teamCVs" as const, label: "Team CVs", icon: Users },
  { key: "policyDocs" as const, label: "Policy Docs", icon: Shield },
  { key: "templateLibrary" as const, label: "Templates", icon: LayoutTemplate },
];

export function KnowledgeSidebar({ stats }: KnowledgeSidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      await uploadKnowledgeDocument(file);
      toast.success("Document embedded and added to Vector Store.", {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } catch {
      toast.error("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <aside className="w-72 min-h-screen flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-sidebar-primary" />
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground tracking-wide uppercase">
            Knowledge Base
          </h2>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 space-y-1">
        <p className="text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-3">
          Status
        </p>
        {statItems.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-sidebar-muted" />
              <span className="text-sm text-sidebar-foreground">{label}</span>
            </div>
            <span className="text-sm font-semibold text-sidebar-primary">
              {stats[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Upload Dropzone */}
      <div className="px-5 py-4 mt-auto">
        <p className="text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-3">
          Upload Document
        </p>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200
            ${
              dragOver
                ? "border-sidebar-primary bg-sidebar-accent"
                : "border-sidebar-border hover:border-sidebar-primary/60 hover:bg-sidebar-accent/50"
            }
            ${uploading ? "opacity-60 pointer-events-none" : ""}
          `}
        >
          <Upload
            className={`h-6 w-6 text-sidebar-muted ${uploading ? "animate-pulse-gentle" : ""}`}
          />
          <span className="text-xs text-sidebar-foreground text-center leading-relaxed">
            {uploading ? "Embedding..." : "Drop file or click to upload"}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleInputChange}
            accept=".pdf,.docx,.doc,.txt,.md"
          />
        </label>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-muted">
          Powered by AI Agent v2.1
        </p>
      </div>
    </aside>
  );
}
