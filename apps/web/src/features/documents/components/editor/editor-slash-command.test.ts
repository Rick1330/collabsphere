/**
 * Tests for the editor slash command menu helpers.
 *
 * The full menu is anchored against a live TipTap editor, which is
 * impractical to instantiate inside jsdom. Instead, the trigger detection
 * and filtering rules are extracted as pure helpers (`__slashTestables`),
 * and these tests lock down the contract that powers the live menu:
 *
 *  - the menu only opens at start-of-line or after whitespace
 *  - it filters by label and keyword as the user types after the slash
 *  - dismissal (Escape) is handled by the editor key handler — the trigger
 *    detection itself never preventDefault's the `/` keystroke, so the
 *    character is always inserted normally.
 */
import { describe, it, expect } from "vitest";
import { __slashTestables } from "./editor-slash-command";

const { detectTrigger, filterItems, ITEMS } = __slashTestables;

describe("EditorSlashCommand — trigger detection", () => {
  it("opens at start of line", () => {
    const result = detectTrigger("/");
    expect(result).not.toBeNull();
    expect(result?.query).toBe("");
    expect(result?.triggerOffset).toBe(0);
  });

  it("opens after whitespace mid-line", () => {
    const result = detectTrigger("hello /");
    expect(result).not.toBeNull();
    expect(result?.query).toBe("");
    expect(result?.triggerOffset).toBe("hello ".length);
  });

  it("does not open when the slash is mid-word (e.g. URL)", () => {
    expect(detectTrigger("https://example.com/path")).toBeNull();
    expect(detectTrigger("foo/bar")).toBeNull();
  });

  it("does not open when there is whitespace after the slash", () => {
    // The user has moved on — the slash is no longer the trigger fragment.
    expect(detectTrigger("/ ")).toBeNull();
    expect(detectTrigger("/h ello")).toBeNull();
  });

  it("captures the typed query after the slash", () => {
    expect(detectTrigger("/he")?.query).toBe("he");
    expect(detectTrigger("paragraph /quo")?.query).toBe("quo");
  });
});

describe("EditorSlashCommand — filtering", () => {
  it("returns the full menu when the query is empty", () => {
    expect(filterItems("")).toHaveLength(ITEMS.length);
  });

  it("filters by exact label substring", () => {
    const results = filterItems("paragraph");
    expect(results.map((r) => r.id)).toContain("p");
  });

  it("filters by keyword (e.g. h1 → Heading 1)", () => {
    const results = filterItems("h1");
    expect(results.map((r) => r.id)).toEqual(expect.arrayContaining(["h1"]));
  });

  it("returns an empty list for nonsense queries", () => {
    expect(filterItems("zzzqqqyyy")).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    expect(filterItems("QUOTE").map((r) => r.id)).toContain("quote");
  });
});
