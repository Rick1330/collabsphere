# Rate Limits (agent-ref)

## Purpose
Provide an execution-focused reference for rate limiting and abuse-prevention rules, including required headers, default limits, and endpoint-specific constraints.

## Canonical Sources
- `docs/spec/11-security/11.6-rate-limits-abuse-prevention.md`
- `docs/spec/09-api-standards/09.9-rate-limits.md`
- `docs/domains/auth/security.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/search/feature-spec.md`

## Domain Sources
- `docs/domains/auth/security.md`
- `docs/domains/workspaces/feature-spec.md`
- `docs/domains/search/feature-spec.md`

## Scope
- Global rate limiting standards
- Auth endpoint limits
- Write/read baseline limits
- Invitation abuse prevention
- Search abuse controls
- Response requirements for throttling

## Required Rules / Contract

### Response requirements (MUST)
- Return `429 RATE_LIMITED`.
- Include `Retry-After: <seconds>` header.
- Error envelope must include `error.code` + `requestId`.

### Baseline limits (minimum)
- Read endpoints: **120/min/user**.
- Write endpoints: **30/min/user**.
- Auth endpoints: **stricter** (see Auth limits below).

### Auth endpoint limits (canonical minimums)
- Register: **5/hour per IP** + **5/hour per email**.
- Login: **10/min per IP**.
- Forgot password: **5/hour per email** + **20/hour per IP**.
- Verify/reset token endpoints: **30/min per IP**.
- Refresh: **60/min per user**.

### Invitation abuse prevention
- Max invites/day per workspace (configurable).
- Rate limit invite creation per user.

### Search abuse prevention
- Rate limit search endpoint (example: **60/min**).
- Enforce query length limits (see validation rules).

## Edge Cases / Failure Modes
- Rate limits must not reveal account existence (auth-related flows remain non-enumerating).
- Throttle bursts without leaking sensitive details in error messages.
- Throttling must be enforced consistently across REST and realtime-adjacent endpoints that create resources.

## Validation or Testing Notes
- Verify `Retry-After` header is present on all 429s.
- Ensure different buckets for IP-based vs user-based limits (auth flows).
- Confirm invite creation and search endpoints are rate-limited as configured.
- Test that rate-limited responses do not leak account existence or workspace membership.

## Related Files / Domains
- `docs/agent-ref/rules/error-codes.md`
- `docs/agent-ref/rules/security-rules.md`
- `docs/agent-ref/rules/validation-rules.md`
- `docs/agent-ref/api/auth-endpoints.md`
- `docs/agent-ref/api/workspace-endpoints.md`
- `docs/agent-ref/api/search-endpoints.md`


