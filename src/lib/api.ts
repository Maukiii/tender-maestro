/**
 * API Abstraction Layer
 *
 * Every function tries the Python backend first (http://localhost:8000).
 * If the backend is unreachable (e.g. running via Lovable, or backend not started),
 * it automatically falls back to the mock implementation so the app keeps working.
 *
 * Start the backend with:  make backend   (or  make dev  for both)
 * Browse API docs at:      http://localhost:8000/docs
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";


// Returns true when the backend is simply not reachable (not a logic error).
// Catches Chrome "Failed to fetch", Firefox "NetworkError when attempting to fetch resource",
// and Safari "Load failed" — all thrown as TypeErrors on network/CORS/mixed-content failures.
function isOffline(e: unknown): boolean {
  if (!(e instanceof TypeError)) return false;
  const msg = e.message.toLowerCase();
  return msg.includes("fetch") || msg.includes("load failed") || msg.includes("networkerror");
}

// ─── Types ───────────────────────────────────────────────────────────

export interface TenderScore {
  decision: "BID" | "NO-BID";
  company_fit_score: number;
  team_fit_score: number;
  overall_score: number;
  company_fit_reasoning: string;
  ko_criterion_triggered: string | null;
  team_proposal: Array<{
    role: string;
    member_name: string;
    total_score_percentage: number;
    score_details: {
      hard_skills_reasoning: string;
      experience_reasoning: string;
      gap_analysis: string;
    };
  }>;
}

export interface UploadedTender {
  id: string;
  filename: string;
  uploadedAt: string;
  score: TenderScore | null;
  hasProposal?: boolean;
}

export interface SavedSection {
  section_id: string;
  blocks: { id: string; title: string; markdown: string }[];
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

export interface SelectionContext {
  text: string;
  blockTitle?: string;
  blockId?: string;
  sectionLabel?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Knowledge Base ───────────────────────────────────────────────────

/** Fetch knowledge base stats */
export async function fetchKnowledgeStats(): Promise<KnowledgeStats> {
  try {
    const res = await fetch(`${API_BASE}/knowledge/stats`);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    if (isOffline(e)) {
      await delay(300);
      return { pastTenders: 45, teamCVs: 12, policyDocs: 8, templateLibrary: 23 };
    }
    throw e;
  }
}

/** Upload a knowledge document to the vector store */
export async function uploadKnowledgeDocument(file: File): Promise<{ success: boolean }> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/knowledge/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    if (isOffline(e)) {
      await delay(2000);
      return { success: true };
    }
    throw e;
  }
}

// ─── Mock tender store (used when backend is offline) ─────────────────

let mockTenderCounter = 3;
const mockTenderStore: UploadedTender[] = [
  {
    id: "sample-1",
    filename: "EU_Digital_Single_Market_Impact_Assessment_2025.pdf",
    uploadedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    score: generateCoherentMockScore("EU_Digital_Single_Market_Impact_Assessment_2025.pdf"),
    hasProposal: false,
  },
  {
    id: "sample-2",
    filename: "EBA_RegTech_Supervisory_Framework_Study.pdf",
    uploadedAt: new Date(Date.now() - 18 * 3600_000).toISOString(),
    score: generateCoherentMockScore("EBA_RegTech_Supervisory_Framework_Study.pdf"),
    hasProposal: false,
  },
  {
    id: "sample-3",
    filename: "ENISA_AI_Cybersecurity_Risk_Landscape_Analysis.pdf",
    uploadedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    score: generateCoherentMockScore("ENISA_AI_Cybersecurity_Risk_Landscape_Analysis.pdf"),
    hasProposal: false,
  },
];

/**
 * Generates a coherent mock score where all fields logically relate to each other.
 * Scores are correlated (±12 pts), reasoning matches the score tier, KOs only fire on low scores,
 * and team members only appear on BID decisions.
 */
