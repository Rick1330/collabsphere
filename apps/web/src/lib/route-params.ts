export const DEFAULT_WORKSPACE_ID = "alpha";
export const DEFAULT_DOCUMENT_ID = "d-api";
export const DEFAULT_TASK_ID = "task-1";

export const isPlaceholderParam = (value?: string | null) =>
  !value || value.startsWith(":");

export const resolveWorkspaceParam = (value?: string | null) =>
  isPlaceholderParam(value) ? DEFAULT_WORKSPACE_ID : value;

export const resolveDocumentParam = (value?: string | null) =>
  isPlaceholderParam(value) ? DEFAULT_DOCUMENT_ID : value;

export const resolveTaskParam = (value?: string | null) =>
  isPlaceholderParam(value) ? DEFAULT_TASK_ID : value;
