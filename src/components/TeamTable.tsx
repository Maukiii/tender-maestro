import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { ProposalBlock } from "@/lib/proposalData";

interface TeamMember {
  name: string;
  role: string;
  days: string;
}

interface TeamTableProps {
  block: ProposalBlock;
  onUpdate: (blockId: string, markdown: string) => void;
}

/** Parse a markdown table into structured team members */
function parseMembers(md: string): TeamMember[] {
  const rows = md
    .split("\n")
    .filter((l) => l.startsWith("|") && !l.includes("---"));
  const members: TeamMember[] = [];
  for (const row of rows.slice(1)) {
    const cells = row.split("|").filter(Boolean).map((c) => c.trim());
    if (cells.length >= 3 && cells[0] !== "Name" && cells[0] !== "—") {
      members.push({ name: cells[0], role: cells[1], days: cells[2] });
    }
  }
  return members;
}

/** Serialize team members back to markdown table */
function serialize(members: TeamMember[]): string {
  const header = "| Name | Role | Days Allocated |\n|------|------|----------------|";
  if (members.length === 0) return `${header}\n| — | — | — |`;
  const rows = members.map((m) => `| ${m.name} | ${m.role} | ${m.days} |`);
  return `${header}\n${rows.join("\n")}`;
}

export function TeamTable({ block, onUpdate }: TeamTableProps) {
  const [members, setMembers] = useState<TeamMember[]>(() => parseMembers(block.markdown));
  const [editCell, setEditCell] = useState<{ row: number; col: keyof TeamMember } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync upstream when members change
  const flush = useCallback(
    (next: TeamMember[]) => {
      setMembers(next);
      onUpdate(block.id, serialize(next));
    },
    [block.id, onUpdate],
  );

  // Re-parse if block.markdown changes externally (e.g. AI apply)
  useEffect(() => {
    const parsed = parseMembers(block.markdown);
    if (serialize(parsed) !== serialize(members)) {
      setMembers(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.markdown]);

  // Focus input when edit starts
  useEffect(() => {
    if (editCell && inputRef.current) inputRef.current.focus();
  }, [editCell]);

  // Click-outside to deselect
  useEffect(() => {
    if (!editCell) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditCell(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editCell]);

  const updateCell = (row: number, col: keyof TeamMember, value: string) => {
    const next = members.map((m, i) => (i === row ? { ...m, [col]: value } : m));
    flush(next);
  };

  const addRow = () => {
    const next = [...members, { name: "New Member", role: "Role", days: "0" }];
    flush(next);
    setEditCell({ row: next.length - 1, col: "name" });
  };

  const removeRow = (idx: number) => {
    flush(members.filter((_, i) => i !== idx));
    setEditCell(null);
  };

  const cols: { key: keyof TeamMember; label: string; width: string }[] = [
    { key: "name", label: "Name", width: "flex-[2]" },
    { key: "role", label: "Role", width: "flex-[2]" },
    { key: "days", label: "Days", width: "w-20" },
  ];

  return (
    <div ref={containerRef} className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center bg-muted/60 border-b border-border">
        <div className="w-8 shrink-0" />
        {cols.map((c) => (
          <div
            key={c.key}
            className={`${c.width} px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider`}
          >
            {c.label}
          </div>
        ))}
        <div className="w-9 shrink-0" />
      </div>

      {/* Rows */}
      {members.map((member, ri) => (
        <div
          key={ri}
          className="group flex items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
        >
          <div className="w-8 shrink-0 flex items-center justify-center text-muted-foreground/40">
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          {cols.map((c) => {
            const isEditing = editCell?.row === ri && editCell.col === c.key;
            return (
              <div
                key={c.key}
                className={`${c.width} px-3 py-2`}
                onClick={() => setEditCell({ row: ri, col: c.key })}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={member[c.key]}
                    onChange={(e) => updateCell(ri, c.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") setEditCell(null);
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const ci = cols.findIndex((x) => x.key === c.key);
                        const nextCol = cols[(ci + 1) % cols.length];
                        const nextRow = ci + 1 >= cols.length ? ri + 1 : ri;
                        if (nextRow < members.length) {
                          setEditCell({ row: nextRow, col: nextCol.key });
                        } else {
                          setEditCell(null);
                        }
                      }
                    }}
                    className="w-full bg-transparent text-sm text-foreground outline-none border-b border-primary/40 py-0.5"
                  />
                ) : (
                  <span className="text-sm text-foreground cursor-text select-none">
                    {member[c.key] || "—"}
                  </span>
                )}
              </div>
            );
          })}

          <div className="w-9 shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => removeRow(ri)}
              className="p-1 rounded-md text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive hover:bg-destructive/10 transition-all"
              aria-label="Remove member"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add team member
      </button>
    </div>
  );
}