function generateCoherentMockScore(filename: string): TenderScore {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Pick a scenario tier so everything is consistent
  const tier = Math.random();
  let baseScore: number;
  if (tier < 0.25) baseScore = rand(25, 42);       // weak
  else if (tier < 0.55) baseScore = rand(50, 68);   // moderate
  else baseScore = rand(72, 93);                     // strong

  // Correlated scores: vary ±12 from base, clamped 5–98
  const clamp = (v: number) => Math.max(5, Math.min(98, v));
  const companyFit = clamp(baseScore + rand(-8, 12));
  const teamFit = clamp(baseScore + rand(-12, 8));
  const overall = Math.round((companyFit + teamFit) / 2);
  const isBid = overall >= 55;

  // Reasoning that matches the score tier
  const STRONG_REASONS = [
    "Strong alignment with our cloud infrastructure, data analytics capabilities, and existing EU institutional client relationships. ISO 27001 and SOC 2 certifications already held.",
    "Excellent match — the required competencies in regulatory technology and market analysis map directly to our core practice areas. Prior work with ENISA and EBA strengthens the positioning.",
    "Our team has delivered three comparable studies in this domain over the past 24 months. Technical requirements are fully covered by existing tooling and methodologies.",
  ];
  const MODERATE_REASONS = [
    "Moderate fit — we cover most technical requirements (web mapping, data classification) but lack the specific domain certification mentioned in the ToR. A subcontractor partnership could close the gap.",
    "Partial overlap with our service portfolio. The data engineering and analytics components align well, but the on-site workshop requirements in multiple Member States would stretch current capacity.",
    "We meet roughly 70% of the stated requirements. The methodology fits our WebMap framework, but the contracting authority's emphasis on sector-specific regulatory expertise is a gap we'd need to address.",
  ];
  const WEAK_REASONS = [
    "Limited alignment — the tender requires ITAR-equivalent compliance and national security clearances that our organisation does not hold and cannot obtain within the bid timeline.",
    "The scope centres on a domain (medical devices regulation) where we have no prior experience or relevant certifications. Bidding would require significant capability acquisition.",
    "Poor strategic fit. The tender mandates physical presence in a region we do not cover, and the budget ceiling is below our minimum viable engagement threshold.",
  ];

  let reasoning: string;
  let ko: string | null = null;
  if (overall >= 72) {
    reasoning = STRONG_REASONS[rand(0, STRONG_REASONS.length - 1)];
  } else if (overall >= 50) {
    reasoning = MODERATE_REASONS[rand(0, MODERATE_REASONS.length - 1)];
    // Moderate tenders occasionally have a soft KO
    if (Math.random() < 0.2) ko = "Domain certification not held — waiver may be possible";
  } else {
    reasoning = WEAK_REASONS[rand(0, WEAK_REASONS.length - 1)];
    // Weak tenders usually have a hard KO
    const HARD_KOS = [
      "Mandatory security clearance not held by any current staff member",
      "Requires physical data-centre presence in jurisdiction we do not operate in",
      "Budget ceiling below minimum viable engagement cost for this scope",
      "Required domain certification (e.g. HIPAA, ITAR) not held and not obtainable in time",
    ];
    ko = HARD_KOS[rand(0, HARD_KOS.length - 1)];
  }

  // Team: only populated if BID, and scores correlate with teamFit
  const TEAM_POOL = [
    { role: "Project Director", member_name: "Dr. Anna Becker", baseScore: 88, details: { hard_skills_reasoning: "18 years programme management; PMP and PRINCE2 certified", experience_reasoning: "Led 12 EU institutional studies including ENISA and JRC", gap_analysis: "None identified" } },
    { role: "Lead Methodologist", member_name: "Marcus Weber", baseScore: 82, details: { hard_skills_reasoning: "Expert in web-mapping, NLP-based entity classification, and data pipeline design", experience_reasoning: "Technical lead on 5 comparable EU market studies", gap_analysis: "Limited experience with healthcare-specific taxonomies" } },
    { role: "Senior Data Analyst", member_name: "Sofia Chen", baseScore: 78, details: { hard_skills_reasoning: "Strong quantitative background; Python, R, SQL, and geospatial analysis", experience_reasoning: "3 years on EU regulatory technology mapping projects", gap_analysis: "Has not led a workstream independently yet" } },
    { role: "Domain Expert", member_name: "Thomas Vogel", baseScore: 75, details: { hard_skills_reasoning: "Deep knowledge of EU regulatory frameworks (AI Act, DORA, NIS2)", experience_reasoning: "Former policy adviser at a national competent authority", gap_analysis: "Consulting experience is primarily advisory, less hands-on data work" } },
  ];

  let teamProposal: TenderScore["team_proposal"] = [];
  if (isBid) {
    const teamSize = overall >= 72 ? rand(3, 4) : rand(1, 3);
    teamProposal = TEAM_POOL.slice(0, teamSize).map((p) => ({
      role: p.role,
      member_name: p.member_name,
      // Individual score influenced by team_fit_score (±10)
      total_score_percentage: clamp(p.baseScore + rand(-6, 6) + Math.round((teamFit - 70) / 3)),
      score_details: p.details,
    }));
  }

  return {
    decision: isBid ? "BID" : "NO-BID",
    company_fit_score: companyFit,
    team_fit_score: teamFit,
    overall_score: overall,
    company_fit_reasoning: reasoning,
    ko_criterion_triggered: ko,
    team_proposal: teamProposal,
  };
}

