import { useState, useCallback, useRef, useEffect } from "react";
import { FileText, Plus, Clock, ChevronRight, Upload, X, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTenders, uploadTenderDocument, scoreTender, type UploadedTender, type TenderScore } from "@/lib/api";

import type { TenderProject } from "@/types/tender";

const MOCK_PROJECTS: TenderProject[] = [
  {
    id: "proj-1",
    name: "Digital Transformation Platform",
    client: "Ministry of Digital Affairs",
    updatedAt: "2 hours ago",
    sectionsCount: 5,
    status: "draft",
  },
  {
    id: "proj-2",
    name: "Cloud Migration Programme",
    client: "National Health Authority",
    updatedAt: "1 day ago",
    sectionsCount: 4,
    status: "in-review",
  },
  {
    id: "proj-3",
    name: "Cybersecurity Framework Upgrade",
    client: "Defence Procurement Agency",
    updatedAt: "3 days ago",
    sectionsCount: 6,
    status: "submitted",
  },
  {
    id: "proj-4",
    name: "Smart City IoT Infrastructure",
    client: "Urban Development Corp",
    updatedAt: "1 week ago",
    sectionsCount: 5,
    status: "draft",
  },
];

// ── Score display helpers ─────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-400";
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 14;
  const sw = 2.5;
  const vb = 36;
  const center = vb / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
        <svg className="-rotate-90" width={40} height={40} viewBox={`0 0 ${vb} ${vb}`}>
          <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-muted/30" />
          <circle
            cx={center} cy={center} r={r} fill="none"
            strokeWidth={sw} strokeLinecap="round" stroke="currentColor"
            className={getScoreColor(score)}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={`absolute text-[10px] font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: TenderScore["decision"] }) {
  const isBid = decision === "BID";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
      isBid
        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
        : "text-red-500 bg-red-500/10 border-red-500/20"
    }`}>
      {decision}
    </span>
  );
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function formatUploadedAt(iso: string): string {
  try {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } catch {
    return iso;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ProjectSelectionProps {
  onSelect: (projectId: string) => void;
}

export function ProjectSelection({ onSelect }: ProjectSelectionProps) {
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tenders, setTenders] = useState<UploadedTender[]>([]);
  // IDs of tenders currently being scored (show spinner)
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshTenders = useCallback(async () => {
    try {
      const data = await listTenders();
      setTenders(data);
    } catch {
      // backend not running — keep current list
    }
  }, []);

  useEffect(() => {
    refreshTenders();
  }, [refreshTenders]);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setShowUploadOverlay(false);
    let docId: string | null = null;
    try {
      const { documentId } = await uploadTenderDocument(file);
      docId = documentId;
      await refreshTenders(); // card appears immediately (no score yet)
    } finally {
      setUploading(false);
    }

    if (!docId) return;

    // Kick off scoring in the background; card shows a spinner until done
    setScoringIds((prev) => new Set(prev).add(docId!));
    scoreTender(docId)
      .then(() => refreshTenders())
      .catch(console.error)
      .finally(() =>
        setScoringIds((prev) => {
          const next = new Set(prev);
          next.delete(docId!);
          return next;
        })
      );
  }, [refreshTenders]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  // Sort scored tenders by overall score (desc), unscored at the bottom
  const sortedTenders = [...tenders].sort((a, b) => {
    const sa = a.score?.overall_score ?? -1;
    const sb = b.score?.overall_score ?? -1;
    return sb - sa;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-8 border-b border-border bg-card shrink-0">
        <h1 className="text-base font-semibold text-foreground">
          Tender Drafting Agent
        </h1>
        <Button size="sm" className="gap-1.5" onClick={() => setShowUploadOverlay(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Proposal
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-3xl space-y-10">

          {/* Incoming Tenders */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Incoming Tenders
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-scored against your company profile. Click to start a proposal.
              </p>
            </div>

            {/* Upload zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`
                flex items-center gap-4 p-5 rounded-xl border-2 border-dashed transition-colors
                ${uploading ? "opacity-60 cursor-wait" : "cursor-pointer"}
                ${isDraggingOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-accent/50"
                }
              `}
            >
              <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${isDraggingOver ? "bg-primary/10" : "bg-accent"}`}>
                <Upload className={`h-5 w-5 transition-colors ${isDraggingOver ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {uploading ? "Uploading…" : "Upload Tender Document"}
                </p>
                <p className="text-xs text-muted-foreground">Drop a PDF or DOCX here, or click to browse</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Tender cards */}
            {tenders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tenders yet — upload one above.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedTenders.map((tender) => {
                  const isScoring = scoringIds.has(tender.id);
                  const score = tender.score;

                  return (
                    <button
                      key={tender.id}
                      type="button"
                      onClick={() => onSelect(tender.id)}
                      className="w-full flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all text-left group"
                    >
                      {/* Score rings or loading indicator */}
                      {isScoring ? (
                        <div className="flex items-center justify-center w-10 h-10 shrink-0">
                          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        </div>
                      ) : score ? (
                        <div className="flex items-center gap-3 shrink-0">
                          <ScoreRing score={score.company_fit_score} label="Co." />
                          <ScoreRing score={score.team_fit_score} label="Team" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-accent shrink-0">
                          <FileText className="h-5 w-5 text-accent-foreground" />
                        </div>
                      )}

                      {/* Tender info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {tender.filename}
                          </h3>
                          {score && <DecisionBadge decision={score.decision} />}
                          {isScoring && (
                            <span className="text-[10px] text-muted-foreground">Scoring…</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatUploadedAt(tender.uploadedAt)}</span>
                          {score && (
                            <>
                              <span>·</span>
                              <span className={`font-medium ${getScoreColor(score.overall_score)}`}>
                                {score.overall_score}% overall
                              </span>
                            </>
                          )}
                        </div>
                        {score?.company_fit_reasoning && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {score.company_fit_reasoning}
                          </p>
                        )}
                        {score?.ko_criterion_triggered && (
                          <p className="text-[11px] text-red-500 line-clamp-1">
                            KO: {score.ko_criterion_triggered}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-border" />

          {/* Existing Proposals */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Your Proposals
              </h2>
              <p className="text-sm text-muted-foreground">
                Continue working on an existing proposal.
              </p>
            </div>

            <div className="space-y-3">
              {MOCK_PROJECTS.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelect(project.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all text-left group"
                >
                  <div className="p-2.5 rounded-lg bg-accent shrink-0">
                    <FileText className="h-5 w-5 text-accent-foreground" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{project.client}</span>
                      <span>·</span>
                      <span>{project.sectionsCount} sections</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.updatedAt}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload overlay */}
      {showUploadOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowUploadOverlay(false)}
        >
          <div
            className="relative w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowUploadOverlay(false)}
              className="absolute -top-10 right-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-4 rounded-2xl
                border-2 border-dashed cursor-pointer
                px-8 py-16 transition-colors
                ${isDraggingOver
                  ? "border-green-500 bg-green-500/10"
                  : "border-green-500/60 bg-card hover:border-green-500 hover:bg-green-500/5"
                }
              `}
            >
              <div className={`p-4 rounded-full transition-colors ${isDraggingOver ? "bg-green-500/20" : "bg-muted"}`}>
                <Upload className={`h-8 w-8 transition-colors ${isDraggingOver ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Drop your Tender Document here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse — PDF, DOCX
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
