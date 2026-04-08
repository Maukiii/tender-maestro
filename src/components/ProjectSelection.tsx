import { useState, useCallback, useRef } from "react";
import { FileText, Plus, Clock, ChevronRight, Upload, X, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { TenderProject, IncomingTender } from "@/types/tender";

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

const MOCK_INCOMING_TENDERS: IncomingTender[] = [
  {
    id: "tender-1",
    title: "National Data Analytics Platform",
    client: "Federal Statistics Office",
    deadline: "15 May 2026",
    budgetRange: "€800K – €1.2M",
    matchScore: 92,
    matchReasons: ["Strong cloud expertise match", "Past experience with gov analytics", "Team capacity available"],
    uploadedAt: "30 min ago",
  },
  {
    id: "tender-2",
    title: "Healthcare Records Digitisation",
    client: "Regional Health Authority",
    deadline: "28 Apr 2026",
    budgetRange: "€400K – €600K",
    matchScore: 74,
    matchReasons: ["Good technical fit", "Limited healthcare domain experience"],
    uploadedAt: "2 hours ago",
  },
  {
    id: "tender-3",
    title: "Border Control Biometrics Upgrade",
    client: "Interior Ministry",
    deadline: "10 Jun 2026",
    budgetRange: "€1.5M – €2M",
    matchScore: 45,
    matchReasons: ["Biometrics not a core competency", "Scale exceeds typical projects"],
    uploadedAt: "1 day ago",
  },
  {
    id: "tender-4",
    title: "Municipal ERP Consolidation",
    client: "City of Hamburg",
    deadline: "22 May 2026",
    budgetRange: "€300K – €500K",
    matchScore: 83,
    matchReasons: ["ERP migration experience", "Strong local references", "Right team size"],
    uploadedAt: "3 hours ago",
  },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-400/10 border-red-400/20";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong Fit";
  if (score >= 60) return "Moderate Fit";
  return "Weak Fit";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          strokeWidth="3" strokeLinecap="round"
          stroke="currentColor"
          className={getScoreColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={`absolute text-xs font-bold ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}

interface ProjectSelectionProps {
  onSelect: (projectId: string) => void;
}

export function ProjectSelection({ onSelect }: ProjectSelectionProps) {
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    console.log("Tender document uploaded:", file.name, file.type);
    setShowUploadOverlay(false);
  }, []);

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
    },
    [handleFile]
  );

  const sortedTenders = [...MOCK_INCOMING_TENDERS].sort((a, b) => b.matchScore - a.matchScore);

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
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex items-center gap-4 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors
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
                <p className="text-sm font-semibold text-foreground">Upload Tender Description</p>
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
            <div className="space-y-3">
              {sortedTenders.map((tender) => (
                <button
                  key={tender.id}
                  type="button"
                  onClick={() => onSelect(tender.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all text-left group"
                >
                  <ScoreRing score={tender.matchScore} />

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {tender.title}
                      </h3>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getScoreBg(tender.matchScore)} ${getScoreColor(tender.matchScore)}`}>
                        {getScoreLabel(tender.matchScore)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{tender.client}</span>
                      <span>·</span>
                      <span>{tender.budgetRange}</span>
                      <span>·</span>
                      <span>Due {tender.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tender.matchReasons.map((reason, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              ))}
            </div>
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

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
