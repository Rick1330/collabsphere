export const SOFT_DELETE_MODELS = [
  "User",
  "Workspace",
  "WorkspaceMember",
  "Invitation",
  "Folder",
  "Document",
  "TaskColumn",
  "Task",
  "TaskDocumentLink",
  "CommentThread",
  "Comment",
  "Notification",
  "ExportJob",
  "File",
  "Attachment",
] as const;

export const SOFT_DELETE_READ_OPERATIONS = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
] as const;

export const SOFT_DELETE_DELEGATE_KEYS = SOFT_DELETE_MODELS.map((modelName) =>
  modelName[0].toLowerCase() + modelName.slice(1),
);

type RecordLike = Record<string | symbol, unknown>;
type UnknownFn = (...args: unknown[]) => unknown;

export type SoftDeleteProxyOptions = {
  includeDeleted?: boolean;
  allowHardDelete?: boolean;
  now?: () => Date;
};

export type SoftDeleteClientControls<TClient extends object = object> = {
  $withDeleted(): TClient & SoftDeleteClientControls<TClient>;
  $withHardDeletes(): TClient & SoftDeleteClientControls<TClient>;
};

const SOFT_DELETE_MODEL_SET = new Set<string>(SOFT_DELETE_DELEGATE_KEYS);
const SOFT_DELETE_READ_OPERATION_SET = new Set<string>(SOFT_DELETE_READ_OPERATIONS);
const UNIQUE_READ_OPERATION_MAP = {
  findUnique: "findFirst",
  findUniqueOrThrow: "findFirstOrThrow",
} as const;

const isRecordLike = (value: unknown): value is RecordLike =>
  typeof value === "object" && value !== null;

const isCallable = (value: unknown): value is UnknownFn =>
  typeof value === "function";

const cloneArgs = (args: unknown): Record<string, unknown> => {
  if (!isRecordLike(args)) {
    return {};
  }

  return { ...(args as Record<string, unknown>) };
};

