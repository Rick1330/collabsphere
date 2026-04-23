// Shared mock document tree used by both the Documents list page and the
// editor's left tree panel. Keeping a single source of truth ensures the
// tree in the editor matches the tree in the list view.

import type { TreeNode } from "@/features/documents/components/document-tree";

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const MOCK_DOCUMENT_TREE: TreeNode[] = [
  {
    type: "folder",
    id: "f-product",
    name: "Product",
    children: [
      {
        type: "document",
        id: "d-roadmap",
        title: "Project Roadmap Q4",
        status: "approved",
        updatedAt: iso(2 * 60 * 1000),
      },
      {
        type: "document",
        id: "d-prd",
        title: "PRD v2",
        status: "changes_requested",
        isLocked: true,
        lockedBy: { fullName: "Eyob Bekele" },
        updatedAt: iso(24 * 60 * 60 * 1000),
      },
      {
        type: "folder",
        id: "f-research",
        name: "Research",
        children: [
          {
            type: "document",
            id: "d-survey",
            title: "User survey results",
            status: "draft",
            updatedAt: iso(3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ],
  },
  {
    type: "folder",
    id: "f-arch",
    name: "Architecture",
    children: [
      {
        type: "document",
        id: "d-api",
        title: "API Design",
        status: "submitted",
        updatedAt: iso(60 * 60 * 1000),
      },
      {
        type: "document",
        id: "d-adr",
        title: "ADR-003 Prisma",
        status: "approved",
        updatedAt: iso(2 * 24 * 60 * 60 * 1000),
      },
    ],
  },
  {
    type: "folder",
    id: "f-meetings",
    name: "Meetings",
    children: [
      {
        type: "document",
        id: "d-retro",
        title: "Sprint Retro Week 12",
        status: "draft",
        updatedAt: iso(3 * 60 * 60 * 1000),
      },
    ],
  },
  {
    type: "folder",
    id: "f-empty",
    name: "Onboarding",
    children: [],
  },
  {
    type: "document",
    id: "d-readme",
    title: "README",
    status: "approved",
    updatedAt: iso(7 * 24 * 60 * 60 * 1000),
  },
];
