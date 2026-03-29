const test = require("node:test");
const assert = require("node:assert/strict");

const {
  evaluateParentGate,
  evaluateValidationGate,
  terminal,
} = require("./story-project-gates");

function issue(status, extras = {}) {
  return {
    state: "open",
    labels: [{ name: status }],
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
