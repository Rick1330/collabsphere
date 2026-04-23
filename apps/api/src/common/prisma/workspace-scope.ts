import {
  cloneArgs,
  createMutationOperationHandler,
  createPassthroughHandler,
  createReadOperationHandler,
  createUniqueReadOperationHandler,
  isCallable,
  isRecordLike,
  type RecordLike,
  type UnknownFn,
} from "./prisma-proxy.shared.js";

const WORKSPACE_SCOPED_MODELS = [
  "workspaceMember",
  "workspaceSettings",
  "invitation",
  "folder",
  "document",
  "documentVersion",
  "documentSubmission",
  "taskColumn",
  "task",
  "taskDocumentLink",
  "commentThread",
  "comment",
  "commentMention",
  "notification",
  "activityEvent",
  "exportJob",
  "file",
  "attachment",
] as const;

const WORKSPACE_SCOPED_READ_OPERATIONS = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
] as const;

const WORKSPACE_SCOPED_CLIENT_CONTROLS = ["$withDeleted", "$withHardDeletes"] as const;

const WORKSPACE_SCOPED_MODEL_SET = new Set<string>(WORKSPACE_SCOPED_MODELS);
const WORKSPACE_SCOPED_READ_OPERATION_SET = new Set<string>(WORKSPACE_SCOPED_READ_OPERATIONS);
const WORKSPACE_SCOPED_CLIENT_CONTROL_SET = new Set<string>(WORKSPACE_SCOPED_CLIENT_CONTROLS);
const UNIQUE_READ_OPERATION_MAP = {
  findUnique: "findFirst",
  findUniqueOrThrow: "findFirstOrThrow",
} as const;

export const MISSING_WORKSPACE_SCOPE_ERROR =
  "workspaceId is required for workspace-scoped Prisma access.";
export const CROSS_WORKSPACE_WRITE_ERROR = "Cross-workspace writes are not allowed.";
export const UNSUPPORTED_WORKSPACE_UNIQUE_MUTATION_ERROR =
  "Workspace-scoped update() and delete() are not supported; use workspace-scoped updateMany()/deleteMany() or an explicit read + conditional write flow.";
export const UNSUPPORTED_WORKSPACE_UPSERT_ERROR =
  "Workspace-scoped upsert is not supported; split it into explicit read/create or read/update flows.";

const cloneData = (value: unknown) => {
  if (!isRecordLike(value)) {
    throw new Error("Workspace-scoped Prisma writes require an object payload.");
  }

  return { ...(value as Record<string, unknown>) };
};

export const requireWorkspaceId = (workspaceId: string) => {
  const normalizedWorkspaceId = workspaceId.trim();
  if (normalizedWorkspaceId.length === 0) {
    throw new Error(MISSING_WORKSPACE_SCOPE_ERROR);
  }

  return normalizedWorkspaceId;
};

export const assertMatchingWorkspaceId = ({
  expectedWorkspaceId,
  actualWorkspaceId,
}: {
  expectedWorkspaceId: string;
  actualWorkspaceId: string;
}) => {
  if (expectedWorkspaceId !== actualWorkspaceId) {
    throw new Error(CROSS_WORKSPACE_WRITE_ERROR);
  }
};

export const addWorkspaceScopeWhere = ({
  workspaceId,
  where,
}: {
  workspaceId: string;
  where: unknown;
}) => {
  const normalizedWorkspaceId = requireWorkspaceId(workspaceId);

  if (!isRecordLike(where) || Object.keys(where).length === 0) {
    return { workspaceId: normalizedWorkspaceId };
  }

  return {
    AND: [where, { workspaceId: normalizedWorkspaceId }],
  };
};

