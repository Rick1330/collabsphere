export type MyTaskSummary = {
  id: string;
  title: string;
  workspaceId: string | null;
  workspaceName: string | null;
  priority: "urgent" | "high" | "medium" | "low";
  status: "todo" | "in_progress" | "review" | "done";
  dueAt: string | null;
  url: string;
};

type TaskEnvelope = {
  data?: {
    items?: unknown[];
  };
  meta?: {
    requestId?: unknown;
  };
};

type TaskFetchOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

export type TaskApiErrorKind = "auth" | "network" | "not-found" | "server" | "unknown";

export class TaskApiError extends Error {
  kind: TaskApiErrorKind;
  requestId: string | null;

  constructor(kind: TaskApiErrorKind, message: string, requestId?: string | null) {
    super(message);
    this.name = "TaskApiError";
    this.kind = kind;
    this.requestId = requestId ?? null;
  }
}

export const myTasksQueryKey = ["tasks", "mine"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Task response is missing a valid ${field}.`);
  }

  return value;
};

const readNullableString = (value: unknown) => {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error("Task response contains an invalid nullable string.");
};

const isTaskPriority = (value: unknown): value is MyTaskSummary["priority"] =>
  value === "urgent" || value === "high" || value === "medium" || value === "low";

const isTaskStatus = (value: unknown): value is MyTaskSummary["status"] =>
  value === "todo" || value === "in_progress" || value === "review" || value === "done";

const readRequestId = (payload: unknown) =>
  isRecord(payload) && isRecord(payload.meta) && typeof payload.meta.requestId === "string"
    ? payload.meta.requestId
    : null;

const isAbortLikeError = (error: unknown): error is { name: string } =>
  isRecord(error) && error.name === "AbortError";

const parseTask = (item: unknown): MyTaskSummary => {
  if (!isRecord(item)) {
    throw new Error("Task response contains a malformed task.");
  }

  if (!isTaskPriority(item.priority) || !isTaskStatus(item.status)) {
    throw new Error("Task response contains an invalid task priority or status.");
  }

  return {
    id: readString(item.id, "task id"),
    title: readString(item.title, "task title"),
    workspaceId: readNullableString(item.workspaceId),
    workspaceName: readNullableString(item.workspaceName),
    priority: item.priority,
    status: item.status,
    dueAt: readNullableString(item.dueAt),
    url: readString(item.url, "task url"),
  };
};

const toTaskApiError = (status: number, payload: unknown) => {
  const requestId = readRequestId(payload);

  if (status === 401 || status === 403) {
    return new TaskApiError("auth", "Task access could not be verified for this session.", requestId);
  }

  if (status === 404) {
    return new TaskApiError(
      "not-found",
      "Your cross-workspace task feed is not available in this environment yet.",
      requestId,
    );
  }

  if (status >= 500) {
    return new TaskApiError("server", "The task feed failed to respond. Retry in a moment.", requestId);
  }

  return new TaskApiError("unknown", "The task feed could not be completed.", requestId);
};

export async function listMyTasks({
  accessToken,
  fetchFn = fetch,
  signal,
}: TaskFetchOptions = {}) {
  try {
    const response = await fetchFn("/api/v1/tasks/mine?page=1&pageSize=8", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal,
    });
    const payload = (await response.json().catch(() => null)) as TaskEnvelope | null;

    if (!response.ok) {
      throw toTaskApiError(response.status, payload);
    }

    const items = payload?.data?.items;
    if (!Array.isArray(items)) {
      throw new TaskApiError("unknown", "The task feed response was malformed.", readRequestId(payload));
    }

    return items.map(parseTask);
  } catch (error) {
    if (error instanceof TaskApiError) {
      throw error;
    }

    if (isAbortLikeError(error)) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new TaskApiError("network", "The task feed could not be reached. Check the connection and retry.");
    }

    throw new TaskApiError("unknown", "The task feed response was malformed.");
  }
}
