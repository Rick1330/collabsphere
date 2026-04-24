import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T =>
  requestContextStorage.run(context, callback);

export const getRequestContext = () => requestContextStorage.getStore();

export const getRequestId = () => requestContextStorage.getStore()?.requestId;
