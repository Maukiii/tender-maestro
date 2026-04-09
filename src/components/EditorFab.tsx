import { useState, useCallback } from "react";
import { ShieldCheck, Calculator, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProposalSection } from "@/lib/proposalData";

interface EditorFabProps {
  sections: ProposalSection[];
  onUpdateBlock: (blockId: string, markdown: string) => void;
}

interface ComplianceIssue {
  section: string;
  block: string;
  issue: string;
  severity: "high" | "medium" | "low";
}

export function EditorFab({ sections, onUpdateBlock }: EditorFabProps) {
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[] | null>(null);

  const [repriceLoading, setRepriceLoading] = useState(false);
  const [repriceResult, setRepriceResult] = useState<string | null>(null);

  const runComplianceCheck = useCallback(async () => {
    setComplianceOpen(true);
    setComplianceLoading(true);
    setComplianceIssues(null);

    // Simulate scanning — mock compliance issues based on actual content
    await new Promise((r) => setTimeout(r, 2000));

    const issues: ComplianceIssue[] = [];

    for (const section of sections) {
      for (const block of section.blocks) {
        const md = block.markdown.toLowerCase();

        if (md.includes("more information needed")) {
          issues.push({
            section: section.label,
            block: block.title,
            issue: "Contains placeholder text '[More information needed]' — must be completed before submission per EU tender regulation Art. 110 FR.",
            severity: "high",
          });
        }

        if (section.id === "pricing" && !md.includes("vat")) {
          issues.push({
            section: section.label,
            block: block.title,
            issue: "Financial offer should explicitly state VAT treatment (exempt, included, or excluded) per EU Financial Regulation Art. 172.",
            severity: "medium",
          });
        }

        if (section.id === "team" && !md.includes("language")) {
          issues.push({
            section: section.label,
            block: block.title,
            issue: "Team composition should specify working language capabilities as required by most EU institutional tender specifications.",
            severity: "low",
          });
        }

        if (md.includes("gdpr") && !md.includes("data protection")) {
          issues.push({
            section: section.label,
            block: block.title,
            issue: "GDPR reference found but no explicit Data Protection Impact Assessment (DPIA) commitment. Recommended under Regulation (EU) 2016/679 Art. 35.",
            severity: "medium",
          });
        }

        if (section.id === "quality-assurance" && !md.includes("iso")) {
          issues.push({
            section: section.label,
            block: block.title,
            issue: "Quality assurance section should reference applicable ISO standards (e.g. ISO 9001, ISO 27001) for EU institutional credibility.",
            severity: "low",
          });
        }
      }
    }

    if (issues.length === 0) {
      issues.push({
        section: "Overall",
        block: "—",
        issue: "No compliance issues detected. Document appears ready for submission review.",
        severity: "low",
      });
    }

    setComplianceIssues(issues);
    setComplianceLoading(false);
  }, [sections]);

  const runReprice = useCallback(async () => {
    setRepriceLoading(true);
    setRepriceResult(null);

    await new Promise((r) => setTimeout(r, 1500));

    // Find team members from the team section
    const teamSection = sections.find((s) => s.id === "team");
    const pricingSection = sections.find((s) => s.id === "pricing");

    if (!teamSection || !pricingSection) {
      setRepriceResult("Could not find Team or Price section.");
      setRepriceLoading(false);
      return;
    }

    // Parse team members from markdown tables
    const teamBlock = teamSection.blocks[0];
    const teamLines = teamBlock.markdown
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.includes("---"));

    const members: { name: string; role: string }[] = [];
    for (const line of teamLines.slice(1)) {
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.length >= 2 && cells[0] !== "Name") {
        members.push({ name: cells[0], role: cells[1] });
      }
    }

    if (members.length === 0) {
      setRepriceResult("No team members found in the Team section table.");
      setRepriceLoading(false);
      return;
    }

    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Generate pricing based on roles
    const priceRows = members.map((m) => {
      const isLead = /director|lead|head/i.test(m.role);
      const isSenior = /senior|expert|domain/i.test(m.role);
      const days = isLead ? rand(25, 45) : isSenior ? rand(20, 40) : rand(15, 30);
      const rate = isLead ? 1200 : isSenior ? 900 : 650;
      return { label: `${m.name} (${m.role})`, days, rate, total: days * rate };
    });

    // Add support & travel
    priceRows.push({ label: "Junior Analyst (support)", days: 20, rate: 500, total: 10000 });
    const travelCost = rand(6000, 12000);
    const grandTotal = priceRows.reduce((s, r) => s + r.total, 0) + travelCost;

    const newMarkdown = `## Financial Offer

| Item | Days | Day Rate (EUR) | Total (EUR) |
|------|------|----------------|-------------|
${priceRows.map((r) => `| ${r.label} | ${r.days} | ${r.rate.toLocaleString("de-DE")} | ${r.total.toLocaleString("de-DE")} |`).join("\n")}
| Travel & subsistence (estimated) | — | — | ${travelCost.toLocaleString("de-DE")} |
| **Grand Total** | | | **${grandTotal.toLocaleString("de-DE")}** |

*All amounts in EUR, exclusive of VAT.*

**Payment schedule:** Milestone-based, upon acceptance of each deliverable. 30-day payment terms.

**Price validity:** This offer is valid for 90 days from the date of submission.`;

    // Apply to the first pricing block
    const pricingBlock = pricingSection.blocks[0];
    if (pricingBlock) {
      onUpdateBlock(pricingBlock.id, newMarkdown);
    }

    setRepriceResult(`Recalculated pricing for ${members.length} team members. Grand total: EUR ${grandTotal.toLocaleString("de-DE")}`);
    setRepriceLoading(false);
  }, [sections, onUpdateBlock]);

  const severityColor = (s: ComplianceIssue["severity"]) => {
    if (s === "high") return "text-destructive";
    if (s === "medium") return "text-warning";
    return "text-muted-foreground";
  };

  const severityBg = (s: ComplianceIssue["severity"]) => {
    if (s === "high") return "bg-destructive/10 border-destructive/20";
    if (s === "medium") return "bg-warning/10 border-warning/20";
    return "bg-muted/50 border-border";
  };

  return (
    <>
      {/* FAB buttons */}
      <div className="fixed bottom-6 right-[340px] flex flex-col gap-3 z-40">
        <button
          type="button"
          onClick={runReprice}
          disabled={repriceLoading}
          className="group flex items-center gap-2 h-12 pl-4 pr-5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-60"
          title="Re-price based on current team"
        >
          {repriceLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Calculator className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">Re-Price</span>
        </button>

        <button
          type="button"
          onClick={runComplianceCheck}
          disabled={complianceLoading}
          className="group flex items-center gap-2 h-12 pl-4 pr-5 rounded-full bg-foreground text-background shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-60"
          title="Scan for legal compliance issues"
        >
          {complianceLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">Compliance Check</span>
        </button>
      </div>

      {/* Compliance results panel */}
      {complianceOpen && (
        <div className="fixed bottom-24 right-[340px] w-[420px] max-h-[60vh] z-50 rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Compliance Report</h3>
            </div>
            <button
              type="button"
              onClick={() => setComplianceOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {complianceLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Scanning document for compliance issues…</p>
              </div>
            ) : complianceIssues ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Found {complianceIssues.length} issue{complianceIssues.length !== 1 ? "s" : ""}
                </p>
                {complianceIssues.map((issue, i) => (
                  <div key={i} className={`rounded-lg border p-3 space-y-1 ${severityBg(issue.severity)}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${severityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {issue.section} → {issue.block}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{issue.issue}</p>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Re-price toast */}
      {repriceResult && (
        <div className="fixed bottom-24 right-[340px] z-50 max-w-sm rounded-xl border border-border bg-card shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <Calculator className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Pricing Updated</p>
              <p className="text-xs text-muted-foreground mt-1">{repriceResult}</p>
            </div>
            <button
              type="button"
              onClick={() => setRepriceResult(null)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
