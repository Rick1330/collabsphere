import type { Prisma } from "@collabsphere/database";

// Shared keeps the canonical export names while generation ownership stays in packages/database.
// All Prisma-generated model types are aliased with a Prisma* prefix to avoid collisions
// with the mirror enums and app-level contract types exported from this package.
export type PrismaJsonValue = Prisma.JsonValue;
export type PrismaInputJsonValue = Prisma.InputJsonValue;
export type PrismaTransactionClient = Prisma.TransactionClient;

export type {
  ActivityEvent as PrismaActivityEvent,
  Attachment as PrismaAttachment,
  AuditLog as PrismaAuditLog,
  Comment as PrismaComment,
  CommentMention as PrismaCommentMention,
  CommentThread as PrismaCommentThread,
  Document as PrismaDocument,
  DocumentSubmission as PrismaDocumentSubmission,
  DocumentVersion as PrismaDocumentVersion,
  EmailDeliveryLog as PrismaEmailDeliveryLog,
  EmailVerificationToken as PrismaEmailVerificationToken,
  ExportJob as PrismaExportJob,
  File as PrismaFileRecord,
  Folder as PrismaFolder,
  Invitation as PrismaInvitation,
  Notification as PrismaNotification,
  NotificationPreference as PrismaNotificationPreference,
  PasswordResetToken as PrismaPasswordResetToken,
  RefreshToken as PrismaRefreshToken,
  Task as PrismaTask,
  TaskColumn as PrismaTaskColumn,
  TaskDocumentLink as PrismaTaskDocumentLink,
  Template as PrismaTemplate,
  User as PrismaUser,
  Workspace as PrismaWorkspace,
  WorkspaceMember as PrismaWorkspaceMember,
  WorkspaceSettings as PrismaWorkspaceSettings,
} from "@collabsphere/database";
