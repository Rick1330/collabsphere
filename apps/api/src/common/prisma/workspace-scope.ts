import {
  cloneArgs,
  createMutationOperationHandler,
  createPassthroughHandler,
  createReadOperationHandler,
  createUniqueReadOperationHandler,
  isCallable,
  isRecordLike,
  resolveRequiredDelegateMethod,
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

const normalizeWorkspaceCreateData = ({
  workspaceId,
  data,
}: {
  workspaceId: string;
  data: unknown;
}) => {
  const normalizedWorkspaceId = requireWorkspaceId(workspaceId);
  const nextData = cloneData(data);

  if ("workspaceId" in nextData && nextData.workspaceId !== normalizedWorkspaceId) {
    throw new Error(CROSS_WORKSPACE_WRITE_ERROR);
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
      normalizeWorkspaceCreateData({
        workspaceId,
        data: entry,
      }),
    );
  }

  return normalizeWorkspaceCreateData({
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
  const normalizedWorkspaceId = requireWorkspaceId(workspaceId);
  const nextData = cloneData(data);

  if ("workspaceId" in nextData && nextData.workspaceId !== normalizedWorkspaceId) {
    throw new Error(CROSS_WORKSPACE_WRITE_ERROR);
  }

  return nextData;
};

export const normalizeWorkspaceScopedReadArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.where = addWorkspaceScopeWhere({
    workspaceId,
    where: nextArgs.where,
  });

  return nextArgs;
};

export const normalizeWorkspaceScopedCreateArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.data = normalizeWorkspaceCreateData({
    workspaceId,
    data: nextArgs.data,
  });

  return nextArgs;
};

export const normalizeWorkspaceScopedCreateManyArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.data = normalizeWorkspaceCreateManyData({
    workspaceId,
    data: nextArgs.data,
  });

  return nextArgs;
};

export const normalizeWorkspaceScopedUpdateManyArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.where = addWorkspaceScopeWhere({
    workspaceId,
    where: nextArgs.where,
  });
  if ("data" in nextArgs) {
    nextArgs.data = normalizeWorkspaceUpdateData({
      workspaceId,
      data: nextArgs.data,
    });
  }

  return nextArgs;
};

const normalizeWorkspaceScopedUpdateArgs = ({
  workspaceId,
  args,
}: {
  workspaceId: string;
  args: unknown;
}) => {
  const nextArgs = cloneArgs(args);

  if ("data" in nextArgs) {
    nextArgs.data = normalizeWorkspaceUpdateData({
      workspaceId,
      data: nextArgs.data,
    });
  }

  return nextArgs;
};

const createGuardedUniqueMutationHandler = ({
  property,
  target,
  receiver,
  workspaceId,
  normalizeArgs,
}: {
  property: "update" | "delete";
  target: object;
  receiver: object;
  workspaceId: string;
  normalizeArgs: (args: unknown) => Record<string, unknown>;
}) =>
  async (args?: unknown) => {
    const nextArgs = cloneArgs(args);
    const findFirst = resolveRequiredDelegateMethod({
      target,
      receiver,
      methodName: "findFirst",
      errorMessage: "Workspace scope proxy requires a findFirst() delegate method for unique mutations.",
    });

    const record = await Reflect.apply(findFirst, target, [
      {
        where: addWorkspaceScopeWhere({
          workspaceId,
          where: nextArgs.where,
        }),
        select: { id: true },
      },
    ]);

    if (!record) {
      throw new Error(
        `Workspace-scoped ${property}() did not match an active record in workspace ${requireWorkspaceId(workspaceId)}.`,
      );
    }

    return Reflect.apply(
      resolveRequiredDelegateMethod({
        target,
        receiver,
        methodName: property,
        errorMessage: `Workspace scope proxy requires a ${property}() delegate method.`,
      }),
      target,
      [normalizeArgs(nextArgs)],
    );
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
    return createGuardedUniqueMutationHandler({
      property,
      target,
      receiver,
      workspaceId,
      normalizeArgs: (args) =>
        normalizeWorkspaceScopedUpdateArgs({
          workspaceId,
          args,
        }),
    });
  }

  if (property === "upsert") {
    return () => {
      throw new Error(UNSUPPORTED_WORKSPACE_UPSERT_ERROR);
    };
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
