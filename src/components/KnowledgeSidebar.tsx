import { Database } from "lucide-react";
import type { ProposalSection } from "@/lib/proposalData";

interface SectionSidebarProps {
  sections: ProposalSection[];
  activeSectionId: string;
  onSelect: (sectionId: string) => void;
}

export function KnowledgeSidebar({ sections, activeSectionId, onSelect }: SectionSidebarProps) {
  return (
    <aside className="w-72 min-h-screen flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-sidebar-primary" />
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground tracking-wide uppercase">
            Proposal Sections
          </h2>
        </div>
      </div>

      {/* Section list */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeSectionId;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                ${isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }
              `}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-muted"}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{section.label}</span>
                <span className="ml-2 text-xs text-sidebar-muted">
                  {section.blocks.length} {section.blocks.length === 1 ? "block" : "blocks"}
                </span>
              </div>
            </button>
          );
        })}
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