const cloneData = (value: unknown) => {
  if (!isRecordLike(value)) {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
};

export const addDefaultSoftDeleteWhere = ({
  where,
  includeDeleted = false,
}: {
  where: unknown;
  includeDeleted?: boolean;
}) => {
  if (includeDeleted) {
    return where;
  }

  if (!isRecordLike(where) || Object.keys(where).length === 0) {
    return { deletedAt: null };
  }

  if ("deletedAt" in where) {
    return where;
  }

  return {
    AND: [where, { deletedAt: null }],
  };
};

export const normalizeSoftDeleteReadArgs = ({
  args,
  includeDeleted = false,
}: {
  args: unknown;
  includeDeleted?: boolean;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.where = addDefaultSoftDeleteWhere({
    where: nextArgs.where,
    includeDeleted,
  });

  return nextArgs;
};

const createSoftDeleteMutationData = ({
  args,
  now = () => new Date(),
}: {
  args: Record<string, unknown>;
  now?: () => Date;
}) => ({
  ...cloneData(args.data),
  deletedAt: now(),
});

const normalizeSoftDeleteWriteArgs = ({
  args,
  now = () => new Date(),
  where,
}: {
  args: unknown;
  now?: () => Date;
  where?: unknown;
}) => {
  const nextArgs = cloneArgs(args);

  if (where !== undefined) {
    nextArgs.where = where;
  }

  nextArgs.data = createSoftDeleteMutationData({
    args: nextArgs,
    now,
  });

  return nextArgs;
};

export const normalizeSoftDeleteDeleteArgs = ({
  args,
  now = () => new Date(),
}: {
  args: unknown;
  now?: () => Date;
}) =>
  normalizeSoftDeleteWriteArgs({
    args,
    now,
  });

export const normalizeSoftDeleteDeleteManyArgs = ({
  args,
  now = () => new Date(),
}: {
  args: unknown;
  now?: () => Date;
}) =>
  normalizeSoftDeleteWriteArgs({
    args,
    now,
    where: addDefaultSoftDeleteWhere({
      where: cloneArgs(args).where,
    }),
  });

const createReadOperationHandler = ({
  method,
  target,
  includeDeleted,
}: {
  method: (...args: unknown[]) => unknown;
  target: object;
  includeDeleted?: boolean;
}) =>
  (args?: unknown) =>
    Reflect.apply(method, target, [
      normalizeSoftDeleteReadArgs({
        args,
        includeDeleted,
      }),
    ]);

const resolveRequiredDelegateMethod = ({
  target,
  receiver,
  methodName,
  errorMessage,
}: {
  target: object;
  receiver: object;
  methodName: string;
  errorMessage: string;
}) => {
  const delegateMethod = Reflect.get(target, methodName, receiver);
  if (!isCallable(delegateMethod)) {
    throw new Error(errorMessage);
  }

  return delegateMethod;
};

const createUniqueReadOperationHandler = ({
  target,
  receiver,
  methodName,
  includeDeleted,
}: {
  target: object;
  receiver: object;
  methodName: "findFirst" | "findFirstOrThrow";
  includeDeleted?: boolean;
}) =>
  (args?: unknown) =>
    Reflect.apply(
      resolveRequiredDelegateMethod({
        target,
        receiver,
        methodName,
        errorMessage: `Soft delete proxy requires a ${methodName}() delegate method.`,
      }),
      target,
      [
        normalizeSoftDeleteReadArgs({
          args,
          includeDeleted,
        }),
      ],
    );

const createMutationOperationHandler = ({
  target,
  receiver,
  methodName,
  errorMessage,
  normalizeArgs,
}: {
  target: object;
  receiver: object;
  methodName: "update" | "updateMany";
  errorMessage: string;
  normalizeArgs: (args: unknown) => Record<string, unknown>;
}) =>
  (args?: unknown) =>
    Reflect.apply(
      resolveRequiredDelegateMethod({
        target,
        receiver,
        methodName,
        errorMessage,
      }),
      target,
      [normalizeArgs(args)],
    );

const createPassthroughHandler = ({
  method,
  target,
}: {
  method: (...args: unknown[]) => unknown;
  target: object;
}) =>
  (...args: unknown[]) =>
    Reflect.apply(method, target, args);

const resolveReadOperationHandler = ({
  property,
  target,
  receiver,
  value,
  options,
}: {
  property: string;
  target: object;
  receiver: object;
  value: UnknownFn;
  options: SoftDeleteProxyOptions;
}) => {
  if (property === "findUnique" || property === "findUniqueOrThrow") {
    return createUniqueReadOperationHandler({
      target,
      receiver,
      methodName: UNIQUE_READ_OPERATION_MAP[property],
      includeDeleted: options.includeDeleted,
    });
  }

  if (SOFT_DELETE_READ_OPERATION_SET.has(property)) {
    return createReadOperationHandler({
      method: value,
      target,
      includeDeleted: options.includeDeleted,
    });
  }

  return null;
};

const resolveWriteOperationHandler = ({
  property,
  target,
  receiver,
  options,
}: {
  property: string;
  target: object;
  receiver: object;
  options: SoftDeleteProxyOptions;
}) => {
  if (property === "delete" && !options.allowHardDelete) {
    return createMutationOperationHandler({
      target,
      receiver,
      methodName: "update",
      errorMessage: "Soft delete proxy requires an update() delegate method.",
      normalizeArgs: (args) =>
        normalizeSoftDeleteDeleteArgs({
          args,
          now: options.now,
        }),
    });
  }

  if (property === "deleteMany" && !options.allowHardDelete) {
    return createMutationOperationHandler({
      target,
      receiver,
      methodName: "updateMany",
      errorMessage: "Soft delete proxy requires an updateMany() delegate method.",
      normalizeArgs: (args) =>
        normalizeSoftDeleteDeleteManyArgs({
          args,
          now: options.now,
        }),
    });
  }

  return null;
};

const resolveDelegateProperty = ({
  property,
  value,
  target,
  receiver,
  options,
}: {
  property: string;
  value: unknown;
  target: object;
  receiver: object;
  options: SoftDeleteProxyOptions;
}) => {
  if (!isCallable(value)) {
    return value;
  }

  const readOperationHandler = resolveReadOperationHandler({
    property,
    target,
    receiver,
    value,
    options,
  });
  if (readOperationHandler) {
    return readOperationHandler;
  }

  const writeOperationHandler = resolveWriteOperationHandler({
    property,
    target,
    receiver,
    options,
  });
  if (writeOperationHandler) {
    return writeOperationHandler;
  }

  return createPassthroughHandler({
    method: value,
    target,
  });
};

const resolveClientControl = ({
  target,
  property,
  options,
}: {
  target: object;
  property: string | symbol;
  options: SoftDeleteProxyOptions;
}) => {
  if (property === "$withDeleted") {
    return () =>
      createSoftDeletePrismaClient(target, {
        ...options,
        includeDeleted: true,
      });
  }

  if (property === "$withHardDeletes") {
    return () =>
      createSoftDeletePrismaClient(target, {
        ...options,
        allowHardDelete: true,
        includeDeleted: true,
      });
  }

  return null;
};

const shouldWrapSoftDeleteDelegate = (property: string | symbol, value: unknown) =>
  typeof property === "string" && SOFT_DELETE_MODEL_SET.has(property) && isRecordLike(value);

export const createSoftDeleteDelegateProxy = <TDelegate extends object>(
  delegate: TDelegate,
  options: SoftDeleteProxyOptions = {},
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
        options,
      });
    },
  });

export const createSoftDeletePrismaClient = <TClient extends object>(
  client: TClient,
  options: SoftDeleteProxyOptions = {},
) =>
  new Proxy(client, {
    get(target, property, receiver) {
      const clientControl = resolveClientControl({
        target,
        property,
        options,
      });
      if (clientControl) {
        return clientControl;
      }

      const value = Reflect.get(target, property, receiver);
      if (shouldWrapSoftDeleteDelegate(property, value)) {
        return createSoftDeleteDelegateProxy(value as object, options);
      }

      return value;
    },
  }) as TClient & SoftDeleteClientControls<TClient>;
