/**
 * Mock data re-exports.
 *
 * The canonical mock data still lives in src/lib/mock-*.ts so existing UI
 * code does not break. New code should prefer importing through the
 * adapters in src/api/adapters/ rather than reaching into mocks directly.
 *
 * This barrel exists to make the API seam discoverable: when a real
 * backend lands, files here are deleted and adapter implementations are
 * swapped to call src/api/client.
 *
 * Note: keep this barrel limited to actual mock implementations.
 * Adapter entry points belong under `src/api/adapters`.
 */
export * as user from "@/lib/mock-user";
export * as tasks from "@/features/tasks/mocks/tasks";
export * as documents from "@/features/documents/mocks/document-tree";