const normalizeWorkspaceWriteData = ({
  workspaceId,
  data,
  stripWorkspaceId = false,
}: {
  workspaceId: string;
  data: unknown;
  stripWorkspaceId?: boolean;
}) => {
  const normalizedWorkspaceId = requireWorkspaceId(workspaceId);
  const nextData = cloneData(data);

  const providedWorkspaceId = "workspaceId" in nextData ? nextData.workspaceId : undefined;

  if (
    providedWorkspaceId !== undefined &&
    providedWorkspaceId !== null &&
    providedWorkspaceId !== normalizedWorkspaceId
  ) {
    throw new Error(CROSS_WORKSPACE_WRITE_ERROR);
  }

  if (stripWorkspaceId) {
    delete nextData.workspaceId;
    return nextData;
  }

  return {
    ...nextData,
    workspaceId: normalizedWorkspaceId,
  };
};

const normalizeWorkspaceCreateManyData = ({
  workspaceId,
  data,
}: {
  workspaceId: string;
  data: unknown;
}) => {
  if (Array.isArray(data)) {
    return data.map((entry) =>
      normalizeWorkspaceWriteData({
        workspaceId,
        data: entry,
      }),
    );
  }

  return normalizeWorkspaceWriteData({
    workspaceId,
    data,
  });
};

const normalizeWorkspaceUpdateData = ({
  workspaceId,
  data,
}: {
  workspaceId: string;
  data: unknown;
}) => {
  return normalizeWorkspaceWriteData({
    workspaceId,
    data,
    stripWorkspaceId: true,
  });
};

const normalizeWorkspaceScopedArgs = ({
  workspaceId,
  args,
  scopeWhere = false,
  normalizeData,
}: {
  workspaceId: string;
  args: unknown;
  scopeWhere?: boolean;
  normalizeData?: (payload: { workspaceId: string; data: unknown }) => unknown;
}) => {
  const nextArgs = cloneArgs(args);

  if (scopeWhere) {
    nextArgs.where = addWorkspaceScopeWhere({
      workspaceId,
      where: nextArgs.where,
    });
  }

  if (normalizeData) {
    nextArgs.data = normalizeData({
      workspaceId,
      data: nextArgs.data,
    });
  }

  return nextArgs;
};

export const normalizeWorkspaceScopedReadArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) =>
  normalizeWorkspaceScopedArgs({
    workspaceId,
    args,
    scopeWhere: true,
  });

export const normalizeWorkspaceScopedCreateArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) =>
  normalizeWorkspaceScopedArgs({
    workspaceId,
    args,
    normalizeData: normalizeWorkspaceWriteData,
  });

export const normalizeWorkspaceScopedCreateManyArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) =>
  normalizeWorkspaceScopedArgs({
    workspaceId,
    args,
    normalizeData: ({ workspaceId: nextWorkspaceId, data }) =>
      normalizeWorkspaceCreateManyData({
        workspaceId: nextWorkspaceId,
        data,
      }),
  });

export const normalizeWorkspaceScopedUpdateManyArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) =>
  normalizeWorkspaceScopedArgs({
    workspaceId,
    args,
    scopeWhere: true,
    normalizeData: normalizeWorkspaceUpdateData,
  });

const createUnsupportedWorkspaceMutationHandler = (message: string) => () => {
  throw new Error(message);
};

const resolveReadOperationHandler = ({
  property,
  target,
  receiver,
  value,
  workspaceId,
}: {
  property: string;
  target: object;
  receiver: object;
  value: UnknownFn;
  workspaceId: string;
}) => {
  if (property === "findUnique" || property === "findUniqueOrThrow") {
    return createUniqueReadOperationHandler({
      target,
      receiver,
      methodName: UNIQUE_READ_OPERATION_MAP[property],
      errorMessage: `Workspace scope proxy requires a ${UNIQUE_READ_OPERATION_MAP[property]}() delegate method.`,
      normalizeArgs: (args) =>
        normalizeWorkspaceScopedReadArgs({
          workspaceId,
          args,
        }),
    });
  }

  if (WORKSPACE_SCOPED_READ_OPERATION_SET.has(property)) {
    return createReadOperationHandler({
      method: value,
      target,
      normalizeArgs: (args) =>
        normalizeWorkspaceScopedReadArgs({
          workspaceId,
          args,
        }),
    });
  }

  return null;
};

