/** Pool of all available team candidates with CV fit scores */
export interface TeamCandidate {
  name: string;
  role: string;
  experience: string;
  fitScore: number; // 0–100, how well the CV matches the tender
  defaultDays: string;
}

export const TEAM_CANDIDATES: TeamCandidate[] = [
  { name: "Sarah Mitchell", role: "Project Director", experience: "18 yrs", fitScore: 94, defaultDays: "35" },
  { name: "Marcus Webb", role: "DevOps Engineer", experience: "6 yrs", fitScore: 72, defaultDays: "25" },
  { name: "James Chen", role: "Senior Developer", experience: "9 yrs", fitScore: 88, defaultDays: "30" },
  { name: "Anna Kowalski", role: "Data Analyst", experience: "5 yrs", fitScore: 65, defaultDays: "20" },
  { name: "Lena Berger", role: "UX Researcher", experience: "7 yrs", fitScore: 58, defaultDays: "15" },
  { name: "Thomas Vogel", role: "Domain Expert", experience: "12 yrs", fitScore: 91, defaultDays: "20" },
  { name: "Sofia Chen", role: "Quality Lead", experience: "10 yrs", fitScore: 83, defaultDays: "18" },
];

/** Return candidates whose names do NOT appear in the given list */
export function getAvailableCandidates(assignedNames: string[]): TeamCandidate[] {
  const lower = new Set(assignedNames.map((n) => n.toLowerCase().trim()));
  return TEAM_CANDIDATES.filter((c) => !lower.has(c.name.toLowerCase()));
}
