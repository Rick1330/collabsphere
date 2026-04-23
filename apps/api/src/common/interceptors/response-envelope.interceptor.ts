import {
  createActionResponseEnvelope,
  createListResponseEnvelope,
  createSingleResourceEnvelope,
  type ActionResponseEnvelope,
  type ListResponseEnvelope,
  type ResponsePaginationMeta,
  type SingleResourceEnvelope,
} from "../response/response-envelope.js";

export type SingleResourcePayload<TResource> = {
  kind: "single";
  resource: TResource;
};

export type ListResponsePayload<TItem> = {
  kind: "list";
  items: TItem[];
  total: number;
  pagination?: ResponsePaginationMeta;
};

export type ActionResponsePayload<TExtra extends Record<string, unknown> = Record<string, never>> = {
  kind: "action";
  message: string;
  extraData?: TExtra;
};

export type SuccessResponsePayload<TResource = unknown, TItem = unknown> =
  | SingleResourcePayload<TResource>
  | ListResponsePayload<TItem>
  | ActionResponsePayload;

export const createSingleResourcePayload = <TResource>(
  resource: TResource,
): SingleResourcePayload<TResource> => ({
  kind: "single",
  resource,
});

export const createListResponsePayload = <TItem>({
  items,
  total,
  pagination,
}: {
  items: TItem[];
  total: number;
  pagination?: ResponsePaginationMeta;
}): ListResponsePayload<TItem> => ({
  kind: "list",
  items,
  total,
  pagination,
});

export const createActionResponsePayload = <
  TExtra extends Record<string, unknown> = Record<string, never>,
>({
  message,
  extraData,
}: {
  message: string;
  extraData?: TExtra;
}): ActionResponsePayload<TExtra> => ({
  kind: "action",
  message,
  extraData,
});

export const wrapSuccessResponse = ({
  payload,
  requestId,
}: {
  payload: SuccessResponsePayload;
  requestId: string;
}):
  | SingleResourceEnvelope<unknown>
  | ListResponseEnvelope<unknown>
  | ActionResponseEnvelope<Record<string, unknown>> => {
  switch (payload.kind) {
    case "single":
      return createSingleResourceEnvelope({
        resource: payload.resource,
        requestId,
      });
    case "list":
      return createListResponseEnvelope({
        items: payload.items,
        total: payload.total,
        requestId,
        pagination: payload.pagination,
      });
    case "action":
      return createActionResponseEnvelope({
        message: payload.message,
        requestId,
        extraData: payload.extraData,
      });
  }
};
