import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type AuthDomainEvent = {
  eventId: string;
  name: "user.registered" | "user.verification_sent";
  occurredAt: string;
  actor: {
    userId: string;
    workspaceId: null;
  };
  data: Record<string, unknown>;
};

const defaultEventsFilePath = () => path.resolve(process.cwd(), ".tmp", "domain-events.ndjson");

export const appendAuthDomainEvent = async ({
  event,
  eventsFilePath = defaultEventsFilePath(),
}: {
  event: AuthDomainEvent;
  eventsFilePath?: string;
}) => {
  await mkdir(path.dirname(eventsFilePath), { recursive: true });
  await appendFile(eventsFilePath, `${JSON.stringify(event)}\n`, "utf8");
};