const resolveWriteOperationHandler = ({
  property,
  target,
  receiver,
  workspaceId,
}: {
  property: string;
  target: object;
  receiver: object;
  workspaceId: string;
}) => {
  const bulkMutationNormalizers = {
    create: normalizeWorkspaceScopedCreateArgs,
    createMany: normalizeWorkspaceScopedCreateManyArgs,
    updateMany: normalizeWorkspaceScopedUpdateManyArgs,
    deleteMany: normalizeWorkspaceScopedUpdateManyArgs,
  } as const;

  if (property in bulkMutationNormalizers) {
    const normalizeArgs = bulkMutationNormalizers[property as keyof typeof bulkMutationNormalizers];

    return createMutationOperationHandler({
      target,
      receiver,
      methodName: property,
      errorMessage: `Workspace scope proxy requires a ${property}() delegate method.`,
      normalizeArgs: (args) =>
        normalizeArgs({
          workspaceId,
          args,
        }),
    });
  }

  if (property === "update" || property === "delete") {
    return createUnsupportedWorkspaceMutationHandler(
      UNSUPPORTED_WORKSPACE_UNIQUE_MUTATION_ERROR,
    );
  }

  if (property === "upsert") {
    return createUnsupportedWorkspaceMutationHandler(
      UNSUPPORTED_WORKSPACE_UPSERT_ERROR,
    );
  }

  return null;
};

const resolveDelegateProperty = ({
  property,
  value,
  target,
  receiver,
  workspaceId,
}: {
  property: string;
  value: unknown;
  target: object;
  receiver: object;
  workspaceId: string;
}) => {
  if (!isCallable(value)) {
    return value;
  }

  const readOperationHandler = resolveReadOperationHandler({
    property,
    target,
    receiver,
    value,
    workspaceId,
  });
  if (readOperationHandler) {
    return readOperationHandler;
  }

  const writeOperationHandler = resolveWriteOperationHandler({
    property,
    target,
    receiver,
    workspaceId,
  });
  if (writeOperationHandler) {
    return writeOperationHandler;
  }

  return createPassthroughHandler({
    method: value,
    target,
  });
};

const shouldWrapWorkspaceScopedDelegate = (property: string | symbol, value: unknown) =>
  typeof property === "string" && WORKSPACE_SCOPED_MODEL_SET.has(property) && isRecordLike(value);

export const createWorkspaceScopedDelegateProxy = <TDelegate extends object>(
  delegate: TDelegate,
  workspaceId: string,
) =>
  new Proxy(delegate, {
    get(target, property, receiver) {
      if (typeof property !== "string") {
        return Reflect.get(target, property, receiver);
      }

      return resolveDelegateProperty({
        property,
        value: Reflect.get(target, property, receiver),
        target,
        receiver,
        workspaceId,
      });
    },
  });

export const createWorkspaceScopedPrismaClient = <TClient extends object>(
  client: TClient,
  workspaceId: string,
) => {
  const normalizedWorkspaceId = requireWorkspaceId(workspaceId);

  return new Proxy(client, {
    get(target, property, receiver) {
      if (typeof property === "string" && WORKSPACE_SCOPED_CLIENT_CONTROL_SET.has(property)) {
        const control = Reflect.get(target, property, receiver);
        if (isCallable(control)) {
          return () =>
            createWorkspaceScopedPrismaClient(
              Reflect.apply(control, target, []) as TClient,
              normalizedWorkspaceId,
            );
        }
      }

      const value = Reflect.get(target, property, receiver);
      if (shouldWrapWorkspaceScopedDelegate(property, value)) {
        return createWorkspaceScopedDelegateProxy(value as object, normalizedWorkspaceId);
      }

      return value;
    },
  });
};
