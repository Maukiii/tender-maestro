import { useState, useCallback, useEffect } from "react";
import { Plus, X, UserPlus, GripVertical } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────

export interface TeamMember {
  name: string;
  role: string;
  days: number;
}

/** The full bench of available experts the user can pick from */
const AVAILABLE_POOL: TeamMember[] = [
  { name: "Dr. Anna Becker", role: "Project Director", days: 35 },
  { name: "Marcus Weber", role: "Lead Methodologist", days: 40 },
  { name: "Sofia Chen", role: "Senior Data Analyst", days: 30 },
  { name: "Thomas Vogel", role: "Domain Expert", days: 25 },
  { name: "Laura Fischer", role: "Junior Analyst", days: 20 },
  { name: "Jan de Vries", role: "DevOps Engineer", days: 15 },
  { name: "Elena Rossi", role: "Legal Adviser", days: 10 },
  { name: "Karim Amari", role: "Data Engineer", days: 25 },
];

// ── Helpers ───────────────────────────────────────────────────────────

/** Parse a markdown table back into TeamMember[] */
function parseTeamMarkdown(md: string): TeamMember[] {
  const members: TeamMember[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").filter(Boolean).map((c) => c.trim());
    if (cells.length < 3) continue;
    if (cells[0] === "Name" || cells[0] === "—" || /^-+$/.test(cells[0])) continue;
    const days = parseInt(cells[2], 10);
    if (isNaN(days)) continue;
    members.push({ name: cells[0], role: cells[1], days });
  }
  return members;
}

/** Serialize TeamMember[] back to the markdown table the rest of the system expects */
function serializeTeamMarkdown(members: TeamMember[]): string {
  const header = "## Proposed Team\n\n| Name | Role | Days Allocated |\n|------|------|----------------|";
  const rows = members.map((m) => `| ${m.name} | ${m.role} | ${m.days} |`).join("\n");
  const footer = `\n\n**Key personnel CVs** are provided in Annex II.\n\n**Language capabilities:** EN (native/C2 for all team members), DE, FR available on request.`;
  return `${header}\n${rows}${footer}`;
}

// ── Component ─────────────────────────────────────────────────────────

interface TeamBlockProps {
  blockId: string;
  markdown: string;
  onUpdate: (blockId: string, markdown: string) => void;
}

export function TeamBlock({ blockId, markdown, onUpdate }: TeamBlockProps) {
  const [members, setMembers] = useState<TeamMember[]>(() => parseTeamMarkdown(markdown));
  const [showPool, setShowPool] = useState(false);

  // Sync upstream markdown → local state when it changes externally (e.g. AI apply)
  useEffect(() => {
    const parsed = parseTeamMarkdown(markdown);
    if (parsed.length > 0) setMembers(parsed);
  }, [markdown]);

  const sync = useCallback(
    (next: TeamMember[]) => {
      setMembers(next);
      onUpdate(blockId, serializeTeamMarkdown(next));
    },
    [blockId, onUpdate],
  );

  const removeMember = useCallback(
    (name: string) => sync(members.filter((m) => m.name !== name)),
    [members, sync],
  );

  const addMember = useCallback(
    (member: TeamMember) => {
      if (members.some((m) => m.name === member.name)) return;
      sync([...members, member]);
      setShowPool(false);
    },
    [members, sync],
  );

  const updateDays = useCallback(
    (name: string, days: number) => {
      sync(members.map((m) => (m.name === name ? { ...m, days } : m)));
    },
    [members, sync],
  );

  const poolAvailable = AVAILABLE_POOL.filter(
    (p) => !members.some((m) => m.name === p.name),
  );

  return (
    <div className="space-y-3">
      {/* Current team */}
      <div className="space-y-1.5">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 group transition-colors hover:border-primary/20"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

            {/* Avatar circle */}
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.role}</p>
            </div>

            {/* Days stepper */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => updateDays(m.name, Math.max(1, m.days - 5))}
                className="h-6 w-6 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"
              >
                −
              </button>
              <span className="text-sm font-semibold text-foreground w-8 text-center tabular-nums">
                {m.days}
              </span>
              <button
                type="button"
                onClick={() => updateDays(m.name, m.days + 5)}
                className="h-6 w-6 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center"
              >
                +
              </button>
              <span className="text-[10px] text-muted-foreground w-8">days</span>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeMember(m.name)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
              title="Remove from team"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground italic px-4 py-6 text-center">
            No team members assigned. Add from the pool below.
          </p>
        )}
      </div>

      {/* Add button / pool */}
      {showPool ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Available Experts</p>
            <button
              type="button"
              onClick={() => setShowPool(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {poolAvailable.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">All available experts are already assigned.</p>
          ) : (
            <div className="space-y-1">
              {poolAvailable.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => addMember(p)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-card transition-colors group/add"
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover/add:bg-primary/10 transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground group-hover/add:text-primary transition-colors">
                      {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.role} · {p.days} days default</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover/add:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPool(true)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-1 py-1"
        >
          <UserPlus className="h-4 w-4" />
          Add Team Member
        </button>
      )}
    </div>
  );
}
