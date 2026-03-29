function labelNames(issue) {
  return (issue.labels || [])
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function statusLabels(issue) {
  return labelNames(issue)
    .filter((label) => label.startsWith("status:"))
    .sort((left, right) => left.localeCompare(right));
}

function statusLabel(issue) {
  const labels = statusLabels(issue);
  return labels.length === 1 ? labels[0] : null;
}

function hasStatus(issue, value) {
  return statusLabels(issue).includes(value);
}

function done(issue) {
  return hasStatus(issue, "status:done");
}

function cancelled(issue) {
  return hasStatus(issue, "status:cancelled");
}

function terminal(issue) {
  return done(issue) || cancelled(issue);
}

function evaluateValidationGate(children, validationIssue) {
  const allTerminal = children.length > 0 && children.every((issue) => terminal(issue));
  const validationDone = done(validationIssue);

  return {
    allTerminal,
    validationDone,
    validationStatus: allTerminal
      ? validationDone
        ? "status:done"
        : "status:ready"
      : "status:blocked",
  };
}

function evaluateParentMutation(parentIssue, gate) {
  if (cancelled(parentIssue)) {
    return {
      parentStatus: null,
      parentState: null,
    };
  }

  if (gate.allTerminal && gate.validationDone) {
    return {
      parentStatus: "status:done",
      parentState: "closed",
    };
  }

  if (parentIssue.state === "closed" || done(parentIssue)) {
    return {
      parentStatus: "status:blocked",
      parentState: "open",
    };
  }

  return {
    parentStatus: null,
    parentState: null,
  };
}

function evaluateParentGate(children, validationIssue, parentIssue) {
  const gate = evaluateValidationGate(children, validationIssue);

  return {
    ...gate,
    ...evaluateParentMutation(parentIssue, gate),
  };
}

module.exports = {
  cancelled,
  done,
  hasStatus,
  evaluateParentGate,
  evaluateParentMutation,
  evaluateValidationGate,
  labelNames,
  statusLabels,
  statusLabel,
  terminal,
};
