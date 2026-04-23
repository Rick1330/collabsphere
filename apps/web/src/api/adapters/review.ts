/**
 * Review-queue adapter (mock).
 *
 * Aggregates pending submissions across workspaces for the supervisor /
 * reviewer review queue. Built on top of the existing academic mock data
 * (`MOCK_ACADEMIC_PROGRESS`) but extended with workspace context and
 * mutating handlers (approve / request changes) that update an in-memory
 * store so the queue feels live.
 *
 * The data is intentionally per-process (no persistence) — refreshing the
 * page resets it. That's fine for a mock; it keeps the demo deterministic.
 */

import {
  MOCK_ACADEMIC_PROGRESS,
  MOCK_SUBMISSION_HISTORY,
  type AcademicQueueItem,
  type SubmissionRecord,
} from "@/lib/mock-academic";

export type ReviewDecision = "approved" | "changes_requested";

export interface ReviewItem extends AcademicQueueItem {
  /** Workspace this submission belongs to (so the queue can route correctly). */
  workspaceId: string;
  workspaceName: string;
  workspaceType: "academic" | "professional" | "general";
  /** Optional submission note from the student. */
  submissionNote?: string;
  /** Version label e.g. "v2". */
  versionLabel?: string;
}

export interface ReviewedItem extends ReviewItem {
  decision: ReviewDecision;
  decidedAt: string;
  decisionNote?: string;
}

const now = () => new Date().toISOString();

/** Seed the queue from academic progress + add cross-workspace context. */
function seedQueue(): ReviewItem[] {
  return MOCK_ACADEMIC_PROGRESS.awaitingReview.map((item, idx) => ({
    ...item,
    workspaceId: idx % 2 === 0 ? "thesis" : "alpha",
    workspaceName: idx % 2 === 0 ? "Thesis — Distributed Systems" : "Project Alpha",
    workspaceType: (idx % 2 === 0 ? "academic" : "professional") as
      | "academic"
      | "professional",
    submissionNote:
      idx === 0
        ? "Updated REST envelope conventions per last review."
        : idx === 1
          ? "Chapter 2 first draft — focus on lit-review framing."
          : "Initial pass for review; happy to iterate.",
    versionLabel: `v${idx + 1}`,
  }));
}

function seedReviewed(): ReviewedItem[] {
  return MOCK_ACADEMIC_PROGRESS.recentlyReviewed.map((item, idx) => ({
    ...item,
    workspaceId: idx % 2 === 0 ? "alpha" : "thesis",
    workspaceName: idx % 2 === 0 ? "Project Alpha" : "Thesis — Distributed Systems",
    workspaceType: (idx % 2 === 0 ? "professional" : "academic") as
      | "academic"
      | "professional",
    decision: item.status === "approved" ? "approved" : "changes_requested",
    decidedAt: item.lastEventAt,
    decisionNote:
      item.status === "approved"
        ? "Clear rationale, approved."
        : "Scope section unclear — please split MVP from stretch goals.",
  }));
}

const pending: ReviewItem[] = seedQueue();
let reviewed: ReviewedItem[] = seedReviewed();

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function fetchReviewQueue(): Promise<{
  pending: ReviewItem[];
  reviewed: ReviewedItem[];
}> {
  await delay(200);
  return {
    pending: [...pending].sort(
      (a, b) => new Date(a.lastEventAt).getTime() - new Date(b.lastEventAt).getTime(),
    ),
    reviewed: [...reviewed].sort(
      (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime(),
    ),
  };
}

export async function decideOnSubmission(params: {
  documentId: string;
  decision: ReviewDecision;
  note?: string;
}): Promise<ReviewedItem> {
  await delay(350);
  const idx = pending.findIndex((p) => p.documentId === params.documentId);
  if (idx === -1) {
    throw new Error("Submission no longer pending");
  }
  const [item] = pending.splice(idx, 1);
  const reviewedItem: ReviewedItem = {
    ...item,
    status: params.decision,
    decision: params.decision,
    decidedAt: now(),
    decisionNote: params.note,
    lastEventAt: now(),
  };
  reviewed = [reviewedItem, ...reviewed].slice(0, 20);
  return reviewedItem;
}

/** Per-document decision history. Combines seeded submission history with
 * any in-memory decisions recorded during this session. */
export async function fetchDocumentHistory(documentId: string): Promise<SubmissionRecord[]> {
  await delay(150);
  const seeded = MOCK_SUBMISSION_HISTORY[documentId] ?? [];
  const sessionDecisions: SubmissionRecord[] = reviewed
    .filter((r) => r.documentId === documentId)
    .map((r) => ({
      id: `session-${r.documentId}-${r.decidedAt}`,
      documentId: r.documentId,
      submittedById: r.studentId,
      submittedByName: r.studentName,
      submittedAt: r.lastEventAt,
      decision: r.decision,
      decidedById: "user-current",
      decidedByName: "You",
      decidedAt: r.decidedAt,
      decisionNote: r.decisionNote,
      versionLabel: r.versionLabel,
    }));
  // Newest first, dedupe by id
  const merged = [...sessionDecisions, ...seeded];
  const seen = new Set<string>();
  return merged
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .sort(
      (a, b) =>
        new Date(b.decidedAt ?? b.submittedAt).getTime() -
        new Date(a.decidedAt ?? a.submittedAt).getTime(),
    );
}

/** Lightweight counts for dashboard panels. */
export async function fetchReviewCounts(): Promise<{
  pendingTotal: number;
  overdueTotal: number;
  decidedToday: number;
}> {
  await delay(120);
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  return {
    pendingTotal: pending.length,
    overdueTotal: pending.filter((p) => now - new Date(p.lastEventAt).getTime() > dayMs).length,
    decidedToday: reviewed.filter((r) => now - new Date(r.decidedAt).getTime() < dayMs).length,
  };
}

/** For the student "my submissions" panel — what *I* have submitted. */
export async function fetchMySubmissions(accountId: string): Promise<{
  pending: ReviewItem[];
  reviewed: ReviewedItem[];
}> {
  await delay(180);
  // Map mock account ids → student ids used in the academic mock seed.
  const idMap: Record<string, string> = {
    u_meron: "user-priya",
    u_hanna: "user-alice",
    u_jane: "user-jane",
    u_eyob: "user-bob",
  };
  const studentId = idMap[accountId] ?? accountId;
  return {
    pending: pending.filter((p) => p.studentId === studentId),
    reviewed: reviewed.filter((r) => r.studentId === studentId),
  };
}
