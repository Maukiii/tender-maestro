import { useState, useCallback, useEffect } from "react";
import { KnowledgeSidebar } from "@/components/KnowledgeSidebar";
import { IngestPhase } from "@/components/IngestPhase";
import { ProcessingPhase } from "@/components/ProcessingPhase";
import { ReviewPhase } from "@/components/ReviewPhase";
import {
  fetchKnowledgeStats,
  uploadTenderDocument,
  analyzeTender,
} from "@/lib/api";
import type { KnowledgeStats } from "@/lib/api";

type Phase = "ingest" | "processing" | "review";

const Index = () => {
  const [phase, setPhase] = useState<Phase>("ingest");
  const [stats, setStats] = useState<KnowledgeStats>({
    pastTenders: 0,
    teamCVs: 0,
    policyDocs: 0,
    templateLibrary: 0,
  });
  const [statusText, setStatusText] = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetchKnowledgeStats().then(setStats);
  }, []);

  const handleAnalyze = useCallback(async (file: File) => {
    setPhase("processing");

    const { documentId } = await uploadTenderDocument(file);

    const result = await analyzeTender(documentId, (status) => {
      setStatusText(status.step);
      setProgress(status.progress);
    });

    setDraft(result.markdown);
    setPhase("review");
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <KnowledgeSidebar stats={stats} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-8 border-b border-border bg-card shrink-0">
          <h1 className="text-base font-semibold text-foreground">
            Tender Drafting Agent
          </h1>
          {phase === "review" && (
            <button
              onClick={() => {
                setPhase("ingest");
                setDraft("");
                setProgress(0);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← New Tender
            </button>
          )}
        </header>

        {phase === "ingest" && <IngestPhase onAnalyze={handleAnalyze} />}
        {phase === "processing" && (
          <ProcessingPhase statusText={statusText} progress={progress} />
        )}
        {phase === "review" && (
          <ReviewPhase draft={draft} onDraftUpdate={setDraft} />
        )}
      </main>
    </div>
  );
};

export default Index;
