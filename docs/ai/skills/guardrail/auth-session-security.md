# Auth & Session Security Guardrail

## Purpose
Enforce authentication, session, and OAuth security constraints.

## When to Use
- Auth endpoints, session handling, token changes, or OAuth flows.

## Required Inputs / Context
- Auth flow or endpoint being modified.
- Relevant security rules and error codes.

## Read First
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/api/auth-endpoints.md`
- `AGENTS.md`

## Workflow
1. Confirm token handling (hash storage, refresh rotation, httpOnly cookies).
2. Enforce non-enumeration for auth flows (forgot/reset/resend).
3. Validate OAuth flow: state, redirect allowlist, minimal scopes.
4. Enforce account deactivation rules (refresh must fail).
5. Align errors with canonical codes and envelopes.

## Dangerous Mistakes
- Returning raw auth errors or enumerating accounts.
- Storing tokens in plaintext.
- Skipping refresh token rotation.

## Validation Expectations
- Add tests for invalid/expired tokens and deactivated accounts.
- Verify non-enumerating responses.
- Verify rate-limit denial paths (429 + Retry-After).
- Verify refresh token reuse/rotation failures where applicable.

## Escalation Conditions
- Any changes to auth flows without clear spec coverage.

## Related Skills / References
- `guardrail/workspace-isolation.md`
- `implementation/integration-test-writer.md`
