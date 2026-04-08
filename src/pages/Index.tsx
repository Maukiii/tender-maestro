import { useState, useCallback } from "react";
import { KnowledgeSidebar } from "@/components/KnowledgeSidebar";
import { AiChatPane } from "@/components/AiChatPane";
import type { SelectionContext } from "@/components/AiChatPane";
import { IngestPhase } from "@/components/IngestPhase";
import { ProjectSelection } from "@/components/ProjectSelection";
import { ProcessingPhase } from "@/components/ProcessingPhase";
import { DEFAULT_SECTIONS } from "@/lib/proposalData";
import type { ProposalSection } from "@/lib/proposalData";
import { SECTION_TEMPLATES, getTemplateById } from "@/lib/sectionTemplates";
import { draftProposal } from "@/lib/api";
import { ArrowLeft, FileText } from "lucide-react";

type View = "projects" | "drafting" | "editor";

let idCounter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

export const Index = () => {
  const [view, setView] = useState<View>("projects");
  const [sections, setSections] = useState<ProposalSection[]>(DEFAULT_SECTIONS);
  const [selection, setSelection] = useState<SelectionContext | null>(null);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const [draftingStatus, setDraftingStatus] = useState("Starting agents…");
  const [draftingProgress, setDraftingProgress] = useState(0);
  const [draftingError, setDraftingError] = useState<string | null>(null);

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

  const handleTextSelect = useCallback((text: string, blockTitle: string, blockId: string) => {
    setSelection({ text, blockTitle, blockId });
  }, []);

  const handleSectionReference = useCallback((sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const allText = section.blocks.map((b) => `**${b.title}**\n${b.markdown}`).join("\n\n");
    setSelection({ text: allText, blockTitle: "", sectionLabel: section.label });
  }, [sections]);

  const handleSidebarSelect = useCallback((sectionId: string) => {
    if (!scrollContainer) return;
    const el = scrollContainer.querySelector(`[data-section-id="${sectionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollContainer]);

  const handleAddSection = useCallback((label: string) => {
    // Look up canonical template for pre-structured blocks
    const template = SECTION_TEMPLATES.find(
      (t) => t.label.toLowerCase() === label.toLowerCase() || t.id === label,
    );
    const newSection: ProposalSection = {
      id: genId("section"),
      label,
      icon: template?.icon ?? FileText,
      blocks: template
        ? template.blocks.map((bt) => ({
            id: genId("block"),
            title: bt.titleSuffix,
            markdown: bt.markdown,
          }))
        : [{ id: genId("block"), title: "Untitled Block", markdown: "" }],
    };
    setSections((prev) => [...prev, newSection]);
  }, []);

  const handleApplyToBlock = useCallback((blockId: string, aiResponse: string, selectionText: string) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        blocks: section.blocks.map((b) => {
          if (b.id !== blockId) return b;
          // Partial replacement when selected text is found literally in the markdown
          if (selectionText && b.markdown.includes(selectionText)) {
            return { ...b, markdown: b.markdown.replace(selectionText, aiResponse) };
          }
          // Full block replacement
          return { ...b, markdown: aiResponse };
        }),
      }))
    );
  }, []);

  const handleAddBlock = useCallback((sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, blocks: [...section.blocks, { id: genId("block"), title, markdown: "" }] }
          : section
      )
    );
  }, []);

  const handleSelectTender = useCallback(async (documentId: string) => {
    setDraftingStatus("Starting agents…");
    setDraftingProgress(0);
    setDraftingError(null);
    setView("drafting");

    try {
      const draftedSections = await draftProposal(documentId, (step, progress) => {
        setDraftingStatus(step);
        setDraftingProgress(progress);
      });

      // Map backend DraftedSection[] → ProposalSection[]
      const built: ProposalSection[] = draftedSections.map((ds) => {
        const template = getTemplateById(ds.section_id);
        return {
          id: genId("section"),
          label: template?.label ?? ds.section_id,
          icon: template?.icon ?? FileText,
          blocks: ds.blocks.map((b) => ({
            id: genId("block"),
            title: b.title,
            markdown: b.markdown,
          })),
        };
      });

      if (built.length > 0) {
        setSections(built);
        setView("editor");
      } else {
        setDraftingError("Agents returned no sections. Check the backend logs.");
      }
    } catch (err) {
      console.error("[draftProposal] failed:", err);
      setDraftingError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  if (view === "projects") {
    return <ProjectSelection onSelect={handleSelectTender} />;
  }

  if (view === "drafting") {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
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
          <h1 className="text-base font-semibold text-foreground">Generating Proposal…</h1>
        </header>
        {draftingError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
            <p className="text-base font-semibold text-destructive">Drafting failed</p>
            <pre className="text-xs text-muted-foreground bg-muted rounded-lg px-4 py-3 max-w-lg whitespace-pre-wrap">
              {draftingError}
            </pre>
            <button
              type="button"
              onClick={() => setView("projects")}
              className="text-sm text-primary hover:underline"
            >
              ← Back to projects
            </button>
          </div>
        ) : (
          <ProcessingPhase statusText={draftingStatus} progress={draftingProgress} />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <KnowledgeSidebar
        sections={sections}
        activeSectionId={sections[0].id}
        onSelect={handleSidebarSelect}
        scrollContainer={scrollContainer}
        onAddSection={handleAddSection}
        onAddBlock={handleAddBlock}
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
            Block View
          </h1>
        </header>

        <IngestPhase
          sections={sections}
          onUpdateBlock={handleUpdateBlock}
          onTextSelect={handleTextSelect}
          onSectionReference={handleSectionReference}
          onScrollContainerReady={setScrollContainer}
        />
      </main>

      <AiChatPane
        selection={selection}
        onClearSelection={() => setSelection(null)}
        onApplyToBlock={handleApplyToBlock}
      />
    </div>
  );
};

export default Index;