// ─── Tender ───────────────────────────────────────────────────────────

/** List all uploaded tenders from documents/tenders/ */
export async function listTenders(): Promise<UploadedTender[]> {
  try {
    const res = await fetch(`${API_BASE}/tender/list`);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    if (isOffline(e)) return [...mockTenderStore];
    throw e;
  }
}

// ─── Draft ────────────────────────────────────────────────────────────────────

export interface DraftedSection {
  section_id: string;
  blocks: { title: string; markdown: string }[];
}

export async function draftProposal(
  documentId: string,
  onStatus: (step: string, progress: number) => void,
  onSection: (section: DraftedSection) => void,
  onSectionError?: (sectionId: string) => void,
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/tender/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    if (!res.ok) throw new Error(`Draft request failed: ${res.status}`);
    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6));
        if (event.type === "status") {
          onStatus(event.step, event.progress);
        } else if (event.type === "section") {
          onSection(event.section as DraftedSection);
        } else if (event.type === "section_error") {
          console.warn(`[draftProposal] section failed — ${event.section_id}: ${event.message}`);
          onSectionError?.(event.section_id);
        } else if (event.type === "done") {
          return;
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    }
    throw new Error("Stream ended without done event");
  } catch (e) {
    if (isOffline(e)) {
      // Offline mock: generate EU-style draft from tender scoring data
      const { generateMockDraft } = await import("./mockDraft");
      const tender = mockTenderStore.find((t) => t.id === documentId);
      if (!tender) throw new Error(`Tender ${documentId} not found in mock store`);

      const steps = [
        "Extracting tender requirements…",
        "Analysing company fit…",
        "Mapping team competencies…",
        "Generating proposal sections…",
        "Applying EU formatting standards…",
      ];
      for (let i = 0; i < steps.length; i++) {
        onStatus(steps[i], ((i + 1) / (steps.length + 1)) * 100);
        await delay(600);
      }

      const sections = generateMockDraft(tender);
      for (const section of sections) {
        onSection(section);
        await delay(200);
      }
      onStatus("Complete", 100);
      return;
    }
    throw e;
  }
}

