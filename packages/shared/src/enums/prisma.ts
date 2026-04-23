export const GLOBAL_ROLES = ["USER", "ADMIN"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export const AUTH_PROVIDERS = ["local", "google"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const WORKSPACE_TYPES = ["professional", "academic", "general"] as const;
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const WORKSPACE_STATUSES = ["active", "archived"] as const;
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const DOCUMENT_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "archived",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const TASK_STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const FILE_STATUSES = ["pending", "uploaded", "ready", "failed", "deleted"] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];

export const STORAGE_PROVIDERS = ["s3"] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export const COMMENT_TARGET_TYPES = ["document", "task"] as const;
export type CommentTargetType = (typeof COMMENT_TARGET_TYPES)[number];

export const COMMENT_THREAD_STATUSES = ["open", "resolved"] as const;
export type CommentThreadStatus = (typeof COMMENT_THREAD_STATUSES)[number];

export const RESOURCE_TYPES = [
  "workspace",
  "document",
  "task",
  "comment_thread",
  "file",
  "export",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
