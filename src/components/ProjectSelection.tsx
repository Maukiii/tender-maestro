import { FileText, Plus, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TenderProject {
  id: string;
  name: string;
  client: string;
  updatedAt: string;
  sectionsCount: number;
  status: "draft" | "submitted" | "in-review";
}

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

const statusStyles: Record<TenderProject["status"], string> = {
  draft: "bg-accent text-accent-foreground",
  "in-review": "bg-primary/10 text-primary",
  submitted: "bg-success/10 text-success",
};

const statusLabels: Record<TenderProject["status"], string> = {
  draft: "Draft",
  "in-review": "In Review",
  submitted: "Submitted",
};

interface ProjectSelectionProps {
  onSelect: (projectId: string) => void;
}

export function ProjectSelection({ onSelect }: ProjectSelectionProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-8 border-b border-border bg-card shrink-0">
        <h1 className="text-base font-semibold text-foreground">
          Tender Drafting Agent
        </h1>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Proposal
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-8 py-12">
        <div className="w-full max-w-3xl space-y-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Your Proposals
            </h2>
            <p className="text-sm text-muted-foreground">
              Select a tender proposal to continue working on, or create a new one.
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {project.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusStyles[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
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
  );
}
