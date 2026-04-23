// Workspace-level label vocabulary.
// In v1, this is a curated set per workspace; the create/edit UIs read from
// here so labels feel like a real product surface, not free-form leftovers.

export interface WorkspaceLabel {
  /** Slug used as the label value on tasks. */
  value: string;
  /** Display name (Title Case). */
  name: string;
  /** Tone tied to a Tailwind palette. */
  tone: "teal" | "indigo" | "amber" | "rose" | "emerald" | "stone" | "violet" | "sky";
  /** Optional short description shown in the picker tooltip. */
  description?: string;
}

const LABELS: WorkspaceLabel[] = [
  // Engineering
  { value: "frontend", name: "Frontend", tone: "indigo", description: "UI, components, styles." },
  { value: "backend", name: "Backend", tone: "emerald", description: "APIs, services, jobs." },
  { value: "infra", name: "Infra", tone: "stone", description: "CI/CD, hosting, ops." },
  { value: "db", name: "Database", tone: "violet", description: "Schema, migrations, data." },
  { value: "auth", name: "Auth", tone: "amber", description: "Login, sessions, permissions." },
  { value: "bug", name: "Bug", tone: "rose", description: "Defects and regressions." },
  { value: "refactor", name: "Refactor", tone: "stone", description: "Cleanup, no behavior change." },
  // Product / Design
  { value: "design", name: "Design", tone: "violet", description: "Visual + interaction." },
  { value: "system", name: "Design system", tone: "violet", description: "Shared tokens & primitives." },
  { value: "docs", name: "Documentation", tone: "sky", description: "Reference and guides." },
  { value: "review", name: "Review", tone: "amber", description: "Awaiting peer review." },
  { value: "qa", name: "QA", tone: "teal", description: "Testing and verification." },
  { value: "triage", name: "Triage", tone: "rose", description: "Needs investigation." },
];

export function getWorkspaceLabels(_workspaceId: string): WorkspaceLabel[] {
  // In a real app, this would be per-workspace.
  return LABELS;
}

export function findLabel(value: string): WorkspaceLabel | undefined {
  return LABELS.find((l) => l.value === value);
}

const TONE_CLASSES: Record<WorkspaceLabel["tone"], string> = {
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  stone: "bg-stone-100 text-stone-600 border-stone-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
};

export function getLabelClasses(value: string): string {
  return TONE_CLASSES[findLabel(value)?.tone ?? "stone"];
}

export function getLabelName(value: string): string {
  return findLabel(value)?.name ?? value;
}
