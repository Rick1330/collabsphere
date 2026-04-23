CREATE TYPE "global_role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "auth_provider" AS ENUM ('local', 'google');
CREATE TYPE "workspace_type" AS ENUM ('professional', 'academic', 'general');
CREATE TYPE "workspace_role" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');
CREATE TYPE "workspace_status" AS ENUM ('active', 'archived');
CREATE TYPE "document_status" AS ENUM ('draft', 'submitted', 'changes_requested', 'approved', 'archived');
CREATE TYPE "task_status" AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done');
CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "invitation_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE "file_status" AS ENUM ('pending', 'uploaded', 'ready', 'failed', 'deleted');
CREATE TYPE "storage_provider" AS ENUM ('s3');
CREATE TYPE "comment_target_type" AS ENUM ('document', 'task');
CREATE TYPE "comment_thread_status" AS ENUM ('open', 'resolved');
CREATE TYPE "resource_type" AS ENUM ('workspace', 'document', 'task', 'comment_thread', 'file', 'export');

DROP INDEX "uq_users_provider_id_active";
DROP INDEX "idx_users_global_role";
DROP INDEX "idx_workspaces_type_status";
DROP INDEX "idx_workspace_members_workspace_role";
DROP INDEX "uq_workspace_single_owner";
DROP INDEX "idx_invitations_workspace_status";
DROP INDEX "idx_invitations_email";
DROP INDEX "idx_documents_status";
DROP INDEX "idx_task_columns_workspace_status";
DROP INDEX "idx_tasks_workspace_status_pos";
DROP INDEX "idx_files_workspace_status";

ALTER TABLE "users"
  ALTER COLUMN "global_role" DROP DEFAULT,
  ALTER COLUMN "auth_provider" DROP DEFAULT,
  ALTER COLUMN "global_role" TYPE "global_role" USING ("global_role"::"global_role"),
  ALTER COLUMN "auth_provider" TYPE "auth_provider" USING ("auth_provider"::"auth_provider"),
  ALTER COLUMN "global_role" SET DEFAULT 'USER',
  ALTER COLUMN "auth_provider" SET DEFAULT 'local';

ALTER TABLE "workspaces"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "workspace_type" USING ("type"::"workspace_type"),
  ALTER COLUMN "status" TYPE "workspace_status" USING ("status"::"workspace_status"),
  ALTER COLUMN "status" SET DEFAULT 'active';

ALTER TABLE "workspace_members"
  ALTER COLUMN "role" TYPE "workspace_role" USING ("role"::"workspace_role");

ALTER TABLE "invitations"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "workspace_role" USING ("role"::"workspace_role"),
  ALTER COLUMN "status" TYPE "invitation_status" USING ("status"::"invitation_status"),
  ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "documents"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "document_status" USING ("status"::"document_status"),
  ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "task_columns"
  ALTER COLUMN "status" TYPE "task_status" USING ("status"::"task_status");

ALTER TABLE "tasks"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "priority" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "task_status" USING ("status"::"task_status"),
  ALTER COLUMN "priority" TYPE "task_priority" USING ("priority"::"task_priority"),
  ALTER COLUMN "status" SET DEFAULT 'todo',
  ALTER COLUMN "priority" SET DEFAULT 'medium';

ALTER TABLE "comment_threads"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "target_type" TYPE "comment_target_type" USING ("target_type"::"comment_target_type"),
  ALTER COLUMN "status" TYPE "comment_thread_status" USING ("status"::"comment_thread_status"),
  ALTER COLUMN "status" SET DEFAULT 'open';

ALTER TABLE "notifications"
  ALTER COLUMN "resource_type" TYPE "resource_type" USING ("resource_type"::"resource_type");

ALTER TABLE "activity_events"
  ALTER COLUMN "resource_type" TYPE "resource_type" USING ("resource_type"::"resource_type");

ALTER TABLE "files"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "file_status" USING ("status"::"file_status"),
  ALTER COLUMN "storage_provider" TYPE "storage_provider" USING ("storage_provider"::"storage_provider"),
  ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "export_jobs"
  ALTER COLUMN "resource_type" TYPE "resource_type" USING ("resource_type"::"resource_type");

CREATE UNIQUE INDEX "uq_users_provider_id_active"
  ON "users"("auth_provider", "auth_provider_id")
  WHERE "auth_provider_id" IS NOT NULL AND "deleted_at" IS NULL;

CREATE INDEX "idx_users_global_role"
  ON "users"("global_role")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_workspaces_type_status"
  ON "workspaces"("type", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_workspace_members_workspace_role"
  ON "workspace_members"("workspace_id", "role")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_workspace_single_owner"
  ON "workspace_members"("workspace_id")
  WHERE "role" = 'OWNER' AND "is_active" = true AND "deleted_at" IS NULL;

CREATE INDEX "idx_invitations_workspace_status"
  ON "invitations"("workspace_id", "status", "expires_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_invitations_email"
  ON "invitations"("invited_email", "status", "expires_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_documents_status"
  ON "documents"("workspace_id", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_task_columns_workspace_status"
  ON "task_columns"("workspace_id", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_tasks_workspace_status_pos"
  ON "tasks"("workspace_id", "status", "position")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_files_workspace_status"
  ON "files"("workspace_id", "status")
  WHERE "deleted_at" IS NULL;
