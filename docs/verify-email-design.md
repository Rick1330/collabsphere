# Verify Email Flow Design

This document covers the backend and frontend architecture for the `/verify-email` endpoint.

## Architecture & Requirements
- **Raw `node:http` API**: The backend leverages a vanilla HTTP router pattern without any NestJS or Express dependencies.
- **Strict Error Mapping**: Prisma `P2025` errors map to `400 Bad Request` with `TOKEN_INVALID`.
- **Soft-Delete Guard**: Tokens linked to users with `deletedAt !== null` are treated as non-existent to avoid accidentally verifying soft-deleted accounts.
- **Frontend State Sync**: The `VerifyEmailHandler` leverages the React Router `key={token}` trick to force remounts on token change, bypassing SPA navigation bugs where state remains stale.

## Security Controls

### Rate Limiting (S2)
A dedicated `VerifyEmailRateLimiter` restricts verification attempts to 10 requests per 5 minutes per IP address. This mitigates brute-force token enumeration via the `/verify-email` endpoint. Attempting more requests will return a `429 Too Many Requests` status.

### Shutdown Flow & Connection Draining (S3)
A global `isShuttingDown` guard on the API server ensures that incoming requests are rejected with `503 Service Unavailable` if the node process receives a `SIGTERM` or `SIGINT`. This allows in-flight Prisma operations—like `updateMany` for token consumption—to drain without throwing `Client is closed` errors or producing race conditions.

### Soft-Delete Validation
The repository checks the `user.deletedAt` timestamp when retrieving tokens to ensure soft-deleted users cannot finalize verification.

## Testing Strategy

### Dead-Letter Fallback Coverage (T4)
In the event that the primary event-bus fails to emit the `user.email_verified` event, a `appendDeadLetter` fallback is triggered. Unit tests assert that if the standard event emitter throws, the fallback is successfully called with the correct event name (`user.email_verified`) and user data.

### Component Re-render & StrictMode
React Testing Library assertions cover token changes and React StrictMode double-invocation to ensure `useMutation` is stable across simulated unmounts and remounts via a bounded `mutationKey`.
