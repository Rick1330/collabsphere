import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";

/**
 * Creates a minimal IncomingMessage stub suitable for use in unit tests against
 * auth controller methods that read the request body and Content-Type header.
 */
export const createJsonRequest = ({
  body,
  contentType = "application/json",
}: {
  body: unknown;
  contentType?: string;
}): IncomingMessage => {
  const stream = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage & {
    headers: Record<string, string>;
    socket: { remoteAddress: string };
  };

  stream.headers = {
    "content-type": contentType,
  };
  stream.socket = {
    remoteAddress: "203.0.113.30",
  };

  return stream;
};
