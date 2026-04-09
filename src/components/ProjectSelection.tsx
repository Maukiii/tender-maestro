import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Clock, Plus, Target, Upload, X, Loader2, AlertTriangle, FileEdit, RotateCcw, Webhook, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTenders, uploadTenderDocument, scoreTender, fetchWebhookDrafts, type UploadedTender, type TenderScore, type WebhookDraft } from "@/lib/api";

// ── Score display helpers ─────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-400/10 border-red-400/20";
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

function ScoreExplanation({ score }: { score: TenderScore }) {
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3 text-left">
      {/* KO criterion */}
      {score.ko_criterion_triggered && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-500">
            <span className="font-semibold">K.O.: </span>
            {score.ko_criterion_triggered}
          </p>
        </div>
      )}

      {/* Reasoning + score tiles side by side */}
      <div className="flex gap-3">
        <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
          {score.company_fit_reasoning}
        </p>
        <div className="flex gap-2 shrink-0">
          <div className={`flex flex-col items-center justify-center w-14 p-2 rounded-lg border ${getScoreBg(score.company_fit_score)}`}>
            <span className={`text-sm font-bold ${getScoreColor(score.company_fit_score)}`}>{score.company_fit_score}%</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">Company</span>
          </div>
          <div className={`flex flex-col items-center justify-center w-14 p-2 rounded-lg border ${getScoreBg(score.team_fit_score)}`}>
            <span className={`text-sm font-bold ${getScoreColor(score.team_fit_score)}`}>{score.team_fit_score}%</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">Team</span>
          </div>
        </div>
      </div>

      {/* Team proposal — compact single-line rows */}
      {score.team_proposal && score.team_proposal.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Proposed Team</p>
          {score.team_proposal.map((member: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`font-semibold shrink-0 ${getScoreColor(member.total_score_percentage)}`}>
                {member.total_score_percentage}%
              </span>
              <span className="font-medium text-foreground shrink-0">{member.member_name}</span>
              <span className="text-muted-foreground truncate">· {member.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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
  onContinue: (projectId: string) => void;
}

export function ProjectSelection({ onSelect, onContinue }: ProjectSelectionProps) {
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tenders, setTenders] = useState<UploadedTender[]>([]);
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());
  const [scoringErrors, setScoringErrors] = useState<Map<string, string>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshTenders = useCallback(async () => {
    try {
      const data = await listTenders();
      setTenders(data);
    } catch {
      // backend not running — keep current list
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshTenders();
  }, [refreshTenders]);

  // Poll while any tender is being scored so the card updates automatically
  useEffect(() => {
    if (scoringIds.size === 0) return;
    const id = setInterval(refreshTenders, 3000);
    return () => clearInterval(id);
  }, [scoringIds.size, refreshTenders]);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setShowUploadOverlay(false);
    let docId: string | null = null;
    try {
      const { documentId } = await uploadTenderDocument(file);
      docId = documentId;
      await refreshTenders(); // card appears immediately, no score yet
    } finally {
      setUploading(false);
    }

    if (!docId) return;

    // Score in the background — card shows spinner until done
    setScoringIds((prev) => new Set(prev).add(docId!));
    setScoringErrors((prev) => { const m = new Map(prev); m.delete(docId!); return m; });
    scoreTender(docId)
      .then(() => refreshTenders())
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setScoringErrors((prev) => new Map(prev).set(docId!, msg));
        refreshTenders();
      })
      .finally(() =>
        setScoringIds((prev) => {
          const next = new Set(prev);
          next.delete(docId!);
          return next;
        })
      );
  }, [refreshTenders]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

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
          Upload Tender
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-3xl space-y-6">

          {/* Section header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Incoming Tenders
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-scored against your company profile. Click a card to expand the breakdown, then draft a proposal.
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
            <p className="text-sm text-muted-foreground text-center py-8">
              No tenders yet — upload one above.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedTenders.map((tender) => {
                const isScoring = scoringIds.has(tender.id);
                const scoringError = scoringErrors.get(tender.id);
                const score = tender.score;
                const isExpanded = expandedId === tender.id;

                return (
                  <div
                    key={tender.id}
                    className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
                  >
                    {/* Card header — toggles score explanation */}
                    <button
                      type="button"
                      onClick={() => score && setExpandedId(isExpanded ? null : tender.id)}
                      className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${
                        score ? "cursor-pointer hover:bg-accent/30" : "cursor-default"
                      }`}
                    >
                      {/* Score rings or spinner or error */}
                      {isScoring ? (
                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40 }}>
                          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        </div>
                      ) : scoringError ? (
                        <div className="p-2.5 rounded-lg bg-red-500/10 shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                      ) : score ? (
                        <div className="flex items-center gap-3 shrink-0">
                          <ScoreRing score={score.company_fit_score} label="Co." />
                          <ScoreRing score={score.team_fit_score} label="Team" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-accent shrink-0">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {tender.filename}
                          </h3>
                          {score && <DecisionBadge decision={score.decision} />}
                          {isScoring && (
                            <span className="text-[10px] text-muted-foreground italic">Analysing…</span>
                          )}
                          {scoringError && (
                            <span className="text-[10px] text-red-500 italic">Scoring failed</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatUploadedAt(tender.uploadedAt)}</span>
                          {score && (
                            <>
                              <span>·</span>
                              <span className={`font-medium ${getScoreColor(score.overall_score)}`}>
                                {score.overall_score}% overall fit
                              </span>
                            </>
                          )}
                          {scoringError && (
                            <>
                              <span>·</span>
                              <span className="text-red-500 truncate max-w-[200px]" title={scoringError}>
                                {scoringError}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expand chevron — only when scored */}
                      {score && (
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      )}
                    </button>

                    {/* Expanded score explanation + Draft action */}
                    {isExpanded && score && (
                      <div className="px-5 pb-5">
                        <ScoreExplanation score={score} />
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                          {tender.hasProposal && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-muted-foreground"
                              onClick={() => onSelect(tender.id)}
                              title="Discard saved draft and re-run all agents"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Re-Draft
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => tender.hasProposal ? onContinue(tender.id) : onSelect(tender.id)}
                          >
                            <FileEdit className="h-3.5 w-3.5" />
                            {tender.hasProposal ? "Continue Editing" : "Draft Proposal"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                border-2 border-dashed cursor-pointer px-8 py-16 transition-colors
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
                <p className="text-sm font-semibold text-foreground">Drop your Tender Document here</p>
                <p className="text-xs text-muted-foreground">or click to browse — PDF, DOCX</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
