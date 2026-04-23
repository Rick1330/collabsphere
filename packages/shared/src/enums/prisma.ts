import type { $Enums } from "@prisma/client";

export type GlobalRole = $Enums.GlobalRole;
export const GLOBAL_ROLES = ["USER", "ADMIN"] as const satisfies readonly GlobalRole[];

export type AuthProvider = $Enums.AuthProvider;
export const AUTH_PROVIDERS = ["local", "google"] as const satisfies readonly AuthProvider[];

export type WorkspaceType = $Enums.WorkspaceType;
export const WORKSPACE_TYPES = ["professional", "academic", "general"] as const satisfies readonly WorkspaceType[];

export type WorkspaceRole = $Enums.WorkspaceRole;
export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const satisfies readonly WorkspaceRole[];

export type WorkspaceStatus = $Enums.WorkspaceStatus;
export const WORKSPACE_STATUSES = ["active", "archived"] as const satisfies readonly WorkspaceStatus[];

export type DocumentStatus = $Enums.DocumentStatus;
export const DOCUMENT_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "archived",
] as const satisfies readonly DocumentStatus[];

export type TaskStatus = $Enums.TaskStatus;
export const TASK_STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"] as const satisfies readonly TaskStatus[];

export type TaskPriority = $Enums.TaskPriority;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const satisfies readonly TaskPriority[];

export type InvitationStatus = $Enums.InvitationStatus;
export const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const satisfies readonly InvitationStatus[];

export type FileStatus = $Enums.FileStatus;
export const FILE_STATUSES = ["pending", "uploaded", "ready", "failed", "deleted"] as const satisfies readonly FileStatus[];

export type StorageProvider = $Enums.StorageProvider;
export const STORAGE_PROVIDERS = ["s3"] as const satisfies readonly StorageProvider[];

export type CommentTargetType = $Enums.CommentTargetType;
export const COMMENT_TARGET_TYPES = ["document", "task"] as const satisfies readonly CommentTargetType[];

export type CommentThreadStatus = $Enums.CommentThreadStatus;
export const COMMENT_THREAD_STATUSES = ["open", "resolved"] as const satisfies readonly CommentThreadStatus[];

export type ResourceType = $Enums.ResourceType;
export const RESOURCE_TYPES = [
  "workspace",
  "document",
  "task",
  "comment_thread",
  "file",
  "export",
] as const satisfies readonly ResourceType[];
