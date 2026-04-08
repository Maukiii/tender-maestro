import { useState, useCallback } from "react";
import { KnowledgeSidebar } from "@/components/KnowledgeSidebar";
import { AiChatPane } from "@/components/AiChatPane";
import { IngestPhase } from "@/components/IngestPhase";
import { ProjectSelection } from "@/components/ProjectSelection";
import { DEFAULT_SECTIONS } from "@/lib/proposalData";
import type { ProposalSection } from "@/lib/proposalData";
import { ArrowLeft } from "lucide-react";

type View = "projects" | "editor";

const Index = () => {
  const [view, setView] = useState<View>("projects");
  const [sections, setSections] = useState<ProposalSection[]>(DEFAULT_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState(DEFAULT_SECTIONS[0].id);

  const activeSection = sections.find((s) => s.id === activeSectionId) ?? sections[0];

  const handleUpdateBlock = useCallback((blockId: string, markdown: string) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        blocks: section.blocks.map((b) =>
          b.id === blockId ? { ...b, markdown } : b
        ),
      }))
    );
  }, []);

  if (view === "projects") {
    return <ProjectSelection onSelect={() => setView("editor")} />;
  }

  return (
    <div className="flex min-h-screen w-full">
      <KnowledgeSidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={setActiveSectionId}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <header className="h-14 flex items-center gap-4 px-8 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={() => setView("projects")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Projects
          </button>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-base font-semibold text-foreground">
            Tender Drafting Agent
          </h1>
        </header>

        <IngestPhase
          blocks={activeSection.blocks}
          sectionLabel={activeSection.label}
          onUpdateBlock={handleUpdateBlock}
        />
      </main>

      <AiChatPane />
    </div>
  );
};

export default Index;
