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
const N8N_WEBHOOK_URL = "https://fabiankir.app.n8n.cloud/webhook-test/e0347eff-f78c-43ab-9260-524ff53fbf03";

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

// ─── Mock Data ───────────────────────────────────────────────────────

const MOCK_DRAFT = `# Tender Response: Digital Transformation Platform
## RFP Reference: DTP-2026-0042

---

### 1. Executive Summary

We are pleased to submit our proposal for the Digital Transformation Platform as outlined in your Request for Proposal. Our team brings over 15 years of combined experience delivering enterprise-grade solutions for government and private-sector clients across EMEA and APAC.

Our proposed solution leverages a modern microservices architecture, deployed on a secure cloud infrastructure, with built-in compliance for ISO 27001, SOC 2, and GDPR. We are confident that our approach not only meets but exceeds the technical and operational requirements outlined in the RFP.

### 2. Technical Approach & Methodology

Our delivery methodology follows an Agile-SAFe hybrid model, structured into three key phases:

**Phase 1 — Discovery & Architecture (Weeks 1–4)**
- Stakeholder workshops and requirements refinement
- System architecture design and security threat modelling
- Infrastructure provisioning and CI/CD pipeline setup

**Phase 2 — Core Development (Weeks 5–16)**
- Iterative sprint delivery with bi-weekly demos
- Integration with existing ERP and CRM systems
- Automated testing suite with >90% code coverage target

**Phase 3 — UAT, Training & Go-Live (Weeks 17–20)**
- User acceptance testing with dedicated QA resources
- Comprehensive training programme for 200+ end users
- Phased rollout with 24/7 hypercare support for 30 days

### 3. Team Composition

| Role | Name | Experience |
|------|------|-----------|
| Project Director | Sarah Mitchell | 18 years |
| Lead Architect | Fabi Rosenberg | 12 years |
| Senior Developer | James Chen | 9 years |
| QA Lead | Priya Sharma | 7 years |
| DevOps Engineer | Marcus Webb | 6 years |

### 4. Pricing Summary

| Deliverable | Cost (USD) |
|------------|-----------|
| Phase 1 — Discovery | $120,000 |
| Phase 2 — Development | $480,000 |
| Phase 3 — UAT & Go-Live | $95,000 |
| **Total Fixed Price** | **$695,000** |

### 5. Risk Mitigation

We have identified the following key risks and corresponding mitigation strategies:

1. **Integration Complexity** — Early proof-of-concept integrations in Phase 1
2. **Scope Creep** — Strict change control board with documented CR process
3. **Resource Availability** — Dedicated bench of 3 backup specialists
4. **Data Migration** — Parallel-run validation period of 2 weeks

### 6. Why Choose Us

- **Proven Track Record**: 47 successful government tenders delivered on time
- **Local Presence**: Offices in London, Dubai, and Singapore
- **Innovation Focus**: R&D team of 15 dedicated to emerging technologies
- **Client Retention**: 94% client retention rate over 5 years

---

*This proposal is valid for 90 days from the date of submission. We welcome the opportunity to present our solution in further detail.*
`;

const MOCK_REVISED_DRAFT = `# Tender Response: Digital Transformation Platform
## RFP Reference: DTP-2026-0042

---

### 1. Executive Summary

We are pleased to submit our proposal for the Digital Transformation Platform as outlined in your Request for Proposal. Our team brings over 15 years of combined experience delivering enterprise-grade solutions for government and private-sector clients across EMEA and APAC.

Our proposed solution leverages a modern microservices architecture, deployed on a secure cloud infrastructure, with built-in compliance for ISO 27001, SOC 2, and GDPR. We are confident that our approach not only meets but exceeds the technical and operational requirements outlined in the RFP.

### 2. Technical Approach & Methodology

Our delivery follows a streamlined Agile methodology in two focused phases:

**Phase 1 — Discovery & Architecture (Weeks 1–4)**
- Stakeholder workshops and requirements refinement
- System architecture design and security threat modelling
- Infrastructure provisioning and CI/CD pipeline setup

**Phase 2 — Development, Testing & Go-Live (Weeks 5–18)**
- Iterative sprint delivery with bi-weekly demos
- Integration with existing ERP and CRM systems
- Automated testing with >90% code coverage
- Phased rollout with 24/7 hypercare support for 30 days

### 3. Team Composition

| Role | Name | Experience |
|------|------|-----------|
| Project Director | Sarah Mitchell | 18 years |
| Lead Architect | James Chen | 9 years |
| QA Lead | Priya Sharma | 7 years |
| DevOps Engineer | Marcus Webb | 6 years |

### 4. Pricing Summary

| Deliverable | Cost (USD) |
|------------|-----------|
| Phase 1 — Discovery | $110,000 |
| Phase 2 — Development & Go-Live | $520,000 |
| **Total Fixed Price** | **$630,000** |

### 5. Why Choose Us

- **Proven Track Record**: 47 successful government tenders delivered on time
- **Local Presence**: Offices in London, Dubai, and Singapore
- **Innovation Focus**: R&D team of 15 dedicated to emerging technologies
- **Client Retention**: 94% client retention rate over 5 years

---

*This proposal is valid for 90 days from the date of submission.*
`;

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

// ─── Tender ───────────────────────────────────────────────────────────

/** List all uploaded tenders from documents/tenders/ */
export async function listTenders(): Promise<UploadedTender[]> {
  try {
    const res = await fetch(`${API_BASE}/tender/list`);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch (e) {
    if (isOffline(e)) return [];
    throw e;
  }
}

// ─── Draft ────────────────────────────────────────────────────────────────────

export interface DraftedSection {
  section_id: string;
  blocks: { title: string; markdown: string }[];
}

/**
 * Run the 6-agent parallel drafting pipeline for a scored tender.
 * Streams SSE events; delivers each section via onSection as soon as it arrives.
 *
 * SSE events handled:
 *   status        → onStatus callback
 *   section       → onSection callback (one call per section)
 *   section_error → console.warn (non-fatal; other sections still arrive)
 *   done          → resolves the promise
 *   error         → throws (fatal pre-agent failure)
 */
export async function draftProposal(
  documentId: string,
  onStatus: (step: string, progress: number) => void,
  onSection: (section: DraftedSection) => void,
  onSectionError?: (sectionId: string) => void,
): Promise<void> {
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

/** Score a previously uploaded tender (runs the full extraction + scoring pipeline) */
export async function scoreTender(documentId: string): Promise<TenderScore & { documentId: string }> {
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
      await delay(500);
      return { documentId: "mock-doc-123" };
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
