function labelNames(issue) {
  return (issue.labels || [])
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function hasLabel(labels, value) {
  return labels.includes(value);
}

function statusLabel(issue) {
  return labelNames(issue).find((label) => label.startsWith("status:")) || null;
}

function done(issue) {
  return statusLabel(issue) === "status:done";
}

function cancelled(issue) {
  return statusLabel(issue) === "status:cancelled";
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
  const shouldClose = gate.allTerminal && gate.validationDone;
  const shouldReopen =
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
  evaluateParentGate,
  evaluateValidationGate,
  labelNames,
  statusLabel,
  terminal,
};
