export type ResponsePaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ResponseMeta = {
  requestId: string;
  pagination?: ResponsePaginationMeta;
};

type ActionResponseExtraData = Record<string, unknown> & {
  message?: never;
};

export type SingleResourceEnvelope<TResource> = {
  data: {
    resource: TResource;
  };
  meta: ResponseMeta;
};

export type ListResponseEnvelope<TItem> = {
  data: {
    items: TItem[];
    total: number;
  };
  meta: ResponseMeta;
};

export type ActionResponseEnvelope<
  TExtra extends ActionResponseExtraData = Record<string, never>,
> = {
  data: {
    message: string;
  } & TExtra;
  meta: ResponseMeta;
};

const createResponseMeta = ({
  requestId,
  pagination,
}: {
  requestId: string;
  pagination?: ResponsePaginationMeta;
}): ResponseMeta => {
  if (!pagination) {
    return { requestId };
  }

  return {
    requestId,
    pagination,
  };
};

export const createSingleResourceEnvelope = <TResource>({
  resource,
  requestId,
}: {
  resource: TResource;
  requestId: string;
}): SingleResourceEnvelope<TResource> => ({
  data: {
    resource,
  },
  meta: createResponseMeta({
    requestId,
  }),
});

export const createListResponseEnvelope = <TItem>({
  items,
  total,
  requestId,
  pagination,
}: {
  items: TItem[];
  total: number;
  requestId: string;
  pagination?: ResponsePaginationMeta;
}): ListResponseEnvelope<TItem> => ({
  data: {
    items,
    total,
  },
  meta: createResponseMeta({
    requestId,
    pagination,
  }),
});

export const createActionResponseEnvelope = <
  TExtra extends ActionResponseExtraData = Record<string, never>,
>({
  message,
  requestId,
  extraData,
}: {
  message: string;
  requestId: string;
  extraData?: TExtra;
}): ActionResponseEnvelope<TExtra> => ({
  data: {
    ...(extraData ?? ({} as TExtra)),
    message,
  },
  meta: createResponseMeta({
    requestId,
  }),
});
