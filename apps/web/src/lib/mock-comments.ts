// Mock workspace members + comment thread data for the document editor.
// In v1 these are static seed values per document; the hook below copies
// them into local state so users can simulate creating/replying/resolving.

export interface WorkspaceMember {
  id: string;
  fullName: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
  color: string;
}

export interface CommentMentionNode {
  type: "mention";
  userId: string;
  display: string;
}
export interface CommentTextNode {
  type: "text";
  text: string;
}
export type CommentNode = CommentMentionNode | CommentTextNode;

export interface CommentReply {
  id: string;
  authorId: string;
  body: CommentNode[];
  createdAt: string;
}

export interface CommentThread {
  id: string;
  documentId: string;
  // null = general document discussion (not anchored to a text range)
  anchor: { snippet: string; status: "ok" | "changed" } | null;
  authorId: string;
  body: CommentNode[];
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  replies: CommentReply[];
}

export const WORKSPACE_MEMBERS: WorkspaceMember[] = [
  { id: "user-jane", fullName: "Elshaday Tesfaye", email: "jane@collab.app", role: "ADMIN", color: "#0D9488" },
  { id: "user-bob", fullName: "Eyob Bekele", email: "bob@collab.app", role: "MANAGER", color: "#0284C7" },
  { id: "user-alex", fullName: "Yonas Girma", email: "alex@collab.app", role: "MEMBER", color: "#D97706" },
  { id: "user-mira", fullName: "Hiwot Mengistu", email: "mira@collab.app", role: "MEMBER", color: "#7C3AED" },
  { id: "user-sam", fullName: "Samuel Haile", email: "sam@collab.app", role: "MEMBER", color: "#DB2777" },
  { id: "user-noor", fullName: "Nuria Hassen", email: "noor@collab.app", role: "VIEWER", color: "#059669" },
];

export const findMember = (id: string): WorkspaceMember | undefined =>
  WORKSPACE_MEMBERS.find((m) => m.id === id);

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

// Per-document seed threads. Documents not listed start with no threads.
export const SEED_THREADS_BY_DOCUMENT: Record<string, CommentThread[]> = {
  "d-roadmap": [
    {
      id: "t-1",
      documentId: "d-roadmap",
      anchor: null,
      authorId: "user-bob",
      body: [
        { type: "text", text: "General reminder: please link the launch checklist before EOW. " },
        { type: "mention", userId: "user-jane", display: "Elshaday Tesfaye" },
        { type: "text", text: " can you own that?" },
      ],
      createdAt: hoursAgo(5),
      resolved: false,
      replies: [
        {
          id: "r-1",
          authorId: "user-jane",
          body: [{ type: "text", text: "Yes, will add it under Key Milestones tomorrow." }],
          createdAt: hoursAgo(4),
        },
      ],
    },
    {
      id: "t-2",
      documentId: "d-roadmap",
      anchor: { snippet: "Beta release", status: "ok" },
      authorId: "user-alex",
      body: [
        { type: "text", text: "Is October 15 still realistic given the API freeze?" },
      ],
      createdAt: hoursAgo(2),
      resolved: false,
      replies: [],
    },
    {
      id: "t-3",
      documentId: "d-roadmap",
      anchor: { snippet: "standard response envelope format", status: "ok" },
      authorId: "user-mira",
      body: [
        { type: "text", text: "Linked the schema doc, " },
        { type: "mention", userId: "user-bob", display: "Eyob Bekele" },
        { type: "text", text: " — looks aligned." },
      ],
      createdAt: daysAgo(1),
      resolved: true,
      resolvedAt: hoursAgo(20),
      resolvedBy: "user-bob",
      replies: [],
    },
    {
      id: "t-4",
      documentId: "d-roadmap",
      anchor: { snippet: "dark mode in v1.1", status: "changed" },
      authorId: "user-sam",
      body: [
        { type: "text", text: "I'd push this to v1.2 — accessibility audit isn't ready." },
      ],
      createdAt: minsAgo(40),
      resolved: false,
      replies: [],
    },
  ],
  "d-prd": [
    {
      id: "t-prd-1",
      documentId: "d-prd",
      anchor: null,
      authorId: "user-bob",
      body: [{ type: "text", text: "Locked while I finish the requirements pass — back open by Thursday." }],
      createdAt: hoursAgo(8),
      resolved: false,
      replies: [],
    },
  ],
  "d-api": [
    {
      id: "t-api-1",
      documentId: "d-api",
      anchor: null,
      authorId: "user-jane",
      body: [
        { type: "mention", userId: "user-bob", display: "Eyob Bekele" },
        { type: "text", text: " ready for review — I'd appreciate eyes on the envelope section." },
      ],
      createdAt: hoursAgo(3),
      resolved: false,
      replies: [],
    },
  ],
};
