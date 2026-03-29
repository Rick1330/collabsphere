function labelNames(issue) {
  return (issue.labels || [])
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function hasLabel(labels, value) {
  return labels.includes(value);
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

function evaluateParentGate(children, validationIssue, parentIssue) {
  const gate = evaluateValidationGate(children, validationIssue);
  const parentLabels = labelNames(parentIssue);
  const parentCancelled = cancelled(parentIssue);
  const shouldClose = !parentCancelled && gate.allTerminal && gate.validationDone;
  const shouldReopen =
    !parentCancelled &&
    !shouldClose &&
    (parentIssue.state === "closed" || hasLabel(parentLabels, "status:done"));

  return {
    ...gate,
    parentStatus: shouldClose ? "status:done" : shouldReopen ? "status:blocked" : null,
    parentState: shouldClose ? "closed" : shouldReopen ? "open" : null,
  };
}

module.exports = {
  cancelled,
  done,
  hasStatus,
  evaluateParentGate,
  evaluateValidationGate,
  labelNames,
  statusLabels,
  statusLabel,
  terminal,
};
