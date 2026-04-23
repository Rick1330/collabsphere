// Mock files for the workspace files library. The upload pipeline is not
// connected yet — the UI exposes a truthful "not connected" state when the
// user attempts to upload.

export type FileKind = "pdf" | "image" | "doc" | "sheet" | "slides" | "video" | "audio" | "archive" | "other";

export interface FileItem {
  id: string;
  name: string;
  kind: FileKind;
  sizeBytes: number;
  uploadedBy: { id: string; fullName: string };
  uploadedAt: string;
  folder?: string;
}

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const MOCK_FILES: FileItem[] = [
  {
    id: "f-001",
    name: "Q4 roadmap final.pdf",
    kind: "pdf",
    sizeBytes: 2_840_000,
    uploadedBy: { id: "u1", fullName: "Elshaday Tesfaye" },
    uploadedAt: iso(2 * 60 * 60 * 1000),
    folder: "Product",
  },
  {
    id: "f-002",
    name: "login-flow-mock.png",
    kind: "image",
    sizeBytes: 612_000,
    uploadedBy: { id: "u2", fullName: "Eyob Bekele" },
    uploadedAt: iso(5 * 60 * 60 * 1000),
    folder: "Design",
  },
  {
    id: "f-003",
    name: "user-research-q3.docx",
    kind: "doc",
    sizeBytes: 1_120_000,
    uploadedBy: { id: "u3", fullName: "Kidist Alemu" },
    uploadedAt: iso(24 * 60 * 60 * 1000),
    folder: "Research",
  },
  {
    id: "f-004",
    name: "metrics-dashboard.xlsx",
    kind: "sheet",
    sizeBytes: 384_000,
    uploadedBy: { id: "u1", fullName: "Elshaday Tesfaye" },
    uploadedAt: iso(2 * 24 * 60 * 60 * 1000),
    folder: "Analytics",
  },
  {
    id: "f-005",
    name: "all-hands-deck.pptx",
    kind: "slides",
    sizeBytes: 8_400_000,
    uploadedBy: { id: "u4", fullName: "Mekonnen Desta" },
    uploadedAt: iso(3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "f-006",
    name: "kickoff-recording.mp4",
    kind: "video",
    sizeBytes: 142_000_000,
    uploadedBy: { id: "u2", fullName: "Eyob Bekele" },
    uploadedAt: iso(4 * 24 * 60 * 60 * 1000),
    folder: "Meetings",
  },
  {
    id: "f-007",
    name: "interview-jane-04.m4a",
    kind: "audio",
    sizeBytes: 18_400_000,
    uploadedBy: { id: "u3", fullName: "Kidist Alemu" },
    uploadedAt: iso(5 * 24 * 60 * 60 * 1000),
    folder: "Research",
  },
  {
    id: "f-008",
    name: "brand-assets.zip",
    kind: "archive",
    sizeBytes: 64_300_000,
    uploadedBy: { id: "u4", fullName: "Mekonnen Desta" },
    uploadedAt: iso(6 * 24 * 60 * 60 * 1000),
    folder: "Design",
  },
  {
    id: "f-009",
    name: "competitive-analysis.pdf",
    kind: "pdf",
    sizeBytes: 4_120_000,
    uploadedBy: { id: "u1", fullName: "Elshaday Tesfaye" },
    uploadedAt: iso(7 * 24 * 60 * 60 * 1000),
    folder: "Research",
  },
  {
    id: "f-010",
    name: "hero-shot.jpg",
    kind: "image",
    sizeBytes: 2_120_000,
    uploadedBy: { id: "u2", fullName: "Eyob Bekele" },
    uploadedAt: iso(9 * 24 * 60 * 60 * 1000),
    folder: "Design",
  },
  {
    id: "f-011",
    name: "contract-acme-v3.pdf",
    kind: "pdf",
    sizeBytes: 980_000,
    uploadedBy: { id: "u4", fullName: "Mekonnen Desta" },
    uploadedAt: iso(11 * 24 * 60 * 60 * 1000),
  },
  {
    id: "f-012",
    name: "release-notes.md",
    kind: "doc",
    sizeBytes: 12_000,
    uploadedBy: { id: "u1", fullName: "Elshaday Tesfaye" },
    uploadedAt: iso(13 * 24 * 60 * 60 * 1000),
  },
];

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
