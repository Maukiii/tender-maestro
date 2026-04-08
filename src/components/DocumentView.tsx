import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProposalSection } from "@/lib/proposalData";

interface DocumentViewProps {
  sections: ProposalSection[];
}

export function DocumentView({ sections }: DocumentViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="w-full max-w-3xl mx-auto prose prose-sm max-w-none text-foreground
        prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary
        prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-p:my-1">
        {sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-lg font-semibold uppercase tracking-wider border-b border-border pb-2 mb-4">
              {section.label}
            </h2>
            {section.blocks.map((block) => (
              <div key={block.id} className="mb-4">
                <h3 className="text-sm font-semibold mb-1">{block.title}</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.markdown}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
