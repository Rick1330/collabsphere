# React Form Implementation

## Purpose
Implement forms with validation aligned to canonical rules and safe UX behavior.

## When to Use
- Building or modifying forms that submit to API endpoints.

## Required Inputs / Context
- Validation rules and error codes for the target domain.

## Read First
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `apps/web/AGENTS.md`

## Workflow
1. Map fields to canonical validation rules.
2. Implement inline validation and server error handling.
3. Respect auth/session handling and error states.
4. Ensure optimistic UX only where safe.

## Dangerous Mistakes
- Custom validation that diverges from canonical rules.
- Swallowing server errors or error codes.

## Validation Expectations
- Verify validation behavior (client + server errors).
- Test form submission failure paths.

## Escalation Conditions
- Validation ambiguity or missing rules in agent-ref.

## Related Skills / References
- `implementation/react-component.md`
- `implementation/web-page.md`
