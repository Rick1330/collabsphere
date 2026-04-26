import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type AuthDomainEventName =
  | "user.registered"
  | "user.verification_sent"
  | "user.email_verified";

export type AuthDomainEvent = {
  eventId: string;
  name: AuthDomainEventName;
  occurredAt: string;
  actor: {
    userId: string;
    workspaceId: null;
  };
  data: Record<string, unknown>;
};

export const defaultAuthEventsFilePath = () => path.resolve(process.cwd(), ".tmp", "domain-events.ndjson");

export const defaultAuthEventsDeadLetterFilePath = () =>
  path.resolve(process.cwd(), ".tmp", "domain-events.dlq.ndjson");

const appendJsonLine = async ({
  filePath,
  payload,
}: {
  filePath: string;
  payload: unknown;
}) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
};

export const appendAuthDomainEvent = async ({
  event,
  eventsFilePath = defaultAuthEventsFilePath(),
}: {
  event: AuthDomainEvent;
  eventsFilePath?: string;
}) =>
  appendJsonLine({
    filePath: eventsFilePath,
    payload: event,
  });

export const appendAuthDomainEventDeadLetter = async ({
  event,
  deadLetterFilePath = defaultAuthEventsDeadLetterFilePath(),
}: {
  event: AuthDomainEvent;
  deadLetterFilePath?: string;
}) =>
  appendJsonLine({
    filePath: deadLetterFilePath,
    payload: event,
  });
