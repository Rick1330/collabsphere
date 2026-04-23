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

export const normalizeSoftDeleteDeleteArgs = ({
  args,
  now = () => new Date(),
}: {
  args: unknown;
  now?: () => Date;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.data = {
    ...cloneData(nextArgs.data),
    deletedAt: now(),
  };

  return nextArgs;
};

export const normalizeSoftDeleteDeleteManyArgs = ({
  args,
  includeDeleted = false,
  now = () => new Date(),
}: {
  args: unknown;
  includeDeleted?: boolean;
  now?: () => Date;
}) => {
  const nextArgs = cloneArgs(args);

  nextArgs.where = addDefaultSoftDeleteWhere({
    where: nextArgs.where,
    includeDeleted,
  });
  nextArgs.data = {
    deletedAt: now(),
  };

  return nextArgs;
};

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
  methodName: "update" | "updateMany";
  errorMessage: string;
}) => {
  const delegateMethod = Reflect.get(target, methodName, receiver);
  if (typeof delegateMethod !== "function") {
    throw new Error(errorMessage);
  }

  return delegateMethod as (...args: unknown[]) => unknown;
};

const createDeleteOperationHandler = ({
  target,
  receiver,
  now,
}: {
  target: object;
  receiver: object;
  now?: () => Date;
}) =>
  (args?: unknown) =>
    Reflect.apply(
      resolveRequiredDelegateMethod({
        target,
        receiver,
        methodName: "update",
        errorMessage: "Soft delete proxy requires an update() delegate method.",
      }),
      target,
      [
        normalizeSoftDeleteDeleteArgs({
          args,
          now,
        }),
      ],
    );

const createDeleteManyOperationHandler = ({
  target,
  receiver,
  includeDeleted,
  now,
}: {
  target: object;
  receiver: object;
  includeDeleted?: boolean;
  now?: () => Date;
}) =>
  (args?: unknown) =>
    Reflect.apply(
      resolveRequiredDelegateMethod({
        target,
        receiver,
        methodName: "updateMany",
        errorMessage: "Soft delete proxy requires an updateMany() delegate method.",
      }),
      target,
      [
        normalizeSoftDeleteDeleteManyArgs({
          args,
          includeDeleted,
          now,
        }),
      ],
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

  if (SOFT_DELETE_READ_OPERATION_SET.has(property)) {
    return createReadOperationHandler({
      method: value,
      target,
      includeDeleted: options.includeDeleted,
    });
  }

  if (property === "delete" && !options.allowHardDelete) {
    return createDeleteOperationHandler({
      target,
      receiver,
      now: options.now,
    });
  }

  if (property === "deleteMany" && !options.allowHardDelete) {
    return createDeleteManyOperationHandler({
      target,
      receiver,
      includeDeleted: options.includeDeleted,
      now: options.now,
    });
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
