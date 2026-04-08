export interface TenderSection {
  id: string;
  title: string;
  content: string;
  filename: string;
}

export interface TenderDocument {
  sections: TenderSection[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface KnowledgeStats {
  pastTenders: number;
  teamCVs: number;
  policyDocs: number;
  templateLibrary: number;
}

export interface AnalysisStatus {
  step: string;
  progress: number;
}

export interface DraftResult {
  markdown: string;
  score: number;
}

export interface RevisionRequest {
  instruction: string;
  currentDraft: string;
}

export interface RevisionResult {
  markdown: string;
  agentMessage: string;
}

export interface TenderProject {
  id: string;
  name: string;
  client: string;
  updatedAt: string;
  sectionsCount: number;
  status: "draft" | "submitted" | "in-review";
}

export interface IncomingTender {
  id: string;
  title: string;
  client: string;
  deadline: string;
  budgetRange: string;
  scores: { label: string; value: number }[]; // 3 category scores, 0-100
  matchReasons: string[];
  uploadedAt: string;
}

export interface GenerateSectionRequest {
  sectionLabel: string;
  tenderContext?: string;
}

export interface GenerateSectionResult {
  blocks: { id: string; title: string; markdown: string }[];
}
