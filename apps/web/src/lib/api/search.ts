export type SearchScope = "global" | "workspace";

export type SearchPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type SearchDocumentResult = {
  id: string;
  title: string;
  snippet: string;
  updatedAt: string;
  url: string;
};

export type SearchTaskResult = {
  id: string;
  title: string;
  snippet: string;
  status: string;
  priority: string;
  dueDate: string | null;
  url: string;
};

export type SearchResults = {
  documents: readonly SearchDocumentResult[];
  tasks: readonly SearchTaskResult[];
};

type SearchSuccessEnvelope = {
  data?: {
    query?: unknown;
    scope?: unknown;
    workspaceId?: unknown;
    results?: unknown;
  };
  meta?: {
    requestId?: unknown;
    pagination?: unknown;
  };
};

type SearchErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
  meta?: {
    requestId?: unknown;
  };
};

type SearchFetchOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

export type SearchApiErrorKind =
  | "auth"
  | "forbidden"
  | "network"
  | "not-found"
  | "server"
  | "unknown"
  | "validation";

const searchMessages: Record<SearchApiErrorKind, string> = {
  auth: "Your session has expired. Please sign in again.",
  forbidden: "Search is not available for this scope.",
  network: "Search could not be reached. Check your connection and retry.",
  "not-found": "Search is not available in this environment yet.",
  server: "Search could not be completed. Please try again.",
  unknown: "Search could not be completed.",
  validation: "Search query is not valid.",
};

export class SearchApiError extends Error {
  kind: SearchApiErrorKind;
  requestId: string | null;
  status: number | null;

  constructor(
    kind: SearchApiErrorKind,
    message: string,
    options?: { requestId?: string | null; status?: number | null },
  ) {
    super(message);
    this.name = "SearchApiError";
    this.kind = kind;
    this.requestId = options?.requestId ?? null;
    this.status = options?.status ?? null;
  }
}

export const normalizeSearchQuery = (value: string) => value.trim().slice(0, 200);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;

