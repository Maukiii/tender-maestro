import { useState, useCallback, useEffect } from "react";
import { KnowledgeSidebar } from "@/components/KnowledgeSidebar";
import { AiChatPane } from "@/components/AiChatPane";
import { IngestPhase } from "@/components/IngestPhase";
import { ProcessingPhase } from "@/components/ProcessingPhase";
import { ReviewPhase } from "@/components/ReviewPhase";
import { DEFAULT_SECTIONS } from "@/lib/proposalData";
import type { ProposalSection } from "@/lib/proposalData";

type Phase = "ingest" | "processing" | "review";

const Index = () => {
  const [phase] = useState<Phase>("ingest");
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

  return (
    <div className="flex min-h-screen w-full">
      <KnowledgeSidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={setActiveSectionId}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-8 border-b border-border bg-card shrink-0">
          <h1 className="text-base font-semibold text-foreground">
            Tender Drafting Agent
          </h1>
        </header>

        {phase === "ingest" && (
          <IngestPhase
            blocks={activeSection.blocks}
            sectionLabel={activeSection.label}
            onUpdateBlock={handleUpdateBlock}
          />
        )}
      </main>

      <AiChatPane />
    </div>
  );
};

export default Index;
