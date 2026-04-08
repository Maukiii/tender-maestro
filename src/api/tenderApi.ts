/**
 * Centralized API layer — all backend calls live here.
 * Replace mock implementations with real fetch calls to the FastAPI backend.
 */

import type {
  KnowledgeStats,
  AnalysisStatus,
  DraftResult,
  RevisionRequest,
  RevisionResult,
  GenerateSectionRequest,
  GenerateSectionResult,
} from "@/types/tender";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Mock Data (remove when backend is live) ─────────────────────────

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

// ─── API Functions ───────────────────────────────────────────────────

export async function fetchKnowledgeStats(): Promise<KnowledgeStats> {
  // TODO: GET ${API_BASE}/knowledge/stats
  await delay(300);
  return { pastTenders: 45, teamCVs: 12, policyDocs: 8, templateLibrary: 23 };
}

export async function uploadKnowledgeDocument(_file: File): Promise<{ success: boolean }> {
  // TODO: POST ${API_BASE}/knowledge/upload (multipart/form-data)
  await delay(2000);
  return { success: true };
}

export async function uploadPdf(file: File): Promise<{ documentId: string }> {
  // TODO: POST ${API_BASE}/tender/upload
  await delay(500);
  return { documentId: "mock-doc-123" };
}

export async function generateFullDocument(
  documentId: string,
  onStatus: (status: AnalysisStatus) => void,
): Promise<DraftResult> {
  // TODO: POST ${API_BASE}/tender/analyze (SSE or polling)
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

export async function regenerateSection(
  sectionName: string,
  currentDocument: Record<string, unknown>,
): Promise<DraftResult> {
  // TODO: POST ${API_BASE}/tender/regenerate-section
  await delay(2000);
  return { markdown: MOCK_REVISED_DRAFT, score: 85 };
}

export async function reviseDraft(request: RevisionRequest): Promise<RevisionResult> {
  // TODO: POST ${API_BASE}/tender/revise
  await delay(2000);
  return {
    markdown: MOCK_REVISED_DRAFT,
    agentMessage: "Done. I have updated the draft to reflect those constraints.",
  };
}

/**
 * Generate pre-structured blocks for a section type.
 * POST /tender/generate-section
 */
export async function generateSectionBlocks(
  request: GenerateSectionRequest,
): Promise<GenerateSectionResult> {
  // TODO: replace mock with real call once backend is live
  // const res = await fetch(`${API_BASE}/tender/generate-section`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(request),
  // });
  // if (!res.ok) throw new Error(`Failed: ${res.status}`);
  // return res.json();

  await delay(300);
  // Fall back to template lookup on client side for now
  const { getTemplateByLabel, getTemplateById } = await import("@/lib/sectionTemplates");
  const template = getTemplateById(request.sectionLabel) ?? getTemplateByLabel(request.sectionLabel);
  if (!template) {
    return { blocks: [{ id: `block-${Date.now()}`, title: "Untitled Block", markdown: "" }] };
  }
  return {
    blocks: template.blocks.map((bt, i) => ({
      id: `block-${Date.now()}-${i}`,
      title: bt.titleSuffix,
      markdown: bt.markdown,
    })),
  };
}

export { API_BASE };
