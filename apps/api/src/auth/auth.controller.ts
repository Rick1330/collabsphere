import type { IncomingMessage } from "node:http";
import { AppError, ValidationAppError } from "../common/filters/app-error.filter.js";
import { getRequestContext } from "../common/request-context.js";
import type { RegisterService } from "./auth.service.js";
import { mapRegisterPersistenceError } from "./auth.service.js";
import { validateRegisterInput } from "./register.dto.js";

const maxRegisterBodyBytes = 32 * 1024;

const readJsonBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bufferChunk.byteLength;

    if (totalBytes > maxRegisterBodyBytes) {
      throw new ValidationAppError({
        issues: [
          {
            field: "body",
            message: "Request body is too large",
            rule: "maxSize",
          },
        ],
      });
    }

    chunks.push(bufferChunk);
  }

  const bodyText = Buffer.concat(chunks).toString("utf8").trim();

  if (!bodyText) {
    throw new ValidationAppError({
      issues: [
        {
          field: "body",
          message: "Request body is required",
          rule: "isNotEmpty",
        },
      ],
    });
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch (error) {
    throw new AppError({
      code: "INVALID_JSON",
      message: "Malformed JSON request body",
      cause: error,
    });
  }
};

export const createAuthController = ({ registerService }: { registerService: RegisterService }) => ({
  register: async ({ request }: { request: IncomingMessage }) => {
    const contentType = request.headers["content-type"];
    const mediaType = typeof contentType === "string" ? contentType.split(";")[0]?.trim().toLowerCase() : null;

    if (mediaType !== "application/json") {
      throw new ValidationAppError({
        issues: [
          {
            field: "content-type",
            message: "Content-Type must be application/json",
            rule: "isMimeType",
          },
        ],
      });
    }

    const rawPayload = await readJsonBody(request);
    const payload = validateRegisterInput(rawPayload);

    try {
      return await registerService.register({
        payload,
        ipAddress: getRequestContext()?.ip ?? request.socket.remoteAddress ?? "unknown",
        userAgent:
          getRequestContext()?.userAgent ??
          (typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : "unknown"),
      });
    } catch (error) {
      throw mapRegisterPersistenceError(error);
    }
  },
});