const readString = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Search response is missing a valid ${field}.`);
  }

  return value;
};

const readNullableString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return null;
  }

  throw new Error("Search response contains an invalid string field.");
};

const readMetaRecord = (payload: unknown) => {
  if (!isRecord(payload)) {
    return null;
  }

  return isRecord(payload.meta) ? payload.meta : null;
};

const readRequestId = (payload: unknown) =>
  readNonEmptyString(readMetaRecord(payload)?.requestId);

const parseSearchPagination = (value: unknown): SearchPagination | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { page, pageSize, totalItems, totalPages } = value;

  if (
    typeof page !== "number" ||
    typeof pageSize !== "number" ||
    typeof totalItems !== "number" ||
    typeof totalPages !== "number"
  ) {
    return null;
  }

  return { page, pageSize, totalItems, totalPages };
};

const parseDocumentResult = (value: unknown): SearchDocumentResult => {
  if (!isRecord(value)) {
    throw new Error("Search response contains a malformed document result.");
  }

  return {
    id: readString(value.id, "document id"),
    title: readString(value.title, "document title"),
    snippet: readString(value.snippet, "document snippet"),
    updatedAt: readString(value.updatedAt, "document updatedAt"),
    url: readString(value.url, "document url"),
  };
};

const parseTaskResult = (value: unknown): SearchTaskResult => {
  if (!isRecord(value)) {
    throw new Error("Search response contains a malformed task result.");
  }

  return {
    id: readString(value.id, "task id"),
    title: readString(value.title, "task title"),
    snippet: readString(value.snippet, "task snippet"),
    status: readString(value.status, "task status"),
    priority: readString(value.priority, "task priority"),
    dueDate: readNullableString(value.dueDate),
    url: readString(value.url, "task url"),
  };
};

const readResultsRecord = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  return isRecord(payload.data.results) ? payload.data.results : null;
};

export const parseSearchResults = (payload: unknown): SearchResults => {
  const results = readResultsRecord(payload);

  if (!results) {
    throw new Error("Search response does not match the expected envelope.");
  }

  const documentsRaw = results.documents;
  const tasksRaw = results.tasks;

  const documents = Array.isArray(documentsRaw)
    ? documentsRaw.map(parseDocumentResult)
    : [];
  const tasks = Array.isArray(tasksRaw) ? tasksRaw.map(parseTaskResult) : [];

  return { documents, tasks };
};

export type SearchResponse = {
  query: string;
  scope: SearchScope;
  workspaceId: string | null;
  results: SearchResults;
  pagination: SearchPagination | null;
  requestId: string | null;
};

const parseScope = (value: unknown): SearchScope => {
  if (value === "global" || value === "workspace") {
    return value;
  }

  throw new Error("Search response contains an invalid scope.");
};

export const parseSearchResponse = (payload: unknown): SearchResponse => {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("Search response does not match the expected envelope.");
  }

  const query = readString(payload.data.query, "query");
  const scope = parseScope(payload.data.scope);
  const workspaceId = readNullableString(payload.data.workspaceId);
  const results = parseSearchResults(payload);

  const meta = readMetaRecord(payload);
  const pagination = meta ? parseSearchPagination(meta.pagination) : null;

  return {
    query,
    scope,
    workspaceId,
    results,
    pagination,
    requestId: readRequestId(payload),
  };
};

const readSearchErrorCode = (payload: unknown) => {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }

  return readNonEmptyString(payload.error.code);
};

const searchErrorKindsByStatus: Record<number, SearchApiErrorKind> = {
  400: "validation",
  401: "auth",
  403: "forbidden",
  404: "not-found",
};

const getSearchErrorKindFromStatus = (status: number, errorCode: string | null) => {
  if (errorCode === "UNAUTHORIZED") {
    return "auth";
  }

  if (errorCode === "NOT_WORKSPACE_MEMBER") {
    return "forbidden";
  }

  const exact = searchErrorKindsByStatus[status];
  if (exact) {
    return exact;
  }

  return status >= 500 ? "server" : "unknown";
};

const toSearchApiError = (status: number, payload: unknown): SearchApiError => {
  const errorCode = readSearchErrorCode(payload);
  const kind = getSearchErrorKindFromStatus(status, errorCode);
  return new SearchApiError(kind, searchMessages[kind], {
    requestId: readRequestId(payload),
    status,
  });
};

const isAbortLikeError = (error: unknown): error is { name: string } =>
  isRecord(error) && error.name === "AbortError";

const buildSearchRequestHeaders = (accessToken?: string) => ({
  Accept: "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

const readResponsePayload = async (response: Response) => {
  try {
    return (await response.json()) as SearchSuccessEnvelope | SearchErrorEnvelope;
  } catch {
    return null;
  }
};

export const buildSearchUrl = (
  options: Readonly<
    | {
        q: string;
        scope: "global";
        types?: readonly string[];
        page?: number;
        pageSize?: number;
      }
    | {
        q: string;
        scope: "workspace";
        workspaceId: string;
        types?: readonly string[];
        page?: number;
        pageSize?: number;
      }
  >,
) => {
  const { q, scope, types, page = 1, pageSize = 25 } = options;
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("scope", scope);
  if (scope === "workspace") {
    if (options.workspaceId.length === 0) {
      throw new SearchApiError(
        "validation",
        "Workspace ID is required for workspace-scoped search.",
      );
    }

    params.set("workspaceId", options.workspaceId);
  }
  if (types && types.length > 0) {
    params.set("types", types.join(","));
  }
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  return `/api/v1/search?${params.toString()}`;
};

const classifyUnexpectedSearchError = (error: unknown): never => {
  if (isAbortLikeError(error)) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new SearchApiError("network", searchMessages.network);
  }

  throw new SearchApiError("unknown", searchMessages.unknown);
};

export async function search(
  options: Readonly<
    SearchFetchOptions &
      (
        | {
            q: string;
            scope: "global";
            types?: readonly string[];
            page?: number;
            pageSize?: number;
          }
        | {
            q: string;
            scope: "workspace";
            workspaceId: string;
            types?: readonly string[];
            page?: number;
            pageSize?: number;
          }
      )
  >,
): Promise<SearchResponse> {
  const {
    accessToken,
    fetchFn = fetch,
    page = 1,
    pageSize = 25,
    q,
    scope,
    signal,
    types = ["documents", "tasks"],
  } = options;
  const normalized = normalizeSearchQuery(q);

  if (scope === "workspace" && options.workspaceId.length === 0) {
    throw new SearchApiError("validation", "Workspace ID is required for workspace-scoped search.");
  }

  try {
    const response = await fetchFn(
      scope === "workspace"
        ? buildSearchUrl({
            q: normalized,
            scope,
            workspaceId: options.workspaceId,
            types,
            page,
            pageSize,
          })
        : buildSearchUrl({ q: normalized, scope, types, page, pageSize }),
      {
        method: "GET",
        credentials: "include",
        headers: buildSearchRequestHeaders(accessToken),
        signal,
      },
    );

    const payload = await readResponsePayload(response);

    if (!response.ok) {
      throw toSearchApiError(response.status, payload);
    }

    try {
      return parseSearchResponse(payload);
    } catch {
      throw new SearchApiError("unknown", searchMessages.unknown, {
        requestId: readRequestId(payload),
        status: response.status,
      });
    }
  } catch (error) {
    if (error instanceof SearchApiError) {
      throw error;
    }

    return classifyUnexpectedSearchError(error);
  }
}
