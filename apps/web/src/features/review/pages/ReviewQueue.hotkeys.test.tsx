/**
 * Targeted hotkey tests for the review queue.
 *
 * The queue dispatches a documentId-scoped `cs:review:start-decision`
 * CustomEvent when the reviewer presses `a` (approve) or `r` (request
 * changes) on the focused row. Each rendered `PendingRow` listens for the
 * event and, only if the documentId matches AND the row isn't already
 * in note-entry mode, opens its inline decision dialog.
 *
 * These tests cover the contract directly with a small headless harness
 * — instantiating the full ReviewQueue page would require seeding a
 * mocked react-query cache and the full sidebar/topnav chrome, which
 * adds noise without testing the behavior we care about.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEffect, useState } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { useHotkey } from "@/hooks/use-hotkey";

type Decision = "approved" | "changes_requested";

interface HarnessProps {
  documentIds: string[];
  initialFocus?: number;
  /** Simulates a row that is already in note-entry mode. */
  busyRowId?: string;
  onOpenDialog?: (id: string, decision: Decision) => void;
}

/**
 * Minimal harness mirroring the ReviewQueue's keyboard contract:
 *  - a/r dispatch a documentId-scoped event for the focused row.
 *  - rows ignore the event when already deciding.
 */
const Harness = ({ documentIds, initialFocus = 0, busyRowId, onOpenDialog }: HarnessProps) => {
  const [focusedIdx] = useState(initialFocus);

  const dispatchDecision = (decision: Decision) => {
    if (documentIds.length === 0) return;
    const docId = documentIds[focusedIdx];
    if (!docId) return;
    globalThis.dispatchEvent(
      new CustomEvent("cs:review:start-decision", {
        detail: { documentId: docId, decision },
      }),
    );
  };

  useHotkey("a", () => dispatchDecision("approved"));
  useHotkey("r", () => dispatchDecision("changes_requested"));

  return (
    <ul>
      {documentIds.map((id) => (
        <Row key={id} id={id} busy={busyRowId === id} onOpen={onOpenDialog} />
      ))}
    </ul>
  );
};

const Row = ({
  id,
  busy,
  onOpen,
}: {
  id: string;
  busy: boolean;
  onOpen?: (id: string, decision: Decision) => void;
}) => {
  const [open, setOpen] = useState(busy);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ documentId: string; decision: Decision }>).detail;
      if (!detail || detail.documentId !== id) return;
      // Mirror PendingRow's guard: ignore when already in note-entry mode.
      if (open) return;
      setOpen(true);
      onOpen?.(id, detail.decision);
    };
    globalThis.addEventListener("cs:review:start-decision", handler);
    return () => globalThis.removeEventListener("cs:review:start-decision", handler);
  }, [id, open, onOpen]);
  return (
    <li data-testid={`row-${id}`} data-state={open ? "open" : "closed"}>
      {id}
    </li>
  );
};

const fireKey = (key: string) => {
  fireEvent.keyDown(globalThis as unknown as Window, { key, bubbles: true, cancelable: true });
};

async function expectDecisionHotkey(params: {
  key: string;
  initialFocus: number;
  expectedId: string;
  expectedDecision: Decision;
  closedId: string;
}) {
  const onOpen = vi.fn();
  render(
    <Harness
      documentIds={["doc-1", "doc-2"]}
      initialFocus={params.initialFocus}
      onOpenDialog={onOpen}
    />,
  );

  await act(async () => {
    fireKey(params.key);
  });

  expect(onOpen).toHaveBeenCalledWith(params.expectedId, params.expectedDecision);
  expect(screen.getByTestId(`row-${params.expectedId}`)).toHaveAttribute("data-state", "open");
  expect(screen.getByTestId(`row-${params.closedId}`)).toHaveAttribute("data-state", "closed");
}

describe("ReviewQueue — a / r hotkeys", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("`a` opens approve flow on the focused row", async () => {
    await expectDecisionHotkey({
      key: "a",
      initialFocus: 0,
      expectedId: "doc-1",
      expectedDecision: "approved",
      closedId: "doc-2",
    });
  });

  it("`r` opens request-changes flow on the focused row only", async () => {
    await expectDecisionHotkey({
      key: "r",
      initialFocus: 1,
      expectedId: "doc-2",
      expectedDecision: "changes_requested",
      closedId: "doc-1",
    });
  });

  it("does not re-trigger when the focused row is already in note-entry mode", async () => {
    const onOpen = vi.fn();
    render(
      <Harness
        documentIds={["doc-1"]}
        initialFocus={0}
        busyRowId="doc-1"
        onOpenDialog={onOpen}
      />,
    );

    await act(async () => {
      fireKey("a");
      fireKey("r");
    });

    // Row was already open ⇒ guarded handler skips the callback entirely.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not fire while a Radix dialog is open (modal guard)", async () => {
    const onOpen = vi.fn();
    render(<Harness documentIds={["doc-1"]} initialFocus={0} onOpenDialog={onOpen} />);

    // Simulate a foreground dialog (matches the `useHotkey` modal sniff).
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    await act(async () => {
      fireKey("a");
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });
});
