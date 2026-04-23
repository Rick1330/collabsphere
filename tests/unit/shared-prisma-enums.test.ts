import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTH_PROVIDERS,
  COMMENT_TARGET_TYPES,
  COMMENT_THREAD_STATUSES,
  DOCUMENT_STATUSES,
  FILE_STATUSES,
  GLOBAL_ROLES,
  INVITATION_STATUSES,
  RESOURCE_TYPES,
  STORAGE_PROVIDERS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  WORKSPACE_ROLES,
  WORKSPACE_STATUSES,
  WORKSPACE_TYPES,
} from "../../packages/shared/src/index.ts";

test("shared prisma enum mirrors match the canonical catalog", () => {
  assert.deepEqual(GLOBAL_ROLES, ["USER", "ADMIN"]);
  assert.deepEqual(AUTH_PROVIDERS, ["local", "google"]);
  assert.deepEqual(WORKSPACE_TYPES, ["professional", "academic", "general"]);
  assert.deepEqual(WORKSPACE_ROLES, ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"]);
  assert.deepEqual(WORKSPACE_STATUSES, ["active", "archived"]);
  assert.deepEqual(DOCUMENT_STATUSES, ["draft", "submitted", "changes_requested", "approved", "archived"]);
  assert.deepEqual(TASK_STATUSES, ["backlog", "todo", "in_progress", "in_review", "done"]);
  assert.deepEqual(TASK_PRIORITIES, ["low", "medium", "high", "urgent"]);
  assert.deepEqual(INVITATION_STATUSES, ["pending", "accepted", "expired", "revoked"]);
  assert.deepEqual(FILE_STATUSES, ["pending", "uploaded", "ready", "failed", "deleted"]);
  assert.deepEqual(STORAGE_PROVIDERS, ["s3"]);
  assert.deepEqual(COMMENT_TARGET_TYPES, ["document", "task"]);
  assert.deepEqual(COMMENT_THREAD_STATUSES, ["open", "resolved"]);
  assert.deepEqual(RESOURCE_TYPES, ["workspace", "document", "task", "comment_thread", "file", "export"]);
});
