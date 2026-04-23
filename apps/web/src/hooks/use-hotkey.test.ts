/**
 * Tests for the useHotkey hook.
 *
 * The shortcut layer is the spine of the keyboard model — these checks lock
 * down the contract that matters most: input-target guards, the meta/ctrl
 * cross-platform mapping, and 2-key sequences.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHotkey, __testables } from "@/hooks/use-hotkey";

const fireKey = (init: KeyboardEventInit & { key: string; target?: EventTarget }) => {
  const ev = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  if (init.target) {
    Object.defineProperty(ev, "target", { value: init.target });
  }
  window.dispatchEvent(ev);
  return ev;
};

describe("useHotkey — input target guards", () => {
  it("treats <input>, <textarea>, contenteditable as editable targets", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    const plain = document.createElement("section");

    expect(__testables.isEditableTarget(input)).toBe(true);
    expect(__testables.isEditableTarget(textarea)).toBe(true);
    // jsdom doesn't compute isContentEditable, but our matcher falls back
    // to the `[contenteditable="true"]` attribute via closest().
    expect(__testables.isEditableTarget(div)).toBe(true);
    expect(__testables.isEditableTarget(plain)).toBe(false);
  });
});

describe("useHotkey — single chord", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("fires on mod+k (ctrl on non-mac jsdom)", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler));

    fireKey({ key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire when typing inside an input", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler));

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireKey({ key: "k", ctrlKey: true, target: input });
    expect(handler).not.toHaveBeenCalled();
  });

  it("respects allowInInput=true", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler, { allowInInput: true }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireKey({ key: "k", ctrlKey: true, target: input });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler, { disabled: true }));
    fireKey({ key: "k", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("useHotkey — sequences", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("fires on a 2-key sequence g d", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("g d", handler));
    fireKey({ key: "g" });
    fireKey({ key: "d" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire on partial sequence", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("g d", handler));
    fireKey({ key: "g" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("resets buffer on a wrong key", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("g d", handler));
    fireKey({ key: "g" });
    fireKey({ key: "x" });
    fireKey({ key: "d" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores sequences when modifier keys are held", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("g d", handler));
    fireKey({ key: "g", ctrlKey: true });
    fireKey({ key: "d" });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("useHotkey — modal / palette guards", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("does not fire when a Radix dialog is open", () => {
    const handler = vi.fn();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    renderHook(() => useHotkey("g d", handler));
    fireKey({ key: "g" });
    fireKey({ key: "d" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire when the cmdk palette is mounted", () => {
    const handler = vi.fn();
    const palette = document.createElement("div");
    palette.setAttribute("cmdk-root", "");
    document.body.appendChild(palette);

    renderHook(() => useHotkey("a", handler));
    fireKey({ key: "a" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("respects allowWhenModalOpen=true (palette toggle case)", () => {
    const handler = vi.fn();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.dataset.state = "open";
    document.body.appendChild(dialog);

    renderHook(() => useHotkey("mod+k", handler, { allowWhenModalOpen: true }));
    fireKey({ key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores typing inside contenteditable (TipTap-style wrapper)", () => {
    const handler = vi.fn();
    const wrapper = document.createElement("div");
    wrapper.setAttribute("contenteditable", "true");
    const inner = document.createElement("p");
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);

    renderHook(() => useHotkey("/", handler));
    // Target the inner element — closest('[contenteditable="true"]') guards.
    fireKey({ key: "/", target: inner });
    expect(handler).not.toHaveBeenCalled();
  });

  it("isModalOpen returns false when nothing is open", () => {
    expect(__testables.isModalOpen()).toBe(false);
  });
});
