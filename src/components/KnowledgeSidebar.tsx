import { useEffect, useState, useRef } from "react";
import { Database, Plus, ChevronRight, FolderPlus } from "lucide-react";
import type { ProposalSection } from "@/lib/proposalData";
import { SECTION_TEMPLATES } from "@/lib/sectionTemplates";

interface SectionSidebarProps {
  sections: ProposalSection[];
  activeSectionId: string;
  onSelect: (sectionId: string) => void;
  scrollContainer: HTMLElement | null;
  onAddSection: (label: string) => void;
  onAddBlock: (sectionId: string, title: string) => void;
}

const RECOMMENDATIONS: Record<string, { label: string; hint: string }[]> = {
  team: [
    { label: "Sarah Mitchell", hint: "Project Director — 18 yrs" },
    { label: "Marcus Webb", hint: "DevOps Engineer — 6 yrs" },
    { label: "James Chen", hint: "Senior Developer — 9 yrs" },
  ],
  methodology: [
    { label: "CI/CD Pipeline", hint: "From past tender #31" },
    { label: "Data Migration Plan", hint: "Template available" },
  ],
  pricing: [
    { label: "Maintenance Add-on", hint: "€45k/yr — common upsell" },
  ],
};

export function KnowledgeSidebar({
  sections,
  activeSectionId,
  onSelect,
  scrollContainer,
  onAddSection,
  onAddBlock,
}: SectionSidebarProps) {
  const [currentSectionId, setCurrentSectionId] = useState(activeSectionId);
  const [addingSectionName, setAddingSectionName] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingBlockForSection, setAddingBlockForSection] = useState<string | null>(null);
  const [newBlockName, setNewBlockName] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);
  const blockInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (addingSectionName) sectionInputRef.current?.focus();
  }, [addingSectionName]);

  useEffect(() => {
    if (addingBlockForSection) blockInputRef.current?.focus();
  }, [addingBlockForSection]);

  const commitNewSection = () => {
    const name = newSectionName.trim();
    if (name) {
      onAddSection(name);
    }
    setNewSectionName("");
    setAddingSectionName(false);
  };

  const commitNewBlock = (sectionId: string) => {
    const name = newBlockName.trim();
    if (name) {
      onAddBlock(sectionId, name);
    }
    setNewBlockName("");
    setAddingBlockForSection(null);
  };

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

              {isActive && (
                <div className="ml-5 mt-1 mb-2 border-l-2 border-sidebar-border pl-3 space-y-0.5">
                  {section.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/80 truncate"
                    >
                      {block.title}
                    </div>
                  ))}

                  {/* Add block inline input */}
                  {addingBlockForSection === section.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); commitNewBlock(section.id); }}
                      className="px-2 py-1"
                    >
                      <input
                        ref={blockInputRef}
                        value={newBlockName}
                        onChange={(e) => setNewBlockName(e.target.value)}
                        onBlur={() => commitNewBlock(section.id)}
                        placeholder="Block name…"
                        className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded px-2 py-1 text-xs text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-sidebar-primary"
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAddingBlockForSection(section.id); setNewBlockName(""); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <Plus className="h-3 w-3 shrink-0" />
                      <span className="text-xs">Add block</span>
                    </button>
                  )}

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
                          onClick={() => onAddBlock(section.id, rec.label)}
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

        {/* Add new section */}
        {addingSectionName ? (
          <form
            onSubmit={(e) => { e.preventDefault(); commitNewSection(); }}
            className="px-3 py-2"
          >
            <input
              ref={sectionInputRef}
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onBlur={commitNewSection}
              placeholder="Section name…"
              className="w-full bg-sidebar-accent/50 border border-sidebar-border rounded-lg px-3 py-2 text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-1 focus:ring-sidebar-primary"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => { setAddingSectionName(true); setNewSectionName(""); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <FolderPlus className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Add section</span>
          </button>
        )}
      </div>

      <div className="px-5 py-4 border-t border-sidebar-border shrink-0">
        <p className="text-xs text-sidebar-muted">
          Powered by AI Agent v2.1
        </p>
      </div>
    </aside>
  );
}
