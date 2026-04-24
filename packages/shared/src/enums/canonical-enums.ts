export enum GlobalRoleEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum AuthProviderEnum {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum WorkspaceTypeEnum {
  PROFESSIONAL = "professional",
  ACADEMIC = "academic",
  GENERAL = "general",
}

export enum WorkspaceRoleEnum {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

export enum WorkspaceStatusEnum {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum DocumentStatusEnum {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  CHANGES_REQUESTED = "changes_requested",
  APPROVED = "approved",
  ARCHIVED = "archived",
}

export enum TaskStatusEnum {
  BACKLOG = "backlog",
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  IN_REVIEW = "in_review",
  DONE = "done",
}

export enum TaskPriorityEnum {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum InvitationStatusEnum {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

export enum FileStatusEnum {
  PENDING = "pending",
  UPLOADED = "uploaded",
  READY = "ready",
  FAILED = "failed",
  DELETED = "deleted",
}

export enum StorageProviderEnum {
  S3 = "s3",
}

export enum CommentTargetTypeEnum {
  DOCUMENT = "document",
  TASK = "task",
}

export enum CommentThreadStatusEnum {
  OPEN = "open",
  RESOLVED = "resolved",
}

export enum ResourceTypeEnum {
  WORKSPACE = "workspace",
  DOCUMENT = "document",
  TASK = "task",
  COMMENT_THREAD = "comment_thread",
  FILE = "file",
  EXPORT = "export",
}