/** Save the current proposal draft to the backend. */
export async function saveProposal(documentId: string, sections: SavedSection[]): Promise<void> {
  const res = await fetch(`${API_BASE}/tender/save-proposal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, sections }),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
}

/** Load a previously saved proposal. Returns null if none exists. */
export async function loadProposal(documentId: string): Promise<{ sections: SavedSection[] } | null> {
  const res = await fetch(`${API_BASE}/tender/proposal/${documentId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Load failed: ${res.status}`);
  return res.json();
}

/** Score a previously uploaded tender */
export async function scoreTender(documentId: string): Promise<TenderScore & { documentId: string }> {
  try {
    const res = await fetch(`${API_BASE}/tender/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? `Score request failed: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (isOffline(e)) {
      await delay(1500);
      const mockScore = MOCK_SCORES[mockTenderCounter % MOCK_SCORES.length];
      // Update the mock store with the score
      const tender = mockTenderStore.find((t) => t.id === documentId);
      if (tender) tender.score = mockScore;
      return { ...mockScore, documentId };
    }
    throw e;
  }
}

/** Upload the tender PDF for analysis */
export async function uploadTenderDocument(file: File): Promise<{ documentId: string }> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/tender/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    if (isOffline(e)) {
      await delay(800);
      const id = `mock-tender-${++mockTenderCounter}`;
      const score = generateCoherentMockScore(file.name);

      mockTenderStore.push({
        id,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        score,
        hasProposal: false,
      });
      return { documentId: id };
    }
    throw e;
  }
}

/**
 * Analyze tender and generate draft.
 * When the backend is running: streams real SSE status updates and uses AI.
 * When offline: uses the original mock simulation.
 */
export async function analyzeTender(
  documentId: string,
  onStatus: (status: AnalysisStatus) => void
): Promise<DraftResult> {
  try {
    const res = await fetch(`${API_BASE}/tender/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    if (!res.body) throw new Error("no body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6));
        if (event.type === "status") onStatus({ step: event.step, progress: event.progress });
        else if (event.type === "result") return { markdown: event.markdown, score: event.score };
        else if (event.type === "error") throw new Error(event.message);
      }
    }
    throw new Error("Stream ended without result");
  } catch (e) {
    if (isOffline(e)) {
      // Mock fallback: simulate progress steps
      const steps = [
        "Extracting requirements...",
        "Scoring tender fit...",
        "Retrieving past project context...",
        "Drafting initial response...",
      ];
      for (let i = 0; i < steps.length; i++) {
        onStatus({ step: steps[i], progress: ((i + 1) / steps.length) * 100 });
        await delay(1500);
      }
      return { markdown: MOCK_DRAFT, score: 87 };
    }
    throw e;
  }
}

/** Send a revision instruction to the AI agent */
export async function reviseDraft(request: RevisionRequest): Promise<RevisionResult> {
  try {
    const res = await fetch(`${API_BASE}/tender/revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    if (isOffline(e)) {
      await delay(2000);
      return {
        markdown: MOCK_REVISED_DRAFT,
        agentMessage: "Done. I have updated the draft to reflect those constraints.",
      };
    }
    throw e;
  }
}

// ─── Chat (AI showcase) ───────────────────────────────────────────────
//
// Streams an AI response chunk by chunk when the backend is running.
// Falls back to a canned mock response when offline.
//
// Usage:
//   for await (const chunk of streamChat("Improve this section", context, history)) {
//     setReply(prev => prev + chunk);
//   }

export async function* streamChat(
  message: string,
  context?: SelectionContext,
  history?: ChatMessage[]
): AsyncGenerator<string> {
  try {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context, history }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    if (!res.body) throw new Error("no body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6));
        if (event.type === "chunk") yield event.content as string;
        else if (event.type === "done") return;
        else if (event.type === "error") throw new Error(event.message);
      }
    }
  } catch (e) {
    if (isOffline(e)) {
      // Mock fallback: stream a canned reply word by word
      const reply = "The AI assistant is available when the backend is running. Start it with `make dev`, then add your API key to `api/.env`.";
      for (const word of reply.split(" ")) {
        yield word + " ";
        await delay(60);
      }
      return;
    }
    throw e;
  }
}


// ─── Helpers ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { API_BASE };
