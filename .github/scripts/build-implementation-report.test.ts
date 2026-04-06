import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { escapeHtml, formatDate, splitMessage } = require("./build-implementation-report.js") as {
  escapeHtml: (text: unknown) => string;
  formatDate: (dateStr: string) => string;
  splitMessage: (message: string, maxLength?: number) => string[];
};

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

test("escapeHtml: escapes ampersand", () => {
  assert.equal(escapeHtml("foo & bar"), "foo &amp; bar");
});

test("escapeHtml: escapes less-than", () => {
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
});

test("escapeHtml: escapes greater-than", () => {
  assert.equal(escapeHtml("a > b"), "a &gt; b");
});

test("escapeHtml: escapes double quotes", () => {
  assert.equal(escapeHtml('"hello"'), "&quot;hello&quot;");
});

test("escapeHtml: escapes all four entities in one string", () => {
  assert.equal(escapeHtml('<a href="x">&</a>'), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
});

test("escapeHtml: returns empty string unchanged", () => {
  assert.equal(escapeHtml(""), "");
});

test("escapeHtml: coerces non-string values to string", () => {
  assert.equal(escapeHtml(42), "42");
  assert.equal(escapeHtml(null), "null");
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

test("formatDate: returns YYYY-MM-DD from ISO timestamp", () => {
  assert.equal(formatDate("2024-06-15T12:34:56Z"), "2024-06-15");
});

test("formatDate: handles date-only strings", () => {
  assert.equal(formatDate("2025-01-01"), "2025-01-01");
});

test("formatDate: returns UTC date even when local time would differ", () => {
  // 2024-03-10T00:30:00Z should remain 2024-03-10 in UTC.
  assert.equal(formatDate("2024-03-10T00:30:00Z"), "2024-03-10");
});

// ---------------------------------------------------------------------------
// splitMessage
// ---------------------------------------------------------------------------

test("splitMessage: returns single-element array when message fits", () => {
  const msg = "Hello, world!";
  assert.deepEqual(splitMessage(msg, 100), [msg]);
});

test("splitMessage: returns single-element array when message equals maxLength", () => {
  const msg = "a".repeat(4096);
  const chunks = splitMessage(msg);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], msg);
});

test("splitMessage: splits on newline boundary when message exceeds maxLength", () => {
  const line1 = "a".repeat(50);
  const line2 = "b".repeat(50);
  const msg = `${line1}\n${line2}`;
  // maxLength=60 is enough for one line but not both
  const chunks = splitMessage(msg, 60);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0], line1);
  assert.equal(chunks[1], line2);
});

test("splitMessage: hard-splits a single line longer than maxLength", () => {
  const msg = "x".repeat(10);
  const chunks = splitMessage(msg, 4);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0], "xxxx");
  assert.equal(chunks[1], "xxxx");
  assert.equal(chunks[2], "xx");
});

test("splitMessage: handles empty string", () => {
  // An empty message is shorter than maxLength, so it is returned as one chunk.
  assert.deepEqual(splitMessage(""), [""]);
});

test("splitMessage: uses default maxLength of 4096", () => {
  const msg = "x".repeat(4097);
  const chunks = splitMessage(msg);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].length, 4096);
  assert.equal(chunks[1].length, 1);
});

test("splitMessage: preserves newlines within a chunk", () => {
  const line1 = "line one";
  const line2 = "line two";
  const line3 = "line three";
  const msg = `${line1}\n${line2}\n${line3}`;
  // All lines fit in maxLength=100 together.
  const chunks = splitMessage(msg, 100);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], msg);
});
