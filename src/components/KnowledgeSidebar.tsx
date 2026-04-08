import { useEffect, useState, useRef } from "react";
import { Database, Plus, ChevronRight } from "lucide-react";
import type { ProposalSection } from "@/lib/proposalData";

interface SectionSidebarProps {
  sections: ProposalSection[];
  activeSectionId: string;
  onSelect: (sectionId: string) => void;
  scrollContainer: HTMLElement | null;
}

const RECOMMENDATIONS: Record<string, { label: string; hint: string }[]> = {
  staffing: [
    { label: "Sarah Mitchell", hint: "Project Director — 18 yrs" },
    { label: "Marcus Webb", hint: "DevOps Engineer — 6 yrs" },
    { label: "James Chen", hint: "Senior Developer — 9 yrs" },
  ],
  technical: [
    { label: "CI/CD Pipeline", hint: "From past tender #31" },
    { label: "Data Migration Plan", hint: "Template available" },
  ],
  pricing: [
    { label: "Maintenance Add-on", hint: "$45k/yr — common upsell" },
  ],
  risk: [
    { label: "Data Sovereignty", hint: "Relevant for gov tenders" },
  ],
  "exec-summary": [],
};

export function KnowledgeSidebar({ sections, activeSectionId, onSelect, scrollContainer }: SectionSidebarProps) {
  const [currentSectionId, setCurrentSectionId] = useState(activeSectionId);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollContainer) return;

    const handleScroll = () => {
      const sectionEls = sections
        .map((s) => ({
          id: s.id,
          el: scrollContainer.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement | null,
        }))
        .filter((s) => s.el !== null);

      const scrollTop = scrollContainer.scrollTop + 100;

      let active = sectionEls[0]?.id ?? sections[0].id;
      for (const { id, el } of sectionEls) {
        if (el && el.offsetTop <= scrollTop) {
          active = id;
        }
      }

      setCurrentSectionId(active);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainer, sections]);

  useEffect(() => {
    const activeEl = sidebarRef.current?.querySelector(`[data-sidebar-section="${currentSectionId}"]`);
    activeEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentSectionId]);

  return (
    <aside className="w-72 h-screen flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="px-5 py-6 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-sidebar-primary" />
          <h2 className="text-sm font-semibold text-sidebar-accent-foreground tracking-wide uppercase">
            SECTIONS
          </h2>
        </div>
      </div>

      <div ref={sidebarRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === currentSectionId;
          const recs = RECOMMENDATIONS[section.id] ?? [];

          return (
            <div key={section.id} data-sidebar-section={section.id}>
              <button
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
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                    isActive ? "rotate-90 text-sidebar-primary" : "text-sidebar-muted"
                  }`}
                />
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-muted"}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
              </button>

              {/* Expanded content: blocks + recommendations */}
              {isActive && (
                <div className="ml-5 mt-1 mb-2 border-l-2 border-sidebar-border pl-3 space-y-0.5">
                  {/* Current blocks */}
                  {section.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/80 truncate"
                    >
                      {block.title}
                    </div>
                  ))}

                  {/* Recommendations */}
                  {recs.length > 0 && (
                    <>
                      <div className="pt-2 pb-1">
                        <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-widest px-2">
                          Suggestions
                        </p>
                      </div>
                      {recs.map((rec) => (
                        <button
                          key={rec.label}
                          type="button"
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-sidebar-accent/50 transition-colors group"
                        >
                          <Plus className="h-3 w-3 text-sidebar-muted group-hover:text-sidebar-primary transition-colors shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-sidebar-foreground truncate">
                              {rec.label}
                            </p>
                            <p className="text-[10px] text-sidebar-muted truncate">
                              {rec.hint}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-sidebar-border shrink-0">
        <p className="text-xs text-sidebar-muted">
          Powered by AI Agent v2.1
        </p>
      </div>
    </aside>
  );
}
