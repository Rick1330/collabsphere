const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluateParentGate,
  evaluateValidationGate,
  statusLabel,
  terminal,
} = require("./story-project-gates");

function issue(status, extras = {}) {
  const statuses = Array.isArray(status) ? status : [status];
  return {
    state: "open",
    labels: statuses.map((value) => ({ name: value })),
    ...extras,
  };
}

test("terminal treats done and cancelled as completed child states", () => {
  assert.equal(terminal(issue("status:done")), true);
  assert.equal(terminal(issue("status:cancelled")), true);
  assert.equal(terminal(issue("status:ready")), false);
});

test("validation becomes ready when all implementation children are terminal", () => {
  const result = evaluateValidationGate(
    [issue("status:done"), issue("status:cancelled")],
    issue("status:blocked"),
  );

  assert.deepEqual(result, {
    allTerminal: true,
    validationDone: false,
    validationStatus: "status:ready",
  });
});

test("validation stays blocked when no implementation children exist", () => {
  const result = evaluateValidationGate([], issue("status:blocked"));

  assert.deepEqual(result, {
    allTerminal: false,
    validationDone: false,
    validationStatus: "status:blocked",
  });
});

test("validation becomes done when all children are terminal and validation is done", () => {
  const result = evaluateValidationGate(
    [issue("status:done"), issue("status:cancelled")],
    issue("status:done"),
  );

  assert.deepEqual(result, {
    allTerminal: true,
    validationDone: true,
    validationStatus: "status:done",
  });
});

test("validation stays blocked when any implementation child is not terminal", () => {
  const result = evaluateValidationGate(
    [issue("status:done"), issue("status:ready")],
    issue("status:blocked"),
  );

  assert.deepEqual(result, {
    allTerminal: false,
    validationDone: false,
    validationStatus: "status:blocked",
  });
});

test("status detection is order-robust when multiple status labels exist", () => {
  assert.equal(terminal(issue(["status:cancelled", "status:blocked"])), true);
  assert.equal(terminal(issue(["status:blocked", "status:done"])), true);
  assert.equal(statusLabel(issue(["status:done", "status:cancelled"])), null);
});

test("validated parent remains done and closed when cancelled children exist", () => {
  const result = evaluateParentGate(
    [issue("status:done"), issue("status:cancelled")],
    issue("status:done"),
    issue("status:done", { state: "closed" }),
  );

  assert.deepEqual(result, {
    allTerminal: true,
    validationDone: true,
    validationStatus: "status:done",
    parentStatus: "status:done",
    parentState: "closed",
  });
});

test("cancelled parent remains unchanged when gate would otherwise close it", () => {
  const result = evaluateParentGate(
    [issue("status:done"), issue("status:cancelled")],
    issue("status:done"),
    issue("status:cancelled", { state: "closed" }),
  );

  assert.deepEqual(result, {
    allTerminal: true,
    validationDone: true,
    validationStatus: "status:done",
    parentStatus: null,
    parentState: null,
  });
});

test("cancelled parent remains unchanged when gate would otherwise reopen it", () => {
  const result = evaluateParentGate(
    [issue("status:done"), issue("status:blocked")],
    issue("status:blocked"),
    issue("status:cancelled", { state: "closed" }),
  );

  assert.deepEqual(result, {
    allTerminal: false,
    validationDone: false,
    validationStatus: "status:blocked",
    parentStatus: null,
    parentState: null,
  });
});

test("closed or done parent reopens only when terminal-state or validation requirements are not met", () => {
  const result = evaluateParentGate(
    [issue("status:done"), issue("status:blocked")],
    issue("status:blocked"),
    issue("status:done", { state: "closed" }),
  );

  assert.deepEqual(result, {
    allTerminal: false,
    validationDone: false,
    validationStatus: "status:blocked",
    parentStatus: "status:blocked",
    parentState: "open",
  });
});

test("open parent with unmet gate requirements receives no mutation", () => {
  const result = evaluateParentGate(
    [issue("status:done"), issue("status:ready")],
    issue("status:blocked"),
    issue("status:in_progress", { state: "open" }),
  );

  assert.deepEqual(result, {
    allTerminal: false,
    validationDone: false,
    validationStatus: "status:blocked",
    parentStatus: null,
    parentState: null,
  });
});
