// Mock document version history.
// Each entry is a captured snapshot with a reason that explains *why* it
// was created, the author, and a content excerpt for diff preview.

export type VersionReason =
  | "manual"
  | "auto"
  | "submitted"
  | "approved"
  | "before_restore";

export interface DocumentVersion {
  id: string;
  documentId: string;
  /** Monotonic version number (1, 2, 3...) — newest has highest number. */
  versionNumber: number;
  reason: VersionReason;
  /** ISO timestamp when this snapshot was captured. */
  createdAt: string;
  createdById: string;
  createdByName: string;
  /** Short label sometimes used by submission reasons — "v2", "v3"... */
  versionLabel?: string;
  /** Plaintext content excerpt for diff preview (first ~600 chars). */
  contentExcerpt: string;
  /** Optional human-readable note (e.g. submission note, restore source). */
  note?: string;
  /** Total character count of the full document at this version. */
  charCount: number;
}

const now = Date.now();
const ago = (ms: number) => new Date(now - ms).toISOString();
const day = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

// Per-document seed history. Newest first.
export const MOCK_VERSIONS: Record<string, DocumentVersion[]> = {
  "d-api": [
    {
      id: "ver-api-7",
      documentId: "d-api",
      versionNumber: 7,
      reason: "submitted",
      createdAt: ago(2 * hour),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      versionLabel: "v2",
      contentExcerpt:
        "API Design — REST envelope conventions. Updated section on paginated responses with worked examples. Standard envelope: { data, meta, errors }. Pagination uses cursor-based tokens for large collections.",
      note: "Updated REST envelope conventions per last review.",
      charCount: 4820,
    },
    {
      id: "ver-api-6",
      documentId: "d-api",
      versionNumber: 6,
      reason: "auto",
      createdAt: ago(3 * hour),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt:
        "API Design — REST envelope conventions. Standard envelope: { data, meta, errors }. Started writing pagination examples.",
      charCount: 4612,
    },
    {
      id: "ver-api-5",
      documentId: "d-api",
      versionNumber: 5,
      reason: "manual",
      createdAt: ago(2 * day - 6 * hour),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt:
        "API Design. Reworked the error envelope section after Dr. Reed's feedback.",
      note: "Saved before lunch.",
      charCount: 4180,
    },
    {
      id: "ver-api-4",
      documentId: "d-api",
      versionNumber: 4,
      reason: "submitted",
      createdAt: ago(3 * day),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      versionLabel: "v1",
      contentExcerpt:
        "API Design — REST envelope conventions. First pass for review. Standard envelope: { data, meta }.",
      note: "First pass for review.",
      charCount: 3340,
    },
    {
      id: "ver-api-3",
      documentId: "d-api",
      versionNumber: 3,
      reason: "auto",
      createdAt: ago(3 * day + 2 * hour),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt:
        "API Design. Drafting envelope conventions. Looking at GraphQL alternatives.",
      charCount: 2980,
    },
    {
      id: "ver-api-2",
      documentId: "d-api",
      versionNumber: 2,
      reason: "auto",
      createdAt: ago(4 * day),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt: "API Design. Initial scaffolding and headings.",
      charCount: 1240,
    },
    {
      id: "ver-api-1",
      documentId: "d-api",
      versionNumber: 1,
      reason: "manual",
      createdAt: ago(5 * day),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt: "API Design. New document.",
      note: "Initial draft.",
      charCount: 320,
    },
  ],
  "d-prd": [
    {
      id: "ver-prd-3",
      documentId: "d-prd",
      versionNumber: 3,
      reason: "submitted",
      createdAt: ago(2 * day),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      versionLabel: "v1",
      contentExcerpt:
        "PRD v2. Scope, MVP, stretch goals (mixed). Awaiting review.",
      note: "PRD draft for review.",
      charCount: 5240,
    },
    {
      id: "ver-prd-2",
      documentId: "d-prd",
      versionNumber: 2,
      reason: "auto",
      createdAt: ago(3 * day),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      contentExcerpt: "PRD v2. Scope and stretch goals draft.",
      charCount: 4100,
    },
    {
      id: "ver-prd-1",
      documentId: "d-prd",
      versionNumber: 1,
      reason: "manual",
      createdAt: ago(4 * day),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      contentExcerpt: "PRD v2. Initial outline.",
      charCount: 1820,
    },
  ],
  "d-roadmap": [
    {
      id: "ver-rm-4",
      documentId: "d-roadmap",
      versionNumber: 4,
      reason: "approved",
      createdAt: ago(6 * hour),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      contentExcerpt:
        "Project Roadmap Q4. Beta release Oct 15, user testing Nov 1, production launch Dec 1.",
      note: "Approved by leadership.",
      charCount: 3460,
    },
    {
      id: "ver-rm-3",
      documentId: "d-roadmap",
      versionNumber: 3,
      reason: "manual",
      createdAt: ago(day),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt:
        "Project Roadmap Q4. Reworded launch milestones.",
      charCount: 3380,
    },
    {
      id: "ver-rm-2",
      documentId: "d-roadmap",
      versionNumber: 2,
      reason: "auto",
      createdAt: ago(2 * day),
      createdById: "user-jane",
      createdByName: "Elshaday Tesfaye",
      contentExcerpt: "Project Roadmap Q4. Filling out milestones.",
      charCount: 2740,
    },
    {
      id: "ver-rm-1",
      documentId: "d-roadmap",
      versionNumber: 1,
      reason: "manual",
      createdAt: ago(8 * day),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      contentExcerpt: "Project Roadmap Q4. New document.",
      charCount: 240,
    },
  ],
  "d-adr": [
    {
      id: "ver-adr-2",
      documentId: "d-adr",
      versionNumber: 2,
      reason: "approved",
      createdAt: ago(4 * day),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      contentExcerpt:
        "ADR-003 Prisma. We will adopt Prisma for the data layer.",
      note: "Approved.",
      charCount: 1860,
    },
    {
      id: "ver-adr-1",
      documentId: "d-adr",
      versionNumber: 1,
      reason: "submitted",
      createdAt: ago(5 * day),
      createdById: "user-bob",
      createdByName: "Eyob Bekele",
      versionLabel: "v1",
      contentExcerpt: "ADR-003 Prisma. Rationale for adopting Prisma.",
      note: "ADR-003 ready for review.",
      charCount: 1620,
    },
  ],
};

export function getVersionHistory(documentId: string): DocumentVersion[] {
  return MOCK_VERSIONS[documentId] ?? [];
}

export const REASON_META: Record<
  VersionReason,
  { label: string; tone: "neutral" | "amber" | "emerald" | "blue" | "stone"; description: string }
> = {
  manual: {
    label: "Manual save",
    tone: "blue",
    description: "Captured when the author saved with ⌘S.",
  },
  auto: {
    label: "Auto-save",
    tone: "neutral",
    description: "Captured automatically while editing.",
  },
  submitted: {
    label: "Submitted",
    tone: "amber",
    description: "Captured at the moment of submission for review.",
  },
  approved: {
    label: "Approved",
    tone: "emerald",
    description: "Captured at the moment of supervisor approval.",
  },
  before_restore: {
    label: "Safety snapshot",
    tone: "stone",
    description:
      "Captured automatically right before a previous version was restored.",
  },
};
