# REVIEW.md

## Purpose
Tier B frontend review defaults for `apps/web`. These guide review depth and quality expectations, but a reviewer may allow a deviation when the author documents a concrete rationale.

## Review Defaults

### Scope And Lane Clarity
- The PR should make it obvious whether the baton is primarily UI composition, API integration, or validation.
- Scope should stay narrow; unrelated cleanup should be rejected unless it removes a blocker inside the touched surface.
- Stale issue-body paths should be reconciled up front instead of mirrored into new code.

### Component And File Shape
- Prefer feature-scoped files and extracted helpers when a single component becomes difficult to review.
- Avoid growing one-off foundation components into catch-all surfaces.
- Reuse shared state components and primitive layers before adding new ad hoc patterns.

### Design And Visual Quality
- Review for hierarchy, spacing rhythm, and state clarity, not just correctness.
- When the baton includes meaningful UI work, evaluate the result against the design review rubric below and flag observable issues such as weak information hierarchy, inconsistent typographic scale, uneven spacing and composition, unclear state affordances, or poor product fit.
- Art direction preferences are strong defaults, not hard merge blockers by themselves:
  - avoid purple or violet as the primary product accent unless explicitly requested
  - avoid decorative gradient-heavy chrome for core product surfaces
  - prefer the approved teal + warm stone direction and semantic color discipline

### Responsive And Accessibility Expectations
- Review at mobile and desktop breakpoints when layout or interaction changes.
- Check touch-target sizing, overflow behavior, and focus order.
- Verify reduced-motion handling when new motion is added.

### Testing Expectations
- Interactive components should have behavior-based coverage.
- Prefer role-based queries and user interactions over implementation-detail assertions.
- `renderToStaticMarkup` is not sufficient evidence for interactive shell behavior once the surface is migrated to the web Vitest contract.
- If a gap is consciously left open, the PR should state the gap and the risk.

### Review Automation
- Local CodeRabbit CLI should run before final push on materially changed branches.
- Scanner or review-tool feedback is advisory until confirmed as a real current-head defect.
- Late-arriving comments should be evaluated against current `main`, not blindly accepted.

### PR And Handoff Quality
- PR body must use the template, include correct issue linkage, and show concise validation evidence.
- Handoff and closure comments must be valid markdown and factually current.
- Merge-readiness should be asserted only from live checks and unresolved current-head threads.

## Design Review Rubric
- Visual distinctiveness
- Information hierarchy
- Typography quality
- Spacing and composition
- Responsive integrity
- Accessibility quality
- State quality
- Interaction polish
- Implementation cleanliness
- Product fit

## References
- `apps/web/AGENTS.md`
- `docs/agent-ref/ui/accessibility.md`
- `docs/agent-ref/ui/component-patterns.md`
- `docs/agent-ref/ui/page-states.md`
- `docs/agent-ref/ui/responsive-rules.md`
- `docs/agent-ref/ops/pr-review-workflow.md`
