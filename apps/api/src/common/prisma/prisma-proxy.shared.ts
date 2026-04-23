export type RecordLike = Record<string | symbol, unknown>;
export type UnknownFn = (...args: unknown[]) => unknown;

export const isRecordLike = (value: unknown): value is RecordLike =>
  typeof value === "object" && value !== null;

export const isCallable = (value: unknown): value is UnknownFn =>
  typeof value === "function";

export const cloneArgs = (args: unknown): Record<string, unknown> => {
  if (!isRecordLike(args)) {
    return {};
  }

  return { ...(args as Record<string, unknown>) };
};

export const resolveRequiredDelegateMethod = ({
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

export const createPassthroughHandler = ({
  method,
  target,
}: {
  method: (...args: unknown[]) => unknown;
  target: object;
}) =>
  (...args: unknown[]) =>
    Reflect.apply(method, target, args);

export const createReadOperationHandler = ({
  method,
  target,
  normalizeArgs,
}: {
  method: (...args: unknown[]) => unknown;
  target: object;
  normalizeArgs: (args: unknown) => Record<string, unknown>;
}) =>
  (args?: unknown) =>
    Reflect.apply(method, target, [normalizeArgs(args)]);

export const createUniqueReadOperationHandler = ({
  target,
  receiver,
  methodName,
  errorMessage,
  normalizeArgs,
}: {
  target: object;
  receiver: object;
  methodName: string;
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

export const createMutationOperationHandler = ({
  target,
  receiver,
  methodName,
  errorMessage,
  normalizeArgs,
}: {
  target: object;
  receiver: object;
  methodName: string;
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
