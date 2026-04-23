CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  full_name varchar(200) NOT NULL,
  avatar_url varchar(500),
  bio varchar(500),
  global_role varchar(20) NOT NULL DEFAULT 'USER',
  auth_provider varchar(20) NOT NULL DEFAULT 'local',
  auth_provider_id varchar(255),
  password_hash varchar(255),
  theme_preference varchar(20) NOT NULL DEFAULT 'system',
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  password_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  replaced_by_token_id uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  ip_address varchar(64),
  user_agent text
);

CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(60) NOT NULL,
  description varchar(280),
  icon varchar(16),
  type varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  owner_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role varchar(20) NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  last_accessed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE workspace_settings (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  invited_email citext NOT NULL,
  role varchar(20) NOT NULL,
  token_hash char(64) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  invited_by_user_id uuid NOT NULL REFERENCES users(id),
  accepted_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  name varchar(120) NOT NULL,
  parent_id uuid REFERENCES folders(id),
  position numeric(20,10) NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  folder_id uuid REFERENCES folders(id),
  title varchar(200) NOT NULL,
  position numeric(20,10) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'draft',
  is_locked boolean NOT NULL DEFAULT false,
  locked_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  locked_at timestamptz,
  content_yjs bytea NOT NULL DEFAULT ''::bytea,
  content_plaintext text NOT NULL DEFAULT '',
  search_vector tsvector,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  document_id uuid NOT NULL REFERENCES documents(id),
  version_number int NOT NULL,
  reason varchar(30) NOT NULL,
  yjs_state bytea NOT NULL,
  plaintext text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE document_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  document_id uuid NOT NULL REFERENCES documents(id),
  submitted_by uuid NOT NULL REFERENCES users(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  snapshot_version_id uuid REFERENCES document_versions(id) ON DELETE SET NULL,
  decision varchar(30),
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  name varchar(50) NOT NULL,
  status varchar(30) NOT NULL,
  position numeric(20,10) NOT NULL,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  title varchar(200) NOT NULL,
  description text,
  status varchar(30) NOT NULL DEFAULT 'todo',
  priority varchar(20) NOT NULL DEFAULT 'medium',
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL REFERENCES users(id),
  due_date date,
  labels text[] NOT NULL DEFAULT '{}'::text[],
  position numeric(20,10) NOT NULL,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE task_document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  task_id uuid NOT NULL REFERENCES tasks(id),
  document_id uuid NOT NULL REFERENCES documents(id),
  anchor jsonb,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE comment_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  anchor jsonb,
  status varchar(20) NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  thread_id uuid NOT NULL REFERENCES comment_threads(id),
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_name_snapshot varchar(200) NOT NULL,
  author_avatar_snapshot varchar(500),
  content jsonb NOT NULL,
  content_plaintext text NOT NULL DEFAULT '',
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  comment_id uuid NOT NULL REFERENCES comments(id),
  mentioned_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES users(id),
  workspace_id uuid REFERENCES workspaces(id),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type varchar(80) NOT NULL,
  title varchar(200) NOT NULL,
  body text,
  resource_type varchar(40),
  resource_id uuid,
  url varchar(500),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  in_app jsonb NOT NULL DEFAULT '{}'::jsonb,
  email jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily_digest_enabled boolean NOT NULL DEFAULT false,
  weekly_digest_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_name_snapshot varchar(200) NOT NULL,
  actor_avatar_snapshot varchar(500),
  event_key varchar(80) NOT NULL,
  summary varchar(255) NOT NULL,
  resource_type varchar(40),
  resource_id uuid,
  resource_title_snapshot varchar(255),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id varchar(64),
  severity varchar(10) NOT NULL,
  action_key varchar(120) NOT NULL,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_email citext,
  actor_global_role varchar(20),
  workspace_id uuid REFERENCES workspaces(id),
  target_type varchar(40),
  target_id uuid,
  ip_address varchar(64),
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE templates (
  id varchar(120) PRIMARY KEY,
  kind varchar(20) NOT NULL,
  category varchar(20) NOT NULL,
  scope varchar(20) NOT NULL DEFAULT 'system',
  name varchar(120) NOT NULL,
  description varchar(280),
  version int NOT NULL DEFAULT 1,
  schema_version int NOT NULL DEFAULT 1,
  content_format varchar(20),
  content jsonb NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES workspaces(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  uploaded_by_user_id uuid NOT NULL REFERENCES users(id),
  status varchar(20) NOT NULL DEFAULT 'pending',
  original_filename varchar(255) NOT NULL,
  content_type varchar(120) NOT NULL,
  size_bytes bigint NOT NULL,
  storage_provider varchar(50) NOT NULL,
  storage_bucket varchar(120) NOT NULL,
  storage_key varchar(500) NOT NULL,
  checksum_sha256 char(64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  resource_type varchar(40) NOT NULL,
  resource_id uuid NOT NULL,
  format varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'queued',
  error_message text,
  output_file_id uuid REFERENCES files(id) ON DELETE SET NULL,
  output_storage_key varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  file_id uuid NOT NULL REFERENCES files(id),
  target_type varchar(20) NOT NULL,
  target_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE email_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  to_email citext NOT NULL,
  template_key varchar(120) NOT NULL,
  provider varchar(50) NOT NULL,
  provider_message_id varchar(255),
  status varchar(20) NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email_active
  ON users(email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_users_provider_id_active
  ON users(auth_provider, auth_provider_id)
  WHERE auth_provider_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_users_global_role
  ON users(global_role)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_users_created_at
  ON users(created_at DESC);

CREATE UNIQUE INDEX uq_refresh_tokens_token_hash
  ON refresh_tokens(token_hash);

CREATE INDEX idx_refresh_tokens_user_expires
  ON refresh_tokens(user_id, expires_at DESC);

CREATE INDEX idx_refresh_tokens_user_active
  ON refresh_tokens(user_id)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX uq_email_verification_token_hash
  ON email_verification_tokens(token_hash);

CREATE INDEX idx_email_verification_user
  ON email_verification_tokens(user_id, created_at DESC);

CREATE UNIQUE INDEX uq_password_reset_token_hash
  ON password_reset_tokens(token_hash);

CREATE INDEX idx_password_reset_user
  ON password_reset_tokens(user_id, created_at DESC);

CREATE INDEX idx_workspaces_owner_created
  ON workspaces(owner_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_workspaces_type_status
  ON workspaces(type, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_workspaces_updated
  ON workspaces(updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_workspace_members_active
  ON workspace_members(workspace_id, user_id)
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX idx_workspace_members_workspace_role
  ON workspace_members(workspace_id, role)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_workspace_members_user
  ON workspace_members(user_id, last_accessed_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_workspace_single_owner
  ON workspace_members(workspace_id)
  WHERE role = 'OWNER' AND is_active = true AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_invitations_token_hash
  ON invitations(token_hash);

CREATE INDEX idx_invitations_workspace_status
  ON invitations(workspace_id, status, expires_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_invitations_email
  ON invitations(invited_email, status, expires_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_folders_workspace_parent_pos
  ON folders(workspace_id, parent_id, position)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_folders_workspace
  ON folders(workspace_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_documents_workspace_folder_pos
  ON documents(workspace_id, folder_id, position)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_documents_workspace_updated
  ON documents(workspace_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_documents_status
  ON documents(workspace_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_documents_search_vector
  ON documents
  USING GIN (search_vector);

CREATE UNIQUE INDEX uq_doc_versions_number
  ON document_versions(document_id, version_number);

CREATE INDEX idx_doc_versions_doc_created
  ON document_versions(document_id, created_at DESC);

CREATE INDEX idx_doc_versions_workspace_created
  ON document_versions(workspace_id, created_at DESC);

CREATE INDEX idx_doc_submissions_document
  ON document_submissions(document_id, submitted_at DESC);

CREATE INDEX idx_doc_submissions_workspace
  ON document_submissions(workspace_id, submitted_at DESC);

CREATE INDEX idx_task_columns_workspace_pos
  ON task_columns(workspace_id, position)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_task_columns_workspace_status
  ON task_columns(workspace_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_workspace_status_pos
  ON tasks(workspace_id, status, position)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_workspace_assignee_due
  ON tasks(workspace_id, assignee_id, due_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_workspace_updated
  ON tasks(workspace_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_search_vector
  ON tasks
  USING GIN (search_vector);

CREATE INDEX idx_task_doc_links_task
  ON task_document_links(workspace_id, task_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_task_doc_links_doc
  ON task_document_links(workspace_id, document_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_comment_threads_target
  ON comment_threads(workspace_id, target_type, target_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_comment_threads_status
  ON comment_threads(workspace_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_comments_thread_created
  ON comments(thread_id, created_at ASC);

CREATE INDEX idx_comments_workspace_created
  ON comments(workspace_id, created_at DESC);

CREATE UNIQUE INDEX uq_comment_mentions_unique
  ON comment_mentions(comment_id, mentioned_user_id);

CREATE INDEX idx_comment_mentions_user
  ON comment_mentions(mentioned_user_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_created
  ON notifications(recipient_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_recipient_unread
  ON notifications(recipient_id, is_read, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_recipient_workspace
  ON notifications(recipient_id, workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_activity_events_workspace_created
  ON activity_events(workspace_id, created_at DESC);

CREATE INDEX idx_activity_events_workspace_event
  ON activity_events(workspace_id, event_key, created_at DESC);

CREATE INDEX idx_activity_events_workspace_actor
  ON activity_events(workspace_id, actor_id, created_at DESC);

CREATE INDEX idx_audit_log_created
  ON audit_log(created_at DESC);

CREATE INDEX idx_audit_log_action_created
  ON audit_log(action_key, created_at DESC);

CREATE INDEX idx_audit_log_actor_email
  ON audit_log(actor_email, created_at DESC);

CREATE INDEX idx_audit_log_workspace
  ON audit_log(workspace_id, created_at DESC);

CREATE INDEX idx_templates_kind_category_scope
  ON templates(kind, category, scope);

CREATE INDEX idx_templates_enabled
  ON templates(is_enabled)
  WHERE is_enabled = true;

CREATE INDEX idx_files_workspace_created
  ON files(workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_files_workspace_status
  ON files(workspace_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_files_uploaded_by
  ON files(uploaded_by_user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_export_jobs_requester_created
  ON export_jobs(requested_by, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_export_jobs_workspace_created
  ON export_jobs(workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_export_jobs_status
  ON export_jobs(status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_attachments_target
  ON attachments(workspace_id, target_type, target_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_attachments_file
  ON attachments(workspace_id, file_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_email_delivery_user_created
  ON email_delivery_log(user_id, created_at DESC);

CREATE INDEX idx_email_delivery_status
  ON email_delivery_log(status, created_at DESC);
