import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDocumentTreeState } from "./use-document-tree-state";
import type { TreeNode } from "@/features/documents/components/document-tree";

// Minimal tree:
//   root (folder)
//     ├── notes (folder)
//     │     └── doc-1 (document)
//     └── doc-2 (document)
const doc = (id: string, title: string): TreeNode => ({
  type: "document",
  id,
  title,
  status: "draft",
  updatedAt: new Date().toISOString(),
});

const tree: TreeNode[] = [
  {
    type: "folder",
    id: "root",
    name: "Root",
    children: [
      {
        type: "folder",
        id: "notes",
        name: "Notes",
        children: [doc("doc-1", "Doc 1")],
      },
      doc("doc-2", "Doc 2"),
    ],
  },
];

describe("useDocumentTreeState", () => {
  it("initializes with all folders expanded", () => {
    const { result } = renderHook(() =>
      useDocumentTreeState({ tree, activeDocumentId: null }),
    );
    expect(result.current.expanded.has("root")).toBe(true);
    expect(result.current.expanded.has("notes")).toBe(true);
  });

  it("toggle flips a single folder without disturbing siblings", () => {
    const { result } = renderHook(() =>
      useDocumentTreeState({ tree, activeDocumentId: null }),
    );
    act(() => result.current.toggle("notes"));
    expect(result.current.expanded.has("notes")).toBe(false);
    expect(result.current.expanded.has("root")).toBe(true);

    act(() => result.current.toggle("notes"));
    expect(result.current.expanded.has("notes")).toBe(true);
  });

  it("collapseAll then expandAll restores every folder", () => {
    const { result } = renderHook(() =>
      useDocumentTreeState({ tree, activeDocumentId: null }),
    );
    act(() => result.current.collapseAll());
    expect(result.current.expanded.size).toBe(0);
    act(() => result.current.expandAll());
    expect(result.current.expanded.has("root")).toBe(true);
    expect(result.current.expanded.has("notes")).toBe(true);
  });

  it("re-expands ancestor folders when activeDocumentId changes", () => {
    const { result, rerender } = renderHook(
      ({ activeDocumentId }: { activeDocumentId: string | null }) =>
        useDocumentTreeState({ tree, activeDocumentId }),
      { initialProps: { activeDocumentId: null as string | null } },
    );
    // Manually collapse the chain.
    act(() => result.current.collapseAll());
    expect(result.current.expanded.size).toBe(0);

    // Activating a deeply-nested doc must reopen the path.
    rerender({ activeDocumentId: "doc-1" });
    expect(result.current.expanded.has("root")).toBe(true);
    expect(result.current.expanded.has("notes")).toBe(true);
  });

  it("findFolderById returns the folder node or null", () => {
    const { result } = renderHook(() =>
      useDocumentTreeState({ tree, activeDocumentId: null }),
    );
    expect(result.current.findFolderById("notes")?.id).toBe("notes");
    expect(result.current.findFolderById("does-not-exist")).toBeNull();
    // Documents are not folders -> not returned by findFolderById.
    expect(result.current.findFolderById("doc-2")).toBeNull();
  });
});
