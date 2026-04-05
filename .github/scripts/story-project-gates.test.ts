import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

type Issue = {
  state?: string;
  labels: Array<{ name: string }>;
};

type ValidationGate = {
  allTerminal: boolean;
  validationDone: boolean;
  validationStatus: string;
};

type ParentGate = ValidationGate & {
  parentStatus: string | null;
  parentState: string | null;
};

type Scenario<TExpected> = {
  name: string;
  children: Issue[];
  validation: Issue;
  parent?: Issue;
  expected: TExpected;
};

const require = createRequire(import.meta.url);
const {
  evaluateParentGate,
  evaluateValidationGate,
  statusLabel,
  terminal,
} = require("./story-project-gates.js") as {
  evaluateParentGate: (children: Issue[], validation: Issue, parent: Issue) => ParentGate;
  evaluateValidationGate: (children: Issue[], validation: Issue) => ValidationGate;
  statusLabel: (issue: Issue) => string | null;
  terminal: (issue: Issue) => boolean;
};

function issue(status: string | string[], extras: Partial<Issue> = {}): Issue {
  const statuses = Array.isArray(status) ? status : [status];
  return {
    state: "open",
    labels: statuses.map((value) => ({ name: value })),
    ...extras,
  };
}

const validationScenarios: Array<Scenario<ValidationGate>> = [
  {
    name: "becomes ready when all implementation children are terminal",
    children: [issue("status:done"), issue("status:cancelled")],
    validation: issue("status:blocked"),
    expected: {
      allTerminal: true,
      validationDone: false,
      validationStatus: "status:ready",
    },
  },
  {
    name: "stays blocked when no implementation children exist",
    children: [],
    validation: issue("status:blocked"),
    expected: {
      allTerminal: false,
      validationDone: false,
      validationStatus: "status:blocked",
    },
  },
  {
    name: "becomes done when all children are terminal and validation is done",
    children: [issue("status:done"), issue("status:cancelled")],
    validation: issue("status:done"),
    expected: {
      allTerminal: true,
      validationDone: true,
      validationStatus: "status:done",
    },
  },
  {
    name: "stays blocked when any implementation child is not terminal",
    children: [issue("status:done"), issue("status:ready")],
    validation: issue("status:blocked"),
    expected: {
      allTerminal: false,
      validationDone: false,
      validationStatus: "status:blocked",
    },
  },
];

const parentScenarios: Array<Scenario<ParentGate>> = [
  {
    name: "validated parent remains done and closed when cancelled children exist",
    children: [issue("status:done"), issue("status:cancelled")],
    validation: issue("status:done"),
    parent: issue("status:done", { state: "closed" }),
    expected: {
      allTerminal: true,
      validationDone: true,
      validationStatus: "status:done",
      parentStatus: "status:done",
      parentState: "closed",
    },
  },
  {
    name: "cancelled parent remains unchanged when gate would otherwise close it",
    children: [issue("status:done"), issue("status:cancelled")],
    validation: issue("status:done"),
    parent: issue("status:cancelled", { state: "closed" }),
    expected: {
      allTerminal: true,
      validationDone: true,
      validationStatus: "status:done",
      parentStatus: null,
      parentState: null,
    },
  },
  {
    name: "cancelled parent remains unchanged when gate would otherwise reopen it",
    children: [issue("status:done"), issue("status:blocked")],
    validation: issue("status:blocked"),
    parent: issue("status:cancelled", { state: "closed" }),
    expected: {
      allTerminal: false,
      validationDone: false,
      validationStatus: "status:blocked",
      parentStatus: null,
      parentState: null,
    },
  },
  {
    name: "closed parent reopens when terminal-state or validation requirements are not met",
    children: [issue("status:done"), issue("status:blocked")],
    validation: issue("status:blocked"),
    parent: issue("status:done", { state: "closed" }),
    expected: {
      allTerminal: false,
      validationDone: false,
      validationStatus: "status:blocked",
      parentStatus: "status:blocked",
      parentState: "open",
    },
  },
  {
    name: "done-labelled open parent reopens when terminal-state or validation requirements are not met",
    children: [issue("status:done"), issue("status:blocked")],
    validation: issue("status:blocked"),
    parent: issue("status:done", { state: "open" }),
    expected: {
      allTerminal: false,
      validationDone: false,
      validationStatus: "status:blocked",
      parentStatus: "status:blocked",
      parentState: "open",
    },
  },
  {
    name: "open parent with unmet gate requirements receives no mutation",
    children: [issue("status:done"), issue("status:ready")],
    validation: issue("status:blocked"),
    parent: issue("status:in_progress", { state: "open" }),
    expected: {
      allTerminal: false,
      validationDone: false,
      validationStatus: "status:blocked",
      parentStatus: null,
      parentState: null,
    },
  },
];

async function runScenarioSubtests<TExpected>(
  t: test.TestContext,
  scenarios: Array<Scenario<TExpected>>,
  evaluate: (scenario: Scenario<TExpected>) => TExpected,
): Promise<void> {
  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      assert.deepEqual(evaluate(scenario), scenario.expected);
    });
  }
}

test("terminal and status-label helpers classify statuses deterministically", () => {
  assert.equal(terminal(issue("status:done")), true);
  assert.equal(terminal(issue("status:cancelled")), true);
  assert.equal(terminal(issue("status:ready")), false);
  assert.equal(terminal(issue(["status:cancelled", "status:blocked"])), true);
  assert.equal(terminal(issue(["status:blocked", "status:done"])), true);
  assert.equal(statusLabel(issue(["status:done", "status:cancelled"])), null);
});

test("evaluateValidationGate covers terminal, blocked, and empty-child scenarios", async (t) => {
  await runScenarioSubtests(
    t,
    validationScenarios,
    (scenario) => evaluateValidationGate(scenario.children, scenario.validation),
  );
});

test("evaluateParentGate preserves cancelled parents and only mutates when required", async (t) => {
  await runScenarioSubtests(
    t,
    parentScenarios,
    (scenario) => evaluateParentGate(scenario.children, scenario.validation, scenario.parent!),
  );
});
