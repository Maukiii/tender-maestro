/**
 * Generates realistic EU-style mock proposal content based on tender scoring data.
 * "[More information needed]" markers are used sparingly and only where genuinely
 * ambiguous information would exist (e.g. specific regulation references, contract
 * duration) — never for basic identifiers like reference numbers or pricing.
 */

import type { TenderScore, UploadedTender } from "./api";
import type { DraftedSection } from "./api";

function deriveTenderTitle(filename: string): string {
  const base = filename.replace(/\.(pdf|docx|doc)$/i, "").replace(/[_-]/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function fakeRefNumber(): string {
  const prefix = ["COMP", "CNECT", "GROW", "DIGIT", "JUST"][Math.floor(Math.random() * 5)];
  const year = 2025 + Math.floor(Math.random() * 2);
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}/${year}/OP/${seq}`;
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateMockDraft(tender: UploadedTender): DraftedSection[] {
  const score = tender.score;
  const title = deriveTenderTitle(tender.filename);
  const team = score?.team_proposal ?? [];
  const refNo = fakeRefNumber();
  const dg = ["DG CNECT", "DG GROW", "DG COMP", "DG JUST", "JRC"][Math.floor(Math.random() * 5)];

  // Ensure we always have a team to populate tables — fall back to defaults
  const effectiveTeam = team.length > 0
    ? team
    : [
        { role: "Project Director", member_name: "Dr. Anna Becker", total_score_percentage: 85, score_details: { hard_skills_reasoning: "", experience_reasoning: "", gap_analysis: "" } },
        { role: "Lead Methodologist", member_name: "Marcus Weber", total_score_percentage: 79, score_details: { hard_skills_reasoning: "", experience_reasoning: "", gap_analysis: "" } },
        { role: "Senior Data Analyst", member_name: "Sofia Chen", total_score_percentage: 74, score_details: { hard_skills_reasoning: "", experience_reasoning: "", gap_analysis: "" } },
      ];

  // Build price rows from the team — always populated
  const priceRows = effectiveTeam.map((m) => {
    const days = rand(15, 50);
    const isLead = /director|lead|head/i.test(m.role);
    const isSenior = /senior|expert/i.test(m.role);
    const rate = isLead ? 1200 : isSenior ? 900 : 650;
    return { label: `${m.member_name} (${m.role})`, days, rate, total: days * rate };
  });
  priceRows.push({ label: "Junior Analyst (support)", days: 20, rate: 500, total: 10000 });
  const travelCost = rand(6000, 12000);
  const grandTotal = priceRows.reduce((s, r) => s + r.total, 0) + travelCost;

  const sections: DraftedSection[] = [
    {
      section_id: "headline",
      blocks: [
        {
          title: "Title Page",
          markdown: `# ${title}\n\n**Reference No.:** ${refNo}\n\n**Contracting Authority:** European Commission — ${dg}\n\n**Submitted by:** Meridian Intelligence GmbH, Berlin, Germany\n\n**Date of Submission:** ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}\n\n**Framework Contract:** FWC COMP/2024/01 — Lot 3\n\n---\n\n*This document constitutes the technical and financial offer of Meridian Intelligence GmbH in response to tender ${refNo}.*`,
        },
      ],
    },
    {
      section_id: "exec-summary",
      blocks: [
        {
          title: "Overview",
          markdown: `Meridian Intelligence GmbH ("Meridian") is pleased to submit this proposal in response to the call for tenders **${refNo}** for **${title}**.\n\nWith a proven track record in delivering analytical studies and technical advisory services for EU institutions — including engagements with ENISA, the European Banking Authority (EBA), and the Joint Research Centre (JRC) — Meridian is well-positioned to deliver the required outputs within the stipulated timeframe.\n\nOur proposed approach combines proprietary web-mapping technology (the "WebMap" framework) with rigorous data quality procedures to ensure a false-positive rate of **< 3%**. The methodology has been successfully applied in comparable studies covering regulatory technology landscapes across the Single Market.\n\n${score?.company_fit_reasoning ? `> *Internal assessment: ${score.company_fit_reasoning}*` : ""}\n\n**Budget ceiling:** EUR ${(grandTotal * 1.15).toLocaleString("de-DE", { maximumFractionDigits: 0 })} (incl. contingency)\n\n**Contract duration:** [More information needed — to be confirmed from ToR]`,
        },
      ],
    },
    {
      section_id: "understanding",
      blocks: [
        {
          title: "Objective Analysis",
          markdown: `## Understanding of the Contracting Authority's Objectives\n\nThe European Commission (${dg}) requires an independent service provider to conduct a comprehensive study on **${title.toLowerCase()}** within the European Economic Area.\n\nThis tender is situated within the broader context of EU regulatory efforts to ensure market transparency and competitiveness. Specifically, the study is expected to:\n\n1. **Map the ecosystem** of relevant market actors, including SMEs, research spin-outs, and established vendors operating across Member States\n2. **Classify entities** by activity type, risk category, and position in the value chain\n3. **Provide longitudinal analysis** of market evolution over the contract period\n4. **Support market surveillance** activities through structured, machine-readable outputs\n\nThe challenge lies in the fact that traditional data sources — NACE codes, commercial databases, and national registries — fail to capture the "long tail" of innovative actors, particularly in rapidly evolving technology domains. Our approach addresses this gap through a combination of automated web discovery and expert-led validation.\n\n**Applicable regulation:** [More information needed — to be confirmed from tender documentation]`,
        },
      ],
    },
    {
      section_id: "methodology",
      blocks: [
        {
          title: "Scope Definition",
          markdown: `## Scope Definition\n\nThe study scope encompasses the identification, classification, and monitoring of entities relevant to **${title.toLowerCase()}** operating within the European Economic Area.\n\n**Geographical coverage:** All 27 EU Member States plus EEA/EFTA countries\n\n**Temporal scope:** 10 months from contract signature (subject to ToR confirmation)\n\n**Sectoral boundaries:** The analysis will cover the full value chain, from upstream research and development through to downstream deployment and integration services. Specific attention will be paid to:\n- General-purpose system providers\n- High-risk application developers\n- Conformity assessment and notified bodies\n- [More information needed — additional categories from ToR]`,
        },
        {
          title: "Seed Universe Construction",
          markdown: `## Seed Universe Construction\n\nThe initial universe of entities will be constructed through a multi-source triangulation approach:\n\n**Phase 1 — Automated Discovery**\nUsing Meridian's proprietary WebMap framework, we will conduct systematic web crawling across:\n- Company registries (national and pan-European)\n- Patent and trademark databases (EPO, EUIPO)\n- Academic publication repositories (OpenAIRE, Scopus)\n- Funding databases (CORDIS, national innovation agencies)\n- Industry association membership directories\n\n**Phase 2 — Expert Enrichment**\nDomain specialists will supplement the automated results with:\n- Entities known from prior engagements (ENISA, EBA, JRC projects)\n- Companies identified through conference participation and industry events\n- Startups tracked via venture capital and accelerator databases\n\n**Estimated seed universe size:** 2,500–4,000 initial entities, refined to 900–1,400 validated actors\n\n**De-duplication:** Entity resolution using LEI codes, VAT numbers, and fuzzy name matching (Jaro-Winkler similarity > 0.92)`,
        },
        {
          title: "Evidence Classification",
          markdown: `## Evidence Classification Framework\n\nEach entity in the universe will be classified using a weighted evidence matrix:\n\n| Evidence Type | Weight | Example |\n|---------------|--------|---------|\n| Primary — self-declaration | 30% | Company website states "AI-powered fraud detection" |\n| Regulatory filings | 25% | Registered as conformity assessment body under applicable regulation |\n| Patent / IP evidence | 15% | EP patent filed in relevant IPC class |\n| Third-party reporting | 15% | Named in Gartner / IDC market analysis |\n| Funding & grants | 10% | Horizon Europe grant in relevant call topic |\n| Expert judgement | 5% | Confirmed by domain specialist during validation |\n\n**Classification confidence levels:**\n- **High (≥ 70%):** Two or more independent evidence types confirm classification\n- **Medium (40–69%):** Single strong evidence source; manual review recommended\n- **Low (< 40%):** Flagged for expert validation before inclusion\n\n**Quality target:** < 3% false-positive rate across all high-confidence classifications`,
        },
        {
          title: "Supply Chain Mapping",
          markdown: `## Supply Chain Mapping\n\nBeyond entity-level classification, the study will produce a structured map of supply chain relationships:\n\n**Upstream actors:**\n- Research institutions and universities\n- Component and infrastructure providers (cloud, compute, data)\n- Standards-setting organisations\n\n**Midstream actors:**\n- System integrators and platform developers\n- Model and algorithm providers\n- Testing and validation service providers\n\n**Downstream actors:**\n- Deployers and end-user organisations\n- Conformity assessment bodies and auditors\n- [More information needed — sector-specific downstream actors from ToR]\n\nRelationships will be encoded as directed edges in a knowledge graph, enabling the Contracting Authority to trace dependencies and identify concentration risks.\n\n**Visualisation:** Interactive Sankey diagrams and network graphs will be delivered as part of the final reporting tool.`,
        },
      ],
    },
    {
      section_id: "workplan",
      blocks: [
        {
          title: "Work Plan",
          markdown: `## Work Plan and Deliverables\n\nThe project is structured into five phases aligned with the contract timeline:\n\n| Milestone | Deliverable | Month |\n|-----------|-------------|-------|\n| Inception | D1 — Inception Report (methodology, refined scope, work plan) | Month 1 |\n| Seed Construction | D2 — Seed Universe Database (initial entity list) | Months 2–3 |\n| Classification & Validation | D3 — Interim Report (classified entities, preliminary findings) | Months 4–6 |\n| Supply Chain Analysis | D4 — Supply Chain Mapping Report | Months 7–8 |\n| Final Delivery | D5 — Final Study Report + Machine-Readable Dataset | Months 9–10 |\n\n**Review meetings:** Monthly progress calls with the Contracting Authority; physical meetings in Brussels at inception and final delivery.\n\n**Quality gates:** Each deliverable undergoes internal peer review (minimum 2 reviewers) before submission.`,
        },
      ],
    },
    {
      section_id: "team",
      blocks: [
        {
          title: "Team Composition",
          markdown: `## Proposed Team\n\n| Name | Role | Days Allocated |\n|------|------|----------------|\n${effectiveTeam.map((m) => `| ${m.member_name} | ${m.role} | ${rand(15, 50)} |`).join("\n")}\n| Junior Analyst (support) | Data Collection & Validation | 20 |\n\n**Key personnel CVs** are provided in Annex II.\n\n**Language capabilities:** EN (native/C2 for all team members), DE, FR available on request.\n\n**Subcontracting:** No subcontracting foreseen for core deliverables. Minor specialist input (e.g. legal review of regulatory classifications) may be sourced from Meridian's framework agreement with Kessler & Partners, Brussels.`,
        },
      ],
    },
    {
      section_id: "quality-assurance",
      blocks: [
        {
          title: "QA Framework",
          markdown: `## Quality Assurance\n\nMeridian operates under **ISO 9001:2015** certified quality management processes. The following QA measures will be applied throughout the project:\n\n**Data Quality:**\n- All entity classifications undergo dual-coder validation (Cohen's κ ≥ 0.80)\n- Automated anomaly detection flags entries deviating from established patterns\n- Quarterly data refresh cycles with full audit trails\n- Target false-positive rate: < 3%\n\n**Deliverable Quality:**\n- Each report passes through a three-stage review: author → peer reviewer → quality manager\n- Compliance check against Contracting Authority's style guide and terminology\n- Factual accuracy verification against primary sources\n\n**Project Management:**\n- PRINCE2-aligned governance structure\n- Risk register updated bi-weekly with mitigation actions\n- Change control procedure for scope modifications\n\n**Data Protection:**\n- All data processed in EU-based infrastructure (Frankfurt data centre)\n- GDPR-compliant processing; DPA available upon request\n- No personal data of natural persons processed beyond publicly available professional information`,
        },
      ],
    },
    {
      section_id: "pricing",
      blocks: [
        {
          title: "Price Breakdown",
          markdown: `## Financial Offer\n\n| Item | Days | Day Rate (EUR) | Total (EUR) |\n|------|------|----------------|-------------|\n${priceRows.map((r) => `| ${r.label} | ${r.days} | ${r.rate.toLocaleString("de-DE")} | ${r.total.toLocaleString("de-DE")} |`).join("\n")}\n| Travel & subsistence (estimated) | — | — | ${travelCost.toLocaleString("de-DE")} |\n| **Grand Total** | | | **${grandTotal.toLocaleString("de-DE")}** |\n\n*All amounts in EUR, exclusive of VAT.*\n\n**Payment schedule:** Milestone-based, upon acceptance of each deliverable (D1–D5). 30-day payment terms.\n\n**Price validity:** This offer is valid for 90 days from the date of submission.\n\n**Budget ceiling compliance:** The proposed total is within the anticipated budget range for Lot 3 engagements under the framework contract.`,
        },
      ],
    },
  ];

  return sections;
}
