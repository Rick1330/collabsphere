# docs/agent-ref — Agent Execution Reference Layer

## Purpose
Execution-focused reference pack optimized for AI agents, task kernels, ExecPlans, and human implementers who need exact, fast, retrievable rules. This layer is **derived from** `docs/domains/` and may consult `docs/spec/` for precision, while remaining compact and execution-oriented.

## Canonical Sources
- **Authoritative**: `docs/spec/` (do not edit)
- **Engineering intermediate**: `docs/domains/` (audited and approved)
- This layer is derived from `docs/domains/` and must preserve exactness for permissions, invariants, error codes, event names/payloads, validation rules, testing obligations, state machines, and retention/lifecycle rules.

## Domain Sources
- `docs/domains/README.md`

## Scope
- Execution-focused rules, contracts, and schemas.
- Minimal narrative; exact structures and constraints.
- Traceability back to canonical sources for every file.

## Non-Goals
- Not a marketing or human-friendly narrative layer.
- Not a duplication of full canonical text.
- No skill packs, ExecPlans, or task kernels are generated here.

## Structure (Top-level)
- `api/` — REST endpoints, auth/role requirements, payloads, error codes, event emissions.
- `data/` — schemas, constraints, indexes, lifecycle/retention.
- `collab/` — Hocuspocus/Yjs rules, read-only enforcement, degraded modes.
- `rules/` — validation/business/security rules, error codes, isolation, rate limits, idempotency.
- `events/` — event catalogs, socket events, activity/notification rules.
- `ui/` — route map, page states, screen expectations, accessibility, responsive behavior.
- `ops/` — local dev, env vars, CI/CD, migrations, deployment, release readiness.

## Required File Structure (Per File)
Each file must include:
1. Title  
2. Purpose  
3. Canonical Sources  
4. Scope  
5. Required Rules / Contract  
6. Edge Cases / Failure Modes  
7. Validation or Testing Notes  
8. Related Files / Domains

## Retrieval Optimization Notes
- Keep files concise (typically 80–300 lines).
- Use stable filenames and consistent headings.
- Prefer exact enumerations and tables for rules/values.
- Avoid redundant prose; link across files for deep detail.

## Important Constraints
- Do not modify `docs/spec/`.
- Do not heavily modify `docs/domains/` unless correcting contradictions (log in audit).
- Preserve exactness for permissions, invariants, errors, events, validations, tests, and lifecycle rules.

## Primary Consumers
- Task kernels
- ExecPlans
- AGENTS.md references
- Execution packets for coding agents
- Human implementers needing fast, exact references

## Edge Cases / Failure Modes
- Do not treat this layer as authoritative; canonical truth remains in `docs/spec/`.
- Do not introduce behavior not present in `docs/spec/` or corrected in `docs/domains/`.
- If contradictions are discovered, log them in audit and do not silently “fix” here.

## Validation or Testing Notes
- Ensure every file in `docs/agent-ref/` includes the required standard sections.
- Ensure traceability to both `docs/domains/` and `docs/spec/` for each file.
- Verify no enumerations, error codes, or event names drift from canonical sources.

## Related Files / Domains
- `docs/domains/README.md`
- `docs/audit/domain-coverage-matrix.md`
- `docs/audit/domain-open-questions.md`

## Related Audit Artifacts
- `docs/audit/agent-ref-coverage-matrix.md`
- `docs/audit/agent-ref-generation-checklist.md`
- `docs/audit/agent-ref-open-questions.md`
