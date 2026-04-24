import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { RequestContext } from "../request-context.js";

const ulidAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const requestIdHeaderName = "x-request-id";
const forwardedForHeaderName = "x-forwarded-for";
const userAgentHeaderName = "user-agent";
const maxIncomingRequestIdLength = 128;
const validIncomingRequestIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

const encodeBase32 = (value: bigint, length: number) => {
  let remaining = value;
  let encoded = "";

  for (let index = 0; index < length; index += 1) {
    const alphabetIndex = Number(remaining & 31n);
    encoded = `${ulidAlphabet[alphabetIndex]}${encoded}`;
    remaining >>= 5n;
  }

  return encoded;
};

const createUlid = () => {
  const timestamp = BigInt(Date.now());
  const randomnessBytes = randomBytes(10);
  let randomness = 0n;

  for (const byte of randomnessBytes) {
    randomness = (randomness << 8n) | BigInt(byte);
  }

  return `${encodeBase32(timestamp, 10)}${encodeBase32(randomness, 16)}`;
};

const normalizeHeaderValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === "string" ? value : undefined;
};

const normalizePath = (value: string | undefined) => {
  if (!value || value.trim().length === 0) {
    return "/";
  }

  try {
    const parsed = new URL(value, "http://bootstrap");
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
};

const normalizeForwardedFor = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const firstAddress = value.split(",")[0]?.trim();
  return firstAddress && firstAddress.length > 0 ? firstAddress : undefined;
};

export const isValidIncomingRequestId = (value: string | undefined): value is string => {
  if (!value) {
    return false;
  }

  return (
    value.length <= maxIncomingRequestIdLength && validIncomingRequestIdPattern.test(value)
  );
};

export const createRequestId = () => `req_${createUlid()}`;

export const resolveRequestId = (headerValue: string | undefined) =>
  isValidIncomingRequestId(headerValue) ? headerValue : createRequestId();

export const initializeRequestContext = (
  request: IncomingMessage,
  response: ServerResponse,
): RequestContext => {
  const requestId = resolveRequestId(normalizeHeaderValue(request.headers[requestIdHeaderName]));
  const forwardedFor = normalizeForwardedFor(
    normalizeHeaderValue(request.headers[forwardedForHeaderName]),
  );
  const userAgent = normalizeHeaderValue(request.headers[userAgentHeaderName]) ?? "unknown";
  const ip = forwardedFor ?? request.socket.remoteAddress ?? "unknown";

  response.setHeader(requestIdHeaderName, requestId);

  return {
    requestId,
    method: request.method ?? "GET",
    path: normalizePath(request.url),
    ip,
    userAgent,
  };
};
