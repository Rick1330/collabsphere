// Mock data + types for the academic submission/review workflow.
// Lives separately from mock-tasks/mock-comments so academic mode can be
// reasoned about as a distinct system.

export type SubmissionDecision = "approved" | "changes_requested";

export interface SubmissionRecord {
  id: string;
  documentId: string;
  // Submission half
  submittedById: string;
  submittedByName: string;
  submittedAt: string;
  submissionNote?: string;
  // Decision half (absent while pending)
  decision?: SubmissionDecision;
  decidedById?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
  versionLabel?: string; // e.g. "v3"
}

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

// Per-document submission history. Keyed by documentId.
// "d-api" is currently submitted (latest entry has no decision).
// "d-prd" has a changes_requested loop.
// "d-adr" has been approved.
export const MOCK_SUBMISSION_HISTORY: Record<string, SubmissionRecord[]> = {
  "d-api": [
    {
      id: "sub-api-2",
      documentId: "d-api",
      submittedById: "user-jane",
      submittedByName: "Elshaday Tesfaye",
      submittedAt: iso(2 * 60 * 60 * 1000),
      submissionNote: "Updated REST envelope conventions per last review.",
      versionLabel: "v2",
    },
    {
      id: "sub-api-1",
      documentId: "d-api",
      submittedById: "user-jane",
      submittedByName: "Elshaday Tesfaye",
      submittedAt: iso(3 * 24 * 60 * 60 * 1000),
      submissionNote: "First pass for review.",
      decision: "changes_requested",
      decidedById: "user-supervisor",
      decidedByName: "Dr. Mekonnen Desta",
      decidedAt: iso(2 * 24 * 60 * 60 * 1000),
      decisionNote:
        "Good direction. Please tighten the error envelope section and add a worked example for paginated responses.",
      versionLabel: "v1",
    },
  ],
  "d-prd": [
    {
      id: "sub-prd-1",
      documentId: "d-prd",
      submittedById: "user-bob",
      submittedByName: "Eyob Bekele",
      submittedAt: iso(2 * 24 * 60 * 60 * 1000),
      submissionNote: "PRD draft for review.",
      decision: "changes_requested",
      decidedById: "user-supervisor",
      decidedByName: "Dr. Mekonnen Desta",
      decidedAt: iso(20 * 60 * 60 * 1000),
      decisionNote:
        "Scope section is unclear. Please split MVP from stretch goals and re-submit.",
      versionLabel: "v1",
    },
  ],
  "d-adr": [
    {
      id: "sub-adr-1",
      documentId: "d-adr",
      submittedById: "user-bob",
      submittedByName: "Eyob Bekele",
      submittedAt: iso(5 * 24 * 60 * 60 * 1000),
      submissionNote: "ADR-003 ready for review.",
      decision: "approved",
      decidedById: "user-supervisor",
      decidedByName: "Dr. Mekonnen Desta",
      decidedAt: iso(4 * 24 * 60 * 60 * 1000),
      decisionNote: "Clear rationale, approved.",
      versionLabel: "v1",
    },
  ],
};

// Workspace-level academic queue snapshot used on workspace home.
export interface AcademicQueueItem {
  documentId: string;
  documentTitle: string;
  folderPath?: string | null;
  studentId: string;
  studentName: string;
  status: "submitted" | "changes_requested" | "approved" | "draft";
  // For "submitted": when it was submitted (waiting on supervisor)
  // For "changes_requested": when changes were requested (waiting on student)
  // For "approved": when approved
  lastEventAt: string;
}

export interface AcademicProgressSnapshot {
  // Aggregate counts across all academic documents in the workspace
  counts: {
    draft: number;
    submitted: number;
    changes_requested: number;
    approved: number;
  };
  // Top of supervisor queue: things awaiting their decision
  awaitingReview: AcademicQueueItem[];
  // Recently decided
  recentlyReviewed: AcademicQueueItem[];
  // Students with at least one open review cycle (submitted or changes_requested)
  studentsWithOpenCycles: {
    studentId: string;
    studentName: string;
    openCount: number;
    lastEventAt: string;
  }[];
}

export const MOCK_ACADEMIC_PROGRESS: AcademicProgressSnapshot = {
  counts: {
    draft: 6,
    submitted: 3,
    changes_requested: 2,
    approved: 8,
  },
  awaitingReview: [
    {
      documentId: "d-api",
      documentTitle: "API Design",
      folderPath: "Architecture",
      studentId: "user-jane",
      studentName: "Elshaday Tesfaye",
      status: "submitted",
      lastEventAt: iso(2 * 60 * 60 * 1000),
    },
    {
      documentId: "d-thesis-ch2",
      documentTitle: "Thesis — Chapter 2",
      folderPath: "Thesis",
      studentId: "user-priya",
      studentName: "Bethel Tekle",
      status: "submitted",
      lastEventAt: iso(8 * 60 * 60 * 1000),
    },
    {
      documentId: "d-litreview",
      documentTitle: "Literature Review",
      folderPath: "Thesis",
      studentId: "user-alice",
      studentName: "Kidist Alemu",
      status: "submitted",
      lastEventAt: iso(26 * 60 * 60 * 1000),
    },
  ],
  recentlyReviewed: [
    {
      documentId: "d-prd",
      documentTitle: "PRD v2",
      folderPath: "Product",
      studentId: "user-bob",
      studentName: "Eyob Bekele",
      status: "changes_requested",
      lastEventAt: iso(20 * 60 * 60 * 1000),
    },
    {
      documentId: "d-adr",
      documentTitle: "ADR-003 Prisma",
      folderPath: "Architecture",
      studentId: "user-bob",
      studentName: "Eyob Bekele",
      status: "approved",
      lastEventAt: iso(4 * 24 * 60 * 60 * 1000),
    },
  ],
  studentsWithOpenCycles: [
    {
      studentId: "user-jane",
      studentName: "Elshaday Tesfaye",
      openCount: 1,
      lastEventAt: iso(2 * 60 * 60 * 1000),
    },
    {
      studentId: "user-priya",
      studentName: "Bethel Tekle",
      openCount: 1,
      lastEventAt: iso(8 * 60 * 60 * 1000),
    },
    {
      studentId: "user-bob",
      studentName: "Eyob Bekele",
      openCount: 1,
      lastEventAt: iso(20 * 60 * 60 * 1000),
    },
    {
      studentId: "user-alice",
      studentName: "Kidist Alemu",
      openCount: 1,
      lastEventAt: iso(26 * 60 * 60 * 1000),
    },
  ],
};
