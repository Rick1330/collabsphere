# auth/testing

## Domain
Auth testing requirements (unit/integration/e2e).

## Canonical Sources
- `docs/spec/05-features/` — §5.1 testing requirements
- `docs/spec/15-testing/` — testing strategy and required suites

## Included Topics
- Required unit tests
- Required integration tests
- Required E2E coverage for critical flows

## Unit tests (required)
- Password policy validation
- Hashing + compare
- Refresh token hashing + lookup
- Refresh token rotation logic

## Integration tests (required)
- Register creates user + verification token
- Verify email updates user + marks token used
- Login fails if not verified
- Refresh rotates tokens and invalidates old
- Logout revokes token
- Reset password invalidates all refresh tokens

## E2E (Playwright)
- FL-001 register → verify (mock email) → login → dashboard
- Forgot/reset password flow
- OAuth flow (mock in CI)

## Security regression tests
- Rate limiting smoke tests on auth endpoints
- Deactivated user cannot login/refresh
- No user enumeration on forgot-password/resend-verification
