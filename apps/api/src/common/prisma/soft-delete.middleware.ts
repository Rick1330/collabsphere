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

export const createSoftDeleteDelegateProxy = <TDelegate extends object>(
  delegate: TDelegate,
  options: SoftDeleteProxyOptions = {},
) =>
  new Proxy(delegate, {
    get(target, property, receiver) {
      if (typeof property !== "string") {
        return Reflect.get(target, property, receiver);
      }

      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") {
        return value;
      }

      if (SOFT_DELETE_READ_OPERATION_SET.has(property)) {
        return (args?: unknown) =>
          Reflect.apply(value, target, [
            normalizeSoftDeleteReadArgs({
              args,
              includeDeleted: options.includeDeleted,
            }),
          ]);
      }

      if (property === "delete" && !options.allowHardDelete) {
        return (args?: unknown) => {
          const update = Reflect.get(target, "update", receiver);
          if (typeof update !== "function") {
            throw new Error("Soft delete proxy requires an update() delegate method.");
          }

          return Reflect.apply(update, target, [
            normalizeSoftDeleteDeleteArgs({
              args,
              now: options.now,
            }),
          ]);
        };
      }

      if (property === "deleteMany" && !options.allowHardDelete) {
        return (args?: unknown) => {
          const updateMany = Reflect.get(target, "updateMany", receiver);
          if (typeof updateMany !== "function") {
            throw new Error("Soft delete proxy requires an updateMany() delegate method.");
          }

          return Reflect.apply(updateMany, target, [
            normalizeSoftDeleteDeleteManyArgs({
              args,
              includeDeleted: options.includeDeleted,
              now: options.now,
            }),
          ]);
        };
      }

      return (...args: unknown[]) => Reflect.apply(value, target, args);
    },
  });

export const createSoftDeletePrismaClient = <TClient extends object>(
  client: TClient,
  options: SoftDeleteProxyOptions = {},
) =>
  new Proxy(client, {
    get(target, property, receiver) {
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

      const value = Reflect.get(target, property, receiver);
      if (typeof property === "string" && SOFT_DELETE_MODEL_SET.has(property) && isRecordLike(value)) {
        return createSoftDeleteDelegateProxy(value, options);
      }

      return value;
    },
  }) as TClient & SoftDeleteClientControls<TClient>;
