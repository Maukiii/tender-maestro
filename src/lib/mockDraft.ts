/**
 * Generates realistic EU-style mock proposal content based on tender scoring data.
 * Some fields are intentionally left blank with "[More information needed]" markers.
 */

import type { TenderScore, UploadedTender } from "./api";
import type { DraftedSection } from "./api";

function deriveTenderTitle(filename: string): string {
  const base = filename.replace(/\.(pdf|docx|doc)$/i, "").replace(/[_-]/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function generateMockDraft(tender: UploadedTender): DraftedSection[] {
  const score = tender.score;
  const title = deriveTenderTitle(tender.filename);
  const team = score?.team_proposal ?? [];
  const randDays = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const sections: DraftedSection[] = [
    {
      section_id: "headline",
      blocks: [
        {
          title: "Title Page",
          markdown: `# ${title}\n\n**Reference No.:** [More information needed]\n\n**Contracting Authority:** European Commission — [More information needed]\n\n**Submitted by:** Meridian Intelligence GmbH, Berlin, Germany\n\n**Date of Submission:** ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}\n\n**Framework Contract:** [More information needed]\n\n---\n\n*This document constitutes the technical and financial offer of Meridian Intelligence GmbH in response to the above-referenced tender.*`,
        },
      ],
    },
    {
      section_id: "exec-summary",
      blocks: [
        {
          title: "Overview",
          markdown: `Meridian Intelligence GmbH ("Meridian") is pleased to submit this proposal in response to the call for tenders for **${title}**.\n\nWith a proven track record in delivering analytical studies and technical advisory services for EU institutions — including engagements with ENISA, the European Banking Authority (EBA), and the Joint Research Centre (JRC) — Meridian is uniquely positioned to deliver the required outputs within the stipulated timeframe.\n\nOur proposed approach combines proprietary web-mapping technology (the "WebMap" framework) with rigorous data quality procedures to ensure a false-positive rate of **< 3%**. The methodology has been successfully applied in comparable studies covering regulatory technology landscapes across the Single Market.\n\n${score?.company_fit_reasoning ? `> *Assessment note: ${score.company_fit_reasoning}*` : ""}\n\n**Budget ceiling:** [More information needed]\n\n**Contract duration:** [More information needed]`,
        },
      ],
    },
    {
      section_id: "understanding",
      blocks: [
        {
          title: "Objective Analysis",
          markdown: `## Understanding of the Contracting Authority's Objectives\n\nThe European Commission requires an independent service provider to [More information needed — insert specific objective from tender documentation].\n\nThis tender is situated within the broader context of EU regulatory efforts to ensure [More information needed]. Specifically, the study is expected to:\n\n1. **Map the ecosystem** of relevant market actors, including SMEs, research spin-outs, and established vendors operating across Member States\n2. **Classify entities** by activity type, risk category, and position in the value chain\n3. **Provide longitudinal analysis** of market evolution over the contract period\n4. **Support market surveillance** activities through structured, machine-readable outputs\n\nThe challenge lies in the fact that traditional data sources — NACE codes, commercial databases, and national registries — fail to capture the "long tail" of innovative actors, particularly in rapidly evolving technology domains. Our approach addresses this gap through a combination of automated web discovery and expert-led validation.\n\n**Applicable regulation:** [More information needed]`,
        },
      ],
    },
    {
      section_id: "methodology",
      blocks: [
        {
          title: "Scope Definition",
          markdown: `## Scope Definition\n\nThe study scope encompasses the identification, classification, and monitoring of [More information needed — specify domain, e.g. AI systems providers] operating within the European Economic Area.\n\n**Geographical coverage:** All 27 EU Member States plus EEA/EFTA countries\n\n**Temporal scope:** [More information needed]\n\n**Sectoral boundaries:** The analysis will cover the full value chain, from upstream research and development through to downstream deployment and integration services. Specific attention will be paid to:\n- General-purpose system providers\n- High-risk application developers (as defined under [applicable regulation])\n- Conformity assessment and notified bodies\n- [More information needed — additional categories from ToR]`,
        },
        {
          title: "Seed Universe Construction",
          markdown: `## Seed Universe Construction\n\nThe initial universe of entities will be constructed through a multi-source triangulation approach:\n\n**Phase 1 — Automated Discovery**\nUsing Meridian's proprietary WebMap framework, we will conduct systematic web crawling across:\n- Company registries (national and pan-European)\n- Patent and trademark databases (EPO, EUIPO)\n- Academic publication repositories (OpenAIRE, Scopus)\n- Funding databases (CORDIS, national innovation agencies)\n- Industry association membership directories\n\n**Phase 2 — Expert Enrichment**\nDomain specialists will supplement the automated results with:\n- Entities known from prior engagements (ENISA, EBA, JRC projects)\n- Companies identified through conference participation and industry events\n- Startups tracked via venture capital and accelerator databases\n\n**Estimated seed universe size:** [More information needed — typically 2,000–5,000 initial entities, refined to 800–1,500 validated actors]\n\n**De-duplication:** Entity resolution using LEI codes, VAT numbers, and fuzzy name matching (Jaro-Winkler similarity > 0.92)`,
        },
        {
          title: "Evidence Classification",
          markdown: `## Evidence Classification Framework\n\nEach entity in the universe will be classified using a weighted evidence matrix:\n\n| Evidence Type | Weight | Example |\n|---------------|--------|---------|\n| Primary — self-declaration | 30% | Company website states "AI-powered fraud detection" |\n| Regulatory filings | 25% | Registered as conformity assessment body under [regulation] |\n| Patent / IP evidence | 15% | EP patent filed in relevant IPC class |\n| Third-party reporting | 15% | Named in Gartner / IDC market analysis |\n| Funding & grants | 10% | Horizon Europe grant in relevant call topic |\n| Expert judgement | 5% | Confirmed by domain specialist during validation |\n\n**Classification confidence levels:**\n- **High (≥ 70%):** Two or more independent evidence types confirm classification\n- **Medium (40–69%):** Single strong evidence source; manual review recommended\n- **Low (< 40%):** Flagged for expert validation before inclusion\n\n**Quality target:** < 3% false-positive rate across all high-confidence classifications`,
        },
        {
          title: "Supply Chain Mapping",
          markdown: `## Supply Chain Mapping\n\nBeyond entity-level classification, the study will produce a structured map of supply chain relationships:\n\n**Upstream actors:**\n- Research institutions and universities\n- Component and infrastructure providers (cloud, compute, data)\n- [More information needed]\n\n**Midstream actors:**\n- System integrators and platform developers\n- Model and algorithm providers\n- [More information needed]\n\n**Downstream actors:**\n- Deployers and end-user organisations\n- Conformity assessment bodies and auditors\n- [More information needed]\n\nRelationships will be encoded as directed edges in a knowledge graph, enabling the Contracting Authority to trace dependencies and identify concentration risks.\n\n**Visualisation:** Interactive Sankey diagrams and network graphs will be delivered as part of the final reporting tool.`,
        },
      ],
    },
    {
      section_id: "workplan",
      blocks: [
        {
          title: "Work Plan",
          markdown: `## Work Plan and Deliverables\n\nThe project is structured into five phases aligned with the contract timeline:\n\n| Milestone | Deliverable | Month |\n|-----------|-------------|-------|\n| Inception | D1 — Inception Report (methodology, refined scope, work plan) | Month 1 |\n| Seed Construction | D2 — Seed Universe Database (initial entity list) | Months 2–3 |\n| Classification & Validation | D3 — Interim Report (classified entities, preliminary findings) | Months 4–6 |\n| Supply Chain Analysis | D4 — Supply Chain Mapping Report | Months 7–8 |\n| Final Delivery | D5 — Final Study Report + Machine-Readable Dataset | Months 9–10 |\n| [More information needed] | D6 — [Additional deliverable per ToR] | [TBD] |\n\n**Review meetings:** Monthly progress calls with the Contracting Authority; physical meetings in Brussels at inception and final delivery.\n\n**Quality gates:** Each deliverable undergoes internal peer review (minimum 2 reviewers) before submission.`,
        },
      ],
    },
    {
      section_id: "team",
      blocks: [
        {
          title: "Team Composition",
          markdown: `## Proposed Team\n\n${team.length > 0
            ? `| Name | Role | Days Allocated |\n|------|------|----------------|\n${team.map((m) => `| ${m.member_name} | ${m.role} | ${randDays(15, 50)} |`).join("\n")}\n| [More information needed] | Junior Analyst | [TBD] |\n| [More information needed] | Data Engineer | [TBD] |`
            : `| Name | Role | Days Allocated |\n|------|------|----------------|\n| [More information needed] | Team Lead | [TBD] |\n| [More information needed] | Senior Analyst | [TBD] |\n| [More information needed] | Junior Analyst | [TBD] |\n| [More information needed] | Data Engineer | [TBD] |`
          }\n\n**Key personnel CVs** are provided in Annex II.\n\n**Language capabilities:** EN (native/C2 for all team members), DE, FR available on request.\n\n**Subcontracting:** [More information needed — specify if subcontracting is foreseen]`,
        },
      ],
    },
    {
      section_id: "quality-assurance",
      blocks: [
        {
          title: "QA Framework",
          markdown: `## Quality Assurance\n\nMeridian operates under **ISO 9001:2015** certified quality management processes. The following QA measures will be applied throughout the project:\n\n**Data Quality:**\n- All entity classifications undergo dual-coder validation (Cohen's κ ≥ 0.80)\n- Automated anomaly detection flags entries deviating from established patterns\n- Quarterly data refresh cycles with full audit trails\n- Target false-positive rate: < 3%\n\n**Deliverable Quality:**\n- Each report passes through a three-stage review: author → peer reviewer → quality manager\n- Compliance check against Contracting Authority's style guide and terminology\n- Factual accuracy verification against primary sources\n\n**Project Management:**\n- PRINCE2-aligned governance structure\n- Risk register updated bi-weekly with mitigation actions\n- Change control procedure for scope modifications\n\n**Data Protection:**\n- All data processed in EU-based infrastructure (Frankfurt data centre)\n- GDPR-compliant processing; DPA available upon request\n- [More information needed — specific security requirements from ToR]`,
        },
      ],
    },
    {
      section_id: "pricing",
      blocks: [
        {
          title: "Price Breakdown",
          markdown: `## Financial Offer\n\n${team.length > 0
            ? (() => {
                const rows = team.map((m) => {
                  const days = randDays(15, 50);
                  const rate = m.role.toLowerCase().includes("director") || m.role.toLowerCase().includes("lead") ? 1200 : m.role.toLowerCase().includes("senior") ? 900 : 650;
                  return { name: `${m.member_name} (${m.role})`, days, rate, total: days * rate };
                });
                rows.push({ name: "Junior Analyst [TBD]", days: 20, rate: 500, total: 10000 });
                rows.push({ name: "Data Engineer [TBD]", days: 15, rate: 750, total: 11250 });
                const grandTotal = rows.reduce((s, r) => s + r.total, 0);
                const travelCost = 8500;
                return `| Item | Days | Day Rate (EUR) | Total (EUR) |\n|------|------|----------------|-------------|\n${rows.map((r) => `| ${r.name} | ${r.days} | ${r.rate.toLocaleString("de-DE")} | ${r.total.toLocaleString("de-DE")} |`).join("\n")}\n| Travel & subsistence (estimated) | — | — | ${travelCost.toLocaleString("de-DE")} |\n| **Grand Total** | | | **${(grandTotal + travelCost).toLocaleString("de-DE")}** |\n\n*All amounts in EUR, exclusive of VAT.*`;
              })()
            : `| Item | Days | Day Rate (EUR) | Total (EUR) |\n|------|------|----------------|-------------|\n| Team Lead | [TBD] | 1.200 | [More information needed] |\n| Senior Analyst | [TBD] | 900 | [More information needed] |\n| Junior Analyst | [TBD] | 500 | [More information needed] |\n| Data Engineer | [TBD] | 750 | [More information needed] |\n| Travel & subsistence | — | — | [More information needed] |\n| **Grand Total** | | | **[More information needed]** |\n\n*All amounts in EUR, exclusive of VAT.*`
          }\n\n**Payment schedule:** [More information needed — typically milestone-based per deliverable acceptance]\n\n**Price validity:** This offer is valid for 90 days from the date of submission.\n\n**Budget ceiling compliance:** [More information needed — confirm alignment with maximum budget]`,
        },
      ],
    },
  ];

  return sections;
}
